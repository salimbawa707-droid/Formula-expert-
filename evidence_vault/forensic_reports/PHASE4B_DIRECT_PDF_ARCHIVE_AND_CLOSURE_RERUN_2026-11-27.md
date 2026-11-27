# Phase 4B — Direct Source Inspection, Archive/Hash Attempt and Gate Re-run Addendum

**Date:** 2026-11-27  
**Repository branch:** `audit/phase4b-master-ingredient-applicability-provenance-2026-11-27`  
**Review type:** AI-only source and code audit. Not human approval, legal advice, supplier CoA verification, or laboratory validation.

## 1. Direct source reinspection results

### EVD-016 — Blagojević et al. (2016)
- Reopened the publisher's Wiley/AOCS article record and its full-text route. Publisher metadata and abstract confirm the tested system: SLES/AOS with CAB, cocamide DEA, alcohol ethoxylates (C12–C15 7EO, C10 7EO, C9–C11 7EO) and lauramine oxide, at 17, 23 and 42 °C.
- The publisher's full-text route resolves back to the abstract/metadata view in this environment; the publisher PDF was not retrievable as page images. The ResearchGate author-uploaded record exposes article text and a PDF-available flag, but access to a PDF-available page is not equivalent to an archived source-byte copy.
- Existing repository transcription of Tables 2–3 and foam-ability text remains a text-extract transcription, not freshly verified publisher-PDF page imagery in this pass. Foam results are apparatus-specific foam ability/height, not foam decay or half-life.
- **Disposition:** metadata/abstract cross-check complete; original PDF image reinspection, exact-byte archive, SHA-256 and commercial reuse permission remain OPEN. Keep use bounded to manual dishwashing.

### EVD-019 — Malihi et al. (2011)
- Reopened the ResearchGate author-uploaded full-text page. The extracted five-page article text exposes the method, Tables 1–2 and the detergent-test conditions. It explicitly states the powder chassis: 11% total surfactant, 41% STPP, 35% sodium sulfate, 6% soluble silicate and 6% sodium carbonate; the listed subtotal is 99%, and the missing 1% is not inferred.
- The extracted text confirms the test conditions: 2 g/L detergent, 45 °C, and 100/350 ppm Ca²⁺ water-hardness conditions. It reports the >370 ppm Ca²⁺ solubility threshold for the specific 12% LAS / 3% AE-7EO blend at 0.15% total surfactant use level. This is not a universal hardness tolerance.
- The repository's prior EVD-019 transcription records visual comparison of Table 1 and Table 2 on PDF page 4. The later AI re-review confirms all 7 Table 1 rows and 5 numeric Table 2 rows against the accessible text and recalculates the area-per-molecule arithmetic. The source PDF itself was not freshly downloaded or page-imaged in this pass.
- Gibbs-method issue remains carefully bounded: retain printed pure-LAS 59 Å² as the source value; separately record the n=2 theoretical recalculation (~118.7 Å²) under the no-excess-electrolyte assumption. Do not replace the source observation with the calculated value. Mixed-system effective n remains unreconstructed.
- **Disposition:** table transcription and second AI text/arithmetic cross-check complete; fresh PDF-byte inspection, rights clearance and SHA-256 remain OPEN. 41% STPP chassis means detergency results are not direct evidence for phosphate-free formulas.

### EVD-020 — Teerasathittham (2018) thesis
- Reopened the official NRCT DOI record. It confirms the title, author, Chulalongkorn University, year and abstract. The abstract states LAS+AE7 at 0.3 wt.% total surfactant and 2 wt.% NaCl as the highest-detergency condition at low salinity; particulate removal for tested mixtures could exceed 85%.
- Followed the DOI record's official Download link. It redirects to the Chulalongkorn repository PDF over HTTP, which the secure browser blocks as mixed content; the retrieval endpoint returned HTTP 500/unavailable. No PDF page images or Appendix A values were directly inspected in this pass.
- Chulalongkorn DigiVerse's own access policy distinguishes open-access full text, partial access for general users, member-only full text and abstract-only access. Repository listing alone is not proof of public full-text rights.
- **Disposition:** official abstract recheck complete; full thesis PDF/page-image inspection, Appendix A second transcription, exact-byte archive/hash and commercial reuse permission remain OPEN. Keep 2 wt.% NaCl classified as salinity, never as water hardness in ppm CaCO3.

### EVD-014 — Asano et al. (2025), permitted source candidate
- Existing primary-source recheck records direct inspection of the J-STAGE publisher PDF and an article-specific Creative Commons Attribution declaration on page 377, reconciled with the journal policy describing CC BY 4.0 / CC BY-SA 4.0 choices. The article selects CC BY, not CC BY-SA; use must retain attribution and notices.
- Attempted to retrieve the exact J-STAGE PDF bytes for repository archival and hashing in this pass. The binary download did not succeed in the available runtime. Therefore no SHA-256 is reported and the source is not marked archived.
- **Disposition:** article-level CC BY 4.0 documentary clearance remains verified by the earlier primary-PDF inspection; byte archival and SHA-256 remain OPEN. Scientific scope remains AES/DDAO dynamic surface-tension-rate reference, not foam half-life or finished-formula validation.

## 2. Archive and hash pinning

No new source binary was committed and no new SHA-256 was created in this pass. This is intentional: no exact source bytes were successfully retrieved into the repository workspace. EVD-014 is the only one of these reviewed sources with an article-specific commercial-compatible CC BY declaration verified; the attempted PDF download failed. EVD-016, EVD-019 and EVD-020 remain blocked from commercial redistribution pending source-specific permission. Public availability or author-uploaded copies do not establish redistribution permission.

**Archive/hash result:** 0 new source-byte archives; 0 new SHA-256 pins. No hash has been fabricated.

## 3. Regression failures discovered and remediated

The latest quality-gate run exposed stale assertions in `vaultLogic.regression.test.ts`: the test still expected only four numerically inspected datasets and expected DS-006–DS-009 to have null row counts, while the current vault explicitly records parsed source rows and numerical/structural inspection for the expanded inventory. The test has been updated to assert positive row counts and explicit `NUMERICALLY_INSPECTED` status for every registered dataset, while retaining the separate `DEFICIENT` readiness state.

The same run exposed a more serious fail-open condition: `canPromoteEngineToValidation` treated any structurally inspected linked dataset as sufficient for validation promotion. This is scientifically invalid because a dataset can be parsed while remaining ineligible due to unresolved units, identity, provenance, applicability or other deficiencies. The function now requires all of:
1. `NUMERICALLY_INSPECTED` status;
2. positive source row count;
3. `numericalValidationReadiness === 'READY'`; and
4. explicit `VALIDATION` or `TEST` designation.

A regression assertion now checks that the current DEFICIENT datasets cannot promote an engine, and a positive control checks that an otherwise eligible READY/VALIDATION dataset can satisfy the predicate. This is a gate-hardening change, not a declaration that any current dataset is READY.

## 4. Closure gate re-run — result

| Gate | Result | Reason |
|---|---|---|
| EVD-016 publisher metadata/abstract recheck | PASS WITH LIMITATIONS | No publisher PDF page-image retrieval |
| EVD-019 tables/method text cross-check | PASS WITH LIMITATIONS | Prior visual page-4 check documented; fresh PDF bytes unavailable; rights pending |
| EVD-020 official DOI abstract recheck | PASS WITH LIMITATIONS | Full thesis PDF endpoint inaccessible; no page-image verification |
| EVD-014 article-specific CC BY documentary review | PASS | Exact PDF was previously inspected; archive/hash still absent |
| New source-byte archival | NOT MET | 0 source bytes archived in this pass |
| New SHA-256 pins | NOT MET | No exact source bytes available to hash |
| Dataset row-count regression alignment | REMEDIATED IN CODE | Test updated to current eight-record inventory; CI rerun pending |
| Engine validation promotion gate | REMEDIATED IN CODE | Requires READY + VALIDATION/TEST + inspected positive rows; CI rerun pending |
| Rights completeness | FAIL | EVD-016/018/019/020/021/022 pending; EVD-017 UNKNOWN |
| 430-ingredient identity/applicability/provenance | FAIL | Prior audit gaps remain unresolved |
| Finished-formula matched prediction/measurement pairs | FAIL | BLK-002 remains active |
| Historical engine inventory reconciliation | FAIL / UNRESOLVED | 59/64/97 and 27,982 historical claims not fully reproduced |
| Phase 4B formal closure | NOT MET | Mandatory source, rights, catalog, dataset and historical gates remain open |
| Phase 5 | LOCKED | No bypass authorized |

## Final decision

**Phase 4B remains OPEN. Phase 5 remains LOCKED.** The source review was advanced where direct records were accessible, a stale dataset-inspection test was corrected, and a fail-open engine-promotion condition was hardened. However, source-byte archival/hash pinning did not complete, and the master ingredient, rights, dataset eligibility and historical inventory gates are still unmet. The new code changes require a fresh CI result before they can be called verified.
