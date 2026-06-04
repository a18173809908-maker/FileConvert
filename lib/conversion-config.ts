// 转换类型配置
export interface ConversionType {
  from: string
  to: string
  points: number
  label: string
}

// 转换分类配置
export interface ConversionCategory {
  id: string
  name: string
  icon: string
  conversions: ConversionType[]
}

// 积分规则配置
export const POINTS_CONFIG = {
  register: 20,
  dailyLogin: 5,
  dailyRestore: 10,
  invite: 50,
  consecutiveBonus: [0, 2, 4, 6, 8, 10, 15], // 连续签到额外奖励
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
  'pdf', 'doc', 'docx', 'txt', 'html',
  'jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg',
  'epub'
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
      { from: 'docx', to: 'pdf', points: 5, label: 'Word → PDF' },
      { from: 'pdf', to: 'jpg', points: 5, label: 'PDF → JPG' },
      { from: 'pdf', to: 'png', points: 5, label: 'PDF → PNG' },
      { from: 'jpg', to: 'pdf', points: 2, label: 'JPG → PDF' },
      { from: 'png', to: 'pdf', points: 2, label: 'PNG → PDF' },
      { from: 'pdf', to: 'txt', points: 5, label: 'PDF → TXT' },
      { from: 'txt', to: 'pdf', points: 2, label: 'TXT → PDF' },
      { from: 'pdf', to: 'merge', points: 2, label: 'PDF 合并' },
      { from: 'pdf', to: 'split', points: 2, label: 'PDF 拆分' },
      { from: 'pdf', to: 'rotate', points: 1, label: 'PDF 旋转' },
    ]
  },
  {
    id: 'image',
    name: '图片转换',
    icon: 'image',
    conversions: [
      { from: 'jpg', to: 'png', points: 1, label: 'JPG → PNG' },
      { from: 'png', to: 'jpg', points: 1, label: 'PNG → JPG' },
      { from: 'jpg', to: 'webp', points: 1, label: 'JPG → WEBP' },
      { from: 'webp', to: 'jpg', points: 1, label: 'WEBP → JPG' },
      { from: 'png', to: 'webp', points: 1, label: 'PNG → WEBP' },
      { from: 'webp', to: 'png', points: 1, label: 'WEBP → PNG' },
      { from: 'bmp', to: 'jpg', points: 1, label: 'BMP → JPG' },
      { from: 'bmp', to: 'png', points: 1, label: 'BMP → PNG' },
      { from: 'gif', to: 'jpg', points: 1, label: 'GIF → JPG' },
      { from: 'gif', to: 'png', points: 1, label: 'GIF → PNG' },
    ]
  },
  {
    id: 'image-tools',
    name: '图片工具',
    icon: 'settings',
    conversions: [
      { from: 'image', to: 'compress', points: 1, label: '图片压缩' },
      { from: 'image', to: 'resize', points: 1, label: '图片尺寸调整' },
      { from: 'image', to: 'crop', points: 1, label: '图片裁剪' },
      { from: 'image', to: 'rotate', points: 1, label: '图片旋转' },
    ]
  },
  {
    id: 'document',
    name: '文档工具',
    icon: 'file',
    conversions: [
      { from: 'doc', to: 'docx', points: 2, label: 'DOC → DOCX' },
      { from: 'docx', to: 'doc', points: 2, label: 'DOCX → DOC' },
      { from: 'html', to: 'pdf', points: 2, label: 'HTML → PDF' },
    ]
  },
  {
    id: 'svg',
    name: 'SVG工具',
    icon: 'pen-tool',
    conversions: [
      { from: 'svg', to: 'png', points: 2, label: 'SVG → PNG' },
      { from: 'svg', to: 'jpg', points: 2, label: 'SVG → JPG' },
    ]
  },
  {
    id: 'ebook',
    name: '电子书工具',
    icon: 'book-open',
    conversions: [
      { from: 'epub', to: 'pdf', points: 5, label: 'EPUB → PDF' },
    ]
  },
  {
    id: 'dev',
    name: '开发者工具',
    icon: 'code',
    conversions: [
      { from: 'json', to: 'tools', points: 0, label: 'JSON 格式化 / 校验' },
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
  points: number
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

/** 服务端轻量级（sharp / pdf-lib / mammoth / docx / unpdf） */
export const SERVER_LIGHT_PAIRS: ReadonlyArray<Pair> = [
  ['txt', 'pdf'], ['txt', 'docx'],
  ['docx', 'txt'], ['pdf', 'txt'],
  ['jpg', 'pdf'], ['jpeg', 'pdf'], ['png', 'pdf'], ['webp', 'pdf'],
  ['svg', 'png'], ['svg', 'jpg'],
]

/** 服务端重型（LibreOffice 子进程，独立并发=1） */
export const SERVER_HEAVY_PAIRS: ReadonlyArray<Pair> = [
  ['docx', 'pdf'], ['doc', 'pdf'],
  ['doc', 'docx'], ['docx', 'doc'],
  ['html', 'pdf'], ['htm', 'pdf'],
  ['epub', 'pdf'],
]

/** 客户端"伪转换"工具（不是真正的 from→to，是打开 Dialog） */
export const CLIENT_TOOL_PAIRS: ReadonlyArray<Pair> = [
  ['image', 'compress'], ['image', 'resize'], ['image', 'rotate'], ['image', 'crop'],
  ['pdf', 'merge'], ['pdf', 'split'], ['pdf', 'rotate'],
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

// 根据文件扩展名获取积分消耗
export function getConversionPoints(from: string, to: string): number {
  for (const category of CONVERSION_CATEGORIES) {
    const conversion = category.conversions.find(
      c => c.from.toLowerCase() === from.toLowerCase() && c.to.toLowerCase() === to.toLowerCase()
    )
    if (conversion) return conversion.points
  }
  return 1 // 默认1积分
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
