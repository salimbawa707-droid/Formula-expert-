#!/usr/bin/env python3
"""Compare a blind independent transcription against the source-extracted Pušić CSV.

This checks transcription agreement only. It does not establish experimental validity,
interpret R460 as percent removal, or promote records to LAB_VALIDATED.
Run:
  python evidence_vault/scripts/compare_pusic_independent_review.py original.csv blind_review.csv
"""
from __future__ import annotations

import csv
import json
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

ID = "source_id"
VALUE = "measurement_value"
REVIEW_VALUE = "independent_transcribed_value"
REVIEWER = "independent_reviewer"
REQUIRED_SOURCE = {ID, VALUE}
REQUIRED_REVIEW = {ID, REVIEW_VALUE, REVIEWER}


def read_csv(path: str) -> list[dict[str, str]]:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def decimal_value(value: str) -> Decimal | None:
    try:
        result = Decimal(value.strip())
    except (InvalidOperation, AttributeError):
        return None
    return result if result.is_finite() else None


def compare_rows(source_rows: list[dict[str, str]], review_rows: list[dict[str, str]]) -> dict:
    errors: list[str] = []
    mismatches: list[dict[str, str]] = []
    missing_values: list[str] = []
    reviewers: set[str] = set()

    if not source_rows:
        errors.append("source CSV has no data rows")
    if not review_rows:
        errors.append("review worksheet has no data rows")

    if source_rows and not REQUIRED_SOURCE.issubset(source_rows[0]):
        errors.append("source CSV missing required columns: " + ", ".join(sorted(REQUIRED_SOURCE - set(source_rows[0]))))
    if review_rows and not REQUIRED_REVIEW.issubset(review_rows[0]):
        errors.append("review worksheet missing required columns: " + ", ".join(sorted(REQUIRED_REVIEW - set(review_rows[0]))))
    if errors:
        return {"validation": "FAIL", "errors": errors, "row_count_source": len(source_rows),
                "row_count_review": len(review_rows), "matched": 0, "mismatches": mismatches,
                "missing_review_values": missing_values, "reviewers": []}

    source_by_id: dict[str, dict[str, str]] = {}
    for row in source_rows:
        key = row[ID].strip()
        if not key:
            errors.append("source row has blank source_id")
        elif key in source_by_id:
            errors.append(f"duplicate source_id in source CSV: {key}")
        else:
            source_by_id[key] = row

    review_by_id: dict[str, dict[str, str]] = {}
    for row in review_rows:
        key = row[ID].strip()
        if not key:
            errors.append("review row has blank source_id")
        elif key in review_by_id:
            errors.append(f"duplicate source_id in review worksheet: {key}")
        else:
            review_by_id[key] = row

    missing_ids = sorted(set(source_by_id) - set(review_by_id))
    extra_ids = sorted(set(review_by_id) - set(source_by_id))
    if missing_ids:
        errors.append(f"{len(missing_ids)} source IDs missing from review worksheet")
    if extra_ids:
        errors.append(f"{len(extra_ids)} unknown source IDs in review worksheet")

    matched = 0
    for key in sorted(set(source_by_id) & set(review_by_id)):
        src, rev = source_by_id[key], review_by_id[key]
        reviewer = rev[REVIEWER].strip()
        if reviewer:
            reviewers.add(reviewer)
        else:
            errors.append(f"{key}: independent_reviewer is blank")
        raw = rev[REVIEW_VALUE].strip()
        if not raw:
            missing_values.append(key)
            continue
        source_value = decimal_value(src[VALUE])
        review_value = decimal_value(raw)
        if source_value is None:
            errors.append(f"{key}: source measurement is not a finite decimal")
        elif review_value is None:
            errors.append(f"{key}: independent transcription is not a finite decimal")
        elif source_value != review_value:
            mismatches.append({"source_id": key, "source_value": str(source_value),
                               "independent_value": str(review_value)})
        else:
            matched += 1

    if missing_values:
        errors.append(f"{len(missing_values)} review values are blank")
    if len(reviewers) != 1:
        errors.append(f"expected one consistent independent reviewer identity; found {len(reviewers)}")
    if mismatches:
        errors.append(f"{len(mismatches)} numeric transcription mismatches require resolution")

    complete = (not errors and len(source_rows) == 144 and len(review_rows) == 144
                and matched == 144)
    return {
        "dataset": "pusic_2006_tables_5_8_r460",
        "validation": "PASS" if complete else "FAIL",
        "scope": "transcription agreement only; not scientific validation",
        "row_count_source": len(source_rows),
        "row_count_review": len(review_rows),
        "matched": matched,
        "mismatch_count": len(mismatches),
        "mismatches": mismatches,
        "missing_review_values": missing_values,
        "reviewers": sorted(reviewers),
        "errors": errors,
        "phase4b": "OPEN",
        "phase5": "LOCKED",
    }


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(f"Usage: {Path(argv[0]).name} source.csv blind_review.csv", file=sys.stderr)
        return 2
    try:
        result = compare_rows(read_csv(argv[1]), read_csv(argv[2]))
    except OSError as exc:
        print(json.dumps({"validation": "FAIL", "errors": [f"Cannot read input: {exc}"]}, indent=2))
        return 2
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["validation"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
