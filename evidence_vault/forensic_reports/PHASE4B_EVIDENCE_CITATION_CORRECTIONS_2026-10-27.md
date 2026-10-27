# Phase 4B — Evidence Citation Corrections and Inspection Boundaries

**Audit date:** 2026-10-27  
**Repository revision:** `984b04bba66843f36360236aa295d250458e4091`  
**Status:** Metadata corrections committed; Phase 4B remains OPEN; Phase 5 remains LOCKED.

## Corrections made

### EVD-003 / DS-003 — shampoo formulation dataset

DOI `10.1038/s41597-024-03573-w` identifies Chitre et al., *Accelerating Formulation Design via Machine Learning: Generating a High-throughput Shampoo Formulations Dataset*, published in *Scientific Data* on 2024-07-03. It is not the previously recorded “Vandermonde” rheology benchmark. The linked official Figshare collection is `10.6084/m9.figshare.c.7132624.v1`.

The article reports 812 prepared formulations and full rheology/flow-curve results for 294 stable formulations. Those article-level counts do not establish parsed file row counts or ingredient/response mappings. The registry now records the dataset as pending retrieval and leaves row/column counts null. No formula-prediction validation is claimed.

Official records:
- https://www.nature.com/articles/s41597-024-03573-w
- https://doi.org/10.6084/m9.figshare.c.7132624.v1

### EVD-004 — quarantined citation conflict

The previous title, authors, dates, chelation measurements, conditions, and engine-support claims were unsupported. DOI `10.1016/j.jcis.2024.06.012` and PMC URL `PMC11222379` resolve to different article records. The entry is now explicitly quarantined with blocked access/download, failed inspection, no supported engines or claims, and unknown reuse status. It must not be used as evidence until the intended source is identified and verified.

Reference URLs:
- https://doi.org/10.1016/j.jcis.2024.06.012
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11222379/

### EVD-007 / DS-004 — PhDat aqueous phase-behavior dataset

DOI `10.1038/s41597-025-06306-9` identifies Rummel et al., *A dataset for aqueous surfactant phase behavior as a function of temperature and composition*, published 2025-11-26. The linked dataset is PhDat, Figshare item 29071202, version 4; it is not the previously recorded Alvarez-Gomez microemulsion-boundary dataset.

Existing CI source audit records SHA-256 `748a29d08341bd8e868247d609401301495e24b3c1d88ed3b0ec065e2cdb12f3`, 143 chemical records (99 marked complete, 44 incomplete), and aligned finite numeric arrays. The per-record review found zero confirmed ingredient-catalog joins and zero formula-validation-eligible records. Array integrity does not establish digitization correctness, phase-label correctness, or detergent-formula applicability. The raw JSON and detailed column-level evidence remain in CI artifacts and must be reacquired/hash-verified before reuse.

Official records:
- https://www.nature.com/articles/s41597-025-06306-9
- https://api.figshare.com/v2/articles/29071202

## Phase status

Phase 4B and Phase 5 were intentionally left unchanged. This correction pass does not supply independent scientific review, does not retrieve the shampoo JSON, does not implement unavailable ENG-005, and does not turn the heterogeneous historical `27,982` arithmetic into a common physical-observation count. The historical aggregate remains rejected as a verified observation count; the original counting procedure remains unreconstructed. No Phase 5 gate is represented as satisfied by this metadata repair.
