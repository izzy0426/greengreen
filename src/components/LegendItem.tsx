import short from '../assets/legend-short.svg'
import surplus from '../assets/legend-surplus.svg'
import './components.css'

type LegendType = 'short' | 'surplus' | 'target'
const LABEL: Record<LegendType, string> = { short: '모자람', surplus: '남음', target: 'NDC 목표' }

/** Legend Item — 모자람=주황 채움, 남음=파랑 테두리, 목표=진한 선. 색과 모양을 함께 써서 구분 */
export function LegendItem({ type, label }: { type: LegendType; label?: string }) {
  return (
    <span className="legend-item">
      {type === 'target' ? (
        <span className="legend-item__line" aria-hidden="true" />
      ) : (
        <img src={type === 'short' ? short : surplus} width={14} height={14} alt="" />
      )}
      {label ?? LABEL[type]}
    </span>
  )
}
