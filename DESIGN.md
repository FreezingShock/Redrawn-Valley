# Redrawn Design System

The design system behind Redrawn Valley. Warm paper, ink, brick and moss; a serif for ideas, a sans for interface, mono for evidence. Plain CSS and a small plain script, no build step, no dependencies. **Read this before changing any page.** If a component exists here, use it; if you need a new one, add it to the system (`assets/rds/rds.css`) and document it here, not as a one-off.

Files: `assets/rds/tokens.css` (variables), `assets/rds/rds.css` (components, prefix `rds-`), `assets/rds/rds.js` (motion), `assets/site.css` (site-only rules, prefix `rv-`), `assets/site.js` (home before/after toggle).

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
| Faint text (captions, meta) | `--ink-faint` | `#726b5e` |
| Text on ink band | `--on-ink` / `--on-ink-muted` | `#f6f1e7` / `#b8b0a0` |
| Brick (primary accent, actions, current state) | `--brick` / `--brick-deep` / `--brick-tint` / `--on-brick` | `#9c3d24` / `#7d2f1a` / `#f0d9cc` / `#fbf8f1` |
| Moss (secondary accent, links, "good/green" ideas) | `--moss` / `--moss-deep` / `--moss-tint` / `--on-moss` | `#2f4a3a` / `#213529` / `#dfe6d8` / `#f6f1e7` |
| Error | `--rust` | `#8c1c2e` |
| Water / info (drawings) | `--slate` | `#35506b` |

Rules: brick = do something / look here; moss = links, trees, proposed changes; slate = water and stormwater in drawings; rust only for form errors. Tints are for backgrounds of art, callouts and media, never for text. Page rhythm alternates `paper` and `rds-band-sunk` sections; `rds-band-ink` for a dark closing band or the footer. Never use pure black or white, and never hardcode a hex when a token exists. (SVG drawings in the study also use `#e8eef5` for glass/sky and `#4a4743` for linework; reuse those for drawings.)

## Typography

Fonts (Google Fonts, loaded in the page `<head>` and by `rds.css`): **Newsreader** (serif, display/prose/titles), **Hanken Grotesk** (sans, UI/body/lead), **IBM Plex Mono** (captions, figure labels, meta, numbers), **Architects Daughter** (hand notes only).

| Class | Spec |
|---|---|
| `rds-display-xl` | serif 400, clamp(44,7vw,72)px / 1.02, -0.02em; one per page (hero h1) |
| `rds-display` | serif 400, clamp(36,5.4vw,56)px / 1.05; section headlines |
| `rds-h1` / `rds-h2` / `rds-h3` | serif 400/500/500, 40 / 30 / 22px |
| `rds-lead` | sans 20/30, `--ink-muted`, max 56ch, under a headline |
| `rds-prose` | serif 19/31, max 68ch; first paragraph 24/36; supports h2, blockquote (italic 30px, top rule), ul, code |
| `rds-eyebrow` | sans 600 12px caps, +0.08em tracking, muted; sits above every section headline |
| `rds-small`, `rds-mono` | 14/22 sans, 14/22 mono |
| `rds-note` (+ `--moss`, `--ink`) | Architects Daughter 18px, rotated -2deg, with optional arrow svg; margin annotations on drawings |
| `rds-mark` | brick hand-drawn highlighter under a word, animates in; use on one phrase per page |
| `rds-circle` | brick hand-drawn circle around a word |

Headlines are sentences that state the finding ("Soil, not trees, is the hard part"), not labels.

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
- **Footer** `rds-footer` (ink band, brand, link columns, base disclaimer line).
- **Site-only (`site.css`, `rv-` prefix)**: `rv-compare` + `rv-seg` (Today/Proposed segmented toggle), `rv-feature` (featured study card), `rv-facts` (3 big serif numbers), `rv-steps`/`rv-step` (numbered method, first number brick), `rv-note`, `rv-about`, `rv-planned` (dimmed placeholder rows).

## Motion hooks (`rds.js`, add as attributes)

`data-rds-reveal[=fade|scale|left]` fade-up on enter · `data-rds-stagger` on a parent staggers children · `data-rds-split` on a headline makes words rise in · `data-rds-draw` on an `<svg>` draws `.rds-stroke` paths then pops `.rds-fill` shapes · `data-rds-nav` · `data-rds-parallax="0.15"` · `data-rds-toc` on a nav of `#links`. Style the `--i` custom property inline to order items (`style="--i:2"`). Without JS everything is visible. `window.RDSMotion.init(scope)` re-scans dynamically added content.

## Page patterns

**Home** (`index.html`): sticky nav → hero (display-xl split headline, lead, two buttons, before/after figure) → Studies (sunk band; featured `rv-feature` + planned rows) → Method (4 numbered steps) → Notes (eyebrow/headline left, serif prose right with one `rds-mark`) → About (art + sechead + contact rows) → ink footer.

**Study** (`studies/<slug>/index.html`): a self-contained long-form page. It inlines the system's styles (hex values + its own `.rds-view/.rds-w/.rds-draw` reveal classes and `data-rds-root`) because it was exported as one file; keep it standalone and don't mix it with the shared stylesheet unless you migrate the whole page. Structure: sticky top bar with part tabs (Site / Evidence / Design / Delivery / Sources) → left contents rail with count "01 / 13" → header (case-study label, split headline with one `rds-mark`, lead, two-column fact table: Site, Type, Focus, Status, By, Date) → sticky scroll-driven figure with step text beside it (`data-scrolly`, `data-step`) → "What is real / What is estimated" callout → four parts each with a bordered "Part N of 4" bar and numbered sections (`secNN`): Site, Problem, Evidence, Precedents, Proposal ("seven moves, added one at a time"), Before/after, Soil, Planting, Drawings, Phasing, Measuring, Limits → numbered Sources list. Claims carry superscript mono citations `[n]` that link to `#sN`. Concept-sketch disclaimers appear on every drawing.

**Content rules**: cite every number; mark estimates as estimates; end every study with what is unknown and what would be measured before/after; say "concept study, not commissioned"; no invented quotes or sources.

## Using this when adding pages

1. Start from `index.html`'s `<head>` (fonts, `tokens.css`, `rds.css`, `site.css`) and `<body class="rds-page">`; load `assets/rds/rds.js` at the end. Paths are relative; pages in `studies/x/` use `../../assets/...`.
2. Compose from the components above; section = `rds-section` > `rds-container` > `rds-sechead` + content. Alternate paper and sunk bands.
3. Use tokens, never raw colors or pixel spacing outside the scale. Check at 375px and 1280px, and with reduced motion.
4. New site-only styles go in `assets/site.css` with the `rv-` prefix. Genuinely reusable pieces go in `rds.css` plus this doc.
5. Run `python3 scripts/check.py` (links and anchors) before opening a PR.

## Known issues

- The study page does not use the shared stylesheet (see Page patterns), so token changes do not reach it.
- Home and study still contain placeholders: `[Last name]`, `[YOUR EMAIL]`, `[YOUR GITHUB]`, `[DATE]`, `[NEXT SITE ...]`.
