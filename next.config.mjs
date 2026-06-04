/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 原生模块不要被 Next.js 重新打包
  serverExternalPackages: ['sharp', 'better-sqlite3'],
}

export default nextConfig
