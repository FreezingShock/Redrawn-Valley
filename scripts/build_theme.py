#!/usr/bin/env python3
"""Writes the dark-theme copies of the CSS data-URI art (hand-drawn rules, wavy band edges, highlighter) into
assets/rds/theme.css, between the BEGIN/END markers. Colours inside a data: URI cannot read CSS variables, so each
one is redrawn here with its dark-theme colour. Run after changing any url("data:image/svg+xml...") in the CSS:
    python3 scripts/build_theme.py          (rewrite)     python3 scripts/build_theme.py --check   (exit 1 if stale)
Colour map is the dark token set in assets/rds/tokens.css."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
DARK = {'8a8170': '857663', 'd9d0bd': '3a2e22', '1f1d1a': 'f3e8d4', '9c3d24': '66c3c0', 'ece5d6': '100c08', 'f6f1e7': '17120d',
        '2f4a3a': '9cc3a8', 'dfe6d8': '1a2a21', '35506b': '86aed2'}
# (file, text just before the url, selector or ':root', property, color overrides for this one)
RULES = [
 ('skin.css', '--rv-rule:', ':root', '--rv-rule', {}),
 ('skin.css', '--rv-rule-soft:', ':root', '--rv-rule-soft', {}),
 ('skin.css', '--rv-rule-ink:', ':root', '--rv-rule-ink', {}),
 ('skin.css', '--rv-rule-brick:', ':root', '--rv-rule-brick', {}),
 ('skin.css', '.rds-band-sunk::before{top:-27px;background-image:', '.rds-band-sunk::before', 'background-image', {}),
 ('skin.css', '.rds-band-sunk::after{bottom:-1px;background-image:', '.rds-band-sunk::after', 'background-image', {}),
 ('skin.css', '.rds-footer::before{top:-27px;background-image:', '.rds-footer::before', 'background-image', {'1f1d1a': '0b0806'}),
 ('skin.css', '.rds-eyebrow::before{content:"";flex:none;width:26px;height:8px;background:', '.rds-eyebrow::before', 'background-image', {}),
 ('skin.css', '.rv-divider{height:22px;margin:var(--space-12) auto;width:200px;background:', '.rv-divider', 'background-image', {}),
 ('skin.css', '.rds-empty::before{content:"";display:block;width:120px;height:96px;margin:0 auto var(--space-3);background:', '.rds-empty::before', 'background-image', {}),
 ('skin.css', '.rds-nav::after{content:"";position:absolute;left:0;right:0;top:calc(100% - 1px);height:14px;z-index:-1;pointer-events:none;transition:filter var(--dur-base) ease,opacity var(--dur-fast) ease;\n  background:', '.rds-nav::after', 'background-image', {}),
 ('rds.css', '.rds-mark{background:', '.rds-mark', 'background-image', {}),
 ('rds.css', '.rds-circle{background:', '.rds-circle', 'background-image', {}),
 ('flow.css', '.fl-on :is(.rds-prose,.rds-article__body,.rv-body) p a:not(.rds-btn),.fl-on .rds-link{background-image:', '.fl-on :is(.rds-prose,.rds-article__body,.rv-body) p a:not(.rds-btn),.fl-on .rds-link', 'background-image', {}),
 ('search.css', '.rvs-label span::after{content:"";width:48px;height:5px;background:', '.rvs-label span::after', 'background-image', {}),
]
URL = re.compile(r'url\("data:image/svg\+xml,[^"]*"\)')
def build():
    out = []
    for f, before, sel, prop, over in RULES:
        t = (root / 'assets' / 'rds' / f).read_text(encoding='utf-8')
        i = t.find(before)
        if i < 0: raise SystemExit('anchor not found: ' + f + ' ' + before[:50])
        m = URL.search(t, i + len(before) - 1)
        u = m.group(0)
        pal = dict(DARK); pal.update(over)
        u = re.sub(r'%23([0-9a-fA-F]{6})', lambda k: '%23' + pal.get(k.group(1).lower(), k.group(1)), u)
        u = re.sub(r"#([0-9a-fA-F]{6})\b", lambda k: '#' + pal.get(k.group(1).lower(), k.group(1)), u)
        out.append(':root[data-theme="dark"] ' + (sel if sel != ':root' else '').strip() + '{' + prop + ':' + u + '}' if sel != ':root'
                   else ':root[data-theme="dark"]{' + prop + ':' + u + '}')
    return '\n'.join(out)
B, E = '/* BEGIN generated: dark data-URI art (scripts/build_theme.py) */', '/* END generated */'
p = root / 'assets' / 'rds' / 'theme.css'
s = p.read_text(encoding='utf-8')
new = B + '\n' + build() + '\n' + E
if B in s: s2 = re.sub(re.escape(B) + '.*?' + re.escape(E), lambda m: new, s, flags=re.S)
else: s2 = s.rstrip('\n') + '\n\n' + new + '\n'
if '--check' in sys.argv: sys.exit(0 if s2 == s else 1)
p.write_text(s2, encoding='utf-8'); print('theme.css: dark data-URI art rewritten (%d rules)' % len(RULES))
