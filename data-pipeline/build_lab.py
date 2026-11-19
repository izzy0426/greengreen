"""실험실 레버 조합 결과를 팀 계산엔진으로 미리 계산 → public/data/lab.json

    python data-pipeline/build_lab.py

방법
- 팀 엔진 `계산엔진_김서진.py`(vendor/, Drive 계산엔진 폴더의 11/18 수정본)의 계산()·지표()를 그대로 부른다.
- 엔진 입력(입력_읽기)은 11:15 폴더의 원본 CSV가 필요하지만, 계산()이 실제로 쓰는 값은 모두 결과표에 있다:
  사전할당·무상할당·유상분(→ 순할당_이전반영 = 무상할당 + 유상분), 2026 연초 이월잔고(= 잔고_2025), 예측배출(P10·P90),
  무상할당_2025, 기존비용_3년평균, 단위 정보·재무. 그래서 결과표로 입력을 다시 만든다.
- 먼저 기본 가정 × 가격 4로 다시 계산해 결과표와 모든 값이 같은지 확인한다(다르면 멈춤).

확정 레버 (명세서 6장)
- ① 배출권 가격 1~4 → 3차 회귀 · 현재 유지 · IEA 현행정책 · 전환 필요
- ⑧ 에너지 사용 감축 1 → 배출 배율 1.00, 3 → 0.95 (엔진 민감도 '배출_합계-5%')
그 밖의 레버·단계는 값이 정해지지 않아 숫자를 바꾸지 않는다 (화면에 '가정' 배지).
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-pipeline" / "raw"
OUT = ROOT / "public" / "data" / "lab.json"
YEARS = [2026, 2027, 2028, 2029, 2030]
PRICE_MAP = {"3차 회귀": "low", "현재 유지": "now", "IEA 현행정책": "high", "전환 필요": "max"}
PRICE_KEYS = ["low", "now", "high", "max"]
REDUCTIONS = {"1": 1.00, "3": 0.95}  # 에너지 사용 감축 단계 → 배출 배율
GRADE_MAP = {"① 고위험(적자)": "loss", "② 고위험": "high", "③ 중위험": "mid", "④ 저위험": "low", "⑤ 비용 없음": "none", "별도 (재무 없음)": "nofin"}


def load_engine():
    spec = importlib.util.spec_from_file_location("engine", ROOT / "data-pipeline" / "vendor" / "계산엔진_김서진.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules["engine"] = mod  # dataclass가 모듈을 찾을 수 있게
    spec.loader.exec_module(mod)
    return mod


def inputs_from_result(T: pd.DataFrame) -> dict:
    """결과표(한 가격 시나리오면 충분)로 엔진 입력 dict를 다시 만든다."""
    t = T[T["가격시나리오"] == "현재 유지"].copy()
    units = sorted(t["분석단위ID"].unique())
    first = t.drop_duplicates("분석단위ID").set_index("분석단위ID")
    info = first[["분석업종", "기관유형", "플래그_공공비영리", "매출_3년평균", "영업이익_3년평균", "영업이익률_3년평균",
                  "분석단위명", "시도", "4차_신규", "제외사유"]].copy()
    info["재무상태"] = np.nan
    alloc = t.set_index(["분석단위ID", "연도"])[["사전할당", "무상할당", "유상분"]].rename(columns={"사전할당": "사전"})
    alloc["순할당_이전반영"] = alloc["무상할당"] + alloc["유상분"]
    start = pd.DataFrame(index=units)
    s26 = t[t["연도"] == 2026].set_index("분석단위ID")
    start["잔고_2025"] = s26["이월잔고_연초"].reindex(units)
    start["무상할당_2025"] = first["무상할당_2025"].reindex(units)
    start["기존비용_3년평균"] = first["기존비용_3년평균"].reindex(units)
    fc = t.set_index(["분석단위ID", "연도"])[["예측배출", "예측배출_P10", "예측배출_P90"]].rename(
        columns={"예측배출": "예측_배출", "예측배출_P10": "예측_P10", "예측배출_P90": "예측_P90"})
    fc["예측방법"] = ""
    bias = pd.Series(0.0, index=fc.index)
    return {"units": units, "info": info, "alloc": alloc, "start": start, "forecast": fc, "bias": bias}


def run(E, inp, price_name: str, scale: float) -> pd.DataFrame:
    a = E.가정(배출_배율=scale)
    r = E.계산(inp, E.가격시나리오[price_name], a)
    r["가격시나리오"] = price_name
    return E.지표(r, a)


def verify(E, inp, T: pd.DataFrame, I: pd.DataFrame) -> None:
    """기본 가정에서 다시 계산한 값 = 결과표·지표_참고 (명세서 11장: 모든 값 오차 0.1% 이내)"""
    cols = ["예측배출", "무상할당", "모자라는양", "이월사용", "이월잔고", "구매량", "탄소비용", "판매수입", "순비용"]
    worst = 0.0
    for name in PRICE_MAP:
        r = run(E, inp, name, 1.0).set_index(["분석단위ID", "연도"])
        t = T[T["가격시나리오"] == name].set_index(["분석단위ID", "연도"])
        i = I[I["가격시나리오"] == name].set_index(["분석단위ID", "연도"])
        for c in cols:
            d = (r[c] - t[c]).abs() / t[c].abs().clip(lower=1.0)
            worst = max(worst, float(d.max()))
        g_ok = (r["등급"] == i["등급"]).all()
        if not g_ok:
            sys.exit(f"검증 실패: {name} 등급이 지표_참고와 다름")
    if worst > 1e-3:
        sys.exit(f"검증 실패: 결과표와 최대 상대오차 {worst:.2e}")
    print(f"검증 통과: 결과표 재현, 최대 상대오차 {worst:.1e} (기준 1e-3), 등급 일치")


def summarize(r: pd.DataFrame, base: pd.DataFrame | None) -> dict:
    g = r.groupby("연도")
    yearly = [{"year": int(y), "emis": round(v["예측배출"]), "preAlloc": round(v["사전할당"]), "freeAlloc": round(v["무상할당"]),
               "purchase": round(v["구매량"]), "cost": round(v["탄소비용"]), "netCost": round(v["순비용"]), "price": round(v["가격"])}
              for y, v in g[["예측배출", "사전할당", "무상할당", "구매량", "탄소비용", "순비용", "가격"]]
              .agg({"예측배출": "sum", "사전할당": "sum", "무상할당": "sum", "구매량": "sum", "탄소비용": "sum", "순비용": "sum", "가격": "first"}).iterrows()]
    y30 = r[r["연도"] == 2030]
    sec = lambda s: y30[y30["분석업종"].isin(s)]
    power, steel, petro = sec(["발전"]), sec(["철강", "시멘트"]), sec(["석유화학"])
    steel_only = sec(["철강"])
    c5 = r.groupby("분석단위ID").agg(cost=("탄소비용", "sum"), buy=("구매량", "sum"), name=("분석단위명", "first"), sector=("분석업종", "first"))
    risk30 = y30.set_index("분석단위ID")
    top = c5.sort_values("cost", ascending=False).head(5)
    sectors = r.groupby("분석업종")["탄소비용"].sum().sort_values(ascending=False)
    grades = {k: int((y30["등급"] == lab).sum()) for lab, k in GRADE_MAP.items()}
    return {
        "yearly": yearly,
        # 미터: 4차 총량 대비 = 2030 예측배출 합계 ÷ 2030 사전할당 합계 − 1 (명세서 5장)
        "meter": y30["예측배출"].sum() / y30["사전할당"].sum() - 1,
        "pins": {
            "powerCost2030": round(power["탄소비용"].sum()),
            "powerPurchase2030": round(power["구매량"].sum()),
            "steelCementFreeRatio2030": float(sec(["철강", "시멘트"])["무상할당"].sum() / sec(["철강", "시멘트"])["사전할당"].sum()),
            "steelSurplus2030": round((steel_only["무상할당"] - steel_only["예측배출"]).sum()),
            "petroEmis2030": round(petro["예측배출"].sum()),
            "petroFree2030": round(petro["무상할당"].sum()),
        },
        "sectorCost5y": [{"sector": s, "cost": round(v)} for s, v in sectors.head(6).items()],
        "grades2030": grades,
        "top5": [{"id": uid, "name": row["name"], "sector": row["sector"], "purchase5y": round(row["buy"]), "cost5y": round(row["cost"]),
                  "risk2030": None if pd.isna(risk30.at[uid, "위험도"]) else float(risk30.at[uid, "위험도"]),
                  "noFinance": bool(isinstance(risk30.at[uid, "제외사유"], str) and risk30.at[uid, "제외사유"])}
                 for uid, row in top.iterrows()],
    }


def main() -> None:
    E = load_engine()
    T = pd.read_csv(RAW / "계산엔진_결과표_20261118.csv", encoding="utf-8-sig", low_memory=False)
    I = pd.read_csv(RAW / "지표_참고_20261118.csv", encoding="utf-8-sig", low_memory=False)
    T["분석업종"] = T["분석업종"].fillna("업종 없음")  # build_json.py와 같은 처리 (결정 기록 D11)
    inp = inputs_from_result(T)
    verify(E, inp, T, I)

    combos = {}
    for step, scale in REDUCTIONS.items():
        for name, key in PRICE_MAP.items():
            r = run(E, inp, name, scale)
            combos[f"{key}-{step}"] = summarize(r, None)
            m = combos[f"{key}-{step}"]
            print(f"{key:>4} 감축{step}: 2030 배출 {m['yearly'][-1]['emis'] / 1e6:6.2f}백만 t, 미터 {m['meter'] * 100:+.1f}%, "
                  f"5년 비용 {sum(y['cost'] for y in m['yearly']) / 1e12:5.2f}조")

    for v in combos.values():
        v["meter"] = round(v["meter"], 5)
        v["pins"]["steelCementFreeRatio2030"] = round(v["pins"]["steelCementFreeRatio2030"], 4)
        for t in v["top5"]:
            if t["risk2030"] is not None:
                t["risk2030"] = round(t["risk2030"], 4)
    # 현행 레버 값 표시용 (기본 가정·지금 가격): 2030 유상 비율 = 유상분 ÷ 사전할당
    b = T[(T["가격시나리오"] == "현재 유지") & (T["연도"] == 2030)]
    pw = b[b["분석업종"] == "발전"]
    # 발전 외 유상 비율은 업종마다 0~50%로 섞여 하나로 못 냄 → 화면은 명세서 표기(15%, 확인 필요)를 씀
    current = {"powerPaidRatio2030": round(float(pw["유상분"].sum() / pw["사전할당"].sum()), 4),
               "price2026": int(T[T["연도"] == 2026]["가격"].iloc[0])}
    print("현행 레버 값", current)
    out = {
        "current": current,
        "source": "팀 계산엔진 계산()·지표() (계산엔진_김서진.py, 11/18 수정본) — 결과표로 입력 재구성, 기본 가정 재현 검증",
        "totalUnits": len(inp["units"]),
        "levers": {"price": {"1": "low", "2": "now", "3": "high", "4": "max"}, "reduction": REDUCTIONS},
        "combos": combos,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    print(f"lab.json {OUT.stat().st_size / 1024:.1f} KB, 조합 {len(combos)}개")


if __name__ == "__main__":
    main()
