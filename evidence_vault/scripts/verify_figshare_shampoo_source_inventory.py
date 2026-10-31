#!/usr/bin/env python3
"""Verify Figshare shampoo source dataset registry metadata and local binary inventory.

Contract:
- Stage 1: Audits authoritative registry metadata (source-register.csv, initialData.ts, dataset_integrity_manifest.json).
- Stage 2: Checks local dataset binary directory and verifies byte sizes and MD5/SHA-256 checksums if present.
- Output: Structured JSON report with registry_metadata_status and local_binary_status.
- Exit code 0 if metadata is valid and no errors occurred; exit code 1 if errors or mismatches are detected.
"""
from __future__ import annotations
import csv, hashlib, json, re, sys
from pathlib import Path

EXPECTED_ARTICLE_ID = "25451878"
EXPECTED_ARTICLE_URL = "https://api.figshare.com/v2/articles/25451878"
EXPECTED_MAIN_FILE = "LiquidFormulationsDataset_2023.json"
EXPECTED_MAIN_SIZE = 1464630
EXPECTED_MAIN_MD5 = "8898e7b460c71e334f6ece5daebc6a6e"
EXPECTED_MAIN_SHA256 = "3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd"

def compute_hashes(file_path: Path) -> tuple[int, str, str]:
    md5 = hashlib.md5()
    sha256 = hashlib.sha256()
    size = 0
    with file_path.open("rb") as f:
        while chunk := f.read(65536):
            size += len(chunk)
            md5.update(chunk)
            sha256.update(chunk)
    return size, md5.hexdigest(), sha256.hexdigest()

def verify_inventory(
    root_dir: Path | None = None,
    source_register_path: Path | None = None,
    initial_data_path: Path | None = None,
    manifest_path: Path | None = None,
    dataset_dir: Path | None = None,
) -> dict:
    if root_dir is None:
        root_dir = Path(__file__).resolve().parent.parent.parent

    if source_register_path is None:
        source_register_path = root_dir / "evidence_vault" / "datasets" / "source-register.csv"
    if initial_data_path is None:
        initial_data_path = root_dir / "src" / "domain" / "vault" / "initialData.ts"
    if manifest_path is None:
        manifest_path = root_dir / "evidence_vault" / "datasets" / "dataset_integrity_manifest.json"
    if dataset_dir is None:
        dataset_dir = root_dir / "evidence_vault" / "datasets" / "figshare_25451878"

    errors: list[str] = []
    limitations: list[str] = []
    registry_metadata_status = "PASS"
    local_binary_status = "UNPINNED_DATASET_ABSENT"

    # Stage 1: Registry Metadata Verification
    reg_md5 = None
    reg_sha256 = None

    if not source_register_path.is_file():
        errors.append(f"Source register missing: {source_register_path}")
        registry_metadata_status = "FAIL"
    else:
        try:
            with source_register_path.open("r", encoding="utf-8-sig", newline="") as f:
                reader = csv.DictReader(f)
                matched_row = None
                for row in reader:
                    if row.get("source_id") == "SRC-FIGSHARE-25451878":
                        matched_row = row
                        break
                if not matched_row:
                    errors.append("SRC-FIGSHARE-25451878 entry missing from source-register.csv")
                    registry_metadata_status = "FAIL"
                else:
                    digests = matched_row.get("sha256_or_md5", "")
                    md5_m = re.search(r"official-md5:([a-fA-F0-9]{32})", digests)
                    sha_m = re.search(r"mirror-sha256:([a-fA-F0-9]{64})", digests)
                    if md5_m:
                        reg_md5 = md5_m.group(1).lower()
                    if sha_m:
                        reg_sha256 = sha_m.group(1).lower()

                    if reg_md5 != EXPECTED_MAIN_MD5:
                        errors.append(
                            f"source-register.csv MD5 mismatch: expected {EXPECTED_MAIN_MD5}, got {reg_md5}"
                        )
                        registry_metadata_status = "FAIL"
                    if reg_sha256 != EXPECTED_MAIN_SHA256:
                        errors.append(
                            f"source-register.csv SHA-256 mismatch: expected {EXPECTED_MAIN_SHA256}, got {reg_sha256}"
                        )
                        registry_metadata_status = "FAIL"
        except Exception as e:
            errors.append(f"Failed reading source-register.csv: {e}")
            registry_metadata_status = "FAIL"

    if not initial_data_path.is_file():
        errors.append(f"initialData.ts missing: {initial_data_path}")
        registry_metadata_status = "FAIL"
    else:
        try:
            content = initial_data_path.read_text(encoding="utf-8")
            if EXPECTED_ARTICLE_URL not in content:
                errors.append(f"initialData.ts missing expected Figshare URL {EXPECTED_ARTICLE_URL}")
                registry_metadata_status = "FAIL"
            if EXPECTED_MAIN_SHA256 not in content:
                errors.append(f"initialData.ts missing expected SHA-256 {EXPECTED_MAIN_SHA256}")
                registry_metadata_status = "FAIL"
            if EXPECTED_MAIN_MD5 not in content:
                errors.append(f"initialData.ts missing expected MD5 {EXPECTED_MAIN_MD5}")
                registry_metadata_status = "FAIL"
            if str(EXPECTED_MAIN_SIZE) not in content:
                errors.append(f"initialData.ts missing expected size {EXPECTED_MAIN_SIZE}")
                registry_metadata_status = "FAIL"
        except Exception as e:
            errors.append(f"Failed reading initialData.ts: {e}")
            registry_metadata_status = "FAIL"

    # Stage 2: Local Binary Integrity Verification
    if dataset_dir.is_dir():
        main_file = dataset_dir / EXPECTED_MAIN_FILE
        if not main_file.is_file():
            errors.append(f"Pinned dataset directory exists but missing required main file: {EXPECTED_MAIN_FILE}")
            local_binary_status = "FAIL"
        else:
            try:
                actual_size, actual_md5, actual_sha256 = compute_hashes(main_file)
                if actual_size != EXPECTED_MAIN_SIZE:
                    errors.append(f"Binary size mismatch for {EXPECTED_MAIN_FILE}: expected {EXPECTED_MAIN_SIZE}, got {actual_size}")
                    local_binary_status = "FAIL"
                elif actual_md5 != EXPECTED_MAIN_MD5:
                    errors.append(f"Binary MD5 mismatch for {EXPECTED_MAIN_FILE}: expected {EXPECTED_MAIN_MD5}, got {actual_md5}")
                    local_binary_status = "FAIL"
                elif actual_sha256 != EXPECTED_MAIN_SHA256:
                    errors.append(f"Binary SHA-256 mismatch for {EXPECTED_MAIN_FILE}: expected {EXPECTED_MAIN_SHA256}, got {actual_sha256}")
                    local_binary_status = "FAIL"
                else:
                    local_binary_status = "PASS"
            except Exception as e:
                errors.append(f"Failed verifying binary file {main_file}: {e}")
                local_binary_status = "FAIL"
    else:
        # Check integrity manifest for unpinned documentation
        documented_unpinned = False
        if manifest_path.is_file():
            try:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                for err in manifest.get("errorsAndLimitations", []):
                    if "external dataset bytes were not retrieved" in err:
                        documented_unpinned = True
                        break
            except Exception:
                pass

        local_binary_status = "UNPINNED_DATASET_ABSENT"
        if documented_unpinned:
            err_msg = "Dataset binary directory is absent from local repository snapshot per dataset_integrity_manifest.json; binary verification failed closed."
            limitations.append(err_msg)
            errors.append(err_msg)
        else:
            err_msg = "Dataset directory is absent from repository; binary verification failed closed."
            limitations.append(err_msg)
            errors.append(err_msg)

    report = {
        "dataset": "SRC-FIGSHARE-25451878",
        "registry_metadata_status": registry_metadata_status,
        "local_binary_status": local_binary_status,
        "registered_md5": reg_md5 or EXPECTED_MAIN_MD5,
        "registered_sha256": reg_sha256 or EXPECTED_MAIN_SHA256,
        "errors": errors,
        "limitations": limitations,
    }
    return report

def main(argv: list[str]) -> int:
    report = verify_inventory()
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if not report["errors"] else 1

if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
