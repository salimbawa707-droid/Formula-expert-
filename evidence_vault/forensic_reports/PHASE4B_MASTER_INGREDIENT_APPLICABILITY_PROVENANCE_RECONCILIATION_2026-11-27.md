# Phase 4B — Master Ingredient Applicability, Provenance and Dataset Ledger Reconciliation

**Audit date:** 2026-11-27  
**Base:** `main`  
**Working branch:** `audit/phase4b-master-ingredient-applicability-provenance-2026-11-27`  
**Review route:** owner-authorized AI desk-screen; no human review or approval is claimed.  
**Disposition:** Phase 4B OPEN; Phase 5 LOCKED.

## 1. Canonical master ingredient source and baseline

The authoritative source is `src/data/universalIngredientLibrary.ts` (`UNIVERSAL_INGREDIENTS`). A source-level scan of the current main file found:

- **430 records**, 430 unique IDs, 0 duplicate IDs.
- **15 catalog classes**, not 13. The 13 are finished-product categories and are a separate taxonomy.
- **5,590 ingredient × product-category pairs** are required (430 × 13).
- CAS is null for 7 records; 423 records have a non-null CAS field. A CAS string alone does not establish grade purity or identity.
- Structured `provenance` exists on only **3/430** records; only **1/430** has a `sourceUrl` in the provenance object.
- No record has a populated `phMin` or `phMax`.
- The catalog's `activeDefault` and HLB fields are metadata values; they are not automatically supplier assays or experimentally verified values.
- Proprietary/composition-incomplete materials (including Aristo 9) must remain unknown until composition and grade evidence are supplied.

### Catalog class distribution

| Catalog class | Records |
|---|---:|
| Anionic Surfactant | 53 |
| Nonionic Surfactant | 61 |
| Amphoteric Surfactant | 28 |
| Cationic Surfactant | 20 |
| Additive & Performance | 31 |
| Neutralizer / Base | 29 |
| Alkaline Builder | 29 |
| Builder / Chelator | 40 |
| Enzymes | 20 |
| Polymer & Thickener | 36 |
| Solvent & Hydrotrope | 39 |
| Preservative & Biocide | 21 |
| Optical Brightener & Dye | 17 |
| Bleach & Oxidizer | 2 |
| Acid & Descaler | 4 |
| **Total** | **430** |

## 2. Implemented 430 × 13 AI screening matrix

Added `src/data/masterIngredientApplicabilityScreen.ts`. It generates one row for every live master ingredient and every canonical product category. It is intentionally a **preliminary chemistry-risk screen**, not a final APPLICABLE/NOT_APPLICABLE approval.

Each row carries:
- stable ingredient ID/name, catalog class, CAS, INCI, identity type, and commercial-grade record lineage;
- canonical product category;
- preliminary disposition: `CONDITIONAL_SCREEN`, `IDENTITY_OR_EVIDENCE_UNKNOWN`, or `CHEMISTRY_CONFLICT_RISK`;
- category-specific rationale;
- explicit critical unknowns and evidence still required;
- `finalApplicability: NOT_APPROVED` for every pair;
- commercial active default (explicitly not an assay), any supplier active-matter field, pH bounds, manufacturer/product identity, and provenance source/URL/verification status when present;
- whether the row has any provenance metadata.

Screening rules deliberately flag:
- anionic surfactant as a fabric-softener conditioning-active conflict risk;
- alkaline builder/base versus acidic toilet/bathroom descaler subclasses;
- acid/descaler versus alkaline laundry-powder, automatic-dishwash and kitchen-degreaser environments;
- automatic-dishwash surfactants as conditional on low-foam, rinse and machine compatibility evidence;
- enzyme, oxidizer, preservative, solvent, polymer, optical brightener and broad additive classes as requiring exact grade-specific evidence.

This matrix does **not** turn catalog class/name matching into scientific approval. Category subclass, supplier grade, active assay, concentration basis, pH stability, process, co-ingredients and measured compatibility/performance remain mandatory. Every generated row retains `NOT_APPROVED`; no concentration range is invented.

Added `scripts/test-master-ingredient-applicability-screen.ts` and wired it into `test:all`. The regression checks full 430 × 13 coverage, unique IDs, canonical category count, complete rationales, explicit unknowns, proprietary blend fail-closed behavior, representative charge-class conflict handling, and zero final approvals.

## 3. Ingredient provenance disposition

The catalog is not source-complete. Only three records have a structured provenance object and only one carries a provenance URL. Therefore **427 records do not have structured provenance metadata** in the master catalog. This is a catalog data-quality blocker, not something that can be repaired by inventing generic PubChem or supplier citations.

The AI screen records missing grade-specific TDS/SDS/CoA, assay, pH range, composition disclosure, compatibility and use-level evidence as unresolved. Do not use the current catalog defaults as verified supplier specifications. A follow-on evidence-enrichment pass must attach one exact source to each ingredient/grade, pin document identity/version and rights, and distinguish supplier assay from catalog defaults.

## 4. Evidence-vault source and rights reconciliation

The current `INITIAL_VAULT_STATE.evidence` contains **21 registered records**: EVD-001, EVD-002, and EVD-004–EVD-022. EVD-003 remains intentionally absent/quarantined and must not be fabricated.

Current structured rights states, read directly from the canonical registry:

| Rights status | Records |
|---|---:|
| PERMITTED_FOR_COMMERCIAL_REUSE | 7 |
| REVIEW_PENDING | 10 |
| RESTRICTED | 2 |
| UNKNOWN | 2 |
| **Total** | **21** |

Current download states:
- DOWNLOADED: 4 records (EVD-002, EVD-006, EVD-007, EVD-012).
- NOT_DOWNLOADED: 15 records.
- BLOCKED: 2 records (EVD-004 quarantine and EVD-013 retrieval block).

The canonical `evidence_vault/datasets/source-register.csv` has **28 data rows**. It contains source rows for the Zenodo workbook components, SurfPro, mixed-CMC/reference sources, PubChem, NIST and EVD-013–022. A source-register row is not equivalent to an archived source file; source bytes, hashes and rights must be checked per item.

### Important rights/provenance safeguards

- SurfPro EVD-001/EVD-002 remains RESTRICTED under the repository's CC BY-NC-SA dataset terms; do not commercially ingest absent separate permission. Software and data terms are not interchangeable.
- EVD-006/007/012 have commercial-reuse permissions recorded, but their scope is limited to their actual source data and attribution conditions.
- EVD-013 item-level CC BY 4.0 is recorded, but the source PDF bytes remain blocked/not downloaded and no repository SHA-256 is present. License permission does not prove archival.
- EVD-014 is article-level CC BY 4.0; source PDF is not archived in this repository.
- EVD-015/016/018/019/020/021/022 remain REVIEW_PENDING. Public accessibility or an author-uploaded copy is not a commercial reuse license.
- EVD-017 rights remain UNKNOWN; EU REACH text does not establish Indian regulatory compliance.
- EVD-004 remains quarantined because source identity is unresolved.

## 5. Dataset ledger reconciliation

The canonical dataset inventory contains four records: DS-001, DS-002, DS-004 and DS-005. All four are marked `NUMERICALLY_INSPECTED`; all four are `DEFICIENT` for model validation readiness. The inspected row counts are not independent replicate counts.

| Dataset | Recorded rows | Inspection | Validation readiness | Remaining boundary |
|---|---:|---|---|---|
| DS-001 SurfPro | 1,624 | NUMERICALLY_INSPECTED | DEFICIENT | Pure/component surfactant reference; commercial reuse restricted; not mixed-formula validation. |
| DS-002 Zenodo 18961871 | 11,626 | NUMERICALLY_INSPECTED | DEFICIENT | Numeric-bearing workbook rows, not independent samples; formulations undisclosed; no matched formula predictions. Per-workbook hashes live in parser/source manifests rather than one dataset hash field. |
| DS-004 PhDat v4 | 143 chemical records | NUMERICALLY_INSPECTED | DEFICIENT | Phase-behavior evidence; zero formula-validation-eligible records; reacquire/hash-check source file 45187180 before any new use. |
| DS-005 RepOD MKCDUM | 23 concentration-level rows | NUMERICALLY_INSPECTED | DEFICIENT | No raw replicate rows; PLL/RH concentration unit and Vmax volume-versus-height semantics unresolved; grouping audit needs source clarification. |

No dataset currently supplies eligible matched formula-prediction/observation pairs for the target engines. Consequently BLK-002 remains active. Parser success, numerical inspection and a CC BY license do not create model-validation eligibility.

## 6. Engine-count and historical accounting reconciliation

The canonical vault explicitly distinguishes unlike units:
- 55 unique existing paths in the legacy engine manifest;
- 61 engine-named source files excluding UI;
- 64 engine-named files including UI;
- 93 broad engine/calculator/router/workflow candidates;
- 6 top-level ENG-001–ENG-006 vault registry records.

Historical 59, 64 and 97 claims are not interchangeable with those counts and remain unreproduced without their original source artifacts/counting rules. The historical 27,982 aggregate is not accepted as a verified physical-observation count; 29,474 is a heterogeneous arithmetic sum, not a replacement physical total.

## 7. Closure decision

| Gate | Current disposition |
|---|---|
| Master catalog count and ID uniqueness | AI source scan: 430 records, 430 unique IDs |
| Ingredient × 13 category coverage | Implemented: 5,590 generated rows; regression gate added |
| Preliminary chemistry conflict / unknown screening | Implemented as triage only; no final approvals |
| Per-ingredient supplier-grade provenance | OPEN: 427 records lack structured provenance |
| Grade-specific pH/assay/use-level evidence | OPEN: no catalog pH bounds populated |
| Evidence registry identity / rights statuses | 21/21 structured; restrictions/pending/unknown remain |
| Source archival and source hashes | PARTIAL: only four evidence records downloaded; additional source-specific archival remains |
| Dataset inspection inventory | 4/4 inspected |
| Dataset validation eligibility | 0/4 ready; BLK-002 active |
| Historical accounting | Historical 59/64/97 and 27,982 claims not reproduced |
| Phase 4B | **OPEN** |
| Phase 5 | **LOCKED** |

**Decision:** Do not close Phase 4B and do not unlock Phase 5. The catalog screening and ledger reconciliation are materially advanced and reproducible, but evidence gaps are substantive: per-grade provenance, source archival, unresolved dataset semantics, and zero eligible matched formula-validation pairs. AI dual-pass review cannot authenticate missing supplier documents or manufacture experimental observations.

## 8. Reproduction

- Canonical ingredient source: `src/data/universalIngredientLibrary.ts`
- Category source: `src/domain/productTaxonomy.ts`
- Generated matrix: `src/data/masterIngredientApplicabilityScreen.ts`
- Regression: `scripts/test-master-ingredient-applicability-screen.ts`
- Evidence registry: `src/domain/vault/initialData.ts`
- Source register: `evidence_vault/datasets/source-register.csv`

Run `bun run scripts/test-master-ingredient-applicability-screen.ts` and `bun run test:all`.
