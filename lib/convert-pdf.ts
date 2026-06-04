// 浏览器端 PDF → 图片，使用 pdfjs 渲染到 Canvas
import * as pdfjsLib from 'pdfjs-dist'
import JSZip from 'jszip'

// pdfjs 的 worker 通过 CDN 加载，避免 Next.js 构建处理 worker 文件
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
}

export async function pdfToImageBlob(
  file: File,
  format: 'jpg' | 'jpeg' | 'png',
  scale = 2,
): Promise<Blob> {
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

  // 多页 PDF：打包成 ZIP
  const zip = new JSZip()
  blobs.forEach((b, idx) => zip.file(`page-${String(idx + 1).padStart(3, '0')}.${ext}`, b))
  return await zip.generateAsync({ type: 'blob' })
}
