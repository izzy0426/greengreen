import type { ReactNode } from 'react'
import './components.css'

/** Hashtag — 섹션 주제 표시(#기온 #무상할당). 클릭 불가 */
export function Hashtag({ children }: { children: ReactNode }) {
  return <span className="hashtag">{children}</span>
}

/** 작은 꼬리표 — 업종·기관유형·부족/남음 */
export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'short' | 'surplus' | 'brand' | 'danger' }) {
  return <span className={`tag tag--${tone}`}>{children}</span>
}

/** '가정' 배지 — 값이 정해지지 않은 항목 (명세서 10장) */
export function AssumptionBadge({ title = '팀 결정 전 임시 값' }: { title?: string }) {
  return (
    <span className="tag tag--assume" title={title}>
      가정
    </span>
  )
}
