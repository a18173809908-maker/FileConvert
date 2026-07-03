export const SITE_URL = 'https://tools.aiboxpro.cn'
export const SITE_NAME = '文件侠'
export const SITE_DESCRIPTION = '免费在线文件转换工具，支持 PDF、Word、Excel、PPT、图片、Markdown、电子书等 30+ 种格式互转。无需安装软件，服务器不保存文件。'
export const SITE_TAGLINE = '免费在线文件转换工具'
export const AI_BOX_PRO_URL = 'https://www.aiboxpro.cn/'

export const SEO_KEYWORDS = [
  'PDF转Word',
  'Word转PDF',
  'PDF转Excel',
  'PDF转PPT',
  '图片转换',
  'HEIC转JPG',
  'CSV转Excel',
  'Markdown转PDF',
  '在线文件转换',
  '免费文件转换工具',
  'PDF在线转换',
  'Word在线转换',
  '图片格式转换',
  '文件转换器',
  '开源工具下载',
  '免费软件下载',
]

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined }

export type JsonLd = {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: JsonValue | undefined
}

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function jsonLdScript(data: JsonLd | JsonLd[]) {
  return {
    __html: JSON.stringify(data).replace(/</g, '\\u003c'),
  }
}

export const organizationJsonLd: JsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AIBoxPro',
  url: AI_BOX_PRO_URL,
}

export const websiteJsonLd: JsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'zh-CN',
  publisher: organizationJsonLd,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/formats?keyword={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export const webApplicationJsonLd: JsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  inLanguage: 'zh-CN',
  description: SITE_DESCRIPTION,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'CNY',
  },
  featureList: [
    'PDF 转 Word',
    'Word 转 PDF',
    'PDF 转 Excel',
    'PDF 转 PPT',
    '图片格式转换',
    'Markdown 转 HTML/PDF',
    'CSV 与 Excel 互转',
    'PDF 合并、拆分、旋转、压缩、加密、解密',
  ],
  publisher: organizationJsonLd,
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function itemListJsonLd(name: string, items: Array<{ name: string; path: string; description?: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(item.path),
      name: item.name,
      description: item.description,
    })),
  }
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function softwareApplicationJsonLd(input: {
  name: string
  description: string
  url: string
  category: string
  operatingSystems: string[]
  license: string
  homepage: string
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.url),
    applicationCategory: input.category,
    operatingSystem: input.operatingSystems.join(', '),
    softwareRequirements: input.operatingSystems.join(', '),
    license: input.license,
    downloadUrl: input.homepage,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
      availability: 'https://schema.org/InStock',
    },
    publisher: organizationJsonLd,
  }
}
