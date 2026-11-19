// 아티클 차트 — 숫자는 article.json 그대로. 화면에 들어오면 한 번만 그려짐(0.8초), 막대·점 위 마우스 → 값(title)
import { motion } from 'framer-motion'
import { useDrawOnView } from '../../hooks/useDrawOnView'
import { linear, niceTicks, pathOf } from '../../components/charts/scale'
import '../../components/charts/charts.css'
import { mt, pct, trillion, int } from '../../lib/format'
import { sectorColor } from '../../lib/sectors'
import type { ArticleData, HistoryRow, PriceKey, SectorRow } from '../../lib/types'
import { PRICE_KEYS, PRICE_LABEL } from '../../lib/types'

const EASE = [0.22, 1, 0.36, 1] as const
const draw = (drawn: boolean, delay = 0) => ({
  initial: { pathLength: 0 },
  animate: { pathLength: drawn ? 1 : 0 },
  transition: { duration: 0.8, ease: EASE, delay },
})
const grow = (drawn: boolean, i = 0) => ({
  initial: { scaleY: 0 },
  animate: { scaleY: drawn ? 1 : 0 },
  transition: { duration: 0.8, ease: EASE, delay: i * 0.05 },
})

/** 한눈에 보기 — 배출 vs 할당 2015–2030 (실적 + 예측) */
export function TrendChart({ a }: { a: ArticleData }) {
  const { ref, drawn } = useDrawOnView<SVGSVGElement>()
  const W = 640, H = 300, L = 46, R = 16, T = 30, B = 30
  const h = a.history
  const f = a.yearly.now
  const yrs = [...h.map((r) => r.year), ...f.map((r) => r.year)]
  const x = linear(yrs[0], yrs[yrs.length - 1], L, W - R)
  const vals = [...h.flatMap((r) => [r.emis, r.netAlloc]), ...f.flatMap((r) => [r.emis, r.preAlloc, r.freeAlloc])].map((v) => v / 1e6)
  const lo = Math.floor(Math.min(...vals) / 70) * 70, hi = Math.ceil(Math.max(...vals) / 70) * 70
  const y = linear(lo, hi, H - B, T)
  const ticks = Array.from({ length: (hi - lo) / 70 + 1 }, (_, i) => lo + i * 70)
  const P = (rows: { year: number }[], k: (r: never) => number) => rows.map((r) => [x(r.year), y(k(r as never) / 1e6)] as [number, number])
  const last = h[h.length - 1]
  const emisH = P(h, (r: HistoryRow) => r.emis)
  const allocH = P(h, (r: HistoryRow) => r.netAlloc)
  const join = (r: { emis: number }) => [x(last.year), y(r.emis / 1e6)] as [number, number]
  const emisF = [join(last), ...P(f, (r: { emis: number }) => r.emis)]
  const preF = [[x(last.year), y(last.netAlloc / 1e6)] as [number, number], ...P(f, (r: { preAlloc: number }) => r.preAlloc)]
  const freeF = [[x(last.year), y(last.netAlloc / 1e6)] as [number, number], ...P(f, (r: { freeAlloc: number }) => r.freeAlloc)]
  const gap = [...emisF, ...freeF.slice().reverse()]
  const xs = x(2025)
  return (
    <figure className="fig">
      <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`2015~2025 실적 배출과 할당, 2026~2030 예측. 2030년 예측 배출 ${mt(f[4].emis)}백만 t, 무상할당 ${mt(f[4].freeAlloc)}백만 t`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}
        <line x1={xs} x2={xs} y1={T - 14} y2={H - B} stroke="var(--color-text-secondary)" />
        <text x={xs + 6} y={T - 4}>예측 →</text>
        <motion.path d={pathOf(gap) + 'Z'} fill="var(--color-data-short)" initial={{ opacity: 0 }} animate={{ opacity: drawn ? 0.25 : 0 }} transition={{ duration: 0.8, delay: 0.6 }} />
        <motion.path d={pathOf(allocH)} fill="none" stroke="var(--color-data-target)" strokeWidth={2} {...draw(drawn)} />
        <motion.path d={pathOf(emisH)} fill="none" stroke="var(--color-chart-2)" strokeWidth={3} {...draw(drawn)} />
        <motion.path d={pathOf(preF)} fill="none" stroke="var(--color-data-target)" strokeWidth={2} strokeDasharray="6 5" initial={{ opacity: 0 }} animate={{ opacity: drawn ? 1 : 0 }} transition={{ duration: 0.8, delay: 0.5 }} />
        <motion.path d={pathOf(freeF)} fill="none" stroke="var(--color-chart-1)" strokeWidth={2} strokeDasharray="4 4" initial={{ opacity: 0 }} animate={{ opacity: drawn ? 1 : 0 }} transition={{ duration: 0.8, delay: 0.5 }} />
        <motion.path d={pathOf(emisF)} fill="none" stroke="var(--color-chart-2)" strokeWidth={3} strokeDasharray="3 4" initial={{ opacity: 0 }} animate={{ opacity: drawn ? 1 : 0 }} transition={{ duration: 0.8, delay: 0.5 }} />
        {[...h, ...f].map((r) => (
          <circle key={r.year} cx={x(r.year)} cy={y(r.emis / 1e6)} r={8} fill="transparent">
            <title>{`${r.year}년 배출 ${mt(r.emis)}백만 t`}</title>
          </circle>
        ))}
        {[2015, 2020, 2025, 2030].map((yr) => (
          <text key={yr} x={x(yr)} y={H - 8} textAnchor="middle">{yr}</text>
        ))}
        <g transform={`translate(${x(2021.5)},${y(lo) - 24})`}>
          <rect x={-88} y={-14} width={176} height={26} rx={13} fill="var(--color-bg-inverse)" />
          <text x={0} y={4} textAnchor="middle" style={{ fill: 'white' }}>2030 구매 압력 {mt(a.purchasePressure2030)}백만 t</text>
        </g>
      </svg>
      <figcaption className="chart-legend">
        <span><i className="line" style={{ background: 'var(--color-chart-2)' }} />배출</span>
        <span><i className="line" style={{ background: 'var(--color-data-target)' }} />할당 (사전·순)</span>
        <span><i className="line" style={{ background: 'var(--color-chart-1)' }} />무상할당</span>
        <span><i className="swatch" style={{ background: 'var(--color-data-short)' }} />모자라는 몫</span>
      </figcaption>
    </figure>
  )
}

/** 누가 배출하고, 누가 내나 — 업종별 배출 비중 vs 비용 비중 (나비 막대) */
export function ButterflyBars({ sectors, n = 6 }: { sectors: SectorRow[]; n?: number }) {
  const { ref, drawn } = useDrawOnView<HTMLDivElement>()
  // 배출 큰 순 상위 n 업종 (하이파이: 발전·철강·석유화학·정유·집단에너지·폐기물)
  const rows = [...sectors].sort((a, b) => b.emisShare - a.emisShare).slice(0, n)
  const max = Math.max(...rows.flatMap((r) => [r.emisShare, r.costShare.now]))
  return (
    <div ref={ref} className="butterfly" role="table" aria-label="업종별 배출 비중과 비용 비중">
      <div className="butterfly__head" role="row">
        <span role="columnheader" />
        <span role="columnheader">배출 비중</span>
        <span role="columnheader">비용 비중</span>
      </div>
      {rows.map((r, i) => (
        <div className="butterfly__row" role="row" key={r.sector}>
          <span role="rowheader">{r.sector}</span>
          <span role="cell" className="butterfly__left">
            <em>{pct(r.emisShare, 1)}%</em>
            <motion.i style={{ width: `${(r.emisShare / max) * 100}%`, background: 'var(--color-chart-2)', transformOrigin: 'right' }}
              initial={{ scaleX: 0 }} animate={{ scaleX: drawn ? 1 : 0 }} transition={{ duration: 0.8, ease: EASE, delay: i * 0.05 }} />
          </span>
          <span role="cell" className="butterfly__right">
            <motion.i style={{ width: `${(r.costShare.now / max) * 100}%`, background: 'var(--color-chart-3)', transformOrigin: 'left' }}
              initial={{ scaleX: 0 }} animate={{ scaleX: drawn ? 1 : 0 }} transition={{ duration: 0.8, ease: EASE, delay: i * 0.05 }} />
            <em>{pct(r.costShare.now, 1)}%</em>
          </span>
        </div>
      ))}
    </div>
  )
}

const LINE: Record<PriceKey, string> = { low: 'var(--color-data-neutral)', now: 'var(--color-chart-1)', high: 'var(--color-chart-3)', max: 'var(--color-chart-7)' }

/** 가격이 오르면 청구서도 커진다 — 가격 시나리오별 연도별 탄소비용(조 원) */
export function PriceLines({ a }: { a: ArticleData }) {
  const { ref, drawn } = useDrawOnView<SVGSVGElement>()
  const W = 420, H = 230, L = 34, R = 150, T = 16, B = 28
  const ticks = niceTicks(Math.max(...PRICE_KEYS.flatMap((p) => a.yearly[p].map((r) => r.cost / 1e12))))
  const x = linear(0, 4, L, W - R)
  const y = linear(0, ticks[ticks.length - 1], H - B, T)
  const ends = PRICE_KEYS.map((p) => y(a.yearly[p][4].cost / 1e12))
  const ly = spread(ends, 22)
  return (
    <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={PRICE_KEYS.map((p) => `${PRICE_LABEL[p]} 5년 ${trillion(a.glance.cost5y[p], 1)}조 원`).join(', ')}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
          <text x={L - 8} y={y(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      {PRICE_KEYS.map((p, k) => {
        const pts = a.yearly[p].map((r, i) => [x(i), y(r.cost / 1e12)] as [number, number])
        return (
          <g key={p}>
            <motion.path d={pathOf(pts)} fill="none" stroke={LINE[p]} strokeWidth={p === 'now' ? 3 : 2} {...draw(drawn, k * 0.1)} />
            {pts.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={i === 4 ? 4 : 7} fill={i === 4 ? LINE[p] : 'transparent'}>
                <title>{`${PRICE_LABEL[p]} ${a.yearly[p][i].year}년 ${trillion(a.yearly[p][i].cost)}조 원`}</title>
              </circle>
            ))}
            <text x={W - R + 10} y={ly[k] + 4} style={{ fill: p === 'now' ? 'var(--color-text-brand)' : 'var(--color-text-primary)', fontWeight: p === 'now' ? 700 : 500 }}>
              {PRICE_LABEL[p]} · 5년 {trillion(a.glance.cost5y[p], 1)}조
            </text>
          </g>
        )
      })}
      {a.yearly.now.map((r, i) => (
        <text key={r.year} x={x(i)} y={H - 6} textAnchor="middle">{r.year}</text>
      ))}
    </svg>
  )
}

/** 적자로 돌아서는 단위 — 2030, 가격 4 */
export function TurnsLossBars({ a }: { a: ArticleData }) {
  const { ref, drawn } = useDrawOnView<SVGSVGElement>()
  const W = 260, H = 200, B = 34, T = 30
  const v = PRICE_KEYS.map((p) => a.turnsLoss.byYear[p][4])
  const y = linear(0, Math.max(...v, 1), H - B, T)
  const step = W / 4
  return (
    <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={PRICE_KEYS.map((p, i) => `${PRICE_LABEL[p]} ${v[i]}곳`).join(', ')}>
      {v.map((n, i) => {
        const cx = step * i + step / 2
        return (
          <g key={i}>
            <motion.rect x={cx - 18} y={y(n)} width={36} height={Math.max(2, H - B - y(n))} rx={4} fill="var(--color-data-short)" style={{ transformOrigin: `0 ${H - B}px`, transformBox: 'view-box' }} {...grow(drawn, i)}>
              <title>{`${PRICE_LABEL[PRICE_KEYS[i]]} ${n}곳`}</title>
            </motion.rect>
            <text x={cx} y={y(n) - 8} textAnchor="middle" style={{ fill: 'var(--color-text-primary)', fontSize: 18, fontWeight: 700 }}>{n}</text>
            <text x={cx} y={H - 12} textAnchor="middle" style={{ fontSize: 11 }}>{PRICE_LABEL[PRICE_KEYS[i]]}</text>
          </g>
        )
      })}
    </svg>
  )
}

/** 01 해마다 남은(+) / 모자란(−) 배출권 — 순할당 − 배출 */
export function SurplusBars({ history }: { history: HistoryRow[] }) {
  const { ref, drawn } = useDrawOnView<SVGSVGElement>()
  const W = 440, H = 290, T = 24, B = 64
  const v = history.map((h) => h.surplus / 1e6)
  const lim = Math.max(...v.map(Math.abs)) * 1.12
  const y = linear(-lim, lim, H - B, T)
  const step = W / history.length
  const p3 = history.findIndex((h) => h.phase === 3)
  return (
    <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={history.map((h, i) => `${h.year}년 ${v[i] > 0 ? '+' : ''}${v[i].toFixed(1)}`).join(', ')}>
      <rect x={step * p3} y={T - 10} width={W - step * p3} height={y(0) - T + 10} rx={6} fill="var(--color-chart-2)" opacity={0.08} />
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--color-text-secondary)" />
      {history.map((h, i) => {
        const cx = step * i + step / 2
        const pos = v[i] >= 0
        return (
          <g key={h.year}>
            <motion.rect x={cx - 12} y={pos ? y(v[i]) : y(0)} width={24} height={Math.abs(y(v[i]) - y(0))} rx={3}
              fill={pos ? 'var(--color-data-surplus)' : 'var(--color-data-short)'}
              style={{ transformOrigin: `0 ${y(0)}px`, transformBox: 'view-box' }} {...grow(drawn, i)}>
              <title>{`${h.year}년 ${pos ? '+' : ''}${v[i].toFixed(1)}백만 t`}</title>
            </motion.rect>
            <text x={cx} y={pos ? y(v[i]) - 6 : y(v[i]) + 14} textAnchor="middle" style={{ fill: 'var(--color-text-primary)', fontSize: 11 }}>
              {pos ? '+' : ''}{v[i].toFixed(1)}
            </text>
            <text x={cx} y={H - 30} textAnchor="middle" style={{ fontSize: 11 }}>{String(h.year).slice(2)}</text>
          </g>
        )
      })}
      {[1, 2, 3].map((ph) => {
        const idx = history.map((h, i) => (h.phase === ph ? i : -1)).filter((i) => i >= 0)
        const x0 = step * idx[0] + 4, x1 = step * (idx[idx.length - 1] + 1) - 4
        return (
          <g key={ph}>
            <line x1={x0} x2={x1} y1={H - 16} y2={H - 16} stroke="var(--color-border-default)" />
            <text x={(x0 + x1) / 2} y={H - 2} textAnchor="middle" style={{ fontSize: 11 }}>{ph}차</text>
          </g>
        )
      })}
    </svg>
  )
}

/** 02 배출 1톤당 실제 부담 — 4차 규칙 vs 3차 규칙 (전체) */
export function EffPriceLines({ rows }: { rows: ArticleData['effPrice'][string] }) {
  const { ref, drawn } = useDrawOnView<SVGSVGElement>()
  const W = 440, H = 240, L = 44, R = 20, T = 28, B = 28
  const ticks = niceTicks(Math.max(...rows.flatMap((r) => [r.rule3, r.rule4])))
  const x = linear(0, rows.length - 1, L, W - R)
  const y = linear(0, ticks[ticks.length - 1], H - B, T)
  const p4 = rows.map((r, i) => [x(i), y(r.rule4)] as [number, number])
  const p3 = rows.map((r, i) => [x(i), y(r.rule3)] as [number, number])
  const last = rows[rows.length - 1]
  return (
    <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`2030년 4차 규칙 ${int(last.rule4)}원, 3차 규칙이면 ${int(last.rule3)}원`}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
          <text x={L - 8} y={y(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      <motion.path d={pathOf(p3)} fill="none" stroke="var(--color-data-neutral)" strokeWidth={2} {...draw(drawn)} />
      <motion.path d={pathOf(p4)} fill="none" stroke="var(--color-data-positive)" strokeWidth={3} {...draw(drawn)} />
      {p4.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={4} fill="var(--color-data-positive)">
          <title>{`${rows[i].year}년 4차 규칙 ${int(rows[i].rule4)}원 · 3차 규칙 ${int(rows[i].rule3)}원`}</title>
        </circle>
      ))}
      <text x={p4[4][0]} y={p4[4][1] - 12} textAnchor="end" style={{ fill: 'var(--color-text-brand)' }}>4차 규칙 {int(last.rule4)}원</text>
      <text x={p3[4][0]} y={p3[4][1] - 10} textAnchor="end">3차 규칙이면 {int(last.rule3)}원</text>
      {rows.map((r, i) => (
        <text key={r.year} x={x(i)} y={H - 6} textAnchor="middle">{r.year}</text>
      ))}
    </svg>
  )
}

/** 03 5년 탄소비용 업종 막대 (어두운 배경) */
export function SectorCostBars({ sectors, n = 7 }: { sectors: SectorRow[]; n?: number }) {
  const { ref, drawn } = useDrawOnView<HTMLDivElement>()
  const rows = sectors.slice(0, n)
  const max = rows[0].cost5y.now
  return (
    <div ref={ref} className="hbars" role="list">
      {rows.map((r, i) => (
        <div className="hbars__row" role="listitem" key={r.sector}>
          <span>{r.sector}</span>
          <span className="hbars__track">
            <motion.i style={{ width: `${(r.cost5y.now / max) * 100}%`, background: sectorColor(r.sector), transformOrigin: 'left' }}
              initial={{ scaleX: 0 }} animate={{ scaleX: drawn ? 1 : 0 }} transition={{ duration: 0.8, ease: EASE, delay: i * 0.06 }} />
            <em>{trillion(r.cost5y.now)}조</em>
          </span>
        </div>
      ))}
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
