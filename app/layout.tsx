import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProvider } from '@/lib/store'
import { AuthDialog } from '@/components/auth-dialog'
import { BrowserNotice } from '@/components/browser-notice'
import { SiteFooter } from '@/components/site-footer'
import { Toaster } from '@/components/ui/sonner'
import { SEO_KEYWORDS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: '文件侠 - 免费在线文件转换工具',
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  generator: 'v0.app',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    siteName: SITE_NAME,
    title: '文件侠 - 免费在线文件转换工具',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: '文件侠 - 免费在线文件转换工具',
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
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
    'PDF 合并、拆分、旋转、加密、解密',
  ],
  publisher: {
    '@type': 'Organization',
    name: 'AIBoxPro',
    url: 'https://www.aiboxpro.cn/',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="bg-background">
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <AppProvider>
          <BrowserNotice />
          {children}
          <SiteFooter />
          <AuthDialog />
        </AppProvider>
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
