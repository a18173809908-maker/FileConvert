import { NextResponse } from 'next/server'
import { getQQConfig, buildQQAuthUrl, generateState } from '@/lib/server/oauth'
import { getSession } from '@/lib/server/auth'

export const runtime = 'nodejs'

export async function GET() {
  const config = getQQConfig()
  if (!config) {
    return NextResponse.json(
      { error: 'QQ 登录未配置，请联系管理员', hint: '需要在容器 ENV 设置 QQ_APP_ID / QQ_APP_KEY / QQ_REDIRECT_URI' },
      { status: 503 },
    )
  }

  const state = generateState()
  const session = await getSession()
  session.oauthState = state
  session.oauthProvider = 'qq'
  await session.save()

  return NextResponse.redirect(buildQQAuthUrl(config, state))
}
