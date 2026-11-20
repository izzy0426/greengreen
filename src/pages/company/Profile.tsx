// 기업 프로필 — 원본 페이지 show() 를 그대로 옮김 (문장 규칙 포함)
import { HBars, Lines, niceMax } from './charts'
import { buy5, fmt, man, SCENARIO_PRICE, SCENARIOS, shortName, type Company, type CompanyStore } from './companyData'

function ScnBadge() {
  return <span className="scn">시나리오</span>
}

function Signal({ u }: { u: Company }) {
  const F = u.f
  if (!F) return null
  const c25 = u.h[2025] ? u.h[2025][2] : null
  const b5 = buy5(u)
  const c30 = F.c['현재 유지'][4]
  const hasO = F.O != null && F.x == null
  const O = F.O ?? 0
  let cls: string
  let ttl: string
  let txt: string
  if (b5 === 0) {
    cls = 'sig-a'
    ttl = '4차에 배출권을 살 필요가 없다'
    txt = `2026–2030년 예측 배출이 ${u.k === '탄소누출 우려' ? '전량 무상할당량' : '할당량'}과 3차 이월분${c25 != null ? ` ${man(c25)}만 t` : ''} 안에 들어온다. 배출권 가격이 1만 원이든 11.5만 원이든 배출권 구매 비용이 0원으로 계산된다.`
  } else if (hasO && O > 0 && O - c30 < 0) {
    cls = 'sig-c'
    ttl = '3만 원 시나리오에서 적자로 전환된다'
    txt = `4차 5년 동안 ${man(b5)}만 t을 사야 하는 것으로 계산된다. 2030년 가격이 3만 원이면 탄소 비용 ${fmt(c30)}억 원이 2023–2025년 평균 영업이익(${fmt(O)}억 원)보다 커진다.`
  } else if (hasO && O > 0) {
    cls = 'sig-b'
    ttl = '4차에 배출권을 사야 한다'
    txt = `4차 5년 동안 ${man(b5)}만 t을 사야 하는 것으로 계산된다. 2030년 가격이 3만 원이면 탄소 비용은 ${fmt(c30, c30 < 10 ? 1 : 0)}억 원으로 평균 영업이익의 ${fmt((c30 / O) * 100, c30 / O < 0.1 ? 1 : 0)}%다.`
  } else {
    cls = 'sig-d'
    ttl = '4차에 배출권을 사야 한다'
    txt = `4차 5년 동안 ${man(b5)}만 t을 사야 하는 것으로 계산된다. 2030년 가격이 3만 원이면 탄소 비용은 ${fmt(c30, c30 < 10 ? 1 : 0)}억 원이다.${hasO ? ' 2023–2025년 평균 영업이익이 이미 0 이하다.' : ' 재무 정보가 없어 이익과 비교하지 않았다.'}`
  }
  return (
    <div className={`signal ${cls}`}>
      <div className="signal__k">
        4차 배출권 구매 계산 결과 <ScnBadge />
      </div>
      <h3>{ttl}</h3>
      <p className="signal__d">{txt}</p>
      {u.k === '발전' && <p className="cap">발전사 비용은 전력시장을 통해 한전과 전기요금으로 일부 이어진다.</p>}
    </div>
  )
}

function RatioCard({ u, store }: { u: Company; store: CompanyStore }) {
  const R = u._r
  const med = store.ratioMed[u.s]
  if (!R || !med)
    return (
      <div className="pc">
        <h4>3차 할당량 대비 배출량</h4>
        <p className="cap">3차 5개년 자료 미비</p>
      </div>
    )
  const pos = Math.min(1, R.r / 1.6)
  const mp = Math.min(1, med.m / 1.6)
  return (
    <div className="pc">
      <h4>3차 5년간 받은 할당 대비 실제 배출 (2021–2025)</h4>
      <span className={`big2${R.r > 1 ? ' is-over' : ''}`}>
        {Math.round(R.r * 100)}
        <small>%</small>
      </span>
      <p className="cap">100%보다 크면 받은 할당보다 더 배출했다는 뜻 · 할당보다 더 배출한 해 {R.short}/5</p>
      <div className="meter" aria-hidden="true">
        <i style={{ width: `${(pos * 100).toFixed(1)}%` }} />
        <u style={{ left: `${(mp * 100).toFixed(1)}%` }} />
        <u className="meter__100" style={{ left: `${((1 / 1.6) * 100).toFixed(1)}%` }} />
      </div>
      <p className="cap">
        막대: 이 기업 · 검은 선: {u.s} 업종 중앙값 {Math.round(med.m * 100)}% ({med.n}곳) · 회색 선: 100%
      </p>
    </div>
  )
}

function FinCard({ u }: { u: Company }) {
  if (!u.fin)
    return (
      <div className="pc">
        <h4>재무</h4>
        <p className="cap">재무 정보 없음 (비상장·공공기관 등)</p>
      </div>
    )
  return (
    <div className="pc">
      <h4>재무 (2023–2025 평균, 별도)</h4>
      <div className="mini3">
        <div><b>{fmt(u.fin.S)}</b><span>매출 (억 원)</span></div>
        <div><b>{fmt(u.fin.O)}</b><span>영업이익 (억 원)</span></div>
        <div><b>{fmt(u.fin.r, 1)}%</b><span>영업이익률</span></div>
      </div>
      <p className="cap">통합 단위는 소속 기업 합계. 지주회사는 배당수익 포함 가능</p>
    </div>
  )
}

function FourCard({ u, store }: { u: Company; store: CompanyStore }) {
  const F = u.f
  const k = u.k ? store.meta.kind[u.k] : undefined
  const h7 = store.meta.h7[u.s]
  const gap = store.meta.gap[u.s]
  const c25 = u.h[2025] ? u.h[2025][2] : null
  const p30 = u.p[2030] ? u.p[2030][0] : null
  let eng
  if (F && buy5(u) === 0) {
    eng = (
      <>
        <div className="mini3">
          <div><b>{man(F.e[4])}</b><span>2030 예측 배출 (만 t)</span></div>
          <div><b>{p30 ? man(p30) : '–'}</b><span>2030 할당 (만 t)</span></div>
          <div><b>{c25 != null ? man(c25) : '–'}</b><span>3차에서 이월 (만 t)</span></div>
        </div>
        {F.O != null && F.x == null && <p className="cap">영업이익 2023–2025 평균 {fmt(F.O)}억 원 · 탄소 비용에 따른 이익 변화 없음</p>}
      </>
    )
  } else if (F) {
    const hasO = F.O != null && F.x == null
    const O = F.O ?? 0
    eng = (
      <>
        <div className="mini3">
          <div><b>{man(F.e[4])}</b><span>2030 예측 배출 (만 t)</span></div>
          <div><b>{p30 ? man(p30) : '–'}</b><span>2030 할당 (만 t)</span></div>
          <div><b>{man(buy5(u))}</b><span>5년 구매 필요량 (만 t)</span></div>
        </div>
        <div className="tbl-wrap">
          <table>
            <caption className="visually-hidden">2030년 가격 시나리오별 탄소 비용</caption>
            <thead>
              <tr>
                <th scope="col">2030 가격</th>
                <th scope="col" className="r">탄소 비용 (억 원)</th>
                {hasO && <th scope="col" className="r">영업이익 대비</th>}
                {hasO && <th scope="col">결과</th>}
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((kk, i) => {
                const c = F.c[kk][4]
                return (
                  <tr key={kk} className={i === 1 ? 'hi' : undefined}>
                    <td>{SCENARIO_PRICE[kk]}</td>
                    <td className="r">{fmt(c, c < 10 ? 1 : 0)}</td>
                    {hasO && O > 0 && (
                      <>
                        <td className="r">{fmt((c / O) * 100, c / O < 0.1 ? 1 : 0)}%</td>
                        <td className="nw">{O - c < 0 ? <b className="loss">적자</b> : '흑자'}</td>
                      </>
                    )}
                    {hasO && !(O > 0) && (
                      <>
                        <td className="r">–</td>
                        <td className="nw">기존 적자</td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="cap">
          {hasO ? `영업이익 2023–2025 평균 ${fmt(O)}억 원 고정` : `재무 지표 미산출 (${F.x || '재무 없음'})`}
          {u.k === '발전' ? ' · 발전사 비용은 전력시장을 통해 한전·요금으로 일부 이전' : ''}
        </p>
      </>
    )
  } else eng = <p className="cap">4차 시나리오 분석 대상 아님</p>
  return (
    <div className="pc">
      <h4>
        4차 (2026–2030) <ScnBadge />
      </h4>
      {k && (
        <p className="line1">
          <span className="chip-s">{k[0]}</span> {k[1]}
        </p>
      )}
      {eng}
      {h7 && (
        <p className="line1">
          업종 실효 탄소가격 / 시장가: <b className="num">{h7[0]}%</b> (2026) → <b className="num">{h7[1]}%</b> (2030)
        </p>
      )}
      {gap != null && (
        <p className="line1">
          업종 5년 배출 − 할당: <b className="num">{gap > 0 ? '+' : ''}{fmt(gap, 1)}백만 t</b>
        </p>
      )}
    </div>
  )
}

function Trend({ u }: { u: Company }) {
  const yrs: number[] = []
  for (let y = 2015; y <= 2030; y++) yrs.push(y)
  const h = (y: number) => u.h[y]
  const E = yrs.map((y) => (h(y) && h(y)[1] != null ? (h(y)[1] as number) / 1e4 : null))
  const A = yrs.map((y) => (h(y) && h(y)[0] > 0 ? h(y)[0] / 1e4 : null))
  const P = yrs.map((y) =>
    y === 2025 && h(2025) && h(2025)[0] > 0 && u.p[2026] ? h(2025)[0] / 1e4 : u.p[y] && u.p[y][0] > 0 ? u.p[y][0] / 1e4 : null,
  )
  const FE = yrs.map((y) => (y === 2025 && u.f && E[10] != null ? E[10] : u.f && y >= 2026 ? u.f.e[y - 2026] / 1e4 : null))
  const vmax = Math.max(...[...E, ...A, ...P, ...FE].filter((v): v is number => v != null), 0.1)
  return (
    <>
      <Lines
        label={`${u.n} 배출량과 할당량 추이, 2015–2030`}
        W={680}
        H={240}
        cats={yrs.map((y) => '’' + String(y).slice(2))}
        series={[
          { values: A, color: 'var(--c-orange)', width: 2.6 },
          { values: P, color: 'var(--c-orange)', dash: true },
          { values: E, color: 'var(--green)', dots: true, width: 2.8 },
          { values: FE, color: 'var(--green)', dash: true },
        ]}
        yl="만 t"
        xl="연도"
        max={niceMax(vmax * 1.1)}
        every={2}
        td={vmax < 10 ? 1 : 0}
      />
      <div className="legend">
        <span><i style={{ background: 'var(--green)' }} />배출량</span>
        <span><i style={{ background: 'var(--c-orange)' }} />할당량 (1–3차)</span>
        <span><i className="dash" style={{ color: 'var(--c-orange)' }} />4차 할당</span>
        <span><i className="dash" style={{ color: 'var(--green)' }} />예측 배출</span>
      </div>
      <p className="cap">만 t · 인증 배출량 우선 · 할당량은 추가·취소 반영 순할당</p>
    </>
  )
}

function Peers({ u, store }: { u: Company; store: CompanyStore }) {
  const peers = store.ranked.filter((x) => x.s === u.s).slice(0, 8)
  if (u._e >= 0 && !peers.includes(u)) {
    peers.pop()
    peers.push(u)
  }
  return (
    <div className="pc">
      <h4>{u.s || '업종'} 업종 내 위치</h4>
      {peers.length ? (
        <HBars
          label={`${u.s} 업종 2025년 배출량 상위 기업과 ${u.n} 비교`}
          W={480}
          H={300}
          items={peers.map((x) => ({ k: shortName(x.n).slice(0, 10), v: x._e / 1e4, t: man(x._e), c: x === u ? 'var(--green)' : 'var(--leaf)' }))}
          left={120}
          right={60}
          xl="2025 배출량 (만 t)"
        />
      ) : (
        <p className="cap">2025년 배출 자료 없음</p>
      )}
      <p className="desc">같은 업종에서 2025년 배출량이 많은 기업과 비교한 그래프. 진한 막대가 선택한 기업이다.</p>
    </div>
  )
}

export function Profile({ u, store }: { u: Company; store: CompanyStore }) {
  const c25 = u.h[2025] ? u.h[2025][2] : null
  const a25 = u.h[2025] && u.h[2025][0] > 0 ? u.h[2025][0] : null
  return (
    <div className="profile" key={u.id}>
      <Signal u={u} />
      <div className="ph">
        <div className="ph__chips">
          <span className="chip-s">{u.s || '업종 미분류'}</span>
          {u._rank && <span className="chip-s chip-s--gray">2025 배출 {fmt(u._rank)}위 / {fmt(store.ranked.length)}</span>}
        </div>
        <h2>{u.n}</h2>
        {u.m.length > 0 && <p className="members">통합: {u.m.join(', ')}</p>}
        <div className="kv">
          <div><b>{u._e >= 0 ? man(u._e) : '–'}<small>만 t</small></b><span>2025 배출량</span></div>
          <div><b>{a25 != null ? man(a25) : '–'}<small>만 t</small></b><span>2025 할당량</span></div>
          <div><b>{c25 != null ? man(c25) : '–'}<small>만 t</small></b><span>4차 이월분</span></div>
        </div>
        <Trend u={u} />
      </div>
      <div className="pgrid">
        <RatioCard u={u} store={store} />
        <FinCard u={u} />
      </div>
      <div className="pgrid">
        <FourCard u={u} store={store} />
        <Peers u={u} store={store} />
      </div>
    </div>
  )
}
