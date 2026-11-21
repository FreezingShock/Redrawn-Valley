/* Sources library (sources/index.html). Reads assets/sources.json, which scripts/build_sources.py generates from the pages.
   Instant search over title, publisher, type, topic, citing page and the sentence each use backs; type, topic, section and
   caveat filters; sort; every use links to the exact marker (#cite=ID.N handled by cite-jump.js). State lives in the URL. */
(function () {
  var doc = document, me = doc.currentScript || doc.querySelector('script[src*="sources.js"]');
  var base = new URL('./', me.src), siteRoot = new URL('../../', base), isFile = location.protocol === 'file:';
  function q(s, el) { return (el || doc).querySelector(s); }
  function qa(s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLOR = { Government: 'var(--moss)', Research: 'var(--slate)', News: 'var(--brick)', Nonprofit: 'var(--moss-deep)', 'Case study': 'var(--slate)', 'Law and code': 'var(--ink)', 'Data and maps': 'var(--slate)', Reference: 'var(--ink-muted)', Report: 'var(--moss)', 'Social post': 'var(--brick-deep)', 'Technical docs': 'var(--ink-muted)', 'Code and files': 'var(--ink-muted)', 'This site': 'var(--brick)', Other: 'var(--ink-faint)' };

  var root = q('[data-lib-list]'); if (!root) return;
  var D, S = [], state = { q: '', types: [], topics: [], where: [], caveat: false, sort: 'cited' };
  var els = {
    q: q('[data-lib-q]'), clear: q('[data-lib-clearq]'), count: q('[data-lib-count]'), empty: q('[data-lib-empty]'), why: q('[data-lib-why]'),
    types: q('[data-lib-types]'), topics: q('[data-lib-topics]'), where: q('[data-lib-where]'), caveat: q('[data-lib-caveat]'), sort: q('[data-lib-sort]'), mix: q('[data-lib-mix]')
  };

  function pageHref(u, hash) { return new URL(u + (isFile && (u === '' || /\/$/.test(u)) ? 'index.html' : '') + (hash || ''), siteRoot).href; }
  function useHref(src, p, u) {
    var k = u.k || 1; return pageHref(p.u, p.n && !u.listed ? '#cite=' + encodeURIComponent(p.ref) + '.' + k + '&src=' + src.id : '#' + p.ref);
  }

  /* ---------- load ---------- */
  fetch(new URL('../sources.json', base)).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(init).catch(function () {
    root.innerHTML = '<p class="rv-lib-loading">The list could not load. Open <a href="../../assets/sources.json">sources.json</a> instead.</p>';
  });

  function init(d) {
    D = d; S = d.sources;
    S.forEach(function (s) {
      s._ctx = []; s.pages.forEach(function (p) { p._t = d.pages[p.u].t; p.uses.forEach(function (u) { u._p = p; s._ctx.push(u); }); });
      s._f = { title: norm(s.title), host: norm(s.host + ' ' + s.url), type: norm(s.type + ' ' + s.kind), topics: norm(s.topics.join(' ')), note: norm(s.note),
        pages: norm(s.pages.map(function (p) { return p._t + ' ' + d.pages[p.u].s; }).join(' ')), ctx: norm(s._ctx.map(function (u) { return u.ctx + ' ' + u.sec; }).join(' | ')) };
      s._where = qaUnique(s.pages.map(function (p) { return d.pages[p.u].s; }));
    });
    stats(); buildChips(); readURL(); buildCards(); wire(); apply(true);
    var h = decodeURIComponent(location.hash.slice(1)); if (h) openById(h, true);
  }
  function qaUnique(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  /* ---------- stats and the type bar ---------- */
  function counter(el, to) {
    if (reduce) { el.textContent = to; return; }
    var t0 = performance.now(), dur = 700; (function f(t) { var p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
  }
  function stats() {
    var uses = S.reduce(function (a, s) { return a + s.uses; }, 0), cav = S.filter(function (s) { return s.note; }).length;
    var vals = { sources: S.length, uses: uses, pages: Object.keys(D.pages).length, caveats: cav };
    Object.keys(vals).forEach(function (k) { counter(q('[data-n="' + k + '"]'), vals[k]); });
    els.mix.innerHTML = D.types.map(function (t) {
      var n = S.filter(function (s) { return s.type === t; }).length;
      return '<button type="button" class="rv-lib-seg" data-type="' + esc(t) + '" style="flex:' + n + ' 1 0;--c:' + (COLOR[t] || 'var(--ink)') + '" title="' + esc(t) + ': ' + n + '"><span>' + esc(t) + '</span><b>' + n + '</b></button>';
    }).join('');
  }

  /* ---------- chips ---------- */
  function chip(kind, v, label, n) { return '<button type="button" class="rv-chip" data-k="' + kind + '" data-v="' + esc(v) + '" aria-pressed="false">' + esc(label || v) + (n != null ? '<i>' + n + '</i>' : '') + '</button>'; }
  function buildChips() {
    els.types.innerHTML = '<span class="rv-lib-lab">Type</span>' + D.types.map(function (t) { return chip('types', t, t, S.filter(function (s) { return s.type === t; }).length); }).join('');
    els.topics.innerHTML = '<span class="rv-lib-lab">Topic</span>' + D.topics.map(function (t) { return chip('topics', t, t, S.filter(function (s) { return s.topics.indexOf(t) > -1; }).length); }).join('');
    var W = qaUnique([].concat.apply([], S.map(function (s) { return s._where; }))).sort();
    els.where.innerHTML = '<span class="rv-lib-lab">Cited in</span>' + W.map(function (w) { return chip('where', w, w, S.filter(function (s) { return s._where.indexOf(w) > -1; }).length); }).join('');
  }

  /* ---------- cards ---------- */
  function hl(text, toks) {
    if (!toks.length) return esc(text);
    var nt = norm(text), spans = [];
    toks.forEach(function (t) { var i = 0, j; while ((j = nt.indexOf(t, i)) > -1) { spans.push([j, j + t.length]); i = j + t.length; } });
    if (!spans.length) return esc(text);
    spans.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    spans.forEach(function (s) { if (s[0] < pos) { if (s[1] > pos) { out += '<mark>' + esc(text.slice(pos, s[1])) + '</mark>'; pos = s[1]; } return; } out += esc(text.slice(pos, s[0])) + '<mark>' + esc(text.slice(s[0], s[1])) + '</mark>'; pos = s[1]; });
    return out + esc(text.slice(pos));
  }
  function usesHTML(s, toks) {
    return s.pages.map(function (p) {
      var pg = D.pages[p.u];
      return '<section class="rv-use"><header><span class="rv-use__kind">' + esc(pg.s) + '</span><a class="rv-use__page" href="' + pageHref(p.u) + '">' + hl(pg.t, toks) + '</a><span class="rv-use__n">' + (p.n ? p.n + (p.n === 1 ? ' use' : ' uses') : 'listed in its sources') + '</span></header><ol>' +
        (p.n ? p.uses.map(function (u) {
          return '<li><span class="rv-use__sec">' + esc(u.sec || 'On the page') + '</span><blockquote class="' + (u.q ? 'is-quote' : '') + '">' + hl(u.ctx, toks) + '</blockquote><a class="rv-use__go" href="' + useHref(s, p, u) + '">Jump to this claim<svg class="rds-icon" width="16" height="16" aria-hidden="true"><use href="' + siteRoot.href + 'assets/rds/icons/icons.svg#i-arrow-right"/></svg></a></li>';
        }).join('') : '<li><span class="rv-use__sec">Bibliography</span><blockquote>Listed with this page&rsquo;s sources; no sentence cites it by number.</blockquote><a class="rv-use__go" href="' + pageHref(p.u, '#' + p.ref) + '">Go to the entry</a></li>') + '</ol></section>';
    }).join('');
  }
  function buildCards() {
    root.innerHTML = '';
    var frag = doc.createDocumentFragment();
    S.forEach(function (s) {
      var a = doc.createElement('article'); a.className = 'rv-src'; a.id = s.id; a.style.setProperty('--c', COLOR[s.type] || 'var(--ink)'); s._el = a;
      var pageN = s.pages.length;
      a.innerHTML = '<div class="rv-src__main"><div class="rv-src__meta"><span class="rv-src__type">' + esc(s.type) + '</span>' + (s.host ? '<span class="rv-src__host">' + esc(s.host) + '</span>' : s.site ? '<span class="rv-src__host">/' + esc(s.site) + '</span>' : '') +
        (s.topics.length ? '<span class="rv-src__topics">' + s.topics.map(esc).join(' · ') + '</span>' : '') + '</div>' +
        '<h3 class="rv-src__title" data-f="title">' + esc(s.title) + '</h3>' +
        (s.note ? '<p class="rv-src__note"><svg class="rds-icon" width="16" height="16" aria-hidden="true"><use href="' + siteRoot.href + 'assets/rds/icons/icons.svg#i-info"/></svg><span data-f="note">' + esc(s.note) + '</span></p>' : '') +
        '<p class="rv-src__hit" data-hit hidden></p>' +
        '<div class="rv-src__foot"><button type="button" class="rv-src__toggle" aria-expanded="false" aria-controls="u-' + s.id + '"><span class="rv-src__cnt"><b>' + (s.uses || 'Listed') + '</b> ' + (s.uses ? (s.uses === 1 ? 'citation' : 'citations') : 'only') + ' on <b>' + pageN + '</b> ' + (pageN === 1 ? 'page' : 'pages') + '</span><span class="rv-src__how">How it is used<svg class="rds-icon" width="18" height="18" aria-hidden="true"><use href="' + siteRoot.href + 'assets/rds/icons/icons.svg#i-chevron-down"/></svg></span></button>' +
        '<span class="rv-src__acts">' + (s.url ? '<a class="rv-src__open" href="' + esc(s.url) + '" target="_blank" rel="noopener">Open source<svg class="rds-icon" width="16" height="16" aria-hidden="true"><use href="' + siteRoot.href + 'assets/rds/icons/icons.svg#i-external"/></svg></a>' : s.site ? '<a class="rv-src__open" href="' + pageHref(s.site) + '">Open page</a>' : '') +
        '<button type="button" class="rv-src__link" data-copy aria-label="Copy a link to this source"><svg class="rds-icon" width="16" height="16" aria-hidden="true"><use href="' + siteRoot.href + 'assets/rds/icons/icons.svg#i-hash"/></svg></button></span></div></div>' +
        '<div class="rv-src__uses" id="u-' + s.id + '"><div class="rv-src__usesin"></div></div>';
      frag.appendChild(a);
    });
    root.appendChild(frag);
  }
  function fillUses(s, toks) { var box = q('.rv-src__usesin', s._el); box.innerHTML = usesHTML(s, toks); s._filled = toks.join(' '); }
  function toggle(s, open, instant) {
    var b = q('.rv-src__toggle', s._el); if (open === undefined) open = b.getAttribute('aria-expanded') !== 'true';
    if (open) fillUses(s, tokens());
    b.setAttribute('aria-expanded', open); s._el.classList.toggle('is-open', open);
  }
  function openById(id, instant) {
    var s = S.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    if (s._el.hidden) { reset(); }
    toggle(s, true);
    var nav = q('.rds-nav'), off = (nav ? nav.offsetHeight : 0) + (q('[data-lib-bar]').offsetHeight || 0) + 12;
    setTimeout(function () { window.scrollTo({ top: s._el.getBoundingClientRect().top + scrollY - Math.min(off, 190), behavior: reduce || instant ? 'auto' : 'smooth' }); }, instant ? 120 : 0);
    s._el.classList.add('is-flash'); setTimeout(function () { s._el.classList.remove('is-flash'); }, 2200);
  }

  /* ---------- search ---------- */
  function tokens() { return norm(state.q).split(/[^a-z0-9°$%.\-]+/).filter(Boolean).map(function (t) { return t.replace(/^[.\-]+|[.\-]+$/g, ''); }).filter(Boolean); }
  function score(s, toks) {
    var tot = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], sc = 0, f = s._f, wb = new RegExp('(^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (f.title.indexOf(t) > -1) sc += wb.test(f.title) ? 9 : 5;
      if (f.host.indexOf(t) > -1) sc += wb.test(f.host) ? 7 : 4;
      if (f.type.indexOf(t) > -1) sc += 4;
      if (f.topics.indexOf(t) > -1) sc += 4;
      if (f.pages.indexOf(t) > -1) sc += 3;
      if (f.note.indexOf(t) > -1) sc += 2;
      if (f.ctx.indexOf(t) > -1) sc += 2 + Math.min(3, (f.ctx.split(t).length - 1) * .5);
      if (!sc) return 0; tot += sc;
    }
    return tot;
  }
  function apply(initial) {
    var toks = tokens(), list = [];
    S.forEach(function (s) {
      var ok = (!state.types.length || state.types.indexOf(s.type) > -1) && (!state.topics.length || state.topics.some(function (t) { return s.topics.indexOf(t) > -1; })) &&
        (!state.where.length || state.where.some(function (w) { return s._where.indexOf(w) > -1; })) && (!state.caveat || s.note);
      s._score = ok ? (toks.length ? score(s, toks) : 1) : 0; if (s._score) list.push(s);
    });
    var by = { cited: function (a, b) { return b.uses - a.uses || a.title.localeCompare(b.title); }, pages: function (a, b) { return b.pages.length - a.pages.length || b.uses - a.uses; },
      az: function (a, b) { return a.title.replace(/^[“"]/, '').localeCompare(b.title.replace(/^[“"]/, '')); }, type: function (a, b) { return a.type.localeCompare(b.type) || b.uses - a.uses; } };
    list.sort(toks.length ? function (a, b) { return b._score - a._score || by.cited(a, b); } : by[state.sort]);
    var order = {}; list.forEach(function (s, i) { order[s.id] = i; });
    var i = 0;
    S.forEach(function (s) { s._el.hidden = !s._score; });
    list.forEach(function (s, n) {
      root.appendChild(s._el); s._el.style.setProperty('--d', Math.min(n, 12) * 28 + 'ms');
      var title = q('[data-f="title"]', s._el); title.innerHTML = hl(s.title, toks);
      var nt = q('[data-f="note"]', s._el); if (nt) nt.innerHTML = hl(s.note, toks);
      var hit = q('[data-hit]', s._el), shown = '';
      if (toks.length) {
        var best = null, bs = 0;
        s._ctx.forEach(function (u) { var n = norm(u.ctx), c = toks.filter(function (t) { return n.indexOf(t) > -1; }).length; if (c > bs) { bs = c; best = u; } });
        if (best && bs) shown = '<span>In the text</span> &ldquo;' + hl(best.ctx.length > 200 ? best.ctx.slice(0, 198).replace(/\s\S*$/, '') + '…' : best.ctx, toks) + '&rdquo; <a href="' + useHref(s, best._p, best) + '">Jump to it</a>';
      }
      hit.hidden = !shown; hit.innerHTML = shown;
      if (s._el.classList.contains('is-open')) fillUses(s, toks);
    });
    if (initial) qa('.rv-src', root).forEach(function (a) { a.classList.add('is-ready'); });
    else qa('.rv-src:not([hidden])', root).slice(0, 14).forEach(function (a) { a.classList.remove('is-ready'); void a.offsetWidth; a.classList.add('is-ready'); });
    els.count.innerHTML = list.length === S.length ? 'Showing all <b>' + S.length + '</b> sources' : '<b>' + list.length + '</b> of ' + S.length + ' sources' + (toks.length ? ' match' : '');
    els.empty.hidden = list.length > 0;
    if (!list.length) els.why.textContent = toks.length ? 'Nothing matches “' + state.q + '” with the filters you have on. Try fewer words, or clear a filter.' : 'The filters you chose do not overlap. Clear one to see more.';
    els.clear.hidden = !state.q;
    qa('[data-k]').forEach(function (b) { b.setAttribute('aria-pressed', state[b.dataset.k].indexOf(b.dataset.v) > -1); });
    qa('.rv-lib-seg', els.mix).forEach(function (b) { b.classList.toggle('is-on', state.types.indexOf(b.dataset.type) > -1); b.classList.toggle('is-off', state.types.length > 0 && state.types.indexOf(b.dataset.type) < 0); });
    els.caveat.checked = state.caveat; els.sort.value = state.sort; els.sort.disabled = !!toks.length;
    writeURL();
  }
  function reset() { state.q = ''; state.types = []; state.topics = []; state.where = []; state.caveat = false; els.q.value = ''; apply(); }

  /* ---------- URL state ---------- */
  function readURL() {
    var p = new URLSearchParams(location.search);
    state.q = p.get('q') || ''; state.types = (p.get('type') || '').split(',').filter(Boolean); state.topics = (p.get('topic') || '').split(',').filter(Boolean);
    state.where = (p.get('in') || '').split(',').filter(Boolean); state.caveat = p.get('caveat') === '1'; state.sort = p.get('sort') || 'cited';
    els.q.value = state.q;
  }
  function writeURL() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q); if (state.types.length) p.set('type', state.types.join(',')); if (state.topics.length) p.set('topic', state.topics.join(','));
    if (state.where.length) p.set('in', state.where.join(',')); if (state.caveat) p.set('caveat', '1'); if (state.sort !== 'cited') p.set('sort', state.sort);
    var s = p.toString(); try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + (location.hash && !/^#cite=/.test(location.hash) ? location.hash : '')); } catch (e) { }
  }

  /* ---------- events ---------- */
  function wire() {
    var timer; els.q.addEventListener('input', function () { state.q = els.q.value; clearTimeout(timer); timer = setTimeout(function () { apply(); }, 60); });
    q('[data-lib-form]').addEventListener('submit', function (e) { e.preventDefault(); var first = q('.rv-src:not([hidden])', root); if (first) { var s = S.filter(function (x) { return x._el === first; })[0]; toggle(s, true); } });
    els.clear.addEventListener('click', function () { state.q = ''; els.q.value = ''; apply(); els.q.focus(); });
    els.q.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.q) { state.q = ''; els.q.value = ''; apply(); }
      if (e.key === 'ArrowDown') { var b = q('.rv-src:not([hidden]) .rv-src__toggle', root); if (b) { e.preventDefault(); b.focus(); } }
    });
    root.addEventListener('keydown', function (e) {
      var t = e.target.closest && e.target.closest('.rv-src__toggle'); if (!t) return;
      var vis = qa('.rv-src:not([hidden]) .rv-src__toggle', root), i = vis.indexOf(t);
      if (e.key === 'ArrowDown' && vis[i + 1]) { e.preventDefault(); vis[i + 1].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); (vis[i - 1] || els.q).focus(); }
    });
    doc.addEventListener('keydown', function (e) {
      var t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopImmediatePropagation(); els.q.focus(); els.q.select(); }
    }, true);
    doc.addEventListener('click', function (e) {
      var c = e.target.closest('[data-k]');
      if (c) { var a = state[c.dataset.k], v = c.dataset.v, i = a.indexOf(v); if (i > -1) a.splice(i, 1); else a.push(v); apply(); return; }
      var seg = e.target.closest('.rv-lib-seg');
      if (seg) { var v2 = seg.dataset.type, j = state.types.indexOf(v2); if (j > -1) state.types.splice(j, 1); else state.types.push(v2); apply(); q('#library').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); return; }
      var tg = e.target.closest('.rv-src__toggle'); if (tg) { toggle(S.filter(function (x) { return x._el === tg.closest('.rv-src'); })[0]); return; }
      if (e.target.closest('[data-lib-reset]')) { reset(); return; }
      var cp = e.target.closest('[data-copy]');
      if (cp) {
        var id = cp.closest('.rv-src').id, url = location.origin + location.pathname + '#' + id;
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).catch(function () { }).then(function () { cp.classList.add('is-done'); history.replaceState(null, '', '#' + id); setTimeout(function () { cp.classList.remove('is-done'); }, 1400); });
      }
    });
    els.caveat.addEventListener('change', function () { state.caveat = els.caveat.checked; apply(); });
    els.sort.addEventListener('change', function () { state.sort = els.sort.value; apply(); });
    window.addEventListener('hashchange', function () { var h = decodeURIComponent(location.hash.slice(1)); if (h && !/^cite=/.test(h)) openById(h); });
  }
})();
