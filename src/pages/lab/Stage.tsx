import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { AssumptionBadge } from '../../components/Tags'
import { int, mt, pct, trillion } from '../../lib/format'
import { DEFAULT_LEVERS, LEVERS, SCENE_ALT, isAssumed, isDefault, priceOf, sceneOf, sum, y2030, type LabCombo, type Levers } from './model'
import { PRICE_LABEL } from '../../lib/types'

const sceneUrl = (s: number) => `/scenes/scene-s${s}.webp`

/** 무대: 장면 S1~S5 + 핀 5 + 장관 말풍선 + 가격 박스 + 속보 티커 + 미터 (명세서 6·7장) */
export function Stage({ combo, base, levers, toast }: { combo: LabCombo; base: LabCombo; levers: Levers; toast: string | null }) {
  const scene = sceneOf(combo.meter)
  const p = combo.pins, b = base.pins
  const y = y2030(combo)
  const gap = y.emis - y.preAlloc
  const reduced = levers[7] === 3
  const price = y.price, price26 = combo.yearly[0].price

  const minister = isDefault(levers)
    ? { title: '장관님, 지금 계획대로면 2030년은 이렇습니다', desc: `현행 4차 할당 + 배출권 가격 ${int(price / 1e4)}만 원 유지 기준이에요. 레버를 움직여 보세요.` }
    : combo.meter <= 0
      ? { title: reduced ? '배출이 5% 줄면 총량 안으로 들어와요' : '4차 총량 안으로 들어왔어요', desc: changedText(levers) }
      : { title: `아직 4차 총량보다 ${mt(gap)}백만 t 많아요`, desc: changedText(levers) }

  const ticker = gap > 0
    ? `“2030년 배출, 4차 총량보다 ${int(gap / 1e4)}만 t 많아… 발전사 구매 ${int(p.powerPurchase2030 / 1e4)}만 t”`
    : `“배출 ${reduced ? '5% 줄이자 ' : ''}4차 총량 안으로… 5년 비용 ${trillion(sum(base, 'cost'), 1)}조→${trillion(sum(combo, 'cost'), 1)}조”`

  return (
    <div className="stage">
      <div className="stage__scene">
        <AnimatePresence initial={false}>
          <motion.div
            key={scene}
            className={`stage__img stage__img--s${scene}`}
            style={{ backgroundImage: `url(${sceneUrl(scene)})` }}
            role="img"
            aria-label={`장면 ${scene}단계: ${SCENE_ALT[scene]}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        </AnimatePresence>
      </div>

      <div className="minister" aria-live="polite">
        <span className="minister__avatar">장관</span>
        <div>
          <p className="minister__title">{minister.title}</p>
          <p className="minister__desc">{minister.desc}</p>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.p key={toast} className="lab-toast" role="status" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            ✓ {toast}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="pins">
      <Pin x={8} y={23} color="var(--color-chart-1)" label="발전 2030 탄소비용" value={`${trillion(p.powerCost2030)}조`}
        delta={delta(p.powerCost2030, b.powerCost2030, (v) => `${trillion(v)}조`, `구매 ${mt(p.powerPurchase2030)}백만 t`)} />
      <Pin x={38} y={28} color="var(--color-chart-2)" label="철강 · 시멘트 (탄소누출)" value="무상 100%" assumed={isAssumed(4, levers[4])}
        delta={{ text: p.steelSurplus2030 >= 0 ? `철강은 ${mt(p.steelSurplus2030)}백만 t 남음` : `철강 ${mt(-p.steelSurplus2030)}백만 t 모자람`, dir: p.steelSurplus2030 > b.steelSurplus2030 ? 'down' : p.steelSurplus2030 < b.steelSurplus2030 ? 'up' : null }} />
      <Pin x={57} y={26} color="var(--color-chart-3)" label="석유화학 2030 배출" value={`${mt(p.petroEmis2030)}백만 t`}
        delta={delta(p.petroEmis2030, b.petroEmis2030, (v) => `${mt(v)}백만 t`, `무상 ${mt(p.petroFree2030)}백만 t`)} />
      <Pin x={70} y={50} color="var(--color-chart-5)" label="전기요금 전가" value="전가율 가정" assumed />
      <Pin x={24} y={58} color="var(--color-data-short)" label="한전 부채" value={`최대 ${trillion(p.powerCost2030)}조`}
        delta={p.powerCost2030 === b.powerCost2030 ? { text: '요금 동결 시', dir: null } : delta(p.powerCost2030, b.powerCost2030, (v) => `${trillion(v)}조`, '')} />
      </div>

      <div className="price-box">
        <p>배출권 가격 <span className="visually-hidden">({PRICE_LABEL[priceOf(levers)]}, 2030년)</span></p>
        <p className="price-box__value">
          {int(price)}원 <span aria-hidden="true">{price > price26 ? '▲' : '▼'}</span>
          <span className="visually-hidden">{price > price26 ? '2026년보다 오름' : '2026년보다 내림'}</span>
        </p>
      </div>

      <div className="ticker" aria-live="polite">
        <span className="ticker__label">속보</span>
        <span className="ticker__window">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={ticker} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }} transition={{ duration: 0.4 }}>
              {ticker}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>

      <Meter value={combo.meter} />
    </div>
  )
}

function changedText(l: Levers): string {
  const changed = LEVERS.map((d, i) => (l[i] !== DEFAULT_LEVERS[i] ? `${d.name} ${l[i]}단계${isAssumed(i, l[i]) && d.key !== 'reduction' ? '(가정)' : ''}` : null)).filter(Boolean)
  const hasUnknown = l.some((s, i) => s !== DEFAULT_LEVERS[i] && !LEVERS[i].known.includes(s))
  return `바꾼 레버: ${changed.join(', ')}${hasUnknown ? ' · 값이 정해지지 않은 단계는 숫자를 바꾸지 않아요' : ''}${l[7] === 3 ? " (계산엔진 민감도 '합계 −5%')" : ''}`
}

type Delta = { text: string; dir: 'up' | 'down' | null }
/** 기본보다 나빠지면 ▲ 주황, 좋아지면 ▼ 초록 (명세서 7장) */
function delta(v: number, base: number, fmt: (v: number) => string, same: string): Delta {
  if (Math.abs(v - base) < 1) return { text: same, dir: null }
  return { text: `${v > base ? '▲' : '▼'} ${fmt(Math.abs(v - base))}`, dir: v > base ? 'up' : 'down' }
}

function Pin({ x, y, color, label, value, delta, assumed }: { x: number; y: number; color: string; label: string; value: string; delta?: Delta; assumed?: boolean }) {
  return (
    <div className="pin" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="pin__card">
        <p className="pin__label">
          <i style={{ background: color }} aria-hidden="true" />
          {label}
        </p>
        <p className="pin__value">
          <CountText text={value} />
          {assumed && <AssumptionBadge />}
          {delta && delta.text && <span className={`pin__delta${delta.dir ? ` is-${delta.dir}` : ''}`}>{delta.text}</span>}
        </p>
      </div>
      <span className="pin__line" aria-hidden="true" />
    </div>
  )
}

/** 핀 숫자 카운트 (0.4초) — 문자열 안의 첫 숫자만 움직임 */
function CountText({ text }: { text: string }) {
  const m = text.match(/^(\D*)([\d,.]+)(.*)$/)
  const target = m ? parseFloat(m[2].replace(/,/g, '')) : NaN
  const digits = m && m[2].includes('.') ? m[2].split('.')[1].length : 0
  const reduce = useReducedMotion()
  const prev = useRef(target)
  const [v, setV] = useState(target)
  useEffect(() => {
    if (isNaN(target) || reduce) return
    const c = animate(prev.current, target, { duration: 0.4, onUpdate: setV })
    prev.current = target
    return () => c.stop()
  }, [target, reduce])
  if (!m || isNaN(target)) return <>{text}</>
  const shown = reduce ? target : v
  return (
    <span>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">{m[1]}{shown.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}{m[3]}</span>
    </span>
  )
}

/** 4차 총량 대비 미터 — 숫자 카운트 + 막대 높이 (0.6초) */
function Meter({ value }: { value: number }) {
  const lo = -0.08, hi = 0.08
  const pos = (v: number) => Math.min(1, Math.max(0, (v - lo) / (hi - lo))) * 100
  const reduce = useReducedMotion()
  const prev = useRef(value)
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (reduce) return
    const c = animate(prev.current, value, { duration: 0.6, onUpdate: setShown })
    prev.current = value
    return () => c.stop()
  }, [value, reduce])
  const v = reduce ? value : shown
  const sign = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${pct(Math.abs(x), 1)}%`
  return (
    <div className="meter" role="meter" aria-label="4차 총량 대비 2030년 예측 배출" aria-valuemin={lo * 100} aria-valuemax={hi * 100} aria-valuenow={+(value * 100).toFixed(1)} aria-valuetext={sign(value)}>
      <p className="meter__title">4차 총량 대비</p>
      <div className="meter__track">
        <span className="meter__tick" style={{ bottom: `${pos(0.06)}%` }} />
        <span className="meter__cap" style={{ bottom: `${pos(0)}%` }}>
          <em>4차 총량</em>
        </span>
        <motion.span className={`meter__fill${value <= 0 ? ' is-in' : ''}`} animate={{ height: `${pos(value)}%` }} transition={{ duration: reduce ? 0 : 0.6 }} />
        <motion.span className="meter__value" animate={{ bottom: `${pos(value)}%` }} transition={{ duration: reduce ? 0 : 0.6 }}>
          {sign(v)}
        </motion.span>
      </div>
      <p className="meter__foot">2030년 예측</p>
    </div>
  )
}
