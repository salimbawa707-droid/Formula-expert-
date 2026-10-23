#!/usr/bin/env python3
"""Validate the 144 source-extracted R460 readings from Pušić et al. (2006).

This validator checks transcription structure and review gates only. It does not
validate scientific accuracy, infer stain removal, or promote data to LAB_VALIDATED.
Standard library only; run:
  python evidence_vault/scripts/validate_pusic_2006_r460.py path/to/readings.csv
"""
from __future__ import annotations

import csv
import json
import math
import sys
from pathlib import Path

EXPECTED_ROWS = 144
TABLES = {5, 6, 7, 8}
CONDITIONS = {"before", "dose_1", "dose_2", "dose_3"}
STAINS = {
    "black_coffee", "red_wine", "cocoa", "blood", "pumpkin_seed_oil",
    "lipstick", "pureed_tomato", "shoe_cream", "standard_fabric_control",
}
EXPECTED_BY_TABLE = {
    5: ("cotton", "powder", "g/kg", [30.0, 40.0, 45.0]),
    6: ("polyester_cotton_50_50", "powder", "g/kg", [30.0, 40.0, 45.0]),
    7: ("cotton", "liquid", "mL/kg", [17.5, 25.0, 35.0]),
    8: ("polyester_cotton_50_50", "liquid", "mL/kg", [17.5, 25.0, 35.0]),
}
REQUIRED = {
    "source_id", "paper_citation", "publisher_url", "pdf_url", "printed_page",
    "table_number", "table_cell", "fabric", "detergent_form", "condition_label",
    "dosage_value", "dosage_unit", "stain_or_control", "measurement_name",
    "measurement_value", "measurement_unit_status", "transcription_status",
    "reviewer_1", "reviewer_2", "review_match", "anomaly_flag", "notes",
}
KEY = ("table_number", "condition_label", "stain_or_control")


def _fail(errors: list[str], row_no: int, message: str) -> None:
    errors.append(f"row {row_no}: {message}")


def validate_rows(rows: list[dict[str, str]]) -> list[str]:
    errors: list[str] = []
    if len(rows) != EXPECTED_ROWS:
        errors.append(f"expected exactly {EXPECTED_ROWS} data rows; found {len(rows)}")
    if not rows:
        return errors

    missing_columns = sorted(REQUIRED - set(rows[0].keys()))
    if missing_columns:
        errors.append("missing required columns: " + ", ".join(missing_columns))
        return errors
    seen: set[tuple[str, str, str]] = set()
    table_counts = {table: 0 for table in TABLES}
    review_complete = 0

    for index, row in enumerate(rows, start=2):
        try:
            table = int(row["table_number"])
        except (ValueError, TypeError):
            _fail(errors, index, "table_number must be an integer 5, 6, 7, or 8")
            continue
        if table not in TABLES:
            _fail(errors, index, f"unsupported table_number {table}")
            continue
        table_counts[table] += 1
        condition = row["condition_label"].strip()
        stain = row["stain_or_control"].strip()
        key = (str(table), condition, stain)
        if key in seen:
            _fail(errors, index, f"duplicate table/condition/stain key {key}")
        seen.add(key)

        if condition not in CONDITIONS:
            _fail(errors, index, f"invalid condition_label {condition!r}")
        if stain not in STAINS:
            _fail(errors, index, f"invalid stain_or_control {stain!r}")
        fabric, form, unit, dosages = EXPECTED_BY_TABLE[table]
        if row["fabric"] != fabric:
            _fail(errors, index, f"table {table} fabric must be {fabric}")
        if row["detergent_form"] != form:
            _fail(errors, index, f"table {table} detergent_form must be {form}")
        if row["measurement_name"] != "R460_nm":
            _fail(errors, index, "measurement_name must be R460_nm")
        if row["measurement_unit_status"] != "UNIT_UNSPECIFIED_IN_SOURCE_TABLE":
            _fail(errors, index, "measurement unit must remain unspecified as in source table")
        if row["transcription_status"] not in {
            "SOURCE_EXTRACTED_PENDING_SECOND_REVIEW", "SOURCE_BACKED"
        }:
            _fail(errors, index, "invalid transcription_status")

        try:
            value = float(row["measurement_value"])
            if not math.isfinite(value):
                raise ValueError
        except (ValueError, TypeError):
            _fail(errors, index, "measurement_value must be a finite numeric reading")

        dosage_text = row["dosage_value"].strip()
        dosage_unit = row["dosage_unit"].strip()
        if condition == "before":
            if dosage_text.lower() not in {"", "null", "none"}:
                _fail(errors, index, "baseline condition must have null/blank dosage_value")
            if dosage_unit.lower() not in {"", "null", "none"}:
                _fail(errors, index, "baseline condition must have null/blank dosage_unit")
        elif condition in {"dose_1", "dose_2", "dose_3"}:
            expected = dosages[{"dose_1": 0, "dose_2": 1, "dose_3": 2}[condition]]
            try:
                dosage = float(dosage_text)
            except (ValueError, TypeError):
                dosage = math.nan
            if not math.isfinite(dosage) or not math.isclose(dosage, expected, rel_tol=0, abs_tol=1e-9):
                _fail(errors, index, f"{condition} dosage for table {table} must be {expected:g}")
            if dosage_unit != unit:
                _fail(errors, index, f"{condition} dosage unit for table {table} must be {unit}")

        if row["reviewer_1"].strip() and row["reviewer_2"].strip() and row["review_match"].strip().lower() == "true":
            review_complete += 1

    for table, count in table_counts.items():
        if count != 36:
            errors.append(f"table {table}: expected 36 readings; found {count}")
    if len(seen) != len(rows):
        # Duplicate errors are already emitted above; this summarizes the key-count failure.
        errors.append(f"unique keys {len(seen)} do not match row count {len(rows)}")
    if review_complete != EXPECTED_ROWS:
        errors.append(
            f"second review gate not met: {review_complete}/{EXPECTED_ROWS} rows have "
            "two reviewers and review_match=true"
        )
    return errors


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(f"Usage: {Path(argv[0]).name} readings.csv", file=sys.stderr)
        return 2
    path = Path(argv[1])
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
    except OSError as exc:
        print(f"Cannot read CSV: {exc}", file=sys.stderr)
        return 2
    errors = validate_rows(rows)
    report = {
        "dataset": "pusic_2006_tables_5_8_r460",
        "file": str(path),
        "row_count": len(rows),
        "expected_row_count": EXPECTED_ROWS,
        "validation": "PASS" if not errors else "FAIL",
        "errors": errors,
        "scientific_status": "SOURCE_EXTRACTED_PENDING_SECOND_REVIEW" if errors else "SOURCE_BACKED",
        "lab_validated": False,
        "phase4b": "OPEN",
        "phase5": "LOCKED",
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
