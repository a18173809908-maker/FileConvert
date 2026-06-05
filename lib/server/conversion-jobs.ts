import 'server-only'
import { randomUUID } from 'node:crypto'
import { convertOnServer } from './converters'
import { semaphoreStats, withConcurrencyLimit, withHeavyLimit } from './limiter'
import { logConversionError, logConversionInfo } from './conversion-logger'

export type ConversionJobStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface ConversionJob {
  id: string
  status: ConversionJobStatus
  fileName: string
  fileSize: number
  from: string
  to: string
  ip: string
  heavy: boolean
  createdAt: number
  updatedAt: number
  startedAt?: number
  completedAt?: number
  error?: string
  mimeType?: string
  result?: Buffer
}

interface CreateConversionJobInput {
  input: Buffer
  fileName: string
  fileSize: number
  from: string
  to: string
  ip: string
  heavy: boolean
}

const JOB_TTL_MS = Number(process.env.CONVERSION_JOB_TTL_MS || String(30 * 60 * 1000))

declare global {
  // eslint-disable-next-line no-var
  var __fileconvertJobs: Map<string, ConversionJob> | undefined
  // eslint-disable-next-line no-var
  var __fileconvertJobsCleanup: ReturnType<typeof setInterval> | undefined
}

const jobs = globalThis.__fileconvertJobs ?? new Map<string, ConversionJob>()
globalThis.__fileconvertJobs = jobs

function ensureCleanup() {
  if (globalThis.__fileconvertJobsCleanup) return
  globalThis.__fileconvertJobsCleanup = setInterval(() => {
    const now = Date.now()
    for (const [id, job] of jobs) {
      if (now - job.updatedAt > JOB_TTL_MS) jobs.delete(id)
    }
  }, 60_000)
  ;(globalThis.__fileconvertJobsCleanup as unknown as { unref?: () => void })?.unref?.()
}

function publicJob(job: ConversionJob) {
  return {
    id: job.id,
    status: job.status,
    fileName: job.fileName,
    fileSize: job.fileSize,
    from: job.from,
    to: job.to,
    heavy: job.heavy,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error,
    resultReady: job.status === 'completed',
    stats: semaphoreStats(),
  }
}

export function getConversionJob(id: string) {
  ensureCleanup()
  const job = jobs.get(id)
  return job ? publicJob(job) : null
}

export function getConversionJobResult(id: string) {
  ensureCleanup()
  const job = jobs.get(id)
  if (!job || job.status !== 'completed' || !job.result || !job.mimeType) return null
  return {
    buffer: job.result,
    mimeType: job.mimeType,
    fileName: job.fileName,
    from: job.from,
    to: job.to,
  }
}

export function createConversionJob(input: CreateConversionJobInput) {
  ensureCleanup()
  const now = Date.now()
  const job: ConversionJob = {
    id: randomUUID(),
    status: 'queued',
    fileName: input.fileName,
    fileSize: input.fileSize,
    from: input.from,
    to: input.to,
    ip: input.ip,
    heavy: input.heavy,
    createdAt: now,
    updatedAt: now,
  }

  jobs.set(job.id, job)
  logConversionInfo('conversion_job_queued', {
    jobId: job.id,
    ip: job.ip,
    fileName: job.fileName,
    fileSize: job.fileSize,
    from: job.from,
    to: job.to,
    heavy: job.heavy,
  })

  void runJob(job.id, input.input)
  return publicJob(job)
}

async function runJob(id: string, input: Buffer) {
  const job = jobs.get(id)
  if (!job) return

  job.status = 'running'
  job.startedAt = Date.now()
  job.updatedAt = job.startedAt
  logConversionInfo('conversion_job_started', {
    jobId: job.id,
    ip: job.ip,
    fileName: job.fileName,
    fileSize: job.fileSize,
    from: job.from,
    to: job.to,
    heavy: job.heavy,
  })

  try {
    const result = job.heavy
      ? await withHeavyLimit(() => convertOnServer(input, job.from, job.to))
      : await withConcurrencyLimit(() => convertOnServer(input, job.from, job.to))

    job.status = 'completed'
    job.result = result.buffer
    job.mimeType = result.mimeType
    job.completedAt = Date.now()
    job.updatedAt = job.completedAt

    logConversionInfo('conversion_job_completed', {
      jobId: job.id,
      ip: job.ip,
      fileName: job.fileName,
      fileSize: job.fileSize,
      from: job.from,
      to: job.to,
      heavy: job.heavy,
      durationMs: job.completedAt - (job.startedAt ?? job.createdAt),
    })
  } catch (err) {
    job.status = 'failed'
    job.error = err instanceof Error && err.message === 'SEMAPHORE_TIMEOUT'
      ? (job.heavy ? '文档转换繁忙，请稍后重试' : '服务繁忙，请稍后重试')
      : err instanceof Error ? err.message : '转换失败'
    job.completedAt = Date.now()
    job.updatedAt = job.completedAt

    logConversionError('conversion_job_failed', {
      jobId: job.id,
      ip: job.ip,
      fileName: job.fileName,
      fileSize: job.fileSize,
      from: job.from,
      to: job.to,
      heavy: job.heavy,
      durationMs: job.completedAt - (job.startedAt ?? job.createdAt),
    }, err)
  }
}
