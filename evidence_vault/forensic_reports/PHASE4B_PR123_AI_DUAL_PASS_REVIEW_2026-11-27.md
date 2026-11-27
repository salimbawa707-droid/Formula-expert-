# Phase 4B PR #123 — AI Dual-Pass Source Review

**Review date:** 2026-11-27  
**Repository:** `salimbawa707-droid/Formula-expert-`  
**Reviewed branch:** `audit/phase4b-six-candidate-runtime-dataflow-2026-11-27`  
**Reviewed head before this review record:** `e5f40b635fcf3cc28c76e8b4a15358760dc14c5d`  
**Review policy:** Owner-authorized AI-only review. No human review or approval is claimed.

## Review Pass 1 — Scientific and category-contract review

Scope:
- 13 canonical product categories and their physical-form distinctions.
- 15 scientific engine IDs and the complete 15 × 13 category/engine applicability matrix.
- Taxonomy/profile consistency for pH, active-surfactant minimum/target, viscosity constraints, HLB, cleaning and chelator routing.
- Unknown-category behavior and fail-closed policy.
- Equation and unit descriptions for HLB, ideal Clint mixed CMC, viscosity, pH, active matter, water balance, powder mass balance, density, dilution, cleaning/CPI and chelation capacity.

Results:
1. The automatic-dishwasher HLB discrepancy was correctly resolved: taxonomy says HLB applies, the profile requires HLB, and the engine is now registered.
2. Unknown categories are denied metric applicability and ionic permissions; preference, pH and active-surfactant helpers return null rather than borrowing another category's defaults.
3. The 15 × 13 matrix is asserted in regression coverage, and the test also checks unknown-category rejection for every engine.
4. Taxonomy and profile pH/active-matter values are checked for exact parity across all 13 categories.
5. Powder engine applicability is tied to physical form; liquid viscosity routing is excluded from laundry powder.
6. HLB is correctly described as active-mass-weighted screening, requiring explicit assay data. HLB alone is not a physical stability proof.
7. Clint mixed CMC is an idealized screening relation, not measured mixed CMC and not a universal model of ionic/nonionic interactions.
8. Cleaning/CPI outputs remain heuristic screening scores, not measured detergency.
9. Chelator capacity arithmetic is not a full Ca/Mg speciation model.
10. Category pH and active-matter targets remain explicitly `UNVERIFIED_ENGINEERING_TARGETS`; no lab validation or regulatory conformity is claimed.

Pass 1 disposition: **No blocking scientific/category-routing defect identified in the reviewed scope.** External product specification and matched finished-formula lab evidence remain separate evidence gaps and are not misrepresented as software validation.

## Review Pass 2 — Implementation, data-flow and verification review

Scope:
- Runtime import/export/call-site dispositions for the six residual candidates.
- The separate mixed-CMC diagnostic path versus the unwired `predictCMC` adapter.
- Foam-decay measured-series utility versus formula-to-foam prediction.
- CMC objective eligibility gate and its test-only status.
- Powder/specification type modules and production export dependencies.
- Regression test assertions, release workflow definition and exact-head CI result.

Results:
1. `cmcPredictor.ts` remains an explicit fail-closed adapter contract; no production model adapter is claimed.
2. `calculateMixedCMC` is called by optimizer candidate evaluation and attached as diagnostic metadata only; it is not a Pareto objective, ranking score or feasibility gate.
3. `foamKineticsEngine.ts` analyzes measured time-series data; it is not a formula-ingredient foam predictor and no production caller was found in the inspected static graph.
4. `cmcObjectiveEligibilityGate.ts` is test-only and not wired into production optimizer scoring.
5. Powder and specification type modules are production type dependencies; absence of runtime function bodies is expected, not evidence of dead code.
6. The specification-engine barrel is a production export boundary used by the scientific execution DAG.
7. The six dispositions are materially distinct and the report avoids collapsing them into a single “unused” classification.
8. Static call-site review cannot prove absence of reflection, dynamic imports, runtime injection or external consumers; this limitation is stated.

Pass 2 verification evidence:
- GitHub Actions run: `45999463253`, workflow **Current Release Quality Gates**, exact reviewed source head `e5f40b635fcf3cc28c76e8b4a15358760dc14c5d`.
- Result: **7 of 7 jobs succeeded**.
- Successful jobs: TypeScript typecheck; full TypeScript regression suite; reproducible dependency install and production build; Phase 6 lab-evidence regressions; evidence syntax/regression/fail-closed gates; production server boot and `/api/health` smoke test; Capacitor Android debug APK.
- Android job completed the genuine debug APK build, KVM availability step, Android WebView instrumentation test, runtime-log capture and APK artifact upload.
- This CI result verifies the workflow's automated checks for that exact source head. It does not establish laboratory performance, finished-formula validation or regulatory compliance.

Pass 2 disposition: **No blocking implementation or regression defect identified in the reviewed scope.** Exact-head CI is green.

## Corrections made during AI review

The audit report contained stale statements that:
- Laundry-liquid and manual-dishwash viscosity conflicts were still open, although the current taxonomy and profile values had been reconciled in this branch.
- Independent human sign-off was required, which contradicted the owner's explicitly selected AI-only review route.

Those statements were corrected. The taxonomy evidence comment was also aligned with the AI dual-pass review policy. No human approval is claimed.

## Final disposition

**AI REVIEWED — TWO-PASS SOURCE, SCIENTIFIC-CONTRACT AND IMPLEMENTATION AUDIT.**

- PR #123's scoped source changes: **PASS** for the reviewed criteria.
- Exact-head automated release quality gates: **PASS (7/7)**.
- Six-candidate runtime/data-flow classification: **PASS with documented static-analysis limits**.
- Category isolation and unknown-category fail-closed behavior: **PASS in source review and regression coverage**.
- Finished-formula laboratory validation: **NOT ESTABLISHED**.
- External category-specific product specifications: **NOT PRESENT / OPEN**.
- Phase 4B overall: **OPEN** pending the remaining evidence-vault, ingredient applicability, provenance and dataset reconciliation work.
- Phase 5: **LOCKED** until the complete Phase 4B closure criteria are satisfied.

This review is an AI-generated technical assessment. It is not a human review, laboratory report, regulatory certification or claim that model outputs have been experimentally validated.
