/* Notes: reading-progress line and topic filter. Plain script, no dependencies; the pages read fine without it. */
(function () {
  var doc = document;
  var bar = doc.querySelector('[data-rv-progress]');
  if (bar) {
    var fill = bar.firstElementChild, ticking = false;
    var body = doc.querySelector('[data-rv-body]');
    var update = function () {
      ticking = false;
      if (!body) return;
      var r = body.getBoundingClientRect(), total = r.height - window.innerHeight * 0.6;
      var p = total > 0 ? Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.2) / total)) : 0;
      bar.style.setProperty('--p', p.toFixed(4));
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  var chips = doc.querySelectorAll('[data-rv-topic]');
  if (chips.length) {
    var rows = doc.querySelectorAll('[data-rv-row]');
    var live = doc.querySelector('[data-rv-count]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var topic = chip.getAttribute('data-rv-topic'), shown = 0;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        rows.forEach(function (row) {
          var show = topic === 'all' || (row.getAttribute('data-rv-row') || '').split(' ').indexOf(topic) > -1;
          row.hidden = !show; if (show) shown++;
        });
        if (live) live.textContent = shown + (shown === 1 ? ' note' : ' notes');
      });
    });
  }
})();
