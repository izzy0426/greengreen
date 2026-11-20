// 기업 페이지 데이터 — 팀원 원본 페이지 JS(loadCo, r3, e25, suggest)와 같은 식으로 계산한다.

export const SCENARIOS = ['3차 회귀', '현재 유지', 'IEA 현행정책', '전환 필요'] as const
export type Scenario = (typeof SCENARIOS)[number]
/** 가격 시나리오 이름 → 2030년 가격 (요청서 기준) */
export const SCENARIO_PRICE: Record<Scenario, string> = {
  '3차 회귀': '1만 원',
  '현재 유지': '3만 원',
  'IEA 현행정책': '7.8만 원',
  '전환 필요': '11.5만 원',
}

/** h[연도] = [순할당, 인증 배출(없으면 null), 이월] · p[연도] = [사전할당, 무상할당, 유상 %] (t) */
export interface Company {
  id: string
  n: string
  m: string[]
  s: string
  b?: string
  h: Record<string, [number, number | null, number]>
  p: Record<string, [number, number, number]>
  k: string | null
  fin?: { S: number; O: number; r: number }
  f?: {
    e: number[] // 2026–2030 예측 배출
    b: number[] // 연도별 구매량
    c: Record<Scenario, number[]> // 연도별 탄소비용 (억 원)
    S: number | null
    O: number | null
    x: string | null
    t: string
  }
  // 파생값
  _e: number // 2025 인증 배출 (2025 할당 > 0일 때), 아니면 -1
  _r: { A: number; E: number; r: number; short: number } | null
  _rank?: number
  _key: string
  _n2: string
  _cho: string
}

export interface CompanyMeta {
  h7: Record<string, [number, number]>
  gap: Record<string, number>
  kind: Record<string, [string, string]>
  source: string
}

export interface CompanyStore {
  all: Company[]
  ranked: Company[]
  byId: Map<string, Company>
  ratioMed: Record<string, { m: number; n: number }>
  sectorSum: [string, number][]
  total: number
  sectors: string[]
  meta: CompanyMeta
}

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
export function cho(t: string) {
  let r = ''
  for (const ch of t) {
    const c = ch.charCodeAt(0)
    r += c >= 0xac00 && c <= 0xd7a3 ? CHO[Math.floor((c - 0xac00) / 588)] : ch.toLowerCase()
  }
  return r
}
export const isCho = (q: string) => /^[ㄱ-ㅎ]+$/.test(q)
export const norm = (s: string) => s.toLowerCase().replace(/\s|\(주\)|주식회사|㈜|한국/g, '')
const clean = (t: string) => t.replace(/\s|\(주\)|주식회사|㈜/g, '')

function r3(u: Company) {
  let A = 0
  let E = 0
  let n = 0
  let short = 0
  for (let y = 2021; y <= 2025; y++) {
    const h = u.h[y]
    if (h && h[0] > 0 && h[1] != null) {
      A += h[0]
      E += h[1]
      n++
      if (h[1] > h[0]) short++
    }
  }
  return n === 5 ? { A, E, r: E / A, short } : null
}
function e25(u: Company) {
  const h = u.h[2025]
  return h && h[1] != null && h[0] > 0 ? h[1] : -1
}

let storeP: Promise<CompanyStore> | null = null
export function loadCompanies(): Promise<CompanyStore> {
  if (storeP) return storeP
  const get = (p: string) =>
    fetch(p).then((r) => {
      if (!r.ok) throw new Error(`${p}: ${r.status}`)
      return r.json()
    })
  storeP = Promise.all([get('/data/companies.json'), get('/data/companies_meta.json')]).then(
    ([raw, meta]: [Company[], CompanyMeta]) => {
      const all = raw.filter((u) => Object.keys(u.h).length || Object.keys(u.p).length)
      all.forEach((u) => {
        u._r = r3(u)
        u._e = e25(u)
        u._key = norm(u.n + ' ' + u.id + ' ' + u.m.join(' '))
        u._n2 = clean(u.n).toLowerCase()
        u._cho = cho(clean(u.n) + ' ' + u.m.map(clean).join(' '))
      })
      // 업종 중앙값: r3가 있는 기업으로 (원본과 같이 정렬 후 floor(n/2) 번째)
      const bySec: Record<string, number[]> = {}
      all.forEach((u) => {
        if (u._r) (bySec[u.s] = bySec[u.s] || []).push(u._r.r)
      })
      const ratioMed: CompanyStore['ratioMed'] = {}
      for (const k in bySec) {
        const a = bySec[k].sort((x, y) => x - y)
        ratioMed[k] = { m: a[Math.floor(a.length / 2)], n: a.length }
      }
      const ranked = all.filter((u) => u._e >= 0).sort((a, b) => b._e - a._e)
      ranked.forEach((u, i) => (u._rank = i + 1))
      const se: Record<string, number> = {}
      ranked.forEach((u) => (se[u.s] = (se[u.s] || 0) + u._e))
      const sectorSum = Object.entries(se).sort((a, b) => b[1] - a[1])
      const total = ranked.reduce((s, u) => s + u._e, 0)
      const sectors = [...new Set(all.map((u) => u.s).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'))
      return { all, ranked, byId: new Map(all.map((u) => [u.id, u])), ratioMed, sectorSum, total, sectors, meta }
    },
  )
  storeP.catch(() => (storeP = null))
  return storeP
}

export function match(u: Company, q: string) {
  if (!q) return true
  if (isCho(q)) return u._cho.includes(q)
  return u._key.includes(norm(q)) || u._n2.includes(q.toLowerCase())
}

/** 자동완성 — 앞부분이 맞는 것 먼저, 그다음 2025 배출 큰 순, 최대 8개 */
export function suggest(all: Company[], raw: string): Company[] {
  const q = raw.replace(/\s/g, '')
  if (!q) return []
  const ch = isCho(q)
  return all
    .filter((u) => match(u, q))
    .map((u) => ({ u, s: (ch ? u._cho.startsWith(q) : u._n2.startsWith(q.toLowerCase())) ? 0 : 1 }))
    .sort((a, b) => a.s - b.s || b.u._e - a.u._e)
    .slice(0, 8)
    .map((x) => x.u)
}

export type SortKey = 'e' | 'r' | 'n'
export function filterSort(all: Company[], q: string, sec: string, so: SortKey): Company[] {
  const qr = q.replace(/\s/g, '')
  const r = all.filter((u) => (!sec || u.s === sec) && (!qr || match(u, qr)))
  if (so === 'e') r.sort((a, b) => b._e - a._e)
  else if (so === 'r') r.sort((a, b) => (b._r ? b._r.r : -1) - (a._r ? a._r.r : -1))
  else r.sort((a, b) => a.n.localeCompare(b.n, 'ko'))
  return r
}

/** 구매 필요 여부: f 없음 → 분석 대상 아님, 5년 구매량 0 → 구매 필요 없음, 그 밖 → 구매 필요 */
export type BuyGroup = 'none' | 'buy' | 'na'
export const buy5 = (u: Company) => (u.f ? u.f.b.reduce((x, y) => x + y, 0) : 0)
export const buyGroup = (u: Company): BuyGroup => (!u.f ? 'na' : buy5(u) === 0 ? 'none' : 'buy')

// 숫자 표기 — 원본 fmt / man
export function fmt(v: number, d?: number) {
  return Number(v).toLocaleString('ko-KR', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d || 0 })
}
/** t → 만 t (100만 t 이상은 소수 없이) */
export const man = (v: number | null | undefined) =>
  v == null ? '–' : Math.abs(v) >= 1e6 ? fmt(v / 1e4, 0) : fmt(v / 1e4, 1)
export const shortName = (n: string) => n.replace(/주식회사|\(주\)|㈜/g, '').trim()
