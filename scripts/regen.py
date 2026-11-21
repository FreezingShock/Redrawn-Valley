#!/usr/bin/env python3
"""Regenerate every generated page and index, in dependency order. One entry point for CI, check.py and people.
Run: python3 scripts/regen.py          (rewrites generated files; commit the result)
     python3 scripts/regen.py --check  (exit 1 and name what is stale; writes nothing)
Order matters: the log page is text the index reads, the hubs read the index, the index must then see the hubs,
and the fingerprints (assetver) come last because every step above can change a file that carries one.
To add a generator, append it to STEPS; it must accept --check."""
import subprocess, sys
from common import ROOT, CHECK

STEPS = ['build_log.py', 'build_sources.py', 'build_theme.py', 'build_index.py', 'build_topics.py', 'build_index.py', 'assetver.py']
here = ROOT / 'scripts'

if CHECK:
    # a chained check is impossible (the hubs are judged against a fresh index), so judge each step against the files as committed
    bad = [s for s in dict.fromkeys(STEPS) if subprocess.run([sys.executable, str(here / s), '--check'], capture_output=True).returncode]
    if bad: print('stale: ' + ', '.join(bad) + ' (run python3 scripts/regen.py and commit the result)')
    sys.exit(1 if bad else 0)
for s in STEPS:
    print(f'-- {s}'); subprocess.run([sys.executable, str(here / s)], check=True)
