/* Redrawn Valley: the "Continue" block at the end of a study, field guide entry, note or lab article.
   Loaded by assets/site-shell.js. Built from the search index (assets/search-index.json, field `k` = topic slugs from the
   page's rv-topics meta) and assets/topics.json, so no page is edited by hand:
     - topic chips linking to each topic hub the page belongs to
     - related pages from the OTHER sections, ranked by shared topics (a study points to notes and guide entries, and so on)
     - previous / next within the section (studies, notes, lab articles; the field guide has its own A-Z pager)
   It goes just above the "Keep reading" rail (rail.js). Opt out with <body data-no-continue>. Styles: continue.css (tokens only).
   Documented in DESIGN.md > Menus and Continue. */
(function () {
  'use strict';
  var doc = document, me = doc.currentScript;
  if (/[?&]embed=1(&|$)/.test(location.search) || doc.body.hasAttribute('data-no-continue')) return;
  var siteRoot = new URL('../../', me && me.src ? me.src : location.href);
  var Q = me && me.src && me.src.match(/\?[^#]*$/) ? me.src.match(/\?[^#]*$/)[0] : '';
  var isFile = location.protocol === 'file:';
  function href(p) { return new URL(p + (isFile && (p === '' || /\/$/.test(p)) ? 'index.html' : ''), siteRoot).href; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var here = decodeURIComponent(location.pathname.slice(siteRoot.pathname.length)).replace(/index\.html$/, '');
  var segs = here.split('/').filter(Boolean), sec = segs[0];
  /* what each kind of page points to, and the pager wording */
  var PLAN = {
    studies: { groups: [['notes', 'Notes on this'], ['guide', 'Field guide terms']], pager: 'study', plural: 'studies' },
    notes: { groups: [['studies', 'Studies it draws on'], ['guide', 'Field guide terms']], pager: 'note', plural: 'notes' },
    guide: { groups: [['studies', 'Studies that use it'], ['notes', 'Notes on this']], pager: null },
    lab: { groups: [['lab', 'More lab notes']], pager: 'lab note', plural: 'lab notes' }
  };
  var plan = PLAN[sec];
  if (!plan || segs.length !== 2) return;
  function title(p) { return p.t.split(' | ')[0]; }
  function json(u) { return fetch(new URL(u, siteRoot)).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  /* the reading order is the order of the section's own index page (studies by number, notes oldest first), not the URL */
  function order() {
    if (!plan.pager) return Promise.resolve([]);
    return fetch(new URL(sec + '/' + (isFile ? 'index.html' : ''), siteRoot)).then(function (r) { return r.text(); }).then(function (t) {
      var out = [], re = /href="([a-z0-9-]+)\/(?:index\.html)?"/g, m;
      while ((m = re.exec(t))) { var u = sec + '/' + m[1] + '/'; if (out.indexOf(u) < 0) out.push(u); }
      return out;
    }).catch(function () { return []; });
  }
  Promise.all([json('assets/search-index.json'), json('assets/topics.json').catch(function () { return { topics: [] }; }), order()]).then(function (r) { build(r[0], r[1].topics, r[2]); }, function () { });

  function build(d, topics, ord) {
    var cur = d.pages.filter(function (p) { return p.u === here; })[0]; if (!cur) return;
    var main = doc.querySelector('main'); if (!main || main.querySelector('.rv-cont')) return;
    var mine = cur.k || [];
    var kids = d.pages.filter(function (p) { return p.s === sec && p.u.split('/').length === 3; });
    kids.sort(function (a, b) { var i = ord.indexOf(a.u), j = ord.indexOf(b.u); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
    function score(p) { var s = 0; (p.k || []).forEach(function (t) { var j = mine.indexOf(t); if (j >= 0) s += j === 0 ? 3 : 2; }); return s; }

    var chips = mine.map(function (slug) { var t = topics.filter(function (x) { return x.slug === slug; })[0]; return t ? '<li><a class="rds-chip" href="' + esc(href('topics/' + slug + '/')) + '">' + esc(t.short || t.title) + '</a></li>' : ''; }).join('');

    var groups = plan.groups.map(function (g) {
      var pool = d.pages.filter(function (p) { return p.s === g[0] && p.u.split('/').length === 3 && p.u !== here; });
      var ranked = pool.map(function (p, i) { return { p: p, s: score(p), i: i }; }).filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s || a.i - b.i; }).slice(0, 3);
      if (!ranked.length) return '';
      return '<section class="rv-cont__group" aria-labelledby="rv-cont-' + g[0] + '"><h3 class="rv-cont__h" id="rv-cont-' + g[0] + '">' + esc(g[1]) + '</h3><ul class="rv-cont__list">' +
        ranked.map(function (x) { return '<li><a href="' + esc(href(x.p.u)) + '">' + esc(title(x.p)) + '</a>' + (x.p.d ? '<span>' + esc(x.p.d) + '</span>' : '') + '</li>'; }).join('') + '</ul></section>';
    }).join('');

    var pager = '';
    if (plan.pager) {
      var i = kids.map(function (p) { return p.u; }).indexOf(here), prev = kids[i - 1], next = kids[i + 1];
      function side(p, dir, rel_) {
        if (!p) return '<span class="rv-cont__end" aria-hidden="true"></span>';
        return '<a class="rv-cont__side rv-cont__side--' + dir + '" rel="' + rel_ + '" href="' + esc(href(p.u)) + '"><small>' + (dir === 'prev' ? 'Previous ' : 'Next ') + plan.pager + '</small><b>' + esc(title(p)) + '</b></a>';
      }
      if (i >= 0 && kids.length > 1) pager = '<nav class="rv-cont__pager" aria-label="More ' + plan.plural + '">' + side(prev, 'prev', 'prev') + side(next, 'next', 'next') + '</nav>';
    }
    if (!chips && !groups && !pager) return;

    var s = doc.createElement('section'); s.className = 'rv-cont'; s.setAttribute('aria-labelledby', 'rv-cont-h'); s.setAttribute('data-rv-noindex', '');
    s.innerHTML = '<div class="rds-container"><p class="rds-eyebrow">Continue</p><h2 class="rv-cont__title" id="rv-cont-h">Where to go next</h2>' +
      (chips ? '<div class="rv-cont__topics"><span class="rv-cont__lab" id="rv-cont-t">Topics</span><ul class="rv-cont__chips" aria-labelledby="rv-cont-t">' + chips + '</ul></div>' : '') +
      (groups ? '<div class="rv-cont__groups">' + groups + '</div>' : '') + pager + '</div>';
    if (!doc.querySelector('link[href*="continue.css"]')) { var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('assets/rds/continue.css', siteRoot).href + Q; doc.head.appendChild(l); }
    var rail = main.querySelector('.rv-rail'); if (rail) main.insertBefore(s, rail); else main.appendChild(s);
  }
})();
