# Phase 4B — engine inventory reconciliation addendum

**Audit date:** 2026-11-27  
**Audited branch HEAD:** `2697d34b41cea515aa75590a9d669f89fda16077`  
**Method:** GitHub recursive Git tree inspection; source filename/path definitions; exact comparison against `engines_reconciled.list`. No source code was edited and no engine algorithm was tuned.

## 1. Reproduced inventory

| Count | Result | Definition | Status |
|---|---:|---|---|
| Legacy manifest paths | 55 | Unique non-empty entries in `engines_reconciled.list` | All 55 exist; all unique |
| Engine-named source files excluding UI | 61 | Non-test TS/TSX/JS/JSX under `src/` whose basename contains `engine`, excluding `src/components/` | Reproduced by Git tree |
| Engine-named files including UI | 64 | Same filename test, including 3 UI components | Reproduced; UI is not implementation count |
| Broad discovery candidates | 93 | Non-test source paths matching engine/calculator/optimizer/optimization/formulation/workflow/predictor/router | Discovery set only |
| Top-level vault engine records | 6 | ENG-001 through ENG-006 | Product-level registry records, not source-file count |
| Historical 59 claim | 59 (claimed) | Original artifact/counting rule not located | UNVERIFIED |
| Historical Audit Report A claim | 64 (claimed) | Original artifact/counting rule not located | UNVERIFIED |
| Historical architecture-spec claim | 97 (claimed) | Original artifact/counting rule not located | UNVERIFIED |

The 64 current UI-inclusive filename count happens to equal the historical 64 claim. This is a numerical coincidence; there is no evidence the old claim used this rule. The 59 historical claim is not reproduced by the current manifest or source-tree definitions. The 97 claim remains unsupported by its original architecture specification.

## 2. Exact path-level reconciliation

All 55 legacy manifest entries exist in the audited source tree and are unique. The current 61 engine-named source-file set contains six additional files not present in the legacy list:

1. `src/domain/ph/pHEngineV2.ts`
2. `src/utils/calibrationEngine.ts`
3. `src/utils/foamKineticsEngine.ts`
4. `src/utils/formulationEngineRouter.ts`
5. `src/utils/pHEngineAdapter.ts`
6. `src/utils/refinementEngine.ts`

There are zero legacy-list paths that are missing from the current tree and zero legacy entries outside the current engine-named source-file set.

This means the present 55-path list is a valid but incomplete legacy manifest relative to the current filename rule. It is not evidence that 55 (or 59) independent scientific engines exist.

## 3. Semantic classification caveat

A basename containing “engine” does not prove that a file is an independent scientific model. The 61-file set includes different implementation roles, including:

- physical/formulation calculations and screening;
- adapters and category routers;
- regulatory decision logic;
- manufacturing, inventory and cost workflows;
- laboratory automation, LIMS and evidence governance;
- spectroscopy signal-processing utilities;
- empirical validation, feedback and audit infrastructure.

Some modules are wrappers, adapters, registries, orchestration or deterministic business rules. They must not be counted as independent scientific predictors merely because of their filename. Conversely, relevant scientific modules without “engine” in the basename are absent from the 61 filename count and appear only in the 93 broad discovery set.

A defensible canonical capability inventory requires a code-level call-graph/dependency audit, duplicate/alias detection, entry-point inspection, and one-to-one mapping from capability to implementation. The current filename audit is not that semantic audit.

## 4. Disposition of the six omitted files

The six additions are recorded as manifest omissions, not automatically promoted as six independent engines:
- PHEngineV2 is the current pH equilibrium implementation.
- calibrationEngine proposes calibration candidates; it is not itself a physical chemistry predictor.
- foamKineticsEngine analyzes caller-supplied measured foam time series; it does not predict foam from formulation ingredients.
- formulationEngineRouter dispatches by product/formulation type; it is orchestration.
- pHEngineAdapter maps formulation ingredients into solver-ready inputs; it is an adapter.
- refinementEngine generates refinement proposals from accepted lab evidence; it is a workflow/decision component.

## 5. What remains unresolved

1. The original evidence behind historical 59, 64 and 97 counts is not present; only the present repository tree can be audited.
2. The 61 filename count does not establish 61 unique model capabilities or complete runtime wiring.
3. The 93 broad candidates still require code-level semantic classification; no source-code change is justified by count differences alone.
4. The 6 top-level ENG records are not yet a full module registry; the current scientific inventory intentionally describes only top-level target engines.
5. No engine has been promoted to LAB_VALIDATED. This audit does not create matched formula prediction/observation pairs.

## 6. Required next engineering task

Create a canonical capability-to-module map by:
- enumerating all 93 broad candidates;
- identifying exported entry points and direct call sites;
- grouping adapters, routers, orchestration, business rules, utilities and physical predictors separately;
- detecting aliases/wrappers and duplicate implementations;
- mapping each genuine capability to one or more evidence requirements and observable outputs;
- retaining the 55 legacy manifest paths and six omitted files as provenance, not as the canonical count.

Only after that code-level review should the team decide whether `engines_reconciled.list` should be expanded, renamed, or replaced. Do not append files merely to make a number equal 59.

**Decision:** source-tree count reconciliation is CLOSED for the definitions above; historical 59/64/97 reconstruction and canonical semantic capability inventory remain OPEN. Phase 4B remains OPEN; Phase 5 remains LOCKED.
