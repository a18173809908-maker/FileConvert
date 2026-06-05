import 'server-only'
import { adobeKeyPool, AdobeKey } from './adobe-pool'

// Adobe PDF Services API REST 客户端（多 Key 池版）
// 单 Key 免费 500 次/月，多 Key 叠加额度
// 文档：https://developer.adobe.com/document-services/docs/apis/

const IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3'
const PDF_API_BASE = 'https://pdf-services.adobe.io'

interface TokenCache { token: string; expiresAt: number }
const tokenCache = new Map<string, TokenCache>()

export class AdobeQuotaError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AdobeQuotaError'
  }
}

export class AdobeAllKeysExhaustedError extends Error {
  constructor() {
    super('Adobe 所有 Key 本月额度均已用完，请稍后或下月再试')
    this.name = 'AdobeAllKeysExhaustedError'
  }
}

export function isAdobeConfigured(): boolean {
  return !adobeKeyPool.isEmpty()
}

export function adobePoolStats() {
  return { size: adobeKeyPool.size(), keys: adobeKeyPool.stats() }
}

async function getAccessToken(key: AdobeKey): Promise<string> {
  const cached = tokenCache.get(key.clientId)
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: key.clientId,
    client_secret: key.clientSecret,
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
  tokenCache.set(key.clientId, {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  })
  return data.access_token
}

interface CreateAssetResponse { uploadUri: string; assetID: string }

async function createAsset(token: string, clientId: string, mediaType: string): Promise<CreateAssetResponse> {
  const res = await fetch(`${PDF_API_BASE}/assets`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'x-api-key': clientId, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaType }),
  })
  if (!res.ok) {
    const text = await res.text()
    if (res.status === 429 || /quota|limit|exceeded/i.test(text)) {
      throw new AdobeQuotaError(`createAsset quota: ${text.slice(0, 200)}`)
    }
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

async function startJob(token: string, clientId: string, endpoint: string, body: unknown): Promise<string> {
  const res = await fetch(`${PDF_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'x-api-key': clientId, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status !== 201) {
    const text = await res.text()
    if (res.status === 429 || /quota|limit|exceeded/i.test(text)) {
      throw new AdobeQuotaError(`startJob quota: ${text.slice(0, 200)}`)
    }
    throw new Error(`Adobe startJob failed: ${res.status} ${text.slice(0, 200)}`)
  }
  const location = res.headers.get('location')
  if (!location) throw new Error('Adobe startJob: missing Location header')
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
      const msg = data.error?.message || data.error?.code || 'unknown'
      if (/quota|limit|exceeded/i.test(msg)) throw new AdobeQuotaError(msg)
      throw new Error(`Adobe job failed: ${msg}`)
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

/**
 * 通用流程：从 Key 池挑 Key，失败若是配额问题就切下一个 Key 重试
 */
async function runAdobeJob(
  inputBuffer: Buffer,
  inputMime: string,
  endpoint: string,
  body: (assetID: string) => unknown,
  pollTimeoutMs = 120_000,
): Promise<Buffer> {
  if (adobeKeyPool.isEmpty()) throw new Error('Adobe credentials not configured')

  const totalKeys = adobeKeyPool.size()
  let lastErr: unknown = null

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const key = adobeKeyPool.pick()
    if (!key) break  // 全部冷却中

    try {
      const token = await getAccessToken(key)
      const { uploadUri, assetID } = await createAsset(token, key.clientId, inputMime)
      await uploadAsset(uploadUri, inputBuffer, inputMime)
      const location = await startJob(token, key.clientId, endpoint, body(assetID))
      const downloadUri = await pollJob(token, key.clientId, location, pollTimeoutMs)
      return await downloadResult(downloadUri)
    } catch (err) {
      lastErr = err
      if (err instanceof AdobeQuotaError) {
        console.warn(`[adobe] Key ${key.clientId.slice(0, 6)}... 额度用完，切下一个`)
        adobeKeyPool.markExhausted(key.clientId)
        continue  // 试下一个 Key
      }
      throw err  // 非配额错误直接抛
    }
  }

  if (lastErr instanceof AdobeQuotaError) throw new AdobeAllKeysExhaustedError()
  throw lastErr ?? new AdobeAllKeysExhaustedError()
}

// ============================================================
// 公开 API
// ============================================================

export type ExportTarget = 'docx' | 'doc' | 'rtf' | 'xlsx' | 'pptx' | 'jpeg' | 'png'

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

export async function adobeCreatePdf(
  inputBuffer: Buffer,
  sourceExt: CreatePdfSource,
): Promise<Buffer> {
  const mime = CREATE_PDF_MIME[sourceExt]
  if (!mime) throw new Error(`adobeCreatePdf 不支持源格式: ${sourceExt}`)
  return runAdobeJob(inputBuffer, mime, '/operation/createpdf', (assetID) => ({ assetID }))
}
