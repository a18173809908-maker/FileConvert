'use client'

import Link from 'next/link'
import { LogOut, Shield } from 'lucide-react'
import { useApp } from '@/lib/store'

export function Header() {
  const { user, loadingUser, setLoginDialogOpen, logout } = useApp()

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <span className="text-sm font-bold">侠</span>
          </div>
          <span className="text-lg font-semibold text-foreground">文件侠</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium text-primary">转换台</Link>
          <Link href="/formats" className="text-sm text-muted-foreground hover:text-foreground">格式中心</Link>
          <Link href="/download" className="text-sm text-muted-foreground hover:text-foreground">应用下载</Link>
          <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">帮助</Link>
          {user?.isAdmin && (
            <Link href="/admin/logs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Shield className="h-3.5 w-3.5" />
              日志
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {loadingUser ? (
          <div className="h-7 w-16 animate-pulse rounded-md bg-muted" />
        ) : user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {user.nickname.slice(0, 1)}
                </div>
              )}
              <span className="text-sm">{user.nickname}</span>
            </div>
            <button
              onClick={logout}
              title="退出登录"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setLoginDialogOpen(true)}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            登录
          </button>
        )}
      </div>
    </header>
  )
}
