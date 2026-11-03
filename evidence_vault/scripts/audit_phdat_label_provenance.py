#!/usr/bin/env python3
"""Audit PhDat per-record phase-label mappings and provenance without promoting science status."""
from __future__ import annotations
import csv, json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "evidence_vault/datasets/phdat/raw/PhDat.json"
OUT = ROOT / "evidence_vault/forensic_reports"
JSON_OUT = OUT / "PHASE4B_PHDAT_LABEL_PROVENANCE_AUDIT.json"
CSV_OUT = OUT / "PHASE4B_PHDAT_LABEL_PROVENANCE_BY_RECORD.csv"
META_FIELDS = ("Name", "SMILES", "Source", "Figure", "Purity", "Method", "Type", "Solvent", "State")


def is_placeholder(value):
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip() or value.strip().lower() in {"not found", "unknown", "n/a", "na", "none"}
    return False


def audit_labels(parsed):
    if not isinstance(parsed, dict):
        raise ValueError("PhDat root must be a record dictionary.")
    rows = []
    state_counts = Counter()
    all_target_labels = Counter()
    malformed_pairs = []
    duplicate_source_labels = []
    duplicate_target_labels = []
    phase_keys_not_in_label_targets = []
    records_with_u_key = []
    metadata_missing = Counter()
    total_pairs = 0
    total_phase_columns = 0
    complete = incomplete = 0

    for record_id, record in parsed.items():
        if not isinstance(record, dict) or not isinstance(record.get("Data"), dict):
            raise ValueError(f"Record {record_id} lacks the expected Data object.")
        state = str(record.get("State", "UNKNOWN"))
        state_counts[state] += 1
        complete += state.lower() == "complete"
        incomplete += state.lower() == "incomplete"
        for field in META_FIELDS:
            if is_placeholder(record.get(field)):
                metadata_missing[field] += 1

        labels = record.get("Labels", [])
        valid_pairs = []
        if not isinstance(labels, list):
            malformed_pairs.append({"recordId": str(record_id), "value": repr(labels), "reason": "Labels is not a list"})
        else:
            for pair_index, pair in enumerate(labels):
                if not isinstance(pair, list) or len(pair) != 2 or not all(isinstance(x, str) for x in pair):
                    malformed_pairs.append({"recordId": str(record_id), "pairIndex": pair_index, "value": repr(pair), "reason": "Expected two-string [sourceLabel, datasetLabel] pair"})
                    continue
                valid_pairs.append((pair[0], pair[1]))
                total_pairs += 1
                all_target_labels[pair[1]] += 1

        source_counts = Counter(source for source, _ in valid_pairs)
        target_counts = Counter(target for _, target in valid_pairs)
        duplicate_sources = sorted(k for k, v in source_counts.items() if v > 1)
        duplicate_targets = sorted(k for k, v in target_counts.items() if v > 1)
        if duplicate_sources:
            duplicate_source_labels.append({"recordId": str(record_id), "labels": duplicate_sources, "pairs": valid_pairs})
        if duplicate_targets:
            duplicate_target_labels.append({"recordId": str(record_id), "labels": duplicate_targets, "pairs": valid_pairs})

        data = record["Data"]
        phase_keys = [key for key in data if key not in ("temperature_(degC)", "composition_(wt%)")]
        total_phase_columns += len(phase_keys)
        # This is deliberately diagnostic only: source diagrams may use contextual
        # aliases and coexistence labels. A mismatch is not automatically an error.
        target_tokens = set()
        for _, target in valid_pairs:
            target_tokens.update(part.strip() for part in target.split("+") if part.strip())
        unmatched_keys = []
        for key in phase_keys:
            tokens = {part.strip() for part in key.split("+") if part.strip()}
            if not tokens.issubset(target_tokens):
                unmatched_keys.append(key)
        if unmatched_keys:
            phase_keys_not_in_label_targets.append({"recordId": str(record_id), "keys": unmatched_keys})
        has_u = "U" in phase_keys
        if has_u:
            records_with_u_key.append(str(record_id))

        rows.append({
            "record_id": str(record_id),
            "name": record.get("Name", ""),
            "state": state,
            "source": record.get("Source", ""),
            "figure": record.get("Figure", ""),
            "method": record.get("Method", ""),
            "purity": record.get("Purity", ""),
            "type": record.get("Type", ""),
            "smiles": record.get("SMILES", ""),
            "label_pair_count": len(valid_pairs),
            "duplicate_source_label_count": len(duplicate_sources),
            "duplicate_dataset_label_count": len(duplicate_targets),
            "phase_probability_column_count": len(phase_keys),
            "phase_key_tokens_not_in_label_targets": ";".join(unmatched_keys),
            "has_unknown_U_phase_key": has_u,
            "source_or_method_metadata_missing": any(is_placeholder(record.get(k)) for k in ("Source", "Figure", "Method", "Purity")),
            "disposition": "DIAGNOSTIC_ONLY_NO_AUTOMATIC_REJECTION_OR_PROMOTION"
        })

    return {
        "auditId": "PHASE4B-PHDAT-LABEL-PROVENANCE-AUDIT",
        "recordCount": len(parsed),
        "completeRecords": complete,
        "incompleteRecords": incomplete,
        "stateCounts": dict(sorted(state_counts.items())),
        "labelPairCount": total_pairs,
        "distinctDatasetLabelStrings": len(all_target_labels),
        "datasetLabelFrequency": dict(sorted(all_target_labels.items())),
        "malformedLabelPairCount": len(malformed_pairs),
        "malformedLabelPairs": malformed_pairs,
        "recordsWithRepeatedSourceLabelMappings": len(duplicate_source_labels),
        "repeatedSourceLabelMappingExamples": duplicate_source_labels[:25],
        "recordsWithRepeatedDatasetLabelMappings": len(duplicate_target_labels),
        "repeatedDatasetLabelMappingExamples": duplicate_target_labels[:25],
        "recordsWithPhaseKeysNotFullyRepresentedByLabelTargets": len(phase_keys_not_in_label_targets),
        "phaseKeyLabelDiagnostics": phase_keys_not_in_label_targets[:50],
        "recordsWithUnknownUPhaseKey": len(records_with_u_key),
        "recordsWithUnknownUPhaseKeyIds": records_with_u_key,
        "phaseProbabilityColumnCountAcrossRecords": total_phase_columns,
        "metadataMissingOrPlaceholderCounts": dict(sorted(metadata_missing.items())),
        "perRecord": rows,
        "interpretation": [
            "Labels entries are source-label to dataset-label mappings; repeated source or target labels are surfaced, not automatically treated as invalid.",
            "Phase-key versus label-target differences are diagnostic only because coexistence labels, aliases, and source-specific mapping context require manual interpretation.",
            "A U phase indicates an unknown/unclear region in the source workflow and must not be treated as a known phase.",
            "All source values and labels are read-only; no normalization, deduplication, conversion, or scientific status promotion is performed."
        ],
        "governance": {"phase4b": "OPEN", "phase5": "LOCKED", "labValidationStatus": "NOT_LAB_VALIDATED", "engineEligibility": []}
    }


def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Expected PhDat source file missing: {SOURCE}")
    parsed = json.loads(SOURCE.read_text(encoding="utf-8-sig"))
    report = audit_labels(parsed)
    OUT.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps({k: v for k, v in report.items() if k != "perRecord"}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    fields = list(report["perRecord"][0].keys()) if report["perRecord"] else ["record_id"]
    with CSV_OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(report["perRecord"])
    print(json.dumps({k: v for k, v in report.items() if k != "perRecord"}, indent=2, ensure_ascii=False))
    return 0 if report["malformedLabelPairCount"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
