import type { Metadata } from 'next'
import { AdminLogsClient } from './view'

export const metadata: Metadata = {
  title: '转换日志 - 管理后台',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLogsPage() {
  return <AdminLogsClient />
}
