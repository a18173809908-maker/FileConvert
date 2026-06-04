import { NextRequest, NextResponse } from 'next/server'
import { convertOnServer, canConvertServer } from '@/lib/server/converters'
import { isFormatAllowed, isFileSizeAllowed, getFileExtension } from '@/lib/conversion-config'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    const toFormat = String(form.get('to') || '').toLowerCase()

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
    const { buffer, mimeType } = await convertOnServer(input, fromFormat, toFormat)

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '转换失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
