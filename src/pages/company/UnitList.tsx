import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChipGroup } from '../../components/Chip'
import { wonShort } from '../../lib/format'
import { sectorColor } from '../../lib/sectors'
import type { PriceKey, UnitSummary } from '../../lib/types'
import { SearchBox } from './SearchBox'

/** 02 왼쪽 순위 목록 — 5년 탄소비용 큰 순(지금 가격). 업종 칩은 목록만 바꿈 */
export function UnitList({
  units,
  selectedId,
  price,
  onSelect,
}: {
  units: UnitSummary[]
  selectedId?: string
  price: PriceKey
  onSelect: (u: UnitSummary) => void
}) {
  const [sector, setSector] = useState('all')
  // 칩: 전체 + 5년 비용(지금 가격) 큰 업종 5 (명세서 6장)
  const topSectors = useMemo(() => {
    const sum = new Map<string, number>()
    for (const u of units) sum.set(u.sector, (sum.get(u.sector) ?? 0) + u.cost5y.now)
    return [...sum.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s]) => s)
  }, [units])
  const list = sector === 'all' ? units : units.filter((u) => u.sector === sector)
  const q = price === 'now' ? '' : `?price=${price}`

  return (
    <aside className="unit-list" aria-label="할당 단위 목록">
      <div>
        <h2 className="unit-list__title">할당 단위 {units.length}곳</h2>
        <p className="caption">5년 탄소비용 큰 순 · 지금 가격 시나리오</p>
      </div>
      <SearchBox units={units} onSelect={onSelect} />
      <ChipGroup
        label="업종 필터"
        value={sector}
        onChange={setSector}
        options={[{ value: 'all', label: '전체' }, ...topSectors.map((s) => ({ value: s, label: s }))]}
      />
      <ol className="unit-list__rows">
        {list.map((u) => (
          <li key={u.id}>
            <Link
              to={`/company/${encodeURIComponent(u.id)}${q}`}
              className={`unit-row${u.id === selectedId ? ' is-selected' : ''}`}
              aria-current={u.id === selectedId ? 'page' : undefined}
            >
              <span className="unit-row__rank">{u.rank5y ?? '–'}</span>
              <span className="unit-row__dot" style={{ background: sectorColor(u.sector) }} aria-hidden="true" />
              <span className="unit-row__name">
                <span>{u.displayName}</span>
                <span className="caption">{u.sector}</span>
              </span>
              <span className="unit-row__cost">{wonShort(u.cost5y.now)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  )
}
