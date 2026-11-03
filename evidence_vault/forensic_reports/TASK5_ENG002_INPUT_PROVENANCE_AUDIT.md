# Task 5 — ENG-002 surfactant identity and input-provenance audit

Audit date: 2026-10-22  
Actual starting `main` SHA: `fc0cf2c4412f532c4c3a4c1b4c10cd382f540d94`  
Scope: application-facing CMC inputs, identity mapping, active-matter handling, and mass-to-mole conversion.

## Decision

The canonical library contains **162 surfactant records**:

| Eligibility | Records | Rule |
|---|---:|---|
| Fully supported inputs | 0 | Requires exact supported identity, applicable source-backed pure CMC and molecular weight, valid formula dose, and an active-matter assay/CoA evidence ID. No catalog record links a lot-specific assay/CoA. |
| Partially supported | 8 | Exact canonical SLS/SDS catalog records with CAS 151-21-3 and an applicable pure-component reference, but catalog active matter is not lot-assay evidence. Predictions are permitted with explicit partial-provenance status. |
| Insufficient/blocked | 154 | No applicable traceable pure-component CMC/MW pair, or chemical identity/species is broad or ambiguous. A name match or heuristic parameter is insufficient. |

The eight conditional SLS/SDS records are `sls-needles`, `sls-30`, `sls-needles-tech`, `sls-needles-pure`, `sls-needles-sol`, `sls-30-tech`, `sls-30-pure`, and `sls-30-sol`. They remain partial because catalog active-matter percentages are not a lot-specific CoA or analytical assay. Full/partial input provenance describes input metadata only; the calculator does not fetch or verify external assay/CoA content, and the gate does not imply formula validation.

The machine-readable register lists all 162 records, their catalog identity, CAS/INCI, identity type, active-matter default and status, legacy lookup values and classification, source record/citation/DOI/license/conditions where applicable, unit transformations, eligibility, and decision. The JSON report gives the category counts and rules. The generator checks both committed artifacts against the current catalog and source metadata.

## Code trace and changes

The UI selector passes the selected catalog object to `AIFormulator`. Selection previously copied a display name and active-matter number but dropped the canonical ID; it also substituted 100% when active matter was absent. The selected canonical ID and identity metadata are now preserved. Catalog active defaults are explicitly tagged `CATALOG_DEFAULT`; a user edit is `USER_ENTERED`; unknown stays missing; explicit zero remains zero.

`calculateMixedCMC` previously matched substrings such as LABSA, SLES, CAPB, AOS, APG, alcohol ethoxylate, benzalkonium, polysorbate, and amine oxide to embedded CMC/MW constants. It also called the general active-matter default resolver, filtered unsupported entries, used `Math.max(1, MW)`, and fell back to MW 320 for ppm conversion. These could silently assign unrelated or unsupported component inputs. Those legacy name mappings remain tagged `HEURISTIC_SCREENING` for compatibility/descriptive comparisons, but the app-facing Clint calculation no longer consumes them.

The app-facing calculation now:
- Accepts an exact supported canonical ID, or CAS plus `SINGLE_SUBSTANCE` identity. It rejects conflicting CAS values and broad name-only identity.
- Requires explicit numeric as-supplied formula dose and active matter for every surfactant. It does not invoke `getDefaultActiveMatter`; missing inputs and explicit zero yield different reasons.
- Rejects the whole calculation if any positive-dose surfactant lacks a matching source-backed pure CMC/MW reference. It does not silently omit an unsupported component.
- Converts raw material mass fraction × active-matter fraction to active mass, divides by the matched species molecular weight, and normalizes the resulting moles. Duplicate exact species and aliases are aggregated before mole-fraction calculation. Clint receives molar fractions, never mass fractions.
- Accepts CMC values only in M or mM in the equation helper, converts M to mM, rejects non-finite/non-positive values and mole-fraction sums outside the documented 0.00101 tolerance.
- Returns an explicit `FULLY_SUPPORTED`, `PARTIALLY_SUPPORTED`, or `INSUFFICIENT_INPUTS` eligibility status and reasons. An unavailable result has no numeric prediction. Supported results remain theoretical Clint MODEL_PREDICTION outputs.

The UI now displays unavailable reasons and the input-provenance status alongside available predictions. No ingredient prices or unrelated engine implementations were changed.

## Source and default audit

The applicable canonical pure-component CMC reference is PSDI/NIST compound 1: sodium dodecyl 1 sulfate, `0.0082 mol/L` at 25 °C, surface-tension linear-plot method, material/method quality A/A, evaluation 1, NIST reference 66007, Elworthy and Mysels (1966), DOI [10.1016/0095-8522(66)90017-1](https://doi.org/10.1016/0095-8522(66)90017-1). The PSDI record is CC BY 4.0. The CMC equation input is converted from 0.0082 M to 8.2 mM. The archived PSDI compound table gives 288.3 g/mol and a separate lookup value 288.38; its method field says “LLM initial name and weight.” The calculation records this provenance caveat. Its mg/L conversion is mM × g/mol, equivalent to mg/L under the dilute aqueous approximation.

The archived pure C12 dimethyldodecylamine oxide reference is 0.0021 M at 27 °C, turbidity/light-scattering plot, quality B/B, evaluation 3, NIST reference 62005, Herrmann (1962), DOI [10.1021/j100808a025](https://doi.org/10.1021/j100808a025), CC BY 4.0. It applies only to pure C12 DDAO at the recorded conditions. The app allows it only when a supplied ingredient has CAS 1643-20-5 and `SINGLE_SUBSTANCE` identity. The catalog label “Lauryl Amine Oxide 30%” does not establish homolog distribution, protonation state, or exact match, so that catalog entry and its grade variants are blocked from inheriting this reference.

The legacy code includes these name-based CMC/MW mappings. Unless identified as a source record above, they are heuristic screening constants with no traceable measurement conditions or supporting citation:

| Legacy mapping | CMC (mM) | MW (g/mol) | Disposition |
|---|---:|---:|---|
| LABSA | 1.2 | 320 | HEURISTIC_SCREENING; blocked |
| SLES | 0.3 | 380 | HEURISTIC_SCREENING; blocked |
| SLS/SDS | 8.2 | 288.3 | Source-backed pure SDS input; admitted only through exact identity gate |
| AOS | 0.6 | 304 | HEURISTIC_SCREENING; blocked |
| CAPB | 0.09 | 342 | HEURISTIC_SCREENING; blocked |
| Alcohol ethoxylate LAE-9 | 0.05 | 580 | HEURISTIC_SCREENING; blocked |
| Coco glucoside/APG | 0.04 | 420 | HEURISTIC_SCREENING; blocked |
| Lauryl glucoside | 0.03 | 450 | HEURISTIC_SCREENING; blocked |
| Esterquat | 0.01 | 650 | HEURISTIC_SCREENING; blocked |
| BKC | 4.5 | 354 | HEURISTIC_SCREENING; blocked |
| Cocamide DEA | 0.08 | 287 | HEURISTIC_SCREENING; blocked |
| Polysorbate 20 | 0.06 | 1228 | HEURISTIC_SCREENING; blocked |
| Polysorbate 80 | 0.05 | 1310 | HEURISTIC_SCREENING; blocked |
| Span 80 | 0.03 | 428 | HEURISTIC_SCREENING; blocked |
| Cocamidopropylamine oxide | 0.20 | 230 | Unsourced legacy heuristic; blocked |
| Generic “amine oxide” alias | 2.1 | 229.4 | Pure DDAO record exists, but generic alias is not an applicable identity; blocked |

This distinction is preserved in `getIngredientCmcData` through `dataProvenance`. That legacy function remains available for compatibility and reference comparisons; it is not the app-facing prediction resolver. Catalog active-matter `activeDefault` values remain catalog defaults, not measured composition values. No active matter, CMC, or molecular weight is marked MEASURED for the user's commercial lot or finished formula.

## Conversion and regression coverage

The regression suite uses independent hand calculations; its `TEST_FIXTURE_ONLY` source metadata is synthetic control input and is not an empirical observation or evidence record. The calculator checks evidence-ID and source-location presence, not source contents; a reviewer must verify the linked assay/CoA:
- Pure SLS reference: 0.0082 M = 8.2 mM and 8.2 × 288.3 = 2364.06 mg/L.
- A 10% raw-material dose at 30% active matter gives 3% active surfactant mass; the gate checks for linked source ID/location metadata, while the test fixture does not assert or provide a real CoA.
- Equal 1 g active masses of SDS and exact single-substance DDAO use (n=m/MW), then (x_i=n_i/sum n), before applying the Clint equation with 8.2 and 2.1 mM.
- Mixed M/mM inputs, fraction sums inside/outside tolerance, missing and explicit-zero inputs, missing CMC/MW identity, invalid/non-positive values, duplicate exact aliases, unsupported mixture components, and water-only/no-supported-surfactant formulas are covered.

## Benchmark scope and readiness

Task 4's 979-row P2SURF benchmark still verifies equation behavior using measured same-system pure endpoints. It does not validate app catalog defaults, commercial product mapping, the active-matter conversion chain for a lot, formula matrix conditions, or finished detergent formulations. Its 42-point descriptive comparison and grouped-curve results remain unchanged and are not validation accuracy.

**ENG-002 remains MODEL_PREDICTION. Phase 4B remains OPEN; Phase 5 remains LOCKED.** No empirical calibration, lab validation, confidence intervals, accuracy metrics, or formula validation evidence is added by this audit.
