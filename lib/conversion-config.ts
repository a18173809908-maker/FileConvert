// 转换类型配置
export interface ConversionType {
  from: string
  to: string
  label: string
}

// 转换分类配置
export interface ConversionCategory {
  id: string
  name: string
  icon: string
  conversions: ConversionType[]
}

// 文件大小限制 (MB)
export const FILE_SIZE_LIMITS = {
  pdf: 50,
  image: 20,
  epub: 20,
  doc: 20,
  default: 20,
}

// 允许的文件格式
export const ALLOWED_FORMATS = [
  'pdf', 'doc', 'docx', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'html', 'htm',
  'jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg',
  'epub',
  'heic', 'heif',
  'csv',
  'md', 'markdown',
]

// 禁止的文件格式
export const FORBIDDEN_FORMATS = [
  'exe', 'apk', 'iso', 'dmg', 'zip', 'rar', '7z'
]

// 转换分类数据
export const CONVERSION_CATEGORIES: ConversionCategory[] = [
  {
    id: 'pdf',
    name: 'PDF工具',
    icon: 'file-text',
    conversions: [
      { from: 'pdf', to: 'docx', label: 'PDF → Word' },
      { from: 'pdf', to: 'xlsx', label: 'PDF → Excel' },
      { from: 'pdf', to: 'pptx', label: 'PDF → PPT' },
      { from: 'docx', to: 'pdf', label: 'Word → PDF' },
      { from: 'xlsx', to: 'pdf', label: 'Excel → PDF' },
      { from: 'pptx', to: 'pdf', label: 'PPT → PDF' },
      { from: 'pdf', to: 'jpg', label: 'PDF → JPG' },
      { from: 'pdf', to: 'png', label: 'PDF → PNG' },
      { from: 'jpg', to: 'pdf', label: 'JPG → PDF' },
      { from: 'png', to: 'pdf', label: 'PNG → PDF' },
      { from: 'pdf', to: 'txt', label: 'PDF → TXT' },
      { from: 'txt', to: 'pdf', label: 'TXT → PDF' },
      { from: 'pdf', to: 'merge', label: 'PDF 合并' },
      { from: 'pdf', to: 'split', label: 'PDF 拆分' },
      { from: 'pdf', to: 'rotate', label: 'PDF 旋转' },
      { from: 'pdf', to: 'compress', label: 'PDF 压缩' },
      { from: 'pdf', to: 'encrypt', label: 'PDF 加密' },
      { from: 'pdf', to: 'decrypt', label: 'PDF 解密' },
    ]
  },
  {
    id: 'image',
    name: '图片转换',
    icon: 'image',
    conversions: [
      { from: 'jpg', to: 'png', label: 'JPG → PNG' },
      { from: 'png', to: 'jpg', label: 'PNG → JPG' },
      { from: 'jpg', to: 'webp', label: 'JPG → WEBP' },
      { from: 'webp', to: 'jpg', label: 'WEBP → JPG' },
      { from: 'png', to: 'webp', label: 'PNG → WEBP' },
      { from: 'webp', to: 'png', label: 'WEBP → PNG' },
      { from: 'bmp', to: 'jpg', label: 'BMP → JPG' },
      { from: 'bmp', to: 'png', label: 'BMP → PNG' },
      { from: 'gif', to: 'jpg', label: 'GIF → JPG' },
      { from: 'gif', to: 'png', label: 'GIF → PNG' },
      { from: 'heic', to: 'jpg', label: 'HEIC → JPG' },
      { from: 'heic', to: 'png', label: 'HEIC → PNG' },
    ]
  },
  {
    id: 'image-tools',
    name: '图片工具',
    icon: 'settings',
    conversions: [
      { from: 'image', to: 'compress', label: '图片压缩' },
      { from: 'image', to: 'resize', label: '图片尺寸调整' },
      { from: 'image', to: 'crop', label: '图片裁剪' },
      { from: 'image', to: 'rotate', label: '图片旋转' },
      { from: 'image', to: 'watermark', label: '图片加水印' },
    ]
  },
  {
    id: 'spreadsheet',
    name: '表格工具',
    icon: 'table',
    conversions: [
      { from: 'csv', to: 'xlsx', label: 'CSV → Excel' },
      { from: 'xlsx', to: 'csv', label: 'Excel → CSV' },
    ]
  },
  {
    id: 'markdown',
    name: 'Markdown工具',
    icon: 'file-code',
    conversions: [
      { from: 'md', to: 'html', label: 'Markdown → HTML' },
      { from: 'md', to: 'pdf', label: 'Markdown → PDF' },
    ]
  },
  {
    id: 'document',
    name: '文档工具',
    icon: 'file',
    conversions: [
      { from: 'doc', to: 'docx', label: 'DOC → DOCX' },
      { from: 'docx', to: 'doc', label: 'DOCX → DOC' },
      { from: 'html', to: 'pdf', label: 'HTML → PDF' },
    ]
  },
  {
    id: 'svg',
    name: 'SVG工具',
    icon: 'pen-tool',
    conversions: [
      { from: 'svg', to: 'png', label: 'SVG → PNG' },
      { from: 'svg', to: 'jpg', label: 'SVG → JPG' },
    ]
  },
  {
    id: 'ebook',
    name: '电子书工具',
    icon: 'book-open',
    conversions: [
      { from: 'epub', to: 'pdf', label: 'EPUB → PDF' },
    ]
  },
  {
    id: 'dev',
    name: '开发者工具',
    icon: 'code',
    conversions: [
      { from: 'json', to: 'tools', label: 'JSON 格式化 / 校验' },
    ]
  },
]

// 支持的输出格式（用于格式选择器）
export const OUTPUT_FORMATS = ['PDF', 'DOCX', 'JPG', 'PNG', 'WEBP', 'TXT']

// 支持的输入格式标签
export const INPUT_FORMAT_TAGS = ['PDF', 'DOCX', 'DOC', 'XLSX', 'PPTX', 'TXT', 'JPG', 'PNG', 'WEBP', 'GIF', 'SVG']

// 文件状态
export type FileStatus = 'queued' | 'converting' | 'completed' | 'failed'

// 转换队列项
export interface QueueItem {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  fromFormat: string
  toFormat: string
  status: FileStatus
  progress?: number
  downloadUrl?: string
  sourceFile?: File
  resultBlob?: Blob
  errorMessage?: string
}

// ============================================================
// 转换能力清单（单一事实来源 — Single Source of Truth）
// 客户端 / 服务端 / UI 全部从这里读，避免不同地方分别维护导致漂移
// ============================================================

type Pair = readonly [string, string]

/** 浏览器 Canvas 直转（image → image） */
export const CLIENT_CANVAS_PAIRS: ReadonlyArray<Pair> = [
  ['jpg', 'png'], ['jpg', 'webp'], ['jpg', 'jpeg'],
  ['jpeg', 'png'], ['jpeg', 'webp'], ['jpeg', 'jpg'],
  ['png', 'jpg'], ['png', 'jpeg'], ['png', 'webp'],
  ['webp', 'jpg'], ['webp', 'jpeg'], ['webp', 'png'],
  ['bmp', 'jpg'], ['bmp', 'jpeg'], ['bmp', 'png'], ['bmp', 'webp'],
  ['gif', 'jpg'], ['gif', 'jpeg'], ['gif', 'png'], ['gif', 'webp'],
]

/** 浏览器 pdfjs PDF → 图片 */
export const CLIENT_PDFJS_PAIRS: ReadonlyArray<Pair> = [
  ['pdf', 'jpg'], ['pdf', 'jpeg'], ['pdf', 'png'],
]

/** 服务端轻量级（sharp / pdf-lib / mammoth / docx / unpdf / xlsx / marked） */
export const SERVER_LIGHT_PAIRS: ReadonlyArray<Pair> = [
  ['txt', 'pdf'], ['txt', 'docx'],
  ['docx', 'txt'], ['pdf', 'txt'],
  ['jpg', 'pdf'], ['jpeg', 'pdf'], ['png', 'pdf'], ['webp', 'pdf'],
  ['svg', 'png'], ['svg', 'jpg'],
  // HEIC / HEIF（iPhone 照片）
  ['heic', 'jpg'], ['heic', 'png'], ['heif', 'jpg'], ['heif', 'png'],
  // CSV ↔ Excel
  ['csv', 'xlsx'], ['csv', 'xls'], ['xlsx', 'csv'], ['xls', 'csv'],
  // Markdown → HTML
  ['md', 'html'], ['markdown', 'html'],
]

/** 服务端重型（LibreOffice / pdf2docx / Adobe API，独立并发=1） */
export const SERVER_HEAVY_PAIRS: ReadonlyArray<Pair> = [
  ['docx', 'pdf'], ['doc', 'pdf'],
  ['doc', 'docx'], ['docx', 'doc'],
  ['html', 'pdf'], ['htm', 'pdf'],
  ['epub', 'pdf'],
  ['pdf', 'docx'],
  // Adobe Export
  ['pdf', 'xlsx'], ['pdf', 'pptx'],
  // Adobe CreatePDF（兜底 LibreOffice）
  ['xlsx', 'pdf'], ['xls', 'pdf'],
  ['pptx', 'pdf'], ['ppt', 'pdf'],
  // Markdown → PDF（先转 HTML 再走 LibreOffice）
  ['md', 'pdf'], ['markdown', 'pdf'],
]

/** 客户端"伪转换"工具（不是真正的 from→to，是打开 Dialog） */
export const CLIENT_TOOL_PAIRS: ReadonlyArray<Pair> = [
  ['image', 'compress'], ['image', 'resize'], ['image', 'rotate'], ['image', 'crop'],
  ['image', 'watermark'],
  ['pdf', 'merge'], ['pdf', 'split'], ['pdf', 'rotate'], ['pdf', 'compress'], ['pdf', 'encrypt'], ['pdf', 'decrypt'],
  ['json', 'tools'],
]

const matchPair = (list: ReadonlyArray<Pair>, from: string, to: string): boolean => {
  const f = from.toLowerCase()
  const t = to.toLowerCase()
  return list.some(([a, b]) => a === f && b === t)
}

/** 能否直接在浏览器端（Canvas 或 pdfjs）转换 */
export function canConvertClient(from: string, to: string): boolean {
  return matchPair(CLIENT_CANVAS_PAIRS, from, to) || matchPair(CLIENT_PDFJS_PAIRS, from, to)
}

/** 能否走 /api/convert（包含轻型和重型） */
export function canConvertServer(from: string, to: string): boolean {
  return matchPair(SERVER_LIGHT_PAIRS, from, to) || matchPair(SERVER_HEAVY_PAIRS, from, to)
}

/** 是否需要走 LibreOffice（独立信号量） */
export function isHeavyConversion(from: string, to: string): boolean {
  return matchPair(SERVER_HEAVY_PAIRS, from, to)
}

/** UI 是否应该把这条转换显示为"支持"（任一方式可用即可） */
export function isConversionSupported(from: string, to: string): boolean {
  return canConvertClient(from, to)
      || canConvertServer(from, to)
      || matchPair(CLIENT_TOOL_PAIRS, from, to)
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 获取文件扩展名
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

// 检查文件格式是否允许
export function isFormatAllowed(extension: string): boolean {
  const ext = extension.toLowerCase()
  if (FORBIDDEN_FORMATS.includes(ext)) return false
  return ALLOWED_FORMATS.includes(ext)
}

// 检查文件大小是否允许
export function isFileSizeAllowed(bytes: number, extension: string): boolean {
  const sizeMB = bytes / (1024 * 1024)
  const ext = extension.toLowerCase()
  
  if (['pdf', 'epub'].includes(ext)) return sizeMB <= FILE_SIZE_LIMITS.pdf
  if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg'].includes(ext)) return sizeMB <= FILE_SIZE_LIMITS.image
  if (['doc', 'docx'].includes(ext)) return sizeMB <= FILE_SIZE_LIMITS.doc
  
  return sizeMB <= FILE_SIZE_LIMITS.default
}
