import symbol from '../assets/logo-symbol.svg'
import './components.css'

/** 로고 심볼 — 초록 원 + 잎 (최종 DS Header) */
export function LogoSymbol({ size = 30 }: { size?: number }) {
  return <img src={symbol} width={size} height={size} alt="" className="logo-symbol" />
}

/** 가로 로고 — 헤더·푸터 */
export function LogoWordmark({ size = 30 }: { size?: number }) {
  return (
    <span className="logo-wordmark">
      <LogoSymbol size={size} />
      <span className="logo-wordmark__text">배출권 길라잡이</span>
    </span>
  )
}
