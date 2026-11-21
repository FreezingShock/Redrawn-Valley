/* Redrawn type lab: three "writing" effects, plain script, no dependencies.
   1. stroke  - single-stroke letterforms drawn pen-first (Hershey data in hershey.js), seeded wobble, nib dot.
   2. type    - typewriter for any real font: per-key timing, strike-in, small baseline drift, caret.
   3. sweep   - real handwriting fonts revealed word by word, left to right, like a pen passing over.
   Speeds: "fast" | "slow" | a number (multiplier). Reduced motion: nothing autoplays and text is simply shown;
   a button the reader presses still plays, because that is their request.
   Markup:  <h2 data-rv-write="stroke|type|sweep" data-speed="fast" data-font="script" data-size="56">Text</h2>
   API:     RVWrite.mount(el, opts) -> { play(speed), finish(), reset() };  RVWrite.scan(root) */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return !!(reduce && reduce.matches); }

  /* ---------- helpers ---------- */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function ease(u) { return 0.5 - 0.5 * Math.cos(Math.PI * u); }
  function mult(speed) { return typeof speed === 'number' ? speed : speed === 'fast' ? 1 : speed === 'slow' ? 0.15 : 0.5; }
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function whenVisible(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: 0.35 });
    io.observe(el);
  }

  /* ---------- 1. stroke writer ---------- */
  var ACCENTS = { '́': [[2, 0, 6, -3]], '̀': [[6, 0, 2, -3]], '̃': [[1, -1, 3, -3, 5, -1, 7, -3]], '̈': [[2, -2, 2, -2.1], [6, -2, 6, -2.1]], '̂': [[1, -1, 4, -3.5, 7, -1]] };
  var SUBS = { '\u00B7': '.', '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '--', '°': '^', '…': '...' };

  function parseGlyph(font, ch) {
    var g = font.g[ch]; if (!g) return null;
    if (g._p) return g._p;
    var strokes = g[1] ? g[1].split(';').map(function (s) {
      var n = s.split(' '), pts = []; for (var i = 0; i < n.length; i++) { var xy = n[i].split(','); pts.push([+xy[0], +xy[1]]); } return pts;
    }) : [];
    g._p = { w: g[0] * 2, s: strokes };
    return g._p;
  }

  /* smooth a polyline into cubic segments, keeping sharp corners sharp */
  function smooth(pts) {
    if (pts.length < 2) return '';
    var d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    if (pts.length === 2) return d + 'L' + pts[1][0].toFixed(2) + ' ' + pts[1][1].toFixed(2);
    var tan = pts.map(function (p, i) {
      if (i === 0 || i === pts.length - 1) return [0, 0];
      var a = pts[i - 1], b = pts[i + 1], v1 = [p[0] - a[0], p[1] - a[1]], v2 = [b[0] - p[0], b[1] - p[1]];
      var l1 = Math.hypot(v1[0], v1[1]) || 1, l2 = Math.hypot(v2[0], v2[1]) || 1;
      var cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2);
      if (cos < 0.3) return [0, 0]; /* corner: do not round it */
      return [(b[0] - a[0]) / 6, (b[1] - a[1]) / 6];
    });
    for (var i = 0; i < pts.length - 1; i++) {
      var p = pts[i], q = pts[i + 1], t1 = tan[i], t2 = tan[i + 1];
      d += 'C' + (p[0] + t1[0]).toFixed(2) + ' ' + (p[1] + t1[1]).toFixed(2) + ' ' + (q[0] - t2[0]).toFixed(2) + ' ' + (q[1] - t2[1]).toFixed(2) + ' ' + q[0].toFixed(2) + ' ' + q[1].toFixed(2);
    }
    return d;
  }

  function layout(text, font, o, width) {
    /* returns lines of letters: {strokes:[[x,y]...], x, w}; units are Hershey units */
    var rand = rng(o.seed), words = text.split(/(\s+)/), lines = [[]], lineW = 0, maxU = width / o.scale;
    var track = o.track, spaceW = 12;
    words.forEach(function (w) {
      if (/^\s+$/.test(w)) { lineW += spaceW * w.length; lines[lines.length - 1].push({ gap: spaceW * w.length }); return; }
      var letters = [], ww = 0;
      var norm = w.normalize('NFD');
      for (var i = 0; i < norm.length; i++) {
        var ch = norm[i];
        if (ACCENTS[ch] && letters.length) { letters[letters.length - 1].accent = ACCENTS[ch]; continue; }
        if (SUBS[ch]) ch = SUBS[ch];
        for (var k = 0; k < ch.length; k++) {
          var gp = parseGlyph(font, ch[k]);
          if (!gp) { if (ch[k] === ' ') continue; gp = parseGlyph(font, '?'); }
          if (!gp) continue;
          letters.push({ ch: ch[k], gp: gp, x: ww, accent: null });
          ww += gp.w + track;
        }
      }
      if (lineW + ww > maxU && lines[lines.length - 1].length) { lines.push([]); lineW = 0; }
      lines[lines.length - 1].push({ word: letters, w: ww });
      lineW += ww;
    });
    return lines;
  }

  function stroke(el, opts) {
    var text = (opts.text != null ? opts.text : el.getAttribute('data-text') || el.textContent).replace(/\s+/g, ' ').trim();
    var fontKey = opts.font || el.getAttribute('data-font') || 'script';
    var font = window.RV_HERSHEY && RV_HERSHEY[fontKey]; if (!font) return null;
    var size = +(opts.size || el.getAttribute('data-size') || 56);
    var o = { seed: hash(opts.seed || text), size: size, scale: size * 0.034, track: ({ print: 3, script: -2, cursive: -1, italic: 0 })[fontKey] || 0 };
    var ctrl = { raf: 0, state: 'idle', chars: text.length };
    var sr = el.querySelector('.rv-sr');
    if (!sr) { sr = document.createElement('span'); sr.className = 'rv-sr'; sr.textContent = text; el.textContent = ''; el.appendChild(sr); }
    var svg, strokes = [], nib, total = 0, width = 0;

    function build() {
      if (svg) svg.remove();
      width = el.clientWidth || 600;
      var rand = rng(o.seed), lines = layout(text, font, o, width - size * 0.3), lh = 40, sc = o.scale, pad = 6;
      svg = svgEl('svg', { 'class': 'rv-stroke-svg', 'aria-hidden': 'true', focusable: 'false' });
      var g = svgEl('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': (size * 0.05).toFixed(2) });
      svg.appendChild(g); strokes = [];
      var y = pad + 4;
      lines.forEach(function (line) {
        var x = pad; y += 0;
        line.forEach(function (item) {
          if (item.gap != null) { x += item.gap * sc; return; }
          item.word.forEach(function (L) {
            var dy = (rand() - 0.5) * 1.1, rot = (rand() - 0.5) * 0.05, ph = rand() * 6.28, amp = 0.28 + rand() * 0.22;
            var lx = x + L.x * sc;
            var list = L.gp.s.slice();
            if (L.accent) { var up = /[A-Z]/.test(L.ch) ? -3.5 : 0; L.accent.forEach(function (a) { var pts = []; for (var i = 0; i < a.length; i += 2) pts.push([a[i] + L.gp.w * 0.22, a[i + 1] + (/[A-Z]/.test(L.ch) ? 1 : 8) + up]); list.push(pts); }); }
            list.forEach(function (pts, si) {
              var out = pts.map(function (p, i) {
                var wob = Math.sin(i * 0.9 + ph) * amp, wob2 = Math.cos(i * 0.6 + ph * 1.7) * amp;
                var px = p[0] + wob, py = p[1] + wob2 + dy;
                var c = Math.cos(rot), s = Math.sin(rot);
                return [lx + (px * c - py * s) * sc, y + (px * s + py * c) * sc];
              });
              /* a lone dot (period, i-dot) needs length: nudge it */
              if (out.length === 1) out.push([out[0][0] + 0.2, out[0][1] + 0.2]);
              var path = svgEl('path', { d: smooth(out), 'class': 'rv-stroke' });
              g.appendChild(path);
              strokes.push({ path: path, first: si === 0, ltr: L, len: 0 });
            });
          });
          x += item.w * sc;
        });
        y += lh * sc;
      });
      var h = y - 4 * sc + size * 0.45;
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + h.toFixed(1));
      svg.setAttribute('width', '100%'); svg.setAttribute('height', h.toFixed(1));
      svg.style.maxHeight = h + 'px';
      nib = svgEl('circle', { r: (size * 0.045).toFixed(2), 'class': 'rv-nib', cx: -20, cy: -20 });
      svg.appendChild(nib);
      el.appendChild(svg);
      el.style.minHeight = h + 'px';
      total = 0;
      strokes.forEach(function (s) { s.len = s.path.getTotalLength() || 1; s.path.style.strokeDasharray = s.len; });
    }

    function schedule(speed) {
      var m = mult(speed), pen = (1700 * m + 150) * (size / 56); /* pen speed, px per second along the stroke */
      var t = 0, prevLtr = null;
      strokes.forEach(function (s) {
        var lift = s.ltr !== prevLtr ? 60 : 26; /* pen lift between letters, then between strokes of one letter */
        t += lift * (1.6 - 0.9 * Math.min(m, 1));
        s.t0 = t; s.dur = Math.max(40, s.len / pen * 1000);
        t += s.dur; prevLtr = s.ltr;
      });
      return t;
    }

    function setAll(state) {
      strokes.forEach(function (s) { s.path.style.strokeDashoffset = state === 'done' ? 0 : s.len; s.path.classList.toggle('dry', state === 'done'); s.path.style.visibility = state === 'done' ? 'visible' : 'hidden'; });
      if (nib) nib.style.opacity = 0;
    }

    ctrl.finish = function () { cancelAnimationFrame(ctrl.raf); ctrl.state = 'done'; if (!svg) build(); setAll('done'); el.classList.add('is-written'); };
    ctrl.reset = function () { cancelAnimationFrame(ctrl.raf); if (!svg) build(); setAll('blank'); ctrl.state = 'idle'; el.classList.remove('is-written'); };
    ctrl.play = function (speed) {
      cancelAnimationFrame(ctrl.raf); if (!svg) build();
      setAll('blank'); el.classList.remove('is-written');
      var end = schedule(speed || opts.speed || el.getAttribute('data-speed') || 'fast'), start = performance.now(), i0 = 0;
      ctrl.duration = end; ctrl.state = 'playing'; el.dispatchEvent(new CustomEvent('rv-write-start'));
      function frame(now) {
        var t = now - start;
        for (var i = i0; i < strokes.length; i++) {
          var s = strokes[i];
          if (t < s.t0) break;
          var u = Math.min(1, (t - s.t0) / s.dur), e = ease(u); s.path.style.visibility = 'visible';
          s.path.style.strokeDashoffset = s.len * (1 - e);
          if (u >= 1) { s.path.classList.add('dry'); if (i === i0) i0++; }
          else { var pt = s.path.getPointAtLength(s.len * e); nib.setAttribute('cx', pt.x.toFixed(1)); nib.setAttribute('cy', pt.y.toFixed(1)); nib.style.opacity = 1; }
        }
        if (t >= end) { nib.style.opacity = 0; ctrl.state = 'done'; el.classList.add('is-written'); el.dispatchEvent(new CustomEvent('rv-write-end')); return; }
        ctrl.raf = requestAnimationFrame(frame);
      }
      ctrl.raf = requestAnimationFrame(frame);
    };
    build();
    var rw = 0, rt; window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { if (el.clientWidth === rw) return; rw = el.clientWidth; var st = ctrl.state; build(); if (st === 'playing' || st === 'done') setAll('done'); else setAll('blank'); }, 160);
    });
    rw = el.clientWidth;
    return ctrl;
  }

  /* ---------- 2. typewriter ---------- */
  function typewriter(el, opts) {
    var text = el.textContent.replace(/\s+/g, ' ').trim(), rand = rng(hash(text));
    el.textContent = '';
    var sr = document.createElement('span'); sr.className = 'rv-sr'; sr.textContent = text; el.appendChild(sr);
    var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true'); vis.className = 'rv-tw'; el.appendChild(vis);
    var chars = [], caret = document.createElement('span'); caret.className = 'rv-caret';
    text.split(' ').forEach(function (w, wi, all) {
      var wsp = document.createElement('span'); wsp.className = 'rv-tw-w';
      for (var i = 0; i < w.length; i++) {
        var c = document.createElement('span'); c.className = 'rv-tw-c'; c.textContent = w[i];
        c.style.setProperty('--dy', ((rand() - 0.5) * 0.07).toFixed(3) + 'em');
        c.style.setProperty('--r', ((rand() - 0.5) * 1.6).toFixed(2) + 'deg');
        c.style.setProperty('--ink', (0.82 + rand() * 0.18).toFixed(2));
        wsp.appendChild(c); chars.push({ el: c, ch: w[i] });
      }
      if (wi < all.length - 1) { var sp = document.createElement('span'); sp.className = 'rv-tw-c rv-tw-sp'; sp.textContent = ' '; wsp.appendChild(sp); chars.push({ el: sp, ch: ' ' }); }
      vis.appendChild(wsp);
    });
    var ctrl = { timers: [], state: 'idle' };
    function clear() { ctrl.timers.forEach(clearTimeout); ctrl.timers = []; }
    ctrl.finish = function () { clear(); chars.forEach(function (c) { c.el.classList.add('on', 'still'); }); caret.remove(); ctrl.state = 'done'; };
    ctrl.reset = function () { clear(); chars.forEach(function (c) { c.el.classList.remove('on', 'still'); }); vis.insertBefore(caret, vis.firstChild); ctrl.state = 'idle'; };
    ctrl.play = function (speed) {
      ctrl.reset(); ctrl.state = 'playing';
      var m = mult(speed || opts.speed || el.getAttribute('data-speed') || 'fast'), base = 1000 / (4 + 28 * m), t = 260;
      chars.forEach(function (c, i) {
        t += base * (0.62 + rand() * 0.8) * (c.ch === ' ' ? 1.25 : 1);
        if (/[,;:]/.test(c.ch)) t += base * (1.4 + 2 * (1 - m));
        if (/[.!?]/.test(c.ch)) t += base * (3 + 5 * (1 - m));
        ctrl.timers.push(setTimeout(function () {
          c.el.classList.add('on'); c.el.after(caret);
          if (i === chars.length - 1) ctrl.timers.push(setTimeout(function () { ctrl.state = 'done'; caret.classList.add('idle'); el.dispatchEvent(new CustomEvent('rv-write-end')); }, 900));
        }, t));
      });
      ctrl.duration = t; ctrl.chars = chars.length;
      caret.classList.remove('idle');
    };
    vis.insertBefore(caret, vis.firstChild);
    return ctrl;
  }

  /* ---------- 3. sweep ---------- */
  function sweep(el, opts) {
    var rand = rng(hash(el.textContent)), words = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walker.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span'); s.className = 'rv-sw'; s.textContent = part; frag.appendChild(s); words.push(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    var ctrl = { anims: [], state: 'idle', chars: el.textContent.length };
    function clear() { ctrl.anims.forEach(function (a) { a.cancel(); }); ctrl.anims = []; }
    ctrl.finish = function () { clear(); words.forEach(function (w) { w.style.clipPath = 'none'; w.style.opacity = 1; }); ctrl.state = 'done'; };
    ctrl.reset = function () { clear(); words.forEach(function (w) { w.style.clipPath = 'inset(-25% 102% -25% -4%)'; }); ctrl.state = 'idle'; };
    ctrl.play = function (speed) {
      ctrl.reset(); ctrl.state = 'playing';
      var m = mult(speed || opts.speed || el.getAttribute('data-speed') || 'fast'), perChar = 1000 / (8 + 40 * m), t = 120;
      words.forEach(function (w, i) {
        var dur = Math.max(110, w.textContent.length * perChar), tilt = (rand() - 0.5) * 3;
        var a = w.animate([{ clipPath: 'inset(-25% 102% -25% -4%)', transform: 'translateY(.04em) rotate(' + tilt + 'deg)' }, { clipPath: 'inset(-25% -4% -25% -4%)', transform: 'none' }], { duration: dur, delay: t, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'both' });
        a.onfinish = function () { w.style.clipPath = 'none'; if (i === words.length - 1) { ctrl.state = 'done'; el.dispatchEvent(new CustomEvent('rv-write-end')); } };
        ctrl.anims.push(a);
        t += dur * 0.78 + perChar * 1.2;
      });
      ctrl.duration = t;
    };
    ctrl.reset(); ctrl.state = 'idle';
    return ctrl;
  }

  /* ---------- mount / scan ---------- */
  var MODES = { stroke: stroke, type: typewriter, sweep: sweep };
  function mount(el, opts) {
    opts = opts || {};
    var mode = opts.mode || el.getAttribute('data-rv-write'), fn = MODES[mode]; if (!fn) return null;
    if (el._rvw) return el._rvw;
    var c = fn(el, opts); if (!c) return null;
    el._rvw = c; el.classList.add('rv-writing');
    var auto = opts.autoplay != null ? opts.autoplay : el.getAttribute('data-autoplay') !== 'false';
    if (reduced()) { c.finish(); }
    else if (auto) { c.reset(); whenVisible(el, function () { if (c.state === 'idle') c.play(); }); }
    else c.reset();
    return c;
  }
  function scan(root) {
    [].forEach.call((root || document).querySelectorAll('[data-rv-write]'), function (el) { mount(el); });
  }
  /* replay buttons: <button data-rv-replay="#id" data-speed="slow"> ; speed optional (falls back to the page's speed switch) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rv-replay]'); if (!b) return;
    var sel = b.getAttribute('data-rv-replay'), speed = b.getAttribute('data-speed') || (window.RVWriteSpeed && window.RVWriteSpeed());
    [].forEach.call(document.querySelectorAll(sel), function (t) { var c = t._rvw || mount(t, { autoplay: false }); if (c) c.play(speed); });
  });
  window.RVWrite = { mount: mount, scan: scan, reduced: reduced };
  if (document.readyState !== 'loading') requestAnimationFrame(function () { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { scan(); }); });
  else document.addEventListener('DOMContentLoaded', function () { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { scan(); }); });
})();
