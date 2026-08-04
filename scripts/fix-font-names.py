#!/usr/bin/env python3
"""Rename the slanted Helvetica cuts from "Oblique" to "Italic" in their name tables.

Why this exists
---------------
Penpot does not read `OS/2.fsSelection`, `head.macStyle`, `post.italicAngle`, or
`OS/2.usWeightClass` when you upload a custom font. It reads two *strings* — name
ID 16 (falling back to 1) for the family, and name ID 17 (falling back to 2) for
the variant — and regexes them:

    ;; common/src/app/common/media.cljc
    (defn parse-font-style [variant]
      (if (or (re-seq #"(?i)(?:^|[-_\\s])(italic)(?:[-_\\s]|$)" variant)
              (re-seq #"(?i)italic$" variant))
        "italic" "normal"))

"Oblique" does not match, so both slanted cuts parsed as `normal` and collided
with the upright ones on the derived variant id `(str style "-" weight)`. The
duplicates made upright Helvetica Bold unreachable in the design file.

These files already carry correct italic *metadata* (fsSelection ITALIC, macStyle
ITALIC, italicAngle -12) — only the human-readable subfamily string was wrong, and
"Oblique" in name ID 2 is not RIBBI-legal to begin with. So we touch the `name`
table and nothing else.

The browser is unaffected either way: for a font loaded via `@font-face`, the
descriptors in app/fonts.ts are authoritative, not the file's name table.

Idempotent. Run from the repo root:  python3 scripts/fix-font-names.py
"""

from __future__ import annotations

import os
import re
import sys
import tempfile

from fontTools.ttLib import TTFont

FAMILY = "Helvetica"

# path -> (subfamily / name 17 & 2, full name / name 4)
TARGETS = {
    "app/fonts/helvetica/Helvetica-Oblique.ttf": ("Italic", "Helvetica Italic"),
    "app/fonts/helvetica/Helvetica-BoldOblique.ttf": ("Bold Italic", "Helvetica Bold Italic"),
}

# opentype.js resolves (names.unicode || names.macintosh || names.windows)[id].en,
# so the English record of whichever platform table exists is the load-bearing one.
# Pin every platform that already carries a name ID 1 so the parse is deterministic.
ENGLISH_LANGS = {0x0000, 0x0409}


# --- Penpot's own parsers, re-implemented so we can assert before uploading ----

_WEIGHTS = [
    (r"(?:^|[-_\s])(hairline|thin)(?=(?:[-_\s]|$|italic\b))", 100),
    (r"(?:^|[-_\s])(extra\s*light|ultra\s*light)(?=(?:[-_\s]|$|italic\b))", 200),
    (r"(?:^|[-_\s])(light)(?=(?:[-_\s]|$|italic\b))", 300),
    (r"(?:^|[-_\s])(normal|regular)(?=(?:[-_\s]|$|italic\b))", 400),
    (r"(?:^|[-_\s])(medium)(?=(?:[-_\s]|$|italic\b))", 500),
    (r"(?:^|[-_\s])(semi\s*bold|demi\s*bold)(?=(?:[-_\s]|$|italic\b))", 600),
    (r"(?:^|[-_\s])(extra\s*bold|ultra\s*bold)(?=(?:[-_\s]|$|italic\b))", 800),
    (r"(?:^|[-_\s])(bold)(?=(?:[-_\s]|$|italic\b))", 700),
    (r"(?:^|[-_\s])(extra\s*black|ultra\s*black)(?=(?:[-_\s]|$|italic\b))", 950),
    (r"(?:^|[-_\s])(black|heavy|solid)(?=(?:[-_\s]|$|italic\b))", 900),
]


def penpot_weight(variant: str) -> int:
    for pattern, weight in _WEIGHTS:
        if re.search(pattern, variant, re.I):
            return weight
    return 400


def penpot_style(variant: str) -> str:
    if re.search(r"(?:^|[-_\s])(italic)(?:[-_\s]|$)", variant, re.I) or re.search(
        r"italic$", variant, re.I
    ):
        return "italic"
    return "normal"


def penpot_sees(font: TTFont) -> tuple[str, int, str]:
    """What Penpot's upload handler would register for this font."""
    name = font["name"]
    family = name.getDebugName(16) or name.getDebugName(1)
    variant = name.getDebugName(17) or name.getDebugName(2)
    return family, penpot_weight(variant), penpot_style(variant)


# --- patch -------------------------------------------------------------------


def patch(path: str, subfamily: str, fullname: str) -> None:
    # lazy=True keeps untouched tables as raw bytes, so only `name` is recompiled.
    font = TTFont(path, lazy=True)
    name = font["name"]

    # Every name-2 record, not just the English pair. These files carry ~34
    # localized subfamilies ("Obliqua", "Skrå", "Schräg", ...) which are inert
    # today but would otherwise contradict the English string forever.
    for record in list(name.names):
        if record.nameID == 2:
            name.setName(subfamily, 2, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 4:
            name.setName(fullname, 4, record.platformID, record.platEncID, record.langID)

    # Penpot checks 16/17 *first*. These files have none, so add them on every
    # platform that carries an English name ID 1.
    slots = {
        (r.platformID, r.platEncID, r.langID)
        for r in name.names
        if r.nameID == 1 and r.langID in ENGLISH_LANGS
    }
    for platform_id, enc_id, lang_id in sorted(slots):
        name.setName(FAMILY, 16, platform_id, enc_id, lang_id)
        name.setName(subfamily, 17, platform_id, enc_id, lang_id)

    # Save via a temp file — TTFont holds an open handle on `path`. mkstemp
    # creates at 0600, so carry the original mode across the replace.
    mode = os.stat(path).st_mode
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path) or ".", suffix=".tmp")
    os.close(fd)
    font.save(tmp)
    font.close()
    os.chmod(tmp, mode)
    os.replace(tmp, path)


def main() -> int:
    if not os.path.isdir("app/fonts/helvetica"):
        print("error: run this from the repo root", file=sys.stderr)
        return 1

    failures = []
    for path, (subfamily, fullname) in TARGETS.items():
        patch(path, subfamily, fullname)

        font = TTFont(path, lazy=True)
        got = penpot_sees(font)
        font.close()

        want = (FAMILY, penpot_weight(subfamily), "italic")
        status = "ok " if got == want else "FAIL"
        print(f"{status} {path}\n     Penpot will register: {got[0]!r} {got[2]}-{got[1]}")
        if got != want:
            failures.append((path, got, want))

    if failures:
        print("\nname-table patch did not produce the expected parse:", file=sys.stderr)
        for path, got, want in failures:
            print(f"  {path}: got {got}, want {want}", file=sys.stderr)
        return 1

    print(
        "\nBoth cuts now parse as italic and no longer collide with the upright"
        f"\nvariants. Upload them to Penpot under the family {FAMILY!r}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
