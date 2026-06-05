import { NextRequest, NextResponse } from 'next/server'
import { convertOnServer, canConvertServer, isHeavyConversion } from '@/lib/server/converters'
import { checkRateLimit, getClientIp, withConcurrencyLimit, withHeavyLimit, semaphoreStats } from '@/lib/server/limiter'
import { isFormatAllowed, isFileSizeAllowed, getFileExtension } from '@/lib/conversion-config'
import { createConversionJob } from '@/lib/server/conversion-jobs'
import { logConversionError, logConversionInfo } from '@/lib/server/conversion-logger'

export const runtime = 'nodejs'
export const maxDuration = 180

export async function POST(req: NextRequest) {
  // ---------- 速率限制 ----------
  const ip = getClientIp(req)
  const startedAt = Date.now()
  const rate = checkRateLimit(ip)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  try {
    const form = await req.formData()
    const file = form.get('file')
    const toFormat = String(form.get('to') || '').toLowerCase()
    const mode = String(form.get('mode') || 'async').toLowerCase()

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '缺少文件' }, { status: 400 })
    }
    if (!toFormat) {
      return NextResponse.json({ error: '缺少目标格式' }, { status: 400 })
    }

    const fromFormat = getFileExtension(file.name)
    if (!isFormatAllowed(fromFormat)) {
      return NextResponse.json({ error: `不允许的输入格式: ${fromFormat}` }, { status: 400 })
    }
    if (!isFileSizeAllowed(file.size, fromFormat)) {
      return NextResponse.json({ error: '文件超过大小限制' }, { status: 413 })
    }
    if (!canConvertServer(fromFormat, toFormat)) {
      return NextResponse.json(
        { error: `服务端暂不支持 ${fromFormat.toUpperCase()} → ${toFormat.toUpperCase()}` },
        { status: 422 },
      )
    }

    const input = Buffer.from(await file.arrayBuffer())
    const heavy = isHeavyConversion(fromFormat, toFormat)

    if (mode !== 'sync') {
      const job = createConversionJob({
        input,
        fileName: file.name,
        fileSize: file.size,
        from: fromFormat,
        to: toFormat,
        ip,
        heavy,
      })
      return NextResponse.json(
        { job },
        {
          status: 202,
          headers: {
            'Cache-Control': 'no-store',
            'X-RateLimit-Remaining': String(rate.remaining),
          },
        },
      )
    }

    // ---------- 并发限制（按轻/重分两个独立队列） ----------
    let result
    try {
      result = heavy
        ? await withHeavyLimit(() => convertOnServer(input, fromFormat, toFormat))
        : await withConcurrencyLimit(() => convertOnServer(input, fromFormat, toFormat))
    } catch (err) {
      if (err instanceof Error && err.message === 'SEMAPHORE_TIMEOUT') {
        const stats = semaphoreStats()
        logConversionError('conversion_sync_failed', {
          ip,
          fileName: file.name,
          fileSize: file.size,
          from: fromFormat,
          to: toFormat,
          heavy,
          durationMs: Date.now() - startedAt,
          status: 503,
        }, err)
        return NextResponse.json(
          { error: heavy ? '文档转换繁忙，请稍后重试' : '服务繁忙，请稍后重试', stats },
          { status: 503, headers: { 'Retry-After': heavy ? '10' : '5' } },
        )
      }
      throw err
    }

    const { buffer, mimeType } = result
    logConversionInfo('conversion_sync_completed', {
      ip,
      fileName: file.name,
      fileSize: file.size,
      from: fromFormat,
      to: toFormat,
      heavy,
      durationMs: Date.now() - startedAt,
    })
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '转换失败'
    logConversionError('conversion_request_failed', {
      ip,
      durationMs: Date.now() - startedAt,
      status: 500,
    }, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
