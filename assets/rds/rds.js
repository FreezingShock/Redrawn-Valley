/* Redrawn Design System motion. Plain script, no dependencies. Load after the markup:
   <script src="motion.js"></script>
   data-rds-reveal[="fade|scale|left"]  fade an element up as it enters the viewport
   data-rds-stagger                     on a parent: children reveal one after another
   data-rds-split                       split a headline into words that rise in
   data-rds-draw                        on an <svg>: .rds-stroke paths draw, .rds-fill shapes pop in
   data-rds-nav                         adds .is-scrolled once the page moves
   data-rds-parallax="0.15"             drifts an element against the scroll
   data-rds-toc                         on a nav of #links: marks the current section with aria-current */
(function () {
  var doc = document, root = doc.documentElement;
  root.classList.add('rds-js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function all(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }

  function prepare(scope) {
    all('[data-rds-stagger]', scope).forEach(function (p) {
      Array.prototype.forEach.call(p.children, function (ch, i) {
        if (!ch.hasAttribute('data-rds-reveal')) ch.setAttribute('data-rds-reveal', '');
        ch.style.setProperty('--i', i);
      });
    });
    all('[data-rds-split]', scope).forEach(function (el) {
      if (el.dataset.rdsSplitDone) return;
      var words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', words.join(' '));
      el.textContent = '';
      words.forEach(function (wd, i) {
        var outer = doc.createElement('span'), inner = doc.createElement('span');
        outer.className = 'rds-word'; outer.setAttribute('aria-hidden', 'true');
        inner.textContent = wd; inner.style.setProperty('--i', i);
        outer.appendChild(inner); el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(doc.createTextNode(' '));
      });
      el.dataset.rdsSplitDone = '1';
    });
    all('[data-rds-draw]', scope).forEach(prepDraw);
  }
  /* stroke lengths for the draw-on; also run when scripts/extract_art.py's loader (art.js) puts a figure's shapes in later */
  function prepDraw(svg) {
    all('.rds-stroke', svg).forEach(function (p, i) {
      var len = 1000;
      try { len = Math.ceil(p.getTotalLength()); } catch (e) {}
      p.style.setProperty('--len', len); p.style.setProperty('--i', i);
    });
  }
  doc.addEventListener('rv:art', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-rds-draw')) prepDraw(e.target); });

  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }) : null;

  function watch(scope) {
    all('[data-rds-reveal],[data-rds-split],[data-rds-draw],.rds-mark', scope).forEach(function (el) {
      if (io && !reduce) io.observe(el); else el.classList.add('is-in');
    });
  }

  function nav() {
    var navs = all('[data-rds-nav]'), par = all('[data-rds-parallax]'), ticking = false;
    if (!navs.length && !par.length) return;
    function update() {
      var y = window.scrollY || 0;
      navs.forEach(function (n) { n.classList.toggle('is-scrolled', y > 8); });
      if (!reduce) par.forEach(function (el) {
        var r = el.getBoundingClientRect(), k = parseFloat(el.dataset.rdsParallax) || 0.15;
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - innerHeight / 2) * -k).toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }


  function toc() {
    var tocs = all('[data-rds-toc]'); if (!tocs.length) return;
    var lock = null, lockT = 0;
    function scrollable(sc) { return sc ? sc.scrollHeight > sc.clientHeight + 2 : root.scrollHeight > innerHeight + 2; }
    function update() {
      tocs.forEach(function (t) {
        var sc = t.closest('[data-rds-scroller]'), top0 = sc ? sc.getBoundingClientRect().top : 0, h = sc ? sc.clientHeight : innerHeight;
        var links = all('a[href^="#"]', t), act = 0, can = scrollable(sc);
        links.forEach(function (a, i) {
          var el = doc.getElementById(a.getAttribute('href').slice(1));
          if (el && can && el.getBoundingClientRect().top - top0 < h * 0.4) act = i;
        });
        if (lock) links.forEach(function (a, i) { if (a.getAttribute('href') === lock) act = i; });
        links.forEach(function (a, i) { if (i === act) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        var c = t.querySelector('[data-rds-toc-count]'), txt = (act < 9 ? '0' : '') + (act + 1);
        if (c && c.textContent !== txt) c.textContent = txt;
      });
    }
    var ticking = false;
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); } }, true);
    addEventListener('resize', update);
    // Clicking a tick scrolls smoothly to its section, clear of any sticky header marked data-rds-nav.
    doc.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('[data-rds-toc] a[href^="#"]') : null; if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var el = doc.getElementById(a.getAttribute('href').slice(1)); if (!el) return;
      e.preventDefault();
      var sc = el.closest('[data-rds-scroller]'), y;
      if (sc) { y = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 12; y = Math.max(0, Math.min(y, sc.scrollHeight - sc.clientHeight)); }
      else { var hd = doc.querySelector('[data-rds-nav]'); y = el.getBoundingClientRect().top + pageYOffset - (hd ? hd.offsetHeight : 0) - 20; y = Math.max(0, Math.min(y, root.scrollHeight - innerHeight)); }
      lock = a.getAttribute('href'); update();
      (sc || window).scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      clearTimeout(lockT); lockT = setTimeout(function () { lock = null; update(); }, 1450);
    });
    update();
  }
  function init(scope) { prepare(scope); requestAnimationFrame(function () { requestAnimationFrame(function () { watch(scope); }); }); }
  function replay(scope) {
    var els = all('.is-in', scope);
    els.forEach(function (el) { el.classList.remove('is-in'); });
    void root.offsetWidth;
    setTimeout(function () { els.forEach(function (el) { el.classList.add('is-in'); }); }, 60);
  }
  window.RDSMotion = { init: init, replay: replay };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { init(doc); nav(); toc(); });
  else { init(doc); nav(); toc(); }
})();
