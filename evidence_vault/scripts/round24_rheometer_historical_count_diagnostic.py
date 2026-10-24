#!/usr/bin/env python3
"""Investigate historical rheometer count arithmetic without asserting undocumented intent."""
from __future__ import annotations
import csv, hashlib, json
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "evidence_vault/datasets/zenodo_18961871/Supplementary_RheometerData_v2.xlsx"
OUT = ROOT / "evidence_vault/forensic_reports"
CSV_OUT = OUT / "PHASE4B_RHEOMETER_HISTORICAL_COUNT_DIAGNOSTIC.csv"
JSON_OUT = OUT / "PHASE4B_RHEOMETER_HISTORICAL_COUNT_DIAGNOSTIC.json"

# Values transcribed from the superseded Round-5 per-sheet table / file-level claim.
HISTORICAL_PER_SHEET = {
    "AmpSwps_all": 290,
    "FrqSwps_all": 227,
    "FoamD_AmpSwpTest": 194,
    "FoamA_SteadyYield": 90,
}
HISTORICAL_ROUND4_STEADY_SHEAR_PER_SHEET = {"SteadyShear_5": 722, "SteadyShear_1": 722}
HISTORICAL_STEADY_SHEAR_COMBINED = 731
HISTORICAL_FILE_LEVEL = 739

def is_number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)

def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Canonical workbook missing: {SOURCE}")
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    wb = load_workbook(SOURCE, data_only=False, read_only=False)
    rows = []
    total_numeric = 0
    total_groups = 0
    for ws in wb.worksheets:
        if ws.title.lower() == "contents":
            continue
        header = None
        h = {}
        for r in range(1, min(ws.max_row, 12) + 1):
            mapping = {
                str(ws.cell(r, c).value).strip().lower(): c
                for c in range(1, ws.max_column + 1)
                if ws.cell(r, c).value is not None
            }
            if "test" in mapping and "point no." in mapping:
                header, h = r, mapping
                break
        if header is None:
            continue
        numeric_points = 0
        populated_data_rows = 0
        nonnumeric_point_rows = 0
        explicit_test_label_rows = 0
        groups = set()
        last = ""
        point_numbers = set()
        duplicate_keys = set()
        seen_keys = set()
        for r in range(header + 1, ws.max_row + 1):
            values = [ws.cell(r, c).value for c in range(1, ws.max_column + 1)]
            if not any(v is not None and str(v).strip() for v in values):
                continue
            populated_data_rows += 1
            raw_test = ws.cell(r, h["test"]).value
            if raw_test is not None and str(raw_test).strip():
                last = str(raw_test).strip()
                explicit_test_label_rows += 1
            point = ws.cell(r, h["point no."]).value
            if not is_number(point):
                nonnumeric_point_rows += 1
                continue
            numeric_points += 1
            groups.add(last)
            point_numbers.add(str(point))
            key = (last, str(point))
            if key in seen_keys:
                duplicate_keys.add(key)
            seen_keys.add(key)
        total_numeric += numeric_points
        total_groups += len(groups)
        historical = HISTORICAL_PER_SHEET.get(ws.title)
        historical_round4 = HISTORICAL_ROUND4_STEADY_SHEAR_PER_SHEET.get(ws.title)
        if historical is not None:
            delta = historical - numeric_points
            historical_pattern = (
                "HISTORICAL_COUNT_EQUALS_NUMERIC_POINTS_PLUS_TWO_POSSIBLE_HEADER_INCLUSION"
                if delta == 2 else "NO_SIMPLE_PLUS_TWO_MATCH"
            )
        elif historical_round4 is not None:
            delta = historical_round4 - numeric_points
            historical_pattern = (
                "ROUND4_CLAIM_PLUS_TWO_PATTERN_ONLY; NO_EXACT_MATCH_HISTORICAL_731_VS_732_WORKSHEET_ROW_SPAN"
                if delta == 2 else "ROUND4_STEADY_SHEAR_COUNT_MISMATCH; NO_EXACT_MATCH_HISTORICAL_731"
            )
        elif ws.title in ("SteadyShear_5", "SteadyShear_1"):
            delta = None
            historical_pattern = (
                "NO_EXACT_MATCH_HISTORICAL_731_VS_732_WORKSHEET_ROW_SPAN"
                if (ws.max_row - header) == HISTORICAL_STEADY_SHEAR_COMBINED + 1
                else "NO_MATCH_TO_HISTORICAL_COMBINED_731"
            )
        else:
            delta = None
            historical_pattern = "NO_HISTORICAL_PER_SHEET_CLAIM"
        rows.append({
            "sheet": ws.title,
            "header_row": header,
            "last_populated_row": ws.max_row,
            "worksheet_rows_after_header": ws.max_row - header,
            "populated_data_rows_after_header": populated_data_rows,
            "blank_rows_within_used_range_after_header": (ws.max_row - header) - populated_data_rows,
            "numeric_point_rows": numeric_points,
            "nonnumeric_point_rows_with_other_content": nonnumeric_point_rows,
            "explicit_test_label_rows": explicit_test_label_rows,
            "forward_filled_test_groups": len(groups),
            "distinct_point_numbers_across_groups_not_a_unique_measurement_count": len(point_numbers),
            "duplicate_test_point_keys": len(duplicate_keys),
            "historical_round4_per_sheet_count": historical_round4 if historical_round4 is not None else "",
            "historical_round5_per_sheet_count": historical if historical is not None else "",
            "historical_minus_numeric_points": delta if delta is not None else "",
            "historical_pattern_diagnostic": historical_pattern,
            "interpretation": "Structural arithmetic only; does not establish original author intent or independent experiments",
        })
    wb.close()
    OUT.mkdir(parents=True, exist_ok=True)
    with CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    report = {
        "audit_id": "PHASE4B-RHEOMETER-HISTORICAL-COUNT-DIAGNOSTIC",
        "source": {"filename": SOURCE.name, "sha256": digest},
        "source_counts": {
            "numeric_point_rows": total_numeric,
            "test_groups_across_sheets": total_groups,
            "historical_file_level_claim": HISTORICAL_FILE_LEVEL,
            "numeric_rows_minus_historical_739": total_numeric - HISTORICAL_FILE_LEVEL,
        },
        "historical_arithmetic_checks": {
            "round5_four_non_steady_sheet_claims": {
                "components": HISTORICAL_PER_SHEET,
                "sum": sum(HISTORICAL_PER_SHEET.values()),
                "source_numeric_rows": sum(row["numeric_point_rows"] for row in rows if row["sheet"] in HISTORICAL_PER_SHEET),
                "source_test_groups": sum(row["forward_filled_test_groups"] for row in rows if row["sheet"] in HISTORICAL_PER_SHEET)
            },
            "round4_steady_shear_per_sheet_claims": {
                "components": HISTORICAL_ROUND4_STEADY_SHEAR_PER_SHEET,
                "sum": sum(HISTORICAL_ROUND4_STEADY_SHEAR_PER_SHEET.values()),
                "source_numeric_rows": sum(row["numeric_point_rows"] for row in rows if row["sheet"] in HISTORICAL_ROUND4_STEADY_SHEAR_PER_SHEET),
                "source_test_groups": sum(row["forward_filled_test_groups"] for row in rows if row["sheet"] in HISTORICAL_ROUND4_STEADY_SHEAR_PER_SHEET)
            },
            "round5_steady_shear_combined_claim": HISTORICAL_STEADY_SHEAR_COMBINED,
            "historical_file_level_claim": HISTORICAL_FILE_LEVEL,
            "arithmetic_coincidence": {
                "equation": "sum of four Round-5 non-steady sheet claims minus all six sheet test groups",
                "left_component_sum": sum(HISTORICAL_PER_SHEET.values()),
                "group_count_scope": "all six measurement sheets",
                "group_count": total_groups,
                "result": sum(HISTORICAL_PER_SHEET.values()) - total_groups,
                "equals_739": sum(HISTORICAL_PER_SHEET.values()) - total_groups == HISTORICAL_FILE_LEVEL,
                "status": "ARITHMETIC_COINCIDENCE_SCOPE_MISMATCH_NOT_A_VALIDATED_COUNTING_RULE",
                "why_not_valid": "The 801 sum covers four non-steady sheets while the 62 groups cover all six sheets; no source or historical method authorizes subtracting these differently scoped units."
            },
            "steady_shear_conflict": {
                "round4_per_sheet_sum": sum(HISTORICAL_ROUND4_STEADY_SHEAR_PER_SHEET.values()),
                "round5_combined_claim": HISTORICAL_STEADY_SHEAR_COMBINED,
                "source_numeric_point_rows_across_both_sheets": sum(row["numeric_point_rows"] for row in rows if row["sheet"] in HISTORICAL_ROUND4_STEADY_SHEAR_PER_SHEET),
                "status": "CONFLICTING_HISTORICAL_COUNTS_NOT_RECONCILED"
            }
        },
        "historical_count_hypotheses": [
            {
                "observation": "Historical per-sheet counts 290, 227, 194, and 90 each equal the corresponding numeric Point No. row count plus two.",
                "status": "ARITHMETIC_PATTERN_ONLY_NOT_PROOF",
                "possible_explanation": "Two header rows may have been included in those four historical counts.",
                "not_established": "No original count script, workbook-cell inclusion map, or author rule establishes that headers were included."
            },
            {
                "observation": "Each steady-shear sheet spans 732 worksheet rows after its detected header, but only 721 rows are populated and only 720 have numeric Point No. values.",
                "status": "SOURCE_STRUCTURE_REPRODUCED_ORIGINAL_INTENT_UNKNOWN",
                "possible_explanation": "The historical combined 731 is not exactly reproduced by the 732-row worksheet span or the 720 numeric points per sheet; the historical counting rule remains unknown.",
                "not_established": "This does not establish which sheet, whether both sheets were intended, or how 739 was derived; row-span matching is not a measurement-count reconciliation."
            },
            {
                "observation": "Historical file-level 739 is not reproduced by the source-level numeric Point No. ledger.",
                "status": "NOT_REPRODUCED",
                "possible_explanation": None,
                "not_established": "No source-supported subset, deduplication, replicate, or inclusion rule yields 739."
            }
        ],
        "limitations": [
            "A populated worksheet row is not necessarily a measurement point.",
            "A numeric Point No. row is not proof of an independent physical experiment.",
            "The diagnostic deliberately does not discard rows, impute counts, or force 739.",
            "Historical per-sheet values are retained as claims from the superseded Round-5 report, not accepted measurements."
        ],
        "governance": {"phase4b": "OPEN", "phase5": "LOCKED"},
        "csv_output": CSV_OUT.name,
    }
    JSON_OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
