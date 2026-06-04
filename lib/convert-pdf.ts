// 浏览器端 PDF → 图片：动态加载 pdfjs，避免 SSR 阶段引用 DOMMatrix 等浏览器 API
import JSZip from 'jszip'

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

// 老浏览器（Chrome<140 等）没有 Uint8Array.toHex/fromHex，但 pdfjs v6 会用，主线程也要 polyfill
function applyPolyfills() {
  if (typeof Uint8Array === 'undefined') return
  const proto = Uint8Array.prototype as Uint8Array & { toHex?: () => string }
  if (!proto.toHex) {
    proto.toHex = function (this: Uint8Array) {
      let out = ''
      for (let i = 0; i < this.length; i++) out += this[i].toString(16).padStart(2, '0')
      return out
    }
  }
  const ctor = Uint8Array as unknown as { fromHex?: (s: string) => Uint8Array }
  if (!ctor.fromHex) {
    ctor.fromHex = function (s: string) {
      const len = s.length / 2
      const buf = new Uint8Array(len)
      for (let i = 0; i < len; i++) buf[i] = parseInt(s.substr(i * 2, 2), 16)
      return buf
    }
  }
}

async function loadPdfjs() {
  if (typeof window === 'undefined') {
    throw new Error('pdfjs 只能在浏览器环境运行')
  }
  if (!pdfjsPromise) {
    applyPolyfills()
    pdfjsPromise = import('pdfjs-dist').then((mod) => {
      // worker 由 scripts/copy-pdf-worker.mjs 在构建前复制到 /public（含 polyfill）
      mod.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      return mod
    })
  }
  return pdfjsPromise
}

export interface PdfToImageOptions {
  scale?: number
  quality?: number
  /** 每渲染完一页回调一次 (currentPage, totalPages) */
  onProgress?: (current: number, total: number) => void
}

export async function pdfToImageBlob(
  file: File,
  format: 'jpg' | 'jpeg' | 'png',
  options: PdfToImageOptions = {},
): Promise<Blob> {
  const { scale = 2, quality = 0.92, onProgress } = options

  const pdfjsLib = await loadPdfjs()
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise

  const ext = format === 'png' ? 'png' : 'jpg'
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
  const q = ext === 'jpg' ? quality : undefined

  const blobs: Blob[] = []
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 上下文创建失败')

      await page.render({ canvas, canvasContext: ctx, viewport }).promise

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas 导出失败'))),
          mime,
          q,
        )
      })
      blobs.push(blob)
      page.cleanup()
      onProgress?.(i, pdf.numPages)
    }
  } finally {
    await pdf.cleanup()
  }

  if (blobs.length === 1) return blobs[0]

  const zip = new JSZip()
  blobs.forEach((b, idx) => zip.file(`page-${String(idx + 1).padStart(3, '0')}.${ext}`, b))
  return await zip.generateAsync({ type: 'blob' })
}
