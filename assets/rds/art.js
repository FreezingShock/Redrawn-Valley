/* Redrawn Design System: art loader. Plain script, no dependencies. Loaded (deferred) by pages whose big drawings were moved out
   of the HTML by scripts/extract_art.py. An empty <svg data-art="path/art-<hash>.svg"> is filled with the shapes from that file
   when it is within about 1.5 screens of the viewport (all at once for print, with no IntersectionObserver or with ?art=all).
   After the shapes are in, it fires a bubbling `rv:art` event on the svg: rds.js measures stroke lengths for the draw-on,
   scrollfx.js re-reads the paths for scroll drawing. Files are named by content hash and served immutable, so a figure is fetched
   once per visitor. If a fetch fails the empty svg stays (the figure has its aria-label and caption). See DESIGN.md > Loading. */
(function () {
  'use strict';
  var doc = document, MARGIN = '1500px 0px 1500px 0px', cache = {};
  function fill(svg, text) {
    var a = text.indexOf('>') + 1, z = text.lastIndexOf('</svg>');
    if (a < 1 || z < a) return;
    svg.innerHTML = text.slice(a, z);
    svg.removeAttribute('data-art'); svg.setAttribute('data-art-ready', '');
    svg.dispatchEvent(new CustomEvent('rv:art', { bubbles: true }));
  }
  function get(src) {
    var url = new URL(src, location.href).href;
    return (cache[url] = cache[url] || fetch(url).then(function (r) { if (!r.ok) throw 0; return r.text(); }));
  }
  function load(svg) {
    var src = svg.getAttribute('data-art'); if (!src || svg.__artP) return;
    svg.__artP = get(src).then(function (t) { fill(svg, t); }, function () { svg.__artP = null; });
  }
  function all() { return Array.prototype.slice.call(doc.querySelectorAll('svg[data-art]')); }
  function start() {
    var list = all(); if (!list.length) return;
    if (!('IntersectionObserver' in window) || /[?&]art=all/.test(location.search)) { list.forEach(load); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }); }, { rootMargin: MARGIN });
    list.forEach(function (s) { io.observe(s); });
  }
  /* figures in closed tabs or hidden panels have no box, so the observer never fires for them: fetch their files once the page is
     idle, so opening the tab fills them within a frame (the observer then fires and finds the file already in hand) */
  function warmHidden() {
    all().forEach(function (s) { if (!s.getClientRects().length) get(s.getAttribute('data-art')).catch(function () {}); });
  }
  window.addEventListener('load', function () { setTimeout(function () { (window.requestIdleCallback || function (f) { f(); })(warmHidden); }, 1500); });
  window.addEventListener('beforeprint', function () { all().forEach(load); });
  window.RVArt = { load: load, all: function () { all().forEach(load); } };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
