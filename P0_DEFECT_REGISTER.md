# P0 Defect Register & Remediation Audit

**Project**: Detergent Formula Expert  
**Scope**: P0 Defects 01–06  

---

## Defect P0-01 — Unknown Scientific Values and False Verification

- **Root Cause**: Scanners and default fallback paths used `activeMatterPct ?? 100` or `activeDefault ?? 100`, converting uncharacterized raw materials into 100% active chemical solids.
- **Files Modified**: `src/utils/activeMatterEngine.ts`, `src/App.tsx`.
- **Functions Modified**: `ActiveMatterEngine.resolveIngredientActive()`, `App.tsx` scanner handler.
- **Before Behavior**: Scanned or uncharacterized raw materials defaulted to 100% active purity.
- **After Behavior**: Uncharacterized raw materials resolve to `activeMatterPct: 0` and `dataSource: 'missing'`.
- **Scientific Rationale**: Uncharacterized chemical mixtures cannot be assumed pure without a TDS, COA, or authoritative library entry.
- **Status**: PASS

---

## Defect P0-02 — pH Failure Fallback and Downstream Propagation

- **Root Cause**: Downstream DAG nodes used `state.finalEquilibriumPH ?? 7.0`, converting `null` pH solver failures into a plausible neutral pH (7.0).
- **Files Modified**: `src/utils/orchestrator/scientificExecutionDAG.ts`, `src/utils/analysisWorkflowEngine.ts`.
- **Functions Modified**: `ScientificExecutionDAG.executeDAG()`, `runDeepScientificAnalysis()`.
- **Before Behavior**: Solver non-convergence or missing pH defaulted to 7.0 in compatibility, viscosity, cleaning, and regulatory calculations.
- **After Behavior**: Missing pH is preserved as `null`. Dependent calculations issue `INSUFFICIENT_DATA` diagnostics without fabricating a numerical pH.
- **Scientific Rationale**: A failed chemical equilibrium calculation must emit `null` pH to signal non-convergence rather than masking errors with neutral pH.
- **Status**: PASS

---

## Defect P0-03 — HLB Scientific Method Correction

- **Root Cause**: `HLBEngine.calculateBlendedHLB` added Griffin scale values (0–20) and Davies scale values (e.g. SLES = 40.0) into a single arithmetic average.
- **Files Modified**: `src/utils/hlbEngine.ts`.
- **Functions Modified**: `HLBEngine.calculateBlendedHLB()`.
- **Before Behavior**: Ionic surfactants with Davies HLB 40.0 corrupted the blended HLB average (producing false values like 26.5).
- **After Behavior**: Nonionic surfactants are calculated strictly on the Griffin scale. Ionic surfactants are calculated on the Davies scale. Cross-scale arithmetic averaging is prevented.
- **Scientific Rationale**: Griffin (molecular mass ratio) and Davies (group numbers) are mathematically non-equivalent scales and cannot be directly averaged.
- **Status**: PASS

---

## Defect P0-04 — Scientific Quality Gate and Specification Engine

- **Root Cause**: Node 19 (`SPECIFICATION`) in `scientificExecutionDAG.ts` executed `state.specificationStatus = 'VALID'` unconditionally.
- **Files Modified**: `src/utils/orchestrator/scientificExecutionDAG.ts`, `src/utils/scientificQualityGateEngine.ts`.
- **Functions Modified**: `ScientificExecutionDAG` Node 19 handler, `evaluateScientificQualityGate()`.
- **Before Behavior**: Specification status was hardcoded to `VALID` regardless of formula parameters or lab data.
- **After Behavior**: Node 19 invokes `evaluateSpecificationReport` to evaluate actual parameter bounds (pH, active matter, viscosity, NVR, density, cost) against category specification templates.
- **Scientific Rationale**: Specification compliance must reflect genuine parameter bounds rather than static assignments.
- **Status**: PASS

---

## Defect P0-05 — Powder and Liquid Independent Calculation Paths

- **Root Cause**: Liquid viscosity models ran on powder categories, and powder bulk density reports were missing for solid products.
- **Files Modified**: `src/domain/productTaxonomy.ts`, `src/utils/orchestrator/scientificExecutionDAG.ts`.
- **Functions Modified**: `ScientificExecutionDAG` Nodes 10 (`VISCOSITY`) and 13 (`POWDER_ENGINE`).
- **Before Behavior**: Powders executed liquid viscosity predictions and liquids generated blank powder reports.
- **After Behavior**: Powders return `viscosity: NOT_APPLICABLE` and liquids return `powderReport: null`. All 13 canonical categories route to their appropriate physical form.
- **Scientific Rationale**: Solid bulk powder rheology differs fundamentally from liquid micellar hydrodynamics and must use distinct physical models.
- **Status**: PASS

---

## Defect P0-06 — Single Authoritative Calculation Contract

- **Root Cause**: Multiple entry points invoked divergent calculation functions or recomputed results with different parameters.
- **Files Modified**: `src/utils/orchestrator/formulaScientificOrchestrator.ts`, `src/utils/analysisWorkflowEngine.ts`, `src/components/AIFormulator.tsx`.
- **Functions Modified**: `FormulaScientificOrchestrator.evaluate()`, `runDeepScientificAnalysis()`.
- **Before Behavior**: UI panels independently computed active matter, pH, and costing with slight variations.
- **After Behavior**: `FormulaScientificOrchestrator.evaluate()` serves as the Single Source of Truth (SSOT). All UI components consume versioned evaluation results bound to formula fingerprints.
- **Scientific Rationale**: Reproducible scientific reporting requires a single, deterministic calculation contract per formula revision.
- **Status**: PASS
