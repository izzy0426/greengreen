import { MotionConfig } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/Header'

// 화면별로 나눠 불러옴 (명세서 9장: 첫 화면 JS gzip 200KB 이하)
const ArticlePage = lazy(() => import('./pages/article/ArticlePage'))
const CompanyPage = lazy(() => import('./pages/company/CompanyPage'))
const LabPage = lazy(() => import('./pages/lab/LabPage'))
const LabResultPage = lazy(() => import('./pages/lab-result/LabResultPage'))
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage'))

/** 라우팅 — 개발 명세서 3장 */
export default function App() {
  const { pathname } = useLocation()
  // 화면을 옮기면 맨 위로 (같은 화면 안에서 쿼리만 바뀔 때는 그대로)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="skip-link">본문 바로가기</a>
      <Header />
      <div id="main" tabIndex={-1}>
        <Suspense fallback={<div className="page" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<ArticlePage />} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/company/:unitId" element={<CompanyPage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/lab/result" element={<LabResultPage />} />
            <Route path="/_ds" element={<DesignSystemPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </MotionConfig>
  )
}
