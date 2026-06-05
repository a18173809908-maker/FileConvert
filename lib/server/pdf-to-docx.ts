import 'server-only'
import { adobeExportPdf, isAdobeConfigured, AdobeQuotaError } from './adobe-pdf'
import { pdf2docx } from './pdf2docx'

export interface PdfToDocxResult {
  buffer: Buffer
  engine: 'adobe' | 'pdf2docx'
}

/**
 * PDF → DOCX 调度：
 * 1) Adobe 配置好 → 走 Adobe（95%+ 质量，自带 OCR）
 * 2) Adobe 任何错误（含额度超限）→ 兜底走容器内 pdf2docx（75% 质量，无 OCR）
 */
export async function convertPdfToDocx(input: Buffer): Promise<PdfToDocxResult> {
  if (isAdobeConfigured()) {
    try {
      const buffer = await adobeExportPdf(input, 'docx')
      return { buffer, engine: 'adobe' }
    } catch (err) {
      const quota = err instanceof AdobeQuotaError
      console.warn(
        `[pdf-to-docx] Adobe 失败，兜底 pdf2docx${quota ? '（额度超限）' : ''}:`,
        err instanceof Error ? err.message : err,
      )
    }
  }
  const buffer = await pdf2docx(input)
  return { buffer, engine: 'pdf2docx' }
}
