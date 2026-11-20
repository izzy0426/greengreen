"""실험실 '장관님, 결재해 주세요!' — 결재 3건 조합 36가지를 팀 계산엔진으로 미리 계산

    python data-pipeline/build_lab_decision.py   → lab-decision/data.json, 검증 결과 출력

결재 1 · 가격 4: 엔진 가격시나리오 3차 회귀(1만) / 현재 유지(3만, 원안) / IEA 현행정책(7.8만) / 전환 필요(11.5만)
결재 2 · 감축 3: 엔진 가정 배출_배율 1.00(원안) / 0.95('배출_합계-5%') / 1.05('배출_합계+5%') — 엔진 민감도와 같은 방식
결재 3 · 이월 3: 엔진 가정 이월_N
    지금 규칙(원안) = {2026: 6, …, 2030: 10} (잉여의 N/(N+1) 이월)
    전부 허용      = N → 아주 큼 (잉여 전부 이월)      ┐ 엔진 안내 '이월 규칙 비교'의
    금지           = N = 0 (잉여 전부 판매, 이월 없음) ┘ '잉여 전부 이월' / '이월 없음'
    3차에서 넘어온 2025 잔고는 셋 다 그대로 씀 (엔진 기본 이월_시작잔고_사용=True)
입력은 build_lab.py와 같이 결과표로 다시 만들고, 기본 가정이 결과표를 재현하는지 먼저 확인한다.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
import build_lab as B  # noqa: E402

OUT = B.ROOT / "lab-decision" / "data.json"
PRICES = [("1", "3차 회귀", 10_000), ("2", "현재 유지", 30_000), ("3", "IEA 현행정책", 78_000), ("4", "전환 필요", 115_000)]
REDUCE = [("1", 1.00), ("2", 0.95), ("3", 1.05)]
YRS = range(2026, 2031)
CARRY = [("1", None), ("2", {y: 10**12 for y in YRS}), ("3", {y: 0 for y in YRS})]


def metrics(E, r: pd.DataFrame, a) -> dict:
    x = E.지표(r, a)
    y30 = x[x["연도"] == 2030]
    pw = y30[y30["분석업종"] == "발전"]
    emis30 = float(y30["예측배출"].sum())
    pre30 = float(y30["사전할당"].sum())
    cost30 = float(y30["탄소비용"].sum())
    price30 = float(y30["가격"].iloc[0])
    return {
        "emis2030": round(emis30),                     # t
        "cap2030": round(pre30),                       # 4차 총량 = 2030 사전할당 합계 (t)
        "meter": round(emis30 / pre30 - 1, 5),         # 4차 총량 대비
        "cost5y": round(float(x["탄소비용"].sum())),   # 원
        "turnLoss2030": int(y30["적자전환"].sum()),     # 2030 적자 전환 단위 수 (영업이익>0 → 영업이익−탄소비용<0)
        "cost2030": round(cost30),
        "powerCost2030": round(float(pw["탄소비용"].sum())),
        "powerCost5y": round(float(x[x["분석업종"] == "발전"]["탄소비용"].sum())),
        "effPrice2030": round(cost30 / emis30, 1),     # 배출 1t당 실제 부담 (원) = 2030 탄소비용 ÷ 2030 배출
        "price2030": price30,
        "purchase5y": round(float(x["구매량"].sum())),
    }


def main() -> None:
    E = B.load_engine()
    T = pd.read_csv(B.RAW / "계산엔진_결과표_20261118.csv", encoding="utf-8-sig", low_memory=False)
    I = pd.read_csv(B.RAW / "지표_참고_20261118.csv", encoding="utf-8-sig", low_memory=False)
    T["분석업종"] = T["분석업종"].fillna("업종 없음")
    inp = B.inputs_from_result(T)
    B.verify(E, inp, T, I)

    combos = {}
    for pk, pname, _ in PRICES:
        for rk, scale in REDUCE:
            for ck, n in CARRY:
                a = E.가정(배출_배율=scale) if n is None else E.가정(배출_배율=scale, 이월_N=n)
                r = E.계산(inp, E.가격시나리오[pname], a)
                combos[pk + rk + ck] = metrics(E, r, a)
    base = combos["211"]

    # 검증: 한 결재만 바꾸고 나머지는 원안일 때 Figma 결재안 표와 같은지
    T5 = lambda v: round(v / 1e12, 1)
    expect = {
        "결재1 5년 비용(조)": ([T5(combos[k + "11"]["cost5y"]) for k in "1234"], [7.0, 11.8, 23.3, 32.2]),
        "결재1 적자 전환(곳)": ([combos[k + "11"]["turnLoss2030"] for k in "1234"], [1, 10, 26, 32]),
        "결재1 2030 배출 변화 없음": ([combos[k + "11"]["emis2030"] == base["emis2030"] for k in "1234"], [True] * 4),
        "결재2 2030 배출(백만 t)": ([round(combos["2" + k + "1"]["emis2030"] / 1e6, 1) for k in "123"], [457.0, 434.2, 479.9]),
        "결재2 총량 대비(%)": ([round(combos["2" + k + "1"]["meter"] * 100, 1) for k in "123"], [4.8, -0.4, 10.0]),
        "결재2 5년 비용(조)": ([T5(combos["2" + k + "1"]["cost5y"]) for k in "123"], [11.8, 9.9, 14.1]),
        "결재3 5년 비용(조, 소수 둘째)": ([round(combos["21" + k]["cost5y"] / 1e12, 2) for k in "123"], [11.77, 11.76, 11.85]),
    }
    fails = 0
    for name, (got, want) in expect.items():
        ok = got == want
        fails += not ok
        print(("OK  " if ok else "DIFF"), name, got, "표", want)
    print("조합", len(combos), "· 표와 다른 항목", fails)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out = {
        "source": "팀 계산엔진 계산()·지표() (계산엔진_김서진.py 11/18) — 결과표로 입력 재구성, 기본 가정 재현 검증",
        "keys": "가격(1~4) + 감축(1~3) + 이월(1~3), 예: 211 = 3만 원·예측대로·지금 규칙(원안)",
        "base": "211",
        "combos": combos,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("저장", OUT, f"{OUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
