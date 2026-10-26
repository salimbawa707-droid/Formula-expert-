#!/usr/bin/env python3
"""Acquire and audit official PhDat phase-behavior data; never claim detergent validation."""
from __future__ import annotations
import hashlib, json, re, time, urllib.error, urllib.request, zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "evidence_vault/datasets/phdat"
REPORTS = ROOT / "evidence_vault/forensic_reports"
ARTICLE_ID = 29071202
API_URL = f"https://api.figshare.com/v2/articles/{ARTICLE_ID}"
MAX_META = 10 * 1024 * 1024
MAX_FILE = 150 * 1024 * 1024


def digest(data: bytes, algorithm="sha256"):
    return hashlib.new(algorithm, data).hexdigest()


def fetch(url: str, limit: int) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "DetergentFormulaExpert-Phase4B/1.0"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                data = response.read(limit + 1)
            if len(data) > limit:
                raise ValueError(f"Payload exceeds {limit} byte limit: {url}")
            return data
        except urllib.error.HTTPError as exc:
            if exc.code not in (408, 425, 429, 500, 502, 503, 504) or attempt == 4:
                raise
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if attempt == 4:
                raise
        time.sleep(min(2 ** attempt, 12))
    raise RuntimeError("Acquisition retries exhausted")


def license_string(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(str(value.get(k, "")) for k in ("name", "title", "url", "value", "license"))
    return "" if value is None else str(value)


def cc_by_4(value):
    text = license_string(value).lower()
    compact = re.sub(r"[^a-z0-9]+", " ", text)
    return "cc by 4 0" in compact or "creativecommons.org/licenses/by/4.0" in text or "attribution 4.0 international" in text


def profile_json(data: bytes, name: str):
    parsed = json.loads(data.decode("utf-8-sig"))
    objects, arrays, numeric = 0, 0, 0
    keys = set()
    stack = [parsed]
    while stack:
        item = stack.pop()
        if isinstance(item, dict):
            objects += 1
            keys.update(str(k) for k in item)
            stack.extend(item.values())
        elif isinstance(item, list):
            arrays += 1
            stack.extend(item)
        elif isinstance(item, (int, float)) and not isinstance(item, bool):
            numeric += 1
    all_keys = sorted(keys)
    return {
        "file": name, "validJson": True, "rootType": type(parsed).__name__,
        "objectCountIncludingNested": objects, "arrayCountIncludingNested": arrays,
        "topLevelArrayLength": len(parsed) if isinstance(parsed, list) else None,
        "numericLeafCount": numeric, "uniqueKeys": all_keys,
        "candidatePhaseCompositionKeys": [k for k in all_keys if re.search(r"phase|state|probab|temperature|concentration|surfactant|smiles|composition|mole|weight|wt", k, re.I)],
        "candidateChemicalIdentityKeys": [k for k in all_keys if re.search(r"smiles|inchi|surfactant|chemical|compound|molecule|name", k, re.I)],
        "sha256": digest(data),
        "semanticWarning": "Key-name scan only; it does not certify field meaning or experimental provenance."
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    raw_dir = OUT / "raw"
    raw_dir.mkdir(exist_ok=True)
    metadata_bytes = fetch(API_URL, MAX_META)
    metadata = json.loads(metadata_bytes.decode("utf-8"))
    title = str(metadata.get("title", ""))
    if title.strip().lower() != "phdat" and ("surfactant" not in title.lower() or "phase" not in title.lower()):
        raise ValueError(f"Unexpected title for Figshare item {ARTICLE_ID}: {title!r}")
    source_files = metadata.get("files") or []
    if not source_files:
        raise ValueError("Official metadata contains no downloadable files.")
    (raw_dir / "figshare_article_metadata.json").write_bytes(metadata_bytes)
    file_records, profiles = [], []
    for index, item in enumerate(source_files):
        name = Path(str(item.get("name") or f"file_{index}")).name
        url = item.get("download_url") or item.get("downloadUrl")
        if not isinstance(url, str) or not url.startswith("https://"):
            file_records.append({"name": name, "status": "BLOCKED_NO_HTTPS_URL"})
            continue
        payload = fetch(url, MAX_FILE)
        target = raw_dir / name
        target.write_bytes(payload)
        md5 = digest(payload, "md5")
        supplied_md5 = item.get("supplied_md5") or item.get("md5")
        if supplied_md5 and md5.lower() != str(supplied_md5).lower():
            raise ValueError(f"MD5 mismatch for {name}: {md5} != {supplied_md5}")
        file_records.append({"name": name, "path": str(target.relative_to(ROOT)), "bytes": len(payload), "md5": md5, "sha256": digest(payload), "suppliedMd5": supplied_md5, "downloadUrl": url, "status": "DOWNLOADED"})
        if name.lower().endswith(".json"):
            profiles.append(profile_json(payload, name))
        elif name.lower().endswith(".zip"):
            with zipfile.ZipFile(target) as archive:
                bad = archive.testzip()
                if bad:
                    raise ValueError(f"ZIP CRC error: {bad}")
                members = [n for n in archive.namelist() if n.lower().endswith(".json") and not n.startswith("/") and ".." not in Path(n).parts]
                if len(members) > 500:
                    raise ValueError("Archive contains more than 500 JSON members.")
                for member in members:
                    profiles.append(profile_json(archive.read(member), f"{name}!{member}"))
    lic = metadata.get("license")
    license_ok = cc_by_4(lic)
    manifest = {
        "datasetId": "DS-PHDAT-FIGSHARE-29071202", "title": title,
        "authors": metadata.get("authors"), "publishedDate": metadata.get("published_date"),
        "version": metadata.get("version"), "articleId": ARTICLE_ID,
        "articleDoi": "10.1038/s41597-025-06306-9",
        "landingPage": metadata.get("url_public_html") or "https://figshare.com/articles/dataset/PhDat/29071202",
        "apiUrl": API_URL, "licenseRaw": lic,
        "licenseStatus": "CONFIRMED_CC_BY_4_0" if license_ok else "LICENSE_NEEDS_MANUAL_CONFIRMATION",
        "accessedAtUtc": datetime.now(timezone.utc).isoformat(),
        "metadataSha256": digest(metadata_bytes), "files": file_records, "jsonProfiles": profiles,
        "scientificScope": "Aqueous surfactant phase behavior versus temperature/composition; not a direct detergent cleaning-performance benchmark.",
        "dataProvenance": "Preserve the source-supplied provenance and distinguish literature-curated/digitized values from new raw laboratory measurements.",
        "engineEligibility": [], "labValidationStatus": "NOT_LAB_VALIDATED",
        "numericalValidationReadiness": "NOT_ASSESSED_PENDING_SCHEMA_AND_APPLICABILITY_REVIEW",
        "phase4bStatus": "OPEN", "phase5Status": "LOCKED",
        "limitations": ["Hashes establish integrity, not scientific correctness.", "Key-name profiling is diagnostic only.", "No imputation, conversion, inferred phase labels, or cleaning-performance claims.", "Do not use for formula validation without separately approved applicability evidence."]
    }
    (OUT / "data-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    decision = "ACQUIRED_NEEDS_REVIEW" if file_records and all(f.get("status") == "DOWNLOADED" for f in file_records) else "PARTIAL_ACQUISITION"
    report = {
        "auditId": "PHASE4B-PHDAT-INITIAL-INGESTION-AUDIT", "decision": decision,
        "title": title, "fileCount": len(file_records),
        "downloadedFileCount": sum(f.get("status") == "DOWNLOADED" for f in file_records),
        "licenseStatus": manifest["licenseStatus"], "jsonProfileCount": len(profiles),
        "profileSummaries": [{k: p.get(k) for k in ("file", "rootType", "objectCountIncludingNested", "arrayCountIncludingNested", "numericLeafCount", "candidatePhaseCompositionKeys", "sha256")} for p in profiles],
        "scientificDisposition": "SOURCE_DISCOVERED_NOT_FORMULA_VALIDATION", "phase4b": "OPEN", "phase5": "LOCKED"
    }
    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS / "PHASE4B_PHDAT_INITIAL_INGESTION_AUDIT.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    lines = ["# Phase 4B — PhDat Initial Ingestion Audit", "", f"**Dataset:** {title}", f"**Decision:** {decision}", f"**License:** {manifest['licenseStatus']}", "**Scientific status:** NOT_LAB_VALIDATED", "**Gate:** Phase 4B OPEN; Phase 5 LOCKED", "", "| File | Bytes | SHA-256 | Status |", "|---|---:|---|---|"]
    for f in file_records:
        lines.append(f"| {f.get('name')} | {f.get('bytes', '—')} | {f.get('sha256', '—')} | {f.get('status')} |")
    lines += ["", "## Applicability and limitations", "", "- Candidate use: phase behavior / compatibility within source-supported chemical and temperature/composition ranges.", "- Not a direct benchmark for detergency, soil removal, hard-water chelation, foam kinetics, pH, cleaning score, or formula accuracy.", "- Review source chemical identifiers, units, phase-state semantics, missingness, extraction methods, and per-record provenance before mapping to the ingredient catalog.", "- Confirm the license against repository/publisher terms before redistribution.", "- No engine eligibility or scientific maturity promotion is granted."]
    (REPORTS / "PHASE4B_PHDAT_INITIAL_INGESTION_AUDIT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if decision == "ACQUIRED_NEEDS_REVIEW" else 1

if __name__ == "__main__":
    raise SystemExit(main())
