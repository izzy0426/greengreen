import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

/** 화면에 30% 들어오면 한 번만 나타남 (0.8초, 명세서 6장). reduced motion이면 바로 보임 */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

/** 숫자 카운트업. 값 문자열은 밖에서 포맷 — 여기선 비율(0→1)만 움직임 */
export function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduce = useReducedMotion()
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(0, value, { duration: 0.8, ease: [0.22, 1, 0.36, 1], onUpdate: setV })
    return () => c.stop()
  }, [inView, reduce, value])
  return (
    <span ref={ref}>
      <span className="visually-hidden">{format(value)}</span>
      <span aria-hidden="true">{format(reduce ? value : v)}</span>
    </span>
  )
}
