import { useEffect } from 'react'

/**
 * 실험실은 팀원 페이지를 그대로 쓰는 정적 페이지(public/lab-sim/)다.
 * 배포(Vercel)에서는 /lab 주소를 정적 페이지로 바로 연결하고(vercel.json),
 * 사이트 안에서 눌러 들어온 경우만 여기서 전체 새로고침으로 넘긴다.
 * 서버가 /lab을 앱으로 돌려준 경우(로컬 미리보기)는 /lab-sim/ 으로 간다.
 */
export default function LabRedirect() {
  useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const landedHere = nav && new URL(nav.name).pathname.startsWith('/lab')
    window.location.replace(landedHere ? '/lab-sim/' : '/lab')
  }, [])
  return <main style={{ minHeight: '60vh' }} aria-busy="true" />
}
