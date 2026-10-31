# P0 Master Remediation Changelog

**Project**: Detergent Formula Expert  
**Scope**: P0 Defects 01–06 Remediation  
**Date**: 2026-10-31  

---

## Summary of Changes

### 1. `src/utils/activeMatterEngine.ts`
- **Modified**: `ActiveMatterEngine.resolveIngredientActive()`
- **Changes**: Ensure missing raw material active specification returns `activeMatterPct: 0` and `dataSource: 'missing'`. Removed all fallback pathways that defaulted unknown materials to 100% active purity.

### 2. `src/App.tsx`
- **Modified**: `handleScanComplete()`
- **Changes**: Replaced `scannedIng.activeMatterPct ?? 100` with `scannedIng.activeMatterPct ?? getDefaultActiveMatter(scannedIng.name)`.

### 3. `src/utils/hlbEngine.ts`
- **Modified**: `HLBEngine.calculateBlendedHLB()`
- **Changes**: Refactored blended HLB calculation to isolate Griffin scale (nonionic, 0–20) from Davies scale (ionic, extended >20). Prevents arithmetic cross-scale averaging. Reports `methodMetadata: 'GRIFFIN'`, `'DAVIES'`, or `'NOT_APPLICABLE'` with explicit limitation diagnostics.

### 4. `src/utils/orchestrator/scientificExecutionDAG.ts`
- **Modified**:
  - `Node 19 (SPECIFICATION)`: Replaced `state.specificationStatus = 'VALID'` with `evaluateSpecificationReport(...)` to execute real parameter evaluation against category specification templates.
  - `Node 10 (VISCOSITY)`: Set `viscosityResult = NOT_APPLICABLE` for powder formulations.
  - `Node 13 (POWDER_ENGINE)`: Set `powderReport = null` and `powderStatus = NOT_APPLICABLE` for liquid formulations.
  - `Nodes 9, 10, 14, 15, 17, 20, 23`: Preserved `finalEquilibriumPH: null` for non-converged pH solvers and added `INSUFFICIENT_DATA` diagnostics without fabricating a neutral 7.0 fallback.

5. `src/domain/productTaxonomy.ts`
- **Modified**: `PRODUCT_TAXONOMY_MAP`
- **Changes**: Defined explicit engine applicability rules (`hlb`, `viscosity`, `powderEngine`, `cleaningScore`) for all 13 canonical product categories.

6. `src/utils/__tests__/p0_master_remediation.regression.test.ts`
- **Created**: New dedicated regression test module verifying all 20 required P0 failure scenarios and all 13 canonical product categories.

7. `src/utils/test-calculations.ts`
- **Modified**: Test suite runner registration.
- **Changes**: Integrated `runP0MasterRemediationTestSuite` into master execution runner and `executionMap`.
