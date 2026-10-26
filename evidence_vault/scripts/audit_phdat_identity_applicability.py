#!/usr/bin/env python3
"""Conservative PhDat-to-catalog identity/applicability audit; never auto-resolves ingredients."""
from __future__ import annotations
import csv, hashlib, json, re
from collections import Counter
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "evidence_vault/datasets/phdat/raw/PhDat.json"
CATALOG = ROOT / "src/data/universalIngredientLibrary.ts"
OUT = ROOT / "evidence_vault/forensic_reports"
JSON_OUT = OUT / "PHASE4B_PHDAT_IDENTITY_APPLICABILITY_AUDIT.json"
CSV_OUT = OUT / "PHASE4B_PHDAT_IDENTITY_CANDIDATES_BY_RECORD.csv"
MD_OUT = OUT / "PHASE4B_PHDAT_IDENTITY_APPLICABILITY_AUDIT.md"

def normalize(value):
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").casefold()).strip()

def extract_array_objects(source: str, marker: str):
    marker_at = source.find(marker)
    if marker_at < 0: raise ValueError(f"Catalog marker not found: {marker}")
    # Skip TypeScript type annotations such as `UniversalIngredient[]`; the actual
    # initializer array begins after the assignment operator.
    assignment_at = source.find("=", marker_at + len(marker))
    if assignment_at < 0: raise ValueError("Catalog assignment operator not found")
    array_at = source.find("[", assignment_at + 1)
    if array_at < 0: raise ValueError("Catalog array opening bracket not found")
    objects, i = [], array_at + 1
    while i < len(source):
        if source[i] == "]": break
        if source[i] != "{":
            i += 1
            continue
        start, depth, quote, escaped = i, 0, None, False
        while i < len(source):
            ch = source[i]
            if quote:
                if escaped: escaped = False
                elif ch == "\\": escaped = True
                elif ch == quote: quote = None
            else:
                if ch in ("'", '"') or ch == chr(96): quote = ch
                elif ch == "{": depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        objects.append(source[start:i + 1]); i += 1; break
            i += 1
        else: raise ValueError("Unterminated object in ingredient catalog")
    if not objects: raise ValueError("No ingredient objects found in catalog array")
    return objects

def field_string(block: str, key: str):
    match = re.search(r'["\']?' + re.escape(key) + r'["\']?\s*:\s*([\'"])(.*?)\1', block, re.S)
    return match.group(2) if match else ""

def parse_catalog(source: str):
    blocks = extract_array_objects(source, "export const UNIVERSAL_INGREDIENTS")
    rows = []
    for block in blocks:
        ingredient_id, name = field_string(block, "id"), field_string(block, "name")
        if not ingredient_id and not name: continue
        cas, inci, category = field_string(block, "casNumber"), field_string(block, "inciName"), field_string(block, "category")
        rows.append({"id": ingredient_id, "name": name, "casNumber": cas or None, "inciName": inci, "category": category,
                     "normalizedNames": sorted({normalize(v) for v in (name, inci, ingredient_id.replace("_", " "), ingredient_id.replace("-", " ")) if normalize(v)})})
    if not rows: raise ValueError("Ingredient catalog parsed but contained no usable records")
    return rows

def audit(parsed, catalog, catalog_text):
    if not isinstance(parsed, dict) or not parsed: raise ValueError("PhDat root must be a non-empty record dictionary")
    catalog_by_name = {}
    for item in catalog:
        for key in item["normalizedNames"]: catalog_by_name.setdefault(key, []).append(item)
    rows, states = [], Counter()
    exact_name_matches = multiple_name_candidates = incomplete = missing_smiles = missing_source = 0
    for record_id, record in parsed.items():
        if not isinstance(record, dict): raise ValueError(f"Invalid PhDat record {record_id}")
        name, smiles = str(record.get("Name") or ""), str(record.get("SMILES") or "").strip()
        state = str(record.get("State") or "UNKNOWN")
        states[state] += 1
        incomplete += state.casefold() == "incomplete"
        missing_smiles += not bool(smiles)
        missing_source += not bool(str(record.get("Source") or "").strip())
        candidates = catalog_by_name.get(normalize(name), []) if normalize(name) else []
        exact_name_matches += bool(candidates)
        multiple_name_candidates += len(candidates) > 1
        rows.append({
            "phdat_record_id": str(record_id), "phdat_name": name, "phdat_state": state,
            "phdat_smiles_present": bool(smiles), "phdat_source": str(record.get("Source") or ""),
            "phdat_figure": str(record.get("Figure") or ""), "phdat_method": str(record.get("Method") or ""),
            "phdat_purity": str(record.get("Purity") or ""),
            "exact_normalized_catalog_name_candidate_count": len(candidates),
            "candidate_catalog_ids": ";".join(item["id"] for item in candidates),
            "candidate_catalog_names": ";".join(item["name"] for item in candidates),
            "candidate_catalog_cas_numbers": ";".join(item["casNumber"] or "" for item in candidates),
            "candidate_catalog_categories": ";".join(item["category"] for item in candidates),
            "identity_disposition": "NAME_ONLY_CANDIDATE_REQUIRES_MANUAL_IDENTITY_REVIEW" if candidates else "NO_EXACT_NAME_CANDIDATE",
            "automatic_identity_mapping": False, "formula_validation_eligible": False})
    cas_coverage = sum(bool(item["casNumber"]) for item in catalog)
    return {
        "auditId": "PHASE4B-PHDAT-IDENTITY-APPLICABILITY-AUDIT", "phdatRecordCount": len(rows),
        "catalogRecordCount": len(catalog), "catalogRecordsWithCasNumber": cas_coverage,
        "catalogCasCoverageFraction": cas_coverage / len(catalog) if catalog else None,
        "catalogSchemaHasSmilesField": bool(re.search(r"smiles\??\s*:", catalog_text, re.I)),
        "phdatRecordsWithSmiles": sum(bool(row["phdat_smiles_present"]) for row in rows),
        "phdatRecordsMissingSmiles": missing_smiles, "stateCounts": dict(sorted(states.items())),
        "incompleteRecordCount": incomplete, "recordsMissingSourceCitation": missing_source,
        "recordsWithExactNormalizedNameCandidate": exact_name_matches,
        "recordsWithMultipleNameCandidates": multiple_name_candidates,
        "nameOnlyCandidateCount": sum(row["exact_normalized_catalog_name_candidate_count"] > 0 for row in rows),
        "confirmedChemicalIdentityMatches": 0, "automaticMappingsCreated": 0, "formulaValidationEligibleRecords": 0,
        "identityJoinLimitation": "PhDat records provide names and SMILES, while the ingredient catalog exposes CAS/name/INCI but no catalog SMILES field. There is no common stable identifier in this audit; exact normalized name is only a candidate, not identity proof.",
        "applicability": "Aqueous surfactant phase behavior only; not detergent cleaning, soil removal, hard-water chelation, foam lifetime, pH, or formula-accuracy validation.",
        "sourceValuesChanged": False, "sourceValuesImputed": False, "recordsDeduplicated": False,
        "governance": {"phase4b": "OPEN", "phase5": "LOCKED", "labValidationStatus": "NOT_LAB_VALIDATED", "engineEligibility": []},
        "perRecordCsv": CSV_OUT.name}, rows

def main():
    if not SOURCE.is_file(): raise FileNotFoundError(f"PhDat raw source missing: {SOURCE}; run acquire_phdat_dataset.py first")
    if not CATALOG.is_file(): raise FileNotFoundError(f"Ingredient catalog missing: {CATALOG}")
    source_bytes = SOURCE.read_bytes()
    parsed = json.loads(source_bytes.decode("utf-8-sig"))
    catalog_text = CATALOG.read_text(encoding="utf-8")
    catalog = parse_catalog(catalog_text)
    report, rows = audit(parsed, catalog, catalog_text)
    report["sourceSha256"] = hashlib.sha256(source_bytes).hexdigest()
    report["catalogSha256"] = hashlib.sha256(catalog_text.encode("utf-8")).hexdigest()
    OUT.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    with CSV_OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys())); writer.writeheader(); writer.writerows(rows)
    lines = ["# Phase 4B — PhDat identity and applicability audit", "",
        f"- PhDat source records: {report['phdatRecordCount']}",
        f"- Catalog records parsed: {report['catalogRecordCount']}",
        f"- Catalog CAS coverage: {report['catalogRecordsWithCasNumber']}/{report['catalogRecordCount']}",
        f"- Records with exact normalized-name candidates: {report['recordsWithExactNormalizedNameCandidate']}",
        "- Confirmed chemical identity matches: 0",
        "- Automatic mappings / formula-validation eligible records: 0 / 0", "",
        "## Interpretation", "", report["identityJoinLimitation"], "",
        "Name-only candidates are leads for manual review, not verified chemical identities. CAS numbers, commercial grade, purity, and ingredient formulation must not be inferred from a matching name. PhDat SMILES cannot be compared structurally to this catalog because the catalog has no SMILES field in its declared schema.", "",
        report["applicability"], "",
        "No source values were changed, imputed, converted, or deduplicated. Phase 4B remains OPEN; Phase 5 remains LOCKED."]
    MD_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0

if __name__ == "__main__": raise SystemExit(main())
