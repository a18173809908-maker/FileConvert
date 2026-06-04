import 'server-only'
import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

// SQLite 文件位置。生产用 docker volume 挂到 /data
const DB_PATH = process.env.DB_PATH || './data/fileconvert.db'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  if (!existsSync(dirname(DB_PATH))) {
    mkdirSync(dirname(DB_PATH), { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      email           TEXT UNIQUE,
      password_hash   TEXT,
      wechat_openid   TEXT UNIQUE,
      qq_openid       TEXT UNIQUE,
      nickname        TEXT NOT NULL,
      avatar_url      TEXT,
      points          INTEGER NOT NULL DEFAULT 20,
      consecutive_days INTEGER NOT NULL DEFAULT 0,
      last_sign_date  TEXT,
      invite_code     TEXT UNIQUE NOT NULL,
      invited_by      INTEGER REFERENCES users(id),
      created_at      INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_wechat ON users(wechat_openid);
    CREATE INDEX IF NOT EXISTS idx_users_qq ON users(qq_openid);

    CREATE TABLE IF NOT EXISTS points_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      delta       INTEGER NOT NULL,
      balance     INTEGER NOT NULL,
      reason      TEXT NOT NULL,
      metadata    TEXT,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_points_logs_user ON points_logs(user_id, created_at DESC);
  `)
}

// ---------- 类型 ----------

export interface UserRow {
  id: number
  email: string | null
  password_hash: string | null
  wechat_openid: string | null
  qq_openid: string | null
  nickname: string
  avatar_url: string | null
  points: number
  consecutive_days: number
  last_sign_date: string | null
  invite_code: string
  invited_by: number | null
  created_at: number
}

// ---------- 用户 CRUD ----------

export function getUserById(id: number): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
}

export function getUserByEmail(email: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as UserRow | undefined
}

export function getUserByWechat(openid: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE wechat_openid = ?').get(openid) as UserRow | undefined
}

export function getUserByQQ(openid: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE qq_openid = ?').get(openid) as UserRow | undefined
}

export function getUserByInviteCode(code: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE invite_code = ?').get(code) as UserRow | undefined
}

export interface CreateUserParams {
  email?: string
  password_hash?: string
  wechat_openid?: string
  qq_openid?: string
  nickname: string
  avatar_url?: string
  invite_code: string
  invited_by?: number
  initial_points?: number
}

export function createUser(p: CreateUserParams): UserRow {
  const stmt = getDb().prepare(`
    INSERT INTO users (email, password_hash, wechat_openid, qq_openid, nickname, avatar_url, points, invite_code, invited_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const info = stmt.run(
    p.email?.toLowerCase() || null,
    p.password_hash || null,
    p.wechat_openid || null,
    p.qq_openid || null,
    p.nickname,
    p.avatar_url || null,
    p.initial_points ?? 20,
    p.invite_code,
    p.invited_by ?? null,
  )
  return getUserById(Number(info.lastInsertRowid))!
}

// ---------- 积分变动（原子事务） ----------

export interface AddPointsResult {
  newBalance: number
  logId: number
}

export function addPoints(userId: number, delta: number, reason: string, metadata?: object): AddPointsResult {
  return getDb().transaction(() => {
    const user = getUserById(userId)
    if (!user) throw new Error('USER_NOT_FOUND')
    const newBalance = user.points + delta
    if (newBalance < 0) throw new Error('INSUFFICIENT_POINTS')

    getDb().prepare('UPDATE users SET points = ? WHERE id = ?').run(newBalance, userId)
    const info = getDb().prepare(
      'INSERT INTO points_logs (user_id, delta, balance, reason, metadata) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, delta, newBalance, reason, metadata ? JSON.stringify(metadata) : null)

    return { newBalance, logId: Number(info.lastInsertRowid) }
  })()
}

export function updateUserField(userId: number, patch: Partial<Pick<UserRow, 'consecutive_days' | 'last_sign_date' | 'nickname' | 'avatar_url'>>) {
  const keys = Object.keys(patch).filter(k => (patch as Record<string, unknown>)[k] !== undefined)
  if (keys.length === 0) return
  const sets = keys.map(k => `${k} = ?`).join(', ')
  const values = keys.map(k => (patch as Record<string, unknown>)[k])
  getDb().prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...values, userId)
}

// ---------- 邀请码生成 ----------

export function generateInviteCode(): string {
  // 6 位 base36：a-z + 0-9 = 36^6 ≈ 2B 组合
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function generateUniqueInviteCode(): string {
  // 极小概率冲突，重试
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode()
    if (!getUserByInviteCode(code)) return code
  }
  throw new Error('无法生成唯一邀请码')
}
