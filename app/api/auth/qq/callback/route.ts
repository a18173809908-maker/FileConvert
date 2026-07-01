import { NextRequest, NextResponse } from 'next/server'
import { getQQConfig, exchangeQQCode, fetchQQOpenId, fetchQQUserInfo } from '@/lib/server/oauth'
import { getSession } from '@/lib/server/auth'
import { createUser, getUserByQQ, generateUniqueInviteCode } from '@/lib/server/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const config = getQQConfig()
  if (!config) return NextResponse.redirect(new URL('/?login_error=qq_not_configured', req.url))

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  if (!code || !state) {
    return NextResponse.redirect(new URL('/?login_error=missing_code', req.url))
  }

  const session = await getSession()
  if (session.oauthState !== state || session.oauthProvider !== 'qq') {
    return NextResponse.redirect(new URL('/?login_error=state_mismatch', req.url))
  }
  delete session.oauthState
  delete session.oauthProvider

  try {
    const token = await exchangeQQCode(config, code)
    const openid = await fetchQQOpenId(token.access_token)

    let user = getUserByQQ(openid)
    if (!user) {
      const info = await fetchQQUserInfo(config, token.access_token, openid)
      user = createUser({
        qq_openid: openid,
        nickname: info.nickname || `QQ用户${openid.slice(-4)}`,
        avatar_url: info.figureurl_qq_2 || info.figureurl_qq_1,
        invite_code: generateUniqueInviteCode(),
      })
    }

    session.userId = user.id
    await session.save()
    return NextResponse.redirect(new URL('/?login=success', req.url))
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'oauth_failed')
    return NextResponse.redirect(new URL(`/?login_error=${msg}`, req.url))
  }
}
