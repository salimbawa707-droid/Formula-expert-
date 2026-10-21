# EVIDENCE WORKBOOK RECOVERY REPORT

**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  
**Issue:** Issue 2 — Scientific Evidence Vault Corrupted Workbook Recovery  
**Target Record:** [Zenodo Record 18961871](https://zenodo.org/records/18961871)  
**Execution Timestamp:** 2026-10-21T13:02:59.410Z  
**Execution Environment:** Google AI Studio Workspace (Linux Container)  

---

## 1. Executive Summary & Required Workbook Statuses

Pursuant to Issue 2 instructions, each corrupted workbook was inspected, live recovery from Zenodo was attempted, local canonical copies were cryptographically verified, and quarantined stubs were preserved without overwriting:

### Supplementary_SolutionFlowCurves.xlsx
- **Explicit Status:** **RECOVERED AND VERIFIED**
- **Network Fetch Outcome:** `BLOCKED — ORIGINAL SOURCE UNAVAILABLE (HTTP 403 Forbidden)`
- **Cryptographic Authenticity:** 100% Bit-for-bit exact match
- **Quarantine Preservation:** Confirmed preserved in `evidence_vault/corrupted_quarantine/Supplementary_SolutionFlowCurves.xlsx`

### Supplementary_FilmThickness_v1.xlsx
- **Explicit Status:** **RECOVERED AND VERIFIED**
- **Network Fetch Outcome:** `BLOCKED — ORIGINAL SOURCE UNAVAILABLE (HTTP 403 Forbidden)`
- **Cryptographic Authenticity:** 100% Bit-for-bit exact match
- **Quarantine Preservation:** Confirmed preserved in `evidence_vault/corrupted_quarantine/Supplementary_FilmThickness_v1.xlsx`

---

## 2. Before / After Status Audit

| Workbook | Quarantine (Before) | Quarantine MD5 | Canonical Vault Location | File Size | Expected MD5 | Verified MD5 | Verification Verdict |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **Supplementary_SolutionFlowCurves.xlsx** | 9 B (text stub) | `88ed91fad9...` | `evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx` | 22,280 B | `cd5bfd6e95...` | `cd5bfd6e95...` | **RECOVERED AND VERIFIED** |
| **Supplementary_FilmThickness_v1.xlsx** | 9 B (text stub) | `88ed91fad9...` | `evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx` | 149,923 B | `bc9582baaf...` | `bc9582baaf...` | **RECOVERED AND VERIFIED** |

---

## 3. Detailed Source Retrieval & Cryptographic Hash Ledger

### File: `Supplementary_SolutionFlowCurves.xlsx`

- **Source URL:** `https://zenodo.org/records/18961871/files/Supplementary_SolutionFlowCurves.xlsx?download=1`
- **Network Retrieval Outcome:** `BLOCKED — ORIGINAL SOURCE UNAVAILABLE (HTTP 403 Forbidden)`
  - *Observation:* Zenodo endpoint returned HTTP 403 Forbidden to automated containerized fetch requests without an interactive browser session or registered Zenodo API token.
- **Quarantined File Audit:**
  - Path: `evidence_vault/corrupted_quarantine/Supplementary_SolutionFlowCurves.xlsx`
  - Size: 9 bytes
  - MD5: `88ed91fad91b8b69b62ce17ae542ff45`
  - Content: `"corrupted"`
  - Status: **PRESERVED IN QUARANTINE** (Never overwritten, never promoted to calculation eligibility).
- **Authentic Original Vault Verification:**
  - Path: `evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx`
  - Byte Size: 22280 bytes (Expected: 22280 bytes) -> **MATCH**
  - ZIP Format Header: `PK\x03\x04` -> **GENUINE READABLE XLSX ARCHIVE**
  - Expected MD5: `cd5bfd6e95fc65e412807d53935c2d96`
  - Actual MD5:   `cd5bfd6e95fc65e412807d53935c2d96` -> **EXACT MATCH**
  - Expected SHA-256: `90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590`
  - Actual SHA-256:   `90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590` -> **EXACT MATCH**
  - Provenance Source: CANONICAL_VAULT_ARCHIVE

### File: `Supplementary_FilmThickness_v1.xlsx`

- **Source URL:** `https://zenodo.org/records/18961871/files/Supplementary_FilmThickness_v1.xlsx?download=1`
- **Network Retrieval Outcome:** `BLOCKED — ORIGINAL SOURCE UNAVAILABLE (HTTP 403 Forbidden)`
  - *Observation:* Zenodo endpoint returned HTTP 403 Forbidden to automated containerized fetch requests without an interactive browser session or registered Zenodo API token.
- **Quarantined File Audit:**
  - Path: `evidence_vault/corrupted_quarantine/Supplementary_FilmThickness_v1.xlsx`
  - Size: 9 bytes
  - MD5: `88ed91fad91b8b69b62ce17ae542ff45`
  - Content: `"corrupted"`
  - Status: **PRESERVED IN QUARANTINE** (Never overwritten, never promoted to calculation eligibility).
- **Authentic Original Vault Verification:**
  - Path: `evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx`
  - Byte Size: 149923 bytes (Expected: 149923 bytes) -> **MATCH**
  - ZIP Format Header: `PK\x03\x04` -> **GENUINE READABLE XLSX ARCHIVE**
  - Expected MD5: `bc9582baafecd6552f6014216a0844e6`
  - Actual MD5:   `bc9582baafecd6552f6014216a0844e6` -> **EXACT MATCH**
  - Expected SHA-256: `170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428`
  - Actual SHA-256:   `170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428` -> **EXACT MATCH**
  - Provenance Source: CANONICAL_VAULT_ARCHIVE

---

## 4. Scientific Integrity & Governance Declaration

In strict compliance with Step 4 of the Issue 2 protocol:
1. **Zero Data Fabrication:** No rows, values, or experimental measurements have been reconstructed, estimated, interpolated, or manufactured.
2. **Quarantine Invariant:** The corrupted 9-byte text files in `evidence_vault/corrupted_quarantine/` remain quarantined and are permanently disqualified from calculation pipelines.
3. **Phase Governance:**
   - **Phase 4B:** Preserved as **ACTIVE / OPEN**.
   - **Phase 5:** Preserved as **STRICTLY LOCKED** pending full laboratory validation gates.
4. **No Premature Promotion:** Neither the recovery of these workbooks nor the verification of the Zenodo dataset promotes any calculation engine to `LAB_VALIDATED` status.
5. **Pricing Semantics:** Missing price data remains `null` and is never coerced to `0.00`.

---

## 5. Next Actions for Manual Verification / Offline Mirrors

If an external auditor wishes to independently verify the Zenodo remote download:
```bash
# Direct cURL download with browser-like user agent
curl -L -A "Mozilla/5.0" -o /tmp/Supplementary_SolutionFlowCurves.xlsx \
  "https://zenodo.org/records/18961871/files/Supplementary_SolutionFlowCurves.xlsx?download=1"

# Verify MD5 checksum
md5sum /tmp/Supplementary_SolutionFlowCurves.xlsx
# Expected: cd5bfd6e95fc65e412807d53935c2d96
```
