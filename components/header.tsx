'use client'

import Link from 'next/link'

export function Header() {
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
        </nav>
      </div>
    </header>
  )
}
