#!/usr/bin/env python3
"""Conservative per-record PhDat readiness review; never promotes scientific status."""
from __future__ import annotations
import csv, hashlib, json, math
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "evidence_vault/datasets/phdat/raw/PhDat.json"
LABEL_CSV = ROOT / "evidence_vault/forensic_reports/PHASE4B_PHDAT_LABEL_PROVENANCE_BY_RECORD.csv"
IDENTITY_JSON = ROOT / "evidence_vault/forensic_reports/PHASE4B_PHDAT_IDENTITY_APPLICABILITY_AUDIT.json"
OUT = ROOT / "evidence_vault/forensic_reports"
JSON_OUT = OUT / "PHASE4B_PHDAT_COMPATIBILITY_READINESS_AUDIT.json"
CSV_OUT = OUT / "PHASE4B_PHDAT_COMPATIBILITY_READINESS_BY_RECORD.csv"
MD_OUT = OUT / "PHASE4B_PHDAT_COMPATIBILITY_READINESS_AUDIT.md"
PLACEHOLDERS = {"", "not found", "unknown", "n/a", "na", "none", "null"}

def missing(value):
    return value is None or (isinstance(value, str) and value.strip().casefold() in PLACEHOLDERS)

def parse_array(value):
    if isinstance(value, str):
        try: value = json.loads(value)
        except (json.JSONDecodeError, TypeError): return None
    return value if isinstance(value, list) else None

def audit(parsed, label_rows, identity_report=None, source_sha256=None):
    if not isinstance(parsed, dict) or not parsed:
        raise ValueError("PhDat root must be a non-empty record dictionary")
    labels_by_id = {str(row["record_id"]): row for row in label_rows}
    if set(map(str, parsed)) != set(labels_by_id):
        raise ValueError("PhDat IDs do not match the per-record label audit")
    smiles_map = defaultdict(list)
    for rid, rec in parsed.items():
        smiles = str(rec.get("SMILES") or "").strip()
        if smiles: smiles_map[smiles].append(str(rid))
    duplicate_groups = {s: sorted(ids, key=int) for s, ids in smiles_map.items() if len(ids) > 1}
    duplicate_by_id = {}
    for index, (smiles, ids) in enumerate(sorted(duplicate_groups.items(), key=lambda x: min(map(int, x[1]))), 1):
        for rid in ids: duplicate_by_id[rid] = (f"SMILES-DUP-{index:02d}", ids)
    rows = []
    for rid_raw, rec in sorted(parsed.items(), key=lambda x: int(x[0])):
        rid = str(rid_raw); lab = labels_by_id[rid]
        state = str(rec.get("State") or "UNKNOWN").strip().casefold()
        name = str(rec.get("Name") or ""); smiles = str(rec.get("SMILES") or "").strip()
        source = str(rec.get("Source") or ""); figure = str(rec.get("Figure") or "")
        method = str(rec.get("Method") or ""); purity = str(rec.get("Purity") or "")
        data = rec.get("Data"); arrays = {}; array_error = not isinstance(data, dict) or not data
        if isinstance(data, dict):
            for key, value in data.items():
                arr = parse_array(value)
                if arr is None: array_error = True; break
                arrays[str(key)] = arr
        lengths = {len(a) for a in arrays.values()}
        if not arrays or len(lengths) != 1: array_error = True
        point_count = next(iter(lengths)) if len(lengths) == 1 else 0
        nonnumeric = sum(1 for arr in arrays.values() for v in arr
                         if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v))
        if nonnumeric: array_error = True
        dup_group, dup_ids = duplicate_by_id.get(rid, ("", []))
        has_u = str(lab.get("has_unknown_U_phase_key", "")).casefold() == "true"
        repeated_source = int(lab.get("duplicate_source_label_count") or 0) > 0
        repeated_target = int(lab.get("duplicate_dataset_label_count") or 0) > 0
        unmatched = str(lab.get("phase_key_tokens_not_fully_represented", lab.get("phase_key_tokens_not_in_label_targets", "")) or "")
        pairs = int(lab.get("label_pair_count") or 0)
        method_missing, purity_missing = missing(method), missing(purity)
        core_missing = missing(source) or missing(figure) or missing(smiles)
        if state != "complete" or core_missing or array_error or pairs == 0:
            tier = "HOLD_INCOMPLETE_OR_UNTRACEABLE_SOURCE_RECORD"
        elif not method_missing and not purity_missing and not has_u and not repeated_source and not repeated_target and not unmatched:
            tier = "PRIORITY_CANDIDATE_FOR_MANUAL_PHASE_LABEL_REVIEW"
        else:
            tier = "EXPLORATORY_CANDIDATE_WITH_EXPLICIT_QUALIFIERS"
        flags = []
        if state != "complete": flags.append("source marks record incomplete")
        if core_missing: flags.append("missing source, figure, or SMILES trace")
        if array_error: flags.append("invalid, nonnumeric, or length-mismatched arrays")
        if method_missing: flags.append("method missing or placeholder")
        if purity_missing: flags.append("purity missing or placeholder")
        if has_u: flags.append("contains U unknown/unclear phase key; U is not a known phase")
        if repeated_source: flags.append("repeated source-label mapping needs contextual review")
        if repeated_target: flags.append("repeated dataset-label mapping needs contextual review")
        if unmatched: flags.append("phase-key/label mismatch diagnostic; not automatic error")
        if dup_group: flags.append("duplicate exact SMILES; retain separate source/figure records")
        rows.append({
            "record_id": rid, "name": name, "state": state, "source": source, "figure": figure,
            "method": method, "purity": purity, "type": str(rec.get("Type") or ""),
            "solvent": str(rec.get("Solvent") or ""), "smiles": smiles,
            "duplicate_smiles_group_id": dup_group, "duplicate_smiles_record_ids": ";".join(dup_ids),
            "data_point_count_per_array": point_count, "array_integrity": "PASS" if not array_error else "FAIL",
            "method_missing": method_missing, "purity_missing": purity_missing,
            "has_unknown_U_phase_key": has_u, "repeated_source_label_mapping": repeated_source,
            "repeated_dataset_label_mapping": repeated_target, "phase_key_label_diagnostic": unmatched,
            "label_pair_count": pairs, "record_readiness_tier": tier, "review_flags": " | ".join(flags),
            "allowed_scope": "exploratory aqueous surfactant phase behavior only",
            "approved_for_formula_validation": False
        })
    tiers = Counter(r["record_readiness_tier"] for r in rows)
    duplicate_details = []
    for i, (smiles, ids) in enumerate(sorted(duplicate_groups.items(), key=lambda x: min(map(int, x[1]))), 1):
        duplicate_details.append({"groupId": f"SMILES-DUP-{i:02d}", "recordIds": ids, "smiles": smiles,
          "records": [{"recordId": rid, "name": parsed[rid].get("Name"), "state": parsed[rid].get("State"),
                       "source": parsed[rid].get("Source"), "figure": parsed[rid].get("Figure"),
                       "method": parsed[rid].get("Method"), "purity": parsed[rid].get("Purity")} for rid in ids]})
    summary = {
        "auditId": "PHASE4B-PHDAT-COMPATIBILITY-READINESS-AUDIT", "recordCount": len(rows),
        "recordTierCounts": dict(sorted(tiers.items())),
        "completeRecords": sum(r["state"] == "complete" for r in rows),
        "incompleteRecords": sum(r["state"] != "complete" for r in rows),
        "recordsMissingMethod": sum(r["method_missing"] for r in rows),
        "recordsMissingPurity": sum(r["purity_missing"] for r in rows),
        "recordsWithBothMethodAndPurity": sum(not r["method_missing"] and not r["purity_missing"] for r in rows),
        "recordsWithUnknownUPhaseKey": sum(r["has_unknown_U_phase_key"] for r in rows),
        "recordsWithRepeatedSourceLabelMapping": sum(r["repeated_source_label_mapping"] for r in rows),
        "recordsWithRepeatedDatasetLabelMapping": sum(r["repeated_dataset_label_mapping"] for r in rows),
        "recordsWithPhaseKeyLabelDiagnostics": sum(bool(r["phase_key_label_diagnostic"]) for r in rows),
        "exactDuplicateSmilesGroupCount": len(duplicate_groups),
        "recordsInExactDuplicateSmilesGroups": sum(len(ids) for ids in duplicate_groups.values()),
        "duplicateSmilesGroups": duplicate_details,
        "recordsWithArrayIntegrityFailure": sum(r["array_integrity"] != "PASS" for r in rows),
        "sourceSha256": source_sha256, "catalogSha256": (identity_report or {}).get("catalogSha256"),
        "identityJoin": {"catalogHasSmilesField": (identity_report or {}).get("catalogSchemaHasSmilesField"),
          "exactNormalizedNameCandidates": (identity_report or {}).get("recordsWithExactNormalizedNameCandidate"),
          "confirmedChemicalIdentityMatches": 0, "automaticMappings": 0},
        "interpretation": [
          "Priority candidate means suitable for manual review before exploratory phase-behavior research, not approved or validated data.",
          "Exploratory candidates retain method, purity, and phase-label qualifiers; U remains unknown.",
          "Incomplete records are held from primary phase-boundary interpretation until source-specific gaps are resolved.",
          "Exact duplicate SMILES do not justify deduplication or pooling; preserve source, figure, and completion status.",
          "Phase-key/label differences are diagnostics because source aliases and coexistence labels require manual interpretation.",
          "No record is approved for detergent formula validation, cleaning performance, foam, pH, hard-water chelation, or predictive-accuracy claims."
        ],
        "governance": {"phase4b": "OPEN", "phase5": "LOCKED", "labValidationStatus": "NOT_LAB_VALIDATED", "engineEligibility": []},
        "perRecordCsv": CSV_OUT.name
    }
    return summary, rows

def main():
    for path in (SOURCE, LABEL_CSV):
        if not path.is_file(): raise FileNotFoundError(f"Required input missing: {path}")
    source_bytes = SOURCE.read_bytes()
    parsed = json.loads(source_bytes.decode("utf-8-sig"))
    with LABEL_CSV.open(newline="", encoding="utf-8") as handle: label_rows = list(csv.DictReader(handle))
    identity = json.loads(IDENTITY_JSON.read_text(encoding="utf-8")) if IDENTITY_JSON.is_file() else {}
    summary, rows = audit(parsed, label_rows, identity, hashlib.sha256(source_bytes).hexdigest())
    OUT.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    with CSV_OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
    priority_ids = [r["record_id"] for r in rows if r["record_readiness_tier"] == "PRIORITY_CANDIDATE_FOR_MANUAL_PHASE_LABEL_REVIEW"]
    dup_lines = []
    for group in summary["duplicateSmilesGroups"]:
        detail = ", ".join(f"{r['recordId']} ({r['name']}; {r['state']}; {r['source']}; {r['figure']})" for r in group["records"])
        dup_lines.append(f"- **{group['groupId']}** records {', '.join(group['recordIds'])}: {detail}. Keep separate; do not pool without source-level review.")
    lines = [
      "# Phase 4B — PhDat per-record compatibility-readiness review", "",
      "This review identifies records for manual review before exploratory aqueous phase-behavior research. It is not scientific validation or formula eligibility.", "",
      f"- Records: {summary['recordCount']}; complete: {summary['completeRecords']}; incomplete: {summary['incompleteRecords']}.",
      f"- Priority manual-review candidates: {len(priority_ids)}; IDs: {', '.join(priority_ids) or 'none'}.",
      f"- Exploratory candidates with qualifiers: {summary['recordTierCounts'].get('EXPLORATORY_CANDIDATE_WITH_EXPLICIT_QUALIFIERS', 0)}.",
      f"- Held incomplete/untraceable records: {summary['recordTierCounts'].get('HOLD_INCOMPLETE_OR_UNTRACEABLE_SOURCE_RECORD', 0)}.",
      f"- Method missing: {summary['recordsMissingMethod']}; purity missing: {summary['recordsMissingPurity']}; records with U key: {summary['recordsWithUnknownUPhaseKey']}.",
      f"- Repeated source-label mappings: {summary['recordsWithRepeatedSourceLabelMapping']}; repeated dataset-label mappings: {summary['recordsWithRepeatedDatasetLabelMapping']}; phase-key/label diagnostics: {summary['recordsWithPhaseKeyLabelDiagnostics']}.",
      f"- Duplicate exact-SMILES groups: {summary['exactDuplicateSmilesGroupCount']} covering {summary['recordsInExactDuplicateSmilesGroups']} records; array integrity failures: {summary['recordsWithArrayIntegrityFailure']}.",
      "", "## Duplicate-SMILES groups", "", *dup_lines, "",
      "## Tier rules", "",
      "- Priority candidate: complete, traceable source/figure/SMILES, aligned finite numeric arrays, method and purity present, no U key, and no repeated or token-unmatched phase-label diagnostic. Still requires human review.",
      "- Exploratory with qualifiers: complete and traceable arrays, but method/purity is missing or label diagnostics exist. U is always unknown, not a known phase.",
      "- Hold: source marks record incomplete or core traceability, label pairs, or array integrity fails.",
      "- Duplicate SMILES is a review signal, not a deduplication rule; source/figure records remain separate.",
      "", "## Chemical identity and scope", "",
      f"- Catalog SMILES field: {summary['identityJoin']['catalogHasSmilesField']}; exact normalized name candidates: {summary['identityJoin']['exactNormalizedNameCandidates']}; confirmed identity joins: 0.",
      "- No PhDat record is mapped to a commercial ingredient. This dataset does not validate detergency, soil removal, hard-water chelation, foam lifetime, pH, Cleaning Score, or formula accuracy.",
      "- Source values, labels, metadata, and duplicate records are not changed, imputed, converted, or deduplicated.",
      "", "Phase 4B remains OPEN; Phase 5 remains LOCKED; no LAB_VALIDATED promotion."
    ]
    MD_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0 if summary["recordsWithArrayIntegrityFailure"] == 0 else 1

if __name__ == "__main__":
    raise SystemExit(main())
