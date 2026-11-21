/* A-Z index behavior: kind chips, live filter, jump bar with scroll spy, back-to-top. The list is plain HTML and reads fine without this. */
(function () {
  var doc = document, list = doc.querySelector('[data-az-list]');
  if (!list) return;
  var q = doc.querySelector('[data-az-q]'), chips = [].slice.call(doc.querySelectorAll('[data-az-kind]'));
  var count = doc.querySelector('[data-az-count]'), empty = doc.querySelector('[data-az-empty]');
  var jump = doc.querySelector('[data-az-jump]'), jin = jump && jump.firstElementChild;
  var groups = [].slice.call(list.querySelectorAll('[data-az-group]'));
  var entries = [].slice.call(list.querySelectorAll('.rv-az__entry'));
  var heads = entries.map(function (e) { var h = e.querySelector('.rv-az__head'); return { el: h, raw: h.textContent }; });
  var kind = 'all', term = '', timer;

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mark(i, toks) {
    var h = heads[i]; if (!h.el || h.el.children.length) return;
    if (!toks.length) { h.el.textContent = h.raw; return; }
    var out = esc(h.raw), hit = false;
    toks.forEach(function (t) { var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'); if (re.test(h.raw)) { hit = true; out = out.replace(re, '<mark>$1</mark>'); } });
    if (hit) h.el.innerHTML = out; else h.el.textContent = h.raw;
  }
  function apply() {
    var toks = term.toLowerCase().split(/\s+/).filter(Boolean), shown = 0, byLetter = {};
    entries.forEach(function (e, i) {
      var ok = (kind === 'all' || e.dataset.azKindOf === kind) && toks.every(function (t) { return e.dataset.azText.indexOf(t) > -1; });
      e.hidden = !ok; if (ok) shown++; mark(i, ok ? toks : []);
    });
    groups.forEach(function (g) {
      var n = g.querySelectorAll('.rv-az__entry:not([hidden])').length; g.hidden = !n; byLetter[g.dataset.azGroup] = n;
      var s = g.querySelector('[data-az-n]'); if (s) s.textContent = n + (n === 1 ? ' entry' : ' entries');
    });
    if (jump) [].forEach.call(jump.querySelectorAll('[data-az-letter]'), function (a) {
      var on = byLetter[a.dataset.azLetter] > 0;
      if (a.tagName === 'A') { a.style.display = on ? '' : 'none'; }
    });
    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = shown + (shown === 1 ? ' entry' : ' entries') + (toks.length || kind !== 'all' ? ' match' : '');
    var u = new URL(location.href); term ? u.searchParams.set('q', term) : u.searchParams.delete('q'); kind !== 'all' ? u.searchParams.set('k', kind) : u.searchParams.delete('k');
    history.replaceState(null, '', u.pathname + u.search + location.hash);
    spy();
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { kind = c.dataset.azKind; chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); }); apply(); }); });
  if (q) q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { term = q.value.trim(); apply(); }, 90); });
  doc.querySelector('[data-az-clear]') && doc.querySelector('[data-az-clear]').addEventListener('click', function () {
    term = ''; kind = 'all'; if (q) q.value = ''; chips.forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.azKind === 'all' ? 'true' : 'false'); }); apply(); if (q) q.focus();
  });
  /* "See ..." cross-references: clear filters that would hide the target, then scroll to it */
  list.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-az-goto]'); if (!a) return;
    var t = doc.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
    if (t.hidden) { term = ''; kind = 'all'; if (q) q.value = ''; chips.forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.azKind === 'all' ? 'true' : 'false'); }); apply(); }
  });

  /* scroll spy: mark the letter whose group is under the sticky bar, and keep it in view in the strip */
  var cur = null, ticking = false;
  function spy() {
    ticking = false; if (!jin) return;
    var line = (jump.getBoundingClientRect().bottom) + 40, pick = null;
    for (var i = 0; i < groups.length; i++) { if (groups[i].hidden) continue; var r = groups[i].getBoundingClientRect(); if (r.top <= line) pick = groups[i]; else break; }
    var L = pick ? pick.dataset.azGroup : null;
    if (L === cur) return; cur = L;
    [].forEach.call(jin.querySelectorAll('a'), function (a) {
      var on = a.dataset.azLetter === L; if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      if (on) { var x = a.offsetLeft - (jin.clientWidth - a.offsetWidth) / 2; jin.scrollTo({ left: x, behavior: 'smooth' }); }
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(spy); } top && top.classList.toggle('is-on', window.scrollY > 900); }
  var top = doc.createElement('button'); top.type = 'button'; top.className = 'rv-az__top'; top.setAttribute('aria-label', 'Back to the top of the index'); top.textContent = '↑';
  top.addEventListener('click', function () { var t = doc.querySelector('.rv-az__tools'); (t || doc.body).scrollIntoView({ block: 'start' }); });
  doc.body.appendChild(top);
  window.addEventListener('scroll', onScroll, { passive: true });
  /* Jumping to a letter: the page is long (tens of thousands of pixels on a phone), so a smooth scroll would sweep past every
     letter on the way and finish a little off the mark. Far jumps are instant; near ones glide. Either way the heading is
     measured again once the scroll stops and nudged flush under the sticky bar. */
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function landing(g) { return g.getBoundingClientRect().top + window.scrollY - (jump.getBoundingClientRect().bottom + 16); }
  function settle(g, tries) {
    var off = g.getBoundingClientRect().top - (jump.getBoundingClientRect().bottom + 16);
    if (Math.abs(off) > 2 && tries > 0) { window.scrollBy({ top: off, behavior: 'instant' }); requestAnimationFrame(function () { settle(g, tries - 1); }); }
    else spy();
  }
  jump && jump.addEventListener('click', function (ev) {
    var a = ev.target.closest('a'); if (!a) return; var g = doc.querySelector(a.getAttribute('href')); if (!g) return;
    ev.preventDefault();
    var y = landing(g), far = Math.abs(y - window.scrollY) > window.innerHeight * 2;
    window.scrollTo({ top: y, behavior: far || reduce.matches ? 'instant' : 'smooth' });
    if (far || reduce.matches) requestAnimationFrame(function () { settle(g, 4); });
    else if ('onscrollend' in window) window.addEventListener('scrollend', function () { settle(g, 4); }, { once: true });
    else setTimeout(function () { settle(g, 4); }, 700);
    history.replaceState(null, '', a.getAttribute('href'));
  });

  var p = new URLSearchParams(location.search);
  if (p.get('k') && chips.some(function (c) { return c.dataset.azKind === p.get('k'); })) { kind = p.get('k'); chips.forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.azKind === kind ? 'true' : 'false'); }); }
  if (p.get('q')) { term = p.get('q'); if (q) q.value = term; }
  apply(); onScroll();
})();
