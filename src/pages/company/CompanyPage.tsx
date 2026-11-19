import { useEffect } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { loadUnitDetail, loadUnits } from '../../lib/data'
import { PRICE_KEYS, type PriceKey, type UnitSummary } from '../../lib/types'
import { CompanyIntro } from './CompanyIntro'
import { UnitDetailView } from './UnitDetailView'
import { UnitList } from './UnitList'
import './company.css'

/** 02 · 03 · 04 기업 탭 — /company, /company/:unitId?price=now */
export default function CompanyPage() {
  const { unitId } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const p = params.get('price')
  const price: PriceKey = PRICE_KEYS.includes(p as PriceKey) ? (p as PriceKey) : 'now'
  const { data: units, error } = useAsync(loadUnits, [])

  const unit = unitId && units ? units.find((u) => u.id === unitId) : undefined
  const { data: detail } = useAsync(() => (unit ? loadUnitDetail(unit.key) : Promise.resolve(null)), [unit?.key])

  useEffect(() => {
    document.title = unit ? `${unit.displayName} · 탄소청구서` : '기업 · 탄소청구서'
  }, [unit])

  if (error) return <main className="page"><p>데이터를 불러오지 못했어요. 새로고침해 주세요.</p></main>
  if (!units) return <main className="page" aria-busy="true" />
  // 없는 ID면 02로 (404 화면 없음, 명세서 3장)
  if (unitId && !unit) return <Navigate to="/company" replace />

  const select = (u: UnitSummary) => navigate(`/company/${encodeURIComponent(u.id)}${price === 'now' ? '' : `?price=${price}`}`)
  const setPrice = (next: PriceKey) => {
    const q = new URLSearchParams(params)
    if (next === 'now') q.delete('price')
    else q.set('price', next)
    setParams(q, { replace: true })
  }

  return (
    <main className="company page-wide">
      <UnitList units={units} selectedId={unit?.id} price={price} onSelect={select} />
      {unit ? (
        detail && detail.id === unit.id ? (
          <UnitDetailView unit={detail} units={units} price={price} onPrice={setPrice} />
        ) : (
          <div className="company-main" aria-busy="true" />
        )
      ) : (
        <CompanyIntro total={units.length} />
      )}
    </main>
  )
}
