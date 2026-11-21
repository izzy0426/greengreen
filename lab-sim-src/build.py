"""실험실 페이지 — 팀원 아티팩트 '내가 그린 GREEN 그림 · 실험실'(index.html, lab.json)을 사이트에 넣는다.

    python3 lab-sim-src/build.py   →  public/lab-sim/{index.html, lab.json, pretendard.woff2}

원본은 그대로 두고 아래만 바꾼다 (계산 코드·화면은 손대지 않음).
  1) 헤더: 사이트 헤더(배출권 길라잡이 · 아티클/기업/실험실, 실험실 활성)
  2) 푸터: 사이트 푸터 문구
  3) lab.json 주소: 상대 → /lab-sim/lab.json  (주소 /lab 에서 열려도 찾게)
  4) 폰트: 사이트 Pretendard에서 이 페이지 글자만 뽑은 서브셋
  5) 밝은 테마 고정 (사이트에 다크 모드가 없음)
"""
import io
import re
from pathlib import Path

from fontTools import subset

HERE = Path(__file__).parent
ROOT = HERE.parent
OUT = ROOT / "public" / "lab-sim"

HEADER = '''<header class="hdr">
  <div class="wrap">
    <a class="logo" href="/"><i><svg width="18" height="18"><use href="#i-leaf"/></svg></i><span>배출권 길라잡이</span></a>
    <nav class="gnb site-tabs" aria-label="주 메뉴"><a href="/">아티클</a><a href="/company">기업</a><a href="/lab" aria-current="page">실험실</a></nav>
  </div>
</header>'''

FOOTER = '''<footer><div class="wrap site-foot"><div><div class="lg">배출권 길라잡이</div><p style="margin-top:8px">한국 배출권거래제 데이터 안내. 4차(2026–2030) 수치는 시나리오 분석 결과.</p></div>
<div><h4>자료</h4><ul><li>온실가스종합정보센터 배출량·할당·인증 실적</li><li>제1~4차 배출권 할당계획</li><li>KRX 배출권 시세 · DART 공시</li></ul></div>
<div><h4>바로가기</h4><ul><li><a href="/">아티클</a></li><li><a href="/company">기업별 배출 조회</a></li><li><a href="/lab">실험실</a></li></ul></div></div></footer>'''

SITE_CSS = '''
/* 사이트 헤더·푸터 (배출권 길라잡이) */
body{margin:0}
.hdr .wrap{position:relative;max-width:1440px;padding-left:max(18px,env(safe-area-inset-left,0px));padding-right:max(18px,env(safe-area-inset-right,0px))}
@media (min-width:1280px){.hdr .wrap{padding-left:120px;padding-right:120px}}
.site-tabs{position:absolute;left:50%;top:0;transform:translateX(-50%);margin:0}
.site-tabs a{position:relative;display:flex;align-items:center;height:100%;padding:0 32px;font-weight:700;font-size:15.5px;color:var(--muted);text-decoration:none}
.site-tabs a::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;background:var(--green);transform:scaleX(0);transition:transform .25s}
.site-tabs a:hover,.site-tabs a[aria-current="page"]{color:var(--ink)}
.site-tabs a:hover::after,.site-tabs a[aria-current="page"]::after{transform:scaleX(1)}
@media (max-width:1023px){.site-tabs{position:static;transform:none;margin-left:auto}.site-tabs a{padding:0 16px}}
@media (max-width:640px){.site-tabs a{padding:0 12px;font-size:14.5px}}
footer a{color:inherit;text-decoration:none}footer a:hover{color:#fff;text-decoration:underline}
'''


def font(text: str) -> bytes:
    src = ROOT / "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2"
    o = subset.Options()
    o.flavor = "woff2"
    o.layout_features = ["*"]
    f = subset.load_font(str(src), o)
    s = subset.Subsetter(o)
    s.populate(text="".join(sorted(set(text) | set("0123456789,.%+−-→·()/:~ "))))
    s.subset(f)
    b = io.BytesIO()
    subset.save_font(f, b, o)
    return b.getvalue()


def main():
    html = (HERE / "index.html").read_text(encoding="utf-8")
    data = (HERE / "lab.json").read_text(encoding="utf-8")

    def sub(pat, rep, s, n=1, flags=re.S):
        s2, k = re.subn(pat, rep, s, count=n, flags=flags)
        assert k == n, pat
        return s2

    html = sub(r'<!DOCTYPE html>', '<!DOCTYPE html>\n<html lang="ko" data-theme="light">', html)
    html = sub(r'<title>.*?</title>', '<title>실험실 · 내가 그린 GREEN 그림 · 배출권 길라잡이</title>\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">', html)
    html = sub(r'url\("fonts/PretendardVariable\.subset\.woff2"\) format\("woff2-variations"\),url\("fonts/PretendardVariable\.subset\.woff2"\) format\("woff2"\)',
               'url("/lab-sim/pretendard.woff2") format("woff2-variations"),url("/lab-sim/pretendard.woff2") format("woff2")', html)
    html = sub(r'(@media \(prefers-color-scheme: dark\)\{:root:not\(\[data-theme="light"\]\)\{)', r'\1', html)  # data-theme=light로 꺼짐
    html = sub(r'<header class="hdr">.*?</header>', HEADER, html)
    html = sub(r'<footer>.*?</footer>', FOOTER, html)
    html = sub(r'fetch\("lab\.json"\)', 'fetch("/lab-sim/lab.json")', html)
    html = sub(r'</style>', SITE_CSS + '</style>', html)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.html").write_text(html, encoding="utf-8")
    (OUT / "lab.json").write_text(data, encoding="utf-8")
    fb = font(html + data)
    (OUT / "pretendard.woff2").write_bytes(fb)
    print(f"index.html {len(html.encode())//1024} KB · lab.json {len(data.encode())//1024} KB · 폰트 {len(fb)//1024} KB")


if __name__ == "__main__":
    main()
