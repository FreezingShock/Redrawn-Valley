/* Redrawn Design System: margin sketches. Large, original, seeded drawings (plan and section fragments, drafting tools,
   contours, tile collages) that fill the empty side margins of wide screens and sit faintly behind long pages on phones.
   One layer per page, inside <main>. Lines draw themselves when a fragment scrolls into view, then drift slowly.
   Reduced motion, Save-Data, the Pause button (rv-loops-paused) and offscreen fragments all stop the motion.
   Opt out: <main data-margins-none>. Not mounted inside iframes (lab demos). Documented in DESIGN.md "Margin sketches". */
(function () {
  'use strict';
  var doc = document, NS = 'http://www.w3.org/2000/svg';
  if (window.top !== window) return;
  var main = doc.querySelector('main'); if (!main || main.hasAttribute('data-margins-none')) return;
  var script = doc.currentScript;

  function hash(s) { var h = 1779033703 ^ s.length; for (var i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return function () { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0; }; }
  function Rng(seed) {
    var a = hash(String(seed))(), r = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    r.range = function (lo, hi) { return lo + r() * (hi - lo); };
    r.int = function (lo, hi) { return Math.floor(r.range(lo, hi + 1)); };
    r.pick = function (a) { return a[Math.floor(r() * a.length)]; };
    r.shuffle = function (a) { var o = a.slice(); for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = o[i]; o[i] = o[j]; o[j] = t; } return o; };
    return r;
  }
  function slug() { var m = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean); return m.join('/') || 'home'; }
  function n(x) { return Math.round(x * 10) / 10; }
  function S(tag, a, p) { var e = doc.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

  var W = 520, H = 640, ACC = ['moss', 'slate', 'brick', 'ochre', 'sky', 'rose', 'kelly', 'peri'];
  function col(c) { return 'var(--' + c + ')'; }

  /* a pencil line: bowed a little, drawn on by CSS (pathLength 1) */
  function wl(x1, y1, x2, y2, r, j) { j = j == null ? 2 : j; return 'M' + n(x1 + r.range(-j, j) / 2) + ' ' + n(y1 + r.range(-j, j) / 2) + 'Q' + n((x1 + x2) / 2 + r.range(-j, j)) + ' ' + n((y1 + y2) / 2 + r.range(-j, j)) + ' ' + n(x2) + ' ' + n(y2); }
  function wr(x, y, w, h, r, j) { return wl(x, y, x + w, y, r, j) + wl(x + w, y, x + w, y + h, r, j) + wl(x + w, y + h, x, y + h, r, j) + wl(x, y + h, x, y, r, j); }
  function circ(cx, cy, rad, r) { var d = '', k = 28, o = r.range(0, 6.28); for (var i = 0; i <= k; i++) { var t = o + i / k * 6.2832, q = rad * (1 + r.range(-.012, .012)); d += (i ? 'L' : 'M') + n(cx + q * Math.cos(t)) + ' ' + n(cy + q * Math.sin(t)); } return d; }

  function Draw(g, uid) {
    var d = { i: 0 };
    d.line = function (dd, sw, stroke, op, delay) {
      var p = S('path', { d: dd, fill: 'none', stroke: stroke || 'var(--ink)', 'stroke-width': sw || 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'class': 'dw' }, g);
      p.style.setProperty('--dl', (delay != null ? delay : d.i++ * .12) + 's'); if (op != null) p.style.setProperty('--lo', op); return p;
    };
    d.fill = function (tag, a, delay) { a['class'] = 'fl' + (a['class'] ? ' ' + a['class'] : ''); var fo = a.opacity; delete a.opacity; var e = S(tag, a, g); if (fo != null) e.style.setProperty('--fo', fo); e.style.setProperty('--dl', (delay != null ? delay : 1 + d.i * .05) + 's'); return e; };
    d.hatch = function (x, y, w, h, gap, r, stroke, delay) { var dd = ''; for (var k = -h; k < w; k += gap) dd += 'M' + n(Math.max(x, x + k)) + ' ' + n(y + Math.max(0, -k)) + 'L' + n(Math.min(x + w, x + k + h)) + ' ' + n(y + Math.min(h, w - k)); return d.line(dd, 1, stroke || 'var(--ink)', .55, delay); };
    d.grid = function (id, size) { var df = S('defs', {}, g), p = S('pattern', { id: uid + id, width: size, height: size, patternUnits: 'userSpaceOnUse' }, df); S('path', { d: 'M' + size + ' 0H0V' + size, fill: 'none', stroke: 'var(--ink)', 'stroke-opacity': .5, 'stroke-width': 1 }, p); return 'url(#' + uid + id + ')'; };
    return d;
  }

  var K = {};

  /* site plan fragment: lot, building, stalls, tree canopies, flow line, north arrow */
  K.plan = function (d, r, c) {
    var gx = 40, gy = 70, lw = 400, lh = 300, g = d.grid('g', 20);
    d.fill('rect', { x: gx, y: gy, width: lw, height: lh, fill: col(c[0]), opacity: .18 });
    d.line(wr(gx, gy, lw, lh, r, 3) + wr(gx + 8, gy + 8, lw - 16, lh - 16, r, 2), 2);
    d.fill('rect', { x: gx + 40, y: gy + 40, width: 170, height: 110, fill: col(c[1]), opacity: .5 });
    d.fill('rect', { x: gx + 40, y: gy + 40, width: 170, height: 110, fill: g, opacity: .6 });
    d.line(wr(gx + 40, gy + 40, 170, 110, r, 2), 2);
    d.hatch(gx + 40, gy + 40, 170, 110, 9, r, 'var(--ink)', .8);
    var st = ''; for (var i = 0; i < 7; i++) st += wl(gx + 240 + i * 22, gy + 190, gx + 240 + i * 22, gy + 250, r, 1.5);
    d.line(st + wl(gx + 240, gy + 190, gx + 394, gy + 190, r, 1.5), 1.4, 'var(--ink)', .7);
    for (var t = 0; t < 4; t++) {
      var tx = gx + 70 + t * 90 + r.range(-10, 10), ty = gy + 215 + r.range(-12, 12), tr = r.range(22, 34);
      d.fill('circle', { cx: n(tx), cy: n(ty), r: n(tr), fill: col(t % 2 ? 'moss' : c[2]), opacity: .45, 'class': 'mf-pulse', style: 'transform-origin:' + n(tx) + 'px ' + n(ty) + 'px;--ps:' + n(r.range(.92, 1.1)) });
      d.line(circ(tx, ty, tr, r), 1.5); d.line(circ(tx, ty, 2, r), 1.5);
    }
    var fl = d.line('M' + (gx - 20) + ' ' + (gy + 330) + 'C' + (gx + 120) + ' ' + (gy + 270) + ' ' + (gx + 190) + ' ' + (gy + 360) + ' ' + (gx + 330) + ' ' + (gy + 340) + 'S' + (gx + 450) + ' ' + (gy + 300) + ' ' + (gx + 470) + ' ' + (gy + 330), 2.4, 'var(--slate)', .9);
    fl.style.strokeDasharray = '2 9'; fl.removeAttribute('pathLength'); fl.style.strokeDashoffset = '0'; fl.setAttribute('class', 'fl mf-flow');
    d.line(wl(gx, gy + 400, gx + 400, gy + 400, r, 1) + wl(gx, gy + 392, gx, gy + 408, r, 0) + wl(gx + 400, gy + 392, gx + 400, gy + 408, r, 0), 1.4, 'var(--ink)', .8);
    var ticks = ''; for (var k = 1; k < 8; k++) ticks += wl(gx + k * 50, gy + 396, gx + k * 50, gy + 404, r, 0); d.line(ticks, 1.2);
    var nx = gx + 440, ny = gy + 450; d.line(circ(nx, ny, 22, r) + wl(nx, ny + 30, nx, ny - 34, r, 1) + wl(nx, ny - 34, nx - 8, ny - 18, r, 0) + wl(nx, ny - 34, nx + 8, ny - 18, r, 0), 1.6);
  };

  /* section fragment: ground with hatch, tree, swale cut, scale figure, level marks */
  K.section = function (d, r, c) {
    var y0 = 300, g = d.grid('g', 20);
    d.fill('rect', { x: 20, y: 80, width: 480, height: 220, fill: col(c[0]), opacity: .15 });
    d.line('M20 ' + y0 + 'C120 ' + (y0 - 4) + ' 150 ' + y0 + ' 190 ' + (y0 + 8) + 'S230 ' + (y0 + 60) + ' 270 ' + (y0 + 62) + 'S330 ' + (y0 + 6) + ' 370 ' + y0 + 'L500 ' + (y0 - 2), 2.4);
    d.fill('rect', { x: 20, y: y0 + 70, width: 480, height: 110, fill: g, opacity: .45 });
    d.hatch(20, y0 + 70, 480, 110, 11, r, 'var(--ink)', 1);
    d.line(wl(20, y0 + 70, 500, y0 + 70, r, 2) + wl(20, y0 + 180, 500, y0 + 180, r, 2), 1.4, 'var(--ink)', .7);
    d.line(wl(110, y0, 110, y0 - 170, r, 3), 3, 'var(--ink)', .9);
    d.fill('circle', { cx: 110, cy: y0 - 205, r: 62, fill: col(c[1]), opacity: .5, 'class': 'mf-pulse', style: 'transform-origin:110px ' + (y0 - 205) + 'px;--ps:1.05' });
    d.line(circ(110, y0 - 205, 62, r) + circ(110, y0 - 205, 36, r), 1.6);
    d.line(wl(110, y0 - 90, 80, y0 - 125, r, 2) + wl(110, y0 - 110, 140, y0 - 145, r, 2), 1.8);
    d.line(circ(395, y0 - 120, 9, r) + wl(395, y0 - 111, 395, y0 - 55, r, 1) + wl(395, y0 - 98, 376, y0 - 78, r, 1) + wl(395, y0 - 98, 414, y0 - 78, r, 1) + wl(395, y0 - 55, 384, y0 - 2, r, 1) + wl(395, y0 - 55, 406, y0 - 2, r, 1), 1.8);
    for (var i = 0; i < 6; i++) d.line(wl(236 + i * 12, y0 + 56, 236 + i * 12 + r.range(-4, 4), y0 + 20 - r.range(0, 22), r, 2), 1.6, 'var(--moss)', .9);
    d.line(wl(500, y0 - 20, 520, y0 - 20, r, 0) + wl(504, y0 - 20, 504, y0 + 62, r, 0), 1.2);
    var fl = d.line('M180 ' + (y0 - 50) + 'Q215 ' + (y0 + 10) + ' 250 ' + (y0 + 40), 2.2, 'var(--slate)', .9); fl.style.strokeDasharray = '2 8'; fl.removeAttribute('pathLength'); fl.setAttribute('class', 'fl mf-flow');
  };

  /* contours: nested wobbly rings with index lines, a basin and a peak */
  K.contour = function (d, r, c) {
    var cx = r.range(200, 300), cy = r.range(280, 360), ph = [r() * 6.28, r() * 6.28, r() * 6.28];
    d.fill('circle', { cx: cx, cy: cy, r: 190, fill: col(c[0]), opacity: .2 });
    for (var k = 1; k <= 13; k++) {
      var rad = k * 17, pts = [];
      for (var i = 0; i < 60; i++) { var t = i / 60 * 6.2832, q = rad * (1 + .12 * Math.sin(2 * t + ph[0]) + .07 * Math.sin(3 * t + ph[1]) + .04 * Math.sin(5 * t + ph[2])); pts.push(n(cx + q * Math.cos(t)) + ' ' + n(cy + q * .84 * Math.sin(t))); }
      d.line('M' + pts.join('L') + 'Z', k % 4 === 0 ? 2.2 : 1.1, k % 4 === 0 ? 'var(--ink)' : 'var(--ink)', k % 4 === 0 ? .9 : .6, k * .1);
    }
    d.fill('circle', { cx: cx, cy: cy, r: 6, fill: col('brick'), 'class': 'mf-pulse', style: 'transform-origin:' + n(cx) + 'px ' + n(cy) + 'px;--ps:1.5' });
    d.line(wl(cx - 230, cy + 260, cx + 230, cy - 250, r, 6), 1.2, 'var(--brick)', .8, 1.6);
  };

  /* drafting compass drawing an arc on a graph-paper tile */
  K.compass = function (d, r, c) {
    var g = d.grid('g', 20), px = 120, py = 90, tile = d.fill('rect', { x: px, y: py, width: 340, height: 420, rx: 8, fill: col(c[0]), opacity: .4 });
    d.fill('rect', { x: px, y: py, width: 340, height: 420, rx: 8, fill: g, opacity: .35 }); d.line(wr(px, py, 340, 420, r, 2), 2);
    var ox = 290, oy = 420;
    d.line('M' + (ox - 170) + ' ' + oy + 'A170 170 0 0 1 ' + (ox + 5) + ' ' + (oy - 170), 2, 'var(--brick)', .95, .4);
    d.line(circ(ox, oy, 4, r), 1.6);
    var gg = S('g', { 'class': 'mf-swing', style: 'transform-origin:' + ox + 'px ' + oy + 'px' }, d.g || null);
    d.line(wl(ox, oy, ox - 60, oy - 330, r, 2) + wl(ox - 60, oy - 330, ox - 80, oy - 372, r, 1), 4, 'var(--ink)', .9, .9);
    d.line(wl(ox, oy, ox - 170, oy - 20, r, 2), 4, 'var(--ink)', .9, 1.1);
    d.line(wl(ox - 60, oy - 330, ox - 100, oy - 318, r, 1) + wl(ox - 60, oy - 330, ox - 20, oy - 318, r, 1), 3, 'var(--ink)', .9, 1.4);
    d.line(wl(ox - 55, oy - 280, ox - 112, oy - 12, r, 1), 1.4, 'var(--ink)', .7, 1.3);
    d.fill('circle', { cx: ox - 60, cy: oy - 330, r: 9, fill: col('paper'), stroke: 'var(--ink)', 'stroke-width': 2 });
    if (gg.parentNode) gg.parentNode.removeChild(gg);
  };

  /* set square + scale ruler laid on a pale field */
  K.tools = function (d, r, c) {
    var g = d.grid('g', 20);
    d.fill('polygon', { points: '60,520 60,120 360,520', fill: col(c[0]), opacity: .45 });
    d.fill('polygon', { points: '60,520 60,120 360,520', fill: g, opacity: .3 });
    d.line('M60 520L60 120L360 520Z', 2.2);
    d.fill('polygon', { points: '100,470 100,240 262,470', fill: col('paper'), opacity: 1 });
    d.line('M100 470L100 240L262 470Z', 1.6, 'var(--ink)', .8, .5);
    var tk = ''; for (var i = 0; i <= 20; i++) { var yy = 520 - i * 20; if (yy < 130) break; tk += 'M60 ' + yy + 'L' + (i % 5 ? 74 : 90) + ' ' + yy; } d.line(tk, 1.2, 'var(--ink)', .8, .7);
    d.fill('rect', { x: 170, y: 540, width: 330, height: 54, rx: 3, fill: col('ochre'), opacity: .55, 'class': 'mf-slide' });
    d.line(wr(170, 540, 330, 54, r, 1.4), 1.8, 'var(--ink)', .9, .9);
    var rt = ''; for (var j = 0; j <= 33; j++) rt += 'M' + (170 + j * 10) + ' 540L' + (170 + j * 10) + ' ' + (j % 5 ? 554 : 566); d.line(rt, 1.1, 'var(--ink)', .8, 1.1);
    d.line(circ(120, 100, 40, r), 1.6, 'var(--brick)', .8, 1.4); d.line(circ(120, 100, 4, r), 2, 'var(--brick)', .9, 1.4);
  };

  /* protractor with a measured angle */
  K.protractor = function (d, r, c) {
    var cx = 260, cy = 400, R = 220;
    d.fill('path', { d: 'M' + (cx - R) + ' ' + cy + 'A' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy + 'Z', fill: col(c[0]), opacity: .35 });
    d.line('M' + (cx - R) + ' ' + cy + 'A' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy + 'Z', 2.2);
    d.line('M' + (cx - R * .62) + ' ' + cy + 'A' + R * .62 + ' ' + R * .62 + ' 0 0 1 ' + (cx + R * .62) + ' ' + cy, 1.2, 'var(--ink)', .7, .4);
    var tk = ''; for (var a = 0; a <= 180; a += 2) { var rad = a * Math.PI / 180, l = a % 10 === 0 ? 26 : 12; tk += 'M' + n(cx + R * Math.cos(rad)) + ' ' + n(cy - R * Math.sin(rad)) + 'L' + n(cx + (R - l) * Math.cos(rad)) + ' ' + n(cy - (R - l) * Math.sin(rad)); }
    d.line(tk, 1, 'var(--ink)', .75, .5);
    d.line(wl(cx - R - 30, cy, cx + R + 30, cy, r, 2) + wl(cx, cy, cx, cy - R - 20, r, 1), 1.2, 'var(--ink)', .55, .8);
    var ang = r.range(28, 62) * Math.PI / 180, ex = cx + (R + 24) * Math.cos(ang), ey = cy - (R + 24) * Math.sin(ang);
    d.line(wl(cx, cy, ex, ey, r, 1), 3, 'var(--brick)', .95, 1.2);
    d.fill('path', { d: 'M' + (cx + 60) + ' ' + cy + 'A60 60 0 0 0 ' + n(cx + 60 * Math.cos(ang)) + ' ' + n(cy - 60 * Math.sin(ang)) + 'L' + cx + ' ' + cy + 'Z', fill: col('brick'), opacity: .25 });
    d.line(circ(cx, cy, 5, r), 2);
  };

  /* tile collage: a 2 x 3 block of flat tiles, each one thing, colours that slowly swap */
  K.tiles = function (d, r, c) {
    var g = d.grid('g', 16), cols = 2, rows = 3, tw = 190, th = 170, x0 = 70, y0 = 60, ks = r.shuffle(['disc', 'square', 'contour', 'bars', 'overlap', 'half']);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var x = x0 + i * tw + (j % 2 ? 40 : 0), y = y0 + j * th, f1 = r.pick(ACC), f2 = r.pick(ACC), kind = ks[(i + j * cols) % ks.length], mx = x + tw / 2, my = y + th / 2;
      var t = d.fill('rect', { x: x, y: y, width: tw - 10, height: th - 10, fill: col(f1), opacity: .55, 'class': 'mf-tile', style: '--f1:' + col(f1) + ';--f2:' + col(f2) + ';animation-delay:' + n(-r.range(0, 20)) + 's;animation-duration:' + n(r.range(16, 26)) + 's' }, .3 + (i + j) * .15);
      var m = d.fill('g', {}, .5 + (i + j) * .15), cx = x + (tw - 10) / 2, cy = y + (th - 10) / 2;
      var add = function (tag, a) { return S(tag, a, m); };
      if (kind === 'disc') { add('circle', { cx: cx, cy: cy, r: 52, fill: col('paper'), opacity: .8 }); add('circle', { cx: cx, cy: cy, r: 52, fill: g, opacity: .7 }); add('circle', { cx: cx, cy: cy, r: 52, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.6 }); }
      else if (kind === 'square') { add('rect', { x: cx - 48, y: cy - 48, width: 96, height: 96, rx: 6, fill: col('paper'), opacity: .85 }); add('rect', { x: cx - 48, y: cy - 48, width: 96, height: 96, rx: 6, fill: g, opacity: .7 }); add('rect', { x: cx - 48, y: cy - 48, width: 96, height: 96, rx: 6, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.6 }); }
      else if (kind === 'contour') { for (var q = 1; q <= 6; q++) add('ellipse', { cx: cx + r.range(-3, 3), cy: cy + r.range(-3, 3), rx: q * 12, ry: q * 9.5, fill: 'none', stroke: 'var(--ink)', 'stroke-width': q % 3 ? 1 : 1.8, opacity: .8 }); }
      else if (kind === 'bars') { for (var b = 0; b < 6; b++) { var bh = r.range(30, 110); add('rect', { x: cx - 60 + b * 21, y: cy + 55 - bh, width: 15, height: bh, fill: col(r.pick(['paper', 'ink', 'paper'])), opacity: .85, stroke: 'var(--ink)', 'stroke-width': 1.2 }); } }
      else if (kind === 'overlap') { [-26, 0, 26].forEach(function (o, z) { add('circle', { cx: cx + o, cy: cy + (z === 1 ? 16 : -10), r: 40, fill: col(['paper', 'paper', 'ink'][z]), opacity: z === 2 ? .12 : .55, stroke: 'var(--ink)', 'stroke-width': 1.4 }); }); }
      else { add('path', { d: 'M' + (cx - 48) + ' ' + cy + 'A48 48 0 0 1 ' + (cx + 48) + ' ' + cy + 'Z', fill: col('paper'), opacity: .9, stroke: 'var(--ink)', 'stroke-width': 1.6 }); add('path', { d: 'M' + (cx - 48) + ' ' + cy + 'A48 48 0 0 0 ' + (cx + 48) + ' ' + cy + 'Z', fill: g, stroke: 'var(--ink)', 'stroke-width': 1.6 }); }
      d.line(wr(x, y, tw - 10, th - 10, r, 2), 1.8, 'var(--ink)', .9, .2 + (i + j) * .12);
    }
  };

  var KINDS = Object.keys(K);
  function build(frag, kind, seed) {
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'rv-mf__svg', 'aria-hidden': 'true', focusable: 'false' }), g = S('g', {}, svg);
    var r = Rng(seed), d = Draw(g, 'mf' + hash(seed)().toString(36) + '-'), c = r.shuffle(ACC);
    d.g = g; K[kind](d, r, c); frag.appendChild(svg);
  }

  /* ---------- layout ---------- */
  var layer, io, frags = [], t, seedBase = slug();
  function overlapsLoop(y0, y1) {
    var hosts = [].slice.call(doc.querySelectorAll('.rds-loop-host:not(.rds-footer)')), top = main.getBoundingClientRect().top + scrollY;
    return hosts.some(function (h) { if (h.classList.contains('rds-footer')) return false; var b = h.getBoundingClientRect(), a = b.top + scrollY - top; return !(y1 < a - 20 || y0 > a + b.height + 20); });
  }
  /* vertical ranges (px from the top of main) of tinted bands with wavy edges; narrow pages keep art out of them */
  function bandRanges() {
    var top = main.getBoundingClientRect().top + scrollY;
    return [].slice.call(main.querySelectorAll('.rds-band-sunk')).map(function (b) { var r = b.getBoundingClientRect(); return [r.top + scrollY - top - 34, r.bottom + scrollY - top + 34]; });
  }
  function layout() {
    var vw = doc.documentElement.clientWidth, Hh = main.offsetHeight, wide = vw >= 1000, gut = Math.max(0, (vw - 1120) / 2), r = Rng(seedBase + ':layout');
    layer.textContent = ''; frags = []; if (io) io.disconnect();
    layer.className = 'rv-mf-layer ' + (wide ? 'is-wide' : 'is-narrow') + (gut < 150 && wide ? ' is-tight' : '');
    var bands = wide ? [] : bandRanges(), rail = wide && doc.querySelector('[data-toc]'), size, side = rail ? 1 : (r() < .5 ? 0 : 1), y = wide ? 120 : 320, order = r.shuffle(KINDS), i = 0;
    if (wide) size = Math.max(420, Math.min(620, gut + 300)); else size = Math.min(vw * 1.0, 380);
    var step = wide ? size * 1.12 : size * 1.7;
    while (y + size * .6 < Hh && frags.length < 28) {
      var h = size * H / W;
      if (!overlapsLoop(y, y + h) && !bands.some(function (b) { return !(y + h < b[0] || y > b[1]); })) {
        var kind = order[i++ % order.length], el = doc.createElement('div'); el.className = 'rv-mf rv-mf--' + kind; el.setAttribute('data-side', side ? 'r' : 'l');
        var overlap = wide ? (gut < 150 ? 70 : 24) : 0, x;
        if (wide) x = side ? (vw - gut) - overlap : gut + overlap - size; else x = side ? vw - size * .62 : -size * .38;
        el.style.cssText = 'width:' + n(size) + 'px;height:' + n(h) + 'px;top:' + n(y) + 'px;left:' + n(x) + 'px;--rot:' + n(r.range(-5, 5)) + 'deg;--dur:' + n(r.range(22, 34)) + 's';
        build(el, kind, seedBase + ':' + frags.length + ':' + kind); layer.appendChild(el); frags.push(el); if (io) io.observe(el);
      }
      side = rail ? 1 : (side ? 0 : 1); y += step + r.range(0, size * .35);
    }
  }
  function init() {
    layer = doc.createElement('div'); layer.className = 'rv-mf-layer'; layer.setAttribute('aria-hidden', 'true');
    main.classList.add('rv-has-margins'); main.insertBefore(layer, main.firstChild);
    var calm = matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')));
    if (calm) layer.classList.add('is-still');
    if (window.IntersectionObserver) io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in', 'is-live'); } else e.target.classList.remove('is-live'); }); }, { rootMargin: '10% 0px', threshold: 0 });
    else layer.classList.add('is-still');
    layout();
    var lastW = innerWidth, lastH = main.offsetHeight;
    function again() { clearTimeout(t); t = setTimeout(function () { var hh = main.offsetHeight; if (Math.abs(innerWidth - lastW) > 40 || Math.abs(hh - lastH) > 300) { lastW = innerWidth; lastH = hh; layout(); } }, 350); }
    addEventListener('resize', again); addEventListener('load', again);
    if (window.ResizeObserver) new ResizeObserver(again).observe(main);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener && matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) { layer.classList.toggle('is-still', e.matches); });
  }

  var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = (script && script.src ? script.src : 'assets/rds/margins.js').replace(/margins\.js/, 'margins.css');
  var go = function () { /* wait for fonts/layout so page height is final */ var run = function () { init(); }; (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(run, run); };
  l.onload = l.onerror = function () { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', go); else go(); };
  doc.head.appendChild(l);
  window.RDSMargins = { relayout: function () { if (layer) layout(); }, kinds: KINDS };
})();
