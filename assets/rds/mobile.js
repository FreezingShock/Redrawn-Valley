/* Redrawn Design System: mobile behavior. Plain script, no dependencies; everything it adds is hidden or inert on desktop
   and every page still reads without it.
     - top bar hides on scroll down, returns on scroll up
     - "Contents" pill + bottom sheet (from .rds-contents, .rds-toc or .kt lists)
     - tap a footnote / source marker to read it in a bottom sheet
     - infobox and contents box collapse under 900px */
(function () {
  var doc = document, win = window;
  function all(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }
  function mq(q) { return win.matchMedia && win.matchMedia(q).matches; }
  var small = function () { return mq('(max-width:899px)'); };
  var touchy = function () { return mq('(max-width:899px)') || mq('(hover:none)'); };

  /* ---------- top bar: hide on scroll down, show on scroll up ---------- */
  function bar() {
    var nav = doc.querySelector('.rds-nav'); if (!nav) return;
    var last = win.pageYOffset, tick = false;
    function run() {
      tick = false;
      var y = win.pageYOffset, d = y - last;
      if (!mq('(max-width:640px)') || y < 80 || d < -6) nav.classList.remove('is-hidden');
      else if (d > 8) nav.classList.add('is-hidden');
      if (Math.abs(d) > 6) last = y;
    }
    win.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
  }

  /* ---------- sheet ---------- */
  var sheet, sheetTitle, sheetBody;
  function buildSheet() {
    if (sheet) return;
    sheet = doc.createElement('dialog'); sheet.className = 'rv-sheet'; sheet.setAttribute('aria-labelledby', 'rv-sheet-title');
    sheet.innerHTML = '<div class="rv-sheet__grab" aria-hidden="true"></div><div class="rv-sheet__head"><h2 class="rv-sheet__title" id="rv-sheet-title"></h2><button type="button" class="rv-sheet__close">Close</button></div><div class="rv-sheet__body"></div>';
    doc.body.appendChild(sheet);
    sheetTitle = sheet.querySelector('.rv-sheet__title'); sheetBody = sheet.querySelector('.rv-sheet__body');
    sheet.querySelector('.rv-sheet__close').addEventListener('click', function () { sheet.close(); });
    sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
    sheet.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href^="#"]')) sheet.close(); });
    sheet.addEventListener('close', function () { doc.documentElement.classList.remove('rds-lock'); });
  }
  function openSheet(title, node) {
    buildSheet(); sheetTitle.textContent = title; sheetBody.innerHTML = ''; sheetBody.appendChild(node);
    sheetBody.scrollTop = 0;
    if (!sheet.open) sheet.showModal();
  }

  /* ---------- contents: pill + sheet ---------- */
  function contents() {
    var src = all('.rds-contents ol a[href^="#"]');
    if (!src.length) src = all('.rds-toc nav a[href^="#"]');
    if (!src.length) src = all('.kt nav a[href^="#"]');
    var items = src.map(function (a) {
      var t = a.getAttribute('data-label') || (a.querySelector('span') || a).textContent;
      t = t.replace(/^\s*\d+[\s .]*/, '').trim();
      return { id: a.getAttribute('href').slice(1), text: t || a.textContent.trim() };
    }).filter(function (i) { return doc.getElementById(i.id); });
    if (items.length < 3) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    var pill = doc.createElement('button'); pill.type = 'button'; pill.className = 'rv-jump';
    pill.setAttribute('aria-haspopup', 'dialog'); pill.setAttribute('aria-label', 'Contents');
    pill.innerHTML = '<span class="rv-jump__n"></span><span class="rv-jump__t"></span>';
    doc.body.appendChild(pill);
    var nEl = pill.firstChild, tEl = pill.lastChild, cur = 0, ticking = false;

    function where() {
      var line = win.innerHeight * 0.35, at = 0;
      for (var i = 0; i < items.length; i++) { if (doc.getElementById(items[i].id).getBoundingClientRect().top < line) at = i; }
      return at;
    }
    function update() {
      ticking = false;
      cur = where();
      nEl.textContent = pad(cur + 1) + ' / ' + pad(items.length);
      tEl.textContent = items[cur].text;
      var first = doc.getElementById(items[0].id), ft = doc.querySelector('.rds-footer'), y = win.pageYOffset;
      var past = first && first.getBoundingClientRect().top < win.innerHeight * 0.5;
      var atFooter = ft && ft.getBoundingClientRect().top < win.innerHeight - 40;
      pill.classList.toggle('is-on', !!past && !atFooter && y > 300);
    }
    win.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    win.addEventListener('resize', update); update();

    pill.addEventListener('click', function () {
      cur = where();
      var ol = doc.createElement('ol'); ol.className = 'rv-toclist';
      ol.innerHTML = items.map(function (it, i) {
        return '<li><a href="#' + it.id + '"' + (i === cur ? ' aria-current="true"' : '') + '><b>' + pad(i + 1) + '</b><span></span></a></li>';
      }).join('');
      all('li a span', ol).forEach(function (s, i) { s.textContent = items[i].text; });
      openSheet('On this page', ol);
      var c = ol.querySelector('[aria-current]'); if (c) c.scrollIntoView({ block: 'center' });
    });
  }

  /* ---------- footnotes by tap ---------- */
  function footnotes() {
    win.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('sup a[href^="#"], a.rds-fn[href^="#"], .rds-fn a[href^="#"]');
      if (!a || !touchy()) return;
      var id = a.getAttribute('href').slice(1), li = id && doc.getElementById(id);
      if (!li || li.tagName !== 'LI') return;               // only notes/sources, not section anchors
      e.preventDefault(); e.stopPropagation();
      var box = doc.createElement('div'); box.className = 'rv-note-read';
      var clone = li.cloneNode(true);
      all('.rds-back, a[href^="#cite"], a[href^="#fn"], a[href^="#r"]', clone).forEach(function (b) { b.remove(); });
      all('[id]', clone).forEach(function (n) { n.removeAttribute('id'); });
      var b = clone.querySelector('b:first-child'); if (b && /^\d+$/.test(b.textContent.trim())) b.remove();
      box.innerHTML = clone.innerHTML;
      var go = doc.createElement('a'); go.className = 'rv-note-go'; go.href = '#' + id; go.textContent = 'Jump to the list';
      box.appendChild(go);
      var n = a.textContent.replace(/[\[\]\s]/g, '');
      openSheet((li.closest('.rds-notes') ? 'Note ' : 'Source ') + n, box);
    }, true);
  }

  /* ---------- collapsible infobox + contents ---------- */
  function collapse() {
    all('.rds-infobox, .rv-infobox').forEach(function (box) {
      var rows = all('dl > div', box);
      var hidden = rows.length > 3 || box.querySelector('.rds-infobox__art');
      if (!hidden) return;
      box.classList.add('is-collapsible');
      var btn = doc.createElement('button'); btn.type = 'button'; btn.className = 'rv-more'; btn.setAttribute('aria-expanded', 'false');
      var label = function (open) { btn.textContent = open ? 'Show less' : (box.querySelector('.rds-infobox__art') ? 'Show sketch and all facts' : 'Show all ' + rows.length + ' facts'); };
      label(false);
      btn.addEventListener('click', function () {
        var open = box.classList.toggle('is-open'); btn.setAttribute('aria-expanded', open); label(open);
        if (!open) { var r = box.getBoundingClientRect(); if (r.top < 0) win.scrollBy(0, r.top - 70); }
      });
      var foot = box.querySelector('.rds-infobox__foot, .rv-infobox__foot');
      box.insertBefore(btn, foot || null);
    });
    if (small()) all('details.rds-contents').forEach(function (d) { d.removeAttribute('open'); });
  }

  /* ---------- study tab bar: keep the current part in view ---------- */
  function studyTabs() {
    var nav = doc.querySelector('nav.ktabs'); if (!nav) return;
    var last = null;
    function follow() {
      var cur = nav.querySelector('a[aria-current="true"]');
      if (cur && cur !== last && mq('(max-width:640px)')) {
        last = cur;
        var x = cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2;
        try { nav.scrollTo({ left: x, behavior: 'smooth' }); } catch (err) { nav.scrollLeft = x; }
      }
    }
    if ('MutationObserver' in win) new MutationObserver(follow).observe(nav, { attributes: true, subtree: true, attributeFilter: ['aria-current'] });
  }

  function init() { bar(); footnotes(); collapse(); contents(); studyTabs(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
