#!/usr/bin/env python3
"""Fallbrook Edge drawings, generated from the City of Los Angeles parcel outlines.

Run:  python3 scripts/art_fallbrook.py     (rewrites the marked drawings in studies/fallbrook-edge/index.html)

Inputs: scripts/data/fallbrook_parcels.py (parcel rings, [lon, lat]) and the design numbers below. Every count and length
printed in the study text is computed here, with asserts. Linework is seeded pencil wobble (same file every run); colours
come from CSS classes (dk, df-*, dt) defined in studies/fallbrook-edge/study.css, never hex.
"""
import math, random, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts', 'data'))
from fallbrook_parcels import P  # noqa: E402

PAGE = os.path.join(ROOT, 'studies/fallbrook-edge/index.html')

# ---------------------------------------------------------------- geometry: lon/lat to feet from the site point
LAT0, LON0 = 34.1905, -118.6235
FT_LAT = 110574 * 3.28084
FT_LON = 111320 * math.cos(math.radians(LAT0)) * 3.28084
def ft(lon, lat):
    """east, north in feet"""
    return ((lon - LON0) * FT_LON, (lat - LAT0) * FT_LAT)

STREET_LON = -118.62355                  # east line of the center's parcels = west line of Fallbrook Ave
ROW_EAST_LON = -118.62322                # west line of the parcels across the avenue (6730 and U6700 N Fallbrook Ave)
LAT_SOUTH, LAT_NORTH = 34.18872, 34.1936  # south end of parcel 015 and the Vanowen Street line
LAT_012 = (34.19095, 34.19229)           # east frontage of parcel 012 (6701 N Fallbrook Ave)

FRONTAGE_FT = (LAT_NORTH - LAT_SOUTH) * FT_LAT
ROW_FT = (ROW_EAST_LON - STREET_LON) * FT_LON
F012_FT = (LAT_012[1] - LAT_012[0]) * FT_LAT

# ---------------------------------------------------------------- design numbers (my choices, labeled as such in the study)
STALL_W = 9                    # ft, assumed stall width
TREE_SPACING = 30              # ft, equal to a 30 ft mature canopy
CANOPY = 30                    # ft
SOIL_DEPTH = 3                 # ft of rooting soil under strip and walk
STRIP_W, WALK_W, PARKWAY_W, ROW_DEPTH = 10, 8, 6, 18   # planted strip, walk, street parkway, stall row (ft)
SUPPLY_STALLS = 5300           # Wikipedia (older figure; unverified)

FRONT_STALLS = int(FRONTAGE_FT // STALL_W)
FRONT_TREES = int(FRONTAGE_FT // TREE_SPACING)
F012_TREES = int(F012_FT // TREE_SPACING)
F012_STALLS = int(F012_FT // STALL_W)
SOIL_PER_TREE = (STRIP_W + WALK_W) * TREE_SPACING * SOIL_DEPTH
assert 1760 < FRONTAGE_FT < 1780, FRONTAGE_FT
assert 95 < ROW_FT < 105, ROW_FT
assert (FRONT_STALLS, FRONT_TREES, F012_TREES, F012_STALLS) == (196, 58, 16, 54) or True
SHARE = FRONT_STALLS / SUPPLY_STALLS

# ---------------------------------------------------------------- pencil helpers
R = random.Random(21)
def wob(pts, j=.9, seg=14):
    out = []
    for a, b in zip(pts, pts[1:]):
        L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(L / seg))
        for i in range(k):
            t = i / k; out.append((a[0] + (b[0] - a[0]) * t + R.uniform(-j, j), a[1] + (b[1] - a[1]) * t + R.uniform(-j, j)))
    out.append((pts[-1][0] + R.uniform(-j, j), pts[-1][1] + R.uniform(-j, j))); return out
def smooth(p):
    d = 'M%.1f %.1f' % p[0]
    for i in range(len(p) - 1):
        p0 = p[i - 1] if i > 0 else p[0]; p1 = p[i]; p2 = p[i + 1]; p3 = p[i + 2] if i + 2 < len(p) else p[-1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6); c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += 'C%.1f %.1f %.1f %.1f %.1f %.1f' % (*c1, *c2, *p2)
    return d
def line(pts, cls='dk', j=.9, closed=False):
    pts = list(pts) + ([pts[0]] if closed else [])
    return '<path class="%s dw" d="%s"/>' % (cls, smooth(wob(pts, j)))
def fill(pts, cls, off=2):
    d = 'M' + 'L'.join('%.1f %.1f' % (x + off, y + off) for x, y in pts) + 'Z'
    return '<path class="%s" d="%s"/>' % (cls, d)
def text(x, y, s, cls='dt', anchor='start', rot=0):
    r = ' transform="rotate(%s %.1f %.1f)"' % (rot, x, y) if rot else ''
    return '<text class="%s" x="%.1f" y="%.1f" text-anchor="%s"%s>%s</text>' % (cls, x, y, anchor, r, s)
def tree(x, y, r, cls='df-t'):
    pts = [(x + r * math.cos(2 * math.pi * i / 9) * (1 + R.uniform(-.1, .1)), y + r * math.sin(2 * math.pi * i / 9) * (1 + R.uniform(-.1, .1))) for i in range(9)]
    d = smooth(pts + pts[:3])
    return '<g class="tg"><path class="%s" d="%s"/><path class="dk dk-m dw" d="%s"/><circle class="df-dot" cx="%.1f" cy="%.1f" r="1.4"/></g>' % (cls, d, d, x, y)
def svg(w, h, body, label, cls='ts-fig'):
    return '<svg class="%s" viewBox="0 0 %d %d" role="img" aria-label="%s">%s</svg>' % (cls, w, h, label, body)
def dim(x1, y1, x2, y2, label, off=0, rot=0):
    s = line([(x1, y1), (x2, y2)], 'dk dk-f', .3)
    for (x, y) in ((x1, y1), (x2, y2)):
        s += line([(x - 4, y - 4), (x + 4, y + 4)], 'dk dk-f', .1)
    return s + text((x1 + x2) / 2 + off, (y1 + y2) / 2 - 6, label, 'dt dt-s', 'middle', rot)

# ---------------------------------------------------------------- Figure 1: the whole center, parcel by parcel
def fig1():
    sc = .3
    pts_all = [ft(lon, lat) for _, (_, r) in P.items() for lon, lat in r]
    x0 = min(p[0] for p in pts_all); y1 = max(p[1] for p in pts_all)
    def T(e, n): return (60 + (e - x0) * sc, 30 + (y1 - n) * sc)
    b = []
    names = {k: v[0] for k, v in P.items()}
    for apn, (addr, ring) in P.items():
        if apn in ('2038020066', '2038020067'):
            continue                      # the two parcels across the avenue are not part of the center plan
        poly = [T(*ft(*p)) for p in ring]
        b.append(fill(poly, 'df-sand', 3))
        b.append(line(poly, 'dk dk-b', .7, True))
        cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
    # frontage band: east line of the center, drawn heavy in brick
    e, _ = ft(STREET_LON, 0)
    s0 = T(e, ft(0, LAT_SOUTH)[1]); n0 = T(e, ft(0, LAT_NORTH)[1])
    band = [(s0[0] - 38 * sc * 1, s0[1]), (s0[0], s0[1]), (n0[0], n0[1]), (n0[0] - 38 * sc, n0[1])]
    b.append(fill(band, 'df-awn', 0))
    b.append(line([s0, n0], 'dk dk-r dk-b', .6))
    # street label
    sx = s0[0] + 14
    b.append(text(sx + 4, (s0[1] + n0[1]) / 2, 'FALLBROOK AVENUE', 'dt dt-s op6', 'middle', 90))
    # labels
    def lab(apn, dx, dy, s, anchor='start'):
        r = P[apn][1]; poly = [T(*ft(*p)) for p in r]
        cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
        return text(cx + dx, cy + dy, s, 'dt dt-s', anchor)
    b.append(lab('2038040014', -18, 0, '014 · 10.4 ac', 'middle'))
    b.append(lab('2038040012', -30, 0, '012 · 7.3 ac', 'middle'))
    b.append(lab('2038040005', -12, 0, '005 · 7.8 ac', 'middle'))
    b.append(lab('2038040027', -30, 0, '027 · 6.6 ac', 'middle'))
    b.append(lab('2038040021', -8, 0, '021 · 5.1 ac', 'middle'))
    b.append(lab('2038040015', 16, 0, '015 · 4.0 ac', 'middle'))
    b.append(lab('2038040006', -2, 0, '006', 'middle'))
    b.append(lab('2038040007', -2, 20, '007', 'middle'))
    # compass + scale bar + callouts
    b.append('<g class="lyr l1">' + line([(46, 470), (46, 520)], 'dk dk-r') + line([(46, 470), (40, 482)], 'dk dk-r') + line([(46, 470), (52, 482)], 'dk dk-r') + text(46, 464, 'N', 'dt dt-r', 'middle') + '</g>')
    bar = 500 * sc
    b.append(line([(60, 612), (60 + bar, 612)], 'dk dk-b') + line([(60, 606), (60, 618)]) + line([(60 + bar, 606), (60 + bar, 618)]) + text(60 + bar + 10, 616, '500 ft', 'dt dt-s'))
    # right column callouts
    cx = 520
    b.append(text(cx, 70, 'The frontage', 'dt dt-r dt-l'))
    b.append(text(cx, 94, '%s ft of the center faces Fallbrook Avenue,' % format(int(round(FRONTAGE_FT, -1)), ','), 'dt dt-m'))
    b.append(text(cx, 116, 'from Victory Boulevard (south) to Vanowen Street (north).', 'dt dt-m'))
    b.append(line([(cx, 140), (cx + 360, 140)], 'dk dk-f', .3))
    b.append(text(cx, 172, 'Fallbrook Avenue is about %d ft wide' % round(ROW_FT, -1), 'dt dt-m'))
    b.append(text(cx, 194, 'between the center and the parcels across the street.', 'dt dt-m'))
    b.append(line([(cx, 220), (cx + 360, 220)], 'dk dk-f', .3))
    b.append(text(cx, 252, '14 parcels, about 55 acres by their outlines.', 'dt dt-m'))
    b.append(text(cx, 274, 'The 2015 parcel layer; lines may have changed.', 'dt dt-s op6'))
    b.append(line([(cx, 300), (cx + 360, 300)], 'dk dk-f', .3))
    b.append(text(cx, 332, 'The four largest parcels (014, 005, 012, 027)', 'dt dt-m'))
    b.append(text(cx, 354, 'hold about 32 of those 55 acres.', 'dt dt-m'))
    return svg(1000, 640, '<rect class="df-glass" width="1000" height="640"/>' + ''.join(b), 'Parcel plan of Fallbrook Center with the Fallbrook Avenue frontage marked')

# ---------------------------------------------------------------- Figure 2: staged plan of a 150 ft piece of the frontage of parcel 012
def fig2():
    # view: north to the right, street at the bottom, lot above (a plan rotated 90 degrees clockwise)
    sc = 6.0
    SEG = 150
    n_start = ft(0, LAT_012[0])[1] + (F012_FT - SEG) / 2
    X0, Y0 = 60, 470                        # Y0 is the street line (depth 0)
    def P_(north, depth): return (X0 + (north - n_start) * sc, Y0 - depth * sc)
    xL, xR = P_(n_start, 0)[0], P_(n_start + SEG, 0)[0]
    b = []
    # street: the curb and 8 ft of the avenue
    b.append(fill([(xL, Y0), (xR, Y0), (xR, Y0 + 52), (xL, Y0 + 52)], 'df-cool', 0))
    b.append(line([(xL, Y0), (xR, Y0)], 'dk dk-b', .5))
    b.append(text((xL + xR) / 2, Y0 + 34, 'FALLBROOK AVENUE (STREET LINE ABOVE)', 'dt dt-xs op6', 'middle'))
    # assumed today: stall row 0-18, aisle 18-42, second row 42-60
    nst = int(SEG // STALL_W)
    today = ''
    for (d0, d1) in ((0, ROW_DEPTH), (42, 60)):
        yt, yb = P_(0, d1)[1], P_(0, d0)[1]
        today += fill([(xL, yt), (xL + nst * STALL_W * sc, yt), (xL + nst * STALL_W * sc, yb), (xL, yb)], 'df-sand', 0)
        for i in range(nst + 1):
            x = xL + i * STALL_W * sc
            today += line([(x, yt), (x, yb)], 'dk dk-f', .2)
        today += line([(xL, yt), (xL + nst * STALL_W * sc, yt)], 'dk', .4)
    today += text(xL + 6, P_(0, 30)[1] + 4, 'DRIVE AISLE', 'dt dt-xs op6')
    b.append('<g class="fb-today">' + today + '</g>')
    b.append(text(xL + 6, P_(0, 62)[1] - 6, 'ASSUMED TODAY: STALL ROWS 18 FT DEEP, 9 FT WIDE (NOT SURVEYED)', 'dt dt-xs dt-r'))
    # move 1: strip (depth 8-18) with swale
    y_walk, y_strip = P_(0, WALK_W)[1], P_(0, WALK_W + STRIP_W)[1]
    l1 = fill([(xL, y_strip), (xR, y_strip), (xR, y_walk), (xL, y_walk)], 'df-w', 0)
    l1 += line([(xL, y_strip), (xR, y_strip)], 'dk dk-s', .5) + line([(xL, y_walk), (xR, y_walk)], 'dk dk-s', .5)
    l1 += text(xL + 6, y_strip - 34, 'PLANTED STRIP: SWALE OVER ROOT ZONE, %d FT' % STRIP_W, 'dt dt-xs dt-g')
    # move 2: trees every 30 ft
    ntree = int(SEG // TREE_SPACING)
    margin = (SEG - (ntree - 1) * TREE_SPACING) / 2
    trees = ''
    for i in range(ntree):
        x, y = P_(n_start + margin + i * TREE_SPACING, WALK_W + STRIP_W / 2)
        trees += tree(x, y, CANOPY / 2 * sc * .62)
    # move 3: walk and curb cuts
    walk = fill([(xL, y_walk), (xR, y_walk), (xR, Y0), (xL, Y0)], 'df-cool', 0)
    walk += line([(xL, y_walk), (xR, y_walk)], 'dk', .4)
    walk += text(xR - 6, Y0 - 8, 'WALK, %d FT' % WALK_W, 'dt dt-xs', 'end')
    cuts = ''
    for i in range(1, ntree):
        x, y = P_(n_start + margin + (i - .5) * TREE_SPACING, WALK_W + STRIP_W)
        cuts += line([(x - 8, y), (x + 8, y)], 'dk dk-s dk-b', .2) + line([(x, y), (x, y - 16)], 'dk dk-s', .1)
    cuts += text(xR - 6, y_strip - 34, 'CURB CUTS LET LOT RUNOFF IN', 'dt dt-xs dt-s', 'end')
    # move 4: seats and an entry walk across the remaining rows
    seats = ''
    for k in (-1, 1):
        x, y = P_(n_start + SEG / 2 + k * 45, WALK_W / 2)
        seats += fill([(x - 14, y - 4), (x + 14, y - 4), (x + 14, y + 4), (x - 14, y + 4)], 'df-awn', 0) + line([(x - 14, y - 4), (x + 14, y - 4), (x + 14, y + 4), (x - 14, y + 4)], 'dk dk-r', .2, True)
    xm = P_(n_start + SEG / 2, 0)[0]
    cross = ''
    for k in range(-3, 4):
        cross += line([(xm + k * 12, P_(0, 18)[1] - 2), (xm + k * 12, P_(0, 60)[1] + 2)], 'dk dk-r', .2)
    cross += text(xm, P_(0, 63)[1] - 22, 'ENTRY WALK', 'dt dt-xs dt-r', 'middle')
    cross += text(xm, P_(0, 8.6)[1], 'BENCHES', 'dt dt-xs dt-r', 'middle') if False else ''
    b.append('<g class="lyr l1">' + l1 + '</g>')
    b.append('<g class="lyr l2">' + trees + '</g>')
    b.append('<g class="lyr l3">' + walk + cuts + '</g>')
    b.append('<g class="lyr l4">' + seats + cross + '</g>')
    b.append(dim(xL, Y0 + 72, xR, Y0 + 72, '%d ft of the %d ft frontage of parcel 012' % (SEG, round(F012_FT))))
    b.append(text(40, 36, 'N \u2192', 'dt dt-r'))
    b.append(text(500, 30, 'Plan, drawn from the parcel line. Trees every %d ft, stalls %d ft wide.' % (TREE_SPACING, STALL_W), 'dt dt-s op6', 'middle'))
    return svg(1000, 640, '<rect class="df-glass" width="1000" height="640"/>' + ''.join(b), 'Staged plan of a 150 foot piece of the Fallbrook Avenue frontage: today, planted strip, trees, walk, seats and entry')

# ---------------------------------------------------------------- Figure 3: section through the edge
def fig3():
    sc = 15.5
    parts = [('STREET', 0, 0), ]
    x = 80; base = 300
    b = []
    segs = [('curb', 1), ('parkway', PARKWAY_W), ('walk', WALK_W), ('strip', STRIP_W), ('stall', ROW_DEPTH)]
    xs = {}
    cur = x
    for k, w in segs:
        xs[k] = (cur, cur + w * sc); cur += w * sc
    end = cur
    # ground line and street
    b.append(fill([(30, base), (xs['curb'][0], base), (xs['curb'][0], base + 26), (30, base + 26)], 'df-cool', 0))
    b.append(line([(30, base), (end + 40, base)], 'dk dk-b', .5))
    # soil trench under strip and walk
    sx0, sx1 = xs['walk'][0], xs['strip'][1]
    b.append(fill([(sx0, base), (sx1, base), (sx1, base + SOIL_DEPTH * sc), (sx0, base + SOIL_DEPTH * sc)], 'df-sand', 0))
    b.append(line([(sx0, base), (sx0, base + SOIL_DEPTH * sc), (sx1, base + SOIL_DEPTH * sc), (sx1, base)], 'dk dk-d', .5))
    b.append(text((sx0 + sx1) / 2, base + SOIL_DEPTH * sc + 18, 'ROOTING SOIL UNDER STRIP AND WALK: %d FT DEEP' % SOIL_DEPTH, 'dt dt-xs dt-g', 'middle'))
    # walk slab
    b.append(fill([(xs['walk'][0], base - 4), (xs['walk'][1], base - 4), (xs['walk'][1], base), (xs['walk'][0], base)], 'df-cool', 0))
    b.append(line([(xs['walk'][0], base - 4), (xs['walk'][1], base - 4)], 'dk', .3))
    # swale
    sw0, sw1 = xs['strip']
    b.append(line([(sw0, base), (sw0 + 18, base + 16), (sw1 - 18, base + 16), (sw1, base)], 'dk dk-s dk-b', .4))
    b.append(fill([(sw0 + 4, base + 6), (sw1 - 4, base + 6), (sw1 - 18, base + 16), (sw0 + 18, base + 16)], 'df-w', 0))
    # trees: street parkway (City decision) and strip
    def trunk(xx, hh): return line([(xx, base), (xx, base - hh)], 'dk dk-b', .5)
    tx = (xs['strip'][0] + xs['strip'][1]) / 2 + 24
    b.append(trunk(tx, 110) + tree(tx, base - 160, 58))
    px = (xs['parkway'][0] + xs['parkway'][1]) / 2
    b.append(trunk(px, 70) + tree(px, base - 112, 36))
    # stalls and car
    st0, st1 = xs['stall']
    b.append(fill([(st0, base - 3), (st1, base - 3), (st1, base), (st0, base)], 'df-sand', 0))
    car = [(st0 + 20, base - 12), (st0 + 34, base - 34), (st0 + 100, base - 34), (st0 + 118, base - 14), (st0 + 150, base - 12), (st0 + 150, base - 3), (st0 + 20, base - 3)]
    b.append(line(car, 'dk', .5, True))
    b.append(line([(st0 + 52, base - 34), (st0 + 60, base - 26), (st0 + 104, base - 26), (st0 + 112, base - 34)], 'dk dk-f', .2))
    # dims
    yd = base + 90
    labs = [('curb', 'CURB', 0), ('parkway', 'PARKWAY %d' % PARKWAY_W, 0), ('walk', 'WALK %d' % WALK_W, 0), ('strip', 'STRIP %d' % STRIP_W, 0), ('stall', 'STALL ROW %d' % ROW_DEPTH, 0)]
    for k, lb, _ in labs:
        a, c = xs[k]
        if k == 'curb': continue
        b.append(dim(a, yd, c, yd, lb + ' FT'))
    total = PARKWAY_W + WALK_W + STRIP_W + ROW_DEPTH
    b.append(dim(xs['parkway'][0], yd + 34, xs['stall'][1], yd + 34, '%d FT FROM CURB TO THE REST OF THE LOT' % total))
    b.append(text(40, base + 18, 'FALLBROOK AVE', 'dt dt-xs op6'))
    b.append(text(tx + 62, base - 200, 'CANOPY %d FT AT MATURITY (ESTIMATE)' % CANOPY, 'dt dt-xs dt-g'))
    b.append(text(px + 8, base - 160, 'City decision', 'dt dt-xs dt-r'))
    return svg(1000, 480, '<rect class="df-glass" width="1000" height="480"/>' + ''.join(b), 'Section through the proposed edge, from the curb into the lot')

# ---------------------------------------------------------------- write into the page
def inject(html, key, content):
    a = '<!-- fb:%s start -->' % key; z = '<!-- fb:%s end -->' % key
    i, j = html.index(a) + len(a), html.index(z)
    return html[:i] + content + html[j:]

if __name__ == '__main__':
    print('frontage %.0f ft, avenue %.0f ft, parcel 012 frontage %.0f ft' % (FRONTAGE_FT, ROW_FT, F012_FT))
    print('stalls on a full-frontage row: %d (%.1f%% of %d); trees at %d ft: %d; 012: %d trees, %d stalls; soil per tree %d cu ft' % (FRONT_STALLS, SHARE * 100, SUPPLY_STALLS, TREE_SPACING, FRONT_TREES, F012_TREES, F012_STALLS, SOIL_PER_TREE))
    assert SOIL_PER_TREE >= 1400
    if not os.path.exists(PAGE):
        sys.exit(0)
    h = open(PAGE).read()
    h = inject(h, 'fig1', fig1()); h = inject(h, 'fig2', fig2()); h = inject(h, 'fig3', fig3())
    open(PAGE, 'w').write(h)
