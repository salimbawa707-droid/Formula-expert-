# Phase 5B — Prevalidation Calculation Foundation Track

Governance status: OPEN FOR PREPARATORY IMPLEMENTATION ONLY  
Effective date: 2026-11-28  
Parent gate: Phase 4B remains OPEN. Phase 5 empirical validation/calibration remains LOCKED.  
Review route: AI dual-pass review; no human approval or laboratory validation is claimed.

## 1. Purpose

Phase 5B is opened as a bounded engineering workstream to prepare calculation engines for source-backed values and uncertainty propagation. It does not waive Phase 4B closure criteria and does not authorize model calibration, performance claims, finished-formula validation, product release, or production claims.

## 2. Work allowed while Phase 4B remains open

1. Integrate the engineering-reference resolver into preliminary calculation paths without converting estimates into supplier assays.
2. Propagate lower / nominal / upper input intervals through deterministic calculations, beginning with active matter and material cost.
3. Add explicit provenance, basis, uncertainty and sensitivity outputs to each result.
4. Extend interval propagation to pH/neutralization, hardness/chelation, compatibility and category screening only after each engine's equations, units, applicability domain and monotonicity assumptions are audited.
5. Connect the Formula Analyzer to bounded outputs and require it to distinguish MEASURED, SUPPLIER_SPECIFIED, PUBLISHED_REFERENCE, ENGINEERING_ESTIMATE, CATALOG_DEFAULT and UNKNOWN.
6. Add regression tests proving that preliminary estimates never set supplier identity, lot assay, formula applicability approval, empirical validation, or release eligibility.
7. Create a per-consumer migration inventory and exact-head CI evidence.

## 3. Prohibited promotions

- Engineering estimates cannot become supplier TDS/SDS/CoA or lot-specific assay.
- Published supplier examples for another supplier's product cannot be assigned to the catalog's supplier/grade.
- A nominal value cannot silently replace a missing value; interval bounds and uncertainty must remain visible.
- A predicted pH, cleaning score, foam score, CMC, viscosity or compatibility result cannot be described as measured or validated.
- No output can become LAB_VALIDATED, CERTIFIED, APPROVED_FOR_NAMED_FORMULA or release-eligible from a software test alone.

## 4. Implementation sequence

### 5B-1 — Active matter and cost

- Inventory every production consumer of active-matter and cost values.
- Define a typed resolver contract with value, unit, basis, provenance class, lower/nominal/upper, uncertainty note and calculation eligibility.
- Propagate intervals through mass-fraction calculations and cost/kg totals.
- Preserve explicit unknown states and do not coerce unknown to zero.
- Verify edge cases: 0%, 100%, missing, out-of-range, mismatched units/basis, conflicting grade defaults and duplicate ingredient aliases.

### 5B-2 — pH and neutralization

- Audit acid/base equivalents, molecular weights, assay basis, density and water basis.
- Only use interval calculations where the chemical model supports the input bounds; pH is logarithmic and nonlinear, so simple linear interval propagation is prohibited.
- Use solver-based lower/nominal/upper scenarios with convergence and charge-balance diagnostics.

### 5B-3 — Hardness and chelation

- Keep CaCO3-equivalent capacity basis explicit (mg CaCO3/g or equivalent).
- Propagate water hardness, wash volume, dose and chelator assay uncertainty.
- Preserve the selected stoichiometric/safety margin as a named scenario input, not a hidden constant.

### 5B-4 — Compatibility and Formula Analyzer

- Keep category applicability and ingredient identity gates upstream of recommendation.
- Separate mechanistic incompatibility warnings from evidence confidence.
- Require the analyzer to state evidence class, missing data, uncertainty range and what cannot be concluded.

## 5. Exit criteria for Phase 5B

- All production call-sites are inventoried and migrated or explicitly excluded with rationale.
- Interval calculations are unit-tested against independently derived hand calculations and property-based edge cases.
- Monotonicity, bounds, mass conservation and no-unknown-to-zero properties are tested.
- No engineering estimate can satisfy supplier/lot/formula-release gates.
- AI dual-pass review is recorded on exact source head.
- Exact-head Current Release Quality Gates pass 7/7.
- Phase 4B external provenance, rights, identity and matched-data gates remain separate and must still be closed before empirical Phase 5 begins.

## 6. Status semantics

- PHASE_5B_PREPARATION_OPEN: code and calculation-contract preparation is allowed.
- PHASE_5_EMPIRICAL_VALIDATION_LOCKED: model calibration, accuracy claims, finished-formula validation and empirical release remain prohibited until Phase 4B closure.
- This track does not alter existing scientific release gates.
