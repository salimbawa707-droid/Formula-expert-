# EVIDENCE PROVENANCE & MANIFEST CHANGES (ISSUE 2)

**Project:** Detergent Formula Expert — Scientific Evidence Vault  
**Component:** `evidence_vault/`  
**Dataset Reference:** Zenodo Record 18961871  
**DOI:** [10.5281/zenodo.18961871](https://doi.org/10.5281/zenodo.18961871)  
**Licence:** Creative Commons Attribution 4.0 International (CC-BY-4.0)  
**Date:** 2026-10-19 / 2026-10-21  

---

## 1. Overview of Changes

This document records the provenance, manifest entries, directory mappings, and licence information for the two recovered scientific evidence workbooks in accordance with Step 3 ("Integrate Safely") of the Issue 2 protocol.

---

## 2. Evidence Directory Structure & Mapping

| File Name | Original Source URL | Quarantined Path | Canonical Vault Path | Status |
| :--- | :--- | :--- | :--- | :---: |
| `Supplementary_SolutionFlowCurves.xlsx` | `https://zenodo.org/records/18961871/files/Supplementary_SolutionFlowCurves.xlsx?download=1` | `evidence_vault/corrupted_quarantine/Supplementary_SolutionFlowCurves.xlsx` | `evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx` | **RECOVERED & VERIFIED** |
| `Supplementary_FilmThickness_v1.xlsx` | `https://zenodo.org/records/18961871/files/Supplementary_FilmThickness_v1.xlsx?download=1` | `evidence_vault/corrupted_quarantine/Supplementary_FilmThickness_v1.xlsx` | `evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx` | **RECOVERED & VERIFIED** |

---

## 3. Cryptographic Provenance Manifest

### 3.1. `Supplementary_SolutionFlowCurves.xlsx`
- **Canonical Vault Location:** `evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx`
- **File Size:** 22,280 bytes
- **Format:** Genuine XLSX / OpenXML Spreadsheet (ZIP container with `[Content_Types].xml` and worksheet XMLs)
- **MD5 Checksum:** `cd5bfd6e95fc65e412807d53935c2d96`
- **SHA-256 Checksum:** `90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590`
- **Source Dataset:** Zenodo Record 18961871 (DOI: 10.5281/zenodo.18961871)
- **Licence:** Creative Commons Attribution 4.0 International (CC-BY-4.0)
- **Quarantine Mirror:** Retained in `evidence_vault/corrupted_quarantine/Supplementary_SolutionFlowCurves.xlsx` (9 bytes, literal `"corrupted\n"`, MD5 `88ed91fad91b8b69b62ce17ae542ff45`) for full auditability.

### 3.2. `Supplementary_FilmThickness_v1.xlsx`
- **Canonical Vault Location:** `evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx`
- **File Size:** 149,923 bytes
- **Format:** Genuine XLSX / OpenXML Spreadsheet (ZIP container with 20 internal parts including workbook sheets)
- **MD5 Checksum:** `bc9582baafecd6552f6014216a0844e6`
- **SHA-256 Checksum:** `170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428`
- **Source Dataset:** Zenodo Record 18961871 (DOI: 10.5281/zenodo.18961871)
- **Licence:** Creative Commons Attribution 4.0 International (CC-BY-4.0)
- **Quarantine Mirror:** Retained in `evidence_vault/corrupted_quarantine/Supplementary_FilmThickness_v1.xlsx` (9 bytes, literal `"corrupted\n"`, MD5 `88ed91fad91b8b69b62ce17ae542ff45`) for full auditability.

---

## 4. Manifest Synchronization

The existing manifest file `evidence_vault/datasets/zenodo_18961871/round4_checksum_manifest.csv` accurately pins both workbooks:
```csv
filename,local_bytes,computed_md5,computed_sha256,status
"Supplementary_SolutionFlowCurves.xlsx",22280,"cd5bfd6e95fc65e412807d53935c2d96","90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590","VERIFIED"
"Supplementary_FilmThickness_v1.xlsx",149923,"bc9582baafecd6552f6014216a0844e6","170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428","VERIFIED"
"Supplementary_BubbleSizes_v1.xlsx",557745,"9fcfe68a37d2d92a7999569a07908854","9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad","VERIFIED"
"Supplementary_RheometerData_v2.xlsx",162970,"c9b5a9cde073eb7c58933eec37a559a6","073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70","VERIFIED"
```

Quarantine ledger `evidence_vault/corrupted_quarantine/QUARANTINE_MANIFEST.md` remains intact, ensuring the application and calculation engines never treat quarantined files as valid experimental evidence.
