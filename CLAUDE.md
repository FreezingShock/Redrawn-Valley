# Redrawn Valley: working rules

Static site (no build, no deps) of site studies of small places in the San Fernando Valley, by Nate Anderson, a student headed toward construction management and civil engineering. Deployed on Vercel.

- **Design:** follow `DESIGN.md` (the Redrawn Design System). Reuse components and tokens; don't invent a new look. Update `DESIGN.md` when you add to the system.
- **Tokens:** every colour, size, space, radius, shadow, duration, easing, z-index and font comes from `assets/rds/tokens.css` (see `DESIGN.md` > Tokens). No literals in CSS or JS; `scripts/check.py` fails on new ones. Shared CSS/JS is fingerprinted (`?v=`) by `scripts/assetver.py` and cached immutably, so load files through their stamped path and never strip the query string.
- **Art:** page and post art comes from `assets/rds/motifs.js` (seeded: use the page slug as `data-seed`; see `DESIGN.md` > Motifs and `/patterns/`). Draw new motifs in code in our tokens; never copy reference images into the repo.
- **Labs:** every lab, demo or exploration page (existing and new) is also published as a styled article under `lab/` with an intro, the process and research, the decisions and the live demo embedded. See `DESIGN.md` > Lab articles.
- **Voice:** first person, plain, evidence-first. Every number cited, estimates labeled, limits stated. Never invent sources or quotes.
- **Branches:** open PRs against `integration` (never push to `main`). PRs there auto-merge after `python3 scripts/check.py` passes; add the `hold` label to stop one. `main` is production and is updated only by merging an `integration` to `main` promotion PR.
- **Before a PR:** `python3 scripts/check.py`, view the page locally (`python3 -m http.server 8000`) at 375px and 1280px.
- **Structure:** see `README.md`. New study = `studies/<slug>/index.html`, linked from the home page Studies section and footer.
- Keep changes small and say what changed in the PR description.
