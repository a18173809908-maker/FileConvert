import { Header } from '@/components/header'
import { CONVERSION_CATEGORIES, POINTS_CONFIG } from '@/lib/conversion-config'
import Link from 'next/link'

export default function FormatsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header points={120} />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">格式中心</h1>
            <p className="mt-2 text-muted-foreground">
              支持 30+ 种文件格式之间的相互转换，涵盖 PDF、Word、图片、电子书等多种类型
            </p>
          </div>

          <div className="space-y-8">
            {CONVERSION_CATEGORIES.map((category) => (
              <div key={category.id} className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">{category.name}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {category.conversions.map((conv) => (
                    <Link
                      key={`${conv.from}-${conv.to}`}
                      href={`/?conversion=${conv.from}-${conv.to}`}
                      className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm transition-colors hover:border-primary/50 hover:bg-accent"
                    >
                      <span>{conv.label}</span>
                      <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                        ★
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">积分消耗规则</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>PDF 转换：每次消耗 2-5 积分</p>
              <p>图片转换：每次消耗 1 积分</p>
              <p>文档转换：每次消耗 2 积分</p>
              <p>电子书转换：每次消耗 5 积分</p>
              <p className="mt-4 text-primary">
                注册即送 {POINTS_CONFIG.register} 积分，每日登录可领取 {POINTS_CONFIG.dailyLogin} 积分
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}