import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Footer } from '../../components/Footer'
import { useAsync } from '../../hooks/useAsync'
import { Bars, Fit, HBars } from './charts'
import { buyGroup, filterSort, fmt, loadCompanies, man, suggest, type Company, type CompanyStore, type SortKey } from './companyData'
import { Profile } from './Profile'
import './company.css'

const LIST_MAX = 80

/** 02 기업 — 팀원 원본 페이지(배출권 길라잡이 수정안)의 기업 화면. /company, /company/:unitId */
export default function CompanyPage() {
  const { data: store, error } = useAsync(loadCompanies, [])
  useEffect(() => {
    document.title = '기업별 배출 조회 · 배출권 길라잡이'
  }, [])
  return (
    <main className="co">
      <div className="co-banner">
        <svg className="co-banner__deco" viewBox="0 0 520 150" aria-hidden="true">
          <g fill="var(--soft)">
            <rect x="0" y="96" width="270" height="54" />
            <rect x="54" y="52" width="48" height="98" />
            <rect x="68" y="28" width="34" height="30" />
            <rect x="126" y="76" width="58" height="74" />
            <rect x="218" y="0" width="20" height="150" />
            <rect x="206" y="0" width="44" height="10" />
          </g>
        </svg>
        <div className="co-wrap">
          <p className="crumb">홈 › 기업</p>
          <h1>기업별 배출 조회</h1>
          <p className="co-banner__lead">배출량 · 할당량 · 이월 · 재무 · 4차 시나리오별 비용</p>
          <p className="fn">※ 분할·합병 기업은 하나의 통합 단위로 표시</p>
        </div>
      </div>
      <div className="co-wrap">
        {error ? (
          <p className="co-error">자료를 불러오지 못했습니다. 새로고침이 필요합니다.</p>
        ) : !store ? (
          <div className="co-loading" aria-busy="true">불러오는 중</div>
        ) : (
          <CompanyBody store={store} />
        )}
      </div>
      <Footer />
    </main>
  )
}

function CompanyBody({ store }: { store: CompanyStore }) {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [sec, setSec] = useState('')
  const [sort, setSort] = useState<SortKey>('e')
  const finderRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  // 기본 선택 = 2025 배출 1위 (ranked[0])
  const cur: Company = (unitId && store.byId.get(unitId)) || store.ranked[0]
  const select = (u: Company, scroll = true) => {
    navigate(`/company/${encodeURIComponent(u.id)}`, { replace: true, preventScrollReset: true })
    if (scroll) {
      requestAnimationFrame(() => {
        const r = detailRef.current?.getBoundingClientRect()
        if (r && (r.top < 70 || r.top > innerHeight * 0.6)) scrollTo({ top: r.top + scrollY - 84, behavior: 'smooth' })
      })
    }
  }

  const list = useMemo(() => filterSort(store.all, q, sec, sort), [store, q, sec, sort])
  const tot = store.total
  const topShare = (k: number) => (store.ranked.slice(0, k).reduce((s, u) => s + u._e, 0) / tot) * 100

  const groups = useMemo(() => {
    const g = { none: 0, buy: 0, na: 0 }
    store.ranked.forEach((u) => (g[buyGroup(u)] += u._e))
    return g
  }, [store])

  const pickSector = (s: string) => {
    setSec(s)
    setQ('')
    const first = filterSort(store.all, '', s, sort)[0]
    if (first) select(first, false)
    finderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const ss = store.sectorSum.slice(0, 14)
  return (
    <>
      <div className="co-top">
        <div><b className="num">{fmt(store.ranked.length)}<small>곳</small></b><span>2025년 할당 대상</span></div>
        <div><b className="num">{fmt(topShare(10), 1)}<small>%</small></b><span>상위 10곳 배출 비중</span></div>
        <div><b className="num">{fmt(topShare(50), 1)}<small>%</small></b><span>상위 50곳 배출 비중</span></div>
        <div><b className="num">{fmt(tot / 1e6, 1)}</b><span>2025년 배출 합계 (백만 t)</span></div>
      </div>

      <section className="cd" aria-labelledby="co-sec-h">
        <h2 id="co-sec-h">2025년 업종별 배출 (백만 t) · 막대 선택 시 해당 업종 필터</h2>
        <div className="scroll-x">
        <Fit min={720} fallback={1060}>{(w) => (
        <Bars
          label="2025년 업종별 배출 상위 14개 업종"
          W={w}
          H={250}
          cats={ss.map((x) => x[0])}
          values={ss.map((x) => +(x[1] / 1e6).toFixed(1))}
          colors={ss.map((_, i) => (i < 1 ? 'var(--green)' : i < 6 ? 'var(--green-2)' : 'var(--leaf)'))}
          yl="백만 t"
          xl="업종"
          bw={50}
          ld={1}
          left={40}
          max={200}
          onPick={pickSector}
          pickLabel={(c, v) => `${c} ${v}백만 t, 이 업종으로 목록 거르기`}
        />
        )}</Fit>
        </div>
        <p className="desc">2025년 인증 배출량의 업종별 합계. 막대를 누르면 해당 업종 기업만 아래 목록에 표시된다.</p>
      </section>

      <section className="cd" aria-labelledby="co-sig-h">
        <h2 id="co-sig-h">
          4차 배출권 구매 필요 여부별 2025년 배출 (%) <span className="scn">시나리오</span>
        </h2>
        <Fit fallback={1060}>{(w) => (
        <HBars
          label="4차 배출권 구매 필요 여부별 2025년 배출 비중"
          W={w}
          H={150}
          max={100}
          left={104}
          right={96}
          xl="2025년 배출 비중 (%)"
          items={[
            { k: '구매 필요 없음', v: (groups.none / tot) * 100, c: 'var(--amber)' },
            { k: '구매 필요', v: (groups.buy / tot) * 100, c: 'var(--green)' },
            { k: '분석 대상 아님', v: (groups.na / tot) * 100, c: 'var(--c-gray)' },
          ].map((it) => ({ ...it, t: fmt(it.v, 1) + '%' }))}
        />
        )}</Fit>
        <p className="desc">
          계산 엔진의 2026–2030년 예측으로 나눈 결과다. 구매가 필요 없는 기업은 배출권 가격이 올라도 구매 비용이 0원으로 계산된다. 기업을 선택하면 맨 위에 그 기업의 계산 결과가 표시된다.
        </p>
        <p className="src">할당 대상 2025년 배출 기준 · 분석 대상이 아닌 단위 제외</p>
      </section>

      <div className="cosearch" ref={finderRef} role="search">
        <SearchBox store={store} value={q} onChange={setQ} onPick={(u) => { setSec(''); select(u) }} onSubmit={() => list[0] && select(list[0])} />
        <label className="visually-hidden" htmlFor="co-sec">업종</label>
        <select id="co-sec" value={sec} onChange={(e) => setSec(e.target.value)}>
          <option value="">전체 업종</option>
          {store.sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="visually-hidden" htmlFor="co-sort">정렬</label>
        <select id="co-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="e">배출량 순</option>
          <option value="r">3차 할당 대비 배출 순</option>
          <option value="n">이름 순</option>
        </select>
      </div>

      <div className="co-layout">
        <div className="listbox">
          <p className="count" aria-live="polite">
            {list.length ? `${fmt(list.length)}곳${list.length > LIST_MAX ? ` · 상위 ${LIST_MAX}곳 표시` : ''}` : '검색 결과 없음'}
          </p>
          <ul className="results">
            {list.slice(0, LIST_MAX).map((u) => (
              <li key={u.id}>
                <button type="button" aria-current={u.id === cur.id ? 'true' : undefined} onClick={() => select(u)}>
                  <span className="rk">{u._rank || ''}</span>
                  <span className="rn">{u.n}</span>
                  <span className="rv2">{sort === 'r' && u._r ? Math.round(u._r.r * 100) + '%' : u._e >= 0 ? man(u._e) + '만 t' : '–'}</span>
                  <span className="rs">{u.s || '업종 미분류'}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="detail" ref={detailRef} aria-live="polite">
          <Profile u={cur} store={store} />
        </div>
      </div>
    </>
  )
}

/** 검색 — 기업명·통합 소속사명·초성, 자동완성 최대 8개, ↑↓ Enter Esc */
function SearchBox({ store, value, onChange, onPick, onSubmit }: { store: CompanyStore; value: string; onChange: (v: string) => void; onPick: (u: Company) => void; onSubmit: () => void }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [at, setAt] = useState(-1)
  const items = useMemo(() => (value.trim() ? suggest(store.all, value) : []), [store, value])
  const close = () => {
    setOpen(false)
    setAt(-1)
  }
  const pick = (u: Company) => {
    onChange(u.n)
    close()
    onPick(u)
  }
  return (
    <div className="sbox">
      <label htmlFor={`${id}-q`} className="visually-hidden">기업명</label>
      <input
        id={`${id}-q`}
        type="search"
        placeholder="기업명 또는 초성 (예: 포스코, ㄴㄷ)"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && value.trim() !== ''}
        aria-controls={`${id}-acl`}
        aria-autocomplete="list"
        aria-activedescendant={at >= 0 ? `${id}-o${at}` : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setAt(-1)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            close()
            return
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            if (open && at >= 0 && items[at]) pick(items[at])
            else {
              close()
              onSubmit()
            }
            return
          }
          if (!open || !items.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setAt((a) => Math.min(items.length - 1, a + 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setAt((a) => Math.max(0, a - 1))
          }
        }}
        onBlur={() => setTimeout(close, 120)}
      />
      {open && value.trim() !== '' && (
        <ul className="acl" id={`${id}-acl`} role="listbox" aria-label="검색 추천">
          {items.length === 0 ? (
            <li className="none" role="option" aria-disabled="true" aria-selected="false">일치하는 기업 없음</li>
          ) : (
            items.map((u, i) => (
              <li
                key={u.id}
                id={`${id}-o${i}`}
                role="option"
                aria-selected={i === at}
                className={i === at ? 'on' : undefined}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(u)
                }}
              >
                <b>{u.n}</b>
                <small>{u.s || '업종 미분류'}{u.m.length ? ` · 통합 ${u.m.length}개사` : ''}</small>
                <em>{u._e >= 0 ? man(u._e) + '만 t' : ''}</em>
              </li>
            ))
          )}
        </ul>
      )}
      <button type="button" onClick={() => { close(); onSubmit() }}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        조회
      </button>
    </div>
  )
}
