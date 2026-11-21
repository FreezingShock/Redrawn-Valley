/* Type lab page script: body switch, wobble, font shuffle, your-own-text pen, timing readouts. Needs write.js. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* body text switch */
  var main = $('#main');
  $$('.tl-controls [data-body]').forEach(function (b) {
    b.addEventListener('click', function () {
      main.setAttribute('data-body', b.getAttribute('data-body'));
      $$('.tl-controls [data-body]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
    });
  });

  /* wobble buttons: data-boil="#target" data-speed="fast|slow|off" */
  $$('button[data-boil]').forEach(function (b) {
    b.addEventListener('click', function () {
      var sel = b.getAttribute('data-boil'), sp = b.getAttribute('data-speed'), t = $(sel);
      if (!t) return;
      if (sp === 'off') t.removeAttribute('data-boil'); else t.setAttribute('data-boil', sp);
      $$('button[data-boil="' + sel + '"]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
    });
  });

  /* font shuffle */
  var sh = $('#shuffle'), shb = $('#shuffle-btn');
  if (sh && shb) {
    var fams = sh.getAttribute('data-shuffle').split(','), i = 0, timer = null;
    var show = function () { sh.style.fontFamily = "'" + fams[i % fams.length] + "',cursive"; sh.style.fontWeight = fams[i % fams.length] === 'Amatic SC' ? 700 : ''; };
    var run = function (on) {
      clearInterval(timer);
      shb.textContent = on ? 'Pause' : 'Play'; shb.setAttribute('aria-pressed', on ? 'false' : 'true');
      if (on) timer = setInterval(function () { i++; show(); }, 1100);
    };
    show();
    run(!(reduce && reduce.matches));
    shb.addEventListener('click', function () { run(shb.textContent === 'Play'); });
  }

  /* pen with your own text */
  var txt = $('#pen-text'), fnt = $('#pen-font'), pens = [$('#pen-fast'), $('#pen-slow')], t0;
  function rebuild() {
    pens.forEach(function (el, k) {
      if (!el) return;
      el._rvw = null; el.innerHTML = '';
      el.setAttribute('data-text', txt.value || ' '); el.setAttribute('data-font', fnt.value);
      var c = RVWrite.mount(el, { autoplay: false });
      if (c) c.play(k ? 'slow' : 'fast');
    });
  }
  if (txt && fnt) {
    var go = function () { clearTimeout(t0); t0 = setTimeout(rebuild, 450); };
    txt.addEventListener('input', go); fnt.addEventListener('change', rebuild);
  }

  /* readouts: "33 characters in 2.4 s" */
  document.addEventListener('rv-write-end', function (e) {
    var el = e.target, c = el._rvw; if (!c || !el.id) return;
    var out = $('[data-readout="#' + el.id + '"]');
    if (!out || !c.duration) return;
    var s = c.duration / 1000, n = c.chars || el.textContent.length;
    out.textContent = n + ' characters in ' + s.toFixed(1) + ' s (' + (n / s).toFixed(1) + ' per second)';
  }, true);
})();
