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
    '<filter id="rv-pencil-line" filterUnits="userSpaceOnUse" x="-200" y="-200" width="4000" height="4000" color-interpolation-filters="sRGB">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="5" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>' +
    '<pattern id="rv-h-moss" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="7" height="7" fill="#dfe6d8"/><path d="M0 3.5h7" stroke="#2f4a3a" stroke-width="1" opacity=".45"/></pattern>' +
    '<pattern id="rv-h-brick" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><rect width="7" height="7" fill="#f0d9cc"/><path d="M0 3.5h7" stroke="#9c3d24" stroke-width="1" opacity=".5"/></pattern>' +
    '<pattern id="rv-h-sunk" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="8" height="8" fill="#ece5d6"/><path d="M0 4h8" stroke="#8a8170" stroke-width="1" opacity=".4"/></pattern>' +
    '<pattern id="rv-h-slate" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#35506b"/><path d="M0 3h6" stroke="#fbf8f1" stroke-width="1" opacity=".28"/></pattern>' +
    '<pattern id="rv-h-brickd" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="6" height="6" fill="#9c3d24"/><path d="M0 3h6" stroke="#fbf8f1" stroke-width="1" opacity=".28"/></pattern>' +
    '<pattern id="rv-h-mossd" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#2f4a3a"/><path d="M0 3h6" stroke="#fbf8f1" stroke-width="1" opacity=".25"/></pattern>' +
    '</defs>';
  function ready(fn) { doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', fn) : fn(); }
  ready(function () {
    doc.body.appendChild(host);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    var sel = '.rv-compare svg,.rv-feature__art svg,.rv-about__art svg,.rds-figure__art svg:not(.rv-svg),.rds-infobox__art svg,.rv-infobox svg,.rds-card__media svg';
    var list = Array.prototype.slice.call(doc.querySelectorAll(sel));
    Array.prototype.slice.call(doc.querySelectorAll('svg.rv-svg')).forEach(function (s) { s.classList.add('rv-pencil-shapes'); });
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
