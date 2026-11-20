import { useEffect, useRef, useState } from 'react'

const ITEMS = [
  { id: 'glance', label: '한눈에 보기' },
  { id: 'ch-1', label: '남는 배출권', n: '01' },
  { id: 'ch-2', label: '여전히 싼 탄소', n: '02' },
  { id: 'ch-3', label: '청구서의 주소', n: '03' },
  { id: 'ch-4', label: '가장 무거운 청구서', n: '04' },
  { id: 'ch-5', label: '그래서, 우리는', n: '05' },
]

/** 상단 고정 높이 (헤더 64 + 목차 58) */
const offset = () => {
  const cs = getComputedStyle(document.documentElement)
  return (parseFloat(cs.getPropertyValue('--header-h')) || 64) + (parseFloat(cs.getPropertyValue('--chapnav-h')) || 58)
}
const smooth = (): ScrollBehavior => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')

/** 아티클 목차 바 — 헤더 아래 58px, 지금 챕터 강조, 읽은 비율 진행 막대 (최종 / Chapter Nav) */
export function ChapterNav() {
  const [active, setActive] = useState(ITEMS[0].id)
  const [progress, setProgress] = useState(0)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const line = offset() + 24
        let cur = ITEMS[0].id
        for (const it of ITEMS) {
          const el = document.getElementById(it.id)
          if (el && el.getBoundingClientRect().top <= line) cur = it.id
        }
        setActive(cur)
        const max = document.documentElement.scrollHeight - innerHeight
        setProgress(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0)
      })
    }
    on()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', on)
      removeEventListener('resize', on)
    }
  }, [])

  // 모바일 가로 스크롤: 지금 챕터를 화면 안으로
  useEffect(() => {
    const list = listRef.current
    const a = list?.querySelector<HTMLElement>(`[data-id="${active}"]`)
    if (!list || !a || list.scrollWidth <= list.clientWidth) return
    const l = a.offsetLeft - list.offsetLeft
    if (l < list.scrollLeft || l + a.offsetWidth > list.scrollLeft + list.clientWidth)
      list.scrollTo({ left: l - 16, behavior: smooth() })
  }, [active])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - offset() + 1, behavior: smooth() })
    history.replaceState(null, '', `#${id}`)
    setActive(id)
  }

  return (
    <nav className="chapnav" aria-label="아티클 목차">
      <div className="chapnav__inner">
        <span className="chapnav__k" aria-hidden="true">목차</span>
        <ol ref={listRef} className="chapnav__list">
          {ITEMS.map((it) => (
            <li key={it.id}>
              <a href={`#${it.id}`} data-id={it.id} onClick={go(it.id)} aria-current={active === it.id ? 'location' : undefined} className={active === it.id ? 'is-on' : undefined}>
                {it.n && <span className="chapnav__n">{it.n}</span>}
                {it.label}
              </a>
            </li>
          ))}
        </ol>
        <button type="button" className="chapnav__top" onClick={() => scrollTo({ top: 0, behavior: smooth() })}>
          맨 위로 <span aria-hidden="true">↑</span>
        </button>
      </div>
      <div className="chapnav__bar" aria-hidden="true">
        <i style={{ transform: `scaleX(${progress})` }} />
      </div>
    </nav>
  )
}
