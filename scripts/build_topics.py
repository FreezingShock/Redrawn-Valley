#!/usr/bin/env python3
"""Generate the topic hubs: topics/index.html and topics/<slug>/index.html.
Run: python3 scripts/build_topics.py          (writes the hub pages)
     python3 scripts/build_topics.py --check  (exit 1 if the committed hubs are stale; writes nothing)
Inputs: assets/topics.json (topic definitions) and the <meta name="rv-topics"> tag on each page, read through
scripts/build_index.py. Add a page, tag it, run this script (and build_index.py), commit the result.
See DESIGN.md > Topics."""
import sys, json, html, pathlib, importlib.util

root = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('build_index', root / 'scripts' / 'build_index.py')
bi = importlib.util.module_from_spec(spec); spec.loader.exec_module(bi)

TOPICS = json.loads((root / 'assets/topics.json').read_text(encoding='utf-8'))['topics']
BY = {t['slug']: t for t in TOPICS}
KINDS = [  # section key, singular label, plural label, row tag colour
    ('studies', 'Study', 'Studies', 'brick'),
    ('guide', 'Field guide', 'Field guide entries', 'moss'),
    ('notes', 'Note', 'Notes', 'brick'),
    ('lab', 'Lab note', 'Lab notes', 'moss'),
]
INTRO = {  # one line above each kind's list; kept plain, no numbers
    'studies': 'Full write-ups of one place each, with a drawn proposal and a list of what is still unknown.',
    'guide': 'Short reference entries with numbered sources. Read the definition, then follow the links.',
    'notes': 'Longer essays on what the research says and what I still do not know.',
    'lab': 'How the site itself was made, with the research, the decisions and a live demo.',
}
e = html.escape

def pages():
    out = []
    for p in json.loads(bi.build()['assets/search-index.json'])['pages']:
        if p.get('k') and p['s'] in {k[0] for k in KINDS} and p['u'].count('/') >= 2:
            out.append(p)
    return out

def head(depth, title, desc, extra_css='', slug=''):
    up = '../' * depth
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="{up}assets/rds/flow.js"></script>
<title>{e(title)} | Redrawn Valley</title>
<meta name="description" content="{e(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shantell+Sans:wght,BNCE,INFM@400..700,-100..100,0..100&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="{up}assets/rds/tokens.css">
<link rel="stylesheet" href="{up}assets/rds/rds.css">
<link rel="stylesheet" href="{up}assets/rds/topics.css">
<link rel="stylesheet" href="{up}assets/rds/skin.css">
</head>
<body class="rds-page">
<header class="rds-nav" data-rds-nav data-rv-shell="nav">
<a class="rds-nav__brand" href="{up}index.html">Redrawn Valley</a>
</header>
<main id="main">
<div class="rds-container"><nav class="rds-crumbs" data-rv-crumbs aria-label="Breadcrumb"></nav></div>
'''

def tail(depth):
    up = '../' * depth
    return f'''</main>
<footer class="rds-footer" data-rv-shell="footer"></footer>
<script src="{up}assets/rds/rds.js"></script>
<script src="{up}assets/rds/mobile.js"></script>
<script src="{up}assets/rds/motifs.js" defer></script>
<script src="{up}assets/rds/loops.js" defer></script>
<script src="{up}assets/site-shell.js"></script>
<script src="{up}assets/rds/sketch.js" defer></script>
<script src="{up}assets/rds/interact.js" defer></script>
</body>
</html>
'''

def icon(name, up, cls='rds-icon rds-row__icon'):
    return f'<svg class="{cls}" aria-hidden="true"><use href="{up}assets/rds/icons/icons.svg#i-{name}"/></svg>'

def counts(items):
    c = {k[0]: 0 for k in KINDS}
    for p in items: c[p['s']] += 1
    return c

def count_phrase(c):
    parts = []
    for key, one, many, _ in KINDS:
        n = c[key]
        if n: parts.append(f'{n} {one.lower() if n == 1 else many.lower()}')
    return ', '.join(parts)

def pill_links(p, here, up):
    """Other topics this page is tagged with, as plain text (the row is already a link)."""
    others = [BY[s]['short'] for s in p['k'] if s != here]
    return ('Also: ' + ' · '.join(others)) if others else ''

def row(p, here, up):
    t = BY[p['k'][0]]
    kind = next(k for k in KINDS if k[0] == p['s'])
    main = p['k'][0] == here
    tag = f'<span class="rds-tag rds-tag--{kind[3]}">{kind[1]}</span>'
    place = f'<span>{e(p["pl"])}</span>' if p.get('pl') else ''
    also = pill_links(p, here, up)
    meta = f'<span class="rds-row__meta">{place}<span>{e(also) if also else ("Main topic" if main else "")}</span></span>'
    return (f'<a class="rds-row rv-trow" href="{up}{p["u"]}" data-rv-kind="{p["s"]}">'
            f'<div>{tag}<h3 class="rds-row__title">{icon(t["icon"], up)}{e(p["t"].split(" | ")[0])}</h3></div>'
            f'<p class="rds-row__text">{e(p["d"])}</p>{meta}</a>')

def study_card(p, here, up):
    t = BY[p['k'][0]]
    also = pill_links(p, here, up)
    place = e(p['pl']) if p.get('pl') else 'Study'
    seed = p['u'].strip('/')
    return (f'<a class="rds-card rv-tcard" href="{up}{p["u"]}"><div class="rds-card__media"><div class="rds-art" data-rds-art="card" data-seed="{e(seed)}" data-topic="{e(t["art"])}" aria-hidden="true"></div></div>'
            f'<div class="rds-card__body"><span class="rds-tag rds-tag--brick">{place}</span><h3 class="rds-card__title">{e(p["t"].split(" | ")[0])}</h3><p class="rds-card__text">{e(p["d"])}</p>'
            f'<div class="rds-card__foot"><span class="rds-row__meta">{e(also)}</span><span class="rds-row__meta">Read the study &rarr;</span></div></div></a>')

def banner(seed, art, extra=''):
    return f'<figure class="rv-tiles rds-art rv-tbanner" data-rds-art="banner" data-art-mobile="card" data-seed="{e(seed)}" data-topic="{e(art)}" aria-hidden="true"></figure>'

def hub(t, items):
    up = '../../'
    mine = sorted([p for p in items if t['slug'] in p['k']], key=lambda p: (p['k'].index(t['slug']), p['t']))
    c = counts(mine)
    places = sorted({p['pl'] for p in mine if p.get('pl')})
    others = [o for o in TOPICS if o['slug'] != t['slug']]
    n = len(mine)
    desc = f'{t["blurb"]} {n} pages collected: {count_phrase(c)}.'
    o = head(2, t['title'], desc)
    o += f'''<section class="rv-thead" data-rds-loop="tiles" data-seed="topics/{t['slug']}"><div class="rds-container">
<div class="rds-sechead rv-thead__copy">
<p class="rds-eyebrow" data-rds-reveal="fade">Topic</p>
<h1 class="rds-display-xl" data-rds-split>{e(t['title'])}</h1>
<p class="rds-lead" data-rds-reveal style="--i:1">{e(t['blurb'])}</p>
<p class="rv-thead__q" data-rds-reveal style="--i:2"><span>The question I keep asking</span>{e(t['question'])}</p>
</div>
{banner('topics/' + t['slug'], t['art'])}
<div class="rv-tstats" role="list" aria-label="What is in this topic">'''
    for key, one, many, _ in KINDS:
        if c[key]:
            o += f'<a class="rv-tstat" role="listitem" href="#{key}"><b>{c[key]}</b><span>{one if c[key] == 1 else many}</span></a>'
    o += '</div></div></section>\n'
    sec = 0
    for key, one, many, _ in KINDS:
        sel = [p for p in mine if p['s'] == key]
        if not sel: continue
        band = ' rds-band-sunk' if sec % 2 == 0 else ''
        sec += 1
        o += f'<section class="rds-section{band}" id="{key}"><div class="rds-container">\n<div class="rds-sechead"><p class="rds-eyebrow">{e(t["short"])} &middot; {many}</p><h2 class="rds-display">{many} on {e(t["title"].lower() if t["slug"] != "valley" else "the Valley")}</h2><p class="rds-lead">{INTRO[key]}</p></div>\n'
        if key == 'studies':
            o += '<div class="rds-grid rv-tgrid" data-rds-stagger>' + ''.join(study_card(p, t['slug'], up) for p in sel) + '</div>\n'
        else:
            o += '<div class="rds-rows rv-trows">' + ''.join(row(p, t['slug'], up) for p in sel) + '</div>\n'
        o += '</div></section>\n'
    band = ' rds-band-sunk' if sec % 2 == 0 else ''
    o += f'<section class="rds-section{band}"><div class="rds-container">\n<div class="rds-sechead"><p class="rds-eyebrow">Keep going</p><h2 class="rds-display">Other topics</h2><p class="rds-lead">Most pages belong to more than one topic. These are the other ways in.</p></div>\n'
    o += '<div class="rv-tchips" role="list">' + ''.join(
        f'<a class="rv-tchip rv-tchip--{x["accent"]}" role="listitem" href="../{x["slug"]}/index.html">{icon(x["icon"], up, "rds-icon rds-icon--sm")}<span>{e(x["title"])}</span></a>' for x in others) + '</div>\n'
    if places:
        o += '<p class="rds-small rv-tplaces"><b>Places in this topic</b> ' + ' · '.join(e(x) for x in places) + '. <a class="rds-link" href="../index.html">All topics</a></p>\n'
    else:
        o += '<p class="rds-small rv-tplaces"><a class="rds-link" href="../index.html">All topics</a></p>\n'
    o += '<p class="rds-small">This page is generated from the topic tags on each page, so a new page appears here as soon as it is tagged.</p>\n</div></section>\n'
    return o + tail(2)

def index(items):
    up = '../'
    o = head(1, 'Topics', 'Every study, field guide entry and note on Redrawn Valley, collected by topic: heat, trees, water, parking, streets and the Valley itself.')
    o += f'''<section class="rv-thead" data-rds-loop="tiles" data-seed="topics"><div class="rds-container">
<div class="rds-sechead rv-thead__copy">
<p class="rds-eyebrow" data-rds-reveal="fade">Browse</p>
<h1 class="rds-display-xl" data-rds-split>Start from a question, not a page</h1>
<p class="rds-lead" data-rds-reveal style="--i:1">Studies, field guide entries and notes all keep running into the same few subjects. Each topic collects everything I have written about one of them, so you can read across places instead of one page at a time.</p>
</div>
{banner('topics', 'heat tree water valley')}
</div></section>
<section class="rds-section rds-band-sunk"><div class="rds-container">
<div class="rds-sechead"><p class="rds-eyebrow">{len(TOPICS)} topics</p><h2 class="rds-display">Pick a subject</h2></div>
<div class="rds-grid rv-tgrid" data-rds-stagger>'''
    for t in TOPICS:
        mine = [p for p in items if t['slug'] in p['k']]
        c = counts(mine)
        o += (f'<a class="rds-card rv-tcard rv-tcard--{t["accent"]}" href="{t["slug"]}/index.html"><div class="rds-card__media"><div class="rds-art" data-rds-art="card" data-seed="topics/{t["slug"]}" data-topic="{e(t["art"])}" aria-hidden="true"></div></div>'
              f'<div class="rds-card__body"><span class="rds-tag rds-tag--{ "moss" if t["accent"] in ("moss","slate") else "brick"}">{icon(t["icon"], "../", "rds-icon rds-icon--sm")}&nbsp;{len(mine)} pages</span><h3 class="rds-card__title">{e(t["title"])}</h3>'
              f'<p class="rds-card__text">{e(t["blurb"])}</p><div class="rds-card__foot"><span class="rds-row__meta">{e(count_phrase(c))}</span><span class="rds-row__meta">Open &rarr;</span></div></div></a>')
    o += '</div></div></section>\n'
    # cross-reference: every topic by kind of page, so the coverage (and the gaps) are visible
    o += '<section class="rds-section"><div class="rds-container">\n<div class="rds-sechead"><p class="rds-eyebrow">Coverage</p><h2 class="rds-display">What is written about each topic</h2><p class="rds-lead">Counts of tagged pages. A page with several topics is counted once under each, and a zero is a gap I have not written yet.</p></div>\n'
    o += '<div class="rv-tmatrix-wrap" tabindex="0" role="region" aria-label="Pages per topic and type"><table class="rv-tmatrix"><thead><tr><th scope="col">Topic</th>' + ''.join(f'<th scope="col">{k[2]}</th>' for k in KINDS) + '</tr></thead><tbody>'
    for t in TOPICS:
        c = counts([p for p in items if t['slug'] in p['k']])
        o += f'<tr><th scope="row"><a class="rds-link" href="{t["slug"]}/index.html">{e(t["title"])}</a></th>' + ''.join(f'<td class="{"is-zero" if not c[k[0]] else ""}">{c[k[0]]}</td>' for k in KINDS) + '</tr>'
    o += '</tbody></table></div>\n'
    o += '<div class="rds-callout rds-callout--moss" style="margin-top:var(--space-8)"><div><p class="rds-callout__title">How a page joins a topic</p><p>Every page carries a short list of topic tags, the first one being its main subject. The hubs are built from those tags, so adding a study or a note and tagging it is all it takes to put it here.</p></div></div>\n'
    o += '</div></section>\n'
    return o + tail(1)

def build():
    items = pages()
    out = {'topics/index.html': index(items)}
    for t in TOPICS: out[f'topics/{t["slug"]}/index.html'] = hub(t, items)
    return out

if __name__ == '__main__':
    out = build(); stale = []
    for name, body in out.items():
        path = root / name
        if '--check' in sys.argv:
            if not path.exists() or path.read_text(encoding='utf-8') != body: stale.append(name)
        else:
            path.parent.mkdir(parents=True, exist_ok=True); path.write_text(body, encoding='utf-8'); print(f'wrote {name}')
    if stale: print('stale: ' + ', '.join(stale) + ' (run python3 scripts/build_topics.py)'); sys.exit(1)
