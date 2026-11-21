#!/usr/bin/env python3
"""Fingerprint the site's shared CSS and JS so Vercel can cache them forever (see vercel.json).

Every <link href> / <script src> that points at a file under assets/ (and fonts/) gets `?v=<hash>`, where the hash is the
content of that file plus every asset it loads (a loader like loops.js pulls in loops.css, so editing the css changes the
loader's hash, and the loader hands its own `?v=` on to the files it fetches; see DESIGN.md > Tokens and caching).

Run: python3 scripts/assetver.py          rewrite the HTML in place (regen.py runs this last)
     python3 scripts/assetver.py --check  exit 1 if any reference is missing a current ?v= (writes nothing)
Other generators import strip() so their --check ignores the stamps."""
import re, sys, hashlib, pathlib
from common import ROOT as root, html_files
EXTS = ('.css', '.js')
STAMP = re.compile(r'(\.(?:css|js))\?v=[0-9a-f]{8,12}')
REF = re.compile(r'''((?:src|href)=["'])([^"'#?]*?)(\.(?:css|js))(\?[^"'#]*)?(["'])''')

def strip(text):
    """Remove stamps so generated output can be compared with the stamped copy on disk."""
    return STAMP.sub(r'\1', text)

def asset_files():
    return {p.name: p for d in ('assets', 'fonts') if (root / d).is_dir() for p in (root / d).rglob('*') if p.suffix in EXTS}

_files = None; _deps = {}; _hash = {}
def files():
    global _files
    if _files is None: _files = asset_files()
    return _files

def deps(p):
    """Other asset files this file names (a quoted or url() mention of their file name), so loaders hash with their children."""
    if p in _deps: return _deps[p]
    text = p.read_text(encoding='utf-8', errors='ignore'); out = set()
    for name, q in files().items():
        if q != p and re.search(r'(?<![\w.-])' + re.escape(name) + r'(?![\w-])', text): out.add(q)
    _deps[p] = out; return out

def digest(p, seen=()):
    if p in _hash: return _hash[p]
    h = hashlib.sha1(p.read_bytes())
    for d in sorted(deps(p) - set(seen) - {p}, key=lambda x: x.as_posix()):
        h.update(digest(d, seen + (p,)).encode())
    r = h.hexdigest()[:10]
    if not seen: _hash[p] = r
    return r

def stamp(html, page):
    def sub(m):
        pre, stem, ext, _q, post = m.groups()
        target = (root / stem.lstrip('/') if stem.startswith('/') else page.parent / stem).with_name(pathlib.PurePath(stem).name + ext)
        try: target = target.resolve()
        except OSError: return m.group(0)
        if not target.is_file() or root not in target.parents or target.relative_to(root).parts[0] not in ('assets', 'fonts'): return m.group(0)
        return f'{pre}{stem}{ext}?v={digest(target)}{post}'
    return REF.sub(sub, html)

def main():
    check = '--check' in sys.argv; stale = []
    for f in html_files():
        old = f.read_text(encoding='utf-8'); new = stamp(strip(old), f)
        if new != old:
            stale.append(f.relative_to(root).as_posix())
            if not check: f.write_text(new, encoding='utf-8')
    if check:
        if stale: print('asset fingerprints stale in ' + str(len(stale)) + ' files: run python3 scripts/assetver.py'); sys.exit(1)
    else: print(f'fingerprinted assets in {len(stale)} changed html files')
if __name__ == '__main__': main()
