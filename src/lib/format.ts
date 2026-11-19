// 화면 단위 변환은 여기서만 (명세서 4장). 입력은 t, 원.

const nf = (digits: number) =>
  new Intl.NumberFormat('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** t → 백만 t */
export const toMillionT = (t: number, digits = 1) => nf(digits).format(t / 1e6)
/** t → 만 t */
export const toTenThousandT = (t: number, digits = 1) => nf(digits).format(t / 1e4)
/** 원 → 조 원 */
export const toTrillionWon = (won: number, digits = 2) => nf(digits).format(won / 1e12)
/** 원 → 억 원 */
export const toHundredMillionWon = (won: number, digits = 0) => nf(digits).format(won / 1e8)
/** 비율(0.123) → 12.3 */
export const toPercent = (ratio: number, digits = 1) => nf(digits).format(ratio * 100)
/** 부호 포함 퍼센트 */
export const toSignedPercent = (ratio: number, digits = 1) => {
  const v = ratio * 100
  const s = nf(digits).format(Math.abs(v))
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : s
}
export const toCount = (n: number) => nf(0).format(n)
