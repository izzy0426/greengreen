// 기업 페이지 동작·숫자 확인 (개발용): node scripts/e2e-company.mjs [기본 http://localhost:4173]
// 기대값은 팀원 원본 페이지와 같은 식(data-pipeline/check_companies.py)으로 계산한 값
import puppeteer from 'puppeteer-core'
const base = process.argv[2] ?? 'http://localhost:4173'
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.setViewport({ width: 1440, height: 1000 })
let fails = 0
const ok = (label, cond) => {
  if (!cond) fails++
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}`)
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const text = (sel) => page.$eval(sel, (e) => e.innerText.replace(/\s+/g, ' ').trim())

await page.goto(`${base}/company`, { waitUntil: 'networkidle0' })
await page.waitForSelector('.co .profile')
const kpi = await page.$$eval('.co-top b', (els) => els.map((e) => e.innerText.replace(/\s+/g, '')))
ok(`KPI ${kpi.join(' / ')}`, kpi.join('|') === '712곳|50.6%|79.0%|529.8')
const firstBar = await page.$eval('.co .cd .lbl', (e) => e.textContent)
ok(`업종 1위 막대 값 ${firstBar}`, firstBar === '175.2')
const sig = await page.$$eval('.co .cd:nth-of-type(2) .lbl', (els) => els.map((e) => e.textContent).filter((t) => t.endsWith('%')))
ok(`구매 필요 여부 ${sig.join(' / ')}`, sig.join('|') === '38.9%|60.8%|0.3%')

// 기본 선택 = 포스코
const h2 = await text('.ph h2')
const kv = await page.$$eval('.kv b', (els) => els.map((e) => e.innerText.replace(/\s+/g, '')))
ok(`기본 프로필 ${h2} · ${kv.join(' / ')}`, h2 === '포스코' && kv.join('|') === '6,986만t|7,362만t|1,181만t')
ok('포스코 신호 A', (await text('.signal h3')) === '4차에 배출권을 살 필요가 없다')
const ratio = await text('.big2')
const ratioCap = await page.$$eval('.pc .cap', (els) => els.map((e) => e.textContent).find((t) => t.includes('중앙값')))
ok(`3차 비율 ${ratio} · ${ratioCap}`, ratio.startsWith('95') && ratioCap.includes('철강 업종 중앙값 89% (42곳)'))
const fin = await page.$$eval('.pgrid .mini3', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ')))
ok(`재무 ${fin[0]}`, fin[0].includes('387,978') && fin[0].includes('30,054') && fin[0].includes('7.7%'))
ok(`4차 ${fin[1]}`, fin[1].includes('5,524') && fin[1].includes('6,035'))
ok('구매 불필요 기업은 가격표 없음', (await page.$('.pc table')) === null)

// 검색: 초성 → ↓ Enter
const input = await page.waitForSelector('.sbox input')
await input.type('ㄴㄷ')
await wait(150)
const opts = await page.$$eval('.acl li b', (els) => els.map((e) => e.textContent))
ok(`초성 'ㄴㄷ' 후보 ${opts.length}개: ${opts.slice(0, 3).join(', ')}`, opts.length > 0 && opts.length <= 8 && opts[0] === '한국남동발전')
await page.keyboard.press('ArrowDown')
await page.keyboard.press('Enter')
await wait(300)
ok(`↓ Enter → ${await text('.ph h2')}`, (await text('.ph h2')) === opts[0])
ok(`URL ${decodeURIComponent(page.url())}`, page.url().endsWith('/company/F1403'))

// 구매 필요(적자 전환) 신호·표
ok('남동 신호 C', (await text('.signal h3')) === '3만 원 시나리오에서 적자로 전환된다')
ok(
  '남동 신호 문장',
  (await text('.signal__d')) === '4차 5년 동안 6,683만 t을 사야 하는 것으로 계산된다. 2030년 가격이 3만 원이면 탄소 비용 5,201억 원이 2023–2025년 평균 영업이익(4,211억 원)보다 커진다.',
)
const rows = await page.$$eval('.pc tbody tr', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim() + (e.className ? ' *' : '')))
ok(`남동 표 ${rows.join(' | ')}`, rows.join('|') === '1만 원 1,734 41% 흑자|3만 원 5,201 124% 적자 *|7.8만 원 13,523 321% 적자|11.5만 원 19,937 473% 적자')

// 검색: Esc 닫힘, 없는 이름
await page.$eval('.sbox input', (e) => e.select())
await page.keyboard.type('금호석유')
await wait(150)
await page.keyboard.press('Escape')
ok('Esc로 추천 닫힘', (await page.$('.acl')) === null)
await page.$eval('.sbox input', (e) => e.select())
await page.keyboard.type('없는회사이름')
await wait(150)
ok(`없는 이름: ${await text('.acl')}`, (await text('.acl')) === '일치하는 기업 없음')
await page.keyboard.press('Enter')
await wait(200)
ok(`목록 ${await text('.count')}`, (await text('.count')) === '검색 결과 없음')

// 구매 필요 + 흑자 (신호 B), 재무 없음 (신호 D)
await page.goto(`${base}/company/F0118`, { waitUntil: 'networkidle0' })
await page.waitForSelector('.signal')
ok(`금호석유화학 신호 B: ${await text('.signal__d')}`, (await text('.signal__d')) === '4차 5년 동안 522만 t을 사야 하는 것으로 계산된다. 2030년 가격이 3만 원이면 탄소 비용은 353억 원으로 평균 영업이익의 17%다.')
await page.goto(`${base}/company/F0010`, { waitUntil: 'networkidle0' })
await page.waitForSelector('.signal')
ok(`강릉에코파워 신호 D: ${await text('.signal__d')}`, (await text('.signal__d')) === '4차 5년 동안 1,590만 t을 사야 하는 것으로 계산된다. 2030년 가격이 3만 원이면 탄소 비용은 1,218억 원이다. 재무 정보가 없어 이익과 비교하지 않았다.')

// 업종 막대 → 필터
await page.goto(`${base}/company`, { waitUntil: 'networkidle0' })
await page.waitForSelector('.bar-pick')
const picks = await page.$$('.bar-pick')
await picks[1].click()
await wait(400)
const sec = await page.$eval('#co-sec', (e) => e.value)
const rs = await page.$$eval('.results .rs', (els) => [...new Set(els.map((e) => e.textContent))])
ok(`철강 막대 → 업종 ${sec}, 목록 업종 ${rs.join(',')}`, sec === '철강' && rs.join() === '철강')
ok(`목록 최대 80곳`, (await page.$$eval('.results li', (l) => l.length)) <= 80)

// 실험실을 먼저 연 뒤에도 3차 비율 막대가 깨지지 않는지 (실험실 .meter와 이름 충돌 회귀)
await page.goto(`${base}/lab`, { waitUntil: 'networkidle0' })
await page.click('a[href="/company"]')
await page.waitForSelector('.co-meter')
const mh = await page.$eval('.co-meter', (e) => Math.round(e.getBoundingClientRect().height))
ok(`실험실 → 기업 이동 후 비율 막대 높이 ${mh}px`, mh === 10)

ok('콘솔 오류 없음', errors.length === 0)
if (errors.length) console.log(errors)
await browser.close()
process.exit(fails ? 1 : 0)
