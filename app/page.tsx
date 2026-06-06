'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import JSZip from 'jszip'
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

    // 邀请链接 ?ref=xxx：存到 localStorage，注册时自动带上
    const ref = searchParams.get('ref')
    if (ref && typeof window !== 'undefined') {
      window.localStorage.setItem('fc:pendingInvite', ref.trim().toLowerCase())
      // 未登录且有邀请码 → 自动弹注册框
      if (!user) {
        setLoginDialogOpen(true)
        toast.info('邀请码已自动填入，注册后双方各得奖励')
      }
    }
  }, [searchParams, refreshUser, user, setLoginDialogOpen])

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

  const handleDownloadAll = useCallback(async () => {
    const completedItems = queueItems.filter(i => i.status === 'completed' && i.resultBlob)
    if (completedItems.length === 0) {
      toast.error('暂无可下载的已完成文件')
      return
    }

    if (completedItems.length === 1) {
      handleDownloadItem(completedItems[0])
      return
    }

    try {
      const zip = new JSZip()
      const usedNames = new Map<string, number>()

      for (const item of completedItems) {
        const originalName = getConvertedFileName(item.fileName, item.toFormat, item.resultBlob)
        const dotIndex = originalName.lastIndexOf('.')
        const baseName = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName
        const ext = dotIndex > 0 ? originalName.substring(dotIndex) : ''
        const count = usedNames.get(originalName) || 0
        const safeName = count === 0 ? originalName : `${baseName}-${count + 1}${ext}`

        usedNames.set(originalName, count + 1)
        zip.file(safeName, item.resultBlob!)
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fileconvert-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`已打包 ${completedItems.length} 个文件`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '打包下载失败')
    }
  }, [queueItems, handleDownloadItem])

  const handleStartConversion = useCallback(async () => {
    // 未登录 → 引导登录
    if (!user) {
      toast.error('请先登录')
      setLoginDialogOpen(true)
      return
    }

    // 积分预检
    const queued = queueItems.filter(i => i.status === 'queued')
    if (queueItems.some(i => i.status === 'converting')) {
      toast.info('已有文件正在转换，请稍候')
      return
    }
    if (queued.length === 0) {
      toast.info('暂无排队中的文件')
      return
    }
    const totalCost = queued.reduce((s, i) => s + i.points, 0)
    if (user.points < totalCost) {
      toast.error(`积分不足：需要 ${totalCost}，当前 ${user.points}`)
      return
    }

    for (const item of queued) {
      if (!item.sourceFile) {
        setQueueItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'failed' as const, errorMessage: '未找到源文件' } : i
        ))
        continue
      }
      if (!canConvert(item.fromFormat, item.toFormat)) {
        setQueueItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...i, status: 'failed' as const, errorMessage: `暂不支持 ${item.fromFormat.toUpperCase()} → ${item.toFormat.toUpperCase()}` }
            : i
        ))
        continue
      }

      setQueueItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'converting' as const, progress: 0, errorMessage: undefined } : i
      ))

      try {
        const blob = await convertFile(item.sourceFile, item.fromFormat, item.toFormat, {
          onProgress: (current, total) => {
            const pct = Math.round((current / total) * 100)
            setQueueItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: pct } : i))
          },
        })

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
      } catch (err) {
        setQueueItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...i, status: 'failed' as const, errorMessage: err instanceof Error ? err.message : '转换失败' }
            : i
        ))
      }
    }
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

            <a
              href="https://www.aiboxpro.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-5 py-4 text-primary transition-colors hover:border-primary hover:bg-primary/10"
            >
              <div>
                <p className="font-semibold">更多 AI 工具</p>
                <p className="mt-1 text-sm text-muted-foreground">点击前往 AIBoxPro 主站，发现更多实用工具</p>
              </div>
              <span className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                立即查看
              </span>
            </a>

            <section className="rounded-lg border bg-card px-5 py-4 text-sm leading-6 text-muted-foreground">
              <h1 className="text-base font-semibold text-foreground">文件侠免费在线文件转换工具</h1>
              <p className="mt-2">
                支持 PDF 转 Word、Word 转 PDF、PDF 转 Excel、PDF 转 PPT、PDF 转图片、图片格式转换、
                HEIC 转 JPG、CSV 与 Excel 互转、Markdown 转 HTML/PDF、EPUB 转 PDF 等常用文件转换。
                无需安装软件，适合在浏览器中快速处理文档、图片和电子书文件。
              </p>
            </section>
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
