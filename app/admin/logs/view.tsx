'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, RefreshCw, Search, Shield } from 'lucide-react'
import { Header } from '@/components/header'
import { formatFileSize } from '@/lib/conversion-config'
import { cn } from '@/lib/utils'

interface ConversionLogEntry {
  id: string
  level: 'info' | 'error'
  event: string
  ts: string
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
  error?: {
    name: string
    message: string
    stack?: string
  }
}

function formatDuration(ms?: number) {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

export function AdminLogsClient() {
  const [logs, setLogs] = useState<ConversionLogEntry[]>([])
  const [level, setLevel] = useState<'all' | 'error' | 'info'>('error')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set('level', level)
    params.set('limit', '200')
    if (q.trim()) params.set('q', q.trim())
    return params.toString()
  }, [level, q])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/conversion-logs?${query}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || '日志加载失败')
      setLogs(data.logs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '日志加载失败')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  const errorCount = logs.filter(log => log.level === 'error').length
  const successCount = logs.filter(log => log.level === 'info' && /completed/.test(log.event)).length

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              管理后台
            </div>
            <h1 className="mt-1 text-2xl font-bold">转换日志</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              查看最近转换任务、失败原因、耗时和文件方向。日志只保存在当前服务进程内，不保存用户文件。
            </p>
          </div>
          <Link href="/" className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">
            返回转换台
          </Link>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">当前列表</p>
            <p className="mt-1 text-2xl font-semibold">{logs.length}</p>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">失败记录</p>
            <p className="mt-1 text-2xl font-semibold text-destructive">{errorCount}</p>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">完成事件</p>
            <p className="mt-1 text-2xl font-semibold text-green-600">{successCount}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex rounded-md border border-border p-1">
            {(['error', 'all', 'info'] as const).map(item => (
              <button
                key={item}
                onClick={() => setLevel(item)}
                className={cn(
                  'rounded px-3 py-1.5 text-sm',
                  level === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item === 'error' ? '只看失败' : item === 'info' ? '只看信息' : '全部'}
              </button>
            ))}
          </div>
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索文件名、任务 ID、错误信息"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => void loadLogs()}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            刷新
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="grid grid-cols-[150px_90px_170px_1fr_100px_90px_220px] gap-3 border-b bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <span>时间</span>
            <span>级别</span>
            <span>事件</span>
            <span>文件</span>
            <span>方向</span>
            <span>耗时</span>
            <span>错误</span>
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">加载中...</div>
            ) : logs.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">暂无日志</div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className="grid grid-cols-[150px_90px_170px_1fr_100px_90px_220px] items-start gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="text-xs text-muted-foreground">{formatTime(log.ts)}</span>
                  <span className={cn(
                    'inline-flex w-fit items-center gap-1 rounded px-2 py-0.5 text-xs',
                    log.level === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600',
                  )}>
                    {log.level === 'error' ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {log.level === 'error' ? '失败' : '信息'}
                  </span>
                  <span className="break-all font-medium">{log.event}</span>
                  <span className="min-w-0">
                    <span className="block truncate" title={log.fileName}>{log.fileName || '-'}</span>
                    {log.fileSize != null && (
                      <span className="mt-1 block text-xs text-muted-foreground">{formatFileSize(log.fileSize)}</span>
                    )}
                    {log.jobId && (
                      <span className="mt-1 block truncate text-xs text-muted-foreground" title={log.jobId}>{log.jobId}</span>
                    )}
                  </span>
                  <span className="uppercase">{log.from && log.to ? `${log.from} → ${log.to}` : log.action || '-'}</span>
                  <span>{formatDuration(log.durationMs)}</span>
                  <span className="break-words text-xs text-muted-foreground" title={log.error?.stack}>
                    {log.error?.message || '-'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
