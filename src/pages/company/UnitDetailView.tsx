import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { Button } from '../../components/Button'
import { ChipGroup } from '../../components/Chip'
import { KpiCard } from '../../components/KpiCard'
import { Hashtag } from '../../components/Tags'
import { CostBarChart } from '../../components/charts/CostBarChart'
import { EmissionAllocChart } from '../../components/charts/EmissionAllocChart'
import { ScenarioLines } from '../../components/charts/ScenarioLines'
import { SectorDotPlot } from '../../components/charts/SectorDotPlot'
import { downloadUnitCsv } from '../../lib/csv'
import { hundredMillion, int, wonFin, mt, pct, priceShort, tonShort, trillion, wonShort } from '../../lib/format'
import type { Grade, PriceKey, UnitDetail, UnitSummary } from '../../lib/types'
import { PRICE_KEYS, PRICE_LABEL } from '../../lib/types'

const HIGH = 0.3 // 고위험 기준 (가정표)

const GRADE_BOX: Record<Grade, { label: string; tone: string }> = {
  loss: { label: '고위험', tone: 'danger' },
  high: { label: '고위험', tone: 'danger' },
  mid: { label: '중위험', tone: 'warn' },
  low: { label: '저위험', tone: 'ok' },
  none: { label: '비용 없음', tone: 'surplus' },
  nofin: { label: '재무 없음', tone: 'neutral' },
}

/** 04 기업 조회 결과 */
export function UnitDetailView({ unit, units, price, onPrice }: { unit: UnitDetail; units: UnitSummary[]; price: PriceKey; onPrice: (p: PriceKey) => void }) {
  const rows = unit.years[price]
  const y30 = rows[rows.length - 1]
  const y26 = rows[0]
  const cost5 = rows.reduce((s, r) => s + r.cost, 0)
  const buy5 = rows.reduce((s, r) => s + r.purchase, 0)
  const costs = PRICE_KEYS.map((p) => unit.cost5y[p])
  const nofin = !!unit.excludeReason
  const g = unit.grade2030[price]

  // 같은 업종에서 위험도가 있는 단위 (영업이익 > 0, 재무 있음)
  const peers = useMemo(
    () => units.filter((u) => u.sector === unit.sector && u.risk2030[price] != null).map((u) => ({ id: u.id, name: u.displayName, risk: u.risk2030[price]! })),
    [units, unit.sector, price],
  )
  const peerRank = unit.risk2030[price] != null ? 1 + peers.filter((p) => p.risk > unit.risk2030[price]!).length : null

  const w = unit.why
  const big = cost5 >= 1e12
  return (
    <div className="company-main">
      <div className="detail-head">
        <div className="detail-head__text">
          <h1 className="h1">{unit.displayName}</h1>
          <div className="hashtags">
            <Hashtag>#{unit.sector}</Hashtag>
            <Hashtag>#{unit.orgType}</Hashtag>
            {unit.region && <Hashtag>#{unit.region}</Hashtag>}
            {unit.isNew && <Hashtag>#4차 신규</Hashtag>}
            {unit.rank5y && <Hashtag>#5년 비용 {units.length}곳 중 {unit.rank5y}위</Hashtag>}
          </div>
        </div>
        <div className={`grade-box grade-box--${GRADE_BOX[g].tone}`} aria-live="polite">
          <p className="caption-strong">2030 위험 등급</p>
          <p className="grade-box__label">{GRADE_BOX[g].label}</p>
          <p className="caption-strong">{gradeNote(g, unit, price)}</p>
        </div>
      </div>

      <div className="price-row">
        <span className="secondary body-s">2030 배출권 가격</span>
        <ChipGroup
          label="가격 시나리오"
          value={price}
          onChange={onPrice}
          options={PRICE_KEYS.map((p) => ({ value: p, label: `${PRICE_LABEL[p]} · ${priceShort(unit.years[p][4].price)}` }))}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={price} className="detail-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <div className="kpi-row">
            <KpiCard label="5년 탄소비용" value={big ? trillion(cost5) : hundredMillion(cost5)} unit={big ? '조 원' : '억 원'}
              note={`가격에 따라 ${wonShort(Math.min(...costs))} ~ ${wonShort(Math.max(...costs))}`} />
            <KpiCard label="5년 배출권 구매량" {...tonParts(buy5)}
              note={y26.bankUse > 0 ? `2026년 이월 ${tonShort(y26.bankUse)} 사용 후` : y26.bankStart > 0 ? '이월 잔고 사용 없음' : '이월 잔고 없음'} />
            <KpiCard label="2030 무상할당" {...tonParts(y30.freeAlloc, 2)}
              note={w.freeAlloc.y2025 != null && w.freeAlloc.changeFrom2025 != null ? `2025년 ${tonShort(w.freeAlloc.y2025)}에서 ${signPct(w.freeAlloc.changeFrom2025)}` : '2025년 할당 없음 (4차 신규)'} />
            <KpiCard label="2030 1톤당 실제 부담" value={y30.effPrice != null ? int(y30.effPrice) : '–'} unit="원"
              note={y30.effPriceRatio != null ? `시장가 ${priceShort(y30.price)}의 ${pct(y30.effPriceRatio)}%` : '2030 배출 없음'} />
          </div>

          <div className="grid-main">
            <section className="panel">
              <PanelTitle title="2026~2030 배출 예측 vs 할당" sub="백만 t · 예측 범위는 P10~P90" />
              <EmissionAllocChart rows={rows} />
            </section>
            <section className="panel panel--side">
              <h2 className="h3">한눈에 보기</h2>
              <dl className="facts">
                <Fact k="매출 (3년 평균)" v={unit.revenue3y != null ? `${wonFin(unit.revenue3y)} 원` : '없음'} />
                <Fact k="영업이익 (3년 평균)" v={unit.opProfit3y != null ? `${wonFin(unit.opProfit3y)} 원` : '없음'} />
                <Fact k="영업이익률" v={unit.opMargin3y != null ? `${pct(unit.opMargin3y, 1)}%` : '없음'} />
                <Fact k="2030 탄소비용 반영 후 이익률" v={y30.marginAfter != null ? `${pct(y30.marginAfter, 1)}%` : '없음'} warn={(y30.marginAfter ?? 0) < 0} />
                <Fact k="2026년 이월 사용" v={tonShort(y26.bankUse)} />
                <Fact k={`${unit.sector} ${peers.length}곳 중 위험도`} v={peerRank ? `높은 쪽 ${peerRank}번째` : nofin ? '재무 없음' : '위험도 없음'} />
              </dl>
              <Button variant="secondary" className="btn--block" onClick={() => downloadUnitCsv(unit)}>
                원자료 내려받기 (CSV)
              </Button>
            </section>
          </div>

          <div className="grid-3">
            <section className="panel">
              <PanelTitle title="해마다 내는 탄소비용 vs 영업이익" sub={`억 원 · ${PRICE_LABEL[price]} 시나리오`} />
              <CostBarChart rows={rows} opProfit={nofin ? null : unit.opProfit3y} />
            </section>
            <section className="panel">
              <PanelTitle title={`${unit.sector} 부문 안에서 위치`} sub={`2030 위험도 · 위험도가 있는 ${unit.sector} ${peers.length}곳`} />
              {peers.length > 0 ? (
                <SectorDotPlot dots={peers} currentId={unit.id} threshold={HIGH} />
              ) : (
                <p className="secondary body-s">이 업종에는 위험도를 계산할 수 있는 단위가 없어요.</p>
              )}
              {unit.risk2030[price] == null && peers.length > 0 && (
                <p className="caption">{nofin ? '이 단위는 재무 자료가 없어 점이 없어요.' : '이 단위는 영업이익이 0 이하라 위험도가 없어요.'}</p>
              )}
            </section>
            <section className="panel">
              <PanelTitle title="왜 이렇게 나왔나?" sub="계산엔진 결과로 본 요인" />
              <div className="why">
                <WhyRow k="무상할당 감소" v={`${mt(w.freeAlloc.start)} → ${mt(w.freeAlloc.end)}백만 t${w.freeAlloc.change != null ? ` (${signPct(w.freeAlloc.change)})` : ''}`} bar={Math.abs(w.freeAlloc.change ?? 0)} />
                <WhyRow k="유상 비율 상승" v={w.paidRatio.start != null && w.paidRatio.end != null ? `${pct(w.paidRatio.start)}% → ${pct(w.paidRatio.end)}%` : '–'} bar={(w.paidRatio.end ?? 0) - (w.paidRatio.start ?? 0)} />
                <WhyRow k="배출 감소 폭" v={`${mt(w.emis.start)} → ${mt(w.emis.end)}백만 t${w.emis.change != null ? ` (${signPct(w.emis.change)})` : ''}`} bar={Math.max(0, -(w.emis.change ?? 0))} />
                <WhyRow k="이월 잔고" v={bankText(w.bank)} bar={w.bank.shareOfNeed ?? 0} />
              </div>
              <p className="body-s">{whySentence(w)}</p>
            </section>
          </div>

          <section className="panel">
            <PanelTitle title="가격 시나리오별 연도별 탄소비용" sub={`억 원 · ${unit.displayName} · 굵은 선이 지금 고른 시나리오`} />
            <ScenarioLines years={unit.years} selected={price} opProfit={nofin ? null : unit.opProfit3y} />
          </section>
        </motion.div>
      </AnimatePresence>
      <p className="caption">출처 · 팀 계산엔진 결과표·지표_참고(2026.11.18) · 가정: 상쇄·차입 미반영, 이월 N배 규칙, 편향 보정 없음</p>
    </div>
  )
}

function PanelTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="panel__title">
      <h2 className="h3">{title}</h2>
      <p className="caption">{sub}</p>
    </div>
  )
}

function Fact({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="fact">
      <dt>{k}</dt>
      <dd className={warn ? 'is-warn' : ''}>{v}</dd>
    </div>
  )
}

function WhyRow({ k, v, bar }: { k: string; v: string; bar: number }) {
  return (
    <div className="why__row">
      <div className="why__text">
        <span className="body-s">{k}</span>
        <span className="caption">{v}</span>
      </div>
      <div className="why__track" aria-hidden="true">
        <div className="why__bar" style={{ width: `${Math.min(1, Math.max(0, bar)) * 100}%` }} />
      </div>
    </div>
  )
}

const signPct = (r: number) => `${r > 0 ? '+' : ''}${pct(r)}%`

function tonParts(t: number, digits?: number) {
  if (Math.abs(t) >= 1e6) return { value: mt(t, digits ?? 1), unit: '백만 t' }
  return { value: int(t), unit: 't' }
}

function gradeNote(g: Grade, u: UnitDetail, price: PriceKey): string {
  const r = u.risk2030[price]
  if (g === 'nofin') return u.excludeReason ?? '재무 자료 없음'
  if (g === 'none') return '2030년 사야 할 배출권 없음'
  if (g === 'loss') return '영업이익이 이미 적자'
  return r != null ? `탄소비용이 영업이익의 ${pct(r)}%` : ''
}

function bankText(b: UnitDetail['why']['bank']): string {
  if (b.start2026 <= 0) return '2026년 시작 잔고 없음'
  if (b.emptyYear) return `${b.emptyYear}년에 모두 사용`
  return `2030년 말 ${tonShort(b.end2030)} 남음`
}

/** 요인 분해 문장 — 엔진 값으로만 고름 */
function whySentence(w: UnitDetail['why']): string {
  const fa = w.freeAlloc.change, em = w.emis.change
  if (fa == null || em == null) return '2026년 할당이나 배출이 없어 변화율을 계산하지 않았어요.'
  if (fa < em) return `할당은 5년 동안 ${pct(-fa)}% 줄지만 배출은 ${em < 0 ? `${pct(-em)}%만 줄어` : '줄지 않아'}, 사야 할 배출권이 해마다 늘어납니다.`
  return `배출이 할당보다 빨리 줄어(${signPct(em)} vs ${signPct(fa)}), 사야 할 배출권 부담이 커지지 않습니다.`
}
