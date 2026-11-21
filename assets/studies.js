/* Page behavior: scroll reveals, the contents rail, tabs and the staged drawings. */
class DCLogic {}
class Component extends DCLogic {
componentDidMount() {
var self = this;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

this._io = new IntersectionObserver(function (entries) {
entries.forEach(function (e) {
if (e.isIntersecting) { e.target.setAttribute('data-in', ''); self._io.unobserve(e.target); }
});
}, { threshold: 0.01, rootMargin: '0px 0px -8% 0px' });
this._scan = function () {
var root = document.querySelector('[data-rds-root]');
if (!root) return;
if (!root.hasAttribute('data-rds-js')) root.setAttribute('data-rds-js', '');
var els = root.querySelectorAll('.rds-view,.rds-split,.rds-draw');
for (var i = 0; i < els.length; i++) {
if (!els[i].hasAttribute('data-in') && !els[i].__rdsWatched) { els[i].__rdsWatched = true; self._io.observe(els[i]); }
}
};

this._ui = function () {
var doc = document;
var canScroll = function (el) { if (el) return el.scrollHeight > el.clientHeight + 2; var now = performance.now(); if (!self._cs || now - self._cs.t > 600) var hh = doc.documentElement.scrollHeight; self._cs = { t: now, h: hh, v: hh > window.innerHeight + 2 }; return self._cs.v; }; /* page height read is cached for 0.6 s: reading scrollHeight every frame forces a layout */
/* Page-level positions are measured once per 0.6 s and compared with scrollY, so a scroll frame does not force a layout per link. */
var topOf = function (el, scEl) { if (scEl) return el.getBoundingClientRect().top; var now = performance.now(); if (el.__at === undefined || now - el.__att > 600) { el.__at = el.getBoundingClientRect().top + window.pageYOffset; el.__att = now; } return el.__at - window.pageYOffset; };
var tocs = doc.querySelectorAll('[data-toc]');
[].forEach.call(tocs, function (t) { [].forEach.call(t.querySelectorAll('a'), function (a, i) { a.style.setProperty('--i', i); }); t.classList.add('kt-ready'); });
for (var t = 0; t < tocs.length; t++) {
var toc = tocs[t], sc = toc.closest('[data-scroller]');
var top0 = sc ? sc.getBoundingClientRect().top : 0, h = sc ? sc.clientHeight : window.innerHeight;
var links = toc.querySelectorAll('a[href^="#"]'), act = 0, can = canScroll(sc), lockAt = -1;
for (var i = 0; i < links.length; i++) {
var el = doc.getElementById(links[i].getAttribute('href').slice(1));
if (el && can && topOf(el, sc) - top0 < h * 0.4) act = i;
if (self._lock && Date.now() < self._lock.until && links[i].getAttribute('href') === self._lock.href) lockAt = i;
}
if (can && links.length) { var atEnd = sc ? (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) : (window.innerHeight + window.pageYOffset >= (self._cs ? self._cs.h : doc.documentElement.scrollHeight) - 2); if (atEnd && toc.hasAttribute('data-toc-end')) act = links.length - 1; }
if (lockAt >= 0) act = lockAt;
for (var j = 0; j < links.length; j++) { var on = j === act, has = links[j].hasAttribute('aria-current'); if (on && !has) links[j].setAttribute('aria-current', 'true'); else if (!on && has) links[j].removeAttribute('aria-current'); }
var cnt = toc.querySelector('[data-toc-count]');
if (cnt) { var txt = (act < 9 ? '0' : '') + (act + 1); if (cnt.textContent !== txt) cnt.textContent = txt; }
var nm = toc.querySelector('[data-toc-name]');
if (nm && links[act]) { var lab = links[act].getAttribute('data-label') || ''; if (nm.textContent !== lab) nm.textContent = lab; }
var pv = links.length > 1 ? act / (links.length - 1) : 0; if (toc.__p !== pv) { toc.__p = pv; toc.style.setProperty('--p', pv); }
}
var scs = doc.querySelectorAll('[data-scrolly]'), page = canScroll(null);
for (var s = 0; s < scs.length; s++) {
var steps = scs[s].querySelectorAll('[data-step]'), a = 0;
for (var k = 0; k < steps.length; k++) { var n = +steps[k].getAttribute('data-step'); if (!page || topOf(steps[k], null) < window.innerHeight * 0.62) a = Math.max(a, n); }
if (scs[s].hasAttribute('data-pin')) a = +scs[s].getAttribute('data-pin');
if (scs[s].getAttribute('data-st') !== String(a)) scs[s].setAttribute('data-st', a);
var lyr = scs[s].querySelectorAll('.lyr');
for (var q = 0; q < lyr.length; q++) { var ln = +(/\bl(\d+)\b/.exec(lyr[q].getAttribute('class')) || [0, 0])[1]; lyr[q].classList.toggle('is-on', ln <= a); }
for (var m = 0; m < steps.length; m++) { if (!page || +steps[m].getAttribute('data-step') === a) steps[m].setAttribute('data-on', ''); else steps[m].removeAttribute('data-on'); }
var lab2 = scs[s].querySelector('[data-stage-name]'), cur = scs[s].querySelector('[data-step="' + a + '"]');
if (lab2 && cur) { var tx = cur.getAttribute('data-label') || ''; if (lab2.textContent !== tx) lab2.textContent = tx; }
}
};
this._onScroll = function () { if (self._tick) return; self._tick = true; requestAnimationFrame(function () { self._tick = false; self._ui(); }); };
window.addEventListener('scroll', this._onScroll, true);
window.addEventListener('resize', this._onScroll);
this._onClick = function (e) {
var b = e.target.closest ? e.target.closest('[data-tab]') : null; if (!b) return;
var box = b.closest('[data-tabs]'); if (!box) return;
var key = b.getAttribute('data-tab'), bs = box.querySelectorAll('[data-tab]'), ps = box.querySelectorAll('[data-panel]');
for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-selected', bs[i].getAttribute('data-tab') === key ? 'true' : 'false');
for (var j = 0; j < ps.length; j++) ps[j].hidden = ps[j].getAttribute('data-panel') !== key;
if (self._scan) self._scan();
};
document.addEventListener('click', this._onClick);
this._onJump = function (e) {
if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
var a = e.target.closest ? e.target.closest('a[href^="#"]') : null; if (!a) return;
var href = a.getAttribute('href'); if (href.length < 2) return;
var el = document.getElementById(href.slice(1)); if (!el) return;
e.preventDefault(); e.stopPropagation();
var sc = el.closest('[data-scroller]'), calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var y, off;
if (sc) {
var bar = sc.querySelector('.kd'); off = (bar ? bar.offsetHeight : 0) + 12;
y = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - off;
y = Math.max(0, Math.min(y, sc.scrollHeight - sc.clientHeight));
} else {
var hd = document.getElementById('top'); off = (hd && hd !== el ? hd.offsetHeight : 0) + 20;
y = el === hd ? 0 : el.getBoundingClientRect().top + window.pageYOffset - off;
y = Math.max(0, Math.min(y, document.documentElement.scrollHeight - window.innerHeight));
}
self._lock = { href: href, until: Date.now() + 1400 };
try { (sc || window).scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' }); } catch (err) { if (sc) sc.scrollTop = y; else window.scrollTo(0, y); }
self._ui();
clearTimeout(self._lockT); self._lockT = setTimeout(function () { self._lock = null; self._ui(); }, 1450);
};
document.addEventListener('click', this._onJump, true);
this._ui();
this._uiTimers = [setTimeout(this._ui, 300), setTimeout(this._ui, 1200)];

this._scan();
this._timers = [setTimeout(this._scan, 400), setTimeout(this._scan, 1600)];
if ('MutationObserver' in window) {
this._mo = new MutationObserver(function () { clearTimeout(self._deb); self._deb = setTimeout(self._scan, 120); });
this._mo.observe(document.body, { childList: true, subtree: true });
}
}
componentWillUnmount() {
if (this._io) this._io.disconnect();
if (this._mo) this._mo.disconnect();
(this._timers || []).forEach(clearTimeout);
clearTimeout(this._deb);
}
renderVals() {
return {};
}
}
(function () { var page = new Component(); page.props = {}; page.componentDidMount(); })();

/* Part bar behaviour: compacts once you have scrolled, shows the study name only after the page title has gone,
   and slides one underline between the part links as the current part changes. */
(function () {
  var bar = document.getElementById('top'), nav = bar && bar.querySelector('nav[data-toc]');
  if (!bar || !nav || !bar.classList.contains('rv-study-bar')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var h1 = document.querySelector('.rv-article-head h1'), ink = document.createElement('span');
  ink.className = 'rv-study-bar__ink'; ink.setAttribute('aria-hidden', 'true'); nav.appendChild(ink);
  function place() {
    var cur = nav.querySelector('a[aria-current="true"]:not(.rv-study-bar__brand)');
    if (!cur) { ink.style.opacity = '0'; return; }
    ink.style.opacity = '1';
    ink.style.transform = 'translateX(' + (cur.offsetLeft + (cur.offsetWidth - Math.min(cur.offsetWidth, 40)) / 2) + 'px)';
    ink.style.width = Math.min(cur.offsetWidth, 40) + 'px';
    if (nav.scrollWidth > nav.clientWidth) { var want = cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2; nav.scrollTo({ left: want, behavior: reduce ? 'auto' : 'smooth' }); }
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      bar.classList.toggle('is-compact', window.pageYOffset > 80);
      var gone = h1 ? h1.getBoundingClientRect().bottom < 120 : window.pageYOffset > 300;
      bar.classList.toggle('has-title', gone);
    });
  }
  new MutationObserver(place).observe(nav, { attributes: true, attributeFilter: ['aria-current'], subtree: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  place(); onScroll();
})();
