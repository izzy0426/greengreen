import { Link, NavLink } from 'react-router-dom'
import './TabBar.css'

const TABS = [
  { to: '/', label: '아티클', end: true },
  { to: '/company', label: '기업', end: false },
  { to: '/lab', label: '실험실', end: false },
]

/** 상단 탭바 — 높이 96, 탭은 화면 정중앙 */
export function TabBar() {
  return (
    <header className="tabbar">
      <Link to="/" className="tabbar__logo" aria-label="탄소청구서 홈">
        <span className="tabbar__symbol" aria-hidden="true" />
        <span className="tabbar__wordmark">탄소청구서</span>
      </Link>
      <nav className="tabbar__tabs" aria-label="주 메뉴">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => `tabbar__tab${isActive ? ' is-active' : ''}`}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
