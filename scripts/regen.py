#!/usr/bin/env python3
"""Regenerate every generated page and index, in dependency order. One entry point for CI and for people.
Run: python3 scripts/regen.py          (rewrites generated files; commit the result)
     python3 scripts/regen.py --check  (exit 1 if anything is stale; writes nothing)
Order matters: the log page is text the index reads, the hubs read the index, and the index must then see the hubs.
To add a generator, append it to STEPS (skipped if the script does not exist yet)."""
import sys, subprocess, pathlib

root = pathlib.Path(__file__).resolve().parent
STEPS = ['build_drawings.py', 'build_log.py', 'build_sources.py', 'build_index.py', 'build_topics.py', 'build_sitemap.py', 'build_index.py', 'assetver.py']
check = '--check' in sys.argv
if check:
    # --check cannot chain (the hubs are judged against a fresh index), so regenerate in a temp copy of the state: just report staleness per step
    bad = []
    for s in dict.fromkeys(STEPS):
        if (root / s).exists() and subprocess.run([sys.executable, str(root / s), '--check'], capture_output=True).returncode: bad.append(s)
    if bad: print('stale: ' + ', '.join(bad) + ' (run python3 scripts/regen.py)'); sys.exit(1)
    sys.exit(0)
for s in STEPS:
    if (root / s).exists():
        print(f'-- {s}'); subprocess.run([sys.executable, str(root / s)], check=True)
