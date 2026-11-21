/* Sketchbook log: type filter (kept in the URL hash-free query), day headers that hide when empty, feed address copy.
   Plain script, no dependencies; the page reads fine without it. */
(function () {
  var doc = document, root = doc.querySelector('[data-rv-log]');
  if (!root) return;
  var chips = doc.querySelectorAll('[data-rv-topic]'), items = root.querySelectorAll('[data-rv-row]'),
      days = root.querySelectorAll('[data-rv-day]'), count = doc.querySelector('[data-rv-count]'),
      empty = root.querySelector('[data-rv-empty]');
  function apply(type, push) {
    var shown = 0;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-rv-topic') === type ? 'true' : 'false'); });
    items.forEach(function (it) { var on = type === 'all' || it.getAttribute('data-rv-row') === type; it.hidden = !on; if (on) shown++; });
    days.forEach(function (d) {
      var n = d.querySelectorAll('[data-rv-row]:not([hidden])').length, c = d.querySelector('[data-rv-day-count]');
      d.hidden = !n;
      if (c) { c.textContent = n; c.parentNode.lastChild.nodeValue = n === 1 ? ' entry' : ' entries'; }
    });
    if (count) count.textContent = shown + (shown === 1 ? ' entry' : ' entries');
    if (empty) empty.hidden = shown > 0;
    if (push && window.history && history.replaceState) {
      var u = new URL(location.href); if (type === 'all') u.searchParams.delete('type'); else u.searchParams.set('type', type);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.getAttribute('data-rv-topic'), true); }); });
  var want = new URL(location.href).searchParams.get('type');
  apply(want && root.querySelector('[data-rv-row="' + want + '"]') ? want : 'all', false);
  var hash = location.hash && doc.getElementById(location.hash.slice(1));
  if (hash && hash.hidden) apply('all', true);
  var btn = doc.querySelector('[data-rv-copy]'), note = doc.querySelector('[data-rv-copied]');
  if (btn) btn.addEventListener('click', function () {
    var url = new URL(btn.getAttribute('data-rv-copy'), location.href).href;
    var done = function (ok) { if (ok && window.RVCozy) window.RVCozy.tag(btn, 'Copied'); if (note) { note.textContent = ok ? 'Copied. Paste it into a feed reader.' : url; setTimeout(function () { note.textContent = ''; }, 4000); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); }); else done(false);
  });
})();
