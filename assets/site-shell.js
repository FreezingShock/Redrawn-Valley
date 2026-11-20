/* Redrawn Valley shared shell: header, footer, breadcrumbs and site search for every page except the standalone study.
   Opt in by putting placeholders in the page and loading this script (relative path to assets/site-shell.js):
     <header class="rds-nav" data-rds-nav data-rv-shell="nav"></header>
     <nav class="rds-crumbs" data-rv-crumbs aria-label="Breadcrumb"></nav>      (optional, inside <main>)
     <footer class="rds-footer" data-rv-shell="footer"></footer>
   Links are built from the script's own location, so the shell works at any depth and from file://.
   Search reads assets/search-index.json, which scripts/build_index.py regenerates. */
(function () {
  var doc = document, me = doc.currentScript;
  var siteRoot = new URL('../', new URL('./', me && me.src ? me.src : location.href)); // script lives in assets/
  var isFile = location.protocol === 'file:';
  function href(p) { return new URL(p + (isFile && (p === '' || /\/$/.test(p)) ? 'index.html' : ''), siteRoot).href; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function all(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }

  /* scroll effects: progress bar, drawing figures, counters, parallax art (off under prefers-reduced-motion) */
  if (!doc.querySelector('script[src*="scrollfx.js"]')) { var fx = doc.createElement('script'); fx.src = new URL('assets/rds/scrollfx.js', siteRoot).href; fx.defer = true; doc.head.appendChild(fx); }

  var NAV = [['Field guide', 'guide/'], ['Studies', 'studies/'], ['Notes', 'notes/'], ['About', 'index.html#about']];
  var LABELS = { guide: 'Field guide', studies: 'Studies', notes: 'Notes', about: 'About' };
  var sitePath = new URL(siteRoot).pathname;
  var rel = decodeURIComponent(location.pathname.slice(sitePath.length)).replace(/index\.html$/, '');
  var section = rel.split('/')[0];

  /* ---------- index (loaded once, on demand) ---------- */
  var indexP = null, DATA = null;
  function loadIndex() {
    if (!indexP) indexP = fetch(new URL('assets/search-index.json', siteRoot)).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { DATA = d; return d; }).catch(function () { DATA = { sections: LABELS, pages: [] }; return DATA; });
    return indexP;
  }

  /* ---------- header ---------- */
  /* icons: hand-drawn sprite (assets/rds/icons/icons.svg). width/height attributes stop a flash of oversized icons before rds.css loads. */
  var SPRITE = new URL('assets/rds/icons/icons.svg', siteRoot).href;
  function icon(name, cls, size) { return '<svg class="rds-icon' + (cls ? ' ' + cls : '') + '" width="' + (size || 24) + '" height="' + (size || 24) + '" aria-hidden="true" focusable="false"><use href="' + SPRITE + '#i-' + name + '"/></svg>'; }
  function logoMark(size) { return '<svg class="rds-logo" width="' + (size || 34) + '" height="' + (size || 34) + '" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><use href="' + SPRITE + '#i-logo"/></svg>'; }
  var SEARCH_ICON = icon('search', 'rds-icon--sm', 18);
  if (!doc.querySelector('link[rel~="icon"]')) {
    [['icon', 'assets/rds/icons/favicon.svg', 'image/svg+xml'], ['apple-touch-icon', 'assets/rds/icons/apple-touch-icon.png']].forEach(function (a) {
      var k = doc.createElement('link'); k.rel = a[0]; k.href = new URL(a[1], siteRoot).href; if (a[2]) k.type = a[2]; doc.head.appendChild(k);
    });
  }
  function header(el) {
    var links = NAV.map(function (n) {
      var on = n[1].split('#')[0] !== 'index.html' && n[1] === section + '/';
      return '<li><a href="' + esc(href(n[1])) + '"' + (on ? ' aria-current="page"' : '') + '>' + n[0] + '</a></li>';
    }).join('');
    el.innerHTML = '<a class="rds-skip" href="#main">Skip to content</a>' +
      '<a class="rds-nav__brand" href="' + esc(href('')) + '">' + logoMark() + '<span>Redrawn Valley</span></a>' +
      '<ul class="rds-nav__links" id="rv-menu">' + links + '</ul>' +
      '<button class="rds-nav__search" type="button" data-rv-search-open aria-label="Search the site">' + SEARCH_ICON + '<span>Search</span><kbd>/</kbd></button>' +
      '<button class="rds-nav__menu" type="button" aria-expanded="false" aria-controls="rv-menu">Menu</button>';
    var btn = el.querySelector('.rds-nav__menu'), ul = el.querySelector('.rds-nav__links');
    btn.addEventListener('click', function () { var o = ul.classList.toggle('is-open'); btn.setAttribute('aria-expanded', o); btn.textContent = o ? 'Close' : 'Menu'; });
  }

  /* ---------- bottom tab bar (phones only; skin.css hides it above 640px) ---------- */
  function tabbar() {
    if (doc.querySelector('.rv-tabbar')) return;
    var ic = function (n) { return icon(n, '', 24); };
    var T = [
      ['Home', '', '', ic('home')],
      ['Guide', 'guide/', 'guide', ic('guide')],
      ['Studies', 'studies/', 'studies', ic('studies')],
      ['Notes', 'notes/', 'notes', ic('notes')]
    ];
    var nav = doc.createElement('nav'); nav.className = 'rv-tabbar'; nav.setAttribute('aria-label', 'Main');
    nav.innerHTML = T.map(function (t) {
      var on = t[2] ? section === t[2] : rel === '';
      return '<a href="' + esc(href(t[1])) + '"' + (on ? ' aria-current="page"' : '') + '>' + t[3] + '<span>' + t[0] + '</span></a>';
    }).join('') + '<button type="button" data-rv-search-open>' + ic('search') + '<span>Search</span></button>';
    doc.body.appendChild(nav);
  }

  /* ---------- footer ---------- */
  function footer(el) {
    var site = [['Home', ''], ['Field guide', 'guide/'], ['Studies', 'studies/'], ['Notes', 'notes/'], ['About', 'index.html#about']]
      .map(function (n) { return '<li><a href="' + esc(href(n[1])) + '">' + n[0] + '</a></li>'; }).join('');
    el.innerHTML = '<div class="rds-footer__grid">' +
      '<div><p class="rds-footer__brand">' + logoMark(30) + 'Redrawn Valley</p><p class="rds-small" style="margin:0;color:var(--on-ink-muted)">Small places in the San Fernando Valley, studied and redrawn.</p></div>' +
      '<div><h4>Site</h4><ul>' + site + '</ul></div>' +
      '<div><h4>Studies</h4><ul data-rv-footer-studies><li><a href="' + esc(href('studies/')) + '">All studies</a></li></ul></div>' +
      '<div><h4>Find things</h4><ul><li><a href="#" data-rv-search-open>Search the site</a></li><li><a href="' + esc(new URL('sitemap.xml', siteRoot).href) + '">Sitemap</a></li></ul></div>' +
      '<div><h4>Design</h4><ul><li><a href="' + esc(new URL('patterns/', siteRoot).href) + '">Pattern sheet</a></li><li><a href="' + esc(new URL('icons/', siteRoot).href) + '">Icon set</a></li></ul></div>' +
      '</div><div class="rds-footer__base">Concept studies by a student. Not affiliated with any property owner. Built with the Redrawn Design System.</div>';
    loadIndex().then(function (d) {
      var ul = el.querySelector('[data-rv-footer-studies]'), s = d.pages.filter(function (p) { return p.s === 'studies' && p.u.split('/').length > 2; });
      if (s.length) ul.innerHTML = s.map(function (p) { return '<li><a href="' + esc(href(p.u)) + '">' + esc(p.t) + '</a></li>'; }).join('') + '<li><a href="' + esc(href('studies/')) + '">All studies</a></li>';
    });
  }

  /* ---------- breadcrumbs: Home > section > ... > this page, derived from the URL ---------- */
  function crumbs(el) {
    if (!rel) { el.hidden = true; return; }
    var segs = rel.split('/').filter(Boolean);
    function render() {
      var out = [['Home', '']], acc = '';
      segs.forEach(function (s, i) {
        acc += s + '/'; var last = i === segs.length - 1, t;
        var hit = DATA && DATA.pages.filter(function (p) { return p.u === acc; })[0];
        t = last ? ((doc.querySelector('h1') || {}).textContent || '').trim() || (hit && hit.t) || s
          : (hit && hit.t) || (i === 0 && LABELS[s]) || s.replace(/-/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); });
        if (last && t.length > 48) t = (hit && hit.t) || t;
        out.push([t, last ? null : acc]);
      });
      el.innerHTML = '<ol>' + out.map(function (c, i) {
        return '<li>' + (c[1] === null ? '<span aria-current="page">' + esc(c[0]) + '</span>' : '<a href="' + esc(href(c[1])) + '">' + esc(c[0]) + '</a>') + '</li>';
      }).join('') + '</ol>';
    }
    render(); loadIndex().then(render);
  }

  /* ---------- search ---------- */
  var dlg, input, list, status, active = -1, current = [];
  function build() {
    dlg = doc.createElement('dialog'); dlg.className = 'rds-search'; dlg.setAttribute('aria-label', 'Search the site');
    dlg.innerHTML = '<form class="rds-search__bar" role="search" method="dialog">' + SEARCH_ICON +
      '<input type="search" class="rds-search__input" placeholder="Search studies, guide, notes" autocomplete="off" spellcheck="false" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="rv-results" aria-autocomplete="list">' +
      '<button type="button" class="rds-search__close" aria-label="Close search"><span class="rv-k-desk">Esc</span><span class="rv-k-mob">Cancel</span></button></form>' +
      '<ul class="rds-search__list" id="rv-results" role="listbox"></ul><p class="rds-search__status rds-mono" aria-live="polite"></p>';
    doc.body.appendChild(dlg);
    input = dlg.querySelector('input'); list = dlg.querySelector('ul'); status = dlg.querySelector('.rds-search__status');
    input.addEventListener('input', function () { run(input.value); });
    dlg.querySelector('.rds-search__close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); move(e.key === 'ArrowDown' ? 1 : -1); }
      else if (e.key === 'Escape') { e.preventDefault(); dlg.close(); }
      else if (e.key === 'Enter') { var r = current[active < 0 ? 0 : active]; if (r) { e.preventDefault(); location.href = r.href; } }
    });
    dlg.addEventListener('close', function () { doc.documentElement.classList.remove('rds-lock'); });
  }
  function move(d) {
    if (!current.length) return; active = (active + d + current.length) % current.length;
    all('li', list).forEach(function (li, i) { li.setAttribute('aria-selected', i === active); if (i === active) { li.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', li.id); } });
  }
  function terms(q) { return q.toLowerCase().split(/[^a-z0-9À-ɏ]+/).filter(Boolean); }
  function mark(text, ts) {
    var s = esc(text); if (!ts.length) return s;
    return s.replace(new RegExp('(' + ts.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'ig'), '<mark>$1</mark>');
  }
  function snippet(text, ts) {
    var low = text.toLowerCase(), at = -1; ts.forEach(function (t) { var i = low.indexOf(t); if (i >= 0 && (at < 0 || i < at)) at = i; });
    if (at < 0) return text.slice(0, 140);
    var from = Math.max(0, at - 50), s = text.slice(from, from + 150);
    return (from > 0 ? '…' : '') + s + (from + 150 < text.length ? '…' : '');
  }
  function search(q) {
    var ts = terms(q), res = []; if (!ts.length || !DATA) return res;
    DATA.pages.forEach(function (p) {
      var t = p.t.toLowerCase(), d = (p.d || '').toLowerCase(), x = (p.x || '').toLowerCase(), hs = p.h.map(function (h) { return h[0].toLowerCase(); });
      var score = 0, ok = true;
      ts.forEach(function (w) {
        var s = 0, ti = t.indexOf(w);
        if (ti >= 0) s += ti === 0 || t[ti - 1] === ' ' ? 12 : 6;
        if (hs.some(function (h) { return h.indexOf(w) >= 0; })) s += 5;
        if (d.indexOf(w) >= 0) s += 3;
        var xi = x.indexOf(w); if (xi >= 0) s += 1 + Math.min(2, (x.split(w).length - 1) / 5);
        if (!s) ok = false; score += s;
      });
      if (!ok) return;
      if (t.indexOf(q.toLowerCase().trim()) >= 0) score += 10;
      if (p.u === '') score -= 2;
      res.push({ score: score, p: p });
      // headings that match every term become their own rows when they have an anchor
      p.h.forEach(function (h) {
        var hl = h[0].toLowerCase(); if (!h[1] || !ts.every(function (w) { return hl.indexOf(w) >= 0; })) return;
        res.push({ score: score - 1 + 4, p: p, h: h });
      });
    });
    return res.sort(function (a, b) { return b.score - a.score; }).slice(0, 10);
  }
  function row(r, i, ts) {
    var p = r.p, h = r.h, url = href(p.u) + (h ? '#' + h[1] : '');
    var dl = (p.d || '').toLowerCase(), body = r.snip != null ? r.snip : (ts.some(function (t) { return dl.indexOf(t) >= 0; }) || !p.x ? p.d || '' : p.x);
    current.push({ href: url });
    return '<li role="option" id="rv-r' + i + '" aria-selected="false"><a href="' + esc(url) + '" tabindex="-1">' +
      '<span class="rds-tag">' + esc((DATA.sections || LABELS)[p.s] || p.s) + '</span>' +
      '<span class="rds-search__title">' + mark(h ? h[0] : p.t, ts) + '</span>' +
      (h ? '<span class="rds-search__crumb">in ' + esc(p.t) + '</span>' : '<span class="rds-search__text">' + mark(snippet(body, ts), ts) + '</span>') + '</a></li>';
  }
  function run(q) {
    current = []; active = -1; input.removeAttribute('aria-activedescendant');
    var ts = terms(q);
    if (!ts.length) {
      var pages = DATA ? DATA.pages.filter(function (p) { return p.u !== ''; }).slice(0, 8) : [];
      list.innerHTML = pages.length ? '<li class="rds-search__label" role="presentation">Browse</li>' + pages.map(function (p, i) { return row({ p: p, snip: p.d || '' }, i, []); }).join('') : '';
      status.textContent = pages.length ? '' : 'Type to search.'; return;
    }
    var res = search(q);
    list.innerHTML = res.map(function (r, i) { return row(r, i, ts); }).join('');
    status.textContent = res.length ? res.length + (res.length === 1 ? ' result' : ' results') + ' (↑ ↓ to move, Enter to open)' : 'Nothing for “' + q.trim() + '”. Try a shorter word, or browse Field guide, Studies and Notes from the menu.';
  }
  function open(q) {
    if (!dlg) build(); if (dlg.open) { input.focus(); return; }
    dlg.showModal(); doc.documentElement.classList.add('rds-lock');
    input.value = q || ''; run(input.value); input.focus(); input.select();
    loadIndex().then(function () { run(input.value); });
  }
  window.RVSearch = { open: open, search: function (q) { return loadIndex().then(function () { return search(q); }); } };

  /* ---------- wire up ---------- */
  function init() {
    all('[data-rv-shell="nav"]').forEach(header);
    all('[data-rv-shell="footer"]').forEach(footer);
    all('[data-rv-crumbs]').forEach(crumbs);
    tabbar();
    doc.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-rv-search-open]'); if (!b) return;
      e.preventDefault(); open(b.getAttribute('data-rv-search-open') || '');
    });
    all('form[data-rv-search-form]').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); var i = f.querySelector('input'); open(i ? i.value : ''); });
    });
    doc.addEventListener('keydown', function (e) {
      var t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)) { e.preventDefault(); open(''); }
    });
    if (all('[data-rv-search-open],[data-rv-search-form]').length) { var idle = window.requestIdleCallback || setTimeout; idle(loadIndex); }
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
