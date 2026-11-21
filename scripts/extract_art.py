#!/usr/bin/env python3
"""Move the big inline drawings out of the HTML into cached files (see DESIGN.md > Loading > Art files).

Home, the studies index and every study carry 400-500 KB of hand-drawn SVG each. This leaves the <svg> element in place (same tag,
same attributes, same viewBox, so layout and styling are unchanged) but empties it and adds data-art="<path>"; the shapes live in
assets/art/art-<hash>.svg, a complete svg file named by the hash of its content, served immutable. assets/rds/art.js fetches a file
when its figure is within about 1.5 screens of the viewport and puts the shapes back, then fires `rv:art` on the svg so the scripts
that prepare figures (rds.js, scrollfx.js) can pick it up.

Idempotent and safe after the art generators (topanga_art.py, fallbrook_art.py, home_panels.py ...): they write full inline svgs
between their markers, and this turns those back into placeholders. Art files no page names any more are deleted.
Run: python3 scripts/extract_art.py          rewrite pages, write assets/art/
     python3 scripts/extract_art.py --check  exit 1 if a page still carries a big inline drawing or an art file is missing/orphaned
Skipped: svgs under 20 KB, and the home hero comparison (above the fold: it is the LCP, so it stays inline)."""
import re, sys, hashlib, pathlib, os
root = pathlib.Path(__file__).resolve().parent.parent
ART = root / 'assets' / 'art'
MIN = 20000
PAGES = ['index.html', 'studies/index.html'] + sorted(p.relative_to(root).as_posix() for p in (root / 'studies').glob('*/index.html'))
TAG = re.compile(r'<(/?)svg\b[^>]*>', re.I)

def find_svgs(html):
    """Top-level <svg>...</svg> spans as (start, open_tag_end, close_start, end)."""
    out, depth, start, open_end = [], 0, 0, 0
    for m in TAG.finditer(html):
        if m.group(1):
            depth -= 1
            if depth == 0: out.append((start, open_end, m.start(), m.end()))
        else:
            if depth == 0: start, open_end = m.start(), m.end()
            depth += 1
    return out

def rel_to_art(page):
    return '../' * (len(pathlib.PurePosixPath(page).parts) - 1) + 'assets/art/'

def process(page, write, keep):
    p = root / page; html = p.read_text(encoding='utf-8'); out, last, n = [], 0, 0
    for s, oe, cs, e in find_svgs(html):
        inner = html[oe:cs]; tag = html[s:oe]
        before = html[:s]; in_compare = before.rfind('<figure class="rv-compare"') > before.rfind('</figure>')
        if 'data-art=' in tag:
            keep.add(re.search(r'data-art="[^"]*?([^/"]+\.svg)"', tag).group(1)); continue
        if len(inner) < MIN or in_compare: continue
        h = hashlib.sha1(inner.encode()).hexdigest()[:10]; name = f'art-{h}.svg'; keep.add(name)
        if write:
            ART.mkdir(parents=True, exist_ok=True)
            vb = re.search(r'viewBox="([^"]*)"', tag)
            (ART / name).write_text('<svg xmlns="http://www.w3.org/2000/svg"' + (f' viewBox="{vb.group(1)}"' if vb else '') + '>' + inner + '</svg>', encoding='utf-8')
        new = tag[:-1] + f' data-art="{rel_to_art(page)}{name}">' + '</svg>'
        out.append(html[last:s] + new); last = e; n += 1
    out.append(html[last:])
    res = ''.join(out)
    if 'data-art="' in res and 'assets/rds/art.js' not in res:   # the loader, deferred, after the page's other scripts
        up = '../' * (len(pathlib.PurePosixPath(page).parts) - 1)
        res = res.replace('</body>', f'<script src="{up}assets/rds/art.js" defer></script>\n</body>', 1)
        n += 1
    return res, n, html

def main():
    check = '--check' in sys.argv; keep, stale = set(), []
    for page in PAGES:
        if not (root / page).exists(): continue
        new, n, old = process(page, not check, keep)
        if n:
            stale.append(page)
            if not check: (root / page).write_text(new, encoding='utf-8')
    if not check:
        for f in ART.glob('art-*.svg') if ART.exists() else []:
            if f.name not in keep: f.unlink()
        print(f'extracted art from {len(stale)} pages, {len(keep)} art files')
    else:
        missing = [k for k in keep if not (ART / k).exists()]
        orphan = [f.name for f in ART.glob('art-*.svg') if f.name not in keep] if ART.exists() else []
        if stale or missing or orphan:
            print('inline art not extracted in: ' + ', '.join(stale) + (' missing: ' + ', '.join(missing) if missing else '') + (' orphaned: ' + ', '.join(orphan) if orphan else '') + ' (run python3 scripts/extract_art.py)'); sys.exit(1)
if __name__ == '__main__': main()
