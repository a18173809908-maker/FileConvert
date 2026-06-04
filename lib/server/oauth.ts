import 'server-only'
import { randomBytes } from 'node:crypto'

// ---------- 配置 ----------

export interface OAuthConfig {
  appId: string
  appSecret: string
  redirectUri: string
}

export function getWechatConfig(): OAuthConfig | null {
  const appId = process.env.WECHAT_APP_ID
  const appSecret = process.env.WECHAT_APP_SECRET
  const redirectUri = process.env.WECHAT_REDIRECT_URI
  if (!appId || !appSecret || !redirectUri) return null
  return { appId, appSecret, redirectUri }
}

export function getQQConfig(): OAuthConfig | null {
  const appId = process.env.QQ_APP_ID
  const appSecret = process.env.QQ_APP_KEY
  const redirectUri = process.env.QQ_REDIRECT_URI
  if (!appId || !appSecret || !redirectUri) return null
  return { appId, appSecret, redirectUri }
}

export function generateState(): string {
  return randomBytes(16).toString('hex')
}

// ---------- WeChat 网站应用扫码登录 ----------

export function buildWechatAuthUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    appid: config.appId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'snsapi_login',
    state,
  })
  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`
}

export interface WechatTokenResp {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid?: string
}

export async function exchangeWechatCode(config: OAuthConfig, code: string): Promise<WechatTokenResp> {
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${config.appId}&secret=${config.appSecret}&code=${code}&grant_type=authorization_code`
  const res = await fetch(url)
  const data = await res.json()
  if (data.errcode) throw new Error(`微信授权失败: ${data.errmsg || data.errcode}`)
  return data
}

export interface WechatUserInfo {
  openid: string
  nickname: string
  headimgurl?: string
  unionid?: string
}

export async function fetchWechatUserInfo(accessToken: string, openid: string): Promise<WechatUserInfo> {
  const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
  const res = await fetch(url)
  const data = await res.json()
  if (data.errcode) throw new Error(`获取微信用户信息失败: ${data.errmsg || data.errcode}`)
  return data
}

// ---------- QQ 互联 ----------

export function buildQQAuthUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    state,
    scope: 'get_user_info',
  })
  return `https://graph.qq.com/oauth2.0/authorize?${params.toString()}`
}

export async function exchangeQQCode(config: OAuthConfig, code: string): Promise<{ access_token: string }> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.appId,
    client_secret: config.appSecret,
    code,
    redirect_uri: config.redirectUri,
    fmt: 'json',
  })
  const res = await fetch(`https://graph.qq.com/oauth2.0/token?${params.toString()}`)
  const data = await res.json()
  if (data.error) throw new Error(`QQ 授权失败: ${data.error_description || data.error}`)
  return data
}

export async function fetchQQOpenId(accessToken: string): Promise<string> {
  const res = await fetch(`https://graph.qq.com/oauth2.0/me?access_token=${accessToken}&fmt=json`)
  const data = await res.json()
  if (data.error) throw new Error(`获取 QQ openid 失败: ${data.error_description || data.error}`)
  return data.openid
}

export interface QQUserInfo {
  nickname: string
  figureurl_qq_2?: string
  figureurl_qq_1?: string
}

export async function fetchQQUserInfo(config: OAuthConfig, accessToken: string, openid: string): Promise<QQUserInfo> {
  const params = new URLSearchParams({
    access_token: accessToken,
    oauth_consumer_key: config.appId,
    openid,
  })
  const res = await fetch(`https://graph.qq.com/user/get_user_info?${params.toString()}`)
  const data = await res.json()
  if (data.ret !== 0) throw new Error(`获取 QQ 用户信息失败: ${data.msg}`)
  return data
}
