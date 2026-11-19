// 가공 JSON 스키마 — 개발 명세서 4장
// 저장 단위: 배출·할당·구매량은 t, 금액은 원. 화면 단위 변환은 lib/format.ts에서만.

export const PRICE_KEYS = ['low', 'now', 'high', 'max'] as const
export type PriceKey = (typeof PRICE_KEYS)[number]

export const YEARS = [2026, 2027, 2028, 2029, 2030] as const
export type Year = (typeof YEARS)[number]

/** ① 고위험(적자) loss · ② 고위험 high · ③ 중위험 mid · ④ 저위험 low · ⑤ 비용 없음 none · 별도(재무 없음) nofin */
export type Grade = 'loss' | 'high' | 'mid' | 'low' | 'none' | 'nofin'

export type PriceRecord<T> = Record<PriceKey, T>

/** units.json 한 행 */
export interface UnitSummary {
  id: string
  name: string
  sector: string
  orgType: string
  region: string | null
  isPublic: boolean
  isNew: boolean
  revenue3y: number | null
  opProfit3y: number | null
  opMargin3y: number | null
  /** 재무 없음 · 지자체 · 공공·비영리. 있으면 위험도 대신 '재무 없음' */
  excludeReason: string | null
  cost5y: PriceRecord<number>
  grade2030: PriceRecord<Grade>
}

/** unit/{id}.json — 가격 4 × 연도 5 */
export interface UnitYearRow {
  year: Year
  emis: number
  emisP10: number | null
  emisP90: number | null
  preAlloc: number
  freeAlloc: number
  shortfall: number
  bankStart: number
  bankUse: number
  bank: number
  purchase: number
  price: number
  cost: number
  netCost: number
  effPrice: number | null
  risk: number | null
  grade: Grade
  turnsLoss: boolean
}

export interface UnitDetail extends UnitSummary {
  years: PriceRecord<UnitYearRow[]>
}

export const PRICE_LABEL: PriceRecord<string> = {
  low: '낮은 가격',
  now: '지금 가격',
  high: '높은 가격',
  max: '매우 높은 가격',
}

export const GRADE_LABEL: Record<Grade, string> = {
  loss: '고위험(적자)',
  high: '고위험',
  mid: '중위험',
  low: '저위험',
  none: '비용 없음',
  nofin: '재무 없음',
}
