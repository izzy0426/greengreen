import { Link } from 'react-router-dom'
import './components.css'

/** Floating CTA — 아티클 오른쪽 아래 고정. 푸터와 겹치지 않게 bottom을 밖에서 조정할 수 있음 */
export function FloatingCta({ to = '/lab', label = '실험실에서 해보기', bottom }: { to?: string; label?: string; bottom?: number }) {
  return (
    <Link to={to} reloadDocument={to.startsWith('/lab')} className="floating-cta" style={bottom !== undefined ? { bottom } : undefined}>
      <span>{label}</span>
      <span className="floating-cta__arrow" aria-hidden="true">
        →
      </span>
    </Link>
  )
}
