// 把 pdfjs-dist 的 worker 复制到 public/，让浏览器直接从同源加载，避免 CDN 不可用
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const src = resolve(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
const dest = resolve(root, 'public/pdf.worker.min.mjs')

if (!existsSync(src)) {
  console.error(`[copy-pdf-worker] 找不到源文件: ${src}`)
  process.exit(1)
}

mkdirSync(dirname(dest), { recursive: true })
copyFileSync(src, dest)
console.log(`[copy-pdf-worker] ${src} → ${dest}`)
