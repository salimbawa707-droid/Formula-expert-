# Phase 4B — Authoritative Provenance, Engine Applicability & AI Review Disposition

**Review date:** 2026-11-25  
**Repository base:** `426cc6da4db4bf2f71e27805243089b027b2aa86`  
**Review type:** AI Review (source-first; no human review claimed)  
**human_review:** `false`  
**Phase 4B:** OPEN  
**Phase 5:** LOCKED

## Executive decision

This review closes several *disposition questions*, but it does not satisfy the Phase 4B master gate. Four registered datasets have positive, source-defined row inventories and numerical-inspection records. Authoritative repository metadata was checked for the principal records listed below. However, Zenodo Rights fields for the two Zenodo records were not populated in the rendered records, and the SURFPRO record has a DOI cross-reference discrepancy. Commercial reuse rights are therefore not certified by this review.

No eligible ENG-003 formula-prediction pairs were found because the household-product study explicitly says exact washing-up-liquid formulations are undisclosed. ENG-005 remains a planned registry entry with no executable implementation or callable predictor. These are real blockers, not paperwork gaps. Do not unlock Phase 5.

## 1. Authoritative source provenance

### DS-001 / EVD-002 — SURFPRO, Zenodo 15861809

- Official record: https://zenodo.org/records/15861809
- Official record identifies the SURFPRO dataset, creators, 1,624-surfactant scope, and `S129_SURFPRO.csv`.
- Official record lists CSV MD5 `e5bcd1bbab2fc56717a3cd6a0cf1c152`, matching the repository's pinned source manifest; the repository SHA-256 is `316a136630ab08097454518231b952c78d65773a125627ae38d874b889b8d841`.
- **Provenance:** record identity and file identity supported; numeric source file has 1,624 rows and 31 columns.
- **Discrepancy:** the record's description cross-references dataset DOI `10.5281/zenodo.15750784`, while the page's own record DOI is `10.5281/zenodo.15861809`. Preserve both exactly; do not silently rewrite either.
- **Rights:** the rendered Zenodo Rights section has no license value. The upstream repository's license is not, by itself, authoritative proof of the deposited data file's license. Set commercial reuse clearance to UNKNOWN / NOT CLEARED pending depositor confirmation or machine-readable record metadata.
- **Applicability:** pure-surfactant property/CMC reference evidence; not finished detergent formula validation.

### DS-002 / EVD-006 — Household washing-up liquid rheology and foam, Zenodo 18961871

- Official record: https://zenodo.org/records/18961871
- Official record identifies Ceri Allgood and Thomas Jones, the 2026 study, four supplementary XLSX workbooks, and the 895.5 MB microscopy archive.
- The four checked-in workbook MD5 values match the published record:
  - Solution flow: `cd5bfd6e95fc65e412807d53935c2d96`
  - Film thickness: `bc9582baafecd6552f6014216a0844e6`
  - Bubble sizes: `9fcfe68a37d2d92a7999569a07908854`
  - Rheometer: `c9b5a9cde073eb7c58933eec37a559a6`
- **Row inventory:** 11,626 numeric-bearing worksheet rows across 11 sheets. This is a parser inventory, not 11,626 independent physical experiments. Formula-derived bubble-radius cells and raw bubble-area cells remain distinct representations of the same features.
- **Rights:** the rendered Zenodo Rights section has no license value. Do not certify commercial reuse or redistribution rights from the record as currently rendered.
- **Applicability:** the article states exact commercial washing-up-liquid formulations cannot be reported because they are proprietary/undisclosed. Thus measured curves cannot be paired with complete formula ingredient inputs for formula-specific ENG-003 predictions. Foam measurements are descriptive/structural and do not create an executable ENG-005 predictor.

### DS-004 / PhDat — Figshare 29071202 v4

- Primary article: https://www.nature.com/articles/s41597-025-06306-9
- Dataset DOI: https://doi.org/10.6084/m9.figshare.29071202
- The article explicitly states PhDat is hosted on Figshare under CC BY 4.0.
- Repository-pinned source SHA-256: `748a29d08341bd8e868247d609401301495e24b3c1d88ed3b0ec065e2cdb12f3`.
- **Row inventory:** 143 surfactant records. The existing audit reports zero confirmed ingredient-catalog identity joins and zero formula-validation-eligible records.
- **Applicability:** aqueous surfactant phase behavior versus temperature/composition only. It is not detergent cleaning, soil-removal, pH, chelation, or foam lifetime validation.

### DS-005 / RepOD MKCDUM — polyelectrolyte/surfactant foamability

- Official record: https://repod.icm.edu.pl/dataset.xhtml?persistentId=doi%3A10.18150%2FMKCDUM
- Official record identifies Dominik Kosior (2024), the two systems PGA/LAE and PLL/RH, and CC BY 4.0.
- Pinned raw ODS identity: 18,531 bytes; MD5 `9bee2b49dd1a55822203e10641694c46`; SHA-256 `3665c4386fbf75537744823246a2857fd34eceb297057d6a372c29490d56cfaf`.
- **Row inventory:** 23 concentration-level rows (10 PGA_LAE + 13 PLL_RH); not replicate rows or independent sample count.
- **Applicability:** auxiliary foamability/stability evidence only. Workbook/article unit and variable conflicts remain unresolved; no matched commercial detergent formula inputs.

### Additional source lead — RepOD IMF2OE

- Official record: https://repod.icm.edu.pl/dataset.xhtml?persistentId=doi%3A10.18150%2FIMF2OE
- Official metadata identifies conductometric CMC data for multicharged cationic surfactants and CC BY 4.0.
- This source is not one of the four registered numerical datasets above in the current vault inventory. Do not count it as a fifth inspected dataset or as a matched commercial detergent formula dataset without a separate ingestion and applicability record.

## 2. Cross-artifact row-accounting reconciliation

| Dataset | Vault row inventory | Independent interpretation | Disposition |
|---|---:|---|---|
| DS-001 SURFPRO | 1,624 | Canonical CSV source records | Consistent with source report; not formula-level observations |
| DS-002 Zenodo 18961871 | 11,626 | Sum of numeric-bearing rows across 11 workbook sheets | Consistent with Round-6 ledger; not physical sample count |
| DS-004 PhDat | 143 | Curated surfactant records | Consistent with per-record audit; not formula trials |
| DS-005 RepOD MKCDUM | 23 | Concentration-level rows: 10 + 13 | Consistent with workbook manifest; not replicates |

DS-002 calculation from the Round-6 ledger:
`210 + 2,394 + 4,405 + 2,384 + 0 + 288 + 225 + 192 + 88 + 720 + 720 = 11,626`.

DS-005 calculation:
`10 + 13 = 23`.

Do not sum the four datasets into a single “physical observations” number: the row units and scientific meanings differ. Do not reinterpret worksheet rows, catalog records, image features, or concentration levels as independent physical samples.

## 3. Historical engine-count disposition: 64 / 97

The historical claims **64** and **97** remain `UNVERIFIED`: their original Audit Report A and Initial Architecture Specification/counting rules were not found in the audited repository.

The reproducible source-tree audit uses distinct definitions:

| Count | Reproduced | Definition |
|---|---:|---|
| Legacy manifest | 59 | Unique existing paths in `engines_reconciled.list`; not a complete inventory |
| Engine-named source files | 62 | Non-test source files under `src/`, excluding UI |
| Engine-named files incl. UI | 65 | Same filename rule, including 3 UI files |
| Broad discovery candidates | 94 | Engine/calculator/optimizer/formulation/workflow/predictor/router path candidates |
| Top-level vault engine records | 6 | ENG-001 through ENG-006 registry records |

**Final disposition:** do not force 64 or 97 to match a current count. Keep both historical claims `REPORTED_UNVERIFIED`; preserve 59/62/65/94/6 with their exact definitions. This resolves the false-equivalence problem, not the missing historical provenance.

## 4. ENG-003 and ENG-005 applicability

### ENG-003 — ViscosityEngine

- Executable implementation exists at `src/utils/viscosityEngine.ts`.
- Registry maturity remains `HEURISTIC`; evidence coverage is 0%; numerical validation readiness is `DATASET_REQUIRED`.
- Zenodo 18961871 contains measured flow curves for four commercial washing-up liquids, but the primary article explicitly says exact formulations cannot be reported because they are undisclosed.
- The available measured outputs therefore have no complete matched ingredient-composition inputs. No formula-specific prediction-observation pair can be truthfully created from this source.
- Do not use pure-water controls or component-level reference datasets as substitutes for finished-formula input records.

### ENG-005 — FoamKineticsEngine

- Current vault record is `implementationStatus: UNAVAILABLE`, with no source file and no callable entry point.
- The audited source tree contains no FoamKineticsEngine implementation.
- Dataset observations alone cannot validate a missing predictor. The RepOD foam dataset also has no raw replicate rows and contains unresolved variable/unit semantics.
- **Disposition:** implementation blocker remains OPEN. A new model would require a separately reviewed scientific specification, actual source code, unit/condition contracts, tests, and suitable matched data. Do not mark ENG-005 implemented or validated in this review.

## 5. High/Critical finding disposition

- **FIND-P4B-01 (HIGH, 64/59/97 discrepancy):** disposition completed by the evidence-based count table above. Historical 64/97 remain unverified; current unlike counts are separately defined.
- **FIND-P4B-02 (CRITICAL, “zero inspected experimental datasets” / SurfPro unavailable):** historical finding is stale and superseded. DS-001 has a checked-in 1,624-record canonical CSV, pinned hash, and numerical inspection; DS-002/004/005 are also recorded as numerically inspected. The missing 895.5 MB microscopy ZIP remains not downloaded and must not be described as inspected.
- **FIND-P4B-03 (CRITICAL, Phase 5 locked):** this is not a defect to “fix”; it is the required fail-closed policy. Keep Phase 5 LOCKED. Reclassifying the gate as an open defect would reward bypassing the control.
- Earlier P1–P4 findings are historical audit records. This review does not fabricate independent approval for AUD-002/AUD-003 or claim external chemist sign-off. Their scientific and identity-validation limitations remain visible in their respective records.

## 6. Master-gate status

| Criterion | Current disposition |
|---|---|
| Corrected PR #97 dataset row semantics | PASS; merged as `426cc6d`, CI 7/7 |
| Historical 64/97 count disposition | Resolved as UNVERIFIED historical claims + reproducible current counts |
| 27,982 heterogeneous aggregate | Rejected as verified physical-observation count |
| Four registered dataset row inventories | Positive and cross-checked; counts are explicitly non-equivalent |
| Authoritative provenance | PARTIAL: metadata/source identity verified for named records; Zenodo license rights blank; 15861809 DOI cross-reference anomaly retained |
| Raw numeric accounting | PARTIAL: row inventories reconcile; historical sample/replicate semantics remain unresolved |
| Cross-artifact ledger consistency | PARTIAL: DS-002 and DS-005 row totals align; full original-cell/replicate lineage is not established for every artifact |
| Open HIGH/CRITICAL findings | P4B historical findings dispositioned; earlier audit records not independently approved by this AI review |
| ENG-003 matched prediction pairs | BLOCKED: product recipes undisclosed |
| ENG-005 implementation and pairs | BLOCKED: no implementation/callable entry point |
| Phase 4B closure | **NOT PASSED** |
| Phase 5 | **LOCKED** |

## 7. Explicit limitations

- AI Review only; `human_review=false`.
- No independent human/chemist approval is claimed.
- No new raw laboratory observations, replicate counts, formula inputs, or model predictions were fabricated.
- No `LAB_VALIDATED`, accuracy, or production-readiness claim is made.
- The 895.5 MB microscopy archive is not part of the inspected numerical workbook inventory.
- Commercial reuse rights for Zenodo records with blank Rights fields are not certified.

**Final decision:** retain Phase 4B as OPEN and Phase 5 as LOCKED. The evidence does not satisfy the master closure criteria, primarily because ENG-003 lacks matched formula inputs and ENG-005 has no executable implementation.
