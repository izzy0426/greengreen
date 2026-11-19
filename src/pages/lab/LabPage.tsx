import { useEffect, useRef, useState } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import { HeaderActions } from '../../components/HeaderActions'
import { pct } from '../../lib/format'
import { LeverBar } from './LeverBar'
import { DEFAULT_LEVERS, LEVERS, comboKey, isKnownStep, isDefault, leverString, type Levers, type Step } from './model'
import { Stage } from './Stage'
import { useLab } from './useLab'
import './lab.css'

/** 05·06 실험실 — /lab?lever=211112211 */
export default function LabPage() {
  const { data, error, levers, setLevers, combo, base } = useLab()
  const [toast, setToast] = useState<string | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    document.title = '실험실 · 탄소청구서'
  }, [])

  const change = (i: number, step: Step) => {
    const next = [...levers] as Levers
    next[i] = step
    setLevers(next)
    if (data) {
      const before = data.combos[comboKey(levers)].meter
      const after = data.combos[comboKey(next)].meter
      const fmt = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${pct(Math.abs(x), 1)}%`
      // 연달아 바뀌면 마지막 것만 (명세서 7장)
      setToast(`${LEVERS[i].name} ${step}단계 · 총량 대비 ${fmt(before)} → ${fmt(after)}${isKnownStep(i, step) ? '' : ' · 값 미정(가정)'}`)
      clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(null), 3000)
    }
  }

  const q = isDefault(levers) ? '' : `?lever=${leverString(levers)}`
  return (
    <main className="lab">
      <HeaderActions>
        <Button variant="ghost" onClick={() => setLevers([...DEFAULT_LEVERS])} disabled={isDefault(levers)}>
          초기화
        </Button>
        <ButtonLink to={`/lab/result${q}`}>결과 보기 →</ButtonLink>
      </HeaderActions>
      {error && <p className="page">데이터를 불러오지 못했어요. 새로고침해 주세요.</p>}
      {data && combo && base ? (
        <>
          <Stage combo={combo} base={base} levers={levers} toast={toast} />
          {hover != null && (
            <div className="step-tip" role="tooltip">
              <p className="step-tip__title">{levers[hover]}단계 · {LEVERS[hover].name}</p>
              <p>{LEVERS[hover].explain}</p>
            </div>
          )}
          <LeverBar levers={levers} data={data} onChange={change} onHover={setHover} />
        </>
      ) : (
        <div className="stage" aria-busy="true" />
      )}
    </main>
  )
}

