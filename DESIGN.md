# Redrawn Design System

The design system behind Redrawn Valley. Warm paper, ink, brick and moss; a serif for ideas, a sans for interface, mono for evidence. Plain CSS and a small plain script, no build step, no dependencies. **Read this before changing any page.** If a component exists here, use it; if you need a new one, add it to the system (`assets/rds/rds.css`) and document it here, not as a one-off.

Files: `assets/rds/tokens.css` (variables, light and dark), `assets/rds/theme.js` + `theme.css` (dark theme switch and baked-color fixes), `assets/rds/rds.css` (components, prefix `rds-`), `assets/rds/rds.js` (motion), `assets/rds/article.css` + `article.js` (article/Field Guide components), `assets/site.css` (site-only rules, prefix `rv-`), `assets/site.js` (home before/after toggle), `assets/site-shell.js` (shared header, footer, breadcrumbs, search), `assets/studies.css` + `assets/studies.js` (study pages and the studies index), `assets/rds/skin.css` (responsive layer then sketchbook layer, always last) with `mobile.js` and `sketch.js`.

## Character

Drafting-table calm. Looks like a printed site study: paper background, hairline rules, long serif headlines, one hand-drawn accent per section at most. Evidence-first copy: every number has a source, and what is unknown is said out loud. First person, short sentences, no hype. Nothing glossy: no gradients, no drop shadows, no stock imagery. Illustration is hand-drawn-feeling inline SVG (plans, sections, sketches) in the palette below.

## Color tokens (`tokens.css`)

| Role | Token | Hex |
|---|---|---|
| Page background | `--paper` | `#f6f1e7` |
| Raised surface (cards, inputs) | `--paper-raised` | `#fbf8f1` |
| Sunk band / code bg | `--paper-sunk` | `#ece5d6` |
| Hairline | `--line` | `#d9d0bd` |
| Strong rule / input border | `--line-strong` | `#8a8170` |
| Text | `--ink` | `#1f1d1a` |
| Muted text | `--ink-muted` | `#5c564c` |
| Faint text (captions, meta) | `--ink-faint` | `#655e51` |
| Text on ink band | `--on-ink` / `--on-ink-muted` | `#f6f1e7` / `#b8b0a0` |
| Brick (primary accent, actions, current state) | `--brick` / `--brick-deep` / `--brick-tint` / `--on-brick` | `#9c3d24` / `#7d2f1a` / `#f0d9cc` / `#fbf8f1` |
| Moss (secondary accent, links, "good/green" ideas) | `--moss` / `--moss-deep` / `--moss-tint` / `--on-moss` | `#2f4a3a` / `#213529` / `#dfe6d8` / `#f6f1e7` |
| Error | `--rust` | `#8c1c2e` |
| Water / info (drawings) | `--slate` | `#35506b` |
| Art accents (decorative fields only, never text or state) | `--sky` / `--ochre` / `--rose` / `--kelly` / `--peri` | `#7ba3c0` / `#be9661` / `#b17c83` / `#4f9b60` / `#7c849f` |

Rules: brick = do something / look here; moss = links, trees, proposed changes; slate = water and stormwater in drawings; rust only for form errors. Tints are for backgrounds of art, callouts and media, never for text. Page rhythm alternates `paper` and `rds-band-sunk` sections; `rds-band-ink` for a dark closing band or the footer. Never use pure black or white, and never hardcode a hex when a token exists. (SVG drawings in the study also use `#e8eef5` for glass/sky and `#4a4743` for linework; reuse those for drawings.)

## Typography

Three voices (self-hosted Latin subsets in `assets/fonts/`, see Font files below; decision recorded in `/lab/type-lab/#decisions`): **Shantell Sans** (`--font-display`, variable, axes INFM at 100 and BNCE) for display only: H1, H2, the wordmark, pull quotes and big numerals. **Figtree** (`--font-sans`, `--font-serif`) for everything read or pressed: body, lead, H3, card and row titles, nav, buttons, and all labels, which are sentence-case 600-weight text with no tracking and no all-caps (no tiny tracked eyebrows, tags or infobox keys). **DM Mono** (`--font-num`) only for numerals, citation markers and code, tabular and plain case. **Caveat** (`--font-hand`) only for scribbled annotations (`rds-note`, the home flip hint, drawing notes). `--font-mono` now points at Figtree so legacy meta text is sans; use `--font-num` when a number really needs mono. Rule of thumb: if a string is not a title, a note or a number, it is Figtree. No italic file is loaded, so italics become medium roman. The type layer is the last block of `skin.css`; the size column below is the older spec, the layer sets reading text at 18/30.

| Class | Spec |
|---|---|
| `rds-display-xl` | serif 400, clamp(44,7vw,72)px / 1.02, -0.02em; one per page (hero h1) |
| `rds-display` | serif 400, clamp(36,5.4vw,56)px / 1.05; section headlines |
| `rds-h1` / `rds-h2` / `rds-h3` | serif 400/500/500, 40 / 30 / 22px |
| `rds-lead` | sans 20/30, `--ink-muted`, max 56ch, under a headline |
| `rds-prose` | serif 19/31, max 68ch; first paragraph 24/36; supports h2, blockquote (italic 30px, top rule), ul, code |
| `rds-eyebrow` | sans 600 12px caps, +0.08em tracking, muted; sits above every section headline |
| `rds-small`, `rds-mono` | 14/22 sans, 14/22 mono |
| `rds-note` (+ `--moss`, `--ink`) | Caveat 700 (`--font-hand`), rotated -2deg, with optional arrow svg; margin annotations on drawings |
| `rds-mark` | brick hand-drawn highlighter under a word, animates in; use on one phrase per page |
| `rds-circle` | brick hand-drawn circle around a word |

Headlines are sentences that state the finding ("Soil, not trees, is the hard part"), not labels.

**Font files** (`scripts/build_fonts.py`, run by `regen.py`, checked by `check.py`). Fonts are self-hosted, not loaded from Google: Latin subsets (Basic Latin, Latin-1, common punctuation) of the four OFL families in `scripts/data/fonts/`, written to `assets/fonts/<name>.<hash>.woff2` plus `fonts.<hash>.css` (the `@font-face` rules). Hashed names are cached for a year as immutable (`vercel.json`); a changed font is a new URL. Shantell Sans keeps wght 400-700, INFM 70-100 and BNCE -100..100 (90 KB); Figtree is a 16 KB variable file; DM Mono is the 400 weight only (7.5 KB); Caveat is pinned to 700 (49 KB). Every page head carries two preloads (Shantell, Figtree) and one stylesheet link, and nothing else: Caveat and DM Mono are not preloaded, because a browser fetches a face only when text on the page uses it. Do not hand-edit the font links in a page head and do not write a `font-family` literal in component CSS: use `--font-display`, `--font-sans`, `--font-num`, `--font-hand`. Arrows like the up-right arrow in "Open the source" are not in these subsets and fall back to the system font. To change a family or weight, edit `scripts/build_fonts.py` (`--subset` rebuilds the sources from Google's files) and re-run it. The type lab (`/fonts/`) still loads its own candidate families from Google on purpose.

## Spacing, radius, layout, motion

- Spacing scale: `--space-1…32` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px (no 5/7/9–11). Sections: `rds-section` (64px block, 96px at ≥800px). Header-to-content gap `--space-12`.
- Radius: `sm` 4 (code, solid tags), `md` 8 (buttons, inputs, callouts), `lg` 16 (cards, figures, art), `pill` 999.
- Container: `rds-container` = min(1120px, 100% − 48px), centered. Prose measure 68ch.
- Breakpoints used: 640 (nav links hide, rows stack), 800–860 (two-column layouts), 960 (home hero), 1240/1479 (contents rail shows/expands).
- Motion: `--ease-out cubic-bezier(.16,1,.3,1)` for entrances and hovers, `--ease-in-out` for drawing strokes. Durations: fast 160, base 320, slow 720, draw 1600ms, stagger 70ms. Hover = small translate (-1px buttons, +12px row indent, +4px arrows), underline sweeps, never color flashes. All motion respects `prefers-reduced-motion` (CSS and JS both handled).

## Components (`rds.css`)

- **Page shell**: `<body class="rds-page">`; `rds-container`, `rds-section`, bands `rds-band-sunk` / `rds-band-ink`; `rds-rule` hairline.
- **Section header** `rds-sechead` (eyebrow + `rds-display` + `rds-lead`, 46rem max; `--split` for two columns). The unit that sets hierarchy for every section.
- **Nav** `rds-nav` with `data-rds-nav` (transparent at top, paper with border once scrolled, 72→56px): `rds-nav__brand`, `rds-nav__links`, optional ghost `rds-btn--sm`.
- **Hero** `rds-hero` (+ `__copy`, `__actions`, `__art` square, `--moss`/`--sunk`). Home uses site-specific `rv-hero` with the before/after figure.
- **Button** `rds-btn` (brick) / `--moss` / `--ink` / `--ghost` / `--sm`; 44px tall, md radius; include `<span class="rds-arrow">→</span>` on forward actions. Inside an ink band buttons invert to paper.
- **Link** `rds-link` (moss, underline that retracts on hover) / `--quiet` (underline appears on hover).
- **Tag** `rds-tag` (+ `--brick`, `--moss`, `--solid`); small caps labels like "Study 01 · Woodland Hills".
- **Card** `rds-card` (+ `__media` with `--brick/--sunk/--ink`, `__body`, `__title`, `__text`, `__foot`); inside `rds-grid` (auto-fit, min 260px). Links as `<a class="rds-card">`.
- **Rows** `rds-rows` > `rds-row` (title / text / mono meta; 3 columns, stacks under 640px). **The default way to list things; reach for rows before a grid of cards.**
- **Figure** `rds-figure` > `__art` (`--brick`/`--moss` tint) + `figcaption` in mono ("Fig. 1: … / Concept sketch, not a rendering").
- **Quote** `rds-quote`; **Callout** `rds-callout` (+ `--moss`, `--plain`, `__title`) for "What is real / What is estimated" notes.
- **Accordion** `rds-acc` using `<details>`; **Field/Input** `rds-field`, `rds-input` (44px, `--error` state uses rust).
- **Contents rail** `rds-toc` + `data-rds-toc`: left-edge ticks, current one thick brick with its label, expands on hover, hidden under 1240px.
- **Footer** `rds-footer` (ink band; built by `site-shell.js`: brand and about-the-author line, then Explore, Studies, Field guide, Notes and Lab notes columns filled from the search index, then the disclaimer, a "Last updated" stamp (`updated` in `search-index.json`, which `build_index.py` moves only when indexed content changes) and a back-to-top link. Long titles clamp to two lines; Email and GitHub links sit in the base line).
- **Site-only (`site.css`, `rv-` prefix)**: `rv-compare` + `rv-seg` (Today/Proposed segmented toggle), `rv-feature` (featured study card), `rv-facts` (3 big serif numbers), `rv-steps`/`rv-step` (numbered method, first number brick), `rv-note`, `rv-about`, `rv-planned` (dimmed placeholder rows).

## Shared shell, breadcrumbs and search (`assets/site-shell.js`)

Every page uses one script for the header, footer, breadcrumbs and search, so the nav changes in one place. Add placeholders and load the script (path relative to the page; `../` per folder level):

```html
<header class="rds-nav" data-rds-nav data-rv-shell="nav"></header>
<main id="main">
  <div class="rds-container"><nav class="rds-crumbs" data-rv-crumbs aria-label="Breadcrumb"></nav></div>
  ...
</main>
<footer class="rds-footer" data-rv-shell="footer"></footer>
<script src="../assets/rds/rds.js"></script>
<script src="../assets/site-shell.js"></script>
```

- **Nav** `rds-nav` + search button `rds-nav__search` (shortcut `/` or Ctrl/Cmd+K) and, under 640px, a `rds-nav__menu` toggle that opens the links as a panel. Items live in the `NAV` array in `site-shell.js`, ordered Studies, Field guide, Notes, About. Studies, Field guide and Notes carry a caret that opens a flyout (`rv-nav__panel`: icon, one-line blurb, first pages from the search index, "All N …" link); it opens on hover or focus, the caret toggles it for keyboard and touch, Esc and outside click close it. `rds-skip` is the skip link; give `<main>` `id="main"`.
- **Breadcrumbs** `rds-crumbs`: Home / section / page, built from the URL and the search index (the last crumb is the page `<h1>`). Hidden on the home page.
- **Search** `rds-search` dialog (`<dialog>`, keyboard: arrows, Enter, Esc). Reads `assets/search-index.json`. Open it from anything with `data-rv-search-open`; an inline `<form data-rv-search-form>` with an input opens it prefilled (home and 404 use `rv-search`). Ranking: title > headings > description > body text; every word must match; headings with an `id` also appear as their own result.
- **Index** `python3 scripts/build_index.py` crawls every `*.html` (skips `404.html` and `<meta name="robots" content="noindex">`) and writes `assets/search-index.json`, `sitemap.xml` and `robots.txt`. Give pages a `<title>` (`Page | Redrawn Valley`), a `<meta name="description">`, and ids on `h2`/`h3` so headings are searchable and deep-linkable. Mark chrome you do not want indexed with `data-rv-noindex`.
- **404** `404.html` uses root-absolute paths (`/assets/...`) because Vercel serves it at any depth.

## Motion hooks (`rds.js`, add as attributes)

`data-rds-reveal[=fade|scale|left]` fade-up on enter · `data-rds-stagger` on a parent staggers children · `data-rds-split` on a headline makes words rise in · `data-rds-draw` on an `<svg>` draws `.rds-stroke` paths then pops `.rds-fill` shapes · `data-rds-nav` · `data-rds-parallax="0.15"` · `data-rds-toc` on a nav of `#links`. Style the `--i` custom property inline to order items (`style="--i:2"`). Without JS everything is visible. `window.RDSMotion.init(scope)` re-scans dynamically added content.

## Page patterns

**Home** (`index.html`): sticky nav → hero (display-xl split headline, lead, two buttons, search form, before/after figure) → Browse (three rows: Studies, Field guide, Notes) → Studies (sunk band; featured `rv-feature` + planned rows) → Method (4 numbered steps) → Notes (eyebrow/headline left, serif prose right with one `rds-mark`) → About (art + sechead + contact rows) → ink footer.

**Study** (`studies/<slug>/index.html`): a long-form article page. It links `assets/rds/tokens.css`, `assets/rds/rds.css` and `assets/studies.css`, and runs `assets/studies.js` (reveals, contents rail, part tabs, scroll-driven figure). Most markup is still inline-styled with hex values; new studies should use the `rv-` classes below instead. Structure: sticky top bar with part tabs (Site / Evidence / Design / Delivery / Sources) → left contents rail with count "01 / 13" → header (case-study label, split headline with one `rds-mark`, lead, two-column fact table: Site, Type, Focus, Status, By, Date) → sticky scroll-driven figure with step text beside it (`data-scrolly`, `data-step`) → "What is real / What is estimated" callout → four parts each with a bordered "Part N of 4" bar and numbered sections (`secNN`): Site, Problem, Evidence, Precedents, Proposal ("seven moves, added one at a time"), Before/after, Soil, Planting, Drawings, Phasing, Measuring, Limits → numbered Sources list. Claims carry superscript mono citations `[n]` that link to `#sN`. Concept-sketch disclaimers appear on every drawing.

**Content rules**: cite every number; mark estimates as estimates; end every study with what is unknown and what would be measured before/after; say "concept study, not commissioned"; no invented quotes or sources.

## Notes (long-form essays)

`notes/index.html` (index: feature, topic filter, rows) and `notes/<slug>/index.html` (essays). Styles are in `assets/rds/notes.css` (`rv-` prefix), script in `assets/rds/notes.js` (reading-progress line, topic filter). Essay anatomy: `rv-ehead` (back link + topic tag, `rds-display` headline, `rds-lead` dek, mono `rv-byline` with date, reading time, source count) → `rds-toc` contents rail → `rv-body` of numbered sections (`rv-num` + h2; prose at 68ch, figures `rv-fig rv-wide` break out to 60rem) → `rv-pull` pull quotes → `rds-callout--plain` "What I could not verify" → `rv-sources` numbered list. Footnotes are `<sup class="rv-fn"><a href="#nN">` linking to `<li id="nN">` with a back-arrow. Inline SVG figures use the `.rv-svg` classes (`ln`, `f-*`, `s-*`, `t-*`) so drawings stay in palette. Each essay ends with two related notes as `rds-rows`.
## Icons and the logo mark (`assets/rds/icons/`)

Hand-drawn SVG set, gallery at `icons/index.html`. Files: `icons.svg` (sprite, `<symbol id="i-NAME">`, 24px grid; `i-logo` is 32px), the `rds-icon` component, `rds-logo` and gallery styles live in `rds.css`, `logo.svg`, `favicon.svg`, `apple-touch-icon.png`, `names.json`. The drawings live as plain point lists in `scripts/build_icons.py`, which roughens them (seeded, stable) into wobbly paths and rewrites the sprite and the gallery. Edit the script, run `python3 scripts/build_icons.py`, commit the output. Never hand-edit `icons.svg`.

- **Use**: `<svg class="rds-icon" aria-hidden="true"><use href="PATH/assets/rds/icons/icons.svg#i-tree"/></svg>`. Decorative; the text next to it carries the meaning. External sprite references need HTTP, so icons do not show when a page is opened from disk.
- **Colors**: linework is `currentColor`; one accent stroke uses `--icon-accent` (brick by default); a pale tint is laid slightly off the line with `--icon-tint`. Modifiers: `rds-icon--moss` (trees, proposals), `--slate` (water), `--ink`, `--quiet` (no accent), `--on-ink`.
- **Sizes**: `rds-icon` 1.5em, `--sm`, `--lg` (2rem), `--xl` (3rem). Line is about 1.9px at 24px.
- **Set**: navigation (home, guide, studies, notes, search, menu, close), interface (arrows, chevrons, plus, minus, contents, footnote, external, info, warning, check, hash, quote) and topics (heat, tree, shade, pavement, water, river, soil, sidewalk, bioswale, permeable, leaf, thermometer, pin, ruler, building).
- **Drawing a new one**: two or three strokes, one accent stroke on the meaningful part, round caps, never solid-ink fills. If it needs more, it is an illustration.
- **Logo mark** `rds-logo` (`#i-logo`): two ridgelines forming a valley, ink for the old line, brick for the redrawn one beneath it, and a low brick sun: three strokes so it holds at 16px. The shared shell puts it left of the Newsreader wordmark in the header (and phone top bar) and in the footer; `favicon.svg` is the same mark on a paper tile. `site-shell.js` adds the favicon and icon stylesheet to any page that lacks them.
- **Where icons appear**: phone tab bar (brick accent on the current tab only), header search, topic icon at the start of each field guide, notes and studies index row (`rds-row__icon`, with `--moss` / `--slate` variants).

## Studies

Files: `assets/studies.css` (all rules for study pages), `assets/studies.js` (page behavior), `studies/index.html` (the index), `studies/_template/index.html` (copy this).

Components (prefix `rv-`, tokens only):
- **Article head** `rv-article-head` > `__main` (eyebrow, `rds-display-xl` headline with one `rds-mark`, lead) + `rv-infobox`. Two columns at 1000px and up, stacked below.
- **Infobox** `rv-infobox` (`__head` with `__kicker` + `__title`, `__list` of `<div><dt><dd>` rows, `__tags`, `__foot`): the encyclopedic at-a-glance panel. Rows for a study: Location, Site type, Focus, Methods (list), Status, By, Date, Field guide. Cite numbers with `<sup><a href="#sN">[N]</a></sup>`.
- **Guide term** `rv-term`: a pill. Use `<span class="rv-term" data-term="slug">` until the field guide entry exists, then `<a class="rv-term" href="../../guide/<slug>/index.html">`.
- **Table** `rv-table` (index): real table over 760px, labelled stacked lines below (give each `<td>` a `data-label`).
- **Sections** `rv-part` > `rv-part__bar` (Part N of 4) and `rv-sec` > `rv-sec__head` (eyebrow, h2 headline, summary) + `rv-sec__body` (64ch). Citations `rv-cite`; source list `rv-sources` with `<li id="sN">`; page bar `rv-study-bar`.
- Legacy study-script hooks (keep as is): `rds-view` (reveal), `rds-split`/`rds-w` (headline words), `rds-draw` with `.s`/`.f`, `kt` rail, `kstep`/`data-scrolly`, `data-toc`.

- **Study 02 drawings are generated from public parcel data**: `python3 scripts/fallbrook_art.py` redraws the parcel plan, the staged frontage plan and the section from `scripts/data/fallbrook_parcels.py` (City of Los Angeles parcel outlines) and the design numbers at the top of the script, with asserts. Study-specific styles live in `studies/<slug>/study.css` (`fb-` prefix); drawing classes (`dk`, `df-*`, `dt`) are the same as study 01.
- **Study 03 pieces** (`studies/ventura-topanga-corner`, drawings from `scripts/ventura_corner_art.py`): staged layers `.stg-fN` (appear at stage N) and `.stg-uN` (shown until stage N), driven by `data-st` on `[data-scrolly]`; distance bars `vt-bars` (rows on a mile axis with a quarter-mile rule); `vt-ledger` (two-number table); `vt-loop` (two panels animated on a 12 s loop, static under reduced motion); `vt-rows` (study rows with a fixed meta column). Plan drawings are generated from dimensions in feet.

**Adding a study**
1. Copy `studies/_template/index.html` to `studies/<slug>/index.html` (same depth, so paths stay valid). Delete the noindex meta and the instruction comment.
2. Replace every `[BRACKETED CAPS]` placeholder; fill every infobox row. Keep the real/estimated callout, Measuring, Limits and Sources. Headlines state findings; every number is cited; no invented sources.
3. Add it to `studies/index.html` (table row, topic rows), and the home page Studies section. The footer and search pick it up once `python3 scripts/build_index.py` has run.
4. Run `python3 scripts/check.py`, then view at 375px and 1280px.

## Article components (`article.css`, `article.js`)

For long-form reading pages, used by the Field Guide (`guide/`). Load `assets/rds/article.css` after `rds.css`, and `assets/rds/article.js` at the end of the page (`data-rds-article` on `<main>`). Without JS everything is readable.

- **Layout**: `rds-article` > `rds-article__wrap` (46rem, 60rem at ≥900px) > `rds-article__head` (`rds-tag`, `rds-article__title`, `__tagline`, `__meta` mono line), then `rds-hatnote` (italic "part of / for X see Y" line) and `rds-article__body`.
- **Body**: serif 19/31, first paragraph 21/33; `h2` are auto-numbered (`01`, `02`) in brick mono with a hover `#` anchor (`rds-anchor`). Don't put another `h2` inside the infobox.
- **Infobox** `rds-infobox`: floats right (19rem) at ≥900px, full width above the body below that. Parts: `__title` (moss header, a `<p>`), `__art` (small inline SVG, moss tint), `__cap`, a `<dl>` of `<div><dt/><dd/></div>` rows, `__foot`.
- **Contents box** `rds-contents` (`<details open>` with a numbered `<ol>`; current heading gets `aria-current`).
- **Cross-reference** `rds-xref`: moss link with dotted underline for links to other entries.
- **Footnotes**: marker `<sup class="rds-fn" id="cite-KEY-N"><a href="#note-KEY">[n]</a></sup>`; list `rds-notes` of `<li id="note-KEY">` with citation, URL, `rds-back` return links (`↩`) and `rds-kind` (what type of source). Hover or focus a marker for a popover; the targeted note highlights. Number notes in order of first use, infobox first.
- **See also** `rds-seealso` (title link plus one-line reason), **Topics** `rds-categories` (pills), **Pager** `rds-pager` (prev/next entry).
- **Index**: `rds-guidebar`, `rds-guide-search`, `rds-chips` > `rds-chip[aria-pressed]`, `rds-letter` (A–Z markers), entries as `rds-row` with `data-title`, `data-text`, `data-topic`; `data-rds-guide` on the rows wrapper, `data-rds-search`, `data-rds-topic`, `data-rds-count`, `data-rds-empty` hooks. Pages use the shared shell (header, footer, `rds-crumbs`, site search) from `site-shell.js`.
- **Content rules (Field Guide)**: every number gets a note; each entry ends its text with "What I do not know" as a `rds-callout--plain`; my own arithmetic or judgment is labeled as such; Wikipedia only for basic geography and flagged; never invent sources.
- Print styles hide nav, footer and pager and print note URLs.

## Page patterns: Field Guide

`guide/index.html` (sechead, search + topic chips, A–Z rows in a sunk band, "how to read it" band) and `guide/<slug>/index.html` (crumbs, head, hatnote, infobox + contents, numbered sections, see also, notes, topics, pager). New entry: copy an existing entry, add it to the index list, the footer list if wanted, and cross-link from related entries.

## Mobile (Part 1 of `assets/rds/skin.css`, `mobile.js`)

One layer, loaded **last** on every page, scoped to phones (max 640px) and tablets (max 899px) so desktop is untouched. The layer ships inside `skin.css` (the one stylesheet loaded after the page's others); keep that link last and `<script src="…/assets/rds/mobile.js">` before `site-shell.js`. The tab bar comes from `site-shell.js`. Tested at 360, 390, 430 and 820px; no horizontal page scroll.

- **Gutter** 20px (18px under 375px) via `--rv-gutter`; it overrides the 48px container maths, inline-styled study sections included. Prose 18/29 serif (lead paragraph 20/31), headlines clamp down (`rds-display-xl` 36–44px).
- **Top bar** `rds-nav`: 52px, solid paper, brand left, 44px search icon right. It slides away when you scroll down and returns on scroll up (`.is-hidden`). The Menu button and link list are hidden on phones; navigation is the tab bar.
- **Tab bar** `rv-tabbar` (`assets/rds/tabbar.css` + `tabbar.js`; markup from `site-shell.js`): fixed bottom, five targets at `--rv-tab` (56px) high (Studies, Guide, Notes, Search, More; Home is the brand in the top bar; More opens a bottom sheet `rv-menusheet`), safe-area aware, page gets matching bottom padding. This is the only persistent bottom bar. Phones only; without JS it is five plain links.
  - **Look:** a hand-drawn wobbly ink line for the top edge (`rv-tabbar__edge`), line icons (the sprite's strokes, inlined so they can draw), 11px labels. Current tab: ink icon with brick accent stroke, brick semibold label, icon lifts `--tab-lift`.
  - **Sketched indicator** `rv-tabbar__mark`: one brick pencil loop with a `--brick-tint` wash, slid under the current tab with `--ease-spring` and redrawn (`stroke-dashoffset`, `--dur-medium`). On a new page it starts under the tab you came from (kept in `sessionStorage` key `rv-tab`) and glides across; opening More moves it to More, closing returns it. Pages within the same section just show it in place.
  - **Line-draw icons:** each icon is two `pathLength="1"` strokes (ink, then accent a beat later) that draw on whenever their tab becomes current.
  - **Press feedback:** pointer-down squashes the icon (`--tab-press-scale`, `--tab-press-tilt`), nudges the label, spreads a pencil ring (`rv-tab__dab`, `--tab-dab`) from the touch point and buzzes 6ms where `navigator.vibrate` exists (not iOS); it springs back on release. Keyboard Enter/Space gets the squash; focus shows a 2px ink outline.
  - **Reduced motion:** all transitions and animations are off, the ring is hidden, pressed cells just take the `--paper-sunk` background. Light and dark themes come from the role tokens (`--brick` turns turquoise).
  - **Tokens:** `--tab-icon`, `--tab-mark-w/h`, `--tab-stroke`, `--tab-edge-stroke`, `--tab-press-scale`, `--tab-press-tilt`, `--tab-lift`, `--tab-dab` in `tokens.css`; motion uses `--dur-*` and `--ease-spring/--ease-reveal/--ease-out`. If an icon changes in `icons.svg`, update `TAB_ICONS` in `site-shell.js` to match.
- **Contents pill + sheet** `rv-jump`, `rv-sheet`: on articles, essays and studies a floating pill ("03 / 07 Heading ⌃") appears after the first section and opens a bottom sheet listing every section (current one in brick). It replaces the desktop contents rail. Source list: `.rds-contents`, else `.rds-toc`, else the study's `.kt` rail. It hides near the footer.
- **Footnotes by tap** `rv-note-read`: tapping a `[n]` marker (or any `sup a` pointing at an `<li>`) opens the note in the sheet with a "Jump to the list" button instead of leaving the line. Markers get a 44px invisible hit area; the hover popover is off on touch.
- **Collapsible infobox** `.is-collapsible` + `rv-more`: under 900px the infobox shows its title and first three facts, hides the sketch and the rest behind "Show all N facts" / "Show sketch and all facts". `rds-contents` starts closed with a 52px summary.
- **Study tab bar**: a single 48px row. "← All studies", then Site / Evidence / Design / Delivery / Sources scroll sideways; the current part is underlined and scrolled into view. The scroll-driven figure pins right under it.
- **Search** `rds-search`: full-screen sheet, 48px input, 56px result rows, "Cancel" instead of Esc.
- **Lists and controls**: rows get a chevron and a pressed state; buttons are 48px, hero buttons stack full width; chips and breadcrumbs scroll sideways on one line instead of wrapping; footer links are 44px rows; wide essay figures pan sideways (min 560px) instead of shrinking their labels.
- **Touch, not hover** (`@media (hover:none)`): no hover shifts, a `:active` background instead, no tap highlight.
- **Rule**: new components must work with a thumb: 44px minimum targets, nothing that only appears on hover, no second sticky bar at the top. Check every new page at 360 and 430px.

## Controls kit (end of `skin.css`)

No control should look like the browser default. Use:
- **Select**: `.rds-select` (or any `select` inside `.rv-lab`): ink outline, hand-drawn chevron, pencil shadow on hover, dashed brick focus ring.
- **Text field**: `.rds-input`; the field-guide filter and pattern-lab seed share the same border and focus.
- **Check / radio**: `<label class="rds-check"><input type="checkbox">Label</label>` (brick fill, hand-drawn tick).
- **Range**: `<input type="range" class="rds-range">`, a wobbly rule track with a brick thumb.
- **Disclosure**: `.rds-contents summary` uses hand lettering and a rotating chevron.
- **Search dialog**: the bar carries the focus ring (a brick rule), the active result has a brick tick, titles drop the ` | Section` suffix.
- Tables (`.rv-table`) use a hand-drawn head rule. 
New controls go in this block, not in page `<style>` tags.

## Controls kit (end of `skin.css`; chevron and tick are data-URI art with dark copies from `scripts/build_theme.py`)

No control should look like the browser default. Use:
- **Select**: `.rds-select` (or any `select` inside `.rv-lab`): ink outline, hand-drawn chevron, pencil shadow on hover, dashed brick focus ring.
- **Text field**: `.rds-input`; the field-guide filter and pattern-lab seed share the same border and focus.
- **Check / radio**: `<label class="rds-check"><input type="checkbox">Label</label>` (brick fill, hand-drawn tick).
- **Range**: `<input type="range" class="rds-range">`, a wobbly rule track with a brick thumb.
- **Disclosure**: `.rds-contents summary` uses hand lettering and a rotating chevron.
- Tables (`.rv-table`) use a hand-drawn head rule. 
New controls go in this block, not in page `<style>` tags.

## Using this when adding pages

1. Start from `index.html`'s `<head>` (fonts, `tokens.css`, `rds.css`, `site.css`) and `<body class="rds-page">`; load `assets/rds/rds.js` at the end. Paths are relative; pages in `studies/x/` use `../../assets/...`.
2. Compose from the components above; section = `rds-section` > `rds-container` > `rds-sechead` + content. Alternate paper and sunk bands.
3. Use tokens, never raw colors or pixel spacing outside the scale. Check at 375px and 1280px, and with reduced motion.
4. New site-only styles go in `assets/site.css` with the `rv-` prefix. Genuinely reusable pieces go in `rds.css` plus this doc.
5. Run `python3 scripts/check.py` (links and anchors) before opening a PR.

## Sketchbook layer (Part 2 of `skin.css`, `sketch.js`)

Makes the whole site feel drawn instead of printed. Load `assets/rds/skin.css` last and `assets/rds/sketch.js` with `defer` on every page. It is cosmetic only: remove it and nothing breaks. This supersedes the "no shadows" line above for the two pencil patterns below.

- **Hand lettering**: `--rv-hand` (Architects Daughter) now sets eyebrows, tags, nav links, buttons, chips, row meta and empty states. Headlines stay Newsreader, prose stays serif, figure captions and numbers stay mono (evidence).
- **Wobbly borders**: `--rv-r-lg/md/sm` are uneven radii; cards, figures, infoboxes, callouts and inputs use them with a 1.5px ink border (`--rv-stroke`). Reuse the variables, never a plain radius, on new boxed things.
- **Pencil offset**: `--rv-pencil` (2px 3px, no blur) under buttons and linked cards; lifts on hover, presses flat on active. The only shadow allowed.
- **Hand-drawn rules**: `--rv-rule`, `-soft`, `-ink`, `-brick` are tiled squiggle backgrounds that replace 1px borders on rows, steps, facts, pull quotes, sources and `rds-rule`.
- **Paper**: a fixed grain overlay (`.rds-page::before`) plus wavy torn edges on `rds-band-sunk` and the footer.
- **Washi tape**: automatic on `rv-compare`, infoboxes, `rv-fig` and non-plain callouts.
- **Pencil filter**: `sketch.js` injects `#rv-pencil` / `#rv-pencil-soft` (SVG displacement) and adds `rv-pencil` to drawings in figures, cards and infoboxes. Drawings that animate (`data-rds-draw`) get it 2.4s after they scroll in, because filtering a large SVG every frame is slow. Put `class="rv-pencil"` on any new SVG drawing.
- **Chart figures** (`svg.rv-svg`) get `rv-pencil-shapes` instead: only lines and shapes wobble (`#rv-pencil-line`), text stays crisp so numbers stay readable.
- **Hero collage** `rv-collage`: contour lines (moss), drafting grid, halftone dots (brick), compass and scale bar behind the home figure. Reuse it as the art for new section heads: one tinted field, single-weight ink on top.
- **Generated art** `scripts/sketchlib.py` (tiny hand-drawn SVG helper: wobbly lines, offset tint, hatching, trees, sun, rain) and `scripts/guide_art.py` regenerate every Field Guide infobox drawing (300x150, one tinted field, single-weight ink line, hand labels). Add a new entry's art there, then run `python3 scripts/guide_art.py`.
- **Essay figures** (`.rv-svg`): flat tints become hatched fills (patterns `#rv-h-*` injected by `sketch.js`), shapes get a 1.6px ink outline, gridlines are dotted, labels get a paper halo so they stay legible over hatching.
- **Study pages** (`studies/<slug>/`): their former inline styles now live in a co-located `study.css` (classes `ts-N`, tokenised, with the sketchbook rules and the phone rules baked in), linked after `studies.css` and before `skin.css`. The attribute-selector overrides and nearly all `!important` are gone from `skin.css`. Structural study rules (tab bar, scroll figure) stay in `skin.css`. New studies should compose `rv-`/`rds-` components; `studies/_template` shows the pattern.
- **Topanga drawings are generated**: `python3 scripts/topanga_art.py` redraws both perspectives, the existing plan, the six-stage plan and sheets L-1 and L-2 from the study's dimensions (210 by 50 ft building, 113 ft lot, 4 rows of 17 stalls, 68 to 61 stalls, 17 trees by species) with asserts on every count. Classes: `dk` pencil line (`dk-b` heavy, `dk-f` fine, `dk-m/r/s` moss/brick/slate), `df-*` fills, `dt` hand lettering; the blueprint sheets re-map the same classes to chalk via `.ts-fig--bp`. The older utility classes (`kmo`, `kpc`, `kbp`, `w1_6`, `op5`, `z11`, `tx`) remain only for the section and detail drawings. Colours come from tokens `--pencil`, `--blueprint`, `--draft-line`. The SVGs carry no inline styles or hex. Geometry and labels (every cited dimension) are unchanged, checked by diffing path data and text against the previous version.
- **Tile banner** `rv-tiles` (`scripts/tiles_art.py`): three flat tinted tiles side by side, each mixing a drafting object (compass, ruler, scale bar), a plan or section fragment and a texture (grid, halftone, contour). Used under the headline of the guide, notes and studies indexes. Borrowed from the collage recipe in the reference library; the art itself is original.
- **Marker highlight**: `rds-mark` is now a tilted brick-tint block that wipes in.
- **Focus**: dashed brick marker ring on every focusable element.
- **Ornaments**: `rv-divider` (vine with three leaves), `rv-sun` (slow-turning sun doodle), `rv-hero__flip` (hand note with arrow), `rv-404` (404 layout with a signpost drawing), `rds-empty` (magnifier doodle).
- **Reduced motion**: sun, hover tilts and the highlight wipe are switched off.

## Motifs (`assets/rds/motifs.js`, styles in `rds.css`)

Seeded generative art in the recipe of the reference contact sheets (kept in the project Library, never in the repo): flat tiles, each one thing, on one saturated or pale field; grid-filled circles and squares; overlapping translucent circles; drafting tools (compass, protractor, set square, scale ruler); contour rings; halftone; plan symbols (tree canopies, flow line, scale bar, north arrow); bars on ink; crossing lines on dotted paper; a big sprite icon; pill process diagram (SITE, MEASURE, PLAN); section with ground hatch, tree and scale figure; ledger page with a circled entry; crosshatch tone. Everything is drawn in code, original, in our tokens plus the five art accents.

```html
<div class="rds-art" data-rds-art="banner" data-art-mobile="card" data-seed="guide/tree-canopy" data-topic="shade trees" aria-hidden="true"></div>
```
- **Kinds**: `banner` (1120x220, 2 to 3 tiles), `strip` (1120x56, a row of small tiles; a strip is added above the footer on every page automatically), `card` (8:5), `square`. `data-art-mobile="card"` swaps to the card layout at 640px and below so a banner does not shrink to a sliver. Add class `rv-tiles` to get the ink frame and pencil shadow used on page banners.
- **Seed**: same `data-seed` gives the same drawing, so every guide entry and note has its own composition. Use the page slug. `data-topic` biases palette and motifs (shade and trees lean moss and canopy plans; water and rain lean slate, contours and flow; heat and pavement lean brick, halftone and rulers; soil leans ochre and bars). Pages without a topic use the full set.
- **Rules from the references**: 2 to 4 flat colours plus ink and paper per image; a field colour is never reused within one banner when avoidable; the grid sits on the shape, not the field; ink line weight is constant per drawing; no text on a randomised fill (the only text is mono labels on the ruler and plan, which are decorative).
- **Live drift**: only while the art is at least 10% on screen, the tab is visible and `prefers-reduced-motion` is not set. Every 5 to 10 seconds one tile shifts: its field colour crossfades (1.4s), a disc morphs to a rounded square, an inset square grows, overlapping circles spread, the protractor needle swings, a big icon crossfades to another, bars rescale. Shapes also drift a few pixels and the compass and ruler sway. Under reduced motion the art is static.
- **No JS**: the container stays empty and hides (`.rds-art:empty`). The three index banners keep their pre-rendered SVG as a fallback.
- **API**: `RDSArt.render(el, {kind, seed, topic})`, `RDSArt.reroll(el)`, `RDSArt.motifs`, `RDSArt.palette`.
- **Adding a motif**: add a function `M.name = function (w, h, rnd, ctx)` in `motifs.js` returning `{svg, uses, pale?, shift?}`. Draw in local coordinates; use `var(--token)` for every colour; put `m-drift` or `m-sway` on groups that should move; add its transitions to the Motifs block in `rds.css`. Then add it to a topic's list.
- **Pattern sheet**: `/patterns/` shows every motif, the palette and a seed lab (seed, topic, layout, reroll, pause). Check new motifs there first.
- **Pencil filter**: `sketch.js` skips anything inside `.rds-art`; the filter breaks blended and oversized shapes.
- The old pre-rendered banners (`scripts/tiles_art.py`) remain as the fallback on the three index pages.

## Looping backgrounds (`assets/rds/loops.js`, `loops.css`)

Constantly playing, muted, seamless "video" behind hero sections, drawn in code from our own motifs. It is SVG driven by the Web Animations API, so it is a few KB, sharp at any size, in our tokens, and needs no video files.

```html
<section data-rds-loop="plan" data-seed="studies"> ... hero content ... </section>
```
Load `<script src="…/assets/rds/loops.js" defer>` (it pulls in `loops.css` itself). The host gets `rds-loop-host` (relative, isolated); the layer sits behind its content and fades toward the text side, so type stays readable.
- **Kinds**: `plan` (lot, building, stalls, trees and a flow line build up), `ridge` (ridgelines drawn in ink, redrawn in brick, low sun; the logo grown up), `contour` (survey contours draw around a hill and a basin, slow dashed arc), `tiles` (flat tiles shift colour and shape in a diagonal wave). Now on: home `ridge`, guide `plan`, studies `contour`, notes `tiles`, study heads `ridge` (wrap the `rv-article-head` in a `rds-loop-host`; the study template has it), the home Browse section `tiles` with `data-loop-fit="top"` (art fills only the top 38% so it never sits behind the cards), and every footer.
- **Seamless**: one 28s cycle. It starts empty, builds, holds, fades back to empty, so the loop point is invisible. Keyframes are per element, so delays survive every repeat.
- **Seeded and size-aware**: same `data-seed`, same drawing; the layout is generated for the box it sits in (wide and phone layouts differ) and rebuilt on large resizes.
- **Fallbacks**: `prefers-reduced-motion`, `Save-Data` and 2g connections show the finished drawing as a still (no animation, no pause button). It pauses when offscreen and in hidden tabs.
- **Footer**: `loops.js` adds a `contour` loop to the `.rds-footer` of every page that loads it, in `data-loop-tone="ink"` (lines in `--on-ink-muted`, calmer opacity). Opt out with `data-loop-none`. The load line `<script src="…/assets/rds/loops.js" defer>` sits after `motifs.js` on every page.
- **Pause control**: `rds-loop__toggle` (44px, bottom right of the host) pauses every loop on the page and remembers the choice (`localStorage`, `rv-loops-paused` class on `<html>`). Needed because motion over 5 seconds must be stoppable.
- **Rules**: tokens only; 2 to 4 flat colours; no text except the decorative scale bar; keep the host's own text legible at 375 and 1280px; do not put a loop on pages that already have a moving figure at the same spot. Use `data-loop-still` to force the still.
- **API**: `RDSLoops.mount(host, kind, seed)`, `RDSLoops.pause()`, `RDSLoops.play()`, `RDSLoops.kinds`. The `scripts/check.py` and search index are unaffected.

## Margin sketches (`assets/rds/margins.js`, `margins.css`)

Big original pencil drawings that fill empty page margins. Loaded automatically by `loops.js`, so every page with a `<main>` gets them; opt out with `<main data-margins-none>`. Not mounted inside iframes (lab demos).

- **Kinds**: `plan` (lot, building, stalls, tree canopies, dashed flow line, scale bar, north arrow), `section` (ground hatch, tree, swale, scale figure), `contour`, `compass` (draws a brick arc), `tools` (set square and sliding scale ruler), `protractor` (a measured angle), `tiles` (2 x 3 flat tiles whose colours slowly swap). Seeded by the page slug; kinds and sides alternate down the page.
- **Desktop (1000px and up)**: fragments sit in the side gutters, 420 to 620px wide, bleeding off the window edge, and fade out before the text column (mask), so type is never crossed. Narrow gutters (under 150px) draw fainter.
- **Phones**: one big fragment every ~1.7 screen heights at 20% opacity, behind the text, bleeding off a side.
- **Motion**: lines draw on when a fragment first scrolls in; then it drifts a few pixels, canopies pulse, flow lines run, the ruler slides, the compass swings, tile colours swap. Only while on screen. Reduced motion, Save-Data, 2g and print show the finished still; the Pause background button (`rv-loops-paused`) stops it.
- **Layering**: the layer is `z-index:-1` inside `<main>` (which becomes an isolated stacking context). `.rds-band-sunk` turns 62% opaque inside `main` so the art shows through. Skips areas covered by a hero loop.
- **Band seams**: on wide screens the layer sits above section backgrounds (z-index 6; the gutters hold no text), so one drawing is continuous across a wavy `rds-band-sunk` edge. On narrow screens it stays behind the text and fragments are placed only outside tinted bands (plus 34px for the wave). Fragments overlap the content column by only 24px and fade out before it.
- **Study rail**: pages with a section rail (`[data-toc]`) keep sketches on the right only. The rail itself (`.kt`, `studies.css`) sits on a slim paper strip with a crisp edge and a small pencil shadow (the nav's own `::before`, so it hugs the ticks and grows with the labels on hover), ticks on a scale (10px, 16px at a group start, 26px for the current one), ticks that draw in one by one (`--i` set by `studies.js`), a pulsing accent tick, brick active label and counter against muted inactive items. Reduced motion shows it still.
- **API**: `RDSMargins.relayout()`, `RDSMargins.kinds`. Add a kind as `K.name = function (d, r, c)` using `d.line`, `d.fill`, `d.hatch`, `d.grid`.

## Known issues

- The Topanga study's text and layout styles are now in `study.css` using tokens, so token changes reach them. Its SVG drawings still carry inline `style` attributes and hex colours (they are redrawn separately).
- Infobox field-guide terms link to `guide/<slug>/index.html` when an entry exists; terms without one (e.g. right-of-way) stay plain `rv-term` spans.
- Home and study still contain placeholders: `[Last name]`, `[DATE]`, `[NEXT SITE ...]`.

## Scroll effects

`assets/rds/scrollfx.js` (loaded by `site-shell.js`, styles in the last block of `rds.css`) makes pages progress as you scroll. It adds `<html class="fx-on">` only when `prefers-reduced-motion` is not set, and every rule is scoped to `.fx-on`, so with reduced motion (or no JS) nothing moves and every figure shows in its final state. Turning the setting on while a page is open switches the effects off live.

- **Progress line**: a hand-drawn pencil line along the top edge fills with the page (`.fx-progress`), with a small pencil tip riding its end; notes use the same line for their own reading progress (`data-rv-progress`, `.rv-progress`). Both are styled once in `rds.css`; the scripts only set `--p` (0 to 1) on the wrapper.
- **Figures draw themselves**: pencil paths (`.dw`, `pathLength=1`) in `svg.ts-fig` and `svg.rds-draw` draw in, staggered by order, as the figure crosses the lower part of the screen (scrubbed by scroll, so scrolling back un-draws). Fills and labels fade in over the last half. The generated Topanga drawings tag their lines; older hand-drawn figures are tagged at runtime (stroke-only paths, no dashes, capped).
- **Plans build layer by layer**: staged figures (`.lyr .l1` to `.l6`) draw each layer and grow its trees (`.tg`) when its step arrives; `studies.js` toggles `.is-on`. Layer progress is a registered custom property (`--ld`) so it animates in CSS.
- **Dimension lines extend**: on the blueprint sheets the dimension strings are ordinary `.dw` paths and draw with the sheet.
- **Counters**: put `data-count` on a number such as `68 → 61`, `1,500+` or `11,200 gal`; each figure counts up from zero once, when 60% visible, then restores the exact text.
- **Parallax art**: each motif tile's drawing sits in a `.m-par` group that slides against its field by a seeded amount (up to 10 units) as `.rds-art` crosses the screen (`--py` from -1 to 1).
- **Rise**: headings, quotes and figures below the fold settle in (`.fx-rise`). Anything already on screen, inside a scrolly figure, or using `data-rds-*` reveals is left alone.

Performance: one passive scroll listener, one rAF per frame, and only figures and art near the viewport are updated (IntersectionObserver); only CSS custom properties change per frame.

## Cozy layer (`assets/rds/cozy-moments.css`, `cozy-moments.js`)

Small warm moments, loaded on every page by `site-shell.js` (`cozy-moments.js` loads `cozy-moments.css` itself). Tokens live in `tokens.css` under "cozy layer" (`--lift`, `--press`, `--progress-h`, `--dur-lamp`, `--dur-stamp`, `--glow`, `--dusk-wash`). Keep each moment subtle; none carries meaning through motion alone, and the `prefers-reduced-motion` catch-all (see Accessibility) makes them instant.

- **Pencil progress line**: see Scroll effects.
- **Paper lift and press**: bordered controls without their own motion (`.rv-lookup`, `.rvs-chip`, `.rv-lib-seg`, `.rv-reroll button`, `.rv-stages__btn`, `.rv-src__link`) rise a pixel or two with a pencil shadow on hover and press flat. They use the `translate` property so they never fight a component's own `transform`. Add a new bordered control to that selector list rather than writing a new hover.
- **Pencil underline**: breadcrumb, contents, A-Z jump and footer links get a wavy underline that settles in on hover and focus (prose links already have theirs in `flow.css`).
- **Chip pop**: filter chips and segmented buttons pop when they become `aria-pressed="true"` (not on page arrival; `cozy-moments.js` adds `html.cz-ready` after load).
- **Focus settle**: the dashed focus ring (shape and colour in `skin.css`) now settles in from a little further out. Wrapped in `:where()` so it never overrides a component's own animation.
- **Copy stamp**: `window.RVCozy.tag(button, 'Copied')` drops a paper tag with a pencil-drawn check above the button. It is `aria-hidden`; the page keeps its own live region. Used by the feed address (`log.js`) and source links (`sources.js`). Call it only after the copy succeeded.
- **Empty, 404 and loading**: the empty-state doodle shrugs in when it appears (`.rds-empty.is-on`), the 404 notes drift, and `.cz-dots` (three pencil dabs) marks "still loading"; the search dialog uses it while its index loads.
- **Time of day**: `cozy-moments.js` sets `<html data-tod="dawn|day|dusk|night">` from the visitor's clock (`?tod=night` previews one). At dusk, in the light theme, a faint warm multiply wash (`.cz-wash`) sits over the page; at night, in the light theme, the sun/moon switch nods now and then.
- **The lamp**: when the dark theme arrives because the switch was pressed, a warm glow blooms from the switch and flickers on (`.cz-lamp`), after the circle reveal in `theme.js` ends (the page is only snapshots while `html.rv-theming` is set). Not shown for system or cross-tab changes, and not shown under reduced motion.
- **Selection**: text selection is the brick tint, not the browser blue.

## Interaction layer (`assets/rds/interact.css`, `interact.js`)

One deferred script (`<script src="…/assets/rds/interact.js" defer></script>`, after `sketch.js`; it loads its own stylesheet). Everything is additive and works with a thumb: 44px targets on touch, nothing that only appears on hover, reduced motion respected.

- **Redraw art** `rv-reroll`: every `data-rds-art="banner"` gets a Redraw button (new random seed via `RDSArt.reroll`) and, once changed, an undo button back to the page's `data-seed`. Tiles also shift on hover (desktop) or tap, using `RDSArt.poke(art, tile)`. The art root loses `aria-hidden` (only its drawing keeps it) so the buttons stay reachable.
- **Entry previews** `rv-tip`: links in article, essay and study bodies, infoboxes, hatnotes and See also that point to a guide entry, note or study show a card (kind, title, section if the link has a `#hash`, one-line description) from `assets/search-index.json`. Hover or keyboard focus; hidden on touch. Footnote markers and pager links are skipped.
- **Draggable compare**: `[data-rv-compare]` gets a third segmented option, Slide, and a handle (`rv-slider`, `role="slider"`, arrow keys, Home/End). Moving a mouse over the picture follows the cursor with no click; swiping sideways on touch also starts it; vertical swipes still scroll. Mode is `data-view="slide"` with `--pos` (percent).
- **Explorable plans** `rv-stages`: each `[data-scrolly]` figure gets a one-line stepper built from its `.kstep` labels: one small hand-drawn icon node per stage on a progress line (brick up to the current stage), a styled tooltip with the full stage name on hover, focus or tap, the current stage name beside it on wide frames, and a "Follow scroll" switch inside the frame. Icons come from the site sprite or small inline ones; set `data-icon="tree"` (sprite id) or let the label pick one. Arrow keys, Home and End move between nodes. Choosing a stage sets `data-pin` (studies.js honours it); the switch releases it. The node track scrolls sideways when it does not fit (always one line); the frame never clips the tooltip.
- **Article head** `rv-article-head`: title block, the "What is real / What is estimated" note (`rv-article-head__note`) and the at-a-glance infobox share one grid, so the note fills the space beside the box instead of leaving a gap. Under 1000px it stacks: title, box, note.
- **Zoomable drawings** `rv-zoombtn` + `rv-lightbox`: figure drawings (viewBox at least 360 wide, not infobox or art) get a Zoom button that opens a `<dialog>` with wheel, pinch, drag, double-click and +/- zoom. The copy drops the pencil filter so it stays crisp.

## Type lab (candidate directions, not live)

`fonts/index.html` (generated by `scripts/build_type_lab.py`, noindex) compares six hand-drawn type directions with full hierarchies, lists every font screened with license, glyph gaps and size, and holds the writing effects. `fonts/write.js` is a standalone script: `data-rv-write="stroke|type|sweep"` with `data-speed="fast|slow"` (pen strokes from Hershey single-stroke data in `fonts/hershey.js`, built by `scripts/build_hershey.py`). It never autoplays under `prefers-reduced-motion`. The live fonts in `tokens.css` are unchanged until a direction is chosen; then move that direction's roles into `tokens.css` and `rds.css`.

## Valley map (`map/`, `assets/rds/map.js`, `map-geo.js`, `map.css`, `scripts/places.py`)

A hand-drawn, pannable, zoomable map of the San Fernando Valley with a pin for every study, field guide entry and note that has a place. Any element with `data-rv-map` becomes the map (the `/map/` page and the lab article's iframe both use it). Lab article: `lab/valley-map/`.

- **Adding a page to the map**: put `<meta name="rv-geo" content="lat,lng">` in the head (decimal degrees, inside the Valley area) and `<meta name="rv-precision" content="site|street|area">` for how sure the spot is (site = on the address, street = about a quarter mile, area = about a mile). A page about the whole Valley takes `<meta name="rv-scope" content="valley">` instead and is listed beside the map, not pinned. Topics, place label, title and description come from the existing `rv-topics`, `rv-place`, `<title>` and description. Then run `python3 scripts/regen.py`: `scripts/places.py` (called by `build_index.py`) writes `assets/places.json`. `check.py` warns when a study, guide entry or note has neither tag. Pins on the same subject at one spot are nudged apart by hand (about 100 m) so both show.
- **Geography** is a short list of `[lng, lat]` points in `map-geo.js` (valley floor, rivers, basins, roads, names). It is a schematic drawn by eye, good to about a quarter mile; never present it as survey data. Projection is equirectangular scaled by cos 34.2 deg, 3000 units per degree of latitude, 69 miles per degree for the scale bar. Linework is wobbled in code (seeded) and smoothed with Catmull-Rom curves; hills are ridge marks on a jittered grid that fade as you zoom.
- **Pins**: brick = study, moss = field guide, ink = note; the icon is the page's primary topic (studies use the building). A dashed ring shows the precision. Pins within about 34 px merge into a numbered badge (click zooms to them, hover lists them). Pins, names, route shields and grid labels are drawn in screen space so they keep their size at every zoom.
- **Controls**: drag to pan (with inertia), pinch, double-click, plus/minus buttons, a "show every pin" button, arrow keys and +/-/0 when the map is focused. The wheel zooms only after the map is clicked (or with Ctrl/Cmd), so the map never traps page scrolling. Chips filter by kind and topic, the search box filters by title, place or description, and the Water, Roads, Names and Grid toggles hide layers. The side list shows what is in view (everything on phones), lists valley-wide pages, highlights a pin on hover and flies to it on click. The URL hash (`#studies/fallbrook-edge`) selects a page.
- **Card**: hover or focus a pin for a preview with seeded art, kind, place, description, topics and an Open button; click to keep it open. On phones it docks to the bottom of the map.
- **Motion**: pins drop in staggered, flights ease in log-zoom space (0.7 s to a page, 1.5 s on first load), and the selected ring crawls. Under `prefers-reduced-motion` the camera jumps, there is no inertia and nothing animates.
- **API**: `element.__rvm.select(url)`, `.flyTo(view, ms)`, `.home()`, `.fit()`.

## Dark theme (`tokens.css`, `theme.js`, `theme.css`, `scripts/build_theme.py`; lab `lab/dark-theme/`)

A second palette, "moonlit", that is a token swap: `<html data-theme="dark">` re-points the same variables, so no page needs per-page dark rules. **Use tokens, never hex, in new CSS and markup**; a hex in a style will not follow the theme.

| Role | Paper | Moonlit |
|---|---|---|
| `--paper` / `--paper-raised` / `--paper-sunk` | `#f6f1e7` / `#fbf8f1` / `#ece5d6` | `#17120d` / `#211a13` / `#100c08` (warm, orange-tinted near-blacks) |
| `--ink` / `--ink-muted` / `--ink-faint` | `#1f1d1a` / `#5c564c` / `#655e51` | `#f3e8d4` / `#cdbfa7` / `#ad9f88` (warm cream) |
| `--brick` / `-deep` / `-tint` / `--on-brick` | `#9c3d24` / `#7d2f1a` / `#f0d9cc` / `#fbf8f1` | `#66c3c0` / `#8fdad6` / `#12302f` / `#0b1a1a` (moonlit turquoise) |
| `--moss` / `-deep` / `-tint` / `--on-moss` | `#2f4a3a` / `#213529` / `#dfe6d8` / `#f6f1e7` | `#9cc3a8` / `#bbdcc5` / `#1a2a21` / `#0d1a12` |
| `--slate`, `--rust` | `#35506b`, `#8c1c2e` | `#86aed2`, `#f08a98` |
| `--line` / `--line-strong` | `#d9d0bd` / `#8a8170` | `#3a2e22` / `#857663` |

Extra tokens the swap needs (all defined in both themes):
- `--band`, `--on-band`, `--on-band-muted`, `--band-line`: the footer and `rds-band-ink`. They stay dark in both themes, so never use `--ink` as a band background; ink becomes cream in the dark theme.
- `--brick-fill`, `--moss-fill`, `--slate-fill`, `--ink-field`: solid art fields (motif tiles, infobox titles). Same as the accent in light, muted deep versions in dark so cream linework reads on them.
- `--edge`: hand-drawn frame lines and the pencil offset. Full ink in light, a softer `#a99a82` in dark.
- `--paper-rgb`, `--sunk-rgb`: for translucent washes, `rgba(var(--paper-rgb),.9)`.
- Art accents (`--sky`, `--ochre`, `--rose`, `--kelly`, `--peri`) are dimmed a step in dark.

Contrast: every text pairing is at least 4.5 to 1 and every UI line at least 3 to 1 in both themes (the lab sheet computes them live). When you change a dark token, rerun the check in `lab/dark-theme/demo/`.

**Switch.** One `rv-theme` button (hand-drawn `sun` and `moon` icons from `build_icons.py`), built by `site-shell.js`: left of Search in the header, first row of the phone More sheet, and in the study top bar. Any element with `data-rv-theme-toggle` works. `theme.js` loads in `<head>` right after the viewport meta (before first paint, so no flash), picks the saved choice (`localStorage` key `rv-theme`) or `prefers-color-scheme`, sets `data-theme`, `color-scheme` and `theme-color`, and follows the system until a choice is saved. API: `RVTheme.get()`, `.set(theme, originEl)`, `.toggle(originEl)`. Every page needs `<script src="…/assets/rds/theme.js"></script>` in the head and `<link rel="stylesheet" href="…/assets/rds/theme.css">` last; the page generators already emit both.

**Transition.** The new theme grows from the button as a circle until it covers the page (View Transitions API with an animated `clip-path` on `::view-transition-new(root)`, 0.7 to 1.1 s by distance). No API: a disc of the new paper color grows, then the theme swaps and the disc fades. Reduced motion: instant.

**Baked colors.** CSS `data:` URI art (rules, band edges, highlighter) cannot read variables, so `python3 scripts/build_theme.py` redraws each in dark colors between the BEGIN/END markers in `theme.css`; rerun it after changing any such URI. Older inline SVG with hex `fill`/`stroke` attributes is re-mapped by attribute selectors at the end of `theme.css`. Standalone demo pages load `theme.js` and read the same saved choice; changes sync across tabs and frames through the `storage` event.

## Lab articles (`lab/`, `assets/rds/lab.css`, `lab.js`)

Standing rule: every lab, demo or exploration page (pattern sheet, icon set, type lab, motif sheet, and any future one) is published as a styled article under `lab/<slug>/index.html`, listed on `lab/index.html` (Lab notes, linked from the More sheet and the footer). The demo page itself stays at its own URL and is linked from the article. Build the article from the Notes layout (`rv-ehead`, `rv-body`, `rds-toc`, `rv-sources`) and these parts, in this order: an **intro** (lead plus `rds-facts` key numbers), **process and research** (what I studied, with cited sources), **decisions** (`rds-decisions`: each choice, why, and its cost), the **live demo** embedded, then **What I could not verify** and **Sources**. Copy `lab/icon-set/index.html` to start one and add a row to `lab/index.html` and a "Keep reading" row on its siblings.

- **Facts** `rds-facts`: a `<dl>` of big numbers over mono labels. **Decisions** `rds-decisions` > `rds-decision` (h3, why, `rds-decision__cost`), auto-numbered. **Swatches** `rds-swatches`. **Demo** `rds-demo`: bar with a "Live demo" tag and a link to the full page, body, caption.
- **Inline demo**: put the controls in `rds-demo__body` (the pattern sheet article does this with `data-lab`).
- **Framed demo**: `<iframe class="rds-demo__frame" src="../../x/index.html?embed=1" style="--demo-h:760px;--demo-h-m:640px">`. `?embed=1` makes `site-shell.js` hide the header, footer, breadcrumbs, tab bar and the page's own h1 and eyebrow (add `data-rv-embed-skip` to anything else to hide), and post its height. Add `data-fit="auto"` to the iframe to grow to that height; omit it for a long page (the type lab) so the frame scrolls on its own. Pages that are only demos should be `noindex` (see `lab/motif-sheet/demo/`).
- Lab articles are indexed under the section "Lab notes".

## Search (`assets/rds/search.js`, `search.css`)
The search dialog is its own module, loaded on idle by `site-shell.js` (which keeps `window.RVSearch.open/search`). Classes are `rvs-*` on `.rds-search.rvs`.
- **Open/close:** the box grows out of the button that opened it, a two-pass pencil frame draws itself (stroke-dashoffset on `pathLength=1` paths), bar, chips and footer rise in turn; close plays a 190 ms exit before `dialog.close()`. Phones get a full-screen sheet.
- **Matching:** instant on every keystroke, no debounce. Substring scoring over title, headings, description and full text; typo tolerance (Levenshtein, 1 edit, 2 for words of 8+ letters) only when fewer than three pages match exactly. Matches are highlighted with a marker stroke that sweeps in. "Did you mean" comes from the site's own vocabulary.
- **Rows:** icon per type and topic (from the icon sprite), titles write on, the selected row gets a hand-drawn box and a return arrow. Mouse move, arrows, PageUp/Down, Ctrl+N/P and Ctrl/Cmd+Home/End select; Enter opens, Cmd/Ctrl+Enter opens a new tab, Alt+Left/Right changes the filter, Esc clears then closes. Opening plays a pencil wipe (skipped for same-page links).
- **Preview (wide screens):** seeded `RDSArt` card keyed to the page slug, description, headings (matching ones marked) and an Open button.
- **States:** browse (hero doodle, try-chips, recents from `localStorage` key `rv-search-recent`, pages grouped by section), no results (drawn magnifier, suggestions), none under a filter.
- **Motion:** everything stands still under `prefers-reduced-motion`; the frame, underline and doodles show in their finished state.

## Flow: page-to-page motion (`assets/rds/flow.js`, `flow.css`, lab `lab/motion-lab/`)

One synchronous `<script src="…/assets/rds/flow.js"></script>` in the `<head>` of every page (right after the viewport meta; it loads `flow.css` itself). It paints paper over the first frame, then plays:

- **Opening** (first visit of a session, every reload): a sheet of paper tiles; the logo draws, "Redrawn Valley" writes in, the tiles shrink away from the center. 1.5 s in all (0.9 s drawing, 0.6 s lift). The sheet never takes pointer input, so the page underneath works at once; a tap anywhere skips ahead.
- **Link transitions** (clicking any same-site link): the page you leave covers itself with paper (`make` + `cover`), stores the context in `sessionStorage` (`rv-flow-nav`: kind, direction, click point, seed, destination name) and navigates; the next page rebuilds the same layers fully covering (`make` + `hold`), drops its flat paper cover, and lifts (`lift`). Back/forward skip it. The sheet is a manual popover (top layer), so the search dialog is covered too. Six kinds, each in `K` in `flow.js` with its styles in `flow.css`:

  | Kind | Plays for | Cover | Lift |
  |---|---|---|---|
  | `turn` | `rel="prev"`/`rel="next"` (Continue pager, guide A–Z pager); `data-flow="turn:-1"` forces direction | a lined page with margin rule slides in from the side of the arrow | keeps going out the other side |
  | `shuffle` | list rows, index pages (one path segment deep) | 4 taped cards drop in with a seeded tilt and offset, 70 ms apart | thrown off in turn, seeded left, right or up |
  | `sketch` | `.rds-card`, `.rv-way`, panels, any large link block outside a list | the pressed card is cloned and its paper grows to the page | an even-odd polygon hole opens from the new page's title |
  | `bloom` | header, footer, tab bar, breadcrumbs | tinted rim, then paper, as circles growing from the click (or the link's centre for keyboard use) | shrinks back to the same point |
  | `tiles` | jumps to another section | the original grid of tiles from the click point | tiles shrink from the same point |
  | `fade` | small hops inside a section, arrivals with no stored context (search results) | paper opacity 0 to 1 | 1 to 0 |

  **Choosing:** `choose()` in `flow.js` reads the link (markup, closest container, section of the current and the destination path) and gets a pool. A generator seeded from the destination path and a session click counter picks from the pool and leaves out the kind that played last (`rv-flow-last`), so repeats differ and the same kind never plays twice in a row. A link can force one with `data-flow="kind[:dir]"` and opt out with `data-no-flow`. The destination name is written on the paper in every kind but `fade`.
  **Speed:** lengths are tokens (`--flow-cover` 440 ms, `--flow-lift` 580 ms, `--flow-fade-in/out`, `--flow-cards`, `--flow-tilt`, `--flow-edge`, `--flow-margin`, `--flow-bleed`); the page starts loading the moment the cover finishes, and links are prefetched on hover, focus and touch (skipped for Save-Data and 2g).
  **Anchor jumps:** same-page `#links` glide on the ease-in-out curve (about 0.4 to 1 s by distance), any wheel, touch or key input takes the scroll back, the hash and focus update, and the heading gets an ink sweep (`.fl-landed`). Skipped in contents rails, the tab bar, sheets and dialogs.
  **Adding a kind:** add `K.name = { make(s,c), hold(s,c), cover(s,c,ms), lift(s,c,ms), plate? }` (each animation returns a promise; put the plate host in `s._host`), its layer styles in `flow.css` (tokens only), a row in the table above and a button in the motion lab demo.
- **Write-on headings**: `h1`, `.rds-display` and section `h2`s are split into letters that ink in on the Wobble axes (`BNCE`, `INFM`) with a pencil squiggle drawn under (`.fl-ul`). Replaces `data-rds-split` on page titles. Section headings play when 60% visible.
- **Micro-interactions**: pencil dab on click (`.fl-dab`), wavy link underline, spring buttons, tilting cards and rows, logo hop, rules that draw on and figure crop marks (`.fl-sk`).
- **Off** under `prefers-reduced-motion`, in `?embed=1` frames, print, and with `?noflow`. A 3 s failsafe always removes the sheet.
- **API**: `RVFlow.intro()`, `RVFlow.preview(kind, a, b, x, y, dir)`, `RVFlow.wipe(url, kind?)`, `RVFlow.kinds`, `RVFlow.write(el)`, `RVFlow.speed`. Tile colors are the art accents; tile art is the grid circle and hatched square from the motif system.

## Nav wash and hero buttons

- **Nav**: `rds-nav` is a hand-washed paper band: brick and moss tints over paper with a deckled hairline lower edge (`::before` and `::after` in `skin.css` Part 4). The page-wide "no shadows" rule has one more exception here: a soft `drop-shadow` under the deckled edge once the page scrolls. The active section keeps the brick hand rule and goes bold. Search is the header's main action: ink fill with the pencil offset.
- **Hero buttons**: primary `rv-cta` draws its outline, fills brick, then its arrow draws, flies off and a new one settles in (hover repeats it). Secondary `rv-textlink` is ink text with a drawn rule and arrow. Brick appears once, on the primary. All of it is CSS only and skipped under reduced motion.


## Cozy paper (`assets/rds/cozy.css`, tokens section 4 of `tokens.css`)
The top bar is the model for how the site should feel: a hand-washed paper band, a torn lower edge drawn with a hairline, a warm soft shadow. `cozy.css` (loaded after `skin.css` and `theme.css`) carries that into every panel instead of the hard ink offset.
- **Wash:** `--paper-wash` (two tints, `--wash-a` warm, `--wash-b` cool; turquoise and moss in the moonlit theme) goes on top of a panel's paper colour. Applied to In short, infoboxes, callouts, contents, cards, features and the home rail cards.
- **Shadow:** `--shadow-paper` and `--shadow-paper-lift` are a hairline, a tight contact shadow and a long soft one, all in `--warm-shadow` (ink thinned so it reads brown). `--edge-soft` is the frame line one step lighter than `--edge`. The hard `--shadow-pencil` stays on buttons and anything you press.
- **Torn edge:** `--deckle` (shape, a mask) and `--deckle-line` (the same curve as a hairline), sized by `--deckle-w`/`--deckle-h`. The colour comes from `background`, so one shape serves a panel, a band and both themes; flip it for a bottom edge. Used on the Continue sheet and the footer.
- **Tape:** `--tape` strip on the In short box, matching the infobox and callout strips in `skin.css`.
- **Lamp glow:** `--glow-lamp` is empty in light and a soft turquoise halo around panels in dark; the footer has a warm lamp over the brand in both.
- Reduced motion drops the lift transitions; print drops the torn edges and glows. Chips and filter inputs are paper too (inset shadow on the input, a small lift on chips).

## Sources library

`/sources/` lists every source cited anywhere on the site. It is generated, never hand-kept: `python3 scripts/build_sources.py` reads every page and writes `assets/sources.json` (`scripts/regen.py` rebuilds it after every merge to `integration`; `scripts/check.py` warns when it is stale). Use `--report` to see counts and sources that are listed but never cited.

- **What counts as a citation.** A link to an in-page `#id` inside `<sup>` or a `.rds-fn`, `.rv-fn`, `.rv-cite` wrapper, where the `#id` is an `<li>` in a notes list (`.rds-notes`, `.rv-sources`, or `#sources`). Pull quotes with a plain-text `[n]` inside `blockquote > cite` count as quoted uses. New article formats work without changes as long as they follow this pattern, so keep using the footnote components.
- **Merging.** Sources merge by canonical URL (scheme, `www`, `utm_*`, fragment and trailing slash ignored). A source with no URL merges on its citation text. A `rds-kind` label or an `rv-src-note` beside a source is carried into the library (type and caveat).
- **Types** are rule-based (`DOMAIN_RULES` in the script, or the `rds-kind` label if present). **Topics** are the topic hubs' own: a source gets every topic of the pages that cite it, read from each page's `<meta name="rv-topics">` and `assets/topics.json`. `scripts/regen.py` runs `build_sources.py`, so the data file refreshes after every merge to `integration`.
- **Jump links.** Each use has `page/#cite=<listItemId>.<n>&src=<sourceId>`: the nth marker on that page for that list item. `assets/rds/cite-jump.js` (loaded by `site-shell.js` when a `#cite=` hash is present) scrolls there, pulses the marker, highlights the sentence with the CSS Custom Highlight API (whole-paragraph tint as the fallback) and shows `rv-cite-bar` with previous/next use, the entry and a way back. The marker rules in JS and Python must stay identical; change them together.
- **Components.** `rv-lib-*` (stats, type bar, sticky search, filter rows), `rv-src` (source card; `--c` is its type color), `rv-use` (a page and its uses). Styles in `assets/rds/sources.css`, behavior in `assets/rds/sources.js`. Search matches title, publisher, type, topic, caveat, citing page and the sentence each use backs; state is kept in the URL (`?q=&type=&topic=&in=&caveat=1&sort=`); `/` focuses the search on this page.
- Motion: cards rise in, the use list opens with a grid-row transition, counters count up. All of it stops under `prefers-reduced-motion`.
## Sketchbook log (`log/`, `scripts/build_log.py`, `assets/rds/log.css`, `log.js`)

A dated feed of everything new, built from git history, never edited by hand. `log/index.html` is a normal page with three generated regions (`<!--log:stats-->`, `<!--log:chips-->`, `<!--log:timeline-->`); `python3 scripts/build_log.py` rewrites them plus `log/feed.xml` (Atom, newest 40) and `assets/log.json` (entries, and a first-added and last-updated date for every page; other features can read it). `.github/workflows/log.yml` reruns it after each push to integration.
- **Entry**: one commit (squash-merged PR). Type is study / note / guide / lab (a new page in that section), else redraw, design or site by subject and files. Pages show as New (added) or Updated (changed), titles read from the pages.
- **Words**: PR-description trailers `Log: sentence`, `Log-Title:`, `Log-Type:`, `Log: skip` win; then `scripts/log-notes.json` (keyed by PR number); then the commit subject. Commits touching only generated files are never entries.
- **Components**: `rv-log` timeline (sticky date column on desktop, sticky date bar on phones, dashed rail, icon dot per type, `rv-log__card` per entry, `rv-log__page` pills), type filter chips (`data-rv-topic`, kept in `?type=`), `rds-facts` stats. Under reduced motion it stands still.


## A-Z index (`a-z/`, `scripts/build_atlas.py`, `assets/rds/atlas.css`, `atlas.js`)

One alphabetical list of every term, place, source and drawing, each with links to every page (and section) that uses it. The list is **generated**, never hand-edited: `python3 scripts/build_index.py` (or `build_atlas.py` alone) rewrites the region between the `atlas:start` / `atlas:end` comments in `a-z/index.html`, and `scripts/check.py` warns when it is stale. A new article needs no edit: its title, figure captions, source list and any mention of an existing term or place are picked up on the next run. To add a term or place, add it to `scripts/data/atlas.json` (aliases, "see" cross-references, place notes) or mark it up with `data-term="..."` / `data-place="..."`.

- **Components**: `rv-az__tools` (filter input `rds-guide-search`, kind chips `rds-chip`), sticky `rv-az__jump` letter strip with scroll spy, `rv-az__group` per letter, `rv-az__entry` rows (headword, kind tag, gloss, uses list; two columns from 1000px). The list is `data-rv-noindex` so search does not index every entry twice.
- **Behavior**: kind chips and live filter share `?q=` and `?k=` in the URL; letters with no matches are hidden; "See" rows jump to their target; back-to-top button; smooth scrolling only when motion is allowed. Everything is readable without JS.
- **Sources** merge across pages by URL; the numbered circles link to each in-text use. Drawings come from `assets/drawings.json` (the drawings gallery, `scripts/build_drawings.py`) and link to `/drawings/#id`; until that file exists, the A-Z falls back to every `<figure>` caption plus infobox sketch captions.
- Limits: mentions are word matches, so unnamed ideas are missed and a name in another sense can be listed.

## Keep reading rail and Random page (`assets/rds/rail.js`, `rail.css`)

Every page ends with a "Keep reading" rail: a horizontally scrolling row of cards (seeded `card` art, type, read time, title, three-line blurb, matched topics). Loaded by `site-shell.js`; opt out with `<body data-no-rail>`. It is skipped in embed mode.

- **Ranking**: pages share topics via the search-index field `k` (from `<meta name="rv-topics" content="heat, trees">`, first = primary). Primary and secondary matches score, pages from other sections get a small bonus, a per-page seeded jitter varies rails between pages, and no more than 4 of one section appear. Pages without `k` get topics derived from their title and blurb. Section front pages are never cards.
- **Scrolling**: touch keeps native momentum with `scroll-snap-type:x mandatory`. On fine pointers there is no CSS snap (it fights a gesture); trackpads scroll natively with their own momentum, and once a gesture has been quiet for 150 ms a critically damped spring settles the rail on the nearest card. Mouse drag follows the pointer 1:1, releases with the speed you let go at and lands softly on a card. Arrows, keys, a notched Shift+wheel and clicks on the progress bar move by an eased page or card (repeat presses accumulate). The progress bar's thumb is draggable and keyboard operable (`role=slider`). Landing on a new card plays a small tick (card lifts, thumb flashes; a 6 ms buzz on phones that support it). Edge fades, passive listeners, reduced motion jumps without animation.
- **Random page**: the Random page button, or any element with `data-rv-random`, goes to a random article, avoiding pages seen this session. `RVRelated.random()` does the same from script.
- **Site-wide scroll tuning** (top of `rail.css`): `scroll-padding-top` for anchors under the sticky bar, `touch-action:manipulation` on controls, paint containment on art. `scrollfx.js` no longer watches rail art for parallax and debounces its DOM observer.

## Topics (`assets/topics.json`, `scripts/build_topics.py`, `assets/rds/topics.css`)

Topics are the subject threads that run across studies, field guide entries, notes and lab articles. They are the shared page metadata that the topic hubs, related rails, the map and the index read, so define them here and nowhere else.

- **Tagging a page.** In `<head>`, after the description: `<meta name="rv-topics" content="heat, trees">`. Lowercase slugs from `assets/topics.json`, comma separated, **first is the primary topic** (use two to four tags). Optional: `<meta name="rv-place" content="Woodland Hills">` (a neighborhood or place name) and `<meta name="rv-geo" content="34.17,-118.60">` (lat,lon, only with a source). Studies, guide entries and notes should always carry `rv-topics`; `scripts/check.py` warns when one does not.
- **Slugs.** `heat`, `trees`, `water`, `parking`, `streets`, `valley`, `making` (lab articles). A new topic is one object in `assets/topics.json` (slug, title, short, icon from the sprite, accent `moss|slate|brick|ochre|rose`, `art` = the words passed to `data-topic` so motifs pick the right palette, blurb, question). Add one only when at least three pages would use it.
- **Index fields.** `scripts/build_index.py` copies the tags into `assets/search-index.json` as `k` (topic slugs, primary first), `pl` (place) and `g` ([lat, lon]) on each page entry. Read those, not the HTML.
- **Hubs.** `topics/index.html` and `topics/<slug>/index.html` are generated. After tagging or adding a page run `python3 scripts/regen.py` (all generators in order: log, index, topics, index; CI runs it after each merge to `integration`, so forgetting is harmless) and commit the outputs (`check.py` warns when they are stale). Never hand-edit a hub.
- **Hub anatomy.** Tiles banner seeded `topics/<slug>`, the lead and the question line (`rv-thead`), count pills that jump to each list (`rv-tstat`), then one section per kind: studies as `rds-card` cards (`rv-tcard`), everything else as `rds-row` rows (`rv-trow`) listing the page's other topics, then the other-topic chips (`rv-tchip`). The index page adds a coverage table (`rv-tmatrix`) so gaps are visible.


## Study page header

Study pages use the shared site header (`rds-nav`, from `site-shell.js`, held at 72px because study pages do not load `rds.js`) and, directly under it, a sticky part bar `rv-study-bar` with `id="top"`: the study name at left, then Site / Evidence / Design / Delivery / Sources, driven by `data-toc`. The old stand-alone study header, its "All studies" link and its Search link are gone (the header and breadcrumbs cover them). On phones the bar is one scrolling row that tracks the header as it hides (`--rv-sub`). The scroll-driven figure pins under both bars.

**Part bar behaviour** (`studies.js`, `studies.css`): no bottom rule; the bar is paper with a 34px `::after` gradient that fades it into the page. It gains `is-compact` after 80px of scroll (less padding), `has-title` once the page title has scrolled away (the study name fades in), and one `rv-study-bar__ink` underline slides between the part links as the current part changes (on phones the row scrolls the current part into view). Colours are tokens (`--paper`, `--brick`), so it follows the dark theme; reduced motion drops the transitions.
## Loading (speed rules)

How pages are kept fast. Measure with Lighthouse (mobile and desktop, five runs, take the median) on `/`, a study, a guide entry, `/lab/` and `/log/` before and after any change that adds weight. Serve with compression while measuring: a bare `http.server` hides the real transfer size, and single runs swing a lot because the page-to-page intro (`flow.js`) times itself.

- **Off-screen sections are skipped on phones, on study pages.** `class="rds-cv"` on `<main>` (studies only) turns on `.rds-cv section ~ section { content-visibility: auto; contain-intrinsic-size: auto var(--cv-block) }` below 800px (`rds.css`, token in `tokens.css`), so the browser does not style, lay out or paint a section until it is near the viewport; the first section always renders. Measured on a throttled phone it cut study blocking time from about 410 ms to about 170 ms. On desktop and on the home page it added layout shift or a later LCP, so it is not used there; do not widen it without measuring. Content that spills outside its section box is clipped (keep art inside its section), and code must not trust `offsetTop` of a skipped section (use `scrollIntoView` or an `IntersectionObserver`).
- **Reserve space for anything the shell fills in.** The breadcrumb bar (`[data-rv-crumbs]`) is empty in the HTML and filled by `site-shell.js` once the index loads; on a slow connection that pushed the whole page down 20px after it had painted (study desktop CLS 0.364, notes 0.215). `.rds-crumbs:empty` now reserves one line (`--crumb-h`, plus padding; 44px tap line on phones), so the fill-in changes nothing. Do the same for any new shell-filled slot: give the empty element its final height with tokens. To find shifts, record `layout-shift` entries in Chromium with CPU 4x and 1.6 Mbps throttling and read each entry's sources.
- **Art files.** The big hand-drawn SVGs (home, studies index, studies; anything over 20 KB except the home hero comparison, which is the LCP) are not in the HTML. `python3 scripts/extract_art.py` (run it after any art generator such as `topanga_art.py`, `fallbrook_art.py` or `home_panels.py`; `--check` is a CI-style guard) leaves the `<svg>` tag with all its attributes and its `viewBox` in place, empties it and adds `data-art="…/assets/art/art-<hash>.svg"`. The shapes live in that file (a full svg named by the hash of its content, served immutable, shared between pages when identical). `assets/rds/art.js` (deferred) fetches a file when its figure is within 1.5 screens of the viewport, puts the shapes back with `innerHTML`, and fires a bubbling `rv:art` event on the svg. Figures inside closed tabs or hidden panels have their file fetched at idle so opening the tab is instant. Anything that prepares figures must handle late shapes: `rds.js` (stroke lengths for draw-on) and `scrollfx.js` (scroll drawing) listen for `rv:art`; the pencil filter, zoom button and lightbox work on the svg element and need nothing. Verified pixel-identical: full-page reduced-motion screenshots of home, studies index and the three studies at 1280 and 375 px differ by 0 pixels from the inline version. To change a drawing, change its generator or edit the art file's source in the generator, then run `extract_art.py`; do not hand-edit art files (the hash name would no longer match, and `--check` fails).
- **Scripts.** Only `theme.js` and `flow.js` block in `<head>` (no flash of the wrong theme, no flash of an unpainted page). Everything else runs at the end of `<body>`, deferred, or loads on demand.
- **Data.** `assets/search-index.json` (about 200 KB raw) is fetched asynchronously by the shell after first paint (nav flyouts, breadcrumbs, footer study list), never in `<head>` and never blocking. Anything new that needs it should reuse `loadIndex()` in `site-shell.js`.
- **Tried and dropped:** loading `search.js` on first hover/touch instead of on idle pushed home mobile LCP out by about 1 s in Lighthouse (median of five), so it stays on idle. Self-hosted fonts are covered by the three-voice type work (self-hosted, preloaded), not here.

## Caching and fingerprinted assets (`vercel.json`, `scripts/assetver.py`)
Shared CSS and JS are cached for a year, so every reference carries a content fingerprint.
- Every `<link href>` and `<script src>` that points into `assets/` or `fonts/` ends in `?v=<10 hex chars>`. `python3 scripts/assetver.py` writes them; `regen.py` runs it last, so CI re-stamps after each merge, and `check.py` warns when a stamp is stale. Never type a `?v=` by hand.
- The hash covers the file plus every asset it names (a loader such as `loops.js` pulls in `loops.css`; `site-shell.js` pulls in search, rail and the rest), so editing a child changes the parent's fingerprint.
- A script that loads another file builds its URL from its own `src` and keeps the query string (`script.src.replace(/loops\.js/, 'loops.css')`, or `+ Q` in `site-shell.js` and `rail.js`). Do not strip the query, and do not load a shared asset by a bare path: it would be cached as immutable and could go stale.
- `vercel.json` headers: `assets|fonts` CSS and JS are `public, max-age=31536000, immutable`; the icon sprites are one day with stale-while-revalidate; generated JSON in `assets/` is five minutes plus stale-while-revalidate (it is fetched by bare path, so it cannot be immutable); HTML keeps Vercel's default `max-age=0, must-revalidate`.
- New generator that writes HTML? Write plain `assets/...` paths and compare with `assetver.strip()` in `--check`, as `build_topics.py` does. `regen.py` adds the stamps.
- `ignoreCommand` in `vercel.json`: Vercel builds only `main` and `integration`, so PR branches do not use up the daily deploy limit. Verify branches locally.

## Tokens (`assets/rds/tokens.css`): the one token file
Every design value lives in `assets/rds/tokens.css` and nowhere else. A new system or feature (a page, a lab, a component, a script that injects CSS) must read these tokens; if one is missing, add it to `tokens.css` and list it here, do not write the literal in the component.

**Layers**
1. **Palette, `--pal-*`.** Raw, theme-invariant colours (`--pal-brick`, `--pal-paper`, ...). Components do not read these, except where a colour must not follow the theme (a fixed-colour illustration, print, the dark footer band). Those uses are rare and should say why.
2. **Semantic roles, the plain names:** surfaces `--paper`, `--paper-raised`, `--paper-sunk`; text `--ink`, `--ink-muted`, `--ink-faint`, `--on-ink`; rules `--line`, `--line-strong`, `--edge`; accents `--brick*` (actions, current), `--moss*` (links, proposed), `--slate`; solid art fields `--brick-fill`, `--moss-fill`, `--slate-fill`, `--ink-field`; bands that stay dark `--band`, `--on-band`, `--on-band-muted`, `--band-line`; `--veil`. These are what the dark theme swaps (`:root[data-theme="dark"]` at the bottom of the file). Use them for everything.
3. **Scales:**
   - Space `--space-1..32` (4 to 128px), radius `--radius-sm/md/lg/pill`, hand-drawn corners `--rv-r-sm/md/lg`, line weight `--rv-stroke`, pencil shadows `--rv-pencil`, `--rv-pencil-lift` (aliases `--shadow-pencil*`).
   - Type: families `--font-serif/sans/mono/hand`; size ramp `--fs-11` to `--fs-30` (the sizes the site uses; legacy `--rds-serif/sans/mono` and `--rv-hand` still resolve).
   - Motion: durations `--dur-fast` 160ms, `--dur-quick` 200, `--dur-base` 320, `--dur-medium` 450, `--dur-slow` 720, `--dur-slower` 900, `--dur-draw` 1600, ambient loops `--dur-loop-1..4`, `--stagger`; easings `--ease-out`, `--ease-in-out`, the keyword set `--ease-std/soft-out/soft-in/soft-in-out/linear`, and the named curves `--ease-settle/glide/glide-2/spring/reveal/reveal-2`.
   - Stacking `--z-*`, low to high: under, base, raised, raised-2..4, lifted, layer, grain, subbar, rail, study-bar, nav, jump, chrome, chrome-2, popover, tip, then the three `--z-flow-*` layers used by page transitions. Pick the nearest existing step; add one in order if the new layer truly sits between.
   - Layout `--container`, `--measure`, `--rv-gutter` (18px under 375px), `--rv-bar`, `--rv-tab`, `--rv-safe`.
- **Alpha colours:** `color-mix(in srgb, var(--ink) 40%, transparent)`, never `rgba()`. It follows the theme.
- **Data-URI art** (`--rv-rule*`, `--rv-grain`, the torn edges) cannot read variables. It stays in `skin.css`/`rds.css` and `scripts/build_theme.py` writes the dark copies; see Dark theme.
- **Breakpoints** are media queries and cannot be variables: 375, 480, 640, 800, 1000, 1120px. Reuse those.
- **Enforced by `scripts/check_tokens.py`** (run from `check.py`): a hardcoded colour, font stack, z-index, time or cubic-bezier in `assets/**/*.css|js` outside `tokens.css` fails the check if it raises a file above `scripts/token-baseline.json` (a ratchet: the leftovers from before the token pass are counted there and may only go down; a file not in the baseline must be clean). Add `token-ok` in a comment on the line to exempt one, with the reason. After removing leftovers run `python3 scripts/check_tokens.py --update-baseline`.
- **Leftovers on the baseline:** `flow.css`/`flow.js` easing curves and accent lists, `loops.js` easings, `theme.js` meta colours, and about 100 delays and odd-length durations in transitions (only the first time value in a `transition`/`animation` shorthand was snapped to the duration scale; delays are still literal). Take them down when you next touch those files.
- **Pass notes:** durations were snapped to the nearest scale step (largest change 100ms, mostly under 20ms); literal colours became `--pal-*` (so light and dark render exactly as before); `rgba()` of palette colours became `color-mix()`.

## Accessibility (`skin.css` > "Accessibility layer", `site-shell.js`)

- **Tokens:** `--tap-min` (44px touch target), `--tap-min-fine` (24px floor for pointer devices), `--focus-w`/`--focus-gap` (focus ring), `--dur-instant` (reduced-motion duration). Add to `tokens.css`, never hardcode.
- **No truncation:** never use `text-overflow: ellipsis`, `-webkit-line-clamp` or `white-space: nowrap` to fit text. Wrap it (`overflow-wrap: anywhere` on long cites and URLs) or change the layout. Heights that hold text are `min-height`, not `height`. Breadcrumbs, the contents pill, search results, rail blurbs, lightbox captions and the log all wrap now.
- **Focus:** one dashed brick ring (`:where(a,button,input,summary,[tabindex]):focus-visible`); on the dark footer and ink bands it switches to `--pal-on-band-accent`. The skip link is the first tab stop and moves focus into `<main>` (tabindex -1 added on click).
- **Motion:** a catch-all `prefers-reduced-motion: reduce` rule makes every animation, transition and view transition effectively instant. New motion needs no extra opt-out, but must not carry meaning only through movement.
- **Touch:** coarse pointers get 44px controls; fine pointers keep the compact look with a 24px floor.
- **Also:** `forced-colors` rings and borders, `prefers-contrast: more` firms hairlines and faint text. Rules of thumb checked with axe-core at 375px in both themes: one `<main>`, one banner, a heading order with no skipped levels, icon buttons carry `aria-label`, `role="tooltip"` is `aria-hidden` until it has text.
- **Known leftover:** the study part bar (`nav.ktabs`) is a sideways-scrolling tab strip on narrow phones. It never widens the page, but it is the one intentional scroller left.


## Menus and Continue

One menu definition in `assets/site-shell.js` (`EXPLORE`, `ABOUT`, `WORKSHOP`, `NAV`) drives every surface, so a page is added once.

- **Header:** Studies, Field guide, Notes (flyouts listing their pages from the search index), **Explore** (a button-triggered flyout: Topics, A\u2013Z index, Sources, Sketchbook log; rows are `rv-nav__list--rich`, icon plus a hand-lettered note) and About (`about/`). The torn paper-edge underline follows the current item, Explore included. Map and Gallery join `EXPLORE` when their branches merge: one line each.
- **Phone:** the tab bar is unchanged. The More sheet is grouped (`rv-moreGroup`): Explore, About, Workshop, then Site (Theme, Home, Sitemap).
- **Footer (dark, kept):** four columns: brand, author and search; Studies; Read and browse; About (About, Method, Contact, Lab notes, Sitemap, Atom feed). Pattern sheet and Icon set are reached through Lab notes.
- **Pages:** `about/` (about, method, contact; home keeps teasers) and `sitemap/` (generated by `scripts/build_sitemap.py`, run by `regen.py`; `sitemap.xml` is for search engines only).
- **Filter chips:** one component, `rds-chip` (older name `rv-chip`), defined once in `skin.css`; every filter bar uses `aria-pressed` buttons in a labelled group.
- **Continue block** (`assets/rds/continue.js` + `continue.css`, tokens only): on studies, field guide entries, notes and lab articles, above the Keep reading rail. Topic chips (from `rv-topics`), related pages from the other sections ranked by shared topics, and previous/next within studies, notes and lab. Order follows the section index page (studies by number, notes oldest first). Opt out with `<body data-no-continue>`.

## Drawings gallery (`drawings/`, `scripts/build_drawings.py`, `assets/drawings.json`, `assets/rds/drawings.css`, `drawings.js`)

One sheet of every figure from the studies, notes and field guide. Nothing is listed by hand and no artwork is copied.

- **What counts as a drawing**: an inline `<svg>` inside `<main>` with `role="img"`, an `aria-label`, a `viewBox` at least 360 wide and no `aria-hidden` (the same test as the zoom button in `interact.js`). Decorative art (banners, infobox sketches, icons) is `aria-hidden` and never listed. To keep a figure out, add `data-fig-skip`.
- **Manifest**: `scripts/build_drawings.py` writes metadata only (page, order on the page, label, caption, note, figure number, nearest section anchor and heading, type, topics, staged-plan step labels). It is step one of `scripts/regen.py`, so CI refreshes it after each merge; `check.py` warns when it is stale. Other generators may read `assets/drawings.json`.
- **Guesses and overrides**: type (`plan`, `section`, `perspective`, `chart`, `diagram`) is guessed from the label, then caption, then note. Topics use the slugs in `assets/topics.json`, limited to the page's `rv-topics`. Override on the `<svg>` or its `<figure>`: `data-fig-type="plan"`, `data-fig-topics="heat trees"`.
- **Rendering**: `drawings.js` fetches the source page, lifts the figure by order (checked against its label) and mounts it in a shadow root together with that page's stylesheets, so per-study class names do not clash. Staged plans (one svg in a `[data-scrolly]` with two or more `[data-step]`s) start on their last stage and get a stage stepper in the lightbox.
- **Components**: `dg-toolbar` (search, count, size toggle; sticky), `dg-filters` (Source, Type, Topic `dg-chip` rows with live counts; a collapsible panel under 640px), `dg-grid` of `dg-card` (frame and offset hover shadow from the sketchbook layer, hatched `is-loading` state), and `dg-lbx` (previous/next, stages, "View on page") placed in the shared `.rv-lightbox` through `RDSInteract.zoom(null, opts)`.
- **URL state**: `?source=&type=&topic=&q=&size=l` and `#<drawing id>`. Keys `[` and `]` step through drawings in the lightbox.
- **Embedding**: `drawings/index.html?embed=1&limit=6` is the live demo in `lab/drawings-gallery/`.
- Limits: type and topic are guesses; a figure whose stages are not marked with `data-scrolly` shows only its last state.
