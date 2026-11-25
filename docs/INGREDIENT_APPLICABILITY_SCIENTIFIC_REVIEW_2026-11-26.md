# Ingredient Applicability Scientific Review

Date: 2026-11-26  
Base commit: `62c4c2aac04114b5d36fe68162ed9d56b5ecae9f` (PR #102 merged to main)  
Review branch: `audit/ingredient-applicability-scientific-review`

## Scope and limits

The active `INGREDIENT_INTELLIGENCE_REGISTRY` contains **9 named ingredient records**, each with 13 category applicability entries: **117 entries reviewed**. This is not the full master ingredient catalog; this review makes no claim that all ingredient records elsewhere in the application have a scientifically complete applicability profile.

This is a source-informed desk review of declared chemical identity, ionic class, functional role, pH/stability constraints, product use and the reasoning text. It is not a supplier-specific formulation approval, finished-product stability study, performance test, safety assessment, or human/lab validation. Ingredient grade, concentration, co-ingredients, process, pH, use dilution and substrate can change the decision.

## Main branch post-merge verification

- Main HEAD: `62c4c2aac04114b5d36fe68162ed9d56b5ecae9f`.
- Push workflow run #933: `45694848715`, conclusion `success`.
- Full TypeScript regression, `bun run lint`, production build, production server `/api/health`, Phase 6 regression and evidence gates all passed.
- Android debug APK job was skipped in this push workflow; it is not counted as a pass.

## Applicability inventory at reviewed base

| Status | Count |
|---|---:|
| APPLICABLE | 63 |
| NOT_APPLICABLE | 30 |
| CONDITIONALLY_APPLICABLE | 13 |
| UNKNOWN | 11 |
| **Total** | **117** |

## Source-informed corrections made on this branch

1. **GLDA / TOILET_CLEANER: NOT_APPLICABLE → CONDITIONALLY_APPLICABLE.** The previous rationale claimed GLDA decomposes in strongly acidic conditions. Supplier technical information describes GLDA as stable over a wide pH range, and Univar lists toilet-bowl care among its applications. The status remains conditional because the actual commercial grade, acid system, concentration and finished-formula performance must be verified.
2. **GLDA / FABRIC_SOFTENER: NOT_APPLICABLE → UNKNOWN.** A blanket claim that GLDA electrolyte necessarily collapses every cationic softener emulsion is not supported by the evidence reviewed. Chelation can be useful, but salt loading and esterquat dispersion stability are formulation-specific; retain UNKNOWN until supplier compatibility data or a stability study exists.
3. **CAPB / FABRIC_SOFTENER: CONDITIONALLY_APPLICABLE → UNKNOWN.** CAPB is an amphoteric co-surfactant, not a fabric-softening active. A possible minor co-formulant role is not enough to claim category applicability without a defined function and compatibility evidence with the cationic softener system.
4. **Citric acid / KITCHEN_DEGREASER: NOT_APPLICABLE → CONDITIONALLY_APPLICABLE.** Citric acid can support acidic mineral/scale removal in kitchen hygiene, but it is not a replacement for alkaline builders/solvents in heavy grease removal. Conditional status distinguishes acidic descaling from primary grease cutting.
5. **Sodium carbonate / CAR_SHAMPOO: NOT_APPLICABLE → CONDITIONALLY_APPLICABLE.** Published car-wash/prewash formulations use carbonate builders. The prior blanket clearcoat/wax incompatibility was too broad. Use requires controlled concentration and use-dilution pH, substrate/wax compatibility checks and prompt rinsing; this is not approval for high-pH use on every vehicle finish.
6. **Sodium carbonate / TOILET_CLEANER rationale corrected.** The status remains NOT_APPLICABLE for acidic toilet-cleaner systems, but the rationale now correctly describes acid neutralization with carbon-dioxide release and possible vigorous foaming/closed-vessel pressure, rather than asserting that the reaction is inherently violent.
7. **CAPB / TOILET_CLEANER rationale corrected.** CAPB is described as zwitterionic/amphoteric, not “cationic-like”; use remains conditional on acid-grade, salt, viscosity and stability checks.

After these edits, the expected status counts are: APPLICABLE 63, NOT_APPLICABLE 27, CONDITIONALLY_APPLICABLE 16, UNKNOWN 13 (117 total).

## Evidence reviewed

- AkzoNobel, *Dissolvine GL technical brochure*: GLDA chemical stability under acid and alkaline conditions, with degradation noted only in severe high-temperature aqueous conditions at pH 7 and below. https://marketplace.chemsec.org/Document?id=1161
- Univar Solutions, *Biopure GLDA*: listed applications include automatic/hand dish care, laundry, floor care and toilet-bowl care; describes broad-pH stability and chelation. https://www.univarsolutions.com/biopure-glda-16133242?v=16133242
- Barcelonesa, *Detergency surfactants*: identifies betaines as foam boosters/thickeners and esterquats as fabric-softener/antistatic actives. https://www.barcelonesa.com/wp-content/uploads/documentacion-comercial/201/201_LS_EN_DETERGENCIA.pdf
- Shinnov Korea, surfactant portfolio: describes CAPB as an amphoteric mild co-surfactant with broad surfactant compatibility and wide-pH stability. https://www.shinnov.kr/Surfactants
- Stepan, *Alkaline-Based Car Wash Presoak 865*: supplier starter formulation demonstrates that alkaline vehicle prewash systems exist; it does not validate sodium carbonate specifically. https://www.stepan.com/content/dam/stepan-dot-com/webdam/website-product-documents/starter-formulations/StepanFormulation865.pdf
- Published car-wash composition patent: identifies sodium carbonate among possible alkalinity/builder components in vehicle-wash compositions and discusses clearcoat streaking controls. https://patents.google.com/patent/US20060135394A1/en
- Christeyns, *CAL*: kitchen-hygiene acid cleaner uses citric/phosphoric acids for inorganic/calcium deposits. https://www.christeyns-fhcee.com/EN/TDS/CAL%20-%202023-10-09_v1.0_EN_tds.pdf

## Remaining review findings / limitations

- **Aristo 9 remains mostly UNKNOWN** (11 categories) because the registry itself says supplier active assay and compatibility are unverified. Do not promote these UNKNOWN values to APPLICABLE based on marketing claims alone.
- GLDA/FABRIC_SOFTENER and CAPB/FABRIC_SOFTENER remain UNKNOWN. Do not infer compatibility from charge class alone; require supplier confirmation and finished-formula stability.
- LABSA/SLES/AOS in automatic dishwash remain NOT_APPLICABLE because their high-foam profiles conflict with low-foam automatic machine operation.
- The review did not bulk-convert UNKNOWN to NOT_APPLICABLE. Lack of evidence is not proof of incompatibility.
- Existing entries for LABSA, SLES, AOS, soda ash and other uses remain formulation-context dependent; a category status is not a dosage recommendation or a universal guarantee.

## Gate

This review should merge only after the full regression suite, typecheck and production build pass on the PR head. Phase 4B remains OPEN and Phase 5 remains LOCKED. No human review or laboratory validation is claimed.
