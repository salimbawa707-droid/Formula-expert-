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
