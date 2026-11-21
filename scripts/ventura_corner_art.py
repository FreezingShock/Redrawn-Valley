#!/usr/bin/env python3
"""Drawings for studies/ventura-topanga-corner, generated from dimensions (feet) so they stay in proportion.
Deterministic (seeded). Usage: python3 scripts/ventura_corner_art.py <out_dir>   -> fig1_plan.svg, fig3_section.svg
All dimensions are ESTIMATES unless the study says otherwise: lot area 0.22 acre and building 5,437 sf come from a
listing; the 100 x 96 ft lot, 78 x 70 ft building, 10 ft sidewalks and everything proposed are drawing assumptions."""
import sys, pathlib, math
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from sketchlib import *

S = 5  # px per foot in the plan
W, H = 1000, 760
LX, LY, LW, LD = 70, 30, 100 * S, 96 * S        # lot: 100 ft along Ventura, 96 ft along Topanga
SW = 10 * S                                       # assumed sidewalk
BX0, BY0, BX1, BY1 = 170, 130, 560, 480           # building 78 x 70 ft (about 5,460 sf; listing says 5,437)
NX, NY = 440, 370                                 # plaza notch: 24 x 22 ft cut from the corner (528 sf)
RIGHT = LX + LW                                   # lot east edge (Topanga side)
BOT = LY + LD                                     # lot south edge (Ventura side)


def tx(d, x, y, t, **k):
    d.text(x, y, t, **k)


def plan(seed=3):
    d = Draw(seed, jitter=.9)
    o = d.o
    # --- roads and walks (always) ---
    o.append('<rect x="%d" y="0" width="%d" height="%d" fill="%s"/>' % (RIGHT + SW, 140, H, SUNK))             # Topanga roadway
    o.append('<rect x="0" y="%d" width="%d" height="%d" fill="%s"/>' % (BOT + SW, W, 80, SUNK))               # Ventura roadway
    o.append('<rect x="%d" y="0" width="%d" height="%d" fill="%s" opacity=".7"/>' % (RIGHT, SW, BOT + SW, RAISED))
    o.append('<rect x="0" y="%d" width="%d" height="%d" fill="%s" opacity=".7"/>' % (BOT, RIGHT + SW, SW, RAISED))
    d.line(RIGHT + SW, 0, RIGHT + SW, H, stroke=STRONG, w=1.4)
    d.line(0, BOT + SW, W, BOT + SW, stroke=STRONG, w=1.4)
    for yy in range(20, BOT, 46):  # dashed centre line
        d.line(RIGHT + SW + 70, yy, RIGHT + SW + 70, yy + 22, stroke=STRONG, w=1.4, j=.2)
    for xx in range(20, W, 46):
        d.line(xx, BOT + SW + 40, xx + 22, BOT + SW + 40, stroke=STRONG, w=1.4, j=.2)
    tx(d, RIGHT + SW + 70, 22, 'TOPANGA CANYON BLVD', color=SLATE, size=12, anchor='middle', rot=0)
    tx(d, 250, BOT + SW + 33, 'VENTURA BLVD', color=SLATE, size=12, anchor='middle')
    # other three corners, hatched: not studied
    for (x, y, w, h) in [(RIGHT + SW + 140 + SW, 0, W - (RIGHT + SW + 150), BOT + SW),
                         (0, BOT + SW + 80 + SW, RIGHT + SW, H - (BOT + SW + 90)),
                         (RIGHT + SW + 150, BOT + SW + 90, W - (RIGHT + SW + 150), H - (BOT + SW + 90))]:
        if w > 10 and h > 10:
            d.hatch(x - h, y, w + h, h, gap=11, angle=45, color=LINE, sw=1.2, op=1, poly=[(x, y), (x + w, y), (x + w, y + h), (x, y + h)])
            d.rect(x, y, w, h, stroke=LINE, w=1.2)
    tx(d, RIGHT + SW + 255, 270, 'other corners', color=STRONG, size=13, anchor='middle')
    tx(d, RIGHT + SW + 255, 288, 'not studied', color=STRONG, size=13, anchor='middle')

    # --- lot ---
    d.rect(LX, LY, LW, LD, stroke=STRONG, w=1.4, dash='6 5', j=.3)

    # parking and paving today (L-shape around the building), tinted by heat
    park = [(LX, LY), (RIGHT, LY), (RIGHT, BY0), (BX0, BY0), (BX0, BOT), (LX, BOT)]
    d.hatch(LX, LY, LW, LD, gap=9, angle=-45, color=STRONG, sw=.9, op=.55, poly=park)
    o.append('<g class="heat"><path d="M%s Z" fill="%s" opacity=".55"/></g>' % (' L'.join('%d %d' % p for p in park), BRICKT))
    tx(d, 120, 80, 'parking', color=INK, size=14, anchor='middle')
    tx(d, 120, 98, 'side and rear', color=INK, size=12, anchor='middle')

    # --- building: today (full) until stage 2, then the notched L ---
    full = [(BX0, BY0), (BX1, BY0), (BX1, BY1), (BX0, BY1)]
    notch = [(BX0, BY0), (BX1, BY0), (BX1, NY), (NX, NY), (NX, BY1), (BX0, BY1)]
    g = ['<g class="stg-u2">']
    d.o, hold = [], d.o
    d.poly(full, tint=BRICKT, w=2.2)
    tx(d, 365, 290, 'building today', color=BRICK, size=15, anchor='middle')
    tx(d, 365, 310, 'about 5,437 sq ft', color=INK, size=13, anchor='middle')
    g += d.o + ['</g>']
    d.o = hold
    o += g
    g = ['<g class="stg-f2">']
    d.o, hold = [], d.o
    d.poly(notch, tint=BRICKT, w=2.2)
    # plaza: corner cut, paved with pavers, one tree
    plaza = [(NX, NY), (RIGHT, NY), (RIGHT, BOT), (NX, BOT)]
    d.poly(plaza, tint=MOSST, stroke=MOSS, w=2)
    d.hatch(NX, NY, RIGHT - NX, BOT - NY, gap=14, angle=45, color=MOSS, sw=.7, op=.45, poly=plaza)
    d.hatch(NX, NY, RIGHT - NX, BOT - NY, gap=14, angle=-45, color=MOSS, sw=.7, op=.45, poly=plaza)
    d.blob(520, 450, 20, 18, tint=MOSST, stroke=MOSS, w=2, n=9)
    d.line(511, 450, 529, 450, stroke=MOSS, w=1.2)
    tx(d, 506, 396, 'corner plaza', color=MOSS, size=14, anchor='middle')
    tx(d, 506, 412, '24 x 22 ft', color=MOSS, size=12, anchor='middle')
    g += d.o + ['</g>']
    d.o = hold
    o += g

    # --- stage 3: four shops with doors and awnings ---
    d.o, hold = [], d.o
    for (x1, y1, x2, y2) in [(300, BY0, 300, BY1), (300, 300, NX, 300)]:
        d.line(x1, y1, x2, y2, stroke=INK, w=1.6, dash='2 5')
    for (cx, cy, hor, lab) in [(235, BY1, True, 'A'), (370, BY1, True, 'B2'), (NX, 430, False, ''), (506, NY, True, ''),
                               (BX1, 250, False, 'C'), (370, BY0, True, '')]:
        if hor:
            d.line(cx - 22, cy, cx + 22, cy, stroke=PAPER if False else RAISED, w=6, j=.1)
            d.line(cx - 22, cy + (7 if cy == BY1 else -7 if cy == BY0 else 7), cx + 22, cy + (7 if cy == BY1 else -7 if cy == BY0 else 7), stroke=BRICK, w=3, j=.2)
        else:
            d.line(cx, cy - 22, cx, cy + 22, stroke=RAISED, w=6, j=.1)
            d.line(cx + (7 if cx == BX1 else -7), cy - 22, cx + (7 if cx == BX1 else -7), cy + 22, stroke=BRICK, w=3, j=.2)
    tx(d, 235, 300, 'A', color=INK, size=20, anchor='middle')
    tx(d, 235, 322, '1,820 sf', color=INK, size=12, anchor='middle')
    tx(d, 370, 214, 'B', color=INK, size=20, anchor='middle')
    tx(d, 370, 236, '952 sf', color=INK, size=12, anchor='middle')
    tx(d, 370, 380, 'C', color=INK, size=20, anchor='middle')
    tx(d, 370, 402, '1,008 sf', color=INK, size=12, anchor='middle')
    tx(d, 500, 214, 'D', color=INK, size=20, anchor='middle')
    tx(d, 500, 236, '1,152 sf', color=INK, size=12, anchor='middle')
    o.append('<g class="stg-f3">' + ''.join(d.o) + '</g>')
    d.o = hold

    # --- stage 1: street trees ---
    d.o, hold = [], d.o
    for (x, y) in [(220, BOT + 25), (420, BOT + 25), (RIGHT + 25, 170), (RIGHT + 25, 330)]:
        d.blob(x, y, 21, 21, tint=MOSST, stroke=MOSS, w=2, n=9)
        d.line(x - 6, y, x + 6, y, stroke=MOSS, w=1.2)
    tx(d, 120, BOT + 30, '4 street trees (2 here)', color=MOSS, size=12, anchor='middle')
    o.append('<g class="stg-f1">' + ''.join(d.o) + '</g>')
    d.o = hold

    # --- stage 4: two canopy trees in the north strip ---
    d.o, hold = [], d.o
    for x in (280, 450):
        d.rect(x - 14, 60, 28, 50, tint=MOSST, stroke=MOSS, w=1.6)
        d.blob(x, 85, 30, 28, tint=MOSST, stroke=MOSS, w=2, n=10)
        d.line(x - 8, 85, x + 8, 85, stroke=MOSS, w=1.2)
    tx(d, 365, 140, '', color=MOSS)
    tx(d, 365, 126, '2 canopy trees', color=MOSS, size=12, anchor='middle')
    o.append('<g class="stg-f4">' + ''.join(d.o) + '</g>')
    d.o = hold

    # --- stage 5: crossing: zebra crosswalks, curb extensions, leading pedestrian interval ---
    d.o, hold = [], d.o
    # crosswalk over Topanga (spans the roadway along the Ventura sidewalk line)
    for k in range(7):
        x = RIGHT + SW + 8 + k * 18
        d.rect(x, BOT + 4, 11, SW - 8, tint=None, stroke=INK, w=1.2, j=.2)
    # crosswalk over Ventura (spans roadway along the Topanga sidewalk line)
    for k in range(4):
        y = BOT + SW + 8 + k * 17
        d.rect(RIGHT + 4, y, SW - 8, 10, tint=None, stroke=INK, w=1.2, j=.2)
    # curb extensions: sidewalk grows into the road at the corner
    d.poly([(RIGHT + SW, BOT - 30), (RIGHT + SW + 34, BOT - 30), (RIGHT + SW + 34, BOT + SW), (RIGHT + SW, BOT + SW)], tint=SKY, stroke=SLATE, w=1.8, dash='5 4')
    d.poly([(RIGHT - 30, BOT + SW), (RIGHT + SW, BOT + SW), (RIGHT + SW, BOT + SW + 34), (RIGHT - 30, BOT + SW + 34)], tint=SKY, stroke=SLATE, w=1.8, dash='5 4')
    tx(d, RIGHT + SW + 75, BOT - 30, 'head start for', color=SLATE, size=12, anchor='middle')
    tx(d, RIGHT + SW + 75, BOT - 14, 'people on foot', color=SLATE, size=12, anchor='middle')
    o.append('<g class="stg-f5">' + ''.join(d.o) + '</g>')
    d.o = hold

    # --- stage 6: bus shelter and bike racks at the plaza edge ---
    d.o, hold = [], d.o
    d.rect(300, BOT + 12, 56, 26, tint=SKY, stroke=SLATE, w=2)
    tx(d, 428, BOT + 52 - 8, '', color=SLATE)
    tx(d, 428, BOT - 6 + 0, '', color=SLATE)
    for k in range(3):
        d.path([(RIGHT - 115 + k * 16, BOT - 8), (RIGHT - 115 + k * 16, BOT - 28), (RIGHT - 107 + k * 16, BOT - 28), (RIGHT - 107 + k * 16, BOT - 8)], stroke=SLATE, w=1.8)
    tx(d, 328, BOT + 52, 'bus shelter', color=SLATE, size=11, anchor='middle')
    o.append('<g class="stg-f6">' + ''.join(d.o) + '</g>')
    d.o = hold

    # scale bar
    d.line(LX, 712, LX + 20 * S, 712, stroke=INK, w=2)
    d.line(LX, 706, LX, 718, stroke=INK, w=2)
    d.line(LX + 20 * S, 706, LX + 20 * S, 718, stroke=INK, w=2)
    d.line(LX + 10 * S, 709, LX + 10 * S, 715, stroke=INK, w=1.4)
    tx(d, LX + 10 * S, 738, '20 ft', color=INK, size=12, anchor='middle')
    tx(d, LX, 756 if False else 700, '', color=INK)
    tx(d, 560, 738, 'plan not oriented to north', color=STRONG, size=11, anchor='start') if False else None
    # dimension on lot
    d.arrow([(LX, 22), (LX + LW, 22)], color=STRONG, w=1.4)
    tx(d, LX + LW / 2, 16, '100 ft (assumed)', color=STRONG, size=11, anchor='middle')
    return d.svg(W, H, cls='vt-plan', bg=RAISED, grid=40)


def section(seed=7):
    """Section through the Ventura frontage, in feet: building wall, awning, 5 ft clear walk, tree/bench zone, curb."""
    d = Draw(seed, jitter=.8)
    F = 14  # px per foot
    x0, ground = 150, 330
    W2, H2 = 560, 470
    ox = lambda ft: x0 + ft * F
    # ground and curb
    d.line(0, ground, W2, ground, stroke=INK, w=2.2)
    d.rect(ox(10) , ground, 8, 14, stroke=INK, w=1.6)
    # building wall, 14 ft tall storefront, with a door
    d.poly([(ox(-3), ground), (ox(-3), ground - 14 * F), (ox(0), ground - 14 * F), (ox(0), ground)], tint=BRICKT, w=2.2)
    d.rect(ox(-3), ground - 9 * F, 3 * F, 9 * F, stroke=INK, w=1.2, tint=SKY)
    # awning 4 ft overhang
    d.poly([(ox(0), ground - 10.5 * F), (ox(4), ground - 9.3 * F), (ox(4), ground - 8.8 * F), (ox(0), ground - 10 * F)], tint=BRICKT, stroke=BRICK, w=2)
    # tree in a well at 10 ft sidewalk edge: wells reach curb zone
    tx_ = ox(8)
    d.path([(tx_, ground), (tx_ + d.J(1), ground - 8 * F), (tx_ + d.J(1), ground - 11 * F)], stroke=INK, w=3)
    d.blob(tx_, ground - 15 * F, 3.6 * F, 3.2 * F, tint=MOSST, stroke=MOSS, w=2, n=10)
    # bench
    d.rect(ox(5.6), ground - 1.6 * F, 2 * F * 0.6, 1.6 * F, stroke=INK, w=1.6, tint=SUNK)
    # walker
    px = ox(2.6)
    d.blob(px, ground - 5.3 * F, 7, 7, tint=SUNK, stroke=INK, w=1.8, n=8)
    d.path([(px, ground - 4.6 * F), (px, ground - 2.4 * F)], stroke=INK, w=2.2)
    d.path([(px, ground - 2.4 * F), (px - 8, ground), (px, ground - 2.4 * F), (px + 8, ground)], stroke=INK, w=2.2)
    # dimension strings (feet)
    def dim(a, b, y, label, color=SLATE):
        d.arrow([(ox(a), y), (ox(b), y)], color=color, w=1.6)
        d.line(ox(a), y - 6, ox(a), y + 6, stroke=color, w=1.6)
        d.line(ox(b), y - 6, ox(b), y + 6, stroke=color, w=1.6)
        d.text((ox(a) + ox(b)) / 2, y - 8, label, color=color, size=12, anchor='middle')
    dim(0, 4, ground + 38, 'awning 4 ft')
    dim(0, 5, ground + 70, '5 ft clear walk (City minimum)')
    dim(5, 10, ground + 102, '5 ft trees + bench')
    d.text(ox(-1.5), ground - 14 * F - 10, 'shop front', color=BRICK, size=13, anchor='middle')
    d.text(ox(10), ground + 28, 'curb', color=STRONG, size=12, anchor='middle')
    d.text(ox(8), ground - 20.6 * F, 'street tree', color=MOSS, size=13, anchor='middle')
    d.text(ox(2.6), ground - 6.3 * F, 'walker', color=INK, size=12, anchor='middle')
    return d.svg(W2, H2, cls='vt-section', bg=RAISED, grid=28)


if __name__ == '__main__':
    out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    (out / 'fig1_plan.svg').write_text(plan())
    (out / 'fig3_section.svg').write_text(section())
    print('ok')
