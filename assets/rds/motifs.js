/* Redrawn Design System: motifs. Seeded, original generative art in the contact-sheet recipe:
   flat tiles, grid-filled circles and squares, overlapping translucent circles, drafting tools, contours, halftone, plan symbols.
   <div class="rds-art" data-rds-art="banner|strip|card|square" data-seed="any-string" data-topic="shade water" aria-hidden="true"></div>
   Same seed, same drawing. Live drift (colour, shape and icon shifts) runs only while the art is on screen and motion is allowed.
   API: RDSArt.render(el, {kind, seed, topic}), RDSArt.reroll(el). Documented in DESIGN.md "Motifs". */
(function () {
  'use strict';
  var doc = document, NS = 'http://www.w3.org/2000/svg';
  var script = doc.currentScript, SPRITE = script ? script.src.replace(/motifs\.js.*$/, 'icons/icons.svg') : '';
  var reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var uid = 0, narrow = window.matchMedia ? matchMedia('(max-width: 640px)') : { matches: false };

  /* ---------- seeded random ---------- */
  function hash(s) { var h = 1779033703 ^ s.length; for (var i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return function () { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0; }; }
  function Rng(seed) {
    var a = hash(String(seed))(), r = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    r.range = function (lo, hi) { return lo + r() * (hi - lo); };
    r.int = function (lo, hi) { return Math.floor(r.range(lo, hi + 1)); };
    r.pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
    r.shuffle = function (arr) { var o = arr.slice(); for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = o[i]; o[i] = o[j]; o[j] = t; } return o; };
    return r;
  }
  function f(n) { return Math.round(n * 10) / 10; }

  /* ---------- palette (tokens.css; art accents are decorative only) ---------- */
  var SAT = ['moss', 'slate', 'brick', 'ochre', 'sky', 'rose', 'kelly', 'peri'];
  var PALE = ['sand', 'sage', 'blush', 'raised'];
  var VAR = { moss: '--moss-fill', slate: '--slate-fill', brick: '--brick-fill', ochre: '--ochre', sky: '--sky', rose: '--rose', kelly: '--kelly', peri: '--peri', sand: '--paper-sunk', sage: '--moss-tint', blush: '--brick-tint', raised: '--paper-raised', ink: '--ink-field', paper: '--paper' };
  function v(name) { return 'var(' + VAR[name] + ')'; }
  var TOPICS = [
    { re: /shade|tree|canopy|leaf|riparian/, fields: ['moss', 'kelly', 'sky', 'ochre'], motifs: ['plan', 'section', 'gridDisc', 'overlap', 'icon', 'contours'], icons: ['tree', 'leaf', 'shade'] },
    { re: /water|river|swale|rain|storm|permeable|impervious|bio/, fields: ['slate', 'sky', 'peri', 'moss'], motifs: ['contours', 'split', 'lines', 'protractor', 'gridDisc', 'icon'], icons: ['water', 'river', 'bioswale', 'permeable'] },
    { re: /heat|pavement|cool|asphalt|temperature/, fields: ['brick', 'rose', 'ochre', 'peri'], motifs: ['halftone', 'gridSquares', 'ruler', 'setsquare', 'icon', 'bars'], icons: ['heat', 'thermometer', 'pavement', 'sidewalk'] },
    { re: /soil|ground|volume/, fields: ['ochre', 'moss', 'brick', 'kelly'], motifs: ['bars', 'section', 'gridSquares', 'contours', 'icon', 'setsquare', 'hatch'], icons: ['soil', 'leaf', 'tree'] },
    { re: /equity|people|walk|quarter|sidewalk|corner|promise/, fields: ['rose', 'peri', 'sky', 'ochre'], motifs: ['overlap', 'split', 'lines', 'plan', 'pills', 'ledger', 'icon'], icons: ['sidewalk', 'pin', 'building', 'shade'] },
    { re: /valley|place|study|topanga|site/, fields: SAT, motifs: ['plan', 'section', 'contours', 'compass', 'gridDisc', 'icon', 'pills'], icons: ['pin', 'building', 'tree'] }
  ];
  function profile(topic) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].re.test(topic)) return TOPICS[i];
    return { fields: SAT, motifs: ['gridDisc', 'gridSquares', 'overlap', 'split', 'compass', 'protractor', 'setsquare', 'ruler', 'contours', 'halftone', 'plan', 'bars', 'lines', 'icon', 'pills', 'section', 'ledger', 'hatch'], icons: ['tree', 'water', 'heat', 'soil', 'pin', 'building', 'ruler'] };
  }
  var TOOLS = ['compass', 'protractor', 'setsquare', 'ruler'];
  var PAPER_KINDS = { compass: 1, protractor: 1, setsquare: 1, ruler: 0, plan: 1, lines: 1, halftone: 1, overlap: 1, pills: 1, section: 1, ledger: 1, hatch: 1 };

  /* ---------- helpers ---------- */
  function grid(id, size) { return '<pattern id="' + id + '" width="' + size + '" height="' + size + '" patternUnits="userSpaceOnUse"><path d="M' + size + ' 0H0V' + size + '" fill="none" stroke="var(--ink)" stroke-opacity=".5" stroke-width="1"/></pattern>'; }
  function paperGrid(id, size) { return '<pattern id="' + id + '" width="' + size + '" height="' + size + '" patternUnits="userSpaceOnUse"><path d="M' + size + ' 0H0V' + size + '" fill="none" stroke="var(--ink)" stroke-opacity=".16" stroke-width="1"/></pattern>'; }
  function ring(cx, cy, r, rnd, k) {
    var pts = [], n = 72, ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], am = [.10 + k * .004, .06, .035];
    for (var i = 0; i < n; i++) { var t = i / n * 6.2832, rr = r * (1 + am[0] * Math.sin(2 * t + ph[0]) + am[1] * Math.sin(3 * t + ph[1]) + am[2] * Math.sin(5 * t + ph[2])); pts.push(f(cx + rr * Math.cos(t)) + ' ' + f(cy + rr * .86 * Math.sin(t))); }
    return 'M' + pts.join('L') + 'Z';
  }

  /* ---------- motifs: (w, h, rnd, ctx) -> {svg, uses[], shift?} ; ctx.id() gives unique ids, ctx.col(exclude) gives a saturated colour ---------- */
  var M = {};
  M.gridDisc = function (w, h, rnd, c) {
    var g = c.id(), u = Math.min(w, h), a = c.col(), cx = w * rnd.range(.35, .65), cy = h * rnd.range(.45, .6), r = u * rnd.range(.28, .4), two = rnd() < .5, b = two ? c.col([a]) : a;
    var s = '<defs>' + grid(g, rnd.pick([8, 10, 12])) + '</defs>';
    s += '<g class="m-drift"><rect class="m-shape" data-r="' + f(r) + '" x="' + f(cx - r) + '" y="' + f(cy - r) + '" width="' + f(2 * r) + '" height="' + f(2 * r) + '" rx="' + f(r) + '" style="fill:' + v(a) + '"/>';
    s += '<rect class="m-shape" data-r="' + f(r) + '" x="' + f(cx - r) + '" y="' + f(cy - r) + '" width="' + f(2 * r) + '" height="' + f(2 * r) + '" rx="' + f(r) + '" fill="url(#' + g + ')"/></g>';
    if (two) { var r2 = r * rnd.range(.35, .55), x2 = cx + r * rnd.range(.7, 1.1), y2 = cy + r * rnd.range(-1, .2); if (x2 + r2 > w) x2 = cx - r * 1.1; s += '<g class="m-drift m-d2"><circle cx="' + f(x2) + '" cy="' + f(y2) + '" r="' + f(r2) + '" style="fill:' + v(b) + '"/><circle cx="' + f(x2) + '" cy="' + f(y2) + '" r="' + f(r2) + '" fill="url(#' + g + ')"/></g>'; }
    return { svg: s, uses: [a, b], shift: function (el) { el.classList.toggle('is-sq'); } };
  };
  M.gridSquares = function (w, h, rnd, c) {
    var g = c.id(), u = Math.min(w, h), a = c.col(), b = c.col([a]), s0 = u * rnd.range(.5, .7), x = (w - s0) * rnd.range(.2, .8), y = (h - s0) * rnd.range(.3, .7), k = s0 * rnd.range(.3, .45);
    var s = '<defs>' + grid(g, rnd.pick([8, 10])) + '</defs><g class="m-drift"><rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(s0) + '" height="' + f(s0) + '" style="fill:' + v(a) + '"/><rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(s0) + '" height="' + f(s0) + '" fill="url(#' + g + ')"/>';
    s += '<rect class="m-inset" x="' + f(x + s0 - k) + '" y="' + f(y + s0 - k) + '" width="' + f(k) + '" height="' + f(k) + '" style="fill:' + v(b) + '"/></g>';
    return { svg: s, uses: [a, b], shift: function (el) { el.classList.toggle('is-flip'); } };
  };
  M.overlap = function (w, h, rnd, c) {
    var u = Math.min(w, h), r = u * rnd.range(.26, .32), cy = h * .52, gap = r * rnd.range(.8, 1.05), x0 = w / 2 - gap, cols = c.cols(3), s = '<g style="isolation:isolate">';
    for (var i = 0; i < 3; i++) s += '<circle class="m-ov m-ov' + i + '" cx="' + f(x0 + i * gap) + '" cy="' + f(cy + (i === 1 ? -r * .12 : 0)) + '" r="' + f(r) + '" style="fill:' + v(cols[i]) + ';mix-blend-mode:multiply;opacity:.88"/>';
    return { svg: s + '</g>', uses: cols, pale: true, shift: function (el) { el.classList.toggle('is-spread'); } };
  };
  M.split = function (w, h, rnd, c) {
    var g = c.id(), u = Math.min(w, h), r = u * rnd.range(.3, .38), cx = w * rnd.range(.4, .6), cy = h * .52, a = c.col(), b = c.col([a]), gap = 8;
    function half(x, col, left) { return '<path d="M' + f(x) + ' ' + f(cy - r) + 'A' + f(r) + ' ' + f(r) + ' 0 0 ' + (left ? 0 : 1) + ' ' + f(x) + ' ' + f(cy + r) + 'Z" style="fill:' + v(col) + '"/><path d="M' + f(x) + ' ' + f(cy - r) + 'A' + f(r) + ' ' + f(r) + ' 0 0 ' + (left ? 0 : 1) + ' ' + f(x) + ' ' + f(cy + r) + 'Z" fill="url(#' + g + ')"/>'; }
    return { svg: '<defs>' + grid(g, 9) + '</defs><g class="m-drift">' + half(cx - gap / 2, a, true) + '</g><g class="m-drift m-d2">' + half(cx + gap / 2, b, false) + '</g>', uses: [a, b] };
  };
  M.compass = function (w, h, rnd, c) {
    var cx = w * rnd.range(.42, .58), top = h * .1, gy = h * .86, spread = Math.min(w, h) * rnd.range(.2, .3), nx = cx - spread, px = cx + spread * rnd.range(.8, 1.1), s = '';
    s += '<g class="m-sway" style="transform-origin:' + f(cx) + 'px ' + f(top) + 'px">';
    s += '<line x1="' + f(cx) + '" y1="' + f(top + 6) + '" x2="' + f(nx) + '" y2="' + f(gy) + '" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><line x1="' + f(cx) + '" y1="' + f(top + 6) + '" x2="' + f(px) + '" y2="' + f(gy) + '" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>';
    s += '<line x1="' + f(nx) + '" y1="' + f(gy) + '" x2="' + f(nx - 2) + '" y2="' + f(gy + 8) + '" stroke="var(--brick)" stroke-width="2.4" stroke-linecap="round"/><circle cx="' + f(cx) + '" cy="' + f(top + 4) + '" r="7" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/><line x1="' + f(cx) + '" y1="' + f(top - 14) + '" x2="' + f(cx) + '" y2="' + f(top - 3) + '" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></g>';
    var rad = Math.abs(px - nx); s = '<circle class="m-arc" cx="' + f(nx) + '" cy="' + f(gy + 4) + '" r="' + f(rad) + '" fill="none" stroke="var(--brick)" stroke-width="1.6" stroke-dasharray="3 5" stroke-linecap="round"/>' + s;
    return { svg: s, uses: [] };
  };
  M.protractor = function (w, h, rnd, c) {
    var R = Math.min(w * .44, h * .78), cx = w / 2, cy = h * .86, ang = rnd.range(25, 150), s = '<path d="M' + f(cx - R) + ' ' + f(cy) + 'A' + f(R) + ' ' + f(R) + ' 0 0 1 ' + f(cx + R) + ' ' + f(cy) + 'Z" fill="var(--paper-raised)" stroke="var(--ink)" stroke-width="2"/>', t = '';
    for (var d = 0; d <= 180; d += 2) { var a = d * Math.PI / 180, len = d % 10 === 0 ? R * .13 : d % 5 === 0 ? R * .09 : R * .05; t += 'M' + f(cx + Math.cos(a) * R) + ' ' + f(cy - Math.sin(a) * R) + 'L' + f(cx + Math.cos(a) * (R - len)) + ' ' + f(cy - Math.sin(a) * (R - len)); }
    s += '<path d="' + t + '" stroke="var(--ink)" stroke-width="1.1" fill="none"/><path d="M' + f(cx - R * .12) + ' ' + f(cy) + 'A' + f(R * .12) + ' ' + f(R * .12) + ' 0 0 1 ' + f(cx + R * .12) + ' ' + f(cy) + '" fill="none" stroke="var(--ink)" stroke-width="1.4"/>';
    s += '<g class="m-needle" style="transform-origin:' + f(cx) + 'px ' + f(cy) + 'px;--n:' + f(90 - ang) + 'deg"><line x1="' + f(cx) + '" y1="' + f(cy) + '" x2="' + f(cx) + '" y2="' + f(cy - R * .94) + '" stroke="var(--brick)" stroke-width="2.2" stroke-linecap="round"/></g><circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="4" fill="var(--brick)"/>';
    return { svg: s, uses: [], pale: true, shift: function (el) { el.classList.toggle('is-turn'); } };
  };
  M.setsquare = function (w, h, rnd, c) {
    var bw = w * rnd.range(.5, .66), bh = h * rnd.range(.58, .72), x = w * .5 - bw / 2 + rnd.range(-8, 8), y = h * .5 - bh / 2, flip = rnd() < .5;
    var A = [x, y + bh], B = [x + bw, y + bh], C = [x + bw, y], la = Math.hypot(B[0] - C[0], B[1] - C[1]), lb = Math.hypot(A[0] - C[0], A[1] - C[1]), lc = Math.hypot(A[0] - B[0], A[1] - B[1]);
    var ix = (la * A[0] + lb * B[0] + lc * C[0]) / (la + lb + lc), iy = (la * A[1] + lb * B[1] + lc * C[1]) / (la + lb + lc), rin = (la + lc - lb) / 2, k = Math.max(.35, (rin - Math.min(bw, bh) * .17) / rin);
    function P(q) { return (flip ? f(2 * (x + bw / 2) - q[0]) : f(q[0])) + ' ' + f(q[1]); }
    function S(q) { return [ix + (q[0] - ix) * k, iy + (q[1] - iy) * k]; }
    var d = 'M' + P(A) + 'L' + P(B) + 'L' + P(C) + 'ZM' + P(S(A)) + 'L' + P(S(B)) + 'L' + P(S(C)) + 'Z', ticks = '';
    for (var i = 1; i < 12; i++) { var tx = x + bw * i / 12; ticks += 'M' + P([tx, y + bh]) + 'L' + P([tx, y + bh - (i % 5 === 0 ? 11 : 6)]); }
    return { svg: '<g class="m-drift"><path d="' + d + '" fill="var(--ink)" fill-rule="evenodd" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/><path d="' + ticks + '" stroke="var(--paper)" stroke-width="1.2" fill="none"/></g>', uses: [], pale: true };
  };
  M.ruler = function (w, h, rnd, c) {
    var len = w * 1.05, th = Math.min(h * .3, 54), ang = rnd.range(-14, 14), s = '<g transform="rotate(' + f(ang) + ' ' + f(w / 2) + ' ' + f(h / 2) + ')"><g class="m-sway" style="transform-origin:' + f(w / 2) + 'px ' + f(h / 2) + 'px"><rect x="' + f(w / 2 - len / 2) + '" y="' + f(h / 2 - th / 2) + '" width="' + f(len) + '" height="' + f(th) + '" fill="var(--paper-raised)" stroke="var(--ink)" stroke-width="2"/>', t = '', x0 = w / 2 - len / 2, n = 0;
    for (var x = x0 + 6; x < x0 + len - 4; x += 6, n++) t += 'M' + f(x) + ' ' + f(h / 2 - th / 2) + 'v' + (n % 10 === 0 ? th * .5 : n % 5 === 0 ? th * .34 : th * .2);
    s += '<path d="' + t + '" stroke="var(--ink)" stroke-width="1.1" fill="none"/>';
    for (var k = 0, nx = x0 + 6; nx < x0 + len - 20; nx += 60, k++) s += '<text x="' + f(nx + 3) + '" y="' + f(h / 2 + th * .42) + '" font-family="var(--font-mono)" font-size="10" fill="var(--brick)">' + (k * 10) + '</text>';
    return { svg: s + '</g></g>', uses: [] };
  };
  M.contours = function (w, h, rnd, c) {
    var cx = w * rnd.range(.35, .65), cy = h * rnd.range(.4, .6), n = rnd.int(9, 13), step = Math.max(w, h) * .6 / n, s = '<g class="m-drift m-slow" fill="none" stroke="var(--ink)" stroke-linejoin="round">';
    for (var k = n; k >= 1; k--) s += '<path d="' + ring(cx, cy, step * k, rnd, k) + '" stroke-width="' + (k % 5 === 0 ? 1.5 : .8) + '" opacity="' + (k % 5 === 0 ? .85 : .6) + '"/>';
    return { svg: s + '</g>', uses: [], pale: true };
  };
  M.halftone = function (w, h, rnd, c) {
    var sp = 13, dir = rnd() < .5, s = '<g class="m-drift m-slow" fill="var(--ink)">';
    for (var j = 0, y = sp / 2; y < h + sp; y += sp * .87, j++) for (var x = (j % 2) * sp / 2; x < w + sp; x += sp) { var t = dir ? x / w : 1 - x / w, r = sp * .46 * Math.pow(1 - t, 1.2) * (.85 + .15 * Math.sin(y / 20)); if (r > .6) s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '"/>'; }
    return { svg: s + '</g>', uses: [], pale: true };
  };
  M.plan = function (w, h, rnd, c) {
    var s = '<rect x="10" y="10" width="' + (w - 20) + '" height="' + (h - 20) + '" fill="none" stroke="var(--ink)" stroke-width="2"/><rect x="15" y="15" width="' + (w - 30) + '" height="' + (h - 30) + '" fill="none" stroke="var(--ink)" stroke-width=".8"/>', pts = [], tries = 0, n = rnd.int(6, 9);
    while (pts.length < n && tries++ < 200) { var r = rnd.range(12, Math.min(26, h * .12)), x = rnd.range(r + 26, w - r - 26), y = rnd.range(r + 26, h - r - 42), ok = true; for (var i = 0; i < pts.length; i++) if (Math.hypot(pts[i].x - x, pts[i].y - y) < pts[i].r + r + 6) ok = false; if (ok) pts.push({ x: x, y: y, r: r }); }
    s += '<g class="m-sway m-slow">';
    pts.forEach(function (p) { s += '<circle cx="' + f(p.x) + '" cy="' + f(p.y) + '" r="' + f(p.r) + '" fill="var(--moss-tint)" stroke="var(--moss)" stroke-width="1.6"/><path d="M' + f(p.x - p.r * .55) + ' ' + f(p.y - p.r * .1) + 'Q' + f(p.x) + ' ' + f(p.y - p.r * .75) + ' ' + f(p.x + p.r * .55) + ' ' + f(p.y - p.r * .1) + '" fill="none" stroke="var(--moss)" stroke-width="1.2"/><circle cx="' + f(p.x) + '" cy="' + f(p.y) + '" r="1.8" fill="var(--moss)"/>'; });
    s += '</g><path d="M26 ' + f(h * .3) + 'C' + f(w * .3) + ' ' + f(h * .1) + ' ' + f(w * .45) + ' ' + f(h * .75) + ' ' + f(w * .8) + ' ' + f(h * .5) + '" fill="none" stroke="var(--slate)" stroke-width="1.8" stroke-dasharray="5 4" stroke-linecap="round" class="m-flow"/>';
    var bx = 28, by = h - 26;
    s += '<path d="M' + bx + ' ' + by + 'h' + f(w * .22) + 'M' + bx + ' ' + (by - 4) + 'v8M' + f(bx + w * .11) + ' ' + (by - 3) + 'v6M' + f(bx + w * .22) + ' ' + (by - 4) + 'v8" stroke="var(--ink)" stroke-width="1.4" fill="none"/><text x="' + bx + '" y="' + (by - 8) + '" font-family="var(--font-mono)" font-size="9" fill="var(--ink)">0   50  100 FT</text>';
    s += '<path d="M' + f(w - 34) + ' ' + f(h - 22) + 'l6 -22l6 22l-6 -5z" fill="var(--ink)"/><text x="' + f(w - 38) + '" y="' + f(h - 28 - 22) + '" font-family="var(--font-mono)" font-size="9" fill="var(--ink)">N</text>';
    return { svg: s, uses: [], pale: true };
  };
  M.bars = function (w, h, rnd, c) {
    var n = rnd.int(4, 6), bw = w * .62 / n, x0 = w * .19, base = h * .82, cols = c.cols(n), s = '<g class="m-bars">';
    for (var i = 0; i < n; i++) { var bh = h * rnd.range(.2, .62); s += '<rect class="m-bar" x="' + f(x0 + i * bw * 1.12) + '" y="' + f(base - bh) + '" width="' + f(bw * .86) + '" height="' + f(bh) + '" style="fill:' + v(cols[i]) + ';--i:' + i + '"/>'; }
    return { svg: s + '</g><line x1="' + f(w * .12) + '" y1="' + f(base + 2) + '" x2="' + f(w * .88) + '" y2="' + f(base + 2) + '" stroke="var(--paper)" stroke-opacity=".6" stroke-width="1.5"/>', uses: cols, ink: true };
  };
  M.lines = function (w, h, rnd, c) {
    var n = rnd.int(7, 10), top = h * .14, step = (h * .72) / (n - 1), xl = w * .3, xr = w * .7, perm = rnd.shuffle(Array.apply(null, Array(n)).map(function (_, i) { return i; })), s = '<g fill="var(--ink)">', cols = c.cols(4);
    for (var i = 0; i < n; i++) s += '<circle cx="' + f(xl) + '" cy="' + f(top + i * step) + '" r="2.6"/><circle cx="' + f(xr) + '" cy="' + f(top + i * step) + '" r="2.6"/>';
    s += '</g><g class="m-lines" fill="none" stroke-width="2" stroke-linecap="round">';
    for (var k = 0; k < n; k++) s += '<line x1="' + f(xl) + '" y1="' + f(top + k * step) + '" x2="' + f(xr) + '" y2="' + f(top + perm[k] * step) + '" style="stroke:' + v(cols[k % 4]) + '"/>';
    return { svg: s + '</g>', uses: cols, pale: true, dots: true };
  };
  M.icon = function (w, h, rnd, c) {
    var names = c.icons, a = rnd.pick(names), b = rnd.pick(names.filter(function (n) { return n !== a; }).concat([a])), sz = Math.min(w, h) * .52;
    function u(n, cls) { return '<svg class="m-ico ' + cls + '" x="' + f(w / 2 - sz / 2) + '" y="' + f(h / 2 - sz / 2) + '" width="' + f(sz) + '" height="' + f(sz) + '" viewBox="0 0 24 24" style="color:var(--ink);--icon-accent:var(--paper);--icon-tint:color-mix(in srgb,var(--paper) 40%,transparent);overflow:visible" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><use href="' + SPRITE + '#i-' + n + '"/></svg>'; }
    return { svg: u(a, 'm-ico-a') + u(b, 'm-ico-b'), uses: [], shift: function (el) { el.classList.toggle('is-alt'); } };
  };

  /* Pill diagram: rounded labels joined by hairline arrows, 2 to 3 pale fills (process figure). */
  M.pills = function (w, h, rnd, c) {
    var words = rnd.shuffle(['SITE', 'MEASURE', 'PLAN', 'SECTION', 'SHADE', 'SOIL', 'WATER', 'COUNT']).slice(0, 3), n = 3, pw = Math.min(w * .26, 110), ph = Math.min(h * .2, 34), cols = rnd.shuffle(['sage', 'blush', 'sand', 'raised']), s = '<g class="m-drift m-slow">';
    var xs = [w * .1, w * .38, w * .66], ys = [h * .2, h * .52, h * .22];
    ys = rnd() < .5 ? ys : [ys[1], ys[0], ys[1]];
    for (var i = 0; i < n; i++) {
      var x = Math.min(xs[i], w - pw - 8), y = ys[i];
      if (i) { var px = Math.min(xs[i - 1], w - pw - 8) + pw, py = ys[i - 1] + ph / 2; s += '<path d="M' + f(px) + ' ' + f(py) + 'C' + f(px + 20) + ' ' + f(py) + ' ' + f(x - 20) + ' ' + f(y + ph / 2) + ' ' + f(x - 3) + ' ' + f(y + ph / 2) + '" fill="none" stroke="var(--ink)" stroke-width="1.1"/><path d="M' + f(x - 8) + ' ' + f(y + ph / 2 - 4) + 'L' + f(x - 2) + ' ' + f(y + ph / 2) + 'L' + f(x - 8) + ' ' + f(y + ph / 2 + 4) + '" fill="none" stroke="var(--ink)" stroke-width="1.1"/>'; }
      s += '<rect class="m-pill" x="' + f(x) + '" y="' + f(y) + '" width="' + f(pw) + '" height="' + f(ph) + '" rx="' + f(ph / 2) + '" style="fill:var(' + VAR[cols[i]] + ');--i:' + i + '" stroke="var(--ink)" stroke-width="1.1"/><text x="' + f(x + pw / 2) + '" y="' + f(y + ph / 2 + 3.5) + '" text-anchor="middle" font-family="var(--font-mono)" font-size="10" letter-spacing=".08em" fill="var(--ink)">' + words[i] + '</text>';
    }
    return { svg: s + '</g>', uses: [], pale: true };
  };
  /* Section: ground line, hatched soil, tree and a scale figure, with a brick dimension string. */
  M.section = function (w, h, rnd, c) {
    var gy = h * rnd.range(.58, .68), tx = w * rnd.range(.3, .6), th = h * rnd.range(.3, .42), s = '<path d="M0 ' + f(gy) + 'H' + f(w) + '" stroke="var(--ink)" stroke-width="2.4"/>', hs = '';
    for (var x = -h; x < w; x += 9) hs += 'M' + f(x) + ' ' + f(h) + 'L' + f(x + (h - gy)) + ' ' + f(gy);
    var cid = c.id();
    s += '<defs><clipPath id="' + cid + '"><rect x="0" y="' + f(gy) + '" width="' + f(w) + '" height="' + f(h - gy) + '"/></clipPath></defs><path d="' + hs + '" stroke="var(--ink)" stroke-opacity=".5" stroke-width="1" fill="none" clip-path="url(#' + cid + ')"/>';
    s += '<g class="m-sway m-slow" style="transform-origin:' + f(tx) + 'px ' + f(gy) + 'px"><line x1="' + f(tx) + '" y1="' + f(gy) + '" x2="' + f(tx) + '" y2="' + f(gy - th * .6) + '" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><ellipse cx="' + f(tx) + '" cy="' + f(gy - th * .8) + '" rx="' + f(th * .42) + '" ry="' + f(th * .36) + '" fill="var(--moss-tint)" stroke="var(--moss)" stroke-width="1.8"/></g>';
    var fx = tx + th * .75, fh = th * .55;
    s += '<g stroke="var(--ink)" stroke-width="1.6" fill="none" stroke-linecap="round"><circle cx="' + f(fx) + '" cy="' + f(gy - fh) + '" r="3"/><path d="M' + f(fx) + ' ' + f(gy - fh + 3) + 'V' + f(gy - fh * .38) + 'M' + f(fx - 5) + ' ' + f(gy - fh * .75) + 'H' + f(fx + 5) + 'M' + f(fx) + ' ' + f(gy - fh * .38) + 'L' + f(fx - 4) + ' ' + f(gy) + 'M' + f(fx) + ' ' + f(gy - fh * .38) + 'L' + f(fx + 4) + ' ' + f(gy) + '"/></g>';
    var dx = tx - th * .6;
    s += '<path d="M' + f(dx) + ' ' + f(gy - th * 1.16) + 'V' + f(gy) + 'M' + f(dx - 4) + ' ' + f(gy - th * 1.16) + 'h8M' + f(dx - 4) + ' ' + f(gy) + 'h8" stroke="var(--brick)" stroke-width="1.3" fill="none"/>';
    return { svg: s, uses: [], pale: true };
  };
  /* Ledger: ruled paper with column lines, mono tick figures and one circled brick entry. */
  M.ledger = function (w, h, rnd, c) {
    var s = '<g class="m-drift m-slow" stroke="var(--ink)" fill="none">', rows = Math.floor(h / 16), cx = w * .18, i;
    for (i = 1; i < rows; i++) s += '<path d="M0 ' + i * 16 + 'H' + w + '" stroke-opacity=".28" stroke-width="1"/>';
    s += '<path d="M' + f(cx) + ' 0V' + h + 'M' + f(cx + 3) + ' 0V' + h + 'M' + f(w * .72) + ' 0V' + h + '" stroke-opacity=".6" stroke-width="1"/></g><g font-family="var(--font-mono)" font-size="10" fill="var(--ink)" fill-opacity=".8">';
    for (i = 1; i < rows; i++) if (rnd() < .7) s += '<text x="' + f(cx + 10) + '" y="' + (i * 16 - 4) + '">' + rnd.int(10, 99) + '.' + rnd.int(0, 9) + '</text><text x="' + f(w * .72 + 8) + '" y="' + (i * 16 - 4) + '">' + rnd.int(1, 99) + '</text>';
    var k = rnd.int(2, Math.max(2, rows - 2));
    s += '</g><ellipse class="m-arc" cx="' + f(w * .5) + '" cy="' + (k * 16 - 8) + '" rx="' + f(w * .22) + '" ry="9" fill="none" stroke="var(--brick)" stroke-width="1.6"/>';
    return { svg: s, uses: [], pale: true };
  };
  /* Crosshatch: loose parallel pen strokes, two angles, stronger toward one corner (marker tone). */
  M.hatch = function (w, h, rnd, c) {
    var a = rnd.range(30, 60), step = rnd.range(7, 10), d = '', d2 = '', diag = Math.hypot(w, h), cx = w / 2, cy = h / 2, k, cid = c.id(), cw = w * rnd.range(.45, .65), ch = h * rnd.range(.45, .65), right = rnd() < .5, bottom = rnd() < .5;
    for (k = -diag / 2; k < diag / 2; k += step) { d += 'M' + f(cx - diag) + ' ' + f(cy + k + rnd.range(-1.2, 1.2)) + 'l' + f(diag * 2) + ' 0'; d2 += 'M' + f(cx - diag) + ' ' + f(cy + k) + 'l' + f(diag * 2) + ' 0'; }
    return { svg: '<defs><clipPath id="' + cid + '"><rect x="' + f(right ? w - cw : 0) + '" y="' + f(bottom ? h - ch : 0) + '" width="' + f(cw) + '" height="' + f(ch) + '"/></clipPath></defs><g class="m-drift m-slow"><path d="' + d + '" transform="rotate(' + f(a) + ' ' + f(cx) + ' ' + f(cy) + ')" stroke="var(--ink)" stroke-width="1" stroke-opacity=".6" fill="none"/><g clip-path="url(#' + cid + ')"><path d="' + d2 + '" transform="rotate(' + f(a + 80) + ' ' + f(cx) + ' ' + f(cy) + ')" stroke="var(--ink)" stroke-width="1" stroke-opacity=".6" fill="none"/></g></g>', uses: [], pale: true };
  };

  /* ---------- layouts ---------- */
  function layout(kind, W, H, rnd) {
    var r = [], i, x, cuts;
    if (kind === 'banner') {
      var presets = [[.38, .34, .28], [.5, .25, .25], [.3, .4, .3], [.25, .5, .25], [.62, .38], [.45, .3, .25], [.34, .33, .33]]; cuts = rnd.pick(presets); x = 0;
      cuts.forEach(function (c) { r.push({ x: f(x), y: 0, w: f(c * W), h: H }); x += c * W; });
    } else if (/^strip/.test(kind)) {
      x = 0; while (x < W) { var ww = Math.min(rnd.range(70, 190), W - x); if (W - x - ww < 50) ww = W - x; r.push({ x: f(x), y: 0, w: f(ww), h: H }); x += ww; }
    } else if (kind === 'card') {
      var s = rnd.range(.5, .62); r.push({ x: 0, y: 0, w: f(W * s), h: H });
      if (rnd() < .5) { r.push({ x: f(W * s), y: 0, w: f(W * (1 - s)), h: f(H * .55) }); r.push({ x: f(W * s), y: f(H * .55), w: f(W * (1 - s)), h: f(H * .45) }); } else r.push({ x: f(W * s), y: 0, w: f(W * (1 - s)), h: H });
    } else { var a = rnd.range(.4, .6), b = rnd.range(.4, .6); r = [{ x: 0, y: 0, w: f(W * a), h: f(H * b) }, { x: f(W * a), y: 0, w: f(W * (1 - a)), h: f(H * b) }, { x: 0, y: f(H * b), w: f(W * (1 - a)), h: f(H * (1 - b)) }, { x: f(W * (1 - a)), y: f(H * b), w: f(W * a), h: f(H * (1 - b)) }]; }
    return r;
  }
  var SIZES = { banner: [1120, 220], strip: [1120, 56], stripm: [560, 56], card: [600, 375], square: [400, 400] };
  var STRIP_MOTIFS = ['gridDisc', 'gridSquares', 'halftone', 'lines', 'contours', 'overlap', 'split', 'bars'];

  /* ---------- compose ---------- */
  function build(kind, seed, topic, only) {
    var rnd = Rng(seed + '|' + kind), pr = profile(topic || ''), W = SIZES[kind][0], H = SIZES[kind][1], id = 'a' + (++uid), rects = only ? [{ x: 0, y: 0, w: W, h: H }] : layout(kind, W, H, rnd), n = rects.length, k = 0;
    var motifs = only ? [only] : [], pool = (/^strip/.test(kind) ? STRIP_MOTIFS : pr.motifs).slice(), all = Object.keys(M);
    for (var i = 0; i < n && !only; i++) {
      var m, guard = 0;
      do { m = rnd() < .75 || /^strip/.test(kind) ? rnd.pick(pool) : rnd.pick(all); } while ((motifs.indexOf(m) >= 0 || (/^strip/.test(kind) && i && motifs[i - 1] === m)) && guard++ < 30);
      motifs.push(m);
    }
    if (!only && !/^strip/.test(kind) && !motifs.some(function (m) { return TOOLS.indexOf(m) >= 0; }) && rnd() < .7) motifs[rnd.int(0, n - 1)] = rnd.pick(TOOLS);
    var fields = rnd.shuffle(pr.fields), prev = null, tiles = [], svg = '', taken = [];
    rects.forEach(function (rc, i) {
      var m = motifs[i], paper = PAPER_KINDS[m] !== undefined && PAPER_KINDS[m] === 1 || m === 'contours' && rnd() < .5 || m === 'halftone', field, ink = m === 'bars';
      if (m === 'ruler' || m === 'icon' || m === 'split' || m === 'compass' && rnd() < .4) paper = false;
      if (m === 'gridDisc' || m === 'gridSquares') paper = rnd() < .35;
      if (ink) field = 'ink';
      else if (paper) field = rnd.pick(PALE.slice(0, 3));
      else { var free = fields.filter(function (s) { return taken.indexOf(s) < 0 && s !== prev; }); field = free.length ? free[0] : fields[(i + k++) % fields.length]; }
      taken.push(field);
      prev = field;
      var ctx = { id: function () { return id + 'p' + (++uid); }, icons: pr.icons, used: [field], col: null, cols: null };
      ctx.col = function (ex) { var choices = SAT.filter(function (s) { return s !== field && (!ex || ex.indexOf(s) < 0) && (ink || !paper ? true : true); }); var pref = choices.filter(function (s) { return pr.fields.indexOf(s) >= 0; }); return rnd.pick(pref.length ? pref : choices); };
      ctx.cols = function (num) { var out = [], base = rnd.shuffle(SAT.filter(function (s) { return s !== field; })); for (var q = 0; q < num; q++) out.push(base[q % base.length]); return out; };
      var out = M[m](rc.w, rc.h, rnd, ctx), gid = id + 'g' + i;
      var bg = '<rect class="m-field" width="' + rc.w + '" height="' + rc.h + '" style="fill:' + v(field) + '"/>';
      if (paper || out.dots) bg += '<defs>' + paperGrid(gid, 14) + '</defs><rect width="' + rc.w + '" height="' + rc.h + '" fill="url(#' + gid + ')"/>';
      svg += '<svg class="m-tile m-' + m + '" data-motif="' + m + '" data-field="' + field + '" x="' + rc.x + '" y="' + rc.y + '" width="' + rc.w + '" height="' + rc.h + '" viewBox="0 0 ' + rc.w + ' ' + rc.h + '" style="--field:' + v(field) + '">' + bg + '<g class="m-par" style="--k:' + f(Rng(seed + '|par|' + i)() * 20 - 10) + '">' + out.svg + '</g></svg>';
      tiles.push({ motif: m, field: field, uses: out.uses || [], shift: !!out.shift, pale: paper || !!out.pale, ink: ink });
    });
    return { html: '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" focusable="false" role="presentation">' + svg + '</svg>', tiles: tiles, W: W, H: H, rnd: rnd };
  }

  /* ---------- render + live drift ---------- */
  var arts = [];
  function render(el, opts) {
    opts = opts || {};
    var kind = opts.kind || el.getAttribute('data-rds-art') || 'banner', mob = el.getAttribute('data-art-mobile');
    if (!opts.kind && mob && narrow.matches) kind = mob;
    if (!SIZES[kind]) kind = 'banner';
    var seed = opts.seed || el.getAttribute('data-seed') || slugOf(), topic = opts.topic != null ? opts.topic : (el.getAttribute('data-topic') || seed);
    var b = build(kind, seed, topic, opts.only || el.getAttribute('data-motif'));
    el.innerHTML = b.html;
    el.classList.add('rds-art', 'rds-art--' + kind);
    el.setAttribute('aria-hidden', 'true');
    el.__art = { kind: kind, seed: seed, topic: topic, tiles: b.tiles, rnd: b.rnd, next: Date.now() + 4000 + b.rnd() * 4000, last: -1, live: false };
    if (arts.indexOf(el) < 0) arts.push(el);
    el.classList.toggle('is-static', reduceMQ.matches);
    observe(el);
    return el;
  }
  function reroll(el) { var a = el.__art || {}, s = (a.seed || 'x') + '~' + Math.floor(Math.random() * 1e6); render(el, { kind: a.kind, seed: s, topic: a.topic }); return s; }
  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.target.__art) e.target.__art.live = e.isIntersecting; e.target.classList.toggle('is-live', e.isIntersecting && !reduceMQ.matches); }); }, { threshold: .1 }) : null;
  function observe(el) { if (io) io.observe(el); else { el.__art.live = true; el.classList.add('is-live'); } }

  function shiftTile(el, at) {
    var a = el.__art, rnd = a.rnd, tiles = el.querySelectorAll('.m-tile'), i;
    if (typeof at === 'number' && at >= 0 && at < tiles.length) i = at;
    else do { i = Math.floor(rnd() * tiles.length); } while (tiles.length > 1 && i === a.last);
    a.last = i; var t = tiles[i], info = a.tiles[i], r = rnd(), cls = t.classList;
    if (info.shift && r < .6) {
      cls.toggle(cls.contains('m-icon') ? 'is-alt' : cls.contains('m-gridSquares') ? 'is-flip' : cls.contains('m-overlap') ? 'is-spread' : cls.contains('m-protractor') ? 'is-turn' : 'is-sq');
    } else if (info.ink) {
      cls.toggle('is-nudge');
    } else {
      var set = info.pale ? PALE.slice(0, 3) : SAT, opts = set.filter(function (s) { return s !== info.field && info.uses.indexOf(s) < 0; }); if (!opts.length) return;
      var nf = opts[Math.floor(rnd() * opts.length)]; info.field = nf; t.style.setProperty('--field', v(nf));
      var fr = t.querySelector('.m-field'); if (fr) fr.style.fill = v(nf);
    }
  }
  function tick() {
    if (reduceMQ.matches || doc.hidden || doc.documentElement.classList.contains('rv-art-paused')) return;
    var now = Date.now();
    arts.forEach(function (el) { var a = el.__art; if (!a || !a.live || !el.isConnected || now < a.next) return; shiftTile(el); a.next = now + 5500 + a.rnd() * 4500; });
  }
  setInterval(tick, 1000);
  function onMotion() { arts.forEach(function (el) { el.classList.toggle('is-static', reduceMQ.matches); if (reduceMQ.matches) el.classList.remove('is-live'); else if (el.__art && el.__art.live) el.classList.add('is-live'); }); }
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onMotion);

  if (narrow.addEventListener) narrow.addEventListener('change', function () { arts.forEach(function (el) { if (el.isConnected && el.getAttribute('data-art-mobile')) render(el, { seed: el.__art.seed, topic: el.__art.topic, kind: narrow.matches ? el.getAttribute('data-art-mobile') : el.getAttribute('data-rds-art') }); }); });
  function slugOf() { var m = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean); return m.join('/') || 'home'; }
  function init() {
    if (!doc.querySelector('.rds-art--strip') && !doc.querySelector('[data-no-footstrip]')) { var ft = doc.querySelector('.rds-footer,[data-rv-shell="footer"]'); if (ft) { var s = doc.createElement('div'); s.className = 'rds-art rds-art--strip rv-footstrip'; s.setAttribute('data-rds-art', 'strip'); s.setAttribute('data-art-mobile', 'stripm'); s.setAttribute('data-seed', 'foot:' + slugOf()); ft.parentNode.insertBefore(s, ft); } } [].slice.call(doc.querySelectorAll('[data-rds-art]')).forEach(function (el) { render(el); }); }
  window.RDSArt = { poke: function (el, tile) { var t = el.querySelectorAll('.m-tile'); if (!el.__art || reduceMQ.matches || !t.length) return false; var i = Array.prototype.indexOf.call(t, tile); if (i < 0) return false; shiftTile(el, i); return true; }, renderMotif: function (el, name, seed, kind) { return render(el, { kind: kind || 'card', seed: seed || name, topic: '', only: name }); }, render: render, reroll: reroll, build: build, motifs: Object.keys(M), palette: SAT };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
