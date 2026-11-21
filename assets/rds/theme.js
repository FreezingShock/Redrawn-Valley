/* Redrawn Design System: theme switch (light paper / moonlit dark).
   Loads in <head>, blocking and tiny, so the right theme is on <html> before first paint (no flash).
   Order of precedence: saved choice (localStorage "rv-theme") > the system setting (prefers-color-scheme).
   Any element with [data-rv-theme-toggle] flips the theme; the new theme grows out of it as a circle
   (View Transitions API, with an overlay fallback) and swaps instantly under prefers-reduced-motion.
   API: window.RVTheme = { get(), set(theme, originEl), toggle(originEl) }. See DESIGN.md > Dark theme. */
(function () {
  var doc = document, root = doc.documentElement, KEY = 'rv-theme';
  var PAPER = { light: '#f6f1e7', dark: '#15110d' };            /* keep in step with --paper in tokens.css */
  var cur;

  function stored() { try { var v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch (e) { return null; } }
  function system() { return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function apply(t) {
    cur = t;
    root.setAttribute('data-theme', t);
    root.style.colorScheme = t;
    var m = doc.querySelector('meta[name="theme-color"]');
    if (!m && doc.head) { m = doc.createElement('meta'); m.name = 'theme-color'; doc.head.appendChild(m); }
    if (m) m.setAttribute('content', PAPER[t]);
    var btns = doc.querySelectorAll('[data-rv-theme-toggle]');
    for (var i = 0; i < btns.length; i++) label(btns[i]);
    var nm = doc.querySelectorAll('[data-rv-theme-name]');
    for (var j = 0; j < nm.length; j++) nm[j].textContent = t === 'dark' ? 'Dark, moonlit' : 'Light, paper';
  }
  function label(b) {
    var dark = cur === 'dark';
    b.setAttribute('aria-pressed', dark ? 'true' : 'false');
    b.setAttribute('aria-label', dark ? 'Switch to the light theme' : 'Switch to the dark theme');
    b.setAttribute('title', dark ? 'Light theme' : 'Dark theme');
  }
  apply(stored() || system());

  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function reveal(t, from) {
    var r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var R = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)));
    var from0 = 'circle(0px at ' + x + 'px ' + y + 'px)', to = 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)';
    var dur = Math.round(Math.min(1100, Math.max(700, R * 0.75)));
    var ease = 'cubic-bezier(.5,0,.2,1)';
    if (doc.startViewTransition) {
      root.classList.add('rv-theming');
      var vt;
      try { vt = doc.startViewTransition(function () { apply(t); }); } catch (e) { apply(t); root.classList.remove('rv-theming'); return; }
      vt.ready.then(function () {
        root.animate({ clipPath: [from0, to] }, { duration: dur, easing: ease, pseudoElement: '::view-transition-new(root)' });
      }, function () {});
      var done = function () { root.classList.remove('rv-theming'); };
      vt.finished.then(done, done);
      return;
    }
    /* fallback: a disc of the new paper colour grows from the button, then the theme swaps under it and the disc fades */
    var o = doc.createElement('div');
    o.setAttribute('aria-hidden', 'true');
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:' + PAPER[t] + ';clip-path:' + from0;
    doc.body.appendChild(o);
    var a = o.animate({ clipPath: [from0, to] }, { duration: dur, easing: ease, fill: 'forwards' });
    a.onfinish = function () {
      apply(t);
      var f = o.animate({ opacity: [1, 0] }, { duration: 260, easing: 'ease-out', fill: 'forwards' });
      f.onfinish = function () { o.remove(); };
    };
  }

  function set(t, from, keep) {
    if (t !== 'light' && t !== 'dark') return;
    if (!keep) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    if (t === cur) return;
    if (from && !reduced() && doc.body) reveal(t, from); else apply(t);
  }
  window.RVTheme = {
    get: function () { return cur; },
    set: function (t, from) { set(t, from); },
    toggle: function (from) { set(cur === 'dark' ? 'light' : 'dark', from); }
  };

  /* follow the system while no choice is saved; keep tabs in step */
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)'), on = function () { if (!stored()) set(system(), null, true); };
    if (mq.addEventListener) mq.addEventListener('change', on); else if (mq.addListener) mq.addListener(on);
  }
  window.addEventListener('storage', function (e) { if (e.key === KEY) set(stored() || system(), null, true); });
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rv-theme-toggle]');
    if (!b) return;
    e.preventDefault();
    window.RVTheme.toggle(b);
  });
  doc.addEventListener('DOMContentLoaded', function () { apply(cur); });
})();
