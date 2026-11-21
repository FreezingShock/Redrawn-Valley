/* Redrawn Valley search: sketched dialog, instant typo-tolerant results, highlighted matches, keyboard navigation,
   a live preview per result, drawn empty and no-result states. Loaded on idle by assets/site-shell.js, which passes
   the shell helpers in (RVSearchBoot(ctx)). Styles: assets/rds/search.css. Everything animated stands still under
   prefers-reduced-motion. Documented in DESIGN.md > Search. */
(function () {
  'use strict';
  window.RVSearchBoot = function (ctx) {
    var doc = document, NS = 'http://www.w3.org/2000/svg';
    var esc = ctx.esc, all = ctx.all, href = ctx.href, icon = ctx.icon, siteRoot = ctx.siteRoot;
    var reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var wideMQ = window.matchMedia ? matchMedia('(min-width: 861px)') : { matches: true };

    /* ---------- stylesheet (loaded once, before the first open so nothing flashes unstyled) ---------- */
    var cssP = new Promise(function (res) {
      if (doc.querySelector('link[data-rvs-css]')) return res();
      var l = doc.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-rvs-css', '');
      l.href = new URL('assets/rds/search.css', siteRoot).href + (ctx.q || '');
      l.onload = l.onerror = function () { res(); }; setTimeout(res, 1200);
      doc.head.appendChild(l);
    });

    /* ---------- section look: icon + tone per type ---------- */
    var SEC = { studies: { icon: 'studies', tone: 'brick' }, guide: { icon: 'guide', tone: 'moss' }, notes: { icon: 'notes', tone: 'slate' }, lab: { icon: 'ruler', tone: 'ochre' } };
    var ORDER = ['studies', 'guide', 'notes', 'lab'];
    var TOPIC_ICON = [[/shade|tree|canopy/, 'tree'], [/river|riparian/, 'river'], [/water|swale|rain|permeable|impervious|storm/, 'water'], [/heat|hot|temperature|cool/, 'heat'], [/pavement|asphalt/, 'pavement'], [/soil|ground/, 'soil'], [/sidewalk|walk|quarter|corner/, 'sidewalk'], [/leaf|plant|willow/, 'leaf']];
    function secOf(p) { return SEC[p.s] || { icon: 'pin', tone: 'ink' }; }
    function iconOf(p, isHead) {
      if (isHead) return 'hash';
      var t = p._t || '';
      for (var i = 0; i < TOPIC_ICON.length; i++) if (TOPIC_ICON[i][0].test(t)) return TOPIC_ICON[i][1];
      return secOf(p).icon;
    }
    function label(s) { var L = (ctx.data() || {}).sections || ctx.labels; return L[s] || s || 'Site'; }

    /* ---------- index prep ---------- */
    var DATA = null, VOCAB = {};
    function words(s) { return s.toLowerCase().split(/[^a-z0-9À-ɏ]+/).filter(Boolean); }
    function prep() {
      DATA = ctx.data(); if (!DATA || DATA._rvs) return;
      DATA._rvs = 1; VOCAB = {};
      DATA.pages.forEach(function (p) {
        p.title = String(p.t).replace(/\s*\|.*$/, '');
        p._t = p.title.toLowerCase(); p._d = (p.d || '').toLowerCase(); p._x = (p.x || '').toLowerCase();
        p._h = p.h.map(function (h) { var txt = String(h[0]).replace(/#\s*$/, '').trim(); return { txt: txt, low: txt.toLowerCase(), id: h[1] }; });
        p._w = words(p._t + ' ' + p._h.map(function (h) { return h.low; }).join(' '));
        words(p._t + ' ' + p._d + ' ' + p._h.map(function (h) { return h.low; }).join(' ')).forEach(function (w) { if (w.length >= 4) VOCAB[w] = (VOCAB[w] || 0) + 1; });
        p.slug = p.u.replace(/\/$/, '').split('/').pop() || 'home';
      });
    }

    /* ---------- matching ---------- */
    function lev(a, b, max) {
      if (Math.abs(a.length - b.length) > max) return max + 1;
      var prev = [], cur = [], i, j;
      for (j = 0; j <= b.length; j++) prev[j] = j;
      for (i = 1; i <= a.length; i++) {
        cur[0] = i; var rowMin = i;
        for (j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); if (cur[j] < rowMin) rowMin = cur[j]; }
        if (rowMin > max) return max + 1;
        var t = prev; prev = cur; cur = t;
      }
      return prev[b.length];
    }
    function near(word, w, tol) { return Math.min(lev(word, w, tol), word.length > w.length ? lev(word.slice(0, w.length), w, tol) : 9) <= tol; }
    function terms(q) { return words(q); }
    function nearWord(p, w) { // the word in this page that a mistyped term most likely meant
      var tol = w.length >= 8 ? 2 : 1;
      for (var i = 0; i < p._w.length; i++) if (p._w[i].length >= 3 && near(p._w[i], w, tol)) return p._w[i];
      return null;
    }
    function search(q, fuzzy) {
      var ts = terms(q), rows = [], hl = ts.slice();
      if (!ts.length || !DATA) return { rows: rows, hl: hl };
      var qn = q.toLowerCase().trim();
      DATA.pages.forEach(function (p) {
        var score = 0, ok = true;
        ts.forEach(function (w) {
          var s = 0, ti = p._t.indexOf(w);
          if (ti >= 0) s += ti === 0 || p._t.charAt(ti - 1) === ' ' ? 12 : 6;
          if (p._h.some(function (h) { return h.low.indexOf(w) >= 0; })) s += 5;
          if (p._d.indexOf(w) >= 0) s += 3;
          var xi = p._x.indexOf(w); if (xi >= 0) s += 1 + Math.min(2, (p._x.split(w).length - 1) / 5);
          if (!s && fuzzy && w.length >= 4) { var nw = nearWord(p, w); if (nw) { s = 3; if (hl.indexOf(nw) < 0) hl.push(nw); } }
          if (!s) ok = false; score += s;
        });
        if (!ok) return;
        if (p._t.indexOf(qn) >= 0) score += 10;
        if (p.u === '') score -= 2;
        rows.push({ score: score, p: p });
        p._h.forEach(function (h) {
          if (!h.id || !ts.every(function (w) { return h.low.indexOf(w) >= 0; })) return;
          rows.push({ score: score + 3, p: p, h: h });
        });
      });
      if (!fuzzy && rows.filter(function (r) { return !r.h; }).length < 3) return search(q, true);
      rows.sort(function (a, b) { return b.score - a.score; });
      return { rows: rows, hl: hl };
    }
    function didYouMean(q) { // closest word in the site's own vocabulary
      var ts = terms(q), best = null, bd = 9, bf = 0;
      var w = ts.length ? ts[ts.length - 1] : ''; if (w.length < 3) return null;
      Object.keys(VOCAB).forEach(function (v) { var d = lev(v, w, 3); if (d < bd || (d === bd && VOCAB[v] > bf)) { bd = d; best = v; bf = VOCAB[v]; } });
      if (!best || bd > Math.max(1, Math.floor(w.length / 3)) || best === w) return null;
      return ts.slice(0, -1).concat(best).join(' ');
    }
    function mark(text, hl) {
      var s = esc(text); if (!hl.length) return s;
      var re = hl.slice().sort(function (a, b) { return b.length - a.length; }).map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|');
      return s.replace(new RegExp('(' + re + ')', 'ig'), '<mark>$1</mark>');
    }
    function snippet(text, hl, skip) {
      var low = text.toLowerCase(), at = -1; hl.forEach(function (t) { var i = low.indexOf(t, skip || 0); if (i < 0 && skip) i = low.indexOf(t); if (i >= 0 && (at < 0 || i < at)) at = i; });
      if (at < 0) return text.slice(0, 150);
      var from = Math.max(0, at - 46), s = text.slice(from, from + 150);
      return (from > 0 ? '…' : '') + s + (from + 150 < text.length ? '…' : '');
    }

    /* ---------- recents ---------- */
    var RK = 'rv-search-recent';
    function recents() { try { return JSON.parse(localStorage.getItem(RK) || '[]').filter(function (u) { return typeof u === 'string'; }); } catch (e) { return []; } }
    function remember(u) { try { var r = recents().filter(function (x) { return x !== u; }); r.unshift(u); localStorage.setItem(RK, JSON.stringify(r.slice(0, 4))); } catch (e) { } }
    function forget() { try { localStorage.removeItem(RK); } catch (e) { } }
    function pageByUrl(u) { for (var i = 0; i < DATA.pages.length; i++) if (DATA.pages[i].u === u) return DATA.pages[i]; return null; }

    /* ---------- hand-drawn bits ---------- */
    function rnd(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    function f1(n) { return Math.round(n * 10) / 10; }
    // a rectangle drawn by a hand: jittered points, a small overshoot where the pencil comes back to its start
    function sketchRect(w, h, inset, r, seed, jit) {
      var R = rnd(seed), x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset, pts = [], step = 34;
      function edge(ax, ay, bx, by) { var n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / step)); for (var i = 0; i < n; i++) { var t = i / n; pts.push([ax + (bx - ax) * t + (R() - .5) * jit, ay + (by - ay) * t + (R() - .5) * jit]); } }
      edge(x0 + r, y0, x1 - r, y0); edge(x1 - r, y0, x1, y0 + r); edge(x1, y0 + r, x1, y1 - r); edge(x1, y1 - r, x1 - r, y1);
      edge(x1 - r, y1, x0 + r, y1); edge(x0 + r, y1, x0, y1 - r); edge(x0, y1 - r, x0, y0 + r); edge(x0, y0 + r, x0 + r, y0);
      pts.push([x0 + r + 22, y0 + (R() - .5) * jit]); // overshoot
      return 'M' + pts.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join(' L');
    }
    function boxPath(seed) { // row selection box, drawn in a 100 x 40 box that stretches to the row
      var R = rnd(seed), j = function (n) { return f1(n + (R() - .5) * 3); };
      return 'M' + j(3) + ' ' + j(6) + ' C' + j(30) + ' ' + j(2) + ' ' + j(70) + ' ' + j(5) + ' ' + j(97) + ' ' + j(3) +
        ' C' + j(98) + ' ' + j(14) + ' ' + j(97) + ' ' + j(26) + ' ' + j(98) + ' ' + j(36) +
        ' C' + j(70) + ' ' + j(39) + ' ' + j(30) + ' ' + j(36) + ' ' + j(3) + ' ' + j(38) +
        ' C' + j(2) + ' ' + j(26) + ' ' + j(3) + ' ' + j(14) + ' ' + j(4) + ' ' + j(4);
    }
    var UL = 'M2 5 C 60 1, 120 8, 180 4 S 300 7, 398 3';
    var DOODLE_HERO = '<svg class="rvs-doodle" viewBox="0 0 150 84" aria-hidden="true">' +
      '<circle class="rvs-st" pathLength="1" cx="46" cy="36" r="21" style="--d:.1s"/><path class="rvs-st" pathLength="1" d="M61 51 L84 74" style="--d:.45s" stroke-width="5"/>' +
      '<path class="rvs-st" pathLength="1" d="M33 30 q5-9 15-8" style="--d:.7s" stroke="var(--brick)"/>' +
      '<path class="rvs-st" pathLength="1" d="M92 22 q5-6 10 0 t10 0 t10 0 t10 0" style="--d:.5s"/><path class="rvs-st" pathLength="1" d="M96 38 q5-6 10 0 t10 0 t10 0" style="--d:.65s"/><path class="rvs-st" pathLength="1" d="M100 54 q5-6 10 0 t10 0" style="--d:.8s"/>' +
      '<circle class="rvs-st rvs-dot" pathLength="1" cx="130" cy="64" r="3" style="--d:1s" stroke="var(--brick)"/></svg>';
    var DOODLE_NONE = '<svg class="rvs-doodle rvs-doodle--none" viewBox="0 0 180 120" aria-hidden="true">' +
      '<path class="rvs-st" pathLength="1" d="M26 18 L120 14 L124 98 L30 104 Z" style="--d:.05s" stroke-dasharray="3 5" opacity=".7"/>' +
      '<path class="rvs-st" pathLength="1" d="M40 36 q6-4 12 0 t12 0 t12 0" style="--d:.5s" opacity=".6"/><path class="rvs-st" pathLength="1" d="M40 52 q6-4 12 0 t12 0" style="--d:.6s" opacity=".6"/>' +
      '<g class="rvs-lens"><circle class="rvs-st" pathLength="1" cx="100" cy="62" r="25" style="--d:.2s"/><path class="rvs-st" pathLength="1" d="M118 80 L146 108" style="--d:.55s" stroke-width="6"/>' +
      '<path class="rvs-st rvs-q" pathLength="1" d="M91 54 q0-11 10-11 q10 0 10 9 q0 7-9 10 v5" style="--d:.8s" stroke="var(--brick)"/><circle class="rvs-st rvs-q" pathLength="1" cx="102" cy="78" r="1.6" style="--d:1.1s" stroke="var(--brick)"/></g>' +
      '<path class="rvs-st" pathLength="1" d="M150 30 l5-5 M155 30 l-5-5" style="--d:1.2s" stroke="var(--ochre)"/><circle class="rvs-st" pathLength="1" cx="22" cy="90" r="4" style="--d:1.3s" stroke="var(--slate)"/></svg>';
    var BG = '<svg class="rvs-bg" viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' +
      '<pattern id="rvs-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="var(--line-strong)"/></pattern>' +
      '<pattern id="rvs-grid" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="var(--moss)" stroke-width="1"/></pattern>' +
      '<clipPath id="rvs-clip"><circle cx="0" cy="0" r="70"/></clipPath></defs>' +
      '<rect width="640" height="420" fill="url(#rvs-dots)" opacity=".55"/>' +
      '<g class="rvs-f rvs-f1"><g transform="translate(530 330)"><g clip-path="url(#rvs-clip)"><rect x="-80" y="-80" width="160" height="160" fill="url(#rvs-grid)"/></g><circle r="70" fill="none" stroke="var(--moss)" stroke-width="1.4"/></g></g>' +
      '<g class="rvs-f rvs-f2"><circle cx="110" cy="340" r="54" fill="var(--brick)" opacity=".16"/><circle cx="154" cy="356" r="54" fill="var(--slate)" opacity=".16"/><circle cx="132" cy="312" r="54" fill="#be9661" opacity=".2"/></g>' +
      '<g class="rvs-f rvs-f3"><g transform="translate(470 78)"><rect x="-46" y="-46" width="92" height="92" fill="url(#rvs-grid)" stroke="var(--moss)" stroke-width="1.4"/></g></g>' +
      '<g class="rvs-spin"><g transform="translate(70 70)" fill="none" stroke="var(--line-strong)" stroke-width="1.3"><circle r="30"/><path d="M-42 0H42M0-42V42"/><path d="M-21-21L21 21" stroke-dasharray="3 4"/></g></g>' +
      '<path class="rvs-wave" d="M230 380 q20-26 40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="var(--slate)" stroke-width="1.4" opacity=".5"/></svg>';

    /* ---------- state ---------- */
    var dlg, input, listEl, pvEl, bodyEl, chipsEl, countEl, clearBtn, frameEl, ulEl, built = false;
    var state = { q: '', filter: 'all', rows: [], active: 0, hl: [], mode: 'browse', total: {}, opener: null };
    var closing = false, ro = null, typingT = 0, phT = 0, pvKey = '', lastSig = '', lastCount = -1, prevMarkup = '';

    function build() {
      dlg = doc.createElement('dialog'); dlg.className = 'rds-search rvs'; dlg.setAttribute('aria-label', 'Search the site');
      dlg.innerHTML =
        BG +
        '<svg class="rvs-frame" aria-hidden="true" focusable="false"><path pathLength="1"/><path pathLength="1"/></svg>' +
        '<form class="rvs-bar" role="search" method="dialog">' +
          '<span class="rvs-lens-ico">' + icon('search', 'rds-icon--sm', 22) + '</span>' +
          '<input type="search" class="rvs-input" placeholder="Search studies, guide, notes" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="rvs-list" aria-autocomplete="list">' +
          '<button type="button" class="rvs-clear" aria-label="Clear search" hidden>' + icon('close', 'rds-icon--sm', 18) + '</button>' +
          '<button type="button" class="rvs-close" aria-label="Close search"><span class="rv-k-desk">Esc</span><span class="rv-k-mob">Cancel</span></button>' +
          '<svg class="rvs-ul" aria-hidden="true"><path pathLength="1"/></svg>' +
        '</form>' +
        '<div class="rvs-chips" role="group" aria-label="Filter results"></div>' +
        '<div class="rvs-body" data-mode="browse"><ul class="rvs-list" id="rvs-list" role="listbox" aria-label="Results"></ul>' +
          '<aside class="rvs-pv" aria-label="Preview"></aside></div>' +
        '<footer class="rvs-foot"><p class="rvs-count" aria-live="polite"></p>' +
          '<p class="rvs-keys" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>⌘</kbd><kbd>↵</kbd> new tab</span><span><kbd>⌥</kbd><kbd>←</kbd><kbd>→</kbd> filter</span><span><kbd>esc</kbd> close</span></p></footer>';
      doc.body.appendChild(dlg);
      input = dlg.querySelector('.rvs-input'); listEl = dlg.querySelector('.rvs-list'); pvEl = dlg.querySelector('.rvs-pv'); bodyEl = dlg.querySelector('.rvs-body');
      chipsEl = dlg.querySelector('.rvs-chips'); countEl = dlg.querySelector('.rvs-count'); clearBtn = dlg.querySelector('.rvs-clear'); frameEl = dlg.querySelector('.rvs-frame'); ulEl = dlg.querySelector('.rvs-ul');

      input.addEventListener('input', function () { typed(); schedule(); });
      clearBtn.addEventListener('click', function () { input.value = ''; schedule(); input.focus(); buzz(5); });
      dlg.querySelector('.rvs-close').addEventListener('click', requestClose);
      dlg.addEventListener('click', function (e) { if (e.target === dlg) requestClose(); });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); requestClose(); });
      dlg.addEventListener('close', function () { doc.documentElement.classList.remove('rds-lock'); dlg.removeAttribute('data-state'); closing = false; clearInterval(phT); if (ro) ro.disconnect(); });
      dlg.addEventListener('keydown', onKey);
      chipsEl.addEventListener('click', function (e) { var b = e.target.closest('button[data-f]'); if (b) { setFilter(b.getAttribute('data-f')); input.focus(); buzz(5); } });
      listEl.addEventListener('mousemove', function (e) { var li = e.target.closest('li[data-i]'); if (li) { var i = +li.getAttribute('data-i'); if (i !== state.active) setActive(i, false); } });
      listEl.addEventListener('click', function (e) {
        var a = e.target.closest('a'); if (!a) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; // let the browser open it elsewhere
        e.preventDefault(); var li = a.closest('li[data-i]'); go(+li.getAttribute('data-i'), false);
      });
      listEl.addEventListener('mousedown', function (e) { var li = e.target.closest('li[data-i]'); if (li) li.classList.add('is-press'); });
      doc.addEventListener('mouseup', function () { all('.is-press', listEl).forEach(function (l) { l.classList.remove('is-press'); }); });
      pvEl.addEventListener('click', function (e) {
        var a = e.target.closest('a'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault(); navigate(a.getAttribute('href'), a.getAttribute('data-u'));
      });
      var clr = doc.createElement('button'); // "Clear recents" lives inside the list; delegate
      listEl.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (!b) return; e.preventDefault(); var act = b.getAttribute('data-act'); if (act === 'forget') { forget(); schedule(true); } else if (act === 'q') { input.value = b.getAttribute('data-q'); schedule(true); input.focus(); buzz(6); } else if (act === 'filter') { setFilter(b.getAttribute('data-f')); } });
      void clr;
      built = true;
    }

    /* ---------- keyboard ---------- */
    function onKey(e) {
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); move(k === 'ArrowDown' ? 1 : -1); }
      else if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); move(k === 'PageDown' ? 5 : -5, true); }
      else if (k === 'Home' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setActive(0, true); }
      else if (k === 'End' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setActive(state.rows.length - 1, true); }
      else if (e.ctrlKey && (k === 'n' || k === 'j')) { e.preventDefault(); move(1); }
      else if (e.ctrlKey && (k === 'p' || k === 'k')) { e.preventDefault(); move(-1); }
      else if (e.altKey && (k === 'ArrowRight' || k === 'ArrowLeft')) { e.preventDefault(); cycleFilter(k === 'ArrowRight' ? 1 : -1); }
      else if (k === 'Escape') { e.preventDefault(); if (input.value) { input.value = ''; schedule(true); input.focus(); } else requestClose(); }
      else if (k === 'Enter' && e.target === input) { if (state.rows[state.active]) { e.preventDefault(); go(state.active, e.metaKey || e.ctrlKey); } }
      else if (k === 'Enter' && (e.target.tagName === 'A')) { /* native */ }
    }
    function move(d, clamp) {
      var n = state.rows.length; if (!n) return;
      var i = clamp ? Math.max(0, Math.min(n - 1, state.active + d)) : (state.active + d + n) % n;
      setActive(i, true);
    }
    function cycleFilter(d) {
      var fs = all('button[data-f]', chipsEl).map(function (b) { return b.getAttribute('data-f'); }); if (fs.length < 2) return;
      setFilter(fs[(fs.indexOf(state.filter) + d + fs.length) % fs.length]); buzz(5);
    }
    function buzz(ms) { try { if (navigator.vibrate && !reduceMQ.matches) navigator.vibrate(ms); } catch (e) { } }

    /* ---------- rendering ---------- */
    var raf = 0, force = false;
    function schedule(f) { if (f) force = true; if (!raf) raf = requestAnimationFrame(function () { raf = 0; var fo = force; force = false; run(fo); }); }
    function typed() { // micro feedback: the lens wiggles, the pencil line thickens for a beat
      if (reduceMQ.matches) return; dlg.classList.add('is-typing'); clearTimeout(typingT);
      typingT = setTimeout(function () { dlg.classList.remove('is-typing'); }, 260);
      var li = dlg.querySelector('.rvs-lens-ico'); li.classList.remove('tick'); void li.offsetWidth; li.classList.add('tick');
    }
    function setFilter(f) { if (state.filter === f) return; state.filter = f; run(true); }

    function rowsForBrowse() {
      var recent = recents().map(pageByUrl).filter(Boolean), rows = [], seen = {};
      var pages = DATA.pages.filter(function (p) { return p.u !== ''; });
      var counts = {}; pages.forEach(function (p) { counts[p.s] = (counts[p.s] || 0) + 1; });
      var fil = state.filter;
      if (fil === 'all') { recent.forEach(function (p) { rows.push({ p: p, group: 'Recent' }); seen[p.u] = 1; }); }
      var order = ORDER.concat(Object.keys(counts).filter(function (s) { return ORDER.indexOf(s) < 0; }));
      order.forEach(function (s) {
        if (fil !== 'all' && fil !== s) return;
        pages.filter(function (p) { return p.s === s && !(fil === 'all' && seen[p.u]); }).forEach(function (p) { rows.push({ p: p, group: label(s) }); });
      });
      return { rows: rows, counts: counts, total: pages.length };
    }

    function run(forceStagger) {
      if (!DATA) { prep(); }
      var q = input.value, ts = terms(q), mode, rows, counts = {}, total = 0, hl = [];
      state.q = q;
      clearBtn.hidden = !q;
      if (DATA) prep();
      if (!DATA || !DATA.pages.length) { listEl.innerHTML = '<li class="rvs-label" role="presentation">Loading the index…</li>'; countEl.textContent = ''; return; }
      if (!ts.length) {
        var b = rowsForBrowse(); rows = b.rows; counts = b.counts; total = b.total; mode = 'browse';
      } else {
        var res = search(q), found = res.rows; hl = res.hl;
        found.forEach(function (r) { if (!r.h) { counts[r.p.s] = (counts[r.p.s] || 0) + 1; total++; } });
        rows = found.filter(function (r) { return state.filter === 'all' || r.p.s === state.filter; }).slice(0, 24);
        mode = rows.length ? 'results' : 'none';
        if (!rows.length && state.filter !== 'all' && total) { mode = 'none-filtered'; }
      }
      state.rows = rows; state.hl = hl; state.mode = mode; state.total = counts;
      if (state.filter !== 'all' && !counts[state.filter] && ts.length) { state.filter = 'all'; return run(true); }
      renderChips(counts, total, ts.length ? 'results' : 'browse');
      var sig = mode + '|' + state.filter + '|' + (ts.length ? '' : 'b');
      var stagger = forceStagger || sig !== lastSig || mode === 'none';
      lastSig = sig;
      state.active = Math.min(state.active, Math.max(0, rows.length - 1));
      if (ts.length && !forceStagger) state.active = 0;
      renderList(rows, ts, mode, stagger, q);
      bodyEl.setAttribute('data-mode', mode === 'none-filtered' ? 'none' : mode);
      dlg.setAttribute('data-mode', mode === 'none-filtered' ? 'none' : mode);
      var n = rows.length, msg = mode === 'browse' ? (total + ' pages to browse') : (mode === 'results' ? n + (n === 1 ? ' result' : ' results') + (ts.length && total > n && state.filter === 'all' ? '' : '') : 'No results for “' + q.trim() + '”');
      var html = mode === 'results' ? '<b>' + n + '</b> ' + (n === 1 ? 'result' : 'results') : esc(msg);
      if (countEl.getAttribute('data-m') !== msg) { countEl.setAttribute('data-m', msg); countEl.innerHTML = html; if (n !== lastCount && !reduceMQ.matches) { countEl.classList.remove('roll'); void countEl.offsetWidth; countEl.classList.add('roll'); } }
      lastCount = n;
      setActive(state.active, false, true);
    }

    function renderChips(counts, total, kind) {
      var fs = [['all', 'All', total]].concat(ORDER.concat(Object.keys(counts).filter(function (s) { return ORDER.indexOf(s) < 0; })).filter(function (s) { return counts[s]; }).map(function (s) { return [s, label(s), counts[s]]; }));
      var html = fs.map(function (x) {
        return '<button type="button" class="rvs-chip" data-f="' + esc(x[0]) + '" aria-pressed="' + (state.filter === x[0]) + '"' + (SEC[x[0]] ? ' data-tone="' + SEC[x[0]].tone + '"' : '') + '>' + esc(x[1]) + ' <b>' + x[2] + '</b></button>';
      }).join('');
      if (chipsEl.getAttribute('data-sig') !== html) { chipsEl.innerHTML = html; chipsEl.setAttribute('data-sig', html); }
      chipsEl.hidden = fs.length < 3 && kind === 'results';
    }

    function renderList(rows, ts, mode, stagger, q) {
      listEl.className = 'rvs-list' + (stagger ? ' is-stagger' : ' is-soft');
      var html = '', hl = state.hl;
      if (mode === 'none' || mode === 'none-filtered') {
        var dym = didYouMean(q), picks = DATA.pages.filter(function (p) { return p.s === 'guide'; }).slice(0, 5);
        html = '<li class="rvs-none" role="presentation">' + DOODLE_NONE +
          '<h3 class="rvs-none__h">Nothing on this page of the sketchbook' + (mode === 'none-filtered' ? ' under ' + esc(label(state.filter)) : '') + '</h3>' +
          '<p class="rvs-none__p">No match for <b>“' + esc(q.trim()) + '”</b>.' + (dym ? ' Did you mean <button type="button" class="rvs-dym" data-act="q" data-q="' + esc(dym) + '">' + esc(dym) + '</button>?' : ' Try a shorter word, or one of these:') + '</p>' +
          (mode === 'none-filtered' ? '<p class="rvs-none__p"><button type="button" class="rvs-dym" data-act="filter" data-f="all">Search every section</button></p>' : '') +
          '<p class="rvs-try">' + picks.map(function (p) { return '<button type="button" class="rvs-pill" data-act="q" data-q="' + esc(p.title.toLowerCase()) + '">' + esc(p.title) + '</button>'; }).join('') + '</p></li>';
        listEl.innerHTML = html; return;
      }
      var lastGroup = null, hasRecent = false;
      if (mode === 'browse') {
        var tryList = DATA.pages.filter(function (p) { return p.s === 'guide'; }).slice(0, 6);
        html += '<li class="rvs-hero" role="presentation">' + DOODLE_HERO + '<div><h3 class="rvs-hero__h">What do you want to look at?</h3><p class="rvs-hero__p">Search every study, guide entry and note. Typos are fine.</p>' +
          '<p class="rvs-try">' + tryList.map(function (p) { return '<button type="button" class="rvs-pill" data-act="q" data-q="' + esc(p.title.toLowerCase()) + '">' + icon(iconOf(p), 'rds-icon--sm', 14) + esc(p.title) + '</button>'; }).join('') + '</p></div></li>';
      }
      rows.forEach(function (r, i) {
        if (mode === 'browse' && r.group !== lastGroup) {
          lastGroup = r.group; if (r.group === 'Recent') hasRecent = true;
          html += '<li class="rvs-label" role="presentation"><span>' + esc(r.group) + '</span>' + (r.group === 'Recent' ? '<button type="button" class="rvs-forget" data-act="forget">Clear</button>' : '') + '</li>';
        }
        html += rowHtml(r, i, ts, hl);
      });
      void hasRecent;
      listEl.innerHTML = html;
    }

    function rowHtml(r, i, ts, hl) {
      var p = r.p, h = r.h, url = href(p.u) + (h ? '#' + h.id : ''), sec = secOf(p);
      var dl = p._d, body;
      if (!ts.length) body = p.d || '';
      else if (h) body = '';
      else body = hl.some(function (t) { return dl.indexOf(t) >= 0; }) || !p.x ? p.d || '' : p.x;
      var sub = h ? 'in ' + p.title : (ts.length ? mark(snippet(body, hl, body === p.x ? p.t.length + 60 : 0), hl) : esc((p.d || '').slice(0, 140)));
      var tag = '<span class="rvs-tag rds-tag">' + esc(label(p.s)) + '</span>';
      return '<li role="option" id="rvs-r' + i + '" data-i="' + i + '" data-tone="' + sec.tone + '" aria-selected="false" style="--i:' + Math.min(i, 12) + '">' +
        '<a href="' + esc(url) + '" tabindex="-1" data-u="' + esc(p.u) + '">' +
        '<span class="rvs-ico">' + icon(iconOf(p, !!h), 'rds-icon--sm', 20) + '</span>' +
        '<span class="rvs-main"><span class="rvs-title"><span>' + (h ? mark(h.txt, hl) : mark(p.title, hl)) + '</span></span><span class="rvs-sub">' + sub + '</span></span>' +
        tag + '<span class="rvs-go" aria-hidden="true">↵</span>' +
        '<svg class="rvs-box" aria-hidden="true"><path pathLength="1"/></svg></a></li>';
    }

    /* ---------- selection + preview ---------- */
    function setActive(i, scroll, quiet) {
      var lis = all('li[data-i]', listEl); if (!lis.length) { input.removeAttribute('aria-activedescendant'); pvEl.innerHTML = ''; pvKey = ''; return; }
      i = Math.max(0, Math.min(lis.length - 1, i));
      var changed = i !== state.active;
      state.active = i;
      lis.forEach(function (li, n) { li.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
      var cur = lis[i]; drawBox(cur, i); input.setAttribute('aria-activedescendant', cur.id);
      if (scroll) {
        var pad = 6, top = cur.offsetTop, bot = top + cur.offsetHeight, vt = listEl.scrollTop, vb = vt + listEl.clientHeight;
        if (top < vt + pad) listEl.scrollTo({ top: Math.max(0, top - 56), behavior: reduceMQ.matches ? 'auto' : 'smooth' }); else if (bot > vb - pad) listEl.scrollTo({ top: bot - listEl.clientHeight + pad, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
      }
      if (changed && scroll) buzz(3);
      renderPreview(state.rows[i], quiet);
    }

    function drawBox(li, i) {
      var a = li.firstChild, sv = li.querySelector('.rvs-box'), w = a.offsetWidth, h = a.offsetHeight; if (!sv || !w) return;
      var key = w + 'x' + h; if (sv.getAttribute('data-k') === key) return; sv.setAttribute('data-k', key);
      sv.setAttribute('viewBox', '0 0 ' + w + ' ' + h); sv.querySelector('path').setAttribute('d', sketchRect(w, h, 2, 8, i * 97 + 13, 1.8));
    }
    var motifsP = null;
    function needArt() {
      if (window.RDSArt) return Promise.resolve();
      if (!motifsP) motifsP = new Promise(function (res) { var s = doc.createElement('script'); s.src = new URL('assets/rds/motifs.js', siteRoot).href + (ctx.q || ''); s.onload = s.onerror = function () { res(); }; doc.head.appendChild(s); });
      return motifsP;
    }
    function renderPreview(r, quiet) {
      if (!r || !wideMQ.matches) { if (!r) { pvEl.innerHTML = ''; pvKey = ''; } return; }
      var p = r.p, key = p.u + '#' + (r.h ? r.h.id : '') + '|' + state.hl.join(',');
      if (key === pvKey) return; var samePage = pvKey.split('#')[0] === p.u; pvKey = key;
      var url = href(p.u) + (r.h ? '#' + r.h.id : ''), sec = secOf(p), hl = state.hl;
      var heads = p._h.filter(function (h) { return h.id; }).slice(0, 7);
      var matchHeads = hl.length ? heads.filter(function (h) { return hl.some(function (t) { return h.low.indexOf(t) >= 0; }); }) : [];
      var html = (samePage ? '' : '<div class="rvs-pv__art rds-art" data-rds-art="card" data-seed="' + esc(p.slug) + '" data-topic="' + esc(p._t + ' ' + p.s) + '" aria-hidden="true"></div>') +
        '<div class="rvs-pv__txt"><p class="rvs-pv__tag rds-tag rds-tag--' + (sec.tone === 'brick' ? 'brick' : sec.tone === 'moss' ? 'moss' : '') + '">' + icon(iconOf(p), 'rds-icon--sm', 16) + esc(label(p.s)) + '</p>' +
        '<h3 class="rvs-pv__h">' + esc(p.title) + '</h3>' +
        (p.d ? '<p class="rvs-pv__d">' + mark(p.d, hl) + '</p>' : '') +
        (heads.length ? '<p class="rvs-pv__k rds-mono">On this page</p><ul class="rvs-pv__heads">' + heads.map(function (h, n) { var hit = matchHeads.indexOf(h) >= 0 || (r.h && r.h.id === h.id); return '<li style="--i:' + n + '"' + (hit ? ' class="hit"' : '') + '><a href="' + esc(href(p.u) + '#' + h.id) + '" data-u="' + esc(p.u) + '" tabindex="-1">' + mark(h.txt, hl) + '</a></li>'; }).join('') + '</ul>' : '') +
        '<a class="rvs-pv__open" href="' + esc(url) + '" data-u="' + esc(p.u) + '" tabindex="-1">Open <span aria-hidden="true">↵</span></a></div>';
      if (samePage) { var t = pvEl.querySelector('.rvs-pv__txt'); if (t) { t.outerHTML = html; } else pvEl.innerHTML = html; }
      else { pvEl.innerHTML = html; }
      pvEl.classList.remove('swap'); void pvEl.offsetWidth; if (!quiet) pvEl.classList.add('swap');
      var art = pvEl.querySelector('.rvs-pv__art');
      if (art) needArt().then(function () { if (window.RDSArt && art.isConnected) window.RDSArt.render(art, { kind: 'card', seed: p.slug, topic: art.getAttribute('data-topic') }); });
    }

    /* ---------- go ---------- */
    function go(i, newTab) {
      var r = state.rows[i]; if (!r) return;
      var li = listEl.querySelector('li[data-i="' + i + '"] a'); if (!li) return;
      navigate(li.getAttribute('href'), r.p.u, newTab, li.closest('li'));
    }
    function navigate(url, pageU, newTab, li) {
      remember(pageU);
      if (newTab) { window.open(url, '_blank', 'noopener'); return; }
      var here = location.href.split('#')[0], target = url.split('#')[0], same = here === target || (here.replace(/index\.html$/, '') === target.replace(/index\.html$/, ''));
      buzz(8);
      if (same) { requestClose(function () { location.href = url; }); return; }
      if (li) li.classList.add('is-go');
      if (reduceMQ.matches) { location.href = url; return; }
      var w = doc.createElement('div'); w.className = 'rvs-wipe';
      w.innerHTML = '<svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M0 12 Q25 8 50 13 T100 10"/><path pathLength="1" d="M0 30 Q25 26 50 31 T100 28"/><path pathLength="1" d="M0 48 Q25 44 50 49 T100 46"/></svg>';
      doc.documentElement.appendChild(w); void w.offsetWidth; w.classList.add('on');
      dlg.setAttribute('data-state', 'closing');
      setTimeout(function () { location.href = url; }, 300);
    }
    window.addEventListener('pageshow', function (e) { if (e.persisted) { all('.rvs-wipe').forEach(function (w) { w.remove(); }); if (dlg && dlg.open) dlg.close(); } });

    /* ---------- open / close ---------- */
    function drawFrame() {
      var w = dlg.clientWidth, h = dlg.clientHeight; if (!w || !h) return;
      frameEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h); frameEl.setAttribute('width', w); frameEl.setAttribute('height', h);
      var ps = frameEl.querySelectorAll('path'), seed = (Math.random() * 1e6) | 0, full = w < 640;
      var bar = dlg.querySelector('.rvs-bar'), uw = Math.max(40, bar.clientWidth - (full ? 32 : 48));
      ulEl.setAttribute('viewBox', '0 0 ' + uw + ' 8'); ulEl.querySelector('path').setAttribute('d', 'M2 4 C' + f1(uw * .2) + ' 1 ' + f1(uw * .4) + ' 7 ' + f1(uw * .6) + ' 3.5 S' + f1(uw * .85) + ' 5 ' + (uw - 2) + ' 3');
      ps[0].setAttribute('d', sketchRect(w, h, full ? 3 : 4, full ? 2 : 16, frameEl.__seed || (frameEl.__seed = seed), 2.2));
      ps[1].setAttribute('d', sketchRect(w, h, full ? 6 : 8, full ? 2 : 14, (frameEl.__seed2 || (frameEl.__seed2 = seed + 7)), 3));
    }
    function typePlaceholder() {
      clearInterval(phT); var base = 'Search studies, guide, notes'; input.placeholder = base;
      if (reduceMQ.matches || !DATA) return;
      var ex = DATA.pages.filter(function (p) { return p.u !== '' && p.s !== 'lab'; }).map(function (p) { return p.title; });
      if (!ex.length) return;
      var n = (Math.random() * ex.length) | 0, i = 0, dir = 1, hold = 14;
      phT = setInterval(function () {
        if (input.value || !dlg.open) { if (input.value) input.placeholder = base; return; }
        if (hold > 0) { hold--; return; }
        i += dir; var s = ex[n];
        if (i > s.length) { dir = -1; i = s.length; hold = 22; }
        if (i < 0) { dir = 1; i = 0; n = (n + 1) % ex.length; hold = 6; }
        input.placeholder = i ? 'Try “' + s.slice(0, i) + '”' : base;
      }, 60);
    }
    function open(q, opener) {
      cssP.then(function () {
        if (!built) build();
        if (dlg.open) { input.focus(); return; }
        prep(); state.filter = 'all'; state.active = 0; lastSig = ''; pvKey = ''; closing = false;
        var btn = opener || doc.activeElement; // grow out of the button that was pressed
        dlg.removeAttribute('data-state'); dlg.showModal(); doc.documentElement.classList.add('rds-lock');
        if (btn && btn.getBoundingClientRect && wideMQ.matches) {
          var b = btn.getBoundingClientRect(), d = dlg.getBoundingClientRect();
          if (b.width && b.top < 160) { dlg.style.setProperty('--ox', Math.round(b.left + b.width / 2 - d.left) + 'px'); dlg.style.setProperty('--oy', Math.round(b.top + b.height / 2 - d.top) + 'px'); }
          else { dlg.style.removeProperty('--ox'); dlg.style.removeProperty('--oy'); }
        }
        frameEl.__seed = 0; frameEl.__seed2 = 0; drawFrame();
        dlg.setAttribute('data-state', 'open');
        input.value = q || ''; run(true); input.focus(); input.select(); typePlaceholder();
        if (window.ResizeObserver) { ro = new ResizeObserver(function () { drawFrame(); }); ro.observe(dlg); }
        ctx.loadIndex().then(function () { prep(); if (dlg.open) { run(true); typePlaceholder(); } });
      });
    }
    function requestClose(after) {
      if (!dlg || !dlg.open || closing) { if (typeof after === 'function') after(); return; }
      closing = true;
      var done = function () { if (dlg.open) dlg.close(); closing = false; if (typeof after === 'function') after(); };
      if (reduceMQ.matches) return done();
      dlg.setAttribute('data-state', 'closing'); setTimeout(done, 190);
    }

    return { open: open, search: function (q) { prep(); return search(q).rows; } };
  };
})();
