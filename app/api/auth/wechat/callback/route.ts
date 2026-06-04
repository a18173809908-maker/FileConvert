import { NextRequest, NextResponse } from 'next/server'
import { getWechatConfig, exchangeWechatCode, fetchWechatUserInfo } from '@/lib/server/oauth'
import { getSession } from '@/lib/server/auth'
import { createUser, getUserByWechat, generateUniqueInviteCode, addPoints } from '@/lib/server/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const config = getWechatConfig()
  if (!config) return NextResponse.redirect(new URL('/?login_error=wechat_not_configured', req.url))

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  if (!code || !state) {
    return NextResponse.redirect(new URL('/?login_error=missing_code', req.url))
  }

  const session = await getSession()
  if (session.oauthState !== state || session.oauthProvider !== 'wechat') {
    return NextResponse.redirect(new URL('/?login_error=state_mismatch', req.url))
  }
  delete session.oauthState
  delete session.oauthProvider

  try {
    const token = await exchangeWechatCode(config, code)
    let user = getUserByWechat(token.openid)
    if (!user) {
      const info = await fetchWechatUserInfo(token.access_token, token.openid)
      user = createUser({
        wechat_openid: token.openid,
        nickname: info.nickname || `微信用户${token.openid.slice(-4)}`,
        avatar_url: info.headimgurl,
        invite_code: generateUniqueInviteCode(),
        initial_points: 20,
      })
      addPoints(user.id, 0, 'register_bonus_wechat', { initial: 20 })
    }

    session.userId = user.id
    await session.save()
    return NextResponse.redirect(new URL('/?login=success', req.url))
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'oauth_failed')
    return NextResponse.redirect(new URL(`/?login_error=${msg}`, req.url))
  }
}
