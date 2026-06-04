import 'server-only'
import { adobePdfToDocx, isAdobeConfigured } from './adobe-pdf'
import { pdf2docx } from './pdf2docx'

export interface PdfToDocxResult {
  buffer: Buffer
  /** 实际使用的引擎，便于排查质量问题 */
  engine: 'adobe' | 'pdf2docx'
}

/**
 * PDF → DOCX 调度：
 * 1) Adobe 已配置 → 走 Adobe（95%+ 质量，自带 OCR）
 * 2) Adobe 失败 / 未配置 → 兜底走 pdf2docx（75% 质量，无 OCR）
 */
export async function convertPdfToDocx(input: Buffer): Promise<PdfToDocxResult> {
  if (isAdobeConfigured()) {
    try {
      const buffer = await adobePdfToDocx(input)
      return { buffer, engine: 'adobe' }
    } catch (err) {
      console.warn('[pdf-to-docx] Adobe 失败，兜底 pdf2docx:', err instanceof Error ? err.message : err)
    }
  }

  const buffer = await pdf2docx(input)
  return { buffer, engine: 'pdf2docx' }
}
