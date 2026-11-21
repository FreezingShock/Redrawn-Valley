"""Flat-tile collage banners for the guide, notes and studies index pages: 3 tinted fields side by side, each with one
drafting object (compass, ruler, scale bar), one plan/section fragment and one texture (grid, halftone, contour).
Run: python3 scripts/art_tiles.py   (rewrites the <figure class="rv-tiles"> block in each index page)"""
import math, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from art_lib import *
H=220
def grid(d,x,y,w,h,gap=14,color=MOSS,op=.35,sw=1):
    p=''.join('M%d %dV%d'%(x+i,y,y+h) for i in range(0,int(w)+1,gap))+''.join('M%d %dH%d'%(x,y+j,x+w) for j in range(0,int(h)+1,gap))
    d.o.append('<path d="%s" stroke="%s" stroke-width="%s" opacity="%s" fill="none"/>'%(p,color,sw,op))
def halftone(d,x,y,w,h,step=11,color=INK,rmax=3.4,dirx=1):
    for i in range(int(w/step)):
        for j in range(int(h/step)):
            t=(i/(w/step)) if dirx else 1-(i/(w/step)); r=rmax*(0.15+0.85*t)
            d.o.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" opacity=".75"/>'%(x+i*step+step/2,y+j*step+step/2,r,color))
def contour(d,cx,cy,r0,n,step,color=MOSS,sx=1.3):
    for i in range(n):
        d.blob(cx,cy,(r0+i*step)*sx,(r0+i*step)*.8,stroke=color,w=1.5 if i%3==0 else 1,n=12)
def ruler(d,x,y,L,color=INK,vertical=False,step=10,label=True):
    d.line(x,y,x+(0 if vertical else L),y+(L if vertical else 0),stroke=color,w=1.8)
    for k in range(0,int(L/step)+1):
        l=11 if k%5==0 else 6
        if vertical: d.line(x,y+k*step,x+l,y+k*step,stroke=color,w=1.4)
        else: d.line(x+k*step,y,x+k*step,y+l,stroke=color,w=1.4)
        if label and k%5==0 and k>0 and not vertical: d.text(x+k*step,y+24,str(k*2),color,10,'middle')
def compass(d,x,y,sc=1,col=INK):
    d.blob(x,y,7*sc,7*sc,tint=RAISED,stroke=col,w=2)
    d.path([(x,y),(x-34*sc,y+96*sc)],stroke=col,w=2.4); d.path([(x,y),(x+30*sc,y+96*sc)],stroke=col,w=2.4)
    d.line(x-34*sc,y+96*sc,x-37*sc,y+108*sc,stroke=BRICK,w=2.4); d.line(x+30*sc,y+96*sc,x+32*sc,y+108*sc,stroke=BRICK,w=2.4)
    d.path([(x-20*sc,y+56*sc),(x,y+48*sc),(x+17*sc,y+56*sc)],stroke=col,w=1.8)
def plan(d,x,y,w,h):
    d.rect(x+10,y+12,w*.34,h-24,tint=SUNK); d.hatch(x+10,y+12,w*.34,h-24,gap=7,color=STRONG,op=.5)
    d.hatch(x+w*.42,y+12,w*.5,h-24,gap=8,angle=-40,color=BRICK,op=.35)
    for i in range(5): d.line(x+w*.42,y+22+i*34,x+w*.92,y+10+i*34,stroke=BRICK,w=1.2,op=.7)
    for i,(cx,cy) in enumerate(((.5,.3),(.62,.7),(.74,.35),(.84,.75),(.56,.52))):
        d.blob(x+w*cx,y+h*cy,15,14,tint=MOSST,stroke=MOSS,w=1.8,n=9); d.o.append('<circle cx="%.1f" cy="%.1f" r="2" fill="%s"/>'%(x+w*cx,y+h*cy,INK))
def section(d,x,y,w,h):
    gy=y+h*.62
    d.rect(x,gy,w,h*.38,tint=BRICKT,w=0,stroke='none'); d.hatch(x,gy,w,h*.38,gap=8,color=BRICK,op=.35)
    d.path([(x,gy),(x+w,gy)],stroke=INK,w=2.2)
    d.tree(x+w*.3,gy,1.3); d.tree(x+w*.72,gy,1.0)
    d.arrow([(x+w*.12,y+14),(x+w*.12,gy-10)],SLATE,2)
def bars(d,x,y,w,h):
    vals=(.5,.8,.62,.9,.7)
    cols=(BRICK,SLATE,MOSS,BRICKT,MOSST)
    bw=w/len(vals)*.6
    for i,v in enumerate(vals):
        bx=x+w/len(vals)*(i+.2); bh=h*v*.75
        d.o.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s" stroke="%s" stroke-width="1.5"/>'%(bx,y+h-bh,bw,bh,cols[i],RAISED))
def pen(d,x,y,col=RAISED):
    d.path([(x,y),(x+70,y-40)],stroke=col,w=5); d.path([(x+70,y-40),(x+80,y-46)],stroke=BRICK,w=5)
def banner(variant,seed):
    d=Draw(seed,.9); W=1120
    xs=[0,400,720,W]
    if variant=='guide':
        tiles=[(xs[0],xs[1],MOSST),(xs[1],xs[2],SUNK),(xs[2],xs[3],BRICKT)]
    elif variant=='notes':
        tiles=[(xs[0],xs[1],INK),(xs[1],xs[2],RAISED),(xs[2],xs[3],MOSST)]
    else:
        tiles=[(xs[0],xs[1],BRICKT),(xs[1],xs[2],MOSS),(xs[2],xs[3],SUNK)]
    for a,b,c in tiles: d.o.append('<rect x="%s" y="0" width="%s" height="%s" fill="%s"/>'%(a,b-a,H,c))
    t0,t1,t2=tiles
    if variant=='guide':
        grid(d,t0[0],0,400,H,16); section(d,20,16,360,190)
        contour(d,560,112,10,6,14,STRONG); ruler(d,430,40,170,INK,False,10); ruler(d,690,16,190,INK,True,10,False)
        halftone(d,t2[0]+10,10,380,200,12,BRICK,4); compass(d,930,26,1.2); d.text(1040,150,'to scale',INK,14,'middle',-4)
    elif variant=='notes':
        d.o.append('<rect x="0" y="0" width="400" height="%d" fill="%s"/>'%(H,INK)); bars(d,40,20,320,190)
        d.path([(420,170),(480,140),(540,152),(600,80),(660,100),(700,40)],stroke=INK,w=2.4)
        for (x,y) in ((480,140),(540,152),(600,80),(660,100)): d.blob(x,y,6,6,tint=BRICKT,stroke=INK,w=1.8,n=6)
        grid(d,400,0,320,H,20,STRONG,.35); d.text(440,200,'reading, then drawing',BRICK,15)
        grid(d,720,0,400,H,18,MOSS,.3); compass(d,900,30,1.15); d.tree(1030,200,1.2); pen(d,780,190,INK); halftone(d,t2[0]+20,20,90,170,12,MOSS,3.4,0)
    else:
        plan(d,20,10,360,200); grid(d,0,0,400,H,20,BRICK,.2)
        d.o.append('<rect x="400" y="0" width="320" height="%d" fill="%s"/>'%(H,MOSS)); grid(d,400,0,320,H,20,RAISED,.3)
        compass(d,560,26,1.25,RAISED); d.blob(560,26,7,7,tint=RAISED,stroke=RAISED,w=2)
        contour(d,880,112,8,7,13,STRONG); ruler(d,740,196,300,INK,False,10); halftone(d,1000,10,110,100,12,BRICK,3.6)
        d.text(430,206,'1 in = 20 ft',INK,15)
    cids=''
    inner=''.join(d.o)
    return ('<figure class="rv-tiles" aria-hidden="true"><svg viewBox="0 0 %d %d" focusable="false" preserveAspectRatio="xMidYMid slice"><defs>%s</defs>%s</svg></figure>'%(W,H,''.join(d.defs),inner))
if __name__=='__main__':
    root=pathlib.Path(__file__).resolve().parent.parent
    # (file, anchor: first closing tag after which to insert)
    for slug,variant,seed in (('guide','guide',31),('notes','notes',32),('studies','studies',33)):
        f=root/slug/'index.html'; t=f.read_text(); new=banner(variant,seed)
        if 'class="rv-tiles"' in t: t=re.sub(r'<figure class="rv-tiles".*?</figure>',lambda m:new,t,count=1,flags=re.S)
        else:
            m=re.search(r'(<h1 class="rds-display(?:-xl)?"[^>]*>.*?</h1>.*?</div>\s*)',t,re.S)
            # insert after the closing of the first sechead div
            i=m.end(); t=t[:i]+new+'\n'+t[i:]
        f.write_text(t); print(slug,len(new))
