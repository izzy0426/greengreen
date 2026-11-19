import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { DEFAULT_LEVERS, comboKey, isDefault, leverString, parseLevers, type LabData, type Levers } from './model'

let labCache: Promise<LabData> | null = null
export const loadLab = () => (labCache ??= fetch('/data/lab.json').then((r) => {
  if (!r.ok) throw new Error(`lab.json ${r.status}`)
  return r.json()
}))

/** 실험실 상태: 주소 ?lever= 와 같이 움직임 (명세서 2·3장). 재계산은 50ms 디바운스 (명세서 7장) */
export function useLab() {
  const [params, setParams] = useSearchParams()
  const levers = useMemo(() => parseLevers(params.get('lever')), [params])
  const { data, error } = useAsync(loadLab, [])

  const setLevers = useCallback(
    (next: Levers) => {
      const q = new URLSearchParams(params)
      if (isDefault(next)) q.delete('lever')
      else q.set('lever', leverString(next))
      setParams(q, { replace: true })
    },
    [params, setParams],
  )

  // 빠르게 여러 번 바꾸면 마지막 값만 반영
  const [settled, setSettled] = useState<Levers>(levers)
  useEffect(() => {
    const t = setTimeout(() => setSettled(levers), 50)
    return () => clearTimeout(t)
  }, [levers])

  const combo = data ? data.combos[comboKey(settled)] : null
  const base = data ? data.combos[comboKey(DEFAULT_LEVERS)] : null
  return { data, error, levers, settled, setLevers, combo, base }
}
