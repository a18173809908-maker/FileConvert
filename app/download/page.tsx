import { Header } from '@/components/header'
import { Download, Apple, Monitor, Smartphone, Star } from 'lucide-react'

const platforms = [
  {
    icon: Monitor,
    name: 'Windows 桌面版',
    version: 'v2.1.0',
    size: '48.2 MB',
    points: '下载即送 10 积分',
    desc: '支持 Windows 10/11 系统，批量转换，离线使用',
  },
  {
    icon: Apple,
    name: 'macOS 桌面版',
    version: 'v2.1.0',
    size: '52.6 MB',
    points: '下载即送 10 积分',
    desc: '支持 macOS 12+，原生 Apple Silicon 优化',
  },
  {
    icon: Smartphone,
    name: '移动端 App',
    version: 'v1.8.0',
    size: '32.1 MB',
    points: '下载即送 10 积分',
    desc: '支持 iOS 和 Android，随时随地转换文件',
  },
]

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">应用下载</h1>
            <p className="mt-2 text-muted-foreground">
              下载桌面端或移动端应用，享受更强大的文件转换体验
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {platforms.map((platform) => {
              const Icon = platform.icon
              return (
                <div key={platform.name} className="rounded-lg border border-border bg-card p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mb-1 text-lg font-semibold">{platform.name}</h2>
                  <p className="mb-4 text-sm text-muted-foreground">{platform.desc}</p>
                  <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                    <p>{platform.version} · {platform.size}</p>
                  </div>
                  <div className="mb-4 flex items-center gap-1 rounded bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
                    <Star className="h-4 w-4" />
                    {platform.points}
                  </div>
                  <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Download className="h-4 w-4" />
                    立即下载
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">为什么选择桌面版？</h2>
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <div>
                <h3 className="mb-1 font-medium text-foreground">⚡ 批量处理</h3>
                <p>一次添加多个文件，批量转换，效率翻倍</p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-foreground">🔒 离线使用</h3>
                <p>无需联网，文件在本地处理，更安全更私密</p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-foreground">🎯 无限制</h3>
                <p>无文件大小限制，无每日转换次数限制</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}