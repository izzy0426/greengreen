// 스크롤하며 전체 화면 캡처 (개발용): node scripts/shot.mjs URL out.png [width] [reduce]
import puppeteer from 'puppeteer-core'
const [url, out, width = '1440', reduce] = process.argv.slice(2)
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const p = await b.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await p.setViewport({ width: +width, height: 900 })
if (reduce) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await p.goto(url, { waitUntil: 'networkidle0' })
const h = await p.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < h; y += 400) {
  await p.evaluate((y) => window.scrollTo(0, y), y)
  await new Promise((r) => setTimeout(r, 120))
}
await new Promise((r) => setTimeout(r, 1200))
await p.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 300))
await p.screenshot({ path: out, fullPage: true })
console.log('height', h, 'errors', errs.length ? errs : 'none')
await b.close()
