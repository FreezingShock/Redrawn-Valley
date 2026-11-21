/* Redrawn Design System: phone tab bar behavior. Plain script, no dependencies. Loaded by site-shell.js after it builds
   <nav class="rv-tabbar"> (markup) and tabbar.css (look). Without this file the bar still works as five plain links.
     - a sketched loop (.rv-tabbar__mark) glides under the current tab and redraws itself; it starts from the tab you came from
     - the current tab's icon draws itself on
     - pressing squashes the icon, spreads a pencil ring from the touch point, and gives a tiny buzz where the device allows
     - the loop follows [aria-current]: the More button takes it while its sheet is open, and gives it back on close
   Reduced motion: tabbar.css switches every animation and transition off; this script only sets classes. See DESIGN.md > Tab bar. */
(function () {
  var KEY = 'rv-tab', doc = document;
  function store(v) { try { if (v === undefined) { var s = sessionStorage.getItem(KEY); return s === null ? -1 : +s; } sessionStorage.setItem(KEY, String(v)); } catch (e) { return -1; } }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  window.RVTabbarBoot = function (nav) {
    var tabs = Array.prototype.slice.call(nav.querySelectorAll('.rv-tab')), mark = nav.querySelector('.rv-tabbar__mark');
    if (!tabs.length || !mark) return;
    var shown = -2;
    function current() {
      var i = -1;
      tabs.forEach(function (t, k) { if (t.getAttribute('aria-current') === 'true') i = k; });          /* an open sheet's button wins */
      if (i < 0) tabs.forEach(function (t, k) { if (t.hasAttribute('aria-current')) i = k; });
      return i;
    }
    /* move the loop to the current tab; from = where to start gliding (or -1), draw = sketch the loop and icon again */
    function sync(from, draw) {
      var i = current();
      if (i === shown) return;
      shown = i;
      tabs.forEach(function (t) { t.classList.remove('is-draw'); });
      if (i < 0) { mark.removeAttribute('data-on'); return; }
      if (from >= 0 && from !== i) {
        mark.setAttribute('data-still', ''); mark.classList.remove('is-slide'); nav.style.setProperty('--tab-i', from); void mark.offsetWidth;
        mark.removeAttribute('data-still'); mark.classList.add('is-slide'); mark.setAttribute('data-on', '');
        requestAnimationFrame(function () { nav.style.setProperty('--tab-i', i); });
      } else {
        mark.setAttribute('data-still', ''); nav.style.setProperty('--tab-i', i); mark.setAttribute('data-on', ''); void mark.offsetWidth;
        mark.removeAttribute('data-still'); mark.classList.add('is-slide');
      }
      if (draw) { restart(mark, 'is-draw'); restart(tabs[i], 'is-draw'); }
    }
    var first = current(), prev = store();
    sync(prev, prev !== first);              /* a fresh arrival is sketched in; a page within the same section just sits there */
    store(first);
    if (window.MutationObserver) new MutationObserver(function () { sync(-1, true); }).observe(nav, { attributes: true, attributeFilter: ['aria-current'], subtree: true });

    /* press feedback */
    var buzz = navigator.vibrate && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    nav.addEventListener('pointerdown', function (e) {
      var t = e.target.closest && e.target.closest('.rv-tab'); if (!t) return;
      t.classList.add('is-pressed');
      var r = t.getBoundingClientRect(), d = doc.createElement('span'); d.className = 'rv-tab__dab'; d.style.left = (e.clientX - r.left) + 'px';
      d.addEventListener('animationend', function () { d.remove(); }); t.appendChild(d);
      if (buzz && e.pointerType === 'touch') navigator.vibrate(6);
      function up() { t.classList.remove('is-pressed'); ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { t.removeEventListener(n, up); }); }
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { t.addEventListener(n, up); });
    });
    /* keyboard activation gets the same squash */
    nav.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('rv-tab')) e.target.classList.add('is-pressed'); });
    nav.addEventListener('keyup', function (e) { if (e.target.classList) e.target.classList.remove('is-pressed'); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) tabs.forEach(function (t) { t.classList.remove('is-pressed'); }); });
  };
})();
