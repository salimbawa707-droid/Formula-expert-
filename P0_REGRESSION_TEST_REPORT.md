# P0 Regression Test Execution Report

**Project**: Detergent Formula Expert  
**Test Suite**: Master Calculation Test Runner (`npx tsx src/utils/test-calculations.ts`)  
**Execution Timestamp**: 2026-10-31  

---

## 1. Master Test Suite Summary

```
================================================================
MASTER TEST RUNNER REPORT:
  DISCOVERED MODULES:         131
  REGISTERED MODULES:         131
  EXECUTED MODULES:           131
  SKIPPED MODULES:            0
  FAILED MODULES:             0
  TEST INTEGRITY FAILURES:    0
  TOTAL ASSERTIONS EXECUTED:  4606
  TOTAL ASSERTIONS PASSED:    4606
  TOTAL ASSERTIONS FAILED:    0
================================================================
MASTER TEST STATUS: 100% PASSED (131/131 modules, 4606 assertions)
```

---

## 2. Dedicated P0 Remediation Test Suite Summary

**Module**: `src/utils/__tests__/p0_master_remediation.regression.test.ts`  
**Passed Assertions**: 21 / 21 (100.0%)  

### Individual Scenario Results

| Scenario ID | Test Title | Result | Asserted Behavior |
| :--- | :--- | :--- | :--- |
| **P0-T1** | Unknown ingredient active matter | **PASS** | Returns `0%` active and `dataSource: 'missing'`, never 100%. |
| **P0-T2** | Unknown purity recording | **PASS** | Missing purity recorded as `missing` without fabrication. |
| **P0-T3** | Unsupported ingredient pH | **PASS** | Emits clean pH result without false confidence. |
| **P0-T4** | Unsupported HLB non-surfactant | **PASS** | Non-surfactants return `hasSurfactants: false` and `method: NOT_APPLICABLE`. |
| **P0-T5** | Missing density handling | **PASS** | Ideal volume additivity model handles uncharacterized materials cleanly. |
| **P0-T6** | Empty formula pH validation | **PASS** | Returns `SCIENTIFICALLY_INVALID` status; prevents silent `7.0` pass. |
| **P0-T7** | Non-converged pH solver tracking | **PASS** | Solver convergence status explicitly tracked. |
| **P0-T8** | Downstream pH dependency protection | **PASS** | Downstream calculations inspect pH confidence and report `INSUFFICIENT_DATA`. |
| **P0-T9** | Griffin / Davies scale isolation | **PASS** | Nonionic Griffin HLB (12.10) preserved without corruption from Davies ionic value (40.0). |
| **P0-T10** | HLB NOT_APPLICABLE verification | **PASS** | Inorganic acid/water formula returns `blendedHLB = 0` and `method: NOT_APPLICABLE`. |
| **P0-T11** | Specification missing input | **PASS** | Specification evaluation with missing parameters flags `INSUFFICIENT_DATA` or `FAIL`. |
| **P0-T12** | Specification actual failure | **PASS** | Low-active formula (0.1%) fails minimum active specification. |
| **P0-T13** | Powder specification routing | **PASS** | Powder category receives Powder Engine report and `viscosity: NOT_APPLICABLE`. |
| **P0-T14** | Liquid specification routing | **PASS** | Liquid category receives Brookfield cP viscosity and `powderReport: null`. |
| **P0-T15** | Unit comparison integrity | **PASS** | Density parameters compared in consistent g/cm³ units. |
| **P0-T16** | Single calculation contract (SSOT) | **PASS** | Orchestrator provides SSOT result bound to version and fingerprint. |
| **P0-T17** | Divergent output elimination | **PASS** | Identical inputs produce 100% deterministic outputs across runs. |
| **P0-T18** | Formula revision tracking | **PASS** | Output explicitly records input formula version (`1.0.0`). |
| **P0-T19** | Evidence provenance integrity | **PASS** | Unmeasured formula assigned evidence level `PREDICTED_ONLY`. |
| **P0-T20** | Quality Gate false PASS prevention | **PASS** | Unbalanced mass total (70%) blocks commercial release. |
| **P0-T21** | 13 Canonical categories coverage | **PASS** | All 13 canonical category IDs resolve explicitly without defaulting to `UNKNOWN`. |
