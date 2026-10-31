# Implementation Plan — Formula Expert Final Corrections

## Scope & Defect Summary
1. **Defect 1 — Commercial Grade vs Active Percentage Integrity**:
   - Detect conflicts between ingredient name commercial grade (e.g., "50% Liquid" in Sodium Hydroxide 50% Liquid) and actual active percentage (e.g. 99%).
   - Display blocking warning banner / badge in AIFormulator until confirmed or corrected.
   - Mark dependent pH/neutralization unverified while conflict is active.
   - Add regression tests in `src/utils/__tests__/commercialGrades.regression.test.ts`.

2. **Defect 2 — Optimizer Currency and Specification Consistency**:
   - Update `FormulationOptimizationPanel.tsx` labels from `$/kg` to `₹/kg` and `₹`.
   - Fix cost ceiling input range (`max="500"`) so ₹45/kg and ₹51.36/kg ceiling targets are fully supported.
   - Read active specification or user target instead of clipping or defaulting incorrectly.
   - Add regression tests in `src/utils/__tests__/formulationOptimization.regression.test.ts`.

3. **Defect 3 & 4 — Recalculation & Release Gate Integrity**:
   - Verify complete dependency pipeline and ensure release gate remains blocked when mandatory lab measurements (pH, density, viscosity, NVR) are missing.
