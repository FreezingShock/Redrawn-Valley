/* Redrawn Valley: "Keep reading" rail and Random page.
   Loaded by assets/site-shell.js on every page. Builds a horizontally scrolling rail of cards (seeded art, type, title, blurb)
   at the end of <main>, ranked by shared topics (search-index field `k`, see scripts/build_index.py; derived from the
   title and blurb when a page has none), and wires every [data-rv-random] link to a random page.
   Scrolling: native scroll-snap and momentum on touch and trackpads; arrow buttons, keyboard (arrows, Home, End) and
   mouse-drag with a glide on release for desktop. Passive listeners and one rAF per frame. Reduced motion: no smooth scroll.
   Opt out with <body data-no-rail>. API: RVRelated.random(), RVRelated.rank(url). Documented in DESIGN.md > Keep reading. */
(function () {
  'use strict';
  var doc = document, me = doc.currentScript;
  if (/[?&]embed=1(&|$)/.test(location.search)) return;
  var siteRoot = new URL('../../', me && me.src ? me.src : location.href);
  var isFile = location.protocol === 'file:';
  var reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function href(p) { return new URL(p + (isFile && (p === '' || /\/$/.test(p)) ? 'index.html' : ''), siteRoot).href; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var sitePath = siteRoot.pathname;
  var here = decodeURIComponent(location.pathname.slice(sitePath.length)).replace(/index\.html$/, '');

  var TYPE = {
    studies: ['Study', 'brick'], guide: ['Field guide', 'moss'], notes: ['Note', 'slate'], lab: ['Lab note', 'ochre'],
    map: ['Map', 'slate'], atlas: ['Atlas', 'moss'], topics: ['Topic', 'brick'], changelog: ['Log', 'ochre'],
    drawings: ['Drawings', 'brick'], sources: ['Sources', 'moss']
  };
  var DERIVE = {
    heat: /\bheat|\bhot\b|temperature|\bcool(?:er|ing)?\b|pavement|asphalt/g, trees: /\btrees?\b|canopy|\bshade|willow|planting/g,
    water: /\bwater|stormwater|runoff|swale|\brivers?\b|\brain|permeable|riparian/g, soil: /\bsoils?\b|\broots?\b|compaction/g,
    parking: /\bparking|\bstalls?\b|\blots?\b/g, walking: /\bwalk|pedestrian|crossing|sidewalk|transit/g,
    streets: /\bstreets?\b|boulevard|\bcurb|\blanes?\b/g, shopping: /\bshop|retail|restaurant|storefront/g
  };
  function topicsOf(p) {
    if (p.k && p.k.length) return p.k;
    if (p._k) return p._k;
    var s = (p.t + ' ' + p.d + ' ' + p.h.map(function (h) { return h[0]; }).join(' ')).toLowerCase(), sc = [];
    Object.keys(DERIVE).forEach(function (t) { var m = s.match(DERIVE[t]); if (m) sc.push([t, m.length]); });
    sc.sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); });
    return (p._k = sc.slice(0, 3).map(function (x) { return x[0]; }));
  }
  function title(p) { return p.t.split(' | ')[0]; }
  function sectionOf(p) { return p.s || p.u.split('/')[0]; }
  function hashN(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }

  /* ---------- the pool: articles, not section front pages ---------- */
  var DATA = null;
  function load() {
    return fetch(new URL('assets/search-index.json', siteRoot)).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { DATA = d; return d; });
  }
  function pool(d) {
    var us = d.pages.map(function (p) { return p.u; });
    return d.pages.filter(function (p) {
      if (!p.u || /(^|\/)_/.test(p.u)) return false;
      var kids = us.some(function (u) { return u !== p.u && u.indexOf(p.u) === 0 && /\/$/.test(p.u); });
      return !kids;
    });
  }

  /* ---------- ranking ---------- */
  function rank(url, d) {
    d = d || DATA; if (!d) return [];
    var items = pool(d), cur = d.pages.filter(function (p) { return p.u === url; })[0];
    var ck = cur ? topicsOf(cur) : [], cs = cur ? sectionOf(cur) : '';
    var scored = items.filter(function (p) { return p.u !== url; }).map(function (p) {
      var pk = topicsOf(p), why = [], s = 0;
      pk.forEach(function (t, i) { var j = ck.indexOf(t); if (j >= 0) { why.push(t); s += (i === 0 ? 3 : 2) + (j === 0 ? 2 : 0); } });
      if (cur && sectionOf(p) !== cs) s += 1.2;                       // crossing sections is the point of a rail
      if (cur && url.indexOf(p.u.replace(/[^/]+\/$/, '')) === 0 && p.u.split('/').length > 2 && p.u.split('/')[0] === cs) s += .4;
      s += hashN(url + '|' + p.u) * .9;                                   // stable per page, differs between pages
      return { p: p, score: s, why: why };
    }).sort(function (a, b) { return b.score - a.score; });
    var out = [], per = {};
    scored.forEach(function (x) {                                          // no more than 4 of a kind while others remain
      var sec = sectionOf(x.p); if ((per[sec] || 0) >= 4 && scored.length > 9) return;
      per[sec] = (per[sec] || 0) + 1; if (out.length < 9) out.push(x);
    });
    return out;
  }

  /* ---------- random page ---------- */
  function seen() { try { return JSON.parse(sessionStorage.getItem('rv-random') || '[]'); } catch (e) { return []; } }
  function remember(u) { try { var s = seen(); s.push(u); sessionStorage.setItem('rv-random', JSON.stringify(s.slice(-40))); } catch (e) { } }
  function randomUrl(d) {
    var items = pool(d).filter(function (p) { return p.u !== here; }), s = seen();
    var fresh = items.filter(function (p) { return s.indexOf(p.u) < 0; });
    var from = fresh.length ? fresh : items; if (!from.length) return null;
    return from[Math.floor(Math.random() * from.length)].u;
  }
  function go() {
    var run = function (d) { var u = randomUrl(d); if (u == null) return; remember(u); location.href = href(u); };
    if (DATA) run(DATA); else load().then(run, function () { location.href = href('guide/'); });
  }
  window.RVRelated = { random: go, rank: function (u) { return rank(u).map(function (x) { return x.p.u; }); } };
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-rv-random]'); if (!a) return;
    e.preventDefault(); go();
  });

  /* ---------- styles ---------- */
  function css() {
    if (doc.querySelector('link[href*="rail.css"]')) return;
    var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('assets/rds/rail.css', siteRoot).href; doc.head.appendChild(l);
  }
  function loadArt(cb) {
    if (window.RDSArt) return cb();
    var s = doc.createElement('script'); s.src = new URL('assets/rds/motifs.js', siteRoot).href; s.onload = cb; doc.head.appendChild(s);
  }

  /* ---------- build ---------- */
  function icon(name, size) { return '<svg class="rds-icon" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false"><use href="' + new URL('assets/rds/icons/icons.svg', siteRoot).href + '#i-' + name + '"/></svg>'; }
  var DICE = '<svg class="rv-rail__dice" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.6 5.2c4.8-.5 9.7-.6 14.8.1.5 4.9.6 9.5-.1 14.4-5 .6-9.8.5-14.6 0-.6-4.8-.6-9.7-.1-14.5z"/><circle cx="8.6" cy="8.8" r=".9" fill="currentColor"/><circle cx="15.4" cy="15.2" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/></svg>';

  function card(x, i) {
    var p = x.p, sec = sectionOf(p), ty = TYPE[sec] || [(DATA.sections && DATA.sections[sec]) || 'Page', 'ink'];
    var seed = p.u.replace(/\/$/, ''), tp = (x.why.length ? x.why : topicsOf(p)).join(' ') + ' ' + seed.split('/').pop().replace(/-/g, ' ');
    var read = Math.max(1, Math.round((p.x || '').split(/\s+/).length / 210));
    return '<li class="rv-rail__item"><a class="rv-rail__card" href="' + esc(href(p.u)) + '" data-t="' + ty[1] + '">' +
      '<div class="rv-rail__art rds-art" data-rds-art="card" data-seed="' + esc(seed) + '" data-topic="' + esc(tp) + '" aria-hidden="true"></div>' +
      '<div class="rv-rail__body"><p class="rv-rail__type"><span>' + esc(ty[0]) + '</span>' + (p.x && p.x.length > 600 ? '<span class="rv-rail__read">' + (read > 1 ? read + ' min' : '1 min') + '</span>' : '') + '</p>' +
      '<h3 class="rv-rail__title">' + esc(title(p)) + '</h3>' +
      '<p class="rv-rail__blurb">' + esc(p.d || '') + '</p>' +
      '<p class="rv-rail__foot">' + (x.why.length ? '<span class="rv-rail__why">' + x.why.slice(0, 2).map(esc).join(' · ') + '</span>' : '<span class="rv-rail__why">' + esc((topicsOf(p)[0] || '')) + '</span>') + '<span class="rv-rail__go">Read ' + icon('arrow-right', 16) + '</span></p></div></a></li>';
  }

  function build(items, curTopics) {
    var main = doc.querySelector('main'); if (!main || doc.querySelector('.rv-rail') || !items.length) return;
    var sec = doc.createElement('section'); sec.className = 'rv-rail'; sec.setAttribute('aria-labelledby', 'rv-rail-h'); sec.setAttribute('data-rv-noindex', '');
    var sub = curTopics.length ? 'Matched on ' + curTopics.slice(0, 3).join(', ') + '.' : 'A few places to start.';
    sec.innerHTML = '<div class="rds-container"><header class="rv-rail__head"><div><p class="rds-eyebrow">Keep reading</p><h2 class="rv-rail__h" id="rv-rail-h">More from the valley</h2><p class="rv-rail__sub">' + esc(sub) + '</p></div>' +
      '<div class="rv-rail__tools"><button class="rv-rail__random" type="button" data-rv-random>' + DICE + '<span>Random page</span></button>' +
      '<div class="rv-rail__arrows"><button class="rv-rail__arrow" type="button" data-dir="-1" aria-label="Previous cards">' + icon('chevron-right', 20) + '</button><button class="rv-rail__arrow" type="button" data-dir="1" aria-label="Next cards">' + icon('chevron-right', 20) + '</button></div></div></header></div>' +
      '<div class="rv-rail__view"><ul class="rv-rail__track" tabindex="0" role="region" aria-label="Related pages, scroll sideways">' + items.map(card).join('') + '</ul></div>' +
      '<div class="rds-container"><div class="rv-rail__meter" aria-hidden="true"><i></i></div></div>';
    var foot = main.querySelector('.rv-footstrip'); main.appendChild(sec);
    behave(sec);
    var arts = [].slice.call(sec.querySelectorAll('.rds-art'));
    loadArt(function () {
      if (!('IntersectionObserver' in window)) { arts.forEach(function (a) { RDSArt.render(a); }); return; }
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); RDSArt.render(e.target); } }); }, { rootMargin: '0px 600px 300px 600px' });
      arts.forEach(function (a) { io.observe(a); });
    });
  }

  /* ---------- scrolling behaviour ---------- */
  function behave(sec) {
    var track = sec.querySelector('.rv-rail__track'), view = sec.querySelector('.rv-rail__view'), prev = sec.querySelector('[data-dir="-1"]'), next = sec.querySelector('[data-dir="1"]'), bar = sec.querySelector('.rv-rail__meter i');
    var cards = [].slice.call(track.children), ticking = false;
    function smooth() { return reduceMQ.matches ? 'auto' : 'smooth'; }
    function step() { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth; }
    function update() {
      ticking = false;
      var max = track.scrollWidth - track.clientWidth, x = track.scrollLeft;
      view.classList.toggle('can-prev', x > 4); view.classList.toggle('can-next', x < max - 4);
      prev.setAttribute('aria-disabled', x <= 4); next.setAttribute('aria-disabled', x >= max - 4);
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.max(.08, Math.min(1, (x + track.clientWidth * .0) / (max + track.clientWidth) + track.clientWidth / (max + track.clientWidth))) : 1).toFixed(3) + ')';
    }
    function queue() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    track.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(queue).observe(track);
    update();
    function page(dir) { var n = Math.max(1, Math.floor(track.clientWidth / step())); track.scrollBy({ left: dir * n * step(), behavior: smooth() }); }
    [prev, next].forEach(function (b) { b.addEventListener('click', function () { page(+b.getAttribute('data-dir')); }); });

    /* keyboard: when the track itself has focus; links inside keep their own Tab order and scroll into view natively */
    track.addEventListener('keydown', function (e) {
      if (e.target !== track || e.altKey || e.ctrlKey || e.metaKey) return;
      var k = e.key;
      if (k === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: smooth() }); }
      else if (k === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior: smooth() }); }
      else if (k === 'Home') { e.preventDefault(); track.scrollTo({ left: 0, behavior: smooth() }); }
      else if (k === 'End') { e.preventDefault(); track.scrollTo({ left: track.scrollWidth, behavior: smooth() }); }
      else if (k === 'PageDown') { e.preventDefault(); page(1); } else if (k === 'PageUp') { e.preventDefault(); page(-1); }
    });
    track.addEventListener('focusin', function (e) { var li = e.target.closest && e.target.closest('.rv-rail__item'); if (li) { var l = li.offsetLeft - track.clientWidth * .05; if (li.offsetLeft < track.scrollLeft || li.offsetLeft + li.offsetWidth > track.scrollLeft + track.clientWidth) track.scrollTo({ left: l, behavior: smooth() }); } });

    /* mouse drag with a glide on release (touch and trackpads already have native momentum) */
    var drag = null, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, t: performance.now(), lx: e.clientX, lt: performance.now(), v: 0, id: e.pointerId }; moved = false;
    });
    track.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('is-drag'); try { track.setPointerCapture(e.pointerId); } catch (er) { } }
      if (!moved) return;
      track.scrollLeft = drag.left - dx;
      var now = performance.now(), dt = now - drag.lt; if (dt > 0) { drag.v = .8 * drag.v + .2 * ((drag.lx - e.clientX) / dt); drag.lx = e.clientX; drag.lt = now; }
    });
    function end(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var d = drag; drag = null;
      if (!moved) return;
      var glide = Math.max(-900, Math.min(900, d.v * 260));
      track.classList.remove('is-drag');
      var target = track.scrollLeft + glide, best = 0, bd = 1e9;
      cards.forEach(function (c) { var dd = Math.abs(c.offsetLeft - target); if (dd < bd) { bd = dd; best = c.offsetLeft; } });
      track.scrollTo({ left: Math.max(0, Math.min(best, track.scrollWidth - track.clientWidth)), behavior: smooth() });
    }
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* ---------- go ---------- */
  function init() {
    if (doc.body.hasAttribute('data-no-rail') || doc.body.classList.contains('rv-embed')) return;
    css();
    load().then(function (d) {
      var cur = d.pages.filter(function (p) { return p.u === here; })[0];
      var items = rank(here, d);
      build(items, cur ? topicsOf(cur) : []);
    }).catch(function () { });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
