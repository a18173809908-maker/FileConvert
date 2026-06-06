import 'server-only'

export interface ConversionLogContext {
  jobId?: string
  ip?: string
  fileName?: string
  fileSize?: number
  from?: string
  to?: string
  action?: string
  heavy?: boolean
  durationMs?: number
  status?: number
}

export interface ConversionLogEntry extends ConversionLogContext {
  id: string
  level: 'info' | 'error'
  event: string
  ts: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __fileconvertConversionLogs: ConversionLogEntry[] | undefined
}

const MAX_LOGS = Number(process.env.CONVERSION_LOG_BUFFER_SIZE || '500')
const logs = globalThis.__fileconvertConversionLogs ?? []
globalThis.__fileconvertConversionLogs = logs

function errorPayload(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
  }
  return {
    name: 'UnknownError',
    message: String(err),
  }
}

function pushLog(entry: ConversionLogEntry) {
  logs.unshift(entry)
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS
}

export function logConversionInfo(event: string, context: ConversionLogContext) {
  const entry: ConversionLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: 'info',
    event,
    ts: new Date().toISOString(),
    ...context,
  }
  pushLog(entry)
  console.log(JSON.stringify(entry))
}

export function logConversionError(event: string, context: ConversionLogContext, err: unknown) {
  const entry: ConversionLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: 'error',
    event,
    ts: new Date().toISOString(),
    ...context,
    error: errorPayload(err),
  }
  pushLog(entry)
  console.error(JSON.stringify(entry))
}

export function getConversionLogs(options: {
  level?: 'info' | 'error' | 'all'
  q?: string
  limit?: number
} = {}) {
  const level = options.level || 'all'
  const q = options.q?.trim().toLowerCase()
  const limit = Math.min(Math.max(options.limit || 100, 1), MAX_LOGS)

  return logs
    .filter((entry) => level === 'all' || entry.level === level)
    .filter((entry) => {
      if (!q) return true
      const haystack = [
        entry.event,
        entry.jobId,
        entry.fileName,
        entry.from,
        entry.to,
        entry.action,
        entry.error?.name,
        entry.error?.message,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
    .slice(0, limit)
}
