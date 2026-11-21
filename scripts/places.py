"""Valley map data. build_index.py calls place_entry() for every page and writes assets/places.json.
A page appears on /map/ when its <head> has <meta name="rv-geo" content="lat,lng"> (a pin; topics and place come from the shared rv-topics and rv-place tags) or
<meta name="rv-scope" content="valley"> (listed as valley-wide, no single place). Also read:
rv-place (label), rv-precision (site | street | area: how sure the pin is), rv-topics (comma list, first is primary).
Only studies, guide entries and notes appear; section index pages are skipped."""
import json, re

SECTIONS = {'studies': 'study', 'guide': 'guide', 'notes': 'note'}
PRECISION = ('site', 'street', 'area')

def place_entry(url, sec, title, desc, meta):
    kind = SECTIONS.get(sec)
    if not kind or url.rstrip('/') == sec or not (meta.get('rv-geo') or meta.get('rv-scope')): return None
    e = {'u': url, 't': re.sub(r'\s*\|\s*(Field guide|Notes|Studies)\s*$', '', title), 'k': kind, 'd': desc, 'p': meta.get('rv-place', ''),
         'c': [x.strip().lower() for x in meta.get('rv-topics', '').split(',') if x.strip()]}
    if meta.get('rv-geo'):
        lat, lng = (float(x) for x in meta['rv-geo'].split(','))
        assert 33.9 < lat < 34.5 and -119.0 < lng < -118.0, f'{url}: rv-geo is outside the Valley area'
        e['g'] = [round(lat, 5), round(lng, 5)]
        e['a'] = meta.get('rv-precision') if meta.get('rv-precision') in PRECISION else 'area'
    return e

def places_json(entries, topics):
    entries = sorted((e for e in entries if e), key=lambda e: e['u'])
    names = {t['slug']: t.get('short') or t['title'] for t in topics}
    return json.dumps({'topics': names, 'places': entries}, ensure_ascii=False, separators=(',', ':')) + '\n'
