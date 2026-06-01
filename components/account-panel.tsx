'use client'

import { Gift, Copy, Clock, Zap, List } from 'lucide-react'

interface AccountPanelProps {
  points: number
  freeTriesRemaining: number
  maxFreeTries: number
  onSignIn: () => void
}

export function AccountPanel({ 
  points, 
  freeTriesRemaining, 
  maxFreeTries,
  onSignIn 
}: AccountPanelProps) {
  return (
    <aside className="w-72 shrink-0 space-y-4 p-4">
      {/* My Account Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">我的账户</span>
          <span className="rounded border border-border px-2 py-0.5 text-xs">FREE</span>
        </div>

        {/* Points Display */}
        <div className="mb-3 flex items-baseline gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
            ★
          </div>
          <span className="text-3xl font-bold">{points}</span>
          <span className="text-sm text-muted-foreground">积分</span>
        </div>

        {/* Free Tries */}
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">今日免费次数</span>
          <span>
            <span className="font-medium">{freeTriesRemaining}</span>
            <span className="text-muted-foreground"> / {maxFreeTries}</span>
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          00:00 重置 · 注册再得 50 积分
        </p>

        {/* Sign In Button */}
        <button
          onClick={onSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Gift className="h-4 w-4" />
          充值 / 开通会员
        </button>
      </div>

      {/* Queue Status Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium">队列状态</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <List className="h-4 w-4" />
              <span>当前通道</span>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 text-xs">普通队列</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>预计等待</span>
            </div>
            <span>~40s</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>并发任务</span>
            </div>
            <span>1</span>
          </div>
        </div>
      </div>

      {/* Pro Upgrade Card */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-1">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">升级 Pro 享优先队列</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          插队优先处理 · 并发 5 任务 · 单文件支持至 200MB
        </p>
        <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          查看会员权益
        </button>
      </div>

      {/* Points Summary Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm text-muted-foreground">本次消耗预估</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">4 个文件合计</span>
            <div className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                ★
              </span>
              <span className="text-lg font-bold">14</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">转换后余额</span>
            <span>114 积分</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
