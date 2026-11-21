import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import './components.css'

/** 푸터 — 최종 / Footer (두 페이지 공통) */
export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  return (
    <footer className="footer" ref={ref}>
      <div className="footer__inner">
        <div>
          <p className="footer__logo">배출권 길라잡이</p>
          <p className="footer__desc">한국 배출권거래제 데이터 안내. 4차(2026–2030) 수치는 시나리오 분석 결과.</p>
        </div>
        <div>
          <h2 className="footer__h">자료</h2>
          <ul>
            <li>온실가스종합정보센터 배출량·할당·인증 실적</li>
            <li>제1~4차 배출권 할당계획</li>
            <li>KRX 배출권 시세 · DART 공시</li>
          </ul>
        </div>
        <div>
          <h2 className="footer__h">바로가기</h2>
          <ul>
            <li><Link to="/">아티클</Link></li>
            <li><Link to="/company">기업별 배출 조회</Link></li>
            <li><Link to="/lab" reloadDocument>실험실</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
})
