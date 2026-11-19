"""계산엔진 결과 CSV → 화면용 JSON (개발 명세서 4장)

사용법 (저장소 루트에서):
    python data-pipeline/build_json.py               # raw/ → public/data/
    python data-pipeline/build_json.py --raw 경로     # 원본 폴더 지정

원본(raw/, 저장소에 올리지 않음):
    계산엔진_결과표_20261118.csv, 지표_참고_20261118.csv   (Drive 계산엔진/엔진결과_20261118/)
    요약_업종연도시나리오_20261118.csv, 합계범위_20261118.csv, 가정_20261118.csv
    H7_실효가격표.csv, H7_적자전환표.csv                    (Drive 08_가설/)
    분석단위패널_플래그.csv                                  (EDA 4_분석단위패널_플래그.csv)

원칙
- 화면은 숫자를 만들지 않는다 → 엔진 결과를 그대로 옮기고, 합계·비중 같은 집계만 여기서 한다.
- 저장 단위: 배출·할당·구매량 t, 금액 원. 백만 t·조 원 변환은 화면 포맷 함수에서만.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
YEARS = [2026, 2027, 2028, 2029, 2030]

# 가격 시나리오 이름 매핑 (명세서 4장) — 가공 단계에서 한 번만 변환
PRICE_MAP = {"3차 회귀": "low", "현재 유지": "now", "IEA 현행정책": "high", "전환 필요": "max"}
PRICE_KEYS = ["low", "now", "high", "max"]

GRADE_MAP = {
    "① 고위험(적자)": "loss",
    "② 고위험": "high",
    "③ 중위험": "mid",
    "④ 저위험": "low",
    "⑤ 비용 없음": "none",
    "별도 (재무 없음)": "nofin",
}


# ─────────────────────────── 도우미 ───────────────────────────
def unit_key(unit_id: str) -> str:
    """unit/{key}.json 파일 이름. 분석단위ID에 한글·괄호·&가 있어 해시로 안전한 이름을 만든다 (ID가 같으면 항상 같은 값)."""
    return hashlib.sha1(unit_id.encode("utf-8")).hexdigest()[:10]


def num(v, digits: int | None = 0):
    """NaN·inf → None, 나머지는 반올림. digits=None이면 유효숫자 4자리 (비율용)."""
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if math.isnan(f) or math.isinf(f):
        return None
    if digits is None:
        return float(f"{f:.4g}")
    r = round(f, digits)
    return int(r) if digits == 0 else r


def write_json(path: Path, obj) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"), allow_nan=False)  # NaN이 섞이면 여기서 멈춤
    path.write_text(text, encoding="utf-8")
    return len(text.encode("utf-8"))


def read_csv(path: Path, **kw) -> pd.DataFrame:
    return pd.read_csv(path, encoding="utf-8-sig", low_memory=False, **kw)


# ─────────────────────────── 읽기 ───────────────────────────
def load(raw: Path) -> dict:
    T = read_csv(raw / "계산엔진_결과표_20261118.csv")
    I = read_csv(raw / "지표_참고_20261118.csv")
    assert len(T) == 15_160 and T["분석단위ID"].nunique() == 758, "결과표 크기가 명세서(758 × 5 × 4)와 다름"
    M = T.merge(I, on=["분석단위ID", "연도", "가격시나리오"], how="left", validate="one_to_one")
    M["price"] = M["가격시나리오"].map(PRICE_MAP)
    M["grade"] = M["등급"].map(GRADE_MAP)
    assert M["price"].notna().all(), f"모르는 가격 시나리오: {set(M.loc[M['price'].isna(), '가격시나리오'])}"
    assert M["grade"].notna().all(), f"모르는 등급: {set(M.loc[M['grade'].isna(), '등급'])}"
    # 업종이 비어 있는 단위: 결과표·EDA 패널 모두 없음 (F0449 (주)박원) → '업종 없음' (결정 기록 D11)
    missing = M.loc[M["분석업종"].isna(), "분석단위ID"].unique()
    if len(missing):
        print(f"업종 없음으로 표시: {list(missing)}")
    M["분석업종"] = M["분석업종"].fillna("업종 없음")
    M["key"] = M["분석단위ID"].map(unit_key)
    # 유상 비율 = 유상분 ÷ 사전할당 (명세서 4장 lab-base 정의)
    M["유상비율"] = (M["유상분"] / M["사전할당"]).where(M["사전할당"] > 0)
    assert M.drop_duplicates("분석단위ID")["key"].is_unique, "파일 키 충돌"
    return {
        "M": M,
        "effprice": read_csv(raw / "H7_실효가격표.csv"),
        "panel": read_csv(raw / "분석단위패널_플래그.csv"),
        "range": read_csv(raw / "합계범위_20261118.csv"),
        "assume": read_csv(raw / "가정_20261118.csv"),
    }


def display_name(name: str) -> str:
    """목록·제목용 이름: 법인 표기만 뺀다 (검색 정규화와 같은 규칙). 별칭(옛 상호 등)은 만들지 않음 — 명세서 10장."""
    s = name
    for t in ["주식회사", "(주)", "㈜", "(유)", "유한회사"]:
        s = s.replace(t, "")
    return " ".join(s.split()) or name


# ─────────────────────────── units.json ───────────────────────────
def build_units(M: pd.DataFrame) -> list[dict]:
    first = M.drop_duplicates("분석단위ID").set_index("분석단위ID")
    cost5y = M.pivot_table(index="분석단위ID", columns="price", values="탄소비용", aggfunc="sum")
    y30 = M[M["연도"] == 2030]
    g30 = y30.pivot(index="분석단위ID", columns="price", values="grade")
    r30 = y30.pivot(index="분석단위ID", columns="price", values="위험도")
    s30 = y30[y30["price"] == "now"].set_index("분석단위ID")["모자라는양"]

    rows = []
    for uid, r in first.iterrows():
        ex = r["제외사유"] if isinstance(r["제외사유"], str) and r["제외사유"] else None
        rows.append({
            "id": uid,
            "key": r["key"],
            "name": r["분석단위명"],
            "displayName": display_name(r["분석단위명"]),
            "sector": r["분석업종"],
            "orgType": r["기관유형"],
            "region": r["시도"] if isinstance(r["시도"], str) else None,
            "isPublic": bool(r["플래그_공공비영리"]),
            "isNew": bool(r["4차_신규"]),
            "revenue3y": num(r["매출_3년평균"]),
            "opProfit3y": num(r["영업이익_3년평균"]),
            "opMargin3y": num(r["영업이익률_3년평균"], None),
            "excludeReason": ex,
            "cost5y": {p: num(cost5y.at[uid, p]) for p in PRICE_KEYS},
            "grade2030": {p: g30.at[uid, p] for p in PRICE_KEYS},
            "risk2030": {p: num(r30.at[uid, p], None) for p in PRICE_KEYS},
            # 2030 모자라는 양(지금 가격과 무관: 배출·할당만으로 정해짐). 목록의 부족/남음 태그용
            "shortfall2030": num(s30.at[uid]),
        })
    rows.sort(key=lambda u: -u["cost5y"]["now"])
    # 5년 비용 순위 (지금 가격, 비용 > 0인 단위만. 비용 0이면 None)
    for i, u in enumerate(rows):
        u["rank5y"] = i + 1 if u["cost5y"]["now"] > 0 else None
    return rows


def build_why(g: pd.DataFrame) -> dict:
    """04 '왜 이렇게 나왔나' 요인 — 지금 가격 기준. 이월·할당·배출은 가격과 무관.
    bar = 막대 길이(0~1). 무상할당·배출은 변화율 절댓값, 유상 비율은 상승 폭(%p), 이월은 5년 이월 사용 ÷ 5년 모자란 양(+)."""
    n = g[g["price"] == "now"].sort_values("연도").set_index("연도")
    f0, f1 = n.at[2026, "무상할당"], n.at[2030, "무상할당"]
    e0, e1 = n.at[2026, "예측배출"], n.at[2030, "예측배출"]
    p0, p1 = n.at[2026, "유상비율"], n.at[2030, "유상비율"]
    bank0 = n.at[2026, "이월잔고_연초"]
    bank_use = n["이월사용"].sum()
    need = n["모자라는양"].clip(lower=0).sum()
    empty = None
    if bank0 > 0:
        z = n[(n["이월잔고"] < 1)]
        empty = int(z.index[0]) if len(z) else None
    chg = lambda a, b: (b - a) / a if a and a > 0 else None
    f25 = n.at[2030, "무상할당_2025"]
    return {
        "freeAlloc": {"start": num(f0), "end": num(f1), "change": num(chg(f0, f1), None),
                      "y2025": num(f25), "changeFrom2025": num(chg(f25, f1), None) if pd.notna(f25) else None},
        "paidRatio": {"start": num(p0, None), "end": num(p1, None)},
        "emis": {"start": num(e0), "end": num(e1), "change": num(chg(e0, e1), None)},
        "bank": {"start2026": num(bank0), "used5y": num(bank_use), "emptyYear": empty, "end2030": num(n.at[2030, "이월잔고"]),
                 "shareOfNeed": num(bank_use / need, None) if need > 0 else None},
    }


def pack_units(units: list[dict]) -> dict:
    """units.json 저장 형태: 열 이름 1번 + 행 배열 (용량 목표 200KB). 가격별 값은 PRICE_KEYS 순서 배열.
    화면에서는 src/lib/data.ts의 unpackUnits()로 UnitSummary[]로 펼친다."""
    cols = list(units[0].keys())
    rows = [[[u[c][p] for p in PRICE_KEYS] if isinstance(u[c], dict) else u[c] for c in cols] for u in units]
    return {"priceKeys": PRICE_KEYS, "columns": cols, "rows": rows}


# ─────────────────────────── unit/{key}.json ───────────────────────────
UNIT_YEAR_COLS = {
    "emis": ("예측배출", 0),
    "emisP10": ("예측배출_P10", 0),
    "emisP90": ("예측배출_P90", 0),
    "preAlloc": ("사전할당", 0),
    "freeAlloc": ("무상할당", 0),
    "paidAlloc": ("유상분", 0),
    "freeAlloc2025": ("무상할당_2025", 0),
    "shortfall": ("모자라는양", 0),
    "bankStart": ("이월잔고_연초", 0),
    "bankUse": ("이월사용", 0),
    "bank": ("이월잔고", 0),
    "purchase": ("구매량", 0),
    "surplusSold": ("잉여_판매", 0),
    "price": ("가격", 0),
    "cost": ("탄소비용", 0),
    "saleRevenue": ("판매수입", 0),
    "netCost": ("순비용", 0),
    "effPrice": ("실효탄소가격", 1),
    "effPriceRatio": ("실효가격_비율", None),
    "paidRatio": ("유상비율", None),
    "risk": ("위험도", None),
    "marginAfter": ("반영후이익률", None),
}


def build_unit_detail(units: list[dict], M: pd.DataFrame) -> dict[str, dict]:
    by_unit = {k: g for k, g in M.groupby("분석단위ID")}
    out = {}
    for u in units:
        g = by_unit[u["id"]]
        years = {}
        for p in PRICE_KEYS:
            gp = g[g["price"] == p].sort_values("연도")
            assert list(gp["연도"]) == YEARS
            years[p] = [
                {"year": int(r["연도"]),
                 **{k: num(r[c], d) for k, (c, d) in UNIT_YEAR_COLS.items()},
                 "grade": r["grade"],
                 "turnsLoss": bool(r["적자전환"])}
                for _, r in gp.iterrows()
            ]
        out[u["key"]] = {**u, "why": build_why(g), "years": years}
    return out


# ─────────────────────────── article.json ───────────────────────────
def build_article(d: dict, units: list[dict]) -> dict:
    M, P = d["M"], d["panel"]
    now = M[M["price"] == "now"]
    n30 = now[now["연도"] == 2030]

    # 연도별 합계 (가격별)
    yearly = {}
    for p in PRICE_KEYS:
        g = M[M["price"] == p].groupby("연도")
        yearly[p] = [
            {"year": int(y), "emis": num(r["예측배출"]), "preAlloc": num(r["사전할당"]), "freeAlloc": num(r["무상할당"]),
             "bankUse": num(r["이월사용"]), "purchase": num(r["구매량"]), "cost": num(r["탄소비용"]),
             "saleRevenue": num(r["판매수입"]), "netCost": num(r["순비용"]), "price": num(r["가격"])}
            for y, r in g[["예측배출", "사전할당", "무상할당", "이월사용", "구매량", "탄소비용", "판매수입", "순비용", "가격"]]
            .agg({"예측배출": "sum", "사전할당": "sum", "무상할당": "sum", "이월사용": "sum", "구매량": "sum",
                  "탄소비용": "sum", "판매수입": "sum", "순비용": "sum", "가격": "first"}).iterrows()
        ]

    # 업종별 배출·비용 (5년 합계, 가격별 비용)
    sec_emis = now.groupby("분석업종")["예측배출"].sum()
    sec_cost = M.pivot_table(index="분석업종", columns="price", values="탄소비용", aggfunc="sum")
    sec_units = now[now["연도"] == 2030].groupby("분석업종").size()
    sectors = [
        {"sector": s, "units": int(sec_units[s]), "emis5y": num(sec_emis[s]),
         "emisShare": num(sec_emis[s] / sec_emis.sum(), None),
         "cost5y": {p: num(sec_cost.at[s, p]) for p in PRICE_KEYS},
         "costShare": {p: num(sec_cost.at[s, p] / sec_cost[p].sum(), None) for p in PRICE_KEYS}}
        for s in sec_cost["now"].sort_values(ascending=False).index
    ]

    # 2030 위험 등급 (가격별) — KPI 4묶음: ①+② · ③ · ④ · ⑤+재무 없음
    grades = {p: {g: int(c) for g, c in M[(M["price"] == p) & (M["연도"] == 2030)]["grade"].value_counts().items()}
              for p in PRICE_KEYS}
    for p in PRICE_KEYS:
        for g in GRADE_MAP.values():
            grades[p].setdefault(g, 0)

    # 적자 전환 (재무 있는 단위 중)
    fin = M[M["영업이익_3년평균"].notna()]
    turns = {p: [int(fin[(fin["price"] == p) & (fin["연도"] == y)]["적자전환"].sum()) for y in YEARS] for p in PRICE_KEYS}
    turns_sector_2030 = {
        p: {s: int(c) for s, c in fin[(fin["price"] == p) & (fin["연도"] == 2030) & fin["적자전환"]].groupby("분석업종").size().items()}
        for p in PRICE_KEYS}

    # 상위 10곳 (지금 가격 5년 비용). 위험도는 연평균 비용 ÷ 영업이익(하이파이 TOP 10 표의 정의)
    by_u = {u["id"]: u for u in units}
    c5 = pd.Series({u["id"]: u["cost5y"]["now"] for u in units})
    top10 = []
    for uid in c5.nlargest(10).index:
        u = by_u[uid]
        op = u["opProfit3y"]
        top10.append({"id": uid, "name": u["displayName"], "sector": u["sector"], "cost5y": u["cost5y"]["now"],
                      "risk2030": u["risk2030"]["now"], "noFinance": bool(u["excludeReason"]),
                      "riskAvg": num(u["cost5y"]["now"] / 5 / op, None) if (op and op > 0 and not u["excludeReason"]) else None})

    # 발전 공기업 5곳 (남동·남부·동서·서부·중부)
    gencos = [u for u in units if u["sector"] == "발전" and u["orgType"] == "공공기관"
              and any(k in u["name"] for k in ["남동", "남부", "동서", "서부", "중부"])]
    assert len(gencos) == 5, [u["name"] for u in gencos]

    # 실효가격 (H7)
    ep = d["effprice"]
    effprice = {
        grp: [{"year": int(r["연도"]), "rule3": num(r["3차 규칙(원/t)"]), "rule4": num(r["4차 규칙(원/t)"]),
               "shareOfMarket": num(r["4차 / 시장가(%)"] / 100, None)} for _, r in g.sort_values("연도").iterrows()]
        for grp, g in ep.groupby("구분")}

    # 2015~2025 실적 (EDA 패널, 분석제외 빼고 표본 합계)
    q = P[~P["분석제외"].astype(bool)].groupby("연도").agg(emis=("배출량", "sum"), netAlloc=("순할당", "sum"), units=("분석단위ID", "nunique"))
    phase = {y: (1 if y <= 2017 else 2 if y <= 2020 else 3) for y in range(2015, 2026)}
    history = [{"year": int(y), "phase": phase[int(y)], "emis": num(r["emis"]), "netAlloc": num(r["netAlloc"]),
                "surplus": num(r["netAlloc"] - r["emis"]), "units": int(r["units"])} for y, r in q.iterrows()]
    p3 = [h["surplus"] for h in history if h["phase"] == 3]

    # 합계 범위 (편향 보정, ±5%) — P10·P90 합계는 쓰지 않음 (엔진 안내 4번)
    rg = d["range"]
    ranges = {case: {str(r["연도"]): {"emis": num(r["예측배출"] * 1e6), "gapTotal": num(r["갭_총량"] * 1e6),
                                      "purchase": num(r["구매량"] * 1e6), "cost": num(r["탄소비용(조)"] * 1e12),
                                      "netCost": num(r["순비용(조)"] * 1e12) if pd.notna(r["순비용(조)"]) else None}
                     for _, r in g.iterrows()}
              for case, g in rg.groupby("경우")}

    total_now = c5.sum()
    pw = now[now["분석업종"] == "발전"].groupby("연도")[["유상분", "사전할당"]].sum()
    power_paid = {str(y): num(pw.at[y, "유상분"] / pw.at[y, "사전할당"], None) for y in YEARS}
    y26n, y30n = next(r for r in yearly["now"] if r["year"] == 2026), next(r for r in yearly["now"] if r["year"] == 2030)
    glance = {
        "emis2030": y30n["emis"], "emis2026": y26n["emis"], "emisChange": num((y30n["emis"] - y26n["emis"]) / y26n["emis"], None),
        "gapTotal2030": num(y30n["emis"] - y30n["preAlloc"]), "preAlloc2030": y30n["preAlloc"],
        "gapTotal5y": num(sum(r["emis"] - r["preAlloc"] for r in yearly["now"])),
        "purchase5y": num(sum(r["purchase"] for r in yearly["now"])),
        "turnsLoss2030Now": turns["now"][-1], "turnsLoss2030Max": turns["max"][-1],
        "cost5y": {p: num(sum(r["cost"] for r in yearly[p])) for p in PRICE_KEYS},
        "price2030": {p: yearly[p][-1]["price"] for p in PRICE_KEYS},
    }
    power = next(s for s in sectors if s["sector"] == "발전")
    y_now = {r["year"]: r for r in yearly["now"]}
    return {
        "source": "팀 계산엔진 결과표·지표_참고(2026.11.18), H7 실효가격표·적자전환표(권준영), EDA 분석단위 패널",
        "hero": {
            "cost5yNow": num(total_now),
            "powerCostShare": power["costShare"]["now"],
            "powerEmisShare": power["emisShare"],
            "shortUnits2030": int((n30["모자라는양"] > 0).sum()),
            "totalUnits": len(units),
        },
        "glance": glance,
        "powerPaidRatio": power_paid,
        "yearly": yearly,
        "purchasePressure2030": num(y_now[2030]["emis"] - y_now[2030]["freeAlloc"]),
        "sectors": sectors,
        "grades2030": grades,
        "turnsLoss": {"base": int(fin["분석단위ID"].nunique()), "byYear": turns, "bySector2030": turns_sector_2030},
        "concentration": {
            "top10": top10,
            "top10Share": num(c5.nlargest(10).sum() / total_now, None),
            "top10PowerCount": sum(1 for t in top10 if t["sector"] == "발전"),
            "unitsWithCost": int((c5 > 0).sum()),
            "gencos5Cost5y": num(sum(u["cost5y"]["now"] for u in gencos)),
        },
        "effPrice": effprice,
        "history": history,
        "historyInsights": {
            "phase3AvgSurplus": num(np.mean(p3)),
            "maxSurplus": max(history, key=lambda h: h["surplus"]),
            "bankStart2026": num(now[now["연도"] == 2026]["이월잔고_연초"].sum()),
        },
        "ranges": ranges,
    }


# ─────────────────────────── 실행 ───────────────────────────
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", type=Path, default=ROOT / "data-pipeline" / "raw")
    ap.add_argument("--out", type=Path, default=ROOT / "public" / "data")
    a = ap.parse_args()

    d = load(a.raw)
    units = build_units(d["M"])
    detail = build_unit_detail(units, d["M"])
    article = build_article(d, units)

    unit_dir = a.out / "unit"
    for old in unit_dir.glob("*.json"):
        old.unlink()
    sizes = [write_json(unit_dir / f"{k}.json", v) for k, v in detail.items()]
    print(f"units.json      {write_json(a.out / 'units.json', pack_units(units)) / 1024:7.1f} KB  ({len(units)}단위)")
    print(f"unit/*.json     {np.mean(sizes) / 1024:7.1f} KB 평균, 최대 {max(sizes) / 1024:.1f} KB  ({len(sizes)}개)")
    print(f"article.json    {write_json(a.out / 'article.json', article) / 1024:7.1f} KB")


if __name__ == "__main__":
    main()
