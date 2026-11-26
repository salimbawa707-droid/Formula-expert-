# Phase 1 — Engine Inventory & Dependency Mapping
**Status:** PASS — Phase 1 repository inventory, static module reachability classification, architecture reconciliation, and exact-head software CI complete; scientific/laboratory validation explicitly out of scope  
**Baseline branch:** `main`  
**Current audit base commit:** `a7f56884cb6aebf9dd2390f9643d5851e32e6546`  
**Current audit branch:** `fix/phase1-inventory-verification-2026-11-26`  
**Audit date:** 2026-11-26

## 1. Scope and evidence boundary

This phase inventories source modules, tests, product-category routing, scientific workflow stages, and the declared engine DAG. It does not certify scientific correctness and it does not authorize a merge.

Repository tree was read recursively from the exact baseline commit. Counts below are reproducible source-tree counts, not estimates.

| Measure | Baseline |
|---|---:|
| Tracked blob files | 792 |
| TypeScript/TSX/JS/JSX source/test files under `src/` | 443 |
| Test/spec files under `src/` | 146 |
| Non-test TS/TSX/JS/JSX files under `src/` | 297 |
| PR #111 exact-head workflow run #1049 | SUCCESS — all seven jobs passed on `6b5982dc4e3b2878b4f9e4c80a5542957cb39597` |
| Matching push workflow run #1048 | SUCCESS — same exact head SHA |
| Audit base SHA | `a7f56884cb6aebf9dd2390f9643d5851e32e6546` |

**Important counting rule:** 297 non-test source files are not 297 scientific engines. The set includes UI components, data stores, service adapters, types, persistence, regulatory rules, and other infrastructure. Engine counts must be classified by exported responsibility and production call path, not filename substring alone.

## 2. Existing architecture declarations found

### Product taxonomy
The existing `P0_ENGINE_DEPENDENCY_MATRIX.md` declares 13 canonical product categories:
- LAUNDRY_LIQUID
- LAUNDRY_POWDER
- DISHWASH_MANUAL
- DISHWASH_AUTOMATIC
- FLOOR_CLEANER
- MULTIPURPOSE_CLEANER
- TOILET_CLEANER
- BATHROOM_CLEANER
- GLASS_CLEANER
- FABRIC_SOFTENER
- HAND_WASH
- KITCHEN_DEGREASER
- CAR_SHAMPOO

### Declared scientific execution DAG
The same matrix declares 24 child nodes, ordered from normalization and identity resolution through category routing, neutralization, pH equilibrium, active matter, HLB, chelation, compatibility, viscosity, density, NVR, powder calculations, cleaning CPI, stability, costing, regulatory, manufacturing, specification, lab evidence, quality gate, grade, recommendations, and finalization.

### Staged analysis workflow
`src/utils/analysisWorkflowEngine.ts` declares 11 stages:
1. SNAPSHOT_VALIDATION
2. MASS_BALANCE
3. SURFACTANT_SCIENCE
4. PH_NEUTRALIZATION
5. WATER_CHELATION
6. RHEOLOGY_DENSITY
7. CLEANING_PERFORMANCE
8. COMPATIBILITY_STABILITY
9. PROCESS_COSTING
10. FORENSIC_CONSISTENCY
11. PUBLISH_RESULTS

**Mapping question to resolve:** the declared 24-node DAG and 11-stage workflow are different abstraction levels. Phase 1 must map every DAG node to its implementation, workflow stage, category applicability, and actual caller. A name appearing in a matrix is not proof that it executes.

## 3. Existing engine families identified from the current source tree

This is a source-path inventory, not yet a final count of independently callable engines.

### Core formulation and chemistry
- `src/utils/formulationEngineRouter.ts`
- `src/utils/activeMatterEngine.ts`
- `src/utils/activeMatterInputGuard.ts`
- `src/utils/activeMatterValidation.ts`
- `src/utils/chelatorEngine.ts`
- `src/utils/hlbEngine.ts`
- `src/utils/compatibilityEngine.ts`
- `src/utils/cleaningPerformanceEngine.ts`
- `src/utils/costingEngine.ts`
- `src/utils/densityEngine.ts`
- `src/utils/densityGuard.ts`
- `src/utils/dilutionEngine.ts`
- `src/utils/liquidNvrEngine.ts`
- `src/utils/viscosityEngine.ts`
- `src/utils/manufacturingEngine.ts`
- `src/utils/manufacturing/processModelingEngine.ts`
- `src/utils/substitutionEngine.ts`
- `src/utils/refinementEngine.ts`
- `src/utils/templateRevalidationEngine.ts`
- `src/utils/calculators.ts`

### pH and neutralization domain
- `src/utils/pHEngine.ts`
- `src/utils/pHEngineAdapter.ts`
- `src/utils/phInputGuard.ts`
- `src/utils/phDosingEligibility.ts`
- `src/domain/ph/acidBaseDataModel.ts`
- `src/domain/ph/activityModel.ts`
- `src/domain/ph/chemicalSpeciesRegistry.ts`
- `src/domain/ph/compositionNormalizer.ts`
- `src/domain/ph/confidenceEvaluator.ts`
- `src/domain/ph/equilibriumSystem.ts`
- `src/domain/ph/numericalSolver.ts`
- `src/domain/ph/pHEngineV2.ts`
- `src/domain/ph/stoichiometricNeutralizationEngine.ts`

### Powder-specific engines
- `src/utils/powderEngine/index.ts`
- `src/utils/powderEngine/powderActiveMatter.ts`
- `src/utils/powderEngine/powderBuilderChelationAlkalinity.ts`
- `src/utils/powderEngine/powderCosting.ts`
- `src/utils/powderEngine/powderIngredientClassification.ts`
- `src/utils/powderEngine/powderMassBalance.ts`
- `src/utils/powderEngine/powderMoistureDryMatter.ts`
- `src/utils/powderEngine/powderPHHardWater.ts`
- `src/utils/powderEngine/powderPerformanceStabilitySafety.ts`
- `src/utils/powderEngine/powderPhysicalProperties.ts`
- `src/utils/powderEngine/powderVerdict.ts`
- `src/utils/powderEngine/types.ts`

### Orchestration, scientific governance, evidence and quality
- `src/utils/analysisWorkflowEngine.ts`
- `src/utils/orchestrator/formulaScientificOrchestrator.ts`
- `src/utils/orchestrator/scientificExecutionDAG.ts`
- `src/utils/orchestrator/selectors.ts`
- `src/utils/scientificDecisionEngine.ts`
- `src/utils/scientificGovernanceEngine.ts`
- `src/utils/scientificQualityGateEngine.ts`
- `src/utils/scientificRouter.ts`
- `src/utils/scientificModelRegistry.ts`
- `src/utils/scientificPredictionArchitecture.ts`
- `src/utils/provenanceEngine.ts`
- `src/utils/labEvidenceEngine.ts`
- `src/utils/labHealthEngine.ts`
- `src/utils/gradeEngine.ts`
- `src/utils/expertReasoningEngine.ts`

### Empirical calibration and closed-loop R&D
- `src/utils/empiricalAccuracyFramework.ts`
- `src/utils/empiricalCalibrationEngine.ts`
- `src/utils/empiricalDataImporter.ts`
- `src/utils/empiricalLabObservationModel.ts`
- `src/utils/empiricalLabPersistenceService.ts`
- `src/utils/empiricalValidationEvaluationEngine.ts`
- `src/utils/closedLoopRAndD/experimentResultIngestionEngine.ts`
- `src/utils/closedLoopRAndD/feedbackDecisionEngine.ts`
- `src/utils/closedLoopRAndD/measurementEvaluationEngine.ts`
- `src/utils/closedLoopRAndD/predictionVsMeasurementEngine.ts`
- `src/utils/closedLoopRAndD/reformulationFeedbackEngine.ts`
- `src/utils/closedLoopRAndD/scientificDeviationEngine.ts`

### Regulatory, specification and analytical subsystems
- `src/utils/regulatoryEngine.ts`
- `src/domain/regulatory/regulatoryComplianceEngine.ts`
- `src/domain/regulatory/regulatoryTemporalEngine.ts`
- `src/utils/specificationEngine/*`
- `src/utils/spectroscopy/*`
- `src/utils/cheminformatics/*`
- `src/engines/surfactant/cmcPredictor.ts`

### Supporting systems requiring classification
Inventory also contains inventory/grade/calibration/climate/dossier/ingredient-intelligence/LIMS/lab-automation/optimization/vault modules. These must be classified as scientific engines, gates, adapters, services, or data utilities based on exports and callers. They must not be blindly counted as independent formulation engines.

## 4. Existing prior audit evidence (not accepted as current verification)

The repository contains `ENGINE_WIRING_AND_SCIENTIFIC_INTEGRITY_AUDIT_2026-11-03.md`, which records a prior reconciled inventory of 55 retained engine modules and explicitly states that wiring does not establish empirical scientific validity. Its companion CSV path referenced by that report was not found at the repository root during this baseline read; its actual location and current validity must be reconciled.

The prior `P0_ENGINE_DEPENDENCY_MATRIX.md` is treated as an architecture declaration to verify, not as proof of actual execution.

## 5. Phase 1 completion checklist — closed

- [x] Reconciled the retained 55-module manifest with its companion 55-row evidence CSV; all paths exist, with zero duplicates, zero missing paths, and zero set differences.
- [x] Extracted explicit exported symbol names for each retained module and mapped direct production/test importers.
- [x] Built and ran a static module-import graph from production roots `src/main.tsx` and `server.ts`; this is a module graph, not a function-level call graph.
- [x] Classified all 55 retained modules: **53 production-reachable**, **2 imported but not root-reachable**, **0 test-only**, **0 orphan/no-importer**, and **0 modules without direct production or test/tooling importers**.
- [x] Reconciled the DAG implementation: **23 registered nodes + 1 post-DAG FINALIZATION stage = 24 pipeline steps**; mapped the 11 user-visible workflow stages separately.
- [x] Confirmed all 13 canonical product IDs have scientific product profiles and route regression coverage. The DAG currently enforces profile applicability for HLB, water chelation, and cleaning; remaining policy enforcement is explicitly handed to the routing phase.
- [x] Rechecked duplicate/bypass paths: AIFormulator no longer has direct powder, pH, cleaning, hardness, or compatibility fallback calculators. Staged workflow still performs intermediate engine calculations before final orchestrator recomputation; output-authority verification remains a later Phase 2/10 item.
- [x] Mapped direct test importers and recorded per-module evidence maturity separately from wiring status in the 55-row evidence CSV.
- [x] Ran inventory verification, static reachability audit, full TypeScript regression, typecheck, production build, server health smoke test, Phase 6 evidence regression, Android debug APK build, and Android WebView instrumentation on the exact PR head.
- [x] Published the reconciled inventory, dependency matrix, static audit script, and Phase 1 status in this PR.

**Static graph result (exact head):** 472 source/tooling files scanned; 254 files reachable from the two production roots; 53/55 retained modules reachable. The two non-root-reachable modules are `src/utils/empiricalCalibrationEngine.ts` and `src/utils/empiricalValidationEvaluationEngine.ts`, whose production importer path goes through `EmpiricalValidationHub.tsx`; that component is not reachable from the application entry point. They remain retained as a dormant empirical-validation feature path because they have test importers and are not safe to delete without a product decision. The graph found **0 unresolved production imports** and **7 unresolved tooling-only imports** in root `scripts/` files; these do not affect the production graph and are recorded for separate tooling cleanup.

**Scope boundary:** the static analyzer follows literal static/dynamic module imports; it does not prove runtime execution or build a function-level call graph. Phase 1 is closed as a repository inventory and architecture-mapping phase, not as scientific model or laboratory certification.

## 6. Safety / merge policy

No production scientific engine source was changed. This PR changes only documentation, the CI workflow, and a read-only static audit script. `main` remains unchanged until the PR is merged. The diff was AI-reviewed against the exact base; no human review is recorded.

A module is not considered COMPLETE merely because it compiles, has a test, appears in the DAG, or has a caller. Scientific validation requires independently traceable equations/data, units, valid input domains, uncertainty/assumptions, boundary/reference cases, and (where applicable) matched physical lab evidence.


## 7. Implementation trace — resolved architecture discrepancy

The complete `scientificExecutionDAG.ts` file was fetched and its actual registrations were counted by matching each `this.nodes.set(...)` declaration. It registers **23 nodes**, not 24.

Actual registered IDs:
`NORMALIZATION`, `IDENTITY_RESOLUTION`, `CATEGORY_ROUTING`, `NEUTRALIZATION`, `PH_EQUILIBRIUM`, `ACTIVE_MATTER`, `HLB`, `WATER_CHELATION`, `COMPATIBILITY`, `VISCOSITY`, `DENSITY`, `NVR`, `POWDER_ENGINE`, `CLEANING_CPI`, `STABILITY_SCREENING`, `COSTING`, `REGULATORY`, `MANUFACTURING`, `SPECIFICATION`, `LAB_EVIDENCE`, `QUALITY_GATE`, `GRADE`, `RECOMMENDATIONS`.

**Resolved in this audit:** the implementation registers 23 node IDs. Climate analysis, substitution recommendations, and lab-health scoring are nested services inside RECOMMENDATIONS. FINALIZATION is emitted by `FormulaScientificOrchestrator` after DAG execution, not registered as a DAG node. The architecture matrix now correctly describes 23 registered DAG nodes plus one post-DAG stage. No dummy node was added.

### Early dependency / provenance risks recorded for later phases

These are source-level observations for later scientific phases, not fixes made in Phase 1:

1. In `NEUTRALIZATION`, the code sets `pHIntermediate` to constants 7.0, 3.0, or 11.0 based on neutralization status. The value is then passed to PHEngineV2 as `targetPH` / initial solver guess. It must never be presented as a calculated pH. Later pH phase must prove this seed cannot bias final results or leak into user-facing metrics.
2. In `WATER_CHELATION`, missing wash dose and wash volume use category policy defaults, with assumptions recorded. Invalid/non-positive supplied values also fall back to defaults (10 L / 20 g fallback path), but the visible assumption is only appended for missing values. Batch size also has a final 100 kg fallback in this node. Later chelation/input-validation phases must ensure invalid supplied values are blocked or explicitly marked as defaulted, not silently treated as measured inputs.
3. In `COSTING`, missing overhead and packaging cost use scenario defaults (12% and 15 currency units) and assumptions are recorded. Later costing phase must verify these values remain scenario-only and cannot be confused with actual costs.
4. In `PH_EQUILIBRIUM`, the DAG calls `calculatePHAdvanced` through `src/utils/pHEngine.ts`; that wrapper delegates to PHEngineV2. The powder engine separately computes slurry pH through `powderEngine/powderPHHardWater.ts`. Phase 1 must map all downstream consumers and prove there is no accidental mixing of liquid-equilibrium pH and powder-slurry pH.
5. `evaluatePowderFormulation` is also an exported entry point and defaults a missing product category to `Laundry Powder`. The authoritative orchestrator may validate category first, but direct callers must be enumerated before deciding whether this default is safe.

## 8. Current checkpoint

- [x] Repository baseline and main SHA verified.
- [x] Recursive source/test counts captured.
- [x] 13 product category IDs verified in the canonical taxonomy.
- [x] 11 staged workflow IDs verified in `analysisWorkflowEngine.ts`.
- [x] Actual DAG registration count and IDs extracted from implementation.
- [x] Concrete 24-declared-versus-23-registered mismatch recorded.
- [ ] Full exported API inventory and importer/caller graph.
- [ ] All category-to-node execution paths.
- [ ] Test-to-engine coverage matrix.
- [ ] Orphan/dead/test-only module classification.
- [ ] Final Phase 1 report and audit-branch CI.

**Checkpoint status remains IN PROGRESS.** No source code was changed, no PR was opened, and no merge was attempted.

## 9. Reconciled canonical 55-module inventory

The previously referenced CSV was found at its actual path:
`evidence_vault/datasets/engine-audit-final-2026-11-03.csv`.

Current branch verification:
- `engines_reconciled.list`: 55 entries.
- Audit CSV: 55 data rows.
- Both sets contain the same 55 paths.
- All 55 paths exist in the current source tree.
- No duplicate entries were found in the list during the static reconciliation.
- The CSV includes runtime wiring evidence and a scientific maturity/limitation label for each module. Its evidence is dated 2026-11-03, so treat it as inherited wiring evidence, not a fresh scientific validation.

The 55 retained module paths are:

1. `src/domain/ph/stoichiometricNeutralizationEngine.ts`
2. `src/domain/regulatory/regulatoryComplianceEngine.ts`
3. `src/domain/regulatory/regulatoryTemporalEngine.ts`
4. `src/utils/activeMatterEngine.ts`
5. `src/utils/analysisWorkflowEngine.ts`
6. `src/utils/chelatorEngine.ts`
7. `src/utils/cleaningPerformanceEngine.ts`
8. `src/utils/climateEngine.ts`
9. `src/utils/closedLoopRAndD/experimentResultIngestionEngine.ts`
10. `src/utils/closedLoopRAndD/feedbackDecisionEngine.ts`
11. `src/utils/closedLoopRAndD/measurementEvaluationEngine.ts`
12. `src/utils/closedLoopRAndD/predictionVsMeasurementEngine.ts`
13. `src/utils/closedLoopRAndD/reformulationFeedbackEngine.ts`
14. `src/utils/closedLoopRAndD/scientificDeviationEngine.ts`
15. `src/utils/compatibilityEngine.ts`
16. `src/utils/costingEngine.ts`
17. `src/utils/densityEngine.ts`
18. `src/utils/dilutionEngine.ts`
19. `src/utils/empiricalCalibrationEngine.ts`
20. `src/utils/empiricalValidationEvaluationEngine.ts`
21. `src/utils/expertReasoningEngine.ts`
22. `src/utils/gradeEngine.ts`
23. `src/utils/hlbEngine.ts`
24. `src/utils/ingredientIntelligenceEngine.ts`
25. `src/utils/inventoryEngine.ts`
26. `src/utils/labAutomation/deckLayoutEngine.ts`
27. `src/utils/labAutomation/liquidHandlingConstraintEngine.ts`
28. `src/utils/labEvidenceEngine.ts`
29. `src/utils/labHealthEngine.ts`
30. `src/utils/lims/limsAuditTrailEngine.ts`
31. `src/utils/lims/limsEngine.ts`
32. `src/utils/lims/limsEvidencePromotionEngine.ts`
33. `src/utils/lims/limsSampleLifecycleEngine.ts`
34. `src/utils/liquidNvrEngine.ts`
35. `src/utils/manufacturingEngine.ts`
36. `src/utils/manufacturing/processModelingEngine.ts`
37. `src/utils/optimization/formulationConstraintEngine.ts`
38. `src/utils/pHEngine.ts`
39. `src/utils/provenanceEngine.ts`
40. `src/utils/regulatoryEngine.ts`
41. `src/utils/scientificDecisionEngine.ts`
42. `src/utils/scientificGovernanceEngine.ts`
43. `src/utils/scientificLearningEngine.ts`
44. `src/utils/scientificQualityGateEngine.ts`
45. `src/utils/specificationEngine/releaseGateEngine.ts`
46. `src/utils/spectroscopy/baselineCorrectionEngine.ts`
47. `src/utils/spectroscopy/spectralConformEngine.ts`
48. `src/utils/spectroscopy/spectralMatcherEngine.ts`
49. `src/utils/spectroscopy/spectralNoiseReductionEngine.ts`
50. `src/utils/spectroscopy/spectralNormalizationEngine.ts`
51. `src/utils/spectroscopy/spectralPeakDetectionEngine.ts`
52. `src/utils/spectroscopy/spectralPreprocessingEngine.ts`
53. `src/utils/substitutionEngine.ts`
54. `src/utils/templateRevalidationEngine.ts`
55. `src/utils/viscosityEngine.ts`

**Counting distinction:** the 55 retained wiring modules are not 55 validated physical-science predictors. The inventory includes workflow/orchestration, data governance, lab evidence, LIMS, inventory, regulatory and software-control modules. The narrower `evidence_vault/datasets/scientific_engine_inventory.csv` is an 8-record scientific model/evidence registry (including explicitly unavailable or unregistered model classes), not a replacement for the 55-module wiring inventory.

## 10. Current source-tree counts and inventory verification

Using the same path filters declared in `evidence_vault/scripts/verify_engine_inventory.mjs`, the current source tree gives:

| Count definition | Current source tree |
|---|---:|
| Non-test TS/TSX/JS/JSX files under `src/` | 297 |
| Test/spec files under `src/` | 146 |
| Engine-named source files excluding UI components | 61 |
| Engine-named files including UI components | 64 |
| Broad engine/calculator/optimizer/formulation/workflow/predictor/router candidates | 93 |
| Reconciled retained wiring modules | 55 |

The exact PR CI execution reported 61 / 64 / 93. The 55-module manifest is a separate retained-wiring set and is not a scientific-engine count.

**Execution status:** the inventory verifier passed on the exact PR head. The static reachability audit also passed with 55/55 manifest/CSV parity and zero unresolved production imports.

## 11. Production entry points and actual caller paths

Current code search and source inspection confirm these principal paths:

| Entry point / consumer | Observed route | Notes |
|---|---|---|
| `AIFormulator.runDeepScientificAnalysis` | UI -> `FormulaScientificOrchestrator.evaluate` -> decision engine -> canonical result selectors | Current source contains no direct `evaluatePowderFormulation`, pH, cleaning, hardness, or compatibility fallback calculator calls in `AIFormulator.tsx`; the Phase 10 source regression asserts this single-authority behavior. |
| `AIFormulator` staged Check My Formula path | UI -> `executeStagedScientificAnalysis` -> 11 visible stages -> final `FormulaScientificOrchestrator.evaluate` recomputation | Stages invoke individual engines and the final orchestrator evaluates the same formula again; this is a second calculation layer, not merely a display-only progress wrapper. |
| `SmartFormulaAnalyzerPro` | UI -> `FormulaScientificOrchestrator.evaluate` | Uses the authoritative orchestrator path. |
| `FormulationLibrary` | Library revalidation/listing -> `FormulaScientificOrchestrator.evaluate` and quality gate | Formula evaluation is performed during library checks. |
| `EmpiricalValidationHub` | Selected formula -> `FormulaScientificOrchestrator.evaluate` | Uses versioned formula evaluation before evidence comparison. |
| `ScientificDecisionEngine` | Scenario mutation -> `FormulaScientificOrchestrator.evaluate` | Scenario results inherit orchestrator behavior. |
| `multiObjectiveOptimizer` | Candidate -> `FormulaScientificOrchestrator.evaluate` -> constraints/Pareto processing | The optimizer consumes the canonical evaluation output. |
| Powder dashboard | `evaluatePowderFormulation` result display | The powder master evaluator is also invoked inside the main DAG's `POWDER_ENGINE` node. |

### pH call graph

- `src/utils/pHEngine.ts::calculatePHAdvanced` delegates to `PHEngineV2`.
- `src/utils/pHEngineAdapter.ts::calculatePHAdvanced` delegates through the pH wrapper and maps formulation inputs.
- The main DAG imports the pH wrapper; other production modules import the wrapper or adapter.
- Powder pH in `powderEngine/powderPHHardWater.ts` calls the domain PHEngineV2 directly with powder slurry-specific handling.
- Thus there is one shared V2 equilibrium implementation for the main liquid path, but multiple adapters/callers and a separate powder slurry path still require unit/basis and provenance reconciliation.

## 12. Category applicability map — declared profile vs actual DAG

The repository has 13 canonical product profiles plus 6 specialized subclass profiles. The 13 canonical categories and physical forms are:

| Canonical category | Physical form | Profile engine count | Distinguishing routing policy |
|---|---|---:|---|
| LAUNDRY_LIQUID | LIQUID | 14 | Laundry detergency, HLB, viscosity salt curve, hardness/chelation |
| LAUNDRY_POWDER | POWDER | 12 | Powder engine, builder/alkalinity, slurry pH; no liquid viscosity or HLB |
| DISHWASH_MANUAL | LIQUID | 14 | High foam, skin safety, mildness |
| DISHWASH_AUTOMATIC | LIQUID | 12 | Low-foam/deaeration policy; anionic surfactants disallowed |
| FLOOR_CLEANER | LIQUID | 14 | Streak/residue and surface-cleaning profile |
| MULTIPURPOSE_CLEANER | LIQUID | 14 | General hard-surface cleaning profile |
| TOILET_CLEANER | LIQUID | 11 | Acid/descaling and cling-specific profile |
| BATHROOM_CLEANER | LIQUID | 14 | Descaling/surface safety profile |
| GLASS_CLEANER | LIQUID | 12 | Low-active, streak-free profile |
| FABRIC_SOFTENER | LIQUID | 11 | Cationic chemistry; cleaning performance is not in its profile engine list |
| HAND_WASH | LIQUID | 14 | Skin mildness and physiological pH |
| KITCHEN_DEGREASER | LIQUID | 14 | Alkaline saponification and caustic hazard |
| CAR_SHAMPOO | LIQUID | 14 | Paint lubricity and rinse/spotting profile |

### Verified category-routing integration status

`scientificExecutionDAG.ts` does **not** consume the complete `routeScientificExecution(...)` result or its full `engineRoutingMap` at `CATEGORY_ROUTING`. It does, however, import `isEngineApplicable` from `scientificProductProfiles` and applies profile applicability checks inside three DAG nodes:
- `HLB`: returns `NOT_APPLICABLE` when the product profile excludes HLB.
- `WATER_CHELATION`: returns `NOT_APPLICABLE` when the profile excludes chelation.
- `CLEANING_CPI`: returns `NOT_APPLICABLE` when the profile excludes cleaning.

This is confirmed by the current DAG source and the Phase 2 report, which records regression coverage for laundry-powder HLB, toilet-cleaner chelation, and fabric-softener cleaning. The DAG also uses physical-form/category conditions for powder and selected liquid property nodes. Therefore the earlier statement that no profile applicability was integrated, and the examples claiming HLB/chelation/cleaning are wholly ungated, are stale and superseded.

**Residual routing gap:** the DAG does not centrally apply the complete profile route to every engine. Category-specific constraints beyond these three gates—such as automatic-dishwash low-foam/anionic restrictions, skin mildness, cling, streak/residue, and surfactant restrictions—still require node-by-node enforcement and category execution-trace verification. A profile registry or helper test alone is not proof that each policy changes the production result.

This is an implementation/routing gap, not a laboratory validation claim. The relevant Phase 2 report documents the three existing applicability gates; remaining policy coverage belongs in the routing/integration follow-up.

## 13. Workflow-stage to DAG mapping

The 11 user-visible workflow stages are a higher-level progress/evidence layer, not 11 more independent scientific engines. Current intended mapping is:

| Visible workflow stage | Main DAG work / output |
|---|---|
| SNAPSHOT_VALIDATION | Orchestrator fast-fail validation before DAG execution |
| MASS_BALANCE | NORMALIZATION, formula fingerprint and mass-balance state |
| SURFACTANT_SCIENCE | ACTIVE_MATTER and HLB |
| PH_NEUTRALIZATION | NEUTRALIZATION and PH_EQUILIBRIUM |
| WATER_CHELATION | WATER_CHELATION |
| RHEOLOGY_DENSITY | VISCOSITY, DENSITY, NVR; powder physical-property calculations inside POWDER_ENGINE |
| CLEANING_PERFORMANCE | CLEANING_CPI |
| COMPATIBILITY_STABILITY | COMPATIBILITY, STABILITY_SCREENING and related regulatory screening |
| PROCESS_COSTING | MANUFACTURING and COSTING |
| FORENSIC_CONSISTENCY | SPECIFICATION, LAB_EVIDENCE, QUALITY_GATE and GRADE |
| PUBLISH_RESULTS | RECOMMENDATIONS and final result presentation |

The architecture's 24th item, `FINALIZATION`, is emitted by `FormulaScientificOrchestrator` after the DAG as a `stageDiagnostics` entry. It is **not** a registered DAG node. Therefore the accurate count is **23 registered DAG nodes + 1 orchestrator finalization stage = 24 pipeline steps**. The earlier “24 DAG nodes” wording in comments/docs is imprecise; do not add a dummy DAG node to satisfy it.

## 14. Duplicate / bypass path status — rechecked against current source

The initial inventory report contained several AIFormulator fallback findings. Those findings are now stale and are superseded by the current source inspection:

1. **AIFormulator canonical output path:** current `AIFormulator.tsx` calls `FormulaScientificOrchestrator.evaluate` and consumes its result. It contains no direct calls/imports for `evaluatePowderFormulation`, `calculatePHAdvanced`, `calculateCleaningPerformance`, `calculateWaterHardnessTolerance`, or `calculateFormulationCompatibility`. The Phase 10 regression suite includes static assertions for this single-source-of-truth behavior.
2. **Powder calculation ownership:** the main DAG imports and calls `evaluatePowderFormulation` in its `POWDER_ENGINE` node. The current AIFormulator path does not separately invoke that powder evaluator.
3. **Staged workflow intermediate calculations:** `analysisWorkflowEngine.ts` still runs direct stage-level pH, hardness/chelation, compatibility, cleaning and property calculations, then invokes `FormulaScientificOrchestrator.evaluate` for final authoritative recomputation. This is a deliberate staged-analysis structure in code, but it creates repeated computation. Phase 2 / Phase 10 must prove that intermediate values are diagnostics only, do not overwrite canonical outputs, and use identical immutable inputs/assumptions where comparison is intended.
4. **Category applicability:** current DAG source uses `isEngineApplicable` for HLB, water chelation and cleaning performance. It does not consume the complete `routeScientificExecution` route centrally. Remaining category policies need a full per-node enforcement audit (see Section 12).
5. **Explicit scenario inputs:** the Phase 2 report records strict chelation/CPI input handling in the staged workflow, including missing wash-volume/dose handling as `NOT_EVALUATED` rather than fabricated numeric values. Other stage defaults and category-specific assumptions still require their own explicit provenance review.

These are source-level wiring findings. They do not establish that a calculated result is experimentally accurate or that a detergent formula has passed laboratory testing.

## 15. Representative regression coverage mapped to engines

The source tree contains 145 test/spec files. The following direct or integration test modules were confirmed in the current source tree:

| Engine family | Representative test files |
|---|---|
| pH / equilibrium / category caller | `pHEngine.regression.test.ts`, `pHEngineV2.regression.test.ts`, `phEngineCallerCategory.regression.test.ts`, `p0_remediation_integrity.test.ts`, `powderSlurryBasis.regression.test.ts` |
| Active matter / provenance | `activeMatterEngine.regression.test.ts`, `activeMatterInputGuard.test.ts`, `activeMatterIntegrity.test.ts`, `p0_remediation_integrity.test.ts` |
| Chelation / hardness | `chelatorBinding.test.ts`, `p1Phase2Chelation.regression.test.ts`, `p3WaterHardnessChelation.test.ts`, `powderChelation.test.ts` |
| HLB | `hlbEngine.regression.test.ts` |
| Viscosity | `viscosityEngine.regression.test.ts`, `viscosityModelImprovement.test.ts` |
| Density / NVR / costing | `densityEngine.regression.test.ts`, `liquidNvrEngine.regression.test.ts`, `costingEngine.regression.test.ts`, `marginChain.regression.test.ts` |
| Cleaning / compatibility | `cleaningPerformance.regression.test.ts`, `p4CleaningPerformanceMaster.test.ts`, `compatibility.regression.test.ts`, `p6CompatibilityMaster.test.ts` |
| Powder pipeline | `powderEngine.regression.test.ts`, `powderMoisture.test.ts`, `powderSlurryBasis.regression.test.ts`, `legacyPowderPHReachability.regression.test.ts` |
| Routing / integration | `scientificRouter.regression.test.ts`, `categoryPropagation.regression.test.ts`, `p5PropertyPipelinesMaster.regression.test.ts`, `crossEngine.integration.test.ts`, `formulaWorkflow.integration.test.ts` |
| Staged workflow / orchestrator | `formulaAnalysisWorkflow.regression.test.ts`, `formulaScientificOrchestrator.regression.test.ts`, `masterFinalizer.integration.test.ts` |
| Regulatory / manufacturing / evidence | `manufacturingAssay.test.ts`, `p1Phase13Manufacturing.regression.test.ts`, `p1Phase6LabEvidenceValidation.regression.test.ts`, `limsEvidenceEngine.regression.test.ts`, `specificationEngine.regression.test.ts` |

This is a representative mapping, not a claim that every one of the 55 retained modules has a dedicated unit test. Coverage quality, mathematical reference cases, boundary tests, mutation resistance and scientific correctness are assessed in later phases.

## 16. Phase 1 completion and handoff

**Phase 1 inventory and dependency-mapping deliverable: COMPLETE.** This means the source inventory, 55-module manifest, existing evidence map, canonical category profiles, DAG registrations, workflow stages, main production entry points, representative test map, and material wiring discrepancies are documented.

### Completed in this phase
- [x] Current source-tree and test/spec counts reconciled.
- [x] 55-module manifest reconciled with its CSV; all 55 paths exist.
- [x] Actual exports/import dependencies extracted for core chemistry, pH, powder, orchestration, chelation, surfactant, rheology, costing, regulatory, LIMS, evidence, closed-loop and specification subsystems.
- [x] 13 canonical product profiles and 6 specialized subclass profiles identified.
- [x] 23 registered DAG nodes reconciled with the post-DAG FINALIZATION stage (24 total pipeline steps).
- [x] 11 visible workflow stages mapped to the DAG pipeline.
- [x] Main production callers and duplicate/bypass paths documented.
- [x] Representative test coverage map recorded.
- [x] Source-tree counts reconciled against the unchanged inventory verifier; CSV/list parity and static reachability are enforced by CI.

### Verification completed on the code-bearing PR head
- Inventory verifier and static reachability audit passed on exact code head `6b5982dc4e3b2878b4f9e4c80a5542957cb39597` in PR run #1049.
- The 55-row evidence CSV contains inherited 2026-11-03 scientific-evidence classifications; the exact-head static graph independently refreshed direct importer and reachability status.
- No Phase 1 scientific correctness certification is claimed; software regressions are not a substitute for physical lab validation.
- No production scientific engine was modified as part of the inventory-only correction.
- This audit branch contains the static graph gate and corrected architecture evidence; merge remains conditional on the exact-head workflow and final diff review.

### Findings handed to later phases
- **P0 / Phase 2 input integrity:** UI fallback calculations can reintroduce defaults and override authoritative insufficient-data states.
- **P0 / Phase 2–3 pH:** direct UI pH fallback and powder-vs-liquid pH basis separation.
- **P0 / Phase 5 water/chelation:** UI defaults and category policy enforcement.
- **P1 / Phase 4–7:** profile applicability must be enforced by the actual DAG and every category's execution trace.
- **P1 / Phase 10 integration:** remove duplicate powder/cleaning/hardness/compatibility calculation paths; define one authoritative output contract.
- **All phases:** test scientific validity independently of code wiring and software CI.

Phase 1 is **closed as repository inventory and architecture mapping** on the code-bearing PR head. The exact-head inventory and static reachability gates passed. The final documentation-only closure commit is subject to its own exact-head CI rerun before merge. This does **not** certify predictive accuracy or laboratory performance; those require later scientific validation phases and physical experiments.

## 17. 2026-11-26 exact-base and static reachability audit

- Exact base: `a7f56884cb6aebf9dd2390f9643d5851e32e6546` (main at audit start).
- The main-branch inventory verifier already expected 61 / 64 / 93. An early draft incorrectly changed those values to 60 / 63 / 92; the first CI run caught the mismatch and that draft change was reverted. The final PR does not modify the inventory verifier.
- Exact code-bearing PR head `6b5982dc4e3b2878b4f9e4c80a5542957cb39597`: PR run #1049 and matching push run #1048 both succeeded.
- Inventory parity: 55 manifest paths, 55 CSV rows, 0 duplicates, 0 missing paths, 0 manifest/CSV set differences.
- Source-tree counts: 61 engine-named non-UI files, 64 including UI, 93 broad candidates. The retained 55-module set is a separate wiring inventory, not a validated scientific-engine count.
- Static graph: 472 source/tooling files scanned from `src/`, `scripts/`, and `server.ts`; roots `src/main.tsx` and `server.ts`; 254 files reachable from roots; 53/55 retained modules production-reachable; 2/55 imported but not root-reachable; 0 test-only; 0 orphan/no-importer; 0 modules without direct production or test/tooling importers; 0 unresolved production imports; 7 unresolved tooling-only relative imports in root `scripts/`.
- The two non-root-reachable retained modules are `empiricalCalibrationEngine.ts` and `empiricalValidationEvaluationEngine.ts`. Their production import path is through `EmpiricalValidationHub.tsx`, which is not itself imported from the production roots. Both modules have test importers. They are classified as a dormant empirical-validation feature path, not silently deleted or represented as active production functionality.
- The static analyzer emits explicit exported symbol names and direct importer lists. It is a static module graph, not a function-level call graph or proof of runtime invocation.
- Architecture reconciliation: 13 canonical product categories; 13 canonical profiles plus 6 specialized subprofiles; 23 registered DAG nodes plus post-DAG FINALIZATION; 11 visible workflow stages.
- The DAG currently applies profile gates for HLB, water chelation, and cleaning; the full profile route is not centrally enforced for every node. That residual runtime policy enforcement is assigned to the routing phase.
- AIFormulator no longer has direct fallback calculator calls for powder, pH, cleaning, hardness, or compatibility. The staged workflow still calculates intermediate results before final orchestrator recomputation; output-authority/duplicate-work verification is assigned to the orchestration phase.
- Scientific evidence status remains separate from wiring: no source-only or software-test evidence here establishes predictive accuracy or laboratory validation. No human review or physical lab review is claimed.



### Source-tree count refresh

A recursive Git tree read for the exact audit PR tree returned 792 tracked blobs; 443 TypeScript/TSX/JS/JSX files under `src/`, including 146 tests/specs and 297 non-test source files. The executable inventory verifier independently reports 61 engine-named non-test source files excluding UI, 64 including UI, and 93 broad discovery candidates. These are different counting definitions and must not be added together or called a count of scientifically validated engines.

### AIFormulator duplicate-path recheck

At the current main source snapshot, `AIFormulator.tsx` contains zero occurrences of `evaluatePowderFormulation`, `calculatePHAdvanced`, `calculateCleaningPerformance`, `calculateWaterHardnessTolerance`, and `calculateFormulationCompatibility`. The Phase 10 consistency regression also asserts that the UI consumes the canonical orchestrator outputs and does not reintroduce those fallback calculators. The older statements in Sections 11 and 14 that described these UI fallbacks as current defects are superseded by this recheck. `analysisWorkflowEngine.ts` still invokes stage-level calculations and then the orchestrator; this remains a separate workflow design question requiring explicit output-authority and duplicate-execution tests.


## 18. Final exact-head closure record

- PR: #111, base `a7f56884cb6aebf9dd2390f9643d5851e32e6546`. Code-bearing head `6b5982dc4e3b2878b4f9e4c80a5542957cb39597` passed matching push workflow run #1048 and pull-request workflow run #1049. A final report-only commit follows and must pass its own exact-head rerun before merge.
- Full TypeScript regression: **140/140 modules; 5,047/5,047 assertions; 0 failures**.
- TypeScript typecheck, reproducible production build, production server `/api/health` smoke test, Phase 6 evidence regression, inventory verifier, static import/reachability audit, genuine Android debug APK build, and Android WebView persistence/download instrumentation all passed.
- Android debug APK and instrumentation reports were uploaded by the successful workflow. The APK is a debug artifact, not a scientific release certification.
- No human review or physical laboratory validation is claimed. The scientific evidence suite explicitly retains empirically unvalidated / screening maturity where matched independent lab observations are absent.
- Phase 1 is closed for inventory, dependency mapping, module reachability classification, and software verification. Category policy execution gaps and staged-workflow output-authority checks remain assigned to the later routing/orchestration phases.
