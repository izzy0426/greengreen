import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/Button'
import { FloatingCta } from '../../components/FloatingCta'
import { Footer } from '../../components/Footer'
import { CountUp, Reveal } from '../../components/Reveal'
import { useAsync } from '../../hooks/useAsync'
import { loadArticle } from '../../lib/data'
import { int, mt, pct, priceShort, trillion, wonShort } from '../../lib/format'
import type { ArticleData } from '../../lib/types'
import { ChapterNav } from './ChapterNav'
import { ButterflyBars, EffPriceLines, PriceLines, SectorCostBars, SurplusBars, TrendChart, TurnsLossBars } from './ArticleCharts'
import './article.css'

const f1 = (v: number) => v.toFixed(1)
const f0 = (v: number) => Math.round(v).toLocaleString('ko-KR')

/** 01 아티클 — 하이파이 102:2359. 문장 속 숫자도 모두 article.json에서 */
export default function ArticlePage() {
  const { data: a, error } = useAsync(loadArticle, [])
  const footerRef = useRef<HTMLElement>(null)
  const ctaBottom = useFooterAvoid(footerRef)
  useEffect(() => {
    document.title = '배출권 길라잡이 · 2030년, 탄소 청구서는 누구에게 날아올까?'
  }, [])
  if (error) return <main className="page"><p>데이터를 불러오지 못했어요. 새로고침해 주세요.</p></main>
  if (!a) return <main className="article" aria-busy="true"><section className="hero" /></main>
  return (
    <>
      <ChapterNav />
      <main className="article">
        <Hero a={a} />
        <Glance a={a} />
        <Chapter1 a={a} />
        <Chapter2 a={a} />
        <Chapter3 a={a} />
        <Chapter4 a={a} />
        <Roles />
        <Shortcuts total={a.hero.totalUnits} />
      </main>
      <Footer ref={footerRef} />
      <FloatingCta label="실험실에서 직접 해보기" bottom={ctaBottom} />
    </>
  )
}

/** 플로팅 버튼: 푸터에 닿으면 위로 비켜남 */
function useFooterAvoid(ref: React.RefObject<HTMLElement | null>) {
  const [bottom, setBottom] = useState<number | undefined>(undefined)
  useEffect(() => {
    const on = () => {
      const el = ref.current
      if (!el) return
      const overlap = window.innerHeight - el.getBoundingClientRect().top
      setBottom(overlap > 0 ? overlap + 24 : undefined)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [ref])
  return bottom
}

function Hero({ a }: { a: ArticleData }) {
  const h = a.hero
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__bg" role="img" aria-label="공장과 발전소, 도시가 함께 있는 픽셀 장면" />
      <div className="hero__inner">
        <div className="hero__text">
          <h1 id="hero-title" className="hero__title">
            2030년,<br />탄소 청구서는<br />누구에게 날아올까?
          </h1>
          <p className="hero__lead">
            2025년 말, {int(h.totalUnits)}개 할당 단위에 4차 배출권이 나뉘었습니다. 이번에는 조금 다릅니다. 공짜로 받던 몫은 줄고, 돈을 내고 사야 하는 몫은 커졌습니다. 앞으로 5년, 이 단위들 앞으로 쌓일 탄소 청구서는 약 {trillion(h.cost5yNow, 1)}조 원. 문제는 금액이 아니라, 그 청구서가 누구에게 가느냐입니다.
          </p>
          <Button onClick={() => document.getElementById('glance')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>
            청구서 열어 보기 ↓
          </Button>
        </div>
        <ul className="hero__stats">
          <HeroStat value={<CountUp value={h.cost5yNow / 1e12} format={f1} />} unit="조 원" label="4차 5년 탄소비용" note={`배출권 가격 ${priceShort(a.glance.price2030.now)} 유지 시`} />
          <HeroStat value={<CountUp value={h.powerCostShare * 100} format={f0} />} unit="%" label="그중 발전 부문 몫" note={`배출 비중은 ${pct(h.powerEmisShare)}%`} />
          <HeroStat value={<CountUp value={h.shortUnits2030} format={f0} />} unit="곳" label="2030년 배출권이 모자라는 단위" note={`${int(h.totalUnits)}곳 중`} />
        </ul>
      </div>
      <p className="hero__source">출처 · 팀 계산엔진 결과표(2026.11.18), 가격 시나리오 ‘지금 가격’</p>
    </section>
  )
}

function HeroStat({ value, unit, label, note }: { value: React.ReactNode; unit: string; label: string; note: string }) {
  return (
    <li className="hero-stat">
      <p className="hero-stat__value">
        {value}
        <span>{unit}</span>
      </p>
      <p className="hero-stat__label">{label}</p>
      <p className="hero-stat__note">{note}</p>
    </li>
  )
}

function Glance({ a }: { a: ArticleData }) {
  const g = a.glance
  const c = a.concentration
  return (
    <section id="glance" className="section">
      <Reveal className="section__head">
        <p className="eyebrow">AT A GLANCE</p>
        <h2 className="h1">4차 배출권, 숫자로 먼저 보기</h2>
        <p className="body-l secondary">
          본격적인 이야기에 앞서 숫자부터 펼쳐 봅니다. 우리는 {int(a.hero.totalUnits)}개 할당 단위의 2026~2030년 배출을 예측하고, 4차 할당과 배출권 가격을 맞대 탄소비용을 계산했습니다.
        </p>
      </Reveal>
      <div className="kpi-row">
        <Kpi label="2030 예측 배출 (4차 할당 단위)" value={mt(g.emis2030)} unit="백만 t" note={`2026년 ${mt(g.emis2026)}에서 ${pct(g.emisChange, 1)}%`} />
        <Kpi label="2030 4차 총량을 넘는 배출" value={mt(g.gapTotal2030)} unit="백만 t" note={`사전할당 ${mt(g.preAlloc2030)} 대비 · 5년 ${mt(g.gapTotal5y)}`} />
        <Kpi label="5년 배출권 구매량" value={mt(g.purchase5y)} unit="백만 t" note="경매 + 시장 구매" />
        <Kpi label="2030 적자로 돌아서는 단위" value={int(g.turnsLoss2030Now)} unit="곳" note={`가격 ${priceShort(g.price2030.max)}이면 ${g.turnsLoss2030Max}곳`} />
      </div>
      <div className="glance-grid">
        <Reveal className="card-s glance-grid__wide">
          <CardTitle title="배출 vs 할당, 2015–2030" sub="실적: 분석 표본 배출(명세서)과 순할당 · 예측: 4차 할당 단위 예측 배출과 사전할당·무상할당 (백만 t)" />
          <TrendChart a={a} />
        </Reveal>
        <Reveal className="card-s" delay={0.1}>
          <CardTitle title="누가 배출하고, 누가 내나" sub="업종별 비중 · 5년 합계, 지금 가격 시나리오" />
          <ButterflyBars sectors={a.sectors} />
        </Reveal>
        <Reveal className="card-s">
          <CardTitle title="가격이 오르면 청구서도 커진다" sub="2030년 배출권 가격 시나리오별 연도별 탄소비용 (조 원)" />
          <PriceLines a={a} />
          <p className="caption">
            2030년 톤당 가격 · 낮은 {priceShort(g.price2030.low)} · 지금 {priceShort(g.price2030.now)} · 높은 {priceShort(g.price2030.high)} · 매우 높은 {priceShort(g.price2030.max)}
          </p>
        </Reveal>
        <Reveal className="card-s" delay={0.1}>
          <CardTitle title="적자로 돌아서는 단위" sub={`재무가 있는 ${a.turnsLoss.base}개 중, 2030년`} />
          <TurnsLossBars a={a} />
        </Reveal>
        <Reveal className="card-s card-s--brand" delay={0.2}>
          <CardTitle title="청구서는 몇 곳에 몰린다" sub="5년 탄소비용 중 상위 10곳 몫" />
          <p className="big-number">
            <CountUp value={c.top10Share * 100} format={f0} />
            <span>%</span>
          </p>
          <div className="share-bar" aria-hidden="true">
            <i style={{ width: `${c.top10Share * 100}%` }} />
          </div>
          <p className="body-s">상위 10곳 중 {c.top10PowerCount}곳이 발전사</p>
          <p className="caption">비용이 생기는 단위는 {int(a.hero.totalUnits)}곳 중 {int(c.unitsWithCost)}곳</p>
        </Reveal>
      </div>
      <p className="caption">
        출처 · 팀 계산엔진 결과표·요약(2026.11.18), H7 적자전환표(권준영), EDA 분석단위 패널 · 가격 근거: 낮은 = 3차 수준 회귀, 지금 = 현재 추세 유지, 높은 = IEA 현행정책 전망, 매우 높은 = 탄소중립 전환에 필요한 수준
      </p>
    </section>
  )
}

function Chapter1({ a }: { a: ArticleData }) {
  const s = a.historyInsights
  return (
    <section id="ch-1" className="section chapter">
      <div className="chapter__grid">
        <Reveal className="chapter__text">
          <p className="eyebrow">01 남는 배출권의 시절</p>
          <h2 className="h1">남는 배출권이<br />쌓여 갔다</h2>
          <p className="body secondary">
            3차 기간(2021~2025) 동안 기업들이 받은 배출권은 실제 배출보다 해마다 평균 {f0(s.phase3AvgSurplus / 1e4)}만 톤 많았습니다. 쓰고 남은 배출권은 다음 해로 넘어갔고, 4차가 시작된 2026년 초에도 약 {mt(s.bankStart2026)}백만 톤이 쌓여 있던 것으로 추정됩니다. 남는 배출권이 넘치는 시장에서 돈을 주고 배출권을 살 이유는 많지 않았습니다.
          </p>
        </Reveal>
        <Reveal className="card-s card-s--subtle" delay={0.1}>
          <CardTitle title="해마다 남은(+) / 모자란(−) 배출권" sub="순할당 − 배출, 분석 표본 합계 (백만 t)" />
          <SurplusBars history={a.history} />
        </Reveal>
      </div>
      <div className="insights">
        <Insight n={1} value={mt(s.phase3AvgSurplus)} unit="백만 t" text="3차 5년 동안 해마다 평균으로 남은 배출권" />
        <Insight n={2} value={mt(s.maxSurplus.surplus)} unit="백만 t" text={`가장 많이 남은 해(${s.maxSurplus.year})`} />
        <Insight n={3} value={mt(s.bankStart2026)} unit="백만 t" text="4차가 시작된 2026년 초 쌓여 있던 이월 배출권 (엔진 추정)" />
      </div>
      <p className="caption">출처 · EDA 분석단위 패널(배출권 파트), 계산엔진 결과표 · 1~2차는 명세서와 인증 배출량 차이가 커 그대로 비교하기 어려움</p>
    </section>
  )
}

function Chapter2({ a }: { a: ArticleData }) {
  const all = a.effPrice['전체'], pw = a.effPrice['발전'], np = a.effPrice['발전 외']
  const l = all[all.length - 1]
  const price = a.glance.price2030.now
  return (
    <section id="ch-2" className="section chapter">
      <div className="chapter__grid">
        <Reveal className="chapter__text">
          <p className="eyebrow">02 여전히 싼 탄소</p>
          <h2 className="h1">탄소는<br />여전히 싸다</h2>
          <p className="body secondary">
            시장에서 배출권은 톤당 {priceShort(price)} 안팎에 거래됩니다. 하지만 대부분을 무상으로 받는 기업이 실제로 내는 돈은 훨씬 적습니다. 배출 1톤당 실제 부담을 계산하면 2026년 {int(all[0].rule4)}원, 2030년에도 {int(l.rule4)}원. 시장 가격의 {pct(l.shareOfMarket)}% 수준입니다. 줄이는 것보다 사는 편이, 사는 것보다 받는 편이 여전히 쉬운 구조입니다.
          </p>
        </Reveal>
        <Reveal className="card-s" delay={0.1}>
          <CardTitle title="배출 1톤당 실제 부담 (원)" sub="전체 단위 · 지금 가격 시나리오 · 3차 규칙을 그대로 둘 때와 비교" />
          <EffPriceLines rows={all} />
        </Reveal>
      </div>
      <div className="insights">
        <Insight n={1} value={pct(l.shareOfMarket, 1)} unit="%" text={`2030년 실제 부담이 시장 가격(${priceShort(price)})에서 차지하는 비율`} />
        <Insight n={2} value={int(pw[pw.length - 1].rule4)} unit="원" text={`발전 부문 2030년 1톤당 실제 부담 (시장가의 ${pct(pw[pw.length - 1].shareOfMarket)}%)`} />
        <Insight n={3} value={int(np[np.length - 1].rule4)} unit="원" text={`발전 외 부문 2030년 1톤당 실제 부담 (시장가의 ${pct(np[np.length - 1].shareOfMarket, 1)}%)`} />
      </div>
      <p className="caption">출처 · H7 실효가격표(권준영, 2026.11.17)</p>
    </section>
  )
}

function Chapter3({ a }: { a: ArticleData }) {
  const power = a.sectors.find((s) => s.sector === '발전')!
  const steel = a.sectors.find((s) => s.sector === '철강')!
  const turnsPower = a.turnsLoss.bySector2030.now['발전'] ?? 0
  return (
    <section id="ch-3" className="section chapter chapter--dark">
      <div className="chapter__grid">
        <Reveal className="chapter__text">
          <p className="eyebrow">03 청구서의 주소</p>
          <h2 className="h1">청구서는<br />발전소로 간다</h2>
          <p className="body">
            4차 계획의 가장 큰 변화는 발전 부문입니다. 돈을 내고 사야 하는 몫이 2026년 {pct(a.powerPaidRatio['2026'])}%에서 2030년 {pct(a.powerPaidRatio['2030'])}%까지 오릅니다. 그 결과 5년 탄소비용의 {pct(power.costShare.now)}%가 발전 부문에 몰립니다. 반면 배출의 {pct(steel.emisShare)}%를 차지하는 철강은 탄소누출 우려 업종으로 분류돼 무상할당을 그대로 받고, 비용 몫은 {pct(steel.costShare.now, 1)}%에 그칩니다. 발전소가 받은 청구서는 그곳에서 끝나지 않습니다. 전기요금에 반영되면 가계와 기업이, 요금이 묶이면 한전의 부채로 결국 우리 모두가 나눠 냅니다.
          </p>
        </Reveal>
        <Reveal className="card-s card-s--dark" delay={0.1}>
          <h3 className="h3">5년 탄소비용 (지금 가격 시나리오, 조 원)</h3>
          <SectorCostBars sectors={a.sectors} />
        </Reveal>
      </div>
      <div className="insights">
        <Insight n={1} value={trillion(a.concentration.gencos5Cost5y, 1)} unit="조 원" text="발전 공기업 5곳의 5년 탄소비용 합계" />
        <Insight n={2} value={`${turnsPower} / ${a.turnsLoss.byYear.now[4]}`} unit="곳" text="2030년 적자로 돌아서는 단위 중 발전 (지금 가격)" />
        <Insight n={3} value={`${pct(steel.emisShare, 1)} → ${pct(steel.costShare.now, 1)}`} unit="%" text="철강의 배출 비중 → 비용 비중" />
      </div>
      <p className="caption">출처 · 계산엔진 요약_업종연도시나리오, H7 적자전환표</p>
    </section>
  )
}

function Chapter4({ a }: { a: ArticleData }) {
  const t = a.turnsLoss.byYear
  const g = a.grades2030.now
  const top = a.concentration.top10[0]
  const grades: [string, number, string][] = [
    ['고위험 (이미 적자)', g.loss, 'var(--color-status-danger)'],
    ['고위험 (30% 이상)', g.high, 'var(--color-data-short)'],
    ['중위험 (10~30%)', g.mid, 'var(--color-bg-accent)'],
    ['저위험', g.low, 'var(--color-data-positive)'],
    ['비용 없음', g.none, 'var(--color-data-surplus)'],
    ['재무 없음', g.nofin, 'var(--color-data-neutral)'],
  ]
  const total = grades.reduce((s, x) => s + x[1], 0)
  return (
    <section id="ch-4" className="section chapter">
      <Reveal className="chapter__text chapter__text--wide">
        <p className="eyebrow">04 가장 무거운 청구서</p>
        <h2 className="h1">가장 무거운 청구서</h2>
        <p className="body secondary">
          배출권 가격이 2030년 {priceShort(a.glance.price2030.now)}에 머물러도 적자로 돌아서는 할당 단위가 {t.now[4]}곳 나옵니다. 탄소중립 전환에 필요한 수준으로 가정한 {priceShort(a.glance.price2030.max)}까지 오르면 {t.max[4]}곳으로 늘어납니다. 가장 무거운 청구서는 발전 공기업 다섯 곳에 갑니다. {top.risk2030 != null && <>{top.name}은 2030년 한 해 탄소비용이 영업이익의 {top.risk2030.toFixed(1)}배에 이릅니다.</>}
        </p>
      </Reveal>
      <div className="chapter__grid chapter__grid--table">
        <Reveal className="card-s">
          <CardTitle title="5년 탄소비용 TOP 10" sub="지금 가격 시나리오 · 위험도 = 2030년 탄소비용 ÷ 영업이익(3년 평균)" />
          <Top10 a={a} />
        </Reveal>
        <Reveal className="card-s" delay={0.1}>
          <CardTitle title="2030년 위험 등급" sub={`${int(total)}단위 · 지금 가격 시나리오`} />
          <ul className="grade-bars">
            {grades.map(([label, n, color]) => (
              <li key={label}>
                <span>{label}</span>
                <span className="grade-bars__track"><i style={{ width: `${(n / total) * 100}%`, background: color }} /></span>
                <strong>{int(n)}곳</strong>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <p className="caption">출처 · 계산엔진 결과표·지표_참고(2026.11.18). 등급 기준: 고위험 30%, 중위험 10% (가정표)</p>
    </section>
  )
}

/** TOP 10 표 — 행을 누르면 기업 조회로. 위험도는 2030 값(결정 기록 D6) */
function Top10({ a }: { a: ArticleData }) {
  return (
    <table className="top10">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">단위</th>
          <th scope="col">업종</th>
          <th scope="col" className="num">5년 비용</th>
          <th scope="col" className="num">위험도</th>
        </tr>
      </thead>
      <tbody>
        {a.concentration.top10.map((t, i) => (
          <tr key={t.id}>
            <td>{i + 1}</td>
            <td>
              <Link to={`/company/${encodeURIComponent(t.id)}`}>{t.name}</Link>
            </td>
            <td>{t.sector}</td>
            <td className="num">{wonShort(t.cost5y)}</td>
            <td className="num">{t.noFinance ? '재무 없음' : t.risk2030 != null ? `${pct(t.risk2030)}%` : '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Roles() {
  const roles: [string, string, string, string, string][] = [
    ['01', '확인하기', '우리 회사, 우리 동네 발전소가 받을 청구서를 기업 탭에서 찾아보세요.', '/company', '기업 탭 →'],
    ['02', '직접 정해 보기', '장관이 되어 규칙을 바꾸고, 청구서가 어디로 옮겨 가는지 실험실에서 확인하세요.', '/lab', '실험실 →'],
    ['03', '목소리 내기', '다음 할당계획 공청회와 전기요금 논의에서 이 숫자를 근거로 의견을 남겨 주세요.', '', ''],
  ]
  return (
    <section id="ch-5" className="section roles">
      <Reveal className="chapter__text chapter__text--wide">
        <p className="eyebrow">05 그래서, 우리는</p>
        <h2 className="h1">청구서의 주소는 아직 바뀔 수 있다</h2>
        <p className="body secondary">
          지금의 규칙은 정해진 답이 아닙니다. 어느 업종에 무상할당을 얼마나 줄지, 유상할당으로 걷은 돈을 어디에 쓸지, 발전 비용을 요금에 얼마나 반영할지는 모두 사람이 정합니다. 4차 계획도 공청회와 의견 수렴을 거쳐 확정됐고, 다음 계획도 같은 과정을 밟습니다. 청구서가 어디로 가는지 아는 사람이 많아질수록, 규칙은 더 공정해질 수 있습니다.
        </p>
      </Reveal>
      <h3 className="h3">여러분이 할 수 있는 일</h3>
      <div className="insights">
        {roles.map(([n, title, text, to, cta], i) => (
          <Reveal key={n} className="role-card" delay={i * 0.1}>
            <p className="role-card__n">{n}</p>
            <p className="h3">{title}</p>
            <p className="body-s secondary">{text}</p>
            {to && (
              <Link className="role-card__link" to={to}>
                {cta}
              </Link>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Shortcuts({ total }: { total: number }) {
  return (
    <section className="section">
      <h2 className="h2">청구서를 직접 열어 보세요</h2>
      <div className="shortcuts">
        <Reveal className="shortcut">
          <p className="h3">우리 회사·업종 찾아보기</p>
          <p className="caption">{int(total)}개 할당 단위의 4차 부족분, 탄소비용, 위험 등급</p>
          <ButtonLink variant="secondary" to="/company">기업 탭 →</ButtonLink>
        </Reveal>
        <Reveal className="shortcut shortcut--lab" delay={0.1}>
          <div className="shortcut__text">
            <p className="h2">당신이 장관이라면?</p>
            <p className="body-s">가격, 유상 비율, 무상할당 범위를 바꾸면 도시와 청구서가 바로 바뀝니다.</p>
            <ButtonLink to="/lab">실험실 가기 →</ButtonLink>
          </div>
          <div className="shortcut__img" role="img" aria-label="실험실 픽셀 장면 미리보기" />
        </Reveal>
      </div>
    </section>
  )
}

function Kpi({ label, value, unit, note }: { label: string; value: string; unit: string; note: string }) {
  return (
    <Reveal className="kpi-card">
      <p className="kpi-card__label">{label}</p>
      <p className="kpi-card__value">
        <span className="kpi-card__number">{value}</span>
        <span className="kpi-card__unit">{unit}</span>
      </p>
      <p className="kpi-card__note">{note}</p>
    </Reveal>
  )
}

function CardTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="card-title">
      <h3 className="h3">{title}</h3>
      <p className="caption">{sub}</p>
    </div>
  )
}

function Insight({ n, value, unit, text }: { n: number; value: string; unit: string; text: string }) {
  return (
    <Reveal className="insight" delay={(n - 1) * 0.1}>
      <p className="insight__n">INSIGHT {n}</p>
      <p className="kpi-card__value">
        <span className="kpi-card__number">{value}</span>
        <span className="kpi-card__unit">{unit}</span>
      </p>
      <p className="body-s secondary">{text}</p>
    </Reveal>
  )
}
