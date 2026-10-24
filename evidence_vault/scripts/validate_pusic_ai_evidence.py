#!/usr/bin/env python3
"""Validate AI-assisted source comparison evidence for Pušić (2006) R460 tables.

This validates transcription agreement and provenance fields only. It does not
establish experimental validity, predict missing readings, or grant LAB_VALIDATED.
Run:
  python evidence_vault/scripts/validate_pusic_ai_evidence.py production.csv ai_ledger.csv
"""
from __future__ import annotations
import csv, json, math, sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

EXPECTED = 144
TABLES = {5, 6, 7, 8}
KEY = ("table_number", "condition_label", "stain_or_control")
ID = "source_id"
VALUE = "measurement_value"
LEDGER_VALUE = "ai_visual_value"
REQUIRED_SOURCE = {ID, VALUE, "table_number", "condition_label", "stain_or_control",
                   "measurement_unit_status", "dosage_value", "dosage_unit"}
REQUIRED_LEDGER = {ID, "table_number", "condition_label", "stain_or_control",
                   "source_csv_value", LEDGER_VALUE, "comparison_status",
                   "verification_method", "printed_page"}

def read_csv(path: str) -> list[dict[str, str]]:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def finite_decimal(value: str):
    try:
        d = Decimal(value.strip())
        return d if d.is_finite() else None
    except (InvalidOperation, AttributeError):
        return None

def validate(source_rows, ledger_rows):
    errors = []
    for label, rows, required in (("production", source_rows, REQUIRED_SOURCE),
                                  ("AI ledger", ledger_rows, REQUIRED_LEDGER)):
        if len(rows) != EXPECTED:
            errors.append(f"{label}: expected {EXPECTED} rows, found {len(rows)}")
        if rows:
            missing = sorted(required - set(rows[0]))
            if missing: errors.append(f"{label}: missing columns: {', '.join(missing)}")
        else:
            errors.append(f"{label}: no data rows")
    if errors: return result(errors, 0, 0, 0)

    def index(rows, label):
        out = {}
        for n, row in enumerate(rows, start=2):
            key = row.get(ID, "").strip()
            if not key: errors.append(f"{label} row {n}: blank source_id")
            elif key in out: errors.append(f"{label}: duplicate source_id {key}")
            else: out[key] = row
        return out

    src, led = index(source_rows, "production"), index(ledger_rows, "AI ledger")
    missing, extra = set(src)-set(led), set(led)-set(src)
    if missing: errors.append(f"{len(missing)} source IDs missing from AI ledger")
    if extra: errors.append(f"{len(extra)} unknown IDs in AI ledger")
    matches = mismatches = 0
    table_counts = {t: 0 for t in TABLES}
    seen_keys = set()
    for sid, row in src.items():
        try: table = int(row["table_number"])
        except Exception:
            errors.append(f"{sid}: invalid table_number"); continue
        if table not in TABLES: errors.append(f"{sid}: unsupported table {table}"); continue
        table_counts[table] += 1
        key = tuple(row.get(k, "").strip() for k in KEY)
        if key in seen_keys: errors.append(f"{sid}: duplicate table/condition/stain key {key}")
        seen_keys.add(key)
        val = finite_decimal(row.get(VALUE, ""))
        if val is None: errors.append(f"{sid}: production value is not finite numeric")
        if row.get("measurement_unit_status") != "UNIT_UNSPECIFIED_IN_SOURCE_TABLE":
            errors.append(f"{sid}: source unit must remain unspecified")
        condition = row.get("condition_label", "").strip()
        dosage = row.get("dosage_value", "").strip()
        unit = row.get("dosage_unit", "").strip()
        if condition == "before":
            if dosage.lower() not in {"", "null", "none"} or unit.lower() not in {"", "null", "none"}:
                errors.append(f"{sid}: baseline dosage must be blank")
        elif condition not in {"dose_1", "dose_2", "dose_3"}:
            errors.append(f"{sid}: invalid condition {condition}")
        if sid not in led: continue
        lr = led[sid]
        for field in ("table_number", "condition_label", "stain_or_control"):
            if str(row.get(field, "")).strip() != str(lr.get(field, "")).strip():
                errors.append(f"{sid}: {field} mapping differs between production and ledger")
        if lr.get("comparison_status", "").strip() != "MATCH":
            errors.append(f"{sid}: ledger comparison_status is not MATCH")
        if not lr.get("verification_method", "").strip():
            errors.append(f"{sid}: verification_method is blank")
        if lr.get("printed_page", "").strip() != "13":
            errors.append(f"{sid}: printed_page must be 13")
        lv = finite_decimal(lr.get(LEDGER_VALUE, ""))
        sv = finite_decimal(lr.get("source_csv_value", ""))
        if lv is None or sv is None:
            errors.append(f"{sid}: ledger values must be finite numeric")
        elif val is not None and (val != sv or val != lv):
            mismatches += 1
            errors.append(f"{sid}: value mismatch production={val}, ledger_source={sv}, ai_visual={lv}")
        else: matches += 1
    for t, count in table_counts.items():
        if count != 36: errors.append(f"table {t}: expected 36 rows, found {count}")
    return result(errors, matches, mismatches, len(set(src) & set(led)))

def result(errors, matches, mismatches, common):
    return {"dataset":"pusic_2006_tables_5_8_r460",
            "validation":"PASS" if not errors else "FAIL",
            "scope":"AI-assisted source transcription comparison only; not lab validation",
            "matched_rows":matches, "mismatch_count":mismatches,
            "common_source_ids":common, "errors":errors,
            "scientific_status":"AI_VERIFIED_SOURCE_BACKED" if not errors else "AI_VERIFICATION_PENDING",
            "lab_validated":False,
            "phase4b":"PUSIC_SOURCE_COMPARISON_SUBGATE_PASS_ONLY" if not errors else "OPEN",
            "phase5":"LOCKED"}

def main(argv):
    if len(argv) != 3:
        print(f"Usage: {Path(argv[0]).name} production.csv ai_ledger.csv", file=sys.stderr); return 2
    try: report = validate(read_csv(argv[1]), read_csv(argv[2]))
    except OSError as e:
        print(json.dumps({"validation":"FAIL","errors":[str(e)]}, indent=2)); return 2
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["validation"] == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
