// 실험실(정적 페이지 public/lab-sim) 확인 (개발용): node scripts/e2e-lab-sim.mjs [base]
import puppeteer from 'puppeteer-core'
const base = process.argv[2] ?? 'http://localhost:4173'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('requestfailed', (r) => errs.push('failed ' + r.url()))
p.on('response', (r) => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()))
let fails = 0
const ok = (l, c) => { if (!c) fails++; console.log(`${c ? 'OK  ' : 'FAIL'} ${l}`) }
const w = (ms) => new Promise((r) => setTimeout(r, ms))
// 아티클 → 헤더 '실험실' 탭
await p.goto(base + '/', { waitUntil: 'networkidle0' })
await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.header__tabs a[href="/lab"]')])
await p.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {})
ok(`헤더 실험실 탭 → ${new URL(p.url()).pathname}`, /^\/lab(-sim\/)?/.test(new URL(p.url()).pathname))
await p.waitForFunction(() => !document.getElementById('g-start').disabled, { timeout: 8000 })
ok(`데이터 불러옴: '${await p.$eval('#g-start', (e) => e.textContent.trim())}'`, (await p.$eval('#g-start', (e) => e.textContent.trim())) === '업무 시작')
ok('사이트 헤더 (로고·탭 3개, 실험실 활성)', (await p.$eval('.hdr', (e) => e.innerText.replace(/\s+/g, ' ').trim())) === '배출권 길라잡이 아티클 기업 실험실' && (await p.$eval('.site-tabs a[aria-current]', (e) => e.textContent)) === '실험실')
const fam = await p.evaluate(() => document.fonts.check('16px Pretendard'))
ok('Pretendard 폰트 로드', fam)
// 헤더 '기업' → 사이트 기업 페이지
await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.site-tabs a[href="/company"]')])
await p.waitForSelector('.co .profile', { timeout: 8000 })
ok(`기업 탭 → ${new URL(p.url()).pathname}`, new URL(p.url()).pathname === '/company')
ok('오류 없음', errs.length === 0)
if (errs.length) console.log(errs)
await b.close()
process.exit(fails ? 1 : 0)
