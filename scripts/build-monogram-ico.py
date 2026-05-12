"""
Stage 3 of the monogram pipeline: combine the terra variant's
16/32/48 PNGs into a single multi-size favicon.ico.

We write the ICO container manually rather than via PIL because Pillow's
`save(format='ICO', append_images=...)` doesn't reliably embed all
frames at their native resolution — it tends to keep only the primary.

ICO format reference:
  https://en.wikipedia.org/wiki/ICO_(file_format)

  Header (6 bytes):
    reserved (u16 LE) = 0
    type     (u16 LE) = 1 for icons
    count    (u16 LE) = number of images

  Directory entry (16 bytes per image):
    width    (u8)  — 0 means 256
    height   (u8)  — 0 means 256
    colors   (u8)  = 0  (>=256 colors)
    reserved (u8)  = 0
    planes   (u16 LE) = 1
    bpp      (u16 LE) = 32  (RGBA)
    bytes    (u32 LE) — size of image data
    offset   (u32 LE) — offset to image data from start of file

  Then the PNG bytes (modern ICOs embed PNG; legacy used BMP).
"""
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TERRA_DIR = ROOT / "monogram" / "terra"
OUT = ROOT / "monogram" / "favicon.ico"
SIZES = [16, 32, 48]


def main() -> None:
    pngs = []
    for s in SIZES:
        p = TERRA_DIR / f"monogram-terra-{s}.png"
        if not p.exists():
            raise SystemExit(f"missing: {p}")
        pngs.append((s, p.read_bytes()))

    header_size = 6
    entry_size = 16
    data_start = header_size + entry_size * len(pngs)

    parts = []
    parts.append(struct.pack("<HHH", 0, 1, len(pngs)))  # ICO header

    offset = data_start
    for size, data in pngs:
        width = 0 if size == 256 else size
        height = 0 if size == 256 else size
        parts.append(
            struct.pack(
                "<BBBBHHII",
                width,
                height,
                0,         # colors (0 = no palette)
                0,         # reserved
                1,         # planes
                32,        # bits per pixel
                len(data), # size of PNG data
                offset,    # offset to PNG data
            )
        )
        offset += len(data)

    for _, data in pngs:
        parts.append(data)

    OUT.write_bytes(b"".join(parts))
    print(f"wrote {OUT}  ({OUT.stat().st_size} bytes, {len(pngs)} sizes embedded)")


if __name__ == "__main__":
    main()
