import { NextResponse } from 'next/server'
import { getCurrentUser, toPublicUser } from '@/lib/server/auth'
import { addPoints, updateUserField, getUserById } from '@/lib/server/db'
import { POINTS_CONFIG } from '@/lib/conversion-config'

export const runtime = 'nodejs'

function todayStr() { return new Date().toISOString().slice(0, 10) }
function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const today = todayStr()
  if (user.last_sign_date === today) {
    return NextResponse.json({ error: '今天已签到' }, { status: 409 })
  }

  // 是否连续：昨天签过 → 连续 +1，否则重置为 1
  const newDays = user.last_sign_date === yesterdayStr() ? user.consecutive_days + 1 : 1
  const bonusIdx = Math.min(newDays - 1, POINTS_CONFIG.consecutiveBonus.length - 1)
  const reward = POINTS_CONFIG.dailyLogin + (POINTS_CONFIG.consecutiveBonus[bonusIdx] || 0)

  updateUserField(user.id, { last_sign_date: today, consecutive_days: newDays })
  addPoints(user.id, reward, 'daily_checkin', { consecutive_days: newDays })

  const updated = getUserById(user.id)!
  return NextResponse.json({ user: toPublicUser(updated), reward })
}
