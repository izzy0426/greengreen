import { forwardRef } from 'react'
import { LogoWordmark } from './Logo'
import './components.css'

/** 푸터 — 하이파이 01 '푸터' 문구 */
export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  return (
    <footer className="footer" ref={ref}>
      <div className="footer__inner">
        <LogoWordmark />
        <p>데이터 분석 학회 학술제 프로젝트 · 공공사회팀</p>
        <p className="footer__small">
          데이터: 온실가스 배출량 명세서(NGMS), 4차 국가 배출권 할당계획, KRX 배출권시장, DART · 계산: 팀 계산엔진(2026.11.18) · 가정: 상쇄·차입 미반영, 이월 N배 규칙
        </p>
        <p className="footer__small">© 2026 탄소청구서</p>
      </div>
    </footer>
  )
})
