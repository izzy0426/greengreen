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
  /** 분석단위ID — URL /company/:unitId 에 씀 */
  id: string
  /** unit/{key}.json 파일 이름 (ID에 한글·기호가 있어 해시) */
  key: string
  name: string
  /** 법인 표기(주식회사·(주) 등)를 뺀 이름 */
  displayName: string
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
  /** 2030 위험도 = 탄소비용 ÷ 영업이익(3년 평균). 영업이익 ≤ 0 이거나 재무 없음이면 null */
  risk2030: PriceRecord<number | null>
  /** 2030 모자라는 양(t). 음수면 남음 */
  shortfall2030: number
}

/** unit/{id}.json — 가격 4 × 연도 5 */
export interface UnitYearRow {
  year: Year
  emis: number
  emisP10: number | null
  emisP90: number | null
  preAlloc: number
  freeAlloc: number
  paidAlloc: number
  /** 3차 규칙(2025 무상할당) 비교용 */
  freeAlloc2025: number | null
  shortfall: number
  bankStart: number
  bankUse: number
  bank: number
  purchase: number
  surplusSold: number
  price: number
  cost: number
  saleRevenue: number
  netCost: number
  effPrice: number | null
  risk: number | null
  /** 탄소비용 반영 후 영업이익률 */
  marginAfter: number | null
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

/** article.json — 데이터 파이프라인 build_article() 참고 */
export interface YearTotal {
  year: Year
  emis: number
  preAlloc: number
  freeAlloc: number
  bankUse: number
  purchase: number
  cost: number
  saleRevenue: number
  netCost: number
  price: number
}

export interface SectorRow {
  sector: string
  units: number
  emis5y: number
  emisShare: number
  cost5y: PriceRecord<number>
  costShare: PriceRecord<number>
}

export interface HistoryRow {
  year: number
  phase: 1 | 2 | 3
  emis: number
  netAlloc: number
  surplus: number
  units: number
}

export interface EffPriceRow {
  year: Year
  rule3: number
  rule4: number
  shareOfMarket: number
}

export interface ArticleData {
  source: string
  hero: { cost5yNow: number; powerCostShare: number; powerEmisShare: number; shortUnits2030: number; totalUnits: number }
  yearly: PriceRecord<YearTotal[]>
  purchasePressure2030: number
  sectors: SectorRow[]
  grades2030: PriceRecord<Record<Grade, number>>
  turnsLoss: { base: number; byYear: PriceRecord<number[]>; bySector2030: PriceRecord<Record<string, number>> }
  concentration: {
    top10: { id: string; name: string; sector: string; cost5y: number; riskAvg: number | null }[]
    top10Share: number
    top10PowerCount: number
    unitsWithCost: number
    gencos5Cost5y: number
  }
  effPrice: Record<string, EffPriceRow[]>
  history: HistoryRow[]
  historyInsights: { phase3AvgSurplus: number; maxSurplus: HistoryRow; bankStart2026: number }
  ranges: Record<string, Record<string, { emis: number; gapTotal: number; purchase: number; cost: number; netCost: number | null }>>
}
