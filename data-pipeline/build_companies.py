"""기업 페이지용 데이터 — 팀원 원본 페이지(배출권 길라잡이 수정안)의 companies.json을 그대로 옮긴다.

입력: raw/companies.json (아티팩트 613b1253…의 companies.json, 961개 단위)
출력: ../public/data/companies.json  (구조 그대로, 공백만 제거)
      ../public/data/companies_meta.json (원본 페이지 JS에 박혀 있던 업종 상수 H7·GAP·KIND)

화면은 원본 페이지 JS와 같은 식(e25, r3, 업종 중앙값, 구매 필요 여부)으로 계산한다.
"""
import json
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "raw" / "companies.json"
OUT = HERE.parent / "public" / "data"

# 원본 페이지 index.html <script> 안의 상수 (팀 계산 결과를 손으로 옮겨 둔 값). 출처 표시를 위해 그대로 둔다.
H7 = {"발전": [23.3, 60.0], "집단에너지": [14.1, 26.6], "정유": [12.9, 11.6], "비철금속": [15.0, 11.0],
      "석유화학": [8.5, 6.3], "제지": [10.5, 6.1], "폐기물": [7.6, 6.1], "반도체": [8.3, 6.0],
      "전기전자": [6.5, 5.5], "유리·요업": [8.8, 4.4], "시멘트": [0.9, 0.6], "철강": [8.6, 0.1]}
GAP = {"가스": 0.16, "건물": 4.97, "건설": 0.07, "고무·플라스틱제품": 0.08, "광업": -0.52, "기계": 0.17,
       "목재": -1.06, "반도체": -0.2, "발전": 88.73, "비철금속": 2.75, "석유화학": -2.74, "섬유": -0.05,
       "시멘트": -29.31, "유리·요업": -1.51, "육상운송": 0.72, "음식료": 0.84, "자동차": 2.24, "전기전자": 1.32,
       "정유": 18.17, "제약": 0.8, "제지": -1.15, "조선": 3.07, "집단에너지": -1.17, "철강": -4.11, "철도": 1.16,
       "통신·IT": 6.02, "폐기물": -4.65, "하수·수도": 1.14, "항공": 0.33, "해운": 0.02}
KIND = {"발전": ["발전", "유상할당 2026년 15% → 2030년 50%"],
        "탄소누출 우려": ["탄소누출 업종", "4차 전량 무상할당 (유상 0%)"],
        "비우려": ["유상할당 업종", "4차 유상할당 15%"],
        "특례": ["특례 업종", "업종 특례 기준 할당"],
        "특례(집단에너지, 확인 필요)": ["집단에너지 특례", "유상할당 비율 확인 중"]}


def main():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    keys = {"id", "n", "m", "s", "h", "p", "k"}
    for u in data:
        assert keys <= u.keys(), u.get("id")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "companies.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    meta = {"h7": H7, "gap": GAP, "kind": KIND,
            "source": "팀원 원본 페이지 '배출권 길라잡이 (수정안)' companies.json · 업종 상수는 같은 페이지 스크립트"}
    (OUT / "companies_meta.json").write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("units", len(data))


if __name__ == "__main__":
    main()
