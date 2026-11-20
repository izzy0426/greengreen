"""기업 페이지 숫자 검증 — 원본 페이지 JS와 같은 식으로 다시 계산해 요청서의 기대값과 맞춘다."""
import json
from pathlib import Path

D = json.loads((Path(__file__).parent.parent / "public/data/companies.json").read_text(encoding="utf-8"))
CO = [u for u in D if u["h"] or u["p"]]


def e25(u):
    h = u["h"].get("2025")
    return h[1] if h and h[1] is not None and h[0] > 0 else -1


def r3(u):
    A = E = n = 0
    for y in range(2021, 2026):
        h = u["h"].get(str(y))
        if h and h[0] > 0 and h[1] is not None:
            A += h[0]; E += h[1]; n += 1
    return E / A if n == 5 else None


for u in CO:
    u["_e"], u["_r"] = e25(u), r3(u)
ranked = sorted([u for u in CO if u["_e"] >= 0], key=lambda u: -u["_e"])
tot = sum(u["_e"] for u in ranked)
fails = 0


def check(name, got, want):
    global fails
    ok = got == want
    fails += not ok
    print(("OK  " if ok else "FAIL"), name, got, "기대", want)


check("KPI 단위 수", len(ranked), 712)
check("상위10 비중", round(sum(u["_e"] for u in ranked[:10]) / tot * 100, 1), 50.6)
check("상위50 비중", round(sum(u["_e"] for u in ranked[:50]) / tot * 100, 1), 79.0)
check("배출 합계", round(tot / 1e6, 1), 529.8)
se = {}
for u in ranked:
    se[u["s"]] = se.get(u["s"], 0) + u["_e"]
top = max(se.items(), key=lambda x: x[1])
check("업종 1위", (top[0], round(top[1] / 1e6, 1)), ("발전", 175.2))
g = {"a": 0, "b": 0, "x": 0}
for u in ranked:
    f = u.get("f")
    g["x" if not f else ("a" if sum(f["b"]) == 0 else "b")] += u["_e"]
check("구매 필요 비중", tuple(round(g[k] / tot * 100, 1) for k in "abx"), (38.9, 60.8, 0.3))
p = next(u for u in CO if u["id"] == "포스코")
h = p["h"]["2025"]
check("포스코 2025 배출/할당/이월(만 t)", tuple(round(h[i] / 1e4) for i in (1, 0, 2)), (6986, 7362, 1181))
check("포스코 3차 비율", round(p["_r"] * 100), 95)
meds = sorted(u["_r"] for u in CO if u["_r"] is not None and u["s"] == "철강")
check("철강 중앙값·곳", (round(meds[len(meds) // 2] * 100), len(meds)), (89, 42))
check("포스코 재무", (p["fin"]["S"], p["fin"]["O"], p["fin"]["r"]), (387978, 30054, 7.7))
check("포스코 2030 예측/할당(만 t)", (round(p["f"]["e"][4] / 1e4), round(p["p"]["2030"][0] / 1e4)), (5524, 6035))
print("FAIL", fails)
raise SystemExit(1 if fails else 0)
