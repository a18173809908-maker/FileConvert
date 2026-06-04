'use client'

import { Gift, Copy, CalendarCheck, Users, Star, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { POINTS_CONFIG } from '@/lib/conversion-config'
import { useApp } from '@/lib/store'

export function AccountPanel() {
  const { user, setLoginDialogOpen, refreshUser } = useApp()
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)

  const handleSignIn = () => setLoginDialogOpen(true)

  const handleCheckIn = async () => {
    if (!user || user.hasSignedToday || checking) return
    setChecking(true)
    try {
      const res = await fetch('/api/auth/checkin', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '签到失败')
      await refreshUser()
      toast.success(`签到成功，获得 ${data.reward} 积分`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '签到失败')
    } finally {
      setChecking(false)
    }
  }

  const handleCopyLink = async () => {
    if (!user) return
    const link = `${window.location.origin}/?ref=${user.inviteCode}`
    const onSuccess = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('邀请链接已复制')
    }

    // 优先用 Clipboard API（仅 HTTPS 或 localhost 可用）
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(link)
        onSuccess()
        return
      } catch {
        // 失败时回落到下面的传统方案
      }
    }

    // HTTP 下用 textarea + execCommand 兜底
    try {
      const ta = document.createElement('textarea')
      ta.value = link
      ta.style.position = 'fixed'
      ta.style.top = '0'
      ta.style.left = '0'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) onSuccess()
      else toast.error('复制失败，请手动复制：' + link)
    } catch {
      toast.error('复制失败，请手动复制：' + link)
    }
  }

  const points = user?.points ?? 0
  const isLoggedIn = !!user
  const consecutiveDays = user?.consecutiveDays ?? 0
  const hasSignedToday = user?.hasSignedToday ?? false

  return (
    <aside className="w-72 shrink-0 space-y-4 p-4">
      {/* My Points Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">我的积分</h3>

        <div className="mb-4 flex items-baseline gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
            <Star className="h-3.5 w-3.5" />
          </div>
          <span className="text-3xl font-bold">{points}</span>
          <span className="text-sm text-muted-foreground">积分</span>
        </div>

        {isLoggedIn ? (
          <button
            onClick={handleCheckIn}
            disabled={hasSignedToday || checking}
            className={`flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${
              hasSignedToday
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {hasSignedToday ? (
              <><CheckCircle className="h-4 w-4" />今日已签到</>
            ) : (
              <><CalendarCheck className="h-4 w-4" />立即签到</>
            )}
          </button>
        ) : (
          <button
            onClick={handleSignIn}
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
            <span className="text-muted-foreground">连续签到奖励</span>
            <span className="text-xs text-muted-foreground">第7天最高 +15</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">邀请好友</span>
            <span className="font-medium text-primary">+{POINTS_CONFIG.invite} 积分/人</span>
          </div>
        </div>

        {isLoggedIn && (
          <div className="mt-3 border-t border-border pt-3">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
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
          每成功邀请 1 位用户注册，您将获得 <span className="font-medium text-primary">{POINTS_CONFIG.invite} 积分</span> 奖励
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
          <p className="mt-2 text-center text-xs text-muted-foreground">登录后可获取专属邀请链接</p>
        )}
      </div>

      <div className="rounded-md bg-muted/50 p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">服务器不保存任何文件</span>。
          所有转换在内存中完成，处理结束立即销毁。
        </p>
      </div>
    </aside>
  )
}
