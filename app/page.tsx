'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { SidebarNav } from '@/components/sidebar-nav'
import { UploadZone } from '@/components/upload-zone'
import { ConversionQueue } from '@/components/conversion-queue'
import { AccountPanel } from '@/components/account-panel'
import { QueueItem, getConversionPoints, getFileExtension } from '@/lib/conversion-config'
import { convertFile, canConvert, getConvertedFileName } from '@/lib/convert'
import { useApp } from '@/lib/store'

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function HomePageInner() {
  const { user, refreshUser, setLoginDialogOpen } = useApp()
  const searchParams = useSearchParams()

  const [selectedConversion, setSelectedConversion] = useState<string | null>('pdf-docx')
  const [selectedFrom, setSelectedFrom] = useState('pdf')
  const [selectedTo, setSelectedTo] = useState('docx')

  const [queueItems, setQueueItems] = useState<QueueItem[]>([])

  // 从 URL ?conversion=pdf-docx 读取预设
  useEffect(() => {
    const conv = searchParams.get('conversion')
    if (conv) {
      const [from, to] = conv.split('-')
      if (from && to) {
        setSelectedConversion(conv)
        setSelectedFrom(from)
        setSelectedTo(to)
      }
    }
    // OAuth 回跳的成功/失败提示
    if (searchParams.get('login') === 'success') {
      toast.success('登录成功')
      refreshUser()
    }
    const err = searchParams.get('login_error')
    if (err) toast.error(`登录失败：${decodeURIComponent(err)}`)
  }, [searchParams, refreshUser])

  const handleSelectConversion = useCallback((conversionId: string, from: string, to: string) => {
    setSelectedConversion(conversionId)
    setSelectedFrom(from)
    setSelectedTo(to)
  }, [])

  const handleSelectTo = useCallback((format: string) => {
    setSelectedTo(format)
    setSelectedConversion(`${selectedFrom}-${format}`)
    setQueueItems(prev => prev.map(item =>
      item.status === 'queued'
        ? { ...item, toFormat: format, points: getConversionPoints(item.fromFormat, format) }
        : item
    ))
  }, [selectedFrom])

  const handleFilesSelected = useCallback((files: File[]) => {
    const newItems: QueueItem[] = files.map(file => {
      const ext = getFileExtension(file.name)
      return {
        id: generateId(),
        fileName: file.name,
        fileSize: file.size,
        fileType: ext,
        fromFormat: ext,
        toFormat: selectedTo,
        points: getConversionPoints(ext, selectedTo),
        status: 'queued' as const,
        sourceFile: file,
      }
    })
    setQueueItems(prev => [...prev, ...newItems])
  }, [selectedTo])

  const handleClear = useCallback(() => setQueueItems([]), [])

  const handleDownloadItem = useCallback((item: QueueItem) => {
    const blob = item.resultBlob || new Blob([item.fileName], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = getConvertedFileName(item.fileName, item.toFormat, item.resultBlob)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const handleDownloadAll = useCallback(() => {
    queueItems.filter(i => i.status === 'completed').forEach(handleDownloadItem)
  }, [queueItems, handleDownloadItem])

  const handleStartConversion = useCallback(() => {
    // 未登录 → 引导登录
    if (!user) {
      toast.error('请先登录')
      setLoginDialogOpen(true)
      return
    }

    // 积分预检
    const queued = queueItems.filter(i => i.status === 'queued')
    const totalCost = queued.reduce((s, i) => s + i.points, 0)
    if (user.points < totalCost) {
      toast.error(`积分不足：需要 ${totalCost}，当前 ${user.points}`)
      return
    }

    setQueueItems(prev => {
      const updated = prev.map(item => {
        if (item.status !== 'queued') return item
        if (!item.sourceFile) {
          return { ...item, status: 'failed' as const, errorMessage: '未找到源文件' }
        }
        if (!canConvert(item.fromFormat, item.toFormat)) {
          return { ...item, status: 'failed' as const, errorMessage: `暂不支持 ${item.fromFormat.toUpperCase()} → ${item.toFormat.toUpperCase()}` }
        }
        return { ...item, status: 'converting' as const, progress: 0 }
      })

      updated
        .filter(item => item.status === 'converting' && item.sourceFile)
        .forEach(item => {
          convertFile(item.sourceFile!, item.fromFormat, item.toFormat, {
            onProgress: (current, total) => {
              const pct = Math.round((current / total) * 100)
              setQueueItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: pct } : i))
            },
          })
            .then(async (blob) => {
              // 转换成功 → 扣积分
              try {
                await fetch('/api/points/charge', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    cost: item.points,
                    from: item.fromFormat,
                    to: item.toFormat,
                    fileName: item.fileName,
                  }),
                })
                refreshUser()
              } catch {}

              setQueueItems(prev => prev.map(i =>
                i.id === item.id
                  ? { ...i, status: 'completed' as const, progress: 100, resultBlob: blob }
                  : i
              ))
            })
            .catch(err => {
              setQueueItems(prev => prev.map(i =>
                i.id === item.id
                  ? { ...i, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : '转换失败' }
                  : i
              ))
            })
        })

      return updated
    })
  }, [user, queueItems, setLoginDialogOpen, refreshUser])

  const handleRemoveItem = useCallback((id: string) => {
    setQueueItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const handleAddFiles = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      handleFilesSelected(files)
    }
    input.click()
  }, [handleFilesSelected])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <SidebarNav
          selectedConversion={selectedConversion}
          onSelectConversion={handleSelectConversion}
        />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <UploadZone
              selectedFrom={selectedFrom}
              selectedTo={selectedTo}
              onSelectTo={handleSelectTo}
              onFilesSelected={handleFilesSelected}
            />
            <ConversionQueue
              items={queueItems}
              onClear={handleClear}
              onDownloadAll={handleDownloadAll}
              onDownloadItem={handleDownloadItem}
              onStartConversion={handleStartConversion}
              onRemoveItem={handleRemoveItem}
              onAddFiles={handleAddFiles}
            />
          </div>
        </main>
        <AccountPanel />
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  )
}
