"""
Generate monogram master SVGs from the canonical Asset 1.svg wordmark.

Pipeline:
  1. Parse Asset 1.svg to extract the 5-path wordmark group (T · A · H)
  2. For each color variant (terra, dark, paper), emit a square master SVG
     with the wordmark centered on a 1000×1000 canvas at WIDTH_FRACTION width
  3. Write to monogram/{variant}/monogram-{variant}.svg

Per-size rasters are produced by scripts/rasterize-monogram.mjs, which
renders each master SVG natively at the target raster resolution rather
than supersampling and downsampling. That preserves the SVG's vector
crispness at every output size — especially favicon sizes (16/32/48)
where Lanczos downscaling otherwise smears glyph edges.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "monogram" / "Asset 1.svg"

CANVAS = 1000           # master viewBox units, both axes
WIDTH_FRACTION = 0.82   # wordmark occupies this fraction of canvas width

VARIANTS = {
    "terra": {"bg": "#B95C3E", "fg": "#1A1815"},
    "dark":  {"bg": "#1A1815", "fg": "#F5F2EC"},
    "paper": {"bg": "#F5F2EC", "fg": "#1A1815"},
}


def main() -> None:
    src = SOURCE.read_text()

    # Source viewBox dimensions
    vb_m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src)
    if not vb_m:
        raise SystemExit("Could not find viewBox in Asset 1.svg")
    src_w = float(vb_m.group(1))
    src_h = float(vb_m.group(2))

    # All <path /> elements (the 5 glyph outlines)
    paths = re.findall(r"<path[^/>]*/>", src)
    if len(paths) != 5:
        # Not fatal — different exports might split paths differently — but
        # warn if the count doesn't match the T · A · H · structure.
        print(f"warning: expected 5 paths, found {len(paths)}")

    # Center the wordmark on the square canvas
    target_w = CANVAS * WIDTH_FRACTION
    scale = target_w / src_w
    scaled_h = src_h * scale
    tx = (CANVAS - target_w) / 2
    ty = (CANVAS - scaled_h) / 2

    paths_block = "\n      ".join(paths)

    for name, colors in VARIANTS.items():
        bg, fg = colors["bg"], colors["fg"]
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS} {CANVAS}" width="{CANVAS}" height="{CANVAS}">
  <rect width="{CANVAS}" height="{CANVAS}" fill="{bg}"/>
  <g transform="translate({tx:.4f} {ty:.4f}) scale({scale:.8f})" fill="{fg}">
      {paths_block}
  </g>
</svg>
"""
        out_dir = ROOT / "monogram" / name
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / f"monogram-{name}.svg"
        out_file.write_text(svg)
        print(f"wrote {out_file.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
