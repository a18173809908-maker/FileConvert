// 浏览器端 PDF 工具：合并 / 拆分 / 旋转
// pdf-lib 是纯 JS，能在浏览器跑

import { PDFDocument, degrees } from 'pdf-lib'
import JSZip from 'jszip'

export type PdfToolId = 'merge' | 'split' | 'rotate' | 'compress' | 'encrypt' | 'decrypt'

export function isPdfTool(to: string): to is PdfToolId {
  return to === 'merge' || to === 'split' || to === 'rotate' || to === 'compress' || to === 'encrypt' || to === 'decrypt'
}

async function loadPdf(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer()
  return PDFDocument.load(bytes, { ignoreEncryption: true })
}

// ---------- 合并 ----------

export async function mergePdfs(files: File[]): Promise<Blob> {
  if (files.length < 2) throw new Error('合并至少需要 2 个 PDF 文件')

  const merged = await PDFDocument.create()
  for (const file of files) {
    const pdf = await loadPdf(file)
    const pages = await merged.copyPages(pdf, pdf.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }

  const out = await merged.save()
  return new Blob([new Uint8Array(out)], { type: 'application/pdf' })
}

// ---------- 拆分 ----------

export type SplitMode = 'each' | 'ranges'

/**
 * 按页拆分。
 * - mode='each'：每页一个 PDF，打包成 zip
 * - mode='ranges'：按 "1-3,5,7-9" 拆成多个 PDF，打包成 zip
 */
export async function splitPdf(
  file: File,
  mode: SplitMode = 'each',
  ranges?: string,
): Promise<Blob> {
  const src = await loadPdf(file)
  const total = src.getPageCount()

  const groups: number[][] = mode === 'each'
    ? Array.from({ length: total }, (_, i) => [i])
    : parseRanges(ranges || '', total)

  if (groups.length === 0) throw new Error('未指定有效的页码范围')

  const zip = new JSZip()
  const base = file.name.replace(/\.pdf$/i, '')

  for (let i = 0; i < groups.length; i++) {
    const indices = groups[i]
    if (indices.length === 0) continue
    const dst = await PDFDocument.create()
    const pages = await dst.copyPages(src, indices)
    pages.forEach(p => dst.addPage(p))
    const bytes = await dst.save()
    const label = mode === 'each'
      ? `page-${String(indices[0] + 1).padStart(3, '0')}`
      : `part-${i + 1}_pages-${indices[0] + 1}-${indices[indices.length - 1] + 1}`
    zip.file(`${base}_${label}.pdf`, bytes)
  }

  return await zip.generateAsync({ type: 'blob' })
}

/**
 * 把 "1-3,5,7-9" 解析成多个页索引组（0-based）。
 * 越界/非法的跳过。
 */
function parseRanges(input: string, total: number): number[][] {
  const groups: number[][] = []
  for (const seg of input.split(',').map(s => s.trim()).filter(Boolean)) {
    const m = seg.match(/^(\d+)(?:\s*-\s*(\d+))?$/)
    if (!m) continue
    const start = Number(m[1])
    const end = m[2] ? Number(m[2]) : start
    if (start < 1 || end < start) continue
    const indices: number[] = []
    for (let p = start; p <= Math.min(end, total); p++) {
      indices.push(p - 1)
    }
    if (indices.length > 0) groups.push(indices)
  }
  return groups
}

// ---------- 旋转 ----------

/**
 * 旋转所有页面（或指定页面）。degree 必须是 90 倍数。
 */
export async function rotatePdf(
  file: File,
  degree: 90 | 180 | 270,
  pageIndices?: number[],
): Promise<Blob> {
  const pdf = await loadPdf(file)
  const targets = pageIndices ?? pdf.getPageIndices()
  for (const i of targets) {
    const page = pdf.getPage(i)
    const current = page.getRotation().angle
    page.setRotation(degrees((current + degree) % 360))
  }
  const out = await pdf.save()
  return new Blob([new Uint8Array(out)], { type: 'application/pdf' })
}

// ---------- 页数读取 ----------

export async function getPdfPageCount(file: File): Promise<number> {
  const pdf = await loadPdf(file)
  return pdf.getPageCount()
}

// ---------- 加密 / 解密 ----------

export async function securePdf(
  file: File,
  action: 'encrypt' | 'decrypt',
  password: string,
): Promise<Blob> {
  const form = new FormData()
  form.append('file', file)
  form.append('action', action)
  form.append('password', password)

  const res = await fetch('/api/pdf/security', { method: 'POST', body: form })
  if (!res.ok) {
    let message = action === 'encrypt' ? 'PDF 加密失败' : 'PDF 解密失败'
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {}
    throw new Error(message)
  }
  return await res.blob()
}

export async function compressPdf(file: File): Promise<Blob> {
  const form = new FormData()
  form.append('file', file)
  form.append('action', 'compress')

  const res = await fetch('/api/pdf/security', { method: 'POST', body: form })
  if (!res.ok) {
    let message = 'PDF 压缩失败'
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {}
    throw new Error(message)
  }
  return await res.blob()
}
