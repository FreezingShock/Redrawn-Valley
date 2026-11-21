/* Drawings gallery: reads assets/drawings.json (scripts/build_drawings.py), draws each figure from its source page inside a
   shadow root (so it keeps that page's own stylesheet), filters, and opens the shared zoom lightbox (interact.js).
   State lives in the URL: ?source=&type=&topic=&q=&size=  and  #<drawing id>  opens one. */
(function () {
  'use strict';
  var doc = document, root = doc.querySelector('[data-dg]');
  if (!root) return;
  var script = doc.currentScript || doc.querySelector('script[src*="drawings.js"]');
  var siteRoot = new URL('../../', script.src);
  var embed = /[?&]embed=1(&|$)/.test(location.search);
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, el) { return (el || root).querySelector(s); }
  function all(s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ZOOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 4.2c3.5-.2 6.3 2.6 6.2 6.2-.1 3.5-2.9 6.1-6.3 6-3.4-.1-6-2.8-5.9-6.2.1-3.3 2.7-5.8 6-6Z"/><path d="m15.6 15.8 4.4 4.4"/><path d="M10.5 8v5M8 10.5h5"/></svg>';

  var data, items = [], byId = {}, pages = {}, state = { q: '', source: '', type: '', topic: '', size: 's' };
  var grid = $('[data-dg-grid]'), filtersEl = $('[data-dg-filters]'), countEl = $('[data-dg-count]', doc.body), emptyEl = $('[data-dg-empty]'),
      bar = $('[data-dg-bar]'), qInput = $('[data-dg-q]'), limit = embed ? (+(/[?&]limit=(\d+)/.exec(location.search) || [])[1] || 6) : 0;

  /* ---------- data ---------- */
  fetch(new URL('assets/drawings.json', siteRoot)).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(start).catch(function () {
    countEl.textContent = 'The drawing list could not be loaded.';
  });

  function short(s, n) { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,.;:]+\S*$/, '') + '…' : s; }
  function sentence(s) { var m = /^(.+?[.!?])(\s|$)/.exec(s); return m ? m[1] : s; }
  function cap1(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function start(d) {
    data = d;
    d.pages.forEach(function (p) { pages[p.url] = p; });
    var secs = {}; d.sections.forEach(function (s) { secs[s.id] = s; });
    items = d.drawings.map(function (x) {
      var p = pages[x.page], sec = secs[x.section] || { label: x.section, noun: '' };
      var first = sentence(x.caption || x.label).replace(/[.]+$/, ''), title = cap1(short(first.length < 14 && x.caption ? x.caption : first, 110));
      x.title = title; x.p = p; x.sec = sec;
      x.src = x.section === 'studies' ? x.page : x.section;
      x.srcLabel = x.section === 'studies' ? (p.no ? p.no + ' ' : '') + p.title : sec.label;
      x.tag = d.types[x.type] || cap1(x.type);
      x.hay = [x.label, x.caption, x.note, x.heading, p.title, x.tag, x.topics.map(function (t) { return d.topics[t] || t; }).join(' ')].join(' ').toLowerCase();
      byId[x.id] = x; return x;
    });
    /* two drawings on a page can share a caption (Today / Proposed): fall back to their own descriptions to tell them apart */
    var seenT = {}; items.forEach(function (x) { var k = x.page + '|' + x.title; (seenT[k] = seenT[k] || []).push(x); });
    Object.keys(seenT).forEach(function (k) { if (seenT[k].length > 1) seenT[k].forEach(function (x) { x.title = cap1(short(sentence(x.label).replace(/[.]+$/, ''), 110)); }); });
    var lead = $('[data-dg-lead]', doc.body);
    if (lead) lead.textContent = items.length + ' drawings from ' + d.pages.length + ' pages: every labeled plan, section, sketch and chart in the studies and notes.';
    readUrl(); buildFilters(); buildCards(); bind(); apply(true);
    if (location.hash.length > 1 && byId[decodeURIComponent(location.hash.slice(1))]) openDrawing(decodeURIComponent(location.hash.slice(1)));
  }

  /* ---------- rendering a drawing from its source page ---------- */
  var pageCache = {};
  function loadPage(url) {
    if (pageCache[url]) return pageCache[url];
    var abs = new URL(url + 'index.html', siteRoot);
    return pageCache[url] = fetch(abs).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (html) {
      var pd = new DOMParser().parseFromString(html, 'text/html');
      var svgs = all('main svg', pd).filter(function (s) {
        if (s.parentNode.closest && s.parentNode.closest('svg')) return false;
        var vb = (s.getAttribute('viewBox') || '').trim().split(/[ ,]+/), c = s.getAttribute('class') || '';
        return s.getAttribute('role') === 'img' && (s.getAttribute('aria-label') || '').trim() && !s.hasAttribute('aria-hidden') && !s.hasAttribute('data-fig-skip') &&
          !/rds-icon|rds-logo/.test(c) && vb.length === 4 && +vb[2] >= 360;
      });
      var css = [];
      all('link[rel~="stylesheet"],style', pd).forEach(function (n) {
        if (n.tagName === 'STYLE') css.push({ text: n.textContent });
        else { var h = n.getAttribute('href') || ''; if (h && !/^(https?:)?\/\//.test(h)) css.push({ href: new URL(h, abs).href }); }
      });
      return { svgs: svgs, css: css };
    });
  }
  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
  function findSvg(pg, d) {
    var s = pg.svgs[d.n];
    if (s && norm(s.getAttribute('aria-label')) === d.label) return s;
    return pg.svgs.filter(function (x) { return norm(x.getAttribute('aria-label')) === d.label; })[0] || null;
  }
  var BASE = ':host{display:block;width:100%;height:100%}.dg-w{width:100%;height:100%}.dg-w>svg{display:block;width:100%;height:100%;max-width:none;max-height:none;user-select:none}';
  /* mount(host, d, stage): returns a promise that resolves when the drawing and its stylesheets are in place */
  function mount(host, d, stage) {
    return loadPage(d.page).then(function (pg) {
      var src = findSvg(pg, d); if (!src) throw 0;
      var sr = host.shadowRoot || host.attachShadow({ mode: 'open' }); sr.innerHTML = '';
      var waits = [];
      pg.css.forEach(function (c) {
        if (c.text != null) { var st = doc.createElement('style'); st.textContent = c.text; sr.appendChild(st); return; }
        var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = c.href;
        waits.push(new Promise(function (res) { l.onload = l.onerror = res; })); sr.appendChild(l);
      });
      var b = doc.createElement('style'); b.textContent = BASE; sr.appendChild(b);
      var w = doc.createElement('div'); w.className = 'dg-w';
      if (d.stages) w.setAttribute('data-st', stage == null ? d.stages.length - 1 : stage);
      var c = doc.importNode(src, true);
      ['width', 'height', 'style', 'data-rds-draw'].forEach(function (a) { c.removeAttribute(a); });
      c.setAttribute('data-in', ''); all('.rds-draw,.rds-view', c).forEach(function (n) { n.setAttribute('data-in', ''); });
      w.appendChild(c); sr.appendChild(w);
      /* pages keep big drawings in cached art files (scripts/extract_art.py): put the shapes back into this copy */
      var art = src.getAttribute('data-art');
      if (art) waits.push(fetch(new URL(art, new URL(d.page + 'index.html', siteRoot))).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
        c.innerHTML = t.slice(t.indexOf('>') + 1, t.lastIndexOf('</svg>')); c.removeAttribute('data-art');
      }).catch(function () {}));
      return Promise.race([Promise.all(waits), new Promise(function (res) { setTimeout(res, 4000); })]);
    });
  }

  /* ---------- filters ---------- */
  function readUrl() {
    var q = new URLSearchParams(location.search);
    state.q = q.get('q') || ''; state.source = q.get('source') || ''; state.type = q.get('type') || ''; state.topic = q.get('topic') || '';
    state.size = q.get('size') === 'l' ? 'l' : 's';
    qInput.value = state.q;
  }
  function writeUrl() {
    if (embed) return;
    var q = new URLSearchParams();
    ['q', 'source', 'type', 'topic'].forEach(function (k) { if (state[k]) q.set(k, state[k]); });
    if (state.size === 'l') q.set('size', 'l');
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }
  function groups() {
    var src = [], seen = {};
    items.forEach(function (x) { if (!seen[x.src]) { seen[x.src] = 1; src.push([x.src, x.srcLabel]); } });
    var types = Object.keys(data.types).filter(function (t) { return items.some(function (x) { return x.type === t; }); }).map(function (t) { return [t, data.types[t]]; });
    var topics = Object.keys(data.topics).filter(function (t) { return items.some(function (x) { return x.topics.indexOf(t) > -1; }); }).map(function (t) { return [t, data.topics[t]]; });
    return [{ key: 'source', label: 'Source', opts: src }, { key: 'type', label: 'Type', opts: types }, { key: 'topic', label: 'Topic', opts: topics }];
  }
  function buildFilters() {
    filtersEl.innerHTML = groups().map(function (g) {
      return '<div class="dg-fgroup" role="group" aria-label="Filter by ' + g.label.toLowerCase() + '"><p class="rds-eyebrow">' + g.label + '</p><div class="dg-chips">' +
        '<button type="button" class="dg-chip" data-g="' + g.key + '" data-v="" aria-pressed="false">All<i></i></button>' +
        g.opts.map(function (o) { return '<button type="button" class="dg-chip" data-g="' + g.key + '" data-v="' + esc(o[0]) + '" aria-pressed="false">' + esc(o[1]) + '<i></i></button>'; }).join('') + '</div></div>';
    }).join('');
  }
  function ok(x, skip) {
    if (skip !== 'source' && state.source && x.src !== state.source) return false;
    if (skip !== 'type' && state.type && x.type !== state.type) return false;
    if (skip !== 'topic' && state.topic && x.topics.indexOf(state.topic) < 0) return false;
    if (state.q) { var ws = state.q.toLowerCase().split(/\s+/).filter(Boolean); for (var i = 0; i < ws.length; i++) if (x.hay.indexOf(ws[i]) < 0) return false; }
    return true;
  }

  /* ---------- cards ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(onSee, { rootMargin: '260px 0px 120px' }) : null, batch = 0;
  function href(x, anchor) { return '../' + x.page + 'index.html' + (anchor && x.anchor ? '#' + encodeURIComponent(x.anchor) : ''); }
  function buildCards() {
    grid.innerHTML = items.map(function (x) {
      var ar = Math.max(.95, Math.min(1.6, x.vb[0] / x.vb[1])).toFixed(3);
      var where = '<a href="' + href(x) + '">' + esc(x.sec.noun + (x.p.no ? ' ' + x.p.no : '') + ' · ' + short(x.p.title, 44)) + '</a>' +
        (x.heading ? '<a href="' + href(x, true) + '">' + esc('§ ' + short(x.heading, 46)) + '</a>' : '');
      return '<li class="dg-card" id="d-' + esc(x.id) + '" data-id="' + esc(x.id) + '"><button type="button" class="dg-card__art is-loading" style="--ar:' + ar + '" aria-label="Enlarge: ' + esc(x.label) + '">' +
        '<span class="dg-host" aria-hidden="true"></span><span class="dg-zoom">' + ZOOM + '</span></button>' +
        '<div class="dg-card__body"><p class="dg-card__meta"><span class="rds-tag rds-tag--brick">' + esc(x.tag) + '</span>' + (x.fig ? '<span>Fig. ' + x.fig + '</span>' : '') + (x.stages ? '<span>' + x.stages.length + ' stages</span>' : '') + '</p>' +
        '<h3 class="dg-card__title">' + esc(x.title) + '</h3>' + (x.note ? '<p class="dg-card__note">' + esc(short(x.note, 90)) + '</p>' : '') +
        '<p class="dg-card__where">' + where + '</p></div></li>';
    }).join('');
    items.forEach(function (x) { x.el = $('[data-id="' + x.id.replace(/"/g, '') + '"]', grid); x.art = $('.dg-card__art', x.el); x.host = $('.dg-host', x.el); x.loaded = false; });
  }
  function onSee(entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, x = byId[el.getAttribute('data-id')];
      el.style.transitionDelay = reduce ? '0s' : (batch++ % 4) * 60 + 'ms'; el.classList.add('is-in');
      if (!x.loaded) { x.loaded = true; mount(x.host, x).then(function () { x.art.classList.remove('is-loading'); }, function () { x.art.classList.remove('is-loading'); x.art.classList.add('is-failed'); }); }
      io.unobserve(el);
    });
    batch = 0;
  }

  /* ---------- apply state ---------- */
  var vis = [];
  function apply(first) {
    var prev = {}; vis.forEach(function (x) { prev[x.id] = 1; });
    vis = items.filter(function (x) { return ok(x); });
    if (limit) vis = vis.slice(0, limit);
    var show = {}; vis.forEach(function (x) { show[x.id] = 1; });
    items.forEach(function (x) {
      var on = !!show[x.id]; x.el.hidden = !on;
      if (on && (!prev[x.id] || first)) { if (!first || !x.el.classList.contains('is-in')) { x.el.classList.remove('is-in'); } if (io) { io.unobserve(x.el); io.observe(x.el); } else { x.el.classList.add('is-in'); if (!x.loaded) { x.loaded = true; mount(x.host, x).then(function () { x.art.classList.remove('is-loading'); }, function () { x.art.classList.remove('is-loading'); x.art.classList.add('is-failed'); }); } } }
    });
    // chip state and faceted counts
    all('.dg-chip').forEach(function (c) {
      var g = c.getAttribute('data-g'), v = c.getAttribute('data-v');
      c.setAttribute('aria-pressed', String((state[g] || '') === v));
      var n = items.filter(function (x) { return ok(x, g) && (!v || (g === 'source' ? x.src === v : g === 'type' ? x.type === v : x.topics.indexOf(v) > -1)); }).length;
      $('i', c).textContent = n; if (n) c.removeAttribute('data-zero'); else c.setAttribute('data-zero', '');
    });
    var total = items.filter(function (x) { return ok(x); }).length, active = ['source', 'type', 'topic'].filter(function (k) { return state[k]; }).length + (state.q ? 1 : 0);
    countEl.innerHTML = total === items.length ? '<b>' + total + '</b> drawings' : 'Showing <b>' + total + '</b> of ' + items.length + ' drawings';
    emptyEl.hidden = total > 0; grid.hidden = total === 0;
    all('[data-dg-reset]').forEach(function (b) { b.hidden = !active; });
    var badge = $('[data-dg-active]'); badge.hidden = !active; badge.textContent = active;
    root.setAttribute('data-size', state.size);
    all('[data-dg-size]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-dg-size') === state.size)); });
    if (!first) writeUrl();
  }

  function bind() {
    filtersEl.addEventListener('click', function (e) {
      var c = e.target.closest('.dg-chip'); if (!c) return;
      state[c.getAttribute('data-g')] = c.getAttribute('data-v'); apply(); keepInView();
    });
    var t; qInput.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { state.q = qInput.value.trim(); apply(); }, 120); });
    all('[data-dg-reset]').forEach(function (b) { b.addEventListener('click', function () { state.q = state.source = state.type = state.topic = ''; qInput.value = ''; apply(); keepInView(); }); });
    all('[data-dg-size]').forEach(function (b) { b.addEventListener('click', function () { state.size = b.getAttribute('data-dg-size'); apply(); }); });
    $('[data-dg-toggle]').addEventListener('click', function () { var o = !bar.classList.contains('is-open'); bar.classList.toggle('is-open', o); this.setAttribute('aria-expanded', String(o)); });
    grid.addEventListener('click', function (e) { var b = e.target.closest('.dg-card__art'); if (b) openDrawing(b.parentNode.getAttribute('data-id')); });
    addEventListener('hashchange', function () { var id = decodeURIComponent(location.hash.slice(1)); if (byId[id] && id !== cur) openDrawing(id); });
    doc.addEventListener('keydown', function (e) { if (!cur || e.altKey || e.ctrlKey || e.metaKey) return; if (e.key === ']') step(1); else if (e.key === '[') step(-1); });
    /* sticky offset follows the real header height */
    var nav = doc.querySelector('.rds-nav'), sec = $('.dg-section', doc.body) || root.closest('.dg-section');
    function top() { if (!sec) return; var mobile = matchMedia('(max-width:640px)').matches; sec.style.setProperty('--dg-top', embed ? '0px' : (mobile ? '' : (nav ? Math.round(nav.getBoundingClientRect().height) : 72) + 'px')); }
    top(); addEventListener('resize', top); if (nav && window.ResizeObserver) new ResizeObserver(top).observe(nav);
  }
  /* after a filter click, keep the top of the sheet in view so the change is visible */
  function keepInView() {
    var g = grid.getBoundingClientRect(); if (g.top > 0) return;
    var y = scrollY + g.top - (bar.getBoundingClientRect().height + 80);
    scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------- lightbox ---------- */
  var cur = '';
  function whenLightbox(fn) { if (window.RDSInteract) fn(); else addEventListener('load', function () { window.RDSInteract && fn(); }); }
  function step(dir) {
    var list = vis.length ? vis : items, i = list.map(function (x) { return x.id; }).indexOf(cur);
    if (i < 0) i = 0; openDrawing(list[(i + dir + list.length) % list.length].id);
  }
  function openDrawing(id) {
    var x = byId[id]; if (!x) return;
    if (!ok(x) || (limit && vis.indexOf(x) < 0)) { state.q = state.source = state.type = state.topic = ''; qInput.value = ''; apply(); }
    whenLightbox(function () {
      cur = id;
      var host = doc.createElement('div'); host.className = 'dg-big'; host.setAttribute('role', 'img'); host.setAttribute('aria-label', x.label);
      var list = vis.length ? vis : items, pos = list.indexOf(x) + 1;
      var ex = doc.createElement('div'); ex.className = 'dg-lbx';
      var stages = '';
      if (x.stages) stages = '<div class="dg-lbx__stages" role="group" aria-label="Stage">' + x.stages.map(function (s, i) { return '<button type="button" data-stage="' + i + '" aria-pressed="' + (i === x.stages.length - 1) + '">' + esc(short(s, 22)) + '</button>'; }).join('') + '</div>';
      ex.innerHTML = stages + '<button type="button" data-step="-1" aria-label="Previous drawing" title="Previous ( [ )">&larr;</button><span class="dg-lbx__pos">' + pos + ' / ' + list.length + '</span><button type="button" data-step="1" aria-label="Next drawing" title="Next ( ] )">&rarr;</button>' +
        '<a class="dg-lbx__view" href="' + href(x, true) + '"><span class="dg-lbx__full">View on page</span><span class="dg-lbx__short">Page</span> <span aria-hidden="true">&rarr;</span></a>';
      ex.addEventListener('click', function (e) {
        var s = e.target.closest('[data-step]'); if (s) { step(+s.getAttribute('data-step')); return; }
        var b = e.target.closest('[data-stage]'); if (b && host.shadowRoot) {
          var w = host.shadowRoot.querySelector('.dg-w'); if (w) w.setAttribute('data-st', b.getAttribute('data-stage'));
          all('[data-stage]', ex).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        }
      });
      var cap = (x.fig ? 'Fig. ' + x.fig + ': ' : '') + x.title + (x.note ? ' · ' + short(x.note, 80) : '') + ' · ' + x.sec.noun + (x.p.no ? ' ' + x.p.no : '') + ', ' + short(x.p.title, 40);
      RDSInteract.zoom(null, { node: host, caption: cap, extras: ex, opener: x.art, onClose: function () {
        cur = ''; if (location.hash) history.replaceState(null, '', location.pathname + location.search);
        if (x.art && x.art.isConnected) x.art.focus({ preventScroll: true });
      } });
      mount(host, x);
      if (!embed) history.replaceState(null, '', '#' + encodeURIComponent(id) + '');
      else history.replaceState(null, '', location.pathname + location.search);
    });
  }
})();
