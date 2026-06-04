'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useApp } from '@/lib/store'

type Mode = 'login' | 'register'

export function AuthDialog() {
  const { loginDialogOpen, setLoginDialogOpen, refreshUser } = useApp()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [working, setWorking] = useState(false)

  // 打开对话框时，若 localStorage 有 pendingInvite，自动切到注册并填邀请码
  useEffect(() => {
    if (!loginDialogOpen) return
    if (typeof window === 'undefined') return
    const pending = window.localStorage.getItem('fc:pendingInvite')
    if (pending) {
      setMode('register')
      setInviteCode(pending)
    }
  }, [loginDialogOpen])

  const reset = () => {
    setEmail(''); setPassword(''); setNickname(''); setInviteCode('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWorking(true)
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { email, password, nickname, inviteCode: inviteCode || undefined }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '操作失败')
      await refreshUser()
      // 注册成功 → 清掉 pendingInvite，避免重复使用
      if (mode === 'register' && typeof window !== 'undefined') {
        window.localStorage.removeItem('fc:pendingInvite')
      }
      toast.success(mode === 'login' ? '登录成功' : '注册成功，已赠送 20 积分')
      setLoginDialogOpen(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setWorking(false)
    }
  }

  const handleOAuth = async (provider: 'wechat' | 'qq') => {
    // 先探测是否配置好
    const res = await fetch(`/api/auth/${provider}/start`, { redirect: 'manual' })
    if (res.status === 503) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || `${provider === 'wechat' ? '微信' : 'QQ'} 登录尚未配置`)
      return
    }
    // 否则 302 跳转到对应平台
    window.location.href = `/api/auth/${provider}/start`
  }

  return (
    <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? '登录' : '注册'}</DialogTitle>
          <DialogDescription>
            {mode === 'login' ? '使用邮箱、微信或 QQ 登录' : '注册即赠送 20 积分'}
          </DialogDescription>
        </DialogHeader>

        {/* 第三方登录 */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOAuth('wechat')}
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#07C160] text-xs text-white">微</span>
              微信登录
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('qq')}
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#12B7F5] text-xs text-white">Q</span>
              QQ 登录
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-2 text-xs text-muted-foreground">或使用邮箱</span></div>
          </div>
        </div>

        {/* 邮箱表单 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">邮箱</Label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs">密码（至少 6 位）</Label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <Label htmlFor="nickname" className="text-xs">昵称</Label>
                <input
                  id="nickname"
                  type="text"
                  required
                  maxLength={32}
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invite" className="text-xs">邀请码（可选）</Label>
                <input
                  id="invite"
                  type="text"
                  maxLength={16}
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="填写后双方都获得奖励"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={working}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {working && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          {mode === 'login' ? (
            <>还没账号？ <button onClick={() => { reset(); setMode('register') }} className="text-primary hover:underline">立即注册</button></>
          ) : (
            <>已有账号？ <button onClick={() => { reset(); setMode('login') }} className="text-primary hover:underline">直接登录</button></>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
