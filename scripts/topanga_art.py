#!/usr/bin/env python3
"""Topanga Willows drawings, generated from the study's dimensions.

Run:  python3 scripts/topanga_art.py          (rewrites the marked drawings in studies/topanga-willows/index.html
                                                and the generated block in studies/topanga-willows/study.css)

Every cited dimension and count is an input below; the drawing is computed from them and the asserts fail if a
count stops adding up (68 existing stalls, 61 after, 17 new trees, 50 ft building width, 113 ft lot, 210 ft building).
Linework is seeded pencil wobble, so re-running gives the same files. Colours come from CSS classes (tokens), never hex.
"""
import math, random, re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'studies/topanga-willows/index.html')
CSS = os.path.join(ROOT, 'studies/topanga-willows/study.css')

# ---------------------------------------------------------------- inputs (feet unless noted; all estimated from aerial imagery)
S = 3.4                                   # drawing units per foot
BUILDING_FT = (210, 50)                   # length (N-S) x width (E-W), single-story bar [31]
BAYS_FT = [('NAILS', 28), ('CLEANERS', 33), ('QUILT SHOP', 40), ('YOGA', 36), ('PIZZA', 33), ('COFFEE', 40)]
LOT_FT = 113                              # building's east face to the east property line
ROW_STALLS = [17, 17, 17, 17]             # four rows of angled stalls on two one-way aisles
STALL_PITCH_FT = 10.4                     # 9 ft stall at 60 degrees
PATIO_STALLS = 3                          # south end of row A given up for the patio
ISLAND_STALLS = 4                         # two at each end of the center double row, given up for end islands
TREES = [('QA', 'COAST LIVE OAK', 7), ('QL', 'VALLEY OAK', 1), ('PR', 'WESTERN SYCAMORE', 5), ('SL', 'ARROYO WILLOW', 2), ('CL', 'DESERT WILLOW', 2)]
BANDS_FT = [('walk', 7), ('A', 17), ('aisle1', 16), ('B', 17), ('C', 17), ('aisle2', 16), ('D', 17), ('edge', 6)]

assert sum(n for _, n in BAYS_FT) == BUILDING_FT[0]
assert sum(n for _, n in BANDS_FT) == LOT_FT
EXISTING = sum(ROW_STALLS)
AFTER = EXISTING - PATIO_STALLS - ISLAND_STALLS
assert EXISTING == 68 and AFTER == 61, (EXISTING, AFTER)
assert sum(n for _, _, n in TREES) == 17
CENTER_TREES = 8                          # island N (valley oak) + six diamonds + island S
EAST_TREES = 7                            # five sycamores + two arroyo willows
PATIO_TREES = 2                           # two desert willows
assert CENTER_TREES + EAST_TREES + PATIO_TREES == 17

# ---------------------------------------------------------------- plan frame (drawing units; viewBox 860 wide)
XB0 = 190.0                               # building west face
XB1 = XB0 + BUILDING_FT[1] * S            # building east face (170 u = 50 ft)
XE = XB1 + LOT_FT * S                     # east property line (384.2 u = 113 ft)
YB0 = 160.0
YB1 = YB0 + BUILDING_FT[0] * S            # 714 u = 210 ft
YP0, YP1 = 110.0, 940.0                   # parcel north and south lines
assert abs((XB1 - XB0) - 50 * S) < .01 and abs((XE - XB1) - 113 * S) < .01 and abs((YB1 - YB0) - 210 * S) < .01
XC0, XC1 = 112.0, 146.0                   # Topanga curb and parkway strip edge (sidewalk 146 to 190)
band = {}; _x = XB1
for k, n in BANDS_FT:
    band[k] = (_x, _x + n * S); _x += n * S
assert abs(_x - XE) < .01
PITCH = STALL_PITCH_FT * S
DY = (17 * S) / math.tan(math.radians(60))   # stall line run along the aisle over a 17 ft depth
ROW_Y0 = YB0 + (YB1 - YB0 - ROW_STALLS[0] * PITCH) / 2
ROW_Y1 = ROW_Y0 + ROW_STALLS[0] * PITCH
assert ROW_Y0 - DY > YB0 + 4 and ROW_Y1 + DY < YB1
CX = (band['B'][0] + band['C'][1]) / 2     # center line of the double row


# ---------------------------------------------------------------- pencil helpers
class Pen:
    def __init__(self, seed, uid):
        self.r = random.Random(seed); self.uid = uid; self.out = []; self.n = 0; self.defs = []
    def J(self, a=1.0): return self.r.uniform(-a, a)
    def smooth(self, pts, closed=False):
        n = len(pts)
        if n == 2: return 'M%.1f %.1fL%.1f %.1f' % (*pts[0], *pts[1])
        d = 'M%.1f %.1f' % pts[0]
        rng = range(n) if closed else range(n - 1)
        for i in rng:
            p0 = pts[(i - 1) % n] if (closed or i > 0) else pts[0]
            p1 = pts[i]; p2 = pts[(i + 1) % n]
            p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else pts[-1]
            c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6); c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
            d += 'C%.1f %.1f %.1f %.1f %.1f %.1f' % (*c1, *c2, *p2)
        return d + ('Z' if closed else '')
    def bow(self, pts, closed=False):
        """straight runs with a slight pencil bow: corners stay sharp"""
        d = 'M%.1f %.1f' % pts[0]; seq = pts + ([pts[0]] if closed else [])
        for a, b in zip(seq, seq[1:]):
            L = math.hypot(b[0] - a[0], b[1] - a[1]) or 1; nx, ny = -(b[1] - a[1]) / L, (b[0] - a[0]) / L; o = self.J(min(1.6, L * .04))
            d += 'Q%.1f %.1f %.1f %.1f' % ((a[0] + b[0]) / 2 + nx * o, (a[1] + b[1]) / 2 + ny * o, b[0], b[1])
        return d + ('Z' if closed else '')
    def wob(self, pts, seg=40, j=.8):
        out = []
        for a, b in zip(pts, pts[1:]):
            L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(L / seg))
            for i in range(k):
                t = i / k; out.append((a[0] + (b[0] - a[0]) * t + self.J(j), a[1] + (b[1] - a[1]) * t + self.J(j)))
        out.append((pts[-1][0] + self.J(j), pts[-1][1] + self.J(j))); return out
    def path(self, pts, cls='dk', closed=False, j=.8, seg=40, draw=False, extra=''):
        p = self.wob(pts + ([pts[0]] if closed else []), seg, j)
        if closed: p = p[:-1]
        a = ' pathLength="1"' if draw else ''
        self.out.append('<path class="%s%s" d="%s"%s%s/>' % (cls, ' dw' if draw else '', self.bow(p, closed), a, extra))
    def raw(self, s): self.out.append(s)
    def line(self, x1, y1, x2, y2, cls='dk', **k): self.path([(x1, y1), (x2, y2)], cls, **k)
    def rect(self, x0, y0, x1, y1, cls='dk', **k): self.path([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], cls, closed=True, **k)
    def fill(self, pts, cls):
        self.out.append('<path class="%s" d="M%sZ"/>' % (cls, 'L'.join('%.1f %.1f' % p for p in pts)))
    def text(self, x, y, s, cls='dt', anchor='middle', rot=None):
        tr = ' transform="rotate(%d %.0f %.0f)"' % (rot, x, y) if rot else ''
        self.out.append('<text class="%s" x="%.0f" y="%.0f" text-anchor="%s"%s>%s</text>' % (cls, x, y, anchor, tr, s))
    def hatch(self, x0, y0, x1, y1, gap=7, cls='dk dk-f', angle=45, jx=.6):
        """diagonal pencil hatching clipped to a rectangle (computed, no clipPath)"""
        t = math.tan(math.radians(angle)); d = ''
        w, h = x1 - x0, y1 - y0
        c = -h / t
        while c < w:
            xa, ya = c, h                     # bottom-left start of a line going up-right
            xb, yb = c + h / t, 0
            if xa < 0: ya = h - (-xa) * t; xa = 0
            if xb > w: yb = (xb - w) * t; xb = w
            if yb <= ya: d += 'M%.1f %.1fL%.1f %.1f' % (x0 + xa + self.J(jx), y0 + ya, x0 + xb + self.J(jx), y0 + yb)
            c += gap
        self.out.append('<path class="%s" d="%s"/>' % (cls, d))
    def tree(self, x, y, r, code=None, cls_fill='df-t', cls_line='dk dk-m', draw=False):
        n = 9; lump = []
        for i in range(n):
            a = 2 * math.pi * i / n; rr = r * (1 + self.J(.09)); lump.append((x + rr * math.cos(a), y + rr * math.sin(a)))
        d = self.smooth(lump, True)
        self.out.append('<path class="%s" d="%s" transform="translate(1.6 1.6)"/>' % (cls_fill, d))
        self.out.append('<path class="%s%s" d="%s"%s/>' % (cls_line, ' dw' if draw else '', d, ' pathLength="1"' if draw else ''))
        inner = [(x + r * .55 * math.cos(a), y + r * .55 * math.sin(a)) for a in [self.r.uniform(0, 6.28) for _ in range(5)]]
        self.path([(x - r * .45, y + r * .05), (x - r * .1, y - r * .32), (x + r * .3, y - r * .1), (x + r * .5, y + r * .22)], cls_line + ' dk-f', j=.5)
        self.path([(x + r * .05, y + r * .5), (x + r * .15, y + r * .15), (x - r * .25, y - r * .1)], cls_line + ' dk-f', j=.4)
        self.out.append('<circle class="df-dot" cx="%.1f" cy="%.1f" r="1.8"/>' % (x, y))
        for _ in range(2):
            a = self.r.uniform(0, 6.28); self.line(x, y, x + r * .5 * math.cos(a), y + r * .5 * math.sin(a), cls_line + ' dk-f', j=.3)


def bay_edges():
    y = YB0; out = []
    for name, ft in BAYS_FT:
        out.append((name, y, y + ft * S)); y += ft * S
    return out


def stall_lines(row):
    """aisle-edge/back-edge segments of one row of angled stalls (full parallelograms) and stall centers"""
    xa, xb, sgn = {'A': (band['A'][1], band['A'][0], 1), 'B': (band['B'][0], band['B'][1], 1),
                   'C': (band['C'][1], band['C'][0], -1), 'D': (band['D'][0], band['D'][1], -1)}[row]
    segs = []; cents = []
    for k in range(ROW_STALLS[0] + 1):
        y = ROW_Y0 + k * PITCH; segs.append(((xa, y), (xb, y + sgn * DY)))
    for k in range(ROW_STALLS[0]): cents.append(((xa + xb) / 2, ROW_Y0 + (k + .5) * PITCH + sgn * DY / 2))
    return segs, cents, (xa, xb, sgn)


def stall_poly(row, k):
    segs, _, (xa, xb, sgn) = stall_lines(row)
    (a0, b0), (a1, b1) = segs[k], segs[k + 1]
    return [a0, b0, b1, a1]


def tree_positions():
    """(code, x, y, r) for all 17 proposed trees, derived from the band geometry"""
    out = [('QL', CX, ROW_Y0 - DY / 2 - 1, 24), ('QA', CX, ROW_Y1 + DY / 2 + 3, 24)]
    span = (ROW_Y1 - PITCH * .9) - (ROW_Y0 + PITCH * .9)
    for i in range(6): out.append(('QA', CX, ROW_Y0 + PITCH * .9 + span * (i + .5) / 6, 20))
    xe = (band['D'][1] + band['edge'][1]) / 2 + 4
    for i in range(EAST_TREES): out.append(('SL' if i >= 5 else 'PR', xe, ROW_Y0 + 20 + (ROW_Y1 - ROW_Y0 - 40) * i / 6, 20))
    xp = (band['walk'][0] + band['A'][1]) / 2 + 2
    yp = ROW_Y0 + (ROW_STALLS[0] - PATIO_STALLS) * PITCH
    out.append(('CL', xp, yp + 30, 17)); out.append(('CL', xp, yp + 100, 17))
    cnt = {}
    for c, *_ in out: cnt[c] = cnt.get(c, 0) + 1
    assert cnt == {c: n for c, _, n in TREES}, cnt
    return out


# ---------------------------------------------------------------- the plan, as layers
REMOVED = {}
for _k in range(PATIO_STALLS): REMOVED.setdefault('A', set()).add(ROW_STALLS[0] - 1 - _k)
for _r in 'BC': REMOVED.setdefault(_r, set()).update({0, ROW_STALLS[0] - 1})
assert sum(len(v) for v in REMOVED.values()) == PATIO_STALLS + ISLAND_STALLS
KEPT = {r: [k for k in range(ROW_STALLS[0]) if k not in REMOVED.get(r, ())] for r in 'ABCD'}
assert sum(len(v) for v in KEPT.values()) == AFTER


def ranges(ks):
    out = []
    for k in ks:
        if out and out[-1][1] == k: out[-1][1] = k + 1
        else: out.append([k, k + 1])
    return out


def draw_stalls(P, ks, row):
    segs, _, _ = stall_lines(row)
    for a, b in ranges(ks):
        for k in range(a, b + 1):
            (x0, y0), (x1, y1) = segs[k]; P.line(x0, y0, x1, y1, 'dk', seg=30, j=.5)
        P.line(*segs[a][1], *segs[b][1], cls='dk', seg=50, j=.5)
        P.line(*segs[a][0], *segs[b][0], cls='dk dk-f', seg=60, j=.5)


def base(P, mode):
    R = P.raw; bp = mode in ('L1', 'L2')
    if bp:
        d = ''.join('M%d 0V1100' % x for x in range(0, 861, 40)) + ''.join('M0 %dH860' % y for y in range(0, 1101, 40))
        R('<path class="dk dk-f op3" d="%s"/>' % d)
    P.line(22, 12, 22, 1010, 'dk dk-b', seg=60, j=.7, draw=True)
    P.line(40, 30, 40, 1000, 'dk dk-f dk-d', seg=80, j=.5)
    P.line(XC0, 24, XC0, 1000, 'dk', seg=60, j=.8, draw=True)
    P.line(XC0, 52, 842, 52, 'dk', seg=70, j=.7, draw=True)
    P.line(XC0, 998, 842, 998, 'dk', seg=70, j=.7, draw=True)
    P.line(XC0, 1010, 842, 1010, 'dk dk-b', seg=70, j=.8, draw=True)
    P.line(XC0, 40, 842, 40, 'dk dk-b', seg=70, j=.8, draw=True)
    P.path([(XC1, YP0), (XE + 4, YP0), (XE + 4, YP1), (XC1, YP1)], 'dk dk-b', closed=True, seg=60, j=.9, draw=True)
    P.path([(XC1 + 10, YP0 + 10), (XE - 8, YP0 + 10), (XE - 8, YP1 - 10), (XC1 + 10, YP1 - 10)], 'dk dk-f', closed=True, seg=70, j=.6)
    P.fill([(XB0, YB0), (XB1, YB0), (XB1, YB1), (XB0, YB1)], 'df-sand')
    P.rect(XB0, YB0, XB1, YB1, 'dk dk-b', seg=50, j=.9, draw=True)
    for name, y0, y1 in bay_edges():
        if y0 > YB0 + 1: P.line(XB0, y0, XB1, y0, 'dk dk-f', j=.5)
        P.text((XB0 + XB1) / 2, (y0 + y1) / 2 + 3, name)
        P.line(XB0 - 5, y0 + 4, XB0 - 5, y1 - 4, 'dk dk-r', j=.5, seg=30)
        P.line(XB1 + 5, y0 + 4, XB1 + 5, y1 - 4, 'dk dk-r', j=.5, seg=30)
    P.hatch(XB0, YB0, XB1, YB1, gap=14, cls='dk dk-f op3')
    for hy in (230, 440, 640):
        P.rect(764, hy, 842, hy + 78, 'dk dk-f', seg=40, j=.5)
    P.text(826, 420, 'HOMES', 'dt dt-s', rot=-90)
    P.text(520, 82, 'PROVIDENCIA ST', 'dt dt-m'); P.text(520, 972, 'DUMETZ RD', 'dt dt-m')
    P.text(76, 520, 'TOPANGA CANYON BLVD (SR 27)', 'dt dt-l', rot=-90)
    P.line(815, 100, 815, 54, 'dk', j=.3); P.line(815, 54, 809, 66, 'dk', j=.2); P.line(815, 54, 821, 66, 'dk', j=.2); P.text(815, 108, 'N', 'dt dt-m')
    for x, y in [(408, 123), (734, 123), (412, 912), (519, 912), (588, 912)]:       # existing street trees on Providencia and Dumetz
        P.tree(x, y, 15, cls_fill='df-t', cls_line='dk dk-m')
    for y in (400, 649):                                                       # existing street trees on Topanga
        P.tree(129, y, 15)
    for row in 'ABCD': draw_stalls(P, KEPT[row], row)


def exo(P, mode):
    R = P.raw; R('<g class="exo">')
    for row in 'ABCD':
        rm = sorted(REMOVED.get(row, ()))
        if rm: draw_stalls(P, rm, row)
    P.tree(CX + 9, 517, 9, cls_line='dk dk-m')                                  # the one small tree on the lot
    P.text(596, 186, 'ASPHALT IN FULL SUN', 'dt dt-r')
    P.text(165, 520, 'WEST FACE AND SIDEWALK: FULL AFTERNOON SUN', 'dt dt-s dt-r', rot=-90)
    P.hatch(XB1, YB0, XB1 + 38, YB1, gap=6, cls='dk dk-f op6', angle=55)
    P.text(412, 520, 'AFTERNOON SHADE FROM THE BUILDING', 'dt dt-s', rot=-90)
    if mode == 'exist':
        P.text(596, 872, 'ABOUT 68 ANGLED STALLS', 'dt dt-s')
        for sx in (XB0 + 40, XB0 + 66): R('<circle class="dk" cx="%d" cy="%d" r="5"/>' % (sx, YB1 + 20))
        P.text(275, 918, 'SEATING (ASSUMED)', 'dt dt-s')
    R('</g>')


def heat(P):
    R = P.raw; R('<g class="heat">')
    P.hatch(XB1 + 38, YB0, XE - 8, YB1 + 40, gap=11, cls='dk dk-r op45', angle=50)
    P.hatch(XC1, YB0, XB0, YB1, gap=9, cls='dk dk-r op45', angle=50)
    R('</g>')


def layer_center(P, anchors=True):
    """stage 1: eight trees down the middle: an island at each end and six diamond planters between angled stalls"""
    R = P.raw
    for a, b in ((ROW_Y0 - DY - 6, ROW_Y0 + 4), (ROW_Y1 - 4, ROW_Y1 + DY + 6)):
        P.rect(band['B'][0] + 6, a, band['C'][1] - 6, b, 'dk dk-m', seg=40, j=.5)
        P.fill([(band['B'][0] + 6, a), (band['C'][1] - 6, a), (band['C'][1] - 6, b), (band['B'][0] + 6, b)], 'df-t op5')
    ts = [t for t in tree_positions() if t[0] in ('QL', 'QA') and abs(t[1] - CX) < 1]
    assert len(ts) == CENTER_TREES
    for c, x, y, r in ts:
        if r < 22:                                          # diamond planter in the triangle between stalls
            P.path([(x, y - 16), (x + 14, y), (x, y + 16), (x - 14, y)], 'dk dk-m', closed=True, j=.4)
    for c, x, y, r in ts: P.tree(x, y, r, draw=False)


def layer_east(P):
    """stage 2: swale and hedge along the east edge, seven trees, curb cuts and vines on the fence"""
    R = P.raw; x0, x1 = band['edge'][0] - 4, band['edge'][1]
    pts = [(x0 + 4 * math.sin(i / 3.0), ROW_Y0 - 14 + i * 24) for i in range(0, int((ROW_Y1 - ROW_Y0 + 28) / 24) + 1)]
    P.path(pts + [(x1 - 2, pts[-1][1])] + [(x1 - 2, pts[0][1])], 'dk dk-s', closed=True, j=.4, seg=60)
    P.fill(pts + [(x1 - 2, pts[-1][1]), (x1 - 2, pts[0][1])], 'df-w')
    hx = x1 - 6
    P.path([(hx + P.J(1.5), ROW_Y0 - 10 + i * 12) for i in range(int((ROW_Y1 - ROW_Y0 + 20) / 12))], 'dk dk-m dk-d', j=1.2, seg=12)
    for y in [ROW_Y0 + 70 + i * 100 for i in range(5)]:             # curb cuts let runoff in
        P.line(band['D'][1] - 2, y, band['D'][1] + 12, y, 'dk dk-s', j=.3)
        P.line(band['D'][1] + 8, y - 4, band['D'][1] + 13, y, 'dk dk-s', j=.2); P.line(band['D'][1] + 8, y + 4, band['D'][1] + 13, y, 'dk dk-s', j=.2)
    for y in range(int(ROW_Y0), int(ROW_Y1), 26):                   # vines on the fence
        P.path([(XE - 2, y), (XE + 5, y + 6), (XE - 1, y + 13), (XE + 6, y + 19)], 'dk dk-m', j=.6, seg=8)
    for c, x, y, r in tree_positions():
        if c in ('PR', 'SL'): P.tree(x, y, r)


def layer_pavers(P, uid):
    pid = 'tpv-%s' % uid
    P.raw('<defs><pattern id="%s" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(60)"><path class="dk dk-f" d="M0 0V7"/></pattern></defs>' % pid)
    for row in 'ABCD':
        for a, b in ranges(KEPT[row]):
            poly = []
            segs, _, _ = stall_lines(row)
            poly = [segs[a][0], segs[a][1], segs[b][1], segs[b][0]]
            P.raw('<path class="df-p" fill="url(#%s)" d="M%sZ"/>' % (pid, 'L'.join('%.1f %.1f' % p for p in poly)))


def layer_patio(P):
    R = P.raw; yA = ROW_Y0 + (ROW_STALLS[0] - PATIO_STALLS) * PITCH
    x0, x1 = band['walk'][0], band['A'][1]
    P.fill([(x0, yA), (x1, yA), (x1, YB1 + 30), (XB0, YB1 + 30), (XB0, YB1), (x0, YB1)], 'df-sand op8')
    P.hatch(XB0, YB1, x1, YB1 + 30, gap=7, cls='dk dk-f', angle=40)
    P.rect(x0 + 2, yA, x1, YB1, 'dk dk-m', seg=40, j=.6)
    for i in range(7): P.rect(x1 - 7, yA + i * ((YB1 - yA) / 7) + 2, x1 + 1, yA + (i + 1) * ((YB1 - yA) / 7) - 2, 'dk dk-m', j=.3)   # planter wall toward the cars
    for c, x, y, r in tree_positions():
        if c == 'CL': P.tree(x, y, r)
    for sx in (XB0 + 24, XB0 + 54, XB0 + 84): R('<circle class="dk" cx="%d" cy="%d" r="6"/>' % (sx, YB1 + 16))
    P.text(372, 902, 'PATIO', 'dt dt-m')


def layer_walk(P):
    R = P.raw
    ymid = (ROW_Y0 + ROW_Y1) / 2
    for a, b in (band['aisle1'], band['aisle2']):
        P.fill([(a + 2, ROW_Y0), (b - 2, ROW_Y0), (b - 2, ROW_Y1), (a + 2, ROW_Y1)], 'df-cool')
        for x in [a + 6 + i * 7.2 for i in range(6)]:               # striped crossing through the middle island
            P.line(x, ymid - 16, x, ymid + 16, 'dk', j=.5)
    P.rect(CX - 30, ymid - 17, CX + 30, ymid + 17, 'dk dk-f', j=.4)
    for i in range(6):
        y = ROW_Y0 + 24 + i * ((ROW_Y1 - ROW_Y0 - 150) / 5)
        if y > ROW_Y0 + (ROW_STALLS[0] - PATIO_STALLS) * PITCH - 20: continue
        P.rect(band['walk'][0] + 4, y, band['walk'][0] + 18, y + 16, 'dk dk-m', j=.3)   # planters along the back walk
        R('<circle class="df-dot" cx="%.1f" cy="%.1f" r="2"/>' % (band['walk'][0] + 11, y + 8))


def layer_parkway(P):
    for y in range(int(YB0) + 6, int(YB1), 28):                     # native grasses replace the lawn strip
        x = 129 + P.J(4)
        for ang in (-.5, 0, .5): P.path([(x, y), (x + 11 * math.sin(ang), y - 11 * math.cos(ang))], 'dk dk-m', j=.25, seg=20)
    for y in (525, 778): P.tree(129, y, 15)


def sheet_extras(P, mode, title, code):
    R = P.raw
    if mode == 'L1':
        for x0, x1, label, lx in ((XB0, XB1, "50' ±", 275), (XB1, XE, "LOT 113' ±", 552)):
            P.line(x0, 1022, x1, 1022, 'dk', j=.2, seg=200); P.line(x0, 1015, x0, 1029, 'dk', j=.2); P.line(x1, 1015, x1, 1029, 'dk', j=.2)
            P.text(lx, 1038, label, 'dt dt-m')
        P.text(418, 470, 'PERMEABLE PAVERS IN ALL STALLS', 'dt dt-s', rot=-90)
        P.text(475, 430, 'COOL COAT', 'dt dt-s', rot=-90)
        P.text(733, 520, 'SWALE + HEDGE', 'dt dt-s', rot=-90)
        P.text(40, 1062, '61 STALLS (68 EXISTING). 17 NEW TREES ON SITE.', 'dt dt-s', anchor='start')
        P.text(40, 1080, 'ALL DIMENSIONS ESTIMATED FROM AERIAL IMAGERY.', 'dt dt-s', anchor='start')
    else:
        for c, x, y, r in tree_positions(): P.text(x + r + 8, y + 4, c, 'dt dt-s', anchor='start')
        P.text(40, 1052, 'TREES.  UNDERSTORY: AUTUMN SAGE, YARROW, PENSTEMON, BLUE-EYED GRASS', 'dt dt-s', anchor='start')
        pos = [(40, 1068), (200, 1068), (360, 1068), (40, 1084), (200, 1084)]
        order = [('QA', 'COAST LIVE OAK', 7), ('QL', 'VALLEY OAK', 1), ('PR', 'WESTERN SYCAMORE', 5), ('SL', 'ARROYO WILLOW', 2), ('CL', 'DESERT WILLOW', 2)]
        for (x, y), (c, n, k) in zip(pos, order): P.text(x, y, '%s  %s  (%d)' % (c, n, k), 'dt dt-s', anchor='start')
    P.rect(510, 1042, 842, 1094, 'dk', j=.4, seg=200); P.line(743, 1042, 743, 1094, 'dk', j=.3)
    P.text(522, 1062, 'TOPANGA WILLOWS RETROFIT', 'dt dt-s', anchor='start'); P.text(522, 1082, title, 'dt dt-s', anchor='start')
    P.text(754, 1064, code, 'dt dt-l', anchor='start'); P.text(754, 1083, 'CONCEPT ONLY', 'dt dt-xs', anchor='start')


def build_plan(kind, uid):
    P = Pen('tp-plan-' + kind, uid)
    mode = {'exist': 'exist', 'stages': 'stages', 'L1': 'L1', 'L2': 'L2'}[kind]
    base(P, mode)
    if mode in ('exist', 'stages'):
        pass
    if mode == 'exist':
        exo(P, 'exist'); heat(P)
        P.text(190, 1026, 'DRAWN FROM AERIAL IMAGERY. DIMENSIONS ARE ESTIMATES, NOT A SURVEY.', 'dt dt-xs', anchor='start')
    elif mode == 'stages':
        heat(P); exo(P, 'stages')
        for cls, fn in (('lyr l1', layer_center), ('lyr l2', layer_east), ('lyr l3', lambda p: layer_pavers(p, uid)), ('lyr l4', layer_patio), ('lyr l5', layer_walk), ('lyr l6', layer_parkway)):
            P.raw('<g class="%s">' % cls); fn(P); P.raw('</g>')
        P.text(190, 1026, 'DRAWN FROM AERIAL IMAGERY. DIMENSIONS ARE ESTIMATES, NOT A SURVEY.', 'dt dt-xs', anchor='start')
    elif mode == 'L1':
        layer_center(P); layer_east(P); layer_pavers(P, uid); layer_patio(P); layer_walk(P); layer_parkway(P)
        sheet_extras(P, 'L1', 'LAYOUT + MATERIALS PLAN', 'L-1')
    else:
        layer_center(P); layer_east(P); layer_patio(P); layer_parkway(P)
        sheet_extras(P, 'L2', 'PLANTING PLAN', 'L-2')
    return ''.join(P.out)


# ---------------------------------------------------------------- perspectives (one point, looking north up the Topanga sidewalk)
VPX, HOR, FOC, EYE = 540.0, 300.0, 470.0, 5.5
CURB_X, PARK_X, WALK_X, FACE_X = -15.0, -9.0, 9.0, 9.0      # ft across the walk: curb, parkway edge, sidewalk, storefront face
BLD_Z0 = 12.0                                               # building south end is this far ahead of the camera
STREET_TREES = [(28, False), (66, True), (103, False), (139, True)]   # (ft north of the south end of the building, existing?)
for _z, _e in STREET_TREES: assert BLD_Z0 <= _z + BLD_Z0 <= BLD_Z0 + BUILDING_FT[0]


def pr(X, Y, Z):
    return (VPX + FOC * X / Z, HOR + FOC * (EYE - Y) / Z)


def build_persp(kind, uid):
    P = Pen('tp-persp-' + kind, uid); R = P.raw; proposed = kind == 'proposed'
    Z1 = BLD_Z0 + BUILDING_FT[0]
    far = 330.0
    clip_n = [0]
    def poly(pts3, cls): P.fill([pr(*q) for q in pts3], cls)
    def hatch_poly(pts3, gap, cls, angle=50):
        pts = [pr(*q) for q in pts3]; clip_n[0] += 1; cid = 'tpc-%s-%d' % (uid, clip_n[0])
        R('<clipPath id="%s"><path d="M%sZ"/></clipPath>' % (cid, 'L'.join('%.1f %.1f' % p for p in pts)))
        xs = [q[0] for q in pts]; ys = [q[1] for q in pts]; t = math.tan(math.radians(angle)); d = ''
        x = min(xs) - (max(ys) - min(ys)) / t
        while x < max(xs):
            d += 'M%.1f %.1fL%.1f %.1f' % (x + P.J(.5), max(ys), x + (max(ys) - min(ys)) / t, min(ys)); x += gap
        R('<path class="%s" clip-path="url(#%s)" d="%s"/>' % (cls, cid, d))
    # ground: road, curb, parkway, sidewalk joints
    P.path([pr(-60, 0, 5), pr(-60, 0, far)], 'dk dk-f', j=0)  if False else None
    P.line(*pr(CURB_X, 0, 5), *pr(CURB_X, 0, far), 'dk dk-b', seg=70, j=.8, draw=True)
    P.line(*pr(PARK_X, 0, 5), *pr(PARK_X, 0, far), 'dk', seg=70, j=.7, draw=True)
    P.line(*pr(-34, 0, 5), *pr(-34, 0, far), 'dk dk-f dk-d', seg=90, j=.5)
    P.line(*pr(-60, 0, 6), *pr(-60, 0, far), 'dk dk-f', seg=90, j=.5)
    P.line(*pr(WALK_X, 0, 5), *pr(WALK_X, 0, Z1), 'dk dk-b', seg=70, j=.7, draw=True)
    z = 6
    while z < Z1:                                    # sidewalk joints, tighter with distance
        P.line(*pr(PARK_X, 0, z), *pr(WALK_X, 0, z), 'dk dk-f', j=.4); z += 4 + z * .045
    # building: facade plane at X = FACE_X, with bays, glass, doors and red awnings
    P.fill([pr(FACE_X, 0, BLD_Z0), pr(FACE_X, 15, BLD_Z0), pr(FACE_X, 15, Z1), pr(FACE_X, 0, Z1)], 'df-sand')
    z = BLD_Z0
    for name, ft in BAYS_FT:
        z2 = z + ft
        for q in ((FACE_X, 0, z), (FACE_X, 15, z)): pass
        P.line(*pr(FACE_X, 0, z), *pr(FACE_X, 15, z), 'dk dk-f', j=.5)
        gz0, gz1 = z + 3, z2 - 8
        P.fill([pr(FACE_X, 1, gz0), pr(FACE_X, 8, gz0), pr(FACE_X, 8, gz1), pr(FACE_X, 1, gz1)], 'df-glass')
        P.path([pr(FACE_X, 1, gz0), pr(FACE_X, 8, gz0), pr(FACE_X, 8, gz1), pr(FACE_X, 1, gz1)], 'dk', closed=True, j=.5, seg=60)
        P.line(*pr(FACE_X, 1, (gz0 + gz1) / 2), *pr(FACE_X, 8, (gz0 + gz1) / 2), 'dk dk-f', j=.3)
        d0, d1 = z2 - 6, z2 - 3
        P.path([pr(FACE_X, 0, d0), pr(FACE_X, 7.2, d0), pr(FACE_X, 7.2, d1), pr(FACE_X, 0, d1)], 'dk', closed=True, j=.4, seg=60)
        P.fill([pr(FACE_X, 11, z), pr(FACE_X, 11, z2), pr(FACE_X - 5.5, 9, z2), pr(FACE_X - 5.5, 9, z)], 'df-awn')
        P.path([pr(FACE_X, 11, z), pr(FACE_X, 11, z2), pr(FACE_X - 5.5, 9, z2), pr(FACE_X - 5.5, 9, z)], 'dk dk-r', closed=True, j=.4, seg=60)
        z = z2
    assert abs(z - Z1) < .01
    P.line(*pr(FACE_X, 15, BLD_Z0), *pr(FACE_X, 15, Z1), 'dk dk-b', seg=70, j=.6, draw=True)
    P.line(*pr(FACE_X, 0, BLD_Z0), *pr(FACE_X, 15, BLD_Z0), 'dk dk-b', j=.5)
    # sun: today, long diagonal rays across the walk and glass
    if not proposed:
        for i in range(9):
            x0 = 40 + i * 78 + P.J(8); P.line(x0, 90 + P.J(20), x0 + 175, 560 + P.J(20), 'dk dk-r op4', j=2, seg=120)
        hatch_poly([(-WALK_X, 0, 6), (WALK_X, 0, 6), (WALK_X, 0, Z1), (-WALK_X, 0, Z1)], 9, 'dk dk-r op3', 55)
        R('<path class="dk dk-r" d="M%.0f %.0fq10 -2 16 12m-16 -12l4 12" />' % (368, 318) if False else '')
    # trees, far to near
    for (zt, existing) in sorted(STREET_TREES, key=lambda t: -t[0]):
        if not proposed and not existing: continue
        Zt = BLD_Z0 + zt; xt = -12.0
        g = 1.25 if proposed else 1.0                          # canopies grow over the walk in the proposal
        H, r = (20 if proposed else 15) * g, (12 if proposed else 7.5) * g
        x0, y0 = pr(xt, 0, Zt); xc, yc = pr(xt + (3 if proposed else 0), H - r * .35, Zt); rr = FOC * r / Zt
        P.path([(x0, y0), (x0 + P.J(1), (y0 + yc) / 2), (xc, yc + rr * .4)], 'dk dk-b', j=.5, seg=30)
        if proposed:
            a, b = Zt - 16, Zt + 16
            hatch_poly([(-WALK_X + 2, 0, a), (WALK_X - 1, 0, a), (WALK_X - 1, 0, b), (-WALK_X + 2, 0, b)], 5, 'dk dk-f op5', 40)
            R('<circle class="df-dot" cx="0" cy="0" r="0"/>')
        P.tree(xc, yc, rr, draw=False)
        if proposed:
            P.tree(xc - rr * .55, yc + rr * .35, rr * .62)
    # planters and benches along the storefront (proposed), parkway planting
    if proposed:
        for zt in (22, 60, 98, 150):
            Zb = BLD_Z0 + zt; x0, y0 = pr(FACE_X - 2.5, 0, Zb); x1, y1 = pr(FACE_X - 2.5, 2.4, Zb); w = FOC * 1.7 / Zb
            P.rect(x0 - w / 2, y1, x0 + w / 2, y0, 'dk dk-m', j=.3, seg=40)
            for i in range(3): P.path([(x0 - w / 4 + i * w / 4, y1), (x0 - w / 4 + i * w / 4 + P.J(3), y1 - w * .35)], 'dk dk-m', j=.3, seg=20)
        for zt in (44, 118):
            Zb = BLD_Z0 + zt; (xa, ya), (xb, yb) = pr(FACE_X - 3.5, 1.5, Zb), pr(FACE_X - 3.5, 0, Zb); w = FOC * 4.5 / Zb
            P.rect(xa - w / 2, ya, xa + w / 2, ya + (yb - ya) * .35, 'dk', j=.3, seg=40)
            P.line(xa - w / 2 + 2, ya, xa - w / 2 + 2, yb, 'dk', j=.2); P.line(xa + w / 2 - 2, ya, xa + w / 2 - 2, yb, 'dk', j=.2)
    z = 8
    while z < Z1 - 4:                                        # parkway: lawn ticks today, native grasses in the proposal
        x, y = pr(-12 + P.J(1.6), 0, z); L = FOC * (1.8 if proposed else .5) / z
        for ang in ((-.45, 0, .45) if proposed else (0,)):
            P.path([(x, y), (x + L * math.sin(ang) * 1.2, y - L * math.cos(ang))], 'dk dk-m', j=.2, seg=20)
        z += 5 if proposed else 4
    if proposed:
        P.text(690, 60, 'CANOPY OVER THE SIDEWALK', 'dt dt-m dt-g', anchor='start')
        P.path([(700, 72), (660, 100), (620, 126)], 'dk dk-m', j=.8, seg=30)
    else:
        P.text(300, 200, 'NO SHADE ON THE WALK', 'dt dt-m dt-r'); P.text(300, 220, 'AFTER NOON', 'dt dt-m dt-r')
        P.path([(300, 232), (318, 262), (340, 286)], 'dk dk-r', j=.8, seg=30)
    return ''.join(P.out)


# ---------------------------------------------------------------- generated stylesheet block (tokens only, no hex)
GEN_CSS = '''/* tp:gen start (written by scripts/topanga_art.py) */
.ts-fig{--dl-ink:var(--pencil);--dl-moss:var(--moss);--dl-brick:var(--brick);--dl-slate:var(--slate);--dl-tree:var(--moss-tint);--dl-sand:var(--paper-sunk);--dl-text:var(--pencil);--dl-glass:var(--paper-raised);--dl-water:var(--slate);--dl-cool:var(--paper-raised)}
.ts-fig--bp{--dl-ink:var(--draft-line);--dl-moss:var(--draft-line);--dl-brick:var(--draft-line);--dl-slate:var(--draft-line);--dl-tree:var(--draft-line);--dl-sand:var(--draft-line);--dl-text:var(--draft-line);--dl-glass:var(--draft-line);--dl-water:var(--draft-line);--dl-cool:var(--draft-line)}
.dk{fill:none;stroke:var(--dl-ink);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.dk-b{stroke-width:2.2}.dk-f{stroke-width:.8;opacity:.55}.dk-d{stroke-dasharray:6 5}
.dk-m{stroke:var(--dl-moss)}.dk-r{stroke:var(--dl-brick)}.dk-s{stroke:var(--dl-slate)}
.df-t{fill:var(--dl-tree);opacity:.75}.df-sand{fill:var(--dl-sand);opacity:.9}.df-w{fill:var(--dl-water);opacity:.18}.df-cool{fill:var(--dl-cool);opacity:.55}
.df-p{opacity:.9}.df-dot{fill:var(--dl-moss)}.df-awn{fill:var(--dl-brick);opacity:.78}.df-glass{fill:var(--dl-glass);opacity:.7}.df-sky{fill:var(--dl-glass);opacity:.0}
.ts-fig--bp .df-t{opacity:.13}.ts-fig--bp .df-sand{opacity:.16}.ts-fig--bp .df-w{opacity:.2}.ts-fig--bp .df-cool{opacity:.12}.ts-fig--bp .df-awn{opacity:.3}.ts-fig--bp .df-glass{opacity:.12}
.dt{fill:var(--dl-text);font-family:'Architects Daughter','Hanken Grotesk',sans-serif;font-size:11px;letter-spacing:.03em}
.dt-xs{font-size:9px}.dt-s{font-size:10px}.dt-m{font-size:12.5px}.dt-l{font-size:13px}.dt-r{fill:var(--dl-brick)}.dt-g{fill:var(--dl-moss)}
.op3{opacity:.3}.op4{opacity:.4}.op45{opacity:.45}.op5{opacity:.5}.op6{opacity:.6}.op8{opacity:.8}
/* tp:gen end */
'''

TARGETS = [  # (aria-label starts with, builder)
    ('Pencil perspective of the sidewalk today', lambda: build_persp('today', 'p0')),
    ('Pencil perspective of the sidewalk as proposed', lambda: build_persp('proposed', 'p1')),
    ('Hand-drawn plan of the existing site', lambda: build_plan('exist', 'e')),
    ('Site plan that changes from existing', lambda: build_plan('stages', 's')),
    ('Blueprint layout plan', lambda: build_plan('L1', 'l1')),
    ('Blueprint planting plan', lambda: build_plan('L2', 'l2')),
]


def main():
    html = open(PAGE, encoding='utf-8').read()
    for label, fn in TARGETS:
        m = re.search(r'(<svg [^>]*aria-label="%s[^"]*"[^>]*>)([\s\S]*?)(</svg>)' % re.escape(label), html)
        assert m, label
        html = html[:m.start(2)] + fn() + html[m.end(2):]
    open(PAGE, 'w', encoding='utf-8').write(html)
    css = open(CSS, encoding='utf-8').read()
    css = re.sub(r'/\* tp:gen start[\s\S]*?/\* tp:gen end \*/\n?', '', css).rstrip('\n') + '\n' + GEN_CSS
    open(CSS, 'w', encoding='utf-8').write(css)
    print('regenerated %d drawings' % len(TARGETS))


if __name__ == '__main__':
    main()
