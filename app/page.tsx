'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/header'
import { SidebarNav } from '@/components/sidebar-nav'
import { UploadZone } from '@/components/upload-zone'
import { ConversionQueue } from '@/components/conversion-queue'
import { AccountPanel } from '@/components/account-panel'
import { QueueItem, getConversionPoints, getFileExtension } from '@/lib/conversion-config'

// 生成唯一ID
function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export default function HomePage() {
  // 用户积分
  const [points] = useState(128)
  
  // 选中的转换方向
  const [selectedConversion, setSelectedConversion] = useState<string | null>('pdf-docx')
  const [selectedFrom, setSelectedFrom] = useState('pdf')
  const [selectedTo, setSelectedTo] = useState('docx')
  
  // 转换队列
  const [queueItems, setQueueItems] = useState<QueueItem[]>([
    {
      id: '1',
      fileName: '2024-Q4 季度财报.pdf',
      fileSize: 2.41 * 1024 * 1024,
      fileType: 'pdf',
      fromFormat: 'pdf',
      toFormat: 'docx',
      points: 5,
      status: 'completed',
    },
    {
      id: '2',
      fileName: '产品操作手册 V3.docx',
      fileSize: 5.08 * 1024 * 1024,
      fileType: 'docx',
      fromFormat: 'docx',
      toFormat: 'pdf',
      points: 2,
      status: 'converting',
      progress: 64,
    },
    {
      id: '3',
      fileName: '合同扫描件_01.jpg',
      fileSize: 3.82 * 1024 * 1024,
      fileType: 'jpg',
      fromFormat: 'jpg',
      toFormat: 'pdf',
      points: 2,
      status: 'queued',
    },
    {
      id: '4',
      fileName: '品牌标识_logo.png',
      fileSize: 248 * 1024,
      fileType: 'png',
      fromFormat: 'png',
      toFormat: 'webp',
      points: 1,
      status: 'queued',
    },
  ])

  // 处理选择转换类型
  const handleSelectConversion = useCallback((conversionId: string, from: string, to: string) => {
    setSelectedConversion(conversionId)
    setSelectedFrom(from)
    setSelectedTo(to)
  }, [])

  // 处理选择输出格式
  const handleSelectTo = useCallback((format: string) => {
    setSelectedTo(format)
    setSelectedConversion(`${selectedFrom}-${format}`)
  }, [selectedFrom])

  // 处理文件选择
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
      }
    })
    
    setQueueItems(prev => [...prev, ...newItems])
  }, [selectedTo])

  // 清空队列
  const handleClear = useCallback(() => {
    setQueueItems([])
  }, [])

  // 下载所有已完成
  const handleDownloadAll = useCallback(() => {
    // TODO: 实现下载功能
    console.log('Download all completed files')
  }, [])

  // 开始转换
  const handleStartConversion = useCallback(() => {
    // 模拟转换过程
    setQueueItems(prev => prev.map(item => 
      item.status === 'queued' 
        ? { ...item, status: 'converting' as const, progress: 0 }
        : item
    ))

    // 模拟进度更新
    const interval = setInterval(() => {
      setQueueItems(prev => {
        const updated = prev.map(item => {
          if (item.status === 'converting') {
            const newProgress = (item.progress || 0) + Math.random() * 20
            if (newProgress >= 100) {
              return { ...item, status: 'completed' as const, progress: 100 }
            }
            return { ...item, progress: Math.min(newProgress, 99) }
          }
          return item
        })
        
        // 如果没有正在转换的项目，清除定时器
        if (!updated.some(item => item.status === 'converting')) {
          clearInterval(interval)
        }
        
        return updated
      })
    }, 500)
  }, [])

  // 删除队列项
  const handleRemoveItem = useCallback((id: string) => {
    setQueueItems(prev => prev.filter(item => item.id !== id))
  }, [])

  // 添加文件
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

  // 登录
  const handleSignIn = useCallback(() => {
    // TODO: 实现登录功能
    console.log('Sign in')
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header points={points} />
      
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <SidebarNav 
          selectedConversion={selectedConversion}
          onSelectConversion={handleSelectConversion}
        />
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Upload Zone */}
            <UploadZone
              selectedFrom={selectedFrom}
              selectedTo={selectedTo}
              onSelectTo={handleSelectTo}
              onFilesSelected={handleFilesSelected}
            />
            
            {/* Conversion Queue */}
            <ConversionQueue
              items={queueItems}
              onClear={handleClear}
              onDownloadAll={handleDownloadAll}
              onStartConversion={handleStartConversion}
              onRemoveItem={handleRemoveItem}
              onAddFiles={handleAddFiles}
            />
          </div>
        </main>
        
        {/* Right Panel */}
        <AccountPanel
          points={points}
          freeTriesRemaining={3}
          maxFreeTries={5}
          onSignIn={handleSignIn}
        />
      </div>
    </div>
  )
}
