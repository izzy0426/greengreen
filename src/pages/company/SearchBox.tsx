import { useEffect, useId, useRef, useState } from 'react'
import { searchUnits } from '../../lib/search'
import { wonShort } from '../../lib/format'
import type { UnitSummary } from '../../lib/types'

/** 03 검색 자동완성 — 목록에 있는 단위만 고를 수 있고, 후보가 없으면 결과로 넘어가지 않음 */
export function SearchBox({ units, onSelect }: { units: UnitSummary[]; onSelect: (u: UnitSummary) => void }) {
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const boxRef = useRef<HTMLDivElement>(null)

  // 입력 후 100ms 뒤 갱신 (명세서 6장)
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(text)
      setActive(0)
    }, 100)
    return () => clearTimeout(t)
  }, [text])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const hits = searchUnits(units, query)
  const showList = open && query.trim().length > 0

  const choose = (u: UnitSummary) => {
    onSelect(u)
    setText('')
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="search" ref={boxRef}>
      <label className="search__field">
        <span aria-hidden="true">⌕</span>
        <span className="visually-hidden">할당 단위 이름으로 찾기</span>
        <input
          type="search"
          value={text}
          placeholder={`${units.length}곳 중에서 찾기`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && hits[active] ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setActive((a) => Math.min(a + 1, Math.max(hits.length - 1, 0)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              // 입력 직후 100ms 안에 Enter를 눌러도 지금 글자로 찾음
              const now = text === query ? hits : searchUnits(units, text)
              if (now.length) choose(now[Math.min(active, now.length - 1)])
            } else if (e.key === 'Escape') {
              // type=search의 기본 동작(글자 지우기 → 다시 열림)을 막고 목록만 닫음
              e.preventDefault()
              setOpen(false)
            }
          }}
        />
      </label>
      {showList && (
        <div className="search__panel">
          {hits.length > 0 ? (
            <>
              <ul id={listId} role="listbox" aria-label="검색 결과">
                {hits.map((u, i) => (
                  <li
                    key={u.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={i === active ? 'is-active' : ''}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      choose(u)
                    }}
                  >
                    <span className="search__name">{u.displayName}</span>
                    <span className="search__sector">{u.sector}</span>
                    <span className="search__cost">{i === 0 ? '5년 ' : ''}{wonShort(u.cost5y.now)}</span>
                  </li>
                ))}
              </ul>
              <p className="search__hint">↑↓로 고르고 Enter · 목록에 없는 이름은 검색되지 않아요</p>
            </>
          ) : (
            <div className="search__empty" role="status">
              <p>일치하는 할당 단위가 없어요</p>
              <p>4차 할당을 받은 {units.length}곳만 찾을 수 있어요. 결과는 열리지 않아요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
