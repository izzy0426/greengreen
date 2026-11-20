/* 실험실 '장관님, 결재해 주세요!' — 화면 코드
   숫자: #lab-data (팀 계산엔진 36개 조합), 문구: LAB_CONTENT, 그림: #lab-images */
(function () {
  'use strict'
  var DATA = JSON.parse(document.getElementById('lab-data').textContent)
  var IMG = JSON.parse(document.getElementById('lab-images').textContent)
  var C = window.LAB_CONTENT
  var D = C.decisions
  var BASE_PICK = [1, 0, 0] // 원안: 3만 원 · 예측대로 · 지금 규칙
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var $ = function (s, r) { return (r || document).querySelector(s) }
  var app = $('#app')

  var st
  function reset() {
    st = { screen: 'intro', step: 0, pick: [null, null, null], sel: BASE_PICK.slice(), decided: false }
  }

  // ── 숫자 ──
  var key = function (p) { return '' + (p[0] + 1) + (p[1] + 1) + (p[2] + 1) }
  var combo = function (p) { return DATA.combos[key(p)] }
  var base = DATA.combos[DATA.base]
  var cur = function () { return st.pick.map(function (v, i) { return v == null ? BASE_PICK[i] : v }) }
  var nf = function (v, d) { return Number(v).toLocaleString('ko-KR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }) }
  var jo = function (won, d) { return nf(won / 1e12, d == null ? 1 : d) + '조' }
  var mt = function (t) { return nf(t / 1e6, 1) + '백만 t' }
  var pct = function (x) { var v = Math.round(x * 1000) / 10; return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + '%' }
  var gon = function (n) { return nf(n) + '곳' }
  var won = function (v) { return nf(Math.round(v)) + '원' }
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }

  function ctx(p, from) {
    var c = combo(p), f = combo(from)
    var carry = [0, 1, 2].map(function (k) { var q = p.slice(); q[2] = k; return combo(q).cost5y })
    var spread = Math.ceil((Math.max.apply(null, carry) - Math.min.apply(null, carry)) / 1e11) / 10
    return {
      cost: jo(c.cost5y), cost2: jo(c.cost5y, 2), costFrom: jo(f.cost5y), turn: gon(c.turnLoss2030), turnFrom: gon(f.turnLoss2030),
      emis: mt(c.emis2030), meter: pct(c.meter), meterAbs: nf(Math.abs(c.meter) * 100, 1) + '%', spread: nf(spread, 1) + '조',
    }
  }
  var fill = function (s, x) { return s.replace(/\{(\w+)\}/g, function (_, k) { return x[k] != null ? x[k] : '' }) }

  function optLine(d, i) {
    var p = cur(); p[st.step] = i
    var c = combo(p)
    var t = D[d].options[i].line
    if (t === 'cost-turn') return '5년 비용 ' + jo(c.cost5y) + ' · 적자 ' + gon(c.turnLoss2030)
    if (t === 'emis') return '2030 배출 ' + mt(c.emis2030) + ' · 총량 대비 ' + pct(c.meter) + ' · 5년 ' + jo(c.cost5y)
    return '5년 비용 ' + jo(c.cost5y, 2)
  }

  // ── 그림 ──
  function img(name, alt, cls) {
    var src = IMG[name]
    if (!src) {
      var label = { office: '집무실', business: '경제단체 항의', climate: '시민단체 시위', household: '가계 전기요금', secretary: '비서', good: '좋은 결과', s2: '배출 장면 S2' }[name] || name
      src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 688 384"><rect width="688" height="384" fill="#e8f4ec"/><text x="344" y="200" font-family="sans-serif" font-size="28" fill="#61736a" text-anchor="middle">그림 자리 · ' + label + '</text></svg>')
    }
    return '<img class="px ' + (cls || '') + '" src="' + src + '" alt="' + esc(alt || '') + '">'
  }
  function talk(text, mini) {
    return '<div class="talk' + (mini ? ' talk--mini' : '') + '"><div class="talk__face">' + img('secretary', '김주무관') + '</div>' +
      '<div class="bubble" role="status"><b>김주무관</b><p>' + esc(text) + '</p></div></div>'
  }

  // ── 위쪽 숫자 ──
  function stats(flash) {
    var p = cur(), c = combo(p), any = st.pick.some(function (v) { return v != null })
    var cmp = function (v, b, f) { return !any ? '원안' : v === b ? '원안 그대로' : '원안 ' + f(b) }
    var cls = function (v, b) { return v > b ? 'up' : v < b ? 'down' : '' }
    var doneN = st.pick.filter(function (v) { return v != null }).length
    var step = st.screen === 'report' ? '완료' : (st.step + 1) + ' / 3' + (st.decided ? ' 완료' : '')
    return '<div class="stats' + (flash ? ' flashing' : '') + '" aria-live="polite">' +
      '<div><div class="k">결재</div><div class="v"><b>' + step + '</b><small>' + doneN + '건 결재함</small></div></div>' +
      '<div' + (flash ? ' class="flash"' : '') + '><div class="k">2030 배출 · 4차 총량 대비</div><div class="v"><b class="' + cls(c.meter, 0) + '">' + pct(c.meter) + '</b><small>' + cmp(c.meter, base.meter, pct) + '</small></div></div>' +
      '<div' + (flash ? ' class="flash"' : '') + '><div class="k">5년 탄소비용</div><div class="v"><b class="' + cls(c.cost5y, base.cost5y) + '">' + jo(c.cost5y) + ' 원</b><small>' + cmp(c.cost5y, base.cost5y, function (v) { return jo(v) }) + '</small></div></div>' +
      '<div' + (flash ? ' class="flash"' : '') + '><div class="k">적자로 돌아서는 곳 (2030년)</div><div class="v"><b class="' + cls(c.turnLoss2030, base.turnLoss2030) + '">' + gon(c.turnLoss2030) + '</b><small>' + cmp(c.turnLoss2030, base.turnLoss2030, gon) + '</small></div></div>' +
      '</div>'
  }

  // ── ① 시작 ──
  function renderIntro() {
    app.innerHTML = '<section class="intro" aria-labelledby="intro-h">' + img('office', '장관 집무실. 서류 더미 뒤에 장관이 앉아 있고 비서가 서류를 들고 들어온다') +
      '<div class="intro__card"><h1 id="intro-h">' + esc(C.intro.title) + '</h1><p>' + esc(C.intro.sub) + '</p>' +
      '<button class="btn btn--sun" id="start">집무 시작</button></div>' + talk(C.intro.say) + '</section>'
    $('#start').addEventListener('click', function () { st.screen = 'decide'; render(); focusOpts() })
  }

  // ── 결재 ──
  function renderDecide(flash) {
    var d = D[st.step], i = st.sel[st.step], r = d.react[i]
    var from = cur()
    var p = cur(); p[st.step] = i
    var x = ctx(p, from)
    if (st.decided) x = ctx(cur(), (function () { var q = cur(); q[st.step] = BASE_PICK[st.step]; return q })())
    var opts = d.options.map(function (o, k) {
      return '<li class="opt" role="radio" tabindex="' + (k === i ? 0 : -1) + '" aria-checked="' + (k === i) + '"' + (st.decided ? ' aria-disabled="true"' : '') + ' data-k="' + k + '">' +
        '<span class="opt__dot" aria-hidden="true"></span><span><b>가안 ' + '①②③④'[k] + ' ' + esc(o.label) + (o.base ? '<em>원안</em>' : '') + '</b><small>' + optLine(st.step, k) + '</small></span></li>'
    }).join('')
    var seals = ['담당', '과장', '국장'].map(function (n) { return '<div><span>' + n + '</span><i class="seal" aria-hidden="true">인</i></div>' }).join('') +
      (st.decided ? '<div><span>장관</span><i class="seal seal--me">결재</i></div>' : '<div class="wait"><span>장관</span><span class="sr">결재 전</span></div>')
    var news = st.decided ? fill(r.news, x) : fill(r.preview, x)
    var label = st.decided ? '속보 · 결재 ' + (st.step + 1) + ' 직후' : '미리 보기 · 가안 ' + '①②③④'[i] + ['을', '를', '을', '를'][i] + ' 결재하면'
    var tag = r.tag ? '<span class="tag tag--ref">' + r.tag + '</span>' : st.decided ? '<span class="tag">속보</span>' : '<span class="tag tag--pre">예상</span>'
    var last = st.step === 2
    app.innerHTML = stats(flash) +
      '<div class="desk">' +
      '<article class="doc card" aria-labelledby="doc-h">' +
      '<p class="doc__meta">기후에너지정책과 · 결재 ' + d.no + '</p>' +
      '<div class="doc__head"><h2 id="doc-h">' + d.title.map(esc).join('<br>') + '</h2><div class="sign" aria-label="결재란">' + seals + '</div></div>' +
      '<p class="doc__desc">' + esc(d.desc) + '</p>' +
      '<ul class="opts" role="radiogroup" aria-labelledby="doc-h">' + opts + '</ul>' +
      '<div class="doc__act">' + (st.decided
        ? '<button class="btn btn--green" id="next">' + (last ? '임기 성적표 받기' : '다음 결재안 받기') + ' →</button>'
        : '<button class="btn btn--sun" id="sign">가안 ' + '①②③④'[i] + ['으로', '로', '으로', '로'][i] + ' 결재</button><span class="note">방향키로 고르고 Enter로 결재</span>') + '</div>' +
      '<p class="doc__src">' + esc(d.src) + '</p>' +
      (st.decided ? '<div class="bigstamp" aria-hidden="true"><b>결재</b><small>기후에너지부 장관</small></div>' : '') +
      '</article>' +
      '<div class="side">' +
      '<div class="scene"><span class="scene__label' + (st.decided ? ' is-news' : '') + '">' + label + '</span>' + img(r.img, r.event) + '</div>' +
      '<div class="news card">' + tag + '<p>' + esc(news) + '</p></div>' +
      '<div class="chips">' + r.chips.map(function (c) { return '<div class="chip card"><i class="dot-' + c[2] + '" aria-hidden="true"></i><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></div>' }).join('') + '</div>' +
      '<p class="note">' + (r.note ? esc(r.note) + ' ' : '') + '장면과 뉴스 문구는 연출이에요. 숫자만 엔진 결과예요.</p>' +
      talk(st.decided ? r.say : d.ask) +
      '</div></div>'
    bindDecide()
  }

  function choose(k) {
    if (st.decided) return
    st.sel[st.step] = k
    renderDecide()
    var el = app.querySelector('.opt[data-k="' + k + '"]'); if (el) el.focus()
  }
  function sign() {
    if (st.decided) return
    st.pick[st.step] = st.sel[st.step]
    st.decided = true
    renderDecide(!REDUCED)
    var b = $('#next'); if (b) b.focus()
  }
  function next() {
    if (st.step < 2) { st.step++; st.decided = false; render(); focusOpts() }
    else { st.screen = 'report'; location.hash = 'r=' + key(cur()); render() }
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' })
  }
  function focusOpts() { var el = app.querySelector('.opt[tabindex="0"]'); if (el) el.focus({ preventScroll: true }) }
  function bindDecide() {
    app.querySelectorAll('.opt').forEach(function (el) {
      el.addEventListener('click', function () { choose(+el.dataset.k) })
      el.addEventListener('keydown', function (e) {
        var n = D[st.step].options.length, k = +el.dataset.k
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); choose((k + 1) % n) }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); choose((k - 1 + n) % n) }
        else if (e.key === 'Enter') { e.preventDefault(); if (st.decided) next(); else { if (k !== st.sel[st.step]) choose(k); sign() } }
        else if (e.key === ' ') { e.preventDefault(); choose(k) }
      })
    })
    var s = $('#sign'); if (s) s.addEventListener('click', sign)
    var nx = $('#next'); if (nx) nx.addEventListener('click', next)
  }

  // ── ⑦ 성적표 ── 등급 기준은 decisions.md L1~L4
  function grades(c) {
    return {
      reduce: c.meter <= 0 ? 'A' : c.meter <= 0.05 ? 'B' : 'C',
      industry: c.turnLoss2030 < base.turnLoss2030 ? 'A' : c.turnLoss2030 <= base.turnLoss2030 * 2 ? 'B' : 'C',
      power: c.powerCost2030 <= base.powerCost2030 ? 'A' : c.powerCost2030 <= base.powerCost2030 * 2 ? 'B' : 'C',
      signal: c.effPrice2030 >= 15000 ? 'A' : c.effPrice2030 >= 5000 ? 'B' : 'C',
    }
  }
  function renderReport() {
    var p = cur(), c = combo(p), g = grades(c)
    var end = C.report.endings.filter(function (e) { return e.when(g) })[0].name
    var events = [0, 1, 2].map(function (k) {
      var r = D[k].react[p[k]]
      return '<li>' + img(r.img, r.event) + '<div><b>결재 ' + (k + 1) + ' 뒤</b><span>' + esc(r.event) + '</span></div></li>'
    }).join('')
    var cap = c.cap2030
    var gap = c.emis2030 - cap
    var row = function (color, name, lab, val, cmp, gr, extra) {
      return '<li><div class="nm"><i style="background:' + color + '" aria-hidden="true"></i>' + name + '</div>' +
        '<div><div class="lab">' + lab + extra + '</div><div class="val">' + val + '</div><div class="cmp">' + cmp + '</div></div>' +
        '<div class="grade g-' + gr + '" aria-label="등급 ' + gr + '">' + gr + '</div></li>'
    }
    app.innerHTML = stats() +
      '<div class="report">' +
      '<aside class="story card"><div class="story__img">' + img(g.reduce === 'A' ? 'good' : 'climate', g.reduce === 'A' ? '맑은 하늘 아래 풍력·태양광과 축제 분위기의 마을' : '광장에 모인 기후 행진') + '</div>' +
      '<div class="story__body"><h2>2030년, 장관님 임기 마지막 해</h2><p class="k">임기 동안 있었던 일</p><ul class="events">' + events + '</ul>' +
      '<p class="note" style="margin-top:8px">장면은 연출이에요.</p>' + talk(C.report.say) + '</div></aside>' +
      '<section class="sheet card" aria-labelledby="rep-h">' +
      '<h1 id="rep-h">장관 임기 성적표</h1><span class="done" aria-hidden="true">임기 종료</span>' +
      '<p class="sheet__sub">4차 배출권거래제 2026–2030 · 결말: <b>' + esc(end) + '</b></p>' +
      '<ul class="rows">' +
      row('var(--green)', '감축', '2030년 배출', mt(c.emis2030), '4차 총량 ' + mt(cap) + (gap <= 0 ? ' 안' : '보다 ' + mt(gap) + ' 많음'), g.reduce, '') +
      row('#8a857a', '산업', '적자로 돌아서는 곳 (2030년)', gon(c.turnLoss2030), '실제 4차 계획 ' + gon(base.turnLoss2030), g.industry, '') +
      row('#e0b33a', '전기요금', '발전 부문 2030년 탄소비용', jo(c.powerCost2030) + ' 원', '실제 4차 계획 ' + jo(base.powerCost2030) + ' 원 · 가구당 월 부담은 전가율 분석 전이라 확인 필요', g.power, '<span class="assume">가정</span>') +
      row('#7c5cc4', '감축 신호', '배출 1톤당 실제 부담 (2030년)', won(c.effPrice2030), '시장 가격(' + won(c.price2030) + ')의 ' + nf(c.effPrice2030 / c.price2030 * 100) + '% · 실제 4차 계획 ' + won(base.effPrice2030), g.signal, '') +
      '</ul>' +
      '<div class="total"><div><div class="k">5년 탄소비용</div><b>내 계획 ' + jo(c.cost5y) + ' 원</b></div><div class="real"><div class="k">&nbsp;</div><b>실제 4차 계획 ' + jo(base.cost5y) + ' 원</b></div></div>' +
      '<div class="acts"><button class="btn btn--sun" id="again">다시 결재하기</button><button class="btn btn--ghost" id="share">결과 공유하기</button><a class="btn btn--ghost" href="#company">우리 회사 청구서 보기</a></div>' +
      '<p class="legend-g">등급 기준 · 감축: 2030 배출이 4차 총량 안이면 A, 5% 이내 초과 B, 그 이상 C · 산업: 적자 전환이 실제 4차 계획보다 적으면 A, 2배 이하 B, 그 이상 C · ' +
      '전기요금: 발전 부문 2030 탄소비용이 실제 4차 계획 이하 A, 2배 이하 B, 그 이상 C · 감축 신호: 1톤당 실제 부담 1만 5천 원 이상 A, 5천 원 이상 B, 미만 C. ' +
      '실제 4차 계획 = 4차 할당계획 + 3만 원 + 예측대로 + 지금 이월 규칙(모든 결재 원안). 숫자: 팀 계산엔진(2026.11.18) 조합 ' + key(p) + '. 등급과 결말은 팀이 정하지 않아 임시 기준.</p>' +
      '</section></div>'
    $('#again').addEventListener('click', function () { history.replaceState(null, '', location.pathname + location.search); reset(); render(); window.scrollTo(0, 0) })
    $('#share').addEventListener('click', share)
  }
  function share() {
    var url = location.href.split('#')[0] + '#r=' + key(cur())
    var done = function () { toast('결과 주소를 복사했어요') }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, function () { fallback(url) })
    else fallback(url)
  }
  function fallback(url) {
    var t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select()
    try { document.execCommand('copy'); toast('결과 주소를 복사했어요') } catch (e) { toast(url) }
    t.remove()
  }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg
    document.body.appendChild(t); setTimeout(function () { t.remove() }, 2200)
  }

  function render() {
    if (st.screen === 'intro') renderIntro()
    else if (st.screen === 'decide') renderDecide()
    else renderReport()
  }
  function fromHash() {
    var m = /^#r=([1-4])([1-3])([1-3])$/.exec(location.hash)
    if (!m) return false
    st.pick = [+m[1] - 1, +m[2] - 1, +m[3] - 1]; st.sel = st.pick.slice(); st.screen = 'report'; st.step = 2; st.decided = true
    return true
  }
  reset(); fromHash(); render()
  window.addEventListener('hashchange', function () { if (fromHash()) render() })
})()
