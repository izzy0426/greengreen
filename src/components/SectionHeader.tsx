import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './components.css'

/** Section Header — 제목 + (선택) 더보기 링크 */
export function SectionHeader({ title, moreTo, as: H = 'h2', children }: { title: ReactNode; moreTo?: string; as?: 'h2' | 'h3'; children?: ReactNode }) {
  return (
    <div className="section-header">
      <H className="section-header__title">{title}</H>
      {moreTo && (
        <Link to={moreTo} className="section-header__more">
          더보기 ›
        </Link>
      )}
      {children}
    </div>
  )
}
