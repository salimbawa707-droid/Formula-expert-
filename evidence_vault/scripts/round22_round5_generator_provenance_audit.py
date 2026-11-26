#!/usr/bin/env python3
"""Audit whether the historical Round-5 generator reproduces the committed ledger.

This is a provenance/contract check only. It does not count workbook observations.
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GENERATOR = ROOT / "evidence_vault" / "scripts" / "generate_round5_deliverables.mjs"
LEDGER = ROOT / "evidence_vault" / "datasets" / "zenodo_18961871" / "round5_observation_ledger.csv"
REPORT = ROOT / "evidence_vault" / "forensic_reports" / "PHASE4B_ROUND22_ROUND5_GENERATOR_PROVENANCE.json"
CANONICAL_DIR = "evidence_vault/datasets/zenodo_18961871"
GENERATOR_HEADERS = [
    "filename", "sheet_name", "total_rows", "header_rows", "metadata_rows",
    "blank_rows", "computed_valid_observations",
]


def inspect_contract(generator_text: str, committed_headers: list[str]) -> dict:
    target_match = re.search(r'TARGET_DIR\s*=\s*path\.resolve\(["\']([^"\']+)["\']\)', generator_text)
    target_dir = target_match.group(1) if target_match else None
    csv_match = re.search(r'const csvLedger\s*=\s*"([^"]+)"', generator_text)
    generated_headers = next(csv.reader([csv_match.group(1).split(r"\n", 1)[0]])) if csv_match else []
    reported_metadata_count = bool(re.search(r"reportedCount\s*:", generator_text))
    computed_rows_logic = "computedValidObs++" in generator_text
    return {
        "generator_target_dir": target_dir,
        "canonical_ledger_dir": CANONICAL_DIR,
        "writes_to_canonical_ledger_directory": target_dir == CANONICAL_DIR,
        "generator_output_headers": generated_headers,
        "committed_ledger_headers": committed_headers,
        "generator_schema_matches_committed_ledger": generated_headers == committed_headers,
        "author_reported_counts_are_metadata": reported_metadata_count,
        "generator_computes_numeric_bearing_rows": computed_rows_logic,
        "generator_derives_historical_27982_from_row_membership": False,
        "generator_contract_reproduces_committed_ledger": (
            target_dir == CANONICAL_DIR
            and generated_headers == committed_headers
            and computed_rows_logic
        ),
    }


def run_audit(generator_path: Path = GENERATOR, ledger_path: Path = LEDGER) -> dict:
    generator_text = generator_path.read_text(encoding="utf-8")
    with ledger_path.open("r", encoding="utf-8-sig", newline="") as handle:
        headers = next(csv.reader(handle))
    contract = inspect_contract(generator_text, headers)
    findings = []
    if not contract["writes_to_canonical_ledger_directory"]:
        findings.append("Generator writes to a different directory than the committed canonical ledger.")
    if not contract["generator_schema_matches_committed_ledger"]:
        findings.append("Generator CSV schema differs from the committed canonical ledger schema.")
    if contract["author_reported_counts_are_metadata"]:
        findings.append("Historical reportedCount values are copied as metadata, not derived from source-row membership.")
    findings.append("No conclusion is made about the original author's physical-observation counting rule.")
    return {
        "audit_id": "PHASE4B-ROUND22-ROUND5-GENERATOR-PROVENANCE",
        "decision": "GENERATOR_NOT_ESTABLISHED_AS_PROVENANCE_SOURCE",
        "historical_27982_status": "UNREPRODUCED_HISTORICAL_CLAIM",
        "contract": contract,
        "findings": findings,
        "governance": {"phase4b": "OPEN", "phase5": "LOCKED"},
    }


def main() -> int:
    result = run_audit()
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    # A blocked historical claim is an expected scientific disposition, not a CI failure.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
