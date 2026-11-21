#!/usr/bin/env python3
"""Writes fonts/hershey.js: single-stroke letterforms for the write-on animation.
Source: the Hershey vector fonts (Dr. A. V. Hershey, U.S. National Bureau of Standards; free for any use with credit),
as packaged in the MIT-licensed `hersheytext` npm module (https://github.com/techninja/hersheytextjs).
Run:  npm i hersheytext --prefix /tmp/h && python3 scripts/build_hershey.py /tmp/h/node_modules/hersheytext/hersheytext.json
Output is committed; the page needs no build."""
import json, sys, pathlib
src = pathlib.Path(sys.argv[1])
d = json.loads(src.read_text())
FONTS = {  # our key -> (hershey key, label)
    'script': ('scripts', 'Script'),
    'cursive': ('scriptc', 'Script, complex'),
    'print': ('futural', 'Print'),
    'italic': ('timesi', 'Italic serif'),
}
out = {}
for key, (hk, label) in FONTS.items():
    glyphs = {}
    for i, g in enumerate(d[hk]['chars']):
        ch = chr(33 + i)
        if ch > '~': break
        strokes = []
        for chunk in g['d'].split('M'):
            pts = chunk.replace('L', ' ').split()
            if not pts: continue
            strokes.append(' '.join(pts))
        glyphs[ch] = [int(g['o']), ';'.join(strokes)]
    out[key] = {'name': label, 'g': glyphs}
js = '/* Hershey single-stroke fonts (public use, credit A. V. Hershey / NBS) via hersheytext (MIT). Built by scripts/build_hershey.py. */\n'
js += 'window.RV_HERSHEY=' + json.dumps(out, separators=(',', ':')) + ';\n'
pathlib.Path(__file__).resolve().parent.parent.joinpath('fonts', 'hershey.js').write_text(js)
print('wrote fonts/hershey.js', len(js), 'bytes')
