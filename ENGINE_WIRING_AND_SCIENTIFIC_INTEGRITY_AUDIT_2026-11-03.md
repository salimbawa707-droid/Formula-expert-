# Engine Wiring and Scientific Integrity Audit
**Audit date:** 2026-11-03  
**Repository branch:** `audit/dead-engine-wiring-cleanup-20261103`  
**Pull request:** #83 (Draft)

## Executive result

- Baseline reconciled inventory before this pass: **56 engine modules**.
- Confirmed orphaned / unsafe test-only engine removed in this pass: **1** (`formulaDevelopmentEngine.ts`).
- Previously confirmed orphaned modules removed: **3** (`machineEngine.ts`, `troubleshooterEngine.ts`, `optimization/reformulationFeedbackEngine.ts`).
- Remaining reconciled inventory: **55 modules**.
- Caller trace: every remaining module has a direct production UI/workflow caller or an internal dependency path into a production workflow. The detailed per-module evidence and scientific limitation are in `engine-audit-final-2026-11-03.csv`.
- **This is a wiring audit, not a claim that 55 engines are empirically validated.** Most chemistry/performance outputs still require matched, licensed, method-specific laboratory data.

## Why the fourth engine was removed

`src/utils/formulaDevelopmentEngine.ts` had no production UI/workflow caller; it was only imported by its own test suite and the master test runner. The isolated module also seeded a hardcoded demonstration formula and, during approval, substituted default pH, active-matter and cleaning-index values when predictions were absent. It was therefore not safe to wire into production as-is and duplicated version/lifecycle responsibilities already represented in LIMS and the closed-loop workflow. The engine and its test-only suite were removed from the active inventory and runner. This avoids preserving a test-only approval path that could be mistaken for a real product workflow.

## Additional correctness defects fixed

### Inventory and production preflight
- New inventory catalog rows now start at **0 kg stock** with **unknown** lot, supplier and cost. Ingredient master data is not proof of physical stock or purchase price.
- Missing legacy cost/lot/supplier values remain unknown; the previous fabricated cost, lot and supplier fallbacks were removed.
- Water is no longer treated as an infinite `999999 kg` stock reservoir. It must be represented in the physical stock ledger before production deduction.
- Missing batch size no longer silently becomes 100 kg.
- Non-finite, negative, over-100% or missing ingredient percentages block production; formula mass balance must be 100.00% ±0.05 percentage points.
- Fuzzy substring inventory matching was removed. Grade-sensitive materials such as LABSA 90% and LABSA 96% cannot cross-match and consume the wrong stock. Exact ingredient ID/name or CAS identity is required.
- Unknown ingredient cost now produces **Not available**, not a zero-cost batch valuation.
- The demo/reference formula is preview-only; production deduction requires a committed active formula.

### Active-matter input
- PHEngineView no longer assigns an arbitrary 100% active default when a selected ingredient has no library value.
- Changing ingredient identity resets the active input to the new ingredient's available reference value or 0/unavailable; it cannot silently carry the previous ingredient's assay.
- The UI explicitly states that library defaults are screening references and must be checked against the supplier COA. The existing reference table itself is documented as unsourced screening defaults, not verified assays.

### Closed-loop evidence gate
- Simulated/unverified readings cannot trigger a reformulation decision or authorize a new formula version.
- The decision engine fails closed to `REQUIRES_MORE_DATA` until the measurement set has LAB_VALIDATED/CERTIFIED evidence, VERIFIED status, valid calibration, physical instrument identity, measurement/evidence IDs, analyst and valid timestamp.

## Retained engine policy

- `WIRED_DIRECT`: a production UI/workflow calls the module.
- `WIRED_INTERNAL`: another retained production module calls it as part of a live workflow (for example, a protocol validator, preprocessing pipeline, or regulatory facade).
- A production call path proves only that code is connected; it does **not** prove that the scientific model is accurate.
- Scientific validation statuses in the companion CSV deliberately distinguish deterministic software logic, reference-only screening, official-rule-source gaps, and missing physical laboratory evidence.

## Explicit scientific limitations

1. pH, active matter, chelation, HLB, viscosity, density, compatibility, cleaning performance, NVR and spectral identification must not be represented as laboratory-validated without appropriate matched measurements, methods, conditions, uncertainty and independent review.
2. Active-matter reference defaults and name-derived concentrations are screening inputs unless supported by the actual supplier COA/assay.
3. Regulatory conclusions require the applicable jurisdiction, effective date and official rule text; an engine call path is not legal verification.
4. Spectral preprocessing and matching require calibrated acquisition and licensed, material-specific reference spectra; similarity is not identity proof.
5. LIMS hash-chain integrity proves record integrity, not truth of a manually entered measurement.
6. Passing software CI does not certify a detergent formula, shelf life, cleaning efficacy, stability or commercial batch release.

## Verification state

This branch's code changes require a fresh CI run against the exact final commit. PR #83 remains Draft and must not be merged until the latest TypeScript regression, evidence guardrails, production build and Android APK jobs all pass. Independent physical laboratory validation remains a separate gate.
