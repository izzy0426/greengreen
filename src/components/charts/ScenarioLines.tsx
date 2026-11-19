import type { PriceKey, PriceRecord, UnitYearRow } from '../../lib/types'
import { PRICE_KEYS, PRICE_LABEL } from '../../lib/types'
import { hundredMillion, trillion, wonShort } from '../../lib/format'
import { linear, niceTicks, pathOf } from './scale'
import './charts.css'

const COLOR: PriceRecord<string> = {
  low: 'var(--color-data-neutral)',
  now: 'var(--color-chart-1)',
  high: 'var(--color-chart-3)',
  max: 'var(--color-chart-7)',
}

/** 04 '가격 시나리오별 연도별 탄소비용' — 억 원, 고른 시나리오는 굵은 선 */
export function ScenarioLines({ years, selected, opProfit }: { years: PriceRecord<UnitYearRow[]>; selected: PriceKey; opProfit: number | null }) {
  const W = 900, H = 240, L = 60, R = 210, T = 16, B = 34
  const all = PRICE_KEYS.flatMap((p) => years[p].map((r) => r.cost / 1e8))
  const ticks = niceTicks(Math.max(...all, opProfit && opProfit > 0 ? opProfit / 1e8 : 0, 1))
  const n = years.now.length
  const x = linear(0, n - 1, L, W - R)
  const y = linear(0, ticks[ticks.length - 1], H - B, T)
  const ends = PRICE_KEYS.map((p) => ({ p, y: y(years[p][n - 1].cost / 1e8) }))
  const labelY = spread(ends.map((e) => e.y), 20)
  const order = [...PRICE_KEYS].sort((a) => (a === selected ? 1 : -1))
  return (
    <div className="chart-scroll">
    <svg className="chart chart--wide" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={PRICE_KEYS.map((p) => `${PRICE_LABEL[p]} 5년 ${trillion(years[p].reduce((s, r) => s + r.cost, 0))}조 원`).join(', ')}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
          <text className="halo" x={L - 10} y={y(t) + 4} textAnchor="end">{t.toLocaleString('ko-KR')}</text>
        </g>
      ))}
      {opProfit != null && opProfit > 0 && opProfit / 1e8 <= ticks[ticks.length - 1] && (
        <g>
          <line x1={L} x2={W - R} y1={y(opProfit / 1e8)} y2={y(opProfit / 1e8)} stroke="var(--color-text-secondary)" strokeWidth={1.5} />
          <text className="halo" x={L + 4} y={y(opProfit / 1e8) - 6}>영업이익 {hundredMillion(opProfit)}억</text>
        </g>
      )}
      {order.map((p) => {
        const pts = years[p].map((r, i) => [x(i), y(r.cost / 1e8)] as [number, number])
        const sel = p === selected
        return (
          <g key={p}>
            <path d={pathOf(pts)} fill="none" stroke={COLOR[p]} strokeWidth={sel ? 4 : 2} />
            <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r={5} fill={COLOR[p]} />
          </g>
        )
      })}
      {ends.map((e, i) => (
        <text className="halo" key={e.p} x={W - R + 14} y={labelY[i] + 5}
          style={{ fontSize: 14, fontWeight: e.p === selected ? 700 : 400, fill: e.p === selected ? 'var(--color-text-brand)' : 'var(--color-text-primary)' }}>
          {PRICE_LABEL[e.p]} · 5년 {wonShort(years[e.p].reduce((s, r) => s + r.cost, 0))}
        </text>
      ))}
      {years.now.map((r, i) => (
        <text className="halo" key={r.year} x={x(i)} y={H - 8} textAnchor="middle">{r.year}</text>
      ))}
    </svg>
    </div>
  )
}

function spread(ys: number[], gap: number): number[] {
  const order = ys.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0])
  const out = [...ys]
  let prev = -Infinity
  for (const [v, i] of order) {
    out[i] = Math.max(v, prev + gap)
    prev = out[i]
  }
  return out
}
