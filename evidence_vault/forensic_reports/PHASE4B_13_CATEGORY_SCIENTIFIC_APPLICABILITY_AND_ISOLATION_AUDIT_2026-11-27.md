# Phase 4B — 13-Category Scientific Applicability, Units and Isolation Audit

**Date:** 2026-11-27 | **Base:** `efcb7fe003152e776cc0199288a5677d063fb93e`  
**Status:** Source audit completed; two policy defects corrected in this PR; CI pending.

## Executive findings

Two cross-layer defects were found and corrected:
1. `DISHWASH_AUTOMATIC` had HLB enabled in taxonomy, excluded from the profile engine list, but still marked as required by calculation policy. The category is a low-foam/nonionic machine-wash regime; HLB is not the governing zero-foam criterion. Taxonomy and policy are now both disabled, matching the engine list.
2. Unknown categories inherited metric visibility, ionic surfactant permissions, and generic preference/pH/active-range defaults. These paths now fail closed: metric/ionic permissions return false and category-specific getters return null.

The test suite adds 7 registry invariants for each of the 13 categories (91 checks), one explicit automatic-dish HLB check, and 11 unknown-category denial checks. No engine is promoted to LAB_VALIDATED.

## 1. Thirteen-category applicability matrix

Engine columns represent scientific profile routing. CMC is a narrow diagnostic applicability flag, not a separate routed `ScientificEngineId`.

| Category | Target pH min–max (optimal) | Active surfactant % w/w min–max (optimal) | HLB | Viscosity | Cleaning | Chelator/hardness | Powder | Category-specific controls |
|---|---:|---:|:---:|:---:|:---:|:---:|:---:|---|
| LAUNDRY_LIQUID | 7.5–9.5 (8.5) | 10–25 (16) | Yes | Salt curve | Yes | Yes | No | Anionic-dominant, wash hardness, soil suspension, enzyme stability |
| LAUNDRY_POWDER | 9.5–11.5 (10.5) | 10–22 (15) | No | N/A | Yes | Yes | Yes | Moisture/caking, builder reserve, alkalinity, bulk density and flow |
| DISHWASH_MANUAL | 6.0–8.0 (6.8) | 12–28 (20) | Yes | Salt curve | Yes | Yes | No | High foam, hand mildness, amphoteric co-surfactant |
| DISHWASH_AUTOMATIC | 8.5–11.5 (10.0) | 2–10 (6) | No | Base rheology | Yes | Yes | No | Low-foam nonionic; anionic/cationic permissions off; glass spotting |
| FLOOR_CLEANER | 6.5–9.5 (7.5) | 3–8 (5) | Yes | Base rheology | Yes | Yes | No | Low viscosity, streak/residue, fast drying |
| MULTIPURPOSE_CLEANER | 7.0–10.0 (8.5) | 4–10 (6) | Yes | Base rheology | Yes | Yes | No | Spray-compatible low viscosity, mild degreasing |
| TOILET_CLEANER | 1.0–2.5 (1.5) | 2–6 (3.5) | No | Cling rheology | Yes | No | No | Acid descaling, vertical cling, corrosion inhibition |
| BATHROOM_CLEANER | 2.0–4.0 (3.0) | 3–8 (5) | Yes | Base rheology | Yes | Yes | No | Acid scale/soap-scum removal, cling, grout protection |
| GLASS_CLEANER | 8.5–10.5 (9.5) | 0.5–2.5 (1.2) | No | Base rheology | Yes | No | No | Very low surfactant, volatile solvent, optical streak control |
| FABRIC_SOFTENER | 2.5–4.5 (3.5) | 4–15 (8) | No | Base rheology | No | No | No | Cationic-dominant, anionic prohibited, conditioning not cleaning CPI |
| HAND_WASH | 5.0–6.8 (6.0) | 8–16 (12) | Yes | Salt curve | Yes | No | No | Skin safety, mildness, controlled viscosity |
| KITCHEN_DEGREASER | 11.0–13.8 (12.5) | 8–18 (14) | Yes | Base rheology | Yes | Yes | No | Alkaline grease cutting, caustic hazard, nonionic preference |
| CAR_SHAMPOO | 6.5–8.0 (7.2) | 8–18 (14) | Yes | Salt curve | Yes | Yes | No | Paint lubricity, spotting, rinseability, hardness tolerance |

All categories also route their declared pH/active-matter/compatibility/density/lab-health/grade/specification/reasoning/costing capabilities as defined in their profiles; dilution routing is category-dependent. Only LAUNDRY_POWDER routes POWDER_ENGINE.

## 2. Equations and unit contracts

| Domain | Equation / method | Input units | Output units | Boundary |
|---|---|---|---|---|
| pH | PHEngineV2 acid/base speciation, charge balance and activity correction | Ingredient identity/mass; total mass kg; optional temperature K and ionic strength mol/L | pH dimensionless; species/equilibrium outputs | Model prediction; limited species/pKa coverage; matched measured pH is required for formula validation |
| Active matter | Active contribution = ingredient % × assay % / 100; sum by surfactant class | Formula % w/w; assay % w/w | Active matter % w/w | Supplier grade/lot assay required; name defaults are not CoA |
| HLB | HLB blend = Σ(HLBᵢ × active massᵢ)/Σ(active massᵢ); active mass = formula % × assay %/100 | Formula % w/w; assay %; HLB dimensionless | HLB dimensionless | Griffin nonionic and Davies ionic scales are not mixed. Mixed systems report the nonionic Griffin phase separately; not a detergency score |
| CMC | Ideal Clint harmonic mixing on mole-fraction basis | Exact single-substance identity/CAS; active mass, MW, source-backed pure CMC in M or mM | Ideal mixed CMC mM and mg/L | Narrow ideal-mixture diagnostic; matrix, pH/speciation, ionic strength, temperature and non-ideality limit use |
| Viscosity | Ingredient-rule heuristic; approximate salt curve, polymer/hydrotrope and temperature profiles | Formula % w/w; grade; optional pH; temperature °C (validated 0–100) | cP (mPa·s), approximate shear and 4/25/40 °C profiles | Not a fitted constitutive model. Primary scalar remains 25 °C reference even if another temperature is supplied; warning is emitted |
| Cleaning/CPI | Category-specific deterministic KPI weighting/rules | Formula % w/w; assay %; pH 0–14; laundry-liquid hardness scenario: ppm (mg/L as CaCO3), wash volume L, dose g, batch kg | CPI/category score 0–100; KPI units individually declared | Screening output, not measured detergency. Laundry-liquid CPI requires explicit hardness scenario; fabric softener uses conditioning score |
| Chelator/hardness | Hardness load = ppm × wash volume L; registered capacity arithmetic in mg CaCO3 equivalent/g | Hardness ppm (mg/L as CaCO3), L, dose g, batch kg, formula % w/w and assay | mg CaCO3 equivalent, mg/g, supported hardness ppm/coverage | Estimate/stoichiometric capacity, not a multi-ligand free-Ca2+/Mg2+ equilibrium or residual-hardness model |
| Powder | Mass balance, moisture, active matter, builder/alkalinity, density, flow, particle size, caking, slurry pH, dissolution, foam, safety | Formula % w/w; batch kg; moisture %; density g/mL, g/cm³ or kg/m³; particle size µm; 1% w/v pH test; °C; hardness ppm; dose g; wash volume L | Mass/moisture/active %; density; Carr %; Hausner ratio; angle °; particle size µm; pH | Powder-specific physical properties remain separate from liquid viscosity; unmeasured properties must remain NOT_MEASURED/SCREENING |

## 3. Category separation review

- Laundry powder excludes liquid viscosity/HLB and invokes powder moisture, density, flow, caking, slurry-pH, dissolution and powder-hard-water analyses.
- Manual dishwash is high-foam/skin-mildness oriented; automatic dishwashing is low-foam/nonionic, excludes anionic/cationic permissions and enforces low-foam/spotting controls.
- Toilet cleaner is the stronger acid/descaling regime with cling/corrosion controls and no builder/chelator route. Bathroom cleaner is a milder acidic scale/soap-scum regime and retains HLB/chelator routing.
- Glass cleaner prioritizes low surfactant and streak residue; HLB/chelator are excluded.
- Fabric softener is cationic-dominant, excludes anionic surfactants and returns conditioning rather than cleaning CPI.
- Hand wash emphasizes skin safety/mildness and does not route builder/chelator.
- Kitchen degreaser emphasizes alkaline saponification and caustic hazard.
- Car shampoo emphasizes mild pH, paint lubricity, spotting and rinseability.

## 4. Corrections

- Automatic-dishwashing HLB taxonomy flag and required-analysis policy aligned to false.
- Unknown metric visibility and ionic permissions now fail closed.
- Unknown-category surfactant preference, pH target and active-surfactant range now return null rather than fabricated defaults.
- Added cross-registry invariants for all 13 categories and unknown-category tests.

## 5. Residual scientific limitations

- Most taxonomy pH/active targets are engineering targets; unspecified evidence status does not mean literature-verified specifications.
- HLB/CMC are component/mixture diagnostics, not direct predictors of finished-product cleaning or foam.
- CMC input coverage remains narrow and catalog review incomplete.
- Viscosity is heuristic without matched formula/rheology data.
- Cleaning/CPI is screening pending matched standardized observations.
- Chelator capacity is estimated; conditional free-metal equilibrium and measured residual hardness are not solved.
- Each canonical category has one physical form. Dishwasher powder/tablets and distinct rinse-aid physical variants need explicit subclass/category modeling, not accidental reuse of a liquid profile.

**Phase 4B remains OPEN. Phase 5 remains LOCKED. No engine status is promoted to LAB_VALIDATED.**
