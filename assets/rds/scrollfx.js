/* Redrawn Design System: scroll effects. Plain script, no dependencies; every page reads fine without it.
   Adds <html class="fx-on"> only when motion is allowed, so every rule in rds.css under .fx-on is off for
   prefers-reduced-motion (and switches off live if the setting changes). Work happens only while something is on screen.
     progress bar        a 3px brick line under the nav that fills as the page scrolls (skipped where notes.js has its own)
     drawing in          figures (svg.ts-fig, svg.rds-draw) draw their pencil lines as they scroll into view, then fade their fills and labels
     layers              staged plans draw each layer and grow its trees as its step arrives (studies.js sets .is-on)
     counters            [data-count] numbers count up once when they enter the viewport
     parallax            .rds-art tiles slide their drawing against the field as the art crosses the screen
     rise                headings, quotes and figures below the fold settle in as they arrive */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  if (mq.matches || !('IntersectionObserver' in window)) return;
  root.classList.add('fx-on');
  var off = false;
  function stop() { off = true; root.classList.remove('fx-on'); }
  if (mq.addEventListener) mq.addEventListener('change', function () { if (mq.matches) stop(); });

  var vh = window.innerHeight, ticking = false;
  function all(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- progress bar ---------- */
  var bar = null;
  if (!doc.querySelector('[data-rv-progress]')) {
    var wrap = doc.createElement('div'); wrap.className = 'fx-progress'; wrap.setAttribute('aria-hidden', 'true'); wrap.innerHTML = '<i></i>';
    doc.body.appendChild(wrap); bar = wrap.firstChild;
  }
  var lastP = -1;
  function progress() {
    if (!bar) return;
    var h = doc.documentElement.scrollHeight - vh, p = h > 0 ? clamp(window.pageYOffset / h, 0, 1) : 0;
    if (Math.abs(p - lastP) > .002) { bar.parentNode.style.setProperty('--p', p.toFixed(4)); lastP = p; }
  }

  /* ---------- figures that draw themselves ---------- */
  var figs = [], seen = new WeakMap();
  function prep(svg) {
    var paths = all('path', svg), gen = !!svg.querySelector('.dw'), list = [];
    paths.forEach(function (p) {
      if (p.closest('defs,clipPath,pattern')) return;
      if (p.classList.contains('dw')) { list.push(p); return; }
      if (gen) { if (p.classList.contains('dk') && !p.classList.contains('dk-d')) { p.classList.add('dw'); p.setAttribute('pathLength', '1'); list.push(p); } return; }
      if (list.length > 320 || !svg.classList.contains('rds-draw')) return;
      var cs = getComputedStyle(p);
      if (cs.fill === 'none' && cs.stroke !== 'none' && cs.strokeDasharray === 'none') { p.classList.add('dw'); p.setAttribute('pathLength', '1'); list.push(p); }
    });
    list.forEach(function (p, i) { p.style.setProperty('--o', (i / list.length * .5).toFixed(3)); });
    return list.length;
  }
  var figIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var s = e.target, st = seen.get(s);
      if (e.isIntersecting) {
        if (!st) { st = { n: prep(s), on: true }; seen.set(s, st); } else st.on = true;
        if (st.n && figs.indexOf(s) < 0) figs.push(s);
        update();
      } else if (st) { st.on = false; var i = figs.indexOf(s); if (i >= 0) figs.splice(i, 1); }
    });
  }, { rootMargin: '300px 0px 300px 0px' });
  all('svg.ts-fig, svg.rds-draw').forEach(function (s) { figIO.observe(s); });
  function drawFigs() {
    figs.forEach(function (s) {
      var r = s.getBoundingClientRect(); if (!r.height) return;
      var p = clamp((vh * .92 - r.top) / (Math.min(r.height, vh * .9) * .7), 0, 1);
      if (s.__p === undefined || Math.abs(p - s.__p) > .004 || (p === 1 && s.__p !== 1) || (p === 0 && s.__p !== 0)) { s.__p = p; s.style.setProperty('--draw', p.toFixed(3)); }
    });
  }

  /* ---------- parallax art ---------- */
  var arts = [];
  var artIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { var i = arts.indexOf(e.target); if (e.isIntersecting && i < 0) arts.push(e.target); else if (!e.isIntersecting && i >= 0) arts.splice(i, 1); });
    update();
  }, { rootMargin: '120px 0px 120px 0px' });
  function watchArt() { all('.rds-art').forEach(function (a) { if (!a.__fxArt && !a.closest('.rv-rail')) { a.__fxArt = 1; artIO.observe(a); } }); }
  function parallax() {
    arts.forEach(function (a) {
      var r = a.getBoundingClientRect(), c = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), v = clamp(c, -1, 1);
      if (a.__py === undefined || Math.abs(v - a.__py) > .01) { a.__py = v; a.style.setProperty('--py', v.toFixed(3)); }
    });
  }

  /* ---------- counters ---------- */
  var countIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { countIO.unobserve(e.target); count(e.target); } });
  }, { threshold: .6 });
  function count(el) {
    var final = el.textContent, re = /\d[\d,]*(?:\.\d+)?/g, nums = final.match(re);
    if (!nums) return;
    var targets = nums.map(function (n) { return parseFloat(n.replace(/,/g, '')); }), dec = nums.map(function (n) { return (n.split('.')[1] || '').length; }), commas = nums.map(function (n) { return n.indexOf(',') >= 0; });
    var t0 = performance.now(), dur = 1300;
    el.setAttribute('aria-label', final);
    (function step(t) {
      if (off) { el.textContent = final; return; }
      var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3), i = 0;
      el.textContent = k >= 1 ? final : final.replace(re, function () {
        var j = i++, v = targets[j] * e, s = v.toFixed(dec[j]);
        return commas[j] ? Number(s).toLocaleString('en-US', { minimumFractionDigits: dec[j], maximumFractionDigits: dec[j] }) : s;
      });
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function watchCounts() { all('[data-count]').forEach(function (el) { if (!el.__fxCount) { el.__fxCount = 1; countIO.observe(el); } }); }

  /* ---------- rise ---------- */
  var riseIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); riseIO.unobserve(e.target); } });
  }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
  function watchRise() {
    all(':is(main,article,[data-rds-root],[data-rds-article]) :is(h2,blockquote,figure)').forEach(function (el) {
      if (el.__fxRise || el.closest('[data-scrolly],.rds-view,.kstep,[data-in],[data-rds-reveal],[data-rds-split],.rv-hero,header,nav')) return;
      el.__fxRise = 1;
      if (el.getBoundingClientRect().top < vh * .95) return;       // already on screen: leave alone
      el.classList.add('fx-rise'); riseIO.observe(el);
    });
  }

  /* ---------- loop ---------- */
  function update() { if (ticking || off) return; ticking = true; requestAnimationFrame(function () { ticking = false; if (off) return; progress(); drawFigs(); parallax(); }); }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; update(); });
  doc.addEventListener('click', function () { setTimeout(function () { all('svg.ts-fig, svg.rds-draw').forEach(function (s) { figIO.unobserve(s); figIO.observe(s); }); watchRise(); update(); }, 60); });
  function scan() { watchArt(); watchCounts(); watchRise(); update(); }
  scan();
  window.addEventListener('load', scan);
  var moT = 0; new MutationObserver(function () { if (moT) return; moT = setTimeout(function () { moT = 0; watchArt(); }, 200); }).observe(doc.body, { childList: true, subtree: true });
})();
