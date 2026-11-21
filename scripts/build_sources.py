#!/usr/bin/env python3
"""Build the Sources library data from the pages themselves. No manual list.

Run: python3 scripts/build_sources.py          (writes assets/sources.json)
     python3 scripts/build_sources.py --check  (exit 1 if the committed file is stale; writes nothing)
     python3 scripts/build_sources.py --report (print the library summary and any problems)

How it reads a page (works for the guide, notes, studies and lab markup, and for any new page that follows the same idea):
  * A citation MARKER is a link to an in-page #id inside a <sup> or an element whose class contains "fn" or "cite"
    (rds-fn, rv-fn, rv-cite), where the #id belongs to an <li>. The <li> is the SOURCE entry.
  * Pull quotes that cite as plain text ("[3]" inside <cite> in a <blockquote>) count as quoted uses of source 3.
  * A source entry that no marker points at is still listed ("listed only"), so a bibliography never vanishes.
  * Each use records the sentence the marker closes, the section heading it sits under and its order among the markers
    for that source on that page. assets/rds/cite-jump.js uses that order to scroll to the exact marker and highlight it.
Sources are merged across pages by canonical URL (scheme, www, utm, fragment and trailing slash ignored)."""
import re, sys, json, hashlib, pathlib
from html.parser import HTMLParser
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

root = pathlib.Path(__file__).resolve().parent.parent
OUT = root / 'assets' / 'sources.json'
VOID = {'br', 'img', 'hr', 'meta', 'link', 'input', 'source', 'wbr', 'col', 'area', 'base', 'embed', 'param', 'track'}
SKIP = {'script', 'style', 'svg', 'template', 'noscript'}
BLOCK = {'p', 'li', 'dd', 'dt', 'td', 'th', 'blockquote', 'figcaption', 'summary'}
SECTIONS = {'guide': 'Field guide', 'notes': 'Notes', 'studies': 'Studies', 'lab': 'Lab notes'}

# ---------- tiny DOM ----------
class N:
    __slots__ = ('tag', 'a', 'kids', 'par', 'text')
    def __init__(s, tag, a=None, par=None): s.tag, s.a, s.kids, s.par, s.text = tag, a or {}, [], par, None
    def cls(s): return (s.a.get('class') or '').split()
    def iter(s):
        yield s
        for k in s.kids:
            if k.tag != '#t': yield from k.iter()
    def txt(s, skip=lambda n: False):
        if s.tag == '#t': return s.text
        if s.tag in SKIP or skip(s): return ''
        return ''.join(k.txt(skip) for k in s.kids)

class Tree(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root = s.cur = N('#root')
    def handle_starttag(s, tag, attrs):
        n = N(tag, dict(attrs), s.cur); s.cur.kids.append(n)
        if tag not in VOID: s.cur = n
    def handle_startendtag(s, tag, attrs): s.cur.kids.append(N(tag, dict(attrs), s.cur))
    def handle_endtag(s, tag):
        c = s.cur
        while c is not s.root and c.tag != tag: c = c.par
        if c is not s.root: s.cur = c.par
    def handle_data(s, d):
        t = N('#t', par=s.cur); t.text = d; s.cur.kids.append(t)

def parse(path):
    t = Tree(); t.feed(path.read_text(encoding='utf-8')); return t.root

def clean(s): return re.sub(r'\s+', ' ', s.replace(' ', ' ')).strip()

# ---------- URLs ----------
def canon(url):
    u = urlsplit(url.strip())
    host = u.netloc.lower().removeprefix('www.')
    q = urlencode([(k, v) for k, v in parse_qsl(u.query) if not k.lower().startswith('utm_')])
    return urlunsplit(('https', host, u.path.rstrip('/') or '/', q, '')).replace('https://', '', 1)

def slugify(s): return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower())).strip('-')

# ---------- classification ----------
KIND_MAP = [  # explicit rds-kind label, lowercased substring -> type
    ('case study', 'Case study'), ('government', 'Government'), ('agency', 'Government'), ('law', 'Law and code'), ('code', 'Law and code'),
    ('journal', 'Research'), ('peer', 'Research'), ('study', 'Research'), ('paper', 'Research'), ('report', 'Report'),
    ('news', 'News'), ('nonprofit', 'Nonprofit'), ('this site', 'This site'),
    ('reference', 'Reference'), ('encyclop', 'Reference'), ('data', 'Data and maps'), ('map', 'Data and maps')]
DOMAIN_RULES = [  # (regex on host+path, type); first match wins
    (r'(^|\.)(wikipedia|britannica|wikimedia)\.|paulbourke', 'Reference'),
    (r'amlegal|codelibrary|municode|leginfo|/lamc|ordinance|courtlistener|casetext|justia', 'Law and code'),
    (r'\.edu(/|$)|pmc\.ncbi|doi\.org|sciencedirect|springer|wiley|jstor|uwpress|tandfonline|ams\.confex|researchgate|arxiv|ucanr|treesearch|isa-arbor|corada|frec\.vt', 'Research'),
    (r'\.gov(/|$)|\.gov\.|\.ca\.us|ca\.gov|\.mil(/|$)|lacity\.|lacounty\.|ladpw\.|energy\.ca|nasa\.gov|noaa|usgs|usda|state\.mn\.us|bostonmpo|nchfa|\.us(/|$)', 'Government'),
    (r'latimes|abc7|nbclosangeles|laist|smartcitiesdive|planetizen|dailynews|lbpost|kcrw|nytimes|washingtonpost|curbed|streetsblog|nbcnews|cbsnews|apnews|reuters|bloomberg|kcet|usatoday', 'News'),
    (r'ucs\.org|ucsusa|asla\.org|treepeople|landscapeperformance|countyhealthrankings|sepulvedabasin|conservancy|nature\.org|treeequityscore|nationalequityatlas', 'Nonprofit'),
    (r'google\.com/maps|openstreetmap|placer\.ai|newmarkmerrill|commercialcafe|commercialsearch|loopnet|costar|zillow|redfin|census\.gov|website-files|transitapp', 'Data and maps'),
    (r'x\.com|twitter\.com|facebook|instagram|youtube|reddit', 'Social post'),
    (r'github\.com', 'Code and files'),
    (r'mozilla|w3\.org|fonts\.google|fontsource|openfontlicense|developer\.|whatwg|caniuse', 'Technical docs')]
TYPES = ['Government', 'Research', 'News', 'Nonprofit', 'Case study', 'Law and code', 'Data and maps', 'Reference', 'Report',
         'Social post', 'Technical docs', 'Code and files', 'This site', 'Other']

def classify(kind, host, title, internal):
    if internal: return 'This site'
    k = (kind or '').lower()
    if k:
        for sub, t in KIND_MAP:
            if sub in k: return t
    h = host.lower()
    for rx, t in DOMAIN_RULES:
        if re.search(rx, h): return t
    if re.search(r'case study|case-study', title.lower()): return 'Case study'
    if re.search(r'\bjournal\b|\bet al\b', title.lower()): return 'Research'
    return 'Other'

# Topics come from the same place as the topic hubs: assets/topics.json (slug, title) and each page's
# <meta name="rv-topics" content="heat, trees">. A source's topics are the union over the pages that cite it.
TOPIC_TITLES = {t['slug']: t['title'] for t in json.loads((root / 'assets' / 'topics.json').read_text(encoding='utf-8'))['topics']}

# ---------- page reading ----------
def page_info(rel, tree):
    title = ''
    for n in tree.iter():
        if n.tag == 'title': title = clean(n.txt()); break
    title = re.sub(r'\s*[|–—-]\s*Redrawn Valley\s*$', '', title)
    h1 = next((clean(n.txt()) for n in tree.iter() if n.tag == 'h1'), '')
    meta = next((n.a.get('content', '') for n in tree.iter() if n.tag == 'meta' and n.a.get('name') == 'rv-topics'), '')
    body = clean(next((n.txt() for n in tree.iter() if n.tag == 'main'), tree.txt()))
    return {'t': title or h1, 'meta': [x.strip() for x in meta.split(',') if x.strip()], 'body': body}

def page_topics(info):
    return [TOPIC_TITLES[t] for t in info['meta'] if t in TOPIC_TITLES]

def is_marker(n, ids):
    """An <a href="#id"> that points at a list item, living in a footnote-style wrapper."""
    if n.tag != 'a': return None
    h = n.a.get('href', '')
    if not h.startswith('#') or h[1:] not in ids: return None
    p = n.par
    while p is not None and p.tag != '#root':
        if p.tag == 'sup' or any(re.search(r'(^|-)(fn|cite)(-|$)', c) for c in p.cls()): return h[1:]
        if p.tag in BLOCK: break
        p = p.par
    return None

def in_source_list(n):
    p = n
    while p is not None:
        c = p.cls()
        if p.tag == 'ol' and ('rds-notes' in c or 'rv-sources' in ' '.join(c)): return True
        if p.tag in ('footer', 'section') and (p.a.get('id') in ('sources', 'notes') or any(x in ('rv-sources',) for x in c)): return True
        p = p.par
    return False

def block_of(n):
    for tags in (BLOCK, {'div'}):  # a stat or fact is often a bare <div><b>..</b><span>..</span></div>
        p = n.par
        while p is not None and p.tag != '#root':
            if p.tag in tags: return p
            p = p.par
    return n.par

ABBR = {'sept', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'oct', 'nov', 'dec', 'dr', 'mr', 'mrs', 'ms', 'st', 'no', 'vs', 'inc', 'co', 'corp', 'ca', 'blvd', 'ave', 'etc', 'al', 'fig', 'sec', 'u.s', 'e.g', 'i.e', 'p.m', 'a.m', 'approx', 'est', 'ft', 'sq', 'jr', 'sr', 'dept', 'mt', 'vol', 'pp', 'ed'}
def abbr(body, i):
    """True when the period at body[i] ends an abbreviation or an initial, not a sentence."""
    if body[i] != '.': return False
    m = re.search(r'([A-Za-z.]+)$', body[:i]); w = (m.group(1) if m else '').lower().strip('.')
    return w in ABBR or (len(w) == 1 and body[i - 1].isalpha())

def sentence(block, marker):
    """The sentence the marker sits in, as text with the marker position removed."""
    pre, post, seen = [], [], False
    def walk(x):
        nonlocal seen
        if x is marker or (x is marker.par and False): seen = True; return
        if x.tag == '#t': (post if seen else pre).append(x.text); return
        if x.tag in SKIP: return
        if 'rv-fn' in x.cls() or x.tag == 'sup' or 'rds-fn' in x.cls() or 'rv-cite' in x.cls():
            if marker in list(x.iter()): seen = True; return
            return  # other markers contribute no text
        for k in x.kids: walk(k)
    walk(block)
    a, b = clean(''.join(pre)), clean(''.join(post))
    # start: after the last sentence end that is not the one closing right before the marker
    body = a[:-1] if re.search(r'[.!?]["”’)]?$', a) else a
    starts = [m.end() for m in re.finditer(r'[.!?]["”’)]?\s+(?=[A-Z“"(])', body) if not abbr(body, m.start())]
    s = starts[-1] if starts else 0
    start = a[s:]
    end = ''
    if not re.search(r'[.!?]["”’)]?$', a):
        m = re.search(r'^.*?[.!?]["”’)]?(?=\s|$)', b)
        end = m.group(0) if m else b
    out = clean(start + ' ' + end) if end else clean(start)
    if len(out) > 420: out = '…' + out[-400:]
    return out

def read_page(f):
    rel = f.relative_to(root).as_posix()
    url = rel[:-len('index.html')] if rel.endswith('index.html') else rel
    tree = parse(f); info = page_info(rel, tree)
    nodes = list(tree.iter())
    ids = {n.a['id']: n for n in nodes if n.tag == 'li' and n.a.get('id') and in_source_list(n)}
    if not ids: return None
    # headings (for "where on the page") in document order
    uses = {i: [] for i in ids}; sec = None; lasth = ('', '')
    num2id = {}
    for i in ids:
        m = re.search(r'(\d+)$', i)
        if m: num2id.setdefault(int(m.group(1)), i)
    for n in nodes:
        if n.tag in ('h2', 'h3') and not in_source_list(n):
            t = clean(n.txt(lambda x: 'rds-anchor' in x.cls() or 'rv-num' in x.cls())); lasth = (re.sub(r'^\d+\s*', '', t), n.a.get('id', ''))
        tid = is_marker(n, ids)
        if tid and not in_source_list(n):
            blk = block_of(n)
            uses[tid].append({'sec': lasth[0] or 'At a glance', 'sid': lasth[1], 'ctx': sentence(blk, n), 'q': blk.tag == 'blockquote' or bool(re.search(r'[“"][^”"]{12,}[”"]', sentence(blk, n)))})
        elif n.tag == 'cite' and n.par is not None and n.par.tag == 'blockquote':
            m = re.search(r'\[(\d+)\]', n.txt())
            if m and int(m.group(1)) in num2id:
                bq = clean(n.par.txt(lambda x: x.tag == 'cite'))
                uses[num2id[int(m.group(1))]].append({'sec': lasth[0], 'sid': lasth[1], 'ctx': bq, 'q': True, 'plain': True})
    entries = []
    for i, li in ids.items():
        entries.append({'id': i, 'li': li, 'uses': uses[i]})
    return {'u': url, 'info': info, 'entries': entries, 'topics': page_topics(info)}

def entry_fields(li, page_url):
    note = ''; kind = ''; backs = 0
    for n in li.iter():
        c = n.cls()
        if 'rds-kind' in c: kind = clean(n.txt())
        if 'rv-src-note' in c: note = clean(n.txt())
    skipc = lambda x: any(c in ('rds-back', 'rv-back', 'rds-kind', 'rv-src-note') for c in x.cls())
    full = clean(li.txt(skipc))
    full = re.sub(r'^\[\d+\]\s*', '', full)
    links = [a.a['href'] for a in li.iter() if a.tag == 'a' and a.a.get('href') and 'rds-back' not in a.cls() and 'rv-back' not in a.cls()]
    ext = next((h for h in links if re.match(r'https?://', h)), '')
    internal = ''
    if not ext and links:
        h = links[0]
        if not h.startswith('#'):
            p = (root / pathlib.Path(page_url)).joinpath(h).resolve() if False else None
            internal = h
    cite = clean(next((c.txt() for c in li.iter() if c.tag == 'cite'), '')) or full
    cite = clean(re.sub(r'\s*(Abstract:\s*)?(https?://\S+|(www\.)?[a-z0-9.-]+\.(com|org|gov|edu|net)/\S+)\s*$', '', cite)).rstrip(' :,')
    return {'full': full, 'cite': cite, 'url': ext, 'internal': internal, 'kind': kind, 'note': note}

def resolve_internal(page_url, href):
    base = (root / page_url) if page_url.endswith('/') or not page_url else (root / page_url).parent
    p = (base / href.split('#')[0]).resolve()
    try: rel = p.relative_to(root).as_posix()
    except ValueError: return ''
    return rel[:-len('index.html')] if rel.endswith('index.html') else rel

def build(report=False):
    pages, sources = {}, {}
    problems = []
    for f in sorted(root.rglob('index.html')):
        rel = f.relative_to(root)
        if any(p in ('.git', 'node_modules', '_template', 'demo') for p in rel.parts): continue
        pg = read_page(f)
        if not pg: continue
        sec = pg['u'].split('/')[0]
        pages[pg['u']] = {'t': pg['info']['t'], 's': SECTIONS.get(sec, sec.title()), 'topics': pg['topics']}
        for e in pg['entries']:
            fld = entry_fields(e['li'], pg['u'])
            internal = resolve_internal(pg['u'], fld['internal']) if fld['internal'] and not fld['url'] else ''
            key = canon(fld['url']) if fld['url'] else ('site:' + internal if internal else 'text:' + slugify(fld['cite'])[:80])
            s = sources.setdefault(key, {'key': key, 'cands': [], 'pages': {}})
            s['cands'].append((fld, internal, pg['u']))
            pu = s['pages'].setdefault(pg['u'], {'u': pg['u'], 'ref': e['id'], 'uses': []})
            pu['uses'].extend(e['uses'])
            if not e['uses']: problems.append(f"{pg['u']}: source #{e['id']} is listed but no marker cites it")
    out = []; used = set()
    for key, s in sources.items():
        best = max(s['cands'], key=lambda c: len(c[0]['cite']) if not re.match(r'^\W*\d+\W*$', c[0]['cite']) else 0)
        fld, internal, _ = best
        url = fld['url']; host = urlsplit(url).netloc.lower().removeprefix('www.') if url else ''
        kind = next((c[0]['kind'] for c in s['cands'] if c[0]['kind']), '')
        note = ' '.join(dict.fromkeys(c[0]['note'] for c in s['cands'] if c[0]['note']))
        title = fld['cite']
        # id: host plus last path words, else the first words of the citation
        if host:
            path = [x for x in urlsplit(url).path.split('/') if x and not re.match(r'^[\d.]+$', x)]
            base = slugify(host.rsplit('.', 1)[0] + '-' + (path[-1] if path else ''))[:48].rsplit('-', 1)[0] if len(host) + len(path[-1] if path else '') > 46 else slugify(host.rsplit('.', 1)[0] + '-' + (path[-1] if path else ''))
        elif internal: base = 'site-' + slugify(internal)[:50]
        else: base = slugify(title)[:48]
        sid, n = base or 'source', 2
        while sid in used: sid = f'{base}-{n}'; n += 1
        used.add(sid)
        plist = []
        for pu in s['pages'].values():
            k = 0
            for u in pu['uses']:
                k += 1; u['k'] = k
            plist.append({'u': pu['u'], 'ref': pu['ref'], 'n': len(pu['uses']), 'uses': pu['uses']})
        plist.sort(key=lambda p: (-p['n'], p['u']))
        topics = sorted({t for p in plist for t in pages[p['u']]['topics']})
        out.append({'id': sid, 'title': title, 'full': fld['full'] if fld['full'] != title else '', 'url': url or '', 'host': host,
                    'site': internal, 'kind': kind, 'type': classify(kind, host + urlsplit(url).path if url else '', title, bool(internal)),
                    'note': note, 'topics': topics, 'uses': sum(p['n'] for p in plist), 'pages': plist})
    out.sort(key=lambda x: (-x['uses'], x['title'].lower()))
    data = {'types': [t for t in TYPES if any(o['type'] == t for o in out)], 'topics': [t for t in TOPIC_TITLES.values() if any(t in o['topics'] for o in out)],
            'pages': pages, 'sources': out}
    return json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', problems, data

if __name__ == '__main__':
    body, problems, data = build()
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding='utf-8') != body:
            print('stale: assets/sources.json (run python3 scripts/build_sources.py)'); sys.exit(1)
    elif '--report' in sys.argv:
        S = data['sources']
        print(f"{len(S)} sources, {sum(s['uses'] for s in S)} citations, {len(data['pages'])} pages")
        for t in data['types']: print(f"  {t:16} {sum(1 for s in S if s['type'] == t)}")
        for p in problems: print('note:', p)
        print('Other:', [s['title'][:60] for s in S if s['type'] == 'Other'])
        print('no topics:', sum(1 for s in S if not s['topics']))
    else:
        OUT.write_text(body, encoding='utf-8'); print(f'wrote assets/sources.json ({len(body):,} bytes)')
