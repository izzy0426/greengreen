// 기업 탭 동작 확인 (개발용): node scripts/e2e-company.mjs [기본 http://localhost:4173]
import puppeteer from 'puppeteer-core'
const base = process.argv[2] ?? 'http://localhost:4173'
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.setViewport({ width: 1440, height: 1000 })
const ok = (label, cond) => console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}`)

await page.goto(`${base}/company`, { waitUntil: 'networkidle0' })
const input = await page.waitForSelector('.search input')
await input.type('한국')
await new Promise((r) => setTimeout(r, 250))
const names = await page.$$eval('.search__panel li .search__name', (els) => els.map((e) => e.textContent))
ok(`'한국' 후보 5개, 앞부분 일치·비용 큰 순: ${names.join(', ')}`, names.length === 5 && names[0] === '한국남동발전')
await page.keyboard.press('ArrowDown')
await page.keyboard.press('Enter')
await page.waitForSelector('.detail-head h1')
ok(`↓ Enter → 2번째 후보로 이동: ${decodeURIComponent(page.url())}`, (await page.$eval('.detail-head h1', (e) => e.textContent)) === names[1])

await input.click({ clickCount: 3 })
await page.goto(`${base}/company`, { waitUntil: 'networkidle0' })
const input2 = await page.waitForSelector('.search input')
await input2.type('△△식품')
await new Promise((r) => setTimeout(r, 250))
const empty = await page.$eval('.search__empty', (e) => e.textContent)
await page.keyboard.press('Enter')
await new Promise((r) => setTimeout(r, 200))
ok(`없는 이름: '${empty.slice(0, 15)}…', Enter 후에도 /company`, page.url().endsWith('/company'))
await page.keyboard.press('Escape')
ok('Esc로 목록 닫힘', (await page.$('.search__panel')) === null)

await page.$eval('.search input', (e) => { e.select() })
await page.keyboard.press('Backspace')
await page.type('.search input', ' (주)  한국 남동')
await new Promise((r) => setTimeout(r, 250))
const n2 = await page.$$eval('.search__panel li .search__name', (els) => els.map((e) => e.textContent))
ok(`정규화(공백·(주) 무시): ${n2[0]}`, n2[0] === '한국남동발전')

await page.goto(`${base}/company/F1403?price=max`, { waitUntil: 'networkidle0' })
const sel = await page.$eval('.price-row .chip.is-selected', (e) => e.textContent)
const kpi = await page.$eval('.kpi-card__number', (e) => e.textContent)
ok(`price=max 주소로 바로 진입: ${sel}, 5년 비용 ${kpi}조`, sel.startsWith('매우 높은') && kpi === '5.23')
await page.click('.price-row .chip:nth-child(2)')
await new Promise((r) => setTimeout(r, 500))
ok(`칩 클릭 → URL 갱신: ${page.url()}`, !page.url().includes('price='))

await page.goto(`${base}/company/NOPE`, { waitUntil: 'networkidle0' })
ok(`없는 ID → /company: ${page.url()}`, page.url().endsWith('/company'))

const nofin = await page.evaluate(async () => {
  const p = await (await fetch('/data/units.json')).json()
  const ci = p.columns.indexOf('excludeReason'), id = p.columns.indexOf('id')
  return p.rows.find((r) => r[ci])[id]
})
await page.goto(`${base}/company/${encodeURIComponent(nofin)}`, { waitUntil: 'networkidle0' })
ok(`재무 없음 단위(${nofin}) 등급 상자: ${await page.$eval('.grade-box__label', (e) => e.textContent)}`, (await page.$eval('.grade-box__label', (e) => e.textContent)) === '재무 없음')

ok(`콘솔 오류 없음 ${errors.join(' | ')}`, errors.length === 0)
await browser.close()
