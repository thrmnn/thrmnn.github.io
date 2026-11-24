#!/usr/bin/env python3
"""Flat grey stand-in plates for the talks strip layout (public/talks/fixture-*.webp).
Host tooling (Pillow), run by hand; output committed. No metadata is written."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path(__file__).resolve().parent.parent / 'public' / 'talks'
out.mkdir(parents=True, exist_ok=True)
for name, (w, h) in {'fixture-landscape': (1200, 800), 'fixture-square': (900, 800)}.items():
    im = Image.new('RGB', (w, h), (128, 128, 128))
    d = ImageDraw.Draw(im)
    font = ImageFont.load_default(size=64)
    d.text((w / 2, h / 2), 'stand-in photo', fill=(235, 235, 235), font=font, anchor='mm')
    im.save(out / f'{name}.webp', 'WEBP', quality=70)
    print(name, w, h)
