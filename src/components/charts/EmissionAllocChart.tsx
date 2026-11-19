import type { UnitYearRow } from '../../lib/types'
import { mt } from '../../lib/format'
import { linear, niceTicks, pathOf } from './scale'
import './charts.css'

/** 04 '2026~2030 배출 예측 vs 할당' — 예측 배출 + P10~P90 띠, 사전할당(점선), 무상할당, 모자라는 몫(주황 면) */
export function EmissionAllocChart({ rows }: { rows: UnitYearRow[] }) {
  const W = 620, H = 280, L = 50, R = 40, T = 20, B = 30
  const max = Math.max(...rows.flatMap((r) => [r.emisP90 ?? r.emis, r.emis, r.preAlloc, r.freeAlloc])) / 1e6
  const ticks = niceTicks(max)
  const x = linear(0, rows.length - 1, L + 10, W - R - 10)
  const y = linear(0, ticks[ticks.length - 1], H - B, T)
  const pt = (k: (r: UnitYearRow) => number) => rows.map((r, i) => [x(i), y(k(r) / 1e6)] as [number, number])
  const emis = pt((r) => r.emis)
  const free = pt((r) => r.freeAlloc)
  const pre = pt((r) => r.preAlloc)
  const hasBand = rows.every((r) => r.emisP10 != null && r.emisP90 != null)
  const band = hasBand ? [...pt((r) => r.emisP90!), ...pt((r) => r.emisP10!).reverse()] : []
  // 모자라는 몫: 배출이 무상할당보다 큰 구간만 (배출선과 무상할당선 사이)
  const gap = [...rows.map((r, i) => [x(i), y(Math.max(r.emis, r.freeAlloc) / 1e6)] as [number, number]), ...free.slice().reverse()]
  const last = rows[rows.length - 1]
  const short2030 = last.shortfall
  const lx = W - R + 4
  const labels = [
    { v: last.emis, c: 'var(--color-chart-2)' },
    { v: last.preAlloc, c: 'var(--color-text-secondary)' },
    { v: last.freeAlloc, c: 'var(--color-text-brand)' },
  ]
  return (
    <figure style={{ margin: 0 }}>
      <div className="chart-scroll">
      <svg className="chart chart--wide" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`2030년 예측 배출 ${mt(last.emis)}백만 t, 사전할당 ${mt(last.preAlloc)}백만 t, 무상할당 ${mt(last.freeAlloc)}백만 t`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
            <text className="halo" x={L - 10} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}
        {hasBand && <path d={pathOf(band) + 'Z'} fill="var(--color-chart-2)" opacity={0.15} />}
        <path d={pathOf(gap) + 'Z'} fill="var(--color-data-short)" opacity={0.35} />
        <path d={pathOf(pre)} fill="none" stroke="var(--color-data-target)" strokeWidth={2} strokeDasharray="6 5" />
        <path d={pathOf(free)} fill="none" stroke="var(--color-chart-1)" strokeWidth={2.5} />
        <path d={pathOf(emis)} fill="none" stroke="var(--color-chart-2)" strokeWidth={3} />
        {emis.map(([cx, cy], i) => <circle key={`e${i}`} cx={cx} cy={cy} r={5} fill="white" stroke="var(--color-chart-2)" strokeWidth={2} />)}
        {free.map(([cx, cy], i) => <circle key={`f${i}`} cx={cx} cy={cy} r={4} fill="var(--color-chart-1)" />)}
        {rows.map((r, i) => (
          <text className="halo" key={r.year} x={x(i)} y={H - 8} textAnchor="middle">{r.year}</text>
        ))}
        {spread(labels.map((l) => y(l.v / 1e6)), 16).map((ly, i) => (
          <text className="halo" key={i} x={lx} y={ly + 4} style={{ fill: labels[i].c, fontSize: 14 }}>{mt(labels[i].v)}</text>
        ))}
        {short2030 > 0 && (
          <g transform={`translate(${x(2.4)},${y((last.freeAlloc + short2030 / 2) / 1e6) + 18})`}>
            <rect x={-92} y={-14} width={184} height={26} rx={13} fill="var(--color-bg-inverse)" />
            <text x={0} y={4} textAnchor="middle" style={{ fill: 'white' }}>2030 사야 할 양 {mt(short2030)}백만 t</text>
          </g>
        )}
      </svg>
      </div>
      <figcaption className="chart-legend">
        <span><i className="line" style={{ background: 'var(--color-chart-2)' }} />예측 배출</span>
        {hasBand && <span><i className="swatch" style={{ background: 'var(--color-chart-2)' }} />예측 범위</span>}
        <span><i className="line" style={{ background: 'var(--color-data-target)' }} />사전할당</span>
        <span><i className="line" style={{ background: 'var(--color-chart-1)' }} />무상할당</span>
        <span><i className="swatch" style={{ background: 'var(--color-data-short)' }} />모자라는 몫</span>
      </figcaption>
    </figure>
  )
}

/** 끝 라벨이 겹치지 않게 최소 간격만큼 벌림 */
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
