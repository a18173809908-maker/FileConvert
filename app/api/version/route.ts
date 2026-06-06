import { NextResponse } from 'next/server'
import { getAppVersionInfo } from '@/lib/server/version'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(
    getAppVersionInfo(),
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
