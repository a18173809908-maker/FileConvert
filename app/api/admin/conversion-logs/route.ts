import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdminUser } from '@/lib/server/auth'
import { getConversionLogs } from '@/lib/server/conversion-logger'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 })
  }

  const level = req.nextUrl.searchParams.get('level') || 'all'
  const q = req.nextUrl.searchParams.get('q') || ''
  const limit = Number(req.nextUrl.searchParams.get('limit') || '100')

  const logs = getConversionLogs({
    level: level === 'info' || level === 'error' ? level : 'all',
    q,
    limit,
  })

  return NextResponse.json(
    { logs, count: logs.length },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
