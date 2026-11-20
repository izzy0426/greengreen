// 기업 페이지 SVG 차트 — 원본 페이지의 bars / hbars / lines 함수를 같은 좌표 계산으로 옮김
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { fmt } from './companyData'

export function niceMax(v: number) {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p
}

interface BarsProps {
  label: string
  W: number
  H: number
  cats: string[]
  values: number[]
  colors: string[]
  max?: number
  yl?: string
  xl?: string
  bw?: number
  left?: number
  ld?: number
  onPick?: (cat: string) => void
  pickLabel?: (cat: string, v: number) => string
}

/** 세로 막대 (값 라벨 직접 표시) */
export function Bars({ label, W, H, cats, values, colors, max, yl, xl, bw: bw0 = 34, left = 44, ld = 0, onPick, pickLabel }: BarsProps) {
  const L = left
  const R = 10
  const T = yl ? 28 : 18
  const B = xl ? 40 : 28
  const mx = max ?? niceMax(Math.max(0, ...values) * 1.08)
  const y = (v: number) => T + ((mx - v) / mx) * (H - T - B)
  const gw = (W - L - R) / cats.length
  const bw = Math.min(bw0, gw * 0.76)
  return (
    <svg className="cchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {yl && <text x={4} y={12}>{yl}</text>}
      {xl && <text x={W - R} y={H - 3} textAnchor="end">{xl}</text>}
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (mx * i) / 4
        return (
          <g key={i}>
            <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
            <text x={L - 6} y={y(v) + 3.5} textAnchor="end">{fmt(v)}</text>
          </g>
        )
      })}
      <line className="zero" x1={L} x2={W - R} y1={y(0)} y2={y(0)} />
      {cats.map((c, i) => {
        const v = values[i]
        const x = L + gw * i + gw / 2 - bw / 2
        const h = Math.max(1, y(0) - y(v))
        const bar = (
          <rect
            className="bar-v"
            x={x + 0.5}
            y={y(v)}
            width={Math.max(1, bw - 1.5)}
            height={h}
            rx={3}
            fill={colors[i]}
            style={{ animationDelay: `${(i * 0.05).toFixed(2)}s` }}
          />
        )
        return (
          <g key={c}>
            {onPick ? (
              <a
                href="#"
                role="button"
                aria-label={pickLabel ? pickLabel(c, v) : c}
                onClick={(e) => {
                  e.preventDefault()
                  onPick(c)
                }}
                className="bar-pick"
              >
                <rect x={L + gw * i} y={T} width={gw} height={H - T - B + 24} fill="transparent" />
                {bar}
              </a>
            ) : (
              bar
            )}
            <text className="lbl" x={x + bw / 2} y={y(v) - 5} textAnchor="middle">{fmt(v, ld)}</text>
            <text x={L + gw * i + gw / 2} y={H - B + 19} textAnchor="middle" className="cat">{c}</text>
          </g>
        )
      })}
    </svg>
  )
}

export interface HItem {
  k: string
  v: number
  c: string
  t: string
}

/** 가로 막대 */
export function HBars({ label, W, H, items, max, left = 84, right = 56, xl }: { label: string; W: number; H: number; items: HItem[]; max?: number; left?: number; right?: number; xl?: string }) {
  const L = left
  const R = right
  const T = 4
  const BB = xl ? 20 : 4
  const mx = max ?? niceMax(Math.max(...items.map((i) => i.v)))
  const rh = (H - T - BB) / items.length
  const sc = (v: number) => ((W - L - R) * v) / mx
  return (
    <svg className="cchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {xl && <text x={W - R} y={H - 3} textAnchor="end">{xl}</text>}
      {items.map((it, i) => {
        const yy = T + rh * i
        const w = Math.max(1.5, sc(Math.min(it.v, mx)))
        return (
          <g key={it.k + i}>
            <text className="lbl" x={L - 8} y={yy + rh / 2 + 4} textAnchor="end" fontSize={12}>{it.k}</text>
            <rect x={L} y={yy + rh * 0.2} width={W - L - R} height={rh * 0.6} rx={4} fill="var(--tint)" />
            <rect className="bar-h" x={L} y={yy + rh * 0.2} width={w} height={rh * 0.6} rx={4} fill={it.c} style={{ animationDelay: `${(i * 0.05).toFixed(2)}s` }} />
            <text className="lbl" x={L + w + 6} y={yy + rh / 2 + 4} fontSize={11.5}>{it.t}</text>
          </g>
        )
      })}
    </svg>
  )
}

export interface LineSeries {
  values: (number | null)[]
  color: string
  dash?: boolean
  dots?: boolean
  width?: number
}

/** 선그래프 — null은 끊김 */
export function Lines({ label, W, H, cats, series, max, every = 1, yl, xl, td = 0 }: { label: string; W: number; H: number; cats: string[]; series: LineSeries[]; max: number; every?: number; yl?: string; xl?: string; td?: number }) {
  const L = 44
  const R = 16
  const T = yl ? 28 : 16
  const B = xl ? 38 : 26
  const y = (v: number) => T + ((max - v) / max) * (H - T - B)
  const x = (i: number) => L + (cats.length === 1 ? 0 : (i * (W - L - R)) / (cats.length - 1))
  return (
    <svg className="cchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {yl && <text x={4} y={12}>{yl}</text>}
      {xl && <text x={W - R} y={H - 3} textAnchor="end">{xl}</text>}
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (max * i) / 4
        return (
          <g key={i}>
            <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
            <text x={L - 6} y={y(v) + 3.5} textAnchor="end">{fmt(v, td)}</text>
          </g>
        )
      })}
      {cats.map((c, i) => (i % every === 0 || i === cats.length - 1 ? <text key={c} x={x(i)} y={H - B + 18} textAnchor="middle">{c}</text> : null))}
      {series.map((se, si) => {
        let d = ''
        let pen = false
        let last = -1
        se.values.forEach((v, i) => {
          if (v == null) {
            pen = false
            return
          }
          d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)
          pen = true
          last = i
        })
        if (!d) return null
        return (
          <g key={si}>
            <path
              d={d}
              fill="none"
              stroke={se.color}
              strokeWidth={se.width ?? 2.4}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={se.dash ? '5 4' : undefined}
              pathLength={se.dash ? undefined : 1}
              className={se.dash ? 'line-fade' : 'line-draw'}
            />
            {se.values.map((v, i) =>
              v != null && (se.dots || i === last) ? <circle key={i} cx={x(i)} cy={y(v)} r={i === last ? 3.8 : 2.5} fill={se.color} /> : null,
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** 부모 폭을 재서 차트 viewBox 폭으로 씀 — 글자가 화면 크기와 상관없이 같은 크기로 보이게 */
export function Fit({ min = 0, fallback, children }: { min?: number; fallback: number; children: (w: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => setW(Math.round(el.clientWidth))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className="fit">
      {children(Math.max(min, w || fallback))}
    </div>
  )
}
