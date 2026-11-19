import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/Button'
import { ChipGroup } from '../../components/Chip'
import { HeaderActions } from '../../components/HeaderActions'
import { KpiCard } from '../../components/KpiCard'
import { AssumptionBadge } from '../../components/Tags'
import { linear, pathOf } from '../../components/charts/scale'
import '../../components/charts/charts.css'
import { int, mt, pct, priceShort, trillion, wonShort } from '../../lib/format'
import { sectorColor } from '../../lib/sectors'
import { leverDetail } from '../lab/LeverBar'
import { DEFAULT_LEVERS, LEVERS, PASS_THROUGH_EXAMPLE, isAssumed, isDefault, leverString, sceneOf, sum, y2030, type LabCombo, type LabData, type Levers } from '../lab/model'
import { useLab } from '../lab/useLab'
import '../lab/lab.css'
import '../company/company.css'
import '../article/article.css'
import './lab-result.css'

type View = 'base' | 'mine'

/** 07 실험실 결과 보기 — /lab/result?lever=… (현행 4차와 나란히 비교) */
export default function LabResultPage() {
  const { data, error, levers, combo, base } = useLab()
  const [view, setView] = useState<View>('mine')
  useEffect(() => {
    document.title = '장관 성적표 · 탄소청구서'
  }, [])
  const q = isDefault(levers) ? '' : `?lever=${leverString(levers)}`
  return (
    <main className="result">
      <HeaderActions>
        <ButtonLink variant="ghost" to={`/lab${q}`}>← 레버로 돌아가기</ButtonLink>
        <span title="참여자 경로를 모을 저장소를 아직 정하지 않았어요 (명세서 10장)">
          <Button disabled aria-describedby="submit-note">경로 제출하기</Button>
        </span>
      </HeaderActions>
      {error && <p>데이터를 불러오지 못했어요. 새로고침해 주세요.</p>}
      {data && combo && base && <Body data={data} levers={levers} combo={combo} base={base} view={view} setView={setView} />}
      <p id="submit-note" className="visually-hidden">경로 제출은 아직 준비 중이에요.</p>
    </main>
  )
}

function Body({ data, levers, combo, base, view, setView }: { data: LabData; levers: Levers; combo: LabCombo; base: LabCombo; view: View; setView: (v: View) => void }) {
  const my = y2030(combo), cur = y2030(base)
  const shown = view === 'mine' ? combo : base
  const scene = sceneOf(combo.meter)
  const signPct = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${pct(Math.abs(x), 1)}`
  const diff = (a: number, b: number, f: (v: number) => string) => (Math.abs(a - b) < 1 ? '현행과 같음' : `${a < b ? '↓' : '↑'} ${f(Math.abs(a - b))}`)
  const cost5 = sum(combo, 'cost'), cost5b = sum(base, 'cost')
  const buy5 = sum(combo, 'purchase'), buy5b = sum(base, 'purchase')
  const inside = combo.meter <= 0
  const pass = PASS_THROUGH_EXAMPLE[levers[6]]

  return (
    <>
      <div className="result__head">
        <div>
          <p className="eyebrow">장관 성적표</p>
          <h1 className="h1">장관님의 2030년 청구서</h1>
        </div>
        <div className="result__toggle">
          <span className="caption">비교 기준</span>
          <ChipGroup label="비교 기준" value={view} onChange={setView} options={[{ value: 'base', label: '현행 4차' }, { value: 'mine', label: '내 경로' }]} />
        </div>
      </div>

      <section className="summary">
        <div className={`summary__img stage__img--s${scene}`} style={{ backgroundImage: `url(/scenes/scene-s${scene}.webp)` }} role="img" aria-label={`장면 ${scene}단계`} />
        <div className="summary__text">
          <h2 className="h2">{inside ? '4차 총량 안으로 들어왔어요' : '아직 4차 총량을 넘어요'}</h2>
          <p className="body-s secondary">
            2030년 배출이 {Math.abs(my.emis - cur.emis) < 1 ? '현행과 같아' : `현행보다 ${mt(Math.abs(my.emis - cur.emis))}백만 t ${my.emis < cur.emis ? '적어' : '많아'}`} 4차 총량보다 {pct(Math.abs(combo.meter), 1)}% {inside ? '아래' : '위'}예요. 5년 탄소비용은 {trillion(cost5b, 1)}조에서 {trillion(cost5, 1)}조 원{cost5 < cost5b ? '으로 줄어요' : cost5 > cost5b ? '으로 늘어요' : '으로 같아요'}.
            {levers.some((s, i) => s !== DEFAULT_LEVERS[i] && isAssumed(i, s)) && ' 단, 가정이 들어간 레버가 있어요.'}
          </p>
          <MeterLine mine={combo.meter} base={base.meter} />
        </div>
      </section>

      <div className="kpi-row">
        <KpiCard label="2030 배출" value={mt(my.emis)} unit="백만 t" note={`${diff(my.emis, cur.emis, (v) => mt(v))} · 현행 ${mt(cur.emis)}`} />
        <KpiCard label="4차 총량 대비 (2030)" value={signPct(combo.meter)} unit="%" note={`현행 ${signPct(base.meter)}%`} />
        <KpiCard label="5년 탄소비용" value={trillion(cost5, 1)} unit="조 원" note={`${diff(cost5, cost5b, (v) => `${trillion(v, 1)}조`)} · 현행 ${trillion(cost5b, 1)}조`} />
        <KpiCard label="5년 배출권 구매량" value={mt(buy5)} unit="백만 t" note={`${diff(buy5, buy5b, (v) => mt(v))} · 현행 ${mt(buy5b)}`} />
      </div>

      <div className="result__grid result__grid--path">
        <section className="panel">
          <Title t="배출 경로 2026–2030" s={`4차 할당 ${int(data.totalUnits)}단위 합계 (백만 t) · ${priceShort(my.price)} 시나리오`} />
          <PathChart combo={combo} base={base} />
        </section>
        <section className="panel">
          <Title t="내가 고른 레버" s="단계 1 지금 계획 · 4 가장 강하게" />
          <ul className="my-levers">
            {LEVERS.map((l, i) => (
              <li key={l.key}>
                <div>
                  <p className="body-s">{l.name}{isAssumed(i, levers[i]) && <AssumptionBadge />}</p>
                  <p className="caption">{leverDetail(i, levers[i], data)}</p>
                </div>
                <span className="steps" aria-label={`${levers[i]}단계`}>
                  {[1, 2, 3, 4].map((s) => <i key={s} className={s <= levers[i] ? 'on' : ''} />)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="result__grid">
        <section className="panel">
          <Title t="업종별 탄소비용" s={`${view === 'mine' ? '내 경로' : '현행 4차'} · 5년 합계 (조 원)`} />
          <div className="hbars hbars--light">
            {shown.sectorCost5y.map((s) => (
              <div className="hbars__row" key={s.sector}>
                <span>{s.sector}</span>
                <span className="hbars__track">
                  <i style={{ width: `${(s.cost / shown.sectorCost5y[0].cost) * 100}%`, background: sectorColor(s.sector) }} />
                  <em>{trillion(s.cost)}조</em>
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <Title t="발전 비용은 어디로?" s="2030년 · 나뉘는 비율은 가정" />
          <p className="caption">발전 부문 2030 탄소비용</p>
          <p className="h2">{trillion(shown.pins.powerCost2030)}조 원</p>
          <p className="caption">구매 {mt(shown.pins.powerPurchase2030)}백만 t × {priceShort(y2030(shown).price)}</p>
          <div className="split" aria-label={`전기요금으로 ${pct(pass)}%, 한전 부채로 ${pct(1 - pass)}% (가정)`}>
            <i style={{ width: `${pass * 100}%`, background: 'var(--color-chart-3)' }} />
            <i style={{ width: `${(1 - pass) * 100}%`, background: 'var(--color-data-neutral)' }} />
          </div>
          <div className="split__legend">
            <p><strong>전기요금으로 {pct(pass)}%</strong><br /><span className="caption">가계·기업이 냄</span></p>
            <p><strong>한전 부채로 {pct(1 - pass)}%</strong><br /><span className="caption">공공이 떠안음</span></p>
          </div>
          <p className="caption brand">요금 전가율 레버 {levers[6]}단계({pct(pass)}%) 예시 · H8 결과로 확정 필요 <AssumptionBadge /></p>
        </section>
        <section className="panel">
          <Title t="2030년 위험 등급" s={`${int(data.totalUnits)}단위 · ${view === 'mine' ? '내 경로' : '현행 4차'}`} />
          <GradeColumns g={shown.grades2030} />
        </section>
      </div>

      <div className="result__grid result__grid--bottom">
        <section className="panel">
          <Title t="5년 탄소비용 TOP 5" s={`${view === 'mine' ? '내 경로' : '현행 4차'} · 이익 대비 = 2030년 탄소비용 ÷ 영업이익(3년 평균)`} />
          <table className="top10">
            <thead>
              <tr><th>순위</th><th>단위</th><th>업종</th><th className="num">5년 구매량</th><th className="num">5년 탄소비용</th><th className="num">이익 대비</th></tr>
            </thead>
            <tbody>
              {shown.top5.map((t, i) => (
                <tr key={t.id}>
                  <td>{i + 1}</td>
                  <td><Link to={`/company/${encodeURIComponent(t.id)}`}>{t.name.replace(/\s*주식회사\s*/, '')}</Link></td>
                  <td><i className="dot" style={{ background: sectorColor(t.sector) }} /> {t.sector}</td>
                  <td className="num">{mt(t.purchase5y)}백만 t</td>
                  <td className="num">{wonShort(t.cost5y)}</td>
                  <td className="num">{t.noFinance ? '재무 없음' : t.risk2030 != null ? `${pct(t.risk2030)}%` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <div className="result__side">
          <section className="panel panel--muted" aria-disabled="true">
            <Title t="다른 참여자와 비교" s="제출이 모이면 평균이 표시돼요" />
            <p className="caption">4차 총량 대비</p>
            <div className="ghost-bar" />
            <p className="caption">5년 탄소비용</p>
            <div className="ghost-bar" />
          </section>
          <section className="panel panel--dark">
            <p className="h3">우리 회사는 어떨까?</p>
            <p className="body-s">기업 탭에서 이름을 검색하면 4차 부족분, 탄소비용, 위험 등급을 볼 수 있어요.</p>
            <ButtonLink variant="secondary" to="/company">기업 찾아보기 →</ButtonLink>
          </section>
        </div>
      </div>
      <p className="caption">
        출처 · 팀 계산엔진 계산()·지표() (2026.11.18 결과표로 재현 검증) · 내 경로 = 레버 조합의 엔진 결과(에너지 사용 감축 3단계 = 민감도 ‘배출 합계 −5%’) · 상쇄·차입 미반영 · 요금 전가율과 정해지지 않은 레버 단계는 가정
      </p>
    </>
  )
}

function Title({ t, s }: { t: string; s: string }) {
  return (
    <div className="panel__title">
      <h2 className="h3">{t}</h2>
      <p className="caption">{s}</p>
    </div>
  )
}

/** 요약 막대: 총량 아래 ← 4차 총량 → 총량 초과, 내 경로·현행 표시 */
function MeterLine({ mine, base }: { mine: number; base: number }) {
  const x = (v: number) => `${Math.min(100, Math.max(0, ((v + 0.08) / 0.16) * 100))}%`
  const s = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${pct(Math.abs(v), 1)}%`
  return (
    <div className="meter-line" aria-label={`내 경로 ${s(mine)}, 현행 ${s(base)}`}>
      <div className="meter-line__labels caption"><span>← 총량 아래</span><strong>4차 총량</strong><span>총량 초과 →</span></div>
      <div className="meter-line__track">
        <span className="meter-line__cap" style={{ left: x(0) }} />
        <span className="meter-line__base" style={{ left: x(base) }} />
        <span className="meter-line__mine" style={{ left: x(mine) }} />
      </div>
      <div className="meter-line__marks caption">
        <span style={{ left: x(mine) }} className="brand">내 경로 {s(mine)}</span>
        {Math.abs(mine - base) > 0.005 && <span style={{ left: x(base) }}>현행 {s(base)}</span>}
      </div>
    </div>
  )
}

function PathChart({ combo, base }: { combo: LabCombo; base: LabCombo }) {
  const W = 620, H = 300, L = 44, R = 20, T = 20, B = 30
  const all = [...combo.yearly, ...base.yearly].flatMap((y) => [y.emis, y.preAlloc]).map((v) => v / 1e6)
  const lo = Math.floor(Math.min(...all) / 30) * 30, hi = Math.ceil(Math.max(...all) / 30) * 30
  const x = linear(0, 4, L, W - R), y = linear(lo, hi, H - B, T)
  const P = (c: LabCombo, k: 'emis' | 'preAlloc') => c.yearly.map((r, i) => [x(i), y(r[k] / 1e6)] as [number, number])
  const b = P(base, 'emis'), m = P(combo, 'emis'), cap = P(base, 'preAlloc')
  const over = [...base.yearly.map((r, i) => [x(i), y(Math.max(r.emis, r.preAlloc) / 1e6)] as [number, number]), ...cap.slice().reverse()]
  const ticks = Array.from({ length: (hi - lo) / 30 + 1 }, (_, i) => lo + i * 30)
  const last = (c: LabCombo, k: 'emis' | 'preAlloc') => mt(y2030(c)[k])
  return (
    <figure className="fig">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`2030년 현행 ${last(base, 'emis')}, 4차 총량 ${last(base, 'preAlloc')}, 내 경로 ${last(combo, 'emis')} (백만 t)`}>
        {ticks.map((t) => (
          <g key={t}><line className="grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} /><text x={L - 8} y={y(t) + 4} textAnchor="end">{t}</text></g>
        ))}
        <path d={pathOf(over) + 'Z'} fill="var(--color-data-short)" opacity={0.2} />
        <path d={pathOf(b)} fill="none" stroke="var(--color-data-neutral)" strokeWidth={3} />
        <path d={pathOf(cap)} fill="none" stroke="var(--color-data-target)" strokeWidth={2} strokeDasharray="6 5" />
        <path d={pathOf(m)} fill="none" stroke="var(--color-data-positive)" strokeWidth={3} />
        {m.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={4} fill="var(--color-data-positive)"><title>{`${combo.yearly[i].year}년 내 경로 ${mt(combo.yearly[i].emis)}백만 t`}</title></circle>)}
        {combo.yearly.map((r, i) => <text key={r.year} x={x(i)} y={H - 8} textAnchor="middle">{r.year}</text>)}
        <g transform={`translate(${W - R - 190},${T + 6})`}>
          <rect width={186} height={86} rx={8} fill="white" stroke="var(--color-border-default)" />
          <text x={12} y={20} style={{ fill: 'var(--color-text-primary)' }}>2030년 배출 (백만 t)</text>
          <text x={12} y={42}>현행 4차 예측 <tspan x={174} textAnchor="end" style={{ fill: 'var(--color-text-primary)', fontWeight: 700 }}>{last(base, 'emis')}</tspan></text>
          <text x={12} y={60}>4차 총량 <tspan x={174} textAnchor="end" style={{ fill: 'var(--color-text-primary)', fontWeight: 700 }}>{last(base, 'preAlloc')}</tspan></text>
          <text x={12} y={78}>내 경로 <tspan x={174} textAnchor="end" style={{ fill: 'var(--color-text-primary)', fontWeight: 700 }}>{last(combo, 'emis')}</tspan></text>
        </g>
      </svg>
      <figcaption className="chart-legend">
        <span><i className="line" style={{ background: 'var(--color-data-neutral)' }} />현행 4차 예측</span>
        <span><i className="line" style={{ background: 'var(--color-data-positive)' }} />내 경로</span>
        <span><i className="line" style={{ background: 'var(--color-data-target)' }} />4차 사전할당 총량</span>
        <span><i className="swatch" style={{ background: 'var(--color-data-short)' }} />현행이 총량을 넘는 몫</span>
      </figcaption>
    </figure>
  )
}

function GradeColumns({ g }: { g: LabCombo['grades2030'] }) {
  const cols: [string, number, string][] = [
    ['고위험\n(적자)', g.loss, 'var(--color-data-short)'],
    ['고위험', g.high, 'var(--color-data-short)'],
    ['중위험', g.mid, 'var(--color-chart-6)'],
    ['저위험', g.low, 'var(--color-chart-1)'],
    ['비용\n없음', g.none, 'var(--color-data-neutral)'],
    ['재무\n없음', g.nofin, 'var(--color-bg-subtle)'],
  ]
  const max = Math.max(...cols.map((c) => c[1]))
  return (
    <div className="grade-cols" role="list">
      {cols.map(([l, n, c]) => (
        <div key={l} role="listitem" aria-label={`${l.replace('\n', ' ')} ${n}곳`}>
          <strong>{n}</strong>
          <i style={{ height: `${(n / max) * 120}px`, background: c }} />
          <span>{l}</span>
        </div>
      ))}
    </div>
  )
}
