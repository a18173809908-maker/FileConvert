// 可读取的图片格式（浏览器 FileReader 支持）
const READABLE_FORMATS = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'])

// 可输出的图片格式（Canvas.toBlob 支持）
const WRITABLE_FORMATS = new Set(['jpg', 'jpeg', 'png', 'webp'])

// Canvas.toBlob 支持的 MIME 类型
const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
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
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('图片转换失败'))
        }
      },
      mimeType,
      quality,
    )
  })
}

/**
 * 检查是否支持在浏览器端转换
 * 可读: jpg/jpeg/png/webp/bmp/gif
 * 可写: jpg/jpeg/png/webp
 * BMP/GIF 只能作为输入，不能作为输出
 */
export function canConvert(from: string, to: string): boolean {
  return READABLE_FORMATS.has(from) && WRITABLE_FORMATS.has(to)
}

export async function convertImage(file: File, toFormat: string): Promise<Blob> {
  if (!WRITABLE_FORMATS.has(toFormat)) {
    throw new Error(`不支持的输出格式: ${toFormat}`)
  }

  const img = await fileToImage(file)
  return imageToBlob(img, toFormat)
}

export function getConvertedFileName(originalName: string, toFormat: string): string {
  const dotIndex = originalName.lastIndexOf('.')
  const baseName = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName
  const ext = toFormat.toLowerCase()
  return `${baseName}.${ext}`
}