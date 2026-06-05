import 'server-only'
import { adobeExportPdf, isAdobeConfigured } from './adobe-pdf'
import { pdf2docx } from './pdf2docx'

export interface PdfToDocxResult {
  buffer: Buffer
  engine: 'adobe' | 'pdf2docx'
}

/**
 * PDF → DOCX 调度：
 * 1) Adobe 配置好 → 走 Adobe（95%+ 质量，自带 OCR）
 * 2) Adobe 失败 → 直接返回可读错误，避免再用低质量兜底拖到代理超时
 * 3) 未配置 Adobe → 走容器内 pdf2docx（75% 质量，无 OCR）
 */
export async function convertPdfToDocx(input: Buffer): Promise<PdfToDocxResult> {
  if (isAdobeConfigured()) {
    try {
      const buffer = await adobeExportPdf(input, 'docx')
      return { buffer, engine: 'adobe' }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn('[pdf-to-docx] Adobe 转换失败，未启用 pdf2docx 兜底:', message)
      throw new Error(`Adobe PDF 转 Word 失败：${message}`)
    }
  }
  const buffer = await pdf2docx(input)
  return { buffer, engine: 'pdf2docx' }
}
