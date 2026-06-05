// 纯客户端图片处理工具（Canvas）

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export type OutputFormat = 'jpg' | 'png' | 'webp'

async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality?: number): Promise<Blob> {
  const mime = MIME_MAP[format] || 'image/png'
  const q = (format === 'jpg' || format === 'webp') ? quality : undefined
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas 导出失败'))),
      mime,
      q,
    )
  })
}

// ---------- 压缩 ----------

export interface CompressOptions {
  quality: number   // 0.1 - 1.0
  format: OutputFormat
}

export async function compressImage(file: File, opts: CompressOptions): Promise<Blob> {
  const img = await fileToImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 上下文创建失败')
  ctx.drawImage(img, 0, 0)
  return canvasToBlob(canvas, opts.format, opts.quality)
}

// ---------- 缩放 ----------

export interface ResizeOptions {
  width: number
  height: number
  format: OutputFormat
  quality?: number
}

export async function resizeImage(file: File, opts: ResizeOptions): Promise<Blob> {
  const img = await fileToImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(opts.width))
  canvas.height = Math.max(1, Math.round(opts.height))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 上下文创建失败')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvasToBlob(canvas, opts.format, opts.quality ?? 0.92)
}

// ---------- 裁剪 ----------

export interface CropOptions {
  /** 源图自然像素坐标 */
  x: number
  y: number
  width: number
  height: number
  format: OutputFormat
  quality?: number
}

export async function cropImage(file: File, opts: CropOptions): Promise<Blob> {
  const img = await fileToImage(file)
  const sx = Math.max(0, Math.round(opts.x))
  const sy = Math.max(0, Math.round(opts.y))
  const sw = Math.max(1, Math.min(Math.round(opts.width), img.naturalWidth - sx))
  const sh = Math.max(1, Math.min(Math.round(opts.height), img.naturalHeight - sy))

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 上下文创建失败')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvasToBlob(canvas, opts.format, opts.quality ?? 0.92)
}

// ---------- 旋转 ----------

export interface RotateOptions {
  /** 顺时针角度，任意数值，常用 90 / 180 / 270 */
  degrees: number
  format: OutputFormat
  quality?: number
}

export async function rotateImage(file: File, opts: RotateOptions): Promise<Blob> {
  const img = await fileToImage(file)
  const rad = (opts.degrees * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const w = img.naturalWidth
  const h = img.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * cos + h * sin)
  canvas.height = Math.round(w * sin + h * cos)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 上下文创建失败')

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -w / 2, -h / 2)

  return canvasToBlob(canvas, opts.format, opts.quality ?? 0.92)
}

// ---------- 水印 ----------

export type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile'

export interface WatermarkOptions {
  text: string
  position: WatermarkPosition
  opacity: number    // 0-1
  fontSize: number   // px
  color: string      // hex
  format: OutputFormat
  quality?: number
}

export async function watermarkImage(file: File, opts: WatermarkOptions): Promise<Blob> {
  const img = await fileToImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 上下文创建失败')

  ctx.drawImage(img, 0, 0)

  const fontSize = Math.max(opts.fontSize, 12)
  ctx.font = `bold ${fontSize}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.fillStyle = opts.color || '#ffffff'
  ctx.globalAlpha = Math.max(0.05, Math.min(1, opts.opacity))

  const text = opts.text || '水印'
  const metrics = ctx.measureText(text)
  const tw = metrics.width
  const th = fontSize
  const w = canvas.width
  const h = canvas.height
  const pad = Math.max(20, fontSize)

  if (opts.position === 'tile') {
    ctx.save()
    ctx.translate(w / 2, h / 2)
    ctx.rotate(-Math.PI / 6)
    const stepX = tw + fontSize * 4
    const stepY = th + fontSize * 3
    for (let y = -h; y < h + stepY; y += stepY) {
      for (let x = -w; x < w + stepX; x += stepX) {
        ctx.fillText(text, x - tw / 2, y)
      }
    }
    ctx.restore()
  } else {
    let x: number, y: number
    switch (opts.position) {
      case 'top-left':     x = pad;          y = pad + th;     break
      case 'top-right':    x = w - tw - pad; y = pad + th;     break
      case 'bottom-left':  x = pad;          y = h - pad;      break
      case 'bottom-right': x = w - tw - pad; y = h - pad;      break
      default:             x = (w - tw) / 2; y = (h + th) / 2; break
    }
    ctx.fillText(text, x, y)
  }

  ctx.globalAlpha = 1
  return canvasToBlob(canvas, opts.format, opts.quality ?? 0.92)
}

// ---------- 工具识别 ----------

export type ImageToolId = 'compress' | 'resize' | 'rotate' | 'crop' | 'watermark'

export function isImageTool(to: string): to is ImageToolId {
  return ['compress', 'resize', 'rotate', 'crop', 'watermark'].includes(to)
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return fileToImage(file).then(img => ({
    width: img.naturalWidth,
    height: img.naturalHeight,
  }))
}
