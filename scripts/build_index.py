#!/usr/bin/env python3
"""Regenerate the site search index and sitemap from the HTML pages.
Run: python3 scripts/build_index.py          (writes assets/search-index.json, sitemap.xml, robots.txt)
     python3 scripts/build_index.py --check  (exit 1 if the committed files are stale; writes nothing)
Every page with a <title> is indexed except 404.html and anything marked <meta name="robots" content="noindex">.
CI regenerates the index on integration, so a page PR does not need to commit it."""
import re, sys, json, pathlib, datetime
from html.parser import HTMLParser

root = pathlib.Path(__file__).resolve().parent.parent
# Production domain for sitemap.xml. Change here if the domain changes.
SITE_URL = 'https://redrawnvalley.vercel.app'
SECTIONS = {'': 'Home', 'guide': 'Field guide', 'studies': 'Studies', 'notes': 'Notes', 'lab': 'Lab notes', 'topics': 'Topics', 'about': 'About'}
SKIP_TAGS = {'script', 'style', 'svg', 'noscript', 'nav', 'footer', 'template'}
TEXT_CAP = 6000

class Page(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.title = ''; s.desc = ''; s.noindex = False; s.meta = {}
        s.heads = []; s.text = []; s.skip = 0; s.stack = []
        s.in_title = False; s.cur = None
    def handle_starttag(s, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            n = (a.get('name') or '').lower()
            if n == 'description': s.desc = a.get('content', '')
            if n.startswith('rv-'): s.meta[n] = a.get('content', '')
            if n == 'robots' and 'noindex' in (a.get('content') or ''): s.noindex = True
        if tag == 'title': s.in_title = True
        shell = tag == 'header' and ('data-rds-nav' in a or 'data-rv-shell' in a)
        if tag in SKIP_TAGS or shell or 'data-rv-noindex' in a:
            s.skip += 1; s.stack.append(tag)
        if tag in ('h1', 'h2', 'h3') and not s.skip:
            s.cur = {'t': '', 'id': a.get('id', ''), 'l': int(tag[1])}
    def handle_endtag(s, tag):
        if tag == 'title': s.in_title = False
        if s.stack and s.stack[-1] == tag:
            s.stack.pop(); s.skip -= 1
        if tag in ('h1', 'h2', 'h3') and s.cur:
            s.cur['t'] = re.sub(r'\s+', ' ', s.cur['t']).strip()
            if s.cur['t']: s.heads.append(s.cur)
            s.cur = None
    def handle_data(s, d):
        if s.in_title: s.title += d
        if s.skip: return
        if s.cur is not None: s.cur['t'] += d
        s.text.append(d)

def build():
    pages, urls = [], []
    for f in sorted(root.rglob('*.html')):
        rel = f.relative_to(root)
        if any(p in ('.git', 'node_modules') for p in rel.parts) or rel.name == '404.html': continue
        p = Page(); p.feed(f.read_text(encoding='utf-8'))
        if p.noindex or not p.title.strip(): continue
        url = '' if rel.as_posix() == 'index.html' else (rel.parent.as_posix() + '/' if rel.name == 'index.html' else rel.as_posix())
        sec = url.split('/')[0] if '/' in url else ('' if url == '' else url.rsplit('.', 1)[0])
        title = re.sub(r'\s*[|–—-]\s*Redrawn Valley\s*$', '', re.sub(r'\s+', ' ', p.title)).strip() or 'Redrawn Valley'
        text = re.sub(r'\s+', ' ', ' '.join(p.text)).strip()
        h1 = next((h for h in p.heads if h['l'] == 1), None)
        entry = {'u': url, 't': title, 's': sec, 'd': re.sub(r'\s+', ' ', p.desc).strip(),
                 'h': [[h['t'], h['id']] for h in p.heads if h['l'] > 1 or h is not h1][:60], 'x': text[:TEXT_CAP]}
        # page metadata scheme (DESIGN.md > Topics): rv-topics = slugs from assets/topics.json, first is primary
        known = {t['slug'] for t in json.loads((root / 'assets/topics.json').read_text(encoding='utf-8'))['topics']}
        k = [x for x in (t.strip().lower() for t in p.meta.get('rv-topics', '').split(',')) if x]
        for x in k:
            if x not in known: print(f'warning: {rel.as_posix()}: unknown topic "{x}" (add it to assets/topics.json)', file=sys.stderr)
        if k: entry['k'] = [x for x in k if x in known]
        if p.meta.get('rv-place'): entry['pl'] = p.meta['rv-place'].strip()
        g = re.match(r'^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$', p.meta.get('rv-geo', ''))
        if g: entry['g'] = [float(g.group(1)), float(g.group(2))]
        pages.append(entry); urls.append((url, f.stat().st_mtime))
    pages.sort(key=lambda e: (e['u'] != '', e['s'], e['u']))
    labels = {k: v for k, v in SECTIONS.items()}
    for e in pages: labels.setdefault(e['s'], e['s'].replace('-', ' ').title())
    index = json.dumps({'sections': labels, 'pages': pages}, ensure_ascii=False, separators=(',', ':')) + '\n'
    today = datetime.date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, _ in urls: sm.append(f'  <url><loc>{SITE_URL}/{u}</loc></url>')
    sm.append('</urlset>')
    return {'assets/search-index.json': index, 'sitemap.xml': '\n'.join(sm) + '\n',
            'robots.txt': f'User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n'}

if __name__ == '__main__':
    out = build(); stale = []
    for name, body in out.items():
        path = root / name
        if '--check' in sys.argv:
            if not path.exists() or path.read_text(encoding='utf-8') != body: stale.append(name)
        else:
            path.write_text(body, encoding='utf-8'); print(f'wrote {name} ({len(body):,} bytes)')
    if stale: print('stale: ' + ', '.join(stale) + ' (run python3 scripts/build_index.py)'); sys.exit(1)
