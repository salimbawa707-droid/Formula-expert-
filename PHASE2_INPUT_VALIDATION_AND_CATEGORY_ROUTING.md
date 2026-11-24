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
