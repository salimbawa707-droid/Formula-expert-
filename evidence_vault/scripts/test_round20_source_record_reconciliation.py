#!/usr/bin/env python3
"""Regression gate for the Round-20 source-record reconciliation outputs.

This checks source-byte identity and structural counts. It does not equate rows,
features, or mixed-unit measurements with independent physical experiments.
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "evidence_vault/datasets/zenodo_18961871"
REPORT = ROOT / "evidence_vault/forensic_reports/PHASE4B_ROUND20_SOURCE_RECORD_RECONCILIATION.json"

EXPECTED = {
    "Supplementary_SolutionFlowCurves.xlsx": (22280, "90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590"),
    "Supplementary_FilmThickness_v1.xlsx": (149923, "170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428"),
    "Supplementary_BubbleSizes_v1.xlsx": (557745, "9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad"),
    "Supplementary_RheometerData_v2.xlsx": (162970, "073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70"),
}

def fail(message):
    print("FAIL:", message, file=sys.stderr)
    raise SystemExit(1)

def main():
    if not REPORT.is_file():
        fail(f"Round-20 JSON report not found: {REPORT}")
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    workbooks = {w["filename"]: w for w in report.get("workbooks", [])}
    for name, (size, digest) in EXPECTED.items():
        path = DATA / name
        if not path.is_file():
            fail(f"canonical workbook missing: {name}")
        raw = path.read_bytes()
        actual = hashlib.sha256(raw).hexdigest()
        if len(raw) != size or actual != digest:
            fail(f"canonical workbook byte identity mismatch: {name}, bytes={len(raw)}, sha256={actual}")
        meta = workbooks.get(name)
        if not meta or meta.get("bytes") != size or meta.get("sha256") != digest:
            fail(f"Round-20 report does not attest expected workbook bytes: {name}")
    counts = report.get("counts", {})
    expected_counts = {
        "solution_flow_curve_points": 210,
        "film_feature_measurements": 7522,
        "bubble_raw_area_cells": 19509,
        "bubble_derived_radius_formula_cells": 19509,
        "bubble_matched_pairs": 19509,
        "rheometer_point_rows": 2233,
        "rheometer_test_groups": 62,
    }
    for key, value in expected_counts.items():
        if counts.get(key) != value:
            fail(f"count mismatch for {key}: expected {value}, got {counts.get(key)!r}")
    gate = report.get("integrity_gate", {})
    if gate.get("status") != "PASS" or not all(gate.get("checks", {}).values()):
        fail("Round-20 structural integrity gate did not pass")
    claim = report.get("historical_claim", {})
    if claim.get("headline") != 27982 or claim.get("headline_reproduced") is not False:
        fail("historical headline must remain explicitly unreproduced")
    if claim.get("rheometer_needed_to_reach_headline") != 741:
        fail("expected unresolved 741-rheometer-record arithmetic is missing")
    governance = report.get("governance", {})
    if governance.get("phase4b") != "OPEN" or governance.get("phase5") != "LOCKED":
        fail("phase governance changed without separate authorization")
    print("PASS: canonical workbook bytes, Round-20 counts and integrity gate verified.")
    print("PASS: 27,982 remains unreproduced; Phase 4B OPEN; Phase 5 LOCKED.")

if __name__ == "__main__":
    main()
