#!/usr/bin/env python3
"""Small pictures for the project rows on the home page: public/projects/<slug>/row.webp, 176x132
(4:3 at twice the 88 px they show at). Cut from each project's card plate, so they stay the same dot
pictures. Host tooling (Pillow), run by hand; output committed.

    python3 scripts/make-row-thumbs.py
"""
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SLUGS = [
    'urban-morphometrics', 'octopus',
    'autonomous-mobile-robot', 'autonomous-boat-perception', 'event-cameras-drone', 'perception-pipeline',
    'ros2-localization-triage',
]

for slug in SLUGS:
    text = (ROOT / 'src/content/projects' / f'{slug}.md').read_text()
    pick = re.search(r"^cardImage:\s*['\"](.+?)['\"]", text, re.M) or re.search(r"^image:\s*['\"](.+?)['\"]", text, re.M)
    src = ROOT / 'public' / pick.group(1).lstrip('/')
    im = ImageOps.fit(Image.open(src).convert('RGB'), (176, 132), Image.LANCZOS)
    out = ROOT / 'public/projects' / slug / 'row.webp'
    im.save(out, 'WEBP', quality=82, method=6)
    print(out.relative_to(ROOT), out.stat().st_size)
