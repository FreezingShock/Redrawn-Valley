#!/usr/bin/env python3
"""Site sanity check: every local href/src/@import resolves to a file, and every in-page #anchor has a target.
Run: python3 scripts/check.py   (exit 1 on problems; placeholder brackets only warn)."""
import re, sys, pathlib
from html.parser import HTMLParser
root = pathlib.Path(__file__).resolve().parent.parent
errors, warns = [], []

class P(HTMLParser):
    def __init__(s): super().__init__(); s.refs=[]; s.ids=set(); s.anchors=[]
    def handle_starttag(s, tag, attrs):
        a = dict(attrs)
        if a.get('id'): s.ids.add(a['id'])
        for k in ('href', 'src'):
            v = a.get(k)
            if not v or re.match(r'(https?:|mailto:|tel:|data:|//)', v): continue
            (s.anchors if v.startswith('#') else s.refs).append(v)

for f in sorted(root.rglob('*.html')):
    if '.git' in f.parts or 'node_modules' in f.parts: continue
    text = f.read_text(encoding='utf-8'); p = P(); p.feed(text)
    rel = f.relative_to(root)
    for v in p.refs:
        path = v.split('#')[0].split('?')[0]
        if path and not (f.parent / path).resolve().exists(): errors.append(f'{rel}: missing {v}')
    for a in p.anchors:
        if a != '#' and a[1:] not in p.ids: errors.append(f'{rel}: no element with id {a[1:]}')
    left = re.findall(r'\[(?:[A-Z][A-Z ]{3,}|Last name|DATE)[^\]]*\]', re.sub(r'<(script|style|svg).*?</\1>', '', text, flags=re.S))
    for m in sorted(set(left)): warns.append(f'{rel}: placeholder {m}')
for f in (root / 'assets').rglob('*.css'):
    for m in re.findall(r"@import url\('?(?!https?:)([^')]+)", f.read_text(encoding='utf-8')):
        if not (f.parent / m).exists(): errors.append(f'{f.relative_to(root)}: missing import {m}')
for w in warns: print('warn ', w)
for e in errors: print('ERROR', e)
print(f'{len(errors)} errors, {len(warns)} warnings'); sys.exit(1 if errors else 0)
