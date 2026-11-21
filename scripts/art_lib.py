"""Tiny hand-drawn SVG helper used to (re)generate the Field Guide infobox art and other sketches.
Deterministic: each drawing seeds its own RNG, so re-running gives identical files. Palette tokens only.
Usage: from art_lib import *; d=Draw(seed); d.line(...); svg=d.svg(300,150)"""
import math, random, zlib
INK='#1f1d1a'; MOSS='#2f4a3a'; BRICK='#9c3d24'; SLATE='#35506b'; LINE='#d9d0bd'; STRONG='#8a8170'
MOSST='#dfe6d8'; BRICKT='#f0d9cc'; SUNK='#ece5d6'; RAISED='#fbf8f1'; SKY='#e8eef5'

class Draw:
    def __init__(s, seed=1, jitter=1.1):
        s.r=random.Random(seed); s.sid=zlib.crc32(str(seed).encode())%9973; s.j=jitter; s.o=[]; s.defs=[]; s.n=0
    def J(s,a=None): a=s.j if a is None else a; return s.r.uniform(-a,a)
    def _smooth(s,pts,closed=False):
        n=len(pts)
        if n<3: return 'M%.1f %.1f'%pts[0]+''.join('L%.1f %.1f'%p for p in pts[1:])
        d='M%.1f %.1f'%pts[0]
        rng=range(n) if closed else range(n-1)
        for i in rng:
            p0=pts[(i-1)%n] if (closed or i>0) else pts[0]
            p1=pts[i]; p2=pts[(i+1)%n]
            p3=pts[(i+2)%n] if (closed or i+2<n) else pts[-1]
            c1=(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6); c2=(p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6)
            d+='C%.1f %.1f %.1f %.1f %.1f %.1f'%(*c1,*c2,*p2)
        return d+('Z' if closed else '')
    def _wob(s,pts,seg=16,j=None):
        out=[]
        for (a,b) in zip(pts,pts[1:]):
            L=math.hypot(b[0]-a[0],b[1]-a[1]); k=max(1,int(L/seg))
            for i in range(k):
                t=i/k; out.append((a[0]+(b[0]-a[0])*t+s.J(j),a[1]+(b[1]-a[1])*t+s.J(j)))
        out.append((pts[-1][0]+s.J(j),pts[-1][1]+s.J(j))); return out
    def path(s,pts,stroke=INK,w=1.8,fill='none',closed=False,op=1,dash=None,off=(0,0),j=None):
        p=s._wob(pts+([pts[0]] if closed else []),j=j)
        if closed: p=p[:-1]
        d=s._smooth(p,closed)
        da=' stroke-dasharray="%s"'%dash if dash else ''
        tr=' transform="translate(%s %s)"'%off if off!=(0,0) else ''
        s.o.append('<path d="%s" stroke="%s" stroke-width="%s" fill="%s"%s%s%s stroke-linecap="round" stroke-linejoin="round"/>'%(d,stroke,w,fill,da,tr,' opacity="%s"'%op if op!=1 else ''))
    def line(s,x1,y1,x2,y2,**k): s.path([(x1,y1),(x2,y2)],**k)
    def poly(s,pts,tint=None,stroke=INK,w=1.8,**k):
        if tint: s.path(pts,stroke='none',fill=tint,closed=True,off=(2.2,2.2),j=.3,w=0)
        s.path(pts,stroke=stroke,w=w,closed=True,**k)
    def rect(s,x,y,rw,rh,**k): s.poly([(x,y),(x+rw,y),(x+rw,y+rh),(x,y+rh)],**k)
    def blob(s,cx,cy,rx,ry,tint=None,stroke=INK,w=1.8,n=10,**k):
        pts=[(cx+rx*math.cos(2*math.pi*i/n)*(1+s.J(.07)),cy+ry*math.sin(2*math.pi*i/n)*(1+s.J(.07))) for i in range(n)]
        if tint: s.o.append('<path d="%s" fill="%s" transform="translate(2.2 2.2)"/>'%(s._smooth(pts,True),tint))
        s.o.append('<path d="%s" stroke="%s" stroke-width="%s" fill="none" stroke-linecap="round"/>'%(s._smooth(pts,True),stroke,w))
    def hatch(s,x,y,w,h,gap=6,angle=45,color=STRONG,sw=1.1,op=.8,poly=None):
        s.n+=1; cid='c%d_%d'%(s.sid,s.n)
        if poly: s.defs.append('<clipPath id="%s"><path d="%s"/></clipPath>'%(cid,'M'+'L'.join('%s %s'%p for p in poly)+'Z'))
        else: s.defs.append('<clipPath id="%s"><rect x="%s" y="%s" width="%s" height="%s"/></clipPath>'%(cid,x,y,w,h))
        t=math.tan(math.radians(angle)); L=[]
        k=-int(h/gap)-1
        c=x
        lines=''
        i=0
        while c<x+w+h:
            x1=c; y1=y+h; x2=c+h/t; y2=y
            lines+='M%.1f %.1f L%.1f %.1f '%(x1+s.J(.5),y1,x2+s.J(.5),y2); c+=gap
            i+=1
        s.o.append('<path d="%s" clip-path="url(#%s)" stroke="%s" stroke-width="%s" opacity="%s" fill="none" stroke-linecap="round"/>'%(lines,cid,color,sw,op))
    def dots(s,x,y,w,h,n,color=STRONG,r=1.1):
        for _ in range(n): s.o.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" opacity=".7"/>'%(x+s.r.random()*w,y+s.r.random()*h,r*(.6+s.r.random()*.8),color))
    def tree(s,x,y,sc=1,tint=MOSST,col=MOSS):
        s.path([(x,y),(x+s.J(1),y-18*sc),(x+s.J(1),y-30*sc)],stroke=INK,w=2.2)
        cx,cy=x,y-44*sc; pts=[]; n=9
        for i in range(n):
            a=2*math.pi*i/n; rr=(20+s.r.uniform(-3,3.5))*sc
            pts.append((cx+rr*1.1*math.cos(a),cy+rr*math.sin(a)))
        d=s._smooth(pts,True)
        s.o.append('<path d="%s" fill="%s" transform="translate(2.5 2.5)"/>'%(d,tint))
        s.o.append('<path d="%s" fill="none" stroke="%s" stroke-width="1.8" stroke-linejoin="round"/>'%(d,col))
        s.path([(cx-6*sc,cy+3*sc),(cx-1*sc,cy-3*sc),(cx+5*sc,cy+2*sc)],stroke=col,w=1.2)
    def sun(s,x,y,r=14):
        s.blob(x,y,r,r,tint=BRICKT,stroke=BRICK,w=2)
        for i in range(8):
            a=i*math.pi/4+.2; s.line(x+(r+5)*math.cos(a),y+(r+5)*math.sin(a),x+(r+11)*math.cos(a),y+(r+11)*math.sin(a),stroke=BRICK,w=2)
    def rain(s,x,y,n=1,L=16,color=SLATE):
        for i in range(n): s.line(x+i*0,y,x-4,y+L,stroke=color,w=2)
    def arrow(s,pts,color=SLATE,w=2):
        s.path(pts,stroke=color,w=w); (x1,y1),(x2,y2)=pts[-2],pts[-1]
        a=math.atan2(y2-y1,x2-x1)
        for da in (2.7,-2.7): s.line(x2,y2,x2+7*math.cos(a+da),y2+7*math.sin(a+da),stroke=color,w=w)
    def text(s,x,y,t,color=BRICK,size=11,anchor='start',rot=0):
        s.o.append('<text x="%s" y="%s" font-family="Architects Daughter,sans-serif" font-size="%s" fill="%s" stroke="#fbf8f1" stroke-width="4" paint-order="stroke" text-anchor="%s"%s>%s</text>'%(x,y,size,color,anchor,' transform="rotate(%s %s %s)"'%(rot,x,y) if rot else '',t))
    def field(s,w,h,bg=RAISED,grid=24):
        out='<rect width="%s" height="%s" fill="%s"/><g stroke="%s" stroke-width="1" stroke-dasharray="1 5" stroke-linecap="round" opacity=".9">'%(w,h,bg,LINE)
        for x in range(grid,w,grid): out+='<path d="M%d 0V%d"/>'%(x,h)
        for y in range(grid,h,grid): out+='<path d="M0 %d H%d"/>'%(y,w)
        return out+'</g>'
    def svg(s,w,h,cls='rds-infobox__art',bg=RAISED,grid=24,label=None):
        return '<svg class="%s" viewBox="0 0 %d %d" role="img" aria-hidden="true" focusable="false"><defs>%s</defs>%s%s</svg>'%(cls,w,h,''.join(s.defs),s.field(w,h,bg,grid),''.join(s.o))
