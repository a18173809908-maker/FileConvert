'use client'

import { Gift, Copy, CalendarCheck, Users, Star, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { POINTS_CONFIG } from '@/lib/conversion-config'

interface AccountPanelProps {
  points: number
  isLoggedIn: boolean
  consecutiveDays: number
  hasSignedToday: boolean
  onSignIn: () => void
  onCheckIn: () => void
  onCopyInviteLink: () => void
}

export function AccountPanel({ 
  points, 
  isLoggedIn,
  consecutiveDays,
  hasSignedToday,
  onSignIn,
  onCheckIn,
  onCopyInviteLink,
}: AccountPanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    onCopyInviteLink()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <aside className="w-72 shrink-0 space-y-4 p-4">
      {/* My Points Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">我的积分</h3>

        {/* Points Display */}
        <div className="mb-4 flex items-baseline gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
            <Star className="h-3.5 w-3.5" />
          </div>
          <span className="text-3xl font-bold">{points}</span>
          <span className="text-sm text-muted-foreground">积分</span>
        </div>

        {/* Sign In Button */}
        {isLoggedIn ? (
          <button
            onClick={onCheckIn}
            disabled={hasSignedToday}
            className={`flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${
              hasSignedToday 
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {hasSignedToday ? (
              <>
                <CheckCircle className="h-4 w-4" />
                今日已签到
              </>
            ) : (
              <>
                <CalendarCheck className="h-4 w-4" />
                立即签到
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onSignIn}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Gift className="h-4 w-4" />
            登录领取积分
          </button>
        )}
      </div>

      {/* Get Points Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium">获取积分</h3>
        
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">注册赠送</span>
            <span className="font-medium text-primary">+{POINTS_CONFIG.register} 积分</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">每日登录</span>
            <span className="font-medium text-primary">+{POINTS_CONFIG.dailyLogin} 积分</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">每日恢复</span>
            <span className="font-medium text-primary">+{POINTS_CONFIG.dailyRestore} 积分</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">连续签到奖励</span>
            <span className="text-xs text-muted-foreground">第7天最高 +15</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">邀请好友</span>
            <span className="font-medium text-primary">+{POINTS_CONFIG.invite} 积分/人</span>
          </div>
        </div>

        {isLoggedIn && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>已连续签到</span>
              <span className="font-medium text-foreground">{consecutiveDays} 天</span>
            </div>
          </div>
        )}
      </div>

      {/* Invite Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">邀请好友</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          每成功邀请1位用户注册，您将获得 <span className="text-primary font-medium">{POINTS_CONFIG.invite} 积分</span> 奖励
        </p>
        <button 
          onClick={handleCopyLink}
          disabled={!isLoggedIn}
          className={`flex w-full items-center justify-center gap-2 rounded-md border py-2 text-sm transition-colors ${
            isLoggedIn 
              ? 'border-primary text-primary hover:bg-primary/5'
              : 'border-border text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Copy className="h-4 w-4" />
          {copied ? '已复制' : '复制邀请链接'}
        </button>
        {!isLoggedIn && (
          <p className="mt-2 text-xs text-muted-foreground text-center">
            登录后可获取专属邀请链接
          </p>
        )}
      </div>

      {/* Points Summary Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm text-muted-foreground">本次消耗预估</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">0 个文件合计</span>
            <div className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                <Star className="h-3 w-3" />
              </span>
              <span className="text-lg font-bold">0</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">转换后余额</span>
            <span>{points} 积分</span>
          </div>
        </div>
      </div>

      {/* Info Text */}
      <div className="rounded-md bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          文件将在 <span className="text-foreground font-medium">1小时</span> 后自动删除，
          下载链接同时失效。我们不会长期保存您的文件。
        </p>
      </div>
    </aside>
  )
}
