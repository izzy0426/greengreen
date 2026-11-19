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

## 데이터 다시 만들기

```bash
pip install pandas numpy
python data-pipeline/build_json.py   # units · unit/{key} · article.json
python data-pipeline/build_lab.py    # lab.json (팀 엔진으로 레버 조합 계산, 결과표 재현 검증)
python data-pipeline/check_json.py   # 하이파이 숫자와 비교
```

원본 CSV 위치는 `data-pipeline/README.md`.

## 확인 스크립트

```bash
npm run build && npx vite preview --port 4173
node scripts/e2e-company.mjs        # 검색·키보드·주소 진입
node scripts/e2e-lab.mjs            # 레버·미터·토스트·결과 보기
```

## 픽셀 장면 그림

`public/scenes/scene-s1.webp` ~ `scene-s5.webp` (1584×672 원본, 장당 300KB 이하). 히어로 = S2, 바로가기 = S4.
Figma '실험실 에셋' → 1. 장면 5단계에서 내보내 넣으면 된다. 없으면 단계별 바탕색만 보인다.

## 배포 (Vercel)

1. vercel.com → Add New → Project → GitHub `izzy0426/greengreen` 가져오기
2. Framework Preset: Vite · Build Command: `npm run build` · Output Directory: `dist` (자동 인식)
3. Production Branch: `main`. 다른 브랜치는 미리보기 주소가 따로 생김
4. 새로고침해도 `/company/…`, `/lab?lever=…`가 열리도록 `vercel.json`이 index.html로 돌려보냄

## 문서

- `docs/decisions.md` — 기준이 없어 개발 중 정한 것 (D1~D36)
- `docs/checklist.md` — 명세서 11장 수용 기준 확인 결과
