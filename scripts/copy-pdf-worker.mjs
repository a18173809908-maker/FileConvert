// 把 pdfjs-dist 的 worker 复制到 public/，并在开头注入 Uint8Array toHex/fromHex polyfill
// 避免老浏览器（Chrome < 140 等）跑 pdfjs v6 时报 "a.toHex is not a function"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
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

const POLYFILL = `// --- toHex/fromHex polyfill for older browsers ---
if (typeof Uint8Array !== 'undefined' && !Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function () {
    let out = '';
    for (let i = 0; i < this.length; i++) {
      out += this[i].toString(16).padStart(2, '0');
    }
    return out;
  };
}
if (typeof Uint8Array !== 'undefined' && !Uint8Array.fromHex) {
  Uint8Array.fromHex = function (s) {
    const len = s.length / 2;
    const buf = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buf[i] = parseInt(s.substr(i * 2, 2), 16);
    }
    return buf;
  };
}
// --- end polyfill ---
`

mkdirSync(dirname(dest), { recursive: true })
const original = readFileSync(src, 'utf-8')
writeFileSync(dest, POLYFILL + original, 'utf-8')
console.log(`[copy-pdf-worker] ${src} → ${dest} (含 polyfill, ${(POLYFILL.length + original.length / 1024).toFixed(0)}KB)`)
