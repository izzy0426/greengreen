// lab.html 화면 캡처·동작 확인 (개발용): node scripts/shot-labdec.mjs [width]
import puppeteer from 'puppeteer-core'
import { pathToFileURL } from 'url'
const w = +(process.argv[2] ?? 1440)
const url = pathToFileURL(process.cwd() + '/lab-decision/lab.html').href
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const p = await b.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await p.setViewport({ width: w, height: 900 })
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await p.goto(url, { waitUntil: 'load' })
const shot = (n) => p.screenshot({ path: `/tmp/ld-${w}-${n}.png`, fullPage: true })
await shot('1start')
await p.click('#start')
await p.keyboard.press('ArrowDown') // 원안(②) → ③
await shot('2preview')
await p.keyboard.press('Enter')
await shot('3signed')
await p.click('#next')
await p.keyboard.press('ArrowDown')
await p.keyboard.press('Enter')
await p.click('#next')
await shot('4carry')
await p.keyboard.press('Enter')
await p.click('#next')
await shot('5report')
console.log('hash', await p.evaluate(() => location.hash), 'errors', errs.length ? errs : 'none')
await b.close()
