# CMC Optimization Objective — Scientific Eligibility and Benchmark Gates

**Status: NOT ELIGIBLE / DIAGNOSTIC ONLY**  
**Date:** 2026-10-25  
**Scope:** Decision gate for any future use of critical micelle concentration (CMC) in formulation optimization.

## Current implementation boundary

The optimizer may carry `cmcAssessment` as diagnostic metadata. It must not use CMC in objective scores, feasibility, dominance, Pareto rank, candidate selection, or evidence-status labels. The current ideal mixed-pseudophase/Clint calculation is a reference-model estimate under ideal-mixing assumptions; it is not a measured CMC for a finished detergent formula and is not a cleaning-performance metric.

A missing, invalid, inapplicable, or failed CMC calculation must remain explicitly unavailable. Do not substitute zero, a neutral/default number, a component's CMC, or an arbitrary fallback.

## Required gates before an opt-in CMC objective can be considered

All gates below are conjunctive. A failure in any gate keeps CMC diagnostic-only.

1. **Defined target and units**
   - Specify whether the target is pure-component CMC, binary-mixture CMC, multicomponent mixed CMC, or a finished-formula measurement.
   - Store the numerical value with explicit unit, temperature, solvent/water matrix, and method. Do not compare unlike target types or silently convert unknown units.

2. **Component identity and composition**
   - Resolve every surfactant to a canonical identity and exact source reference; record active-matter fraction and composition basis.
   - Unknown identity, unsupported component, missing active matter, or unresolvable composition makes the assessment ineligible.
   - Do not treat trade names or broad ingredient-name matches as confirmed chemical identity.

3. **Applicability domain**
   - Explicitly test whether the model/reference covers the mixture size, surfactant families, ionic character, counterions, temperature, salinity/hardness, solvent, and concentration range.
   - Binary-mixture benchmark evidence cannot be promoted to validated multicomponent or finished-detergent evidence.
   - Clint/ideal-mixing results must retain an ideal-model label and assumptions; no claim of empirical validation without direct evidence.

4. **Traceable evidence and licensing**
   - Every benchmark row must retain source DOI/URL, exact table/figure/row or workbook cell, source version/hash where available, license/reuse status, transcription/reconciliation status, and unit conversion history.
   - Separate measured observations, digitized/transcribed observations, model predictions, estimates, and imputed values. Imputed or estimated values are not ground truth.

5. **Independent benchmark quality**
   - Build a reproducible, versioned benchmark with independently reviewed source transcription and a discrepancy log.
   - Split by source/study (not random rows) to prevent leakage of related measurements across train/test sets.
   - Keep an untouched held-out set. Report sample counts by surfactant family, mixture order, and applicability slice.
   - Compare against a simple baseline and the existing ideal Clint baseline. Report MAE, RMSE, signed bias, uncertainty/calibration, and confidence intervals; publish per-slice metrics rather than a single aggregate score.
   - Define numerical acceptance thresholds before evaluating the held-out set. No threshold may be selected after seeing test results.

6. **Runtime fail-closed behavior**
   - Objective contribution remains disabled unless all eligibility fields and benchmark/model versions pass a single authoritative gate.
   - Non-finite values, missing uncertainty, unsupported domain, stale data version, failed provenance, or missing model artifact must block objective use.
   - A blocked CMC objective must not change candidate scores or rankings; record a machine-readable reason.

7. **Controlled opt-in and regression tests**
   - Keep the objective disabled by default and require an explicit configuration flag only after scientific review.
   - Add tests proving that ineligible/unavailable CMC cannot affect scores, constraints, feasibility, Pareto dominance, rank, or chosen candidates.
   - Add a paired regression proving eligible CMC changes only the configured objective and never changes evidence status to `LAB_VALIDATED`.
   - Record model version, dataset version, gate decision, and reasons in each optimization run.

## Current blockers

- No verified production CMC model adapter/weights are bundled.
- Existing P2SURF evidence is binary-mixture evidence and cannot alone establish broad multicomponent applicability.
- The Clint output is an ideal estimate, not a direct measurement of finished detergent formula CMC.
- Independent human review and a leakage-resistant held-out validation set are required before any accuracy claim.
- No CMC objective acceptance thresholds have yet been approved against a held-out dataset.

## Decision

**Do not enable CMC as an optimization objective yet.** Continue carrying the assessment as diagnostic-only metadata. Revisit only after the evidence ledger, applicability-domain checks, independent benchmark, predeclared thresholds, and fail-closed runtime gate are implemented and audited. Phase 4B remains OPEN; this document does not unlock Phase 5 or Phase 6.
