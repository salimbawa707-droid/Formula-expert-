#!/usr/bin/env python3
"""Verify AI-only blind source transcription against the production CSV and pinned PDF."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXPECTED_PDF_SHA256 = "ea2e068f6f58335f096376fb2f448eee819874b9be7e96591f14f23152173439"
EXPECTED_ROWS = 144
EXPECTED_AI_MODEL = "Codex GPT-6"
EXPECTED_METHOD = "AI_VISUAL_SOURCE_ONLY_BLIND_SECOND_TRANSCRIPTION"
KEY_FIELDS = ("table_number", "condition_label", "stain_or_control")
REQUIRED = {
    "source_id", *KEY_FIELDS, "source_pdf_sha256", "ai_model", "review_method",
    "ai_source_transcribed_value", "production_value", "comparison_status", "human_review",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def compare_rows(source: list[dict[str, str]], transcript: list[dict[str, str]], pdf_sha: str) -> dict:
    errors: list[str] = []
    if pdf_sha.lower() != EXPECTED_PDF_SHA256:
        errors.append(f"publisher PDF SHA-256 mismatch: {pdf_sha}")

    if len(source) != EXPECTED_ROWS:
        errors.append(f"Expected {EXPECTED_ROWS} production readings; found {len(source)}")
    if len(transcript) != EXPECTED_ROWS:
        errors.append(f"Expected {EXPECTED_ROWS} AI readings; found {len(transcript)}")

    missing = REQUIRED - set(transcript[0]) if transcript else REQUIRED
    if missing:
        errors.append("AI transcript missing required columns: " + ", ".join(sorted(missing)))

    def indexed(rows: list[dict[str, str]], label: str) -> dict[tuple[str, str, str], dict[str, str]]:
        result: dict[tuple[str, str, str], dict[str, str]] = {}
        for line_no, row in enumerate(rows, start=2):
            key = tuple(row.get(field, "").strip() for field in KEY_FIELDS)
            if not all(key):
                errors.append(f"{label} has an empty key at CSV line {line_no}")
            if key in result:
                errors.append(f"{label} has duplicate key at CSV line {line_no}: {key}")
            result[key] = row
        return result

    source_by_key = indexed(source, "production CSV")
    ai_by_key = indexed(transcript, "AI transcript")
    if set(source_by_key) != set(ai_by_key):
        errors.append("AI transcript keys differ from the production keys")

    mismatches: list[dict] = []
    for key, ai_row in ai_by_key.items():
        source_row = source_by_key.get(key)
        if source_row is None:
            continue

        source_value = source_row.get("measurement_value", "").strip()
        ai_value = ai_row.get("ai_source_transcribed_value", "").strip()
        claimed_production_value = ai_row.get("production_value", "").strip()
        try:
            source_num, ai_num = float(source_value), float(ai_value)
            numeric_match = math.isfinite(source_num) and math.isfinite(ai_num) and source_num == ai_num
        except ValueError:
            numeric_match = False
        if not numeric_match or ai_row.get("comparison_status", "").strip() != "MATCH":
            mismatches.append({"key": key, "ai": ai_value, "production": source_value})
        if claimed_production_value != source_value:
            errors.append(f"recorded production_value differs from source CSV for key {key}")
        if ai_row.get("source_id", "").strip() != source_row.get("source_id", "").strip():
            errors.append(f"source_id mismatch for key {key}")
        if ai_row.get("source_pdf_sha256", "").strip().lower() != EXPECTED_PDF_SHA256:
            errors.append(f"transcript cites wrong source PDF hash for key {key}")
        if ai_row.get("ai_model", "").strip() != EXPECTED_AI_MODEL:
            errors.append(f"AI model provenance is missing or unexpected for key {key}")
        if ai_row.get("review_method", "").strip() != EXPECTED_METHOD:
            errors.append(f"AI review method is missing or unexpected for key {key}")
        if ai_row.get("human_review", "").strip().lower() != "false":
            errors.append(f"AI transcript must not claim human review for key {key}")

    table_counts = {str(table): sum(1 for key in source_by_key if key[0] == str(table)) for table in (5, 6, 7, 8)}
    if table_counts != {"5": 36, "6": 36, "7": 36, "8": 36}:
        errors.append(f"expected 36 source readings per table; found {table_counts}")
    if mismatches:
        errors.append(f"{len(mismatches)} AI source readings differ from production transcription")

    return {
        "dataset": "pusic_2006_tables_5_8_r460",
        "verification_mode": "AI_SOURCE_ONLY_BLIND_SECOND_TRANSCRIPTION",
        "ai_model": EXPECTED_AI_MODEL,
        "publisher_pdf_sha256": pdf_sha,
        "rows_compared": min(len(source), len(transcript)),
        "matches": EXPECTED_ROWS - len(mismatches) if not (set(source_by_key) != set(ai_by_key)) else len(source_by_key) - len(mismatches),
        "mismatches": mismatches,
        "human_review": False,
        "lab_validated": False,
        "phase4b": "OPEN",
        "phase5": "LOCKED",
        "validation": "PASS" if not errors else "FAIL",
        "errors": errors,
    }


def verify(production_path: Path, transcript_path: Path, pdf_path: Path) -> dict:
    pdf_sha = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    return compare_rows(read_csv(production_path), read_csv(transcript_path), pdf_sha)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("production_csv", type=Path)
    parser.add_argument("ai_transcript_csv", type=Path)
    parser.add_argument("--pdf", type=Path, default=ROOT / "evidence_vault/sources/55_01_011_018hr1t.pdf")
    args = parser.parse_args()
    result = verify(args.production_csv, args.ai_transcript_csv, args.pdf)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["validation"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
