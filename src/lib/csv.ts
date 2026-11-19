import type { UnitDetail } from './types'
import { PRICE_KEYS, PRICE_LABEL, GRADE_LABEL } from './types'

/** 04 'CSV 내려받기' — unit json을 펼친 표. 파일명 {단위명}_탄소청구서.csv, UTF-8 BOM (명세서 6장) */
export function downloadUnitCsv(u: UnitDetail) {
  const head = ['분석단위ID', '분석단위명', '업종', '가격 시나리오', '연도', '예측배출(t)', '예측배출 P10(t)', '예측배출 P90(t)', '사전할당(t)', '무상할당(t)', '유상분(t)',
    '모자라는 양(t)', '연초 이월잔고(t)', '이월 사용(t)', '연말 이월잔고(t)', '구매량(t)', '가격(원/t)', '탄소비용(원)', '판매수입(원)', '순비용(원)', '실효가격(원/t)', '위험도', '등급', '적자 전환']
  const rows = PRICE_KEYS.flatMap((p) =>
    u.years[p].map((r) => [u.id, u.name, u.sector, PRICE_LABEL[p], r.year, r.emis, r.emisP10, r.emisP90, r.preAlloc, r.freeAlloc, r.paidAlloc,
      r.shortfall, r.bankStart, r.bankUse, r.bank, r.purchase, r.price, r.cost, r.saleRevenue, r.netCost, r.effPrice, r.risk, GRADE_LABEL[r.grade], r.turnsLoss ? '예' : '아니오']),
  )
  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const text = '﻿' + [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${u.name.replace(/[\\/:*?"<>|]/g, '_')}_탄소청구서.csv`
  a.click()
  URL.revokeObjectURL(url)
}
