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
  var Q = me && me.src && me.src.match(/\?[^#]*$/) ? me.src.match(/\?[^#]*$/)[0] : ''; // ?v= fingerprint; files this script loads reuse it (scripts/assetver.py)
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
  if (!doc.querySelector('script[src*="scrollfx.js"]')) { var fx = doc.createElement('script'); fx.src = new URL('assets/rds/scrollfx.js', siteRoot).href + Q; fx.defer = true; doc.head.appendChild(fx); }

  /* citation jump links from the Sources library (#cite=ID.N): scroll to the marker and highlight the sentence */
  if (!doc.querySelector('script[src*="cite-jump.js"]') && /cite=/.test(location.hash)) { var cj = doc.createElement('script'); cj.src = new URL('assets/rds/cite-jump.js', siteRoot).href + Q; cj.defer = true; doc.head.appendChild(cj); }
  else if (!doc.querySelector('script[src*="cite-jump.js"]')) { window.addEventListener('hashchange', function once() { if (/cite=/.test(location.hash)) { window.removeEventListener('hashchange', once); var c2 = doc.createElement('script'); c2.src = new URL('assets/rds/cite-jump.js', siteRoot).href + Q; doc.head.appendChild(c2); } }); }
  /* related-pages rail ("Keep reading") and the Random page links: assets/rds/rail.js */
  if (!doc.querySelector('script[src*="rail.js"]')) { var rl = doc.createElement('script'); rl.src = new URL('assets/rds/rail.js', siteRoot).href + Q; rl.defer = true; doc.head.appendChild(rl); }

  /* Header order follows what the site is for: the studies first, then the reference and writing that support them.
     Entries with a `kind` open a flyout listing their pages (read from the search index); About is a plain link. */
  var NAV = [
    { label: 'Studies', url: 'studies/', kind: 'studies', icon: 'studies', blurb: 'Site studies of small places, redrawn.', max: 4, all: 'All studies' },
    { label: 'Field guide', url: 'guide/', kind: 'guide', icon: 'guide', blurb: 'Terms and ideas, one page each.', max: 6, all: 'All entries' },
    { label: 'Notes', url: 'notes/', kind: 'notes', icon: 'notes', blurb: 'Short essays with the evidence shown.', max: 5, all: 'All notes' },
    { label: 'About', url: 'index.html#about' }
  ];
  var LABELS = { guide: 'Field guide', studies: 'Studies', notes: 'Notes', lab: 'Lab notes', topics: 'Topics', log: 'Sketchbook log', about: 'About' };
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
  /* sun and moon share one button; CSS shows the one for the current theme (assets/rds/theme.css, assets/rds/theme.js) */
  function themeIcons(size) { return '<span class="rv-theme__ico">' + icon('sun', 'rv-theme__sun', size) + icon('moon', 'rv-theme__moon', size) + '</span>'; }
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
      '<button class="rv-theme" type="button" data-rv-theme-toggle aria-pressed="false" aria-label="Switch to the dark theme" title="Dark theme">' + themeIcons(22) + '</button>' +
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

  /* ---------- bottom tab bar (phones only; tabbar.css shows it at 640px and below, tabbar.js animates it) ---------- */
  /* Strokes are copies of the sprite's studies, guide, notes, search and menu icons (assets/rds/icons/icons.svg), inlined so
     tabbar.css can line-draw them (a <use> shadow tree can't take a per-path draw). Second stroke = the brick accent. */
  var TAB_ICONS = {
    studies: ['M3.59 6.78Q6.33 5.57 9.22 4.77Q12.18 5.84 15.17 6.81Q17.7 5.79 20.26 4.83Q20.14 11.17 20.34 17.5Q17.65 18.25 15.11 19.41Q12.12 18.15 9.13 16.9Q6.43 18.07 3.7 19.18Q3.8 13.28 3.82 7.38', 'M9.13 4.88Q9.15 10.87 8.82 16.86'],
    guide: ['M5.5 4.73Q12.02 4.55 18.54 4.79Q18.34 12.17 18.21 19.56Q12 19.71 5.79 19.59Q5.97 12.44 5.88 5.28', 'M9.61 4.76Q9.77 12.16 9.46 19.55'],
    notes: ['M4.92 19.8Q5.52 17.58 5.82 15.3Q11.04 10.31 16.06 5.13Q17.58 6.47 18.97 7.94Q13.8 13.23 8.63 18.53Q6.87 19.4 5.18 20.38', 'M13.62 7.61Q15.12 9.02 16.7 10.34'],
    search: ['M4.43 9.49C4.77 8.85 5.4 6.46 6.45 5.65C7.5 4.84 9.32 4.59 10.74 4.66C12.17 4.72 13.97 5.13 14.97 6.05C15.98 6.96 16.71 8.77 16.76 10.16C16.81 11.54 16.18 13.26 15.27 14.36C14.36 15.45 12.73 16.51 11.3 16.73C9.86 16.96 7.83 16.53 6.66 15.71C5.49 14.89 4.62 13.21 4.28 11.82C3.94 10.42 4.57 8.07 4.63 7.33', 'M14.89 14.85Q17.51 17.46 20.12 20.08'],
    menu: ['M4.13 6.85Q12.09 6.76 20.05 7.14M4.03 12.37Q12.08 12.02 20.14 11.8', 'M4.04 17.16Q9.35 16.87 14.67 16.82']
  };
  function tabIcon(n) { var d = TAB_ICONS[n]; return '<span class="rv-tab__ico"><svg class="rv-tab__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path pathLength="1" d="' + d[0] + '"/><path class="rv-tab__acc" pathLength="1" d="' + d[1] + '"/></svg></span>'; }
  function tabbar() {
    if (doc.querySelector('.rv-tabbar')) return;
    /* Home is the brand in the top bar, so the tab bar spends its slots on sections, search and a More sheet. */
    var T = [
      ['Studies', 'studies/', 'studies'],
      ['Guide', 'guide/', 'guide'],
      ['Notes', 'notes/', 'notes']
    ];
    var nav = doc.createElement('nav'); nav.className = 'rv-tabbar'; nav.setAttribute('aria-label', 'Main');
    nav.innerHTML = '<svg class="rv-tabbar__edge" viewBox="0 0 400 6" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path vector-effect="non-scaling-stroke" d="M0 3.1Q40 2.2 82 3.2T170 2.8T262 3.3T338 2.7T400 3"/></svg>' +
      '<span class="rv-tabbar__mark" aria-hidden="true"><svg viewBox="0 0 56 40"><ellipse class="rv-tabbar__wash" cx="28" cy="20" rx="21" ry="14.5"/><path class="rv-tabbar__loop" pathLength="1" d="M9 23C6.5 11 20 4.5 31 5.2C44 6 52 13 50 22.5C48 32 36 36 25 35C13 34 5.5 27.5 8.5 16.5C10 11.5 14 8.5 19 7.2"/></svg></span>' +
      T.map(function (t) {
        var on = section === t[2];
        return '<a class="rv-tab" href="' + esc(href(t[1])) + '"' + (on ? ' aria-current="page"' : '') + '>' + tabIcon(t[2]) + '<span class="rv-tab__label">' + t[0] + '</span></a>';
      }).join('') + '<button type="button" class="rv-tab" data-rv-search-open>' + tabIcon('search') + '<span class="rv-tab__label">Search</span></button>' +
      '<button type="button" class="rv-tab rv-tab-more" aria-haspopup="dialog">' + tabIcon('menu') + '<span class="rv-tab__label">More</span></button>';
    doc.body.appendChild(nav);
    /* style first, then behavior; the bar stays hidden (skin.css) until tabbar.css is in */
    var cssL = doc.createElement('link'); cssL.rel = 'stylesheet'; cssL.href = new URL('assets/rds/tabbar.css', siteRoot).href + Q; doc.head.appendChild(cssL);
    var js = doc.createElement('script'); js.src = new URL('assets/rds/tabbar.js', siteRoot).href + Q; js.onload = function () { if (window.RVTabbarBoot) window.RVTabbarBoot(nav); }; doc.head.appendChild(js);
    var more = nav.querySelector('.rv-tab-more'), sheet;
    var M = [
      ['Home', '', 'home', 'Front page'],
      ['Topics', 'topics/', 'tree', 'Heat, trees, water and more, across every page'],
      ['Method', 'index.html#method', 'ruler', 'How a study is made'],
      ['About', 'index.html#about', 'info', 'Who draws this, and why'],
      ['Sources', 'sources/', 'footnote', 'Every citation, and where it is used'],
      ['Sketchbook log', 'log/', 'contents', 'Everything new, by date'],
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
          '<li><button type="button" class="rv-moreList__theme" data-rv-theme-toggle aria-pressed="false">' + themeIcons(24) + '<span><b>Theme</b><i data-rv-theme-name>Light</i></span><span class="rv-moreList__switch" aria-hidden="true"></span></button></li>' +
          M.map(function (m) { return '<li><a href="' + esc(m[1] === 'sitemap.xml' ? new URL(m[1], siteRoot).href : href(m[1])) + '">' + icon(m[2], '', 24) + '<span><b>' + m[0] + '</b>' + m[3] + '</span>' + icon('chevron-right', 'rv-moreList__go', 18) + '</a></li>'; }).join('') + '</ul></div>';
        if (window.RVTheme) window.RVTheme.set(window.RVTheme.get(), null, true);
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
    var site = [['Home', ''], ['Field guide', 'guide/'], ['Studies', 'studies/'], ['Notes', 'notes/'], ['Topics', 'topics/'], ['About', 'index.html#about']]
      .map(function (n) { return '<li><a href="' + esc(href(n[1])) + '">' + n[0] + '</a></li>'; }).join('');
    el.innerHTML = '<div class="rds-footer__grid">' +
      '<div><p class="rds-footer__brand">' + logoMark(30) + 'Redrawn Valley</p><p class="rds-small" style="margin:0;color:var(--on-band-muted)">Small places in the San Fernando Valley, studied and redrawn.</p></div>' +
      '<div><h4>Site</h4><ul>' + site + '</ul></div>' +
      '<div><h4>Studies</h4><ul data-rv-footer-studies><li><a href="' + esc(href('studies/')) + '">All studies</a></li></ul></div>' +
      '<div><h4>Find things</h4><ul><li><a href="#" data-rv-search-open>Search the site</a></li><li><a href="' + esc(href('sources/')) + '">Sources library</a></li><li><a href="' + esc(new URL('a-z/', siteRoot).href) + '">A–Z index</a></li><li><a href="' + esc(new URL('log/', siteRoot).href) + '">Sketchbook log</a></li><li><a href="' + esc(new URL('sitemap.xml', siteRoot).href) + '">Sitemap</a></li></ul></div>' +
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
      var s = doc.createElement('script'); s.src = new URL('assets/rds/search.js', siteRoot).href + Q;
      s.onload = function () { res(window.RVSearchBoot({ esc: esc, all: all, href: href, icon: icon, siteRoot: siteRoot, q: Q, labels: LABELS, loadIndex: loadIndex, data: function () { return DATA; } })); };
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
    /* the standalone study bar has no site header, so it gets the theme switch beside its Search link */
    all('nav.ktabs').forEach(function (k) {
      var srch = k.querySelector('[data-rv-search-open]');
      if (!srch || k.querySelector('.rv-theme')) return;
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'rv-theme rv-theme--bar'; b.setAttribute('data-rv-theme-toggle', ''); b.setAttribute('aria-pressed', 'false');
      b.innerHTML = themeIcons(20); k.insertBefore(b, srch);
      if (window.RVTheme) window.RVTheme.set(window.RVTheme.get(), null, true);
    });
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
