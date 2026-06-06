import { NextRequest, NextResponse } from 'next/server'
import { getConversionJob, getConversionJobResult } from '@/lib/server/conversion-jobs'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const result = getConversionJobResult(id)

  if (!result) {
    const job = getConversionJob(id)
    const error = job
      ? job.status === 'completed'
        ? '转换结果不存在或已过期，请重新转换'
        : '转换结果尚未生成，请稍后再试'
      : '转换任务不存在或已过期'

    return NextResponse.json(
      { error, job },
      { status: job ? 409 : 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type': result.mimeType,
      'Content-Length': String(result.buffer.length),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
