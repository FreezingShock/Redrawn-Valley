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
var canScroll = function (el) { return el ? (el.scrollHeight > el.clientHeight + 2) : (doc.documentElement.scrollHeight > window.innerHeight + 2); };
var tocs = doc.querySelectorAll('[data-toc]');
for (var t = 0; t < tocs.length; t++) {
var toc = tocs[t], sc = toc.closest('[data-scroller]');
var top0 = sc ? sc.getBoundingClientRect().top : 0, h = sc ? sc.clientHeight : window.innerHeight;
var links = toc.querySelectorAll('a[href^="#"]'), act = 0, can = canScroll(sc), lockAt = -1;
for (var i = 0; i < links.length; i++) {
var el = doc.getElementById(links[i].getAttribute('href').slice(1));
if (el && can && el.getBoundingClientRect().top - top0 < h * 0.4) act = i;
if (self._lock && Date.now() < self._lock.until && links[i].getAttribute('href') === self._lock.href) lockAt = i;
}
if (can && links.length) { var atEnd = sc ? (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) : (window.innerHeight + window.pageYOffset >= doc.documentElement.scrollHeight - 2); if (atEnd && toc.hasAttribute('data-toc-end')) act = links.length - 1; }
if (lockAt >= 0) act = lockAt;
for (var j = 0; j < links.length; j++) { if (j === act) links[j].setAttribute('aria-current', 'true'); else links[j].removeAttribute('aria-current'); }
var cnt = toc.querySelector('[data-toc-count]');
if (cnt) { var txt = (act < 9 ? '0' : '') + (act + 1); if (cnt.textContent !== txt) cnt.textContent = txt; }
var nm = toc.querySelector('[data-toc-name]');
if (nm && links[act]) { var lab = links[act].getAttribute('data-label') || ''; if (nm.textContent !== lab) nm.textContent = lab; }
toc.style.setProperty('--p', links.length > 1 ? act / (links.length - 1) : 0);
}
var scs = doc.querySelectorAll('[data-scrolly]'), page = canScroll(null);
for (var s = 0; s < scs.length; s++) {
var steps = scs[s].querySelectorAll('[data-step]'), a = 0;
for (var k = 0; k < steps.length; k++) { var n = +steps[k].getAttribute('data-step'); if (!page || steps[k].getBoundingClientRect().top < window.innerHeight * 0.62) a = Math.max(a, n); }
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
