#!/usr/bin/env python3
"""Fail-closed audit for evidence-vault source license claims."""
import csv
from pathlib import Path

REGISTER = Path("evidence_vault/datasets/source-register.csv")
EXPECTED_ZENODO = {
    "SRC-ZEN-18961871-SOLFLOW",
    "SRC-ZEN-18961871-RHEO",
    "SRC-ZEN-18961871-BUBBLE",
    "SRC-ZEN-18961871-FILM",
}
EXPECTED_SURFPRO = "SRC-SURFPRO-15861809"
ZENODO_URL = "https://zenodo.org/records/18961871"


def audit(rows):
    errors = []
    by_id = {row["source_id"]: row for row in rows}
    for source_id in sorted(EXPECTED_ZENODO):
        row = by_id.get(source_id)
        if row is None:
            errors.append(f"missing source record: {source_id}")
            continue
        license_status = row["license_status"]
        if row["source"] != ZENODO_URL:
            errors.append(f"{source_id}: official Zenodo record URL is required for license verification")
        if "CC-BY-4.0_CONFIRMED_OFFICIAL_ZENODO_RECORD" not in license_status:
            errors.append(f"{source_id}: official Zenodo CC BY 4.0 license evidence is missing")
        if "CC_BY_4.0_LICENSE_VERIFIED" not in row["status"]:
            errors.append(f"{source_id}: archived source must retain explicit CC BY 4.0 license-verification state")
    surfpro = by_id.get(EXPECTED_SURFPRO)
    if surfpro is None:
        errors.append(f"missing source record: {EXPECTED_SURFPRO}")
    else:
        if "CC-BY-NC-SA-4.0" not in surfpro["license_status"]:
            errors.append("SURFPRO repository non-commercial license must remain visible")
        if "DO_NOT_INGEST_IN_COMMERCIAL_PRODUCT" not in surfpro["status"]:
            errors.append("SURFPRO must remain blocked from commercial product ingestion")
    return errors


def main():
    with REGISTER.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    errors = audit(rows)
    print({"status": "PASS" if not errors else "FAIL", "rows": len(rows), "errors": errors})
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
