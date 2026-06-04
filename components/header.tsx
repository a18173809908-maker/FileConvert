'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { useApp } from '@/lib/store'

export function Header() {
  const { points, setIsLoggedIn, setPoints, isLoggedIn } = useApp()

  const handleSignIn = () => {
    if (isLoggedIn) return
    setIsLoggedIn(true)
    setPoints(prev => prev + 20)
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <span className="text-sm font-bold">快</span>
          </div>
          <span className="text-lg font-semibold text-foreground">文件快</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium text-primary">转换台</Link>
          <Link href="/formats" className="text-sm text-muted-foreground hover:text-foreground">格式中心</Link>
          <Link href="/download" className="text-sm text-muted-foreground hover:text-foreground">应用下载</Link>
          <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">帮助</Link>
        </nav>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Points Display */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
            <FileText className="h-3 w-3" />
          </div>
          <span className="text-sm font-medium">{points}</span>
          <span className="text-xs text-muted-foreground">+</span>
        </div>

        {/* Login Button */}
        <button
          onClick={handleSignIn}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isLoggedIn ? '已登录' : '登录'}
        </button>
      </div>
    </header>
  )
}
