'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface Issue {
  feature: string
  desc: string
}

function detectIssues(): Issue[] {
  if (typeof window === 'undefined') return []
  const issues: Issue[] = []

  // 这些 API 是核心功能必需的，浏览器太老就缺
  if (typeof fetch !== 'function') {
    issues.push({ feature: 'fetch', desc: '无法与服务端通信' })
  }
  if (typeof Worker !== 'function') {
    issues.push({ feature: 'Web Worker', desc: 'PDF 转图片功能不可用' })
  }
  if (typeof FileReader !== 'function') {
    issues.push({ feature: 'FileReader', desc: '无法读取本地文件' })
  }
  if (typeof Promise !== 'function' || !Promise.prototype.finally) {
    issues.push({ feature: 'ES2018 Promise', desc: '部分异步流程异常' })
  }
  // CSS Grid 用得很多
  if (typeof CSS === 'undefined' || (CSS.supports && !CSS.supports('display', 'grid'))) {
    issues.push({ feature: 'CSS Grid', desc: '布局错乱' })
  }

  return issues
}

const DISMISSED_KEY = 'fc:browser-notice-dismissed'

export function BrowserNotice() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [dismissed, setDismissed] = useState(true) // 默认不显示，挂载后再决定

  useEffect(() => {
    setIssues(detectIssues())
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === '1')
  }, [])

  if (dismissed || issues.length === 0) return null

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <div className="flex-1 leading-relaxed">
          <span className="font-medium">您的浏览器过旧，部分功能可能不可用：</span>{' '}
          {issues.map(i => i.feature).join('、')}。
          <span className="ml-2 text-amber-800">
            建议升级到 <strong>Chrome / Edge 100+</strong>、<strong>Firefox 100+</strong> 或 <strong>Safari 16+</strong>。
          </span>
        </div>
        <button
          onClick={dismiss}
          className="rounded p-1 hover:bg-amber-100"
          aria-label="关闭提示"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
