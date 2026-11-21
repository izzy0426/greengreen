import { Link, NavLink } from 'react-router-dom'
import { LogoWordmark } from './Logo'
import './components.css'

const TABS = [
  { to: '/', label: '아티클', end: true },
  { to: '/company', label: '기업', end: false },
  { to: '/lab', label: '실험실', end: false },
]

/** 헤더 — 높이 64, 상단 고정, 탭은 가운데, 지금 탭은 3px 초록 밑줄 (최종 / Header) */
export function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__logo" aria-label="배출권 길라잡이 첫 화면">
          <LogoWordmark />
        </Link>
        <nav className="header__tabs" aria-label="주 메뉴">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} reloadDocument={t.to === '/lab'} className={({ isActive }) => `tab${isActive ? ' is-active' : ''}`}>
              {t.label}
            </NavLink>
          ))}
        </nav>
        {/* 화면별 오른쪽 버튼 자리 (실험실: 초기화 · 결과 보기) — HeaderActions로 채움 */}
        <div className="header__actions" id="header-actions" />
      </div>
    </header>
  )
}
