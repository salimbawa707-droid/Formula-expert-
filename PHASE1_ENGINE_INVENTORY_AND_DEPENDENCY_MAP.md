# Phase 1 — Engine Inventory & Dependency Mapping
**Status:** IN PROGRESS — baseline captured; import/call graph and runtime reachability verification remain open  
**Baseline branch:** `main`  
**Baseline commit:** `2495fbf2bbb0f549acdcdc6fd63daa36f222946d`  
**Audit branch:** `audit/phase1-engine-inventory-20261124`  
**Audit date:** 2026-11-24

## 1. Scope and evidence boundary

This phase inventories source modules, tests, product-category routing, scientific workflow stages, and the declared engine DAG. It does not certify scientific correctness and it does not authorize a merge.

Repository tree was read recursively from the exact baseline commit. Counts below are reproducible source-tree counts, not estimates.

| Measure | Baseline |
|---|---:|
| Tracked blob files | 771 |
| TypeScript/TSX/JS/JSX source files under `src/` and `app/` | 438 |
| Test/spec files among those source files | 145 |
| Non-test TypeScript/TSX files under `src/` | 292 |
| Main branch CI run #694 | SUCCESS |
| Main branch CI run ID | 45432038831 |
| Main branch CI SHA | 2495fbf2bbb0f549acdcdc6fd63daa36f222946d |

**Important counting rule:** 292 non-test source files are not 292 scientific engines. The set includes UI components, data stores, service adapters, types, persistence, regulatory rules, and other infrastructure. Engine counts must be classified by exported responsibility and production call path, not filename substring alone.

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

## 5. Phase 1 work remaining

- [ ] Locate and reconcile the prior 55-module inventory and its companion evidence (including CSV path, if retained elsewhere).
- [ ] Extract every exported function/class from all candidate engine modules.
- [ ] Build static import/call edges for all production modules and identify actual UI/workflow entry points.
- [ ] Trace each of the 24 DAG nodes to implementation and each implementation to a production caller or mark ORPHAN/TEST_ONLY.
- [ ] Map all 13 product categories to required, optional, conditional, and not-applicable engines; verify category router behavior against the declared matrix.
- [ ] Reconcile the 11 analysis stages with the 24 DAG nodes and identify duplicate, bypassed, or dead execution paths.
- [ ] Map tests to modules and identify engines without direct unit, integration, boundary, and reference-case coverage.
- [ ] Record per-module scientific evidence status separately from wiring status: deterministic software, literature/reference estimate, supplier-data-dependent, lab-validation-required, or unsupported.
- [ ] Run the repository's relevant inventory/static checks and baseline test/build gates on the exact audit commit.
- [ ] Publish the completed inventory and dependency map with reproducible counts and evidence references.

## 6. Safety / merge policy

No production source code was changed in this initial inventory checkpoint. No changes were made to `main`. No merge is requested or permitted by this phase checkpoint. The audit branch is isolated from `main`.

A module is not considered COMPLETE merely because it compiles, has a test, appears in the DAG, or has a caller. Scientific validation requires independently traceable equations/data, units, valid input domains, uncertainty/assumptions, boundary/reference cases, and (where applicable) matched physical lab evidence.


## 7. First-pass implementation trace — verified discrepancies

The complete `scientificExecutionDAG.ts` file was fetched and its actual registrations were counted by matching each `this.nodes.set(...)` declaration. It registers **23 nodes**, not 24.

Actual registered IDs:
`NORMALIZATION`, `IDENTITY_RESOLUTION`, `CATEGORY_ROUTING`, `NEUTRALIZATION`, `PH_EQUILIBRIUM`, `ACTIVE_MATTER`, `HLB`, `WATER_CHELATION`, `COMPATIBILITY`, `VISCOSITY`, `DENSITY`, `NVR`, `POWDER_ENGINE`, `CLEANING_CPI`, `STABILITY_SCREENING`, `COSTING`, `REGULATORY`, `MANUFACTURING`, `SPECIFICATION`, `LAB_EVIDENCE`, `QUALITY_GATE`, `GRADE`, `RECOMMENDATIONS`.

This creates a concrete documentation/code discrepancy:
- The DAG file header and comments say 24 engines/nodes.
- The implementation registers 23 node IDs.
- Climate analysis, substitution recommendations, and lab-health scoring are executed inside the RECOMMENDATIONS node rather than being independent registered nodes.
- No node named FINALIZATION is registered in the DAG, although the architecture matrix lists FINALIZATION as node 24.
- The architecture matrix's 24-node sequence therefore does not match the actual registration list one-to-one.

**Phase 1 action required:** establish whether these are intentional nested services and correct the architecture inventory/documentation to describe the real runtime graph. Do not add a fake node solely to make the count 24.

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

## 10. Current source-tree counts and inventory guard repair

Using the same path filters declared in `evidence_vault/scripts/verify_engine_inventory.mjs`, the current source tree gives:

| Count definition | Current source tree |
|---|---:|
| Non-test TS/TSX/JS/JSX files under `src/` | 292 |
| Test/spec files under `src/` | 145 |
| Engine-named source files excluding UI components | 60 |
| Engine-named files including UI components | 63 |
| Broad engine/calculator/optimizer/formulation/workflow/predictor/router candidates | 92 |
| Reconciled retained wiring modules | 55 |

The verifier script previously hard-coded 59 / 62 / 65 / 94, which no longer matched the checked-in list and current tree. It has now been updated on this audit branch to expect 55 / 60 / 63 / 92 and to check that the 55-path manifest and 55-row CSV contain the same paths. The CSV line parser was corrected after review.

**Execution status:** these counts and manifest parity were independently computed from the GitHub tree and file contents. The updated Node script itself has not yet been executed in a checked-out repository or CI. It must be run in the final combined CI before merge; do not claim the script has passed yet.

## 11. Production entry points and actual caller paths

Current code search and source inspection confirm these principal paths:

| Entry point / consumer | Observed route | Notes |
|---|---|---|
| `AIFormulator.runDeepScientificAnalysis` | UI -> direct powder evaluator (powder only) -> `FormulaScientificOrchestrator.evaluate` -> decision engine | The UI currently also has fallback recalculations for pH, cleaning, hardness/chelation and compatibility when orchestrator outputs are missing/empty. |
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

### Verified integration gap

`scientificRouter.ts::routeScientificExecution` builds the profile's `applicableEngines` and `engineRoutingMap`. However, `scientificExecutionDAG.ts` does not import or call `routeScientificExecution` or `getScientificProductProfile`. Its `CATEGORY_ROUTING` node only normalizes the category and resolves physical form from `productTaxonomy`.

The DAG then runs most nodes unconditionally. Only physical-form conditions for `POWDER_ENGINE`, `NVR`, and liquid viscosity/density are applied. Examples of profile-vs-DAG divergence to verify and correct in the dedicated routing/integration phase:
- HLB is excluded from the laundry-powder profile, but the DAG's HLB node is not category-gated.
- Chelation is excluded from the toilet-cleaner profile, but the DAG water-chelation node is not profile-gated.
- Cleaning performance is excluded from the fabric-softener profile, but the DAG cleaning node is not profile-gated.
- Other profile-only rules (for example low-foam, skin safety, cling, streak/residue and surfactant restrictions) need proof that they are enforced by the actual calculation/gate path, not just represented in a profile registry.

This is a material architecture finding, not a proof that every affected formula currently receives an incorrect numeric result. Phase 2 / Phase 10 must test and reconcile it with category-by-category execution traces.

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

## 14. High-priority duplicate / bypass paths discovered

These are Phase 1 wiring findings to be fixed and regression-tested in the relevant later phases:

1. **AIFormulator duplicate powder evaluation:** `runDeepScientificAnalysis` calls `evaluatePowderFormulation` directly, then calls `FormulaScientificOrchestrator.evaluate`, whose DAG also invokes `evaluatePowderFormulation`. Two powder reports can therefore be generated for the same snapshot; the UI must use one authoritative result.
2. **AIFormulator pH fallback bypass:** if the orchestrator pH is null, the UI independently calls `calculatePHAdvanced` and writes the fallback pH back into `orchResult.pHResult`. The fallback maps missing purity to 100% and defaults batch size to 100 kg. This can change a fail-closed orchestrator result into a displayed numeric pH.
3. **AIFormulator cleaning fallback:** if cleaning output is missing/zero, the UI directly calls `calculateCleaningPerformance` using defaults (pH 8.0, hardness 150 ppm, wash volume 10 L, dose 20 g, batch 100 kg) and may normalize an unbalanced formula. These defaults can create a screening score without explicit user inputs.
4. **AIFormulator hardness fallback:** when the orchestrator result is absent/not evaluated, the UI directly calls `calculateWaterHardnessTolerance` using 10 L / 20 g / 100 kg fallback values.
5. **AIFormulator compatibility fallback:** the UI independently calls `calculateFormulationCompatibility` when the orchestrator result is judged missing/invalid.
6. **Staged workflow double evaluation:** `executeStagedScientificAnalysis` runs stage-level engine calculations and then performs a final `FormulaScientificOrchestrator.evaluate` recomputation. This may be intentional for progress and forensic comparison, but the contract must explicitly identify which outputs are authoritative and prevent intermediate values from overwriting final values.

These are direct conflicts with the “single source of truth / no duplicate UI calculations” architecture claim and should be treated as priority integration work, not silently accepted as normal UI behavior.

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
- [x] Stale engine inventory guard counts corrected and CSV/list parity validation added.

### Verification still pending
- The updated `verify_engine_inventory.mjs` has not yet been run in CI or a checked-out repository. It is explicitly pending final combined verification.
- The 55-row wiring CSV's caller evidence is inherited from 2026-11-03; only principal current entry points and key graph edges were rechecked during this phase.
- No Phase 1 scientific correctness certification is claimed.
- No production source engine was modified.
- No PR was opened and no merge was attempted.

### Findings handed to later phases
- **P0 / Phase 2 input integrity:** UI fallback calculations can reintroduce defaults and override authoritative insufficient-data states.
- **P0 / Phase 2–3 pH:** direct UI pH fallback and powder-vs-liquid pH basis separation.
- **P0 / Phase 5 water/chelation:** UI defaults and category policy enforcement.
- **P1 / Phase 4–7:** profile applicability must be enforced by the actual DAG and every category's execution trace.
- **P1 / Phase 10 integration:** remove duplicate powder/cleaning/hardness/compatibility calculation paths; define one authoritative output contract.
- **All phases:** test scientific validity independently of code wiring and software CI.

Phase 1 is complete as an inventory/mapping phase, but its pending CI check remains a required gate in the final all-phase re-audit.