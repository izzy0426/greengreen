# 탄소청구서

4차 배출권거래제(2026~2030) 758개 할당 단위의 탄소비용과 이익 대비 부담을 보여 주는 학술제 웹 서비스.
화면은 숫자를 만들지 않고, 모든 숫자는 팀 계산엔진 결과(2026.11.18)에서 온다.

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 정적 빌드 → dist/
```

## 구조 (개발 명세서 2장)

```
data-pipeline/     CSV → JSON 변환 스크립트 (원본 CSV는 올리지 않음)
public/data/       가공 JSON
public/scenes/     픽셀 장면 S1~S5 (webp)
src/engine/        실험실 결과 조회 모듈
src/pages/         article · company · lab · lab-result
src/components/    디자인 시스템 컴포넌트
src/styles/        디자인 토큰 (CSS 변수)
src/lib/           데이터 타입 · 단위 변환
```

## 라우팅 (명세서 3장)

| 경로 | 화면 |
| --- | --- |
| `/` | 01 아티클 |
| `/company` | 02 기업 탭 첫 화면 · 03 검색 자동완성 |
| `/company/:unitId?price=now` | 04 기업 조회 |
| `/lab?lever=211112211` | 05·06 실험실 |
| `/lab/result?lever=…` | 07 결과 보기 |

## 배포

Vercel에 저장소 연결 → Framework: Vite, Build: `npm run build`, Output: `dist`. SPA 경로는 `vercel.json`에서 처리.
