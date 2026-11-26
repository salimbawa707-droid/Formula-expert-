# EVD-001–013 source disposition addendum

**Review date:** 2026-11-27  
**Review basis:** canonical vault registry, formal Phase 4B closure audit, existing source/dataset manifests, and authoritative source metadata reviewed in this pass.  
**Review type:** AI-assisted source and scientific applicability disposition; not independent human approval.

## 1. Decision

The AI-executable source-identity, rights-scope, and applicability disposition for the currently registered EVD-001, EVD-002, and EVD-004–EVD-013 records is **CLOSED WITH RESTRICTIONS**. EVD-003 remains absent as the established quarantined/out-of-scope identity gap; no source is invented to fill it.

This closes triage and disposition only. It does not close archival gaps, create missing raw observations, grant rights, or establish model validation.

## 2. Per-record final disposition

| ID | Source / evidence class | Rights disposition | Scientific/use disposition |
|---|---|---|---|
| EVD-001 | SurfPro project repository / code and dataset discovery source | RESTRICTED: repository license identifies CC BY-NC-SA 4.0 dataset terms; no commercial reuse without separate permission. Do not conflate software and data terms. | Discovery/provenance lead only. Dataset source is represented separately by EVD-002. No finished-formula validation. |
| EVD-002 | SurfPro Zenodo 15861809 CSV dataset | RESTRICTED for commercial use on the available upstream dataset-license evidence; Zenodo Rights field is blank. Preserve the DOI cross-reference anomaly: record DOI 15861809 while description points to 15750784. | 1,624 curated surfactant records and component properties; pure-component reference only. Existing bytes/hash are pinned, but no commercial ingestion. Not mixed-micelle or finished-formula validation. |
| EVD-003 | No canonical source record | NOT APPLICABLE — deliberately absent/quarantined gap | Do not create a substitute source or silently renumber later evidence. |
| EVD-004 | Citation-conflicted alleged chelation paper | UNKNOWN; identity and rights unresolved | QUARANTINED. Do not cite as detergent chelation evidence or ingest. Resolve publisher/PubMed identity mismatch before reconsideration. |
| EVD-005 | RheoData software/data catalog | REVIEW_PENDING: BSD-3-Clause applies to software only; individual datasets have independent terms | Discovery and schema reference only. Require a DOI-specific dataset, method, units, provenance and license before any measured-data use. |
| EVD-006 | Allgood & Jones household washing-up-liquid supporting dataset, Zenodo 18961871 | PERMITTED_FOR_COMMERCIAL_REUSE under official record CC BY 4.0, with attribution and modification notice | Four supplementary XLSX files archived and hash-checked. 11,626 numeric-bearing worksheet rows are not 11,626 independent experiments. Exact commercial recipes are undisclosed, so no matched formula prediction pairs for ENG-003; no formula-to-foam predictor validation for ENG-005. |
| EVD-007 | PhDat aqueous surfactant phase-behavior dataset, Figshare 29071202 v4 | PERMITTED_FOR_COMMERCIAL_REUSE under CC BY 4.0, subject to attribution and scope | 143 chemical records and large temperature/composition arrays; raw file hash is recorded. Phase-behavior evidence only; zero confirmed formula-validation-eligible rows and no detergent cleaning/pH/chelation validation. |
| EVD-008 | CurveClaw curve-digitization software | PERMITTED_FOR_COMMERCIAL_REUSE under GPL-3.0 obligations for software | Software may be used subject to GPL obligations. This license does not grant rights to digitize, reproduce, or redistribute third-party papers/figures. Digitized values must be labeled as digitized, with calibration and uncertainty. |
| EVD-009 | NIST Chemistry WebBook / SRD 69 | REVIEW_PENDING: Standard Reference Data Act and SRD-specific terms require item/use review | Reference source for thermochemical and acid-base data only. Do not call the whole SRD public domain or commercially clear without SRD-specific review. |
| EVD-010 | PubChem PUG-REST / NCBI chemical registry | REVIEW_PENDING: NCBI states it does not impose restrictions on hosted molecular data, but source-contributor rights may apply | Chemical identity/reference properties only. Review contributor/source provenance for each record before commercial reuse; not detergent-performance evidence. |
| EVD-011 | OpenAlex scholarly metadata/API | PERMITTED_FOR_COMMERCIAL_REUSE for OpenAlex metadata under CC0; linked third-party publications retain their own rights | Discovery and bibliographic metadata only. CC0 does not clear publisher PDFs, abstracts, figures, tables or linked full text. |
| EVD-012 | RepOD MKCDUM polyelectrolyte/surfactant foamability ODS | PERMITTED_FOR_COMMERCIAL_REUSE under file-level CC BY 4.0, with attribution | Original ODS and hash are recorded. 23 concentration-level rows are not replicate rows. Two systems only; unresolved PLL/RH concentration and Vmax unit/variable semantics block quantitative foam model use. |
| EVD-013 | Izawa, James & Yethiraj (2026), saline surfactant foam study and Figshare item 31314542 v3 | PERMITTED_FOR_COMMERCIAL_REUSE for the supplementary item under displayed CC BY 4.0, with attribution; source bytes still not archived | Item page identifies one 8.11 MB PDF, not a machine-readable raw time-series CSV or Igor Pro project. Four trials per salinity are reported for bubble-area series; PDF plots are not raw replicate rows. If curves are digitized, label them DIGITIZED_FROM_FIGURE and retain axis calibration/uncertainty. Triton X-100 + synthetic brines are adjacent physical-foam evidence, not detergent-formula validation. |

## 3. EVD-013 scientific interpretation and data boundary

The primary article reports long-time logarithmic foam-height decay across salinities and says bubble-scale measurements near the foam bottom are more sensitive to foam evolution. It studies a nonionic surfactant in saline solutions; it does not study a commercial detergent recipe. The source also cautions that conventional half-life is not meaningful for the non-exponential long-time decay.

The Figshare collection/item metadata previously inspected identifies:
- collection DOI 10.6084/m9.figshare.c.8304092;
- item DOI 10.6084/m9.figshare.31314542, version 3;
- displayed item license CC BY 4.0;
- one supplementary PDF, displayed size 8.11 MB.

Direct downloader returned HTTP 403 in the recorded acquisition attempt. No exact source bytes, SHA-256, or raw replicate-level time-series have been acquired in this repository. Do not invent a hash or infer raw data from plotted curves.

The current ENG-005 utility only analyzes measured time-series supplied by a caller. It is not a detergent-formulation foam predictor. EVD-013 does not change ENG-005 validation readiness.

## 4. Archival and rights ledger

| Gate | Status |
|---|---|
| EVD-001 / EVD-002 identity and rights boundary | CLOSED WITH RESTRICTIONS |
| EVD-004 quarantine decision | CLOSED; source remains unusable until identity is resolved |
| EVD-005 software-vs-data license distinction | CLOSED WITH RESTRICTIONS |
| EVD-006 / EVD-007 / EVD-012 open-license source disposition | CLOSED; attribution and scientific scope restrictions remain |
| EVD-008 GPL software vs third-party paper rights | CLOSED WITH RESTRICTIONS |
| EVD-009 / EVD-010 / EVD-011 rights scope | CLOSED WITH RESTRICTIONS |
| EVD-013 license and source metadata identification | CLOSED WITH RESTRICTIONS |
| EVD-013 exact PDF archival + SHA-256 | OPEN: bytes not acquired |
| EVD-013 raw machine-readable series | NOT FOUND in listed item; author/source-custodian request needed if raw data are required |
| Independent human second review | OPEN HUMAN TASK |
| Finished-formula prediction/observation pairs | 0 established by this batch |

## 5. No-go rules

1. Do not commercially ingest EVD-001/002 SurfPro data absent separate written permission; CC BY-NC-SA is not a commercial-use license.
2. Do not treat EVD-006 worksheet row totals as independent samples or formula inputs where recipe composition is undisclosed.
3. Do not convert EVD-012 concentration-level rows into replicate observations or guess unresolved units.
4. Do not treat EVD-013 plotted curves as raw data, or its saline Triton X-100 system as a laundry/dishwashing formulation benchmark.
5. Do not use software licenses (EVD-005/EVD-008) as licenses for third-party datasets or papers.
6. Do not promote any engine to LAB_VALIDATED or unlock Phase 5 from this evidence disposition.

## 6. Phase gate

EVD-001–013 source triage and AI-executable applicability/rights interpretation are **CLOSED WITH RESTRICTIONS**. The batch does not satisfy Phase 4B master closure: independent human approval, broader source archival/provenance, 59/55/61/64/93 engine-inventory reconciliation and matched empirical validation gates remain open.

**Phase 4B: OPEN. Phase 5: LOCKED.**
