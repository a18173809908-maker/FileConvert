import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/server/db'
import { verifyPassword, getSession, toPublicUser } from '@/lib/server/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 })
    }

    const user = getUserByEmail(email)
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    const session = await getSession()
    session.userId = user.id
    await session.save()

    return NextResponse.json({ user: toPublicUser(user) })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '登录失败' }, { status: 500 })
  }
}
