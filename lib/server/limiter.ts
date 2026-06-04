import 'server-only'

// ============================================================
// 并发信号量：限制同时执行的重活数量
// ============================================================

class Semaphore {
  private current = 0
  private queue: Array<() => void> = []

  constructor(private max: number) {}

  /**
   * 申请一个令牌。如果在 timeoutMs 内拿不到，抛错。
   * 调用方拿到的函数必须在 finally 里执行以释放令牌。
   */
  async acquire(timeoutMs: number): Promise<() => void> {
    if (this.current < this.max) {
      this.current++
      return () => this.release()
    }

    return new Promise<() => void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.indexOf(grant)
        if (idx >= 0) this.queue.splice(idx, 1)
        reject(new Error('SEMAPHORE_TIMEOUT'))
      }, timeoutMs)

      const grant = () => {
        clearTimeout(timer)
        this.current++
        resolve(() => this.release())
      }
      this.queue.push(grant)
    })
  }

  private release() {
    this.current--
    const next = this.queue.shift()
    if (next) next()
  }

  stats() {
    return { running: this.current, waiting: this.queue.length, max: this.max }
  }
}

// 转换并发：2C4G，sharp/pdfjs/pdf-lib 都吃 CPU，2 并发匹配 CPU 核数
const CONCURRENCY = Number(process.env.CONVERT_CONCURRENCY ?? '2')
// 队列等待最长时间
const ACQUIRE_TIMEOUT_MS = Number(process.env.CONVERT_ACQUIRE_TIMEOUT_MS ?? '15000')

const semaphore = new Semaphore(CONCURRENCY)

export function semaphoreStats() {
  return semaphore.stats()
}

/**
 * 包装一段重活，自动 acquire/release。
 * 拿不到令牌时抛 SEMAPHORE_TIMEOUT。
 */
export async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  const release = await semaphore.acquire(ACQUIRE_TIMEOUT_MS)
  try {
    return await fn()
  } finally {
    release()
  }
}

// ============================================================
// 每 IP 令牌桶速率限制（in-memory，单实例）
// ============================================================

interface Bucket {
  tokens: number
  updatedAt: number
}

const buckets = new Map<string, Bucket>()
const RATE_CAPACITY = Number(process.env.RATE_LIMIT_BURST ?? '5')          // 突发上限
const RATE_REFILL_PER_SEC = Number(process.env.RATE_LIMIT_PER_SEC ?? '0.5') // 每秒补 0.5 = 每分钟 30 个
const BUCKET_TTL_MS = 10 * 60 * 1000

// 定期清理过期 bucket（防内存泄漏）
let cleanupTimer: ReturnType<typeof setInterval> | null = null
function ensureCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [k, v] of buckets) {
      if (now - v.updatedAt > BUCKET_TTL_MS) buckets.delete(k)
    }
  }, 60_000)
  // unref 让定时器不阻塞进程退出（Node 类型）
  ;(cleanupTimer as unknown as { unref?: () => void })?.unref?.()
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** 距离下次能拿到 1 token 的毫秒数；allowed=true 时为 0 */
  retryAfterMs: number
}

export function checkRateLimit(ip: string): RateLimitResult {
  ensureCleanup()
  const now = Date.now()
  const bucket = buckets.get(ip) ?? { tokens: RATE_CAPACITY, updatedAt: now }

  // 按经过时间补 token
  const elapsedSec = (now - bucket.updatedAt) / 1000
  bucket.tokens = Math.min(RATE_CAPACITY, bucket.tokens + elapsedSec * RATE_REFILL_PER_SEC)
  bucket.updatedAt = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    buckets.set(ip, bucket)
    return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 }
  }

  buckets.set(ip, bucket)
  const needed = 1 - bucket.tokens
  const retryAfterMs = Math.ceil((needed / RATE_REFILL_PER_SEC) * 1000)
  return { allowed: false, remaining: 0, retryAfterMs }
}

/** 从 NextRequest 提取客户端 IP（兼容反向代理 + 直连） */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
