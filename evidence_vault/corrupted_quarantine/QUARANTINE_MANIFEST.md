# CORRUPTED WORKBOOK QUARANTINE LEDGER

## Current status

**Status:** `STUBS_REMOVED_AFTER_CANONICAL_RECOVERY`

The two 9-byte files listed below were invalid text stubs, not scientific evidence. They have been removed from the repository after canonical workbook files were confirmed present at their official dataset paths. The stubs must not be restored or consumed by any calculation engine.

- `Supplementary_SolutionFlowCurves.xlsx` — historical stub: 9 bytes, literal `corrupted`
- `Supplementary_FilmThickness_v1.xlsx` — historical stub: 9 bytes, literal `corrupted`

## Canonical files retained

- `evidence_vault/datasets/zenodo_18961871/Supplementary_SolutionFlowCurves.xlsx`
  - Published MD5: `cd5bfd6e95fc65e412807d53935c2d96`
  - Published SHA-256: `90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590`
  - Expected size: 22,280 bytes
- `evidence_vault/datasets/zenodo_18961871/Supplementary_FilmThickness_v1.xlsx`
  - Published MD5: `bc9582baafecd6552f6014216a0844e6`
  - Published SHA-256: `170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428`
  - Expected size: 149,923 bytes

## Mandatory safeguards

- **Calculation eligibility:** only workbooks that pass runtime checksum and archive validation may be consumed.
- **Missing or malformed data:** fail closed; do not fabricate, infer, or impute experimental values.
- **Historical auditability:** prior reports may describe the stubs as present at the time of those audits; that is historical context and does not mean the files remain in the current tree.
- **Phase governance:** Phase 4B remains ACTIVE / OPEN until all evidence, provenance, numerical inspection, and independent validation gates pass. Phase 5 remains LOCKED.
