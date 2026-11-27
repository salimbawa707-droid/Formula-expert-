# Phase 4B — 13-Category Scientific Applicability, Equations, Units and Isolation Audit

**Audit date:** 2026-11-27  
**Audited source base:** \`efcb7fe003152e776cc0199288a5677d063fb93e\` (main after PR #122)  
**Implementation branch:** \`audit/phase4b-six-candidate-runtime-dataflow-2026-11-27\`  
**Scope:** All 13 canonical product categories; taxonomy/profile/engine/UI applicability; equation and input-unit contracts; category-specific policy; unknown-category and cross-category isolation.  
**Method:** Source-level review of \`productTaxonomy.ts\`, \`scientificProductProfiles.ts\`, \`scientificRouter.ts\`, \`hlbEngine.ts\`, \`calculators.ts\`, \`viscosityEngine.ts\`, \`cleaningPerformanceEngine.ts\`, \`chelatorEngine.ts\`, existing regression suites, and production call-site search. Static review does not establish dynamic runtime execution in every deployment path.

## Executive findings

1. **Confirmed HLB wiring mismatch:** \`DISHWASH_AUTOMATIC\` had taxonomy \`categoryApplicability.hlb=true\` and \`requiresHLBAnalysis=true\`, but its \`applicableEngines\` omitted \`HLB_ENGINE\`. The correction adds the missing engine registration. The existing low-foam nonionic policy remains unchanged; this only makes the already-declared HLB analysis reachable through the scientific engine registry.
2. **Confirmed unknown-category fail-open behavior:** \`isMetricApplicable\` returned true for unknown categories; surfactant-permission helpers also allowed both ionic classes by default, and category helper functions supplied generic anionic/pH/active-matter defaults. Corrections now deny unknown metric/ionic permissions and return \`null\` for unknown category preference, pH range, and active-surfactant range.
3. **13-category matrix:** HLB, viscosity, cleaning-performance and chelator/builder applicability are regression-checked against taxonomy flags and scientific profile engine registry. pH min/max/optimal values are checked against taxonomy for every category. Powder engine and powder calculation policy are checked against physical form.
4. **CMC and foam are not registered ScientificEngineId values:** taxonomy exposes CMC/foam metric visibility flags, but the scientific profile engine enum has no \`CMC_ENGINE\` or \`FOAM_ENGINE\`. CMC is a narrow utility calculation in \`calculators.ts\` (Clint ideal mixed-micelle model); foam diagnostics live in separate utilities. These flags must not be misrepresented as proof of an independently routed scientific engine.
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

\* HLB registration was missing despite taxonomy and calculation policy requiring it; implementation adds \`HLB_ENGINE\`.

### Category-specific constraints recorded in taxonomy/profile

- **Laundry liquid:** enzyme stability above pH 9.5, hard-water protection, liquid rheology; taxonomy text says 600–1200 cP while profile targetViscosityCP says 500–1500 cP. This disagreement remains open rather than silently reconciled.
- **Laundry powder:** moisture below 5%, anticaking control, bulk density 0.45–0.85 g/cm³; powder engine only.
- **Manual dishwash:** mildness/CAPB, high foam, taxonomy viscosity text 1500–2500 cP while profile targetViscosityCP says 1200–3000 cP. Keep open pending a formally chosen product specification.
- **Automatic dishwash:** strict low/zero foam, glass protection and enzyme stability; nonionic low-foam preference; anionic and cationic surfactants disallowed by profile policy.
- **Floor cleaner:** low residue, fast drying and substrate-sensitive pH (marble/granite neutrality).
- **Multipurpose cleaner:** trigger-spray compatibility, mild nonionic degreasing and low fumes.
- **Toilet cleaner:** strongly acidic descaling, vertical cling and corrosion inhibition; chelator/builder engine is not enabled.
- **Bathroom cleaner:** organic-acid descaling/chelating, grout protection and cling time.
- **Glass cleaner:** active matter below 3%, solvent/hydrotrope coupling and flash drying; chelator and HLB engines are not enabled.
- **Fabric softener:** cationic-only medium, no anionic surfactant, acidic esterquat stability; cleaning score is not applicable.
- **Hand wash:** skin mildness, physiological pH and dispensing rheology.
- **Kitchen degreaser:** alkaline reserve, solvent/terpene grease penetration and PPE.
- **Car shampoo:** near-neutral pH, paint lubricity and free rinsing/no spotting.

## Equation and input-unit audit

### 1. HLB blend

Implemented active-mass weighting:

\`W_i = (dose_i [% w/w] × active_i [% w/w])/100\`

\`HLB_blend = Σ(HLB_i × W_i)/Σ(W_i)\`

- Ingredient dose and explicit active-matter assay are each percentages by mass, bounded 0–100.
- Current implementation requires explicit valid active matter for each contributing surfactant; it does not safely infer supplier assay from a grade name.
- Ionic and nonionic HLB scales are distinguished in metadata (Davies vs Griffin). HLB is a screening descriptor, not proof of emulsion or finished-formula stability.
- A stale header statement claiming gross-dose fallback when active matter is missing was corrected to match the actual fail-closed implementation.

### 2. Mixed CMC

Implemented ideal Clint mixed-micelle rule:

\`1/CMC_mix = Σ(x_i/CMC_i)\`

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

\`HardnessLoad_mgCaCO3 = hardness_ppm_(mg/L) × washVolume_L\`

\`RequiredCapacity = HardnessLoad × (1 + safetyMarginPct/100)\`

\`AdditionalChelatorDosePct = (capacityDeficit_mg / capacity_mgCaCO3_per_g) / washDose_g × 100\`

- Hardness: ppm as CaCO3; wash volume: L; dose: g; capacity: mg CaCO3-equivalent per g commercial chelator; batch mass: kg where batch scaling is reported.
- This is stoichiometric capacity arithmetic/screening, not a complete conditional Ca/Mg speciation model: pH, competing ligands, ionic strength, precipitation kinetics and ligand protonation can change real free-ion concentrations.
- Category hardness policy is applied before requiring scenario inputs; unknown categories use the explicit unknown policy rather than a guessed category.

## Corrections applied in this branch

1. Added \`HLB_ENGINE\` to \`DISHWASH_AUTOMATIC.applicableEngines\`, aligning it with the existing taxonomy flag and \`requiresHLBAnalysis=true\`.
2. Changed unknown-category metric applicability to false, including the defensive missing-key fallback.
3. Changed unknown-category anionic/cationic permissions to false.
4. Changed unknown-category surfactant preference, pH range and active-surfactant range helpers to return \`null\` instead of borrowing generic defaults. The known production caller of category pH limits already handles null.
5. Corrected stale HLB documentation that contradicted the code's explicit-active-assay requirement.
6. Added regression assertions for all 13 category mappings, pH parity, powder physical-form routing, automatic-dish HLB wiring, unknown metric/ionic defaults and unknown-category CPI suppression.

## Reproducible verification

- New category matrix assertions are part of \`runScientificRouterTestSuite\`, already imported by \`src/utils/test-calculations.ts\` and included in \`bun run test:all\`.
- Unknown-category CPI assertions are added to \`runCleaningPerformanceTestSuite\`, also included in the same test runner.
- Existing HLB, viscosity, cleaning-performance and chelator suites remain in the full regression harness.
- Required CI commands: \`bun run lint\`, \`bun run test:all\`, \`bun run build\`, and repository Release Quality Gates workflow.
- **Execution status at report authoring:** source changes and regression assertions are prepared in the PR branch; no test pass is claimed until GitHub Actions completes against the resulting commit.

## Explicitly unresolved / not promoted

1. Laundry-liquid viscosity target conflict: taxonomy text 600–1200 cP vs profile target 500–1500 cP.
2. Manual-dish viscosity target conflict: taxonomy text 1500–2500 cP vs profile target 1200–3000 cP.
3. CMC and foam have taxonomy metric flags but no distinct ScientificEngineId; their separate utility paths remain labeled as utilities, not profile-routed engines.
4. HLB/CPI/viscosity/CMC remain model/screening outputs; no engine is promoted to LAB_VALIDATED by this source audit.
5. Static import/call-site analysis cannot prove all dynamic runtime behavior. Full deployment telemetry and matched finished-formula laboratory observations remain outside this audit.

**Disposition:** Category-registry corrections and fail-closed regression coverage prepared. Two conflicting viscosity target statements remain OPEN pending product-specification governance. Phase 4B remains OPEN; Phase 5 remains LOCKED.
