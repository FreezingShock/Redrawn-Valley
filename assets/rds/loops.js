/* Redrawn Design System: looping backgrounds. Original, seeded, code-drawn loops that play behind hero sections
   (the "video" layer, but made of SVG so it is a few KB, sharp at any size and in our tokens).
   <section data-rds-loop="plan|ridge|contour|tiles" data-seed="studies"> ... </section>
   Kinds: plan (a site plan builds up: lot, building, stalls, trees, flow), ridge (ridgelines drawn in ink, redrawn in brick),
   contour (survey contours draw themselves around a hill and a basin), tiles (flat tiles shift colour and shape in a wave).
   Every loop is one seamless 28s cycle: it starts empty, builds, holds, then fades back to empty.
   Fallbacks: prefers-reduced-motion, Save-Data and 2g connections show the finished drawing as a still; offscreen,
   hidden tabs and the visitor's Pause button stop it. Same seed, same drawing; the layout fits the box it sits in.
   API: RDSLoops.mount(host, kind, seed), RDSLoops.pause(), RDSLoops.play(). Documented in DESIGN.md "Looping backgrounds". */
(function () {
  'use strict';
  var doc = document, NS = 'http://www.w3.org/2000/svg', T = 28000, STORE = 'rv-loops-paused';
  var script = doc.currentScript, reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var EASE = 'cubic-bezier(.45,0,.2,1)', POP = 'cubic-bezier(.34,1.4,.5,1)';

  /* ---------- seeded random (same recipe as motifs.js) ---------- */
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
  function pt(x, y) { return f(x) + ' ' + f(y); }

  /* ---------- tokens ---------- */
  var SAT = ['moss', 'slate', 'brick', 'ochre', 'sky', 'rose', 'kelly', 'peri'], PALE = ['sand', 'sage', 'blush', 'raised'];
  var VAR = { moss: '--moss', slate: '--slate', brick: '--brick', ochre: '--ochre', sky: '--sky', rose: '--rose', kelly: '--kelly', peri: '--peri', sand: '--paper-sunk', sage: '--moss-tint', blush: '--brick-tint', raised: '--paper-raised', ink: '--ink', paper: '--paper' };
  function v(n) { return 'var(' + VAR[n] + ')'; }

  /* ---------- svg + timeline helpers ---------- */
  function S(tag, attrs, parent) { var e = doc.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function Ctx(animated) {
    var c = { list: [], on: animated };
    /* stops: [[offset 0..1, {props}, easing?]]; the first and last stop are extended to 0 and 1 so the cycle closes on itself */
    c.tl = function (el, stops) {
      if (!c.on) return;
      var kf = stops.map(function (s) { var o = { offset: s[0] }; for (var k in s[1]) o[k] = s[1][k]; if (s[2]) o.easing = s[2]; return o; });
      if (kf[0].offset > 0) { var a = Object.assign({}, kf[0], { offset: 0 }); delete a.easing; kf.unshift(a); }
      var l = kf[kf.length - 1]; if (l.offset < 1) { var b = Object.assign({}, l, { offset: 1 }); delete b.easing; kf.push(b); }
      c.list.push({ el: el, kf: kf });
    };
    c.draw = function (p, t0, t1) {
      if (!c.on) return;
      p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1 1';
      c.tl(p, [[0, { strokeDashoffset: 1, opacity: 0 }], [t0, { strokeDashoffset: 1, opacity: 0 }], [t0 + .003, { strokeDashoffset: 1, opacity: 1 }, EASE], [t1, { strokeDashoffset: 0, opacity: 1 }]]);
    };
    c.fade = function (el, t0, t1, to) { c.tl(el, [[0, { opacity: 0 }], [t0, { opacity: 0 }, EASE], [t1, { opacity: to == null ? 1 : to }]]); };
    c.pop = function (el, t0, t1) { c.tl(el, [[0, { transform: 'scale(0)', opacity: 0 }], [t0, { transform: 'scale(0)', opacity: 0 }, POP], [t0 + (t1 - t0) * .55, { transform: 'scale(1.1)', opacity: 1 }, EASE], [t1, { transform: 'scale(1)', opacity: 1 }]]); };
    /* the whole drawing: empty, builds, holds, fades back to empty */
    c.cycle = function (el, hold) { c.tl(el, [[0, { opacity: 0 }], [.006, { opacity: 1 }], [hold || .9, { opacity: 1 }, 'ease-in'], [.985, { opacity: 0 }]]); };
    return c;
  }
  /* hand-drawn feel: lines are bowed a little instead of ruler-straight */
  function wl(x1, y1, x2, y2, rnd, j) { j = j == null ? 1.6 : j; return 'M' + pt(x1 + rnd.range(-j / 2, j / 2), y1 + rnd.range(-j / 2, j / 2)) + 'Q' + pt((x1 + x2) / 2 + rnd.range(-j, j), (y1 + y2) / 2 + rnd.range(-j, j)) + ' ' + pt(x2 + rnd.range(-j / 2, j / 2), y2 + rnd.range(-j / 2, j / 2)); }
  function wr(x, y, w, h, rnd, j) { return wl(x, y, x + w, y, rnd, j) + wl(x + w, y, x + w, y + h, rnd, j) + wl(x + w, y + h, x, y + h, rnd, j) + wl(x, y + h, x, y, rnd, j); }
  function line(parent, d, stroke, sw, extra) { var a = { d: d, fill: 'none', stroke: stroke, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }; for (var k in (extra || {})) a[k] = extra[k]; return S('path', a, parent); }
  function ringPath(cx, cy, r, rnd, k) {
    var pts = [], n = 72, ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], am = [.10 + k * .004, .06, .035];
    for (var i = 0; i < n; i++) { var t = i / n * 6.2832, rr = r * (1 + am[0] * Math.sin(2 * t + ph[0]) + am[1] * Math.sin(3 * t + ph[1]) + am[2] * Math.sin(5 * t + ph[2])); pts.push(pt(cx + rr * Math.cos(t), cy + rr * .86 * Math.sin(t))); }
    return 'M' + pts.join('L') + 'Z';
  }
  function paperGrid(defs, id, size, op, col) { var p = S('pattern', { id: id, width: size, height: size, patternUnits: 'userSpaceOnUse' }, defs); S('path', { d: 'M' + size + ' 0H0V' + size, fill: 'none', stroke: col || 'var(--ink)', 'stroke-opacity': op, 'stroke-width': 1 }, p); }

  /* ---------- kinds: (svg, W, H, rnd, c, uid) ---------- */
  var K = {};

  /* A site plan builds up: lot, building, stalls, trees, flow line, dimension string. */
  K.plan = function (svg, W, H, rnd, c, id) {
    var defs = S('defs', {}, svg), wide = W >= 900;
    paperGrid(defs, id + 'g', 28, .13);
    S('rect', { width: W, height: H, fill: 'url(#' + id + 'g)' }, svg);
    var root = S('g', {}, svg), R = wide ? { x: W * .6, y: H * .08, w: W * .37, h: H * .8 } : { x: W * .04, y: H * .42, w: W * .92, h: H * .54 };
    var lw = Math.min(R.w, R.h * 1.9), lh = lw / 1.9, lx = R.x + (R.w - lw) / 2, ly = R.y + (R.h - lh) / 2 - 8, i, j;
    /* lot, drawn as a double line */
    var lot = line(root, wr(lx, ly, lw, lh, rnd, 2.4) + wr(lx + 5, ly + 5, lw - 10, lh - 10, rnd, 1.2), 'var(--ink)', 1.8); c.draw(lot, .03, .13);
    /* building with hatch */
    var bx = lx + lw * .08, bw = lw * .84, bh = lh * .2, by = ly + lh * .08, hd = '';
    var bld = line(root, wr(bx, by, bw, bh, rnd, 1.6), 'var(--ink)', 2); c.draw(bld, .11, .19);
    for (i = -bh; i < bw; i += 9) hd += 'M' + pt(bx + i, by + bh) + 'L' + pt(bx + i + bh, by);
    var cp = S('clipPath', { id: id + 'c' }, defs); S('rect', { x: bx, y: by, width: bw, height: bh }, cp);
    var hat = line(root, hd, 'var(--ink)', 1, { 'clip-path': 'url(#' + id + 'c)', 'stroke-opacity': .42 }); c.fade(hat, .17, .24);
    /* stalls: three rows, each one path so a row draws left to right */
    var rows = 3, n = 17, sx = lx + lw * .08, sw = lw * .84, y0 = by + bh + lh * .14, rowH = lh * .13, gap = lh * .21, stallsY = [];
    for (j = 0; j < rows; j++) {
      var y = y0 + j * (rowH + gap), d = wl(sx, y, sx + sw, y, rnd, 1.2) + wl(sx, y + rowH, sx + sw, y + rowH, rnd, 1.2);
      for (i = 0; i <= n; i++) d += 'M' + pt(sx + sw * i / n, y) + 'L' + pt(sx + sw * i / n, y + rowH);
      var st = line(root, d, 'var(--ink)', 1.3, { 'stroke-opacity': .85 }); c.draw(st, .19 + j * .06, .3 + j * .06); stallsY.push(y);
    }
    /* trees: canopy circles that pop in, centred on the islands between rows and at the lot edge */
    var spots = [];
    for (j = 0; j < rows - 1; j++) for (i = 1; i < 6; i++) spots.push([sx + sw * (i / 6), stallsY[j] + rowH + gap / 2]);
    for (i = 0; i < 4; i++) spots.push([lx + lw * (.18 + i * .22), ly + lh * .965 - lh * .03]);
    spots = rnd.shuffle(spots).slice(0, wide ? 11 : 8);
    spots.forEach(function (p, k) {
      var r = Math.max(8, Math.min(lh * rnd.range(.065, .095), 22)), g = S('g', {}, root), t0 = .38 + k * .02;
      S('circle', { cx: f(p[0]), cy: f(p[1]), r: f(r), fill: 'var(--moss-tint)', stroke: 'var(--moss)', 'stroke-width': 1.7 }, g);
      line(g, 'M' + pt(p[0] - r * .55, p[1] - r * .1) + 'Q' + pt(p[0], p[1] - r * .75) + ' ' + pt(p[0] + r * .55, p[1] - r * .1), 'var(--moss)', 1.2);
      S('circle', { cx: f(p[0]), cy: f(p[1]), r: 1.8, fill: 'var(--moss)' }, g);
      c.pop(g, t0, t0 + .08);
    });
    /* flow line and arrowhead */
    var fx0 = sx, fy0 = by + bh + lh * .08, fx1 = lx + lw * .9, fy1 = ly + lh * .93;
    var flow = line(root, 'M' + pt(fx0, fy0) + 'C' + pt(lx + lw * .3, ly + lh * .1) + ' ' + pt(lx + lw * .5, ly + lh * .95) + ' ' + pt(fx1, fy1), 'var(--slate)', 2.2); c.draw(flow, .62, .75);
    var arr = line(root, 'M' + pt(fx1 - 12, fy1 - 8) + 'L' + pt(fx1, fy1) + 'L' + pt(fx1 - 13, fy1 + 4), 'var(--slate)', 2.2); c.fade(arr, .74, .78);
    /* dimension string (brick), scale bar and north arrow */
    var dy = ly + lh + 16, dim = line(root, 'M' + pt(lx, dy) + 'H' + pt(lx + lw, dy) + 'M' + pt(lx, dy - 6) + 'v12M' + pt(lx + lw, dy - 6) + 'v12M' + pt(lx + lw / 2, dy - 4) + 'v8', 'var(--brick)', 1.6); c.draw(dim, .7, .8);
    var bar = line(root, 'M' + pt(lx, ly - 18) + 'h' + f(lw * .22) + 'M' + pt(lx, ly - 22) + 'v8M' + pt(lx + lw * .11, ly - 21) + 'v6M' + pt(lx + lw * .22, ly - 22) + 'v8', 'var(--ink)', 1.4); c.draw(bar, .78, .84);
    var na = S('path', { d: 'M' + pt(lx + lw - 6, ly - 8) + 'l7 -24l7 24l-7 -6z', fill: 'var(--ink)' }, root); c.pop(na, .8, .86);
    return root;
  };

  /* Ridgelines: each one drawn in ink, then redrawn in brick just beneath it, with a low brick sun (the logo, grown up). */
  K.ridge = function (svg, W, H, rnd, c) {
    var wide = W >= 900, layers = wide ? 5 : 4, root = S('g', {}, svg), N = Math.max(40, Math.round(W / 16)), tints = ['sage', 'blush', 'sand', 'sage', 'blush'], i, x;
    var sunR = Math.min(W, H) * (wide ? .1 : .13), sunX = W * (wide ? rnd.range(.62, .82) : rnd.range(.6, .8)), sunY = H * (wide ? .34 : .36);
    var sun = S('g', {}, root);
    S('circle', { cx: f(sunX), cy: f(sunY), r: f(sunR), fill: 'var(--brick-tint)', stroke: 'var(--brick)', 'stroke-width': 1.8 }, sun);
    S('circle', { cx: f(sunX), cy: f(sunY), r: f(sunR * 1.35), fill: 'none', stroke: 'var(--brick)', 'stroke-width': 1, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round' }, sun);
    c.tl(sun, [[0, { transform: 'translateY(40px)', opacity: 0 }], [.02, { transform: 'translateY(40px)', opacity: 0 }, EASE], [.22, { transform: 'translateY(0px)', opacity: 1 }]]);
    for (i = 0; i < layers; i++) {
      var base = H * (.4 + .46 * (i / (layers - 1))) , amp = H * (.05 + .012 * i), p = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], fr = [rnd.range(.004, .007), rnd.range(.011, .016), rnd.range(.025, .035)];
      var pts = [], pts2 = [], dx = W / N;
      for (x = -dx; x <= W + dx; x += dx) {
        var y = base + amp * (Math.sin(x * fr[0] + p[0]) + .5 * Math.sin(x * fr[1] + p[1]) + .22 * Math.sin(x * fr[2] + p[2]));
        pts.push(pt(x, y)); pts2.push(pt(x, y + 9 + 2.5 * Math.sin(x * .03 + i)));
      }
      var g = S('g', {}, root), t0 = .04 + i * (wide ? .07 : .085);
      var fill = S('g', {}, g);
      S('path', { d: 'M' + pts.join('L') + 'L' + pt(W + dx, H) + 'L' + pt(-dx, H) + 'Z', fill: 'var(--paper)' }, fill);
      S('path', { d: 'M' + pts.join('L') + 'L' + pt(W + dx, H) + 'L' + pt(-dx, H) + 'Z', fill: v(tints[i]), 'fill-opacity': .7 }, fill);
      c.fade(fill, t0 + .04, t0 + .14);
      var ink = line(g, 'M' + pts.join('L'), 'var(--ink)', 1.8); c.draw(ink, t0, t0 + .2);
      var br = line(g, 'M' + pts2.join('L'), 'var(--brick)', 1.8); c.draw(br, t0 + .08, t0 + .26);
    }
    return root;
  };

  /* Survey contours around a hill (moss) and a basin (slate) draw themselves outward in, with a slow-turning dashed arc. */
  K.contour = function (svg, W, H, rnd, c, id) {
    var defs = S('defs', {}, svg), wide = W >= 900;
    var ink = c.tone === 'ink' ? 'var(--on-ink-muted)' : 'var(--ink)';
    paperGrid(defs, id + 'g', 32, .11, ink);
    S('rect', { width: W, height: H, fill: 'url(#' + id + 'g)' }, svg);
    var spin = S('circle', { cx: f(W * (wide ? .78 : .7)), cy: f(H * (wide ? .46 : .62)), r: f(Math.min(W, H) * (wide ? .46 : .4)), fill: 'none', stroke: 'var(--brick)', 'stroke-width': 1.5, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, svg);
    c.tl(spin, [[0, { transform: 'rotate(0deg)' }], [1, { transform: 'rotate(360deg)' }]]);
    var root = S('g', {}, svg), hills = [[W * (wide ? .72 : .66), H * (wide ? .46 : .66), 'moss'], [W * (wide ? .9 : .2), H * (wide ? .78 : .82), 'slate']], unit = Math.min(W, H) * (wide ? .062 : .075), k;
    hills.forEach(function (h, hi) {
      var n = hi ? 7 : 10, t0 = .03 + hi * .1, col = h[2];
      for (k = n; k >= 1; k--) {
        var heavy = k % 4 === 0, p = line(root, ringPath(h[0], h[1], unit * k * (hi ? .9 : 1), rnd, k), c.tone === 'ink' ? ink : 'var(--' + col + ')', heavy ? 2 : 1.2, { 'stroke-opacity': heavy ? 1 : .75 });
        var s = t0 + (n - k) * (.34 / n); c.draw(p, s, s + .13);
      }
      var m = line(root, 'M' + pt(h[0] - 6, h[1]) + 'h12M' + pt(h[0], h[1] - 6) + 'v12', c.tone === 'ink' ? ink : 'var(--' + col + ')', 1.8); c.fade(m, .5 + hi * .06, .56 + hi * .06);
    });
    /* survey points */
    for (k = 0; k < 14; k++) {
      var sx = rnd.range(W * (wide ? .45 : .06), W * .96), sy = rnd.range(H * .1, H * .92), mk = line(root, 'M' + pt(sx - 3.5, sy) + 'h7M' + pt(sx, sy - 3.5) + 'v7', ink, 1.3, { 'stroke-opacity': .7 });
      c.fade(mk, .52 + k * .012, .56 + k * .012);
    }
    return root;
  };

  /* Flat tiles shift colour and shape in a diagonal wave, the contact-sheet recipe at room scale. */
  K.tiles = function (svg, W, H, rnd, c, id) {
    var defs = S('defs', {}, svg), wide = W >= 900, cell = wide ? 120 : 84, cols = Math.ceil(W / cell), rows = Math.ceil(H / cell), gap = 6, i, j;
    var gp = S('pattern', { id: id + 'g', width: 9, height: 9, patternUnits: 'userSpaceOnUse' }, defs); S('path', { d: 'M9 0H0V9', fill: 'none', stroke: 'var(--ink)', 'stroke-opacity': .5, 'stroke-width': 1 }, gp);
    var root = S('g', {}, svg), skip = wide ? 0.38 : 0.5;
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
      if (wide && i < cols * .55) continue;
      if (rnd() < skip) continue;
      var x = i * cell + gap / 2, y = j * cell + gap / 2, s = cell - gap, pale = rnd() < .28, a = pale ? rnd.pick(PALE.slice(0, 3)) : rnd.pick(SAT), b = rnd.pick(SAT.concat(PALE.slice(0, 3)).filter(function (q) { return q !== a; }));
      var g = S('g', {}, root), wave = (i + j) / (cols + rows), w0 = .04 + wave * .5;
      S('rect', { x: x, y: y, width: s, height: s, rx: 6, fill: v(a) }, g);
      var over = S('rect', { x: x, y: y, width: s, height: s, rx: 6, fill: v(b), opacity: 0 }, g);
      c.tl(over, [[0, { opacity: 0 }], [w0, { opacity: 0 }, EASE], [w0 + .06, { opacity: 1 }], [w0 + .2, { opacity: 1 }, EASE], [w0 + .26, { opacity: 0 }]]);
      /* tile content: grid disc, grid square, half disc or ring; shape pops with the wave */
      var kind = rnd.int(0, 4), cx = x + s / 2, cy = y + s / 2, r = s * rnd.range(.24, .34), shape = null, sc = rnd.pick(SAT.filter(function (q) { return q !== a && q !== b; })), sg = S('g', {}, g);
      if (kind === 0) { S('circle', { cx: f(cx), cy: f(cy), r: f(r), fill: v(sc) }, sg); S('circle', { cx: f(cx), cy: f(cy), r: f(r), fill: 'url(#' + id + 'g)' }, sg); shape = sg; }
      else if (kind === 1) { S('rect', { x: f(cx - r), y: f(cy - r), width: f(2 * r), height: f(2 * r), fill: v(sc) }, sg); S('rect', { x: f(cx - r), y: f(cy - r), width: f(2 * r), height: f(2 * r), fill: 'url(#' + id + 'g)' }, sg); shape = sg; }
      else if (kind === 2) { S('path', { d: 'M' + pt(cx, cy - r) + 'A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + pt(cx, cy + r) + 'Z', fill: v(sc) }, sg); shape = sg; }
      else if (kind === 3) { S('circle', { cx: f(cx), cy: f(cy), r: f(r), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.8 }, sg); S('circle', { cx: f(cx), cy: f(cy), r: f(r * .5), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.8 }, sg); shape = sg; }
      if (shape) { var q0 = w0 + .02; c.tl(shape, [[0, { transform: 'rotate(0deg) scale(1)' }], [q0, { transform: 'rotate(0deg) scale(1)' }, EASE], [q0 + .12, { transform: 'rotate(180deg) scale(.7)' }, EASE], [q0 + .24, { transform: 'rotate(360deg) scale(1)' }]]); }
    }
    return root;
  };

  /* ---------- mounting ---------- */
  var mounts = [], uid = 0, userPaused = false, lowData = function () { var n = navigator.connection || {}; return !!(n.saveData || /^(slow-)?2g$/.test(n.effectiveType || '')); };
  try { userPaused = localStorage.getItem(STORE) === '1'; } catch (e) { }
  function slug() { var m = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean); return m.join('/') || 'home'; }
  function stillMode(host) { return reduceMQ.matches || lowData() || host.hasAttribute('data-loop-still') || !Element.prototype.animate; }

  function run(m) {
    var go = !m.still && !userPaused && m.visible && !doc.hidden;
    m.anims.forEach(function (a) { if (go) a.play(); else a.pause(); });
  }
  function teardown(m) { m.anims.forEach(function (a) { a.cancel(); }); m.anims = []; if (m.layer && m.layer.parentNode) m.layer.parentNode.removeChild(m.layer); if (m.btn && m.btn.parentNode) m.btn.parentNode.removeChild(m.btn); }

  function build(m) {
    teardown(m);
    var host = m.host, W = Math.max(280, Math.round(host.clientWidth)), H = Math.max(240, Math.round(host.clientHeight * (host.getAttribute('data-loop-fit') === 'top' ? .38 : 1))), still = stillMode(host);
    var kind = K[m.kind] ? m.kind : 'plan', rnd = Rng(m.seed + '|loop|' + kind), c = Ctx(!still), id = 'l' + (++uid); c.tone = host.getAttribute('data-loop-tone') || '';
    var layer = doc.createElement('div'); layer.className = 'rds-loop rds-loop--' + kind + (still ? ' is-still' : ''); layer.setAttribute('aria-hidden', 'true'); layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:-1';
    var svg = S('svg', { width: '100%', height: '100%', viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid slice', focusable: 'false', role: 'presentation' });
    var root = K[kind](svg, W, H, rnd, c, id);
    if (kind !== 'tiles') c.cycle(root, .9);
    layer.appendChild(svg); host.insertBefore(layer, host.firstChild);
    m.layer = layer; m.still = still; m.W = W; m.H = H;
    m.anims = c.list.map(function (a) { return a.el.animate(a.kf, { duration: T, iterations: Infinity, easing: 'linear', fill: 'both' }); });
    if (!still) addToggle(m);
    run(m);
  }

  function addToggle(m) {
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'rds-loop__toggle';
    b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><g class="lt-pause"><path d="M6.5 4.5v11M13.5 4.5v11"/></g><path class="lt-play" d="M6 4.2l9 5.8-9 5.8z"/></svg><span class="lt-label"></span>';
    b.addEventListener('click', function () { setPaused(!userPaused); });
    m.host.appendChild(b); m.btn = b; label(b);
  }
  function label(b) { b.setAttribute('aria-pressed', userPaused ? 'true' : 'false'); b.querySelector('.lt-label').textContent = userPaused ? 'Play background' : 'Pause background'; b.setAttribute('aria-label', userPaused ? 'Play the background animation' : 'Pause the background animation'); }
  function setPaused(p) {
    userPaused = p; try { localStorage.setItem(STORE, p ? '1' : '0'); } catch (e) { }
    doc.documentElement.classList.toggle('rv-loops-paused', p);
    mounts.forEach(function (m) { run(m); if (m.btn) label(m.btn); });
  }

  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { es.forEach(function (e) { var m = e.target.__loop; if (m) { m.visible = e.isIntersecting; run(m); } }); }, { threshold: 0 }) : null;
  var ro = window.ResizeObserver ? new ResizeObserver(function (es) {
    es.forEach(function (e) {
      var m = e.target.__loop; if (!m) return; clearTimeout(m.t);
      m.t = setTimeout(function () { var W = e.target.clientWidth, H = e.target.clientHeight; if (Math.abs(W - m.W) / m.W > .12 || Math.abs(H * (e.target.getAttribute('data-loop-fit') === 'top' ? .38 : 1) - m.H) / m.H > .25 || (W >= 900) !== (m.W >= 900)) build(m); }, 300);
    });
  }) : null;

  function mount(host, kind, seed) {
    if (host.__loop) { host.__loop.kind = kind || host.__loop.kind; host.__loop.seed = seed || host.__loop.seed; build(host.__loop); return host; }
    host.classList.add('rds-loop-host');
    var m = { host: host, kind: kind || host.getAttribute('data-rds-loop') || 'plan', seed: seed || host.getAttribute('data-seed') || slug(), anims: [], visible: true };
    host.__loop = m; mounts.push(m); build(m);
    if (io) { m.visible = false; io.observe(host); } if (ro) ro.observe(host);
    return host;
  }
  function init() {
    doc.documentElement.classList.toggle('rv-loops-paused', userPaused);
    var ft = doc.querySelector('.rds-footer:not([data-rds-loop]):not([data-loop-none])');
    if (ft && ft.children.length) { ft.setAttribute('data-rds-loop', 'contour'); ft.setAttribute('data-loop-tone', 'ink'); ft.setAttribute('data-seed', 'foot:' + slug()); }
    [].slice.call(doc.querySelectorAll('[data-rds-loop]')).forEach(function (h) { mount(h); });
  }
  function onMotion() { mounts.forEach(build); }
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onMotion);
  doc.addEventListener('visibilitychange', function () { mounts.forEach(run); });

  /* stylesheet: loaded here so a page only needs the one script tag */
  var cssReady = !(script && script.src), cssCbs = [];
  function whenCSS(cb) { if (cssReady) cb(); else cssCbs.push(cb); }
  if (!cssReady) { var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = script.src.replace(/loops\.js/, 'loops.css'); l.onload = l.onerror = function () { cssReady = true; cssCbs.splice(0).forEach(function (cb) { cb(); }); }; doc.head.appendChild(l); }
  /* margin sketches ride along: every page that loads loops.js also gets the big side-margin drawings */
  if (script && script.src && !window.RDSMargins && !doc.querySelector('script[data-rds-margins]')) { var ms = doc.createElement('script'); ms.src = script.src.replace(/loops\.js/, 'margins.js'); ms.defer = true; ms.setAttribute('data-rds-margins', ''); doc.head.appendChild(ms); }
  window.RDSLoops = { mount: mount, pause: function () { setPaused(true); }, play: function () { setPaused(false); }, kinds: Object.keys(K) };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { whenCSS(init); }); else whenCSS(init);
})();
