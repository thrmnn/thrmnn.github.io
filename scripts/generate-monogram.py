"""
Generate T·A·H monogram asset package.

Pipeline:
  1. Load Space Grotesk variable TTF, instantiate at wght=500 (Medium)
  2. Convert "T·A·H" glyphs to outlined SVG paths via fontTools SVGPathPen
  3. Lay out with generous letter-spacing, center on a square canvas
  4. Emit one master SVG per color variant (terra, dark, paper)
  5. Print the SVG markup for variant A (terra) so the caller can rasterize
     the 400×400 preview via Sharp.

Stage 2 (rasterization + ICO assembly) lives in scripts/rasterize-monogram.mjs
and scripts/build-monogram-ico.py, run after the user confirms the preview.
"""
import argparse
import json
import os
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# ---------- config ---------------------------------------------------------

TTF_PATH = "/tmp/SpaceGrotesk-VF.ttf"
TEXT = "T·A·H"
LETTER_SPACING_EM = 0.06  # 6% — "roughly 6/em, generous" per spec
CANVAS_VIEWBOX = 1000     # square viewBox; render size set per PNG
PADDING_FACTOR = 0.10     # 10% breathing room inside the canvas

VARIANTS = {
    "terra": {"bg": "#B95C3E", "fg": "#1A1815"},
    "dark":  {"bg": "#1A1815", "fg": "#F5F2EC"},
    "paper": {"bg": "#F5F2EC", "fg": "#1A1815"},
}

# ---------- glyph extraction ----------------------------------------------


def load_medium_font(path: str) -> TTFont:
    """Load variable TTF and instantiate at wght=500 (Medium)."""
    vf = TTFont(path)
    return instancer.instantiateVariableFont(vf, {"wght": 500})


def glyph_to_svg_path(font: TTFont, char: str) -> tuple[str, int]:
    """Return (svg path d-string, advance width in font units) for one glyph."""
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    hmtx = font["hmtx"]

    glyph_name = cmap[ord(char)]
    pen = SVGPathPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    path_d = pen.getCommands()
    advance = hmtx[glyph_name][0]
    return path_d, advance


# ---------- layout --------------------------------------------------------


def layout_glyphs(font: TTFont, text: str, letter_spacing_em: float):
    """
    Return (svg_inner_g_markup, total_width_in_font_units, cap_height,
    bbox_top, bbox_bottom).
    The returned g element places glyphs in font-coordinate space
    (y-up); the caller applies the y-flip + centering transform.
    """
    upem = font["head"].unitsPerEm
    cap_height = font["OS/2"].sCapHeight or 700
    letter_spacing_units = int(letter_spacing_em * upem)

    glyph_data = [glyph_to_svg_path(font, ch) for ch in text]

    # Cursor walks left-to-right, accumulating advance + spacing.
    cursor = 0
    paths_markup = []
    bbox_top = 0
    bbox_bottom = 0
    for i, (path_d, advance) in enumerate(glyph_data):
        # We position each glyph at cursor on x; y origin is baseline.
        paths_markup.append(
            f'<path d="{path_d}" transform="translate({cursor} 0)" />'
        )
        cursor += advance
        if i < len(glyph_data) - 1:
            cursor += letter_spacing_units

    total_width = cursor  # includes spacing between, not after last glyph
    # For caps-only text, bbox is roughly [0, cap_height] vertically.
    bbox_top = cap_height
    bbox_bottom = 0

    return (
        "\n      ".join(paths_markup),
        total_width,
        cap_height,
        bbox_top,
        bbox_bottom,
        upem,
    )


# ---------- SVG composition -----------------------------------------------


def make_svg(text: str, bg: str, fg: str, letter_spacing_em: float) -> str:
    font = load_medium_font(TTF_PATH)
    paths, total_w, cap_h, bbox_top, bbox_bottom, upem = layout_glyphs(
        font, text, letter_spacing_em
    )

    # Canvas: square, viewBox 0..CANVAS_VIEWBOX both axes.
    canvas = CANVAS_VIEWBOX
    pad = int(canvas * PADDING_FACTOR)
    usable = canvas - 2 * pad

    # Scale so total_w fits within `usable` (we keep aspect — height scales
    # the same factor). Then center within the canvas.
    scale = usable / total_w if total_w > usable else 1.0
    # Don't force-shrink small monograms upward; just match width budget.

    scaled_w = total_w * scale
    scaled_h = cap_h * scale
    tx = (canvas - scaled_w) / 2
    ty = (canvas + scaled_h) / 2  # because we flip y next

    # The transform: move to (tx, ty), flip y (so font y-up becomes svg
    # y-down), then scale to fit. SVG composes transforms right-to-left,
    # so we write them in that order.
    transform = f"translate({tx} {ty}) scale({scale} {-scale})"

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {canvas} {canvas}" width="{canvas}" height="{canvas}">
  <rect width="{canvas}" height="{canvas}" fill="{bg}"/>
  <g fill="{fg}" transform="{transform}">
      {paths}
  </g>
</svg>
"""


# ---------- CLI -----------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out-dir",
        default=str(Path(__file__).parent.parent / "monogram"),
        help="Output root directory.",
    )
    parser.add_argument(
        "--preview-only",
        action="store_true",
        help="Emit only the terra SVG to stdout (for inline preview render).",
    )
    parser.add_argument(
        "--letter-spacing",
        type=float,
        default=LETTER_SPACING_EM,
        help="Letter-spacing in em units (default 0.06).",
    )
    args = parser.parse_args()

    if args.preview_only:
        terra = VARIANTS["terra"]
        svg = make_svg(TEXT, terra["bg"], terra["fg"], args.letter_spacing)
        print(svg)
        return

    out_root = Path(args.out_dir)
    out_root.mkdir(parents=True, exist_ok=True)

    written = []
    for name, colors in VARIANTS.items():
        d = out_root / name
        d.mkdir(parents=True, exist_ok=True)
        svg = make_svg(TEXT, colors["bg"], colors["fg"], args.letter_spacing)
        svg_path = d / f"monogram-{name}.svg"
        svg_path.write_text(svg, encoding="utf-8")
        written.append(str(svg_path))

    print(json.dumps({"written": written}, indent=2))


if __name__ == "__main__":
    main()
