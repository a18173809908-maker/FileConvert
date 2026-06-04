import 'server-only'
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

const PY = process.env.PYTHON_BIN || 'python3'
const TIMEOUT_MS = Number(process.env.PDF2DOCX_TIMEOUT_MS || '90000')

const PY_SCRIPT = `
import sys
from pdf2docx import Converter
inp, out = sys.argv[1], sys.argv[2]
cv = Converter(inp)
cv.convert(out)
cv.close()
print("OK")
`

export async function pdf2docx(pdfBuffer: Buffer): Promise<Buffer> {
  const dir = join(tmpdir(), `fc-pdf2docx-${randomBytes(8).toString('hex')}`)
  await mkdir(dir, { recursive: true })
  const inputPath = join(dir, 'input.pdf')
  const outputPath = join(dir, 'output.docx')

  try {
    await writeFile(inputPath, pdfBuffer)

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(PY, ['-c', PY_SCRIPT, inputPath, outputPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      let stderr = ''
      proc.stderr.on('data', (d) => { stderr += d.toString() })

      const timer = setTimeout(() => {
        proc.kill('SIGKILL')
        reject(new Error(`pdf2docx 转换超时（${TIMEOUT_MS}ms）`))
      }, TIMEOUT_MS)

      proc.on('exit', (code) => {
        clearTimeout(timer)
        if (code === 0) resolve()
        else reject(new Error(`pdf2docx 退出码 ${code}${stderr ? ': ' + stderr.slice(0, 300) : ''}`))
      })
      proc.on('error', (err) => {
        clearTimeout(timer)
        reject(new Error(`pdf2docx 启动失败: ${err.message}`))
      })
    })

    return await readFile(outputPath)
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
