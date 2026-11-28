# Engineering Reference Evidence Policy — Phase 4B

**Version:** 1.0.0  
**Date:** 2026-11-28  
**Purpose:** Keep preliminary formulation and sensitivity calculations usable when supplier documents are unavailable, without fabricating supplier specifications, safety classifications, certificates of analysis, or lot assays.

## 1. Non-negotiable evidence distinction

| Evidence class | What it can support | What it cannot support |
|---|---|---|
| Primary supplier TDS / specification | The named supplier's stated product properties and grade limits | Another supplier's product or an untested lot |
| Primary supplier SDS | Supplier hazard communication for the named product and revision | Active matter, purity, or lot assay unless explicitly stated |
| Batch-specific CoA | Results reported for the named batch/lot, with methods and units | Other lots or unreported properties |
| Published standard | A defined test method or specification within its scope | A measured value for a particular product |
| Published literature | Values and behavior under the stated study conditions | A universal commercial-grade specification |
| Public regulatory identity | Substance/name/CAS association within the source's scope | Supplier identity, concentration, purity, or lot composition |
| Catalog assertion | What the current catalog claims | Independent verification |
| Engineering estimate | A transparent provisional input and sensitivity range | Supplier conformity, safety classification, lot release, or regulatory certification |

Never relabel an engineering estimate as a supplier TDS, SDS, CoA, or assay. Never create a fictitious manufacturer, lot number, signature, laboratory, accreditation, test date, or certificate number.

## 2. Calculation policy: remove avoidable computational dead-ends

A missing supplier document should not automatically prevent preliminary calculations when a defensible engineering estimate or bounded scenario exists.

- A value can be used for preliminary calculation only when it has a numeric nominal value, unit, basis, explicit evidence class, and uncertainty note.
- Prefer lower / nominal / upper values and propagate the range through active-matter, cost, water, builder, chelation, and pH calculations where the engine supports interval analysis.
- If only a nominal value is available, label it as a point assumption and show a sensitivity warning; do not silently treat it as exact.
- A catalog concentration embedded in a name is CATALOG_ASSERTION, not a supplier assay.
- An engineering estimate may be used for scenario analysis but must never become lot-specific or qualify a batch.
- If no defensible numeric value exists, the calculator should request a user-supplied measured value or show a clearly marked scenario input. It must not invent a narrow range just to make the warning disappear.

The resolver in src/data/engineeringReferenceEvidence.ts deliberately returns values as preliminary-only and always sets lotReleaseEligible to false.

## 3. TDS / SDS / CoA / assay document handling

### TDS — Technical Data Sheet
Record supplier, exact product code, revision/date, grade, physical form, typical values versus guaranteed limits, method, temperature, concentration basis, storage conditions, and intended application. A TDS from one supplier is not transferable to an unnamed catalog grade.

### SDS — Safety Data Sheet
Use the supplier's current SDS for the exact product and jurisdiction. Capture all applicable hazard sections, revision, exposure controls, PPE, incompatibilities, first aid, spill/fire response, transport and disposal. If no product-specific SDS exists, use a documented conservative hazard review from authoritative substance sources and mark the result as provisional; do not fabricate GHS classification or a supplier SDS.

### CoA — Certificate of Analysis
A CoA is batch/lot-specific. It must identify supplier, product, batch/lot, sampling/test dates, parameter results, units, methods, specification limits, disposition, and issuing laboratory/authority. A blank template or engineering estimate is not a CoA and cannot satisfy a lot-assay gate.

### Lot assay
For every measured result, retain sample identity, method and revision, preparation, replicate count, raw readings, calculation, units/basis, uncertainty or repeatability where available, analyst/lab traceability, and lot number. Where the result is unavailable, store NOT_MEASURED; do not generate synthetic measurements.

## 4. Test-method scope and examples

- ISO 2271:1989 is a direct two-phase titration method for anionic-active matter in surfactants/detergents. The ISO page reports it was reviewed and confirmed in 2026. Its method scope and limitations must be respected; it is not a universal assay for every surfactant class.
  - https://www.iso.org/standard/7094.html
- ASTM D4251-89(2024) describes potentiometric titration for anionic active matter, including alkylbenzene sulfonates, alpha-olefin sulfonates, alcohol sulfates and alcohol ethoxysulfates. ASTM/ANSI scope notes it has not been tested for surfactant formulations. Do not apply it blindly to nonionic APGs or finished detergent mixtures.
  - https://store.astm.org/d4251-89r24.html
  - https://webstore.ansi.org/standards/astm/astmd4251892024
- ISO 2870:2009 covers anionic-active matter hydrolysable and non-hydrolysable under acid conditions, including alkyl sulfates and alcohol ethoxysulfates.
  - https://www.iso.org/standard/45657.html

A method reference is not a test result. The method must be suitable for the actual analyte and matrix, and the lab must report the actual measured result.

## 5. Current source-backed reference profiles

### AOS C14-16 — catalog variants aos-38 and aos-92
Public regulatory sources support the substance-level CAS/name relationship and describe the material as a variable-composition UVCB. A manufacturer bulletin for a separately named Stepan product reports its own active matter, but that value is not transferable to the catalog AOS-38/AOS-92 variants. No numeric active-matter value is asserted by this identity-only profile.

### APG 0810 — catalog variant apg-0810
FDA GSRS data distributed through PubChem supports the Caprylyl/Capryl Oligoglucoside name/CAS association and reports a mixture class. BASF's Plantacare 810 UP product page supports the named supplier product and its nonionic surfactant use. Neither source establishes the active matter of an unidentified catalog supplier's product. The custom diluted solution must remain a separate commercial blend.

## 6. Release gates remain evidence-based

The following are never cleared by an engineering reference profile alone:

- supplier/manufacturer identity verification;
- supplier-grade conformity;
- batch/lot CoA or active assay;
- impurity/residual limits;
- safety classification and jurisdiction-specific SDS approval;
- product-specific compatibility and finished-formula applicability;
- regulatory claims, environmental claims, or production release.

The intent is to replace an avoidable calculation blocker with a transparent estimate/sensitivity path—not to remove real evidence requirements.

## 7. Implementation contract

EngineeringReferenceProfile must always carry:

- exact catalog variant IDs covered;
- profile version and scope;
- source references with both supports and doesNotSupport claims;
- parameter unit and basis;
- evidence class and uncertainty note;
- explicit lotSpecific: false and formulaApplicabilityApproved: false.

Validation fails for reversed bounds, nominal values outside bounds, missing units, duplicate parameters, missing estimate uncertainty, missing source limitations, or attempts to enable lot release. The profile resolver is preliminary-only by design.

## 8. Completion criteria for scaling to all 430 catalog records

1. Reconcile each catalog ID and identity family without merging distinct grades or physical forms.
2. Add source-backed identity references where public authoritative evidence exists.
3. Add supplier product data only when the source names the exact supplier product and grade.
4. Add engineering estimate ranges only where the basis and uncertainty can be defended; otherwise leave the parameter unknown and expose an input/sensitivity control.
5. Keep lot-specific results empty until actual CoA/assay data are entered.
6. Run catalog-wide invariants: no fabricated lot IDs, no engineering estimate marked as CoA, no supplier identity inferred from generic chemistry, and no formula applicability auto-approved.

**Phase status:** This framework improves calculation continuity; it does not close Phase 4B. Phase 5 remains LOCKED until its independent evidence requirements are satisfied.
