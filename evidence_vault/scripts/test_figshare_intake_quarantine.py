#!/usr/bin/env python3
"""Regression guard for the Figshare shampoo dataset intake classification.

This validates the committed intake report only. It does NOT verify the raw binary,
does NOT approve scientific applicability, and must never unlock a laundry engine.
"""
import json
from pathlib import Path

REPORT = Path("evidence_vault/datasets/figshare_25451878_intake_audit.json")
EXPECTED = {
    "size_bytes": 1464630,
    "md5": "8898e7b460c71e334f6ece5daebc6a6e",
    "sha256": "3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd",
}

def main() -> int:
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    integrity = report["binary_integrity"]
    assert integrity["status"] == "PASS"
    assert integrity["exact_match"] is True
    for key, value in EXPECTED.items():
        assert integrity[key] == value, (key, integrity.get(key), value)
    assert report["parse_validation"]["status"] == "PASS"
    assert report["parse_validation"]["record_count"] == 812
    assert report["parse_validation"]["duplicate_ids"] == 0
    applicability = report["scientific_applicability"]
    assert "does not directly validate laundry detergent" in applicability["not_supported"].lower()
    assert "reference-only" in applicability["potential_use"].lower()
    assert "Do not ingest as validated engine constants" in applicability["release_policy"]
    assert report["repository_archival_status"] == "NOT_YET_ARCHIVED_AS_RAW_BINARY"
    assert report["ci_gate_status"].startswith("WILL REMAIN BLOCKED")
    assert report["phase4b"] == "OPEN"
    assert report["phase5"] == "LOCKED"
    print("PASS: Figshare intake report is internally consistent and remains quarantined/reference-only.")
    print("NOTE: This is not raw-binary verification; the separate checksum gate must stay enabled.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
