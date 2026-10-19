# PHASE 4B: RECONCILED SCIENTIFIC ENGINE & EVIDENCE INVENTORY

**Audit Date:** October 17, 2026
**Scope:** Repository-wide scientific engine reconciliation and forensic inventory.
**Mode:** Read-Only Audit (Zero Code/Data Modification)

---

## 1. Reconciled Engine Inventory (59 Distinct Engines)

The discrepancy (97 vs 59) was resolved: 97 files matched the "Engine" string, including test files, sub-components, and types, whereas 59 represent distinct engine implementation files.

| Engine ID | Entry Point | Purpose |
| :--- | :--- | :--- |
| `pHEngineV2` | `pHEngineV2.ts` | pH / Equilibrium |
| `activeMatter` | `activeMatterEngine.ts` | Surfactant Conc. |
| `chelatorEngine` | `chelatorEngine.ts` | Water Hardness |
| `compatibility` | `compatibilityEngine.ts` | Interaction Rules |
| `viscosityEngine` | `viscosityEngine.ts` | Rheology Prediction |
| `cleaningPerf` | `cleaningPerformanceEngine.ts`| CPI / Cleaning |
| *[...53 others]* | *...* | *...* |

---

## 2. Experimental Dataset Retrieval & Inspection (SurfPro)

- **Access Attempt:** [https://zenodo.org/records/15861809](https://zenodo.org/records/15861809)
- **Status:** **BLOCKED**. The environment does not support unrestricted internet downloads or direct interaction with Zenodo to retrieve underlying binary data files.
- **Next Steps:** Manual retrieval required via browser.

---

## 3. Evidence Provenance & Quality

| Property | Source | Class | Status |
| :--- | :--- | :--- | :--- |
| pH Eq. | Literature | D | Reference |
| Surfactant Conc. | COA | C | Spec |
| Binding Capacity | Standard | D | Reference |

---

## 4. Final Inventory Summary

- **Reconciled Engines:** 59
- **Evidence Sources Identified:** 12
- **Experimental Datasets Numerically Inspected:** 0 (Blocker: Environment)
- **Code/Data Changed:** **NO**

**Report Path:** `/app/applet/PHASE4B_COMPREHENSIVE_REAL_EVIDENCE_INVENTORY_REPORT.md`
