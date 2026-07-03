import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Download, ExternalLink, Github, HardDrive } from 'lucide-react'
import { Header } from '@/components/header'
import { downloadTools, getDownloadTool } from '@/lib/download-tools'
import { breadcrumbJsonLd, jsonLdScript, softwareApplicationJsonLd } from '@/lib/seo'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return downloadTools.map(tool => ({ slug: tool.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tool = getDownloadTool(slug)
  if (!tool) return {}

  return {
    title: `${tool.name} 下载 - ${tool.category}工具说明`,
    description: `${tool.name} 免费下载说明，包含软件介绍、适用场景、官网入口和网盘下载地址。${tool.summary}`,
    alternates: {
      canonical: `/download/${tool.slug}`,
    },
    openGraph: {
      title: `${tool.name} 下载`,
      description: tool.summary,
      url: `/download/${tool.slug}`,
    },
  }
}

export default async function DownloadDetailPage({ params }: PageProps) {
  const { slug } = await params
  const tool = getDownloadTool(slug)
  if (!tool) notFound()
  const structuredData = [
    breadcrumbJsonLd([
      { name: '首页', path: '/' },
      { name: '应用下载', path: '/download' },
      { name: tool.name, path: `/download/${tool.slug}` },
    ]),
    softwareApplicationJsonLd({
      name: tool.name,
      description: tool.summary,
      url: `/download/${tool.slug}`,
      category: tool.category,
      operatingSystems: tool.platforms,
      license: tool.license,
      homepage: tool.homepage,
    }),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(structuredData)}
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <Link href="/download" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            返回工具列表
          </Link>

          <section className="mb-6 rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{tool.license}</span>
                  <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">{tool.category}</span>
                </div>
                <h1 className="text-3xl font-bold">{tool.name}</h1>
                <p className="mt-3 max-w-3xl text-muted-foreground">{tool.summary}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href={tool.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  官网
                  <ExternalLink className="h-4 w-4" />
                </a>
                {tool.sourceUrl && (
                  <a
                    href={tool.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    源码
                    <Github className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">软件说明</h2>
                <p className="leading-7 text-muted-foreground">{tool.description}</p>
              </section>

              <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">适合做什么</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {tool.useCases.map(item => (
                    <div key={item} className="flex gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">核心特点</h2>
                <ul className="space-y-3">
                  {tool.highlights.map(item => (
                    <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="space-y-6">
              <section id="cloud-download" className="rounded-lg border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">网盘下载</h2>
                </div>

                {tool.cloudLinks.length > 0 ? (
                  <div className="space-y-3">
                    {tool.cloudLinks.map(link => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                      >
                        <span>{link.name}</span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          {link.code ? `提取码 ${link.code}` : '打开'}
                          <Download className="h-4 w-4" />
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                    暂未配置网盘地址。可以先从官网或源码页下载，后续把百度网盘、夸克网盘等链接填入数据源即可显示。
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="mb-3 font-semibold">基础信息</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">授权</dt>
                    <dd className="font-medium">{tool.license}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">分类</dt>
                    <dd className="font-medium">{tool.category}</dd>
                  </div>
                  <div>
                    <dt className="mb-2 text-muted-foreground">平台</dt>
                    <dd className="flex flex-wrap gap-2">
                      {tool.platforms.map(platform => (
                        <span key={platform} className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
                          {platform}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
