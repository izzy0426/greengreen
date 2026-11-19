// 화면 캡처(스크롤 없음): node scripts/shot-view.mjs URL out.png width height [reduce]
import puppeteer from 'puppeteer-core'
const [url, out, w = '1440', h = '1036', reduce] = process.argv.slice(2)
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const p = await b.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await p.setViewport({ width: +w, height: +h })
if (reduce) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await p.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 1500))
await p.screenshot({ path: out })
console.log('errors', errs.length ? errs : 'none')
await b.close()
