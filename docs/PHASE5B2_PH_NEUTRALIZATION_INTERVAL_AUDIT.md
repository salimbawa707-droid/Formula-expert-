# Phase 5B-2 — pH and Primary Neutralization Interval Audit

**Status:** SOURCE AUDIT COMPLETE; BOUNDED PRIMARY-NEUTRALIZATION ADAPTER INTEGRATED; EXPLICIT PHEngineV2 SCENARIO EVALUATOR ADDED; GUARANTEED pH INTERVAL AND EMPIRICAL VALIDATION STILL BLOCKED  
**Base:** `main` at `e4948678d67d9246a897838fa5fdd4299097df08`  
**Branch:** `phase5b2/neutralization-interval-v2`  
**Scope:** pH equilibrium and primary stoichiometric neutralization only. This is a source-code audit, not empirical validation, laboratory validation, or release approval.

## Executive disposition

The existing single-value pH and primary-neutralization authorities are retained. Do not create a competing pH solver. The current implementation is not yet suitable for a defensible lower/nominal/upper pH result: uncertainty fields exist in the acid/base registry, but the live neutralization and pH paths do not propagate those bounds through the chemical equations and equilibrium solver.

**Phase 5B-2 remains BLOCKED from interval-result exposure** until the input contract, mass/water basis, species mapping, and solver scenario semantics below are implemented and tested. Existing nominal outputs may continue under their existing provenance/limitations; they must not be relabelled as bounded outputs.

## Audited source paths and findings

### 1. Acid/base profile already stores uncertainty, but the calculation API is point-valued

Source: `src/domain/ph/acidBaseDataModel.ts`

- `ScientificAssayRecord` includes `valuePct`, `lowerBoundPct`, and `upperBoundPct`.
- `EquivalentBasisRecord` also carries uncertainty metadata and an optional reactive-equivalent capacity.
- `calculateReactiveEquivalents(profile, rawMassKg)` uses `profile.equivalentBasis.reactiveEquivalentsPerKg` as a single scalar. It does not calculate lower/nominal/upper equivalents from the assay bounds.
- Therefore the registry's presence of assay bounds is not evidence that neutralization intervals are currently propagated.

Required correction: define an explicit, typed equivalent result with basis/unit/provenance and lower/nominal/upper equivalents. Derive bounds only when the assay and equivalent-weight/capacity bounds are on compatible, defensible bases. If equivalent capacity is not assay-linear or its bounds are unknown, return INSUFFICIENT_DATA for that interval rather than scaling blindly.

### 2. Primary neutralization currently consumes a nominal scalar

Source: `src/domain/ph/stoichiometricNeutralizationEngine.ts`

- `evaluatePrimaryNeutralization` resolves each ingredient profile and calls `calculateReactiveEquivalents`.
- The current path uses `eqResult.totalReactiveEquivalents ?? 0` for the internal scalar and separately detects some unknown-assay states.
- The returned state is a point neutralization classification and point reaction extent; it has no lower/nominal/upper interval contract.
- A bounded assay status with a nominal value can therefore feed a point stoichiometric calculation without exposing the uncertainty represented by the profile.

Required correction: never silently turn a failed equivalent calculation into a valid zero-equivalent contribution. Carry explicit input status and missing-input reasons. For interval scenarios, calculate acid and base equivalent intervals separately, then compute reaction extent and residuals per scenario. Do not independently subtract interval endpoints and assume that yields a physically realizable paired reaction.

### 3. pH equilibrium is nonlinear and currently point-valued

Sources:
- `src/domain/ph/types.ts`
- `src/domain/ph/compositionNormalizer.ts`
- `src/domain/ph/pHEngineV2.ts`
- `src/domain/ph/numericalSolver.ts`

The existing `PHEngineV2.calculatePH` normalizes one composition and runs one numerical equilibrium solve. The input contract accepts point assay/concentration fields; it does not expose an interval result or scenario provenance. The composition normalizer resolves a single active fraction for each input. pH is logarithmic and coupled to speciation, activity coefficients, ionic strength, water balance, and buffer equilibria.

**Prohibited shortcut:** do not linearly interpolate pH from assay bounds, neutralization percentage, or net equivalents. Do not call the point solver only at a low and high scalar pH seed and label those results chemical bounds.

Implemented checkpoint: src/domain/ph/phScenarioEvaluation.ts accepts complete, caller-supplied scenario compositions with evidence references and a shared batch/temperature/activity/slurry/solver basis. It calls PHEngineV2 for every scenario at initial guesses 3, 7 and 11, records convergence/residual/model diagnostics, and withholds the entire sampled envelope if any run is invalid, non-converged, or seed-sensitive. Its output is explicitly SAMPLED_SCENARIO_ENVELOPE_NOT_GUARANTEED_BOUND. It does not derive assay bounds from catalog profiles or from stoichiometric equivalents. A guaranteed pH interval remains blocked until supported input uncertainty, chemical scenario coverage and full-domain monotonicity/valid interval propagation are established.

### 4. DAG pH seed is a heuristic, not a measured or calculated pH

Source: `src/utils/orchestrator/scientificExecutionDAG.ts`

The `NEUTRALIZATION` node assigns intermediate constants 7.0, 3.0, or 11.0 from the neutralization status and passes the result to `PHEngineV2` as `targetPH` / initial solver guess in `PH_EQUILIBRIUM`.

The value is an initial guess, not a computed intermediate pH. The current code comments acknowledge this. The new scenario evaluator checks each supplied scenario at initial guesses 3, 7 and 11 and fails closed when the resulting pH spread exceeds 0.01 pH unit. This regression is limited to the explicit citrate/citrate-salt buffer fixtures; a wider formula-family seed-invariance audit remains required. Never surface `pHIntermediate` as a pH measurement or prediction.

### 5. DAG warning accumulation needs a regression

Fixed: src/domain/ph/phDiagnostics.ts provides mergePHWarnings, and the DAG merges local no-chemistry warnings with PHEngineV2 warnings using stable de-duplication. The regression verifies that both warning groups survive and duplicates are removed. This helper-level regression does not replace a future end-to-end DAG projection test.

### 6. Adapter and evidence preservation

Source: `src/utils/pHEngineAdapter.ts`

The adapter maps application ingredients into the pH engine input. The bounded implementation must preserve raw mass, active/assay bounds, provenance class, source/evidence references, and unknown mass across this boundary. It must not infer assay from a generic grade name, silently substitute registry nominal values for missing supplier data, or drop unrecognized formulation mass.

## Required implementation sequence

1. **Contract and input audit**
   - Add typed pH scenario inputs and result types without changing existing scalar API behavior.
   - Define exact mass, assay, equivalent-weight, water, temperature, and powder-slurry bases.
   - Validate (0 \leq lower \leq nominal \leq upper \leq 100\) for assay percentages and reject incompatible/missing bases.
   - Keep catalog defaults, user assumptions, published references, supplier specifications, lot CoA, and measured inputs distinct.

2. **Neutralization interval core**
   - Propagate lower/nominal/upper reactive equivalents only where the profile supports defensible bounds.
   - Evaluate acid/base pairing and limiting reagent per coherent scenario.
   - Return interval status, missing inputs, provenance and scenario count; never coerce unknown to zero.
   - Test acid-limited, base-limited, exact-equivalence, crossed-bound and unknown-assay cases.

3. **pH scenario solver**
   - Reuse PHEngineV2 as the only equilibrium authority.
   - Generate chemically valid scenarios from the interval inputs; do not use linear pH interpolation.
   - Establish monotonicity for each supported input family or label the output as a sampled scenario envelope.
   - Fail closed when any required scenario lacks recognized chemistry, has unknown assay/unrecognized mass, leaves the model domain, or fails convergence.

4. **DAG and UI consumers**
   - Keep heuristic neutralization state separate from pH output.
   - Verify initial-guess invariance and preserve warnings.
   - Propagate scenario evidence to DAG/staged analysis and show unavailable/partial states as N/A, not zero.
   - Do not allow an estimated pH interval to satisfy laboratory, formula approval, or release gates.

5. **Verification**
   - Hand-calculate acid/base equivalent cases independently.
   - Add property tests for mass conservation, reaction extent limits, endpoint ordering where mathematically established, seed invariance, and unknown-to-zero prevention.
   - Run full `test:all`, typecheck, production build/health, Android debug APK and WebView instrumentation on the exact PR head (7/7 Current Release Quality Gates).
   - Record exact head SHA and all job results before merge.

## Explicit non-claims

This audit does not claim pH interval support is implemented, that the pH engine is empirically accurate, that any commercial raw-material assay is verified, or that a finished formula is lab-validated. Phase 4B remains OPEN and Phase 5 empirical validation/calibration remains LOCKED.

## Implementation checkpoint — bounded arithmetic prototype

A new additive module, `src/domain/ph/neutralizationIntervalCalculations.ts`, now accepts explicitly bounded total acid/base reactive equivalents on a common batch basis and returns lower/nominal/upper reaction extent, residual equivalents, neutralization fraction and scenario classification. Water generation remains unavailable because aggregate equivalents do not establish reaction-product stoichiometry.

The module deliberately does **not** resolve ingredient names or derive assay/equivalent bounds. It rejects missing evidence references, mixed bases, invalid intervals, negative values and non-finite inputs. Unknown data returns null result intervals; it is never converted to zero. The strict adapter and additive engine/DAG wiring are now present; the adapter still blocks commercial LABSA because active assay alone does not establish total titratable capacity or free-acid contribution.

Regression coverage was added in `scripts/test-phase5b2-neutralization-interval.ts` and registered in `test:all`; the exact PR head passed the full Current Release Quality Gates workflow, including this regression, typecheck, production build/health and Android debug APK plus WebView instrumentation. A subsequent AI source review identified and removed an unsupported water-generation estimate: equivalents alone do not identify product stoichiometry. The evidence-preserving profile adapter and bounded neutralization assessment are now integrated additively into StoichiometricNeutralizationEngine; the scientific DAG exposes the assessment separately from its legacy nominal state. The pH scenario evaluator is implemented as a caller-supplied sampled-scenario tool, not a production lower/upper pH interval.


## Implementation checkpoint — strict profile-to-equivalent adapter

Added `src/domain/ph/neutralizationProfileIntervalAdapter.ts`. It derives total-batch equivalent intervals only for source-verified, pure reference chemicals with explicit lower/nominal/upper assay bounds, defensible molecular weight, and explicitly mono-functional strong-acid or mono-equivalent strong-base chemistry. It uses the formula's explicit raw mass or percentage plus a positive batch size. The adapter preserves source identity, source type, evidence level and assay status.

Fail-closed behavior is intentional: commercial LABSA (including the default 90% registry profile), estimated assays, missing mass, unsupported functionality, or any unsupported primary strong acid/base blocks the entire interval. Weak acids such as citric acid remain secondary chemistry in this primary-neutralization model; they are not promoted to strong primary acids or counted as reactive equivalents here. Their aqueous equilibrium contribution remains the responsibility of PHEngineV2. No unsupported primary reactant is silently dropped or converted to zero. The currently supported chemistry is narrow and must not be generalized to the full detergent ingredient catalog.

Regression coverage: `scripts/test-phase5b2-neutralization-profile-adapter.ts` is registered in `test:all`. It checks a hand-calculated pure LABSA reference / pure NaOH reference 1:1 equivalent case, commercial LABSA rejection, missing-mass rejection, and unsupported weak-acid rejection. The adapter returns an equivalent interval only and is connected additively to the production neutralization state and DAG diagnostic field. It does not calculate pH. Commercial LABSA and unsupported primary reactants remain blocked. Exact-head CI is tracked on the PR workflow.


## Implementation checkpoint — additive neutralization engine and DAG integration

StoichiometricNeutralizationEngine now attaches the adapter result as boundedNeutralizationInterval on every return path without replacing the legacy nominal neutralization result. ScientificExecutionDAG exposes that same assessment as neutralizationIntervalAssessment. This is a diagnostic-only side channel; releaseEligible remains false. The adapter still rejects unsupported primary reactants as a whole rather than omitting them.

## Implementation checkpoint — explicit PHEngineV2 scenario evaluation

src/domain/ph/phScenarioEvaluation.ts now evaluates at least two explicit complete compositions with mandatory evidence references and a common mass, temperature, activity, product/slurry and solver basis. Each scenario is evaluated by the existing PHEngineV2 at three initial guesses (3, 7, 11 by default). The evaluator records pH, convergence, residual, iterations, ionic strength, model validity and warnings for each run. It emits a min/max sampled scenario envelope only if every scenario converges and the seed spread is no greater than 0.01 pH unit. It returns no envelope when any scenario is insufficient, invalid, non-converged or seed-sensitive.

The scenario evaluator does not manufacture low/nominal/high inputs from catalog uncertainty or neutralization equivalents. The caller must provide complete scenario compositions and evidence references. Its output is not a guaranteed chemical bound, not a laboratory measurement, not an empirical accuracy claim, and cannot satisfy formula release gates.

## Implementation checkpoint — DAG warning preservation

mergePHWarnings now combines locally generated pH warnings with PHEngineV2 diagnostics and removes exact duplicates without dropping either group. The direct regression covers preservation and de-duplication. A broader end-to-end DAG warning projection test and wider family-specific initial-guess audit remain open.

## Verification scope

The prior integration head bd818422 passed all seven Current Release Quality Gates, including Android WebView instrumentation and APK artifact upload. The current scenario/warning implementation has its own exact-head workflow; do not reuse the earlier pass as evidence for the newer commit. Phase 4B remains OPEN and Phase 5 empirical validation/calibration remains LOCKED.
