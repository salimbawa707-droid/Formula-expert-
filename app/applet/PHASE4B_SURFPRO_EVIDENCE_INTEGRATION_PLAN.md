# PHASE 4B: SURFPRO EVIDENCE INTEGRATION PLAN

**Date:** October 17, 2026

---

## 1. Integration Scope
- **Target Engines:** `activeMatterEngine` (for CMC/physicochemical property validation), `compatibilityEngine`.
- **Integration Registry:** Use `src/domain/ph/pHEngineV2.ts` for property references or a new `data/experimentalRegistry.ts`.

## 2. Evidence Registration Procedure
1. **Metadata Registration:** Register dataset provenance (DOI, Version) in `src/domain/provenanceEngine.ts`.
2. **Data Ingestion:** Create immutable raw CSV storage in `src/data/experimental/`.
3. **Engine Mapping:** Create a lookup wrapper to match chemical species to SurfPro physicochemical properties (CMC, Surface Tension).

## 3. Independent Validation Protocol
- **Split Strategy:** Use 70/15/15 train/val/test splits.
- **Metric Computation:** RMSE and MAE against pH-predicted values.

## 4. Required Future Changes (NOT YET AUTHORIZED)
- `src/domain/ph/pHEngineV2.ts`: Add `validateAgainstExperimental(data)` method.
- `src/data/experimental/`: Directory for raw and curated datasets.

---

## 5. Final Confirmation
- **Code/Data Changed:** **NO**
