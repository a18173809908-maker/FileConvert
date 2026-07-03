import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Shield, Clock, CreditCard, FileText, Upload, HelpCircle, Mail, AlertCircle } from 'lucide-react'
import { FILE_SIZE_LIMITS } from '@/lib/conversion-config'
import { breadcrumbJsonLd, faqJsonLd, jsonLdScript } from '@/lib/seo'

export const metadata: Metadata = {
  title: '帮助中心 - 文件转换常见问题',
  description: '了解文件侠在线文件转换的安全性、文件大小限制、支持格式和转换失败处理方式。',
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: '帮助中心 - 文件转换常见问题',
    description: '文件侠在线文件转换常见问题与使用指南。',
    url: '/help',
  },
}

const faqItems = [
  {
    icon: Shield,
    question: '我的文件安全吗？',
    answer: '安全。服务器不保存任何文件——所有转换在内存中完成，请求结束立即销毁。图片转换、PDF 转图片、PDF 合并 / 拆分 / 旋转、图片裁剪等都在你浏览器本地完成，文件根本不上传到服务器。',
  },
  {
    icon: Clock,
    question: '转换需要多长时间？',
    answer: '取决于转换类型：浏览器内的图片转换通常 < 1 秒；轻量级服务端转换（TXT/SVG）一般 1-3 秒；Word ↔ PDF / EPUB → PDF 这种重型转换通常 3-10 秒；PDF → Word 等复杂文档解析可能需要 1-5 分钟。',
  },
  {
    icon: CreditCard,
    question: '收费吗？',
    answer: '完全免费。打开页面即可使用当前已支持的转换功能。',
  },
  {
    icon: FileText,
    question: '支持哪些文件格式？',
    answer: '图片：JPG/PNG/WEBP/BMP/GIF/SVG 任意互转。PDF：PDF → Word、PDF ↔ TXT/JPG/PNG，合并/拆分/旋转/压缩/加密/解密。文档：DOCX ↔ TXT，Word ↔ PDF，DOC ↔ DOCX。其他：HTML → PDF，EPUB → PDF，TXT → PDF/DOCX。具体能转哪几对，看左侧侧边栏，没"敬请期待"标的都能用。',
  },
  {
    icon: Upload,
    question: '文件大小有限制吗？',
    answer: `PDF 单文件 ≤ ${FILE_SIZE_LIMITS.pdf}MB，其他类型 ≤ ${FILE_SIZE_LIMITS.image}MB。超出会直接拒绝并提示。`,
  },
  {
    icon: HelpCircle,
    question: '转换失败怎么办？',
    answer: '常见原因：(1) 文件损坏或加密 PDF；(2) 服务繁忙——会自动重试一次；(3) 文档内有非常规字体导致 LibreOffice 渲染异常。重试或换个文件试试，仍不行邮件联系我们。',
  },
  {
    icon: AlertCircle,
    question: '为什么有些转换标"敬请期待"？',
    answer: '标"敬请期待"的方向代表暂未开放，通常是因为转换质量、速度或稳定性还没有达到可上线标准。PDF → Word 已接入高精度转换服务并开放使用；像 PDF → EPUB 这类版式重排更复杂的方向，会在评估质量和成本后再上线。',
  },
]

export default function HelpPage() {
  const structuredData = [
    breadcrumbJsonLd([
      { name: '首页', path: '/' },
      { name: '帮助中心', path: '/help' },
    ]),
    faqJsonLd(faqItems.map(item => ({ question: item.question, answer: item.answer }))),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(structuredData)}
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">帮助中心</h1>
            <p className="mt-2 text-muted-foreground">
              常见问题与使用指南
            </p>
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            {faqItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.question} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="mb-2 text-lg font-semibold">{item.question}</h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 使用步骤 */}
          <div className="mt-8 rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">使用步骤</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">1</span>
                <div>
                  <h3 className="font-medium">选择转换方向</h3>
                  <p className="text-sm text-muted-foreground">在左侧菜单中选择转换类型，如 "PDF → JPG"。或从"转换为"按钮快速切换目标格式</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">2</span>
                <div>
                  <h3 className="font-medium">上传文件</h3>
                  <p className="text-sm text-muted-foreground">拖拽多个文件到上传区，或点击选择。支持批量上传</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">3</span>
                <div>
                  <h3 className="font-medium">开始转换</h3>
                  <p className="text-sm text-muted-foreground">点击队列里的"转换"按钮。转换完成后即可下载结果</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">4</span>
                <div>
                  <h3 className="font-medium">下载结果</h3>
                  <p className="text-sm text-muted-foreground">完成后点下载按钮即可保存到本地</p>
                </div>
              </div>
            </div>
          </div>

          {/* 联系 */}
          <div className="mt-8 rounded-lg border border-border bg-card p-6 text-center">
            <Mail className="mx-auto mb-2 h-6 w-6 text-primary" />
            <h2 className="mb-2 text-lg font-semibold">还有问题？</h2>
            <p className="text-sm text-muted-foreground">
              邮件联系：
              <a href="mailto:4514407@qq.com" className="ml-1 text-primary hover:underline">
                4514407@qq.com
              </a>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              报 bug、提建议、申请新格式支持都欢迎
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
