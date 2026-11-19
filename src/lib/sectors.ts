// 업종 색 — 디자인 시스템 '범주 8색'. 같은 업종은 어느 차트에서나 같은 색 (결정 기록 D10)
const SECTOR_COLOR: Record<string, string> = {
  발전: 'var(--color-chart-1)',
  철강: 'var(--color-chart-2)',
  석유화학: 'var(--color-chart-3)',
  집단에너지: 'var(--color-chart-4)',
  '통신·IT': 'var(--color-chart-5)',
  정유: 'var(--color-chart-6)',
  폐기물: 'var(--color-chart-7)',
}
export const sectorColor = (sector: string) => SECTOR_COLOR[sector] ?? 'var(--color-chart-8)'
