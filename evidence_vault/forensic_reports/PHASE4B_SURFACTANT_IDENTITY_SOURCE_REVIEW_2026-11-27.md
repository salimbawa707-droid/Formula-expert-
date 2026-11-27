# Phase 4B — Surfactant identity source review (2026-11-27)

## Scope and decision rule

This is the first source-backed tranche of the 397-row identity backlog. It reviews surfactant-family candidate groups in `evidence_vault/datasets/master_ingredient_identity_candidate_groups_2026-11-27.csv`. It does **not** certify commercial grade, active matter, purity, manufacturer, product identity, safety, regulatory status, or formulation suitability.

A PubChem record can corroborate a chemical-name/CAS candidate and expose synonym/structure issues. It is not, by itself, an authoritative INCI dictionary entry or a supplier-grade TDS/SDS/CoA. Therefore no record below is promoted into `IngredientIdentitySSOT` as VERIFIED, and no ingredient row is given grade approval. The existing `NOT_ESTABLISHED_BY_IDENTITY_SSOT` and `NOT_APPROVED` controls remain unchanged.

## Reviewed candidate groups

| Group | Catalog identity | CAS candidate | Catalog IDs | Source observation | Disposition |
|---|---|---|---|---|---|
| MICG-014 | Cetrimonium Chloride | 112-02-7 | ctac-29 (+ grade variants) | PubChem CID 8154 identifies hexadecyltrimethylammonium chloride and lists cetrimonium chloride as a synonym; formula C19H42ClN. | Source-supported chemical identity candidate. Confirm INCI nomenclature and grade/solution composition before SSOT merge. |
| MICG-025 | Sodium Lauroyl Sarcosinate | 137-16-6 | sarcosinate-30 (+ grade variants) | PubChem CID 23668817 lists sodium lauroylsarcosinate, N-lauroylsarcosine sodium salt and CAS 137-16-6. | Source-supported chemical identity candidate. Supplier active matter and commercial grade remain unverified. |
| MICG-029 | Sodium Lauryl Sulfate | 151-21-3 | sls-needles, sls-30 (+ grade variants) | PubChem CID 3423265 identifies sodium dodecyl sulfate/sodium lauryl sulfate; CAS 151-21-3 is listed. PubChem also shows a separate CAS entry 8012-56-4, so retain source-specific CAS context. | Source-supported identity candidate. Do not merge physical forms or concentrations as separate chemical identities; preserve grade records. |
| MICG-031 | Lauramine Oxide | 1643-20-5 | lauryl-amine-oxide (+ grade variants) | PubChem CID 15433 identifies dodecyldimethylamine oxide and lists Lauramine oxide and CAS 1643-20-5 as synonyms/identifiers. | Source-supported identity candidate. Keep amine-oxide classification distinct from a generic nonionic label pending taxonomy review. |
| MICG-064 | Cocamidopropyl Betaine | 61789-40-0 | capb-30-uni, capb-45 (+ grade variants) | PubChem ChEBI-deposited substance record lists CAS 61789-40-0 and cocamidopropyl betaine/CAPB synonyms. PubChem vendor substance record links the CAS to a lauramidopropylbetaine component record. | Source-supported candidate with UVCB/composition caveat. Do not infer exact fatty-chain distribution or active matter from CAS alone. |
| MICG-083 | Sodium C14-16 Olefin Sulfonate | 68439-57-6 | aos-38, aos-92 (+ grade variants) | PubChem ChemIDplus substance record lists Sodium C14-16 olefin sulfonate and CAS 68439-57-6; it explicitly identifies the substance as a TSCA UVCB. | Source-supported UVCB identity candidate. Exact composition/profile and grade assay require supplier evidence. |
| MICG-084 | Caprylyl/Capryl Glucoside | 68515-73-1 | apg-0810 (+ grade variants) | PubChem FDA GSRS depositor record lists CAPRYLYL/CAPRYL OLIGOGLUCOSIDE and CAS 68515-73-1; PubChem compound record identifies the substance as oligomeric decyl/octyl glycosides and UVCB. | Source-supported UVCB identity candidate. Preserve oligomer/alkyl distribution uncertainty; grade evidence required. |
| MICG-048 | Disodium Laureth Sulfosuccinate | 39354-45-5 | sulfosuccinate-40 (+ grade variants) | PubChem record lists CAS 39354-45-5 from ECHA and also 58450-52-5 from CAS Common Chemistry/NZ EPA for the same named reference record. | **Identity/CAS conflict hold.** Do not assign a single exact CAS/INCI pair until the catalog composition/ethoxylation definition is reconciled against the supplier specification and primary registry records. |

## Deliberate non-promotions

1. The source records above support identity candidates only; they do not establish the catalog's INCI field as a formally verified INCI dictionary entry.
2. UVCB substances (notably AOS, CAPB and alkyl glucosides) require composition/profile evidence; a single CAS is not a complete grade identity.
3. MICG-048 is explicitly held because two CAS identifiers are reported for the named reference record. Do not silently choose one.
4. The catalog's technical/pure/solution suffixes are internal grade labels, not proof of purity, concentration, physical form or supplier identity.
5. No `activeDefault`, surfactant active matter, solids, purity, pH range, HLB, CMC or compatibility field is validated by this review.
6. Existing identity SSOT entries are not changed in this tranche. This avoids converting secondary-source matches into falsely VERIFIED identity records.

## Source register

- PubChem, Sodium Lauryl Sulfate, CID 3423265: https://pubchem.ncbi.nlm.nih.gov/compound/3423265
- PubChem, Sodium Lauroyl Sarcosinate, CID 23668817: https://pubchem.ncbi.nlm.nih.gov/compound/23668817
- PubChem, Dodecyldimethylamine oxide, CID 15433: https://pubchem.ncbi.nlm.nih.gov/compound/15433
- PubChem, Cocamidopropyl betaine ChEBI substance record: https://pubchem.ncbi.nlm.nih.gov/substance/135610782
- PubChem, Sodium C14-16 olefin sulfonate ChemIDplus substance record: https://pubchem.ncbi.nlm.nih.gov/substance/135286651
- PubChem, Cetrimonium chloride, CID 8154: https://pubchem.ncbi.nlm.nih.gov/compound/8154
- PubChem, Caprylyl/Capryl oligoglucoside FDA GSRS substance record: https://pubchem.ncbi.nlm.nih.gov/substance/472402409
- PubChem, Disodium Laureth Sulfosuccinate reference record: https://pubchem.ncbi.nlm.nih.gov/compound/Disodium-laureth-sulfosuccinate

## Result

- Candidate groups reviewed in this tranche: 8.
- Source-supported chemical identity candidates: 7.
- Explicit identity/CAS conflict holds: 1.
- Supplier-grade evidence established: 0.
- New VERIFIED identity SSOT entries: 0.
- Applicability approvals: 0.
- Phase 4B closure: **NOT MET**.
- Phase 5: **LOCKED**.

Next tranche: remaining anionic, nonionic and amphoteric surfactant groups, followed by builders/chelators, polymers, enzymes, additives, solvents and proprietary mixtures. Every source claim must be checked against the exact chemical scope; no automatic CAS-only promotion is permitted.


## Follow-up source review — additional surfactant groups

This continuation expands the source screen. These are source-backed identity candidates or explicit holds, not automatic SSOT promotions.

| Group | Catalog identity | Catalog CAS | Source finding | Disposition |
|---|---|---:|---|---|
| MICG-063 | Sodium Cocoyl Isethionate | 61789-32-0 | FDA GSRS record in PubChem identifies Sodium Cocoyl Isethionate, lists CAS 61789-32-0 and explicitly classifies the substance as a mixture. | Source-supported mixture identity candidate; grade fatty-acid distribution and assay remain unverified. |
| MICG-066 | Sodium Methyl Cocoyl Taurate | 61791-42-2 | PubChem lists 12765-39-8 as the primary CAS from multiple registries and 61791-42-2 as a secondary/deprecated identifier in FDA GSRS context. | **CAS correction hold.** Catalog CAS must not be treated as primary without reconciling the exact source and identity scope. Keep both identifiers and their source roles in the audit trail. |
| MICG-074 | Cocamidopropyl Hydroxysultaine | 68139-30-0 | FDA GSRS record in PubChem identifies the named substance, CAS 68139-30-0, UNII 62V75NI93W and substance class mixture. | Source-supported mixture identity candidate; no grade or active matter inferred. |
| MICG-076 | Lauryl Betaine | 683-10-3 | PubChem CID 4292413 identifies Lauryldimethylbetaine, lists Lauryl betaine and CAS 683-10-3; FDA UNII record Y4P927Q133 independently names Lauryl Betaine and provides the same formula/InChIKey. | Stronger cross-source identity candidate. Preserve the separate CAS 85736-48-7 also listed in PubChem as an alternate scope/registry identifier pending exact scope check. |
| MICG-078 | Coco-Betaine | 68424-94-2 | FDA GSRS record identifies COCO-BETAINE and CAS 68424-94-2; record includes mixture validation warnings for component betaines not yet registered. | Source-supported mixture candidate; do not collapse into Lauryl Betaine. |
| MICG-075 | Cocamide MEA | 68140-00-1 | PubChem identifies “Amides, coco, N-(hydroxyethyl)” as UVCB and lists CAS 68140-00-1. | Source-supported UVCB identity candidate; not interchangeable with Cocamide DEA. |
| MICG-086 | Cocamide DEA | 68603-42-9 | PubChem ChemIDplus record identifies Coconut diethanolamide and lists CAS 68603-42-9. | Source-supported UVCB identity candidate; exact fatty-acid distribution/grade remains unknown. |
| MICG-088 | Disodium Cocoamphodiacetate | 68650-39-5 | FDA GSRS record in PubChem identifies the substance, CAS 68650-39-5 and mixture class. | Source-supported mixture identity candidate. |
| MICG-085 | Sodium Laureth Sulfate | 68585-34-2 | ECHA Substance Information identifies “Alcohols, C10-16, ethoxylated, sulfates, sodium salts” with CAS 68585-34-2 and EC 500-223-8. | Source-supported substance-family identity; catalog grade labels SLES 28/70 remain supplier-grade claims requiring TDS/CoA. |
| MICG-111 | Polysorbate 20 | 9005-64-5 | PubChem record identifies Polyoxyethylene Sorbitan Monolaurate / Polysorbate 20 and CAS 9005-64-5; WHO/JECFA independently describes it as a distribution mixture of sorbitol/sorbitan partial esters and lauric-acid moieties. | Source-supported mixture identity candidate; do not imply a single discrete molecular structure. |
| MICG-112 | Polysorbate 80 | 9005-65-6 | PubChem identifies polyoxyethylene sorbitan monooleate / Polysorbate 80 and CAS 9005-65-6. | Source-supported mixture identity candidate; grade distribution remains unspecified. |
| MICG-079–082 | C12-15 Pareth-12 / -3 / -7 / -9 | 68439-50-9 (shared) | Four different ethoxylation labels share one catalog CAS. Current evidence retrieved here does not prove that each ethoxylate distribution is uniquely represented by that single CAS. | **CAS collision hold.** Keep all four identities separate; require supplier specification with alcohol chain distribution and average EO number before exact CAS/INCI mapping. |
| MICG-116–118 | Nonoxynol-10 / -6 / -9 | 9016-45-9 (shared) | PubChem exposes 9016-45-9 alongside a discrete nonylphenol ethoxylate record and also lists other CAS values for related scopes. That does not establish the three catalog ethoxylate-number grades as one identical chemical. | **CAS collision hold.** Do not merge N-6/N-9/N-10. Resolve each ethoxylation distribution and registry scope independently. |

### Follow-up sources

- FDA GSRS / PubChem, Sodium Cocoyl Isethionate: https://pubchem.ncbi.nlm.nih.gov/substance/375083712
- PubChem, Sodium Methyl Cocoyl Taurate: https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-Methyl-Cocoyl-Taurate
- FDA GSRS / PubChem, Cocamidopropyl Hydroxysultaine: https://pubchem.ncbi.nlm.nih.gov/substance/175271429
- PubChem, Lauryldimethylbetaine: https://pubchem.ncbi.nlm.nih.gov/compound/4292413
- FDA SRS, Lauryl Betaine UNII Y4P927Q133: https://precision.fda.gov/uniisearch/srs/unii/Y4P927Q133
- FDA GSRS, Coco-Betaine: https://gsrs.ncats.nih.gov/ginas/app/ui/substances/9ba23b3e-e43e-4773-ac14-2b2fffe6e0d7
- PubChem, Cocamide MEA / Amides, coco, N-(hydroxyethyl): https://pubchem.ncbi.nlm.nih.gov/compound/Amides%2C%20coco%2C%20N-%28hydroxyethyl%29
- PubChem, Cocamide DEA / Coconut diethanolamide: https://pubchem.ncbi.nlm.nih.gov/substance/135323658
- FDA GSRS / PubChem, Disodium Cocoamphodiacetate: https://pubchem.ncbi.nlm.nih.gov/substance/375085028
- ECHA, Alcohols C10-16 ethoxylated sulfates sodium salts: https://echa.europa.eu/substance-information/-/substanceinfo/100.105.713
- PubChem, Polysorbate 20: https://pubchem.ncbi.nlm.nih.gov/compound/Polyoxyethylene%20Sorbitan%20Monolaurate
- WHO/JECFA, Polysorbate 20: https://apps.who.int/food-additives-contaminants-jecfa-database/Home/Chemical/1139
- PubChem, Polysorbate 80: https://pubchem.ncbi.nlm.nih.gov/compound/polysorbate%2080
- PubChem, Nonoxynol-2 / shared CAS scope caution: https://pubchem.ncbi.nlm.nih.gov/compound/24773

### New material findings

- Additional candidate groups/issues reviewed in this tranche: 18 (11 individual groups plus four Pareth groups and three Nonoxynol groups).
- New source-supported identity candidates: 10.
- New explicit CAS/identity holds: 3 (Sodium Methyl Cocoyl Taurate identifier priority; C12-15 Pareth shared-CAS cluster; Nonoxynol shared-CAS cluster).
- SSOT promotions: 0.
- Supplier-grade evidence established: 0.


## Follow-up source review — remaining individually sourced candidates

| Group | Catalog identity | Catalog CAS | Source finding | Disposition |
|---|---|---:|---|---|
| MICG-011 | Lauryl Glucoside | 110615-47-9 | PubChem CID 10893439 lists Lauryl Glucoside and CAS 110615-47-9, but also lists 27836-64-2 as another CAS identifier for the record. A separate PubChem vendor substance record lists 110615-47-9. | Source-supported identity candidate with CAS-scope caveat. Keep alternate CAS and exact glucoside/alkyl distribution traceable; do not infer a supplier grade. |
| MICG-033 | Behentrimonium Chloride | 17301-53-0 | PubChem CID 3014969 identifies docosyltrimethylammonium chloride, CAS 17301-53-0, formula C25H54ClN and UNII X7GNG3S47T. | Strong chemical identity candidate. Catalog classification is cationic surfactant; commercial grade and assay still unverified. |
| MICG-099 | Sodium Lignosulfonate | 8061-51-6 | PubChem CID 44135711 identifies sodium lignosulfonate/lignosulfonic acid sodium salt and lists CAS 8061-51-6. | Identity candidate supported, but **catalog functional class requires review**: do not automatically accept the current “Anionic Surfactant” class as equivalent to a conventional low-molecular-weight surfactant. Review dispersant/polymeric functionality separately. |

### Additional sources

- PubChem, Lauryl Glucoside, CID 10893439: https://pubchem.ncbi.nlm.nih.gov/compound/10893439
- PubChem, Lauryl Glucoside vendor-substance record: https://pubchem.ncbi.nlm.nih.gov/substance/254763565
- PubChem, Behentrimonium Chloride, CID 3014969: https://pubchem.ncbi.nlm.nih.gov/compound/3014969
- PubChem, Sodium Lignosulfonate, CID 44135711: https://pubchem.ncbi.nlm.nih.gov/compound/44135711

### Current surfactant-family backlog disposition

This audit now includes 29 catalog candidate groups/issues examined across the three source-review tranches. It has identified source-backed identity candidates and several explicit identity/CAS/category holds. This is not a count of 29 supplier-grade verified records: all commercial-grade assays, manufacturer identity, lot CoA/TDS/SDS, purity/solids and grade-specific composition remain unestablished.

Still requiring source-specific review before any identity SSOT promotion include: sodium C14-17 secondary alkyl sulfonate; sodium cocoamphoacetate; PEG-40 hydrogenated castor oil; Poloxamer 184; benzalkonium chloride; and remaining surfactant-class candidates not yet covered. No candidate is promoted merely because a CAS/name pair appears in a secondary index.


## Aggregate reconciliation of this surfactant source-review work

Across the three tranches above:
- Candidate groups/issues examined: 29.
- Source-backed identity candidates (secondary/official registry corroboration only): 20.
- Explicit CAS/identity conflict holds: 4.
- Functional-class review flags: 1 (sodium lignosulfonate).
- Identity SSOT entries promoted to VERIFIED: 0.
- Supplier-grade evidence records established: 0.
- Formula applicability approvals: 0.

These figures count review outcomes, not fully resolved master rows. The source-backed candidates still need primary nomenclature/identity scope review where relevant and supplier-grade TDS/SDS/CoA evidence. The 397-record backlog is not closed by this tranche.


## Follow-up source review — remaining surfactant candidates (fourth tranche)

| Group | Catalog identity | Catalog CAS | Source finding | Disposition |
|---|---|---:|---|---|
| MICG-062 | PEG-40 Hydrogenated Castor Oil | 61788-85-0 | PubChem SID 135283603, sourced from ChemIDplus, lists Polyoxyl 40 Hydrogenated Castor Oil [NF], CAS 61788-85-0, and related PEG hydrogenated-castor-oil synonyms across multiple ethoxylation numbers. A European Commission JRC report independently lists PEG-40 Hydrogenated Castor Oil with CAS 61788-85-0. | Source-supported identity candidate with mixture/ethoxylate-scope caveat. The generic synonym family does not prove the catalog's four commercial-grade records or their exact EO distribution. |
| MICG-087 | Sodium Cocoamphoacetate | 68604-71-7 (catalog) | Stepan's AMPHOSOL 1C manufacturer product bulletin identifies Sodium Cocoamphoacetate with CAS 68608-65-1, not the catalog CAS 68604-71-7. It reports a specific commercial product at 36.5% actives and 44% solids. | **CAS discrepancy hold.** The manufacturer bulletin confirms the INCI for CAS 68608-65-1 but does not support the catalog's CAS 68604-71-7. Do not silently replace the catalog CAS; require authoritative registry resolution and the actual supplier specification. |
| MICG-069 | Benzalkonium Chloride | 63449-41-2 | EU Cosmetics Regulation Annex V lists benzalkonium chloride against multiple CAS numbers: 63449-41-2, 68391-01-5, 68424-85-1 and 85409-22-9. | Identity-family candidate supported, but CAS denotes a family/composition scope. Preserve the multiple CAS scope and require alkyl-chain distribution and supplier-grade specification before exact commercial identity mapping. |
| MICG-107 | Poloxamer 184 | 9003-11-6 | The Cosmetic Ingredient Review literature describes 9003-11-6 as a generic CAS associated with the poloxamer group, while noting that related PEG/PPG copolymer mixtures may not have a unique CAS. The evidence retrieved does not establish Poloxamer 184 as a distinct grade under this generic number. | **Grade/identity scope hold.** Do not treat generic poloxamer CAS as sufficient proof of Poloxamer 184 block composition or molecular-weight distribution. Obtain supplier TDS/SDS and a specific identity source. |
| MICG-073 | Sodium C14-17 Sec-Alkyl Sulfonate | 68037-49-0 | The source search did not return a sufficiently authoritative record tying this exact catalog name and CAS together. Similar alkyl sulfonate records are not interchangeable evidence. | **Unresolved source hold.** No identity promotion; require a registry record or supplier SDS that explicitly binds this exact CAS, INCI/name and chain distribution. |

### Fourth-tranche sources

- Stepan, AMPHOSOL 1C Product Bulletin (manufacturer primary source; Sodium Cocoamphoacetate CAS 68608-65-1, INCI and grade properties): https://www.stepan.com/content/dam/stepan-dot-com/webdam/website-product-documents/product-bulletins/surfactants/AMPHOSOL1C.pdf
- PubChem SID 135283603 / ChemIDplus, Polyoxyl 40 Hydrogenated Castor Oil [NF], CAS 61788-85-0: https://pubchem.ncbi.nlm.nih.gov/substance/135283603
- European Commission JRC report listing PEG-40 Hydrogenated Castor Oil and CAS 61788-85-0: https://susproc.jrc.ec.europa.eu/product-bureau/sites/default/files/contentype/product_group_documents/1581684261/Preliminary_Report_EUEcolabel_Cosmetics.pdf
- EU Cosmetics Regulation 1223/2009, Annex V, Benzalkonium chloride multiple CAS identifiers: https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex:32009R1223
- Cosmetic Ingredient Review, Safety Evaluation of PEG Compounds for Cosmetic Use (generic poloxamer CAS context): https://pmc.ncbi.nlm.nih.gov/articles/4505343/

### Fourth-tranche disposition

- Additional candidate groups/issues examined: 5.
- Additional source-supported identity-family candidates: 2 (PEG-40 Hydrogenated Castor Oil; Benzalkonium Chloride).
- Additional explicit CAS discrepancy: 1 (Sodium Cocoamphoacetate; catalog CAS differs from manufacturer bulletin).
- Additional generic-CAS / identity-scope hold: 1 (Poloxamer 184).
- Additional unresolved exact-source hold: 1 (Sodium C14-17 Sec-Alkyl Sulfonate).
- SSOT promotions: 0.
- Supplier-grade evidence established for catalog records: 0.
- Formula applicability approvals: 0.

The Stepan bulletin is useful primary manufacturer evidence, but it is evidence for CAS 68608-65-1 / AMPHOSOL 1C, not for the catalog's CAS 68604-71-7. This conflict must remain visible rather than being "corrected" by assumption.


## Updated aggregate reconciliation (four tranches)

- Candidate groups/issues examined: 34.
- Source-backed identity candidates (official registry, government, or manufacturer corroboration; not supplier-grade validation): 22.
- Explicit CAS/identity conflict or scope holds: 6 (includes the new Sodium Cocoamphoacetate CAS discrepancy and Poloxamer 184 generic-CAS scope hold).
- Additional unresolved exact-source hold: 1 (Sodium C14-17 Sec-Alkyl Sulfonate).
- Functional-class review flags: 1 (Sodium Lignosulfonate).
- Identity SSOT entries promoted to VERIFIED: 0.
- Supplier-grade evidence records established for the catalog: 0.
- Formula applicability approvals: 0.

The fourth tranche reduces the *review backlog* but does not reduce the 397 unmapped identity count in the executable crosswalk. No catalog identity was rewritten, no CAS was silently substituted, no supplier assay was inferred, and all 5,590 applicability rows remain NOT_APPROVED. Phase 4B remains OPEN; Phase 5 remains LOCKED.


## Cross-category identity source review — builders and neutralizer (fifth tranche)

This tranche begins the category-wise review beyond surfactants. These are identity-level source checks only; they do not establish the four catalog grade variants or any supplier assay.

| Group | Catalog identity | Catalog CAS | Source finding | Disposition |
|---|---|---:|---|---|
| MICG-005 | Calcium Chloride | 10043-52-4 | PubChem CID 5284359 identifies calcium chloride / calcium dichloride, formula CaCl2, and lists CAS 10043-52-4 across multiple government and registry sources. | Source-supported identity candidate. Hydrate state and catalog commercial grade must still be specified; the CAS match alone does not establish the grade variants. |
| MICG-006 | Triethanolamine | 102-71-6 | PubChem CID 7618 identifies triethanolamine / 2,2',2''-nitrilotriethanol, formula C6H15NO3, CAS 102-71-6, and UNII 9O3K93S3TK. | Source-supported identity candidate. The separate related CAS 64114-46-1 is associated with triethanolamine polymer and must not be conflated with the monomer. Supplier purity/free-DEA assay remains absent. |
| MICG-050 | Sodium Carbonate | 497-19-8 | Fisher Scientific's product listing identifies anhydrous sodium carbonate / soda ash, CAS 497-19-8, formula Na2CO3, PubChem CID 10340 and ChEBI CHEBI:29377. | Source-supported identity candidate for anhydrous sodium carbonate. Keep sodium carbonate monohydrate and sodium carbonate decahydrate distinct; no catalog grade assay is established. |
| MICG-052 | Tetrasodium Glutamate Diacetate (GLDA) | 51981-21-6 | PubChem SID 135258214 (ChemIDplus source) and CID 44630158 identify tetrasodium glutamate diacetate, CAS 51981-21-6, UNII 5EHL50I4MY and EC 257-573-7. PubChem synonyms include ca. 40% aqueous GLDA products, but these are depositor-supplied synonyms, not an assay certificate for this catalog. | Source-supported identity candidate. The catalog's GLDA-47 active/solids claim still requires manufacturer TDS/CoA; do not convert synonym text into a supplier assay. |

### Fifth-tranche sources

- PubChem, Calcium Chloride, CID 5284359: https://pubchem.ncbi.nlm.nih.gov/compound/Calcium-dichloride
- PubChem, Triethanolamine, CID 7618: https://pubchem.ncbi.nlm.nih.gov/compound/triethanolamine
- Fisher Scientific, anhydrous Sodium Carbonate listing (CAS 497-19-8; PubChem CID 10340; ChEBI CHEBI:29377): https://www.fishersci.com/us/en/browse/80013494/Salts%20and%20Inorganics?categoryKey=80013494&page=2241
- PubChem SID 135258214, Tetrasodium Glutamate Diacetate (ChemIDplus): https://pubchem.ncbi.nlm.nih.gov/substance/135258214
- PubChem CID 44630158, Tetrasodium Glutamate Diacetate: https://pubchem.ncbi.nlm.nih.gov/compound/44630158

### Fifth-tranche disposition

- Additional candidate groups examined: 4.
- Additional source-supported identity candidates: 4.
- Identity SSOT promotions: 0.
- Supplier-grade evidence established for catalog records: 0.
- Formula applicability approvals: 0.

No catalog record or executable crosswalk was altered. These four identity candidates remain outside the seven-entry exact identity SSOT until a deliberate source-backed SSOT change and regression are performed.


## Updated aggregate reconciliation (five tranches)

- Candidate groups/issues examined: 38.
- Source-backed identity candidates (official registry, government, or manufacturer corroboration; not supplier-grade validation): 26.
- Explicit CAS/identity conflict or scope holds: 6.
- Additional unresolved exact-source hold: 1 (Sodium C14-17 Sec-Alkyl Sulfonate).
- Functional-class review flags: 1 (Sodium Lignosulfonate).
- Identity SSOT entries promoted to VERIFIED: 0.
- Supplier-grade evidence records established for the catalog: 0.
- Formula applicability approvals: 0.

The fifth tranche covers four builder/neutralizer candidate groups. The 397 unmapped identity crosswalk rows remain unchanged because source review notes are not SSOT records. All 5,590 applicability rows remain NOT_APPROVED. Phase 4B remains OPEN; Phase 5 remains LOCKED.


## Cross-category identity source review — builders, chelators and enzymes (sixth tranche)

The review below covers 15 candidate groups from the existing 119-row candidate-group inventory. A source-backed identity means that a public registry, government/standards source or authoritative enzyme nomenclature source supports the broad name/CAS association. It does not mean that any of the four catalog grade variants has been verified.

| Group | Catalog identity | Catalog CAS | Source finding | Disposition |
|---|---|---:|---|---|
| MICG-007 | Sodium Metasilicate Pentahydrate | 10213-79-3 | PubChem CID 61495 identifies disodium metasilicate pentahydrate, formula Na2SiO3·5H2O, and lists CAS 10213-79-3. OECD SIDS separately identifies pentahydrate vs anhydrous vs nonahydrate forms. | Source-supported exact hydrate identity candidate. Do not collapse into anhydrous MICG-077. |
| MICG-022 | Zeolite 4A | 1318-02-1 | PubChem's ECHA-sourced record identifies CAS 1318-02-1 as synthetic, cuboidal, crystalline, non-fibrous zeolite; the retrieved record does not establish the specific 4A framework/grade. | **Grade/specificity hold.** CAS supports a synthetic zeolite family, not a conclusive Zeolite 4A assignment. Require supplier specification including framework/type and exchange form. |
| MICG-024 | Sodium Silicate | 1344-09-8 | PubChem and OECD/industry silicate references associate CAS 1344-09-8 with soluble sodium silicates. PubChem/HSDB notes commercial sodium silicates may be mixtures of molecular species with variable composition and SiO2:Na2O ratio. | Source-supported family identity candidate; exact commercial grade remains unresolved until modulus, solids, density and product specification are known. |
| MICG-026 | Disodium EDTA | 139-33-3 | PubChem CID 57339238 identifies disodium EDTA, CAS 139-33-3, and separately distinguishes deprecated identifiers. | Source-supported identity candidate. Anhydrous vs hydrate state and assay remain grade-specific. |
| MICG-032 | Trisodium Dicarboxymethyl Alaninate (MGDA) | 164462-16-2 | PubChem CID 11021984 identifies trisodium dicarboxymethyl alaninate, formula C7H8NNa3O6, CAS 164462-16-2. | Source-supported identity candidate. Commercial aqueous concentration/active assay and stereochemical/grade details remain unverified. |
| MICG-042 | Etidronic Acid (HEDP) | 2809-21-4 | PubChem CID 3305 identifies etidronic acid, CAS 2809-21-4, also called HEDP, and describes chelating function. | Source-supported identity candidate. Catalog liquid/solids grade and neutralization state require supplier evidence. |
| MICG-046 | Mannan Endoperoxidase | 37288-54-3 | FDA GRAS notice, EFSA assessment and IUBMB EC 3.2.1.78 identify CAS 37288-54-3 as mannan endo-1,4-beta-mannosidase / endo-beta-1,4-mannanase (mannanase), not “mannan endoperoxidase.” | **Nomenclature correction required.** CAS and intended mannanase family are supported, but catalog INCI/name is materially wrong. Do not silently edit; create a controlled alias/canonical-name correction with source and regression. |
| MICG-053 | Sodium Gluconate | 527-07-1 | PubChem CID 23672301 identifies sodium gluconate, CAS 527-07-1, and ChEBI describes its chelating role. | Source-supported identity candidate. Hydrate/assay and supplier grade remain unverified. |
| MICG-061 | Sodium Citrate | 6132-04-3 | PubChem CID 71474 identifies trisodium citrate dihydrate, CAS 6132-04-3, formula C6H5Na3O7·2H2O. | Source-supported dihydrate identity candidate. Do not treat anhydrous trisodium citrate as mass-equivalent; hydrate basis must be explicit. |
| MICG-077 | Sodium Metasilicate Anhydrous | 6834-92-0 | PubChem, IPCS and OECD SIDS identify CAS 6834-92-0 as anhydrous sodium metasilicate; IPCS distinguishes pentahydrate CAS 10213-79-3 and nonahydrate CAS 13517-24-3. | Source-supported exact anhydrous identity candidate. Keep distinct from MICG-007 pentahydrate. |
| MICG-095 | Sodium Triphosphate / STPP | 7758-29-4 | PubChem CID 24455 and ECHA identify pentasodium triphosphate / sodium tripolyphosphate, CAS 7758-29-4, formula Na5P3O10. Sigma-Aldrich lists technical grade 85% with this CAS. | Source-supported identity candidate. Vendor technical-grade listing is not the user's supplier CoA; do not apply 85% to the catalog. |
| MICG-103 | Alpha-Amylase | 9000-90-2 | ECHA's 2025 enzyme RMOA lists alpha-amylase CAS 9000-90-2 as an enzyme identity. | Source-supported enzyme-family candidate. Enzyme source organism, activity units (e.g. U/g), formulation and stabilizers require supplier documentation. |
| MICG-104 | Triacylglycerol Lipase | 9001-62-1 | ECHA's 2025 enzyme RMOA lists lipase CAS 9001-62-1. | Source-supported enzyme-family candidate. The broad CAS does not identify microbial source, lipase subtype, activity or liquid carrier. |
| MICG-114 | Cellulase | 9012-54-8 | ECHA's 2025 enzyme RMOA and PubChem identify cellulase CAS 9012-54-8; PubChem also lists other cellulase-related CAS records, including 9041-92-3. | Source-supported enzyme-family candidate. Do not infer enzyme subtype, organism, activity or preparation from CAS alone. |
| MICG-115 | Subtilisin | 9014-01-1 | ECHA's 2025 enzyme RMOA lists subtilisin CAS 9014-01-1. | Source-supported enzyme-family candidate. Protease subtype, source strain, activity units, stabilization and sensitization controls require supplier SDS/TDS/CoA. |

### Sixth-tranche sources

- PubChem, Sodium Metasilicate Pentahydrate, CID 61495: https://pubchem.ncbi.nlm.nih.gov/compound/Sodium%20metasilicate%20pentahydrate
- OECD SIDS, Silicic Acid, Disodium Salt (anhydrous/pentahydrate/nonahydrate forms): https://hpvchemicals.oecd.org/ui/handler.axd?id=3cb4f34b-2afa-4004-b447-521188909235
- PubChem, synthetic zeolite CAS 1318-02-1 (ECHA-sourced record): https://pubchem.ncbi.nlm.nih.gov/substance/505900759
- PubChem, Sodium Silicate, CID 23266: https://pubchem.ncbi.nlm.nih.gov/compound/1344-09-8
- PubChem, Disodium EDTA, CID 57339238: https://pubchem.ncbi.nlm.nih.gov/compound/Disodium-EDTA
- PubChem, Trisodium Dicarboxymethyl Alaninate / MGDA, CID 11021984: https://pubchem.ncbi.nlm.nih.gov/compound/164462-16-2
- PubChem, Etidronic Acid / HEDP, CID 3305: https://pubchem.ncbi.nlm.nih.gov/compound/Etidronic-acid
- PubChem, Sodium Gluconate, CID 23672301: https://pubchem.ncbi.nlm.nih.gov/compound/527-07-1
- PubChem, Sodium Citrate Dihydrate, CID 71474: https://pubchem.ncbi.nlm.nih.gov/compound/Trisodium-Citrate-Dihydrate
- IPCS Poisons Information Monograph 500, Sodium Metasilicate hydrate forms: https://inchem.org/documents/pims/chemical/pim500.htm
- PubChem, Sodium Tripolyphosphate, CID 24455: https://pubchem.ncbi.nlm.nih.gov/compound/7758-29-4
- ECHA, 2025 RMOA Conclusion Document — Enzymes (alpha-amylase, lipase, cellulase, subtilisin CAS): https://echa.europa.eu/documents/10162/db990d02-d051-16ab-2068-0ca3f4bd8bbb
- EFSA, Mannan endo-1,4-beta-mannosidase assessment (EC 3.2.1.78; CAS 37288-54-3): https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2022.7264
- IUBMB EC 3.2.1.78 accepted enzyme name and reaction: https://iubmb.qmul.ac.uk/enzyme/EC3/2/1/78.html
- FDA GRAS Notice 000739, mannanase enzyme identity: https://www.fda.gov/media/113323/download
- Sigma-Aldrich, Sodium Tripolyphosphate technical grade 85% (CAS 7758-29-4): https://www.sigmaaldrich.com/IN/en/product/sigald/238503

### Sixth-tranche disposition

- Additional candidate groups/issues examined: 15.
- Additional source-supported identity candidates: 14 (including source-supported family identities where commercial grade remains unresolved).
- Additional grade/specificity hold: 1 (Zeolite 4A).
- Additional nomenclature correction required: 1 (MICG-046; CAS identifies mannanase, not endoperoxidase).
- Identity SSOT promotions: 0.
- Supplier-grade evidence records established for catalog records: 0.
- Formula applicability approvals: 0.

The enzyme nomenclature finding is a real catalog defect, but it is not corrected by changing the CAS or silently rewriting the record. A controlled canonical-name/alias migration is required. Likewise, zeolite-family identity is not sufficient proof of Zeolite 4A.



## Updated aggregate reconciliation (six tranches)

- Candidate groups/issues examined: 53.
- Source-backed identity candidates (official registry, government, standards, manufacturer or authoritative nomenclature corroboration; not supplier-grade validation): 40.
- Explicit CAS/identity conflict or grade/specificity holds: 7.
- Additional nomenclature correction required: 1 (MICG-046 mannanase).
- Additional unresolved exact-source hold: 1 (Sodium C14-17 Sec-Alkyl Sulfonate).
- Functional-class review flags: 1 (Sodium Lignosulfonate).
- Identity SSOT entries promoted to VERIFIED: 0.
- Supplier-grade evidence records established for the catalog: 0.
- Formula applicability approvals: 0.

No ingredient identity SSOT, catalog record, formula, or applicability decision was modified in this tranche. The 397 unmapped identity crosswalk rows remain unchanged; all 5,590 applicability rows remain NOT_APPROVED. Phase 4B remains OPEN; Phase 5 remains LOCKED.
