/* Redrawn Design System: jump to a citation from the Sources library.
   A link like  guide/bioswale/#cite=note-elmer.3&src=landscapeperformance-elmer  means "the 3rd marker on this page that cites
   list item #note-elmer". This script finds that marker (same rules as scripts/build_sources.py), scrolls to it, highlights the
   sentence it closes, and shows a small bar to step through the other uses of the same source or go back to the library.
   Loaded by site-shell.js on every page. Reduced motion: no smooth scroll, no pulse; the highlight stays. */
(function () {
  var doc = document;
  function all(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }
  function parseHash() {
    var m = /^#cite=([^.&]+)\.(\d+)(?:&src=([\w-]+))?/.exec(decodeURIComponent(location.hash || ''));
    return m ? { id: m[1], k: +m[2], src: m[3] || '' } : null;
  }
  var MARK = 'sup,.rv-fn,.rds-fn,.rv-cite,.rds-cite';
  var BLOCK = /^(P|LI|DD|DT|TD|TH|BLOCKQUOTE|FIGCAPTION|SUMMARY)$/;
  function inList(el) { return !!el.closest('ol.rds-notes,.rv-sources,#sources,#notes'); }
  function block(el) { var p = el.parentElement; while (p && !BLOCK.test(p.tagName)) p = p.parentElement; return p || el.closest('div') || el.parentElement; }

  /* markers for one source, in document order (links in sup/fn/cite wrappers, plus plain "[n]" in pull-quote cites) */
  function markers(id) {
    var li = doc.getElementById(id); if (!li) return [];
    var num = /(\d+)$/.exec(id), out = [];
    all('a[href="#' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]').forEach(function (a) {
      if (inList(a) || !a.closest(MARK)) return; out.push(a);
    });
    if (num) all('blockquote > cite').forEach(function (c) {
      var m = /\[(\d+)\]/.exec(c.textContent); if (m && m[1] === num[1] && !inList(c)) out.push(c);
    });
    out.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    return out;
  }

  var ABBR = 'sept jan feb mar apr jun jul aug oct nov dec dr mr mrs ms st no vs inc co corp ca blvd ave etc al fig sec u.s e.g i.e p.m a.m approx est ft sq jr sr dept mt vol pp ed'.split(' ');
  function abbr(body, i) {
    if (body.charAt(i) !== '.') return false;
    var m = /([A-Za-z.]+)$/.exec(body.slice(0, i)), w = (m ? m[1] : '').toLowerCase().replace(/^\.+|\.+$/g, '');
    return ABBR.indexOf(w) > -1 || (w.length === 1 && /[A-Za-z]/.test(body.charAt(i - 1)));
  }
  /* DOM Range over the sentence the marker closes */
  function sentenceRange(marker) {
    var blk = block(marker); if (!blk || !doc.createRange) return null;
    var w = doc.createTreeWalker(blk, NodeFilter.SHOW_TEXT, null), nodes = [], n, text = '', markPos = -1;
    function isMarkerText(t) { return t.parentElement && t.parentElement.closest(MARK) && !marker.contains(t); }
    while ((n = w.nextNode())) {
      if (marker.contains(n)) { if (markPos < 0) markPos = text.length; continue; }
      if (isMarkerText(n) || n.parentElement.closest('script,style,svg')) continue;
      nodes.push({ n: n, s: text.length }); text += n.nodeValue;
    }
    if (markPos < 0) return null;
    var pre = text.slice(0, markPos), endsSentence = /[.!?]["”’)]?\s*$/.test(pre);
    var body = endsSentence ? pre.replace(/\s+$/, '').slice(0, -1) : pre, start = 0, re = /[.!?]["”’)]?\s+(?=[A-Z“"(])/g, m;
    while ((m = re.exec(body))) { if (!abbr(body, m.index)) start = m.index + m[0].length; }
    var end = markPos;
    if (!endsSentence) { var after = text.slice(markPos), e = /[.!?]["”’)]?(?=\s|$)/.exec(after); end = markPos + (e ? e.index + e[0].length : after.length); }
    while (start < end && /\s/.test(text[start])) start++;
    function pos(off, atEnd) {
      for (var i = 0; i < nodes.length; i++) { var x = nodes[i], l = x.n.nodeValue.length; if (off < x.s + l || (atEnd && off === x.s + l && i === nodes.length - 1)) return [x.n, Math.max(0, off - x.s)]; }
      var last = nodes[nodes.length - 1]; return last ? [last.n, last.n.nodeValue.length] : null;
    }
    var a = pos(start), b = pos(end, true); if (!a || !b) return null;
    var r = doc.createRange(); try { r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]); } catch (e2) { return null; } return r;
  }


  var st = doc.createElement('style');
  st.textContent = [
    '::highlight(rv-cite-hit){background:var(--brick-tint,#f0d9cc);color:var(--ink,#1f1d1a)}',
    '.rv-cite-block.rv-cite-fallback{background:var(--brick-tint,#f0d9cc);box-shadow:-8px 0 0 var(--brick-tint,#f0d9cc),8px 0 0 var(--brick-tint,#f0d9cc);border-radius:4px;animation:rvCiteIn .7s ease-out}',
    '.rv-cite-block.rv-cite-has-range{animation:rvCiteBlock 1.6s ease-out}',
    '.rv-cite-hit{background:var(--brick,#9c3d24)!important;color:var(--paper-raised,#fbf8f1)!important;border-radius:4px;padding:0 3px;outline:2px solid var(--brick,#9c3d24);outline-offset:2px;animation:rvCitePulse 1.1s ease-out 2}',
    '.rv-cite-hit a{color:inherit!important}',
    '@keyframes rvCitePulse{0%{outline-offset:2px;outline-color:var(--brick,#9c3d24)}70%{outline-offset:9px;outline-color:transparent}100%{outline-offset:2px;outline-color:var(--brick,#9c3d24)}}',
    '@keyframes rvCiteIn{from{background:transparent}to{background:var(--brick-tint,#f0d9cc)}}',
    '@keyframes rvCiteBlock{0%{box-shadow:0 0 0 0 transparent}20%{box-shadow:-8px 0 0 var(--brick-tint,#f0d9cc),8px 0 0 var(--brick-tint,#f0d9cc);background:var(--brick-tint,#f0d9cc)}100%{box-shadow:-8px 0 0 transparent,8px 0 0 transparent;background:transparent}}',
    '.rv-cite-bar{position:fixed;left:50%;bottom:20px;z-index:60;display:flex;align-items:center;gap:12px;max-width:min(680px,calc(100vw - 24px));padding:8px 8px 8px 14px;border:1.5px solid var(--ink,#1f1d1a);border-radius:14px 18px 14px 20px;background:var(--paper-raised,#fbf8f1);color:var(--ink,#1f1d1a);box-shadow:3px 4px 0 var(--ink,#1f1d1a);transform:translate(-50%,24px);opacity:0;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .25s}',
    '.rv-cite-bar.is-in{transform:translate(-50%,0);opacity:1}',
    '.rv-cite-bar__pen{flex:none;width:14px;height:14px;border-radius:50%;background:var(--brick,#9c3d24)}',
    '.rv-cite-bar__txt{display:flex;flex-direction:column;min-width:0;font:600 13px/1.25 var(--font-sans,system-ui)}',
    '.rv-cite-bar__txt b{font:500 11px/1.2 var(--font-mono,monospace);letter-spacing:.04em;text-transform:uppercase;color:var(--brick,#9c3d24)}',
    '.rv-cite-bar__txt i{font-style:normal;font-weight:500;color:var(--ink-muted,#5c564c);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.rv-cite-bar a,.rv-cite-bar button{flex:none;font:600 13px/1 var(--font-sans,system-ui);color:var(--ink,#1f1d1a);text-decoration:none;padding:10px 12px;min-height:40px;display:inline-flex;align-items:center;border:1px solid var(--ink,#1f1d1a);border-radius:999px;background:transparent;cursor:pointer}',
    '.rv-cite-bar a:hover,.rv-cite-bar button:hover{background:var(--paper-sunk,#ece5d6)}',
    '.rv-cite-bar a:focus-visible,.rv-cite-bar button:focus-visible{outline:2px solid var(--brick,#9c3d24);outline-offset:2px}',
    '.rv-cite-bar__step{display:flex;gap:4px}.rv-cite-bar__step a{padding:10px 14px;font-size:18px}',
    '.rv-cite-bar .rv-cite-bar__back{background:var(--ink,#1f1d1a);color:var(--paper-raised,#fbf8f1)}',
    '.rv-cite-bar .rv-cite-bar__back:hover{background:var(--brick,#9c3d24)}',
    '.rv-cite-bar .rv-cite-bar__x{border-color:transparent;font-size:20px;padding:10px 12px}',
    '@media(max-width:640px){.rv-cite-bar{bottom:calc(76px + env(safe-area-inset-bottom));flex-wrap:wrap;gap:8px;padding:10px;width:calc(100vw - 24px)}.rv-cite-bar__txt{flex:1 1 calc(100% - 80px)}.rv-cite-bar__list{display:none!important}}',
    '@media(prefers-reduced-motion:reduce){.rv-cite-hit,.rv-cite-block{animation:none!important}.rv-cite-bar{transition:none}}'
  ].join('\n');
  doc.head.appendChild(st);

  var bar = null;
  function clear() {
    if (window.CSS && CSS.highlights) CSS.highlights.delete('rv-cite-hit');
    all('.rv-cite-hit,.rv-cite-block').forEach(function (e) { e.classList.remove('rv-cite-hit', 'rv-cite-block'); });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function go(h, instant) {
    clear(); if (bar) { bar.remove(); bar = null; }
    if (!h) return;
    var list = markers(h.id), m = list[h.k - 1] || null, li = doc.getElementById(h.id);
    if (!li) return;
    /* the marker can sit in a part of the page that is hidden at this width (the infobox on phones): use the next visible one */
    function shown(x) { return x && x.getClientRects().length > 0; }
    if (m && !shown(m)) {
      var alt = 0, i;
      for (i = 1; i <= list.length && !alt; i++) { var j = (h.k - 1 + i) % list.length; if (shown(list[j])) alt = j + 1; }
      if (alt) { h = { id: h.id, k: alt, src: h.src }; m = list[alt - 1]; } else m = null;
    }
    var target = m ? (m.tagName === 'CITE' ? m.parentElement : m) : li;
    var d = target.closest('details'); if (d) d.open = true;
    var blk = m ? block(m) : li;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* leave room for the sticky header */
    var nav = doc.querySelector('.rds-nav'), off = (nav ? nav.getBoundingClientRect().height : 0) + 96;
    var y = (blk || target).getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce || instant ? 'auto' : 'smooth' });
    blk.classList.add('rv-cite-block');
    if (m) m.classList.add('rv-cite-hit');
    var r = m && m.tagName !== 'CITE' ? sentenceRange(m) : null;
    if (r && window.CSS && CSS.highlights && window.Highlight) { CSS.highlights.set('rv-cite-hit', new Highlight(r)); blk.classList.add('rv-cite-has-range'); }
    else blk.classList.add('rv-cite-fallback');
    showBar(h, list.length, li);
  }

  function showBar(h, n, li) {
    var title = (li.querySelector('cite') || li).textContent.replace(/[↩\s]+$/, '').replace(/\s+/g, ' ').trim();
    if (title.length > 90) title = title.slice(0, 88).replace(/\s\S*$/, '') + '…';
    var base = location.pathname + location.search;
    function link(k) { return base + '#cite=' + encodeURIComponent(h.id) + '.' + k + (h.src ? '&src=' + h.src : ''); }
    var siteRoot = (function () { var s = doc.querySelector('script[src*="site-shell.js"]'); return s ? new URL('../', new URL(s.getAttribute('src'), location.href)) : null; })();
    var backHref = h.src && siteRoot ? new URL('sources/#' + h.src, siteRoot).href : '';
    bar = doc.createElement('div'); bar.className = 'rv-cite-bar'; bar.setAttribute('role', 'status');
    bar.innerHTML = '<span class="rv-cite-bar__pen" aria-hidden="true"></span><span class="rv-cite-bar__txt"><b>Source' + (n > 1 ? ' · use ' + h.k + ' of ' + n : '') + '</b><i>' + esc(title) + '</i></span>' +
      (n > 1 ? '<span class="rv-cite-bar__step"><a href="' + link(h.k > 1 ? h.k - 1 : n) + '" aria-label="Previous use of this source on this page">‹</a><a href="' + link(h.k < n ? h.k + 1 : 1) + '" aria-label="Next use of this source on this page">›</a></span>' : '') +
      '<a class="rv-cite-bar__list" href="#' + li.id + '" data-keep>Entry</a>' +
      (backHref ? '<a class="rv-cite-bar__back" href="' + esc(backHref) + '">All sources</a>' : '') +
      '<button type="button" class="rv-cite-bar__x" aria-label="Clear highlight">×</button>';
    doc.body.appendChild(bar);
    bar.querySelector('.rv-cite-bar__x').addEventListener('click', function () { clear(); bar.remove(); bar = null; });
    var ent = bar.querySelector('.rv-cite-bar__list');
    ent.addEventListener('click', function () { clear(); });
    requestAnimationFrame(function () { bar && bar.classList.add('is-in'); });
  }

  function run(instant) { var h = parseHash(); if (h) go(h, instant); }
  window.addEventListener('hashchange', function () { run(false); });
  if (doc.readyState === 'complete') setTimeout(function () { run(true); }, 60);
  else window.addEventListener('load', function () { setTimeout(function () { run(true); }, 260); });
  /* a second pass once reveals / layout settle */
  window.addEventListener('load', function () { setTimeout(function () { var h = parseHash(); if (h) { var m = markers(h.id)[h.k - 1]; if (m) { var r = m.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) go(h, true); } } }, 1400); });
})();
