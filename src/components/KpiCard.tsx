import type { ReactNode } from 'react'
import './components.css'

/** KPI Card — 핵심 숫자. 증감은 화살표와 글자로 함께 표시(색만으로 구분하지 않음) */
export function KpiCard({
  label,
  value,
  unit,
  note,
  badge,
}: {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  /** 아래 보조 문구 (증감·기준) */
  note?: ReactNode
  badge?: ReactNode
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">
        {label}
        {badge}
      </p>
      <p className="kpi-card__value">
        <span className="kpi-card__number">{value}</span>
        {unit && <span className="kpi-card__unit">{unit}</span>}
      </p>
      {note && <p className="kpi-card__note">{note}</p>}
    </div>
  )
}
