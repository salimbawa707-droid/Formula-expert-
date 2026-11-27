# Phase 4B — Six Residual Candidate Data-Flow, Export-Chain and Runtime-Wiring Audit

**Audit date:** 2026-11-27  
**Audited base:** `efcb7fe003152e776cc0199288a5677d063fb93e` (main after PR #122)  
**Scope:** Four candidates without a direct executable invocation in the 93-candidate AST graph, plus two candidates previously classified as test-only.  
**Method:** Current source inspection, TypeScript import/export and call-site searches, test-harness inspection, vault-registry inspection, and cross-check against optimizer/orchestrator entry points.

## Executive result

The six candidates do not share one disposition. Two are legitimate type/barrel modules used by production code; one is a fail-closed model adapter contract with no verified inference adapter; one is an implemented measured-series analysis function with test coverage but no production caller found; one is a fail-closed CMC objective policy gate used only by tests; and the CMC data actually attached to optimizer candidates comes from a separate calculator path, not from the orphan `cmcPredictor` module.

No candidate was deleted or promoted to a scientific validation status. The audit is source-level: absence of a statically found caller is not proof against reflection, computed imports, external consumers, or runtime injection.

## Candidate-by-candidate findings

### 1. `src/engines/surfactant/cmcPredictor.ts` — no production importer / fail-closed adapter contract

**Exports inspected:** `validateCmcInputs`, `predictCMC`, `clintIdealCMC`, and CMC adapter/result types.

- The module explicitly states that no model is bundled or invoked.
- `predictCMC` validates composition and temperature, then returns `UNAVAILABLE` with `MODEL_NOT_WIRED` when no adapter is supplied.
- Adapter output is accepted only with positive finite mM value, citation text, confidence, method and model-version metadata; this is metadata validation, not independent verification that the citation or artifact is authentic.
- Exceptions fail closed; no fallback numerical prediction is fabricated.
- `clintIdealCMC` implements the binary ideal Clint harmonic relation, but the helper has no production caller found in the audited source search.
- No production import of this module or configured SurfPro/P2SURF adapter was found.

**Separate live CMC path:** `src/utils/calculators.ts::calculateMixedCMC` is imported by `src/utils/optimization/multiObjectiveOptimizer.ts`. Candidate evaluation calls it and attaches the result as `cmcAssessment` diagnostic metadata. The optimizer's objective structure has no CMC objective; regression coverage asserts that CMC does not enter objective scores. The AI Formulator also exposes a wrapper around `calculateMixedCMC`. This does not wire `predictCMC` or the adapter contract.

**Disposition:** `IMPLEMENTED_FAIL_CLOSED_CONTRACT / NO_MODEL_RUNTIME_WIRING`. Keep separate from the working Clint diagnostic path. Do not report SurfPro/P2SURF inference as integrated.

### 2. `src/utils/foamKineticsEngine.ts` — test-only callable, not production-wired

- Exports `analyzeFoamDecayReplicate`; the only direct import/call path found is `src/utils/__tests__/foamKineticsEngine.test.ts`.
- The suite is explicitly imported and run by `src/utils/test-calculations.ts`.
- The vault registry in `src/domain/vault/initialData.ts` records the source file, entry-point name, inputs and outputs. That registry record is metadata; it is not a runtime import or execution path.
- The implementation accepts measured time/height observations, optional liquid-level and bubble-area series, and caller-defined fitting windows. It returns descriptive fits and an observed half-height crossing.
- The source explicitly says it does not predict foam generation or stability from recipe ingredients, surfactant class, or water hardness. Its warning also says the observed threshold crossing is not a kinetic half-life.

**Disposition:** `CODE_IMPLEMENTED / TEST_EXECUTED / NO_PRODUCTION_CALLER_FOUND`. Registry metadata should not be interpreted as production wiring. It is suitable as a measured-data analysis utility only; it is not a detergent-formula foam predictor and has no formula-to-foam validation status.

### 3. `src/utils/optimization/cmcObjectiveEligibilityGate.ts` — test-only fail-closed policy evaluator

- Exports `evaluateCmcObjectiveEligibility` and evidence/decision types.
- The only direct import found is in `src/utils/__tests__/formulationOptimization.regression.test.ts`.
- Tests verify missing evidence blocks eligibility and explicit opt-in is required.
- The module's own header says it is not wired into Pareto scoring and cannot make CMC eligible by itself.
- The gate checks a collection of caller-supplied booleans, counts and metrics. Passing those fields would produce `ELIGIBLE_FOR_REVIEW`, not laboratory validation. The function does not itself authenticate source files, verify a model artifact, or calculate benchmark metrics.

**Disposition:** `TEST_ONLY / NOT_PRODUCTION_WIRED / FAIL_CLOSED_POLICY`. Do not describe the gate as active optimizer enforcement. If it is later wired, its evidence manifest must be constructed from independently verifiable artifacts rather than trusted as user-asserted booleans.

### 4. `src/utils/powderEngine/types.ts` — type-contract module used by powder implementation

- Contains TypeScript type aliases and interfaces, including `PowderMassBalanceReport`, powder property reports and input/output contracts; no runtime calculation entry point was found in the file.
- `PowderMassBalanceReport` is imported by `powderMassBalance.ts`, `powderMoistureDryMatter.ts`, and `powderVerdict.ts`.
- The powder engine barrel imports its input/report types and re-exports the types. The powder evaluator and component engines use these contracts.
- The imports are type-level dependencies; they should not be expected to create JavaScript runtime calls.

**Disposition:** `PRODUCTION_TYPE_DEPENDENCY / NO_RUNTIME_BODY_BY_DESIGN`. The AST invocation graph's lack of a function invocation is not evidence of dead code. Preserve it; classify type references separately from executable call sites.

### 5. `src/utils/specificationEngine/index.ts` — production barrel/re-export module

- Re-exports types, unit conversions, lab data manager, evaluator, comparator, templates and release-gate engine.
- `src/utils/orchestrator/scientificExecutionDAG.ts` imports `evaluateSpecifications` and `getSpecificationTemplateForCategory` from this barrel.
- P0 remediation tests also import the same public surface.
- The barrel itself has no calculation body, but it is an active production export boundary.

**Disposition:** `PRODUCTION_BARREL / RUNTIME_EXPORT_CHAIN_CONFIRMED`. Do not mark unused based on no direct function body or no direct invocation inside the barrel. Track the exported function's downstream calls separately.

### 6. `src/utils/specificationEngine/types.ts` — type-contract module used by production specification engines

- Contains TypeScript interfaces and type aliases for specification parameters, templates, measurements, reports, formula snapshots and comparisons.
- The specification barrel re-exports these types.
- Specification templates, evaluator, release-gate, lab-data and comparison modules import the types directly; the dashboard and regression suites also consume them.
- The module contains declarations rather than runtime scientific calculations.

**Disposition:** `PRODUCTION_TYPE_DEPENDENCY / NO_RUNTIME_BODY_BY_DESIGN`. Preserve and count type-level edges independently of runtime invocation edges.

## Cross-cutting data-flow correction

The previous shorthand “CMC is not in the optimizer” is too broad. The accurate current statement is:

1. `calculateMixedCMC` is called during candidate evaluation and its result is carried as `cmcAssessment` diagnostic metadata.
2. CMC is not a Pareto objective, feasibility criterion, dominance input, or candidate-ranking score.
3. `predictCMC` in `cmcPredictor.ts` is not called by that path and has no verified model adapter.
4. `evaluateCmcObjectiveEligibility` is not called by the production optimizer; its fail-closed behavior is currently regression-tested only.

This distinction must be retained in future architecture and scientific reports.

## Evidence paths inspected

- `src/engines/surfactant/cmcPredictor.ts`
- `src/utils/calculators.ts`
- `src/utils/optimization/multiObjectiveOptimizer.ts`
- `src/utils/optimization/cmcObjectiveEligibilityGate.ts`
- `src/utils/__tests__/formulationOptimization.regression.test.ts`
- `src/utils/foamKineticsEngine.ts`
- `src/utils/__tests__/foamKineticsEngine.test.ts`
- `src/utils/test-calculations.ts`
- `src/domain/vault/initialData.ts`
- `src/utils/powderEngine/types.ts`
- `src/utils/powderEngine/index.ts`
- `src/utils/powderEngine/powderMassBalance.ts`
- `src/utils/powderEngine/powderMoistureDryMatter.ts`
- `src/utils/powderEngine/powderVerdict.ts`
- `src/utils/specificationEngine/index.ts`
- `src/utils/specificationEngine/types.ts`
- `src/utils/orchestrator/scientificExecutionDAG.ts`

## Limits and next audit

This is a static source and test-harness audit, not proof from instrumented production runtime telemetry. Dynamic imports, reflection, external consumers, or runtime injection can evade text search. The next pass should inspect all remaining candidates for scientific target, governing equations, input/output units, category applicability, evidence provenance, validation dataset match, uncertainty, and whether the runtime category router prevents cross-category leakage. No engine is promoted to `LAB_VALIDATED` by this report.
