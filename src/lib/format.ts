// 화면 단위 변환은 여기서만 (명세서 4장). 입력은 t, 원, 비율(0.12).

const nf = (digits: number) =>
  new Intl.NumberFormat('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const MINUS = '−'
const sign = (s: string) => s.replace('-', MINUS)

/** t → 백만 t 숫자 문자열 */
export const mt = (t: number, digits = 1) => sign(nf(digits).format(t / 1e6))
/** 원 → 조 원 숫자 문자열 */
export const trillion = (won: number, digits = 2) => sign(nf(digits).format(won / 1e12))
/** 원 → 억 원 숫자 문자열 */
export const hundredMillion = (won: number, digits = 0) => sign(nf(digits).format(won / 1e8))
/** 비율 → 퍼센트 숫자 문자열 */
export const pct = (ratio: number, digits = 0) => sign(nf(digits).format(ratio * 100))
export const int = (n: number) => sign(nf(0).format(n))

/** 금액을 크기에 맞춰: 0.1조 이상 '0.68조', 1억 이상 '4,211억', 그 밖 '3,400만' · '0' (결정 기록 D12) */
export function wonShort(won: number): string {
  const a = Math.abs(won)
  if (a >= 1e11) return `${trillion(won)}조`
  if (a >= 1e8) return `${hundredMillion(won)}억`
  if (a >= 1e4) return `${sign(nf(0).format(won / 1e4))}만`
  return int(won)
}

/** 배출량을 크기에 맞춰: 백만 t 또는 만 t 또는 t */
export function tonShort(t: number): string {
  const a = Math.abs(t)
  if (a >= 1e6) return `${mt(t, a >= 1e7 ? 1 : 2)}백만 t`
  if (a >= 1e4) return `${sign(nf(1).format(t / 1e4))}만 t`
  return `${int(t)} t`
}

/** 가격(원/t)을 '3만 원' · '7.8만 원' 꼴로 */
export const priceShort = (won: number) => `${sign(nf(won % 10000 === 0 ? 0 : 1).format(won / 1e4))}만 원`

/** 재무 표기: 1조 이상 '7.06조', 그 밖 '4,211억' (하이파이 04 '한눈에 보기') */
export const wonFin = (won: number) => (Math.abs(won) >= 1e12 ? `${trillion(won)}조` : `${hundredMillion(won)}억`)
