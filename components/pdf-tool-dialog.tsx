'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import JSZip from 'jszip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Download, Upload, Loader2, X, RotateCw, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PdfToolId,
  mergePdfs,
  splitPdf,
  rotatePdf,
  getPdfPageCount,
  SplitMode,
  securePdf,
} from '@/lib/pdf-tools'
import { formatFileSize, getFileExtension } from '@/lib/conversion-config'

const TITLES: Record<PdfToolId, string> = {
  merge: 'PDF 合并',
  split: 'PDF 拆分',
  rotate: 'PDF 旋转',
  encrypt: 'PDF 加密',
  decrypt: 'PDF 解密',
}

const DESCRIPTIONS: Record<PdfToolId, string> = {
  merge: '将多个 PDF 按顺序合并成一个文件，全程在浏览器本地完成',
  split: '把 PDF 拆成多个文件，按页或按指定范围，打包成 zip',
  rotate: '旋转所有页面，90° / 180° / 270°',
  encrypt: '为 PDF 设置打开密码，生成受密码保护的新文件',
  decrypt: '输入已加密 PDF 的密码，生成去除打开密码的新文件',
}

interface PdfToolDialogProps {
  tool: PdfToolId | null
  onClose: () => void
}

export function PdfToolDialog({ tool, onClose }: PdfToolDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [working, setWorking] = useState(false)

  // 拆分参数
  const [splitMode, setSplitMode] = useState<SplitMode>('each')
  const [splitRanges, setSplitRanges] = useState('1-3, 5, 7-9')
  // 旋转参数
  const [rotateDegree, setRotateDegree] = useState<90 | 180 | 270>(90)
  // 加密 / 解密参数
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!tool) {
      setFiles([]); setPageCount(null); setResultBlob(null); setWorking(false)
      setPassword(''); setConfirmPassword('')
    }
  }, [tool])

  // 单文件场景下读取页数
  useEffect(() => {
    if ((tool === 'split' || tool === 'rotate') && files[0]) {
      getPdfPageCount(files[0])
        .then(setPageCount)
        .catch(() => { setPageCount(null); toast.error('PDF 解析失败') })
    } else {
      setPageCount(null)
    }
  }, [tool, files])

  const addFiles = useCallback((picked: File[]) => {
    const valid = picked.filter(f => {
      if (getFileExtension(f.name) !== 'pdf') {
        toast.error('只能上传 PDF', { description: f.name })
        return false
      }
      if (f.size > 100 * 1024 * 1024) {
        toast.error('PDF 单个不能超过 100 MB', { description: f.name })
        return false
      }
      return true
    })
    if (valid.length === 0) return
    if (tool === 'merge' || tool === 'encrypt' || tool === 'decrypt') {
      setFiles(prev => [...prev, ...valid])
    } else {
      setFiles([valid[0]])
    }
    setResultBlob(null)
  }, [tool])

  const handlePick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.multiple = tool === 'merge' || tool === 'encrypt' || tool === 'decrypt'
    input.onchange = (e) => {
      const picked = Array.from((e.target as HTMLInputElement).files || [])
      if (picked.length > 0) addFiles(picked)
    }
    input.click()
  }, [tool, addFiles])

  const removeAt = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setResultBlob(null)
  }
  const moveUp = (idx: number) => {
    if (idx === 0) return
    setFiles(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
    setResultBlob(null)
  }
  const moveDown = (idx: number) => {
    setFiles(prev => {
      if (idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
    setResultBlob(null)
  }

  const handleApply = useCallback(async () => {
    if (!tool || files.length === 0) return
    setWorking(true)
    try {
      let blob: Blob
      switch (tool) {
        case 'merge':
          blob = await mergePdfs(files)
          break
        case 'split':
          blob = await splitPdf(files[0], splitMode, splitRanges)
          break
        case 'rotate':
          blob = await rotatePdf(files[0], rotateDegree)
          break
        case 'encrypt':
          if (password.length < 1) throw new Error('请输入 PDF 打开密码')
          if (password !== confirmPassword) throw new Error('两次输入的密码不一致')
          if (files.length === 1) {
            blob = await securePdf(files[0], 'encrypt', password)
          } else {
            const zip = new JSZip()
            for (const file of files) {
              const encrypted = await securePdf(file, 'encrypt', password)
              zip.file(`${file.name.replace(/\.pdf$/i, '')}_encrypted.pdf`, encrypted)
            }
            blob = await zip.generateAsync({ type: 'blob' })
          }
          break
        case 'decrypt':
          if (password.length < 1) throw new Error('请输入 PDF 密码')
          if (files.length === 1) {
            blob = await securePdf(files[0], 'decrypt', password)
          } else {
            const zip = new JSZip()
            for (const file of files) {
              const decrypted = await securePdf(file, 'decrypt', password)
              zip.file(`${file.name.replace(/\.pdf$/i, '')}_decrypted.pdf`, decrypted)
            }
            blob = await zip.generateAsync({ type: 'blob' })
          }
          break
      }
      setResultBlob(blob)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '处理失败')
    } finally {
      setWorking(false)
    }
  }, [tool, files, splitMode, splitRanges, rotateDegree, password, confirmPassword])

  const handleDownload = useCallback(() => {
    if (!resultBlob || !tool) return
    const base = files[0]?.name.replace(/\.pdf$/i, '') || 'output'
    const isZip = resultBlob.type === 'application/zip' || files.length > 1
    const suffix: Record<PdfToolId, string> = {
      merge: 'merge',
      split: 'split',
      rotate: 'rotate',
      encrypt: 'encrypted',
      decrypt: 'decrypted',
    }
    const name = isZip ? `${base}_${suffix[tool]}.zip` : `${base}_${suffix[tool]}.pdf`
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [resultBlob, files, tool])

  const title = tool ? TITLES[tool] : ''
  const description = tool ? DESCRIPTIONS[tool] : ''
  const canApply =
    tool === 'merge' ? files.length >= 2 :
    tool === 'encrypt' ? files.length >= 1 && password.length > 0 && password === confirmPassword :
    tool === 'decrypt' ? files.length >= 1 && password.length > 0 :
    tool ? files.length === 1 : false

  return (
    <Dialog open={tool !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 上传 */}
          <button
            onClick={handlePick}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 py-8 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
          >
            <Upload className="h-7 w-7" />
            <span>
              {tool === 'merge'
                ? '点击添加多个 PDF（至少 2 个）'
                : tool === 'encrypt' || tool === 'decrypt'
                  ? '点击添加一个或多个 PDF'
                  : '点击选择 PDF'}
            </span>
            <span className="text-xs">仅支持 .pdf，单文件 ≤ 100MB</span>
          </button>

          {/* 文件列表 */}
          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((f, idx) => (
                <li key={idx} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-red-500 text-[10px] text-white">PDF</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                  </div>
                  {tool === 'merge' && (
                    <>
                      <button onClick={() => moveUp(idx)} className="text-muted-foreground hover:text-foreground" title="上移">
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => moveDown(idx)} className="text-muted-foreground hover:text-foreground" title="下移">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => removeAt(idx)} className="text-muted-foreground hover:text-destructive" title="移除">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {pageCount !== null && (
                <li className="text-xs text-muted-foreground">共 {pageCount} 页</li>
              )}
            </ul>
          )}

          {/* 拆分参数 */}
          {tool === 'split' && files.length === 1 && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <Label>拆分方式</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSplitMode('each')}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm",
                    splitMode === 'each' ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
                  )}
                >
                  每页一个
                </button>
                <button
                  onClick={() => setSplitMode('ranges')}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm",
                    splitMode === 'ranges' ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
                  )}
                >
                  指定范围
                </button>
              </div>
              {splitMode === 'ranges' && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={splitRanges}
                    onChange={(e) => setSplitRanges(e.target.value)}
                    placeholder="例如：1-3, 5, 7-9"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">用逗号分隔；每段会生成独立的 PDF</p>
                </div>
              )}
            </div>
          )}

          {/* 旋转参数 */}
          {tool === 'rotate' && files.length === 1 && (
            <div className="space-y-2 rounded-md border border-border p-3">
              <Label>旋转角度（所有页）</Label>
              <div className="flex gap-2">
                {([90, 180, 270] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setRotateDegree(d)}
                    className={cn(
                      "flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm",
                      rotateDegree === d ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
                    )}
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    {d}°
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 加密 / 解密参数 */}
          {(tool === 'encrypt' || tool === 'decrypt') && files.length >= 1 && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="space-y-1">
                <Label htmlFor="pdf-password">
                  {tool === 'encrypt' ? '设置打开密码' : '输入 PDF 密码'}
                </Label>
                <input
                  id="pdf-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setResultBlob(null)
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  autoComplete="new-password"
                />
              </div>

              {tool === 'encrypt' && (
                <div className="space-y-1">
                  <Label htmlFor="pdf-password-confirm">确认密码</Label>
                  <input
                    id="pdf-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setResultBlob(null)
                    }}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    autoComplete="new-password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">两次输入的密码不一致</p>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {tool === 'encrypt'
                  ? files.length > 1
                    ? '多个 PDF 会依次加密并打包为 ZIP，请妥善保存密码。'
                    : '加密后的 PDF 需要输入密码才能打开，请妥善保存密码。'
                  : files.length > 1
                    ? '多个 PDF 会依次解密并打包为 ZIP，不会修改原文件。'
                    : '解密只会生成新的 PDF 文件，不会修改原文件。'}
              </p>
            </div>
          )}

          {/* 操作 */}
          {files.length > 0 && (
            <div className="flex justify-end gap-2">
              <button
                onClick={handleApply}
                disabled={!canApply || working}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {working && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {working ? '处理中...' : '应用'}
              </button>
            </div>
          )}

          {/* 结果 */}
          {resultBlob && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
              <div className="text-sm">
                <span className="font-medium">处理完成</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatFileSize(resultBlob.size)}
                </span>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-3.5 w-3.5" />
                下载
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
