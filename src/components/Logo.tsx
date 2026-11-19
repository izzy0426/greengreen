import symbol from '../assets/logo-symbol.svg'
import './components.css'

/** Logo / Symbol — 영수증(청구서) + 새싹. 최소 24px */
export function LogoSymbol({ size = 40 }: { size?: number }) {
  return <img src={symbol} width={size} height={size} alt="" className="logo-symbol" />
}

/** Logo / Wordmark — 헤더용 가로 로고 */
export function LogoWordmark() {
  return (
    <span className="logo-wordmark">
      <LogoSymbol size={34} />
      <span className="logo-wordmark__text">탄소청구서</span>
    </span>
  )
}
