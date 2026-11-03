#!/usr/bin/env python3
"""Read-only integrity and structural audit of official Zenodo XLSX downloads."""
from __future__ import annotations

import hashlib
import json
import math
import os
import sys
import zipfile
from collections import Counter
from datetime import date, datetime, time
from pathlib import Path

from openpyxl import load_workbook

FILES = {
    "Supplementary_SolutionFlowCurves.xlsx": {
        "size": 22280,
        "md5": "cd5bfd6e95fc65e412807d53935c2d96",
        "sha256": "90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590",
    },
    "Supplementary_FilmThickness_v1.xlsx": {
        "size": 149923,
        "md5": "bc9582baafecd6552f6014216a0844e6",
        "sha256": "170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428",
    },
    "Supplementary_BubbleSizes_v1.xlsx": {
        "size": 557745,
        "md5": "9fcfe68a37d2d92a7999569a07908854",
        "sha256": "9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad",
    },
    "Supplementary_RheometerData_v2.xlsx": {
        "size": 162970,
        "md5": "c9b5a9cde073eb7c58933eec37a559a6",
        "sha256": "073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70",
    },
}
ZENODO_MD5 = {name: spec["md5"] for name, spec in FILES.items()}
ZENODO_URL = "https://zenodo.org/api/records/18961871/files/{name}/content"
REPO_URL = "https://github.com/salimbawa707-droid/Formula-expert-"
DOI = "10.5281/zenodo.18961871"


def json_value(value):
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, float) and not math.isfinite(value):
        return str(value)
    return value


def main():
    root = Path(sys.argv[1])
    audit = {
        "schema_version": "1.0.0",
        "audit_type": "read_only_xlsx_integrity_and_structure",
        "source": {
            "repository": REPO_URL,
            "branch_baseline": "ca37d5df501dbe5d3ef94015963c839face21cf4",
            "zenodo_record": "https://zenodo.org/records/18961871",
            "zenodo_api": "https://zenodo.org/api/records/18961871",
            "doi": DOI,
            "record_license": "CC-BY-4.0",
            "retrieval_route": "Zenodo official record file Download links via browser",
            "parser": {"name": "openpyxl", "version": "3.1.5"},
            "zip_validator": "Python zipfile.ZipFile.testzip",
        },
        "files": [],
    }
    for name, expected in FILES.items():
        path = root / name
        item = {
            "filename": name,
            "source_url": ZENODO_URL.format(name=name),
            "local_path": str(path),
            "source_metadata_md5": ZENODO_MD5[name],
            "expected_repository_size_bytes": expected["size"],
            "expected_repository_md5": expected["md5"],
            "expected_repository_sha256": expected["sha256"],
            "checks_run": [],
            "status": "BLOCKED",
        }
        if not path.is_file():
            item["checks_run"].append({"check": "file_present", "result": "FAIL"})
            item["error"] = "Downloaded source file not present at supplied path"
            audit["files"].append(item)
            continue

        raw = path.read_bytes()
        md5 = hashlib.md5(raw).hexdigest()
        sha256 = hashlib.sha256(raw).hexdigest()
        item.update({
            "size_bytes": len(raw),
            "md5": md5,
            "sha256": sha256,
            "repo_expected_size_match": len(raw) == expected["size"],
            "repo_expected_md5_match": md5 == expected["md5"],
            "repo_expected_sha256_match": sha256 == expected["sha256"],
            "zenodo_md5_match": md5 == ZENODO_MD5[name],
        })
        item["checks_run"].append({"check": "file_present", "result": "PASS"})
        item["checks_run"].append({
            "check": "size_and_hashes",
            "result": "PASS" if len(raw) == expected["size"] and md5 == expected["md5"] and sha256 == expected["sha256"] else "FAIL",
        })
        try:
            with zipfile.ZipFile(path, "r") as archive:
                bad_member = archive.testzip()
                names = archive.namelist()
                required = ["[Content_Types].xml", "xl/workbook.xml"]
                missing_required = [part for part in required if part not in names]
                item["zip"] = {
                    "is_zip": True,
                    "member_count": len(names),
                    "all_member_crcs_pass": bad_member is None,
                    "first_bad_member": bad_member,
                    "required_parts_present": not missing_required,
                    "missing_required_parts": missing_required,
                    "parts": sorted(names),
                }
                item["checks_run"].append({
                    "check": "zip_crc_and_required_xlsx_parts",
                    "result": "PASS" if bad_member is None and not missing_required else "FAIL",
                })
        except Exception as exc:
            item["zip"] = {"is_zip": False, "error": f"{type(exc).__name__}: {exc}"}
            item["checks_run"].append({"check": "zip_crc_and_required_xlsx_parts", "result": "FAIL"})

        try:
            wb = load_workbook(path, read_only=False, data_only=False, keep_links=False)
            sheets = []
            for ws in wb.worksheets:
                counts = Counter()
                non_finite = []
                errors = []
                formula_cells = []
                observed_rows = []
                duplicate_rows = Counter()
                max_row = ws.max_row or 0
                max_col = ws.max_column or 0
                nonempty_rows = 0
                rows_with_numeric_values = 0
                for row in ws.iter_rows():
                    values = [cell.value for cell in row]
                    if any(isinstance(v, (int, float)) and not isinstance(v, bool) for v in values):
                        rows_with_numeric_values += 1
                    if any(v is not None for v in values):
                        nonempty_rows += 1
                        normalized = tuple(json.dumps(json_value(v), sort_keys=True, default=str, ensure_ascii=False) for v in values)
                        duplicate_rows[normalized] += 1
                        if len(observed_rows) < 12:
                            observed_rows.append({
                                "row": row[0].row,
                                "values": [json_value(v) for v in values],
                                "cell_types": [cell.data_type for cell in row],
                            })
                    for cell in row:
                        val = cell.value
                        if val is None:
                            counts["blank"] += 1
                        elif cell.data_type == "e":
                            counts["error"] += 1
                            errors.append({"cell": cell.coordinate, "value": str(val)})
                        elif cell.data_type == "f":
                            counts["formula"] += 1
                            formula_cells.append({"cell": cell.coordinate, "formula": str(val)})
                        elif isinstance(val, bool):
                            counts["boolean"] += 1
                        elif isinstance(val, (int, float)):
                            counts["numeric"] += 1
                            if isinstance(val, float) and not math.isfinite(val):
                                counts["non_finite"] += 1
                                non_finite.append({"cell": cell.coordinate, "value": str(val)})
                        elif isinstance(val, (datetime, date, time)):
                            counts["date_time"] += 1
                        elif isinstance(val, str):
                            counts["text"] += 1
                        else:
                            counts["other"] += 1
                duplicates = sum(n - 1 for n in duplicate_rows.values() if n > 1)
                sheets.append({
                    "name": ws.title,
                    "state": ws.sheet_state,
                    "dimension": ws.calculate_dimension(),
                    "max_row": max_row,
                    "max_column": max_col,
                    "nonempty_row_count": nonempty_rows,
                    "rows_with_numeric_values": rows_with_numeric_values,
                    "cell_type_counts_within_dimension": dict(sorted(counts.items())),
                    "duplicate_full_row_excess_count_including_blank_cells": duplicates,
                    "merged_ranges": sorted(str(r) for r in ws.merged_cells.ranges),
                    "hidden_rows": [idx for idx, dim in ws.row_dimensions.items() if dim.hidden],
                    "hidden_columns": [key for key, dim in ws.column_dimensions.items() if dim.hidden],
                    "formula_count": len(formula_cells),
                    "formula_samples": formula_cells[:20],
                    "error_cells": errors,
                    "non_finite_values": non_finite,
                    "first_nonempty_rows": observed_rows,
                })
            wb.close()
            item["parser"] = {"result": "PASS", "sheet_count": len(sheets), "sheets": sheets}
            item["checks_run"].append({"check": "openpyxl_load_workbook", "result": "PASS"})
        except Exception as exc:
            item["parser"] = {"result": "FAIL", "error": f"{type(exc).__name__}: {exc}"}
            item["checks_run"].append({"check": "openpyxl_load_workbook", "result": "FAIL"})
        all_checks_pass = all(check.get("result") == "PASS" for check in item["checks_run"])
        zip_ok = item.get("zip", {}).get("all_member_crcs_pass") and item.get("zip", {}).get("required_parts_present")
        parser_ok = item.get("parser", {}).get("result") == "PASS"
        hashes_ok = all(item.get(key) is True for key in (
            "repo_expected_size_match", "repo_expected_md5_match",
            "repo_expected_sha256_match", "zenodo_md5_match",
        ))
        item["status"] = "PARSED" if all_checks_pass and zip_ok and parser_ok and hashes_ok else "FAIL"
        item["status_reason"] = "All source identity, ZIP integrity, and XLSX parser checks passed" if item["status"] == "PARSED" else "One or more required source identity, ZIP integrity, or parser checks failed"
        audit["files"].append(item)

    print(json.dumps(audit, indent=2, ensure_ascii=False, sort_keys=True, default=str))


if __name__ == "__main__":
    main()

