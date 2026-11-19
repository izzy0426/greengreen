import { useState } from 'react'
import { Button } from '../components/Button'
import { ChipGroup } from '../components/Chip'
import { FloatingCta } from '../components/FloatingCta'
import { KpiCard } from '../components/KpiCard'
import { LegendItem } from '../components/LegendItem'
import { LogoSymbol, LogoWordmark } from '../components/Logo'
import { SectionHeader } from '../components/SectionHeader'
import { AssumptionBadge, Hashtag, Tag } from '../components/Tags'
import { PRICE_KEYS, PRICE_LABEL, type PriceKey } from '../lib/types'

/** 개발용: 공통 컴포넌트를 Figma 'DS · Main components'와 나란히 비교하는 화면 (/_ds, 메뉴에 없음) */
export default function DesignSystemPage() {
  const [price, setPrice] = useState<PriceKey>('now')
  return (
    <main className="page" style={{ display: 'grid', gap: 40, justifyItems: 'start' }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Button>버튼</Button>
        <Button variant="secondary">버튼</Button>
        <Button variant="ghost">버튼</Button>
      </div>
      <ChipGroup label="가격 시나리오" options={PRICE_KEYS.map((k) => ({ value: k, label: PRICE_LABEL[k] }))} value={price} onChange={setPrice} />
      <Hashtag>#해시태그</Hashtag>
      <div style={{ display: 'flex', gap: 8 }}>
        <Tag>발전</Tag>
        <Tag tone="short">부족</Tag>
        <Tag tone="surplus">남음</Tag>
        <Tag tone="danger">고위험</Tag>
        <AssumptionBadge />
      </div>
      <SectionHeader title="섹션 제목" moreTo="/" />
      <div style={{ width: 240 }}>
        <KpiCard label="지표 이름" value="0" unit="단위" note="↑ 0% · 3차 대비" />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <LegendItem type="short" />
        <LegendItem type="surplus" />
        <LegendItem type="target" />
      </div>
      <LogoSymbol />
      <LogoWordmark />
      <FloatingCta />
    </main>
  )
}
