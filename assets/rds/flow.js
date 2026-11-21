/* Redrawn Design System: flow. Page-to-page motion. Plain script, no dependencies. One synchronous tag in <head> of every page:
   <script src="…/assets/rds/flow.js"></script>
   It paints a paper sheet before the first frame (so nothing flashes), then plays one of three things, drawn in code:
     intro    first visit of a session and every reload: the logo is drawn, the wordmark is written, the sheet lifts as a grid of tiles.
     wipe     following a link: tiles grow over the page (from where you clicked), the destination is written on them, the next page
              lifts the tiles from the same spot. The sheet is held as a top-layer popover, so it also covers the search dialog.
     write-on headings: the page title is written in letter by letter on the Wobble axes; section headings write in as they arrive,
              each with a pencil squiggle that draws underneath.
   Also: a pencil dab where you click, and hand-drawn rules that draw on. Styles are in flow.css (loaded by this script).
   Off for prefers-reduced-motion, embed frames (?embed=1, iframes), print and ?noflow. Nothing breaks without it; a 5 second
   failsafe always removes the sheet. API: window.RVFlow = { intro(), wipe(url?), write(el), enabled, speed }. See DESIGN.md "Flow". */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, me = doc.currentScript;
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var embedded = /[?&]embed=1(&|$)/.test(location.search);
  var off = mq.matches || /[?&]noflow(&|$)/.test(location.search);
  var API = window.RVFlow = { enabled: !off, speed: 1 };
  if (off || embedded) { API.enabled = false; return; }

  var BASE = me && me.src ? me.src.replace(/flow\.js(\?.*)?$/, '') : '';
  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} } };
  var NAVKEY = 'rv-flow-nav', SEENKEY = 'rv-flow-seen';
  var SECTIONS = { studies: 'Studies', guide: 'Field guide', notes: 'Notes', lab: 'Lab notes', patterns: 'Pattern sheet', icons: 'Icon set', fonts: 'Type lab' };

  /* ---------- timing (ms), scaled by RVFlow.speed ---------- */
  function T(ms) { return ms / (API.speed || 1); }

  /* ---------- critical style and stylesheet ---------- */
  var cs = doc.createElement('style');
  cs.textContent = 'html.fl-cover::before{content:"";position:fixed;inset:0;z-index:2147483000;background:#f6f1e7;pointer-events:none}' +
    '@media print{html.fl-cover::before{display:none}}';
  (doc.head || root).appendChild(cs);
  var css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = BASE + 'flow.css';
  (doc.head || root).appendChild(css);

  /* ---------- what to play ---------- */
  var navEntry = null;
  try { navEntry = performance.getEntriesByType('navigation')[0]; } catch (e) {}
  var navType = navEntry ? navEntry.type : 'navigate';
  var flag = null; try { flag = JSON.parse(store.get(NAVKEY) || 'null'); } catch (e) {}
  store.del(NAVKEY);
  var fresh = flag && Date.now() - flag.t < 9000;
  var mode = 'none';
  if (navType === 'back_forward') mode = 'none';
  else if (fresh && navType !== 'reload') mode = 'wipe';
  else if (navType === 'reload' || !store.get(SEENKEY)) mode = 'intro';
  else mode = 'wipe';
  store.set(SEENKEY, '1');
  root.classList.add('fl-on');
  if (mode !== 'none') root.classList.add('fl-cover');
  var failsafe = setTimeout(function () { root.classList.remove('fl-cover'); var s = doc.getElementById('fl-stage'); if (s) kill(s); }, 5200);

  /* ---------- helpers ---------- */
  function el(tag, cls, html) { var n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function all(sel, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(sel)); }
  function ready(fn) { doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', fn) : fn(); }
  function rng(seed) { var a = 0; for (var i = 0; i < seed.length; i++) a = (Math.imul(a ^ seed.charCodeAt(i), 2654435761) >>> 0); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function kill(s) { if (s.matches && s.matches(':popover-open')) { try { s.hidePopover(); } catch (e) {} } if (s.parentNode) s.parentNode.removeChild(s); root.classList.remove('fl-cover'); }
  function humanize(slug) { return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function labelFor(url) {
    var u; try { u = new URL(url, location.href); } catch (e) { return { a: 'Redrawn Valley', b: '' }; }
    var parts = u.pathname.split('/').filter(function (p) { return p && !/^index\.html?$/.test(p); });
    var i = 0; while (i < parts.length && !SECTIONS[parts[i]] && i < 3) i++;
    if (i >= parts.length || !SECTIONS[parts[i]]) { return { a: parts.length ? humanize(parts[parts.length - 1].replace(/\.html?$/, '')) : 'Redrawn Valley', b: parts.length ? '' : 'seeing the valley anew' }; }
    var rest = parts.slice(i + 1); return { a: SECTIONS[parts[i]], b: rest.length ? humanize(rest[rest.length - 1].replace(/\.html?$/, '')) : '' };
  }

  /* ---------- the sheet: a grid of paper tiles ---------- */
  var ACCENTS = ['#9c3d24', '#2f4a3a', '#35506b', '#be9661', '#7ba3c0', '#b17c83', '#4f9b60', '#7c849f'];
  function buildStage(seed) {
    var vw = innerWidth, vh = innerHeight, size = vw < 600 ? 72 : 104;
    var cols = Math.ceil(vw / size), rows = Math.ceil(vh / size), r = rng(seed || 'flow');
    var s = el('div', 'fl-stage'); s.id = 'fl-stage'; s.setAttribute('aria-hidden', 'true');
    s.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)'; s.style.gridTemplateRows = 'repeat(' + rows + ',1fr)';
    var tiles = [];
    for (var i = 0; i < cols * rows; i++) {
      var t = el('i', 'fl-t'), roll = r();
      if (roll < 0.17) { t.className += ' fl-t--a fl-t--' + (r() < .5 ? 'c' : 's'); t.style.setProperty('--a', ACCENTS[Math.floor(r() * ACCENTS.length)]); }
      else if (roll < 0.3) t.className += ' fl-t--h';
      t._c = i % cols; t._r = Math.floor(i / cols); s.appendChild(t); tiles.push(t);
    }
    s._tiles = tiles; s._cols = cols; s._rows = rows;
    if (s.popover === undefined) { s.style.zIndex = 2147483001; } else { s.setAttribute('popover', 'manual'); }
    doc.body.appendChild(s);
    if (s.popover !== undefined) { try { s.showPopover(); } catch (e) {} }
    return s;
  }
  function dist(t, cols, rows, ox, oy) { var dx = (t._c + .5) / cols - ox, dy = (t._r + .5) / rows - oy; return Math.sqrt(dx * dx * 2.2 + dy * dy); }
  function animate(node, frames, opt) { try { return node.animate(frames, opt); } catch (e) { return null; } }

  /* tiles grow over the page (cover) or shrink away from it (reveal); the origin is a fraction of the viewport */
  function tiles(s, dir, ox, oy, ms) {
    var spread = ms * 0.62, max = 0, list = s._tiles, anims = [];
    list.forEach(function (t) { t._d = dist(t, s._cols, s._rows, ox, oy); if (t._d > max) max = t._d; });
    var done = new Promise(function (res) {
      var left = list.length;
      list.forEach(function (t) {
        var d = (t._d / max) * spread, acc = t.classList.contains('fl-t--a');
        var from = dir === 'cover' ? { transform: 'scale(0) rotate(' + (acc ? -90 : -12) + 'deg)', opacity: 1 } : { transform: 'scale(1.03) rotate(0deg)', opacity: 1 };
        var to = dir === 'cover' ? { transform: 'scale(1.03) rotate(0deg)', opacity: 1 } : { transform: 'scale(0) rotate(' + (acc ? 90 : 14) + 'deg)', opacity: 1 };
        var a = animate(t, [from, to], { duration: ms - spread, delay: d, easing: dir === 'cover' ? 'cubic-bezier(.3,1.3,.5,1)' : 'cubic-bezier(.6,0,.4,1)', fill: 'both' });
        if (!a) { t.style.transform = to.transform; if (--left === 0) res(); return; }
        anims.push(a); a.onfinish = function () { if (--left === 0) res(); };
      });
      if (!list.length) res();
    });
    done.cancel = function () { anims.forEach(function (a) { a.finish(); }); };
    return done;
  }

  /* ---------- writing letters on ---------- */
  function wrapChars(node, state) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = doc.createDocumentFragment(), words = n.nodeValue.split(/(\s+)/);
        words.forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(doc.createTextNode(' ')); return; }
          var ws = el('span', 'fl-w'); ws.setAttribute('aria-hidden', 'true');
          for (var i = 0; i < w.length; i++) { var c = el('span', 'fl-c'); c.textContent = w.charAt(i); c.style.setProperty('--c', state.n++); ws.appendChild(c); }
          frag.appendChild(ws);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && !/^(svg|img|br|script|style)$/i.test(n.nodeName) && !n.classList.contains('fl-w')) wrapChars(n, state);
    });
  }
  var SQUIGGLE = '<svg class="fl-ul__svg" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M2 7C14 3 22 10 36 6S58 3 72 7 96 10 110 5 134 4 148 8s24 2 50-3"/></svg>';
  function prep(h, underline) {
    if (h.dataset.flDone) return false;
    if (h.querySelector('svg,img,picture') || h.textContent.length > 150) return false;
    if (h.hasAttribute('data-rds-split')) { var label = h.getAttribute('aria-label') || h.textContent; h.removeAttribute('data-rds-split'); h.removeAttribute('aria-label'); h.textContent = label.replace(/\s+/g, ' ').trim(); h.classList.remove('is-in'); }
    var txt = h.textContent.replace(/\s+/g, ' ').trim(), st = { n: 0 };
    h.setAttribute('aria-label', txt); wrapChars(h, st);
    h.style.setProperty('--fl-step', Math.min(30, 880 / Math.max(st.n, 1)).toFixed(1) + 'ms');
    h.classList.add('fl-title'); h.dataset.flDone = '1';
    if (underline) { var u = el('span', 'fl-ul fl-ul--' + underline, SQUIGGLE); u.setAttribute('aria-hidden', 'true'); h.appendChild(u); }
    return true;
  }
  function play(h) { h.classList.add('fl-go'); }
  API.write = function (h) { if (!h) return; if (!h.dataset.flDone) prep(h, h.matches('h1,.rds-display,.rds-display-xl') ? 'big' : 'small'); h.classList.remove('fl-go'); void h.offsetWidth; play(h); };

  var after = [];                                   // headings waiting for the sheet to lift
  var lifted = false;
  function lift() { if (lifted) return; lifted = true; root.classList.add('fl-lifted'); after.forEach(play); after = []; try { dispatchEvent(new Event('rvflow:lifted')); } catch (e) {} }
  var TITLES = 'main h1,.rds-article__title,.rds-display-xl,.rds-display';
  var SECTION_H = 'main article h2,.rv-body section>h2,.rds-prose h2,.rds-article__body h2,.rv-sec__head h2,.rds-sechead h2,.rds-seealso h2';
  function headings() {
    var seen = [], io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); if (lifted) play(e.target); else after.push(e.target); } });
    }, { threshold: 0.6 }) : null;
    var top = all(TITLES).filter(function (h) { return !h.closest('.rds-demo,.rds-search,dialog,.fl-stage'); });
    var firstDone = false;
    top.forEach(function (h) {
      var vis = h.getBoundingClientRect().top < innerHeight * 0.9;
      if (!prep(h, h.matches('h1,.rds-article__title,.rds-display-xl') ? 'big' : 'small')) return;
      if (vis) { if (lifted) play(h); else after.push(h); } else if (io) io.observe(h); else play(h);
    });
    all(SECTION_H).forEach(function (h) {
      if (h.closest('.rds-demo,.rds-search,dialog,.fl-stage') || h.dataset.flDone) return;
      if (!prep(h, 'small')) return;
      if (io) io.observe(h); else play(h);
    });
    setTimeout(function () { all('.fl-title:not(.fl-go)').forEach(function (h) { if (h.getBoundingClientRect().top < innerHeight) play(h); }); }, 4500);
  }

  /* ---------- intro (first visit, reload) ---------- */
  var LOGO = '<svg class="fl-logo" viewBox="0 0 32 32" width="96" height="96" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">' +
    '<path pathLength="1" style="stroke:var(--ink)" d="M2.23 15.17C3 14.28 5.19 10.18 6.84 9.81C8.49 9.45 10.61 11.4 12.14 12.98C13.67 14.55 14.69 19.27 16.01 19.27C17.33 19.26 18.61 14.52 20.07 12.94C21.53 11.35 23.15 9.36 24.76 9.74C26.37 10.13 28.89 14.32 29.71 15.23"/>' +
    '<path pathLength="1" style="stroke:var(--brick)" d="M2.19 18.32C2.97 17.37 5.31 13 6.92 12.62C8.52 12.24 10.31 14.38 11.81 16.04C13.3 17.71 14.56 22.57 15.89 22.61C17.23 22.64 18.33 17.93 19.81 16.27C21.3 14.61 23.15 12.35 24.82 12.66C26.49 12.97 29.01 17.23 29.85 18.14"/>' +
    '<path pathLength="1" style="stroke:var(--brick)" d="M16.55 8.84C16.23 8.78 15.1 8.78 14.62 8.45C14.14 8.13 13.87 7.46 13.67 6.89C13.47 6.32 13.23 5.57 13.43 5.03C13.64 4.49 14.34 3.84 14.9 3.65C15.47 3.47 16.22 3.72 16.84 3.92C17.45 4.11 18.28 4.35 18.6 4.84C18.93 5.34 18.98 6.28 18.8 6.88C18.62 7.47 18.06 8.05 17.53 8.41C16.99 8.77 15.89 8.94 15.57 9.05"/></svg>';
  function plate(a, b, withLogo) {
    var p = el('div', 'fl-plate');
    p.innerHTML = (withLogo ? LOGO : '') + '<div class="fl-plate__a"></div>' + (b ? '<div class="fl-plate__b"></div>' : '');
    var A = p.querySelector('.fl-plate__a'), B = p.querySelector('.fl-plate__b');
    A.textContent = a; prep(A, 'big');
    if (B) { B.textContent = b; }
    return p;
  }
  function writeNow(node) { var step = Math.min(34, 760 / Math.max(node.textContent.length, 1)); node.style.setProperty('--fl-step', T(step) + 'ms'); node.classList.add('fl-go'); }

  function runIntro(s) {
    var p = plate('Redrawn Valley', 'seeing the valley anew', true); s.appendChild(p);
    var A = p.querySelector('.fl-plate__a'), skip = false;
    p.querySelector('.fl-logo').classList.add('is-drawn');
    setTimeout(function () { writeNow(A); }, T(380));
    setTimeout(function () { p.classList.add('has-sub'); }, T(1000));
    function finish() { p.classList.add('is-out'); var ms = T(760); lift(); tiles(s, 'reveal', .5, .46, ms).then(function () { kill(s); clearTimeout(failsafe); }); }
    var t = setTimeout(finish, T(1500));
    s.style.pointerEvents = 'auto'; s.style.cursor = 'pointer';
    s.addEventListener('click', function once() { s.removeEventListener('click', once); clearTimeout(t); finish(); });
    return s;
  }
  function runReveal(s) {
    var p = plate(flag && flag.a || 'Redrawn Valley', flag && flag.b, false); p.classList.add('is-held'); s.appendChild(p);
    var A = p.querySelector('.fl-plate__a'); A.classList.add('fl-go', 'fl-instant'); p.classList.add('has-sub');
    var ox = flag && typeof flag.x === 'number' ? flag.x : .5, oy = flag && typeof flag.y === 'number' ? flag.y : .5;
    s._tiles.forEach(function (t) { t.style.transform = 'scale(1.03)'; });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      root.classList.remove('fl-cover');
      setTimeout(function () { p.classList.add('is-out'); }, T(60));
      setTimeout(lift, T(240));
      tiles(s, 'reveal', ox, oy, T(780)).then(function () { kill(s); clearTimeout(failsafe); });
    }); });
  }

  /* ---------- following a link: cover, then go ---------- */
  var leaving = false;
  function go(url, ox, oy) {
    if (leaving) return; leaving = true;
    var lb = labelFor(url), s = buildStage(url);
    s.classList.add('is-leaving'); s.style.pointerEvents = 'auto';
    var p = plate(lb.a, lb.b, false); s.appendChild(p);
    s._tiles.forEach(function (t) { t.style.transform = 'scale(0)'; });
    root.classList.add('fl-leave');
    var done = tiles(s, 'cover', ox, oy, T(520));
    setTimeout(function () { p.classList.add('has-sub'); writeNow(p.querySelector('.fl-plate__a')); p.classList.add('is-in'); }, T(260));
    store.set(NAVKEY, JSON.stringify({ t: Date.now(), x: ox, y: oy, a: lb.a, b: lb.b }));
    done.then(function () { setTimeout(function () { location.href = url; }, T(260)); });
    setTimeout(function () { if (leaving) { leaving = false; kill(s); root.classList.remove('fl-leave'); } }, 6500);   // the page never left (blocked, cancelled): put it back
  }
  /* preview: the whole link transition (cover, then lift) without leaving the page; used by the motion lab */
  API.preview = function (a, b, ox, oy) {
    if (doc.getElementById('fl-stage') || leaving) return;
    ox = ox == null ? .5 : ox; oy = oy == null ? .5 : oy;
    var s = buildStage('preview-' + (Date.now() % 53)); s.style.pointerEvents = 'auto';
    var p = plate(a || 'Studies', b || '', false); s.appendChild(p);
    s._tiles.forEach(function (t) { t.style.transform = 'scale(0)'; });
    tiles(s, 'cover', ox, oy, T(520)).then(function () {
      setTimeout(function () { p.classList.add('is-out'); tiles(s, 'reveal', ox, oy, T(780)).then(function () { kill(s); }); }, T(560));
    });
    setTimeout(function () { p.classList.add('has-sub'); writeNow(p.querySelector('.fl-plate__a')); p.classList.add('is-in'); }, T(260));
  };
  API.wipe = function (url) { go(url || location.href, .5, .5); };
  addEventListener('pageshow', function (e) {
    if (e.persisted) { leaving = false; var s = doc.getElementById('fl-stage'); if (s) kill(s); root.classList.remove('fl-leave', 'fl-cover'); }
  });
  doc.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-flow') || a.getAttribute('rel') === 'external') return;
    var u; try { u = new URL(a.href, location.href); } catch (er) { return; }
    if (!/^(https?|file):$/.test(u.protocol) || u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    if (/\.(xml|json|pdf|png|jpe?g|svg|webp|txt|zip|csv)$/i.test(u.pathname)) return;
    e.preventDefault();
    go(u.href, Math.min(1, Math.max(0, e.clientX / innerWidth)) || .5, Math.min(1, Math.max(0, e.clientY / innerHeight)) || .5);
  });

  API.intro = function () {
    if (doc.getElementById('fl-stage')) return;
    lifted = false; root.classList.remove('fl-lifted'); root.classList.add('fl-cover');
    var s = buildStage('intro-' + Date.now() % 97); s._tiles.forEach(function (t) { t.style.transform = 'scale(1.03)'; });
    requestAnimationFrame(function () { root.classList.remove('fl-cover'); runIntro(s); });
    all('.fl-title').forEach(function (h) { h.classList.remove('fl-go'); after.push(h); });
    failsafe = setTimeout(function () { kill(s); }, 5200);
  };

  /* ---------- pencil dab on click ---------- */
  var DAB = ['#9c3d24', '#2f4a3a', '#35506b'], dabN = 0;
  function dab(x, y) {
    var c = DAB[dabN++ % 3], ticks = '', n = 7, k;
    for (k = 0; k < n; k++) { var an = (k / n) * Math.PI * 2 + (dabN % 2) * .3, r1 = 13, r2 = 21 + (k % 2) * 5; ticks += '<path pathLength="1" d="M' + (30 + Math.cos(an) * r1).toFixed(1) + ' ' + (30 + Math.sin(an) * r1).toFixed(1) + 'L' + (30 + Math.cos(an) * r2).toFixed(1) + ' ' + (30 + Math.sin(an) * r2).toFixed(1) + '"/>'; }
    var d = el('div', 'fl-dab', '<svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path pathLength="1" d="M30 14C40 13 47 21 46 30S38 46 29 46 13 39 14 30 21 15 31 14"/>' + ticks + '</svg>');
    d.style.left = x + 'px'; d.style.top = y + 'px'; doc.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, T(760));
  }
  doc.addEventListener('pointerdown', function (e) {
    if (e.button || leaving || !root.classList.contains('fl-lifted') && mode !== 'none') return;
    if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable],dialog[open],.rds-zoom,[data-rv-compare]')) return;
    dab(e.clientX, e.clientY);
  }, { passive: true });

  /* ---------- rules that draw on, figures that get crop marks ---------- */
  function sketchy() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('fl-in'); io.unobserve(e.target); } }); }, { threshold: 0.4 });
    all('hr,.rds-rule,.rds-figure,.rds-decision,.rds-callout,.rds-facts,.rds-demo').forEach(function (n) { if (n.closest('.fl-stage,dialog')) return; n.classList.add('fl-sk'); io.observe(n); });
  }

  /* ---------- go ---------- */
  ready(function () {
    var s = null;
    if (mode === 'intro') { s = buildStage('intro-' + (Date.now() % 97)); runIntro(s); root.classList.remove('fl-cover'); }
    else if (mode === 'wipe') { s = buildStage(flag && flag.a || 'wipe'); runReveal(s); }
    else lift();
    headings(); sketchy();
    if (!s) lift();
  });
})();
