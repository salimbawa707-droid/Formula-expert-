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

- Additional groups reviewed in this tranche: 14 (MICG-063, 066, 074, 076, 078, 075, 086, 088, 085, 111, 112, 079–082, 116–118; group count is 14 when the Pareth and Nonoxynol collisions are each counted as one grouped issue).
- New source-supported identity candidates: 11.
- New explicit CAS/identity holds: 3 (Sodium Methyl Cocoyl Taurate identifier priority; C12-15 Pareth shared-CAS cluster; Nonoxynol shared-CAS cluster).
- SSOT promotions: 0.
- Supplier-grade evidence established: 0.
