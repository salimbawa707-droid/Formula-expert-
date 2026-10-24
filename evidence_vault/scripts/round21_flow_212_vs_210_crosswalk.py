#!/usr/bin/env python3
"""Export exact source-row crosswalk for historical 212 vs 210 solution-flow counts.

A nonempty spreadsheet row is not automatically a complete numeric flow point.
This audit preserves row/cell lineage and never invents or fills missing values.
"""
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx"
OUT = ROOT / "evidence_vault/forensic_reports"
CSV_OUT = OUT / "PHASE4B_FLOW_212_VS_210_SOURCE_ROW_CROSSWALK.csv"
JSON_OUT = OUT / "PHASE4B_FLOW_212_VS_210_SOURCE_ROW_CROSSWALK.json"
SHEET = "SolutionFlowCurves"
HEADERS = ["filename", "sheet", "source_row", "source_record_id", "curve_label_raw",
           "point_value_raw", "numeric_point", "numeric_measurement_cells",
           "complete_numeric_point", "classification", "nonempty_cells"]


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def safe(value):
    return "" if value is None else str(value).replace("\r", "\\r").replace("\n", "\\n")


def main() -> int:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Canonical source workbook missing: {SOURCE}")
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    workbook = load_workbook(SOURCE, data_only=False, read_only=True)
    if SHEET not in workbook.sheetnames:
        raise AssertionError(f"Expected worksheet {SHEET!r}; found {workbook.sheetnames!r}")
    ws = workbook[SHEET]
    rows = []
    nonempty_rows = 0
    complete_points = 0
    incomplete_nonempty = 0
    curve_labels = set()

    for r in range(3, ws.max_row + 1):
        values = [ws.cell(r, c).value for c in range(1, 9)]
        if not any(v is not None and str(v).strip() for v in values):
            continue
        nonempty_rows += 1
        label, point, *measurements = values
        numeric_point = is_number(point)
        numeric_cells = [f"{ws.cell(r, c).coordinate}={safe(ws.cell(r, c).value)}"
                         for c in range(2, 9) if is_number(ws.cell(r, c).value)]
        complete = numeric_point and len(measurements) == 6 and all(is_number(v) for v in measurements)
        if complete:
            complete_points += 1
            classification = "COMPLETE_NUMERIC_FLOW_POINT"
        else:
            incomplete_nonempty += 1
            classification = "NONEMPTY_ROW_NOT_COMPLETE_NUMERIC_POINT"
        if label is not None and str(label).strip():
            curve_labels.add(str(label).strip())
        rows.append({
            "filename": SOURCE.name, "sheet": SHEET, "source_row": r,
            "source_record_id": f"{SHEET}!A{r}:H{r}",
            "curve_label_raw": safe(label), "point_value_raw": safe(point),
            "numeric_point": str(numeric_point).lower(),
            "numeric_measurement_cells": ";".join(numeric_cells),
            "complete_numeric_point": str(complete).lower(),
            "classification": classification,
            "nonempty_cells": ";".join(f"{ws.cell(r,c).coordinate}={safe(values[c-1])}"
                                        for c in range(1, 9) if values[c-1] is not None),
        })
    workbook.close()

    OUT.mkdir(parents=True, exist_ok=True)
    with CSV_OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)

    report = {
        "audit_id": "PHASE4B-FLOW-212-VS-210-SOURCE-ROW-CROSSWALK",
        "source": {"filename": SOURCE.name, "sheet": SHEET, "sha256": digest,
                   "source_range_scanned": f"A3:H{ws.max_row}"},
        "counts": {"historical_nonempty_row_count": nonempty_rows,
                   "complete_numeric_flow_points": complete_points,
                   "nonempty_rows_not_complete_numeric_points": incomplete_nonempty,
                   "distinct_nonblank_curve_labels_seen": len(curve_labels)},
        "claim_disposition": {
            "historical_212_is_complete_numeric_point_count": nonempty_rows == 212 and complete_points == 212,
            "historical_212_matches_nonempty_rows": nonempty_rows == 212,
            "source_defined_210_complete_numeric_points": complete_points == 210,
            "historical_212_to_complete_210_difference": nonempty_rows - complete_points,
            "interpretation": "Nonempty-row count and complete numeric point count are different units; only complete numeric point rows qualify under this structural rule."
        },
        "governance": {"phase4b": "OPEN", "phase5": "LOCKED"},
        "limitations": [
            "This is a structural row classification, not proof of independent physical experiments.",
            "No missing or nonnumeric values are imputed.",
            "The crosswalk does not resolve the historical author's intended inclusion rule unless the original counting script is found."
        ],
        "csv_output": CSV_OUT.name
    }
    JSON_OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
