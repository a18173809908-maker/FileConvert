/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // sharp 是原生模块，不要被 Next.js 重新打包
  serverExternalPackages: ['sharp'],
}

export default nextConfig
