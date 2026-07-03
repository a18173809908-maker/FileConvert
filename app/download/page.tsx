import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Download, ExternalLink, FolderOpen } from 'lucide-react'
import { Header } from '@/components/header'
import { downloadTools, getDownloadCategories } from '@/lib/download-tools'

export const metadata: Metadata = {
  title: '应用下载 - 免费开源工具合集',
  description: '整理常用免费和开源工具下载入口，包含压缩解压、视频处理、录屏直播、文档阅读、截图录屏等软件说明与网盘下载地址。',
  alternates: {
    canonical: '/download',
  },
  openGraph: {
    title: '应用下载 - 免费开源工具合集',
    description: '常用免费和开源工具下载列表，附软件说明、官网入口和网盘下载地址。',
    url: '/download',
  },
}

export default function DownloadPage() {
  const categories = getDownloadCategories()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">免费开源工具下载</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                挑选常用、口碑稳定的免费或开源工具，提供软件说明、适用场景、官网入口和网盘下载地址。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <span key={category} className="rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">下载说明</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  优先收录官网可验证的软件。网盘链接适合国内网络下载不稳定时备用；如果某个工具暂未配置网盘地址，详情页会显示待补充。
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {downloadTools.map(tool => (
              <article key={tool.slug} className="rounded-lg border border-border bg-card p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{tool.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{tool.category}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {tool.license}
                  </span>
                </div>

                <p className="min-h-12 text-sm leading-6 text-muted-foreground">{tool.summary}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {tool.platforms.map(platform => (
                    <span key={platform} className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      {platform}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <Link
                    href={`/download/${tool.slug}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    查看详情
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={tool.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="打开官网"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link
                    href={`/download/${tool.slug}#cloud-download`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="网盘下载"
                  >
                    <Download className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
