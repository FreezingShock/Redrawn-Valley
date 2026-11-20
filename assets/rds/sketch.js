/* Redrawn Design System: sketchbook layer script. Adds one hidden SVG with two displacement filters, then switches
   the pencil look on for drawings. Drawings that animate their strokes (data-rds-draw) get it after they finish,
   because filtering a 1 MB SVG on every animation frame is slow. Nothing breaks without it. */
(function () {
  var doc = document, NS = 'http://www.w3.org/2000/svg';
  if (doc.getElementById('rv-pencil')) return;
  var host = doc.createElementNS(NS, 'svg');
  host.setAttribute('width', '0'); host.setAttribute('height', '0'); host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  host.innerHTML =
    '<defs>' +
    '<filter id="rv-pencil" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.028 0.034" numOctaves="2" seed="4" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G"/></filter>' +
    '<filter id="rv-pencil-soft" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter>' +
    '</defs>';
  function ready(fn) { doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', fn) : fn(); }
  ready(function () {
    doc.body.appendChild(host);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    var sel = '.rv-compare svg,.rv-feature__art svg,.rv-about__art svg,.rds-figure__art svg,.rds-infobox__art svg,.rv-infobox svg,.rv-svg,.rds-card__media svg';
    var list = Array.prototype.slice.call(doc.querySelectorAll(sel));
    list.forEach(function (svg) {
      if (svg.getAttribute('aria-hidden') === 'true' && svg.closest('button,a.rds-btn')) return;
      var animated = svg.hasAttribute('data-rds-draw');
      var cls = svg.closest('.rds-infobox__art,.rv-infobox') ? 'rv-pencil-soft' : 'rv-pencil';
      if (!animated || reduce || !('IntersectionObserver' in window)) { svg.classList.add(cls); return; }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          setTimeout(function () { svg.classList.add(cls); }, 2400);
        });
      }, { threshold: 0.25 });
      io.observe(svg);
    });
  });
})();
