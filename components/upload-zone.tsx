'use client'

import { useCallback, useState } from 'react'
import { Upload, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INPUT_FORMAT_TAGS, OUTPUT_FORMATS, isFormatAllowed, isFileSizeAllowed, getFileExtension } from '@/lib/conversion-config'

interface UploadZoneProps {
  selectedFrom: string
  selectedTo: string
  onSelectTo: (format: string) => void
  onFilesSelected: (files: File[]) => void
}

export function UploadZone({ selectedFrom, selectedTo, onSelectTo, onFilesSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleMoreFormats = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = false
    input.accept = '.*'
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      const file = files[0]
      if (file) {
        const ext = getFileExtension(file.name)
        if (isFormatAllowed(ext) && isFileSizeAllowed(file.size, ext)) {
          onFilesSelected([file])
        }
      }
    }
    input.click()
  }, [onFilesSelected])

  const handleConversionSettings = useCallback(() => {
    alert('转换设置功能开发中，敬请期待')
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    // 只取第一个文件，不支持批量
    const file = files[0]
    if (file) {
      const ext = getFileExtension(file.name)
      if (isFormatAllowed(ext) && isFileSizeAllowed(file.size, ext)) {
        onFilesSelected([file])
      }
    }
  }, [onFilesSelected])

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = false  // 禁止多选
    input.accept = INPUT_FORMAT_TAGS.map(f => `.${f.toLowerCase()}`).join(',')
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      // 只取第一个文件
      const file = files[0]
      if (file) {
        const ext = getFileExtension(file.name)
        if (isFormatAllowed(ext) && isFileSizeAllowed(file.size, ext)) {
          onFilesSelected([file])
        }
      }
    }
    
    input.click()
  }, [onFilesSelected])

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[240px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50"
        )}
      >
        {/* Corner Markers */}
        <div className="pointer-events-none absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-muted-foreground/30" />
        <div className="pointer-events-none absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-muted-foreground/30" />
        <div className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-muted-foreground/30" />
        <div className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-muted-foreground/30" />

        {/* Upload Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/50">
          <Upload className="h-6 w-6 text-primary" />
        </div>

        {/* Text */}
        <p className="mb-2 text-base text-foreground">
          拖拽文件到此处，或{' '}
          <button 
            onClick={handleFileSelect}
            className="text-primary hover:underline"
          >
            点击选择
          </button>
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          每次处理一个文件 · 文件全程加密传输，转换后 <span className="text-foreground">1小时</span> 自动删除
        </p>

        {/* Format Tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {INPUT_FORMAT_TAGS.map((format) => (
            <span 
              key={format}
              className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {format}
            </span>
          ))}
          <span className="flex items-center justify-center rounded bg-primary px-1 py-0.5">
            <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </span>
        </div>

        {/* File Limits */}
        <p className="mt-4 text-xs text-muted-foreground">
          单文件 ≤ 10MB · 支持 PDF、DOC、图片等 30+ 种格式
        </p>
      </div>

      {/* Features List */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          免费使用
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          无需安装软件
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          文件1小时自动删除
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          支持30种常用格式
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          积分签到获取
        </span>
      </div>

      {/* Format Selector */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">转换为</span>
        <div className="flex flex-wrap gap-2">
          {OUTPUT_FORMATS.map((format) => {
            const isSelected = selectedTo.toUpperCase() === format
            return (
              <button
                key={format}
                onClick={() => onSelectTo(format.toLowerCase())}
                className={cn(
                  "flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
                {format}
              </button>
            )
          })}
          <button onClick={handleMoreFormats} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50">
            + 更多格式
          </button>
        </div>
        <button onClick={handleConversionSettings} className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
          转换设置
        </button>
      </div>
    </div>
  )
}

function Settings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
