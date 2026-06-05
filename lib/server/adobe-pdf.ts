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

async function createAsset(token: string, clientId: string, mediaType: string): Promise<CreateAssetResponse> {
  const res = await fetch(`${PDF_API_BASE}/assets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': clientId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mediaType }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Adobe createAsset failed: ${res.status} ${text.slice(0, 200)}`)
  }
  return await res.json()
}

async function uploadAsset(uploadUri: string, buffer: Buffer, mediaType: string): Promise<void> {
  const res = await fetch(uploadUri, {
    method: 'PUT',
    headers: { 'Content-Type': mediaType },
    body: new Uint8Array(buffer),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Adobe uploadAsset failed: ${res.status} ${text.slice(0, 200)}`)
  }
}

async function startJob(
  token: string,
  clientId: string,
  endpoint: string,
  body: unknown,
): Promise<string> {
  const res = await fetch(`${PDF_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': clientId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (res.status !== 201) {
    const text = await res.text()
    // Adobe 配额超限通常返回 429 或 4xx + 特定错误码
    if (res.status === 429 || /quota|limit|exceeded/i.test(text)) {
      throw new AdobeQuotaError(`Adobe quota exceeded: ${text.slice(0, 200)}`)
    }
    throw new Error(`Adobe job start failed: ${res.status} ${text.slice(0, 200)}`)
  }
  const location = res.headers.get('location')
  if (!location) throw new Error('Adobe job start: missing Location header')
  return location
}

export class AdobeQuotaError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AdobeQuotaError'
  }
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
    interval = Math.min(interval * 1.5, 3000)
  }
  throw new Error('Adobe job polling timeout')
}

async function downloadResult(downloadUri: string): Promise<Buffer> {
  const res = await fetch(downloadUri)
  if (!res.ok) throw new Error(`Adobe download failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// ============================================================
// 通用流程：upload → job → poll → download
// ============================================================

async function runAdobeJob(
  inputBuffer: Buffer,
  inputMime: string,
  endpoint: string,
  body: (assetID: string) => unknown,
  pollTimeoutMs = 120_000,
): Promise<Buffer> {
  if (!isAdobeConfigured()) throw new Error('Adobe credentials not configured')
  const clientId = process.env.ADOBE_CLIENT_ID!
  const token = await getAccessToken()
  const { uploadUri, assetID } = await createAsset(token, clientId, inputMime)
  await uploadAsset(uploadUri, inputBuffer, inputMime)
  const location = await startJob(token, clientId, endpoint, body(assetID))
  const downloadUri = await pollJob(token, clientId, location, pollTimeoutMs)
  return downloadResult(downloadUri)
}

// ============================================================
// 公开 API
// ============================================================

export type ExportTarget = 'docx' | 'doc' | 'rtf' | 'xlsx' | 'pptx' | 'jpeg' | 'png'

/**
 * PDF → DOCX/XLSX/PPTX/... （ExportPDF）
 * 自带 OCR，可识别扫描版 PDF 中的中文
 */
export async function adobeExportPdf(
  pdfBuffer: Buffer,
  targetFormat: ExportTarget,
  ocrLang = 'zh-CN',
): Promise<Buffer> {
  return runAdobeJob(
    pdfBuffer,
    'application/pdf',
    '/operation/exportpdf',
    (assetID) => ({ assetID, targetFormat, ocrLang }),
  )
}

/** 兼容旧名 */
export const adobePdfToDocx = (buf: Buffer, ocrLang = 'zh-CN') =>
  adobeExportPdf(buf, 'docx', ocrLang)

const CREATE_PDF_MIME: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:  'application/vnd.ms-excel',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt:  'application/vnd.ms-powerpoint',
  rtf:  'application/rtf',
  txt:  'text/plain',
  html: 'text/html',
  htm:  'text/html',
}

export type CreatePdfSource = keyof typeof CREATE_PDF_MIME

/**
 * Office/HTML → PDF（CreatePDF）
 */
export async function adobeCreatePdf(
  inputBuffer: Buffer,
  sourceExt: CreatePdfSource,
): Promise<Buffer> {
  const mime = CREATE_PDF_MIME[sourceExt]
  if (!mime) throw new Error(`adobeCreatePdf 不支持源格式: ${sourceExt}`)
  return runAdobeJob(
    inputBuffer,
    mime,
    '/operation/createpdf',
    (assetID) => ({ assetID }),
  )
}
