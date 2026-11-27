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
