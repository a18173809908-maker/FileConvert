import { pdfToImageBlob, PdfToImageOptions } from './convert-pdf'
import { readSettingsSnapshot } from './store'
import { canConvertClient, canConvertServer } from './conversion-config'

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export function canConvert(from: string, to: string): boolean {
  return canConvertClient(from, to) || canConvertServer(from, to)
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

function imageToBlob(img: HTMLImageElement, format: string, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return Promise.reject(new Error('Canvas 上下文创建失败'))
  }
  ctx.drawImage(img, 0, 0)

  const mimeType = MIME_MAP[format] || 'image/png'
  const q = (format === 'jpg' || format === 'jpeg' || format === 'webp') ? quality : undefined

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('图片转换失败'))
      },
      mimeType,
      q,
    )
  })
}

async function postConvert(file: File, toFormat: string): Promise<Response> {
  const form = new FormData()
  form.append('file', file)
  form.append('to', toFormat)
  return fetch('/api/convert', { method: 'POST', body: form })
}

async function convertViaServer(file: File, toFormat: string): Promise<Blob> {
  let res = await postConvert(file, toFormat)

  // 429 / 503：按 Retry-After 等待后自动重试一次
  if (res.status === 429 || res.status === 503) {
    const retryAfter = Number(res.headers.get('Retry-After')) || 5
    await new Promise(r => setTimeout(r, Math.min(retryAfter, 15) * 1000))
    res = await postConvert(file, toFormat)
  }

  if (!res.ok) {
    let message = `服务端转换失败 (${res.status})`
    if (res.status === 429) message = '请求过于频繁，请稍后再试'
    else if (res.status === 503) message = '服务繁忙，请稍后重试'
    else if (res.status === 413) message = '文件超过大小限制'
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {}
    throw new Error(message)
  }
  return await res.blob()
}

export interface ConvertOptions {
  /** PDF → 图片 每页渲染完毕回调 */
  onProgress?: (current: number, total: number) => void
}

/**
 * 统一转换入口：能在浏览器端走 Canvas 的优先本地处理，否则走 /api/convert。
 * 质量/倍数等参数从全局设置读取。
 */
export async function convertFile(
  file: File,
  fromFormat: string,
  toFormat: string,
  options: ConvertOptions = {},
): Promise<Blob> {
  const f = fromFormat.toLowerCase()
  const t = toFormat.toLowerCase()
  const settings = readSettingsSnapshot()

  if (canConvertClient(f, t)) {
    if (f === 'pdf') {
      const pdfOpts: PdfToImageOptions = {
        scale: settings.pdfScale,
        quality: settings.imageQuality,
        onProgress: options.onProgress,
      }
      return pdfToImageBlob(file, t as 'jpg' | 'jpeg' | 'png', pdfOpts)
    }
    const img = await fileToImage(file)
    return imageToBlob(img, t, settings.imageQuality)
  }

  if (canConvertServer(f, t)) {
    return convertViaServer(file, t)
  }

  throw new Error(`暂不支持 ${f.toUpperCase()} → ${t.toUpperCase()}`)
}

// 保留兼容旧调用
export async function convertImage(file: File, toFormat: string): Promise<Blob> {
  const img = await fileToImage(file)
  return imageToBlob(img, toFormat, readSettingsSnapshot().imageQuality)
}

export function getConvertedFileName(originalName: string, toFormat: string, blob?: Blob): string {
  const dotIndex = originalName.lastIndexOf('.')
  const baseName = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName
  const ext = blob?.type === 'application/zip' ? 'zip' : toFormat.toLowerCase()
  return `${baseName}.${ext}`
}
