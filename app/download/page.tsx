import { Header } from '@/components/header'
import { Globe, Zap, Lock, Smartphone } from 'lucide-react'
import Link from 'next/link'

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">无需下载，浏览器即可使用</h1>
            <p className="mt-2 text-muted-foreground">
              文件快是纯网页应用，打开就能用，不占内存、不留垃圾
            </p>
          </div>

          {/* 主卡片 */}
          <div className="mb-6 rounded-lg border-2 border-primary/30 bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-bold">直接在浏览器使用</h2>
            <p className="mb-6 text-muted-foreground">
              所有功能都在网页中提供，无需安装任何客户端
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              去转换台
            </Link>
          </div>

          {/* 优势 */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5">
              <Zap className="mb-2 h-5 w-5 text-primary" />
              <h3 className="mb-1 font-medium">即开即用</h3>
              <p className="text-sm text-muted-foreground">不用下载、不用安装、不占硬盘</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <Lock className="mb-2 h-5 w-5 text-primary" />
              <h3 className="mb-1 font-medium">隐私安全</h3>
              <p className="text-sm text-muted-foreground">服务器不保存任何文件，处理完即销毁</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <Smartphone className="mb-2 h-5 w-5 text-primary" />
              <h3 className="mb-1 font-medium">多端通用</h3>
              <p className="text-sm text-muted-foreground">手机、平板、电脑，浏览器都能跑</p>
            </div>
          </div>

          {/* 客户端规划（如果未来要做的话） */}
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
            <p>
              桌面端 App / 移动端 App 暂未发布。如有强烈需求，欢迎邮件反馈：
              {' '}<a href="mailto:4514407@qq.com" className="text-primary hover:underline">4514407@qq.com</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
