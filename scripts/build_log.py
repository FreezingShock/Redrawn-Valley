#!/usr/bin/env python3
"""Build the Sketchbook log from git history and page metadata.

Run: python3 scripts/build_log.py          (writes log/index.html regions, log/feed.xml, assets/log.json)
     python3 scripts/build_log.py --check  (exit 1 if the committed files are stale; writes nothing)

One log entry per commit (the repo squash-merges, so a commit is a pull request). Each entry gets:
  - a type: study / note / guide / lab / redraw / design / site (see classify)
  - the pages it added ("New") and the content pages it changed ("Updated"), with titles read from the pages
  - a plain-language title and summary

Where the words come from, first match wins:
  1. A commit trailer in the PR description:  `Log: one plain sentence`   `Log-Title: ...`   `Log-Type: redraw`   `Log: skip`
  2. scripts/log-notes.json, keyed by PR number ("44": {"title": ..., "summary": ..., "type": ...})
  3. The commit subject, and the target page's own <meta name="description"> for a new page.
Commits that touch only generated files (the log, the search index, the sitemap) never appear, so regenerating
the log does not add entries about itself. Needs full history: in CI use `fetch-depth: 0`.
Never invents anything: with no notes, an entry is just the subject, the date and the pages it touched."""
import re, sys, json, html, subprocess, pathlib, datetime
import sys as _sys, pathlib as _pl; _sys.path.insert(0, str(_pl.Path(__file__).resolve().parent)); import assetver as _av

root = pathlib.Path(__file__).resolve().parent.parent
SITE_URL = 'https://redrawnvalley.vercel.app'
REPO = 'https://github.com/FreezingShock/Redrawn-Valley'
AUTHOR = 'Nate Anderson'
FEED_MAX = 40
GENERATED = ('log/', 'topics/', 'assets/log.json', 'assets/search-index.json', 'sitemap.xml', 'robots.txt')

TYPES = {  # key: (label, tag class, icon id)
    'study': ('Study', 'brick', 'studies'), 'note': ('Note', 'brick', 'notes'), 'guide': ('Field guide', 'moss', 'guide'),
    'lab': ('Lab note', 'brick', 'ruler'), 'redraw': ('Redraw', 'moss', 'leaf'),
    'design': ('Design system', 'moss', 'pin'), 'site': ('Site', 'moss', 'home'),
}
SECTION_LABEL = {'': 'Home', 'studies': 'Studies', 'notes': 'Notes', 'guide': 'Field guide', 'lab': 'Lab notes',
                 'patterns': 'Pattern sheet', 'icons': 'Icon set', 'log': 'Sketchbook log'}

def git(*a):
    return subprocess.run(['git', '-C', str(root)] + list(a), capture_output=True, text=True, check=True).stdout

def is_page(path):
    """A content page: an index.html that is not a template, an embedded demo or noindex."""
    p = pathlib.PurePosixPath(path)
    if p.name != 'index.html' or '_template' in p.parts or 'demo' in p.parts or p.parts[0] in ('fonts', 'log'):
        return False
    f = root / path
    if not f.exists(): return False
    head = f.read_text(encoding='utf-8')[:4000]
    return 'content="noindex' not in head

def page_url(path):
    d = pathlib.PurePosixPath(path).parent.as_posix()
    return '' if d == '.' else d + '/'

def page_meta(path):
    t = (root / path).read_text(encoding='utf-8')
    title = re.search(r'<title>(.*?)</title>', t, re.S)
    desc = re.search(r'<meta name="description" content="(.*?)"', t, re.S)
    title = html.unescape(re.sub(r'\s+', ' ', title.group(1))).strip() if title else page_url(path)
    title = re.sub(r'\s*\|\s*Redrawn Valley\s*$', '', title)
    title = re.sub(r'\s*\|\s*(Lab notes|Notes|Studies|Field guide)\s*$', '', title)
    return title or 'Home', html.unescape(desc.group(1)).strip() if desc else ''

def section_of(path):
    url = page_url(path)
    return url.split('/')[0] if url else ''

def classify(subject, added, files):
    sects = {section_of(p) for p in added}
    for key, sec in (('study', 'studies'), ('note', 'notes'), ('guide', 'guide'), ('lab', 'lab')):
        if sec in sects and any(page_url(p).count('/') == 2 for p in added if section_of(p) == sec): return key
    s = subject.lower()
    if re.search(r'\b(redraw|drawing|drawings|art|motif|motifs|banner|banners|figure|figures|illustration)\b', s): return 'redraw'
    if any(f in ('DESIGN.md', 'CLAUDE.md') or f.startswith('assets/rds/tokens') for f in files) and not any(is_page(f) for f in files): return 'design'
    return 'site'

def load_notes():
    f = root / 'scripts' / 'log-notes.json'
    return json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}

def trailers(body):
    out = {}
    for m in re.finditer(r'^(Log|Log-Title|Log-Type):\s*(.+)$', body, re.M | re.I):
        out[m.group(1).lower()] = m.group(2).strip()
    return out

def collect():
    notes = load_notes()
    sep = '\x1e'
    raw = git('log', '--no-merges', '-M', '--date=iso-strict', f'--format={sep}%H|%h|%aI|%an|%s|%b\x1f', '--name-status')
    entries = []; pages = {}
    for chunk in raw.split(sep)[1:]:
        head, _, rest = chunk.partition('\x1f')
        h, sh, date, author, subject, body = (head.split('|', 5) + [''])[:6]
        files, status = [], {}
        for line in rest.strip().splitlines():
            parts = line.split('\t')
            if len(parts) < 2: continue
            st, path = parts[0][0], parts[-1]
            files.append(path); status[path] = st
        if not files or all(f.startswith(GENERATED) for f in files): continue
        tr = trailers(body)
        m = re.search(r'\(#(\d+)\)\s*$', subject)
        pr = m.group(1) if m else ''
        subj = re.sub(r'\s*\(#\d+\)\s*$', '', subject).strip()
        note = notes.get(pr, {}) if pr else notes.get(sh, {})
        if tr.get('log', '').lower() == 'skip' or note.get('skip'): continue
        content = [f for f in files if not f.startswith(GENERATED)]
        added = [p for p in content if status[p] == 'A' and is_page(p)]
        updated = [p for p in content if status[p] in 'MR' and is_page(p) and p not in added]
        e = {'id': f'pr-{pr}' if pr else f'c-{sh}', 'sha': sh, 'pr': pr, 'date': date[:10], 'iso': date,
             'author': author if author != 'nate' else AUTHOR,
             'title': tr.get('log-title') or note.get('title') or subj[:1].upper() + subj[1:],
             'summary': tr.get('log') or note.get('summary') or '',
             'files': len(content), 'added': added, 'updated': updated}
        e['type'] = tr.get('log-type') or note.get('type') or classify(subj, added, content)
        if e['type'] not in TYPES: e['type'] = 'site'
        if not e['summary'] and len(added) == 1:  # a single new page: use its own description
            e['summary'] = page_meta(added[0])[1]
        entries.append(e)
        for p in added + updated:
            if (root / p).exists():
                d = pages.setdefault(page_url(p), {'added': None, 'updated': None})
                if p in added: d['added'] = e['date'] if not d['added'] or e['date'] < d['added'] else d['added']
                if not d['updated'] or e['date'] > d['updated']: d['updated'] = e['date']
    # keep only pages that still exist; resolve titles
    for e in entries:
        for k in ('added', 'updated'):
            e[k] = [{'u': page_url(p), 't': page_meta(p)[0], 's': section_of(p)} for p in e[k] if (root / p).exists()]
    entries.sort(key=lambda e: e['iso'], reverse=True)
    return entries, dict(sorted(pages.items()))

def esc(s): return html.escape(s, quote=True)

def human(d):
    dt = datetime.date.fromisoformat(d)
    return dt.strftime('%b. ') + str(dt.day) + dt.strftime(', %Y')

def pretty_url(u): return SITE_URL + '/' + u

def render_item(e, rel='../'):
    label, cls, icon = TYPES[e['type']]
    meta = [f'<span class="rds-tag rds-tag--{cls}">{esc(label)}</span>']
    if e['pr']: meta.append(f'<a class="rv-log__pr" href="{REPO}/pull/{e["pr"]}" rel="noopener">PR #{e["pr"]}</a>')
    meta.append(f'<span>{e["files"]} file{"s" if e["files"] != 1 else ""} changed</span>')
    chips = []
    for kind, word in (('added', 'New'), ('updated', 'Updated')):
        seen = e[kind]
        for p in seen[:4]:
            chips.append(f'<li class="rv-log__page rv-log__page--{kind}"><span>{word}</span><a href="{rel}{esc(p["u"])}">{esc(p["t"])}</a></li>')
        if len(seen) > 4:
            chips.append(f'<li class="rv-log__page rv-log__page--more"><span>{word}</span>and {len(seen) - 4} more page{"s" if len(seen) - 4 != 1 else ""}</li>')
    summary = f'<p class="rv-log__text">{esc(e["summary"])}</p>' if e['summary'] else ''
    pages = f'<ul class="rv-log__pages" aria-label="Pages in this entry">{"".join(chips)}</ul>' if chips else ''
    return (f'<li class="rv-log__item" id="{e["id"]}" data-rv-row="{e["type"]}" data-rds-reveal>'
            f'<span class="rv-log__dot" aria-hidden="true"><svg class="rds-icon"><use href="{rel}assets/rds/icons/icons.svg#i-{icon}"/></svg></span>'
            f'<div class="rv-log__card"><p class="rv-log__meta">{"".join(meta)}</p>'
            f'<h3 class="rv-log__title">{esc(e["title"])}</h3>{summary}{pages}</div></li>')

def render_timeline(entries):
    days = {}
    for e in entries: days.setdefault(e['date'], []).append(e)
    out = []
    for d, items in days.items():
        wd = datetime.date.fromisoformat(d).strftime('%A')
        n = len(items)
        out.append(f'<section class="rv-log__day" data-rv-day aria-labelledby="day-{d}"><h2 class="rv-log__date" id="day-{d}">'
                   f'<time datetime="{d}">{human(d)}</time><span>{wd}, <b data-rv-day-count>{n}</b> {"entries" if n != 1 else "entry"}</span></h2>'
                   f'<ol class="rv-log__list">{"".join(render_item(e) for e in items)}</ol></section>')
    return '\n'.join(out)

def render_stats(entries, pages):
    new_pages = sum(1 for v in pages.values() if v['added'])
    days = len({e['date'] for e in entries})
    last = entries[0]['date'] if entries else ''
    counts = {k: sum(1 for e in entries if e['type'] == k) for k in TYPES}
    facts = (f'<dl class="rds-facts rv-wide"><div><dt>entries since the first commit</dt><dd>{len(entries)}</dd></div>'
             f'<div><dt>pages published</dt><dd>{new_pages}</dd></div><div><dt>days with work</dt><dd>{days}</dd></div>'
             f'<div><dt>last entry</dt><dd>{human(last) if last else "none"}</dd></div></dl>')
    chips = ''.join(f'<button type="button" class="rv-chip" data-rv-topic="{k}" aria-pressed="false">{esc(TYPES[k][0])} <i>{c}</i></button>'
                    for k, c in counts.items() if c)
    chips = f'<button type="button" class="rv-chip" data-rv-topic="all" aria-pressed="true">All <i>{len(entries)}</i></button>' + chips
    return facts, chips

def feed_xml(entries):
    upd = entries[0]['iso'] if entries else datetime.datetime.now(datetime.timezone.utc).isoformat()
    out = ['<?xml version="1.0" encoding="utf-8"?>', '<feed xmlns="http://www.w3.org/2005/Atom">',
           '  <title>Redrawn Valley: Sketchbook log</title>',
           '  <subtitle>A dated feed of every new study, note, lab note, redraw and design change.</subtitle>',
           f'  <link rel="self" type="application/atom+xml" href="{SITE_URL}/log/feed.xml"/>',
           f'  <link rel="alternate" type="text/html" href="{SITE_URL}/log/"/>',
           f'  <id>{SITE_URL}/log/</id>', f'  <updated>{upd}</updated>',
           f'  <author><name>{AUTHOR}</name></author>']
    for e in entries[:FEED_MAX]:
        body = f'<p>{esc(e["summary"])}</p>' if e['summary'] else ''
        links = ''.join(f'<li>{w}: <a href="{pretty_url(p["u"])}">{esc(p["t"])}</a></li>' for k, w in (('added', 'New'), ('updated', 'Updated')) for p in e[k][:8])
        if links: body += f'<ul>{links}</ul>'
        out.append('  <entry>')
        out.append(f'    <title>{esc(e["title"])}</title>')
        out.append(f'    <id>tag:redrawnvalley.vercel.app,{e["date"]}:{e["id"]}</id>')
        out.append(f'    <link rel="alternate" type="text/html" href="{SITE_URL}/log/#{e["id"]}"/>')
        out.append(f'    <updated>{e["iso"]}</updated>')
        out.append(f'    <category term="{e["type"]}" label="{esc(TYPES[e["type"]][0])}"/>')
        if e['summary']: out.append(f'    <summary>{esc(e["summary"])}</summary>')
        out.append(f'    <content type="html">{esc(body)}</content>' if body else '')
        out.append('  </entry>')
    out.append('</feed>')
    return '\n'.join(l for l in out if l) + '\n'

def splice(text, name, new):
    pat = re.compile(rf'(<!--log:{name}-->).*?(<!--/log:{name}-->)', re.S)
    if not pat.search(text): raise SystemExit(f'log/index.html is missing <!--log:{name}--> markers')
    return pat.sub(lambda m: m.group(1) + '\n' + new + '\n' + m.group(2), text)

def build():
    entries, pages = collect()
    facts, chips = render_stats(entries, pages)
    page = (root / 'log' / 'index.html').read_text(encoding='utf-8')
    for name, body in (('stats', facts), ('chips', chips), ('timeline', render_timeline(entries))):
        page = splice(page, name, body)
    data = {'site': SITE_URL, 'entries': [{k: v for k, v in e.items() if k != 'iso'} for e in entries], 'pages': pages}
    return {'log/index.html': page, 'log/feed.xml': feed_xml(entries),
            'assets/log.json': json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n'}

if __name__ == '__main__':
    out = build(); stale = []
    for name, body in out.items():
        path = root / name
        if '--check' in sys.argv:
            if not path.exists() or _av.strip(path.read_text(encoding='utf-8')) != _av.strip(body): stale.append(name)
        else:
            path.write_text(body, encoding='utf-8'); print(f'wrote {name} ({len(body):,} bytes)')
    if stale: print('stale: ' + ', '.join(stale) + ' (run python3 scripts/build_log.py)'); sys.exit(1)
