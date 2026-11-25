#!/usr/bin/env python3
"""Validate the 2026-11-26 AI visual re-audit ledger and its correction trail.

This verifies committed CSV consistency and the recorded source-image identifiers.
It cannot independently inspect the publisher image in CI, and it does not
establish human review, formula prediction accuracy, or laboratory validation.
"""
from __future__ import annotations
import csv, json, sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

EXPECTED_ROWS = 144
EXPECTED_TABLES = {5, 6, 7, 8}
CORRECTED_ID = "pusic_2006_table_8_dose_2_red_wine"
EXPECTED_SOURCE_VALUE = Decimal("83.35")
PREVIOUS_VALUE = Decimal("81.35")
SOURCE_PDF_SHA256 = "ea2e068f6f58335f096376fb2f448eee819874b9be7e96591f14f23152173439"
SOURCE_IMAGE_BLOB_SHA = "c6ef177238b2b6ae3d988ca97fe77cb2cedd7850"

def read_rows(path: str) -> list[dict[str, str]]:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))

def number(value: str):
    try:
        result = Decimal(value.strip())
        return result if result.is_finite() else None
    except (InvalidOperation, AttributeError):
        return None

def index_rows(rows, label, errors):
    indexed = {}
    for line, row in enumerate(rows, start=2):
        key = row.get("source_id", "").strip()
        if not key:
            errors.append(f"{label} row {line}: blank source_id")
        elif key in indexed:
            errors.append(f"{label}: duplicate source_id {key}")
        else:
            indexed[key] = row
    return indexed

def validate(production_rows, comparison_rows, audit_rows):
    errors = []
    for label, rows in (("production", production_rows), ("comparison", comparison_rows), ("AI re-audit", audit_rows)):
        if len(rows) != EXPECTED_ROWS:
            errors.append(f"{label}: expected {EXPECTED_ROWS} rows, found {len(rows)}")
    if errors:
        return report(errors, 0, 0, 0, 0)

    production = index_rows(production_rows, "production", errors)
    comparison = index_rows(comparison_rows, "comparison", errors)
    audit = index_rows(audit_rows, "AI re-audit", errors)

    for label, indexed in (("comparison", comparison), ("AI re-audit", audit)):
        missing = set(production) - set(indexed)
        extra = set(indexed) - set(production)
        if missing: errors.append(f"{label}: {len(missing)} production source IDs missing")
        if extra: errors.append(f"{label}: {len(extra)} unknown source IDs")

    table_counts = {table: 0 for table in EXPECTED_TABLES}
    keys = set()
    current_matches = 0
    prior_mismatches = 0
    corrected_rows = 0

    for source_id, source in production.items():
        try:
            table = int(source.get("table_number", ""))
        except ValueError:
            errors.append(f"{source_id}: invalid table_number")
            continue
        if table not in EXPECTED_TABLES:
            errors.append(f"{source_id}: unsupported table {table}")
            continue
        table_counts[table] += 1
        key = (table, source.get("condition_label", "").strip(), source.get("stain_or_control", "").strip())
        if key in keys:
            errors.append(f"{source_id}: duplicate table/condition/stain key {key}")
        keys.add(key)

        current_value = number(source.get("measurement_value", ""))
        comp = comparison.get(source_id)
        audit_row = audit.get(source_id)
        if current_value is None:
            errors.append(f"{source_id}: production value is not finite")
        if comp is None or audit_row is None:
            continue

        comp_value = number(comp.get("ai_visual_value", ""))
        comp_source_value = number(comp.get("source_csv_value", ""))
        visual_value = number(audit_row.get("ai_visual_value_2026_11_26", ""))
        prior_value = number(audit_row.get("production_value_before_correction", ""))
        if None in (comp_value, comp_source_value, visual_value, prior_value):
            errors.append(f"{source_id}: non-finite value in comparison/re-audit ledger")
            continue

        for field in ("table_number", "condition_label", "stain_or_control"):
            if source.get(field, "").strip() != comp.get(field, "").strip():
                errors.append(f"{source_id}: comparison {field} differs")
            if source.get(field, "").strip() != audit_row.get(field, "").strip():
                errors.append(f"{source_id}: re-audit {field} differs")

        if current_value == comp_value == comp_source_value == visual_value:
            current_matches += 1
        else:
            errors.append(f"{source_id}: current production/comparison/re-audit values do not agree")

        if audit_row.get("source_pdf_sha256", "").strip() != SOURCE_PDF_SHA256:
            errors.append(f"{source_id}: source PDF SHA-256 mismatch")
        if audit_row.get("source_image_git_blob_sha", "").strip() != SOURCE_IMAGE_BLOB_SHA:
            errors.append(f"{source_id}: source image blob SHA mismatch")
        if audit_row.get("human_review", "").strip().lower() != "false":
            errors.append(f"{source_id}: human_review must remain false")

        status = audit_row.get("comparison_status_before_correction", "").strip()
        disposition = audit_row.get("disposition", "").strip()
        if source_id == CORRECTED_ID:
            prior_mismatches += 1
            if status != "MISMATCH":
                errors.append(f"{source_id}: historical mismatch must be preserved")
            if prior_value != PREVIOUS_VALUE or visual_value != EXPECTED_SOURCE_VALUE or current_value != EXPECTED_SOURCE_VALUE:
                errors.append(f"{source_id}: correction must preserve 81.35 -> 83.35 and current source value 83.35")
            if disposition != "CORRECT_PRODUCTION_AND_COMPARISON_LEDGER":
                errors.append(f"{source_id}: correction disposition missing")
            corrected_rows += 1
        else:
            if status != "MATCH":
                errors.append(f"{source_id}: unexpected pre-correction mismatch")
            if prior_value != visual_value:
                errors.append(f"{source_id}: unchanged row has different pre-correction and visual values")

    for table, count in table_counts.items():
        if count != 36:
            errors.append(f"table {table}: expected 36 rows, found {count}")
    if prior_mismatches != 1:
        errors.append(f"expected exactly one preserved pre-correction mismatch, found {prior_mismatches}")
    if corrected_rows != 1:
        errors.append(f"expected exactly one corrected row, found {corrected_rows}")

    return report(errors, current_matches, prior_mismatches, corrected_rows, len(keys))

def report(errors, matches, prior_mismatches, corrected_rows, unique_keys):
    return {
        "dataset": "pusic_2006_tables_5_8_r460",
        "validation": "PASS" if not errors else "FAIL",
        "production_comparison_reaudit_matches": matches,
        "historical_mismatches_preserved": prior_mismatches,
        "corrected_rows": corrected_rows,
        "unique_table_condition_stain_keys": unique_keys,
        "source_pdf_sha256_pinned": SOURCE_PDF_SHA256,
        "source_image_git_blob_sha_pinned": SOURCE_IMAGE_BLOB_SHA,
        "review_route": "AI_VISUAL_REAUDIT",
        "human_review": False,
        "lab_validated": False,
        "phase4b": "OPEN",
        "phase5": "LOCKED",
        "errors": errors,
    }

def main(argv):
    if len(argv) != 4:
        print(f"Usage: {Path(argv[0]).name} production.csv comparison.csv reaudit.csv", file=sys.stderr)
        return 2
    try:
        result = validate(read_rows(argv[1]), read_rows(argv[2]), read_rows(argv[3]))
    except OSError as exc:
        print(json.dumps({"validation": "FAIL", "errors": [str(exc)]}, indent=2))
        return 2
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["validation"] == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
