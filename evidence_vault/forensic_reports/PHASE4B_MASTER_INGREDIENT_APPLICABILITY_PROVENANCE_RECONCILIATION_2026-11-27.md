# Phase 4B — Master Ingredient, Identity Provenance and Dataset Ledger Reconciliation

**Audit date:** 2026-11-27  
**Base:** `main`  
**Working branch:** `audit/phase4b-master-ingredient-applicability-provenance-2026-11-27`  
**Review route:** owner-authorized AI source review; no human review or approval is claimed.  
**Disposition:** Phase 4B OPEN; Phase 5 LOCKED.

## 1. Canonical master ingredient catalog

The authoritative source is `src/data/universalIngredientLibrary.ts` (`UNIVERSAL_INGREDIENTS`).

- **430 ingredient records**, 430 unique IDs, zero duplicate IDs.
- **15 raw-material catalog classes**. These are not the same thing as the 13 finished-product categories.
- **423 records have a CAS string; 7 have null CAS.** A CAS string does not prove the exact commercial grade, chain-length distribution, EO distribution, assay, purity or supplier identity.
- Structured `provenance` metadata exists on **3/430** records; only **1/430** has a URL in the provenance object.
- No catalog ingredient has populated `phMin` or `phMax`.
- No exact grade-specific supplier TDS/SDS/CoA/lot assay is attached to the 430 master records.
- `identityType` and `casStatus` are absent on 423/430 records; manufacturer and productName are absent on 427/430 records.
- All 430 records lack explicit `activeMatter`, `surfactantActiveMatterPct`, `purityPct` and `solidsPct` assay fields, despite all 430 having an `activeDefault` value. The default is not an assay.
- All 430 records lack ingredient pH bounds. HLB is present for surfactant classes but is absent for many non-surfactant classes; those missing values are not treated as universal blockers.
- The catalog's `activeDefault`, HLB and descriptions are not automatically supplier assay values or measured grade properties.

### Catalog class distribution

| Catalog class | Records |
|---|---:|
| Anionic Surfactant | 53 |
| Nonionic Surfactant | 61 |
| Amphoteric Surfactant | 28 |
| Cationic Surfactant | 20 |
| Additive & Performance | 31 |
| Neutralizer / Base | 29 |
| Alkaline Builder | 29 |
| Builder / Chelator | 40 |
| Enzymes | 20 |
| Polymer & Thickener | 36 |
| Solvent & Hydrotrope | 39 |
| Preservative & Biocide | 21 |
| Optical Brightener & Dye | 17 |
| Bleach & Oxidizer | 2 |
| Acid & Descaler | 4 |
| **Total** | **430** |

## 2. 430 × 13 preliminary category applicability screen

`src/data/masterIngredientApplicabilityScreen.ts` generates **5,590** ingredient/category rows from the live master catalog and canonical 13-category taxonomy.

Each row retains:
- canonical ingredient ID/name, CAS, INCI and identity type;
- commercial active default (not treated as assay), any active-matter field, pH bounds, manufacturer/product identity and catalog provenance fields;
- product category, preliminary chemistry disposition, rationale and unresolved evidence list;
- `finalApplicability: NOT_APPROVED`.

The screen flags obvious chemistry risks and category-dependent evidence requirements. It is a preliminary AI chemistry-risk triage only; it does not approve a commercial ingredient grade, dose, safety or finished formula. No use range is invented.

Regression: `scripts/test-master-ingredient-applicability-screen.ts`, wired into `test:all`.

## 3. Identity SSOT crosswalk — newly reconciled

The repository's separate `src/domain/ingredients/ingredientIdentitySSOT.ts` contains **7 identity records**. Exact CAS **and** exact INCI matching against the master catalog yields:

| SSOT identity | Exact master catalog records |
|---|---:|
| LABSA | 5 |
| Sodium hydroxide | 8 |
| Citric acid | 4 |
| Sodium bicarbonate | 4 |
| Sodium sesquicarbonate | 4 |
| PVNO | 4 |
| Potassium xylene sulfonate | 4 |
| **Total exact CAS+INCI crosswalk** | **33** |

Thus **33/430** master records have an exact CAS+INCI crosswalk to the current identity SSOT, while **397/430** do not. The seven SSOT identities are not seven supplier-grade dossiers: several catalog variants share one chemical identity while differing in concentration, form or commercial grade.

Added:
- `src/data/masterIngredientIdentityCoverage.ts`
- `scripts/test-master-ingredient-identity-coverage.ts` (also locks the missing identity, supplier assay and provenance field counts)

The crosswalk accepts only an exact CAS+INCI match to the same SSOT identity. A CAS-only or INCI-only match is not silently promoted. It explicitly labels every mapped row `NOT_ESTABLISHED_BY_IDENTITY_SSOT` for grade-specific evidence. The SSOT's generic source labels are retained as identity-level source metadata, not treated as attached source documents or supplier CoAs.

## 4. Ingredient provenance disposition

Current counts:
- Catalog provenance objects: **3/430**.
- Catalog provenance URLs: **1/430**.
- Explicit identity type missing: **423/430**; CAS status missing: **423/430**.
- Manufacturer and product name missing: **427/430** each.
- Supplier active/purity/solids assay fields missing: **430/430**; explicit pH bounds missing: **430/430**.
- All 430 have an `activeDefault` field, but **0/430** have an explicit supplier-grade assay field. The active default is not a supplier CoA.
- Exact identity SSOT CAS+INCI matches: **33/430**.
- No exact identity SSOT match: **397/430**.
- Exact supplier-grade TDS/SDS/CoA/lot assay attached to master records: **0/430**.

This is not repaired by adding generic PubChem links. PubChem or an identity registry can support a discrete chemical identity lookup; it cannot establish commercial UVCB composition, surfactant EO distribution, active matter, purity, water content, impurity profile or the supplier's actual grade. Proprietary blends such as Aristo 9 remain unresolved until composition/grade documents are available.

## 5. Evidence registry and source-register reconciliation

The canonical `INITIAL_VAULT_STATE.evidence` now contains **25 evidence records**:
- Existing EVD-001, EVD-002 and EVD-004–EVD-022 (EVD-003 remains absent/quarantined).
- Newly registered EVD-023–EVD-026 for RepOD CMC, PSDI/NIST CMC, P2SURF mixed CMC and IUPAC pH standards.

Rights-state counts after the four additions:

| Rights status | Records |
|---|---:|
| PERMITTED_FOR_COMMERCIAL_REUSE | 11 |
| REVIEW_PENDING | 10 |
| RESTRICTED | 2 |
| UNKNOWN | 2 |
| **Total** | **25** |

Download-state counts:
- DOWNLOADED: **8**
- NOT_DOWNLOADED: **15**
- BLOCKED: **2**

The source register remains **28 data rows**. The new evidence records point to source-register rows already present:
- EVD-023 ↔ `SRC-REPOD-CMC-IMF2OE`
- EVD-024 ↔ `SRC-PSDI-CMC`
- EVD-025 ↔ `SRC-P2SURF-MIXED-CMC`
- EVD-026 ↔ `SRC-IUPAC-2002-PH-STANDARDS`

Derived PSDI slices (SLS, DDAO and detergent-homolog screen) remain subordinate to DS-007; they are not added as independent physical datasets or counted again.

### Rights boundaries retained

- SurfPro EVD-001/EVD-002 remains RESTRICTED under CC BY-NC-SA 4.0; no commercial ingestion absent separate permission.
- EVD-006/007/012 and new EVD-023/024/025/026 have recorded open reuse terms within their actual scope and attribution obligations.
- EVD-013 remains not archived / no repository hash.
- EVD-014–022 retain their existing per-source pending, restricted, unknown or non-archived boundaries. Public access is not treated as commercial reuse permission.
- EVD-004 remains quarantined due to unresolved citation identity.

## 6. Dataset ledger — expanded from four to eight records

The canonical dataset inventory now contains **8 records**, all explicitly `NUMERICALLY_INSPECTED` but **DEFICIENT** for finished-formula/model validation readiness.

| Dataset | Rows | Columns | Evidence | What the count means | Readiness |
|---|---:|---:|---|---|---|
| DS-001 SurfPro | 1,624 | 31 | EVD-002 | Pure/component surfactant CSV records; not matched formula observations | DEFICIENT |
| DS-002 Zenodo 18961871 | 11,626 | heterogeneous | EVD-006 | Numeric-bearing rows across 11 workbook sheets; not independent physical observations | DEFICIENT |
| DS-004 PhDat | 143 | heterogeneous | EVD-007 | Chemical profile records; not formula-validation rows | DEFICIENT |
| DS-005 RepOD MKCDUM | 23 | 23 | EVD-012 | 10 PGA_LAE + 13 PLL_RH concentration-level rows; not replicate count | DEFICIENT |
| DS-006 RepOD cationic CMC | 202 | 15 | EVD-023 | Three source concentration-series files; not independent replicate count | DEFICIENT |
| DS-007 PSDI/NIST CMC | 4,990 | 18 | EVD-024 | Historical measurement rows; companion 719-row compound table is a separate identity lookup | DEFICIENT |
| DS-008 P2SURF mixed CMC | 979 | 5 | EVD-025 | Literature-compiled binary mixture composition points; not uniform independent experiments | DEFICIENT |
| DS-009 IUPAC pH standards | 20 | 11 | EVD-026 | Selected buffer reference values; repository mapping columns are derived | DEFICIENT |

### Dataset-specific reconciliation

**DS-006 — RepOD CMC:** 202 normalized measurement rows retain original source file, source line and source index. The source labels conductivity as mS; no cell constant is supplied, so specific conductivity cannot be calculated. Temperature, solvent/matrix, instrument, replicates and uncertainty are absent. Do not infer a validated CMC breakpoint.

**DS-007 — PSDI/NIST:** 4,990 measurement rows and a separate 719-row compound table. Preserve original heterogeneous unit codes M/D/W/P/N/S/R; R means varied and is not convertible. Three reference codes remain unresolved (45005 ×2, 69016 ×1); compound 2 has a name/SMILES identity conflict; 115 compound identity entries are marked unknown. Full archive remains quarantined pending row-level curation.

**DS-008 — P2SURF:** 979 binary mixture CMC records, five columns. A new source-lineage-preserving grouping audit assigns **522 unordered SMILES pair groups** and **959 canonical pair/composition groups**. There are **20 repeated pair/composition groups (20 extra rows)**; all source rows remain preserved, not deduplicated. 440 pair groups have one row and 82 have multiple rows. All four source fraction sums are within 0.001 rounding tolerance. Source-study, temperature and method grouping are not fully present in the CSV, so the 522 pairs are not 522 independent experimental studies and leakage-safe train/test splitting is still blocked. This is component-level mixed-CMC reference evidence only, not finished detergent formula validation.

**DS-009 — IUPAC pH standards:** 20 selected values, 11 columns. Repository `engine_recipe` and `mapping_note` fields are derived mappings, not source-reported observations. Benchmark scope is reference buffers at documented temperatures, not finished detergent formulas or concentrated builder matrices.

Existing DS-001–DS-005 row semantics remain bounded by `PHASE4B_DATASET_ROW_COUNT_SEMANTICS_2026-11-25.md`. DS-002's four workbook hashes and sheet-level parser lineage remain in the Zenodo manifests/round-6 audit; its 11,626 is a row inventory, not a physical sample count.

Added regression: `scripts/test-phase4b-dataset-ledger-reconciliation.ts`. It checks 25 evidence records, eight dataset records, unique IDs, every dataset-to-evidence link, source-register rows and exact parser-manifest row counts.

## 7. Remaining blockers — not papered over

1. **397 master ingredients lack exact CAS+INCI crosswalk to the current seven-entry identity SSOT.**
2. **427 master ingredients lack structured provenance metadata; only one catalog provenance URL exists.**
3. **0/430 master records have attached exact commercial-grade TDS/SDS/CoA/lot assay evidence.**
4. EVD-013 is not archived/hash-pinned; EVD-014–022 retain source-specific archival or rights gaps.
5. DS-006 lacks temperature, solvent/matrix, cell constant, instrument, replicate and uncertainty metadata.
6. DS-007 retains three unresolved NIST reference codes and a compound identity conflict.
7. DS-008 requires study/pair/condition grouping before any split or uncertainty analysis.
8. DS-005 retains PLL_RH concentration-unit conflict and Vmax volume-versus-height ambiguity.
9. DS-002 has no matched full formula inputs/predictions; worksheet row totals are not physical replicate counts.
10. No eligible matched finished-formula prediction/observation pairs exist for the blocked target engines; BLK-002 remains active.
11. ENG-005 remains unavailable at the audited repository head; no executable predictor is established.
12. Historical 59/64/97 engine counts and 27,982 aggregate physical-observation claim are not reproduced as verified counts.

## 8. Closure decision

| Gate | Disposition |
|---|---|
| 430 ingredient source scan and unique IDs | PASS — source scan |
| 430 × 13 applicability screen | IMPLEMENTED — preliminary triage only |
| Exact identity SSOT crosswalk | 33 mapped; 397 unresolved |
| Grade-specific supplier provenance | OPEN — 0/430 complete |
| Evidence registry ↔ source register | 25 records; 28 source rows; source-specific gaps remain |
| Dataset inventory | 8 records, all linked to evidence |
| Numerical inspection | 8/8 records have numeric/source-structure inspection status |
| Model-validation readiness | 0/8 READY; all 8 DEFICIENT |
| Matched finished-formula validation pairs | 0 eligible |
| Phase 4B | **OPEN** |
| Phase 5 | **LOCKED** |

**Decision:** Do not close Phase 4B and do not unlock Phase 5. The master catalog screen, identity crosswalk and expanded dataset/evidence ledger are now reproducible in code and tests, but supplier-grade provenance and finished-formula validation evidence are still missing. AI source review cannot authenticate missing supplier documents or manufacture experimental observations.

## 9. Reproduction

- Master ingredient source: `src/data/universalIngredientLibrary.ts`
- Identity SSOT: `src/domain/ingredients/ingredientIdentitySSOT.ts`
- Identity coverage: `src/data/masterIngredientIdentityCoverage.ts`
- Applicability matrix: `src/data/masterIngredientApplicabilityScreen.ts`
- Evidence and dataset registry: `src/domain/vault/initialData.ts`
- Source register: `evidence_vault/datasets/source-register.csv`
- Tests:
  - `bun run scripts/test-master-ingredient-applicability-screen.ts`
  - `bun run scripts/test-master-ingredient-identity-coverage.ts`
  - `bun run scripts/test-phase4b-dataset-ledger-reconciliation.ts`
  - `bun run test:all`

## 10. Functional-class and identity-conflict safeguards — 2026-11-27

A focused audit overlay was added for three catalog records whose broad class/function labels can misroute chemistry logic:

| Ingredient | Finding | Control |
|---|---|---|
| Sodium lignosulfonate (lignosulfonate-na) | Anionic lignin-based polymeric dispersant/binder; surface activity does not make performance interchangeable with conventional detergent surfactants. | Keep existing broad category for compatibility, require a functional subclass, and block unsupported HLB/active-matter/cleaning inferences. |
| Lauramine oxide (lauryl-amine-oxide) | Amine-oxide surfactant; commercial taxonomy often places the family with amphoteric surfactants, so the current Nonionic label needs cross-engine review. | Do not silently change canonical category; flag ionic-class routing for deliberate migration and tests. |
| Tallow amine record (tallow-amine-oxide) | Display name/function claim an amine oxide, while INCI is PEG-2 Tallow Amine and catalog category is Polymer & Thickener. | Identity conflict remains blocked; no amine-oxide or polymer promotion pending exact supplier identity. |

The overlay validates that each audit row still matches the live catalog identity/category and always remains NOT_APPROVED. It does not change formula recommendations or canonical categories. A category migration must include a complete downstream consumer audit, not a local string edit.

Source scope:
- PubChem / EPA functional-use data identifies lauramine oxide (CAS 1643-20-5) as a surfactant: https://pubchem.ncbi.nlm.nih.gov/compound/15433
- New Zealand EPA CCID corroborates lauramine oxide substance identity and CAS: https://www.epa.govt.nz/database-search/chemical-classification-and-information-database-ccid/view/4870BB95-03BD-402C-AF97-A674F93F773A/
- The 1996 EU ingredient inventory lists Lauramine Oxide as surfactant/viscosity-controlling/cleansing/foam-boosting: https://www.legislation.gov.uk/eudn/1996/335/pdfs/eudn_19960335_2006-02-09_en.pdf
- Public industrial sodium lignosulfonate references describe dispersant, binder, water-reducer and high-molecular-weight lignin-based functions; generic TDS values are not assigned to this catalog record: https://www.lignincorp.com/products/sodium-lignosulfonate/

Added:
- src/data/ingredientFunctionalClassAudit.ts
- scripts/test-ingredient-functional-class-audit.ts
- Test wired into test:all.

The audit adds zero supplier-grade verifications and zero applicability approvals. Phase 4B remains OPEN; Phase 5 remains LOCKED.

## 11. Source-backed identity reconciliation and functional routing migration — 2026-11-27

### Source-by-source identity findings (bounded scope)

| Catalog family | External identity evidence | Reconciliation outcome | What remains unproven |
|---|---|---|---|
| Sodium Lauryl Sulfate, CAS 151-21-3 | PubChem CID 3423265 identifies sodium dodecyl sulfate and lists CAS 151-21-3; ECHA lists sodium dodecyl sulphate with the same CAS and formula. | Chemical-family identity is source-backed; route as ANIONIC / primary anionic surfactant. | Needle vs paste/solution grade, assay, active matter, impurities, supplier and lot CoA. |
| Lauryl Glucoside, catalog CAS 110615-47-9 | PubChem CID 10893439 lists Lauryl Glucoside, but also lists 27836-64-2 and 110615-47-9 among CAS identifiers. | Do not use CAS alone as a unique exact-grade crosswalk; retain unresolved/ambiguous identity pending an authoritative registry or manufacturer document tying the precise CAS to the intended substance/grade. | Catalog grade and exact product composition; supplier TDS/CoA. |
| Lauramine Oxide, CAS 1643-20-5 | PubChem and NZ EPA CCID support lauramine oxide family identity; EU ingredient inventory lists Lauramine Oxide among surfactant/cleansing/foam functions. | Migrate functional routing from generic NONIONIC to AMPHOTERIC / amine-oxide route. | Commercial chain distribution, active, pH-dependent speciation, grade and lot evidence. |
| Sodium Lignosulfonate | Public industrial literature describes lignosulfonate dispersant/binder uses. | Retain ANIONIC charge but distinguish POLYMERIC_DISPERSANT from conventional primary detergent surfactant. | Exact grade, molecular-weight distribution, solids, sulfonate content, detergent performance. |
| PEG-2 Tallow Amine catalog record | Internal display name/function conflict with INCI PEG-2 Tallow Amine and CAS 61791-26-2. | Keep BLOCKED; no inferred functional class. | Exact manufacturer identity, ethoxylation distribution and product composition. |

Sources:
- PubChem Sodium Lauryl Sulfate: https://pubchem.ncbi.nlm.nih.gov/compound/3423265
- ECHA Sodium dodecyl sulphate: https://echa.europa.eu/substance-information/-/substanceinfo/100.005.263
- PubChem Lauryl Glucoside: https://pubchem.ncbi.nlm.nih.gov/compound/10893439
- PubChem Lauramine Oxide: https://pubchem.ncbi.nlm.nih.gov/compound/15433
- NZ EPA CCID Lauramine Oxide: https://www.epa.govt.nz/database-search/chemical-classification-and-information-database-ccid/view/4870BB95-03BD-402C-AF97-A674F93F773A/
- EU Commission ingredient inventory: https://www.legislation.gov.uk/eudn/1996/335/pdfs/eudn_19960335_2006-02-09_en.pdf
- Industrial sodium lignosulfonate reference: https://www.lignincorp.com/products/sodium-lignosulfonate/

### Category-dependent routing migration

Added `src/data/ingredientFunctionalRouting.ts` as an explicit, fail-closed functional routing overlay:
- SLS catalog IDs route ANIONIC; pure CMC reference allowed only under the separately enforced identity gate. HLB disabled.
- Lauramine oxide IDs route AMPHOTERIC; HLB and pure-component CMC are disabled for commercial grade records.
- Sodium lignosulfonate routes as ANIONIC charge + POLYMERIC_DISPERSANT role; it is excluded from detergent surfactant active accounting, HLB and pure CMC.
- PEG-2 Tallow Amine conflict stays BLOCKED for all model routes.

Added `scripts/test-functional-routing-migration.ts`, wired into `test:all`. This checks every mapped catalog ID against current category/INCI, rejects duplicate IDs, prevents property-model enablement for blocked records and prevents lignosulfonate being counted as primary detergent active.

### Engine migration boundary

The overlay is a safe first migration adapter, not proof that every legacy category consumer has been migrated. The legacy category remains unchanged for compatibility while the exact consumers in HLB, active-matter, CMC, compatibility and formula-intelligence engines are audited. Do not globally rewrite category strings until each consumer uses the routing adapter and regression coverage proves no behavior regression.

The 397-record identity crosswalk gap is not closed by these five bounded findings. Supplier-grade evidence remains absent; all applicability remains NOT_APPROVED. Phase 4B OPEN; Phase 5 LOCKED.


### Runtime consumer integration — 2026-11-27

The functional routing adapter is now consumed by three existing engines, rather than remaining a standalone audit-only registry:

1. `ActiveMatterEngine`
   - SLS catalog IDs resolve as anionic.
   - Lauramine oxide catalog IDs resolve as amphoteric.
   - Sodium lignosulfonate is excluded from the surfactant-active breakdown while remaining a separately classified anionic polymeric dispersant.
   - The PEG-2 Tallow Amine identity-conflict record returns missing active matter, no surfactant class, and an explicit conflict.
2. `HLBEngine`
   - Routes without a defensible HLB basis return `hlb: null` (amine oxide, lignosulfonate and blocked identity rows). SLS/SLES use Davies-scale catalog screening values and APGs use catalog screening values only; these are marked `estimated`, not supplier-grade authoritative.
3. `resolveEng002PureComponent`
   - Pure-component CMC transfer is denied for commercial amine oxide, lignosulfonate and blocked tallow-amine identity; the curated SLS pure-component reference remains available subject to the existing exact CAS / blend checks.

Added `scripts/test-functional-routing-engine-integration.ts` and wired it into `test:all`. It tests the active-matter class, HLB suppression, pure-CMC scope and unresolved-identity block across these engines.

This is a targeted migration for the four audited chemistry cases, not a claim that every one of the 430 catalog records or every legacy category consumer has been migrated. Legacy category fields remain unchanged to avoid broad unreviewed side effects. The remaining consumers (including general compatibility matrices, formula-intelligence applicability, selectors and other legacy calculators) still require a complete per-call-site migration inventory.

No source evidence in this addendum verifies supplier grade, lot assay, actual active matter, HLB, or formulation performance. The 397 identity crosswalk gaps and 430 supplier-grade evidence gaps remain open.


## 12. Priority identity source tranche and downstream consumer migration — 2026-11-27

### Source-by-source tranche (family identity only; no supplier-grade promotion)

| Priority family / catalog IDs | Public source reconciliation | Functional disposition | Open evidence |
|---|---|---|---|
| SLES 70 / SLES 28 (`sles-70`, `sles-28`) | Health Canada NHPID identifies Sodium Laureth Sulfate and lists CAS 68585-34-2 among accepted registry numbers; PubChem's sodium laureth sulfate entry includes multiple CAS/ethoxylate aliases. | Route as ANIONIC primary surfactant; keep 70% and 28% as distinct commercial grades. | EO distribution, active matter, free oil, 1,4-dioxane, salt, pH, supplier TDS and lot CoA remain unverified. Public source does not establish either catalog grade. |
| CAPB 30 / 45 (`capb-30-uni`, `capb-45`) | CIR's CAPB safety assessment defines the coconut-fatty-acyl betaine family and lists multiple related CAS numbers; PubChem ChEBI depositor record corroborates CAS 61789-40-0. | Route as zwitterionic amphoteric betaine. | 30/45% values remain catalog labels until supplier/lot assay; fatty-acyl distribution, free amidoamine/DMAPA, salt and impurity limits remain grade-specific. |
| Lauramine Oxide (`lauryl-amine-oxide` family) | PubChem identity is supported; Kao OXIDET DM-20 TDS explicitly describes Lauramine Oxide as nonionic/cationic depending on pH and specifies 29–31% active matter for that named Kao grade. | Keep separate `AMINE_OXIDE_SURFACTANT` role and `PH_DEPENDENT_AMINE_OXIDE` charge behaviour. Do not equate it with a classic zwitterionic betaine. | Kao TDS is a comparator only; it does not establish the user's supplier or lot. Do not copy its 29–31% assay. Exact pH/speciation and grade composition remain open. |
| APG 0810 (`apg-0810`) | FDA GSRS/PubChem record for CAS 68515-73-1 identifies caprylyl/capryl oligoglucoside and explicitly labels the substance class as mixture; Health Canada registry lists matching INCI/CAS. | Route as NONIONIC APG; disable unsupported pure-component CMC and treat catalog HLB only as a screening estimate, not grade-verified HLB. | Catalog 50% value and HLB are not supplier assay/property evidence. |
| APG 1214 (`apg-1214`) | PubChem Lauryl Glucoside record aggregates CAS 27836-64-2 and 110615-47-9 among multiple identifiers. | Nonionic functional family is supported by INCI; exact CAS-to-commercial-grade mapping remains ambiguous. | Keep exact identity crosswalk unresolved; no pure C12 glucoside CMC/HLB transfer to commercial APG mixture. |

Public references:
- Health Canada Sodium Laureth Sulfate registry: https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=448&lang=eng&wbdisable=true
- PubChem Sodium Laureth Sulfate: https://pubchem.ncbi.nlm.nih.gov/compound/23665884
- CIR CAPB assessment: https://journals.sagepub.com/doi/full/10.1177/1091581812447202
- PubChem CAPB ChEBI record: https://pubchem.ncbi.nlm.nih.gov/substance/135610782
- Kao OXIDET DM-20 TDS (comparator grade only): https://www.kaochemicals-eu.com/uploads/docs/6/y/k/mja-tds-eng-v2-oxidet-dm-20.pdf?download=1
- FDA GSRS/PubChem APG record: https://pubchem.ncbi.nlm.nih.gov/substance/472402409
- Health Canada Caprylyl/Capryl Glucoside registry: https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=13217&wbdisable=true
- PubChem Lauryl Glucoside: https://pubchem.ncbi.nlm.nih.gov/compound/10893439

### Runtime migration completed for this tranche

- `rawMaterialCategories.ts`: Ionic/amphoteric selector uses the functional route; pH-dependent amine oxide is included in the ionic/amphoteric family and excluded from generic nonionic results. APGs remain nonionic. Legacy category labels are not silently rewritten.
- `CategoryIngredientSelector.tsx`: quick category filtering now consults the same route and prevents the amine-oxide record from appearing as a generic nonionic ingredient.
- `chemicals.ts`: compatibility matrix has a dedicated pH-dependent amine oxide state. Its pair result is `REQUIRES_COMPATIBILITY_TEST`, not an invented unconditional compatible/incompatible result. Unresolved identity yields `INSUFFICIENT_DATA`.
- `compatibilityEngine.ts`: matrix pair decisions are consumed at runtime. Amine oxide + ionic/cationic pairings trigger grade/pH/electrolyte-specific test guidance; unresolved tallow identity blocks compatibility evaluation. Sodium lignosulfonate remains visible to anionic-charge/cationic interaction screening but is excluded from primary anionic surfactant category-policy totals.
- `SmartFormulaAnalyzerPro.tsx`: charge/family labels and HLB fallback are now derived from the functional route. Amine oxide is labelled pH-dependent and catalog HLB fallback is suppressed; SLS/SLES/APG catalog HLB values are allowed only as screening references; unresolved identity is visibly blocked.
- `ingredientFunctionalRouting.ts`: expanded route table now covers SLES 70/28, CAPB 30/45, Lauramine Oxide, APG 0810/1214, SLS, lignosulfonate and the blocked tallow-amine record.

Regression:
- `scripts/test-functional-routing-consumers.ts` covers selector routing, formula-intelligence labels, HLB eligibility, compatibility matrix statuses, pH-dependent amine oxide handling, unresolved identity blocking and polymeric dispersant vs primary-surfactant separation.
- Test is wired into `bun run test:all`.

### Scope and gate status

This is a source-backed identity-family and consumer migration tranche, not closure of the 397-record exact identity gap. The 430 supplier-grade evidence gaps remain; the 5,590 ingredient/category applicability pairs remain NOT_APPROVED. Public reference sources are not substitutes for the user's manufacturer TDS, matching lot CoA or formulation trials.

Phase 4B remains OPEN. Phase 5 remains LOCKED pending complete source reconciliation, remaining call-site migration and actual supplier/lot/applicability evidence.


### HLB regression correction — screening vs supplier-grade evidence

Run #1380 exposed that the first adapter pass suppressed HLB values too broadly, which incorrectly removed SLES Davies-scale and APG catalog screening contributions. Corrected the boundary: SLS/SLES and APG catalog HLB values may be used as screening estimates (`dataSource: estimated`), while amine oxide, lignosulfonate and unresolved tallow remain blocked from HLB transfer. This preserves the HLB calculation method without promoting catalog estimates to supplier-grade evidence. Regression tests now assert both the numeric screening value and the `estimated` provenance.


### Additional identity tranche — Sodium C14-16 Olefin Sulfonate / AOS (2026-11-27)

Catalog IDs `aos-38` and `aos-92` were reconciled against:
- Health Canada screening assessment: CAS 68439-57-6 is a UVCB mixture of C14-16 alkene sulfonates and hydroxyalkane sulfonates, explicitly in the anionic surfactant group. 
- FDA SRS UNII O9W3D3YF5U maps Sodium C14-16 Olefin Sulfonate and CAS 68439-57-6.
- ECHA substance infocard lists the corresponding C14-16 hydroxyalkane/alkene sodium salts.
- Colonial Chemical's named AOS-40 SDS confirms INCI/CAS for that comparator grade, not for the catalog 38% or 92% product lots.

Disposition: AOS is routed as ANIONIC primary surfactant family; 38% liquid and 92% powder remain distinct commercial grades. Catalog activeDefault values remain screening defaults only. HLB 12.0 and pure-component CMC are blocked: the substance is a UVCB distribution and no defensible single-molecule transfer or grade-specific HLB evidence is supplied.

Sources:
- Health Canada UVCB identity and anionic surfactant assessment: https://www.canada.ca/en/environment-climate-change/services/evaluating-existing-substances/screening-assessment-alkyl-sulfatesa-olefin-sulfonate-group-chemical-abstracts-service-registry-numbers-139.html
- FDA SRS UNII: https://precision.fda.gov/uniisearch/srs/unii/O9W3D3YF5U
- ECHA substance infocard: https://echa.europa.eu/es/substance-information/-/substanceinfo/100.158.197
- Colonial Chemical AOS-40 SDS (comparator only): https://colonialchem.me/wp-content/uploads/2020/10/Colonial-AOS-40-SDS-EU-English-1-Nov-2019.pdf

Regression expanded to nine routed identity groups; AOS 38/92 are checked for category/INCI integrity, anionic classification, HLB block and CMC block.


### Additional identity tranche — SAS 60, Cocamide DEA and Cocamide MEA (2026-11-27)

**SAS 60** (`sas-60`, CAS 68037-49-0, INCI Sodium C14-17 Sec-Alkyl Sulfonate): ECHA lists the broader sodium C10-18 alkane sulfonate family; the Korean Cosmetic Ingredient Dictionary lists Sodium C14-17 Alkyl Sec Sulfonate with CAS 68037-49-0 and describes secondary sulfonated C14-17 alkane sodium salts. Route as anionic secondary alkane sulfonate. Catalog 60% active and HLB 13.0 remain unverified; HLB and pure CMC blocked.

**Cocamide DEA** (`cdea-85`, CAS 68603-42-9): Health Canada NHPID confirms Cocamide DEA identity and roles as foam booster/aqueous viscosity increasing agent. It carries specific restrictions related to N-nitrosating systems, nitrosamine and secondary amine content. Route as nonionic alkanolamide/foam booster. Catalog 85% is not supplier assay.

**Cocamide MEA** (`cmea-90`, CAS 68140-00-1): Health Canada NHPID confirms Cocamide MEA and foam-booster/viscosity functions; the Canadian assessment describes the substance as coconut acid monoethanolamide, UVCB C8-18. Route as nonionic alkanolamide. Catalog 90% is not supplier assay.

Public references:
- ECHA SAS identity: https://echa.europa.eu/substance-information/-/substanceinfo/100.061.994
- Korean Cosmetic Ingredient Dictionary SAS entry: https://kcia.or.kr/cid/search/ingd_view.php?no=18412
- Australian IMAP SAS assessment: https://www.industrialchemicals.gov.au/sites/default/files/Secondary%20alkane%20sulfonates%20%28SAS%29_Human%20health%20tier%20II%20assessment.pdf
- Health Canada Cocamide DEA: https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=3341&wbdisable=true
- Australian Cocamide DEA identity: https://www.industrialchemicals.gov.au/sites/default/files/Common%20skin%20sensitisers.pdf
- Health Canada Cocamide MEA: https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=3342
- Canada Alkanolamines and Fatty Alkanolamides assessment: https://www.canada.ca/en/environment-climate-change/services/evaluating-existing-substances/assessment-alkanolamines-fatty-alkanolamides-group.html
- CIR Ethanolamides assessment: https://journals.sagepub.com/doi/abs/10.1177/1091581815586599

These sources establish family identity and general functional role only. They do not verify catalog 60/85/90% assay, free amine, nitrosamine, moisture, salt, or lot release. Supplier TDS and CoA remain mandatory for grade-specific approval.


### Additional identity tranche — Sodium Lauroyl Sarcosinate 30% (2026-11-27)

Catalog `sarcosinate-30` lists INCI Sodium Lauroyl Sarcosinate and CAS 137-16-6. PubChem CID 23668817 and ChemIDplus-deposited substance record 134973572 corroborate sodium N-lauroylsarcosinate identity and the CAS mapping. The compound is routed as a primary anionic surfactant family for normal neutral/alkaline detergent conditions, with an explicit `PH_DEPENDENT_ANIONIC` charge-behaviour tag; it is not treated as invariantly anionic at every pH.

Catalog 30% is not supplier-verified. HLB and pure CMC are not transferred. The CIR source notes nitrosating-system cautions in cosmetic-use context; home-care regulatory applicability requires separate review.

Sources:
- PubChem Sodium Lauroyl Sarcosinate: https://pubchem.ncbi.nlm.nih.gov/compound/23668817
- PubChem/ChemIDplus substance record: https://pubchem.ncbi.nlm.nih.gov/substance/134973572
- CIR safety assessment summarized in PubChem: https://pubchem.ncbi.nlm.nih.gov/compound/23668817

