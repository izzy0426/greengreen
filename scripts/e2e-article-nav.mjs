// 아티클 목차 바 확인 (개발용): node scripts/e2e-article-nav.mjs [base]
import puppeteer from 'puppeteer-core'
const base = process.argv[2] ?? 'http://localhost:4173'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const p = await b.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
let fails = 0
const ok = (l, c) => { if (!c) fails++; console.log(`${c ? 'OK  ' : 'FAIL'} ${l}`) }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
for (const [w, h] of [[1440, 900], [375, 800]]) {
  await p.setViewport({ width: w, height: h })
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await p.goto(`${base}/`, { waitUntil: 'networkidle0' })
  await p.waitForSelector('.chapnav a')
  ok(`${w}: 처음 강조 = ${await p.$eval('.chapnav a.is-on', (e) => e.textContent)}`, (await p.$eval('.chapnav a.is-on', (e) => e.textContent)) === '한눈에 보기')
  await p.click('.chapnav a[data-id="ch-3"]')
  await wait(400)
  const top = await p.$eval('#ch-3', (e) => Math.round(e.getBoundingClientRect().top))
  ok(`${w}: 03 클릭 → 챕터 위치 ${top}px (헤더+목차 122)`, Math.abs(top - 121) <= 3)
  ok(`${w}: 강조 = ${await p.$eval('.chapnav a.is-on', (e) => e.textContent)}`, (await p.$eval('.chapnav a.is-on', (e) => e.dataset.id)) === 'ch-3')
  const vis = await p.$eval('.chapnav a.is-on', (e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth })
  ok(`${w}: 강조 항목이 화면 안`, vis)
  const prog = await p.$eval('.chapnav__bar i', (e) => e.style.transform)
  ok(`${w}: 진행 막대 ${prog}`, /scaleX\(0\.[1-9]/.test(prog))
  const navTop = await p.$eval('.chapnav', (e) => e.getBoundingClientRect().top)
  ok(`${w}: 목차 바 고정 top=${navTop}`, navTop === 64)
}
ok('오류 없음', errors.length === 0)
await b.close()
process.exit(fails ? 1 : 0)
