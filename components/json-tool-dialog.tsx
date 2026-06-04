'use client'

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Copy, Trash2, Check, AlertCircle, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JsonToolDialogProps {
  open: boolean
  onClose: () => void
}

type Action = 'format' | 'minify' | 'validate' | 'escape' | 'unescape'

const ACTIONS: { id: Action; label: string }[] = [
  { id: 'format',   label: '格式化' },
  { id: 'minify',   label: '压缩' },
  { id: 'validate', label: '校验' },
  { id: 'escape',   label: '转义' },
  { id: 'unescape', label: '反转义' },
]

interface ParseError {
  message: string
  line?: number
  column?: number
}

/** 解析 JSON，失败时尽量从错误消息中提取行列号 */
function tryParse(text: string): { ok: true; value: unknown } | { ok: false; error: ParseError } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // V8 的报错形如 "Unexpected token ... in JSON at position 42"
    const posMatch = msg.match(/position\s+(\d+)/i)
    let line: number | undefined
    let column: number | undefined
    if (posMatch) {
      const pos = Number(posMatch[1])
      const before = text.slice(0, pos)
      const lines = before.split('\n')
      line = lines.length
      column = lines[lines.length - 1].length + 1
    }
    return { ok: false, error: { message: msg, line, column } }
  }
}

export function JsonToolDialog({ open, onClose }: JsonToolDialogProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [action, setAction] = useState<Action>('format')
  const [indent, setIndent] = useState(2)
  const [error, setError] = useState<ParseError | null>(null)
  const [validateOk, setValidateOk] = useState(false)
  const [copied, setCopied] = useState(false)

  const inputStats = useMemo(() => {
    const bytes = new Blob([input]).size
    const lines = input ? input.split('\n').length : 0
    return { bytes, lines }
  }, [input])

  const outputStats = useMemo(() => {
    if (!output) return null
    return { bytes: new Blob([output]).size }
  }, [output])

  const run = useCallback((act: Action) => {
    setAction(act)
    setError(null)
    setValidateOk(false)
    setCopied(false)

    if (!input.trim()) {
      setOutput('')
      return
    }

    // 转义 / 反转义不需要 JSON 校验
    if (act === 'escape') {
      // 把任意字符串转成 JSON 字符串字面量（带引号、转义内部字符）
      setOutput(JSON.stringify(input))
      return
    }
    if (act === 'unescape') {
      // 如果输入是被引号包裹的 JSON 字符串字面量，剥一层
      const r = tryParse(input)
      if (!r.ok) {
        setError(r.error)
        setOutput('')
        return
      }
      if (typeof r.value !== 'string') {
        setError({ message: '反转义要求输入是 JSON 字符串字面量（带引号）' })
        setOutput('')
        return
      }
      setOutput(r.value)
      return
    }

    const r = tryParse(input)
    if (!r.ok) {
      setError(r.error)
      setOutput('')
      return
    }

    switch (act) {
      case 'format':
        setOutput(JSON.stringify(r.value, null, indent))
        break
      case 'minify':
        setOutput(JSON.stringify(r.value))
        break
      case 'validate':
        setValidateOk(true)
        setOutput(JSON.stringify(r.value, null, indent))
        break
    }
  }, [input, indent])

  const handleCopy = useCallback(async () => {
    if (!output) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(output)
      } else {
        const ta = document.createElement('textarea')
        ta.value = output
        ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success('已复制结果')
    } catch {
      toast.error('复制失败')
    }
  }, [output])

  const handleDownload = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = action === 'minify' ? 'data.min.json' : 'data.json'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [output, action])

  const handleClear = () => {
    setInput(''); setOutput(''); setError(null); setValidateOk(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>JSON 格式化 / 校验</DialogTitle>
          <DialogDescription>本地处理，数据不会上传服务器</DialogDescription>
        </DialogHeader>

        {/* 操作按钮 */}
        <div className="flex flex-wrap items-center gap-2">
          {ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => run(a.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                action === a.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent"
              )}
            >
              {a.label}
            </button>
          ))}

          {(action === 'format' || action === 'validate') && (
            <div className="ml-2 flex items-center gap-2 text-sm">
              <Label className="text-xs">缩进</Label>
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                <option value={2}>2 空格</option>
                <option value={4}>4 空格</option>
                <option value={0}>无（单行）</option>
              </select>
            </div>
          )}

          <button
            onClick={handleClear}
            className="ml-auto flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清空
          </button>
        </div>

        {/* 输入 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">输入</Label>
            <span className="text-[11px] text-muted-foreground">
              {inputStats.lines} 行 · {inputStats.bytes} 字节
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "hello", "items": [1, 2, 3]}'
            spellCheck={false}
            className="h-48 w-full rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-primary"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">解析失败</p>
              <p className="text-xs text-destructive/80">{error.message}</p>
              {error.line && (
                <p className="mt-1 text-xs text-destructive/80">
                  位置：第 <span className="font-medium">{error.line}</span> 行
                  {error.column && <>，第 <span className="font-medium">{error.column}</span> 列</>}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 校验通过 */}
        {validateOk && !error && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <Check className="h-4 w-4" />
            JSON 格式有效
          </div>
        )}

        {/* 输出 */}
        {output && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">输出</Label>
              <div className="flex items-center gap-2">
                {outputStats && (
                  <span className="text-[11px] text-muted-foreground">{outputStats.bytes} 字节</span>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                >
                  {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? '已复制' : '复制'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                >
                  <Download className="h-3 w-3" />
                  下载
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              spellCheck={false}
              className="h-48 w-full rounded-md border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed outline-none"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
