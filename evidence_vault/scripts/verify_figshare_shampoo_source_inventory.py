#!/usr/bin/env python3
"""Fail-closed check for the Figshare shampoo source metadata and ingredient crosswalk."""
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
METADATA_PATH = ROOT / "evidence_vault/datasets/figshare_25451878/official_api_metadata_2026-10-27.json"
SURFACTANT_CSV = ROOT / "evidence_vault/datasets/figshare_25451878/BASF_Surfactants_Information.csv"
CROSSWALK_CSV = ROOT / "evidence_vault/datasets/figshare_25451878/ingredient_identity_crosswalk.csv"
EXPECTED_COMPONENTS = {
    "Texapon SB 3 KC", "Plantapon ACG 50", "Plantapon LC 7", "Plantacare 818",
    "Plantacare 2000", "Dehyton MC", "Dehyton PK 45", "Dehyton ML",
    "Dehyton AB 30", "Plantapon Amino SCG-L", "Plantapon Amino KG-L",
    "Dehyquart A-CA", "Luviquat Excellence", "Dehyquart CC6",
    "Dehyquart CC7 Benz", "Salcare Super 7", "Arlypon TT", "Arlypon F",
}


def validate(root: Path = ROOT) -> dict:
    errors: list[str] = []
    metadata = json.loads((root / METADATA_PATH.relative_to(ROOT)).read_text(encoding="utf-8"))
    if metadata.get("record_id") != 25451878 or metadata.get("api_http_status") != 200:
        errors.append("official JSON Figshare API record identity/status is invalid")
    if metadata.get("license", {}).get("name") != "CC0":
        errors.append("official JSON record license is not CC0")
    main_files = metadata.get("files", [])
    if len(main_files) != 1 or main_files[0].get("id") != 45187180:
        errors.append("official JSON record file identity is invalid")
    supplements = {item.get("record_id"): item for item in metadata.get("supplements", [])}
    expected_supplements = {
        25451926: (45187306, "BASF Surfactants Information.csv"),
        25451929: (45187309, "BASF Formulation Ingredient Structures.pptx"),
    }
    for record_id, (file_id, file_name) in expected_supplements.items():
        item = supplements.get(record_id)
        if not item or item.get("license") != "CC0":
            errors.append(f"Figshare supplement {record_id} or CC0 license is missing")
            continue
        file_record = item.get("file", {})
        if file_record.get("id") != file_id or file_record.get("name") != file_name:
            errors.append(f"Figshare supplement {record_id} file identity is invalid")

    csv_file_record = supplements.get(25451926, {}).get("file", {})
    repo_copy = supplements.get(25451926, {}).get("repository_copy", {})
    raw = (root / SURFACTANT_CSV.relative_to(ROOT)).read_bytes()
    actual = {
        "size_bytes": len(raw),
        "md5": hashlib.md5(raw).hexdigest(),
        "sha256": hashlib.sha256(raw).hexdigest(),
    }
    for field in ("size_bytes", "md5", "sha256"):
        if actual[field] != repo_copy.get(field):
            errors.append(f"pinned surfactant CSV {field} mismatch: {actual[field]}")

    with (root / SURFACTANT_CSV.relative_to(ROOT)).open("r", encoding="utf-8-sig", newline="") as handle:
        surfactants = list(csv.DictReader(handle))
    if len(surfactants) != 12:
        errors.append(f"expected 12 surfactant product records; found {len(surfactants)}")

    with (root / CROSSWALK_CSV.relative_to(ROOT)).open("r", encoding="utf-8-sig", newline="") as handle:
        crosswalk = list(csv.DictReader(handle))
    component_names = {row.get("dataset_component", "").strip() for row in crosswalk}
    if len(crosswalk) != 18 or component_names != EXPECTED_COMPONENTS:
        errors.append("ingredient crosswalk must contain the 18 unique source component names")
    normalized_trade_names = {row.get("source_trade_name", "").replace("®", "").strip() for row in surfactants}
    crosswalk_trades = {row.get("source_trade_name", "").replace("®", "").strip() for row in crosswalk}
    if normalized_trade_names != normalized_trade_names.intersection(crosswalk_trades):
        errors.append("all 12 official surfactant products must appear in the identity crosswalk")

    exact_inci_matches = sum(bool(row.get("application_exact_inci_candidates", "").strip()) for row in crosswalk)
    unmatched = sum(not row.get("application_exact_inci_candidates", "").strip() for row in crosswalk)
    if (exact_inci_matches, unmatched) != (4, 14):
        errors.append(f"expected 4 exact app INCI candidates and 14 unmatched components; found {(exact_inci_matches, unmatched)}")
    if any(row.get("direct_formula_prediction_pair_status") != "NOT_ESTABLISHED" for row in crosswalk):
        errors.append("ingredient mapping must not promote any formula prediction pair")
    if not any(row.get("grade_comparison") == "APP_GRADE_OUTSIDE_SOURCE_ACTIVE_RANGE" for row in crosswalk):
        errors.append("known Sodium Cocoamphoacetate grade mismatch is not recorded")

    return {
        "validation": "PASS" if not errors else "FAIL",
        "official_api_records": 3,
        "pinned_surfactant_products": len(surfactants),
        "crosswalk_components": len(crosswalk),
        "exact_inci_candidates": exact_inci_matches,
        "unmatched_components": unmatched,
        "prediction_pairs_established": 0,
        "pinned_surfactant_file": actual,
        "errors": errors,
    }


def main() -> int:
    report = validate()
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["validation"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
