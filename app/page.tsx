'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/header'
import { SidebarNav } from '@/components/sidebar-nav'
import { UploadZone } from '@/components/upload-zone'
import { ConversionQueue } from '@/components/conversion-queue'
import { AccountPanel } from '@/components/account-panel'
import { QueueItem, getConversionPoints, getFileExtension } from '@/lib/conversion-config'
import { convertImage, canConvert, getConvertedFileName } from '@/lib/convert'

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export default function HomePage() {
  const [points, setPoints] = useState(120)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [consecutiveDays, setConsecutiveDays] = useState(0)
  const [hasSignedToday, setHasSignedToday] = useState(false)

  const [selectedConversion, setSelectedConversion] = useState<string | null>('pdf-docx')
  const [selectedFrom, setSelectedFrom] = useState('pdf')
  const [selectedTo, setSelectedTo] = useState('docx')

  const [queueItems, setQueueItems] = useState<QueueItem[]>([])

  const handleSelectConversion = useCallback((conversionId: string, from: string, to: string) => {
    setSelectedConversion(conversionId)
    setSelectedFrom(from)
    setSelectedTo(to)
  }, [])

  const handleSelectTo = useCallback((format: string) => {
    setSelectedTo(format)
    setSelectedConversion(`${selectedFrom}-${format}`)
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
    a.download = getConvertedFileName(item.fileName, item.toFormat)
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

      const updated = prev.map(item =>
        item.status === 'queued'
          ? { ...item, status: 'converting' as const, progress: 0 }
          : item
      )

      const convertingItems = updated.filter(item => item.status === 'converting')

      convertingItems.forEach(item => {
        if (item.sourceFile && canConvert(item.fromFormat, item.toFormat)) {
          convertImage(item.sourceFile, item.toFormat)
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
        } else if (!item.sourceFile) {
          setQueueItems(prev => prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'failed' as const, errorMessage: '未找到源文件，请重新上传' }
              : i
          ))
        } else {
          const msg = `${item.fromFormat.toUpperCase()} → ${item.toFormat.toUpperCase()} 当前仅支持图片格式互转，文档/PDF/电子书转换需要使用后端服务`
          setQueueItems(prev => prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'failed' as const, errorMessage: msg }
              : i
          ))
        }
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
    setIsLoggedIn(true)
    setPoints(prev => prev + 20)
  }, [])

  const handleCheckIn = useCallback(() => {
    setHasSignedToday(true)
    setConsecutiveDays(prev => prev + 1)
    const bonus = 5 + (consecutiveDays >= 1 ? consecutiveDays * 2 : 0)
    setPoints(prev => prev + bonus)
  }, [consecutiveDays])

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
      <Header points={points} onSignIn={handleSignIn} />

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