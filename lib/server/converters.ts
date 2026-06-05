import 'server-only'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import mammoth from 'mammoth'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import sharp from 'sharp'
import { extractText, getDocumentProxy } from 'unpdf'
import * as XLSX from 'xlsx'
import { marked } from 'marked'
import { convertWithLibreOffice } from './libreoffice'
import { convertPdfToDocx } from './pdf-to-docx'
import { adobeExportPdf, adobeCreatePdf, isAdobeConfigured } from './adobe-pdf'
import { canConvertServer as canConvertServerShared, isHeavyConversion as isHeavyShared } from '@/lib/conversion-config'

export interface ConvertResult {
  buffer: Buffer
  mimeType: string
}

// 直接复用 lib/conversion-config.ts 的单一事实来源
export const canConvertServer = canConvertServerShared
export const isHeavyConversion = isHeavyShared

// ---------- TXT 系列 ----------

// 防爆上限：单次 TXT→PDF 的字符数和生成页数
const TXT_TO_PDF_MAX_CHARS = 500_000   // ~500KB ASCII，约 1000 页 PDF
const TXT_TO_PDF_MAX_PAGES = 1000

async function txtToPdf(input: Buffer): Promise<ConvertResult> {
  let text = input.toString('utf-8')
  if (text.length > TXT_TO_PDF_MAX_CHARS) {
    throw new Error(`文本过长（${text.length} 字符），单次 TXT→PDF 上限 ${TXT_TO_PDF_MAX_CHARS} 字符`)
  }
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontSize = 11
  const lineHeight = fontSize * 1.4
  const pageWidth = 595.28
  const pageHeight = 841.89
  const margin = 50
  const usableWidth = pageWidth - margin * 2

  // 按字符宽度软换行
  const wrap = (line: string): string[] => {
    if (line === '') return ['']
    const out: string[] = []
    let cur = ''
    for (const ch of line) {
      const test = cur + ch
      const w = font.widthOfTextAtSize(test, fontSize)
      if (w > usableWidth && cur.length > 0) {
        out.push(cur)
        cur = ch
      } else {
        cur = test
      }
    }
    if (cur) out.push(cur)
    return out
  }

  // 替换 pdf-lib 标准字体不支持的字符（如中文）为占位符
  const sanitize = (s: string): string => s.replace(/[^\x00-\x7F]/g, '?')

  const rawLines = sanitize(text).split(/\r?\n/)
  const lines = rawLines.flatMap(wrap)

  let page = pdf.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin
  let pageCount = 1
  for (const line of lines) {
    if (y < margin) {
      pageCount++
      if (pageCount > TXT_TO_PDF_MAX_PAGES) {
        throw new Error(`生成页数超过上限 ${TXT_TO_PDF_MAX_PAGES} 页`)
      }
      page = pdf.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) })
    y -= lineHeight
  }

  const bytes = await pdf.save()
  return { buffer: Buffer.from(bytes), mimeType: 'application/pdf' }
}

async function txtToDocx(input: Buffer): Promise<ConvertResult> {
  const text = input.toString('utf-8')
  const paragraphs = text.split(/\r?\n/).map(line =>
    new Paragraph({ children: [new TextRun(line)] })
  )
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const buffer = await Packer.toBuffer(doc)
  return {
    buffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
}

// ---------- DOCX → TXT ----------

async function docxToTxt(input: Buffer): Promise<ConvertResult> {
  const { value } = await mammoth.extractRawText({ buffer: input })
  return { buffer: Buffer.from(value, 'utf-8'), mimeType: 'text/plain; charset=utf-8' }
}

// ---------- PDF → TXT ----------

async function pdfToTxt(input: Buffer): Promise<ConvertResult> {
  const pdf = await getDocumentProxy(new Uint8Array(input))
  const { text } = await extractText(pdf, { mergePages: true })
  const out = Array.isArray(text) ? text.join('\n') : text
  return { buffer: Buffer.from(out, 'utf-8'), mimeType: 'text/plain; charset=utf-8' }
}

// ---------- 图片 → PDF ----------

async function imageToPdf(input: Buffer, from: string): Promise<ConvertResult> {
  const pdf = await PDFDocument.create()

  // png/jpg pdf-lib 原生支持；webp 等先用 sharp 转 png
  let embedded
  if (from === 'png') {
    embedded = await pdf.embedPng(input)
  } else if (from === 'jpg' || from === 'jpeg') {
    embedded = await pdf.embedJpg(input)
  } else {
    const png = await sharp(input).png().toBuffer()
    embedded = await pdf.embedPng(png)
  }

  const { width, height } = embedded.scale(1)
  const page = pdf.addPage([width, height])
  page.drawImage(embedded, { x: 0, y: 0, width, height })

  const bytes = await pdf.save()
  return { buffer: Buffer.from(bytes), mimeType: 'application/pdf' }
}

// ---------- sharp 图片转换 ----------

async function imageViaSharp(input: Buffer, to: string): Promise<ConvertResult> {
  let pipeline = sharp(input)
  let mime = 'image/png'
  switch (to) {
    case 'png': pipeline = pipeline.png(); mime = 'image/png'; break
    case 'jpg':
    case 'jpeg': pipeline = pipeline.jpeg({ quality: 92 }); mime = 'image/jpeg'; break
    case 'webp': pipeline = pipeline.webp({ quality: 92 }); mime = 'image/webp'; break
    default:
      throw new Error(`sharp 不支持输出格式: ${to}`)
  }
  const buffer = await pipeline.toBuffer()
  return { buffer, mimeType: mime }
}

// ---------- HEIC / HEIF → 图片 ----------

async function heicToImage(input: Buffer, to: string): Promise<ConvertResult> {
  let pipeline = sharp(input)
  let mime: string
  switch (to) {
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: 92 })
      mime = 'image/jpeg'
      break
    case 'png':
      pipeline = pipeline.png()
      mime = 'image/png'
      break
    default:
      throw new Error(`HEIC 不支持输出格式: ${to}`)
  }
  const buffer = await pipeline.toBuffer()
  return { buffer, mimeType: mime }
}

// ---------- CSV ↔ Excel ----------

async function csvToXlsx(input: Buffer): Promise<ConvertResult> {
  const wb = XLSX.read(input.toString('utf-8'), { type: 'string' })
  const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as ArrayBuffer)
  return {
    buffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
}

async function xlsxToCsv(input: Buffer): Promise<ConvertResult> {
  const wb = XLSX.read(input, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const csv = XLSX.utils.sheet_to_csv(ws)
  return { buffer: Buffer.from(csv, 'utf-8'), mimeType: 'text/csv; charset=utf-8' }
}

// ---------- Markdown → HTML / PDF ----------

async function mdToHtml(input: Buffer): Promise<ConvertResult> {
  const md = input.toString('utf-8')
  const body = await marked(md)
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;color:#333}
  h1,h2,h3{border-bottom:1px solid #eee;padding-bottom:.3em}
  code{background:#f4f4f4;padding:2px 6px;border-radius:3px;font-size:.9em}
  pre code{display:block;padding:16px;overflow-x:auto;background:#f6f8fa;border-radius:6px}
  blockquote{border-left:4px solid #ddd;margin:0;padding-left:16px;color:#666}
  img{max-width:100%}
  table{border-collapse:collapse;width:100%}
  td,th{border:1px solid #ddd;padding:8px 12px;text-align:left}
  th{background:#f6f8fa}
  a{color:#0366d6}
</style>
</head>
<body>${body}</body>
</html>`
  return { buffer: Buffer.from(html, 'utf-8'), mimeType: 'text/html; charset=utf-8' }
}

async function mdToPdf(input: Buffer): Promise<ConvertResult> {
  const { buffer: htmlBuf } = await mdToHtml(input)
  return viaLibreOffice(htmlBuf, 'html', 'pdf', 'application/pdf')
}

// ---------- LibreOffice 转换 ----------

async function viaLibreOffice(input: Buffer, fromExt: string, targetExt: string, mimeType: string): Promise<ConvertResult> {
  const buffer = await convertWithLibreOffice(input, fromExt, targetExt)
  return { buffer, mimeType }
}

// ---------- 调度 ----------

export async function convertOnServer(
  input: Buffer,
  from: string,
  to: string,
): Promise<ConvertResult> {
  const f = from.toLowerCase()
  const t = to.toLowerCase()

  if (!canConvertServer(f, t)) {
    throw new Error(`不支持的转换: ${f} → ${t}`)
  }

  // 轻量级
  if (f === 'txt' && t === 'pdf') return txtToPdf(input)
  if (f === 'txt' && t === 'docx') return txtToDocx(input)
  if (f === 'docx' && t === 'txt') return docxToTxt(input)
  if (f === 'pdf' && t === 'txt') return pdfToTxt(input)
  if (t === 'pdf' && ['jpg', 'jpeg', 'png', 'webp'].includes(f)) return imageToPdf(input, f)
  if (['svg', 'bmp', 'gif'].includes(f) && ['png', 'jpg', 'jpeg', 'webp'].includes(t)) {
    return imageViaSharp(input, t)
  }
  // HEIC / HEIF
  if ((f === 'heic' || f === 'heif') && ['jpg', 'jpeg', 'png'].includes(t)) return heicToImage(input, t)
  // CSV ↔ Excel
  if (f === 'csv' && (t === 'xlsx' || t === 'xls')) return csvToXlsx(input)
  if ((f === 'xlsx' || f === 'xls') && t === 'csv') return xlsxToCsv(input)
  // Markdown
  if ((f === 'md' || f === 'markdown') && t === 'html') return mdToHtml(input)
  if ((f === 'md' || f === 'markdown') && t === 'pdf') return mdToPdf(input)

  // 重型（LibreOffice）
  const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const docMime = 'application/msword'
  const pdfMime = 'application/pdf'

  if ((f === 'docx' || f === 'doc') && t === 'pdf') return viaLibreOffice(input, f, 'pdf', pdfMime)
  if (f === 'doc' && t === 'docx') return viaLibreOffice(input, 'doc', 'docx', docxMime)
  if (f === 'docx' && t === 'doc') return viaLibreOffice(input, 'docx', 'doc', docMime)
  if ((f === 'html' || f === 'htm') && t === 'pdf') return viaLibreOffice(input, f, 'pdf', pdfMime)
  if (f === 'epub' && t === 'pdf') return viaLibreOffice(input, 'epub', 'pdf', pdfMime)

  // PDF → DOCX：Adobe 优先 + pdf2docx 兜底
  if (f === 'pdf' && t === 'docx') {
    const { buffer } = await convertPdfToDocx(input)
    return { buffer, mimeType: docxMime }
  }

  // PDF → XLSX / PPTX：只能走 Adobe（没有合适的开源替代）
  if (f === 'pdf' && (t === 'xlsx' || t === 'pptx')) {
    if (!isAdobeConfigured()) {
      throw new Error(`PDF → ${t.toUpperCase()} 需要 Adobe 服务，当前未配置，请联系管理员`)
    }
    const xlsxMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    const pptxMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    const buffer = await adobeExportPdf(input, t)
    return { buffer, mimeType: t === 'xlsx' ? xlsxMime : pptxMime }
  }

  // XLSX / PPTX → PDF：Adobe CreatePDF（LibreOffice 也能做但保真度差）
  if ((f === 'xlsx' || f === 'xls' || f === 'pptx' || f === 'ppt') && t === 'pdf') {
    if (isAdobeConfigured()) {
      const buffer = await adobeCreatePdf(input, f as 'xlsx' | 'xls' | 'pptx' | 'ppt')
      return { buffer, mimeType: pdfMime }
    }
    // Adobe 没配，兜底 LibreOffice（LibreOffice 也能转这些）
    return viaLibreOffice(input, f, 'pdf', pdfMime)
  }

  throw new Error(`未实现的转换: ${f} → ${t}`)
}
