"""Shared helpers for the scripts in this folder. Import with `from common import ROOT, html_files, CHECK`
(scripts run as `python3 scripts/<name>.py`, so this folder is already on sys.path)."""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP_DIRS = {'.git', 'node_modules'}
CHECK = '--check' in sys.argv   # every generator takes --check: report staleness, write nothing


def html_files():
    """Every .html page in the repo, sorted, minus .git and node_modules."""
    return [f for f in sorted(ROOT.rglob('*.html')) if not SKIP_DIRS & set(f.relative_to(ROOT).parts)]
