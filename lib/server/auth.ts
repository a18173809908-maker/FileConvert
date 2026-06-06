import 'server-only'
import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { UserRow, getUserById } from './db'

const scryptAsync = promisify(scrypt)

// ---------- 密码哈希（Node 内置 scrypt，无需外部依赖） ----------

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scryptAsync(plain, salt, 64)) as Buffer
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [algo, saltHex, hashHex] = stored.split('$')
  if (algo !== 'scrypt' || !saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(hashHex, 'hex')
  const derived = (await scryptAsync(plain, salt, expected.length)) as Buffer
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

// ---------- iron-session 配置 ----------

export interface SessionData {
  userId?: number
  // OAuth 跳转中转用
  oauthState?: string
  oauthProvider?: 'wechat' | 'qq'
}

const SECRET = process.env.SESSION_SECRET || 'dev-only-secret-please-change-in-production-32chars-min'
if (process.env.NODE_ENV === 'production' && SECRET.startsWith('dev-only')) {
  console.warn('[auth] 警告：生产环境未设置 SESSION_SECRET，正在使用默认值')
}

export const sessionOptions: SessionOptions = {
  password: SECRET,
  cookieName: 'fc_session',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    // secure 只在显式设置 COOKIE_SECURE=true 时启用（HTTPS 部署时）
    // HTTP 访问下 secure cookie 会被浏览器丢弃，导致 session 失效
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 60 * 60 * 24 * 30, // 30 天
  },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

// ---------- 当前用户 ----------

export async function getCurrentUser(): Promise<UserRow | null> {
  const session = await getSession()
  if (!session.userId) return null
  return getUserById(session.userId) || null
}

// ---------- 公开的用户视图（不返回敏感字段） ----------

export interface PublicUser {
  id: number
  nickname: string
  avatarUrl: string | null
  email: string | null
  hasWechat: boolean
  hasQQ: boolean
  points: number
  consecutiveDays: number
  hasSignedToday: boolean
  inviteCode: string
  isAdmin: boolean
}

export function isAdminUser(u: Pick<UserRow, 'id' | 'email'> | null): boolean {
  if (!u) return false
  const adminIds = new Set(
    (process.env.ADMIN_USER_IDS || '')
      .split(',')
      .map(v => Number(v.trim()))
      .filter(Number.isFinite),
  )
  if (adminIds.has(u.id)) return true

  const email = u.email?.trim().toLowerCase()
  if (!email) return false
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(v => v.trim().toLowerCase())
      .filter(Boolean),
  )
  return adminEmails.has(email)
}

export function toPublicUser(u: UserRow): PublicUser {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id: u.id,
    nickname: u.nickname,
    avatarUrl: u.avatar_url,
    email: u.email,
    hasWechat: !!u.wechat_openid,
    hasQQ: !!u.qq_openid,
    points: u.points,
    consecutiveDays: u.consecutive_days,
    hasSignedToday: u.last_sign_date === today,
    inviteCode: u.invite_code,
    isAdmin: isAdminUser(u),
  }
}
