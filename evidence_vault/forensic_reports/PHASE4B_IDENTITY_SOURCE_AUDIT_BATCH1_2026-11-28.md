# Phase 4B — Identity Source Audit, Batch 1

**Audit date:** 2026-11-28  
**Branch:** `phase4b-identity-crosswalk-source-audit-batch1-2026-11-28`  
**Scope:** Six unmapped identity candidate groups selected from the 119-group master identity candidate export.  
**Disposition:** Source-level CAS identity support recorded; INCI nomenclature and supplier-grade evidence remain unverified. No identity SSOT promotion is made in this batch.

## 1. Results

| Candidate | CAS | Catalog label | Catalog variants | Source | Result |
|---|---|---|---:|---|---|
| MICG-005 | 10043-52-4 | Calcium Chloride | 4 | PubChem CID 5284359 | CAS/substance identity supported |
| MICG-029 | 151-21-3 | Sodium Lauryl Sulfate | 8 | PubChem CID 3423265 | CAS/substance identity supported |
| MICG-050 | 497-19-8 | Sodium Carbonate | 8 | PubChem CID 10340 | CAS/substance identity supported |
| MICG-053 | 527-07-1 | Sodium Gluconate | 4 | PubChem CID 23672301 | CAS/substance identity supported |
| MICG-054 | 532-32-1 | Sodium Benzoate | 4 | PubChem CID 517055 | CAS/substance identity supported |
| MICG-091 | 7647-14-5 | Sodium Chloride | 4 | PubChem CID 5234 | CAS/substance identity supported |
| **Total** | | **6 candidate groups** | **32** | | |

The source links and row-level claim limits are retained in `evidence_vault/datasets/phase4b_identity_source_audit_batch1_2026-11-28.csv`.

## 2. Source scope and non-inferences

PubChem compound pages support the association of the CAS RN with the named discrete substance. They do **not** independently establish that the catalog label is an official INCI nomenclature entry. Therefore every row is deliberately recorded as:

- `cas_identity_status = PUBCHEM_IDENTITY_SUPPORTED`
- `inci_nomenclature_status = NOT_INDEPENDENTLY_VERIFIED`
- `ssot_crosswalk_disposition = DO_NOT_PROMOTE_TO_EXACT_CAS_INCI_SSOT_MATCH`
- `grade_evidence_disposition = NOT_ESTABLISHED`

This is not an exact CAS+INCI SSOT crosswalk and does not resolve supplier grade or product identity.

Specific distinctions retained:
- Calcium chloride catalog variants still require hydrate/anhydrous state and grade evidence.
- Sodium lauryl sulfate CAS identity does not establish commercial active matter, impurities or the supplier's exact grade.
- Sodium carbonate light/dense form, hydrate and particle-size specifications remain distinct.
- Sodium gluconate assay and as-supplied solids/hydrate basis remain unverified.
- Sodium benzoate supplier grade and lot assay remain unverified.
- Sodium chloride purity, moisture and trace impurity limits remain unverified.

## 3. Guardrails and regression

Added:
- `evidence_vault/datasets/phase4b_identity_source_audit_batch1_2026-11-28.csv`
- `scripts/test-phase4b-identity-source-audit-batch1.ts`
- Registered the new audit test in `package.json` under `test:all`.

The regression locks:
- six unique candidate groups;
- 32 represented catalog variants;
- a PubChem source URL for each row;
- CAS identity support only;
- INCI terminology explicitly unverified;
- zero exact-SSOT promotions and zero supplier-grade approvals.

## 4. Current impact

This batch adds traceable identity-source evidence for six groups and 32 commercial catalog variants, but **does not increase the exact 33/430 CAS+INCI SSOT match count**. This is intentional: source scope does not support INCI nomenclature promotion. The 397/430 unmatched count remains unchanged until both CAS and INCI evidence are established against the identity SSOT's acceptance criteria.

## 5. Next source-audit priority

Continue with candidates whose source identities are likely to be discrete substances, while isolating:
1. salts with hydrate/anhydrous variants;
2. surfactant families/UVCBs where CAS may cover a distribution rather than one molecular species;
3. polymers and enzymes with broad or source-dependent identity descriptions;
4. proprietary blends and colorants requiring composition or supplier disclosure.

Do not bulk-add all 119 groups to the SSOT from CAS-only lookups. For each candidate, require separate evidence for CAS association and official INCI nomenclature, and keep grade/lot evidence as an independent gate.

## 6. References

- Calcium chloride, PubChem CID 5284359: https://pubchem.ncbi.nlm.nih.gov/compound/10043-52-4
- Sodium lauryl sulfate, PubChem CID 3423265: https://pubchem.ncbi.nlm.nih.gov/compound/sodium_dodecyl_sulfate
- Sodium carbonate, PubChem CID 10340: https://pubchem.ncbi.nlm.nih.gov/compound/497-19-8
- Sodium gluconate, PubChem CID 23672301: https://pubchem.ncbi.nlm.nih.gov/compound/527-07-1
- Sodium benzoate, PubChem CID 517055: https://pubchem.ncbi.nlm.nih.gov/compound/532-32-1
- Sodium chloride, PubChem CID 5234: https://pubchem.ncbi.nlm.nih.gov/compound/sea-salt

**Conclusion:** Batch 1 source audit is documented and fail-closed. It adds no unsupported SSOT matches, supplier-grade approvals, or applicability approvals.
