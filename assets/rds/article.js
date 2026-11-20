/* Redrawn Design System: article behavior. Plain script, no dependencies. Everything works without it.
   [data-rds-article]  on <main>: footnote popovers, note highlighting, contents tracking
   [data-rds-guide]    on the index list: search + topic filter over .rds-row[data-title][data-topic] */
(function () {
  var doc = document;
  function all(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }

  /* Footnote popovers: hover or focus a [n] marker to read the note without leaving the line. */
  function footnotes(main) {
    var pop = doc.createElement('div');
    pop.className = 'rds-fn-pop'; pop.setAttribute('role', 'tooltip'); pop.id = 'rds-fn-pop';
    doc.body.appendChild(pop);
    var timer;
    function show(a) {
      var id = (a.getAttribute('href') || '').slice(1), note = id && doc.getElementById(id);
      if (!note) return;
      clearTimeout(timer);
      var clone = note.cloneNode(true);
      all('.rds-back', clone).forEach(function (b) { b.remove(); });
      pop.innerHTML = '<b>Note ' + a.textContent.replace(/[\[\]]/g, '') + '</b>' + clone.innerHTML;
      var r = a.getBoundingClientRect(), w = pop.offsetWidth || 352;
      var left = Math.max(8, Math.min(window.scrollX + r.left - 16, window.scrollX + doc.documentElement.clientWidth - w - 8));
      pop.style.left = left + 'px';
      pop.style.top = (window.scrollY + r.bottom + 8) + 'px';
      pop.classList.add('is-on');
      a.setAttribute('aria-describedby', pop.id);
    }
    function hide(a) { timer = setTimeout(function () { pop.classList.remove('is-on'); if (a) a.removeAttribute('aria-describedby'); }, 120); }
    all('.rds-fn a', main).forEach(function (a) {
      a.addEventListener('mouseenter', function () { show(a); });
      a.addEventListener('mouseleave', function () { hide(a); });
      a.addEventListener('focus', function () { show(a); });
      a.addEventListener('blur', function () { hide(a); });
    });
    /* Mark the note you jumped to (also works from :target in CSS; this keeps it after you move on). */
    var hot;
    function mark() {
      var id = location.hash.slice(1), n = id && doc.getElementById(id);
      if (hot) hot.classList.remove('is-hot');
      if (n && n.closest('.rds-notes')) { hot = n; n.classList.add('is-hot'); }
    }
    window.addEventListener('hashchange', mark); mark();
  }

  /* Contents box: mark the heading you are reading. */
  function contents(main) {
    var links = all('.rds-contents a[href^="#"]', main);
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var heads = Object.keys(map).map(function (id) { return doc.getElementById(id); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        map[e.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* Index: filter by text and topic, keep letter headings honest, announce the count. */
  function guide(list) {
    var input = doc.querySelector('[data-rds-search]'), chips = all('[data-rds-topic]'),
        rows = all('.rds-row[data-title]', list), count = doc.querySelector('[data-rds-count]'),
        empty = doc.querySelector('[data-rds-empty]'), letters = all('.rds-letter', list), topic = 'all';
    function apply() {
      var q = (input && input.value || '').trim().toLowerCase(), shown = 0;
      rows.forEach(function (r) {
        var ok = (topic === 'all' || (r.dataset.topic || '').split(' ').indexOf(topic) > -1) &&
                 (!q || (r.dataset.title + ' ' + (r.dataset.text || '')).toLowerCase().indexOf(q) > -1);
        r.hidden = !ok; if (ok) shown++;
      });
      letters.forEach(function (l) {
        var any = false, n = l.nextElementSibling;
        while (n && !n.classList.contains('rds-letter')) { if (n.classList.contains('rds-row') && !n.hidden) any = true; n = n.nextElementSibling; }
        l.hidden = !any;
      });
      if (count) count.textContent = shown + (shown === 1 ? ' entry' : ' entries');
      if (empty) empty.classList.toggle('is-on', shown === 0);
    }
    if (input) input.addEventListener('input', apply);
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        topic = c.dataset.rdsTopic;
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        apply();
      });
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === '/' && input && doc.activeElement !== input && !/input|textarea/i.test(doc.activeElement.tagName)) { e.preventDefault(); input.focus(); }
    });
    apply();
  }

  var main = doc.querySelector('[data-rds-article]'); if (main) { footnotes(main); contents(main); }
  var list = doc.querySelector('[data-rds-guide]'); if (list) guide(list);
})();
