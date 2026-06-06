/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    const noStoreHeaders = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
      {
        key: 'Pragma',
        value: 'no-cache',
      },
      {
        key: 'Expires',
        value: '0',
      },
    ]

    return [
      { source: '/', headers: noStoreHeaders },
      { source: '/formats', headers: noStoreHeaders },
      { source: '/help', headers: noStoreHeaders },
      { source: '/download', headers: noStoreHeaders },
      { source: '/robots.txt', headers: noStoreHeaders },
      { source: '/sitemap.xml', headers: noStoreHeaders },
      { source: '/manifest.webmanifest', headers: noStoreHeaders },
    ]
  },
  images: {
    unoptimized: true,
  },
  // 原生模块不要被 Next.js 重新打包
  serverExternalPackages: ['sharp', 'better-sqlite3'],
}

export default nextConfig
