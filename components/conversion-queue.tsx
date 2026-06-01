'use client'

import { Download, Play, Trash2, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QueueItem, formatFileSize } from '@/lib/conversion-config'

interface ConversionQueueProps {
  items: QueueItem[]
  onClear: () => void
  onDownloadAll: () => void
  onStartConversion: () => void
  onRemoveItem: (id: string) => void
  onAddFiles: () => void
}

// 文件类型图标组件
function FileTypeIcon({ type, className }: { type: string; className?: string }) {
  const typeColors: Record<string, string> = {
    pdf: 'bg-red-500',
    docx: 'bg-blue-500',
    doc: 'bg-blue-500',
    jpg: 'bg-orange-500',
    jpeg: 'bg-orange-500',
    png: 'bg-green-500',
    webp: 'bg-purple-500',
    txt: 'bg-gray-500',
    svg: 'bg-pink-500',
    gif: 'bg-yellow-500',
    bmp: 'bg-teal-500',
    epub: 'bg-indigo-500',
    html: 'bg-cyan-500',
  }

  const bgColor = typeColors[type.toLowerCase()] || 'bg-gray-500'

  return (
    <div className={cn("flex items-center justify-center rounded text-xs font-medium text-white uppercase", bgColor, className)}>
      {type.toUpperCase().slice(0, 4)}
    </div>
  )
}

// 状态标签组件
function StatusBadge({ status, progress }: { status: QueueItem['status']; progress?: number }) {
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1 text-sm text-green-600">
        <Check className="h-4 w-4" />
        已完成
      </span>
    )
  }

  if (status === 'converting') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-primary">转换中</span>
        <span className="text-sm text-muted-foreground">{progress || 0}%</span>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <span className="text-sm text-destructive">转换失败</span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-sm text-muted-foreground">
      <span className="h-2 w-2 rounded-full border border-muted-foreground" />
      排队中
    </span>
  )
}

export function ConversionQueue({
  items,
  onClear,
  onDownloadAll,
  onStartConversion,
  onRemoveItem,
  onAddFiles,
}: ConversionQueueProps) {
  const completedCount = items.filter(i => i.status === 'completed').length
  const convertingCount = items.filter(i => i.status === 'converting').length
  const queuedCount = items.filter(i => i.status === 'queued').length
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0)

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">转换队列</h3>
          <span className="text-sm text-muted-foreground">{items.length} 个文件</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            清空
          </button>
          <button
            onClick={onDownloadAll}
            disabled={completedCount === 0}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            全部下载
          </button>
          <button
            onClick={onStartConversion}
            disabled={queuedCount === 0}
            className="flex items-center gap-1 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            开始转换
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_80px_120px_80px_120px_60px] gap-4 border-b border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
        <span>文件</span>
        <span>大小</span>
        <span>方向</span>
        <span>消耗</span>
        <span>状态</span>
        <span></span>
      </div>

      {/* Queue Items */}
      <div className="max-h-[320px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">暂无文件</p>
            <p className="text-sm text-muted-foreground">拖拽文件到上方区域开始转换</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_80px_120px_80px_120px_60px] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              {/* File Info */}
              <div className="flex items-center gap-3 min-w-0">
                <FileTypeIcon type={item.fromFormat} className="h-8 w-12 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</p>
                </div>
              </div>

              {/* Size */}
              <span className="text-sm text-muted-foreground">
                {formatFileSize(item.fileSize)}
              </span>

              {/* Direction */}
              <div className="flex items-center gap-1">
                <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs uppercase">
                  {item.fromFormat}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded border border-primary bg-primary/10 px-1.5 py-0.5 text-xs uppercase text-primary">
                  {item.toFormat}
                </span>
              </div>

              {/* Points */}
              <div className="flex items-center gap-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                  ★
                </span>
                <span className="text-sm">{item.points}</span>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <StatusBadge status={item.status} progress={item.progress} />
                {item.status === 'converting' && (
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                {item.status === 'completed' && (
                  <button className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90">
                    <Download className="h-4 w-4" />
                  </button>
                )}
                {item.status === 'converting' && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {(item.status === 'queued' || item.status === 'failed') && (
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>共 {items.length} 个文件</span>
            <span>·</span>
            <span>{completedCount} 已完成</span>
            <span>·</span>
            <span>{convertingCount} 转换中</span>
            <span>·</span>
            <span>{queuedCount} 排队中</span>
            <span>·</span>
            <span>预计消耗 <span className="text-primary font-medium">{totalPoints}</span> 积分</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddFiles}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              添加文件
            </button>
            <button
              onClick={onStartConversion}
              disabled={queuedCount === 0}
              className="flex items-center gap-1 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              开始全部转换
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
