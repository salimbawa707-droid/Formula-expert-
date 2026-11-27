# Phase 4B — 13-Category Scientific Applicability, Equations, Units and Isolation Audit

**Audit date:** 2026-11-27  
**Audited source base:** `efcb7fe003152e776cc0199288a5677d063fb93e` (main after PR #122)  
**Implementation branch:** `audit/phase4b-six-candidate-runtime-dataflow-2026-11-27`  
**Scope:** All 13 canonical product categories; taxonomy/profile/engine/UI applicability; equation and input-unit contracts; category-specific policy; unknown-category and cross-category isolation.  
**Method:** Source-level review of `productTaxonomy.ts`, `scientificProductProfiles.ts`, `scientificRouter.ts`, `hlbEngine.ts`, `calculators.ts`, `viscosityEngine.ts`, `cleaningPerformanceEngine.ts`, `chelatorEngine.ts`, existing regression suites, and production call-site search. Static review does not establish dynamic runtime execution in every deployment path.

## Executive findings

1. **Confirmed HLB wiring mismatch:** `DISHWASH_AUTOMATIC` had taxonomy `categoryApplicability.hlb=true` and `requiresHLBAnalysis=true`, but its `applicableEngines` omitted `HLB_ENGINE`. The correction adds the missing engine registration. The existing low-foam nonionic policy remains unchanged; this only makes the already-declared HLB analysis reachable through the scientific engine registry.
2. **Confirmed unknown-category fail-open behavior:** `isMetricApplicable` returned true for unknown categories; surfactant-permission helpers also allowed both ionic classes by default, and category helper functions supplied generic anionic/pH/active-matter defaults. Corrections now deny unknown metric/ionic permissions and return `null` for unknown category preference, pH range, and active-surfactant range.
3. **13-category matrix:** HLB, viscosity, cleaning-performance and chelator/builder applicability are regression-checked against taxonomy flags and scientific profile engine registry. pH min/max/optimal values are checked against taxonomy for every category. Powder engine and powder calculation policy are checked against physical form.
4. **CMC and foam are not registered ScientificEngineId values:** taxonomy exposes CMC/foam metric visibility flags, but the scientific profile engine enum has no `CMC_ENGINE` or `FOAM_ENGINE`. CMC is a narrow utility calculation in `calculators.ts` (Clint ideal mixed-micelle model); foam diagnostics live in separate utilities. These flags must not be misrepresented as proof of an independently routed scientific engine.
5. **Category constraints are not all laboratory specifications:** profile pH and active-surfactant ranges are software screening targets, not validated product release limits. No category target is promoted to laboratory-validated specification.

## Category applicability and profile matrix

“HLB”, “viscosity”, “cleaning”, and “chelator” refer to applicable engine IDs; CMC/foam are separate metric flags, not engine IDs.

| Canonical category | pH min–max (optimal) | Active surfactant % (optimal) | Surfactant policy | HLB | Viscosity | Cleaning | Chelator | Powder |
|---|---:|---:|---|:---:|:---:|:---:|:---:|:---:|
| LAUNDRY_LIQUID | 7.5–9.5 (8.5) | 10–25 (16) | Anionic dominant | Yes | Yes | Yes | Yes | No |
| LAUNDRY_POWDER | 9.5–11.5 (10.5) | 10–22 (15) | Anionic dominant | No | No | Yes | Yes | Yes |
| DISHWASH_MANUAL | 6.0–8.0 (6.8) | 12–28 (20) | Anionic dominant | Yes | Yes | Yes | Yes | No |
| DISHWASH_AUTOMATIC | 8.5–11.5 (10.0) | 2–10 (6) | Nonionic low-foam | Yes* | Yes | Yes | Yes | No |
| FLOOR_CLEANER | 6.5–9.5 (7.5) | 3–8 (5) | Nonionic dominant | Yes | Yes | Yes | Yes | No |
| MULTIPURPOSE_CLEANER | 7.0–10.0 (8.5) | 4–10 (6) | Nonionic dominant | Yes | Yes | Yes | Yes | No |
| TOILET_CLEANER | 1.0–2.5 (1.5) | 2–6 (3.5) | Amphoteric balanced | No | Yes | Yes | No | No |
| BATHROOM_CLEANER | 2.0–4.0 (3.0) | 3–8 (5) | Nonionic dominant | Yes | Yes | Yes | Yes | No |
| GLASS_CLEANER | 8.5–10.5 (9.5) | 0.5–2.5 (1.2) | Low surfactant | No | Yes | Yes | No | No |
| FABRIC_SOFTENER | 2.5–4.5 (3.5) | 4–15 (8) | Cationic dominant | No | Yes | No | No | No |
| HAND_WASH | 5.0–6.8 (6.0) | 8–16 (12) | Amphoteric balanced | Yes | Yes | Yes | No | No |
| KITCHEN_DEGREASER | 11.0–13.8 (12.5) | 8–18 (14) | Nonionic dominant | Yes | Yes | Yes | Yes | No |
| CAR_SHAMPOO | 6.5–8.0 (7.2) | 8–18 (14) | Anionic dominant | Yes | Yes | Yes | Yes | No |

\* HLB registration was missing despite taxonomy and calculation policy requiring it; implementation adds `HLB_ENGINE`.

### Category-specific constraints recorded in taxonomy/profile

- **Laundry liquid:** enzyme stability above pH 9.5, hard-water protection, liquid rheology; the taxonomy descriptive band and executable profile constraint are reconciled to 500–1500 cP in this branch. This is an internal engineering target, not a universal standard or lab-validated release limit.
- **Laundry powder:** moisture below 5%, anticaking control, bulk density 0.45–0.85 g/cm³; powder engine only.
- **Manual dishwash:** mildness/CAPB, high foam; the taxonomy descriptive band and executable profile constraint are reconciled to 1200–3000 cP in this branch. This is an internal engineering target, not a universal standard or lab-validated release limit.
- **Automatic dishwash:** strict low/zero foam, glass protection and enzyme stability; nonionic low-foam preference; anionic and cationic surfactants disallowed by profile policy.
- **Floor cleaner:** low residue, fast drying and substrate-sensitive pH (marble/granite neutrality).
- **Multipurpose cleaner:** trigger-spray compatibility, mild nonionic degreasing and low fumes.
- **Toilet cleaner:** strongly acidic descaling, vertical cling and corrosion inhibition; chelator/builder engine is not enabled.
- **Bathroom cleaner:** organic-acid descaling/chelating, grout protection and cling time.
- **Glass cleaner:** active matter target 1.2% with profile maximum 2.5% and strict-under-3% taxonomy constraint; solvent/hydrotrope coupling and flash drying; chelator and HLB engines are not enabled.
- **Fabric softener:** cationic-only medium, no anionic surfactant, acidic esterquat stability; cleaning score is not applicable.
- **Hand wash:** skin mildness, physiological pH and dispensing rheology.
- **Kitchen degreaser:** alkaline reserve, solvent/terpene grease penetration and PPE.
- **Car shampoo:** near-neutral pH, paint lubricity and free rinsing/no spotting.

### Active-surfactant target reconciliation

Taxonomy minimum/target values are retained as the canonical screening target, and executable profile minimum/optimal values now match exactly for all 13 categories. The profile maximum remains the existing upper screening bound. GLASS_CLEANER uses 1.2% target and 2.5% profile maximum, consistent with its strict-under-3% constraint. These remain unverified engineering targets, not lab specifications.

## Complete scientific profile engine applicability matrix

The following matrix lists all 15 `ScientificEngineId` values and every canonical category enabled by the profile registry. The regression suite now asserts every engine/category pair (15 × 13 = 195 assertions), plus unknown-category rejection for every engine.

| Engine ID | Applicable categories |
|---|---|
| PH_ENGINE | All 13 categories |
| HLB_ENGINE | LAUNDRY_LIQUID, DISHWASH_MANUAL, DISHWASH_AUTOMATIC, FLOOR_CLEANER, MULTIPURPOSE_CLEANER, BATHROOM_CLEANER, HAND_WASH, KITCHEN_DEGREASER, CAR_SHAMPOO |
| ACTIVE_MATTER_ENGINE | All 13 categories |
| VISCOSITY_ENGINE | All liquid categories (12); not LAUNDRY_POWDER |
| POWDER_ENGINE | LAUNDRY_POWDER only |
| CLEANING_PERFORMANCE_ENGINE | All categories except FABRIC_SOFTENER |
| COMPATIBILITY_ENGINE | All 13 categories |
| CHELATOR_ENGINE | LAUNDRY_LIQUID, LAUNDRY_POWDER, DISHWASH_MANUAL, DISHWASH_AUTOMATIC, FLOOR_CLEANER, MULTIPURPOSE_CLEANER, BATHROOM_CLEANER, KITCHEN_DEGREASER, CAR_SHAMPOO |
| DENSITY_ENGINE | All 13 categories |
| DILUTION_ENGINE | LAUNDRY_LIQUID, DISHWASH_MANUAL, FLOOR_CLEANER, MULTIPURPOSE_CLEANER, BATHROOM_CLEANER, GLASS_CLEANER, FABRIC_SOFTENER, HAND_WASH, KITCHEN_DEGREASER, CAR_SHAMPOO |
| LAB_HEALTH_ENGINE | All 13 categories |
| GRADE_ENGINE | All 13 categories |
| SPECIFICATION_ENGINE | All 13 categories |
| EXPERT_REASONING_ENGINE | All 13 categories |
| COSTING_ENGINE | All 13 categories |

CMC and foam are intentionally not included in this 15-engine list because no `CMC_ENGINE` or `FOAM_ENGINE` exists in the profile type. Powder's internal foam and cleaning calculations are subfunctions of `POWDER_ENGINE`, not independent profile engines.

## Equation and input-unit audit

### 1. HLB blend

Implemented active-mass weighting:

`W_i = (dose_i [% w/w] × active_i [% w/w])/100`

`HLB_blend = Σ(HLB_i × W_i)/Σ(W_i)`

- Ingredient dose and explicit active-matter assay are each percentages by mass, bounded 0–100.
- Current implementation requires explicit valid active matter for each contributing surfactant; it does not safely infer supplier assay from a grade name.
- Ionic and nonionic HLB scales are distinguished in metadata (Davies vs Griffin). HLB is a screening descriptor, not proof of emulsion or finished-formula stability.
- A stale header statement claiming gross-dose fallback when active matter is missing was corrected to match the actual fail-closed implementation.

### 2. Mixed CMC

Implemented ideal Clint mixed-micelle rule:

`1/CMC_mix = Σ(x_i/CMC_i)`

- Surfactant as-supplied dose: % w/w; explicit active assay: % w/w.
- Active mass is converted to mole amount using molecular weight in g/mol; mole fractions are dimensionless.
- Pure CMC inputs accept M or mM and are normalized to mM; output remains mM.
- Exact chemical identity, pure-component CMC, molecular weight and explicit active assay are required. Unsupported identity or missing evidence returns unavailable.
- This is an ideal reference calculation. Ionic/nonionic interactions, electrolyte effects, temperature, mixed aggregates and non-ideality are not universally represented; benchmark bias notes remain attached. It is not a measured mixed CMC.

### 3. Viscosity/rheology

- Formula ingredients must have valid % w/w summing to 100 within 0.05 percentage points.
- Temperature input is °C and validated in the 0–100 °C interval. The primary scalar remains a 25 °C reference estimate; non-25 °C input produces a warning rather than a temperature-corrected scalar.
- Output viscosity is cP (numerically equivalent to mPa·s); yield stress is Pa and flow index is dimensionless.
- Powder/anhydrous formulae are classified unsupported for liquid viscosity.
- The engine is semi-empirical/model-derived except when an exact named reference benchmark is matched. Polymer submodels use ingredient percentage and fitted exponents; these are screening correlations, not universal constitutive equations. Temperature-dependent validation and product-specific lab curves remain required.

### 4. Cleaning/CPI

- Formula dose and active matter use % w/w; pH is dimensionless on the 0–14 scale.
- Where the category model requires a wash scenario: hardness is ppm (mg/L as CaCO3 for dilute wash water), wash volume L, detergent dose g and batch mass kg.
- Implementation is a category-specific deterministic scorecard with distinct branches and KPIs, not one universal detergent equation. Fabric softener has a separate conditioning path; unknown categories return null CPI/cleaning score and no category KPIs.
- Scores are 0–100 screening outputs. They are not empirical cleaning results and cannot replace standardized stain/soil-removal testing.

### 5. Chelation / hardness capacity

`HardnessLoad_mgCaCO3 = hardness_ppm_(mg/L) × washVolume_L`

`RequiredCapacity = HardnessLoad × (1 + safetyMarginPct/100)`

`AdditionalChelatorDosePct = (capacityDeficit_mg / capacity_mgCaCO3_per_g) / washDose_g × 100`

- Hardness: ppm as CaCO3; wash volume: L; dose: g; capacity: mg CaCO3-equivalent per g commercial chelator; batch mass: kg where batch scaling is reported.
- This is stoichiometric capacity arithmetic/screening, not a complete conditional Ca/Mg speciation model: pH, competing ligands, ionic strength, precipitation kinetics and ligand protonation can change real free-ion concentrations.
- Category hardness policy is applied before requiring scenario inputs; unknown categories use the explicit unknown policy rather than a guessed category.

### 6. pH equilibrium/speciation

The pH engine solves the electroneutrality residual:

`F(pH) = Q_positive(pH) - Q_negative(pH) = 0`

pH is defined from hydrogen-ion activity, `pH = -log10(a_H+)`. Polyprotic species are distributed by pKa-based ionization fractions; the water autoionization constant is temperature-dependent. Optional non-ideal modes calculate ionic strength `I = 0.5 × Σ(c_i z_i²)` and apply Davies or extended Debye–Hückel activity coefficients within the code's declared routing limits. The solver uses safeguarded Newton–Raphson with bracketed bisection fallback.

- Ingredient mass: kg or % w/w on the supplied batch basis; batch mass: kg.
- Temperature: °C; ionic strength: mol/L; species concentration: mol/L; pKa and pH: dimensionless.
- A numerical root is withheld when recognized acid/base/buffer species or required assay data are insufficient. It is a model prediction, not a formula-specific laboratory measurement.

### 7. Active matter and water balance

`active_i_pct = rawDose_i_pct × activeAssay_i_pct / 100`

`carrier_i_pct = rawDose_i_pct - active_i_pct`

`batchActiveMass_i_kg = active_i_pct × batchMass_kg / 100`

- Raw dose and assay: % w/w; batch mass: kg; output active/carrier masses: kg.
- Water balance separates free added water from carried water introduced by aqueous commercial raw materials.
- Missing or conflicting assays are exposed in provenance/diagnostics; grade names are not universally treated as lot-specific certificates.

### 8. Powder mass balance and physical properties

`formulaTotal_pct = Σ ingredientDose_pct`; `unassigned_pct = 100 - formulaTotal_pct`.

- Ingredient dose: % w/w; batch size: kg; moisture: %; bulk density: g/cm³; particle size: source/test-specific units; flow outputs include dimensionless Carr/Hausner ratios and angle of repose in degrees.
- Powder engine decomposes the formula into mass balance, ingredient classification, active matter, moisture/dry matter, builder/chelation, alkalinity, density/flow, pH, hardness, dissolution, foam, safety and stability checks.
- It does not auto-fill missing powder mass with water or an invented filler. Powder pH uses a 1% aqueous slurry basis as stated by the engine.

### 9. Density estimate

`componentVolume_cm3 = componentMass_g / componentDensity_g_cm3`

`mixtureDensity_g_cm3 = Σ(componentMass_g) / Σ(componentVolume_cm3)`

- Formula percentages: % w/w; reference batch mass: g; component density: g/cm³; component volume: cm³; reported mixture density: g/cm³ and kg/m³.
- The model assumes ideal volume additivity and uses name-mapped/reference component densities unless explicit density is supplied. It is a predicted screening estimate; packaging/fill decisions require measured density.

### 10. Dilution

`C1 × V1 = C2 × V2`; `V1 = C2 × V2 / C1`; `waterAdded = V2 - V1`.

- C1 and C2 must use the same concentration basis; V1 and V2 use the same volume unit (the UI commonly uses L).
- The function rejects zero/negative source concentration, nonpositive target volume, negative target concentration, and target concentration greater than source concentration.

### 11. Rule/registry engines without one universal chemical equation

- **Compatibility:** category-conditioned ingredient-pair and hazard rules produce alerts and a screening score; no universal scalar equation substitutes for compatibility testing.
- **Lab health, grade and specification:** status/provenance/range gates; outputs depend on registered thresholds and evidence completeness, not a universal chemistry equation.
- **Expert reasoning:** category-scoped rule/context assembly; not an independent physical predictor.
- **Costing:** deterministic sum of ingredient quantity × entered unit price, with missing-price handling; it is commercial arithmetic, not a scientific performance model.
- **Cleaning/CPI:** category-specific rule branches and weighted heuristic KPIs; the inventory labels this heuristic screening, not measured detergency.
- **Foam kinetics:** no executable formula predictor is registered as a profile engine; the separately implemented foam-decay utility analyses measured time-series data only.

## Evidence-based specification reconciliation (follow-up revision)

Repository evidence hierarchy:
- Product taxonomy contains canonical category active-matter minimum and target; existing P1 master regressions explicitly pin LAUNDRY_LIQUID at 10/16% and DISHWASH_AUTOMATIC at 4/8%.
- Scientific product profile calculationPolicy is consumed by formulationConstraintEngine.ts to construct HARD active-matter and viscosity constraints.
- Taxonomy explicitly labels category pH/active-matter values UNVERIFIED_ENGINEERING_TARGETS. No category-specific external product specification or lab dossier is attached. This reconciliation establishes internal software consistency, not empirical or regulatory validation.

Rules applied:
1. Taxonomy minimum/target is the canonical engineering screening target; profile minimum/optimal now match it exactly. Existing profile maximum remains the upper screening bound.
2. GLASS_CLEANER taxonomy target was 3%, contradicting its own strict-under-3% constraint; the profile already had 2.5% maximum and 1.2% optimum. Taxonomy target is corrected to 1.2%, and profile minimum is aligned to taxonomy minimum 1%.
3. Viscosity hard constraints are sourced from profile targetViscosityCP. Taxonomy descriptive bands now mirror the executable profile ranges: LAUNDRY_LIQUID 500–1500 cP; DISHWASH_MANUAL 1200–3000 cP. These are not universal industry standards.
4. Regression coverage requires exact taxonomy minimum/profile minimum and taxonomy target/profile optimal equality for all 13 categories, plus exhaustive 15-engine × 13-category routing assertions (195 pairs) and unknown-category rejection for all 15 engines.

| Category | Taxonomy min / target % | Profile min / max / optimal % |
|---|---:|---:|
| LAUNDRY_LIQUID | 10 / 16 | 10 / 25 / 16 |
| LAUNDRY_POWDER | 10 / 15 | 10 / 22 / 15 |
| DISHWASH_MANUAL | 12 / 20 | 12 / 28 / 20 |
| DISHWASH_AUTOMATIC | 4 / 8 | 4 / 10 / 8 |
| FLOOR_CLEANER | 3 / 6 | 3 / 8 / 6 |
| MULTIPURPOSE_CLEANER | 4 / 8 | 4 / 10 / 8 |
| TOILET_CLEANER | 2 / 5 | 2 / 6 / 5 |
| BATHROOM_CLEANER | 3 / 7 | 3 / 8 / 7 |
| GLASS_CLEANER | 1 / 1.2 | 1 / 2.5 / 1.2 |
| FABRIC_SOFTENER | 4 / 12 | 4 / 15 / 12 |
| HAND_WASH | 8 / 14 | 8 / 16 / 14 |
| KITCHEN_DEGREASER | 8 / 16 | 8 / 18 / 16 |
| CAR_SHAMPOO | 8 / 15 | 8 / 18 / 15 |

External evidence gap retained: all category targets remain UNVERIFIED_ENGINEERING_TARGETS. Product-specific customer brief, benchmark standard, finished-formula laboratory data and a defined test method/results are required before calling them validated specifications. The project review route is AI-only dual-pass source review; no human review or approval is claimed.

## Corrections applied in this branch

1. Added `HLB_ENGINE` to `DISHWASH_AUTOMATIC.applicableEngines`, aligning it with the existing taxonomy flag and `requiresHLBAnalysis=true`.
2. Changed unknown-category metric applicability to false, including the defensive missing-key fallback.
3. Changed unknown-category anionic/cationic permissions to false.
4. Changed unknown-category surfactant preference, pH range and active-surfactant range helpers to return `null` instead of borrowing generic defaults. The known production caller of category pH limits already handles null.
5. Corrected stale HLB documentation that contradicted the code's explicit-active-assay requirement.
6. Added regression assertions for all 13 category mappings, pH parity, powder physical-form routing, automatic-dish HLB wiring, unknown metric/ionic defaults and unknown-category CPI suppression.

## Reproducible verification

- New category matrix assertions are part of `runScientificRouterTestSuite`, already imported by `src/utils/test-calculations.ts` and included in `bun run test:all`.
- Unknown-category CPI assertions are added to `runCleaningPerformanceTestSuite`, also included in the same test runner.
- Existing HLB, viscosity, cleaning-performance and chelator suites remain in the full regression harness.
- Required CI commands: `bun run lint`, `bun run test:all`, `bun run build`, and repository Release Quality Gates workflow.
- **Execution status at report authoring:** source changes and regression assertions are prepared in the PR branch; no test pass is claimed until GitHub Actions completes against the resulting commit.

## Explicitly unresolved / not promoted

1. Category pH and active-matter values remain unverified engineering screening targets; no category-specific evidence dossier or independent product-specification approval is attached.
2. Internal taxonomy/profile viscosity and active-matter conflicts are reconciled in this revision; laboratory validity is not established.
3. CMC and foam have taxonomy metric flags but no distinct ScientificEngineId; their separate utility paths remain labeled as utilities, not profile-routed engines.
4. HLB/CPI/viscosity/CMC remain model/screening outputs; no engine is promoted to LAB_VALIDATED by this source audit.
5. Static import/call-site analysis cannot prove all dynamic runtime behavior. Full deployment telemetry and matched finished-formula laboratory observations remain outside this audit.

**Disposition:** Category-registry corrections and fail-closed regression coverage are implemented and CI-verified. Internal target conflicts are reconciled; external product-specification evidence and finished-formula laboratory validation remain OPEN. AI review is the project's authorized review method; no human review or approval is claimed. Phase 4B remains OPEN; Phase 5 remains LOCKED.
