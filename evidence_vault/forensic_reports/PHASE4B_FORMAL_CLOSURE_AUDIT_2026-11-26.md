# Phase 4B — Formal closure audit

**Audit date:** 2026-11-26  
**Branch:** `audit/phase4b-evd014-022-reconciliation`  
**Decision:** **NOT CLOSED — closure criteria not met**  
**Phase 5:** **LOCKED**  
**Independent human review:** **NOT PERFORMED**

## Executive decision

The work requested in the latest remediation list has progressed materially, but a formal Phase 4B closure would be false. The EVD-019 Tables 1 and 2 have now been transcribed and visually checked against the author-uploaded PDF page image. Structured rights statuses have been added to every currently registered evidence record. The live source inventory and its executable verifier show that the historical “59 engine files” figure is not the current manifest count.

Three hard blockers remain:
1. No independent second-human review/approval has been recorded. The repository has no PR review submissions or inline review threads for the current reconciliation PR at the time of this audit. AI review cannot substitute for the required human review.
2. Some source files that have commercial-use permission have not yet been archived and SHA-256 pinned. The direct EVD-014 publisher-PDF download attempt failed in this environment; EVD-013 supplementary PDF also remains unarchived. No hash is invented.
3. The 59-file historical claim cannot be reproduced from the current repository. The checked-in legacy manifest and inventory verifier currently specify 55 paths, while separate source-tree counts are 61, 64 and 93. The original artifact defining 59 was not found.

## 1. EVD-019 numerical transcription

Tables 1 and 2 are recorded in `PHASE4B_EVD019_EXACT_TABLE_TRANSCRIPTION_2026-11-26.md`.
- Table 1: seven LAS/AE-7EO compositions, CMC, minimum surface tension, slope, surface excess and molecular area.
- Table 2: five numeric LAS/AE-2EO compositions and one pure-AE-2EO “insoluble in water” result.
- The source’s 62.5% LAS / 36.5% AE-7EO row is retained exactly as printed (99.0% total); it is not normalized.
- The percent basis is not explicit in the table heading. The methods describe varying mole fraction; the report does not relabel the values as weight percent.
- EVD-019 is now marked `NUMERICALLY_INSPECTED`. This records AI visual transcription only. Independent human verification remains open and rights remain `REVIEW_PENDING`.

## 2. Structured rights status reconciliation

All 21 records present in the canonical registry now have a structured `licenseReviewStatus`. EVD-003 remains absent as the existing quarantined/out-of-scope ID gap; no record has been invented for it.

| Status | Count | Records |
|---|---:|---|
| PERMITTED_FOR_COMMERCIAL_REUSE | 7 | EVD-006, EVD-007, EVD-008, EVD-011 (OpenAlex metadata only), EVD-012, EVD-013 (Figshare item 31314542), EVD-014 |
| RESTRICTED | 2 | EVD-001, EVD-002 (SurfPro dataset CC BY-NC-SA 4.0; not commercial) |
| REVIEW_PENDING | 10 | EVD-005, EVD-009, EVD-010, EVD-015, EVD-016, EVD-018, EVD-019, EVD-020, EVD-021, EVD-022 |
| UNKNOWN | 2 | EVD-004 (citation mismatch/quarantine), EVD-017 (regulatory source rights disposition not completed) |
| **Total registered** | **21** | **21/21 structured** |

### Scope cautions

- EVD-006: official Zenodo record 18961871 explicitly shows CC BY 4.0. The four supplementary XLSX files are already archived with MD5/SHA-256 values in the source register. Their scientific applicability remains bounded; license permission does not make them engine-validation data.
- EVD-007: the PhDat dataset record is CC BY 4.0 and the raw dataset is already present with a recorded SHA-256; source lineage/applicability blockers remain.
- EVD-012: RepOD file-level CC BY 4.0 is confirmed and the ODS source is already downloaded; dataset-domain limitations remain.
- EVD-013: Figshare supplementary item 31314542 has file-level CC BY 4.0 evidence; the supplementary PDF is not yet archived or hashed.
- EVD-001/002: the SurfPro dataset repository states CC BY-NC-SA 4.0. Commercial ingestion is prohibited absent separate permission. EVD-002 bytes already in the repository do not change that license.
- EVD-008: GPL-3.0 permission applies to CurveClaw software under GPL obligations; it is not a license to digitized third-party source papers.
- EVD-011: CC0 applies to OpenAlex metadata, not to the linked publisher PDFs or third-party publications.
- EVD-010: NCBI says it does not impose restrictions on molecular data but warns that original submitters may hold rights. Therefore the broad “public domain” wording is not sufficient to clear every PubChem-contributed assertion for commercial reuse.
- EVD-009: NIST Standard Reference Data can be protected under the Standard Reference Data Act; the applicable SRD-specific license must be checked. Do not call the entire SRD 69 public domain.
- EVD-005: BSD-3-Clause covers repository software; it does not automatically license every dataset exposed through a data catalog.

## 3. Original-file archival and SHA-256 pinning

### Existing archived records

The repository already contains source bytes and hashes for EVD-002, EVD-006, EVD-007 and EVD-012.
- EVD-002 is restricted by CC BY-NC-SA 4.0 and must not be ingested commercially.
- EVD-006, EVD-007 and EVD-012 have CC BY 4.0 source-level evidence. Their current hashes are retained in the existing source/dataset manifests.

### Not yet archived/hash-pinned

- EVD-013: CC BY 4.0 supplementary PDF; original file still not archived.
- EVD-014: CC BY 4.0 article PDF; source identity and license verified, but direct download failed in this execution environment. No SHA-256 can be claimed.
- EVD-015, EVD-016, EVD-018, EVD-019, EVD-020, EVD-021 and EVD-022: rights remain pending; do not archive/re-distribute protected full texts or manufacturer content absent permission. Public URL and visual inspection are not repository archival.
- EVD-017: official regulatory text rights disposition remains unknown; official text is referenced but no local source file is pinned.

**Archival result:** EVD-014–022 archival remains **0/9**. The four earlier archived records are EVD-002, EVD-006, EVD-007 and EVD-012; none belongs to the EVD-014–022 batch.

## 4. Engine inventory reconciliation

The current executable inventory guard is `evidence_vault/scripts/verify_engine_inventory.mjs`. It defines and checks:

| Inventory | Current count | Meaning |
|---|---:|---|
| `engines_reconciled.list` unique existing paths | 55 | Legacy manifest count; all listed paths must exist and be unique |
| Engine-named source files excluding UI | 61 | Filename-based source-tree count |
| Engine-named files including UI | 64 | Includes UI components; not all are engine implementations |
| Broad engine/calculator/optimizer/formulation/workflow/router candidates | 93 | Discovery candidate set, not canonical engine count |
| Top-level vault engine records | 6 | ENG-001 through ENG-006 |

The historic “59” is not the current manifest count. The 59-path target cannot be signed off as reconciled because the present manifest has 55 entries. Historical 64 and 97 claims still lack their original source artifacts and counting rules. Counts use different definitions and must not be combined.

The registry’s `reconciledFiles` value is corrected to 55 for the reproducible legacy manifest. The discrepancy status remains `REPORTED_UNVERIFIED` because the historic claims have not been reconstructed from original artifacts. No scientific engine algorithm was tuned or calibrated.

## 5. Scientific coverage remains insufficient for closure

Current engine evidence coverage remains:
- ENG-001: 18%
- ENG-002: 15%
- ENG-003: 0%
- ENG-004: 12%
- ENG-005: 0%
- ENG-006: 90%

The four registered dataset inventory records remain `DEFICIENT` for validation readiness (0/4 validation-ready). EVD-019 provides source-level mixed LAS/AE CMC/surface-activity evidence, not a matched formula-prediction pair. It does not validate ENG-002 by itself and does not validate ENG-003 or ENG-005.

## 6. Independent human review and formal gate

- No independent second-human review submission is recorded on PR #117 at the time of this audit.
- The AI-assisted verification policy is not a human sign-off and cannot close Phase 4B.
- The independent reviewer must inspect the source files, rights dispositions, EVD-019 transcription, 55/61/64/93 engine count definitions, source hashes, and engine applicability matrix.
- Reviewer identity, review date, findings, and explicit approval must be entered by that reviewer. None are fabricated in this report.

## Final decision

**Phase 4B: OPEN. Phase 5: LOCKED.**

This audit closes the EVD-019 AI transcription task and the missing structured-rights-field task, and it documents the current engine inventory definitions. It does **not** satisfy independent human review, EVD-014–022 archival, or the unreconstructed historical 59/64/97 claims. Do not merge as a phase closure, unlock Phase 5, or claim production/scientific validation on this basis.
