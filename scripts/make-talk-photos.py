#!/usr/bin/env python3
"""Talk photos: private/talks-src/<talk-id>.<jpg|jpeg|png|webp|heic-as-jpg> ->
public/talks/<talk-id>.webp with every metadata block dropped (EXIF, GPS, XMP, ICC),
long edge capped at maxEdge (scripts/talk-photos.json, shared with check-talk-photos).
Pillow writes no metadata unless asked, and this never asks. Prints w/h to paste
into src/data/talks.ts. Host tooling, run by hand.

    python3 scripts/make-talk-photos.py
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
max_edge = json.loads((root / 'scripts' / 'talk-photos.json').read_text())['maxEdge']
src = root / 'private' / 'talks-src'
out = root / 'public' / 'talks'
out.mkdir(parents=True, exist_ok=True)

for f in sorted(src.iterdir()) if src.is_dir() else []:
    if f.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'}:
        continue
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    im.thumbnail((max_edge, max_edge), Image.LANCZOS)
    clean = im
    clean.save(out / f'{f.stem}.webp', 'WEBP', quality=82, method=6)
    print(f'{f.stem}: w: {clean.width}, h: {clean.height}')
