#!/usr/bin/env python3
"""
Fill locale JSON from English using Google Translate (via deep-translator).
Preserves {{placeholders}}, skips API paths and some technical tokens.

Setup (once):
  cd frontend
  python3 -m venv .venv-i18n
  .venv-i18n/bin/pip install deep-translator

Run:
  cd frontend
  PYTHONUNBUFFERED=1 .venv-i18n/bin/python -u scripts/translate-locales-from-en.py

Optional: run a single target by setting env TARGET_LANG=ta (folder name under locales/).
"""
from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ROOT / "src" / "locales"
EN = LOCALES / "en"

# Source of truth is English. These locales are maintained separately — never overwrite via this script.
SKIP_DIRS = frozenset({"en", "gu", "hi", "kn","as", "brx", "doi"})

# Folder name under src/locales/ -> Google Translate target code.
# Only these targets are generated; missing folders are created on write.
# (gu/kn/hi are omitted on purpose; they are hand-maintained.)
FOLDER_TO_GOOGLE: dict[str, str] = {
    "as": "as",
    "brx": "hi",  # Bodo: no dedicated code; Hindi fallback
    "doi": "doi",
    "ks": "ur",  # Kashmiri: Urdu script fallback
    "kok": "gom",  # Konkani
    "mai": "mai",
    "ml": "ml",
    "mni": "mni-Mtei",
    "mr": "mr",
    "ne": "ne",
    "or": "or",
    "pa": "pa",
    "sa": "sa",
    "sat": "bn",  # Santali: not supported; Bengali regional fallback
    "sd": "sd",
    "ta": "ta",
    "te": "te",
    "ur": "ur",
}

SKIP_KEYS = frozenset({"code"})

PRESERVE_EXACT = frozenset(
    {
        "CSV",
        "JSON",
        "PDF",
        "USDC",
        "IPFS",
        "AI",
        "IDE",
        "x402",
        "DPDP",
        "GDPR",
        "BountyEscrow",
        "Algorand",
        "Testnet",
        "Pinata",
        "Pera Wallet",
        "Algo Explorer",
        "GET",
        "OK",
        "Tx",
        "Round",
        "Txn",
        "HTTP",
        "Headers",
        "Accept",
        "application/json",
        "Payment",
        "Required",
        "Transfer",
        "Audio",
        "Video",
        "Images",
        "Other",
    }
)

PH_TMPL = "__PH_{}__"


def mask_placeholders(s: str) -> tuple[str, list[str]]:
    found = re.findall(r"\{\{[^}]+\}\}", s)
    if not found:
        return s, []
    out = s
    for i, ph in enumerate(found):
        out = out.replace(ph, PH_TMPL.format(i), 1)
    return out, found


def unmask_placeholders(s: str, found: list[str]) -> str:
    for i, ph in enumerate(found):
        s = s.replace(PH_TMPL.format(i), ph)
    return s


def should_preserve(key: str | None, s: str) -> bool:
    if not s or not s.strip():
        return True
    if key in SKIP_KEYS:
        return True
    # Slugs used by the app (categories, etc.) must stay ASCII
    if key == "key" and re.match(r"^[a-z][a-z0-9_]*$", s):
        return True
    if s in PRESERVE_EXACT:
        return True
    if key == "icon":
        return True
    if key == "value" and len(s) <= 16 and re.match(r"^[\d$+.,KkMmBb\s\-]+$", s):
        return True
    if s.startswith(("GET ", "POST ", "PUT ", "DELETE ")):
        return True
    if "/api/" in s and ("GET" in s or "datasets" in s):
        return True
    if re.fullmatch(r"[A-Z][A-Z0-9]{1,10}", s):
        return True
    if re.fullmatch(r"[A-Z]{2,8}", s):
        return True
    return False


def collect_strings(obj, key: str | None, acc: set[str]) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            collect_strings(v, k, acc)
    elif isinstance(obj, list):
        for item in obj:
            collect_strings(item, key, acc)
    elif isinstance(obj, str):
        if not should_preserve(key, obj):
            acc.add(obj)


def translate_object(obj, key: str | None, translator: GoogleTranslator, cache: dict[str, str]) -> object:
    if isinstance(obj, dict):
        return {k: translate_object(v, k, translator, cache) for k, v in obj.items()}
    if isinstance(obj, list):
        return [translate_object(item, key, translator, cache) for item in obj]
    if isinstance(obj, str):
        if should_preserve(key, obj):
            return obj
        if obj in cache:
            return cache[obj]
        masked, phs = mask_placeholders(obj)
        for attempt in range(3):
            try:
                out = translator.translate(masked)
                time.sleep(0.06)
                break
            except Exception as e:
                print(f"  retry {attempt+1} for {obj[:60]!r}: {e}")
                time.sleep(1.2 * (attempt + 1))
        else:
            out = masked
        result = unmask_placeholders(out, phs)
        cache[obj] = result
        return result
    return obj


def translate_file(path_en: Path, out_path: Path, google_code: str) -> None:
    data = json.loads(path_en.read_text(encoding="utf-8"))
    translator = GoogleTranslator(source="en", target=google_code)
    cache: dict[str, str] = {}
    pending: set[str] = set()
    collect_strings(data, None, pending)
    to_translate = sorted(pending, key=len)

    batch_size = 18
    i = 0
    while i < len(to_translate):
        chunk = to_translate[i : i + batch_size]
        masked_chunk = []
        ph_lists = []
        for s in chunk:
            m, ph = mask_placeholders(s)
            masked_chunk.append(m)
            ph_lists.append(ph)
        try:
            outs = translator.translate_batch(masked_chunk)
            time.sleep(0.35)
            if len(outs) != len(masked_chunk):
                raise RuntimeError(f"batch length mismatch {len(outs)} != {len(masked_chunk)}")
        except Exception as e:
            print(f"  batch fail, falling back to single: {e}")
            outs = []
            for m in masked_chunk:
                try:
                    outs.append(translator.translate(m))
                    time.sleep(0.08)
                except Exception as e2:
                    print(f"  single fail {m[:40]!r}: {e2}")
                    outs.append(m)
        for s, ph, out in zip(chunk, ph_lists, outs):
            cache[s] = unmask_placeholders(out, ph)
        i += batch_size

    out = translate_object(data, None, translator, cache)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    if not EN.is_dir():
        raise SystemExit(f"Missing {EN}")

    json_names = sorted(p.name for p in EN.glob("*.json"))
    if not json_names:
        raise SystemExit(f"No JSON files in {EN}")

    only = os.environ.get("TARGET_LANG", "").strip()
    targets: list[tuple[str, str]] = []
    for name, google in sorted(FOLDER_TO_GOOGLE.items()):
        if name in SKIP_DIRS:
            continue
        if only and name != only:
            continue
        targets.append((name, google))

    if only and not targets:
        known = ", ".join(sorted(FOLDER_TO_GOOGLE))
        raise SystemExit(
            f"TARGET_LANG={only!r} is not a generated locale (or is in SKIP_DIRS). "
            f"Known targets: {known}"
        )

    for name, google in targets:
        out_dir = LOCALES / name
        print(f"=== {name} -> {google} ===", flush=True)
        for jf in json_names:
            src = EN / jf
            dst = out_dir / jf
            print(f"  {jf}", flush=True)
            translate_file(src, dst, google)
    print("done.", flush=True)


if __name__ == "__main__":
    main()
