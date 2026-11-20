/* Redrawn Valley: before/after toggle on the home page. the Redrawn Design System's rds.js handles reveals and drawings. */
(function () {
  var figs = document.querySelectorAll('[data-rv-compare]');
  Array.prototype.forEach.call(figs, function (fig) {
    var buttons = fig.querySelectorAll('[data-rv-view]'), name = fig.querySelector('[data-rv-name]');
    function show(view) {
      fig.setAttribute('data-view', view);
      Array.prototype.forEach.call(buttons, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-rv-view') === view ? 'true' : 'false'); });
      if (name) name.textContent = view === 'today' ? 'today' : 'as proposed';
    }
    Array.prototype.forEach.call(buttons, function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-rv-view')); }); });
  });
})();
