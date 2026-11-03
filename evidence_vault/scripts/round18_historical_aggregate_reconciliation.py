#!/usr/bin/env python3
"""Reconcile historical Zenodo 18961871 aggregate claims without promoting row counts to experiments."""
from __future__ import annotations
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "evidence_vault" / "datasets" / "zenodo_18961871"
REPORT = ROOT / "evidence_vault" / "forensic_reports" / "PHASE4B_ROUND18_HISTORICAL_AGGREGATE_RECONCILIATION.json"
AUTHOR_SUMMARY = {"Solution flow curves": 212, "Film thickness": 7522, "Bubble sizes": 19509, "Rheometer": 739}
ROUND5_TABLE_CLAIMS = {
    "Solution flow curves": 212, "Film thickness": 7522,
    "Bubble sizes 20min": 10000, "Bubble sizes 30min": 9509,
    "Rheometer amplitude sweep": 290, "Rheometer frequency sweep": 227,
    "Rheometer Foam D amplitude sweep": 194, "Rheometer Foam A steady yield": 90,
    "Rheometer steady shear combined": 731,
}
EXPECTED_SUMMARY_TOTAL = 27982


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def main() -> int:
    round5 = read_csv(DATA / "round5_observation_ledger.csv")
    round6 = read_csv(DATA / "round6_observation_ledger.csv")
    summary_total = sum(AUTHOR_SUMMARY.values())
    round5_claim_total = sum(ROUND5_TABLE_CLAIMS.values())
    round5_numeric_rows = sum(int(r["numeric_rows"]) for r in round5)
    round6_numeric_rows = sum(int(r["rows_with_numeric_values"]) for r in round6)
    round6_by_file: dict[str, int] = {}
    for row in round6:
        name = row["filename"]
        round6_by_file[name] = round6_by_file.get(name, 0) + int(row["rows_with_numeric_values"])

    rheometer_table_sum = sum(v for k, v in ROUND5_TABLE_CLAIMS.items() if k.startswith("Rheometer"))
    report = {
        "audit_id": "PHASE4B-ROUND18-HISTORICAL-AGGREGATE-RECONCILIATION",
        "schema_version": 1,
        "source_artifacts": ["round5_observation_ledger.csv", "round6_observation_ledger.csv",
            "PHASE4B_ROUND5_FINAL_OBSERVATION_LEDGER.md", "generate_round5_deliverables.mjs"],
        "governance": {"phase4b": "OPEN", "phase5": "LOCKED"},
        "historical_27982_claim": {
            "value": EXPECTED_SUMMARY_TOTAL, "author_summary_arithmetic": summary_total,
            "round5_table_arithmetic": round5_claim_total,
            "status": "NOT_RECONCILED_TO_ROW_LEVEL_PHYSICAL_OBSERVATION_LINEAGE"
        },
        "structural_metrics_not_physical_counts": {
            "round5_numeric_bearing_rows_sum": round5_numeric_rows,
            "round6_numeric_bearing_rows_sum": round6_numeric_rows,
            "round6_worksheet_count": len(round6), "round6_numeric_rows_by_file": round6_by_file
        },
        "findings": [
            {"id": "R18-001", "severity": "BLOCKER",
             "finding": "The historical 27,982 total is the sum of four file-level claims, but the Round-5 per-sheet table sums differently.",
             "evidence": {"author_summary_components": AUTHOR_SUMMARY, "author_summary_sum": summary_total,
                "round5_table_components": ROUND5_TABLE_CLAIMS, "round5_table_sum": round5_claim_total,
                "difference": round5_claim_total - summary_total},
             "interpretation": "Arithmetic inconsistency; neither sum is accepted as a verified physical-observation count."},
            {"id": "R18-002", "severity": "BLOCKER",
             "finding": "Round-5 per-sheet rheometer claims sum to 1,532, while the file-level claim is 739.",
             "evidence": {"round5_rheometer_table_sum": rheometer_table_sum,
                "author_summary_rheometer_claim": AUTHOR_SUMMARY["Rheometer"],
                "difference": rheometer_table_sum - AUTHOR_SUMMARY["Rheometer"],
                "round4_sheet_row_claims": {"AmpSwps_all": 290, "FrqSwps_all": 227,
                    "FoamD_AmpSwpTest": 194, "FoamA_SteadyYield": 90,
                    "SteadyShear_5": 722, "SteadyShear_1": 722}},
             "interpretation": "The combined steady-shear value 731 is not reconciled to the sheet-level values 722 + 722. No documented mapping or deduplication rule is present."},
            {"id": "R18-003", "severity": "BLOCKER",
             "finding": "Numeric-bearing rows are not the same unit as image-level bubble/film measurements or independent physical experiments.",
             "evidence": {"round5_numeric_bearing_rows_sum": round5_numeric_rows,
                "round6_numeric_bearing_rows_sum": round6_numeric_rows, "round6_worksheet_count": len(round6),
                "round6_numeric_rows_by_file": round6_by_file},
             "interpretation": "Parser-derived row metrics cannot substantiate 7,522 film-thickness or 19,509 bubble measurements without raw measurement lineage."}
        ],
        "decision": "BLOCKED_UNRESOLVED_HISTORICAL_AGGREGATE",
        "prohibited_inferences": [
            "Do not label numeric-bearing spreadsheet rows as independent experiments.",
            "Do not treat formula-derived bubble radii or film summaries as independent raw measurements.",
            "Do not silently replace 27,982 with 28,775 or any parser-derived row count.",
            "Do not promote any engine to LAB_VALIDATED based on this reconciliation."
        ]
    }
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"decision": report["decision"], "author_summary_sum": summary_total,
        "round5_table_sum": round5_claim_total, "difference": round5_claim_total - summary_total,
        "round5_numeric_rows": round5_numeric_rows, "round6_numeric_rows": round6_numeric_rows,
        "report": str(REPORT.relative_to(ROOT))}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
