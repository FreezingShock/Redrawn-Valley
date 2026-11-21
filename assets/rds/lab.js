/* Lab articles: sizes demo frames. A frame with data-fit="auto" grows to the height its page reports
   (assets/site-shell.js posts it in embed mode); any other frame keeps the fixed window set by --demo-h. */
(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll('iframe[data-fit="auto"]'));
  if (!frames.length) return;
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data.rvEmbedHeight !== 'number') return;
    frames.forEach(function (f) { if (f.contentWindow === e.source) var h = Math.max(240, e.data.rvEmbedHeight) + 'px'; f.style.setProperty('--demo-h', h); f.style.setProperty('--demo-h-m', h); });
  });
})();
