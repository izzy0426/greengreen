import { pct } from '../../lib/format'
import { linear } from './scale'
import './charts.css'

export interface Dot {
  id: string
  name: string
  risk: number
}

/** 04 '업종 안에서 위치' — 같은 업종 단위들의 2030 위험도 점 분포, 현재 단위 강조 */
export function SectorDotPlot({ dots, currentId, threshold }: { dots: Dot[]; currentId: string; threshold: number }) {
  const W = 300, H = 220, L = 6, R = 6, mid = 120
  const top = Math.max(...dots.map((d) => d.risk), threshold)
  const domainMax = Math.ceil((top * 100) / 20) * 0.2 || 0.2
  const x = linear(0, domainMax, L, W - R)
  // 겹치는 점은 위아래로 조금씩 엇갈려 놓음
  const sorted = [...dots].sort((a, b) => a.risk - b.risk)
  const placed = sorted.map((d, i) => ({ ...d, cx: x(d.risk), cy: mid - 10 + (i % 4) * 7 }))
  const cur = placed.find((d) => d.id === currentId)
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={cur ? `${cur.name} 2030 위험도 ${pct(cur.risk)}%, 같은 업종 ${dots.length}곳 중` : '같은 업종 위험도 분포'}>
      <line x1={0} x2={W} y1={mid + 10} y2={mid + 10} stroke="var(--color-border-default)" strokeWidth={2} />
      <line x1={x(threshold)} x2={x(threshold)} y1={mid - 24} y2={mid + 40} stroke="var(--color-text-secondary)" strokeWidth={1.5} />
      <text className="halo" x={x(threshold) + 4} y={mid + 56}>고위험 기준 {pct(threshold)}%</text>
      {placed.filter((d) => d.id !== currentId).map((d) => (
        <circle key={d.id} cx={d.cx} cy={d.cy} r={5} fill="var(--color-data-neutral)" opacity={0.9}>
          <title>{`${d.name} ${pct(d.risk)}%`}</title>
        </circle>
      ))}
      {cur && (
        <g>
          <circle cx={cur.cx} cy={mid + 9} r={9} fill="var(--color-data-short)" stroke="white" strokeWidth={2} />
          <text className="halo" x={Math.min(cur.cx, W - 130)} y={mid - 36} style={{ fill: 'var(--color-data-short)', fontSize: 14, fontWeight: 400 }}>
            {cur.name} {pct(cur.risk)}%
          </text>
        </g>
      )}
      <text className="halo" x={0} y={H - 14}>0%</text>
      <text className="halo" x={W} y={H - 14} textAnchor="end">{pct(domainMax)}%</text>
    </svg>
  )
}
