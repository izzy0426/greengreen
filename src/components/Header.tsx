import { Link, NavLink } from 'react-router-dom'
import { LogoWordmark } from './Logo'
import './components.css'

const TABS = [
  { to: '/', label: '아티클', end: true },
  { to: '/company', label: '기업', end: false },
  { to: '/lab', label: '실험실', end: false },
]

/** 상단 탭바 — 높이 96, 탭은 화면 정중앙, 현재 탭은 밑줄 (Figma Tab 67:2074) */
export function Header() {
  return (
    <header className="header">
      <Link to="/" className="header__logo" aria-label="탄소청구서 첫 화면">
        <LogoWordmark />
      </Link>
      <nav className="header__tabs" aria-label="주 메뉴">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tab${isActive ? ' is-active' : ''}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      {/* 화면별 오른쪽 버튼 자리 (실험실: 초기화 · 결과 보기) — HeaderActions로 채움 */}
      <div className="header__actions" id="header-actions" />
    </header>
  )
}
