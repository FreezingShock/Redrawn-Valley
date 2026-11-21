#!/usr/bin/env python3
"""Every page that loads the design tokens must also load the theme switch: assets/rds/theme.js (first thing in <head>,
so the saved theme is on <html> before first paint) and assets/rds/theme.css (after skin.css). Without them the
sun/moon button shows both icons and does nothing. Adds whatever is missing; `--check` only reports. Runs in regen.py
before assetver.py, which stamps the ?v= fingerprints."""
import re
from common import ROOT, CHECK, html_files

JS = re.compile(r'<script[^>]*assets/rds/theme\.js')
CSS = re.compile(r'<link[^>]*assets/rds/theme\.css')
TOK = re.compile(r'^[ \t]*<link[^>]*assets/rds/tokens\.css[^>]*>', re.M)
SKIN = re.compile(r'^[ \t]*<link[^>]*assets/rds/skin\.css[^>]*>[ \t]*\n', re.M)
VIEWPORT = re.compile(r'<meta[^>]*name="viewport"[^>]*>[ \t]*\n')


def fix(text, up):
    if not TOK.search(text): return text
    if not CSS.search(text):
        link = f'<link rel="stylesheet" href="{up}assets/rds/theme.css">\n'
        m = SKIN.search(text) or re.search(r'</head>', text)
        text = text[:m.end() if SKIN.search(text) else m.start()] + link + text[m.end() if SKIN.search(text) else m.start():]
    if not JS.search(text):
        tag = f'<script src="{up}assets/rds/theme.js"></script>\n'
        m = VIEWPORT.search(text)
        text = text[:m.end()] + tag + text[m.end():] if m else text.replace('<head>\n', '<head>\n' + tag, 1)
    return text


stale = []
for f in html_files():
    t = f.read_text(encoding='utf-8')
    up = '../' * (len(f.relative_to(ROOT).parts) - 1)
    n = fix(t, up)
    if n != t:
        stale.append(f.relative_to(ROOT).as_posix())
        if not CHECK: f.write_text(n, encoding='utf-8')
print(f'ensure_theme: {len(stale)} page(s) ' + ('missing the theme switch' if CHECK else 'fixed'))
for s in stale: print('  ' + s)
raise SystemExit(1 if CHECK and stale else 0)
