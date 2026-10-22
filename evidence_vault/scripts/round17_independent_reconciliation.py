#!/usr/bin/env python3
"""Independent Phase 4B reconciliation of Zenodo 18961871 workbook bytes and Round-6 artifacts.

This script deliberately does not infer physical-observation counts from numeric rows.
It verifies pinned file identities, re-parses workbook dimensions/cell categories with
openpyxl, and compares the results with the preserved Round-6 JSON/CSV artifacts.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import sys
import zipfile
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "evidence_vault" / "datasets" / "zenodo_18961871"
PARSER_JSON = DATA_DIR / "round6_parser_audit.json"
LEDGER_CSV = DATA_DIR / "round6_observation_ledger.csv"

# Pinned identities from the Zenodo record and prior independently recorded checks.
# These are integrity constants, not expected scientific-observation counts.
PINNED_FILES = {
    "Supplementary_SolutionFlowCurves.xlsx": {
        "bytes": 22280,
        "md5": "cd5bfd6e95fc65e412807d53935c2d96",
        "sha256": "90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590",
    },
    "Supplementary_FilmThickness_v1.xlsx": {
        "bytes": 149923,
        "md5": "bc9582baafecd6552f6014216a0844e6",
        "sha256": "170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428",
    },
    "Supplementary_BubbleSizes_v1.xlsx": {
        "bytes": 557745,
        "md5": "9fcfe68a37d2d92a7999569a07908854",
        "sha256": "9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad",
    },
    "Supplementary_RheometerData_v2.xlsx": {
        "bytes": 162970,
        "md5": "c9b5a9cde073eb7c58933eec37a559a6",
        "sha256": "073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70",
    },
}


def sha(data: bytes, algorithm: str) -> str:
    return hashlib.new(algorithm, data).hexdigest()


def normalized(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and not math.isfinite(value):
        return repr(value)
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="verify only; do not write any files")
    args = parser.parse_args()

    try:
        from openpyxl import load_workbook
    except ImportError as exc:
        raise SystemExit("Missing dependency: install openpyxl==3.1.5") from exc

    if not PARSER_JSON.is_file() or not LEDGER_CSV.is_file():
        raise SystemExit("Required Round-6 parser JSON or observation CSV is missing.")

    prior = json.loads(PARSER_JSON.read_text(encoding="utf-8"))
    prior_files = {item["filename"]: item for item in prior.get("files", [])}
    with LEDGER_CSV.open("r", encoding="utf-8-sig", newline="") as handle:
        ledger_rows = list(csv.DictReader(handle))
    ledger = {(row["filename"], row["sheet_name"]): row for row in ledger_rows}

    failures: list[str] = []
    files_out: list[dict[str, Any]] = []
    totals = Counter()
    worksheet_count = 0

    for filename, pinned in PINNED_FILES.items():
        path = DATA_DIR / filename
        if not path.is_file():
            failures.append(f"MISSING_FILE: {filename}")
            continue

        raw = path.read_bytes()
        md5, sha256 = sha(raw, "md5"), sha(raw, "sha256")
        if len(raw) != pinned["bytes"]:
            failures.append(f"BYTE_SIZE_MISMATCH: {filename}: {len(raw)} != {pinned['bytes']}")
        if md5 != pinned["md5"]:
            failures.append(f"MD5_MISMATCH: {filename}")
        if sha256 != pinned["sha256"]:
            failures.append(f"SHA256_MISMATCH: {filename}")
        if not raw.startswith(b"PK\x03\x04"):
            failures.append(f"NOT_XLSX_ZIP_SIGNATURE: {filename}")
        try:
            with zipfile.ZipFile(path) as archive:
                bad_member = archive.testzip()
                if bad_member:
                    failures.append(f"ZIP_CRC_FAILURE: {filename}:{bad_member}")
                names = set(archive.namelist())
                required = {"[Content_Types].xml", "xl/workbook.xml"}
                if not required.issubset(names):
                    failures.append(f"MISSING_XLSX_PARTS: {filename}")
        except zipfile.BadZipFile:
            failures.append(f"INVALID_ZIP: {filename}")

        wb_formula = load_workbook(path, read_only=False, data_only=False, keep_links=False)
        wb_values = load_workbook(path, read_only=False, data_only=True, keep_links=False)
        prior_file = prior_files.get(filename)
        if not prior_file:
            failures.append(f"MISSING_PARSER_JSON_ENTRY: {filename}")
        elif prior_file.get("expected_repository_size_bytes") != pinned["bytes"] or prior_file.get("expected_repository_md5") != pinned["md5"] or prior_file.get("expected_repository_sha256") != pinned["sha256"]:
            failures.append(f"PARSER_JSON_PIN_MISMATCH: {filename}")

        file_sheets: list[dict[str, Any]] = []
        prior_sheets = {}
        if prior_file:
            prior_sheets = {sheet["name"]: sheet for sheet in prior_file.get("parser", {}).get("sheets", [])}

        for sheet_name in wb_formula.sheetnames:
            ws_f = wb_formula[sheet_name]
            ws_v = wb_values[sheet_name]
            max_row, max_col = ws_f.max_row, ws_f.max_column
            dimension = ws_f.calculate_dimension()
            cell_types = Counter()
            nonempty_rows = 0
            numeric_rows = 0
            duplicate_rows: Counter[str] = Counter()
            errors: list[str] = []
            non_finite: list[str] = []
            formulas = 0

            for row_idx in range(1, max_row + 1):
                row_f = [ws_f.cell(row_idx, col_idx) for col_idx in range(1, max_col + 1)]
                row_v = [ws_v.cell(row_idx, col_idx) for col_idx in range(1, max_col + 1)]
                row_values = [cell.value for cell in row_f]
                if any(value is not None and value != "" for value in row_values):
                    nonempty_rows += 1
                    fingerprint = json.dumps([normalized(v) for v in row_values], sort_keys=True, ensure_ascii=False, separators=(",", ":"))
                    duplicate_rows[fingerprint] += 1

                row_has_numeric = False
                for cf, cv in zip(row_f, row_v):
                    value_f = cf.value
                    value_v = cv.value
                    if cf.data_type == "f":
                        formulas += 1
                        cell_types["formula"] += 1
                    if cf.data_type == "e" or cv.data_type == "e":
                        cell_types["error"] += 1
                        errors.append(cf.coordinate)
                    if value_v is None or value_v == "":
                        cell_types["blank"] += 1
                    elif isinstance(value_v, bool):
                        cell_types["text"] += 1
                    elif isinstance(value_v, (int, float)):
                        if isinstance(value_v, float) and not math.isfinite(value_v):
                            non_finite.append(cv.coordinate)
                        else:
                            cell_types["numeric"] += 1
                            row_has_numeric = True
                    elif cv.data_type != "e":
                        cell_types["text"] += 1
                    if isinstance(value_f, (int, float)) and not isinstance(value_f, bool) and isinstance(value_f, float) and not math.isfinite(value_f):
                        non_finite.append(cf.coordinate)
                if row_has_numeric:
                    numeric_rows += 1

            duplicate_excess = sum(count - 1 for count in duplicate_rows.values() if count > 1)
            prior_sheet = prior_sheets.get(sheet_name)
            csv_sheet = ledger.get((filename, sheet_name))
            if prior_sheet is None:
                failures.append(f"MISSING_PARSER_JSON_SHEET: {filename}/{sheet_name}")
            else:
                comparisons = {
                    "dimension": dimension,
                    "max_row": max_row,
                    "max_column": max_col,
                    "nonempty_row_count": nonempty_rows,
                    "rows_with_numeric_values": numeric_rows,
                    "formula_count": formulas,
                    "duplicate_full_row_excess_count_including_blank_cells": duplicate_excess,
                }
                for field, actual in comparisons.items():
                    if prior_sheet.get(field) != actual:
                        failures.append(f"PARSER_JSON_MISMATCH: {filename}/{sheet_name}/{field}: source={actual!r} manifest={prior_sheet.get(field)!r}")
                # Compare cached-value categories where workbook formula results exist.
                prior_types = prior_sheet.get("cell_type_counts_within_dimension", {})
                for field in ("numeric", "text", "blank", "error"):
                    expected = prior_types.get(field, 0)
                    actual = cell_types[field]
                    if expected != actual:
                        failures.append(f"CELL_TYPE_MISMATCH: {filename}/{sheet_name}/{field}: source={actual} manifest={expected}")

            if csv_sheet is None:
                failures.append(f"MISSING_LEDGER_ROW: {filename}/{sheet_name}")
            else:
                csv_checks = {
                    "used_range": dimension,
                    "max_row": max_row,
                    "max_column": max_col,
                    "nonempty_rows": nonempty_rows,
                    "rows_with_numeric_values": numeric_rows,
                    "formula_cells": formulas,
                    "duplicate_full_row_excess": duplicate_excess,
                }
                for field, actual in csv_checks.items():
                    try:
                        expected = int(csv_sheet[field]) if field not in ("used_range",) else csv_sheet[field]
                    except (ValueError, TypeError):
                        failures.append(f"INVALID_LEDGER_VALUE: {filename}/{sheet_name}/{field}")
                        continue
                    if expected != actual:
                        failures.append(f"CSV_LEDGER_MISMATCH: {filename}/{sheet_name}/{field}: source={actual!r} ledger={expected!r}")

            item = {
                "sheet_name": sheet_name,
                "dimension": dimension,
                "max_row": max_row,
                "max_column": max_col,
                "nonempty_rows": nonempty_rows,
                "rows_with_numeric_values": numeric_rows,
                "cell_type_counts": dict(sorted(cell_types.items())),
                "formula_count": formulas,
                "duplicate_full_row_excess": duplicate_excess,
                "error_cells": errors,
                "non_finite_cells": non_finite,
                "source_manifest_comparison": "PASS" if prior_sheet else "FAIL",
                "csv_ledger_comparison": "PASS" if csv_sheet else "FAIL",
            }
            file_sheets.append(item)
            worksheet_count += 1
            totals["used_range_rows"] += max_row
            totals["nonempty_rows"] += nonempty_rows
            totals["rows_with_numeric_values"] += numeric_rows
            totals["formula_cells"] += formulas
            totals["duplicate_full_row_excess"] += duplicate_excess
            totals["error_cells"] += len(errors)
            totals["non_finite_cells"] += len(non_finite)

        wb_formula.close()
        wb_values.close()
        files_out.append({
            "filename": filename,
            "bytes": len(raw),
            "md5": md5,
            "sha256": sha256,
            "zip_integrity": "PASS" if zip_integrity_ok else "FAIL",
            "sheets": file_sheets,
        })

    if len(ledger) != worksheet_count:
        failures.append(f"LEDGER_SHEET_COUNT_MISMATCH: CSV={len(ledger)} parsed={worksheet_count}")

    report = {
        "audit_id": "PHASE4B-ROUND17-INDEPENDENT-LEDGER-RECONCILIATION",
        "schema_version": 1,
        "source": "Zenodo record 18961871; four pinned XLSX artifacts in the repository evidence vault",
        "phase4b": "OPEN",
        "phase5": "LOCKED",
        "file_integrity": "PASS" if not any(x.startswith(("MISSING_FILE", "BYTE_SIZE_MISMATCH", "MD5_MISMATCH", "SHA256_MISMATCH", "NOT_XLSX", "INVALID_ZIP", "ZIP_CRC", "MISSING_XLSX")) for x in failures) else "FAIL",
        "historical_published_observation_aggregate": 27982,
        "historical_aggregate_status": "NOT_INDEPENDENTLY_RECONCILED_TO_ROW_LEVEL_PHYSICAL_OBSERVATIONS",
        "warning": "Numeric-bearing spreadsheet rows, formula-derived values, image-level measurements, and physical experimental observations are different units. This audit does not relabel row counts as physical observations or validate a detergent-formula prediction.",
        "totals": dict(totals),
        "worksheet_count": worksheet_count,
        "files": files_out,
        "failures": failures,
        "decision": "PASS_WITH_PHYSICAL_OBSERVATION_COUNT_UNRESOLVED" if not failures else "FAIL",
    }

    if not args.check:
        output = DATA_DIR / "round17_independent_reconciliation.json"
        output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        md = [
            "# Phase 4B Round-17 — Independent Workbook and Ledger Reconciliation",
            "",
            "**Governance:** Phase 4B OPEN; Phase 5 LOCKED",
            "",
            f"- Decision: **{report['decision']}**",
            f"- File integrity: **{report['file_integrity']}**",
            f"- Worksheets inspected: **{worksheet_count}**",
            f"- Used-range rows (not observation count): **{totals['used_range_rows']}**",
            f"- Non-empty rows: **{totals['nonempty_rows']}**",
            f"- Rows containing numeric values: **{totals['rows_with_numeric_values']}**",
            f"- Formula cells: **{totals['formula_cells']}**",
            f"- Duplicate full-row excess: **{totals['duplicate_full_row_excess']}**",
            f"- Error cells: **{totals['error_cells']}**",
            f"- Non-finite cells: **{totals['non_finite_cells']}**",
            "",
            "## Scientific interpretation",
            "",
            "The historical 27,982 figure is preserved as a published aggregate, not accepted as an independently reconciled physical-observation count. Worksheet rows, numeric-bearing rows, formula-derived values, and image-level measurements must not be treated as interchangeable. This report does not validate any finished detergent formula or promote an engine to LAB_VALIDATED.",
            "",
            "## Per-file verification",
            "",
            "| File | Bytes | MD5 | SHA-256 | Worksheets |",
            "|---|---:|---|---|---:|",
        ]
        for file_item in files_out:
            md.append(f"| {file_item['filename']} | {file_item['bytes']} | `{file_item['md5']}` | `{file_item['sha256']}` | {len(file_item['sheets'])} |")
        md += ["", "## Failures", ""]
        md += [f"- {failure}" for failure in failures] if failures else ["None."]
        md += ["", "## Gate", "", "This is a data-integrity/reconciliation check only. Phase 4B remains OPEN until all evidence, applicability, provenance, and independent benchmark gates are met. Phase 5 remains LOCKED.", ""]
        (ROOT / "evidence_vault" / "forensic_reports" / "PHASE4B_ROUND17_INDEPENDENT_RECONCILIATION.md").write_text("\n".join(md), encoding="utf-8")

    print(json.dumps({
        "audit_id": report["audit_id"],
        "decision": report["decision"],
        "file_integrity": report["file_integrity"],
        "worksheet_count": worksheet_count,
        "totals": dict(totals),
        "failure_count": len(failures),
        "failures": failures[:50],
        "check_mode": args.check,
    }, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
