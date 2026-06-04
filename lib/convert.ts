import { pdfToImageBlob } from './convert-pdf'

// 浏览器端 Canvas 可读的图片格式
const CANVAS_READABLE = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'])
// 浏览器端 Canvas 可写的图片格式
const CANVAS_WRITABLE = new Set(['jpg', 'jpeg', 'png', 'webp'])
// 浏览器端 pdfjs 支持的 PDF → 图片
const PDF_TO_IMAGE = new Set(['jpg', 'jpeg', 'png'])

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

// 服务端额外支持的转换对（与 lib/server/converters.ts 保持同步）
const SERVER_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['txt', 'pdf'],
  ['txt', 'docx'],
  ['docx', 'txt'],
  ['pdf', 'txt'],
  ['jpg', 'pdf'], ['jpeg', 'pdf'], ['png', 'pdf'], ['webp', 'pdf'],
  ['svg', 'png'], ['svg', 'jpg'],
  ['bmp', 'png'], ['bmp', 'jpg'], ['bmp', 'webp'],
  ['gif', 'png'], ['gif', 'jpg'], ['gif', 'webp'],
]

function canConvertClient(from: string, to: string): boolean {
  if (CANVAS_READABLE.has(from) && CANVAS_WRITABLE.has(to)) return true
  if (from === 'pdf' && PDF_TO_IMAGE.has(to)) return true
  return false
}

function canConvertServer(from: string, to: string): boolean {
  const f = from.toLowerCase()
  const t = to.toLowerCase()
  return SERVER_PAIRS.some(([a, b]) => a === f && b === t)
}

/**
 * 是否支持该格式对的转换（浏览器端或服务端任一支持即可）
 */
export function canConvert(from: string, to: string): boolean {
  const f = from.toLowerCase()
  const t = to.toLowerCase()
  return canConvertClient(f, t) || canConvertServer(f, t)
}

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

function imageToBlob(img: HTMLImageElement, format: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return Promise.reject(new Error('Canvas 上下文创建失败'))
  }
  ctx.drawImage(img, 0, 0)

  const mimeType = MIME_MAP[format] || 'image/png'
  const quality = (format === 'jpg' || format === 'jpeg') ? 0.92 : undefined

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('图片转换失败'))
      },
      mimeType,
      quality,
    )
  })
}

async function convertViaServer(file: File, toFormat: string): Promise<Blob> {
  const form = new FormData()
  form.append('file', file)
  form.append('to', toFormat)
  const res = await fetch('/api/convert', { method: 'POST', body: form })
  if (!res.ok) {
    let message = `服务端转换失败 (${res.status})`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {}
    throw new Error(message)
  }
  return await res.blob()
}

/**
 * 统一转换入口：能在浏览器端走 Canvas 的优先本地处理，否则走 /api/convert
 */
export async function convertFile(file: File, fromFormat: string, toFormat: string): Promise<Blob> {
  const f = fromFormat.toLowerCase()
  const t = toFormat.toLowerCase()

  if (canConvertClient(f, t)) {
    if (f === 'pdf') {
      return pdfToImageBlob(file, t as 'jpg' | 'jpeg' | 'png')
    }
    const img = await fileToImage(file)
    return imageToBlob(img, t)
  }

  if (canConvertServer(f, t)) {
    return convertViaServer(file, t)
  }

  throw new Error(`暂不支持 ${f.toUpperCase()} → ${t.toUpperCase()}`)
}

// 兼容旧调用：仅图片转换
export async function convertImage(file: File, toFormat: string): Promise<Blob> {
  const img = await fileToImage(file)
  return imageToBlob(img, toFormat)
}

export function getConvertedFileName(originalName: string, toFormat: string, blob?: Blob): string {
  const dotIndex = originalName.lastIndexOf('.')
  const baseName = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName
  // 多页 PDF→图片 的结果被打包为 ZIP，文件名后缀也要相应改成 .zip
  const ext = blob?.type === 'application/zip'
    ? 'zip'
    : toFormat.toLowerCase()
  return `${baseName}.${ext}`
}
