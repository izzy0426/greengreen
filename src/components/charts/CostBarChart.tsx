import type { UnitYearRow } from '../../lib/types'
import { hundredMillion } from '../../lib/format'
import { linear } from './scale'
import './charts.css'

/** 04 '해마다 내는 탄소비용 vs 영업이익' — 억 원 막대 + 영업이익 기준선 */
export function CostBarChart({ rows, opProfit }: { rows: UnitYearRow[]; opProfit: number | null }) {
  const W = 300, H = 240, T = 40, B = 30
  const max = Math.max(...rows.map((r) => r.cost), opProfit && opProfit > 0 ? opProfit : 0, 1)
  const y = linear(0, max * 1.05, H - B, T)
  const bw = 38, step = (W - 20) / rows.length
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`연도별 탄소비용: ${rows.map((r) => `${r.year}년 ${hundredMillion(r.cost)}억 원`).join(', ')}`}>
      {rows.map((r, i) => {
        const cx = 10 + step * i + step / 2
        return (
          <g key={r.year}>
            <rect x={cx - bw / 2} y={y(r.cost)} width={bw} height={Math.max(0, H - B - y(r.cost))} rx={6} fill="var(--color-data-short)" />
            <text className="halo" x={cx} y={y(r.cost) - 6} textAnchor="middle" style={{ fill: 'var(--color-text-primary)' }}>{hundredMillion(r.cost)}</text>
            <text className="halo" x={cx} y={H - 8} textAnchor="middle">{r.year}</text>
          </g>
        )
      })}
      {opProfit != null && opProfit > 0 && (
        <g>
          <line x1={0} x2={W} y1={y(opProfit)} y2={y(opProfit)} stroke="var(--color-text-primary)" strokeWidth={2} />
          <text className="halo" x={0} y={y(opProfit) - 8} style={{ fill: 'var(--color-text-primary)' }}>영업이익 {hundredMillion(opProfit)}</text>
        </g>
      )}
    </svg>
  )
}
