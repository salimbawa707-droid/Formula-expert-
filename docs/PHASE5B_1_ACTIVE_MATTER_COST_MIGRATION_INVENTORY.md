# Phase 5B-1 — Active Matter and Cost Call-Site Inventory

Date: 2026-11-28  
Status: first production consumers migrated; remaining call-site migration is in progress and is NOT COMPLETE.  
Boundary: preliminary scenario calculations only; no supplier/lot/formula release promotion.

## 1. Current implementation

Added `src/utils/preliminaryBoundedCalculations.ts` with:
- Explicit evidence classes: MEASURED, SUPPLIER_SPECIFIED, PUBLISHED_REFERENCE, ENGINEERING_ESTIMATE, CATALOG_DEFAULT, USER_ENTERED and UNKNOWN.
- Unit, basis, numeric-range and provenance validation.
- Active-matter interval propagation through raw mass fractions.
- Cost interval propagation through formula mass fractions, with optional batch-cost scaling.
- Explicit unknown raw-material mass and partial known subtotals; unknown inputs never become zero.
- Point-only values are labelled as point assumptions.
- Engineering estimates require an uncertainty note; supplier/published/measurement evidence classes require source references.
- Every report hard-codes `releaseEligible: false`.

This module is a new bounded-calculation path. It does not silently change the semantics of existing deterministic engines.

## 2. Production consumer inventory — initial source-code search

### Active matter

| Consumer | Current role | Migration decision |
|---|---|---|
| `src/utils/activeMatterEngine.ts` | Authoritative legacy calculation and per-ingredient resolution | Keep deterministic/compatibility contract; add bounded adapter only after parity tests |
| `src/utils/calculators.ts` | Public calculator wrappers and active-matter consumers | Migrate/route after API compatibility review |
| `src/utils/analysisWorkflowEngine.ts` | Staged analysis and formula summary | Must consume bounded result status/range, not only scalar |
| `src/utils/scientificQualityGateEngine.ts` | Specification/quality gate inputs | Must never accept preliminary estimate as release evidence |
| `src/utils/gradeEngine.ts` | Grade and formula interpretation | Must distinguish predicted/reference range from measured assay |
| `src/utils/cleaningPerformanceEngine.ts` | Active surfactant features used in screening | Keep screening output labelled; no measured cleaning inference |
| `src/services/ingredientResearchService.ts` | Ingredient research/summary | Carry evidence class and unknown state |
| `src/utils/orchestrator/scientificExecutionDAG.ts` | Orchestrated active-matter node | Carry bounded range and provenance without changing release gate |
| `src/components/AIFormulator.tsx` | User-facing formula analysis | Display range/status and unknowns |
| `src/components/SmartFormulaAnalyzerPro.tsx` | Analyzer summary and cost/active metrics | Display range/status; no scalar-only estimate |
| `src/components/RCCalculators.tsx` | Calculator UI | Add explicit preliminary scenario input path |
| `src/components/analyzer/PerformanceMetricsFractionsCard.tsx` | Active fraction presentation | Show bounds and evidence status |

### Cost

| Consumer | Current role | Migration decision |
|---|---|---|
| `src/utils/costingEngine.ts` | Authoritative deterministic user-price costing | Preserve current user-price behavior; bounded API is additive |
| `src/utils/calculators.ts` | Cost wrapper | Route only after caller contract review |
| `src/utils/analysisWorkflowEngine.ts` | Live/recomputed cost consistency | Preserve incomplete/unknown states and add bounds |
| `src/utils/orchestrator/scientificExecutionDAG.ts` | Cost node and downstream margin chain | Do not allow estimate-only cost to satisfy pricing/release gate |
| `src/utils/optimization/multiObjectiveOptimizer.ts` | Cost objective | Do not optimize against an incomplete/unknown total as if exact |
| `src/components/AIFormulator.tsx` | Formula cost display | Surface range and pricing completeness |
| `src/components/SmartFormulaAnalyzerPro.tsx` | Raw material cost summary | Surface range and provenance |

## 3. Existing deterministic contracts to preserve

- `ActiveMatterEngine` currently distinguishes authoritative/canonical/reference defaults, explicit overrides, derived-from-name and missing values. Its report includes unclassified mass and authoritative status.
- `calculateFormulaCost` uses explicit ingredient prices only; missing prices are not invented. It separately reports partial pricing and formula mass balance.
- Costing and active matter are separate quantities. A raw-material price is not evidence for active matter, and an active-matter assay is not evidence for price.
- Legacy scalar APIs are still consumed by many modules. They are not yet migrated to the new bounded result.

## 4. Next migration sequence

1. Add an explicit adapter from a reviewed ingredient/lot reference profile to `BoundedInput`; do not infer bounds from labels.
2. Add bounded report fields to orchestration types and selectors as additive nullable fields.
3. Migrate one production consumer at a time, beginning with AI Formulator and Smart Formula Analyzer, retaining the existing deterministic outputs for parity.
4. Keep quality gates and optimizer blocked from treating preliminary estimates as validated or complete.
5. Expand the call-site graph with AST-backed symbol inventory and mark every consumer MIGRATED, EXCLUDED_WITH_REASON or BLOCKED.
6. Exact-head regression, typecheck, production build, Android debug APK and instrumentation before merge.

## 5. Current limits

- No numeric ingredient intervals have been added to the supplier evidence profiles; current AOS/APG profiles remain identity-only.
- The new calculation primitives are not yet wired into production UI/orchestration consumers.
- No supplier-specific price source is inferred; price scenarios must be explicitly entered.
- This work does not close Phase 4B, unlock Phase 5 empirical validation, or establish lab accuracy.


## 6. Follow-up migration — 2026-11-28

The shared adapter is now in `src/utils/boundedFormulaAdapter.ts`; presentation no longer owns the calculation mapping.

Migrated in this follow-up branch:
- Staged analysis exposes bounded active-matter and bounded-cost reports, evidence status, unknown active raw mass, unpriced raw mass and known-price subtotal in the stage intermediate results.
- Scientific Execution DAG carries bounded evidence through the active-matter and costing projections consumed by the grade projection.
- Performance Metrics Fractions card displays bounded active-matter status and unknown raw mass alongside explicitly predicted performance metrics.
- RC Active Matter calculator reports its inputs as user-entered point assumptions and displays unknown mass/evidence status.
- Grade Engine refuses evaluability when a supplied bounded active-matter report is incomplete.
- Added focused adapter regressions for catalog-default evidence, unknown active assay, incomplete pricing, and complete user-price scenarios.

Still not claimed as migrated:
- Remaining calculator wrappers and downstream consumers outside the touched RC Active Matter view.
- Cleaning Performance Engine's internal scalar feature calculations.
- Full Grade Engine interval-aware scoring (it currently fail-closes on incomplete bounded evidence; no interval-based grade scoring is claimed).
- All AST-discovered DAG projections and every legacy scalar call site.
- Supplier-grade numeric bounds remain absent unless explicitly provided with evidence; no bounds are inferred from grade names.

Verification remains pending exact-head CI. Phase 4B remains OPEN; Phase 5 empirical validation/calibration remains LOCKED. AI-only review is not human approval or laboratory validation.


## 7. Cleaning performance evidence projection — follow-up

`calculateCleaningPerformance` now returns an additive `boundedActiveMatterEvidence` report for both evaluated and fail-closed results. The existing CPI/KPI calculation path and its legacy result fields are unchanged. This report exposes evidence classes, explicit bounds when available, unknown raw mass and the non-release-eligible boundary. It does not convert predicted cleaning scores into measured performance or use bounded estimates as empirical calibration.

Regression coverage verifies:
- A complete point-assumption case remains marked non-release-eligible and performance provenance remains PREDICTED.
- An unknown surfactant assay retains 10% unknown raw mass, withholds CPI and returns INSUFFICIENT_DATA provenance.

The full Grade Engine interval-aware score, supplier/lot interval population, and empirical performance calibration remain out of scope and blocked by missing source/lab evidence.


## 8. Grade Engine bounded interval scoring — follow-up

The legacy/draft Grade Engine path now requires a complete bounded active-matter report before returning a numeric screening grade. Missing assay mass or invalid bounds produce an N/A / not-evaluable result; unknown values are not imputed. When bounds are supplied, the active-matter pillar uses the conservative minimum score across the lower and upper endpoints of the interval and records both bounds plus report status in the breakdown. The score remains a screening pillar, not a measured performance result or release decision.

Regression coverage verifies a 8–12% active-matter interval receives the conservative endpoint score (80/100), and an unknown surfactant assay fails closed. No supplier bounds are inferred; user-entered bounds remain assumptions and the report remains non-release-eligible.

Remaining work includes migrating remaining calculator wrappers and DAG projections, interval propagation in other scientific pillars, and empirical calibration. Phase 4B remains OPEN; Phase 5 empirical validation/calibration remains LOCKED.


## 9. Public calculator wrappers and DAG evidence propagation — follow-up

- Added additive `calculateBoundedActiveMatter()` and `calculateBoundedFormulaCost()` wrappers in the public calculator module; legacy scalar APIs remain unchanged for compatibility.
- The Scientific Execution DAG active-matter node now attaches the bounded report, evidence status, unknown raw mass, known nominal subtotal and an explicit non-release-eligible marker to its existing authoritative report.
- The grade projection reuses the DAG node's bounded report rather than recalculating it; existing costing-node bounded pricing projection remains intact.
- Formulation warnings now report incomplete/unknown active matter explicitly rather than silently skipping the low-active check.
- Staged analysis now emits a numeric total active-matter value only when the bounded report is COMPLETE; incomplete evidence is represented as `null`, not `NaN`.
- Regression coverage verifies public wrappers preserve unknown mass and incomplete pricing, keep reports non-release-eligible, preserve legacy scalar results, distinguish unknown active matter from a known low-active formula, assert the DAG node propagates the bounded report plus unknown raw mass, and verify staged analysis returns `null` rather than `NaN` when active-matter evidence is incomplete.

- Analyzer and Formulator KPI surfaces now render null/unknown active-matter values as `N/A` instead of zero; active-surfactant metrics are gated on complete bounded evidence.
- Smart Analyzer commercial margin projections are withheld when formula pricing is incomplete; the costing card distinguishes partial pricing from no price input and suppresses downstream margin/MRP values.
- These changes do not migrate every legacy scalar consumer or establish supplier/lot assay evidence. Remaining AST-discovered consumer migration and solver-based interval work remain open.
