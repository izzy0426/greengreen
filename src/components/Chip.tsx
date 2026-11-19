import './components.css'

export interface ChipOption<T extends string> {
  value: T
  label: string
}

/** Chip 묶음 — 필터·시나리오 선택. 하나만 고르는 라디오 그룹. 한 줄에 넘치면 줄바꿈 */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (v: T) => void
  /** 스크린리더용 묶음 이름 */
  label: string
}) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value)
    const next = options[(i + dir + options.length) % options.length]
    onChange(next.value)
    requestAnimationFrame(() => document.getElementById(chipId(label, next.value))?.focus())
  }
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            id={chipId(label, o.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`chip${selected ? ' is-selected' : ''}`}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                move(1)
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                move(-1)
              }
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const chipId = (group: string, v: string) => `chip-${group.replace(/\s+/g, '-')}-${v}`
