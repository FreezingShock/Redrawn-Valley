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

  /* Embed mode (?embed=1): a lab page shown inside an article frame (see DESIGN.md > Lab articles). No header, footer,
     breadcrumbs, tab bar or page title; the frame is told the content height so it can size itself. */
  if (/[?&]embed=1(&|$)/.test(location.search)) {
    doc.documentElement.classList.add('rv-embed');
    var es = doc.createElement('style');
    es.textContent = '.rv-embed .rds-nav,.rv-embed .rds-footer,.rv-embed .rds-crumbs,.rv-embed .rv-tabbar,.rv-embed .rv-progress,.rv-embed .rds-strip,.rv-embed [data-rv-embed-skip],.rv-embed main h1,.rv-embed main>section:first-of-type .rds-eyebrow{display:none!important}.rv-embed .rds-page,.rv-embed body{padding-bottom:0!important}.rv-embed main>section:first-of-type{padding-top:var(--space-6)!important}';
    doc.head.appendChild(es);
    var tell = function () { if (window.parent !== window) window.parent.postMessage({ rvEmbedHeight: Math.ceil(doc.documentElement.scrollHeight), href: location.pathname }, '*'); };
    window.addEventListener('load', tell); window.addEventListener('resize', tell);
    if (window.ResizeObserver) new ResizeObserver(tell).observe(doc.documentElement);
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { doc.querySelectorAll('a[href]').forEach(function (a) { if (!a.target) a.target = '_top'; }); });
  }

  /* scroll effects: progress bar, drawing figures, counters, parallax art (off under prefers-reduced-motion) */
  if (!doc.querySelector('script[src*="scrollfx.js"]')) { var fx = doc.createElement('script'); fx.src = new URL('assets/rds/scrollfx.js', siteRoot).href; fx.defer = true; doc.head.appendChild(fx); }

  /* Header order follows what the site is for: the studies first, then the reference and writing that support them.
     Entries with a `kind` open a flyout listing their pages (read from the search index); About is a plain link. */
  var NAV = [
    { label: 'Studies', url: 'studies/', kind: 'studies', icon: 'studies', blurb: 'Site studies of small places, redrawn.', max: 4, all: 'All studies' },
    { label: 'Field guide', url: 'guide/', kind: 'guide', icon: 'guide', blurb: 'Terms and ideas, one page each.', max: 6, all: 'All entries' },
    { label: 'Notes', url: 'notes/', kind: 'notes', icon: 'notes', blurb: 'Short essays with the evidence shown.', max: 5, all: 'All notes' },
    { label: 'About', url: 'index.html#about' }
  ];
  var LABELS = { guide: 'Field guide', studies: 'Studies', notes: 'Notes', lab: 'Lab notes', about: 'About' };
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
    var links = NAV.map(function (n, i) {
      var on = n.kind && n.url === section + '/';
      var a = '<a href="' + esc(href(n.url)) + '"' + (on ? ' aria-current="page"' : '') + '>' + n.label + '</a>';
      if (!n.kind) return '<li class="rv-nav__item">' + a + '</li>';
      return '<li class="rv-nav__item rv-nav__item--menu" data-rv-kind="' + n.kind + '">' + a +
        '<button class="rv-nav__caret" type="button" aria-expanded="false" aria-controls="rv-panel-' + i + '" aria-label="' + esc(n.label) + ' pages">' + icon('chevron-down', '', 16) + '</button>' +
        '<div class="rv-nav__panel" id="rv-panel-' + i + '" role="group" aria-label="' + esc(n.label) + '">' +
        '<p class="rv-nav__intro">' + icon(n.icon, '', 28) + '<span><b>' + n.label + '</b>' + n.blurb + '</span></p>' +
        '<ul class="rv-nav__list" data-rv-list></ul>' +
        '<a class="rv-nav__all" href="' + esc(href(n.url)) + '">' + n.all + icon('arrow-right', '', 16) + '</a></div></li>';
    }).join('');
    el.innerHTML = '<a class="rds-skip" href="#main">Skip to content</a>' +
      '<a class="rds-nav__brand" href="' + esc(href('')) + '">' + logoMark() + '<span>Redrawn Valley</span></a>' +
      '<ul class="rds-nav__links" id="rv-menu">' + links + '</ul>' +
      '<button class="rds-nav__search" type="button" data-rv-search-open aria-label="Search the site">' + SEARCH_ICON + '<span>Search</span><kbd>/</kbd></button>' +
      '<button class="rds-nav__menu" type="button" aria-expanded="false" aria-controls="rv-menu">Menu</button>';
    var btn = el.querySelector('.rds-nav__menu'), ul = el.querySelector('.rds-nav__links');
    btn.addEventListener('click', function () { var o = ul.classList.toggle('is-open'); btn.setAttribute('aria-expanded', o); btn.textContent = o ? 'Close' : 'Menu'; });

    /* flyouts: hover or focus opens on a pointer; the caret button toggles for keyboard and touch; Esc and outside click close */
    var items = all('.rv-nav__item--menu', el), timer;
    function setOpen(li, o) { li.classList.toggle('is-open', o); li.querySelector('.rv-nav__caret').setAttribute('aria-expanded', o); }
    function closeAll(except) { items.forEach(function (li) { if (li !== except) setOpen(li, false); }); }
    items.forEach(function (li) {
      li.querySelector('.rv-nav__caret').addEventListener('click', function () { var o = !li.classList.contains('is-open'); closeAll(li); setOpen(li, o); });
      li.addEventListener('mouseenter', function () { if (!window.matchMedia('(hover:hover)').matches) return; clearTimeout(timer); closeAll(li); setOpen(li, true); });
      li.addEventListener('mouseleave', function () { if (!window.matchMedia('(hover:hover)').matches) return; timer = setTimeout(function () { setOpen(li, false); }, 160); });
      li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) setOpen(li, false); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Escape' && li.classList.contains('is-open')) { setOpen(li, false); li.querySelector('.rv-nav__caret').focus(); } });
    });
    doc.addEventListener('click', function (e) { if (!el.contains(e.target)) closeAll(); });
    loadIndex().then(function (d) {
      items.forEach(function (li) {
        var kind = li.getAttribute('data-rv-kind'), n = NAV.filter(function (x) { return x.kind === kind; })[0];
        var pages = d.pages.filter(function (p) { return p.s === kind && p.u.split('/').filter(Boolean).length === 2; });
        li.querySelector('[data-rv-list]').innerHTML = pages.slice(0, n.max).map(function (p) {
          var here = rel === p.u;
          return '<li><a href="' + esc(href(p.u)) + '"' + (here ? ' aria-current="page"' : '') + '>' + esc(p.t.split(' | ')[0]) + '</a></li>';
        }).join('');
        var all_ = li.querySelector('.rv-nav__all'); if (pages.length > n.max) all_.firstChild.textContent = n.all.replace('All ', 'All ' + pages.length + ' ');
      });
    });
  }

  /* ---------- bottom tab bar (phones only; skin.css hides it above 640px) ---------- */
  function tabbar() {
    if (doc.querySelector('.rv-tabbar')) return;
    var ic = function (n) { return icon(n, '', 24); };
    /* Home is the brand in the top bar, so the tab bar spends its slots on sections, search and a More sheet. */
    var T = [
      ['Studies', 'studies/', 'studies', ic('studies')],
      ['Guide', 'guide/', 'guide', ic('guide')],
      ['Notes', 'notes/', 'notes', ic('notes')]
    ];
    var nav = doc.createElement('nav'); nav.className = 'rv-tabbar'; nav.setAttribute('aria-label', 'Main');
    nav.innerHTML = T.map(function (t) {
      var on = section === t[2];
      return '<a href="' + esc(href(t[1])) + '"' + (on ? ' aria-current="page"' : '') + '>' + t[3] + '<span>' + t[0] + '</span></a>';
    }).join('') + '<button type="button" data-rv-search-open>' + ic('search') + '<span>Search</span></button>' +
      '<button type="button" class="rv-tab-more" aria-haspopup="dialog">' + ic('menu') + '<span>More</span></button>';
    doc.body.appendChild(nav);
    var more = nav.querySelector('.rv-tab-more'), sheet;
    var M = [
      ['Home', '', 'home', 'Front page'],
      ['Method', 'index.html#method', 'ruler', 'How a study is made'],
      ['About', 'index.html#about', 'info', 'Who draws this, and why'],
      ['A–Z index', 'a-z/', 'contents', 'Every term, place, source and drawing'],
      ['Lab notes', 'lab/', 'thermometer', 'How the patterns, icons and type were made'],
      ['Pattern sheet', 'patterns/', 'leaf', 'Every motif and the palette'],
      ['Icon set', 'icons/', 'pin', 'The hand-drawn icons'],
      ['Sitemap', 'sitemap.xml', 'contents', 'Every page, as a list']
    ];
    more.addEventListener('click', function () {
      if (!sheet) {
        sheet = doc.createElement('dialog'); sheet.className = 'rv-sheet rv-menusheet'; sheet.setAttribute('aria-labelledby', 'rv-more-title');
        sheet.innerHTML = '<div class="rv-sheet__grab" aria-hidden="true"></div><div class="rv-sheet__head"><h2 class="rv-sheet__title" id="rv-more-title">More</h2><button type="button" class="rv-sheet__close">Close</button></div><div class="rv-sheet__body"><ul class="rv-moreList">' +
          M.map(function (m) { return '<li><a href="' + esc(m[1] === 'sitemap.xml' ? new URL(m[1], siteRoot).href : href(m[1])) + '">' + icon(m[2], '', 24) + '<span><b>' + m[0] + '</b>' + m[3] + '</span>' + icon('chevron-right', 'rv-moreList__go', 18) + '</a></li>'; }).join('') + '</ul></div>';
        doc.body.appendChild(sheet);
        sheet.querySelector('.rv-sheet__close').addEventListener('click', function () { sheet.close(); });
        sheet.addEventListener('click', function (e) { if (e.target === sheet || e.target.closest('a')) sheet.close(); });
        sheet.addEventListener('close', function () { doc.documentElement.classList.remove('rds-lock'); more.removeAttribute('aria-current'); });
      }
      sheet.showModal(); doc.documentElement.classList.add('rds-lock'); more.setAttribute('aria-current', 'true');
    });
  }

  /* ---------- footer ---------- */
  function footer(el) {
    var site = [['Home', ''], ['Field guide', 'guide/'], ['Studies', 'studies/'], ['Notes', 'notes/'], ['About', 'index.html#about']]
      .map(function (n) { return '<li><a href="' + esc(href(n[1])) + '">' + n[0] + '</a></li>'; }).join('');
    el.innerHTML = '<div class="rds-footer__grid">' +
      '<div><p class="rds-footer__brand">' + logoMark(30) + 'Redrawn Valley</p><p class="rds-small" style="margin:0;color:var(--on-ink-muted)">Small places in the San Fernando Valley, studied and redrawn.</p></div>' +
      '<div><h4>Site</h4><ul>' + site + '</ul></div>' +
      '<div><h4>Studies</h4><ul data-rv-footer-studies><li><a href="' + esc(href('studies/')) + '">All studies</a></li></ul></div>' +
      '<div><h4>Find things</h4><ul><li><a href="#" data-rv-search-open>Search the site</a></li><li><a href="' + esc(new URL('a-z/', siteRoot).href) + '">A–Z index</a></li><li><a href="' + esc(new URL('sitemap.xml', siteRoot).href) + '">Sitemap</a></li></ul></div>' +
      '<div><h4>Design</h4><ul><li><a href="' + esc(new URL('lab/', siteRoot).href) + '">Lab notes</a></li><li><a href="' + esc(new URL('patterns/', siteRoot).href) + '">Pattern sheet</a></li><li><a href="' + esc(new URL('icons/', siteRoot).href) + '">Icon set</a></li></ul></div>' +
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
  /* The dialog lives in assets/rds/search.js (+ search.css), loaded on idle and on first open. See DESIGN.md > Search. */
  var searchImpl = null, searchP = null;
  function loadSearch() {
    if (!searchP) searchP = new Promise(function (res) {
      var s = doc.createElement('script'); s.src = new URL('assets/rds/search.js', siteRoot).href;
      s.onload = function () { res(window.RVSearchBoot({ esc: esc, all: all, href: href, icon: icon, siteRoot: siteRoot, labels: LABELS, loadIndex: loadIndex, data: function () { return DATA; } })); };
      s.onerror = function () { res(null); }; doc.head.appendChild(s);
    }).then(function (i) { searchImpl = i; return i; });
    return searchP;
  }
  function open(q) { var opener = doc.activeElement; if (searchImpl) return searchImpl.open(q, opener); loadSearch().then(function (i) { if (i) i.open(q, opener); else location.href = href('guide/'); }); }
  window.RVSearch = { open: open, search: function (q) { return Promise.all([loadIndex(), loadSearch()]).then(function () { return searchImpl ? searchImpl.search(q) : []; }); } };

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
    if (all('[data-rv-search-open],[data-rv-search-form]').length) { var idle = window.requestIdleCallback || setTimeout; idle(function () { loadIndex(); loadSearch(); }); }
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
