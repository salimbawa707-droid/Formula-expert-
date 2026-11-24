# Phase 2 — Input Validation, Data Integrity & Category Applicability

**Status: IN PROGRESS — initial remediation committed; execution verification pending.**

Audit branch: `audit/phase1-engine-inventory-20261124`

## Scope

Phase 2 turns Phase 1 wiring findings into enforceable input contracts. Missing, invalid, ambiguous, or category-inapplicable inputs must not be silently converted into plausible scientific outputs. Every correction requires regression coverage and execution evidence.

## Confirmed defects and changes committed

### 1. Ambiguous sodium citrate grade was silently treated as dihydrate

**Finding:** `getChelatorBindingCapacity("Sodium Citrate")` correctly reports ambiguous hydration/grade as `INSUFFICIENT_DATA`, but `calculateFormulationChelationCapacity` then overrode that result with the dihydrate benchmark. This contradicted the grade resolver and could overstate binding capacity.

**Change:** Removed the forced dihydrate fallback. Capacity resolution now remains under `getChelatorBindingCapacity`. Expanded unknown-chelator classification to include citrate, GLDA, MGDA, EDTA, DTPA, STPP, phosphonates, HEDP, zeolite and polycarboxylate names, so unresolved builder/chelator identities are surfaced as unknown rather than silently ignored.

**Regression coverage added:** generic sodium citrate must return `INSUFFICIENT_DATA`, unknown-chelator status and non-authoritative provenance; explicitly named sodium citrate dihydrate retains its existing reference case.

### 2. DAG hardness calculation used implicit wash-scenario defaults

**Finding:** the hardness engine substituted 150 ppm when hardness was absent and policy defaults for missing wash volume/dose and batch size. The DAG also substituted policy values and a 100 kg batch before calling the engine. A missing wash scenario could therefore contain plausible-looking numeric metrics.

**Change:** Added opt-in strict scenario validation to `calculateWaterHardnessTolerance`. In strict mode, hardness, wash volume, wash dose and batch size must all be explicit and valid. Missing/invalid values return `NOT_EVALUATED`, `UNKNOWN` provenance, and unavailable numeric metrics rather than fabricated capacity/demand figures. The DAG now calls this strict mode with raw caller inputs and does not replace missing wash volume/dose/batch with policy defaults. Existing non-strict callers retain legacy behavior pending their own migration and audit.

**Regression coverage added:** missing scenario inputs and zero wash dose must remain `NOT_EVALUATED`; a complete explicit reference scenario must still calculate correctly.

### 3. DAG category applicability was not enforced for three profile-specific engines

**Finding:** the DAG ran HLB, water chelation and cleaning even when the canonical product profile excluded those engines.

**Change:** DAG now consults `isEngineApplicable` from `scientificRouter`:
- HLB is marked `NOT_APPLICABLE` when the category profile excludes HLB.
- Water chelation is marked `NOT_APPLICABLE` when the profile excludes chelation.
- Cleaning performance is marked `NOT_APPLICABLE` when the profile excludes cleaning.
- The execution trace now records `NOT_APPLICABLE` for these semantic skips.
- Cleaning no longer treats a non-applicable chelation engine as a failed hardness-protection result.

**Regression coverage added:** laundry powder HLB, toilet cleaner chelation, and fabric softener cleaning must be `NOT_APPLICABLE`.

### 4. Scenario assumptions were not consistently disclosed

**Finding:** DAG used 100 kg when batch size was absent and 25 °C when viscosity temperature was absent. These values are scenario assumptions, not measured production inputs.

**Change:** The 100 kg batch fallback is now added to the state assumptions with explicit scenario wording. The 25 °C viscosity reference is also recorded as an explicit assumption and shared by both viscosity calculations.

**Regression coverage added:** missing batch size must surface the 100 kg scenario assumption.

## Files changed

- `src/utils/chelatorEngine.ts`
- `src/utils/orchestrator/scientificExecutionDAG.ts`
- `src/utils/__tests__/p1Phase2Chelation.regression.test.ts`
- `src/utils/__tests__/p5PropertyPipelinesMaster.regression.test.ts`

## Verification state

- Source edits were committed to the audit branch.
- Regression assertions were added to existing test suites.
- **The new/updated tests have not yet been executed.**
- No branch CI result is claimed. The current quality-gate workflow does not run for a branch push without a pull request or manual dispatch.
- No production merge has been attempted.

## Remaining Phase 2 work

1. Audit and remove/label remaining silent defaults across the 55-module inventory, including pH, active matter, density, viscosity, cleaning, compatibility, costing and manufacturing inputs.
2. Validate all numeric domains: missing, null, zero, negative, NaN, Infinity, above-range values, invalid units, and malformed batch sizes.
3. Enforce category applicability consistently for all DAG engines and policy restrictions, not only HLB, chelation and cleaning.
4. Audit identity/grade resolution and ingredient assay provenance end-to-end.
5. Remove UI fallback calculations that can overwrite authoritative `INSUFFICIENT_DATA` results; keep the authoritative output contract consistent.
6. Add/complete tests, execute the full regression/build suite, inspect failures and fix them.
7. Update this report only when each item has source evidence and passing verification.

**Exit criterion:** Phase 2 remains open until all identified input-integrity and category-routing defects in scope are fixed, regression tests pass, and the evidence is recorded. Phase 10 will perform the final cross-engine integration re-audit; it is not a substitute for fixing Phase 2 defects now.


## Additional Phase 2 remediation — UI and staged workflow

### 5. AIFormulator duplicate fallback calculations removed

The primary `runDeepScientificAnalysis` path previously recalculated pH, cleaning, hardness/chelation and compatibility in the UI when orchestrator outputs were absent, and evaluated powder separately before the orchestrator evaluated it again.

**Change:** `runDeepScientificAnalysis` now consumes the orchestrator's canonical outputs only. Missing ingredient percentages are forwarded as invalid/unavailable values instead of being converted to zero. Powder lab measurements are passed through `CanonicalFormulaInput.powderLabInputs` and the DAG powder node; the powder report displayed by AIFormulator comes from the orchestrator.

### 6. Staged workflow fail-closed and duplicate powder path

The staged workflow previously retried pH with `getSolverReadyIngredients`, evaluated powder before the final orchestrator (which evaluated it again), called hardness with missing wash volume/dose, and supplied a fixed ₹45/kg target cost.

**Change:**
- Removed the secondary pH fallback; no numeric pH is accepted when the neutralization result has no identified acid/base or secondary buffer chemistry.
- Hardness calculation now uses strict explicit-input mode and optional `washVolumeL` / `washDoseGrams` fields.
- Cleaning/CPI stage now sets `failIfHardnessMissing: true` and passes only explicit wash scenario inputs.
- Powder evaluation is deferred to the authoritative DAG; the final staged result uses `orchestratorResult.powderReport`.
- Missing ingredient percentages are preserved as `NaN` for the validation gate rather than coerced to zero.
- Removed the hardcoded ₹45/kg target-cost context.
- Viscosity stage records the 25 °C engineering reference as an assumption/warning when no test temperature is supplied.

### 7. Scientific result UI no longer fabricates fallback metrics

The AIFormulator view model and result panels previously displayed defaults such as pH 7.00, HLB 0, cleaning score 85, 100% NVR coverage, 150 ppm hardness assumptions, 20 g / 10 L wash conditions, compatibility score 0/100 or PASS-like wording, safety score 100 / SAFE, and AI grade B+ even when no calculation was available.

**Change:** unavailable values now display as `N/A`, `NOT EVALUATED`, `PENDING`, or `INSUFFICIENT_DATA`; cleaning scores are no longer inferred from active matter alone; no hardness dose/volume is invented; compatibility and safety are not marked as passed without evidence. Category profile mapping is not labeled as laboratory verification.

## First CI feedback and correction record

- The first draft-PR CI exposed an incorrect import path for `isEngineApplicable`; corrected to the canonical `scientificProductProfiles` module.
- The next executed full regression run reported two assertions:
  1. An old data-contract test expected negative and above-100% chelator percentages to be clamped to zero. Updated to the fail-closed contract: `INSUFFICIENT_DATA`, invalid ingredient count, and no numeric total.
  2. The strict DAG path was not reading the canonical `washVolumeL` field. Added explicit `washVolumeL`, `waterVolumeL`, and `washDoseGrams` to the input contract and corrected the field mapping.
- Frontend build and P1 Phase 6 lab-evidence suite passed on an earlier intermediate commit; the full TypeScript regression suite had 2 failing assertions at that point. Later commits have not yet received a completed full CI run.
- Android debug APK job was cancelled by subsequent branch updates; no APK build result is claimed.

**Current state:** Phase 2 remains IN PROGRESS. Regression tests and full CI must be rerun against the latest branch head. The draft PR remains unmerged.
