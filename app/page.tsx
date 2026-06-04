'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  const {
    points, setPoints,
    isLoggedIn, setIsLoggedIn,
    consecutiveDays, setConsecutiveDays,
    hasSignedToday, setHasSignedToday,
  } = useApp()

  const searchParams = useSearchParams()

  const [selectedConversion, setSelectedConversion] = useState<string | null>('pdf-docx')
  const [selectedFrom, setSelectedFrom] = useState('pdf')
  const [selectedTo, setSelectedTo] = useState('docx')

  const [queueItems, setQueueItems] = useState<QueueItem[]>([])

  // 从 URL ?conversion=pdf-docx 读取预设的转换方向（格式中心跳转过来）
  useEffect(() => {
    const conv = searchParams.get('conversion')
    if (!conv) return
    const [from, to] = conv.split('-')
    if (from && to) {
      setSelectedConversion(conv)
      setSelectedFrom(from)
      setSelectedTo(to)
    }
  }, [searchParams])

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

  const handleClear = useCallback(() => {
    setQueueItems([])
  }, [])

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
    const completedItems = queueItems.filter(item => item.status === 'completed')
    completedItems.forEach(item => handleDownloadItem(item))
  }, [queueItems, handleDownloadItem])

  const handleStartConversion = useCallback(() => {
    setQueueItems(prev => {
      const hasQueued = prev.some(item => item.status === 'queued')
      if (!hasQueued) return prev

      const updated = prev.map(item => {
        if (item.status !== 'queued') return item
        if (!item.sourceFile) {
          return { ...item, status: 'failed' as const, errorMessage: '未找到源文件，请重新上传' }
        }
        if (!canConvert(item.fromFormat, item.toFormat)) {
          const msg = `暂不支持 ${item.fromFormat.toUpperCase()} → ${item.toFormat.toUpperCase()}`
          return { ...item, status: 'failed' as const, errorMessage: msg }
        }
        return { ...item, status: 'converting' as const, progress: 0 }
      })

      updated
        .filter(item => item.status === 'converting' && item.sourceFile)
        .forEach(item => {
          convertFile(item.sourceFile!, item.fromFormat, item.toFormat, {
            onProgress: (current, total) => {
              const pct = Math.round((current / total) * 100)
              setQueueItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, progress: pct } : i
              ))
            },
          })
            .then(blob => {
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
  }, [])

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

  const handleSignIn = useCallback(() => {
    if (isLoggedIn) return
    setIsLoggedIn(true)
    setPoints(prev => prev + 20)
  }, [isLoggedIn, setIsLoggedIn, setPoints])

  const handleCheckIn = useCallback(() => {
    if (hasSignedToday) return
    setHasSignedToday(true)
    setConsecutiveDays(prev => prev + 1)
    const bonus = 5 + (consecutiveDays >= 1 ? consecutiveDays * 2 : 0)
    setPoints(prev => prev + bonus)
  }, [consecutiveDays, hasSignedToday, setConsecutiveDays, setHasSignedToday, setPoints])

  const handleCopyInviteLink = useCallback(() => {
    const inviteLink = 'https://fileconvert.app/invite/' + generateId()
    navigator.clipboard.writeText(inviteLink).catch(() => {
      const textarea = document.createElement('textarea')
      textarea.value = inviteLink
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    })
  }, [])

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

        <AccountPanel
          points={points}
          isLoggedIn={isLoggedIn}
          consecutiveDays={consecutiveDays}
          hasSignedToday={hasSignedToday}
          onSignIn={handleSignIn}
          onCheckIn={handleCheckIn}
          onCopyInviteLink={handleCopyInviteLink}
        />
      </div>
    </div>
  )
}

export default function HomePage() {
  // useSearchParams 需要在 Suspense 边界内
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  )
}
