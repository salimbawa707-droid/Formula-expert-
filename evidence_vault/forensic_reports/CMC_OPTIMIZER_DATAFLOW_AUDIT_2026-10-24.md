# CMC-to-Optimizer Data-Flow Audit — 2026-10-24

## Status

**AUDIT COMPLETE — INTEGRATION NOT APPROVED.** This is a source-code contract audit, not a scientific validation or proof of model accuracy. Do not represent CMC as an optimizer objective until the blocking gates below are implemented and tested.

Audited against main commit `70948b7094da4162b0c8dbfc442ab90080666935`, with PR #22 merged.

## Findings

### 1. Two separate CMC paths exist; the predictor is not wired into formula optimization

- `src/engines/surfactant/cmcPredictor.ts` is a fail-closed adapter contract. It returns `UNAVAILABLE` when no verified model adapter is configured; no SurfPro/P2SURF weights or production inference adapter are bundled.
- `src/utils/calculators.ts::calculateMixedCMC` separately calculates a component-level ideal Clint estimate from supported pure-component CMC/MW references and explicit active-matter inputs. It does not call `predictCMC`.
- `src/utils/optimization/multiObjectiveOptimizer.ts::evaluateCandidateFormulation` creates candidate metrics from the scientific orchestrator and uses CPI, cost, active surfactant efficiency, scientific-risk penalty and a sustainability field explicitly marked `UNAVAILABLE`. Its `CandidateScientificMetrics` shape has no CMC field and the optimizer does not call `calculateMixedCMC` or `predictCMC`.

**Disposition:** CMC is not currently an optimizer objective. Do not describe it as integrated.

### 2. The existing Clint result is an ideal baseline, not a finished-formula prediction

The calculator requires exact supported component references and explicit active matter, converts active masses to mole fractions, and returns a theoretical ideal-baseline classification with lower confidence and stated limitations. It also identifies missing source evidence for active-matter inputs. The returned value does not model the complete detergent matrix, pH/speciation, ionic strength, homolog distribution, or all non-ideal interactions.

The committed P2SURF comparison is a binary-mixture benchmark. It is useful for characterizing limitations of ideal mixing for the covered pair classes, but is not validation of arbitrary finished detergent formulas or an integrated optimizer objective.

**Disposition:** Keep the Clint output as a separately labeled estimate/baseline. Do not use it to assert empirical detergency, finished-formula CMC, or LAB_VALIDATED status.

### 3. Predictor contract hardening passed CI, but it does not supply a model

PR #22 removes `LAB_VALIDATED` from the predictor evidence-level union, validates basic identity and adapter output metadata, and preserves fail-closed behavior for absent/failed adapters. The PR's engine verification and Phase 4B integrity/build CI runs passed. This verifies software checks only; it does not establish scientific accuracy, model provenance, applicability, or lab validation.

### 4. Adjacent optimizer correctness issue: missing pH can become a fabricated neutral value

In `src/utils/optimization/multiObjectiveOptimizer.ts::evaluateCandidateFormulation`, the code currently uses:

```ts
const finalPH = orchestratorResult.pHResult.ph ?? 7.0;
```

If the authoritative pH result is absent, the optimizer substitutes pH 7.0. In `src/utils/optimization/formulationConstraintEngine.ts`, the `PH_RANGE` check compares the number against the target bounds but does not explicitly reject a non-finite or unavailable pH value. The 7.0 substitution can therefore make missing pH evidence look like a real calculated result and influence candidate feasibility.

**Disposition:** Treat as a separate fail-closed remediation blocker before relying on optimizer feasibility. Preserve pH-unavailable state and make an applicable pH constraint fail explicitly when pH is missing/non-finite; add regression tests. Do not silently replace missing scientific outputs with a plausible number.

## Required sequence before CMC optimizer integration

1. **Close the missing-pH fallback defect** with explicit unavailable/invalid metric handling and regression tests.
2. Define an optimizer CMC metric contract with explicit states such as `AVAILABLE_ESTIMATE`, `UNAVAILABLE`, and a traceable reason; preserve model/evidence provenance, units, uncertainty, applicability domain, and formula fingerprint. Never coerce unavailable CMC to zero or a favorable objective score.
3. Decide whether the initial feature is only the Clint ideal baseline or a separately verified model. Keep the two methods distinct in type, UI, objective configuration, and reports.
4. For any learned model, pin licensed weights, preprocessing, version, runtime, source commit, and supported chemical domain. Do not assume a dataset's availability grants model-weight redistribution or commercial-use rights.
5. Benchmark on source-traceable measured data with grouped/identity leakage controls and a held-out test set. Report coverage, MAE/RMSE/bias and uncertainty by applicable domain. Binary-mixture benchmark results cannot be presented as finished-formula validation.
6. Add CMC to optimization only as an **opt-in, applicability-gated objective** after the preceding checks; unknown/out-of-domain values must remain unavailable and must not improve Pareto rank by default.
7. Keep Phase 4B open and Phase 5/6 locked until their independent evidence and review blockers are closed. No `LAB_VALIDATED` claim without qualifying measured records and the required independent review.

## Evidence links

- CMC predictor: `src/engines/surfactant/cmcPredictor.ts`
- Existing Clint calculation: `src/utils/calculators.ts` (`calculateMixedCMC`)
- Optimizer candidate evaluation: `src/utils/optimization/multiObjectiveOptimizer.ts` (`evaluateCandidateFormulation`)
- Constraint handling: `src/utils/optimization/formulationConstraintEngine.ts` (`PH_RANGE`)
- Integration gate: `docs/corrections/2026-10/CMC_INTEGRATION_GATE.md`
- Binary-mixture benchmark: `evidence_vault/forensic_reports/TASK4_ENG002_CLINT_CMC_BENCHMARK.md`
- PR #22 CI: https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40119887299 and https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40119887338

## Final decision

CMC-to-optimizer integration is **BLOCKED** until the missing-pH fallback is corrected and the CMC metric has an explicit evidence/applicability contract. The next implementation task should close the pH fallback defect first; then add CMC data-flow with unavailable-state propagation and tests.