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

export function logConversionInfo(event: string, context: ConversionLogContext) {
  console.log(JSON.stringify({
    level: 'info',
    event,
    ts: new Date().toISOString(),
    ...context,
  }))
}

export function logConversionError(event: string, context: ConversionLogContext, err: unknown) {
  console.error(JSON.stringify({
    level: 'error',
    event,
    ts: new Date().toISOString(),
    ...context,
    error: errorPayload(err),
  }))
}
