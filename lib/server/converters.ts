import 'server-only'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import mammoth from 'mammoth'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import sharp from 'sharp'
import { extractText, getDocumentProxy } from 'unpdf'
import { convertWithLibreOffice } from './libreoffice'
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

  // 重型（LibreOffice）
  const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const docMime = 'application/msword'
  const pdfMime = 'application/pdf'

  if ((f === 'docx' || f === 'doc') && t === 'pdf') return viaLibreOffice(input, f, 'pdf', pdfMime)
  if (f === 'doc' && t === 'docx') return viaLibreOffice(input, 'doc', 'docx', docxMime)
  if (f === 'docx' && t === 'doc') return viaLibreOffice(input, 'docx', 'doc', docMime)
  if ((f === 'html' || f === 'htm') && t === 'pdf') return viaLibreOffice(input, f, 'pdf', pdfMime)
  if (f === 'epub' && t === 'pdf') return viaLibreOffice(input, 'epub', 'pdf', pdfMime)

  throw new Error(`未实现的转换: ${f} → ${t}`)
}
