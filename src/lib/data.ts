// 가공 JSON 불러오기. 숫자는 그대로 쓰고 여기서 새로 만들지 않는다.
import type { ArticleData, PriceKey, UnitDetail, UnitSummary } from './types'

interface PackedUnits {
  priceKeys: PriceKey[]
  columns: (keyof UnitSummary)[]
  rows: unknown[][]
}

/** units.json(열 + 행 배열) → UnitSummary[] */
export function unpackUnits(p: PackedUnits): UnitSummary[] {
  return p.rows.map((row) => {
    const u: Record<string, unknown> = {}
    p.columns.forEach((c, i) => {
      const v = row[i]
      u[c] = Array.isArray(v) ? Object.fromEntries(p.priceKeys.map((k, j) => [k, v[j]])) : v
    })
    return u as unknown as UnitSummary
  })
}

const cache = new Map<string, Promise<unknown>>()
function getJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(path).then((r) => {
        if (!r.ok) throw new Error(`${path}: ${r.status}`)
        return r.json()
      }),
    )
  }
  return cache.get(path) as Promise<T>
}

export const loadUnits = () => getJson<PackedUnits>('/data/units.json').then(unpackUnits)
export const loadUnitDetail = (key: string) => getJson<UnitDetail>(`/data/unit/${key}.json`)
export const loadArticle = () => getJson<ArticleData>('/data/article.json')
