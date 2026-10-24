#!/usr/bin/env python3
"""Compare a blind independent transcription against the source-extracted Pušić CSV.

This checks transcription agreement only. It does not establish experimental validity,
interpret R460 as percent removal, or promote records to LAB_VALIDATED.

Usage:
  python evidence_vault/scripts/compare_pusic_independent_review.py original.csv blind_review.csv [--reconciliation-csv output.csv] [--summary]
"""
from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

SCRIPT_NAME = "compare_pusic_independent_review.py"
SCRIPT_VERSION = "1.2.0"
EXPECTED_RECORDS = 144
ID = "source_id"
VALUE = "measurement_value"
REVIEW_VALUE = "independent_transcribed_value"
REVIEWER = "independent_reviewer"
REQUIRED_SOURCE = {ID, VALUE, "reviewer_1"}
REQUIRED_REVIEW = {ID, REVIEW_VALUE, REVIEWER}
ISO_DATE_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def compute_file_hashes(file_path: Path | str) -> dict[str, str | int]:
    path = Path(file_path)
    if not path.is_file():
        return {"path": str(file_path), "md5": "", "sha256": "", "size_bytes": 0}
    data = path.read_bytes()
    return {
        "path": str(path),
        "md5": hashlib.md5(data).hexdigest(),
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


def read_csv(path: str) -> list[dict[str, str]]:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def decimal_value(value: str) -> Decimal | None:
    try:
        cleaned = value.strip().replace(",", ".")
        result = Decimal(cleaned)
    except (InvalidOperation, AttributeError):
        return None
    return result if result.is_finite() else None


def format_human_summary(result: dict) -> str:
    lines = [
        "================================================================================",
        "PUŠIĆ (2006) TABLES 5-8 R460 INDEPENDENT REVIEW COMPARISON REPORT",
        "================================================================================",
        f"Execution Timestamp : {result.get('execution_timestamp', 'UNKNOWN')}",
        f"Script Identifier   : {result.get('script_name', SCRIPT_NAME)} v{result.get('script_version', SCRIPT_VERSION)}",
        f"Validation Gate     : {result.get('validation')} (Phase 4B: {result.get('phase4b')}, Phase 5: {result.get('phase5')})",
        f"Scientific Status   : {result.get('scientific_status')}",
        "--------------------------------------------------------------------------------",
        "INPUT ARTIFACT INTEGRITY:",
        f"  Source CSV Path   : {result.get('source_file', {}).get('path')}",
        f"  Source SHA-256    : {result.get('source_file', {}).get('sha256')}",
        f"  Review CSV Path   : {result.get('review_file', {}).get('path')}",
        f"  Review SHA-256    : {result.get('review_file', {}).get('sha256')}",
        "--------------------------------------------------------------------------------",
        "RECORD METRICS:",
        f"  Expected Records  : {result.get('expected_records', EXPECTED_RECORDS)}",
        f"  Source Records    : {result.get('row_count_source')}",
        f"  Review Records    : {result.get('row_count_review')}",
        f"  Reviewed Records  : {result.get('reviewed_records')}",
        f"  Exact Matches     : {result.get('matched')}",
        f"  Mismatches        : {result.get('mismatch_count')}",
        f"  Missing Values    : {len(result.get('missing_review_values', []))}",
        f"  Unreadable Cells  : {result.get('unreadable_count', 0)}",
        f"  Unresolved Records: {result.get('unresolved_count', 0)}",
        f"  Reviewer(s)       : {', '.join(result.get('reviewers', [])) or 'NONE'}",
        "--------------------------------------------------------------------------------",
    ]
    if result.get("errors"):
        lines.append("VALIDATION ERRORS & BLOCKERS:")
        for err in result["errors"]:
            lines.append(f"  [BLOCKER] {err}")
        lines.append("--------------------------------------------------------------------------------")
    if result.get("mismatches"):
        lines.append("MISMATCH DETAILS:")
        for m in result["mismatches"]:
            lines.append(f"  [MISMATCH] {m.get('source_id')}: source={m.get('source_value')} vs review={m.get('independent_value')}")
        lines.append("--------------------------------------------------------------------------------")
    lines.append(f"FINAL OUTCOME: {result.get('validation')} — {result.get('scope')}")
    lines.append("================================================================================")
    return "\n".join(lines)


def compare_rows(
    source_rows: list[dict[str, str]],
    review_rows: list[dict[str, str]],
    source_hashes: dict[str, str | int] | None = None,
    review_hashes: dict[str, str | int] | None = None,
) -> dict:
    errors: list[str] = []
    mismatches: list[dict[str, str]] = []
    missing_values: list[str] = []
    unreadable_records: list[str] = []
    unresolved_records: list[str] = []
    reviewers: set[str] = set()
    review_dates: set[str] = set()

    if not source_rows:
        errors.append("source CSV has no data rows")
    if not review_rows:
        errors.append("review worksheet has no data rows")

    if source_rows and not REQUIRED_SOURCE.issubset(source_rows[0]):
        errors.append("source CSV missing required columns: " + ", ".join(sorted(REQUIRED_SOURCE - set(source_rows[0]))))
    if review_rows and not REQUIRED_REVIEW.issubset(review_rows[0]):
        errors.append("review worksheet missing required columns: " + ", ".join(sorted(REQUIRED_REVIEW - set(review_rows[0]))))
    if errors:
        result = {
            "script_name": SCRIPT_NAME,
            "script_version": SCRIPT_VERSION,
            "execution_timestamp": datetime.now(timezone.utc).isoformat(),
            "dataset": "pusic_2006_tables_5_8_r460",
            "validation": "FAIL",
            "scope": "transcription agreement only; not scientific validation",
            "source_file": source_hashes or {},
            "review_file": review_hashes or {},
            "expected_records": EXPECTED_RECORDS,
            "row_count_source": len(source_rows),
            "row_count_review": len(review_rows),
            "reviewed_records": 0,
            "matched": 0,
            "mismatch_count": 0,
            "mismatches": mismatches,
            "missing_review_values": missing_values,
            "unreadable_count": 0,
            "unreadable_records": [],
            "unresolved_count": 0,
            "unresolved_records": [],
            "reviewers": [],
            "review_dates": [],
            "errors": errors,
            "scientific_status": "SOURCE_EXTRACTED_PENDING_SECOND_REVIEW",
            "lab_validated": False,
            "phase4b": "OPEN",
            "phase5": "LOCKED",
        }
        result["human_readable_summary"] = format_human_summary(result)
        return result

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
    reviewed_records = 0

    for key in sorted(set(source_by_id) & set(review_by_id)):
        src, rev = source_by_id[key], review_by_id[key]
        reviewer = rev[REVIEWER].strip()
        if reviewer:
            reviewers.add(reviewer)
        else:
            errors.append(f"{key}: independent_reviewer is blank")

        source_reviewer = src.get("reviewer_1", "").strip()
        if not source_reviewer:
            errors.append(f"{key}: source reviewer_1 is blank; independence cannot be checked")
        elif reviewer and reviewer.casefold() == source_reviewer.casefold():
            errors.append(f"{key}: independent_reviewer matches source reviewer_1; review is not independent")

        review_date = rev.get("review_date", "").strip()
        if review_date:
            if not ISO_DATE_REGEX.match(review_date):
                errors.append(f"{key}: review_date must be formatted as YYYY-MM-DD; found {review_date!r}")
            else:
                review_dates.add(review_date)

        flag = rev.get("discrepancy_flag", "").strip().upper()
        if flag in {"UNREADABLE", "ILLEGIBLE", "AMBIGUOUS"}:
            unreadable_records.append(key)
        elif flag == "UNRESOLVED":
            unresolved_records.append(key)

        raw = rev[REVIEW_VALUE].strip()
        if not raw:
            missing_values.append(key)
            continue

        reviewed_records += 1

        if raw.upper() in {"UNREADABLE", "ILLEGIBLE", "AMBIGUOUS"}:
            if key not in unreadable_records:
                unreadable_records.append(key)
            continue

        source_value = decimal_value(src[VALUE])
        review_value = decimal_value(raw)
        if source_value is None:
            errors.append(f"{key}: source measurement is not a finite decimal")
        elif review_value is None:
            errors.append(f"{key}: independent transcription is not a finite decimal")
        elif source_value != review_value:
            mismatches.append({
                "source_id": key,
                "source_value": str(source_value),
                "independent_value": str(review_value),
            })
        else:
            matched += 1

    if missing_values:
        errors.append(f"{len(missing_values)} review values are blank")
    if len(reviewers) != 1:
        errors.append(f"expected one consistent independent reviewer identity; found {len(reviewers)}")
    if mismatches:
        errors.append(f"{len(mismatches)} numeric transcription mismatches require resolution")
    if unreadable_records:
        errors.append(f"{len(unreadable_records)} record(s) flagged as unreadable/illegible require physical inspection")
    if unresolved_records:
        errors.append(f"{len(unresolved_records)} record(s) flagged as unresolved discrepancies")

    complete = (
        not errors
        and len(source_rows) == EXPECTED_RECORDS
        and len(review_rows) == EXPECTED_RECORDS
        and matched == EXPECTED_RECORDS
        and len(mismatches) == 0
        and len(missing_values) == 0
        and len(unreadable_records) == 0
        and len(unresolved_records) == 0
    )

    result = {
        "script_name": SCRIPT_NAME,
        "script_version": SCRIPT_VERSION,
        "execution_timestamp": datetime.now(timezone.utc).isoformat(),
        "dataset": "pusic_2006_tables_5_8_r460",
        "validation": "PASS" if complete else "FAIL",
        "scope": "transcription agreement only; not scientific validation",
        "source_file": source_hashes or {},
        "review_file": review_hashes or {},
        "expected_records": EXPECTED_RECORDS,
        "row_count_source": len(source_rows),
        "row_count_review": len(review_rows),
        "reviewed_records": reviewed_records,
        "matched": matched,
        "mismatch_count": len(mismatches),
        "mismatches": mismatches,
        "missing_review_values": missing_values,
        "unreadable_count": len(unreadable_records),
        "unreadable_records": unreadable_records,
        "unresolved_count": len(unresolved_records),
        "unresolved_records": unresolved_records,
        "reviewers": sorted(reviewers),
        "review_dates": sorted(review_dates),
        "errors": errors,
        "scientific_status": "SOURCE_BACKED_TRANSCRIPTION_CONFIRMED" if complete else "SOURCE_EXTRACTED_PENDING_SECOND_REVIEW",
        "lab_validated": False,
        "phase4b": "OPEN",
        "phase5": "LOCKED",
    }
    result["human_readable_summary"] = format_human_summary(result)
    return result


def export_reconciliation_csv(
    source_rows: list[dict[str, str]],
    review_rows: list[dict[str, str]],
    output_path: Path | str,
) -> None:
    source_by_id = {r[ID].strip(): r for r in source_rows if r.get(ID)}
    review_by_id = {r[ID].strip(): r for r in review_rows if r.get(ID)}
    all_keys = sorted(set(source_by_id.keys()) | set(review_by_id.keys()))

    fieldnames = [
        "source_id", "table_number", "table_cell", "fabric", "detergent_form",
        "condition_label", "dosage_value", "dosage_unit", "stain_or_control",
        "measurement_name", "source_value", "source_reviewer",
        "independent_value", "independent_reviewer", "review_date",
        "match_status", "discrepancy_flag", "discrepancy_notes",
        "reconciliation_resolution"
    ]

    with Path(output_path).open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for key in all_keys:
            src = source_by_id.get(key, {})
            rev = review_by_id.get(key, {})
            s_val = src.get(VALUE, "").strip()
            r_val = rev.get(REVIEW_VALUE, "").strip()
            s_dec = decimal_value(s_val)
            r_dec = decimal_value(r_val)

            if not r_val:
                status = "PENDING_SECOND_REVIEW"
                resolution = "BLOCKED_PENDING_HUMAN_INDEPENDENT_OBSERVATION"
            elif s_dec is not None and r_dec is not None and s_dec == r_dec:
                status = "MATCHED"
                resolution = "VERIFIED_MATCH"
            elif r_val.upper() in {"UNREADABLE", "ILLEGIBLE"}:
                status = "UNREADABLE"
                resolution = "REQUIRES_PHYSICAL_SOURCE_INSPECTION"
            else:
                status = "MISMATCH"
                resolution = "DISCREPANCY_REQUIRES_SOURCE_ARBITRATION"

            writer.writerow({
                "source_id": key,
                "table_number": src.get("table_number") or rev.get("table_number", ""),
                "table_cell": src.get("table_cell") or rev.get("table_cell", ""),
                "fabric": src.get("fabric") or rev.get("fabric", ""),
                "detergent_form": src.get("detergent_form") or rev.get("detergent_form", ""),
                "condition_label": src.get("condition_label") or rev.get("condition_label", ""),
                "dosage_value": src.get("dosage_value") or rev.get("dosage_value", ""),
                "dosage_unit": src.get("dosage_unit") or rev.get("dosage_unit", ""),
                "stain_or_control": src.get("stain_or_control") or rev.get("stain_or_control", ""),
                "measurement_name": src.get("measurement_name") or rev.get("measurement_name", "R460_nm"),
                "source_value": s_val,
                "source_reviewer": src.get("reviewer_1", ""),
                "independent_value": r_val,
                "independent_reviewer": rev.get(REVIEWER, ""),
                "review_date": rev.get("review_date", ""),
                "match_status": status,
                "discrepancy_flag": rev.get("discrepancy_flag", ""),
                "discrepancy_notes": rev.get("discrepancy_notes", ""),
                "reconciliation_resolution": resolution,
            })


def main(argv: list[str]) -> int:
    args = argv[1:]
    reconcile_out: str | None = None
    show_summary_only = False

    if "--summary" in args:
        show_summary_only = True
        args.remove("--summary")

    if "--reconciliation-csv" in args:
        idx = args.index("--reconciliation-csv")
        if idx + 1 < len(args):
            reconcile_out = args[idx + 1]
            del args[idx:idx + 2]
        else:
            print("Error: --reconciliation-csv requires an output file path", file=sys.stderr)
            return 2

    if len(args) != 2:
        print(f"Usage: {Path(argv[0]).name} source.csv blind_review.csv [--reconciliation-csv output.csv] [--summary]", file=sys.stderr)
        return 2

    source_path = Path(args[0])
    review_path = Path(args[1])

    source_hashes = compute_file_hashes(source_path)
    review_hashes = compute_file_hashes(review_path)

    try:
        source_rows = read_csv(str(source_path))
        review_rows = read_csv(str(review_path))
        result = compare_rows(source_rows, review_rows, source_hashes, review_hashes)
    except OSError as exc:
        err_res = {"validation": "FAIL", "errors": [f"Cannot read input: {exc}"]}
        print(json.dumps(err_res, indent=2))
        return 2

    if reconcile_out:
        try:
            export_reconciliation_csv(source_rows, review_rows, reconcile_out)
            result["reconciliation_csv_generated"] = reconcile_out
        except OSError as exc:
            result["errors"].append(f"Failed to export reconciliation CSV: {exc}")
            result["validation"] = "FAIL"

    if show_summary_only:
        print(result["human_readable_summary"])
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))

    return 0 if result["validation"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

