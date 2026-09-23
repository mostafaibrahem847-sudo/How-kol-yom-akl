"""Generate the static Cairo weight instances the app ships.

Cairo ships as a single variable font (wght 200..1000, slnt -11..11). Neither
React Native's Android text stack nor react-native-web can be trusted to apply
those axes: expo-font writes one `@font-face` per registration with no
`font-weight` descriptor (so the browser pins the face at 400 and *synthesises*
bold), and Android applies its own fake-bold on top of the default instance.
The two synthetic algorithms differ, so Web and Native render visibly different
glyphs for the same `fontWeight`.

The app therefore ships one STATIC instance per weight, registers each under its
own family name, and selects the family from the weight (see
src/theme/typography.ts). Run this whenever the upstream variable font changes:

    python scripts/fonts/build_cairo.py

Source:  scripts/fonts/Cairo-Variable.ttf
Output:  assets/fonts/Cairo-<Weight>[-Oblique].ttf
"""

from __future__ import annotations

import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "scripts" / "fonts" / "Cairo-Variable.ttf"
OUT_DIR = ROOT / "assets" / "fonts"

# (file stem, subfamily, wght, slnt, italic)
INSTANCES = [
    ("Cairo-Regular", "Regular", 400, 0, False),
    ("Cairo-Medium", "Medium", 500, 0, False),
    ("Cairo-SemiBold", "SemiBold", 600, 0, False),
    ("Cairo-Bold", "Bold", 700, 0, False),
    ("Cairo-ExtraBold", "ExtraBold", 800, 0, False),
    ("Cairo-Medium-Oblique", "Medium Italic", 500, -11, True),
]

FS_ITALIC = 0x01
FS_BOLD = 0x20
FS_REGULAR = 0x40


def _set_name(font: TTFont, name_id: int, value: str) -> None:
    font["name"].setName(value, name_id, 3, 1, 0x409)  # Windows / Unicode BMP / en-US
    font["name"].setName(value, name_id, 1, 0, 0)  # Mac / Roman / en


def _name_instance(font: TTFont, subfamily: str, wght: int, italic: bool) -> None:
    family = "Cairo"
    full = f"{family} {subfamily}"
    postscript = f"{family}-{subfamily.replace(' ', '')}"
    _set_name(font, 1, family)
    _set_name(font, 2, subfamily)
    _set_name(font, 3, f"{family};{subfamily}")
    _set_name(font, 4, full)
    _set_name(font, 6, postscript)
    _set_name(font, 16, family)
    _set_name(font, 17, subfamily)

    os2 = font["OS/2"]
    os2.usWeightClass = wght
    os2.fsSelection &= ~(FS_ITALIC | FS_BOLD | FS_REGULAR)
    font["head"].macStyle &= ~0x03  # clear bold + italic

    if italic:
        os2.fsSelection |= FS_ITALIC
        font["head"].macStyle |= 0x02
    elif wght >= 700:
        os2.fsSelection |= FS_BOLD
        font["head"].macStyle |= 0x01
    elif wght == 400:
        os2.fsSelection |= FS_REGULAR


def main() -> int:
    if not SRC.exists():
        print(f"missing variable source: {SRC}", file=sys.stderr)
        return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for stem, subfamily, wght, slnt, italic in INSTANCES:
        font = TTFont(SRC)
        instantiateVariableFont(
            font,
            {"wght": wght, "slnt": slnt},
            inplace=True,
            updateFontNames=False,
        )
        _name_instance(font, subfamily, wght, italic)
        dest = OUT_DIR / f"{stem}.ttf"
        font.save(dest)
        font.close()
        print(f"wrote {dest.relative_to(ROOT)}  (wght={wght}, slnt={slnt})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
