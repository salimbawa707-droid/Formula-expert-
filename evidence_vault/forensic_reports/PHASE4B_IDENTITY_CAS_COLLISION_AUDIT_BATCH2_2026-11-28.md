# Phase 4B — Identity CAS collision audit, Batch 2
Date: 2026-11-28

## Scope
Four candidate groups (MICG-079 through MICG-082), representing 16 catalog variants, were selected because the identity candidate export assigns CAS 68439-50-9 to catalog labels C12-15 Pareth-12, -3, -7 and -9.

## Source comparison
- The European Union Official Journal ingredient inventory (Decision 2006/257/EC) associates CAS 68439-50-9 with C12-14 Pareth-3, C12-14 Pareth-7 and C12-14 Pareth-12.
- The Cosmetic Ingredient Review (CIR) alkyl ethoxylate report associates CAS 68131-39-5 with C12-15 Pareth-3, -7, -9 and -12.
- The European Commission describes CosIng as an informative ingredient database and explicitly says it has no legal value. This audit therefore treats the EU inventory and CIR report as nomenclature/CAS association evidence, not as proof of regulatory approval or supplier identity.

## Findings
All four catalog rows are flagged as CAS_ASSOCIATION_CONFLICT_REQUIRES_SOURCE_RESOLUTION. The catalog pairing of C12-15 Pareth names with CAS 68439-50-9 conflicts with the cited reference associations. This is a substantive identity-data defect candidate, not a cosmetic naming discrepancy.

## Fail-closed disposition
- Do not silently replace CAS values.
- Do not promote any row to exact CAS+INCI identity SSOT.
- Keep all 16 catalog variants blocked from grade-specific or formulation applicability approval pending primary supplier documentation and exact chemical identity confirmation.
- A supplier TDS/SDS/CoA and lot-specific composition are still required to establish the commercial material actually represented by each catalog record.
- This audit does not prove that every supplier material under these catalog IDs is mislabeled; it proves that the current catalog label/CAS pairing is inconsistent with the cited public nomenclature references.

## Counts
- Candidate groups reviewed: 4
- Catalog variants represented: 16
- CAS/INCI conflict flags: 4
- Automatic corrections: 0
- Exact SSOT promotions: 0
- Grade approvals: 0

## Sources
1. EU Official Journal, Commission Decision 2006/257/EC: https://eur-lex.europa.eu/eli/dec/2006/257/oj/eng
2. Cosmetic Ingredient Review, Safety Assessment of Alkyl PEG Ethers as Used in Cosmetics: https://cir-safety.org/sites/default/files/117_final_alkyl.pdf
3. European Commission CosIng database description and limitations: https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-ingredient-database_en

## Status
AI-assisted source audit. No independent human approval or laboratory/supplier validation is claimed. Phase 4B remains OPEN; Phase 5 remains LOCKED.
