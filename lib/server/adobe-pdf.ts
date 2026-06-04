import 'server-only'

// Adobe PDF Services API REST 客户端
// 免费额度：500 次/月 / 账号
// 文档：https://developer.adobe.com/document-services/docs/apis/

const IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3'
const PDF_API_BASE = 'https://pdf-services.adobe.io'

interface TokenCache { token: string; expiresAt: number }
let tokenCache: TokenCache | null = null

export function isAdobeConfigured(): boolean {
  return !!process.env.ADOBE_CLIENT_ID && !!process.env.ADOBE_CLIENT_SECRET
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.ADOBE_CLIENT_ID
  const clientSecret = process.env.ADOBE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Adobe credentials not configured')

  // 提前 1 分钟刷新避免边界
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'openid,AdobeID,read_organizations,DCAPI',
  })

  const res = await fetch(IMS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Adobe auth failed: ${res.status} ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  }
  return data.access_token
}

interface CreateAssetResponse {
  uploadUri: string
  assetID: string
}

async function createAsset(token: string, clientId: string): Promise<CreateAssetResponse> {
  const res = await fetch(`${PDF_API_BASE}/assets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': clientId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mediaType: 'application/pdf' }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Adobe createAsset failed: ${res.status} ${text.slice(0, 200)}`)
  }
  return await res.json()
}

async function uploadAsset(uploadUri: string, buffer: Buffer): Promise<void> {
  const res = await fetch(uploadUri, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: new Uint8Array(buffer),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Adobe uploadAsset failed: ${res.status} ${text.slice(0, 200)}`)
  }
}

async function startExport(token: string, clientId: string, assetID: string, ocrLang: string): Promise<string> {
  const res = await fetch(`${PDF_API_BASE}/operation/exportpdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': clientId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assetID, targetFormat: 'docx', ocrLang }),
  })
  if (res.status !== 201) {
    const text = await res.text()
    throw new Error(`Adobe startExport failed: ${res.status} ${text.slice(0, 200)}`)
  }
  const location = res.headers.get('location')
  if (!location) throw new Error('Adobe startExport: missing Location header')
  return location
}

interface PollResponse {
  status: 'in progress' | 'done' | 'failed'
  asset?: { downloadUri: string }
  error?: { code?: string; message?: string }
}

async function pollJob(token: string, clientId: string, location: string, timeoutMs: number): Promise<string> {
  const deadline = Date.now() + timeoutMs
  let interval = 1000
  while (Date.now() < deadline) {
    const res = await fetch(location, {
      headers: { 'Authorization': `Bearer ${token}`, 'x-api-key': clientId },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Adobe pollJob failed: ${res.status} ${text.slice(0, 200)}`)
    }
    const data: PollResponse = await res.json()
    if (data.status === 'done') {
      if (!data.asset?.downloadUri) throw new Error('Adobe job done but no downloadUri')
      return data.asset.downloadUri
    }
    if (data.status === 'failed') {
      throw new Error(`Adobe job failed: ${data.error?.message || data.error?.code || 'unknown'}`)
    }
    await new Promise(r => setTimeout(r, interval))
    interval = Math.min(interval * 1.5, 3000)  // 渐增轮询间隔
  }
  throw new Error('Adobe job polling timeout')
}

async function downloadResult(downloadUri: string): Promise<Buffer> {
  const res = await fetch(downloadUri)
  if (!res.ok) throw new Error(`Adobe download failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Adobe PDF Services：PDF → DOCX
 * 自带 OCR，可识别扫描版 PDF 中的中文
 */
export async function adobePdfToDocx(pdfBuffer: Buffer, ocrLang = 'zh-CN'): Promise<Buffer> {
  if (!isAdobeConfigured()) throw new Error('Adobe credentials not configured')
  const clientId = process.env.ADOBE_CLIENT_ID!
  const token = await getAccessToken()
  const { uploadUri, assetID } = await createAsset(token, clientId)
  await uploadAsset(uploadUri, pdfBuffer)
  const location = await startExport(token, clientId, assetID, ocrLang)
  const downloadUri = await pollJob(token, clientId, location, 120_000)
  return downloadResult(downloadUri)
}
