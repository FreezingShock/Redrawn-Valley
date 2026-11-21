#!/usr/bin/env python3
"""Plan drawings for the home page study panels (studies 02 and 03).

Run:  python3 scripts/art_home_panels.py     (rewrites the marked drawings in index.html and studies/index.html)

Study 02 is drawn from the City parcel outlines (scripts/data/fallbrook_parcels.py) and the design numbers in
scripts/art_fallbrook.py. Study 03 is drawn from the dimensions in scripts/art_ventura_corner.py (all estimates there:
100 x 96 ft lot, 78 x 70 ft building, 10 ft sidewalks, 24 x 22 ft plaza notch). Linework is seeded pencil wobble; colours come
from CSS classes (dk, df-*, dt in assets/site.css, token-based, so the drawings follow the theme).
"""
import math, os, re, sys, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import art_fallbrook as fb  # noqa: E402

PAGES = [os.path.join(ROOT, 'index.html'), os.path.join(ROOT, 'studies/index.html')]
fb.R.seed(5)
line, fill, text, tree, wob, smooth = fb.line, fb.fill, fb.text, fb.tree, fb.wob, fb.smooth


def svg(w, h, body, label):
    return ('<svg class="rv-fplan" viewBox="0 0 %d %d" role="img" aria-label="%s" preserveAspectRatio="xMidYMid meet">%s</svg>'
            % (w, h, label, body))


# ------------------------------------------------------------------ study 02: the center, its frontage and the new tree row
def fallbrook():
    W, H, sc = 860, 1040, .5
    pts_all = [fb.ft(lon, lat) for _, (_, r) in fb.P.items() for lon, lat in r]
    x0 = min(p[0] for p in pts_all); y1 = max(p[1] for p in pts_all)
    def T(e, n): return (110 + (e - x0) * sc, 70 + (y1 - n) * sc)
    b = []
    for apn, (addr, ring) in fb.P.items():
        if apn in ('2038020066', '2038020067'):
            continue
        poly = [T(*fb.ft(*p)) for p in ring]
        b.append(fill(poly, 'df-sand', 3))
        b.append(line(poly, 'dk dk-b', .8, True))
    e = fb.ft(fb.STREET_LON, 0)[0]
    s0 = T(e, fb.ft(0, fb.LAT_SOUTH)[1]); n0 = T(e, fb.ft(0, fb.LAT_NORTH)[1])
    # the new edge: planted strip and walk (18 ft deep), then a tree every 30 ft
    d = 18 * sc
    b.append(fill([(s0[0] - d, s0[1]), s0, n0, (n0[0] - d, n0[1])], 'df-awn', 0))
    b.append(line([s0, n0], 'dk dk-r dk-b', .7))
    b.append(line([(s0[0] - d, s0[1]), (n0[0] - d, n0[1])], 'dk dk-r', .6))
    n = int(fb.FRONTAGE_FT // fb.TREE_SPACING)
    assert n == fb.FRONT_TREES
    for i in range(n):
        y = s0[1] + (n0[1] - s0[1]) * (i + .5) / n
        b.append(tree(s0[0] - d / 2 - 1, y, 8.2))
    # street, north arrow, scale, notes
    b.append(line([(s0[0] + 30, s0[1] + 6), (n0[0] + 30, n0[1] - 6)], 'dk dk-f dk-d', .4))
    b.append(text(s0[0] + 52, (s0[1] + n0[1]) / 2, 'FALLBROOK AVENUE', 'dt dt-m op6', 'middle', 90))
    b.append(text(s0[0] - 30, n0[1] - 14, 'VANOWEN ST', 'dt dt-s op6', 'end'))
    b.append(text(s0[0] - 30, s0[1] + 26, 'VICTORY BLVD', 'dt dt-s op6', 'end'))
    b.append(line([(70, 70), (70, 120)], 'dk dk-r') + line([(70, 70), (64, 82)], 'dk dk-r') + line([(70, 70), (76, 82)], 'dk dk-r') + text(70, 62, 'N', 'dt dt-r', 'middle'))
    bar = 500 * sc
    b.append(line([(110, 1004), (110 + bar, 1004)], 'dk dk-b') + line([(110, 998), (110, 1010)]) + line([(110 + bar, 998), (110 + bar, 1010)]) + text(110 + bar / 2, 1030, '500 ft', 'dt dt-s', 'middle'))
    b.append(text(s0[0] + 70, 1004, 'DRAWN FROM CITY PARCEL LINES.', 'dt dt-xs op6', 'end'))
    b.append(text(s0[0] + 70, 1020, 'TREES AND STRIP ARE THE PROPOSAL.', 'dt dt-xs op6', 'end'))
    return svg(W, H, ''.join(b), 'Hand-drawn parcel plan of Fallbrook Center with the proposed tree row along its Fallbrook Avenue frontage')


# ------------------------------------------------------------------ study 03: the corner lot, its plaza and the crossing
def ventura():
    W, H, S = 860, 1040, 6.0
    LX, LY = 90, 150
    LW, LD = 100 * S, 96 * S                  # lot 100 ft along Ventura, 96 ft along Topanga
    RX, BY = LX + LW, LY + LD                 # east edge (Topanga side), south edge (Ventura side)
    SW = 10 * S                               # assumed sidewalk
    BW, BD, NX, NY = 78 * S, 70 * S, 24 * S, 22 * S
    bx0, by0 = LX + 8 * S, LY + 8 * S
    bx1, by1 = bx0 + BW, by0 + BD
    b = []
    # streets
    b.append(fill([(RX, 40), (RX + 130, 40), (RX + 130, BY + 140), (RX, BY + 140)], 'df-cool', 0))
    b.append(fill([(30, BY), (RX + 130, BY), (RX + 130, BY + 140), (30, BY + 140)], 'df-cool', 0))
    b.append(line([(RX, 40), (RX, BY)], 'dk dk-b', .6) + line([(30, BY), (RX, BY)], 'dk dk-b', .6))
    b.append(line([(RX + 65, 60), (RX + 65, BY - 20)], 'dk dk-f dk-d', .4) + line([(40, BY + 70), (RX - 20, BY + 70)], 'dk dk-f dk-d', .4))
    b.append(text(RX + 78, 250, 'TOPANGA CANYON BLVD', 'dt dt-m op6', 'middle', 90))
    b.append(text(260, BY + 112, 'VENTURA BLVD', 'dt dt-m op6', 'middle'))
    # lot, sidewalk bands, building with the plaza notch
    lot = [(LX, LY), (RX, LY), (RX, BY), (LX, BY)]
    b.append(fill(lot, 'df-sand', 3))
    b.append(line(lot, 'dk dk-b', .7, True))
    walk = [(RX - SW, LY), (RX, LY), (RX, BY), (LX, BY), (LX, BY - SW), (RX - SW, BY - SW)]
    b.append(fill(walk, 'df-cool', 0))
    b.append(line([(RX - SW, LY), (RX - SW, BY - SW), (LX, BY - SW)], 'dk dk-f', .5))
    bld = [(bx0, by0), (bx1, by0), (bx1, by1 - NY), (bx1 - NX, by1 - NY), (bx1 - NX, by1), (bx0, by1)]
    b.append(fill(bld, 'df-glass', 3))
    b.append(line(bld, 'dk dk-b', .7, True))
    b.append(text((bx0 + bx1) / 2 - 20, (by0 + by1) / 2 - 4, '5,437 SQ FT', 'dt dt-m', 'middle'))
    b.append(text((bx0 + bx1) / 2 - 20, (by0 + by1) / 2 + 18, 'EXISTING BUILDING', 'dt dt-xs op6', 'middle'))
    # proposal: plaza in the notch, trees along both walks, benches, crossings at the corner
    plaza = [(bx1 - NX, by1 - NY), (bx1, by1 - NY), (bx1, by1), (bx1 - NX, by1)]
    b.append(fill(plaza, 'df-awn', 0))
    b.append(line(plaza, 'dk dk-r dk-b', .5, True))
    b.append(text(bx1 - NX / 2, by1 + 32, 'PLAZA', 'dt dt-xs dt-r', 'middle'))
    for i in range(5):
        x = LX + 40 + i * (RX - LX - 140) / 4
        b.append(tree(x, BY - SW / 2 - 2, 11))
    for i in range(4):
        y = LY + 60 + i * 120
        b.append(tree(RX - SW / 2, y, 11))
    for k in range(5):
        y = BY + 14 + k * 14
        b.append(line([(RX + 6, y), (RX + 124, y)], 'dk dk-r', .3))
    for k in range(6):
        x = LX + 330 + k * 16
        b.append(line([(x, BY + 6), (x, BY + 134)], 'dk dk-r', .3))
    # north arrow, dimensions, scale
    b.append(line([(70, 70), (70, 120)], 'dk dk-r') + line([(70, 70), (64, 82)], 'dk dk-r') + line([(70, 70), (76, 82)], 'dk dk-r') + text(70, 62, 'N', 'dt dt-r', 'middle'))
    b.append(fb.dim(LX, LY - 22, RX, LY - 22, '100 FT'))
    b.append(text(LX - 16, (LY + BY) / 2, '96 FT', 'dt dt-s', 'middle', -90))
    b.append(text(LX, 1010, 'ESTIMATED DIMENSIONS, NOT A SURVEY.', 'dt dt-xs op6'))
    b.append(text(LX, 1028, 'LOT 0.22 ACRE.', 'dt dt-xs op6'))
    return svg(W, H, ''.join(b), 'Hand-drawn plan of the corner lot at Ventura and Topanga with the proposed plaza, trees and crossings')


def inject(html, key, content):
    a = '<!-- hp:%s start -->' % key; z = '<!-- hp:%s end -->' % key
    if a not in html:
        return html
    i, j = html.index(a) + len(a), html.index(z)
    return html[:i] + content + html[j:]


if __name__ == '__main__':
    f, v = fallbrook(), ventura()
    for p in PAGES:
        h = open(p).read()
        h = inject(h, 'fallbrook', f); h = inject(h, 'ventura', v)
        open(p, 'w').write(h)
    print('ok', len(f), len(v))
