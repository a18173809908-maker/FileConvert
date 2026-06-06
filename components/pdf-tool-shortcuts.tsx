'use client'

import { Files, Lock, RotateCw, Scissors, Unlock } from 'lucide-react'
import { PdfToolId } from '@/lib/pdf-tools'

interface PdfToolShortcutsProps {
  onOpenTool: (tool: PdfToolId) => void
}

const tools: Array<{
  id: PdfToolId
  label: string
  description: string
  icon: React.ElementType
}> = [
  { id: 'encrypt', label: 'PDF 加密', description: '批量设置打开密码', icon: Lock },
  { id: 'decrypt', label: 'PDF 解密', description: '批量移除打开密码', icon: Unlock },
  { id: 'merge', label: 'PDF 合并', description: '多个文件合成一个', icon: Files },
  { id: 'split', label: 'PDF 拆分', description: '按页或范围拆分', icon: Scissors },
  { id: 'rotate', label: 'PDF 旋转', description: '统一旋转页面', icon: RotateCw },
]

export function PdfToolShortcuts({ onOpenTool }: PdfToolShortcutsProps) {
  return (
    <section className="rounded-lg border border-border bg-card px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">常用 PDF 工具</h2>
          <p className="mt-1 text-sm text-muted-foreground">加密、解密、合并、拆分、旋转，直接处理 PDF 文件</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              onClick={() => onOpenTool(tool.id)}
              className="flex min-h-[76px] items-start gap-3 rounded-md border border-border bg-background px-3 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{tool.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{tool.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
