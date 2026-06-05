import { NextRequest, NextResponse } from 'next/server'
import { getConversionJob, getConversionJobResult } from '@/lib/server/conversion-jobs'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const download = req.nextUrl.searchParams.get('download') === '1'

  if (download) {
    const result = getConversionJobResult(id)
    if (!result) {
      return NextResponse.json({ error: '转换结果不存在或已过期' }, { status: 404 })
    }
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Length': String(result.buffer.length),
        'Cache-Control': 'no-store',
      },
    })
  }

  const job = getConversionJob(id)
  if (!job) {
    return NextResponse.json({ error: '转换任务不存在或已过期' }, { status: 404 })
  }
  return NextResponse.json({ job }, { headers: { 'Cache-Control': 'no-store' } })
}
