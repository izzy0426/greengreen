import { motion } from 'framer-motion'
import { useRef } from 'react'
import { AssumptionBadge } from '../../components/Tags'
import { pct, priceShort } from '../../lib/format'
import { LEVER_ICON_PATHS } from './leverIcons'
import { DEFAULT_LEVERS, LEVERS, isAssumed, isKnownStep, type LabData, type Levers, type Step } from './model'

/** 레버 단계 옆 짧은 값 (하이파이 05 레버 바) */
export function leverShortLabel(i: number, step: Step, data: LabData): string {
  const key = LEVERS[i].key
  if (key === 'price') return priceShort(data.combos[`${['low', 'now', 'high', 'max'][step - 1]}-1`].yearly[4].price).replace(' 원', '')
  if (key === 'reduction') return step === 1 ? '0%' : step === 3 ? '−5%' : '미정'
  return String(step)
}

/** 07 '내가 고른 레버' 설명 */
export function leverDetail(i: number, step: Step, data: LabData): string {
  const key = LEVERS[i].key
  if (!isKnownStep(i, step) && key !== 'passThrough' && key !== 'invest') return `${step}단계 · 값 미정`
  switch (key) {
    case 'price':
      return `2030년 ${priceShort(data.combos[`${['low', 'now', 'high', 'max'][step - 1]}-1`].yearly[4].price)}`
    case 'cap':
      return '현행'
    case 'powerPaid':
      return `2030년 ${pct(data.current.powerPaidRatio2030)}%`
    case 'otherPaid':
      return '15% (확인 필요)'
    case 'leakFree':
      return '100%'
    case 'bank':
      return 'N배 규칙'
    case 'passThrough':
      return '가정'
    case 'reduction':
      return step === 1 ? '그대로' : '배출 −5%'
    default:
      return '—'
  }
}

const GROUPS = ['가격', '할당', '이월', '전기요금', '기업 대응'] as const

/** 레버 바 9개 — 클릭·드래그·키보드(↑↓)로 단계 1~4 */
export function LeverBar({ levers, data, onChange, onHover }: { levers: Levers; data: LabData; onChange: (i: number, s: Step) => void; onHover: (i: number | null) => void }) {
  return (
    <div className="lever-bar" role="group" aria-label="4차 계획 레버">
      <div className="lever-bar__groups">
        {GROUPS.map((g) => (
          <div className="lever-group" key={g}>
            <div className="lever-group__levers">
              {LEVERS.map((l, i) =>
                l.group === g ? (
                  <Lever key={l.key} i={i} step={levers[i]} data={data} onChange={onChange} onHover={onHover} />
                ) : null,
              )}
            </div>
            <p className="lever-group__name">{g}</p>
          </div>
        ))}
      </div>
      <div className="lever-legend" aria-hidden="true">
        <p className="lever-legend__title">단계</p>
        <p>4 가장 강하게</p>
        <p>3 강하게</p>
        <p>2 조금 강하게</p>
        <p>1 지금 계획</p>
        <p className="lever-legend__note">가격은 시나리오 4개 (1만 · 3만 · 7.8만 · 11.5만 원)</p>
      </div>
    </div>
  )
}

function Lever({ i, step, data, onChange, onHover }: { i: number; step: Step; data: LabData; onChange: (i: number, s: Step) => void; onHover: (i: number | null) => void }) {
  const def = LEVERS[i]
  const track = useRef<HTMLDivElement>(null)
  const fromY = (clientY: number): Step => {
    const r = track.current!.getBoundingClientRect()
    const t = 1 - (clientY - r.top) / r.height
    return Math.min(4, Math.max(1, Math.round(t * 3) + 1)) as Step
  }
  const label = leverShortLabel(i, step, data)
  const selected = step !== DEFAULT_LEVERS[i]
  const posPct = ((step - 1) / 3) * 100
  return (
    <div className={`lever${selected ? ' is-changed' : ''}`} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)}>
      <svg className="lever__icon" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <rect width="44" height="44" rx="14" />
        <g dangerouslySetInnerHTML={{ __html: LEVER_ICON_PATHS[def.key] }} />
      </svg>
      <p className="lever__name">{def.name}</p>
      <div className="lever__badge">{isAssumed(i, step) && <AssumptionBadge title="이 레버(단계)의 값은 아직 정해지지 않았어요" />}</div>
      <div
        className="lever__slider"
        role="slider"
        tabIndex={0}
        aria-label={def.name}
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={step}
        aria-valuetext={`${step}단계 · ${label}${isAssumed(i, step) ? ' · 가정' : ''}`}
        onFocus={() => onHover(i)}
        onBlur={() => onHover(null)}
        onKeyDown={(e) => {
          const up = e.key === 'ArrowUp' || e.key === 'ArrowRight'
          const down = e.key === 'ArrowDown' || e.key === 'ArrowLeft'
          if (up || down || e.key === 'Home' || e.key === 'End') {
            e.preventDefault()
            const next = e.key === 'Home' ? 1 : e.key === 'End' ? 4 : Math.min(4, Math.max(1, step + (up ? 1 : -1)))
            if (next !== step) onChange(i, next as Step)
          }
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          const s = fromY(e.clientY)
          if (s !== step) onChange(i, s)
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
          const s = fromY(e.clientY)
          if (s !== step) onChange(i, s)
        }}
      >
        <div className="lever__track" ref={track}>
          {[1, 2, 3, 4].map((d) => (
            <span key={d} className="lever__dot" style={{ bottom: `${((d - 1) / 3) * 100}%` }} />
          ))}
          <motion.span className="lever__fill" animate={{ height: `${posPct}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} />
          <motion.span className="lever__knob" animate={{ bottom: `${posPct}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} />
        </div>
        <motion.span className="lever__value" animate={{ bottom: `${posPct}%` }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          {label}
        </motion.span>
      </div>
    </div>
  )
}
