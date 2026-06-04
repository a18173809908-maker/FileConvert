import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server/auth'
import { addPoints } from '@/lib/server/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const { cost, from, to, fileName } = await req.json()
    const c = Number(cost)
    if (!Number.isFinite(c) || c < 0 || c > 100) {
      return NextResponse.json({ error: '无效的积分数' }, { status: 400 })
    }
    if (c === 0) {
      return NextResponse.json({ newBalance: user.points })
    }

    const { newBalance } = addPoints(user.id, -c, 'convert', { from, to, fileName })
    return NextResponse.json({ newBalance })
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_POINTS') {
      return NextResponse.json({ error: '积分不足' }, { status: 402 })
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : '扣分失败' }, { status: 500 })
  }
}
