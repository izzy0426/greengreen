import { Route, Routes, Navigate } from 'react-router-dom'
import { Header } from './components/Header'
import DesignSystemPage from './pages/DesignSystemPage'
import ArticlePage from './pages/article/ArticlePage'
import CompanyPage from './pages/company/CompanyPage'
import LabPage from './pages/lab/LabPage'
import LabResultPage from './pages/lab-result/LabResultPage'

/** 라우팅 — 개발 명세서 3장 */
export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<ArticlePage />} />
        <Route path="/company" element={<CompanyPage />} />
        <Route path="/company/:unitId" element={<CompanyPage />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="/lab/result" element={<LabResultPage />} />
        <Route path="/_ds" element={<DesignSystemPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
