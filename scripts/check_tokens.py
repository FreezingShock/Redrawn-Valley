#!/usr/bin/env python3
"""Flags hardcoded design values outside assets/rds/tokens.css (see DESIGN.md > Tokens).
Categories per CSS/JS file: colour (hex, rgb(a), hsl), font (a font-family or quoted family in font shorthand), z-index (number), motion (a time or
cubic-bezier inside transition/animation), easing (cubic-bezier anywhere). Existing leftovers are recorded in scripts/token-baseline.json and may only
go down: a count above the baseline is an error, so new code has to use tokens. A line containing `token-ok` is skipped (use for art that must not
change with the theme, with the reason beside it). Files not in the baseline must be clean.
Run: python3 scripts/check_tokens.py [--update-baseline]  (check.py runs it)"""
import re, sys, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
BASE = root / 'scripts' / 'token-baseline.json'
SKIP = {'assets/rds/tokens.css', 'assets/rds/theme.css'}   # tokens live in tokens.css; theme.css holds generated dark data-URI art  # assets/fonts/ holds generated @font-face rules, which must name the family
URL = re.compile(r'url\((?:"[^"]*"|\'[^\']*\'|[^)]*)\)')
PAT = {
    'colour': re.compile(r'#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3}(?:[0-9a-fA-F]{2})?)?\b|\b(?:rgba?|hsla?)\(\s*\d'),
    'font': re.compile(r'font-family\s*:\s*(?!var\(|inherit|initial|unset)|font\s*:[^;{}]*["\'][A-Za-z]'),
    'z-index': re.compile(r'z-index\s*:\s*-?\d'),
    'easing': re.compile(r'cubic-bezier\('),
}
MOTION = re.compile(r'(?<![\w-])(?:transition|animation)(?:-duration|-delay)?\s*:\s*([^;{}]+)')
TIME = re.compile(r'(?<![\w.-])\d*\.?\d+m?s(?![\w-])')

def scan(path):
    text = path.read_text(encoding='utf-8', errors='ignore'); counts = {}
    if path.suffix == '.js':   # in JS only colour and easing literals (injected CSS and SVG strings) are checked
        cats = ('colour', 'easing'); lines = text.split('\n')
    else:
        cats = tuple(PAT); lines = re.sub(r'/\*.*?\*/', lambda m: '\n' * m.group(0).count('\n'), text, flags=re.S).split('\n')
    for ln in lines:
        if 'token-ok' in ln: continue
        ln = URL.sub('url()', ln)
        if path.suffix == '.js': ln = re.sub(r'//.*$', '', ln)
        for c in cats:
            n = len(PAT[c].findall(ln))
            if n: counts[c] = counts.get(c, 0) + n
        if path.suffix == '.css':
            for m in MOTION.finditer(ln):
                v = re.sub(r'var\([^)]*\)', '', m.group(1)); v = re.sub(r'calc\([^)]*\)', '', v)
                n = len([t for t in TIME.findall(v) if t not in ('0s', '0ms')])
                if n: counts['motion'] = counts.get('motion', 0) + n
    return counts

def run(update=False):
    now = {}
    for f in sorted(list((root / 'assets').rglob('*.css')) + list((root / 'assets').rglob('*.js'))):
        rel = f.relative_to(root).as_posix()
        if rel in SKIP or '/icons/' in rel or rel.startswith('assets/fonts/'): continue
        c = scan(f)
        if c: now[rel] = c
    if update: BASE.write_text(json.dumps(now, indent=1, sort_keys=True) + '\n'); print('wrote scripts/token-baseline.json'); return [], []
    base = json.loads(BASE.read_text()) if BASE.exists() else {}
    errors, warns = [], []
    for rel, c in now.items():
        for cat, n in c.items():
            b = base.get(rel, {}).get(cat, 0)
            if n > b: errors.append(f'{rel}: {n - b} new hardcoded {cat} value(s) ({n} now, baseline {b}); use a token from assets/rds/tokens.css or add one there')
            elif n < b: warns.append(f'{rel}: hardcoded {cat} values dropped {b} -> {n}; run python3 scripts/check_tokens.py --update-baseline')
    for rel, c in base.items():
        for cat, b in c.items():
            if rel not in now or cat not in now[rel]:
                if rel not in now and not (root / rel).exists(): continue
                warns.append(f'{rel}: no hardcoded {cat} left (baseline {b}); run python3 scripts/check_tokens.py --update-baseline')
    return errors, warns

if __name__ == '__main__':
    e, w = run('--update-baseline' in sys.argv)
    for x in w: print('warn ', x)
    for x in e: print('ERROR', x)
    sys.exit(1 if e else 0)
