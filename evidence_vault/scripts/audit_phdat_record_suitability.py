#!/usr/bin/env python3
"""Classify PhDat records for scoped exploratory phase-behavior research.

This is a conservative curation aid, not a scientific-validity or cleaning-performance gate.
It reads the raw source and existing per-record audit exports without modifying source data.
"""
from __future__ import annotations
import csv, hashlib, json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "evidence_vault/datasets/phdat/raw/PhDat.json"
LABEL_CSV = ROOT / "evidence_vault/forensic_reports/PHASE4B_PHDAT_LABEL_PROVENANCE_BY_RECORD.csv"
IDENTITY_CSV = ROOT / "evidence_vault/forensic_reports/PHASE4B_PHDAT_IDENTITY_CANDIDATES_BY_RECORD.csv"
OUT = ROOT / "evidence_vault/forensic_reports"
CSV_OUT = OUT / "PHASE4B_PHDAT_RECORD_SUITABILITY_BY_RECORD.csv"
JSON_OUT = OUT / "PHASE4B_PHDAT_RECORD_SUITABILITY_AUDIT.json"
MD_OUT = OUT / "PHASE4B_PHDAT_RECORD_SUITABILITY_AUDIT.md"
PLACEHOLDERS = {"", "not found", "unknown", "n/a", "na", "none", "null", "not stated"}

def missing(value):
    return str(value or "").strip().casefold() in PLACEHOLDERS

def classify_record(record_id, raw, label, identity, duplicate_smiles=False):
    reasons = []
    state = str(raw.get("State") or "unknown").strip().casefold()
    source_ok = not missing(raw.get("Source"))
    figure_ok = not missing(raw.get("Figure"))
    method_ok = not missing(raw.get("Method"))
    purity_ok = not missing(raw.get("Purity"))
    smiles_ok = not missing(raw.get("SMILES"))
    unknown_phase = "U" in (raw.get("Data") or {})
    phase_mismatch = bool(str(label.get("phase_key_tokens_not_in_label_targets") or "").strip())
    if state != "complete": reasons.append("SOURCE_RECORD_MARKED_INCOMPLETE")
    if not source_ok: reasons.append("SOURCE_CITATION_MISSING")
    if not figure_ok: reasons.append("FIGURE_REFERENCE_MISSING")
    if not method_ok: reasons.append("METHOD_MISSING_OR_PLACEHOLDER")
    if not purity_ok: reasons.append("PURITY_MISSING_OR_PLACEHOLDER")
    if not smiles_ok: reasons.append("SMILES_MISSING")
    if unknown_phase: reasons.append("UNKNOWN_U_PHASE_KEY_PRESENT")
    if phase_mismatch: reasons.append("PHASE_KEY_LABEL_MAPPING_NEEDS_REVIEW")
    if duplicate_smiles: reasons.append("DUPLICATE_SMILES_GROUP_REQUIRES_SOURCE_LEVEL_REVIEW")
    if state == "complete" and source_ok and figure_ok and method_ok and purity_ok and smiles_ok and not unknown_phase and not phase_mismatch:
        tier = "A_TRACEABLE_EXPLORATORY_CANDIDATE"
        rationale = "Required source/method/purity fields present; record marked complete; no U key or unresolved key/label diagnostic. Still requires figure-level phase-label review and is not validation data."
    elif state == "complete" and source_ok and figure_ok and smiles_ok:
        tier = "B_REQUIRES_TARGETED_REVIEW"
        rationale = "Record has a source/figure and chemical string, but at least one metadata, completeness, unknown-phase, or label-mapping condition blocks Tier A."
    else:
        tier = "C_INCOMPLETE_OR_INSUFFICIENT_PROVENANCE"
        rationale = "Record lacks minimum provenance/identity fields or is marked incomplete; quarantine from curated compatibility comparisons until reviewed."
    candidate_count = int(identity.get("exact_normalized_catalog_name_candidate_count") or 0)
    return {
        "record_id": str(record_id), "name": str(raw.get("Name") or ""),
        "state": state, "tier": tier, "rationale": rationale,
        "source": str(raw.get("Source") or ""), "figure": str(raw.get("Figure") or ""),
        "method": str(raw.get("Method") or ""), "purity": str(raw.get("Purity") or ""),
        "type": str(raw.get("Type") or ""), "solvent": str(raw.get("Solvent") or ""),
        "smiles_present": smiles_ok, "duplicate_smiles_group": bool(duplicate_smiles),
        "unknown_U_phase_key": unknown_phase,
        "phase_key_label_diagnostic": str(label.get("phase_key_tokens_not_in_label_targets") or ""),
        "repeated_source_label_count": int(label.get("duplicate_source_label_count") or 0),
        "repeated_dataset_label_count": int(label.get("duplicate_dataset_label_count") or 0),
        "exact_catalog_name_candidate_count": candidate_count,
        "identity_confirmed": False, "formula_validation_eligible": False,
        "reasons": ";".join(reasons)
    }

def run_audit(raw_records, label_rows, identity_rows):
    if not isinstance(raw_records, dict) or len(raw_records) != 143:
        raise ValueError(f"Expected 143 PhDat source records, got {len(raw_records) if isinstance(raw_records, dict) else 'non-dict'}")
    labels = {str(r["record_id"]): r for r in label_rows}
    identities = {str(r["phdat_record_id"]): r for r in identity_rows}
    smiles_to_ids = defaultdict(list)
    for rid, rec in raw_records.items():
        smiles = str(rec.get("SMILES") or "").strip()
        if smiles: smiles_to_ids[smiles].append(str(rid))
    duplicate_ids = {rid for ids in smiles_to_ids.values() if len(ids) > 1 for rid in ids}
    rows = []
    for rid, raw in raw_records.items():
        if str(rid) not in labels or str(rid) not in identities:
            raise ValueError(f"Missing per-record audit row for PhDat record {rid}")
        rows.append(classify_record(rid, raw, labels[str(rid)], identities[str(rid)], str(rid) in duplicate_ids))
    counts = Counter(r["tier"] for r in rows)
    return {
        "auditId": "PHASE4B-PHDAT-RECORD-SUITABILITY-AUDIT",
        "recordCount": len(rows), "tierCounts": dict(sorted(counts.items())),
        "duplicateSmilesGroupCount": sum(1 for ids in smiles_to_ids.values() if len(ids) > 1),
        "recordsInDuplicateSmilesGroups": len(duplicate_ids),
        "recordsWithUnknownUPhaseKey": sum(r["unknown_U_phase_key"] for r in rows),
        "recordsWithPhaseKeyLabelDiagnostics": sum(bool(r["phase_key_label_diagnostic"]) for r in rows),
        "recordsWithMissingMethod": sum(missing(r["method"]) for r in rows),
        "recordsWithMissingPurity": sum(missing(r["purity"]) for r in rows),
        "recordsWithAnyRepeatedLabelMapping": sum(bool(r["repeated_source_label_count"] or r["repeated_dataset_label_count"]) for r in rows),
        "recordsWithExactCatalogNameCandidate": sum(r["exact_catalog_name_candidate_count"] > 0 for r in rows),
        "confirmedChemicalIdentityMatches": 0, "formulaValidationEligibleRecords": 0,
        "scope": "Candidate tiers are only for curating exploratory aqueous phase-behavior/compatibility research; they do not establish physical validity, detergent cleaning performance, or model validation.",
        "tierARequirements": ["source State complete", "source citation and figure present", "method and purity not missing/placeholder", "SMILES present", "no U phase key", "no phase-key/label diagnostic"],
        "limitations": [
            "PhDat is literature-curated/digitized aqueous surfactant phase-behavior evidence, not a detergent cleaning benchmark.",
            "Duplicate SMILES are flagged but records are not merged or dropped; distinct source/figure provenance may matter.",
            "A missing U key does not prove all phase labels are correct; Tier A still needs manual source-figure review.",
            "Catalog name candidates do not prove chemical identity or commercial ingredient-grade equivalence.",
            "No source values are converted, imputed, normalized, deduplicated, or scientifically promoted."
        ],
        "governance": {"phase4b": "OPEN", "phase5": "LOCKED", "labValidationStatus": "NOT_LAB_VALIDATED", "engineEligibility": []}
    }, rows

def main():
    for path in (SOURCE, LABEL_CSV, IDENTITY_CSV):
        if not path.is_file(): raise FileNotFoundError(f"Required PhDat audit input missing: {path}")
    source_bytes = SOURCE.read_bytes()
    raw = json.loads(source_bytes.decode("utf-8-sig"))
    with LABEL_CSV.open(newline="", encoding="utf-8") as f: label_rows = list(csv.DictReader(f))
    with IDENTITY_CSV.open(newline="", encoding="utf-8") as f: identity_rows = list(csv.DictReader(f))
    report, rows = run_audit(raw, label_rows, identity_rows)
    report["sourceSha256"] = hashlib.sha256(source_bytes).hexdigest()
    OUT.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    with CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys())); writer.writeheader(); writer.writerows(rows)
    lines = [
        "# Phase 4B — PhDat per-record suitability review", "",
        f"- Source records audited: {report['recordCount']}",
        f"- Tier A traceable exploratory candidates: {report['tierCounts'].get('A_TRACEABLE_EXPLORATORY_CANDIDATE', 0)}",
        f"- Tier B targeted review required: {report['tierCounts'].get('B_REQUIRES_TARGETED_REVIEW', 0)}",
        f"- Tier C incomplete/insufficient provenance: {report['tierCounts'].get('C_INCOMPLETE_OR_INSUFFICIENT_PROVENANCE', 0)}",
        f"- Duplicate-SMILES groups / affected records: {report['duplicateSmilesGroupCount']} / {report['recordsInDuplicateSmilesGroups']}",
        f"- Records with U phase key: {report['recordsWithUnknownUPhaseKey']}",
        f"- Records with phase-key/label diagnostics: {report['recordsWithPhaseKeyLabelDiagnostics']}",
        f"- Records missing method / purity: {report['recordsWithMissingMethod']} / {report['recordsWithMissingPurity']}",
        f"- Confirmed ingredient identity matches: {report['confirmedChemicalIdentityMatches']}",
        "", "## Tier A record IDs", "",
        ", ".join(r["record_id"] for r in rows if r["tier"] == "A_TRACEABLE_EXPLORATORY_CANDIDATE"),
        "", "## Interpretation", "",
        "Tier A is a review-priority shortlist only. It is not a claim that these records are experimentally independent, correctly digitized, chemically identical to commercial detergent ingredients, or suitable for formula validation. Manual source-figure review remains required.",
        "", "Tier B records may be usable after the specific metadata/label issue in the CSV is resolved. Tier C records should remain quarantined from curated comparisons until provenance/completeness issues are addressed.",
        "", "All records and original values are retained. Duplicate SMILES are flagged, not merged. No formula-validation or LAB_VALIDATED status is granted. Phase 4B remains OPEN; Phase 5 remains LOCKED."
    ]
    MD_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
