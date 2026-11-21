#!/usr/bin/env python3
"""Draws the Redrawn icon set. Run: python3 scripts/build_icons.py

Source of truth for every icon. Each icon is a list of strokes on a 24px grid, written as plain points; this script
roughens them (seeded, so output is stable) into wobbly hand-drawn paths and writes:
  assets/rds/icons/icons.svg    sprite of <symbol id="i-NAME"> (24x24) plus i-logo (32x32)
  assets/rds/icons/logo.svg     the mark on its own, palette hex values
  assets/rds/icons/favicon.svg  the mark on a paper tile
  assets/rds/icons/names.json   list of icon names and groups (the gallery page reads it)
Stroke kinds: 'p' polyline with sharp corners, 'c' smooth curve through points, 'z' closed polyline,
'zc' closed smooth curve, 'o' circle (cx, cy, r). Add t=1 to also lay a tinted, slightly misregistered fill under it.
Layers: ink strokes use currentColor; accent strokes use --icon-accent; tints use --icon-tint (see rds.css).
"""
import json, math, pathlib, random

OUT = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'rds' / 'icons'

def rot(pts, deg, c=(12, 12)):
    a = math.radians(deg); ca, sa = math.cos(a), math.sin(a)
    return [(c[0] + (x - c[0]) * ca - (y - c[1]) * sa, c[1] + (x - c[0]) * sa + (y - c[1]) * ca) for x, y in pts]

def S(kind, pts, accent=False, t=False): return dict(k=kind, p=pts, a=accent, t=t)
def P(*pts, **kw): return S('p', list(pts), **kw)
def C(*pts, **kw): return S('c', list(pts), **kw)
def Z(*pts, **kw): return S('z', list(pts), **kw)
def ZC(*pts, **kw): return S('zc', list(pts), **kw)
def O(cx, cy, r, **kw): return S('o', [(cx, cy, r)], **kw)
def dot(x, y, **kw): return P((x, y), (x + .15, y + .3), a=True, **kw) if False else S('p', [(x, y), (x + .1, y + .35)], **kw)

def arrow(deg):
    return [P(*rot([(4, 12), (19.5, 12)], deg)), P(*rot([(13.5, 6.2), (19.8, 12), (13.5, 17.8)], deg), accent=True)]

ICONS = {
 # --- navigation
 'nav': {
  'home': [P((3.8, 11.4), (12, 4.6), (20.2, 11.4)), P((6.2, 10), (6.2, 19.6), (17.8, 19.6), (17.8, 10)),
           P((10.4, 19.6), (10.4, 14.6), (13.6, 14.6), (13.6, 19.6), accent=True)],
  'guide': [Z((5.6, 4.6), (18.4, 4.6), (18.4, 19.6), (5.6, 19.6)), P((9.4, 4.6), (9.4, 19.6), accent=True)],
  'studies': [Z((3.6, 6.6), (9, 4.6), (15, 7), (20.4, 5), (20.4, 17.4), (15, 19.4), (9, 17), (3.6, 19)), P((9, 4.8), (9, 17), accent=True)],
  'notes': [Z((5, 19.6), (5.8, 15.4), (16, 5.2), (18.9, 8.1), (8.6, 18.4)), P((13.8, 7.4), (16.7, 10.3), accent=True)],
  'search': [O(10.4, 10.4, 6.1), P((15, 15), (20.2, 20.2), accent=True)],
  'menu': [P((4, 7), (20, 7)), P((4, 12.2), (20, 12)), P((4, 17), (14.5, 17), accent=True)],
  'close': [P((6, 6), (18, 18)), P((18, 6), (6, 18), accent=True)],
 },
 # --- interface
 'ui': {
  'arrow-right': arrow(0), 'arrow-down': arrow(90), 'arrow-left': arrow(180), 'arrow-up': arrow(270),
  'chevron-down': [P((6, 9.5), (12, 15.6), (18, 9.5))],
  'chevron-right': [P((9.5, 6), (15.6, 12), (9.5, 18))],
  'plus': [P((12, 5), (12, 19)), P((5, 12), (19, 12))],
  'minus': [P((5, 12), (19, 12))],
  'contents': [P((9.5, 7), (20, 7)), P((9.5, 12), (20, 12)), P((9.5, 17), (20, 17)), P((4.2, 7), (4.7, 7.3), accent=True), P((4.2, 12), (4.7, 12.3), accent=True), P((4.2, 17), (4.7, 17.3), accent=True)],
  'footnote': [P((12, 4), (12, 13), accent=True), P((8, 6.3), (16, 10.7), accent=True), P((16, 6.3), (8, 10.7), accent=True), P((5, 18), (19, 18))],
  'external': [P((10.5, 5.6), (5.2, 5.6), (5.2, 18.8), (18.4, 18.8), (18.4, 13.5)), P((13.5, 4.6), (19.6, 4.6), (19.6, 10.6), accent=True), P((19, 5.2), (10.8, 13.4), accent=True)],
  'info': [O(12, 12, 8.6), P((12, 11), (12, 16.4)), dot(12, 7.7, accent=True)],
  'warning': [Z((12, 4), (21, 19.6), (3, 19.6)), P((12, 10), (12, 14.4)), dot(12, 16.9, accent=True)],
  'check': [P((4.8, 12.6), (9.8, 17.6), (19.2, 6.6), accent=True)],
  'hash': [P((9.6, 4.6), (8, 19.4)), P((16.2, 4.6), (14.6, 19.4)), P((4.8, 9.4), (19.8, 9.4)), P((4.2, 14.8), (19.2, 14.8))],
  'sun': [O(12, 12, 3.9, accent=True, t=True)] + [P(*rot([(12, 2.9), (12, 5.6)], d)) for d in range(0, 360, 45)],
  'moon': [ZC((14.6, 4.2), (9.4, 5.4), (5.6, 9.4), (5.4, 14.6), (8.8, 18.8), (13.8, 20.2), (18.8, 18.2), (14.4, 16.6), (11.8, 13), (12.4, 8.4), t=True), P((18.6, 3.4), (18.6, 8), accent=True), P((16.3, 5.7), (20.9, 5.7), accent=True)],
  'quote': [Z((4.5, 7), (10.5, 7), (10.5, 13), (7, 13), (7, 17.5), (4.5, 17.5)), Z((13.5, 7), (19.5, 7), (19.5, 13), (16, 13), (16, 17.5), (13.5, 17.5), accent=True)],
 },
 # --- topics (field guide entries, studies, notes)
 'topic': {
  'heat': [O(12, 12, 3.8, accent=True, t=True)] + [P(*rot([(12, 3.8), (12, 6.2)], d)) for d in range(0, 360, 45)],
  'tree': [ZC((12, 3.6), (17.2, 5.6), (19.6, 10.2), (17.4, 14.6), (12.6, 15.8), (7, 14.6), (4.5, 10.2), (6.8, 5.6), t=True), P((12, 15.8), (12, 20.6), accent=True)],
  'shade': [Z((4, 12), (7, 7), (12, 5), (17, 7), (20, 12), t=True), P((12, 12), (12, 20.4)), P((14.6, 20.4), (20.6, 20.4), accent=True)],
  'pavement': [Z((3, 11), (12, 6.4), (21, 11), (12, 15.6), t=True), P((3, 11), (3, 14.4), (12, 19), (21, 14.4), (21, 11))],
  'water': [ZC((12, 3.8), (16, 9.2), (17.9, 13.8), (16.4, 17.6), (12, 19.8), (7.6, 17.6), (6.1, 13.8), (8, 9.2), t=True), P((9.2, 14.6), (9.8, 16.6), accent=True)],
  'river': [C((3, 9), (6, 7.4), (9, 9), (12, 10.6), (15, 9), (18, 7.4), (21, 9)), C((3, 15), (6, 13.4), (9, 15), (12, 16.6), (15, 15), (18, 13.4), (21, 15), accent=True)],
  'soil': [Z((3.6, 13.4), (20.4, 13.4), (20.4, 20.4), (3.6, 20.4), t=True), P((12, 13.4), (12, 6.4), accent=True), C((12, 9), (14.2, 6.2), (17, 6.2), accent=True), C((12, 10.4), (10, 8), (7.4, 8), accent=True)],
  'sidewalk': [P((9, 3.8), (3.8, 20.4)), P((15, 3.8), (20.2, 20.4)), P((6.9, 10), (17.1, 10), accent=True), P((5.3, 16), (18.7, 16), accent=True)],
  'bioswale': [C((3, 10), (5.8, 16.4), (12, 19), (18.2, 16.4), (21, 10)), P((8.4, 14.6), (8.4, 8), accent=True), P((15.6, 14.6), (15.6, 8), accent=True), P((12, 15.6), (12, 5.6), accent=True)],
  'permeable': [Z((3.6, 4.6), (10.6, 4.6), (10.6, 10), (3.6, 10), t=True), Z((13.4, 4.6), (20.4, 4.6), (20.4, 10), (13.4, 10), t=True), P((12, 12.6), (12, 19.6), accent=True), P((10.2, 17.8), (12, 19.8), (13.8, 17.8), accent=True)],
  'leaf': [ZC((5, 19), (4.6, 12), (8.6, 6.6), (15, 4.4), (19.4, 4.6), (19, 10.6), (15.6, 16.4), (10, 18.8), t=True), P((5, 19), (14, 10), accent=True)],
  'thermometer': [P((10, 14), (10, 5.8), (14, 5.8), (14, 14)), O(12, 17.2, 3.6, t=True), P((12, 8.6), (12, 15), accent=True)],
  'pin': [ZC((12, 21), (6.6, 13.6), (6.2, 9.2), (9, 5), (12, 4), (15, 5), (17.8, 9.2), (17.4, 13.6), t=True), O(12, 10, 2.4, accent=True)],
  'ruler': [Z((3, 15), (15, 3), (21, 9), (9, 21)), P((7.2, 11.6), (8.8, 13.2), (10, 8.6), (11.6, 10.2), accent=True)],
  'building': [Z((6, 20.4), (6, 4.8), (14.4, 4.8), (14.4, 20.4), t=True), P((14.4, 11), (19, 11), (19, 20.4)), P((9, 9), (11.4, 9), accent=True), P((9, 13.4), (11.4, 13.4), accent=True)],
 },
}

# ---------------------------------------------------------------- roughening
def jit(rng, v, amp): return v + rng.uniform(-amp, amp)

def fmt(x): return ('%.2f' % x).rstrip('0').rstrip('.')

def roughen(stroke, rng, amp=.22):
    k, pts = stroke['k'], stroke['p']
    if k == 'o':
        cx, cy, r = pts[0]
        n = 9; a0 = rng.uniform(0, 6.28); sweep = 6.28 + .35  # overshoot: the loop never quite closes
        ps = []
        for i in range(n + 1):
            a = a0 + sweep * i / n; rr = r + rng.uniform(-.12, .1) * min(r, 3) + .08 * r * (i / n)
            ps.append((cx + rr * math.cos(a), cy + rr * math.sin(a) * 0.97))
        return catmull(ps, False)
    long = sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)) > 2
    a = amp if long else .06
    ps = [(jit(rng, x, a), jit(rng, y, a)) for x, y in pts]
    if k in ('z', 'zc'):
        s = ps[0]; ps.append((s[0] + rng.uniform(.2, .6), s[1] + rng.uniform(.2, .6)))  # starts and ends do not meet
    if k in ('c', 'zc'): return catmull(ps, False)
    d = 'M' + fmt(ps[0][0]) + ' ' + fmt(ps[0][1])
    for i in range(1, len(ps)):
        (x0, y0), (x1, y1) = ps[i - 1], ps[i]
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        ln = math.dist((x0, y0), (x1, y1)) or 1; b = rng.uniform(-.35, .35) * min(1, ln / 6) if long else 0
        nx, ny = -(y1 - y0) / ln, (x1 - x0) / ln
        d += 'Q%s %s %s %s' % (fmt(mx + nx * b), fmt(my + ny * b), fmt(x1), fmt(y1))
    return d

def catmull(ps, closed):
    d = 'M' + fmt(ps[0][0]) + ' ' + fmt(ps[0][1])
    for i in range(len(ps) - 1):
        p0 = ps[i - 1] if i else ps[0]; p1, p2 = ps[i], ps[i + 1]; p3 = ps[i + 2] if i + 2 < len(ps) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6); c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += 'C%s %s %s %s %s %s' % tuple(fmt(v) for v in (*c1, *c2, *p2))
    return d

def build(name, strokes, grid_seed):
    rng = random.Random(name + grid_seed)
    ink, acc, tint = [], [], []
    for s in strokes:
        d = roughen(s, rng)
        (acc if s['a'] else ink).append(d)
        if s['t']: tint.append(d)
    return ink, acc, tint

INK, ACC, TINT = 'currentColor', 'var(--icon-accent,currentColor)', 'var(--icon-tint,transparent)'

def symbol(name, ink, acc, tint, vb='0 0 24 24'):
    g = ''
    if tint: g += '<path style="fill:%s;stroke:none" transform="translate(.7 .6)" d="%s"/>' % (TINT, ''.join(tint))
    if ink: g += '<path d="%s"/>' % ''.join(ink)
    if acc: g += '<path style="stroke:%s" d="%s"/>' % (ACC, ''.join(acc))
    return '<symbol id="i-%s" viewBox="%s">%s</symbol>' % (name, vb, g)

# ---------------------------------------------------------------- the mark
def logo(c_ink='currentColor', c_brick='#9c3d24', c_moss='#2f4a3a', c_tint='#f0d9cc'):
    """Two ridgelines meeting in a valley: the old one in ink, the redrawn one under it in brick, and a low sun. Three strokes so it holds at 16px."""
    rng = random.Random('logo')
    old = roughen(C((2.2, 15), (7, 9.6), (12, 13), (16, 19.2), (20, 13), (25, 9.6), (29.8, 15)), rng, .25)
    new = roughen(C((2.2, 18.2), (7, 12.8), (12, 16.2), (16, 22.4), (20, 16.2), (25, 12.8), (29.8, 18.2)), rng, .25)
    sun = roughen(O(16, 6.2, 2.6), rng)
    tree = ''
    ground = ''
    return (sun, old, new, tree, ground, c_ink, c_brick, c_moss, c_tint)

def logo_inner(c_ink, c_brick, c_moss, c_tint, var=False):
    sun, old, new, _, _, ki, kb, km, kt = logo(c_ink, c_brick, c_moss, c_tint)
    if var: kb, ki = ACC, 'currentColor'
    return '<path d="%s" style="stroke:%s"/><path d="%s" style="stroke:%s"/><path d="%s" style="stroke:%s"/>' % (old, ki, new, kb, sun, kb)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    syms, names = [], {}
    for group, icons in ICONS.items():
        names[group] = sorted(icons)
        for n, strokes in icons.items():
            syms.append(symbol(n, *build(n, strokes, 'rds')))
    syms.append('<symbol id="i-logo" viewBox="0 0 32 32">%s</symbol>' % logo_inner('currentColor', '#9c3d24', '#2f4a3a', '#f0d9cc', var=True))
    sprite = ('<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n<!-- Generated by scripts/build_icons.py. Do not edit by hand. -->\n'
              + '\n'.join(syms) + '\n</svg>\n')
    (OUT / 'icons.svg').write_text(sprite)
    attrs = 'fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    (OUT / 'logo.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="64" height="64" %s color="#1f1d1a">%s</svg>\n'
                                  % (attrs, logo_inner('#1f1d1a', '#9c3d24', '#2f4a3a', '#f0d9cc')))
    (OUT / 'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" %s><rect x="1" y="1" width="30" height="30" rx="7" fill="#f6f1e7" stroke="#1f1d1a" stroke-width="1.2"/><g transform="translate(3.4 3.6) scale(.79)" stroke-width="2.2">%s</g></svg>\n'
                                     % (attrs, logo_inner('#1f1d1a', '#9c3d24', '#2f4a3a', '#f0d9cc')))
    (OUT / 'names.json').write_text(json.dumps(names, indent=1) + '\n')
    gallery(names)
    print('icons:', sum(len(v) for v in names.values()), '->', OUT)

GROUP_TITLES = {'nav': ('Navigation', 'Header, phone tab bar and menu.'), 'ui': ('Interface', 'Arrows, contents, footnotes, expand, external links, notices.'),
                'topic': ('Topics', 'Field guide entries, studies and notes: what a page is about.')}

def gallery(names):
    """Rewrites the cells between the gallery markers in icons/index.html."""
    page = OUT.parent.parent.parent / 'icons' / 'index.html'
    if not page.exists(): return
    html = ''
    for g, items in names.items():
        title, blurb = GROUP_TITLES[g]
        cells = ''.join('<li><button class="rv-gal__cell" type="button" data-copy="%s"><svg class="rds-icon" aria-hidden="true"><use href="../assets/rds/icons/icons.svg#i-%s"/></svg><code>%s</code></button></li>' % (n, n, n) for n in items)
        html += '<section class="rds-section%s" id="%s"><div class="rds-container"><div class="rds-sechead"><p class="rds-eyebrow">%d icons</p><h2 class="rds-display" style="font-size:clamp(30px,4vw,40px)">%s</h2><p class="rds-lead">%s</p></div><ul class="rv-gal">%s</ul></div></section>\n' % (' rds-band-sunk' if g == 'ui' else '', g, len(items), title, blurb, cells)
    t = page.read_text()
    a, b = '<!-- gallery:start -->', '<!-- gallery:end -->'
    i, j = t.index(a) + len(a), t.index(b)
    page.write_text(t[:i] + '\n' + html + t[j:])

if __name__ == '__main__': main()
