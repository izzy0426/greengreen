# 실험실 '장관님, 결재해 주세요!' (단일 HTML)

`lab.html` 하나만 브라우저로 열면 동작한다 (데이터·그림·폰트 내장, 인터넷 필요 없음).

| 파일 | 내용 |
| --- | --- |
| `lab.html` | 결과물. 아래 파일을 합친 것 |
| `src/index.html` · `src/style.css` | 화면 틀·스타일 (배출권 길라잡이 최종 토큰) |
| `src/app.js` | 화면 코드 (흐름·키보드·성적표·공유) |
| `src/content.js` | 문구·장면 연출 (숫자 없음) |
| `data.json` | 팀 계산엔진 36개 조합 결과 (`data-pipeline/build_lab_decision.py`) |
| `img/` | Figma 160:2539 그림 원본 (office, business, climate, household, secretary, good .png) |

다시 만들기

```
python3 data-pipeline/build_lab_decision.py   # 엔진 36개 조합 + 검증
python3 lab-decision/build_html.py            # lab.html
```

사이트 실험실 탭에 붙일 때는 `src/app.js`의 렌더 함수와 `data.json`을 그대로 가져가면 된다. 공유 주소는 `#r=가격감축이월` (예: `#r=221`).
