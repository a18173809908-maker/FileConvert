import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, generateUniqueInviteCode, getUserByInviteCode } from '@/lib/server/db'
import { hashPassword, getSession, toPublicUser } from '@/lib/server/auth'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email, password, nickname, inviteCode } = await req.json()

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: '请输入有效邮箱' }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 })
    }
    if (!nickname || nickname.length < 1 || nickname.length > 32) {
      return NextResponse.json({ error: '昵称长度 1-32' }, { status: 400 })
    }
    if (getUserByEmail(email)) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
    }

    // 可选邀请人
    let invitedBy: number | undefined
    if (inviteCode && typeof inviteCode === 'string') {
      const inviter = getUserByInviteCode(inviteCode.trim().toLowerCase())
      if (inviter) invitedBy = inviter.id
    }

    const passwordHash = await hashPassword(password)
    const user = createUser({
      email,
      password_hash: passwordHash,
      nickname,
      invite_code: generateUniqueInviteCode(),
      invited_by: invitedBy,
    })

    const session = await getSession()
    session.userId = user.id
    await session.save()

    return NextResponse.json({ user: toPublicUser(user) })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '注册失败' }, { status: 500 })
  }
}
