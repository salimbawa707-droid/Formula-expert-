# Phase 4B — EVD-014 to EVD-022 source-document and metadata reconciliation

**Audit date:** 2026-11-26  
**Audited branch baseline:** `main` at `1127bf3fe40564f5d134fb9a67f61f80384e2151`  
**Working branch:** `audit/phase4b-evd014-022-reconciliation`  
**Scope:** source identity, primary-source access, repository archival state, numerical-inspection status, rights disposition, scientific applicability, and registry/source-register consistency.  
**Human review:** not performed by this audit.  
**Phase 4B:** OPEN. **Phase 5:** LOCKED.

## 1. Executive result

The earlier statement that EVD-014 through EVD-022 were absent was branch-specific and incorrect for `main`. The canonical `INITIAL_VAULT_STATE.evidence` registry on the audited main baseline contains all nine records EVD-014 through EVD-022. The complete registry contains **21 records**: EVD-001, EVD-002, and EVD-004 through EVD-022. EVD-003 remains absent as a deliberate quarantined/out-of-scope identity gap, not as an inferred missing source.

All nine records now have source-register entries. Source identity and scientific scope have been reconciled against the best available primary or official sources. Two metadata corrections were applied:

1. **EVD-021 / BASF Pluronic PE 6400:** the BASF European product-range PDF explicitly places PE 6400 in the “Low-foaming Nonionic Surfactants” section and reports 40% EO, cloud point approx. 60/A, viscosity approx. 2,900 mPa·s, and liquid form at 23°C. Its numerical inspection status is updated to `NUMERICALLY_INSPECTED`. This remains a manufacturer specification, not an independent foam test or formula validation.
2. **EVD-022 / Croda Croduret 40:** the record now points to Croda’s direct Croduret 40 product page and no longer labels it a “Home Care product.” The page is under Croda Beauty, lists **Skin care** as its category, and mentions superfatting benefits in detergent systems only as an ancillary statement. It does not provide laundry/dishwashing performance data.

**Archival limitation:** none of the nine EVD-014–022 source documents has been committed into `evidence_vault/sources/` on the audited main baseline. Their registry `downloadStatus` therefore remains `NOT_DOWNLOADED`; no source-file SHA-256 is fabricated. The existing `evidence_vault/sources/` directory contains the Pušić source PDF and page images, not these nine documents.

## 2. Per-record reconciliation

| ID | Primary source and identity | Source review result | Rights / archival disposition | Applicability boundary |
|---|---|---|---|---|
| EVD-014 | Asano et al. (2025), *Journal of Oleo Science* 74(4), 377–384, DOI 10.5650/jos.ess24197; J-STAGE article and publisher PDF | Publisher PDF inspected. Reports AES/DDAO systems, C12MEA(2), C12AE(20), CMC and dynamic-surface-tension rate. The PDF explicitly states CC BY 4.0. | `PERMITTED_FOR_COMMERCIAL_REUSE` at article level, with attribution; source PDF not archived in repo. | Manual dishwashing AES/DDAO mechanistic evidence only. Dynamic surface-tension rate is not foam height, decay, or half-life; no ENG-005 validation. |
| EVD-015 | Bozetine et al. (2008), *Journal of Surfactants and Detergents* 11(4), 299–305, DOI 10.1007/s11743-008-1089-z; Wiley publisher record and CORE full-text copy URL | Publisher metadata and the CORE-hosted full-text PDF were inspected. The article reports a 30-run central-composite design with four center points; Table 3 reports the design responses. The plate-count model has R² = 0.47 (weak in-design fit), while the viscosity model has R² = 0.92 (in-design fit only). The authors explicitly warn that the result is application-specific and unlikely to generalize across products/suppliers. The PDF is readable online but is still not archived or hash-pinned in this repository. | `REVIEW_PENDING`; accessible repository copy does not grant commercial reuse. Not archived in repo. | C12–C14 APG in manual dishwashing with LAS/SLES/betaine. Kinematic viscosity (cSt) cannot be compared to ENG-003 dynamic viscosity (cP) without density and matched method. No foam-decay series. |
| EVD-016 | Blagojević et al. (2016), *Journal of Surfactants and Detergents* 19(2), 363–372, DOI 10.1007/s11743-015-1784-5; Wiley publisher record and author-uploaded ResearchGate full text | Publisher metadata and author-uploaded full text inspected. Six formulation systems are described; the plate-count test reports five experiments per formulation as means. Foam response is a free-flow foam-height test. | `REVIEW_PENDING`; AOCS 2015 copyright notice and ResearchGate copyright warning; no open commercial reuse license verified. Not archived in repo. | Manual dishwashing SLES/AOS/AO systems with specified 7EO grades. Results are formulation-specific; foam height is not foam half-life. No direct laundry transfer or ENG-005 validation. |
| EVD-017 | ECHA REACH Annex XVII Entry 46 / Entry 46a official regulatory texts | Official ECHA Annex XVII PDF inspected. Entry 46 restricts NPE at >=0.1 wt.% for domestic cleaning and listed uses. Entry 46a concerns NPE in specified textile articles; it is not a second detergent-mixture threshold. | Registry rights state `UNKNOWN`; separate reuse review not completed. Official source not archived in repo. | EU regulatory reference only. It does not establish Indian law. Do not infer India compliance from this EU restriction. |
| EVD-018 | Unilever EP3622047A1 / EP3622047B1, “Liquid laundry detergent composition”; public patent text | Patent full text inspected. Four LAS:NI:SLES blend ratios are reported with and without 4 wt.% AEC; eight EMPA 117 monitors were used for confidence limits. The reported ΔR460 is the incremental benefit of AEC versus its corresponding control. | `REVIEW_PENDING`; patent and data reuse/patent-family status require jurisdiction-specific legal review. No PDF archived. Google Patents labels the European record “Revoked” but explicitly says legal status is an assumption, not a legal conclusion; verify the EPO Register before legal reliance. | Liquid laundry formulation context only. The result is not isolated nonionic efficacy, and the changing blend ratios/AEC response are confounded. No foam, CMC, viscosity or matched engine prediction pair. |
| EVD-019 | Malihi et al. (2011), *Tenside Surfactants Detergents* 48(5), 395–399, DOI 10.3139/113.110145; publisher metadata and author-uploaded ResearchGate full text | Bibliographic identity and full-text OCR inspected. The source discusses C12–C14 AE-7/AE-2 with LAS and reports a test-specific >370 ppm Ca2+ precipitation threshold for a stated LAS/AE-7 composition. The scanned CMC table OCR is materially garbled; exact CMC values are not promoted. | `REVIEW_PENDING`; Carl Hanser copyright, no open commercial reuse license verified. Not archived. | Bounded LAS/AE interaction reference. Numerical inspection remains `IN_PROGRESS`; visual table/figure verification is still required. No direct formula, foam, or viscosity validation. |
| EVD-020 | Teerasathittham (2018), Chulalongkorn University M.Sc. thesis, DOI 10.14457/CU.the.2018.161; official NRCT PDF | Official thesis PDF inspected. Author/title/year and 67-page thesis identity confirmed. The source reports AE7/AE9 and LAS mixed-soil experiments; Appendix A Tables A1–A5 contain 53 surface-tension/concentration points. The internal 74.4%/74.5% detergency discrepancy is preserved. | `REVIEW_PENDING`; author-submitted university thesis full text is accessible, but no commercial reuse license was verified. Not archived. | Specific 65/35 polyester/cotton, palm-oil/kaolinite, 30°C test. 2 wt.% NaCl is salinity, not water hardness. Pure-CMC benchmark candidate only; no engine validation. |
| EVD-021 | BASF Product Finder PRD 30044133 / CAS 9003-11-6 and BASF European product-range PDF | Product identity checked. The product-range table lists PE 6400 under “Low-foaming Nonionic Surfactants”: 40% EO, cloud point approx. 60/A, viscosity approx. 2,900 mPa·s, liquid at 23°C. | `REVIEW_PENDING`; manufacturer-content reuse not separately assessed. Product-range PDF not archived; current grade-specific TDS/SDS/CoA remains to be obtained. | Manufacturer category/specification evidence only. The low-foaming portfolio classification is not a measured foam-suppression curve, half-life, dosage recommendation, or target-formula validation. |
| EVD-022 | Croda Beauty official Croduret 40 product page, direct URL: https://www.crodabeauty.com/en-gb/products/product/198-croduret_1_40 | INCI PEG-40 Hydrogenated Castor Oil; page lists solubiliser/emulsifier functions, solid form at 25°C, and **Skin care** category. Text mentions wetting agent in styling waxes and superfatting benefits in detergent systems. | `REVIEW_PENDING`; manufacturer-content reuse not separately assessed. Page metadata inspected; product dossier links are login-gated; no local source copy. | Auxiliary emulsifier/solubiliser candidate only. “Superfatting benefits in detergent systems” is not a laundry/dishwashing wash test. Do not classify as Home Care or a primary detergent surfactant. |

## 3. Source-register and archival reconciliation

The canonical `evidence_vault/datasets/source-register.csv` previously had 18 data rows (19 lines including the header) and **zero EVD-014–022 references**. Nine source rows have now been appended, bringing it to 27 data rows (28 lines including the header), one for each record.

For every new row:
- the primary-source URL is explicit;
- source type and rights status are explicit;
- applicability is bounded to the actual tested/declared system;
- missing source-file hashes are labelled `NOT_ARCHIVED_NO_REPO_HASH`, not invented;
- follow-up actions preserve the remaining rights, retrieval, or scientific limitations.

The nine registry entries remain `downloadStatus=NOT_DOWNLOADED`. “Accessible online” and “downloaded and pinned in the repository” are different states. No SHA-256 is claimed for a file that is not committed.

## 4. Coverage calculation

### 4.1 Canonical evidence registry

The Phase 4B deliverable in `INITIAL_VAULT_STATE.phases[phase-4b]` says 21 evidence records are registered. Recounting the canonical array confirms **21/21 records present**. The missing numeric ID EVD-003 is an intentional quarantined/out-of-scope gap; it is not counted as a 22nd required record.

Across all 21 records, current status counts after the EVD-021 correction are:

| Dimension | Count | Interpretation |
|---|---:|---|
| Registered evidence records | 21/21 | Registry population complete against its declared 21-record inventory |
| Numerical inspection status = NUMERICALLY_INSPECTED | 11/21 | Includes experimental sources plus regulatory/manufacturer numeric references; not a Phase 4B completion percentage |
| Numerical inspection = IN_PROGRESS | 1/21 | EVD-019 |
| Numerical inspection = FAILED | 1/21 | EVD-004 quarantined citation mismatch |
| Numerical inspection = UNINSPECTED | 8/21 | Mixed source types; some are non-numeric reference/software leads |
| Downloaded source files | 4/21 | Existing downloaded records are EVD-002, EVD-006, EVD-007, EVD-012 |
| Rights status explicitly recorded | 10/21 | EVD-013 and EVD-014–022; 11 earlier records lack a structured `licenseReviewStatus` |
| Rights permitted for commercial reuse | 1/21 | EVD-014 only |
| Rights pending | 8/21 | EVD-013 and EVD-015/016/018/019/020/021/022 |
| Rights unknown | 1/21 | EVD-017 |

The EVD-015 PDF was subsequently retrieved as a readable CORE-hosted document during this audit; this corrects the earlier 403-only access observation. Its online readability does not change the repository download status or establish commercial reuse rights.

The 11/21 numerical-inspection figure is **not** a valid overall completion percentage: the 21 records mix experimental datasets, regulatory references, software, manufacturer specifications, and quarantined records. It must not be presented as “52.4% of Phase 4B complete.”

### 4.2 Experimental-source inspection

There are 12 `EXPERIMENTAL` records in the canonical registry. Nine are marked `NUMERICALLY_INSPECTED`, one is `IN_PROGRESS` (EVD-019), and two are `UNINSPECTED` (EVD-001 and EVD-013). Thus the current registry reports **9/12 = 75%** of experimental evidence records numerically inspected. This is an inventory status ratio only; it does not mean 75% of the scientific acceptance criteria, engine variables, or discrepancies are closed.

### 4.3 EVD-014–022 batch

For this nine-record batch:
- **9/9** are present in the canonical registry and now have source-register rows.
- **7/8 quantitative or numerical-specification sources** are marked numerically inspected (EVD-014, 015, 016, 017, 018, 020, 021); EVD-019 remains in progress. EVD-022 is a qualitative product-description page with no quantitative detergent-performance dataset, so it is not counted in this numerical denominator.
- **0/9** source documents are archived and hash-pinned in the repository.
- Rights are dispositioned for **9/9**: one permitted with attribution (EVD-014), seven pending (EVD-015, 016, 018, 019, 020, 021, 022), and one unknown (EVD-017). Therefore only **1/9** is currently cleared for commercial reuse.

### 4.4 Engine evidence coverage remains unchanged

Current per-engine evidence coverage in the canonical vault remains:

| Engine | Evidence coverage | Readiness | Consequence |
|---|---:|---|---|
| ENG-001 PHEngineV2 | 18% | DATASET_REQUIRED | No empirical pH/alkalinity validation dataset |
| ENG-002 CMC utilities | 15% | DATASET_REQUIRED | Literature references are bounded; ideal mixed-Clint model is not validated |
| ENG-003 ViscosityEngine | 0% | DATASET_REQUIRED | APG cSt results cannot be compared with cP without density/method match; no eligible matched prediction pairs |
| ENG-004 Chelator capacity | 12% | DATASET_REQUIRED | No eligible direct chelation titration dataset |
| ENG-005 FoamKineticsEngine | 0% | NOT_READY | No formula-to-foam predictor with matched time-series observations |
| ENG-006 CostingIntegrityEngine | 90% | READY | Deterministic/software evidence only; not physical detergent validation |

The EVD-014–022 batch adds useful source-specific context, especially for ENG-002, but it does not create eligible formula-prediction pairs for ENG-003/ENG-005 or validate any engine.

## 5. Governance and remaining blockers

1. **Human review policy remains active.** `PHASE4B_AI_ASSISTED_VERIFICATION_POLICY_ASSESSMENT.md` is explicitly a formal proposal only and rejects fully automated AI-only acceptance. Mandatory independent second-human review remains the current policy. An AI-only receipt cannot silently replace that rule.
2. **EVD-019 exact numerical review remains open.** The scanned table OCR is unreliable; original PDF visual transcription and discrepancy logging remain necessary.
3. **EVD-015 re-fetch/archive remains open.** The publisher record is confirmed, but the current retrieval attempt for the CORE PDF returned 403. The existing vault’s numeric-inspection status is retained as a prior review record; this audit did not independently reproduce all 30 rows.
4. **Commercial rights remain uncleared for eight of nine new records.** Do not copy protected tables/figures or redistribute source extracts in the commercial app while rights are pending.
5. **Source-file archival remains 0/9.** Obtain lawful copies where possible, store original bytes, calculate SHA-256, and pin the exact source version before claiming repository-level provenance.
6. **Phase 4B still has broader accounting, source-lineage, discrepancy, and engine-applicability gates.** The 21-record registry is not evidence that the 59-engine source inventory has complete empirical coverage.

**Decision:** EVD-014–022 source identity and metadata have been reconciled to the extent supported by accessible primary/official sources. The source register and two incorrect manufacturer metadata entries have been corrected. Phase 4B remains **OPEN**; Phase 5 remains **LOCKED**. No laboratory validation, commercial rights clearance beyond EVD-014, or engine validation is claimed.
