# Implementation Plan — Forensic Scientific & Mathematical Audit Remediation

## Objective
Remediate all identified scientific, mathematical, and data-integrity defects in the Detergent Formula Expert v2.5.0 calculation engines (pH equilibrium solver, active matter engine, HLB blending engine, and powder mass balance engine) in accordance with the strict forensic audit register and validation requirements.

## Remediation Tasks
1. **pH Equilibrium Solver (Defect 01)**:
   - Ensure unknown or uncharacterized ingredients without explicit equilibrium/acid-base data never silently assume neutral pH 7.00.
   - Return `NON_CONVERGED` / `INSUFFICIENT_DATA` (`pH: Number.NaN`) when uncharacterized.

2. **Active Matter & HLB Resolution (Defect 03)**:
   - Eliminate silent fallback to 100% active matter for unresolved raw materials in `hlbEngine.ts`.
   - Explicitly flag unknown active matter (`UNKNOWN_ACTIVE_MATTER`) and push to evaluation limitations.

3. **Powder Mass Balance (Defect 03)**:
   - Harden mass balance calculations in `powderMassBalance.ts` to detect malformed or negative percentage inputs (`!Number.isFinite(value) || value < 0`) and return an explicit `INVALID_INPUT` status report instead of silent zero conversion.

4. **Verification**:
   - Run production compilation (`vite build`) and test suites (`npm test`).
