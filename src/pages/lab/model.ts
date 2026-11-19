// 실험실 상태 = levers[9] 하나 (명세서 7장). 결과·미터·장면 단계는 모두 여기서 꺼냄 (따로 저장하지 않음)
import type { PriceKey } from '../../lib/types'

export type Step = 1 | 2 | 3 | 4
export type Levers = [Step, Step, Step, Step, Step, Step, Step, Step, Step]

export interface LeverDef {
  key: string
  name: string
  group: '가격' | '할당' | '이월' | '전기요금' | '기업 대응'
  /** 숫자가 정해진 단계 (명세서 6장 레버 표). 나머지 단계는 '가정' */
  known: Step[]
  /** 항상 '가정' 배지 (값 자체가 미정인 레버, 하이파이 05) */
  alwaysAssumed?: boolean
  /** 단계 설명 툴팁 */
  explain: string
}

// 레버 순서 = lever 문자열 순서 (명세서 6장)
export const LEVERS: LeverDef[] = [
  { key: 'price', name: '배출권 가격', group: '가격', known: [1, 2, 3, 4], explain: '2030년 배출권 가격 시나리오. 1 낮은(1만) · 2 지금(3만) · 3 높은(7.8만) · 4 매우 높은(11.5만 원)' },
  { key: 'cap', name: '배출허용총량', group: '할당', known: [1], explain: '사전할당을 얼마나 조일지. 1단계 = 현행 4차 총량. 2~4단계 값은 아직 정해지지 않았어요.' },
  { key: 'powerPaid', name: '발전 유상 비율', group: '할당', known: [1], explain: '발전 부문이 돈을 내고 사야 하는 몫. 1단계 = 현행(2030년 50%). 2~4단계 값은 미정.' },
  { key: 'otherPaid', name: '발전 외 유상 비율', group: '할당', known: [1], explain: '발전 외 업종의 유상 몫. 1단계 = 현행(15%, 확인 필요). 2~4단계 값은 미정.' },
  { key: 'leakFree', name: '탄소누출 업종 무상', group: '할당', known: [1], explain: '철강·시멘트·석유화학 등 탄소누출 업종의 무상 비율. 1단계 = 100% 무상. 2~4단계 값은 미정.' },
  { key: 'bank', name: '이월 잔고 사용', group: '이월', known: [2], explain: '남는 배출권을 다음 해로 넘기는 규칙. 2단계 = 현행(이월 N배 규칙). 나머지 단계 값은 미정.' },
  { key: 'passThrough', name: '요금 전가율', group: '전기요금', known: [], alwaysAssumed: true, explain: '발전 비용 중 전기요금으로 가는 몫. 총비용은 그대로, 나눠 보여 주기만 해요. 값은 H8 분석 뒤 정해요.' },
  { key: 'reduction', name: '에너지 사용 감축', group: '기업 대응', known: [1, 3], alwaysAssumed: true, explain: '기업이 에너지 사용을 줄여 배출이 줄어드는 정도. 1 = 그대로 · 3 = 배출 −5%(엔진 민감도). 2·4단계는 미정.' },
  { key: 'invest', name: '감축 설비 투자', group: '기업 대응', known: [], alwaysAssumed: true, explain: '감축 설비 투자의 배출 효과는 아직 정하지 않아, 장면과 숫자가 바뀌지 않아요.' },
]

export const DEFAULT_LEVERS: Levers = [2, 1, 1, 1, 1, 2, 2, 1, 1]
const PRICE_BY_STEP: Record<Step, PriceKey> = { 1: 'low', 2: 'now', 3: 'high', 4: 'max' }

export function parseLevers(s: string | null): Levers {
  if (!s || !/^[1-4]{9}$/.test(s)) return [...DEFAULT_LEVERS]
  return s.split('').map(Number) as Levers
}
export const leverString = (l: Levers) => l.join('')
export const isDefault = (l: Levers) => leverString(l) === leverString(DEFAULT_LEVERS)

/** 이 단계가 숫자가 정해진 단계인지 */
export const isKnownStep = (i: number, step: Step) => LEVERS[i].known.includes(step)
/** '가정' 배지를 달지 */
export const isAssumed = (i: number, step: Step) => !!LEVERS[i].alwaysAssumed || !isKnownStep(i, step)

/** 레버 → 미리 계산한 조합 키. 정해지지 않은 단계는 숫자를 바꾸지 않음(현행 값) */
export function comboKey(l: Levers): string {
  const price = PRICE_BY_STEP[l[0]]
  const reduction = l[7] === 3 ? '3' : '1'
  return `${price}-${reduction}`
}
export const priceOf = (l: Levers) => PRICE_BY_STEP[l[0]]

/** 장면 단계 (명세서 7장, 경계값 ±3%·+6%는 디자인 가정) */
export function sceneOf(meter: number): 1 | 2 | 3 | 4 | 5 {
  if (meter > 0.06) return 1
  if (meter > 0.03) return 2
  if (meter > 0) return 3
  if (meter >= -0.03) return 4
  return 5
}
export const SCENE_NAME = { 1: '최악', 2: '오염', 3: '전환 중', 4: '총량 안', 5: '최선' } as const
export const SCENE_ALT = {
  1: '검은 연기와 갈색 하늘, 탁한 강이 있는 산업 도시',
  2: '굴뚝 연기가 짙은 산업 도시와 항구',
  3: '연기가 줄고 태양광이 일부 들어선 도시',
  4: '태양광과 풍력이 늘고 하늘이 맑아진 도시',
  5: '연기 없이 풍력과 숲이 가득한 도시',
} as const

/** 요금 전가율 단계별 예시 비율 — 화면에서 나눠 보여 주기만 (가정, 결정 기록 D27) */
export const PASS_THROUGH_EXAMPLE: Record<Step, number> = { 1: 0, 2: 0.35, 3: 0.7, 4: 1 }

export interface LabYear {
  year: number
  emis: number
  preAlloc: number
  freeAlloc: number
  purchase: number
  cost: number
  netCost: number
  price: number
}
export interface LabCombo {
  yearly: LabYear[]
  meter: number
  pins: {
    powerCost2030: number
    powerPurchase2030: number
    steelCementFreeRatio2030: number
    steelSurplus2030: number
    petroEmis2030: number
    petroFree2030: number
  }
  sectorCost5y: { sector: string; cost: number }[]
  grades2030: Record<'loss' | 'high' | 'mid' | 'low' | 'none' | 'nofin', number>
  top5: { id: string; name: string; sector: string; purchase5y: number; cost5y: number; risk2030: number | null; noFinance: boolean }[]
}
export interface LabData {
  source: string
  totalUnits: number
  current: { powerPaidRatio2030: number; price2026: number }
  combos: Record<string, LabCombo>
}

export const sum = (c: LabCombo, k: keyof LabYear) => c.yearly.reduce((s, y) => s + (y[k] as number), 0)
export const y2030 = (c: LabCombo) => c.yearly[c.yearly.length - 1]
