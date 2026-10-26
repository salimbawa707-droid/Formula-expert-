#!/usr/bin/env python3
"""Summarize the bubble historical split investigation without forcing a reconciliation."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "evidence_vault/forensic_reports/PHASE4B_BUBBLE_20_30MIN_CELL_CROSSWALK.json"
OUT = ROOT / "evidence_vault/forensic_reports"
JSON_OUT = OUT / "PHASE4B_BUBBLE_HISTORICAL_SPLIT_DIAGNOSTIC.json"
MD_OUT = OUT / "PHASE4B_BUBBLE_HISTORICAL_SPLIT_DIAGNOSTIC.md"


def build_report(crosswalk):
    sheets = crosswalk["sheet_counts"]
    hypothesis = crosswalk["historical_split_column_hypothesis_search"]
    aggregate = crosswalk["aggregate"]
    observed = {name: int(stats["observed_raw_numeric_area_cells"]) for name, stats in sheets.items()}
    historical = {name: int(stats["historical_claimed_count"]) for name, stats in sheets.items()}
    diffs = {name: observed[name] - historical[name] for name in observed}
    unresolved = (
        aggregate.get("raw_numeric_area_cells") == aggregate.get("historical_aggregate_claim")
        and any(observed[name] != historical[name] for name in observed)
        and hypothesis.get("subset_count_matching_10000") == 0
        and hypothesis.get("subset_count_matching_9509") == 0
        and hypothesis.get("complementary_partition_count_matching_both") == 0
    )
    return {
        "auditId": "PHASE4B-BUBBLE-HISTORICAL-SPLIT-DIAGNOSTIC",
        "source": crosswalk["source"],
        "observedRawNumericAreaCellsBySheet": observed,
        "historicalClaimedCountsBySheet": historical,
        "observedMinusHistoricalBySheet": diffs,
        "sourceColumnNumericCounts": hypothesis["source_column_numeric_counts"],
        "subsetCountMatching10000": hypothesis["subset_count_matching_10000"],
        "subsetCountMatching9509": hypothesis["subset_count_matching_9509"],
        "complementaryPartitionCountMatchingBoth": hypothesis["complementary_partition_count_matching_both"],
        "aggregateRawNumericAreaCells": aggregate["raw_numeric_area_cells"],
        "historicalAggregateClaim": aggregate["historical_aggregate_claim"],
        "aggregateMatches": aggregate["aggregate_reproduced"],
        "disposition": "UNRESOLVED_NO_COLUMN_SUBSET_MATCH" if unresolved else "REQUIRES_REVIEW",
        "interpretation": [
            "The aggregate of 19,509 raw numeric area cells matches the historical aggregate claim, but the sheet split does not.",
            "The investigated subsets of the eight raw-area columns do not reproduce either historical per-sheet count or a complementary 10,000/9,509 partition.",
            "No source cells were reassigned, removed, imputed, or relabeled to force a match.",
            "Worksheet cells are traceable source records, not proof of independent physical experiments."
        ],
        "governance": {"phase4b": "OPEN", "phase5": "LOCKED", "physicalObservationTotalValidated": False}
    }


def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Expected source crosswalk missing: {SOURCE}")
    crosswalk = json.loads(SOURCE.read_text(encoding="utf-8"))
    report = build_report(crosswalk)
    OUT.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    observed = report["observedRawNumericAreaCellsBySheet"]
    historical = report["historicalClaimedCountsBySheet"]
    diffs = report["observedMinusHistoricalBySheet"]
    lines = [
        "# Phase 4B — Bubble Historical Split Diagnostic",
        "",
        f"Source workbook: {report['source']['filename']}",
        f"Source SHA-256: {report['source']['sha256']}",
        f"Disposition: {report['disposition']}",
        "Governance: Phase 4B OPEN; Phase 5 LOCKED.",
        "",
        "| Worksheet | Observed raw numeric area cells | Historical claim | Observed minus historical |",
        "|---|---:|---:|---:|",
    ]
    for sheet in ("20min", "30min"):
        lines.append(f"| {sheet} | {observed[sheet]} | {historical[sheet]} | {diffs[sheet]} |")
    lines += [
        "",
        f"Aggregate observed cells: {report['aggregateRawNumericAreaCells']}; historical aggregate claim: {report['historicalAggregateClaim']}; aggregate match: {report['aggregateMatches']}.",
        "",
        "## Column-subset investigation",
        "",
        f"- Subsets matching 10,000: {report['subsetCountMatching10000']}.",
        f"- Subsets matching 9,509: {report['subsetCountMatching9509']}.",
        f"- Complementary partitions matching both counts: {report['complementaryPartitionCountMatchingBoth']}.",
        "",
        "## Decision",
        "",
        "The aggregate matches, but the source sheet counts are 13,388 and 6,121 rather than 10,000 and 9,509. The eight-column subset search found no arithmetic candidates for either target or a complementary partition. The historical split therefore remains unresolved; this result does not establish the original author's counting rule or the number of independent physical experiments.",
        "",
        "No source values were changed, reallocated, dropped, imputed, or relabeled. This diagnostic does not validate physical-observation totals or unlock Phase 5.",
    ]
    MD_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
