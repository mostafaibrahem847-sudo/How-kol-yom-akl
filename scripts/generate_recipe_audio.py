#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate one Arabic Egyptian TTS narration (MP3) per recipe in public/recipe.md
using Microsoft Edge TTS (free, no API key).

Voice: ar-EG-SalmaNeural
Output: audio_output/<recipe-id>.mp3

Usage:
  py scripts/generate_recipe_audio.py                 # all recipes (skips existing files)
  py scripts/generate_recipe_audio.py --id molokhia   # one recipe (test)
  py scripts/generate_recipe_audio.py --limit 3       # first N recipes
  py scripts/generate_recipe_audio.py --overwrite     # regenerate existing files

Notes:
  * recipe.md is the content source of truth and is never modified.
  * No technical metadata (id/cuisine/time/servings/sources) is narrated.
  * Numbers are converted to Eastern-Arabic numerals and fractions/ranges are
    spoken naturally ("1/2" -> "واحد على اتنين" style, "250-300" -> "٢٥٠ إلى ٣٠٠").
"""

import argparse
import asyncio
import re
import sys
import time
from pathlib import Path

import edge_tts

VOICE = "ar-EG-SalmaNeural"
ROOT = Path(__file__).resolve().parent.parent
MD_PATH = ROOT / "public" / "recipe.md"
OUT_DIR = ROOT / "audio_output"
MIN_VALID_MP3_BYTES = 4096
RETRIES = 3
RETRY_DELAY_SECONDS = 2.0

ORDINALS = ["أولًا", "ثانيًا", "ثالثًا", "رابعًا", "خامسًا", "سادسًا", "سابعًا", "ثامنًا", "تاسعًا", "عاشرًا"]


# ── Parsing recipe.md (source of truth — never modified) ──────────────────────

def _field(block: str, name: str):
    m = re.search(rf"^- \*\*{name}:\*\* (.+)$", block, re.MULTILINE)
    return m.group(1).strip() if m else None


def _section(block: str, name: str) -> str:
    m = re.search(rf"### {name}\n([\s\S]*?)(?=\n### |\n## |$)", block)
    return m.group(1) if m else ""


def _bullet_lines(section_text: str):
    return [line[2:].strip() for line in section_text.split("\n") if line.startswith("- ")]


def _numbered_lines(section_text: str):
    return [re.sub(r"^\d+\.\s*", "", line).strip()
            for line in section_text.split("\n") if re.match(r"^\d+\.\s*", line)]


DIFFICULTY_READ = {"سهل": "سهلة", "متوسط": "متوسطة", "متقدم": "صعبة"}


def parse_recipes(md: str):
    """Extract all recipes; returns (recipes, errors)."""
    recipes, errors, seen = [], [], set()
    for block in md.split("\n## "):
        head = re.search(r"^(\d+)\. (.+)$", block, re.MULTILINE)
        if not head or "**ID:**" not in block:
            continue  # file header / index sections
        rid = (_field(block, "ID") or "").replace("`", "")
        title = head.group(2).strip()

        if not rid:
            errors.append(f"{title or '?'}: missing ID")
            continue
        if rid in seen:
            errors.append(f"{rid}: duplicate ID")
            continue
        seen.add(rid)
        if not title:
            errors.append(f"{rid}: missing title")

        ingredients = _bullet_lines(_section(block, "المكونات"))
        steps = _numbered_lines(_section(block, "طريقة التحضير"))
        tip = " ".join(_bullet_lines(_section(block, "نصيحة")))

        if not ingredients:
            errors.append(f"{rid}: no ingredients")
        if not steps:
            errors.append(f"{rid}: no steps")

        recipes.append({
            "id": rid,
            "title": title,
            "description": _field(block, "الوصف") or "",
            "ingredients": ingredients,
            "steps": steps,
            "tip": tip,
        })
    return recipes, errors


# ── Narration text (natural Egyptian Arabic for the cooking app) ──────────────

_DIGITS = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")


def _humanize(text: str) -> str:
    """Make quantities read naturally: 1/2 -> ١ على ٢, 250-300 -> ٢٥٠ إلى ٣٠٠."""
    t = re.sub(r"(\d+)\s*/\s*(\d+)", r"\1 على \2", text)
    t = re.sub(r"(\d+)\s*-\s*(\d+)", r"\1 إلى \2", t)
    return t.translate(_DIGITS)


def build_narration(r: dict) -> str:
    parts = [f"نورتي مطبخنا يا قمر! النهاردة هنعمل {r['title']}."]
    if r["description"]:
        parts.append(r["description"])
    if r["ingredients"]:
        items = "، ".join(_humanize(i) for i in r["ingredients"])
        parts.append(f"يلا جهزي المكونات معايا: {items}.")
    if r["steps"]:
        lines = []
        for i, step in enumerate(r["steps"], start=1):
            prefix = ORDINALS[i - 1] if i <= len(ORDINALS) else f"الخطوة {i}"
            lines.append(f"{prefix}: {_humanize(step)}.")
        parts.append("دلوقتي خطوات التحضير بالترتيب: " + " ".join(lines))
    if r["tip"]:
        parts.append(f"ونصيحة أخيرة مني ليكِ: {_humanize(r['tip'])}")
    parts.append("وبالهنا والشفا!")
    return "\n\n".join(parts)


# ── TTS generation ────────────────────────────────────────────────────────────

def _looks_like_valid_mp3(path: Path) -> bool:
    try:
        data = path.read_bytes()
    except OSError:
        return False
    if len(data) < MIN_VALID_MP3_BYTES:
        return False
    return data[:3] == b"ID3" or data[:1] == b"\xff"


async def generate_one(recipe: dict, out_path: Path) -> None:
    """Synthesize one recipe; retries on transient failures. Raises on final failure."""
    narration = build_narration(recipe)
    tmp_path = out_path.with_suffix(out_path.suffix + ".part")
    last_error = None
    for attempt in range(1, RETRIES + 1):
        try:
            communicate = edge_tts.Communicate(narration, VOICE)
            await communicate.save(str(tmp_path))
            if not _looks_like_valid_mp3(tmp_path):
                raise RuntimeError("output file is missing, empty, or not a valid MP3 stream")
            tmp_path.replace(out_path)
            return
        except Exception as exc:  # transient network/service failures
            last_error = exc
            if attempt < RETRIES:
                print(f"    attempt {attempt} failed ({exc}); retrying...", flush=True)
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)
    if tmp_path.exists():
        tmp_path.unlink(missing_ok=True)
    raise RuntimeError(f"all {RETRIES} attempts failed: {last_error}")


async def run(args) -> int:
    md = MD_PATH.read_text(encoding="utf-8")
    recipes, errors = parse_recipes(md)
    if errors:
        print("recipe.md validation failed:")
        for e in errors:
            print(f"  - {e}")
        return 2
    print(f"Parsed {len(recipes)} recipes from {MD_PATH.name}; all IDs unique, all titles present.")

    if args.id:
        recipes = [r for r in recipes if r["id"] == args.id]
        if not recipes:
            print(f"No recipe with id '{args.id}'.")
            return 2
    if args.limit is not None:
        recipes = recipes[: args.limit]

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    generated, skipped, failed = [], [], []
    total = len(recipes)
    for index, recipe in enumerate(recipes, start=1):
        rid = recipe["id"]
        out_path = OUT_DIR / f"{rid}.mp3"
        print(f"Generating {index}/{total}: {rid}", flush=True)
        if out_path.exists() and not args.overwrite:
            print("    exists — skipping (use --overwrite to regenerate)")
            skipped.append(rid)
            continue
        try:
            await generate_one(recipe, out_path)
            print(f"    saved {out_path.name} ({out_path.stat().st_size} bytes)")
            generated.append(rid)
        except Exception as exc:
            print(f"    FAILED: {exc}")
            failed.append(rid)

    print("\n──────── Summary ────────")
    print(f"Total recipes:   {total}")
    print(f"Generated files: {len(generated)}")
    print(f"Skipped (exist): {len(skipped)}")
    print(f"Failed:          {len(failed)}")
    print(f"Output dir:      {OUT_DIR}")
    if failed:
        print("Failed IDs:      " + ", ".join(failed))
    return 1 if failed else 0


def main() -> int:
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Generate Egyptian-Arabic TTS MP3s for recipe.md")
    parser.add_argument("--overwrite", action="store_true", help="regenerate existing MP3 files")
    parser.add_argument("--limit", type=int, default=None, metavar="N", help="only process the first N recipes")
    parser.add_argument("--id", type=str, default=None, metavar="RECIPE_ID", help="generate a single recipe by ID")
    args = parser.parse_args()

    try:
        return asyncio.run(run(args))
    except KeyboardInterrupt:
        print("\nInterrupted.")
        return 130


if __name__ == "__main__":
    sys.exit(main())
