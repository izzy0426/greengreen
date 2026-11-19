// 03 검색 자동완성 규칙 (명세서 6장)
// 입력 정규화(공백·(주)·주식회사 제거, 영문 대소문자 무시) 후 부분 일치.
// 앞부분 일치 먼저, 그다음 5년 비용 큰 순, 최대 5개.
import type { UnitSummary } from './types'

export function normalize(s: string): string {
  return s
    .replace(/주식회사|\(주\)|㈜|\(유\)|유한회사/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function searchUnits(units: UnitSummary[], query: string, limit = 5): UnitSummary[] {
  const q = normalize(query)
  if (!q) return []
  const hits: { u: UnitSummary; prefix: boolean }[] = []
  for (const u of units) {
    const n = normalize(u.name)
    const i = n.indexOf(q)
    if (i >= 0) hits.push({ u, prefix: i === 0 })
  }
  hits.sort((a, b) => Number(b.prefix) - Number(a.prefix) || b.u.cost5y.now - a.u.cost5y.now)
  return hits.slice(0, limit).map((h) => h.u)
}
