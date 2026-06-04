import { NextResponse } from 'next/server'
import { getWechatConfig, buildWechatAuthUrl, generateState } from '@/lib/server/oauth'
import { getSession } from '@/lib/server/auth'

export const runtime = 'nodejs'

export async function GET() {
  const config = getWechatConfig()
  if (!config) {
    return NextResponse.json(
      { error: '微信登录未配置，请联系管理员', hint: '需要在容器 ENV 设置 WECHAT_APP_ID / WECHAT_APP_SECRET / WECHAT_REDIRECT_URI' },
      { status: 503 },
    )
  }

  const state = generateState()
  const session = await getSession()
  session.oauthState = state
  session.oauthProvider = 'wechat'
  await session.save()

  return NextResponse.redirect(buildWechatAuthUrl(config, state))
}
