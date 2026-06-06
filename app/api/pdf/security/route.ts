import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, withConcurrencyLimit, semaphoreStats } from '@/lib/server/limiter'
import { getFileExtension } from '@/lib/conversion-config'
import { compressPdf, decryptPdf, encryptPdf } from '@/lib/server/qpdf'
import { logConversionError, logConversionInfo } from '@/lib/server/conversion-logger'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
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
    const action = String(form.get('action') || '').toLowerCase()
    const password = String(form.get('password') || '')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '缺少 PDF 文件' }, { status: 400 })
    }
    if (getFileExtension(file.name) !== 'pdf') {
      return NextResponse.json({ error: '只能处理 PDF 文件' }, { status: 400 })
    }
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF 单个不能超过 100 MB' }, { status: 413 })
    }
    if (action !== 'encrypt' && action !== 'decrypt' && action !== 'compress') {
      return NextResponse.json({ error: '不支持的 PDF 操作' }, { status: 400 })
    }
    if ((action === 'encrypt' || action === 'decrypt') && password.length < 1) {
      return NextResponse.json({ error: '请输入 PDF 密码' }, { status: 400 })
    }

    const input = Buffer.from(await file.arrayBuffer())
    let buffer: Buffer
    try {
      buffer = await withConcurrencyLimit(() => {
        if (action === 'encrypt') return encryptPdf(input, password)
        if (action === 'decrypt') return decryptPdf(input, password)
        return compressPdf(input)
      })
    } catch (err) {
      if (err instanceof Error && err.message === 'SEMAPHORE_TIMEOUT') {
        logConversionError('pdf_security_failed', {
          ip,
          fileName: file.name,
          fileSize: file.size,
          from: 'pdf',
          to: action,
          action,
          durationMs: Date.now() - startedAt,
          status: 503,
        }, err)
        return NextResponse.json(
          { error: '服务繁忙，请稍后重试', stats: semaphoreStats() },
          { status: 503, headers: { 'Retry-After': '5' } },
        )
      }
      throw err
    }

    logConversionInfo('pdf_security_completed', {
      ip,
      fileName: file.name,
      fileSize: file.size,
      from: 'pdf',
      to: action,
      action,
      durationMs: Date.now() - startedAt,
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF 处理失败'
    logConversionError('pdf_security_failed', {
      ip,
      durationMs: Date.now() - startedAt,
      status: 500,
    }, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
