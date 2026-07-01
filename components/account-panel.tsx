'use client'

import { ShieldCheck, UserCircle } from 'lucide-react'
import { useApp } from '@/lib/store'

export function AccountPanel() {
  const { user, setLoginDialogOpen } = useApp()

  return (
    <aside className="w-72 shrink-0 space-y-4 p-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">账号</h3>
        </div>

        {user ? (
          <p className="text-sm text-muted-foreground">
            已登录为 <span className="font-medium text-foreground">{user.nickname}</span>
          </p>
        ) : (
          <button
            onClick={() => setLoginDialogOpen(true)}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            登录后开始转换
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">文件安全</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">服务器不保存任何文件。</span>
          所有转换在内存中完成，处理结束立即销毁。
        </p>
      </div>
    </aside>
  )
}
