# Phase 4B Scientific Closure and Phase 5 Readiness

**Audit date:** 2026-10-21  
**Repository:** https://github.com/salimbawa707-droid/Formula-expert-  
**Branch:** `main`  
**Audited source commit:** `c842b691584ec337408f238102e05c7a165ea1d1`  
**Decision:** Phase 4B remains **OPEN**; Phase 5 remains **LOCKED**.

This report records what was verified from the repository, completed GitHub Actions runs, repository audit records, and the public Zenodo record. It does not treat CI success as scientific validation. Earlier reports are historical unless their findings are explicitly reconfirmed below.


## Commit and report revision reconciliation

The evidence/code baseline assessed here is commit `c842b691584ec337408f238102e05c7a165ea1d1`. The report was first committed at `83288a0878f9599b1c6f022dace06376d219e7d4` and then extended with publisher-paper methods at `bc7e2633b313e80c3654877a3f04c010c78955cc`. GitHub's compare result shows these two commits added or amended only this report; they did not change application code or evidence bytes. The Phase 4B and Engine verification workflows passed on both report commits: [83288a0 Phase 4B](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/39641017826), [83288a0 Engine](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/39641017848), [bc7e263 Phase 4B](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/39642738949), and [bc7e263 Engine](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/39642738663). The last confirmed main SHA before this report revision was `bc7e2633b313e80c3654877a3f04c010c78955cc`. The SHA produced by this revision is recorded in Git history and delivery notes.

## Repository and software baseline

At audit time, `main` pointed to `c842b691584ec337408f238102e05c7a165ea1d1`. The commit changed the evidence-vault regression assertion to expect zero current quarantine stubs and to report the actual reconciled counts.

The following workflows completed successfully for that exact commit:

- [Phase 4B Integrity and Build Gates](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/39639084126): dependency installation, canonical workbook byte-integrity script, TypeScript typecheck, project test suite, and production build all passed.
- [Engine verification](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/39639084123): dependency installation, typecheck, regression suite, production build, and production HTTP smoke test all passed.

These results support software correctness checks on the audited commit. They do not establish source licensing, scientific applicability, or model accuracy. This audit did not run the project locally or inspect a local working tree.

## Dataset record and provenance

The primary record is [Zenodo record 18961871](https://zenodo.org/records/18961871), DOI [10.5281/zenodo.18961871](https://doi.org/10.5281/zenodo.18961871). The record identifies the dataset as “Rheometer methods for characterising and comparing foams: an example using household detergents,” by Ceri Allgood and Thomas Jones, published 2026-07-02 in connection with a 2026 *Rheologica Acta* article. Zenodo describes supplementary bubble sizes measured in MATLAB, film thicknesses measured manually in ImageJ, raw rheometer sweeps, and flow curves for washing-up liquid solutions and pure water.

The Zenodo record lists the two canonical workbook filenames, file sizes rounded to 22.3 kB and 149.9 kB, and MD5 values matching the repository's pinned values. This supports source-file identity, but this audit did not independently download and hash the source bytes.

The record's Rights section has no license value displayed. Commercial reuse and redistribution permission are therefore **UNCONFIRMED**. Public access is not a reuse license. The workbooks must not be treated as cleared for redistribution on this evidence.

## Canonical workbook status

The existing Phase 4B workflow passed its `scripts/verify_evidence_integrity.js` step on the audited commit. That script compares local bytes to pinned byte-size, MD5, and SHA-256 expectations and checks the ZIP local-file signature; it also checks that the two named quarantine stubs are absent.

| Workbook | Expected bytes | MD5 | SHA-256 | CI integrity script | Full XLSX parser audit |
|---|---:|---|---|---|---|
| `Supplementary_SolutionFlowCurves.xlsx` | 22,280 | `cd5bfd6e95fc65e412807d53935c2d96` | `90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590` | PASS on audited commit | NOT RUN |
| `Supplementary_FilmThickness_v1.xlsx` | 149,923 | `bc9582baafecd6552f6014216a0844e6` | `170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428` | PASS on audited commit | NOT RUN |

A ZIP signature does not establish that all XLSX ZIP entries are intact or that workbook XML is readable by an XLSX parser. Sheet dimensions, headers, units, cell types, missingness, duplicate observations, and malformed records remain unaudited in this execution. The prior recovery report documents that direct Zenodo downloads returned HTTP 403 at the time of that report; the Zenodo page currently corroborates the MD5 values, but no fresh byte-for-byte source download was performed here.

The 2026-10-21 remediation report and the recovery report contain historical statements that need to be read with their supersession notes. Current CI's stub-absence check and the current regression expectation of zero stubs supersede earlier statements that the two stubs remain present.

## Scientific applicability and model evidence

The Zenodo record supports that these are published measurements from a household dishwashing-liquid foam/rheology study. It describes the observable types and some measurement methods, but this audit did not inspect the workbook cells or recover full experimental conditions, replicate structure, units, and row-to-source lineage.

The repository's `round5_engine_validation_mapping.csv` maps some measurements to rheology and foam model outputs, while explicitly stating limitations. These data can only support a matched observable within the reported experimental system after content and applicability review. Film thickness and solution flow curves do not directly validate cleaning or detergency performance. No independent held-out model metrics were established by this audit, and no model is promoted to a higher scientific maturity.

The repository's `source-register.csv` continues to record the Zenodo entries as pending license/schema review. That conservative status is consistent with the blank rights field and the missing parser/content audit. Existing historic observation ledgers and model mappings are not substitutes for an independent leakage-safe validation evaluation.

## Acceptance gates

| Gate | Status | Evidence and remaining work |
|---|---|---|
| Canonical file byte integrity | **PASS (CI scope)** | Existing verifier passed for both pinned files on the audited commit. Independently reacquire/hash source bytes if required for provenance closure. |
| Full XLSX container and parser validity | **BLOCKED** | Current gate checks ZIP signature, not complete ZIP integrity or XLSX parser readability. Parse both workbooks and record workbook parts and parser results. |
| Authentic source confirmation | **PARTIAL** | Zenodo metadata lists filenames and matching MD5 values; direct source bytes were not freshly retrieved and compared. |
| Provenance completeness | **BLOCKED** | Recover and record complete methods, conditions, sample/replicate structure, and row/cell lineage. |
| License and commercial reuse | **BLOCKED** | Zenodo Rights field is blank; obtain authoritative license/permission before redistribution or commercial reuse. |
| Scientific content and applicability | **BLOCKED** | Inspect actual workbook cells and qualify each supported observable and domain. Do not infer detergency performance. |
| Transformation traceability | **BLOCKED** | Any normalized output needs immutable raw inputs, documented transformations, units, source-row lineage, and hashes. |
| Empirical model validation | **BLOCKED** | No independent, leakage-safe held-out validation metrics were produced by this audit. Keep existing maturity statuses. |
| Software regression, typecheck, build | **PASS on audited commit** | Both named CI workflows passed; see links above. |
| Report/registry consistency | **PARTIAL** | Current stub status is corrected in the latest test; historical recovery narratives and dataset/engine identifiers require ongoing reconciliation. |
| Required CI on audited source commit | **PASS** | Both named workflows completed successfully for `c842b691584ec337408f238102e05c7a165ea1d1`. |

## Closure decision and next evidence

Phase 4B is **OPEN** because parser validity, complete scientific content/applicability review, licensing, and independent model validation remain unresolved. Phase 5 is **LOCKED**. No phase flag or model maturity status is changed by this report.

To reconsider closure, provide a parser-backed audit of the canonical workbooks, authoritative license or written reuse permission, complete experimental metadata and row-level provenance, and independent validation evidence for any model claim. Then reconcile the canonical registries and rerun all required workflows on the resulting commit.


## Publisher-paper cross-check (2026-10-21)

The publisher article is [Allgood, Jones, and Boothroyd, “Rheometer methods for characterising and comparing foams: an example using household detergents,” *Rheologica Acta* 65 (2026), 819–834](https://doi.org/10.1007/s00397-026-01584-5). The article record identifies the paper as CC BY 4.0; this is a license for the article and does not, by itself, resolve the separate Zenodo dataset's blank Rights field or prove that the workbooks may be redistributed independently.

The article describes four foams made from UK washing-up liquids, using 2 mL of product in 300 mL deionised water. Foam tests used ambient laboratory temperatures of 19–22 °C. The exact commercial formulations are undisclosed. The rheometer was an Anton Paar MCR702e with a Powder Rheometry Flow Cell. The paper cautions that its wide-gap steady-shear foam tests cannot be interpreted as foam viscosity because only part of the foam sample sheared. These conditions narrow the potential applicability: relevant only to matching foam/rheology observables for similar dishwashing-liquid foam systems; they do not establish general household detergent, laundry, or cleaning-performance validity. [Publisher article and methods](https://link.springer.com/article/10.1007/s00397-026-01584-5)

The Zenodo dataset record lists Ceri Allgood and Thomas Jones as dataset creators. The article additionally credits Stephen C. Boothroyd. These are distinct metadata roles, not a conflict. The Zenodo page describes the solution flow curves as measurements on washing-up liquid solutions and pure water; actual sheet labels, units, sample identities, and conditions still require parser inspection before a quantitative model comparison.
