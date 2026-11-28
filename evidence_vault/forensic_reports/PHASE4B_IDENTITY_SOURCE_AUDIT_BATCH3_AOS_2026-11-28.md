# Phase 4B Identity Source Audit — Batch 3: Sodium C14-16 Olefin Sulfonate

**Date:** 2026-11-28  
**Candidate group:** MICG-083  
**Catalog coverage:** 8 records (AOS-38 and AOS-92 commercial variants)  
**Review type:** AI-assisted public-source identity audit; not supplier qualification, independent human approval, or laboratory validation.

## 1. Question and scope

The canonical candidate-group export assigns CAS RN **68439-57-6** and catalog INCI label **Sodium C14-16 Olefin Sulfonate** to eight records:

- `aos-38`, `aos-38-tech`, `aos-38-pure`, `aos-38-sol`
- `aos-92`, `aos-92-tech`, `aos-92-pure`, `aos-92-sol`

This audit checks whether the public-source evidence supports the *substance-level* name/CAS association. It does not qualify the commercial products, establish their exact composition, or validate their declared active matter.

## 2. Evidence reviewed

1. **U.S. FDA Substance Registration System (SRS), UNII O9W3D3YF5U**  
   Preferred substance name: Sodium C14-16 Olefin Sulfonate; CAS RN 68439-57-6 appears among the identifiers/synonyms. FDA explicitly cautions that a UNII does not imply regulatory review or approval and that mappings reflect public information.  
   Source: https://precision.fda.gov/uniisearch/srs/unii/O9W3D3YF5U

2. **European Chemicals Agency (ECHA), substance infocard**  
   Lists CAS RN 68439-57-6 and the substance identity “Sulfonic acids, C14-16-alkane hydroxy and C14-16-alkene, sodium salts”; lists Sodium (C14-16) olefin sulfonate among names.  
   Source: https://echa.europa.eu/de/substance-information/-/substanceinfo/100.063.987

3. **Environment and Climate Change Canada, Screening Assessment — Alkyl Sulfates and α-Olefin Sulfonate Group**  
   Identifies CAS RN 68439-57-6 as a UVCB substance. The assessment describes it as a mixture of mono-unsaturated alkene sulfonates and hydroxyalkane sulfonates with variable positions across C14 or C16 chains and sodium as counter-ion. This is important: the CAS represents a variable-composition substance, not one fully specified pure molecular structure.  
   Source: https://www.canada.ca/en/environment-climate-change/services/evaluating-existing-substances/screening-assessment-alkyl-sulfatesa-olefin-sulfonate-group-chemical-abstracts-service-registry-numbers-139.html

4. **Stepan manufacturer product bulletin — BIO-TERGE AS-40 CG-P**  
   This specific manufacturer product bulletin states CAS RN 68439-57-6, INCI Sodium C14-16 Olefin Sulfonate, and 39.0% actives for that named product. It is evidence only for that supplier's named AS-40 CG-P product, not for the catalog's AOS-38 or AOS-92 records.  
   Source: https://www.stepan.com/content/dam/stepan-dot-com/webdam/website-product-documents/product-bulletins/surfactants/BIOTERGEAS40CGP.pdf

## 3. Findings

| Claim | Result | Boundary |
|---|---|---|
| CAS 68439-57-6 is associated with Sodium C14-16 Olefin Sulfonate | **Supported** | Substance-level identity only |
| The material is a single, fully specified pure compound | **Not supported** | Canada identifies it as UVCB / variable composition |
| The catalog's AOS-38 records are 38% active | **Not independently established** | Catalog defaults are not lot assay evidence |
| The catalog's AOS-92 records are 92% active | **Not independently established** | No matching supplier TDS/CoA/lot evidence |
| The eight catalog variants are from a named manufacturer or traceable lots | **Not established** | No supplier/product/lot dossier attached |
| AOS-38 and AOS-92 may be collapsed into one commercial grade | **No** | Keep concentration and physical-form variants distinct |

## 4. Scientific interpretation and limitations

CAS/INCI evidence supports the ingredient-family identity at the substance level. Because the CAS is associated with a UVCB, it does not encode a single molecular structure or establish the exact homolog distribution, alkene/hydroxyalkane ratio, residuals, salts, water content, or impurities in a specific lot.

The Stepan bulletin is a useful manufacturer-specific reference, but its 39.0% active result belongs to BIO-TERGE AS-40 CG-P. It must not be transplanted to the catalog's AOS-38 or AOS-92 records. Nor does it substantiate the 92% powder variant.

## 5. Fail-closed disposition

- `cas_identity_status = AUTHORITATIVE_SUBSTANCE_IDENTITY_SUPPORTED`
- `ssot_crosswalk_disposition = DO_NOT_PROMOTE_TO_SUPPLIER_GRADE_OR_LOT_IDENTITY`
- `grade_evidence_disposition = NOT_ESTABLISHED`
- Keep all eight catalog records blocked from supplier-grade approval and grade-specific formula applicability.
- Do not change CAS, active matter, water content, impurity assumptions, or commercial identity based on this audit.
- Required next evidence: exact supplier/manufacturer and product code; current TDS and SDS; CoA with active matter and method/basis; physical form and water/solids basis; lot number and traceability; relevant impurity/residual limits.

## 6. Reproducibility

The accompanying CSV stores the candidate group, eight catalog IDs, source URLs, source scope, and fail-closed dispositions. The regression test asserts the eight-record reconciliation and that no supplier-grade approval is inferred.

**Phase 4B remains OPEN. Phase 5 remains LOCKED.** This audit improves one substance-level identity record; it does not close the remaining 111 candidate groups or the wider supplier-provenance and formula-validation blockers.
