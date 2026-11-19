import { KpiCard } from '../../components/KpiCard'
import { useAsync } from '../../hooks/useAsync'
import { loadArticle } from '../../lib/data'
import { int } from '../../lib/format'

/** 02 오른쪽 — 안내 + 2030 위험 등급 KPI 4 (지금 가격). 숫자만, 클릭 동작 없음 */
export function CompanyIntro({ total }: { total: number }) {
  const { data } = useAsync(loadArticle, [])
  const g = data?.grades2030.now
  return (
    <div className="company-main">
      <section className="intro-banner">
        <p className="eyebrow">기업별 청구서</p>
        <h1 className="h1">우리 회사의 청구서를 찾아보세요</h1>
        <p className="body-l secondary">
          4차 배출권을 할당받은 {total}개 단위의 2026~2030년 탄소비용과 이익 대비 부담을 볼 수 있어요. 왼쪽 검색창에 이름을 입력하거나 순위에서 바로 골라 보세요. 목록에 있는 단위만 검색돼요.
        </p>
      </section>
      <h2 className="h3">{total}곳은 지금 어디쯤 있나 · 2030년 위험 등급, 지금 가격 시나리오</h2>
      {g && (
        <div className="kpi-row">
          <KpiCard label="고위험" value={int(g.loss + g.high)} unit="곳" note={`적자 ${g.loss} · 30% 이상 ${g.high}`} />
          <KpiCard label="중위험" value={int(g.mid)} unit="곳" note="이익의 10~30%" />
          <KpiCard label="저위험" value={int(g.low)} unit="곳" note="이익의 10% 미만" />
          <KpiCard label="비용·재무 없음" value={int(g.none + g.nofin)} unit="곳" note={`남는 배출권 ${g.none} · 재무 없음 ${g.nofin}`} />
        </div>
      )}
      <p className="caption">
        등급 기준 · 위험도 = 2030년 탄소비용 ÷ 영업이익(3년 평균), 고위험 30%·중위험 10% (가정표). 출처 · 팀 계산엔진 결과표(2026.11.18)
      </p>
    </div>
  )
}
