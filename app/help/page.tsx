import { Header } from '@/components/header'
import { HelpCircle, Shield, Clock, CreditCard, FileText, Upload } from 'lucide-react'

const faqItems = [
  {
    icon: Shield,
    question: '文件安全吗？',
    answer: '您的文件全程加密传输，转换完成后 1 小时内自动从服务器删除。我们不会查看、存储或分享您的文件内容。',
  },
  {
    icon: Clock,
    question: '转换需要多长时间？',
    answer: '大多数文件转换在几秒到一分钟内完成。具体时间取决于文件大小和服务器负载情况。',
  },
  {
    icon: CreditCard,
    question: '需要付费吗？',
    answer: '基础功能完全免费！注册即送 20 积分，每日登录可领取 5 积分，每日自动恢复 10 积分。邀请好友还可获得 50 积分/人奖励。',
  },
  {
    icon: FileText,
    question: '支持哪些文件格式？',
    answer: '支持 PDF、Word（DOC/DOCX）、TXT、HTML、JPG、PNG、WEBP、GIF、BMP、SVG、EPUB 等 30+ 种格式的相互转换。',
  },
  {
    icon: Upload,
    question: '文件大小有限制吗？',
    answer: '网页版单个文件限制为 10MB。如需处理更大文件，建议下载桌面版客户端，无文件大小限制。',
  },
  {
    icon: HelpCircle,
    question: '转换质量如何？',
    answer: '我们使用先进的转换引擎，确保转换后的文件最大程度保留原始排版和格式。但复杂排版（如多栏、表格）可能存在细微差异。',
  },
]

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">帮助中心</h1>
            <p className="mt-2 text-muted-foreground">
              常见问题与使用指南，帮助您更好地使用文件转换服务
            </p>
          </div>

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
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">使用步骤</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">1</span>
                <div>
                  <h3 className="font-medium">选择转换方向</h3>
                  <p className="text-sm text-muted-foreground">在左侧菜单中选择您需要的转换类型，例如 "PDF → Word"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">2</span>
                <div>
                  <h3 className="font-medium">上传文件</h3>
                  <p className="text-sm text-muted-foreground">拖拽文件到上传区域，或点击选择文件。每次只能处理一个文件</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">3</span>
                <div>
                  <h3 className="font-medium">开始转换</h3>
                  <p className="text-sm text-muted-foreground">点击"转换"按钮，等待转换完成后下载文件</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">4</span>
                <div>
                  <h3 className="font-medium">下载结果</h3>
                  <p className="text-sm text-muted-foreground">转换完成后点击下载按钮保存文件。文件将在 1 小时后自动删除</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-border bg-card p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">还有问题？</h2>
            <p className="text-sm text-muted-foreground">
              如果您的问题未在帮助中心中找到答案，请通过邮件联系我们：support@fileconvert.app
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}