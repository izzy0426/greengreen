"""가공 JSON이 하이파이 화면 숫자와 같은지 확인 (명세서 11장 수용 기준 3번).

    python data-pipeline/check_json.py

CSV가 아니라 public/data/의 JSON을 읽는다 → 화면이 실제로 받는 값을 검사.
반올림은 하이파이 표기 자릿수에 맞춘다. 하이파이와 다른 값은 FAIL 대신 '하이파이 확인 필요'로 따로 모아 보여 준다.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "public" / "data"
PK = ["low", "now", "high", "max"]


def load():
    packed = json.loads((DATA / "units.json").read_text(encoding="utf-8"))
    cols = packed["columns"]
    units = []
    for row in packed["rows"]:
        u = {}
        for c, v in zip(cols, row):
            u[c] = dict(zip(packed["priceKeys"], v)) if isinstance(v, list) else v
        units.append(u)
    article = json.loads((DATA / "article.json").read_text(encoding="utf-8"))
    return units, article


def main() -> int:
    units, A = load()
    by_name = {u["name"]: u for u in units}
    fails, notes = [], []

    def eq(label, got, want):
        ok = got == want
        print(f"{'OK  ' if ok else 'FAIL'} {label}: {got} (하이파이 {want})")
        if not ok:
            fails.append(label)

    def hifi_diff(label, got, hifi):
        mark = "OK  " if got == hifi else "NOTE"
        print(f"{mark} {label}: 데이터 {got} / 하이파이 {hifi}")
        if got != hifi:
            notes.append(f"{label}: 데이터 {got}, 하이파이 {hifi}")

    print("── 사용자 지정 확인 항목")
    eq("5년 탄소비용(지금 가격, 조 원)", round(A["hero"]["cost5yNow"] / 1e12, 1), 11.8)
    eq("발전 비용 몫(%)", round(A["hero"]["powerCostShare"] * 100), 72)
    eq("2030 부족 단위(곳)", A["hero"]["shortUnits2030"], 518)
    eq("한국남동발전 5년 비용(조 원)", round(by_name["한국남동발전"]["cost5y"]["now"] / 1e12, 2), 1.94)
    g = A["grades2030"]["now"]
    eq("등급 KPI 고위험(①+②)", g["loss"] + g["high"], 78)
    eq("등급 KPI 중위험", g["mid"], 29)
    eq("등급 KPI 저위험", g["low"], 247)
    eq("등급 KPI 비용 없음+재무 없음", g["none"] + g["nofin"], 404)

    print("── 구조")
    eq("단위 수", len(units), 758)
    eq("units 5년 비용 합 = article 합(원)", sum(u["cost5y"]["now"] for u in units) // 10**6, A["hero"]["cost5yNow"] // 10**6)
    eq("unit 파일 수", len(list((DATA / "unit").glob("*.json"))), 758)
    nofin_ok = all(u["grade2030"][p] == "nofin" for u in units if u["excludeReason"] for p in PK)
    eq("재무 없음 단위는 등급 nofin", nofin_ok, True)
    nam = by_name["한국남동발전"]
    d = json.loads((DATA / "unit" / f"{nam['key']}.json").read_text(encoding="utf-8"))
    eq("남동 unit 파일 5년 cost 합 = units.json (반올림 ±5원)", abs(sum(r["cost"] for r in d["years"]["now"]) - nam["cost5y"]["now"]) <= 5, True)

    print("── 01 아티클 (하이파이 표기)")
    eq("발전 배출 비중(%)", round(A["hero"]["powerEmisShare"] * 100), 33)
    eq("가격별 5년 비용(조)", [round(sum(r["cost"] for r in A["yearly"][p]) / 1e12, 1) for p in PK], [7.0, 11.8, 23.3, 32.2])
    eq("2030 구매 압력(백만 t)", round(A["purchasePressure2030"] / 1e6, 1), 89.5)
    eq("상위 10곳 몫(%)", round(A["concentration"]["top10Share"] * 100), 76)
    eq("상위 10곳 중 발전", A["concentration"]["top10PowerCount"], 7)
    eq("발전 공기업 5곳 5년 비용(조)", round(A["concentration"]["gencos5Cost5y"] / 1e12, 1), 7.1)
    eq("적자 전환 기준 단위", A["turnsLoss"]["base"], 584)
    eq("2030 적자 전환(가격 4)", [A["turnsLoss"]["byYear"][p][-1] for p in PK], [1, 10, 26, 32])
    eq("2030 적자 전환 중 발전(지금)", A["turnsLoss"]["bySector2030"]["now"].get("발전", 0), 6)
    eq("2030 등급 6종(지금)", [g[k] for k in ["loss", "high", "mid", "low", "none", "nofin"]], [48, 30, 29, 247, 230, 174])
    eq("3차 평균 남는 배출권(백만 t)", round(A["historyInsights"]["phase3AvgSurplus"] / 1e6, 1), 22.3)
    eq("2026 초 이월 잔고(백만 t)", round(A["historyInsights"]["bankStart2026"] / 1e6, 1), 106.0)
    eq("2030 실효가격 전체/발전/발전 외(원)",
       [A["effPrice"][k][-1]["rule4"] for k in ["전체", "발전", "발전 외"]], [7515, 18007, 2598])
    top = [(t["name"], round(t["cost5y"] / 1e12, 2), None if t["riskAvg"] is None else round(t["riskAvg"] * 100))
           for t in A["concentration"]["top10"]]
    eq("TOP 10 비용(조)", [t[1] for t in top], [1.94, 1.53, 1.36, 1.23, 1.03, 0.68, 0.46, 0.35, 0.18, 0.18])
    eq("TOP 10 위험도(%)", [t[2] for t in top], [92, 65, 70, 83, 44, 88, None, 45, 6, 12])
    sec = {s["sector"]: s for s in A["sectors"]}
    eq("업종 비용(조, 발전·집단에너지·정유·석유화학·통신IT·건물·철강)",
       [round(sec[s]["cost5y"]["now"] / 1e12, 2) for s in ["발전", "집단에너지", "정유", "석유화학", "통신·IT", "건물", "철강"]],
       [8.50, 0.73, 0.50, 0.47, 0.27, 0.22, 0.16])
    eq("철강 배출→비용 비중(%)", [round(sec["철강"]["emisShare"] * 100, 1), round(sec["철강"]["costShare"]["now"] * 100, 1)], [18.8, 1.4])

    G = A["glance"]
    eq("한눈에 KPI: 2030 배출·2026 배출·변화(%)", [round(G["emis2030"] / 1e6, 1), round(G["emis2026"] / 1e6, 1), round(G["emisChange"] * 100, 1)], [457.0, 528.7, -13.6])
    eq("한눈에 KPI: 총량 넘는 배출 2030·사전할당·5년(백만 t)", [round(G["gapTotal2030"] / 1e6, 1), round(G["preAlloc2030"] / 1e6, 1), round(G["gapTotal5y"] / 1e6, 1)], [20.9, 436.1, 86.3])
    eq("한눈에 KPI: 5년 구매량(백만 t)", round(G["purchase5y"] / 1e6, 1), 403.7)
    eq("Q2 인사이트: 2030 실제 부담/시장가(%)·발전(%)", [round(A["effPrice"]["전체"][-1]["shareOfMarket"] * 100, 1), round(A["effPrice"]["발전"][-1]["shareOfMarket"] * 100)], [25.1, 60])
    eq("Q2: 3차 규칙 2030(원)", A["effPrice"]["전체"][-1]["rule3"], 1471)

    eq("발전 유상 비율 2026→2030(%)", [round(A["powerPaidRatio"]["2026"] * 100), round(A["powerPaidRatio"]["2030"] * 100)], [15, 50])
    eq("TOP 1 2030 위험도(배)", round(A["concentration"]["top10"][0]["risk2030"], 1), 1.2)

    print("── 04 한국남동발전 (하이파이 표기)")
    yn = {r["year"]: r for r in d["years"]["now"]}
    eq("2030 위험도(%)", round(yn[2030]["risk"] * 100), 124)
    eq("연도별 비용(억 원)", [round(yn[y]["cost"] / 1e8) for y in range(2026, 2031)], [1798, 3719, 4058, 4604, 5201])
    eq("2030 사야 할 양(백만 t)", round(yn[2030]["shortfall"] / 1e6, 1), 17.3)
    eq("2030 배출·무상할당(백만 t)", [round(yn[2030]["emis"] / 1e6, 1), round(yn[2030]["freeAlloc"] / 1e6, 1)], [24.6, 7.3])
    eq("무상할당 2026(백만 t)", round(yn[2026]["freeAlloc"] / 1e6, 1), 17.8)
    eq("2026 이월 사용(백만 t)", round(yn[2026]["bankUse"] / 1e6, 2), 2.99)
    eq("2030 반영 후 이익률(%)", round(yn[2030]["marginAfter"] * 100, 1), -1.4)
    eq("가격별 5년 비용(조)", [round(sum(r["cost"] for r in d["years"][p]) / 1e12, 2) for p in PK], [1.16, 1.94, 3.80, 5.23])
    # 점 그래프는 위험도가 있는 단위(영업이익 > 0)만 찍힘 → 재무 있는 발전 29곳 중 영업이익 적자 2곳 제외 = 27
    gen = sorted([u for u in units if u["sector"] == "발전" and u["risk2030"]["now"] is not None], key=lambda u: -u["risk2030"]["now"])
    eq("위험도 있는 발전 단위 수", len(gen), 27)
    eq("발전 안 위험도 순위", 1 + [u["name"] for u in gen].index("한국남동발전"), 4)

    w = d["why"]
    eq("왜: 무상할당 2026→2030(백만 t, %)", [round(w["freeAlloc"]["start"] / 1e6, 1), round(w["freeAlloc"]["end"] / 1e6, 1), round(w["freeAlloc"]["change"] * 100)], [17.8, 7.3, -59])
    eq("왜: 유상 비율(%)", [round(w["paidRatio"]["start"] * 100), round(w["paidRatio"]["end"] * 100)], [15, 50])
    eq("왜: 배출(백만 t, %)", [round(w["emis"]["start"] / 1e6, 1), round(w["emis"]["end"] / 1e6, 1), round(w["emis"]["change"] * 100)], [29.1, 24.6, -15])
    eq("왜: 이월 잔고 다 쓴 해", w["bank"]["emptyYear"], 2026)
    eq("KPI 5년 구매량(백만 t)", round(sum(r["purchase"] for r in d["years"]["now"]) / 1e6, 1), 66.8)
    eq("KPI 2030 무상할당·2025 무상할당(백만 t)", [round(yn[2030]["freeAlloc"] / 1e6, 2), round(yn[2030]["freeAlloc2025"] / 1e6, 1)], [7.27, 20.0])
    eq("KPI 2030 실효가격(원)·시장가 대비(%)", [round(yn[2030]["effPrice"]), round(yn[2030]["effPriceRatio"] * 100)], [21132, 70])
    eq("5년 비용 순위", nam["rank5y"], 1)
    eq("2025→2030 무상할당 변화(%)", round(w["freeAlloc"]["changeFrom2025"] * 100), -64)
    eq("매출·영업이익(조, 억)", [round(nam["revenue3y"] / 1e12, 2), round(nam["opProfit3y"] / 1e8)], [7.06, 4211])

    print("── 하이파이와 다른 값 (데이터 기준으로 화면을 그림)")
    hifi_diff("2015~2025 순할당−배출(백만 t)", [round(h["surplus"] / 1e6, 1) for h in A["history"]],
              [-22.2, -41.9, -46.5, -45.8, -35.1, 1.4, 0.4, 20.1, 45.3, 38.4, 7.4])
    hifi_diff("비용 생기는 단위 / 전체", f"{A['concentration']['unitsWithCost']} / {len(units)}", "507 / 757")
    hifi_diff("남동 2026 배출(백만 t)", round(yn[2026]["emis"] / 1e6, 1), 29.1)

    print(f"\n결과: FAIL {len(fails)}건, 하이파이 확인 필요 {len(notes)}건")
    for n in notes:
        print("  -", n)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
