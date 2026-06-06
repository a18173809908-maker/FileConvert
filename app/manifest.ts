import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '文件侠 - 免费在线文件转换工具',
    short_name: '文件侠',
    description: '支持 PDF、Word、Excel、PPT、图片、Markdown、电子书等格式互转的在线文件转换工具。',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#ef4444',
    lang: 'zh-CN',
    icons: [
      {
        src: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
