"""Regenerates the hand-drawn infobox art for every Field Guide entry. Run: python3 scripts/art_guide.py"""
import re, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from art_lib import *
W,H=300,150
A={}
def bioswale():
    d=Draw(11)
    d.rect(0,80,86,10,tint=SUNK); d.rect(214,80,86,10,tint=SUNK)
    d.path([(86,90),(104,118),(150,128),(196,118),(214,90)],stroke=INK,w=2)
    d.hatch(86,90,128,60,gap=7,angle=40,color=BRICK,op=.45,poly=[(86,90),(104,118),(150,128),(196,118),(214,90),(214,150),(86,150)])
    for x in (110,128,150,172,190): d.path([(x,112+abs(x-150)*.05),(x-3,96),(x+1,86)],stroke=MOSS,w=2.2); d.path([(x,106),(x+6,94)],stroke=MOSS,w=1.6)
    d.arrow([(28,70),(60,72),(92,96)]); d.arrow([(272,70),(240,72),(208,96)])
    d.tree(30,80,.75); d.text(150,144,'soaks in',SLATE,11,'middle')
    return d
def cool_pavement():
    d=Draw(12); d.sun(262,28,13)
    d.rect(0,110,160,40,tint=BRICKT); d.hatch(0,110,160,40,gap=6,color=BRICK,op=.5)
    d.rect(160,110,140,40,tint=SUNK)
    for x in (24,62,100,138): d.path([(x,102),(x+6,92),(x-5,82),(x+5,72),(x,62)],stroke=BRICK,w=2)
    d.tree(214,110,1.1); d.text(80,142,'dark: hot',BRICK,11,'middle'); d.text(230,142,'coated',MOSS,11,'middle')
    return d
def impervious():
    d=Draw(13)
    for x in (30,70,112,154,196,238): d.line(x,10+(x%7),x-6,30+(x%5),stroke=SLATE,w=2)
    d.rect(18,92,264,24,tint=SUNK); d.hatch(18,92,264,24,gap=8,color=STRONG,op=.6)
    d.path([(18,116),(282,116)],stroke=INK,w=2)
    d.arrow([(20,88),(10,96),(8,118)]); d.arrow([(280,88),(290,96),(292,118)])
    d.text(150,138,'nowhere to go: runs off',SLATE,11,'middle')
    return d
def river():
    d=Draw(14)
    d.poly([(0,70),(70,70),(104,112),(196,112),(230,70),(300,70),(300,150),(0,150)],tint=SUNK)
    d.hatch(0,70,300,80,gap=7,angle=-45,color=STRONG,op=.45,poly=[(0,70),(70,70),(104,112),(196,112),(230,70),(300,70),(300,150),(0,150)])
    d.path([(104,112),(196,112)],stroke=SLATE,w=2.6); d.path([(112,120),(150,116),(188,122)],stroke=SLATE,w=2)
    d.path([(124,128),(176,126)],stroke=SLATE,w=1.6)
    d.tree(24,70,.65); d.tree(274,70,.65); d.text(150,100,'concrete channel',STRONG,11,'middle')
    d.text(150,142,'water gets out fast',SLATE,11,'middle')
    return d
def permeable():
    d=Draw(15)
    for i,x in enumerate(range(20,268,42)): d.rect(x,58,38,16,tint=SUNK,w=1.6)
    d.path([(14,74),(286,74),(286,100),(14,100)],stroke='none',fill=SUNK,closed=True,w=0)
    d.dots(16,78,270,22,38,color=STRONG,r=1.8)
    d.rect(14,100,272,46,tint=BRICKT,w=1.6); d.hatch(14,100,272,46,gap=7,angle=40,color=BRICK,op=.4)
    for x in (58,142,226): d.arrow([(x,14),(x,56),(x,98)],SLATE,2)
    d.text(150,138,'soaks through to the base',BRICK,11,'middle')
    return d
def riparian():
    d=Draw(16)
    d.poly([(0,60),(60,70),(100,106),(200,106),(244,70),(300,60),(300,150),(0,150)],tint=SUNK)
    d.hatch(0,60,300,90,gap=8,angle=40,color=BRICK,op=.3,poly=[(0,60),(60,70),(100,106),(200,106),(244,70),(300,60),(300,150),(0,150)])
    d.path([(100,106),(200,106)],stroke=SLATE,w=2.6); d.path([(110,116),(150,112),(190,118)],stroke=SLATE,w=2)
    d.tree(26,62,.65); d.tree(276,62,.65)
    for x in (214,224,236,246,256): d.path([(x,82+(x-214)*.2),(x-2,70),(x+3,62)],stroke=MOSS,w=1.8)
    d.text(54,100,'bare bank',STRONG,11,'middle'); d.text(262,100,'planted edge',MOSS,11,'middle')
    return d
def sfv():
    d=Draw(17); d.sun(150,30,14)
    d.poly([(0,96),(34,58),(60,80),(100,40),(128,84),(150,100),(172,84),(200,48),(236,86),(266,60),(300,92),(300,112),(0,112)],tint=SUNK)
    d.hatch(0,40,300,72,gap=9,angle=60,color=STRONG,op=.45,poly=[(0,96),(34,58),(60,80),(100,40),(128,84),(150,100),(172,84),(200,48),(236,86),(266,60),(300,92),(300,112),(0,112)])
    d.rect(0,112,300,34,tint=BRICKT,w=0,stroke='none')
    for i,x in enumerate(range(112,196,20)): d.rect(x,120,14,9,w=1.4);
    d.path([(0,112),(300,112)],stroke=INK,w=2)
    d.text(150,144,'the Valley floor',BRICK,11,'middle')
    return d
def shade_equity():
    d=Draw(18); d.sun(262,30,14)
    d.rect(0,108,300,38,tint=SUNK); d.path([(0,108),(300,108)],stroke=INK,w=2)
    d.path([(150,14),(150,146)],stroke=STRONG,w=1.4,dash='4 6')
    for x,s in ((28,.8),(72,.9),(116,.8)):
        d.blob(x+6,112,22,4,tint=MOSST,stroke='none',w=0); d.tree(x,108,s)
    d.rect(186,76,26,6,tint=BRICKT); d.line(190,82,190,108,w=2); d.line(208,82,208,108,w=2)
    d.text(72,142,'shaded walk',MOSS,11,'middle'); d.text(226,142,'bare walk',BRICK,11,'middle')
    return d
def soil_volume():
    d=Draw(19)
    d.rect(0,64,300,86,tint=BRICKT,w=0,stroke='none'); d.hatch(0,64,300,86,gap=8,angle=40,color=BRICK,op=.3)
    d.rect(0,56,110,8,tint=SUNK); d.rect(190,56,110,8,tint=SUNK); d.rect(110,56,80,8,tint=MOSST)
    d.tree(150,56,.8)
    d.path([(150,64),(150,84),(112,100),(80,122)],stroke=INK,w=2); d.path([(150,84),(190,102),(222,124)],stroke=INK,w=2)
    d.path([(150,86),(138,118),(132,136)],stroke=INK,w=1.8); d.path([(150,86),(164,118),(170,136)],stroke=INK,w=1.8)
    d.path([(46,64),(46,138),(254,138),(254,64)],stroke=BRICK,w=1.8,dash='5 5')
    d.text(150,148,'the soil it wants',BRICK,11,'middle')
    return d
def canopy():
    d=Draw(20,.9)
    for cx,cy,r,t in ((58,58,34,MOSST),(112,84,28,MOSST),(168,52,30,MOSST),(224,90,36,MOSST),(266,40,22,MOSST)):
        d.blob(cx,cy,r,r*.92,tint=t,stroke=MOSS,w=1.8,n=12)
        for k in (.66,.34): d.blob(cx,cy,r*k,r*k*.92,stroke=MOSS,w=1,n=10)
        d.o.append('<circle cx="%s" cy="%s" r="2.2" fill="%s"/>'%(cx,cy,INK))
    d.path([(0,132),(300,132)],stroke=INK,w=1.4,dash='6 6'); d.text(150,146,'seen from above',MOSS,11,'middle')
    return d
def uhi():
    d=Draw(21); d.sun(262,30,14)
    d.rect(0,112,300,34,tint=SUNK); d.path([(0,112),(300,112)],stroke=INK,w=2)
    for x,h in ((16,52),(52,38),(88,64),(124,44)):
        d.rect(x,112-h,30,h,tint=BRICKT); d.hatch(x,112-h,30,h,gap=7,angle=-50,color=BRICK,op=.35)
    for x in (30,66,102,138): d.path([(x,56),(x+6,46),(x-5,36),(x+5,26)],stroke=BRICK,w=2)
    d.tree(206,112,.8); d.tree(246,112,.95)
    d.text(80,142,'hot',BRICK,11,'middle'); d.text(228,142,'cooler',MOSS,11,'middle')
    return d
ART={'bioswale':bioswale,'cool-pavement':cool_pavement,'impervious-surface':impervious,'los-angeles-river':river,'permeable-paving':permeable,'riparian-corridor':riparian,'san-fernando-valley':sfv,'shade-equity':shade_equity,'soil-volume':soil_volume,'tree-canopy':canopy,'urban-heat-island':uhi}
if __name__=='__main__':
    root=pathlib.Path(__file__).resolve().parent.parent
    for slug,fn in ART.items():
        f=root/'guide'/slug/'index.html'; t=f.read_text()
        new=fn().svg(W,H)
        t2=re.sub(r'<svg class="rds-infobox__art".*?</svg>',lambda m:new,t,count=1,flags=re.S)
        f.write_text(t2); print(slug,len(new))
