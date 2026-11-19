import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** 헤더 오른쪽 버튼 자리에 내용을 넣음 */
export function HeaderActions({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  useEffect(() => setEl(document.getElementById('header-actions')), [])
  return el ? createPortal(children, el) : null
}
