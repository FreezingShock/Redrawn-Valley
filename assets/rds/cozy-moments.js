/* Redrawn Design System: cozy layer. Plain script, no dependencies; every page reads the same without it.
   site-shell.js loads this on every page and it loads cozy-moments.css itself. What it does:
     1. data-tod        <html data-tod="dawn|day|dusk|night"> from the visitor's clock (?tod=night previews one). At dusk, in the light
                        theme, a faint warm wash sits over the page; at night the light-theme switch nods now and then.
     2. the lamp        when the theme changes to dark because the switch was pressed, a warm glow blooms from the switch and flickers on.
     3. copy stamp      window.RVCozy.tag(button, 'Copied') drops a small paper tag with a pencil check above the button.
   Skipped under prefers-reduced-motion: the lamp glow and the nod (CSS); the stamp stays still for its whole life. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, me = doc.currentScript;
  var SRC = me && me.src ? me.src : '', Q = (SRC.match(/\?[^#]*$/) || [''])[0];
  var reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function el(tag, cls) { var n = doc.createElement(tag); if (cls) n.className = cls; return n; }

  if (!doc.querySelector('link[href*="cozy-moments.css"]')) {
    var l = el('link'); l.rel = 'stylesheet'; l.href = SRC.replace(/cozy-moments\.js.*$/, 'cozy-moments.css') + Q; doc.head.appendChild(l);
  }

  /* ---------- 1. time of day ---------- */
  var want = (location.search.match(/[?&]tod=(dawn|day|dusk|night)\b/) || [])[1];
  var h = new Date().getHours();
  var tod = want || (h >= 5 && h < 8 ? 'dawn' : h < 17 && h >= 8 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night');
  root.setAttribute('data-tod', tod);
  function wash() {
    if (tod !== 'dusk' || doc.querySelector('.cz-wash') || !doc.body) return;
    var w = el('div', 'cz-wash'); w.setAttribute('aria-hidden', 'true'); doc.body.appendChild(w);
  }
  if (doc.body) wash(); else doc.addEventListener('DOMContentLoaded', wash);
  window.addEventListener('load', function () { setTimeout(function () { root.classList.add('cz-ready'); }, 600); });

  /* ---------- 3. copy stamp ---------- */
  var tagEl = null, tagT = 0;
  function tag(anchor, text) {
    if (!anchor || !doc.body) return;
    if (tagEl) tagEl.remove();
    clearTimeout(tagT);
    var t = el('span', 'cz-tag');
    t.setAttribute('aria-hidden', 'true');  /* the page's own live region says it; this is the visual half */
    t.innerHTML = '<svg viewBox="0 0 16 16" focusable="false"><path pathLength="1" d="M3 8.6l3.2 3.2L13 4.6"/></svg><span></span>';
    t.lastChild.textContent = text || 'Copied';
    doc.body.appendChild(t); tagEl = t;
    var r = anchor.getBoundingClientRect(), w = t.offsetWidth, hgt = t.offsetHeight, gap = 10;
    var x = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), innerWidth - w - 8);
    var y = r.top - hgt - gap < 8 ? r.bottom + gap : r.top - hgt - gap;
    t.style.left = Math.round(x) + 'px'; t.style.top = Math.round(y) + 'px';
    var done = function () { if (tagEl === t) tagEl = null; t.remove(); };
    t.addEventListener('animationend', function (e) { if (e.target === t) done(); });
    tagT = setTimeout(done, 1900);
  }

  /* ---------- 2. the lamp ---------- */
  var last = null;  /* the switch pressed most recently: where the glow starts */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rv-theme-toggle]');
    if (!b) return;
    var r = b.getBoundingClientRect(); last = { x: r.left + r.width / 2, y: r.top + r.height / 2, t: Date.now() };
    b.classList.remove('cz-click'); void b.offsetWidth; b.classList.add('cz-click');
    setTimeout(function () { b.classList.remove('cz-click'); }, 600);
  }, true);
  /* theme.js marks <html class="rv-theming"> while its circle reveal runs, and the page is only snapshots until it ends: light the lamp after */
  function whenSettled(fn, n) {
    if (root.classList.contains('rv-theming') && (n || 0) < 25) { setTimeout(function () { whenSettled(fn, (n || 0) + 1); }, 80); return; }
    setTimeout(fn, 60);
  }
  function lamp() {
    if (reduceMQ.matches || !last || Date.now() - last.t > 4000 || !doc.body) return;
    var old = doc.querySelector('.cz-lamp'); if (old) old.remove();
    var g = el('div', 'cz-lamp'); g.setAttribute('aria-hidden', 'true');
    g.style.setProperty('--x', Math.round(last.x) + 'px'); g.style.setProperty('--y', Math.round(last.y) + 'px');
    doc.body.appendChild(g);
    g.addEventListener('animationend', function () { g.remove(); });
    setTimeout(function () { g.remove(); }, 2600);
  }
  if (window.MutationObserver) new MutationObserver(function (list) {
    list.forEach(function (m) {
      if (m.oldValue !== 'dark' && root.getAttribute('data-theme') === 'dark') whenSettled(lamp);
    });
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'], attributeOldValue: true });

  window.RVCozy = { tag: tag, tod: tod };
})();
