import { useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

/** 화면에 30% 들어오면 한 번 그려지는지 알려 줌 — 차트 막대·선 애니메이션용. reduced motion이면 처음부터 그려진 상태 */
export function useDrawOnView<T extends Element>() {
  const ref = useRef<T>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const reduce = useReducedMotion()
  return { ref, drawn: inView || !!reduce }
}
