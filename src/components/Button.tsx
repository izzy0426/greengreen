import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './components.css'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Common {
  variant?: Variant
  children: ReactNode
  className?: string
}

/** Button — 알약형. Primary는 화면당 1개(주 행동), Secondary는 보조, Ghost는 텍스트 링크형 */
export function Button({ variant = 'primary', className = '', children, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`btn btn--${variant} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({ variant = 'primary', className = '', children, to }: Common & { to: string }) {
  return (
    <Link to={to} className={`btn btn--${variant} ${className}`}>
      {children}
    </Link>
  )
}
