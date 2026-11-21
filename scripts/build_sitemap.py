#!/usr/bin/env python3
"""Generate the human sitemap page: sitemap/index.html (every page on the site, grouped like the menus).
Run: python3 scripts/build_sitemap.py          (writes the page)
     python3 scripts/build_sitemap.py --check  (exit 1 if the committed page is stale; writes nothing)
Reads the page list through scripts/build_index.py, so a new page appears here once it exists and has a <title>.
sitemap.xml (for search engines) is written by build_index.py; this page is the one people read. See DESIGN.md > Menus."""
import sys, html, json, pathlib, importlib.util
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import assetver as _av

root = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('build_index', root / 'scripts' / 'build_index.py')
bi = importlib.util.module_from_spec(spec); spec.loader.exec_module(bi)
e = html.escape

# group key, heading, one-line intro; same order as the footer and the More sheet
GROUPS = [
    ('studies', 'Studies', 'One place each, with a drawn proposal and a list of what is still unknown.'),
    ('guide', 'Field guide', 'Terms and ideas, one page each, with numbered sources.'),
    ('notes', 'Notes', 'Longer essays on what the research says and what I still do not know.'),
    ('topics', 'Topics', 'Every page on a theme, whatever kind of page it is.'),
    ('reference', 'Find things', 'The A–Z index, the Sources library and the Sketchbook log.'),
    ('lab', 'Lab notes', 'How the site itself is made, with the research, the decisions and a live demo.'),
    ('about', 'About', 'Who draws this, the method, and how to reach me.'),
]
REFERENCE = {'a-z', 'sources', 'log'}

def section_of(p):
    s = p['s']
    return 'reference' if s in REFERENCE else s

def row(p, up):
    title = p['t'].split(' | ')[0]
    return (f'<a class="rds-row" href="{up}{p["u"]}"><div><h3 class="rds-row__title">{e(title)}</h3>'
            f'<p class="rds-row__text">{e(p["d"])}</p></div><span class="rds-row__meta">{e("/" + p["u"])}</span></a>')

def build():
    pages = json.loads(bi.build()['assets/search-index.json'])['pages']
    up = '../'
    by = {}
    for p in pages:
        if p['u'] in ('', 'sitemap/') or p['u'].startswith('studies/_'): continue
        by.setdefault(section_of(p), []).append(p)
    o = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="{up}assets/rds/theme.js"></script>
<script src="{up}assets/rds/flow.js"></script>
<title>Sitemap | Redrawn Valley</title>
<meta name="description" content="Every page on Redrawn Valley, grouped the way the menus group them: studies, field guide, notes, topics, reference, lab notes and about.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shantell+Sans:wght,BNCE,INFM@400..700,-100..100,0..100&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="{up}assets/rds/tokens.css">
<link rel="stylesheet" href="{up}assets/rds/rds.css">
<link rel="stylesheet" href="{up}assets/rds/notes.css">
<link rel="stylesheet" href="{up}assets/rds/skin.css">
<link rel="stylesheet" href="{up}assets/rds/theme.css">
<link rel="stylesheet" href="{up}assets/rds/cozy.css">
</head>
<body class="rds-page">
<header class="rds-nav" data-rds-nav data-rv-shell="nav">
<a class="rds-nav__brand" href="{up}index.html">Redrawn Valley</a>
</header>
<main id="main">
<div class="rds-container"><nav class="rds-crumbs" data-rv-crumbs aria-label="Breadcrumb"></nav></div>
<section class="rv-nhead" data-rds-loop="tiles" data-seed="sitemap"><div class="rds-container">
<div class="rds-sechead" style="margin-bottom:var(--space-12)"><p class="rds-eyebrow" data-rds-reveal="fade">Sitemap</p><h1 class="rds-display-xl" data-rds-split>Every page, in one list</h1><p class="rds-lead" data-rds-reveal style="--i:1">The menus group the site the same way this page does. Search engines read <a class="rds-link" href="{up}sitemap.xml">sitemap.xml</a> instead; the <a class="rds-link" href="{up}log/feed.xml">Atom feed</a> lists what is new.</p></div>
<div class="rv-tiles rds-art" data-rds-art="banner" data-art-mobile="card" data-seed="sitemap" data-topic="valley study site" aria-hidden="true"></div>
</div></section>
'''
    for key, title, intro in GROUPS:
        items = by.get(key, [])
        if not items: continue
        o += f'<section class="rds-section" data-rv-noindex aria-labelledby="sm-{key}"><div class="rds-container">\n<div class="rds-sechead"><p class="rds-eyebrow">{len(items)} page{"s" if len(items) != 1 else ""}</p><h2 class="rds-display" id="sm-{key}">{e(title)}</h2><p class="rds-lead">{e(intro)}</p></div>\n<div class="rds-rows">\n'
        o += '\n'.join(row(p, up) for p in items) + '\n</div>\n</div></section>\n'
    o += f'''</main>
<footer class="rds-footer" data-rv-shell="footer"></footer>
<script src="{up}assets/rds/rds.js"></script>
<script src="{up}assets/rds/mobile.js"></script>
<script src="{up}assets/rds/motifs.js" defer></script>
<script src="{up}assets/rds/loops.js" defer></script>
<script src="{up}assets/site-shell.js"></script>
</body>
</html>
'''
    return o

if __name__ == '__main__':
    body = build(); path = root / 'sitemap/index.html'
    if '--check' in sys.argv:
        if not path.exists() or _av.strip(path.read_text(encoding='utf-8')) != _av.strip(body):
            print('stale: sitemap/index.html (run python3 scripts/build_sitemap.py)'); sys.exit(1)
    else:
        path.parent.mkdir(parents=True, exist_ok=True); path.write_text(body, encoding='utf-8'); print('wrote sitemap/index.html')
