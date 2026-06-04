import 'server-only'
import { writeFile, readFile, mkdir, rm, readdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

const SOFFICE_BIN = process.env.LIBREOFFICE_BIN || 'libreoffice'
const TIMEOUT_MS = Number(process.env.LIBREOFFICE_TIMEOUT_MS || '60000')

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = join(tmpdir(), `fc-${randomBytes(8).toString('hex')}`)
  await mkdir(dir, { recursive: true })
  try {
    return await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

function runSoffice(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(SOFFICE_BIN, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new Error(`LibreOffice 转换超时（${TIMEOUT_MS}ms）`))
    }, TIMEOUT_MS)

    proc.on('exit', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error(`LibreOffice 退出码 ${code}${stderr ? ': ' + stderr.slice(0, 200) : ''}`))
    })
    proc.on('error', (err) => {
      clearTimeout(timer)
      reject(new Error(`LibreOffice 启动失败: ${err.message}`))
    })
  })
}

/**
 * 用 LibreOffice 转换文件。
 * - inputExt：输入文件扩展名（不含点）
 * - targetFormat：目标格式（pdf / docx / doc / odt 等 LibreOffice 识别的）
 */
export async function convertWithLibreOffice(
  input: Buffer,
  inputExt: string,
  targetFormat: string,
): Promise<Buffer> {
  return withTempDir(async (workDir) => {
    const inputPath = join(workDir, `input.${inputExt}`)
    const outDir = join(workDir, 'out')
    const profileDir = join(workDir, 'profile')
    await mkdir(outDir, { recursive: true })
    await writeFile(inputPath, input)

    // -env:UserInstallation 让每次调用用独立 profile，避免锁文件冲突
    const args = [
      '--headless',
      '--nologo',
      '--nofirststartwizard',
      `-env:UserInstallation=file://${profileDir}`,
      '--convert-to', targetFormat,
      '--outdir', outDir,
      inputPath,
    ]
    await runSoffice(args, workDir)

    // LibreOffice 输出文件名：原文件名（去扩展） + 新扩展
    // targetFormat 可能带 filter 后缀，例如 'pdf:writer_pdf_Export'，取第一个冒号前
    const targetExt = targetFormat.split(':')[0]
    const files = await readdir(outDir)
    const outFile = files.find(f => f.toLowerCase().endsWith(`.${targetExt.toLowerCase()}`))
    if (!outFile) {
      throw new Error(`LibreOffice 未生成 .${targetExt} 输出文件`)
    }
    return await readFile(join(outDir, outFile))
  })
}
