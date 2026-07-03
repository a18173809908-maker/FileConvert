'use client'

import { CheckCircle2, Clock3, FileSearch, ShieldCheck, Sparkles } from 'lucide-react'

const tips = [
  '优先使用 PDF、DOCX、XLSX、PPTX、JPG、PNG 等常见格式',
  '大文件转换时请保持页面打开，完成后再下载结果',
  '批量文件会按队列依次处理，可一次性打包下载',
]

const supported = ['PDF', 'Word', 'Excel', 'PPT', '图片', 'Markdown']

export function AccountPanel() {
  return (
    <aside className="w-72 shrink-0 space-y-4 p-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">文件安全</h3>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">服务器不保存任何文件。</span>
          所有转换在内存中完成，处理结束立即销毁。
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">转换建议</h3>
        </div>
        <div className="space-y-3">
          {tips.map(tip => (
            <div key={tip} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">常用能力</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {supported.map(item => (
            <span key={item} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">处理说明</h3>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          图片、PDF 拆分/合并等轻量任务通常更快；Office、EPUB、复杂 PDF 可能需要更多时间。
        </p>
      </div>
    </aside>
  )
}
