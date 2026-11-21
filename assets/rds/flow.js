/* Redrawn Design System: flow. Page-to-page motion. Plain script, no dependencies. One synchronous tag in <head> of every page:
   <script src="…/assets/rds/flow.js"></script>
   It paints a paper sheet before the first frame (so nothing flashes), then plays one of these, drawn in code:
     intro    first visit of a session and every reload: the logo is drawn, the wordmark is written, the sheet lifts as a grid of tiles.
     link     following a link covers the page with a sheet, the next page lifts it. Six kinds, chosen from where you clicked and where you
              are going, seeded so repeats differ and never the same kind twice in a row:
                turn     previous / next: a lined page sweeps across (direction follows the arrow) and keeps going on the next page
                shuffle  index pages and lists: a stack of cards drops in and is thrown off, seeded tilt and side
                sketch   cards and panels: the card itself (cloned) grows to fill the page, the next page opens from its own title
                bloom    header, footer and tab bar: an ink wash grows from the click and shrinks back to it
                tiles    jumping to another section: paper tiles grow from the click point
                fade     small hops inside a section: a quick paper dissolve
              The sheet is a top-layer popover, so it also covers the search dialog. Links are prefetched on hover, focus and touch.
     write-on headings: the page title is written in letter by letter on the Wobble axes; section headings write in as they arrive,
              each with a pencil squiggle that draws underneath.
   Also: a pencil dab where you click, and hand-drawn rules that draw on. Styles are in flow.css (loaded by this script); lengths, tilt and
   edges are --flow-* tokens in tokens.css. Same-page #links glide (eased, any input cancels) and the heading you land on gets an ink sweep. Force a kind on a link with data-flow="turn:1" (direction after the colon); opt out with
   data-no-flow. Off for prefers-reduced-motion, embed frames (?embed=1, iframes), print and ?noflow. Nothing breaks without it; a 3 second
   failsafe always removes the sheet.
   API: window.RVFlow = { intro(), wipe(url, kind?), preview(kind, a, b, x, y, dir), write(el), kinds, enabled, speed }. See DESIGN.md "Flow". */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, me = doc.currentScript;
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var embedded = /[?&]embed=1(&|$)/.test(location.search);
  var off = mq.matches || /[?&]noflow(&|$)/.test(location.search);
  var API = window.RVFlow = { enabled: !off, speed: 1 };
  if (off || embedded) { API.enabled = false; return; }

  var BASE = me && me.src ? me.src.replace(/flow\.js(\?.*)?$/, '') : '';
  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} } };
  var NAVKEY = 'rv-flow-nav', SEENKEY = 'rv-flow-seen';
  var SECTIONS = { studies: 'Studies', guide: 'Field guide', notes: 'Notes', lab: 'Lab notes', patterns: 'Pattern sheet', icons: 'Icon set', fonts: 'Type lab' };

  /* ---------- timing (ms), scaled by RVFlow.speed ---------- */
  function T(ms) { return ms / (API.speed || 1); }

  /* ---------- critical style and stylesheet ---------- */
  var cs = doc.createElement('style');
  cs.textContent = 'html.fl-cover::before{content:"";position:fixed;inset:0;z-index:2147483000;background:#f6f1e7;pointer-events:none}html[data-theme=dark].fl-cover::before{background:#17120d}' +
    '@media print{html.fl-cover::before{display:none}}';
  (doc.head || root).appendChild(cs);
  var css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = BASE + 'flow.css' + ((me && me.src && me.src.match(/\?.*$/)) || [''])[0];
  (doc.head || root).appendChild(css);

  /* ---------- what to play ---------- */
  var navEntry = null;
  try { navEntry = performance.getEntriesByType('navigation')[0]; } catch (e) {}
  var navType = navEntry ? navEntry.type : 'navigate';
  var flag = null; try { flag = JSON.parse(store.get(NAVKEY) || 'null'); } catch (e) {}
  store.del(NAVKEY);
  var fresh = flag && Date.now() - flag.t < 9000;
  var mode = 'none';
  if (navType === 'back_forward') mode = 'none';
  else if (fresh && navType !== 'reload') mode = 'wipe';
  else if (navType === 'reload' || !store.get(SEENKEY)) mode = 'intro';
  else mode = 'wipe';
  store.set(SEENKEY, '1');
  root.classList.add('fl-on');
  if (mode !== 'none') root.classList.add('fl-cover');
  var failsafe = setTimeout(function () { root.classList.remove('fl-cover'); var s = doc.getElementById('fl-stage'); if (s) kill(s); }, 3000);

  /* ---------- helpers ---------- */
  function el(tag, cls, html) { var n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function all(sel, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(sel)); }
  function ready(fn) { doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', fn) : fn(); }
  function rng(seed) { var a = 0; for (var i = 0; i < seed.length; i++) a = (Math.imul(a ^ seed.charCodeAt(i), 2654435761) >>> 0); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function kill(s) { if (s.matches && s.matches(':popover-open')) { try { s.hidePopover(); } catch (e) {} } if (s.parentNode) s.parentNode.removeChild(s); root.classList.remove('fl-cover'); }
  function humanize(slug) { return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function labelFor(url) {
    var u; try { u = new URL(url, location.href); } catch (e) { return { a: 'Redrawn Valley', b: '' }; }
    var parts = u.pathname.split('/').filter(function (p) { return p && !/^index\.html?$/.test(p); });
    var i = 0; while (i < parts.length && !SECTIONS[parts[i]] && i < 3) i++;
    if (i >= parts.length || !SECTIONS[parts[i]]) { return { a: parts.length ? humanize(parts[parts.length - 1].replace(/\.html?$/, '')) : 'Redrawn Valley', b: parts.length ? '' : 'seeing the valley anew' }; }
    var rest = parts.slice(i + 1); return { a: SECTIONS[parts[i]], b: rest.length ? humanize(rest[rest.length - 1].replace(/\.html?$/, '')) : '' };
  }

  /* ---------- the sheet: a grid of paper tiles ---------- */
  var ACCENTS = ['#9c3d24', '#2f4a3a', '#35506b', '#be9661', '#7ba3c0', '#b17c83', '#4f9b60', '#7c849f'];
  function shell() {
    var s = el('div', 'fl-stage'); s.id = 'fl-stage'; s.setAttribute('aria-hidden', 'true');
    if (s.popover === undefined) { s.style.zIndex = 2147483001; } else { s.setAttribute('popover', 'manual'); }   // token-ok: no-popover fallback, the same layer as --z-flow-top
    doc.body.appendChild(s);
    if (s.popover !== undefined) { try { s.showPopover(); } catch (e) {} }
    return s;
  }
  function fillTiles(s, seed) {
    var vw = innerWidth, vh = innerHeight, size = vw < 600 ? 72 : 104;
    var cols = Math.ceil(vw / size), rows = Math.ceil(vh / size), r = rng(seed || 'flow');
    s.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)'; s.style.gridTemplateRows = 'repeat(' + rows + ',1fr)';
    var tiles = [];
    for (var i = 0; i < cols * rows; i++) {
      var t = el('i', 'fl-t'), roll = r();
      if (roll < 0.17) { t.className += ' fl-t--a fl-t--' + (r() < .5 ? 'c' : 's'); t.style.setProperty('--a', ACCENTS[Math.floor(r() * ACCENTS.length)]); }
      else if (roll < 0.3) t.className += ' fl-t--h';
      t._c = i % cols; t._r = Math.floor(i / cols); s.appendChild(t); tiles.push(t);
    }
    s._tiles = tiles; s._cols = cols; s._rows = rows;
  }
  function buildStage(seed) { var s = shell(); fillTiles(s, seed); return s; }
  function dist(t, cols, rows, ox, oy) { var dx = (t._c + .5) / cols - ox, dy = (t._r + .5) / rows - oy; return Math.sqrt(dx * dx * 2.2 + dy * dy); }
  function animate(node, frames, opt) { try { return node.animate(frames, opt); } catch (e) { return null; } }

  /* tiles grow over the page (cover) or shrink away from it (reveal); the origin is a fraction of the viewport */
  function tiles(s, dir, ox, oy, ms) {
    var spread = ms * 0.62, max = 0, list = s._tiles, anims = [];
    list.forEach(function (t) { t._d = dist(t, s._cols, s._rows, ox, oy); if (t._d > max) max = t._d; });
    var done = new Promise(function (res) {
      var left = list.length;
      list.forEach(function (t) {
        var d = (t._d / max) * spread, acc = t.classList.contains('fl-t--a');
        var from = dir === 'cover' ? { transform: 'scale(0) rotate(' + (acc ? -90 : -12) + 'deg)', opacity: 1 } : { transform: 'scale(1.03) rotate(0deg)', opacity: 1 };
        var to = dir === 'cover' ? { transform: 'scale(1.03) rotate(0deg)', opacity: 1 } : { transform: 'scale(0) rotate(' + (acc ? 90 : 14) + 'deg)', opacity: 1 };
        var a = animate(t, [from, to], { duration: ms - spread, delay: d, easing: dir === 'cover' ? 'cubic-bezier(.3,1.3,.5,1)' : 'cubic-bezier(.6,0,.4,1)', fill: 'both' });
        if (!a) { t.style.transform = to.transform; if (--left === 0) res(); return; }
        anims.push(a); a.onfinish = function () { if (--left === 0) res(); };
      });
      if (!list.length) res();
    });
    done.cancel = function () { anims.forEach(function (a) { a.finish(); }); };
    return done;
  }

  /* ---------- writing letters on ---------- */
  function wrapChars(node, state, nested) {
    var top = !nested;
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = doc.createDocumentFragment(), words = n.nodeValue.split(/(\s+)/);
        words.forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(doc.createTextNode(' ')); return; }
          var ws = el('span', 'fl-w'); ws.setAttribute('aria-hidden', 'true');
          for (var i = 0; i < w.length; i++) { var c = el('span', 'fl-c'); c.textContent = w.charAt(i); c.style.setProperty('--c', state.n++); ws.appendChild(c); }
          frag.appendChild(ws);
        });
        /* a heading's own text goes in one wrapper: some headings are flex rows (number, text, anchor), where loose word spans would
           each become a flex item, never wrap and push the page wider than a phone */
        if (top) { var box = el('span', 'fl-t'); box.appendChild(frag); frag = box; }
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && !/^(svg|img|br|script|style)$/i.test(n.nodeName) && !n.classList.contains('fl-w')) wrapChars(n, state, true);
    });
  }
  var SQUIGGLE = '<svg class="fl-ul__svg" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M2 7C14 3 22 10 36 6S58 3 72 7 96 10 110 5 134 4 148 8s24 2 50-3"/></svg>';
  function prep(h, underline) {
    if (h.dataset.flDone) return false;
    if (h.querySelector('svg,img,picture') || h.textContent.length > 150) return false;
    if (h.hasAttribute('data-rds-split')) { var label = h.getAttribute('aria-label') || h.textContent; h.removeAttribute('data-rds-split'); h.removeAttribute('aria-label'); h.textContent = label.replace(/\s+/g, ' ').trim(); h.classList.remove('is-in'); }
    var txt = h.textContent.replace(/\s+/g, ' ').trim(), st = { n: 0 };
    h.setAttribute('aria-label', txt); wrapChars(h, st);
    h.style.setProperty('--fl-step', Math.min(30, 880 / Math.max(st.n, 1)).toFixed(1) + 'ms');
    h.classList.add('fl-title'); h.dataset.flDone = '1';
    if (underline) { var u = el('span', 'fl-ul fl-ul--' + underline, SQUIGGLE); u.setAttribute('aria-hidden', 'true'); h.appendChild(u); }
    return true;
  }
  function play(h) { h.classList.add('fl-go'); }
  API.write = function (h) { if (!h) return; if (!h.dataset.flDone) prep(h, h.matches('h1,.rds-display,.rds-display-xl') ? 'big' : 'small'); h.classList.remove('fl-go'); void h.offsetWidth; play(h); };

  var after = [];                                   // headings waiting for the sheet to lift
  var lifted = false;
  function lift() { if (lifted) return; lifted = true; root.classList.add('fl-lifted'); after.forEach(play); after = []; try { dispatchEvent(new Event('rvflow:lifted')); } catch (e) {} }
  var TITLES = 'main h1,.rds-article__title,.rds-display-xl,.rds-display';
  var SECTION_H = 'main article h2,.rv-body section>h2,.rds-prose h2,.rds-article__body h2,.rv-sec__head h2,.rds-sechead h2,.rds-seealso h2';
  function headings() {
    var seen = [], io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); if (lifted) play(e.target); else after.push(e.target); } });
    }, { threshold: 0.6 }) : null;
    var top = all(TITLES).filter(function (h) { return !h.closest('.rds-demo,.rds-search,dialog,.fl-stage'); });
    var firstDone = false;
    top.forEach(function (h) {
      var vis = h.getBoundingClientRect().top < innerHeight * 0.9;
      if (!prep(h, h.matches('h1,.rds-article__title,.rds-display-xl') ? 'big' : 'small')) return;
      if (vis) { if (lifted) play(h); else after.push(h); } else if (io) io.observe(h); else play(h);
    });
    all(SECTION_H).forEach(function (h) {
      if (h.closest('.rds-demo,.rds-search,dialog,.fl-stage') || h.dataset.flDone) return;
      if (!prep(h, 'small')) return;
      if (io) io.observe(h); else play(h);
    });
    setTimeout(function () { all('.fl-title:not(.fl-go)').forEach(function (h) { if (h.getBoundingClientRect().top < innerHeight) play(h); }); }, 4500);
  }

  /* ---------- intro (first visit, reload) ---------- */
  var LOGO = '<svg class="fl-logo" viewBox="0 0 32 32" width="96" height="96" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">' +
    '<path pathLength="1" style="stroke:var(--ink)" d="M2.23 15.17C3 14.28 5.19 10.18 6.84 9.81C8.49 9.45 10.61 11.4 12.14 12.98C13.67 14.55 14.69 19.27 16.01 19.27C17.33 19.26 18.61 14.52 20.07 12.94C21.53 11.35 23.15 9.36 24.76 9.74C26.37 10.13 28.89 14.32 29.71 15.23"/>' +
    '<path pathLength="1" style="stroke:var(--brick)" d="M2.19 18.32C2.97 17.37 5.31 13 6.92 12.62C8.52 12.24 10.31 14.38 11.81 16.04C13.3 17.71 14.56 22.57 15.89 22.61C17.23 22.64 18.33 17.93 19.81 16.27C21.3 14.61 23.15 12.35 24.82 12.66C26.49 12.97 29.01 17.23 29.85 18.14"/>' +
    '<path pathLength="1" style="stroke:var(--brick)" d="M16.55 8.84C16.23 8.78 15.1 8.78 14.62 8.45C14.14 8.13 13.87 7.46 13.67 6.89C13.47 6.32 13.23 5.57 13.43 5.03C13.64 4.49 14.34 3.84 14.9 3.65C15.47 3.47 16.22 3.72 16.84 3.92C17.45 4.11 18.28 4.35 18.6 4.84C18.93 5.34 18.98 6.28 18.8 6.88C18.62 7.47 18.06 8.05 17.53 8.41C16.99 8.77 15.89 8.94 15.57 9.05"/></svg>';
  function plate(a, b, withLogo) {
    var p = el('div', 'fl-plate');
    p.innerHTML = (withLogo ? LOGO : '') + '<div class="fl-plate__a"></div>' + (b ? '<div class="fl-plate__b"></div>' : '');
    var A = p.querySelector('.fl-plate__a'), B = p.querySelector('.fl-plate__b');
    A.textContent = a; prep(A, 'big');
    if (B) { B.textContent = b; }
    return p;
  }
  function writeNow(node, budget) { var step = Math.min(34, (budget || 760) / Math.max(node.textContent.length, 1)); node.style.setProperty('--fl-step', T(step) + 'ms'); node.classList.add('fl-go'); }

  function runIntro(s) {
    var p = plate('Redrawn Valley', 'seeing the valley anew', true); s.appendChild(p);
    var A = p.querySelector('.fl-plate__a'), skip = false;
    p.querySelector('.fl-logo').classList.add('is-drawn');
    setTimeout(function () { writeNow(A); }, T(260));
    setTimeout(function () { p.classList.add('has-sub'); }, T(620));
    var done = false;
    /* the sheet never takes pointer input (the page underneath stays usable); a tap anywhere skips ahead instead */
    function finish() {
      if (done) return; done = true; clearTimeout(t); doc.removeEventListener('pointerdown', finish, true);
      p.classList.add('is-out'); var ms = T(620); lift();
      tiles(s, 'reveal', .5, .46, ms).then(function () { kill(s); clearTimeout(failsafe); });
      setTimeout(function () { kill(s); }, ms + T(300));   // animations can stall in a hidden tab; never leave the sheet up
    }
    var t = setTimeout(finish, T(880));
    doc.addEventListener('pointerdown', finish, true);
    return s;
  }
  /* ---------- link transitions: six kinds, one shape ----------
     Each kind builds its layers (make), can sit fully covering (hold), covers (cover) and lifts (lift). The page you leave runs make+cover,
     writes the context to sessionStorage and navigates; the next page runs make+hold, drops its flat paper cover, then lift. Same seed, same
     layers, so the two halves are one move. host() is where the destination name (the plate) is written. */
  var CS = getComputedStyle(root);
  function tv(n, fb) { var v = CS.getPropertyValue(n).trim(); return v || fb; }
  function tn(n, fb) { var x = parseFloat(tv(n, '')); return isNaN(x) ? fb : (/[\d.]ms$/.test(tv(n, '')) ? x : (/[\d.]s$/.test(tv(n, '')) ? x * 1000 : x)); }
  function ease(n, fb) { return tv(n, fb || 'ease-in-out'); }
  var ACC = ['brick', 'moss', 'slate', 'ochre', 'sky', 'rose', 'kelly', 'peri'].map(function (n) { return 'var(--pal-' + n + ')'; });
  function run(n, frames, o) {
    return new Promise(function (res) {
      var a = animate(n, frames, o);
      if (!a) { var last = frames[frames.length - 1]; for (var k in last) if (k !== 'offset' && k !== 'easing') n.style[k] = last[k]; res(); return; }
      a.onfinish = function () { res(); };
    });
  }
  function all2(list) { return Promise.all(list); }
  function px(v) { return v.toFixed(1) + 'px'; }
  function side(r) { return r() < .5 ? -1 : 1; }
  function inset(l, t, r, b, rad) { return 'inset(' + px(t) + ' ' + px(r) + ' ' + px(b) + ' ' + px(l) + ' round ' + (rad || '0px') + ')'; }

  var K = {};
  /* tiles: the original grid, grows from the click */
  K.tiles = {
    make: function (s, c) { fillTiles(s, c.s); s._host = s; },
    hold: function (s) { s._tiles.forEach(function (t) { t.style.transform = 'scale(1.03)'; }); },
    cover: function (s, c, ms) { s._tiles.forEach(function (t) { t.style.transform = 'scale(0)'; }); return tiles(s, 'cover', c.x, c.y, ms); },
    lift: function (s, c, ms) { return tiles(s, 'reveal', c.x, c.y, ms); }
  };
  /* turn: one lined page sweeps across; the next page lets it carry on in the same direction */
  K.turn = {
    make: function (s, c) { var sh = el('i', 'fl-sheet fl-sheet--' + (c.d < 0 ? 'l' : 'r')); s.appendChild(sh); s._sheet = sh; s._host = sh; },
    off: function () { return 100 + tn('--flow-edge', 8); },
    hold: function (s) { s._sheet.style.transform = 'none'; },
    cover: function (s, c, ms) { var d = c.d < 0 ? -1 : 1; return run(s._sheet, [{ transform: 'translateX(' + (d * this.off()) + '%)' }, { transform: 'translateX(0%)' }], { duration: ms, easing: ease('--ease-glide-2'), fill: 'both' }); },
    lift: function (s, c, ms) { var d = c.d < 0 ? -1 : 1; return run(s._sheet, [{ transform: 'translateX(0%)' }, { transform: 'translateX(' + (-d * this.off()) + '%)' }], { duration: ms, easing: ease('--ease-glide'), fill: 'both' }); }
  };
  /* shuffle: a stack of cards drops in, seeded tilt and offset; lifted, each is thrown off to a seeded side */
  K.shuffle = {
    make: function (s, c) {
      var r = rng(c.s), n = Math.max(2, Math.round(tn('--flow-cards', 4))), tilt = tn('--flow-tilt', 5), cards = [];
      for (var i = 0; i < n; i++) {
        var top = i === n - 1, cd = el('i', 'fl-card' + (top ? ' fl-card--top' : ''));
        cd._rot = top ? 0 : (r() * 2 - 1) * tilt; cd._dx = top ? 0 : (r() * 2 - 1) * 4; cd._out = side(r);
        cd.style.setProperty('--tape', ACC[Math.floor(r() * ACC.length)]); cd.style.transform = 'translate(' + cd._dx + '%,0%) rotate(' + cd._rot + 'deg)';
        s.appendChild(cd); cards.push(cd);
      }
      s._cards = cards; s._host = cards[n - 1];
    },
    hold: function () {},
    cover: function (s, c, ms) {
      var n = s._cards.length, st = tn('--stagger', 70), dur = Math.max(ms - st * (n - 1), ms * .5);
      return all2(s._cards.map(function (cd, i) {
        return run(cd, [{ transform: 'translate(' + cd._dx + '%,115%) rotate(' + (cd._rot * 3) + 'deg)' }, { transform: 'translate(' + cd._dx + '%,0%) rotate(' + cd._rot + 'deg)' }], { duration: dur, delay: i * st, easing: ease('--ease-reveal'), fill: 'both' });
      }));
    },
    lift: function (s, c, ms) {
      var n = s._cards.length, st = tn('--stagger', 70), dur = Math.max(ms - st * (n - 1), ms * .5);
      return all2(s._cards.map(function (cd, i) {
        var j = n - 1 - i, up = j % 3 === 2, tx = up ? 0 : cd._out * 125, ty = up ? -125 : -8, rot = cd._rot + (up ? 0 : cd._out * 16);
        return run(cd, [{ transform: 'translate(' + cd._dx + '%,0%) rotate(' + cd._rot + 'deg)' }, { transform: 'translate(' + tx + '%,' + ty + '%) rotate(' + rot + 'deg)' }], { duration: dur, delay: j * st, easing: ease('--ease-glide'), fill: 'both' });
      }));
    }
  };
  /* bloom: an ink wash grows from the click, a tinted rim just ahead of it; lifted, it shrinks back to the same point */
  function radiusFor(c) { var vw = innerWidth, vh = innerHeight, dx = Math.max(c.x, 1 - c.x) * vw, dy = Math.max(c.y, 1 - c.y) * vh; return Math.sqrt(dx * dx + dy * dy) + 4; }
  function circle(c, rad) { return 'circle(' + px(rad) + ' at ' + px(c.x * innerWidth) + ' ' + px(c.y * innerHeight) + ')'; }
  K.bloom = {
    make: function (s, c) {
      var rim = el('i', 'fl-wash fl-wash--rim'), body = el('i', 'fl-wash'); rim.style.setProperty('--rim', ACC[Math.floor(rng(c.s)() * 3)]);
      s.appendChild(rim); s.appendChild(body); s._rim = rim; s._body = body; s._host = body;
    },
    hold: function (s, c) { var f = circle(c, radiusFor(c)); s._rim.style.clipPath = f; s._body.style.clipPath = f; },
    cover: function (s, c, ms) {
      var R = radiusFor(c), st = tn('--stagger', 70), o = { duration: ms, easing: ease('--ease-glide-2'), fill: 'both' };
      return all2([run(s._rim, [{ clipPath: circle(c, 0) }, { clipPath: circle(c, R) }], o), run(s._body, [{ clipPath: circle(c, 0) }, { clipPath: circle(c, R) }], { duration: ms, delay: st, easing: o.easing, fill: 'both' })]);
    },
    lift: function (s, c, ms) {
      var R = radiusFor(c), st = tn('--stagger', 70), o = { duration: ms, easing: ease('--ease-glide'), fill: 'both' };
      return all2([run(s._body, [{ clipPath: circle(c, R) }, { clipPath: circle(c, 0) }], o), run(s._rim, [{ clipPath: circle(c, R) }, { clipPath: circle(c, 0) }], { duration: ms, delay: st, easing: o.easing, fill: 'both' })]);
    }
  };
  /* sketch: the card you pressed (cloned) grows to fill the page; the next page opens from its own title */
  function hole(l, t, r, b) { var w = innerWidth, h = innerHeight; return 'polygon(evenodd,0px 0px,' + px(w) + ' 0px,' + px(w) + ' ' + px(h) + ',0px ' + px(h) + ',0px 0px,' + px(l) + ' ' + px(t) + ',' + px(r) + ' ' + px(t) + ',' + px(r) + ' ' + px(b) + ',' + px(l) + ' ' + px(b) + ',' + px(l) + ' ' + px(t) + ')'; }
  function rectOf(c) { var w = innerWidth, h = innerHeight, r = c.r || [.3, .3, .4, .34]; return { l: r[0] * w, t: r[1] * h, r: (r[0] + r[2]) * w, b: (r[1] + r[3]) * h }; }
  K.sketch = {
    make: function (s, c) {
      var layer = el('i', 'fl-frame'); s.appendChild(layer); s._layer = layer; s._host = layer;
      if (c._el) {
        var rc = c._el.getBoundingClientRect(), cl = c._el.cloneNode(true);
        cl.removeAttribute('id'); cl.setAttribute('aria-hidden', 'true'); cl.setAttribute('tabindex', '-1'); cl.className += ' fl-clone';
        cl.style.cssText = 'position:absolute;margin:0;box-sizing:border-box;pointer-events:none;left:' + px(rc.left) + ';top:' + px(rc.top) + ';width:' + px(rc.width) + ';height:' + px(rc.height);
        layer.appendChild(cl); s._clone = cl;
      }
    },
    hold: function () {},
    cover: function (s, c, ms) {
      var q = rectOf(c), rad = tv('--radius-lg', '16px'), ease_ = ease('--ease-reveal'), w = innerWidth, h = innerHeight;
      var jobs = [run(s._layer, [{ clipPath: inset(q.l, q.t, w - q.r, h - q.b, rad) }, { clipPath: inset(0, 0, 0, 0, '0px') }], { duration: ms, easing: ease_, fill: 'both' })];
      if (s._clone) jobs.push(run(s._clone, [{ opacity: 1 }, { opacity: 0 }], { duration: ms * .75, easing: ease('--ease-linear', 'linear'), fill: 'both' }));
      return all2(jobs);
    },
    lift: function (s, c, ms) {
      var w = innerWidth, h = innerHeight, t = doc.querySelector(TITLES), r = t ? t.getBoundingClientRect() : null, cx = w / 2, cy = h * .3;
      if (r && r.width && r.bottom > 0 && r.top < h) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
      return run(s._layer, [{ clipPath: hole(cx, cy, cx, cy) }, { clipPath: hole(-2, -2, w + 2, h + 2) }], { duration: ms, easing: ease('--ease-glide'), fill: 'both' });
    }
  };
  /* fade: a quick paper dissolve for small hops */
  K.fade = {
    plate: false,
    make: function (s) { var f = el('i', 'fl-flat'); s.appendChild(f); s._flat = f; s._host = f; },
    hold: function () {},
    cover: function (s, c, ms) { return run(s._flat, [{ opacity: 0 }, { opacity: 1 }], { duration: tn('--flow-fade-in', 200), easing: ease('--ease-soft-out', 'ease-out'), fill: 'both' }); },
    lift: function (s, c, ms) { return run(s._flat, [{ opacity: 1 }, { opacity: 0 }], { duration: tn('--flow-fade-out', 280), easing: ease('--ease-soft-in', 'ease-in'), fill: 'both' }); }
  };
  API.kinds = Object.keys(K);
  function lens(k) {
    var cv = tn('--flow-cover', 440), lf = tn('--flow-lift', 580);
    if (k === 'fade') return { cover: tn('--flow-fade-in', 200), lift: tn('--flow-fade-out', 280) };
    if (k === 'turn') return { cover: cv * 1.15, lift: lf };
    return { cover: cv, lift: lf };
  }

  /* ---------- choosing a kind: where you clicked and where you are going, seeded, never the same twice in a row ---------- */
  var LASTKEY = 'rv-flow-last', COUNTKEY = 'rv-flow-n';
  function topSection(path) { var p = path.split('/').filter(function (x) { return x && !/^index\.html?$/.test(x); }); return p.length ? p[0] : ''; }
  function fracX(x) { return Math.min(1, Math.max(0, x / innerWidth)); }
  function fracY(y) { return Math.min(1, Math.max(0, y / innerHeight)); }
  var CHROME = '.rds-nav,.rds-footer,.rv-tabbar,.rv-tab,[data-rv-shell],.rds-crumbs,.rds-skip';
  var LISTS = '.rds-row,.rds-rows,.rv-az,.rv-log,.rds-atlas,.rv-sources-list,.rds-result,.rds-search__list';
  var CARDS = '.rds-card,.rv-way,.rds-panel,.rv-panel,[data-flow-card]';
  function bigBlock(a) {
    var r = a.getBoundingClientRect();
    return r.width >= 160 && r.height >= 110 && r.width <= innerWidth * .96 && r.height <= innerHeight * .9 ? a : null;
  }
  function choose(a, u, e) {
    var n = (parseInt(store.get(COUNTKEY) || '0', 10) || 0) + 1, last = store.get(LASTKEY), r = rng(u.pathname + '|' + n);
    var rect = a.getBoundingClientRect(), key = e.detail === 0;
    var x = key ? fracX(rect.left + rect.width / 2) : fracX(e.clientX), y = key ? fracY(rect.top + rect.height / 2) : fracY(e.clientY);
    var c = { k: 'fade', d: 0, x: x, y: y, s: u.pathname + '|' + n, r: null }, forced = (a.getAttribute('data-flow') || '').split(':');
    var from = topSection(location.pathname), to = topSection(u.pathname), rel = (a.getAttribute('rel') || '').split(/\s+/);
    var pool;
    if (forced[0] && K[forced[0]]) { c.k = forced[0]; c.d = parseInt(forced[1] || '0', 10) || 0; if (c.k === 'turn' && !c.d) c.d = 1; pool = null; }
    else if (rel.indexOf('prev') >= 0 || rel.indexOf('next') >= 0) { c.k = 'turn'; c.d = rel.indexOf('prev') >= 0 ? -1 : 1; pool = null; }
    else if (a.closest(CHROME)) pool = from !== to ? ['bloom', 'tiles', 'bloom'] : ['bloom', 'fade'];
    else {
      var card = a.closest(CARDS) || (a.closest(LISTS) ? null : bigBlock(a));
      if (card) { c._el = card; var cr = card.getBoundingClientRect(); c.r = [cr.left / innerWidth, cr.top / innerHeight, cr.width / innerWidth, cr.height / innerHeight]; pool = ['sketch']; }
      else if (a.closest(LISTS) || (from !== '' && location.pathname.split('/').filter(function (x) { return x && !/^index\.html?$/.test(x); }).length === 1)) pool = from !== to ? ['shuffle', 'tiles'] : ['shuffle', 'fade'];
      else pool = from !== to ? ['tiles', 'bloom', 'shuffle'] : ['fade', 'bloom'];
    }
    if (pool) { var ok = pool.filter(function (k) { return k !== last; }); if (!ok.length) ok = pool; c.k = ok[Math.floor(r() * ok.length)]; }
    if (c.k === 'turn' && !c.d) c.d = 1;
    store.set(COUNTKEY, String(n)); store.set(LASTKEY, c.k);
    return c;
  }

  function runReveal(s) {
    var c = flag && K[flag.k] ? flag : { k: 'fade', x: .5, y: .5, s: 'wipe', d: 0 }, kd = K[c.k], L = lens(c.k);
    kd.make(s, c); kd.hold(s, c);
    var p = null; if (kd.plate !== false) { p = plate(c.a || 'Redrawn Valley', c.b, false); p.classList.add('is-held', 'has-sub'); s._host.appendChild(p); var A = p.querySelector('.fl-plate__a'); A.classList.add('fl-go', 'fl-instant'); }
    s.classList.add('fl-k-' + c.k);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      root.classList.remove('fl-cover');
      if (p) setTimeout(function () { p.classList.add('is-out'); }, T(60));
      setTimeout(lift, T(L.lift * .4));
      kd.lift(s, c, T(L.lift)).then(function () { kill(s); clearTimeout(failsafe); });
      setTimeout(function () { kill(s); }, T(L.lift) + T(500));
    }); });
  }

  /* ---------- following a link: cover, then go ---------- */
  var leaving = false;
  function go(url, c) {
    if (leaving) return; leaving = true;
    var lb = labelFor(url), kd = K[c.k], L = lens(c.k), s = shell();
    c.a = lb.a; c.b = lb.b; s.classList.add('is-leaving', 'fl-k-' + c.k); s.style.pointerEvents = 'auto';
    kd.make(s, c);
    var p = null; if (kd.plate !== false) { p = plate(lb.a, lb.b, false); s._host.appendChild(p); }
    root.classList.add('fl-leave');
    var done = kd.cover(s, c, T(L.cover));
    if (p) setTimeout(function () { p.classList.add('has-sub'); writeNow(p.querySelector('.fl-plate__a'), T(L.cover * .5)); p.classList.add('is-in'); }, T(L.cover * .4));
    store.set(NAVKEY, JSON.stringify({ t: Date.now(), k: c.k, d: c.d, x: c.x, y: c.y, s: c.s, r: c.r, a: lb.a, b: lb.b }));
    done.then(function () { location.href = url; });
    setTimeout(function () { if (leaving) { leaving = false; kill(s); root.classList.remove('fl-leave'); } }, 6500);   // the page never left (blocked, cancelled): put it back
  }
  /* preview: the whole link transition (cover, then lift) without leaving the page; used by the motion lab */
  API.preview = function (kind, a, b, ox, oy, dir) {
    if (doc.getElementById('fl-stage') || leaving) return;
    var c = { k: K[kind] ? kind : 'tiles', d: dir || 1, x: ox == null ? .5 : ox, y: oy == null ? .5 : oy, s: 'preview-' + (Date.now() % 53), r: null }, kd = K[c.k], L = lens(c.k), s = shell();
    s.style.pointerEvents = 'auto'; s.classList.add('fl-k-' + c.k); kd.make(s, c);
    var p = null; if (kd.plate !== false) { p = plate(a || 'Studies', b || '', false); s._host.appendChild(p); }
    kd.cover(s, c, T(L.cover)).then(function () {
      setTimeout(function () { if (p) p.classList.add('is-out'); kd.lift(s, c, T(L.lift)).then(function () { kill(s); }); }, T(420));
    });
    if (p) setTimeout(function () { p.classList.add('has-sub'); writeNow(p.querySelector('.fl-plate__a'), T(L.cover * .5)); p.classList.add('is-in'); }, T(L.cover * .4));
  };
  API.wipe = function (url, kind) { var c = { k: K[kind] ? kind : 'fade', d: kind === 'turn' ? 1 : 0, x: .5, y: .5, s: String(url || location.href), r: null }; go(url || location.href, c); };
  addEventListener('pageshow', function (e) {
    if (e.persisted) { leaving = false; var s = doc.getElementById('fl-stage'); if (s) kill(s); root.classList.remove('fl-leave', 'fl-cover'); }
  });
  function eligible(a) {
    if (!a || !a.href) return null;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-flow') || a.getAttribute('rel') === 'external') return null;
    var u; try { u = new URL(a.href, location.href); } catch (er) { return null; }
    if (!/^(https?|file):$/.test(u.protocol) || u.origin !== location.origin) return null;
    if (u.pathname === location.pathname && u.search === location.search) return null;
    if (/\.(xml|json|pdf|png|jpe?g|svg|webp|txt|zip|csv)$/i.test(u.pathname)) return null;
    return u;
  }

  /* ---------- anchor jumps (from the earlier panel-zoom work): an eased glide, then the heading gets an ink sweep ---------- */
  var gliding = 0;
  function bez(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }   // the --ease-in-out curve
  function landed(t) { t.classList.remove('fl-landed'); void t.offsetWidth; t.classList.add('fl-landed'); if (t.classList.contains('fl-title')) API.write(t); setTimeout(function () { t.classList.remove('fl-landed'); }, tn('--dur-long', 1200)); }
  function jump(e, a, u) {
    if (!u.hash || u.hash === '#' || a.closest('[data-rds-toc],[data-toc],.rds-toc,.rv-tabbar,.rv-sheet,dialog,.rds-search')) return;
    var t = doc.getElementById(decodeURIComponent(u.hash.slice(1))); if (!t) return;
    e.preventDefault();
    var hd = doc.querySelector('[data-rds-nav]'), sm = parseFloat(getComputedStyle(t).scrollMarginTop) || 0;
    var y0 = pageYOffset, y1 = Math.max(0, Math.min(t.getBoundingClientRect().top + y0 - (sm || ((hd ? hd.offsetHeight : 0) + 20)), root.scrollHeight - innerHeight));
    var dist = Math.abs(y1 - y0), ms = T(Math.min(tn('--dur-slower', 900) + 100, tn('--dur-base', 320) + 60 + dist * .22)), t0 = null, run = ++gliding;
    if (dist < 2) { landed(t); return; }
    function step(now) {
      if (run !== gliding) return;
      if (t0 === null) t0 = now;
      var k = Math.min(1, (now - t0) / ms); scrollTo(0, y0 + (y1 - y0) * bez(k));
      if (k < 1) requestAnimationFrame(step);
      else { try { history.pushState(null, '', u.hash); } catch (er) {} t.setAttribute('tabindex', t.getAttribute('tabindex') || '-1'); try { t.focus({ preventScroll: true }); } catch (er) {} landed(t); }
    }
    requestAnimationFrame(step);
  }
  ['wheel', 'touchstart', 'keydown'].forEach(function (n) { addEventListener(n, function () { gliding++; }, { passive: true }); });   // any input takes the scroll back

  doc.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var u = eligible(a);
    if (!u) { try { var h = new URL(a.href, location.href); if (h.origin === location.origin && h.pathname === location.pathname && h.search === location.search) jump(e, a, h); } catch (er) {} return; }
    e.preventDefault();
    go(u.href, choose(a, u, e));
  });
  /* prefetch: warm the next page when a link is hovered, focused or touched, so the cover is the only wait */
  var warmed = {}, conn = navigator.connection || {};
  var lean = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  function warm(e) {
    if (lean) return;
    var a = e.target.closest && e.target.closest('a[href]'), u = a && eligible(a); if (!u || warmed[u.pathname]) return;
    warmed[u.pathname] = 1; var l = el('link'); l.rel = 'prefetch'; l.as = 'document'; l.href = u.href; doc.head.appendChild(l);
  }
  doc.addEventListener('pointerover', function (e) { if (e.pointerType !== 'touch') warm(e); }, { passive: true });
  doc.addEventListener('touchstart', warm, { passive: true });
  doc.addEventListener('focusin', warm);

  API.intro = function () {
    if (doc.getElementById('fl-stage')) return;
    lifted = false; root.classList.remove('fl-lifted'); root.classList.add('fl-cover');
    var s = buildStage('intro-' + Date.now() % 97); s._tiles.forEach(function (t) { t.style.transform = 'scale(1.03)'; });
    requestAnimationFrame(function () { root.classList.remove('fl-cover'); runIntro(s); });
    all('.fl-title').forEach(function (h) { h.classList.remove('fl-go'); after.push(h); });
    failsafe = setTimeout(function () { kill(s); }, 3000);
  };

  /* ---------- pencil dab on click ---------- */
  var DAB = ['#9c3d24', '#2f4a3a', '#35506b'], dabN = 0;
  function dab(x, y) {
    var c = DAB[dabN++ % 3], ticks = '', n = 7, k;
    for (k = 0; k < n; k++) { var an = (k / n) * Math.PI * 2 + (dabN % 2) * .3, r1 = 13, r2 = 21 + (k % 2) * 5; ticks += '<path pathLength="1" d="M' + (30 + Math.cos(an) * r1).toFixed(1) + ' ' + (30 + Math.sin(an) * r1).toFixed(1) + 'L' + (30 + Math.cos(an) * r2).toFixed(1) + ' ' + (30 + Math.sin(an) * r2).toFixed(1) + '"/>'; }
    var d = el('div', 'fl-dab', '<svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path pathLength="1" d="M30 14C40 13 47 21 46 30S38 46 29 46 13 39 14 30 21 15 31 14"/>' + ticks + '</svg>');
    d.style.left = x + 'px'; d.style.top = y + 'px'; doc.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, T(760));
  }
  doc.addEventListener('pointerdown', function (e) {
    if (e.button || leaving || !root.classList.contains('fl-lifted') && mode !== 'none') return;
    if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable],dialog[open],.rds-zoom,[data-rv-compare]')) return;
    dab(e.clientX, e.clientY);
  }, { passive: true });

  /* ---------- rules that draw on, figures that get crop marks ---------- */
  function sketchy() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('fl-in'); io.unobserve(e.target); } }); }, { threshold: 0.4 });
    all('hr,.rds-rule,.rds-figure,.rds-decision,.rds-callout,.rds-facts,.rds-demo').forEach(function (n) { if (n.closest('.fl-stage,dialog')) return; n.classList.add('fl-sk'); io.observe(n); });
  }

  /* ---------- go ---------- */
  ready(function () {
    var s = null;
    if (mode === 'intro') { s = buildStage('intro-' + (Date.now() % 97)); runIntro(s); root.classList.remove('fl-cover'); }
    else if (mode === 'wipe') { s = shell(); runReveal(s); }
    else lift();
    headings(); sketchy();
    if (!s) lift();
  });
})();
