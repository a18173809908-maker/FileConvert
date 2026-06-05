import 'server-only'

// Adobe Key 池：支持多个账号轮换，单 Key 用完自动切下一个

export interface AdobeKey {
  clientId: string
  clientSecret: string
}

interface KeyState {
  /** 1 小时冷却结束时间戳；用完额度后短期内不重试 */
  cooldownUntil: number
}

class AdobeKeyPool {
  private keys: AdobeKey[] = []
  private state = new Map<string, KeyState>()
  private cursor = 0
  private loaded = false

  /** 三种 ENV 格式都兼容：
   * 1. ADOBE_KEYS='[{"id":"x","secret":"y"},...]'（JSON 数组）
   * 2. ADOBE_CLIENT_ID_1 / _SECRET_1, _2, _3 ...（带后缀）
   * 3. ADOBE_CLIENT_ID / ADOBE_CLIENT_SECRET（兼容单 Key 旧配置）
   */
  private load() {
    if (this.loaded) return
    this.loaded = true
    const seen = new Set<string>()

    // 1. JSON 数组
    const jsonStr = process.env.ADOBE_KEYS
    if (jsonStr) {
      try {
        const arr = JSON.parse(jsonStr)
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (item?.id && item?.secret && !seen.has(item.id)) {
              this.keys.push({ clientId: String(item.id), clientSecret: String(item.secret) })
              seen.add(item.id)
            }
          }
        }
      } catch {
        console.warn('[adobe-pool] ADOBE_KEYS 解析失败，忽略')
      }
    }

    // 2. 编号后缀
    for (let i = 1; i <= 20; i++) {
      const id = process.env[`ADOBE_CLIENT_ID_${i}`]
      const secret = process.env[`ADOBE_CLIENT_SECRET_${i}`]
      if (id && secret && !seen.has(id)) {
        this.keys.push({ clientId: id, clientSecret: secret })
        seen.add(id)
      }
    }

    // 3. 兼容老配置
    const legacyId = process.env.ADOBE_CLIENT_ID
    const legacySecret = process.env.ADOBE_CLIENT_SECRET
    if (legacyId && legacySecret && !seen.has(legacyId)) {
      this.keys.push({ clientId: legacyId, clientSecret: legacySecret })
      seen.add(legacyId)
    }

    if (this.keys.length > 0) {
      console.log(`[adobe-pool] 已加载 ${this.keys.length} 个 Adobe Key`)
    }
  }

  size(): number {
    this.load()
    return this.keys.length
  }

  isEmpty(): boolean {
    return this.size() === 0
  }

  /** 选下一个可用 Key（跳过冷却中的）。全部不可用返回 null */
  pick(): AdobeKey | null {
    this.load()
    if (this.keys.length === 0) return null
    const now = Date.now()
    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[(this.cursor + i) % this.keys.length]
      const st = this.state.get(key.clientId)
      if (st && st.cooldownUntil > now) continue
      this.cursor = (this.keys.indexOf(key) + 1) % this.keys.length
      return key
    }
    return null
  }

  /** 标记 Key 额度用完：冷却 1 小时（防止反复浪费一次调用确认超限） */
  markExhausted(clientId: string) {
    this.state.set(clientId, { cooldownUntil: Date.now() + 3600_000 })
  }

  /** 调试用：返回每个 Key 的状态 */
  stats() {
    this.load()
    const now = Date.now()
    return this.keys.map(k => ({
      clientId: `${k.clientId.slice(0, 6)}...${k.clientId.slice(-4)}`,
      cooldownLeftSec: Math.max(0, Math.floor(((this.state.get(k.clientId)?.cooldownUntil ?? 0) - now) / 1000)),
    }))
  }
}

export const adobeKeyPool = new AdobeKeyPool()
