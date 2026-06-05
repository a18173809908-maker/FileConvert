import 'server-only'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

const QPDF_BIN = process.env.QPDF_BIN || 'qpdf'
const QPDF_TIMEOUT_MS = Number(process.env.QPDF_TIMEOUT_MS || '60000')

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = join(tmpdir(), `fc-qpdf-${randomBytes(8).toString('hex')}`)
  await mkdir(dir, { recursive: true })
  try {
    return await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

function runQpdf(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(QPDF_BIN, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new Error(`qpdf 处理超时（${QPDF_TIMEOUT_MS}ms）`))
    }, QPDF_TIMEOUT_MS)

    proc.on('exit', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || `qpdf 退出码 ${code}`))
    })
    proc.on('error', (err) => {
      clearTimeout(timer)
      reject(new Error(`qpdf 启动失败: ${err.message}`))
    })
  })
}

function normalizeQpdfError(err: unknown, action: 'encrypt' | 'decrypt'): Error {
  const message = err instanceof Error ? err.message : String(err)
  if (/invalid password|incorrect password|password/i.test(message) && action === 'decrypt') {
    return new Error('PDF 密码不正确，无法解密')
  }
  if (/not encrypted/i.test(message) && action === 'decrypt') {
    return new Error('该 PDF 未加密，无需解密')
  }
  if (/qpdf 启动失败/i.test(message)) {
    return new Error('服务器未安装 qpdf，暂时无法处理 PDF 加密/解密')
  }
  return new Error(action === 'encrypt' ? `PDF 加密失败: ${message}` : `PDF 解密失败: ${message}`)
}

export async function encryptPdf(input: Buffer, password: string): Promise<Buffer> {
  if (!password) throw new Error('请输入 PDF 打开密码')

  return withTempDir(async (dir) => {
    const inputPath = join(dir, 'input.pdf')
    const outputPath = join(dir, 'output.pdf')
    await writeFile(inputPath, input)

    try {
      await runQpdf([
        '--encrypt',
        password,
        password,
        '256',
        '--',
        inputPath,
        outputPath,
      ], dir)
      return await readFile(outputPath)
    } catch (err) {
      throw normalizeQpdfError(err, 'encrypt')
    }
  })
}

export async function decryptPdf(input: Buffer, password: string): Promise<Buffer> {
  if (!password) throw new Error('请输入 PDF 密码')

  return withTempDir(async (dir) => {
    const inputPath = join(dir, 'input.pdf')
    const outputPath = join(dir, 'output.pdf')
    await writeFile(inputPath, input)

    try {
      await runQpdf([
        `--password=${password}`,
        '--decrypt',
        inputPath,
        outputPath,
      ], dir)
      return await readFile(outputPath)
    } catch (err) {
      throw normalizeQpdfError(err, 'decrypt')
    }
  })
}
