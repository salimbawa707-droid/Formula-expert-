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
