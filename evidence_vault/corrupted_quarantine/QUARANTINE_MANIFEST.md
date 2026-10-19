# CORRUPTED WORKBOOK QUARANTINE LEDGER

## Summary
The following workbooks from the Zenodo 18961871 dataset bundle are corrupted 9-byte stubs containing zero data rows and missing valid Excel/ZIP headers:

1. `Supplementary_FilmThickness_v1.xlsx` — 9 bytes (SHA-256 / content check: stub only)
2. `Supplementary_SolutionFlowCurves.xlsx` — 9 bytes (SHA-256 / content check: stub only)

## Mandatory Invariants & Safeguards
- **Status**: `CORRUPTED_AWAITING_RECOVERY`
- **Numerical Validation Eligibility**: 0% (Strictly disqualified from calculation pipelines)
- **Engine Feeding**: MUST NEVER be referenced, read, or consumed by `viscosityEngine`, `rheologyEngine`, `pHEngine`, or any runtime calculation model.
- **Data Integrity**: Replacement data MUST NOT be fabricated or assumed. Genuine experimental recovery from primary literature / author repository is required before any validation claims can be made.
