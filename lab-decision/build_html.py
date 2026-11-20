"""lab.html 한 파일 만들기 — 화면 코드(src/)와 데이터(data.json)·그림(img/)·폰트를 한 파일에 넣는다.

    python lab-decision/build_html.py
그림은 img/{office,business,climate,household,secretary,good,s2}.png|webp 가 있으면 webp로 바꿔 넣고, 없으면 화면이 '그림 자리'를 그린다.
"""
import base64
import io
import json
import re
from pathlib import Path

from fontTools import subset
from PIL import Image

HERE = Path(__file__).parent
ROOT = HERE.parent
SRC = HERE / "src"
NAMES = ["office", "business", "climate", "household", "secretary", "good", "s2"]
MAXW = {"secretary": 256}


def image_b64(name: str):
    for ext in ("png", "webp", "jpg"):
        p = HERE / "img" / f"{name}.{ext}"
        if p.exists():
            im = Image.open(p).convert("RGB")
            w = MAXW.get(name, 1376)
            if im.width > w:
                im = im.resize((w, round(im.height * w / im.width)), Image.NEAREST)
            buf = io.BytesIO()
            im.save(buf, "WEBP", quality=86, method=6)
            return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    if name == "s2":  # 사이트 장면 그림 재사용
        p = ROOT / "public" / "scenes" / "scene-s2.webp"
        return "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode()
    return None


def font_css(text: str) -> str:
    src = ROOT / "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2"
    chars = set(text) | set("0123456789,.%+−-→·()/:~ ①②③④ABCabc")
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    f = subset.load_font(str(src), opts)
    s = subset.Subsetter(opts)
    s.populate(text="".join(sorted(chars)))
    s.subset(f)
    buf = io.BytesIO()
    subset.save_font(f, buf, opts)
    b64 = base64.b64encode(buf.getvalue()).decode()
    return ("@font-face{font-family:'Pretendard Variable';font-weight:45 920;font-style:normal;font-display:swap;"
            f"src:url(data:font/woff2;base64,{b64}) format('woff2-variations')}}")


def main():
    html = (SRC / "index.html").read_text(encoding="utf-8")
    style = (SRC / "style.css").read_text(encoding="utf-8")
    content = (SRC / "content.js").read_text(encoding="utf-8")
    app = (SRC / "app.js").read_text(encoding="utf-8")
    data = json.loads((HERE / "data.json").read_text(encoding="utf-8"))
    imgs = {n: v for n in NAMES if (v := image_b64(n))}
    missing = [n for n in NAMES if n not in imgs]
    text = html + content + app + "임기성적표결말균형을찾은장관과감한개혁기업편에선숙제를남긴신중한"
    out = (html.replace("/*FONT*/", font_css(text))
           .replace("/*STYLE*/", style)
           .replace("/*DATA*/", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
           .replace("/*IMAGES*/", json.dumps(imgs))
           .replace("/*CONTENT*/", content)
           .replace("/*APP*/", app))
    assert "</script" not in json.dumps(data)
    (HERE / "lab.html").write_text(out, encoding="utf-8")
    print(f"lab.html {len(out.encode()) / 1024:.0f} KB · 그림 {len(imgs)}개" + (f" · 없는 그림: {', '.join(missing)}" if missing else ""))


if __name__ == "__main__":
    main()
