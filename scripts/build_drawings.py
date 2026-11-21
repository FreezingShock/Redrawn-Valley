#!/usr/bin/env python3
"""Extract every drawing (figure) from the studies, field guide and notes into assets/drawings.json,
the manifest behind the drawings gallery at /drawings/.

Run: python3 scripts/build_drawings.py           (writes assets/drawings.json)
     python3 scripts/build_drawings.py --check   (exit 1 if the committed file is stale; writes nothing)

What counts as a drawing: an inline <svg> inside <main> that has a viewBox at least 360 units wide, role="img" and an
aria-label, and is not aria-hidden. That is the same rule the zoom lightbox uses (assets/rds/interact.js), so a figure
you can zoom on a page is a figure in the gallery. Decorative art (banners, infobox sketches, icons) is aria-hidden and
never listed. Nothing needs to be registered: add a figure to a page, run this script, and it appears.

Optional attributes on the <svg> or its <figure> override what is guessed:
    data-fig-type="plan|section|perspective|chart|diagram"   data-fig-topics="heat trees"   data-fig-skip

Only metadata is stored here. The gallery page fetches the source pages and draws each figure itself, so the drawings
always match the page they come from. Figures are matched back to their page by order and checked against `label`."""
import re, sys, json, pathlib
from html.parser import HTMLParser

root = pathlib.Path(__file__).resolve().parent.parent
OUT = root / 'assets' / 'drawings.json'
SECTIONS = [('studies', 'Studies', 'Study'), ('notes', 'Notes', 'Note'), ('guide', 'Field guide', 'Guide entry')]
MIN_WIDTH = 360
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
SKIP = {'script', 'style', 'template', 'noscript'}

# Type is guessed from the words in the label and caption. First match wins; the order matters.
TYPES = [
    ('section', r'\bcross[- ]section|\bsection (?:through|of|from)|\bsection\b'),
    ('plan', r'\bplan\b|parcel|layout|blueprint|site map|\bmap\b|aerial'),
    ('perspective', r'perspective|pencil|\bsketch|street view|looking (?:north|south|east|west)'),
    ('chart', r'degrees|readings?\b|reductions?\b|\bpercent|\bchart\b|\bgraph\b|canopy at planting|\byear \d+|\bbars?\b'),
]
TYPE_LABELS = {'plan': 'Plan', 'section': 'Section', 'perspective': 'Perspective', 'chart': 'Chart', 'diagram': 'Diagram'}
# Topics use the shared slugs in assets/topics.json (see DESIGN.md > Topics). A figure's topics are guessed from its words,
# limited to the topics its page is tagged with (<meta name="rv-topics">); if no word matches, it takes the page's primary topic.
TOPIC_RX = {
    'heat': r'\bheat|\bhot\b|temperature|degrees|thermometer|\bsun\b|\bwarm|\bcool(?:er|ing)?\b',
    'trees': r'\btrees?\b|canopy|willow|shade|planting|\bgrove|\bsycamore|\boak',
    'water': r'\bwater|stormwater|bioswale|runoff|\brain|\briver|drain|\bflow|swale|infiltrat|\bsoil|\broots?\b|planter|compact',
    'parking': r'parking|\bstalls?\b|\blots?\b|asphalt|\bcars?\b|drive aisle|paving|pavers?',
    'streets': r'sidewalk|crosswalk|\bstreets?\b|curb|\bwalk|\bblock\b|\broute|frontage|signal|pedestrian|\bboulevard|\bavenue',
    'valley': r'\bvalley\b|county|los angeles|\bl\.?a\.?\b',
}
try: TOPIC_DEFS = {x['slug']: x['title'] for x in json.loads((root / 'assets' / 'topics.json').read_text(encoding='utf-8'))['topics']}
except Exception: TOPIC_DEFS = {k: k.title() for k in TOPIC_RX}

def clean(s):
    return re.sub(r'\s+', ' ', s or '').strip()

def slug(s, n=6):
    words = re.findall(r'[a-z0-9]+', s.lower())
    stop = {'a', 'an', 'the', 'of', 'and', 'with', 'to', 'in', 'on', 'at', 'for', 'is', 'as'}
    words = [w for w in words if w not in stop][:n]
    return '-'.join(words) or 'drawing'

class Page(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.title = ''; s.in_title = False
        s.stack = []            # (tag, info) for open elements
        s.in_main = 0
        s.figs = []             # finished drawings
        s.last_id = ''          # nearest preceding id on a section/div/heading
        s.heading = ''; s.heading_id = ''
        s.cap_buf = None; s.cap_parts = []
        s.fig_stack = []        # open <figure>s: {'idx': [drawing indexes], 'cap': [...]}
        s.scrollies = []        # {'steps': [(n,label)], 'svgs': [drawing indexes]}
        s.cur_h = None; s.text_seen = []
        s.svg_depth = 0; s.skip = 0
        s.study_no = ''; s.topics = []
    def _scrolly(s):
        for _, i in reversed(s.stack):
            if i.get('scrolly'): return s.scrollies[i['scrolly'] - 1]
        return None
    def handle_starttag(s, tag, attrs):
        a = dict(attrs)
        if tag == 'title': s.in_title = True
        if tag in SKIP: s.skip += 1
        if tag == 'meta' and (a.get('name') or '') == 'rv-topics':
            s.topics = [x.strip() for x in (a.get('content') or '').split(',') if x.strip()]
        if tag == 'main': s.in_main += 1
        if tag in VOID: return
        info = {}
        if a.get('id') and tag in ('section', 'div', 'article', 'h1', 'h2', 'h3', 'figure', 'aside') and not re.match(r'(cite|note|n)-?\d|^s\d+$|^fn', a['id']):
            s.last_id = a['id']
        if tag in ('h2',) and s.in_main:
            s.cur_h = {'t': '', 'id': a.get('id', '')}; info['h'] = True
        if tag == 'figure':
            s.fig_stack.append({'idx': [], 'cap': [], 'id': a.get('id', ''), 'attrs': a}); info['fig'] = True
        if tag == 'figcaption' and s.fig_stack:
            s.cap_buf = []; info['figcap'] = True
        if 'data-scrolly' in a:
            s.scrollies.append({'steps': [], 'svgs': []}); info['scrolly'] = len(s.scrollies)
        if 'data-step' in a:
            cur = s._scrolly()
            if cur is not None: cur['steps'].append((a['data-step'], a.get('data-label', '')))
        if tag == 'svg':
            if s.svg_depth == 0 and s.in_main and not s.skip:
                vb = re.split(r'[ ,]+', (a.get('viewbox') or '').strip())
                ok = (len(vb) == 4 and float(vb[2] or 0) >= MIN_WIDTH and a.get('role') == 'img' and clean(a.get('aria-label'))
                      and 'aria-hidden' not in a and 'data-fig-skip' not in a
                      and not any(c in (a.get('class') or '') for c in ('rds-icon', 'rds-logo')))
                if ok:
                    d = {'label': clean(a['aria-label']), 'vb': [float(x) for x in vb], 'id': a.get('id', ''),
                         'type': a.get('data-fig-type', ''), 'topics': a.get('data-fig-topics', ''),
                         'fid': (s.fig_stack[-1]['id'] if s.fig_stack else ''), 'anchor': s.last_id,
                         'heading': s.heading, 'inFig': bool(s.fig_stack), 'figattrs': s.fig_stack[-1]['attrs'] if s.fig_stack else {}}
                    s.figs.append(d); info['draw'] = len(s.figs) - 1
                    if s.fig_stack: s.fig_stack[-1]['idx'].append(len(s.figs) - 1)
                    cur = s._scrolly()
                    if cur is not None: cur['svgs'].append(len(s.figs) - 1)
            s.svg_depth += 1
        s.stack.append((tag, info))
    def handle_startendtag(s, tag, attrs):
        if tag == 'svg' or tag in VOID: pass
        # self-closing svg children (path, rect...) never matter: treat as start+end only for html void tags
        if tag in VOID: return
        if tag in ('path', 'rect', 'circle', 'line', 'g', 'use', 'ellipse', 'polygon', 'polyline', 'text'): return
        s.handle_starttag(tag, attrs); s.handle_endtag(tag)
    def handle_endtag(s, tag):
        if tag == 'title': s.in_title = False
        if tag in SKIP and s.skip: s.skip -= 1
        if tag == 'main' and s.in_main: s.in_main -= 1
        if tag in VOID: return
        # pop to the matching open tag
        for i in range(len(s.stack) - 1, -1, -1):
            if s.stack[i][0] == tag:
                for t, info in reversed(s.stack[i:]):
                    s._close(t, info)
                del s.stack[i:]
                break
    def _close(s, tag, info):
        if tag == 'svg': s.svg_depth = max(0, s.svg_depth - 1)
        if info.get('h') and s.cur_h is not None:
            s.heading = clean(s.cur_h['t']); s.heading_id = s.cur_h['id']; s.cur_h = None
        if info.get('figcap') and s.fig_stack:
            s.fig_stack[-1]['cap'] = [clean(p) for p in s.cap_buf if clean(p)]; s.cap_buf = None
        if info.get('fig') and s.fig_stack:
            f = s.fig_stack.pop()
            cap = f['cap']
            for i in f['idx']:
                s.figs[i]['cap'] = cap
                s.figs[i]['figattrs'] = f['attrs']
    def handle_data(s, d):
        if s.in_title: s.title += d
        if s.skip: return
        if s.cur_h is not None and not s.svg_depth: s.cur_h['t'] += d
        if s.cap_buf is not None and not s.svg_depth:
            # keep each top-level child of the caption as its own part: "Fig. 1: ..." then the note
            if not s.cap_buf or s.stack and s.stack[-1][1].get('figcap'): s.cap_buf.append(d)
            else:
                depth = [i for i, (t, inf) in enumerate(s.stack) if inf.get('figcap')]
                if depth and len(s.stack) - 1 == depth[0] + 1 and not getattr(s, '_np', False): s.cap_buf.append(d)
                else: s.cap_buf[-1] += d
        if not s.study_no:
            m = re.search(r'Study (\d\d)\b', d)
            if m and s.in_main: s.study_no = m.group(1)

def order_in_section(section):
    """Page order follows the section index's links, so it matches what readers see; unknown pages come last."""
    idx = root / section / 'index.html'
    seen = []
    if idx.exists():
        for m in re.finditer(r'href="([a-z0-9][a-z0-9-]*)/index\.html"', idx.read_text(encoding='utf-8')):
            if m.group(1) not in seen: seen.append(m.group(1))
    return seen

def classify(texts, rules):
    """Try the label first, then the caption, then the note, so a stray word in the note cannot beat the label."""
    for n, text in enumerate(texts):
        for name, rx in rules:
            if name == 'perspective' and n: continue   # "Concept sketch" in a caption is a disclaimer, not a view type
            if re.search(rx, text, re.I): return name
    return 'diagram'

def topics_for(label, cap, page_topics):
    txt = label + ' ' + cap
    pool = [k for k in TOPIC_RX if not page_topics or k in page_topics]
    scores = {k: len(re.findall(TOPIC_RX[k], txt, re.I)) for k in pool}
    ranked = [k for k, v in sorted(scores.items(), key=lambda kv: -kv[1]) if v > 0][:2]
    return ranked or page_topics[:1] or []

def build():
    pages, drawings = [], []
    sections = []
    for sec, label, noun in SECTIONS:
        d = root / sec
        if not d.is_dir(): continue
        slugs = sorted(p.parent.name for p in d.glob('*/index.html') if not p.parent.name.startswith('_'))
        known = order_in_section(sec)
        slugs.sort(key=lambda x: (known.index(x) if x in known else 99, x))
        found = 0
        for slg in slugs:
            f = d / slg / 'index.html'
            p = Page(); p.feed(f.read_text(encoding='utf-8'))
            title = re.sub(r'\s*\|\s*(?:Notes|Studies|Field guide)\s*$', '', re.sub(r'\s*[|–—-]\s*Redrawn Valley\s*$', '', clean(p.title))) or slg
            url = f'{sec}/{slg}/'
            used = {}
            n = 0
            for i, g in enumerate(p.figs):
                cap = g.get('cap', [])
                fa = g.get('figattrs', {})
                cap = [c for c in (re.sub(r'\s*Showing:.*$', '', c).strip() for c in cap) if re.search(r'[A-Za-z]{3}', c)]
                if len(cap) > 1 and re.fullmatch(r'(?:Fig\.?|Figure)\s*\d+\.?', cap[0], re.I): cap = [cap[0] + ': ' + cap[1]] + cap[2:]
                caption = cap[0] if cap else ''
                note = ' · '.join(c for c in cap[1:] if len(c) > 6) if len(cap) > 1 else ''
                m = re.match(r'(?:Fig\.?|Figure)\s*(\d+)\s*[:.]?\s*(.*)', caption, re.I)
                fignum = int(m.group(1)) if m else 0
                if m and m.group(2): caption = m.group(2)
                text = g['label'] + ' ' + caption + ' ' + note
                typ = g['type'] or fa.get('data-fig-type', '') or classify([g['label'], caption, note], TYPES)
                tps = (g['topics'] or fa.get('data-fig-topics', '')).split() or topics_for(g['label'], caption, p.topics)
                base = g['id'] or slug(g['label'])
                k = used.get(base, 0); used[base] = k + 1
                did = f'{slg}-{base}' + (f'-{k + 1}' if k else '')
                anchor = g['id'] or g['fid'] or g['anchor']
                drawings.append({
                    'id': did, 'page': url, 'section': sec, 'n': n, 'label': g['label'], 'caption': caption, 'note': note,
                    'fig': fignum, 'type': typ, 'topics': tps, 'vb': [int(x) if x == int(x) else x for x in g['vb'][2:]],
                    'anchor': anchor, 'heading': g['heading']})
                n += 1
            if n:
                found += n
                pages.append({'url': url, 'section': sec, 'slug': slg, 'title': title, 'no': p.study_no, 'count': n})
        sections.append({'id': sec, 'label': label, 'noun': noun, 'count': found})
    # stage info: second pass is cheap but needs scrolly data, so it is attached above via a re-parse below
    return {'version': 1, 'rule': f'inline svg in main, role=img, aria-label, viewBox width >= {MIN_WIDTH}, not aria-hidden',
            'types': TYPE_LABELS, 'topics': {k: v for k, v in TOPIC_DEFS.items() if k != 'making'}, 'sections': [s for s in sections if s['count']],
            'pages': pages, 'drawings': drawings}

def attach_stages(data):
    """Staged figures (a plan that gains layers as steps advance) get their step labels, so the gallery can offer a stepper."""
    by_page = {}
    for d in data['drawings']: by_page.setdefault(d['page'], []).append(d)
    for url, ds in by_page.items():
        p = Page(); p.feed((root / url / 'index.html').read_text(encoding='utf-8'))
        for sc in p.scrollies:
            if len(sc['svgs']) == 1 and len(sc['steps']) >= 2:
                ds[sc['svgs'][0]]['stages'] = [lab or f'Step {n}' for n, lab in sorted(sc['steps'], key=lambda x: int(x[0]) if x[0].isdigit() else 0)]
    return data

def dump(data):
    head = {k: v for k, v in data.items() if k != 'drawings'}
    lines = ['{']
    for k, v in head.items(): lines.append(f'"{k}":' + json.dumps(v, ensure_ascii=False, separators=(',', ':')) + ',')
    lines.append('"drawings":[')
    lines.append(',\n'.join(json.dumps(d, ensure_ascii=False, separators=(',', ':')) for d in data['drawings']))
    lines.append(']}')
    return '\n'.join(lines) + '\n'

if __name__ == '__main__':
    body = dump(attach_stages(build()))
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding='utf-8') != body:
            print('stale: assets/drawings.json (run python3 scripts/build_drawings.py)'); sys.exit(1)
    else:
        OUT.write_text(body, encoding='utf-8')
        n = body.count('"id":"') - body.count('"id":"') + len(json.loads(body)['drawings'])
        print(f'wrote assets/drawings.json ({len(body):,} bytes, {n} drawings)')
