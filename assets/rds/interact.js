/* Redrawn Design System: interaction layer. Plain script, no dependencies. Load with defer after motifs.js and sketch.js:
   <script src="…/assets/rds/interact.js" defer></script>      (it loads interact.css itself)
   Adds, wherever the markup is present:
   1. Art you can play with   .rds-art[data-rds-art="banner"] gets a Redraw button (new seed, Original to go back); tiles shift on hover or tap.
   2. Entry previews          links to field guide entries, notes and studies show a small card (title, one line, section) on hover or focus.
   3. Draggable compare       [data-rv-compare] gets a Slide mode: drag the handle (or press arrow keys) to wipe between Today and Proposed.
   4. Explorable plans        [data-scrolly] figures get a stage row: jump to any stage and keep it, or go back to Auto (follows the scroll).
   5. Zoomable drawings       drawings in figures get a Zoom button that opens them large; wheel, pinch, drag and +/- work.
   Everything is additive: without this script the pages read the same. Reduced motion is respected throughout. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var script = doc.currentScript;
  var SRC = script && script.src ? script.src : '';
  var ASSETS = SRC.replace(/rds\/interact\.js.*$/, '');
  var reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var hoverMQ = window.matchMedia ? matchMedia('(hover: hover) and (pointer: fine)') : { matches: true };
  var uid = 0;
  function all(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }
  function el(tag, cls, html) { var n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* load our stylesheet once, next to this script */
  if (SRC && !doc.querySelector('link[data-rv-interact]')) {
    var lk = doc.createElement('link');
    lk.rel = 'stylesheet'; lk.href = SRC.replace(/\.js(\?.*)?$/, '.css$1'); lk.setAttribute('data-rv-interact', '');
    doc.head.appendChild(lk);
  }

  /* small hand-drawn icons, stroke = currentColor */
  var ICON = {
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.6c4.6-.7 9.6-.6 14 0 .7 4.7.7 9.6 0 14.4-4.8.7-9.5.7-14.3 0-.6-4.8-.6-9.7.3-14.4Z"/><circle cx="9" cy="9" r=".9" fill="currentColor"/><circle cx="15" cy="15" r=".9" fill="currentColor"/><circle cx="15" cy="9" r=".9" fill="currentColor"/><circle cx="9" cy="15" r=".9" fill="currentColor"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 6.5 4.5 10.5l4 4"/><path d="M5 10.6c5-.3 11-.6 13.8 3.4.9 1.3 1 3 .8 4"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 4.2c3.5-.2 6.3 2.6 6.2 6.2-.1 3.5-2.9 6.1-6.3 6-3.4-.1-6-2.8-5.9-6.2.1-3.3 2.7-5.8 6-6Z"/><path d="m15.6 15.8 4.4 4.4"/><path d="M10.5 8v5M8 10.5h5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M6 6.3 18 17.8M18.2 5.9 6.1 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M5.5 12h13"/></svg>',
    fit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15"/></svg>'
  };

  /* ================================================================
     1. Art you can play with
     ================================================================ */
  function artEligible(a) {
    return a.getAttribute('data-rds-art') === 'banner' && !a.closest('a') && !a.classList.contains('rv-footstrip');
  }
  function artFix(a) {
    if (!a.querySelector('svg')) return;
    /* The art itself is decorative; the button inside it is not, so hide only the drawing from assistive tech. */
    if (a.getAttribute('aria-hidden') === 'true') a.removeAttribute('aria-hidden');
    var svg = a.querySelector(':scope > svg'); if (svg) svg.setAttribute('aria-hidden', 'true');
    var bar = a.querySelector(':scope > .rv-reroll');
    var orig = a.getAttribute('data-seed') || '', now = a.__art ? a.__art.seed : orig, changed = !!orig && now !== orig;
    if (!bar) {
      bar = el('div', 'rv-reroll');
      var go = el('button', 'rv-reroll__go', ICON.dice + '<span>Redraw</span>');
      go.type = 'button'; go.setAttribute('data-rv-redraw', '');
      go.setAttribute('aria-label', 'Redraw this art with a new random seed');
      var back = el('button', 'rv-reroll__back', ICON.undo + '<span class="rv-sr">Back to the original drawing</span>');
      back.type = 'button'; back.setAttribute('data-rv-original', ''); back.title = 'Back to the original drawing';
      bar.appendChild(go); bar.appendChild(back);
      a.appendChild(bar);
    }
    bar.classList.toggle('is-changed', changed);
    var back2 = bar.querySelector('.rv-reroll__back'); if (back2) back2.tabIndex = changed ? 0 : -1;
    a.setAttribute('data-rv-play', '');
  }
  function artWatch(a) {
    if (a.__rvWatch || !artEligible(a)) return;
    a.__rvWatch = true; artFix(a);
    if (window.MutationObserver) new MutationObserver(function () { artFix(a); }).observe(a, { childList: true, attributes: true, attributeFilter: ['aria-hidden'] });
  }
  function artRedraw(a, original) {
    if (!window.RDSArt) return;
    var st = a.__art || {};
    if (original) RDSArt.render(a, { kind: st.kind, seed: a.getAttribute('data-seed') || st.seed, topic: st.topic });
    else RDSArt.reroll(a);
    a.classList.remove('rv-redrawn'); void a.offsetWidth; a.classList.add('rv-redrawn');
    setTimeout(function () { a.classList.remove('rv-redrawn'); }, 700);
  }
  function artInit() {
    all('.rds-art[data-rds-art]').forEach(artWatch);
    doc.addEventListener('click', function (e) {
      var t = e.target; if (!t.closest) return;
      var go = t.closest('[data-rv-redraw]'), back = t.closest('[data-rv-original]');
      if (go || back) { var a = (go || back).closest('.rds-art'); if (a) { e.preventDefault(); artRedraw(a, !!back); } return; }
      /* tap or click a tile: it shifts colour, shape or icon */
      var tile = t.closest('.rds-art[data-rv-play] .m-tile');
      if (tile && window.RDSArt) { var art = tile.closest('.rds-art'); RDSArt.poke(art, tile); }
    });
    var last = new WeakMap();
    doc.addEventListener('pointerover', function (e) {
      if (!hoverMQ.matches || reduceMQ.matches || !window.RDSArt || !e.target.closest) return;
      var tile = e.target.closest('.rds-art .m-tile'); if (!tile) return;
      var now = Date.now(); if (now - (last.get(tile) || 0) < 1400) return;
      last.set(tile, now); RDSArt.poke(tile.closest('.rds-art'), tile);
    });
  }

  /* ================================================================
     2. Entry previews on links
     ================================================================ */
  var tipData = null, tipLoading = false, tipEl = null, tipFor = null, showT = 0, hideT = 0;
  var KIND = { guide: 'Field guide', notes: 'Note', studies: 'Study' };
  var TIPSEL = 'main .rds-article__body a[href], main .rds-prose a[href], main .rv-body a[href], main .rv-sec__body a[href], main .rv-infobox a[href], main .rds-infobox a[href], main .rds-seealso a[href], main .rds-hatnote a[href]';
  function loadIndex(cb) {
    if (tipData) return cb();
    if (tipLoading) { setTimeout(function () { loadIndex(cb); }, 120); return; }
    tipLoading = true;
    fetch(ASSETS + 'search-index.json').then(function (r) { return r.json(); }).then(function (d) {
      tipData = (d && d.pages) || []; cb();
    }).catch(function () { tipData = []; });
  }
  function entryFor(a) {
    var u; try { u = new URL(a.href, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    var here = location.pathname.replace(/index\.html$/, '');
    var path = u.pathname.replace(/index\.html$/, '');
    if (path === here && !u.hash) return null;
    if (a.closest('.rds-fn, sup, .rds-back, .rds-pager')) return null;
    for (var i = 0; i < tipData.length; i++) {
      var p = tipData[i]; if (!p.u || !KIND[p.s]) continue;
      if (path === '/' + p.u || path.slice(-(p.u.length + 1)) === '/' + p.u) return { page: p, hash: u.hash.slice(1), same: path === here };
    }
    return null;
  }
  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = el('div', 'rv-tip'); tipEl.id = 'rv-tip'; tipEl.setAttribute('role', 'tooltip');
    tipEl.addEventListener('pointerenter', function () { clearTimeout(hideT); });
    tipEl.addEventListener('pointerleave', function () { tipHide(160); });
    doc.body.appendChild(tipEl); return tipEl;
  }
  function tipShow(a) {
    var hit = entryFor(a); if (!hit) return;
    var p = hit.page, tip = ensureTip(), title = (p.t || '').replace(/\s*\|.*$/, ''), sec = '';
    if (hit.hash && p.h) for (var i = 0; i < p.h.length; i++) if (p.h[i][1] === hit.hash) { sec = String(p.h[i][0]).replace(/#$/, ''); break; }
    tip.innerHTML = '';
    tip.appendChild(el('span', 'rv-tip__kind', KIND[p.s]));
    tip.appendChild(el('strong', 'rv-tip__title', '')).textContent = title;
    if (sec) tip.appendChild(el('span', 'rv-tip__sec', '')).textContent = 'Section: ' + sec;
    if (p.d) tip.appendChild(el('span', 'rv-tip__text', '')).textContent = p.d;
    tip.appendChild(el('span', 'rv-tip__go', 'Open it &rarr;'));
    tipFor = a; a.setAttribute('aria-describedby', 'rv-tip');
    tip.classList.add('is-on');
    var r = a.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight, vw = root.clientWidth;
    var below = r.bottom + 10 + th < innerHeight || r.top - 10 - th < 0;
    var x = clamp(r.left + r.width / 2 - tw / 2, 12, vw - tw - 12);
    tip.style.left = Math.round(x) + 'px';
    tip.style.top = Math.round(below ? r.bottom + 10 : r.top - 10 - th) + 'px';
    tip.setAttribute('data-side', below ? 'below' : 'above');
    tip.style.setProperty('--nub', Math.round(clamp(r.left + r.width / 2 - x, 16, tw - 16)) + 'px');
  }
  function tipHide(delay) {
    clearTimeout(showT); clearTimeout(hideT);
    hideT = setTimeout(function () {
      if (tipEl) tipEl.classList.remove('is-on');
      if (tipFor) { tipFor.removeAttribute('aria-describedby'); tipFor = null; }
    }, delay == null ? 0 : delay);
  }
  function tipInit() {
    function target(e) { var a = e.target && e.target.closest ? e.target.closest(TIPSEL) : null; return a && a.matches('a[href]') ? a : null; }
    function open(a, wait) {
      clearTimeout(hideT); clearTimeout(showT);
      showT = setTimeout(function () { loadIndex(function () { if (a.isConnected && (a.matches(':hover') || a.matches(':focus-visible'))) tipShow(a); }); }, wait);
    }
    doc.addEventListener('pointerover', function (e) { if (!hoverMQ.matches) return; var a = target(e); if (a && a !== tipFor) open(a, 260); });
    doc.addEventListener('pointerout', function (e) { var a = target(e); if (a && !(e.relatedTarget && a.contains(e.relatedTarget))) tipHide(160); });
    doc.addEventListener('focusin', function (e) { var a = target(e); if (a) open(a, 60); });
    doc.addEventListener('focusout', function (e) { if (target(e)) tipHide(0); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && tipFor) tipHide(0); });
    addEventListener('scroll', function () { if (tipFor) tipHide(0); }, { passive: true });
  }

  /* ================================================================
     3. Draggable compare
     ================================================================ */
  function compareInit(fig) {
    var stage = fig.querySelector('.rv-compare__stage'), seg = fig.querySelector('.rv-seg'), name = fig.querySelector('[data-rv-name]');
    if (!stage || !stage.querySelector('.rv-before') || !stage.querySelector('.rv-after')) return;
    var pos = 50, moved = false;
    var slide = el('button', '', 'Slide'); slide.type = 'button'; slide.setAttribute('aria-pressed', 'false'); slide.setAttribute('data-rv-slide', '');
    if (seg) seg.appendChild(slide);
    var h = el('div', 'rv-slider', '<span class="rv-slider__line"></span><span class="rv-slider__grip" aria-hidden="true"><svg viewBox="0 0 28 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 2.5 8 8 13M20 3l5.5 5L20 13"/></svg></span><span class="rv-slider__tag rv-slider__tag--l" aria-hidden="true">today</span><span class="rv-slider__tag rv-slider__tag--r" aria-hidden="true">proposed</span>');
    h.setAttribute('role', 'slider'); h.tabIndex = 0;
    h.setAttribute('aria-label', 'Compare today with the proposed sidewalk'); h.setAttribute('aria-orientation', 'horizontal');
    h.setAttribute('aria-valuemin', '0'); h.setAttribute('aria-valuemax', '100');
    stage.appendChild(h);
    function set(p) { pos = clamp(p, 2, 98); fig.style.setProperty('--pos', pos.toFixed(1)); h.setAttribute('aria-valuenow', Math.round(pos)); h.setAttribute('aria-valuetext', Math.round(pos) + ' percent of the picture shows today'); }
    function enter(p) { if (fig.getAttribute('data-view') !== 'slide') fig.setAttribute('data-view', 'slide'); set(p == null ? 50 : p); }
    function fromEvent(e) { var r = stage.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
    set(50);
    new MutationObserver(function () {
      var on = fig.getAttribute('data-view') === 'slide';
      slide.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) all('[data-rv-view]', fig).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      if (on && name) name.textContent = 'compared, move across the picture';
    }).observe(fig, { attributes: true, attributeFilter: ['data-view'] });
    slide.addEventListener('click', function () { enter(50); });
    var drag = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      var sliding = fig.getAttribute('data-view') === 'slide';
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sliding: sliding, live: sliding };
      if (sliding) { stage.setPointerCapture(e.pointerId); set(fromEvent(e)); fig.classList.add('is-dragging'); }
    });
    stage.addEventListener('pointermove', function (e) {
      /* a mouse needs no click: moving over the picture wipes between today and proposed */
      if (e.pointerType === 'mouse' && (!drag || e.pointerId !== drag.id || drag.live)) { enter(fromEvent(e)); return; }
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.live) {
        /* a sideways swipe on the picture starts the slide, a vertical one is still a scroll */
        if (Math.abs(e.clientX - drag.x) > 10 && Math.abs(e.clientX - drag.x) > Math.abs(e.clientY - drag.y) * 1.4) {
          drag.live = true; try { stage.setPointerCapture(e.pointerId); } catch (x) {}
          fig.classList.add('is-dragging'); enter(fromEvent(e));
        }
        return;
      }
      set(fromEvent(e));
    });
    function end(e) { if (drag && e.pointerId === drag.id) { drag = null; fig.classList.remove('is-dragging'); } }
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    h.addEventListener('keydown', function (e) {
      var k = e.key, d = e.shiftKey ? 10 : 4;
      if (k === 'ArrowLeft' || k === 'ArrowDown') set(pos - d);
      else if (k === 'ArrowRight' || k === 'ArrowUp') set(pos + d);
      else if (k === 'Home') set(2); else if (k === 'End') set(98); else return;
      e.preventDefault();
    });
  }

  /* ================================================================
     4. Explorable plans: jump to a stage and keep it
     ================================================================ */
  function stagesInit(box) {
    var steps = all('[data-step]', box); if (steps.length < 2) return;
    var fc = box.querySelector('figcaption'), host = fc ? fc.parentNode : box.querySelector('figure');
    if (!host) return;
    var row = el('div', 'rv-stages'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Explore the stages');
    var lab = el('span', 'rv-stages__lab', 'Jump to'); row.appendChild(lab);
    var btns = [];
    steps.forEach(function (s) {
      var n = s.getAttribute('data-step'), t = s.getAttribute('data-label') || ('Step ' + n);
      var short = t.replace(/^Stage\s+(\d+):\s*/i, '$1 · ').replace(/^All seven moves$/i, 'All');
      var b = el('button', 'rv-stages__btn', ''); b.type = 'button'; b.textContent = short; b.title = t; b.setAttribute('aria-label', t);
      b.setAttribute('data-rv-stage', n); b.setAttribute('aria-pressed', 'false'); row.appendChild(b); btns.push(b);
    });
    var auto = el('button', 'rv-stages__btn rv-stages__auto', 'Follow scroll'); auto.type = 'button'; auto.setAttribute('aria-pressed', 'true'); row.appendChild(auto);
    host.appendChild(row);
    function ping() { window.dispatchEvent(new Event('scroll')); }
    function mark(pin) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', pin !== null && b.getAttribute('data-rv-stage') === String(pin) ? 'true' : 'false'); });
      auto.setAttribute('aria-pressed', pin === null ? 'true' : 'false'); row.classList.toggle('is-pinned', pin !== null);
    }
    row.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b === auto) { box.removeAttribute('data-pin'); mark(null); }
      else { var n = b.getAttribute('data-rv-stage'); box.setAttribute('data-pin', n); mark(n); }
      ping();
    });
    mark(null);
  }

  /* ================================================================
     5. Zoomable drawings
     ================================================================ */
  var lb = null;
  var ZOOM_SKIP = '.rds-infobox, .rv-infobox, .rv-compare, .rds-art, .rv-hero, .rv-collage, .rds-nav, .rds-footer, .rv-tabbar, .rv-sheet, .rv-lightbox';
  function zoomTargets() {
    return all('main figure svg[role="img"], main svg.ts-fig, main svg.rv-svg').filter(function (s) {
      if (s.closest(ZOOM_SKIP) || s.__rvZoom) return false;
      var vb = (s.getAttribute('viewBox') || '').split(/[ ,]+/); return vb.length === 4 && +vb[2] >= 360;
    });
  }
  function zoomAdd(svg) {
    svg.__rvZoom = true;
    var host = svg.parentNode;
    if (getComputedStyle(host).position === 'static') host.classList.add('rv-zoomhost');
    var b = el('button', 'rv-zoombtn', ICON.zoom + '<span>Zoom</span>'); b.type = 'button';
    b.setAttribute('aria-label', 'Open this drawing larger'); b.__svg = svg;
    host.appendChild(b);
  }
  function lbBuild() {
    var d = el('dialog', 'rv-lightbox'); d.setAttribute('aria-label', 'Drawing, enlarged');
    d.innerHTML = '<div class="rv-lightbox__bar"><p class="rv-lightbox__cap" data-cap></p><div class="rv-lightbox__tools">' +
      '<button type="button" data-z="out" aria-label="Zoom out">' + ICON.minus + '</button>' +
      '<button type="button" data-z="in" aria-label="Zoom in">' + ICON.plus + '</button>' +
      '<button type="button" data-z="fit" aria-label="Fit to window">' + ICON.fit + '</button>' +
      '<button type="button" data-z="close" aria-label="Close">' + ICON.close + '</button></div></div>' +
      '<div class="rv-lightbox__stage" tabindex="0" aria-label="Drag to move, scroll or pinch to zoom"><div class="rv-lightbox__inner"></div></div>' +
      '<p class="rv-lightbox__hint"><span class="rv-hide-touch">Scroll to zoom, drag to move, double-click to zoom in.</span><span class="rv-show-touch">Pinch to zoom, drag to move, double-tap to zoom in.</span></p>';
    doc.body.appendChild(d);
    var stage = d.querySelector('.rv-lightbox__stage'), inner = d.querySelector('.rv-lightbox__inner');
    var s = 1, tx = 0, ty = 0, ptrs = {}, pinch = 0;
    function fit() { var w = stage.clientWidth, h = stage.clientHeight; tx = clamp(tx, w - w * s, 0); ty = clamp(ty, h - h * s, 0); inner.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')'; }
    function zoomAt(cx, cy, ns) { ns = clamp(ns, 1, 8); tx = cx - (cx - tx) * ns / s; ty = cy - (cy - ty) * ns / s; s = ns; fit(); }
    function center() { return { x: stage.clientWidth / 2, y: stage.clientHeight / 2 }; }
    function rel(e) { var r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    d.addEventListener('click', function (e) {
      var z = e.target.closest ? e.target.closest('[data-z]') : null;
      if (z) { var k = z.getAttribute('data-z'), c = center();
        if (k === 'close') d.close(); else if (k === 'in') zoomAt(c.x, c.y, s * 1.5); else if (k === 'out') zoomAt(c.x, c.y, s / 1.5); else { s = 1; tx = ty = 0; fit(); } return; }
      if (e.target === d) d.close();
    });
    stage.addEventListener('wheel', function (e) { e.preventDefault(); var p = rel(e); zoomAt(p.x, p.y, s * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018))); }, { passive: false });
    stage.addEventListener('dblclick', function (e) { var p = rel(e); if (s > 1.2) { s = 1; tx = ty = 0; fit(); } else zoomAt(p.x, p.y, 2.6); });
    stage.addEventListener('pointerdown', function (e) {
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; stage.setPointerCapture(e.pointerId); stage.classList.add('is-grab');
      var ids = Object.keys(ptrs); if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    });
    stage.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return; var ids = Object.keys(ptrs);
      if (ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]]; if (e.pointerId == ids[0]) a = { x: e.clientX, y: e.clientY }; else b = { x: e.clientX, y: e.clientY };
        var dist = Math.hypot(a.x - b.x, a.y - b.y), r = stage.getBoundingClientRect();
        if (pinch) zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, s * dist / pinch); pinch = dist;
      } else { tx += e.clientX - p.x; ty += e.clientY - p.y; fit(); }
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    });
    function up(e) { delete ptrs[e.pointerId]; pinch = 0; if (!Object.keys(ptrs).length) stage.classList.remove('is-grab'); }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    stage.addEventListener('keydown', function (e) {
      var c = center(), st = 60;
      if (e.key === '+' || e.key === '=') zoomAt(c.x, c.y, s * 1.4); else if (e.key === '-' || e.key === '_') zoomAt(c.x, c.y, s / 1.4);
      else if (e.key === '0') { s = 1; tx = ty = 0; fit(); }
      else if (e.key === 'ArrowLeft') { tx += st; fit(); } else if (e.key === 'ArrowRight') { tx -= st; fit(); }
      else if (e.key === 'ArrowUp') { ty += st; fit(); } else if (e.key === 'ArrowDown') { ty -= st; fit(); } else return;
      e.preventDefault();
    });
    window.addEventListener('resize', function () { if (d.open) fit(); });
    d.addEventListener('close', function () { inner.innerHTML = ''; s = 1; tx = ty = 0; ptrs = {}; root.classList.remove('rv-lb-open'); });
    d.__reset = function () { s = 1; tx = ty = 0; ptrs = {}; fit(); };
    return d;
  }
  function zoomOpen(svg) {
    if (!lb) lb = lbBuild();
    var inner = lb.querySelector('.rv-lightbox__inner'); inner.innerHTML = '';
    var clone = svg.cloneNode(true);
    clone.removeAttribute('data-rds-draw'); clone.classList.remove('rv-pencil', 'rv-pencil-shapes'); clone.removeAttribute('style');
    clone.setAttribute('data-in', ''); clone.removeAttribute('width'); clone.removeAttribute('height');
    all('.rds-draw,.rds-view', clone).forEach(function (n) { n.setAttribute('data-in', ''); });
    all('.rv-zoombtn', clone).forEach(function (n) { n.remove(); });
    /* give the copy the same stage state the original sits in (scroll-driven layers, today/proposed) */
    var st = svg.closest('[data-st]'), vw = svg.closest('[data-view]');
    inner.removeAttribute('data-st'); inner.removeAttribute('data-view');
    if (st) inner.setAttribute('data-st', st.getAttribute('data-st'));
    if (vw) inner.setAttribute('data-view', vw.getAttribute('data-view'));
    inner.appendChild(clone);
    var fig = svg.closest('figure'), cap = fig && fig.querySelector('figcaption');
    lb.querySelector('[data-cap]').textContent = (cap ? all(':scope > *', cap).map(function (n) { return n.textContent.trim(); }).filter(Boolean).join(' · ') || cap.textContent : (svg.getAttribute('aria-label') || '')).replace(/\s+/g, ' ').trim();
    lb.__opener = svg.parentNode.querySelector('.rv-zoombtn');
    root.classList.add('rv-lb-open'); lb.showModal(); lb.__reset();
    lb.querySelector('.rv-lightbox__stage').focus({ preventScroll: true });
  }
  function zoomInit() {
    function scan() { zoomTargets().forEach(zoomAdd); }
    scan(); addEventListener('load', scan);
    doc.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.rv-zoombtn') : null;
      if (b && b.__svg) { e.preventDefault(); e.stopPropagation(); zoomOpen(b.__svg); }
    }, true);
  }

  /* ---------------- start ---------------- */
  function init() {
    artInit();
    tipInit();
    all('[data-rv-compare]').forEach(compareInit);
    all('[data-scrolly]').forEach(stagesInit);
    zoomInit();
    addEventListener('load', function () { all('.rds-art[data-rds-art]').forEach(artWatch); });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
  window.RDSInteract = { zoom: zoomOpen };
})();
