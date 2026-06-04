// 浏览器端 PDF → 图片：动态加载 pdfjs，避免 SSR 阶段引用 DOMMatrix 等浏览器 API
import JSZip from 'jszip'

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

async function loadPdfjs() {
  if (typeof window === 'undefined') {
    throw new Error('pdfjs 只能在浏览器环境运行')
  }
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((mod) => {
      mod.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`
      return mod
    })
  }
  return pdfjsPromise
}

export async function pdfToImageBlob(
  file: File,
  format: 'jpg' | 'jpeg' | 'png',
  scale = 2,
): Promise<Blob> {
  const pdfjsLib = await loadPdfjs()
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise

  const ext = format === 'png' ? 'png' : 'jpg'
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
  const quality = ext === 'jpg' ? 0.92 : undefined

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
          quality,
        )
      })
      blobs.push(blob)
      page.cleanup()
    }
  } finally {
    await pdf.cleanup()
  }

  if (blobs.length === 1) return blobs[0]

  const zip = new JSZip()
  blobs.forEach((b, idx) => zip.file(`page-${String(idx + 1).padStart(3, '0')}.${ext}`, b))
  return await zip.generateAsync({ type: 'blob' })
}
