'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Download, Upload, RotateCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ImageToolId,
  OutputFormat,
  compressImage,
  resizeImage,
  rotateImage,
  cropImage,
  getImageDimensions,
} from '@/lib/image-tools'
import { formatFileSize, getFileExtension, isFileSizeAllowed } from '@/lib/conversion-config'

const TOOL_TITLES: Record<ImageToolId, string> = {
  compress: '图片压缩',
  resize: '图片尺寸调整',
  rotate: '图片旋转',
  crop: '图片裁剪',
}

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.bmp,.gif'

interface ImageToolDialogProps {
  tool: ImageToolId | null
  onClose: () => void
}

export function ImageToolDialog({ tool, onClose }: ImageToolDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  // 工具参数
  const [quality, setQuality] = useState(80)
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)
  const [keepAspect, setKeepAspect] = useState(true)
  const [degrees, setDegrees] = useState(90)
  const [format, setFormat] = useState<OutputFormat>('jpg')

  // 裁剪选区（自然像素坐标）
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  // 重置 dialog 状态
  useEffect(() => {
    if (!tool) {
      setFile(null); setDims(null); setResultBlob(null)
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      setResultUrl(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setWorking(false)
      setQuality(80); setDegrees(90); setFormat('jpg')
      setKeepAspect(true)
      setCrop(null)
    }
  }, [tool])

  // 裁剪工具需要一张原图 URL 来交互
  useEffect(() => {
    if (tool === 'crop' && file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setCrop(null)
      return () => URL.revokeObjectURL(url)
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [tool, file])

  // 选好新文件，读取尺寸 & 重置结果
  useEffect(() => {
    if (!file) { setDims(null); return }
    getImageDimensions(file).then(d => {
      setDims(d)
      setWidth(d.width)
      setHeight(d.height)
    }).catch(() => toast.error('无法读取图片'))
    setResultBlob(null)
    if (resultUrl) { URL.revokeObjectURL(resultUrl); setResultUrl(null) }
  }, [file])

  // 默认输出格式跟随源文件
  useEffect(() => {
    if (file) {
      const ext = getFileExtension(file.name)
      if (ext === 'png' || ext === 'webp') setFormat(ext as OutputFormat)
      else setFormat('jpg')
    }
  }, [file])

  const handleFile = useCallback((f: File) => {
    const ext = getFileExtension(f.name)
    if (!['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'].includes(ext)) {
      toast.error('请上传图片文件', { description: '支持 JPG/PNG/WEBP/BMP/GIF' })
      return
    }
    if (!isFileSizeAllowed(f.size, ext)) {
      toast.error('文件超过大小限制')
      return
    }
    setFile(f)
  }, [])

  const handlePickFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ACCEPTED
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (f) handleFile(f)
    }
    input.click()
  }, [handleFile])

  // 宽高联动
  const handleWidthChange = (v: number) => {
    setWidth(v)
    if (keepAspect && dims) {
      setHeight(Math.max(1, Math.round((v * dims.height) / dims.width)))
    }
  }
  const handleHeightChange = (v: number) => {
    setHeight(v)
    if (keepAspect && dims) {
      setWidth(Math.max(1, Math.round((v * dims.width) / dims.height)))
    }
  }

  const handleApply = useCallback(async () => {
    if (!file || !tool) return
    setWorking(true)
    try {
      let blob: Blob
      switch (tool) {
        case 'compress':
          blob = await compressImage(file, { quality: quality / 100, format })
          break
        case 'resize':
          blob = await resizeImage(file, { width, height, format, quality: quality / 100 })
          break
        case 'rotate':
          blob = await rotateImage(file, { degrees, format, quality: quality / 100 })
          break
        case 'crop':
          if (!crop || crop.w < 1 || crop.h < 1) {
            throw new Error('请先在图片上拖拽选择裁剪区域')
          }
          blob = await cropImage(file, {
            x: crop.x, y: crop.y, width: crop.w, height: crop.h,
            format, quality: quality / 100,
          })
          break
      }
      setResultBlob(blob)
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      setResultUrl(URL.createObjectURL(blob))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '处理失败')
    } finally {
      setWorking(false)
    }
  }, [file, tool, quality, width, height, degrees, format, crop, resultUrl])

  const handleDownload = useCallback(() => {
    if (!resultBlob || !file) return
    const base = file.name.replace(/\.[^.]+$/, '')
    const suffix = tool ?? 'edit'
    const a = document.createElement('a')
    const url = URL.createObjectURL(resultBlob)
    a.href = url
    a.download = `${base}_${suffix}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [resultBlob, file, tool, format])

  const title = tool ? TOOL_TITLES[tool] : ''

  // 裁剪选区交互：mousedown 起始，mousemove 更新，mouseup 结束
  const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setCrop(null)
  }
  const handleCropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !imgRef.current || !dims) return
    const rect = imgRef.current.getBoundingClientRect()
    const cx = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const cy = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    const sx = Math.min(dragStartRef.current.x, cx)
    const sy = Math.min(dragStartRef.current.y, cy)
    const sw = Math.abs(cx - dragStartRef.current.x)
    const sh = Math.abs(cy - dragStartRef.current.y)
    // 显示像素 → 自然像素
    const scale = dims.width / rect.width
    setCrop({
      x: Math.round(sx * scale),
      y: Math.round(sy * scale),
      w: Math.round(sw * scale),
      h: Math.round(sh * scale),
    })
  }
  const handleCropMouseUp = () => { dragStartRef.current = null }

  // 把自然像素坐标换算回当前显示像素，用于绘制选区遮罩
  const cropOverlayStyle = (() => {
    if (!crop || !imgRef.current || !dims) return null
    const rect = imgRef.current.getBoundingClientRect()
    const scale = rect.width / dims.width
    return {
      left: crop.x * scale,
      top: crop.y * scale,
      width: crop.w * scale,
      height: crop.h * scale,
    }
  })()

  return (
    <Dialog open={tool !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>全部在浏览器本地处理，文件不会上传</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
            {/* 上传区 */}
            {!file ? (
              <button
                onClick={handlePickFile}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 py-12 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
              >
                <Upload className="h-8 w-8" />
                <span>点击选择图片</span>
                <span className="text-xs">支持 JPG / PNG / WEBP / BMP / GIF</span>
              </button>
            ) : (
              <div className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                      {dims && ` · ${dims.width} × ${dims.height}`}
                    </p>
                  </div>
                  <button onClick={handlePickFile} className="text-xs text-primary hover:underline">
                    更换
                  </button>
                </div>
              </div>
            )}

            {/* 工具参数 */}
            {file && (
              <>
                {tool === 'compress' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>压缩质量</Label>
                      <span className="text-sm text-muted-foreground">{quality}%</span>
                    </div>
                    <Slider
                      min={10} max={100} step={1}
                      value={[quality]}
                      onValueChange={([v]) => setQuality(v)}
                    />
                  </div>
                )}

                {tool === 'resize' && dims && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">宽度 (px)</Label>
                        <input
                          type="number"
                          min={1}
                          value={width}
                          onChange={(e) => handleWidthChange(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">高度 (px)</Label>
                        <input
                          type="number"
                          min={1}
                          value={height}
                          onChange={(e) => handleHeightChange(Number(e.target.value))}
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={keepAspect}
                        onChange={(e) => setKeepAspect(e.target.checked)}
                      />
                      锁定宽高比
                    </label>
                    <div className="flex gap-2 text-xs">
                      {[0.25, 0.5, 0.75].map(r => (
                        <button
                          key={r}
                          onClick={() => { setWidth(Math.round(dims.width * r)); setHeight(Math.round(dims.height * r)) }}
                          className="rounded border border-border px-2 py-1 hover:bg-accent"
                        >
                          {Math.round(r * 100)}%
                        </button>
                      ))}
                      <button
                        onClick={() => { setWidth(dims.width); setHeight(dims.height) }}
                        className="rounded border border-border px-2 py-1 hover:bg-accent"
                      >
                        原始
                      </button>
                    </div>
                  </div>
                )}

                {tool === 'crop' && previewUrl && (
                  <div className="space-y-2">
                    <Label>在图片上拖拽框选裁剪区域</Label>
                    <div
                      className="relative inline-block max-w-full select-none"
                      onMouseDown={handleCropMouseDown}
                      onMouseMove={handleCropMouseMove}
                      onMouseUp={handleCropMouseUp}
                      onMouseLeave={handleCropMouseUp}
                      style={{ cursor: 'crosshair' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imgRef}
                        src={previewUrl}
                        alt="待裁剪"
                        className="block max-h-80 w-auto"
                        draggable={false}
                      />
                      {cropOverlayStyle && (
                        <div
                          className="pointer-events-none absolute border-2 border-primary bg-primary/10"
                          style={cropOverlayStyle}
                        />
                      )}
                    </div>
                    {crop ? (
                      <p className="text-xs text-muted-foreground">
                        选区：{crop.w} × {crop.h} px（从 {crop.x}, {crop.y} 开始）
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">尚未选择，按住鼠标在图片上拖动</p>
                    )}
                  </div>
                )}

                {tool === 'rotate' && (
                  <div className="space-y-2">
                    <Label>旋转角度</Label>
                    <div className="flex gap-2">
                      {[90, 180, 270].map(d => (
                        <button
                          key={d}
                          onClick={() => setDegrees(d)}
                          className={cn(
                            "flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm",
                            degrees === d
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:bg-accent"
                          )}
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          {d}°
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 输出格式 */}
                <div className="space-y-2">
                  <Label>输出格式</Label>
                  <div className="flex gap-2">
                    {(['jpg', 'png', 'webp'] as OutputFormat[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm uppercase",
                          format === f
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleApply}
                    disabled={working}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {working && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {working ? '处理中...' : '应用'}
                  </button>
                </div>

                {/* 结果预览 */}
                {resultBlob && resultUrl && (
                  <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">处理完成</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatFileSize(resultBlob.size)}
                          {file && ` (原 ${formatFileSize(file.size)})`}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultUrl} alt="预览" className="max-h-64 w-full rounded object-contain" />
                  </div>
                )}
              </>
            )}
          </div>
      </DialogContent>
    </Dialog>
  )
}
