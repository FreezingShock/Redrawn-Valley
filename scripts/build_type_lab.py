#!/usr/bin/env python3
"""Writes the type lab: fonts/index.html and fonts/directions.css.
The lab compares hand-drawn type directions for the site. It is a candidate set, not the live design system: the real
fonts live in assets/rds/tokens.css and do not change until a direction is picked.
To add or change a direction edit DIRECTIONS / RESEARCH below, run `python3 scripts/build_type_lab.py`, commit the output.
Sizes (KB) are latin-subset woff2 transfer sizes read from the Google Fonts CSS API on 2026-11-21 (one file per weight,
variable fonts are one file). Licenses come from each family's Google Fonts listing, cross-checked against the
fontsource package metadata. 'Missing' = characters from é ñ á í ó ú ü ° – — ’ “ ” × ½ ² ³ · … absent in the font file."""
import html, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
GF = 'https://fonts.google.com/specimen/'


def gf(name):
    return GF + name.replace(' ', '+')


# ---------------------------------------------------------------- fonts used (name -> license, KB per file, files)
USED = {
    'Caveat': ('OFL', 73.2, 1), 'Caveat Brush': ('OFL', 65.9, 1), 'Kalam': ('OFL', 21.5, 2), 'Patrick Hand': ('OFL', 23.4, 1),
    'Amatic SC': ('OFL', 26.6, 1), 'Architects Daughter': ('OFL', 12.8, 1), 'Delius': ('OFL', 16.4, 1), 'Handlee': ('OFL', 15.8, 1),
    'Walter Turncoat': ('Apache 2.0', 58.9, 1), 'Mansalva': ('OFL', 67.9, 1), 'Neucha': ('OFL', 24.8, 1),
    'Special Elite': ('Apache 2.0', 52.0, 1), 'Courier Prime': ('OFL', 19.7, 2), 'Cutive Mono': ('OFL', 21.3, 1),
    'Fragment Mono': ('OFL', 24.6, 1), 'Fraunces': ('OFL', 118.2, 1), 'IM Fell English': ('OFL', 58.5, 1),
    'IM Fell DW Pica': ('OFL', 61.1, 1), 'Reenie Beanie': ('OFL', 27.8, 1), 'Shantell Sans': ('OFL', 170.4, 1),
    'Newsreader': ('OFL', 0, 0), 'IBM Plex Mono': ('OFL', 0, 0), 'Hanken Grotesk': ('OFL', 0, 0),
}
SITE_FONTS = {'Newsreader', 'IBM Plex Mono', 'Hanken Grotesk'}  # already loaded by every page


def q(name):
    return "'%s'" % name


# ---------------------------------------------------------------- directions
# role: (family, weight, size, line-height, letter-spacing, extra css)
DIRECTIONS = [
    dict(
        id='notebook', name='Field Notebook', anim='sweep', speed='slow',
        tag='Natural pen handwriting',
        blurb='Looks like I wrote it on site. Caveat for the title, Kalam for headings, Patrick Hand for the reading text. The most personal of the six and the one closest to a real sketchbook page.',
        best='Home, study titles, short notes, captions.',
        watch='Caveat has a small x-height and thin strokes, so it needs to be big (the display is 84px at most) and never used for body text. Patrick Hand carries the body, and it is only comfortable up to about 600 words before the eye tires.',
        roles=dict(
            display=(q('Caveat'), 700, 'clamp(52px,8vw,84px)', '0.96', '-0.01em', ''),
            h2=(q('Kalam'), 700, 'clamp(26px,3.4vw,32px)', '1.2', '0', ''),
            h3=(q('Kalam'), 700, '21px', '1.3', '0', ''),
            lead=(q('Patrick Hand'), 400, 'clamp(21px,2.4vw,24px)', '1.4', '0', ''),
            body=(q('Patrick Hand'), 400, '20px', '1.6', '0.005em', ''),
            caption=(q('Kalam'), 300, '15px', '1.5', '0', ''),
            label=(q('Patrick Hand'), 400, '14px', '1.2', '0.12em', 'text-transform:uppercase;'),
            note=(q('Caveat'), 700, '24px', '1.1', '0', ''),
        ),
        fonts=['Caveat', 'Kalam', 'Patrick Hand'],
    ),
    dict(
        id='drafting', name='Drafting Sheet', anim='sweep', speed='fast',
        tag='Architect lettering',
        blurb='Tall, even capitals like a title block on a plan sheet. Amatic SC for the title, Architects Daughter for headings (already on the site as the note font), a round single-story sans for reading.',
        best='Studies and drawings: it makes every page look like a sheet from a set.',
        watch='Amatic SC is all caps and very narrow, so long headlines get hard to read. Keep titles to about six words. Walter Turncoat is Apache 2.0 (still free for web) and larger than the rest to download.',
        roles=dict(
            display=(q('Amatic SC'), 700, 'clamp(60px,10vw,100px)', '0.92', '0.01em', ''),
            h2=(q('Architects Daughter'), 400, 'clamp(26px,3.4vw,32px)', '1.2', '0.01em', ''),
            h3=(q('Architects Daughter'), 400, '20px', '1.3', '0.02em', ''),
            lead=(q('Delius'), 400, 'clamp(19px,2.2vw,22px)', '1.5', '0', ''),
            body=(q('Delius'), 400, '18px', '1.65', '0.005em', ''),
            caption=(q('Handlee'), 400, '15px', '1.5', '0.01em', ''),
            label=(q('Walter Turncoat'), 400, '14px', '1.2', '0.1em', 'text-transform:uppercase;'),
            note=(q('Architects Daughter'), 400, '19px', '1.2', '0', ''),
        ),
        fonts=['Amatic SC', 'Architects Daughter', 'Delius', 'Handlee', 'Walter Turncoat'],
    ),
    dict(
        id='marker', name='Marker and Brush', anim='sweep', speed='fast',
        tag='Bold field-sign lettering',
        blurb='Fat marker and brush strokes: Caveat Brush for the title, Mansalva for headings, Neucha for reading. Loud and clear from across a room, like a hand-lettered sign taped to a fence.',
        best='Home hero, section openers, anything that needs to feel handmade and confident.',
        watch='Mansalva is the heaviest here and tires fast in paragraphs, so use it only for headings. Neucha is narrow and lacks × ½ ² ³ (the browser falls back for those).',
        roles=dict(
            display=(q('Caveat Brush'), 400, 'clamp(54px,8.6vw,92px)', '0.98', '-0.005em', ''),
            h2=(q('Mansalva'), 400, 'clamp(26px,3.4vw,32px)', '1.2', '0', ''),
            h3=(q('Mansalva'), 400, '21px', '1.3', '0', ''),
            lead=(q('Neucha'), 400, 'clamp(21px,2.4vw,23px)', '1.4', '0', ''),
            body=(q('Neucha'), 400, '20px', '1.55', '0.005em', ''),
            caption=(q('Neucha'), 400, '16px', '1.45', '0.01em', ''),
            label=(q('Mansalva'), 400, '14px', '1.2', '0.08em', 'text-transform:uppercase;'),
            note=(q('Caveat Brush'), 400, '24px', '1.1', '0', ''),
        ),
        fonts=['Caveat Brush', 'Mansalva', 'Neucha'],
    ),
    dict(
        id='typewriter', name='Typewriter Log', anim='type', speed='fast',
        tag='Field log, typed up',
        blurb='A survey log typed on a manual machine. Special Elite has real ink spread and uneven keys; Courier Prime keeps the reading text clean. Numbers line up in columns, which suits an evidence-first site.',
        best='Studies, data, captions, sources. It is the natural home for the typewriter animation below.',
        watch='Monospaced body text runs long: a 68-character line is wider than the current prose measure, so I set it at 17px. Special Elite is Apache 2.0 and 52 KB.',
        roles=dict(
            display=(q('Special Elite'), 400, 'clamp(34px,5.6vw,60px)', '1.08', '-0.01em', ''),
            h2=(q('Special Elite'), 400, 'clamp(24px,3vw,28px)', '1.25', '0', ''),
            h3=(q('Courier Prime'), 700, '19px', '1.3', '0', ''),
            lead=(q('Courier Prime'), 400, 'clamp(18px,2vw,20px)', '1.5', '0', ''),
            body=(q('Courier Prime'), 400, '17px', '1.7', '0', ''),
            caption=(q('Cutive Mono'), 400, '14px', '1.5', '0', ''),
            label=(q('Fragment Mono'), 400, '12px', '1.2', '0.1em', 'text-transform:uppercase;'),
            note=(q('Special Elite'), 400, '17px', '1.25', '0', ''),
        ),
        fonts=['Special Elite', 'Courier Prime', 'Cutive Mono', 'Fragment Mono'],
    ),
    dict(
        id='serif', name='Hand-cut Serif', anim='sweep', speed='slow',
        tag='Serif with a hand in it',
        blurb='The calmest option. Fraunces with its soft and wonky axes turned up gives a serif that looks cut by hand; Newsreader stays for reading, so long essays stay comfortable. Hand-drawn character comes from the title, the captions in IM Fell, and Reenie Beanie notes.',
        best='A Wikipedia-style site that still feels drawn. Safest for long reading.',
        watch='Fraunces with all four axes is 118 KB. The change from today is the smallest, so it may not feel "new" enough.',
        roles=dict(
            display=(q('Fraunces'), 400, 'clamp(44px,7vw,76px)', '1.02', '-0.02em', 'font-variation-settings:"SOFT" 100,"WONK" 1,"opsz" 144;'),
            h2=(q('Fraunces'), 500, 'clamp(26px,3.4vw,32px)', '1.15', '-0.01em', 'font-variation-settings:"SOFT" 100,"WONK" 0,"opsz" 48;'),
            h3=(q('IM Fell English'), 400, '23px', '1.3', '0', 'font-style:italic;'),
            lead=(q('Newsreader'), 400, 'clamp(20px,2.3vw,22px)', '1.5', '0', ''),
            body=(q('Newsreader'), 400, '19px', '1.65', '0', ''),
            caption=(q('IM Fell DW Pica'), 400, '15px', '1.45', '0.01em', 'font-style:italic;'),
            label=(q('IBM Plex Mono'), 500, '12px', '1.2', '0.1em', 'text-transform:uppercase;'),
            note=(q('Reenie Beanie'), 400, '27px', '1.05', '0', ''),
        ),
        fonts=['Fraunces', 'IM Fell English', 'IM Fell DW Pica', 'Reenie Beanie', 'Newsreader', 'IBM Plex Mono'],
    ),
    dict(
        id='wobble', name='Wobble', anim='boil', speed='fast',
        tag='One variable font that moves',
        blurb='Shantell Sans is a single variable font drawn like marker handwriting, with axes for how informal it is (INFM) and how much each letter bounces off the baseline (BNCE). One family covers every role, and the letters can be made to wobble live.',
        best='A playful tone and the only direction where the letters themselves can animate, without any stroke data.',
        watch='At 170 KB with all axes it is the heaviest option (trimming axes would cut it). At body size it reads like a children\'s workbook; I set INFM low for reading and high for titles.',
        roles=dict(
            display=(q('Shantell Sans'), 700, 'clamp(40px,6.4vw,70px)', '1.05', '-0.01em', 'font-variation-settings:"INFM" 100,"BNCE" 0,"SPAC" 0;'),
            h2=(q('Shantell Sans'), 600, 'clamp(24px,3.2vw,30px)', '1.2', '0', 'font-variation-settings:"INFM" 80,"BNCE" 0;'),
            h3=(q('Shantell Sans'), 600, '20px', '1.3', '0', 'font-variation-settings:"INFM" 60,"BNCE" 0;'),
            lead=(q('Shantell Sans'), 400, 'clamp(19px,2.2vw,21px)', '1.5', '0', 'font-variation-settings:"INFM" 40,"BNCE" 0;'),
            body=(q('Shantell Sans'), 400, '17.5px', '1.7', '0', 'font-variation-settings:"INFM" 15,"BNCE" 0;'),
            caption=(q('Shantell Sans'), 400, '14.5px', '1.55', '0.005em', 'font-variation-settings:"INFM" 50,"BNCE" 0;'),
            label=(q('Shantell Sans'), 700, '12.5px', '1.2', '0.1em', 'text-transform:uppercase;font-variation-settings:"INFM" 0,"BNCE" 0;'),
            note=(q('Shantell Sans'), 500, '19px', '1.2', '0', 'font-variation-settings:"INFM" 100,"BNCE" 30;'),
        ),
        fonts=['Shantell Sans'],
    ),
]

ROLE_ROWS = [
    ('display', 'Display', 'Page title, one per page'),
    ('h2', 'Heading', 'Section headlines'),
    ('h3', 'Subheading', 'Sub-sections, figure titles'),
    ('lead', 'Lead', 'Summary under a headline'),
    ('body', 'Body', 'Long reading'),
    ('caption', 'Caption', 'Figure captions, sources'),
    ('label', 'Label', 'Eyebrows, tags, buttons'),
    ('note', 'Margin note', 'Notes on drawings'),
]

# ---------------------------------------------------------------- research table
# name, style, license, KB, missing, verdict
RESEARCH = [
    ('Caveat', 'Pen handwriting', 'OFL', '73', '', 'Used (1): display'),
    ('Caveat Brush', 'Brush handwriting', 'OFL', '66', '', 'Used (3): display and notes'),
    ('Kalam', 'Marker handwriting', 'OFL', '22 per weight', '', 'Used (1): headings, captions'),
    ('Patrick Hand', 'Clean print hand', 'OFL', '23', '', 'Used (1): lead, body'),
    ('Amatic SC', 'Tall hand caps', 'OFL', '27 per weight', '', 'Used (2): display'),
    ('Architects Daughter', 'Architect lettering', 'OFL', '13', '', 'Used (2): headings, notes. Already on the site.'),
    ('Delius', 'Round single-story sans', 'OFL', '16', '', 'Used (2): lead, body'),
    ('Handlee', 'Light hand', 'OFL', '16', '× ½ ² ³', 'Used (2): captions'),
    ('Walter Turncoat', 'Hand small-caps', 'Apache 2.0', '59', '', 'Used (2): labels'),
    ('Mansalva', 'Heavy marker', 'OFL', '68', '', 'Used (3): headings, labels'),
    ('Neucha', 'Narrow print hand', 'OFL', '25', '× ½ ² ³', 'Used (3): lead, body, captions'),
    ('Special Elite', 'Worn typewriter', 'Apache 2.0', '52', '', 'Used (4): display, headings'),
    ('Courier Prime', 'Clean typewriter', 'OFL', '20 per weight', '', 'Used (4): lead, body'),
    ('Cutive Mono', 'Light typewriter', 'OFL', '21', '', 'Used (4): captions'),
    ('Fragment Mono', 'Modern mono', 'OFL', '25', '', 'Used (4): labels'),
    ('Fraunces', 'Soft, wonky serif (variable)', 'OFL', '118 with SOFT and WONK', '', 'Used (5): display, headings'),
    ('IM Fell English / DW Pica', 'Digitised 17th-century type', 'OFL', '59 / 61', '', 'Used (5): subheadings, captions'),
    ('Reenie Beanie', 'Thin scrawl', 'OFL', '28', '', 'Used (5) and annotation voice'),
    ('Shantell Sans', 'Marker hand, variable axes', 'OFL', '170 with all axes', '', 'Used (6): every role'),
    ('Over the Rainbow', 'Loose pencil script', 'OFL', '19', '', 'Annotation voice only'),
    ('Homemade Apple', 'Fast ink cursive', 'Apache 2.0', '47', '', 'Annotation voice only: too wild for more than a few words'),
    ('Zeyada', 'Thin pen script', 'OFL', '20', '', 'Annotation voice only: faint at small sizes'),
    ('Nanum Pen Script', 'Korean-designed pen', 'OFL', '15', 'é ñ á í ó ú ü – — ½ ² ³ · …', 'Rejected: no accented letters, so it breaks on Spanish place names such as Cañada'),
    ('Gaegu', 'Korean-designed print hand', 'OFL', '17', 'é ñ á í ó ú ü ° – — × ½ ² ³ · …', 'Rejected: no accents, no degree sign, dash or multiplication sign'),
    ('Edu SA Beginner', 'School handwriting', 'OFL', '9', 'é ñ á í ó ú ü ½ ² ³', 'Rejected: no accented letters'),
    ('Indie Flower', 'Round casual hand', 'OFL', '19', '', 'Rejected: reads as a children\'s card, very wide'),
    ('Gochi Hand', 'Chunky marker', 'OFL', '19', '', 'Rejected: letters clot together below 18px'),
    ('Shadows Into Light', 'Thin pen hand', 'OFL', '16', '', 'Rejected: low contrast on paper at body sizes'),
    ('Just Another Hand', 'Condensed hand', 'Apache 2.0', '35', '', 'Rejected: illegible under about 20px'),
    ('Schoolbell', 'Bubbly marker', 'Apache 2.0', '21', '', 'Rejected: cartoonish'),
    ('Short Stack', 'Wide round hand', 'OFL', '24', '', 'Rejected: too wide, lines run long'),
    ('Coming Soon', 'Light round hand', 'Apache 2.0', '21', '', 'Rejected: strokes too thin at caption size; Handlee does the same job better'),
    ('Covered By Your Grace', 'Tight marker', 'OFL', '16', '', 'Rejected: crowded spacing'),
    ('Gloria Hallelujah', 'Large-x-height pen', 'OFL', '18', '', 'Rejected: runs very wide, headlines wrap to three lines'),
    ('Pangolin', 'Rounded casual sans', 'OFL', '73', '', 'Rejected: reads as a UI font, not hand-drawn'),
    ('Mali / Itim', 'Rounded casual', 'OFL', '18 / 45', '', 'Rejected: friendly app feel, not sketchbook'),
    ('Delicious Handrawn', 'Tight condensed marker', 'OFL', '26', '½ ² ³', 'Rejected: too tight for captions'),
    ('Londrina Sketch, Rubik Scribble, Cabin Sketch', 'Outlined or scribble-filled', 'OFL', '77 to 105', '', 'Rejected: the fill turns to noise below 28px'),
    ('Rock Salt', 'Scrawled caps', 'Apache 2.0', '57', '', 'Rejected: too loud, all caps'),
    ('Sue Ellen Francisco, Annie Use Your Telescope', 'Thin narrow hands', 'OFL', '14 / 15', '', 'Rejected: tiny and faint'),
    ('Waiting for the Sunrise, Nothing You Could Do', 'Loose cursive', 'OFL', '18 / 16', '', 'Rejected: low legibility small'),
    ('Xanh Mono', 'Serif mono', 'OFL', '18', '', 'Rejected: Special Elite and Courier Prime cover the typewriter role'),
    ('Fuzzy Bubbles', 'Soft rounded hand', 'OFL', '29', '', 'Rejected: wide and low-contrast'),
    ('Playwrite US Trad, Playpen Sans', 'School cursive, variable', 'OFL', 'Playpen 192', '½ ² ³ (Playwrite)', 'Not used: heavy download, and school cursive is hard to read in running text'),
    ('Josefin Sans', 'Geometric sans, 1920s drafting feel', 'OFL', '28 per weight', '', 'Not hand-drawn. A possible calm label font if a direction needs one'),
]
# Hershey single-stroke data: not a web font, used to draw the writing-on effect.
HERSHEY = ('Hershey vector fonts (single stroke)', 'A. V. Hershey, U.S. National Bureau of Standards, 1967. Free for any use with credit.')

SOURCES = [
    ('Google Fonts: family pages and licenses', 'https://fonts.google.com/'),
    ('Open Font License 1.1 (what "OFL" means: free to use on websites, embed and modify)', 'https://openfontlicense.org/open-font-license-official-text/'),
    ('Fontsource: per-family license metadata, used to cross-check Google Fonts', 'https://fontsource.org/'),
    ('Hershey vector font data and terms of use, Paul Bourke', 'https://paulbourke.net/dataformats/hershey/'),
    ('The Hershey Fonts, distribution notice (use by anyone for any purpose)', 'https://solhsa.com/hershey/'),
    ('hersheytext (MIT): the JSON packaging of the Hershey data used to build hershey.js', 'https://github.com/techninja/hersheytextjs'),
    ('Shantell Sans, axes (BNCE, INFM, SPAC)', 'https://fonts.google.com/specimen/Shantell+Sans'),
    ('Fraunces, axes (SOFT, WONK, opsz)', 'https://fonts.google.com/specimen/Fraunces'),
]

GFONTS_URL = ('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Caveat+Brush&family=Kalam:wght@300;400;700'
              '&family=Patrick+Hand&family=Amatic+SC:wght@700&family=Architects+Daughter&family=Delius&family=Handlee'
              '&family=Walter+Turncoat&family=Mansalva&family=Neucha&family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400'
              '&family=Cutive+Mono&family=Fragment+Mono&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,0..100,0..1'
              '&family=IM+Fell+English:ital@0;1&family=IM+Fell+DW+Pica:ital@0;1&family=Reenie+Beanie'
              '&family=Shantell+Sans:ital,wght,BNCE,INFM,SPAC@0,300..800,-100..100,0..100,0..100'
              '&family=Over+the+Rainbow&family=Homemade+Apple&family=Zeyada&family=Nanum+Pen+Script&display=swap')

# ---------------------------------------------------------------- sample copy (type only; says so on the page)
S = dict(
    label='Study 01 · Woodland Hills',
    display='Soil, not trees, is the hard part',
    lead='I walked one block with a tape measure and a notebook, then redrew it so you can see what the trees are standing in.',
    h2='What I measured, and what I only estimated',
    p1='Every number on this page is either measured or labeled as an estimate. Where I do not know something, I say so, and I say what I would measure next.',
    h3='Reading the drawing',
    p2='Distances are taped to the nearest half foot, such as 12.5 ft, and times are written the way I logged them, like 7:05 a.m. Tick marks on the plan are 5 ft apart.',
    pull='Count first. Then draw.',
    figlabel='Fig. 3',
    caption='Concept sketch of a sidewalk and three trees. Not to scale.',
    calloutT='What is estimated',
    callout='Root spread is an estimate from canopy width. Nothing here was dug up.',
    note='look here',
    btn='Read the study',
)


def esc(s):
    return html.escape(s, quote=True)


FIG = '''<svg viewBox="0 0 360 200" role="img" aria-label="Plan sketch: a sidewalk with three trees and a 5 ft dimension">
<rect x="0" y="0" width="360" height="200" fill="var(--paper-sunk)"/>
<path class="ln" d="M0 74 C80 71 150 77 230 73 S330 70 360 72"/>
<path class="ln" d="M0 128 C70 131 150 126 230 130 S330 127 360 129"/>
<g class="tick"><path d="M40 74v54M90 74v54M140 74v54M190 74v54M240 74v54M290 74v54M340 74v54"/></g>
<circle class="tree" cx="72" cy="38" r="22"/><circle class="tree" cx="178" cy="40" r="26"/><circle class="tree" cx="288" cy="36" r="20"/>
<circle class="root" cx="72" cy="38" r="34"/><circle class="root" cx="178" cy="40" r="38"/><circle class="root" cx="288" cy="36" r="30"/>
<path class="dim" d="M20 168h100M20 162v12M120 162v12"/>
<text class="svgt" x="70" y="190" text-anchor="middle">5 ft</text>
<text class="svgt" x="250" y="168" text-anchor="middle">sidewalk</text>
</svg>'''

ARROW = ('<svg class="tl-arrow" viewBox="0 0 48 30" aria-hidden="true"><path d="M3 6c10-6 26-4 33 10M36 16l-9-1M36 16l-2-9"/></svg>')


def role_css(sel, role, spec):
    fam, w, size, lh, ls, extra = spec
    return f'{sel} .tl-{role}{{font-family:{fam},var(--rds-sans);font-weight:{w};font-size:{size};line-height:{lh};letter-spacing:{ls};{extra}}}\n'


def build_css():
    out = ['/* Generated by scripts/build_type_lab.py: per-direction type specs. Do not hand-edit. */\n']
    for d in DIRECTIONS:
        sel = f'#{d["id"]}'
        for role, spec in d['roles'].items():
            out.append(role_css(sel, role, spec))
        h2 = d['roles']['h2']
        out.append(f'{sel} .tl-pull{{font-family:{h2[0]},var(--rds-serif);font-weight:{h2[1]};{h2[5]}}}\n')
        # buttons and tags inside the sheet take the label font so the whole sheet reads as one voice
        lab = d['roles']['label']
        out.append(f'{sel} .tl-ui .rds-btn,{sel} .tl-ui .rds-tag{{font-family:{lab[0]},var(--rds-sans);font-weight:{lab[1]};letter-spacing:{lab[4]};{lab[5]}font-variation-settings:inherit}}\n')
        out.append(f'{sel} .tl-ui .rds-link{{font-family:{d["roles"]["body"][0]},var(--rds-sans);font-size:{d["roles"]["body"][2]}}}\n')
        out.append(f'main[data-body="site"] {sel} .tl-body{{font-family:"Newsreader",Georgia,serif;font-weight:400;font-size:19px;line-height:1.65;letter-spacing:0;font-style:normal;font-variation-settings:normal}}\n')
        out.append(f'main[data-body="site"] {sel} .tl-lead{{font-family:"Newsreader",Georgia,serif;font-weight:400;font-size:21px;line-height:1.5;letter-spacing:0;font-style:normal;font-variation-settings:normal}}\n')
        out.append(f'{sel} .tl-svgfont .svgt{{font-family:{lab[0]},var(--rds-sans);font-weight:{lab[1]};font-size:11px;letter-spacing:{lab[4]};{lab[5]}}}\n')
    return ''.join(out)


def size_label(size):
    import re
    m = re.match(r'clamp\((\d+(?:\.\d+)?)px,[^,]+,(\d+(?:\.\d+)?)px\)', size)
    return f'{m.group(1)}–{m.group(2)} px' if m else size.replace('px', ' px')


def role_table(d):
    rows = []
    for role, label, use in ROLE_ROWS:
        fam, w, size, lh, ls, extra = d['roles'][role]
        name = fam.strip("'")
        rows.append(
            f'<tr><th scope="row">{label}</th><td data-label="Font"><span class="tl-fontname" style="font-family:{fam},var(--rds-sans)">{esc(name)}</span> <span class="tl-w">{w}</span></td>'
            f'<td data-label="Size / line" class="tl-mono">{size_label(size)} / {lh}</td>'
            f'<td data-label="Use">{use}</td></tr>')
    return ('<table class="tl-roles"><thead><tr><th>Role</th><th>Font · weight</th><th>Size / line</th><th>Use</th></tr></thead><tbody>'
            + ''.join(rows) + '</tbody></table>')


def kb_line(d):
    tot, bits = 0.0, []
    for n in d['fonts']:
        lic, kb, files = USED[n]
        if n in SITE_FONTS:
            bits.append(f'<a class="rds-link" href="{gf(n)}">{esc(n)}</a> (already on the site)')
            continue
        tot += kb * files
        bits.append(f'<a class="rds-link" href="{gf(n)}">{esc(n)}</a> ({esc(lic)}, {round(kb * files)} KB)')
    return '; '.join(bits), round(tot)


def sheet(d, idx):
    did = d['id']
    anim = d['anim']
    attrs = {'sweep': 'data-rv-write="sweep"', 'type': 'data-rv-write="type"', 'boil': ''}[anim]
    sp = f'data-speed="{d["speed"]}"'
    a = f'{attrs} {sp}' if attrs else ''
    boil = ' tl-boil' if anim == 'boil' else ''
    return f'''<div class="tl-sheet" id="{did}-sheet">
<p class="tl-label">{esc(S['label'])}</p>
<p class="tl-display{boil}" id="{did}-display" role="heading" aria-level="3" {a}>{esc(S['display'])}</p>
<p class="tl-lead" id="{did}-lead" {a}>{esc(S['lead'])}</p>
<div class="tl-cols">
<div class="tl-text">
<p class="tl-h2" role="heading" aria-level="4">{esc(S['h2'])}</p>
<p class="tl-body" id="{did}-p1" {a}>{esc(S['p1'])}</p>
<p class="tl-h3" role="heading" aria-level="5">{esc(S['h3'])}</p>
<p class="tl-body">{esc(S['p2'])}</p>
<p class="tl-pull">{esc(S['pull'])}</p>
</div>
<div class="tl-side">
<figure class="tl-fig tl-svgfont">{FIG}<figcaption><span class="tl-label">{esc(S['figlabel'])}</span> <span class="tl-caption">{esc(S['caption'])}</span></figcaption></figure>
<p class="tl-note">{ARROW}<span>{esc(S['note'])}</span></p>
</div>
</div>
<div class="tl-ui">
<a class="rds-btn" href="#{did}">{esc(S['btn'])} <span class="rds-arrow" aria-hidden="true">→</span></a>
<span class="rds-tag rds-tag--moss">{esc(S['label'])}</span>
<a class="rds-link" href="#{did}">Sources and limits</a>
</div>
<div class="tl-callout"><p class="tl-label">{esc(S['calloutT'])}</p><p class="tl-caption">{esc(S['callout'])}</p></div>
</div>'''


def direction(d, i):
    did = d['id']
    fonts, tot = kb_line(d)
    band = ' rds-band-sunk' if i % 2 else ''
    if d['anim'] == 'boil':
        play = '''<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-boil="#wobble-display" data-speed="fast" aria-pressed="false">Wobble fast</button>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-boil="#wobble-display" data-speed="slow" aria-pressed="false">Wobble slow</button>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-boil="#wobble-display" data-speed="off" aria-pressed="true">Still</button>'''
        animnote = 'Wobble moves the glyphs themselves by animating the font’s bounce axis in steps, like a hand-redrawn frame. Press Still to stop it.'
    else:
        kind = {'sweep': 'Pen sweep', 'type': 'Typewriter'}[d['anim']]
        targets = f'#{did}-display, #{did}-lead, #{did}-p1'
        play = f'''<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-rv-replay="{targets}" data-speed="fast">{kind} fast</button>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-rv-replay="{targets}" data-speed="slow">{kind} slow</button>'''
        animnote = {'sweep': 'Pen sweep reveals the real font word by word, left to right.',
                    'type': 'Typewriter strikes each key with a little baseline drift and a block caret.'}[d['anim']]
    return f'''<section class="rds-section{band} tl-dir" id="{did}-sec" aria-labelledby="{did}-h">
<div class="rds-container">
<div class="tl-dirhead">
<p class="rds-eyebrow">Direction {i + 1} of {len(DIRECTIONS)} · {esc(d['tag'])}</p>
<h2 class="rds-h1" id="{did}-h">{esc(d['name'])}</h2>
<p class="rds-lead">{esc(d['blurb'])}</p>
<p class="tl-pw"><strong>Best for:</strong> {esc(d['best'])}</p>
<p class="tl-pw"><strong>Watch out for:</strong> {esc(d['watch'])}</p>
</div>
<div class="tl-grid" id="{did}">
<div class="tl-specwrap">
<div class="tl-playbar" role="group" aria-label="Replay the {esc(d['name'])} animation">{play}</div>
{sheet(d, i)}
<p class="rds-small tl-animnote">{animnote}</p>
</div>
<div class="tl-spec">
<h3 class="rds-h3">Type hierarchy</h3>
{role_table(d)}
<p class="rds-small tl-fonts"><strong>Fonts:</strong> {fonts}. About {tot} KB of new downloads (latin woff2).</p>
</div>
</div>
</div>
</section>'''


def strip():
    rows = []
    for d in DIRECTIONS:
        fam = d['roles']['display'][0]
        extra = d['roles']['display'][5]
        rows.append(f'<li><a href="#{d["id"]}-sec" class="tl-strip__row"><span class="tl-strip__n">{esc(d["name"])}</span>'
                    f'<span class="tl-strip__s" style="font-family:{fam},var(--rds-serif);font-weight:{d["roles"]["display"][1]};{extra}">Soil, not trees, is the hard part</span></a></li>')
    return '<ol class="tl-strip">' + ''.join(rows) + '</ol>'


def research_table():
    rows = []
    for name, style, lic, kb, miss, verdict in RESEARCH:
        cls = 'tl-r-used' if verdict.startswith('Used') else ('tl-r-anno' if verdict.startswith('Annotation') else 'tl-r-rej')
        rows.append(f'<tr class="{cls}"><th scope="row" data-label="Font">{esc(name)}</th><td data-label="Style">{esc(style)}</td><td data-label="License">{esc(lic)}</td>'
                    f'<td data-label="KB (latin)" class="tl-mono">{esc(kb)}</td><td data-label="Missing glyphs">{esc(miss) if miss else "none"}</td><td data-label="Verdict">{esc(verdict)}</td></tr>')
    rows.append(f'<tr class="tl-r-used"><th scope="row" data-label="Font">{esc(HERSHEY[0])}</th><td data-label="Style">Single-stroke letterforms</td><td data-label="License">Free for any use, credit required</td><td data-label="KB (latin)" class="tl-mono">45 (script file)</td><td data-label="Missing glyphs">no accents (added by code)</td><td data-label="Verdict">Used for the write-on animation</td></tr>')
    return ('<table class="tl-research"><thead><tr><th>Font</th><th>Style</th><th>License</th><th>KB (latin)</th><th>Missing glyphs</th><th>Verdict</th></tr></thead><tbody>'
            + ''.join(rows) + '</tbody></table>')


ANNO = [
    ('Caveat', 700, 26, 'Pen, fast and neat'), ('Reenie Beanie', 400, 30, 'Thin scrawl'), ('Over the Rainbow', 400, 24, 'Loose pencil'),
    ('Architects Daughter', 400, 22, 'Today’s site note font'), ('Zeyada', 400, 28, 'Thin pen script'), ('Homemade Apple', 400, 20, 'Fast ink cursive'),
    ('Nanum Pen Script', 400, 28, 'Rejected: no Cañada'),
]


def anno():
    items = []
    for n, w, s, d in ANNO:
        items.append(f'<li><span class="tl-anno__s" style="font-family:\'{n}\',cursive;font-weight:{w};font-size:{s}px">measure again in spring ↘ Cañada, 7:05 a.m.</span>'
                     f'<span class="rds-small tl-anno__n"><a class="rds-link rds-link--quiet" href="{gf(n)}">{n}</a> · {d}</span></li>')
    return '<ul class="tl-anno">' + ''.join(items) + '</ul>'


PAGE = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Type lab | Redrawn Valley</title>
<meta name="description" content="Six hand-drawn type directions with full hierarchies, a font research table with licenses, and writing-on animations at fast and slow speeds.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Architects+Daughter&display=swap">
<link rel="stylesheet" href="@@GFONTS@@">
<link rel="stylesheet" href="../assets/rds/tokens.css">
<link rel="stylesheet" href="../assets/rds/rds.css">
<link rel="stylesheet" href="../assets/rds/skin.css">
<link rel="stylesheet" href="lab.css">
<link rel="stylesheet" href="directions.css">
</head>
<body class="rds-page">
<header class="rds-nav" data-rds-nav data-rv-shell="nav"></header>
<main id="main" data-body="own">

<section class="rds-section" style="padding-bottom:var(--space-8)">
<div class="rds-container">
<nav class="rds-crumbs" data-rv-crumbs aria-label="Breadcrumb"></nav>
<div class="rds-sechead">
<p class="rds-eyebrow">Design system · Type lab</p>
<h1 class="rds-display">Six ways to <span class="rds-mark">draw</span> the type</h1>
<p class="rds-lead">I tested about 60 hand-drawn, architectural and typewriter fonts for licence, accents, size and how they hold up at caption size, and kept six directions. Each has a full hierarchy on a sample page, and the animation lab below writes text in with a pen or a typewriter, fast and slow. Nothing on the live site has changed.</p>
</div>

<div class="tl-verdict">
<h2 class="rds-h3" id="verdict">My read</h2>
<p><strong>Pick Hand-cut Serif for the whole site, and borrow Field Notebook for the home page and study titles.</strong> Hand fonts are good for titles, labels and notes and poor for long reading: they have small x-heights, uneven rhythm and thin strokes, and they slow the eye after a few hundred words. Hand-cut Serif keeps Newsreader for reading and puts the hand in the title, captions and margin notes. Field Notebook is the bolder choice if you want the whole page to look written. Use the switch below to see any direction with today's Newsreader body.</p>
<p class="rds-small">Direction 4 (Typewriter Log) suits the studies where evidence and numbers lead, and Wobble is the only one where the letters can move on their own.</p>
</div>

<div class="tl-controls" role="group" aria-label="Body text">
<span class="tl-controls__l">Body and lead text in every direction:</span>
<div class="rv-seg tl-seg">
<button type="button" data-body="own" aria-pressed="true">Direction’s own font</button>
<button type="button" data-body="site" aria-pressed="false">Newsreader (today)</button>
</div>
</div>

<p class="rds-eyebrow" style="margin-top:var(--space-8)">The six titles, side by side</p>
@@STRIP@@
</div>
</section>

@@DIRS@@

<section class="rds-section" id="lab" aria-labelledby="lab-h">
<div class="rds-container">
<div class="rds-sechead">
<p class="rds-eyebrow">Animation lab</p>
<h2 class="rds-display" id="lab-h">Writing it in</h2>
<p class="rds-lead">Three effects, each at two speeds. The pen draws single-stroke letterforms in the order a hand would; the typewriter strikes real fonts key by key; the sweep reveals a real handwriting font as if a pen were passing over it. Press any replay button. With reduced motion turned on in your system, nothing plays by itself and the text is simply shown; a button you press still plays, because you asked for it.</p>
</div>

<div class="tl-lab">
<h3 class="rds-h2">1. Pen write-on</h3>
<p class="rds-small tl-labnote">Strokes are drawn one at a time at a steady pen speed (each with a gentle start and stop), with a lift between letters, a small seeded wobble so no two letters match, and a dot for the nib. Ink goes from brick (wet) to dark (dry). Letterforms are the Hershey single-stroke fonts; accents are added by code.</p>
<form class="tl-form" onsubmit="return false">
<label>Your text<input type="text" id="pen-text" value="Soil, not trees, is the hard part" maxlength="90" autocomplete="off" spellcheck="false"></label>
<label>Hand<select id="pen-font"><option value="script">Script</option><option value="cursive">Script, complex</option><option value="print">Print</option><option value="italic">Italic serif</option></select></label>
</form>
<div class="tl-pair">
<div class="tl-demo"><p class="tl-demo__h"><span class="rds-tag rds-tag--brick">Fast</span> <span class="rds-small" data-readout="#pen-fast"></span></p>
<div class="tl-pen" id="pen-fast" data-rv-write="stroke" data-font="script" data-size="58" data-speed="fast" data-text="Soil, not trees, is the hard part"></div>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-rv-replay="#pen-fast" data-speed="fast">Replay fast</button></div>
<div class="tl-demo"><p class="tl-demo__h"><span class="rds-tag rds-tag--moss">Slow</span> <span class="rds-small" data-readout="#pen-slow"></span></p>
<div class="tl-pen" id="pen-slow" data-rv-write="stroke" data-font="script" data-size="58" data-speed="slow" data-text="Soil, not trees, is the hard part"></div>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-rv-replay="#pen-slow" data-speed="slow">Replay slow</button></div>
</div>
<div class="tl-hands">
<div class="tl-pen tl-pen--sm" id="h-cursive" data-rv-write="stroke" data-font="cursive" data-size="44" data-speed="fast" data-text="Cañada Blvd, 7:05 a.m."></div>
<div class="tl-pen tl-pen--sm" id="h-print" data-rv-write="stroke" data-font="print" data-size="36" data-speed="fast" data-text="PLAN · SCALE 1 in = 10 ft"></div>
<div class="tl-pen tl-pen--sm" id="h-italic" data-rv-write="stroke" data-font="italic" data-size="40" data-speed="fast" data-text="Measured, then redrawn"></div>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-rv-replay=".tl-hands .tl-pen" data-speed="fast">Replay the three hands</button>
</div>

<h3 class="rds-h2">2. Typewriter</h3>
<p class="rds-small tl-labnote">Each key lands at its own time (random by about a third either way), pauses a little after commas and longer after full stops, and prints with its own slight baseline drift and ink weight. Characters hold their place before they print, so nothing jumps as lines wrap.</p>
<div class="tl-pair">
<div class="tl-demo"><p class="tl-demo__h"><span class="rds-tag rds-tag--brick">Fast</span> <span class="rds-small" data-readout="#tw-fast"></span></p>
<p class="tl-tw" id="tw-fast" data-rv-write="type" data-speed="fast">Survey log, 7:05 a.m. Sidewalk lifted along the north edge. Three trees, one stump. I did not dig, so root claims stay estimates.</p>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-rv-replay="#tw-fast" data-speed="fast">Replay fast</button></div>
<div class="tl-demo"><p class="tl-demo__h"><span class="rds-tag rds-tag--moss">Slow</span> <span class="rds-small" data-readout="#tw-slow"></span></p>
<p class="tl-tw" id="tw-slow" data-rv-write="type" data-speed="slow">Survey log, 7:05 a.m. Sidewalk lifted along the north edge. Three trees, one stump. I did not dig, so root claims stay estimates.</p>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-rv-replay="#tw-slow" data-speed="slow">Replay slow</button></div>
</div>

<h3 class="rds-h2">3. Pen sweep on a real font</h3>
<p class="rds-small tl-labnote">For fonts with no stroke data (every font above), a word-by-word clip that travels left to right with a little tilt. It works on any text, including links and inline markup, and costs almost nothing.</p>
<div class="tl-pair">
<div class="tl-demo"><p class="tl-demo__h"><span class="rds-tag rds-tag--brick">Fast</span> <span class="rds-small" data-readout="#sw-fast"></span></p>
<p class="tl-sw" id="sw-fast" data-rv-write="sweep" data-speed="fast">Count first. Then draw. Every line on this plan is a measurement or a labeled guess.</p>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-rv-replay="#sw-fast" data-speed="fast">Replay fast</button></div>
<div class="tl-demo"><p class="tl-demo__h"><span class="rds-tag rds-tag--moss">Slow</span> <span class="rds-small" data-readout="#sw-slow"></span></p>
<p class="tl-sw" id="sw-slow" data-rv-write="sweep" data-speed="slow">Count first. Then draw. Every line on this plan is a measurement or a labeled guess.</p>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-rv-replay="#sw-slow" data-speed="slow">Replay slow</button></div>
</div>

<h3 class="rds-h2">4. Type that changes shape</h3>
<p class="rds-small tl-labnote">A word that cycles through the hand fonts, and a variable font whose bounce axis steps like a redrawn frame. Both pause with the buttons and stay still under reduced motion.</p>
<div class="tl-pair">
<div class="tl-demo"><p class="tl-shuffle" id="shuffle" data-shuffle="Caveat,Kalam,Amatic SC,Special Elite,Mansalva,Reenie Beanie,Fraunces,Shantell Sans" aria-label="Valley">Valley</p>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" id="shuffle-btn" aria-pressed="false">Pause</button></div>
<div class="tl-demo"><p class="tl-boil2" id="boil2">Redrawn</p>
<div class="tl-playbar"><button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-boil="#boil2" data-speed="fast" aria-pressed="false">Wobble fast</button>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-boil="#boil2" data-speed="slow" aria-pressed="false">Wobble slow</button>
<button class="rds-btn rds-btn--ghost rds-btn--sm" type="button" data-boil="#boil2" data-speed="off" aria-pressed="true">Still</button></div></div>
</div>
</div>
</div>
</section>

<section class="rds-section rds-band-sunk" id="margin" aria-labelledby="margin-h">
<div class="rds-container">
<div class="rds-sechead">
<p class="rds-eyebrow">Margin notes</p>
<h2 class="rds-display" id="margin-h">Voices for the notes</h2>
<p class="rds-lead">Notes on drawings can be wilder than text. Here are the handwritten voices that work as annotations at 20 to 30px. The last one fails on a Valley place name.</p>
</div>
@@ANNO@@
</div>
</section>

<section class="rds-section" id="research" aria-labelledby="research-h">
<div class="rds-container">
<div class="rds-sechead">
<p class="rds-eyebrow">Research</p>
<h2 class="rds-display" id="research-h">Every font I looked at</h2>
<p class="rds-lead">All the web fonts are free for websites: most are SIL Open Font License 1.1, and a few (Special Elite, Walter Turncoat, Homemade Apple and some I rejected) are Apache 2.0. Both allow self-hosting and embedding with no fee. Glyph checks use the font file's character map, and sizes are latin-subset woff2 files from Google Fonts on 2026-11-21.</p>
</div>
@@RESEARCH@@
<div class="rds-callout rds-callout--plain" style="margin-top:var(--space-8)">
<p class="rds-callout__title">What I could not verify</p>
<p>I did not read each licence file one by one: I used the licence Google Fonts lists for each family and cross-checked it against the fontsource package metadata, which agreed for every font here. Glyph coverage was tested on the default weight, not every weight. I judged legibility by eye on a screen at 375px and 1280px, not with readers, so the “rejected” notes are my opinion. Playwrite’s download size was not measurable from the CSS API.</p>
</div>
<h3 class="rds-h3" style="margin-top:var(--space-12)">Sources</h3>
<ol class="tl-sources">@@SOURCES@@</ol>
</div>
</section>
</main>
<footer class="rds-footer" data-rv-shell="footer"></footer>
<script src="../assets/rds/rds.js"></script>
<script src="../assets/site-shell.js"></script>
<script src="hershey.js"></script>
<script src="write.js"></script>
<script src="lab.js"></script>
</body>
</html>
'''


def main():
    page = (PAGE.replace('@@GFONTS@@', GFONTS_URL).replace('@@STRIP@@', strip())
            .replace('@@DIRS@@', '\n'.join(direction(d, i) for i, d in enumerate(DIRECTIONS)))
            .replace('@@ANNO@@', anno()).replace('@@RESEARCH@@', research_table())
            .replace('@@SOURCES@@', ''.join(f'<li><a class="rds-link" href="{u}">{esc(t)}</a></li>' for t, u in SOURCES)))
    (ROOT / 'fonts' / 'index.html').write_text(page)
    (ROOT / 'fonts' / 'directions.css').write_text(build_css())
    print('wrote fonts/index.html and fonts/directions.css')


if __name__ == '__main__':
    main()
