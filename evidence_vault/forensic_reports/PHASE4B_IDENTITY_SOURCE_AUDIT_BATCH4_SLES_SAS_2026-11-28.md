# Phase 4B Identity Source Audit — Batch 4: SLES and SAS-60
**Date:** 2026-11-28  
**Candidate groups:** MICG-073 and MICG-085  
**Catalog coverage:** 12 records (4 SAS-60 variants; 8 SLES variants)  
**Review type:** AI-assisted public-source identity reconciliation. Not supplier qualification, independent human approval, or laboratory validation.

## 1. Scope

This batch examines two unresolved catalog groups:
- MICG-073: CAS 68037-49-0; catalog INCI Sodium C14-17 Sec-Alkyl Sulfonate; four SAS-60 variants.
- MICG-085: CAS 68585-34-2; catalog INCI Sodium Laureth Sulfate; eight SLES-70/SLES-28 variants.

The purpose is to separate substance-level name/CAS associations from commercial grade identity, EO/alkyl distribution, active matter, and lot conformity.

## 2. MICG-073 — SAS-60: conflicting public CAS assignments

### Evidence
1. **ECHA substance infocard** identifies CAS 68037-49-0 as “Sulfonic acids, C10-18-alkane, sodium salts” and describes a broad C10-18 alkane sulfonate family.  
   https://echa.europa.eu/substance-information/-/substanceinfo/100.061.994
2. **Korean Cosmetic Ingredient Dictionary (KCIA)** lists “Sodium C14-17 Alkyl Sec Sulfonate” with CAS 68037-49-0 and describes sodium salts of secondary sulfonated C14-17 alkanes. This supports the catalog pairing at the nomenclature-dictionary level.  
   https://kcia.or.kr/cid/search/ingd_view.php?no=18412
3. **FDA Global Substance Registration System (GSRS)** has a validated mixture record “Sodium C14-17 Alkyl Sec Sulfonate 30”, names Hostapur SAS 30, and lists CAS 97489-15-1. The record is explicitly a named 30% mixture; it is not direct proof of the catalog's SAS-60 grade.  
   https://precision.fda.gov/ginas/app/ui/substances/A14OB1S7O2
4. **Australian Industrial Chemicals Introduction Scheme assessment** cites an ECHA REACH dossier for “Sulfonic acids, C14-17-sec-alkane, sodium salts” under CAS 97489-15-1 and separately cites the C10-18 alkane sodium salts identity under CAS 68037-49-0.  
   https://www.industrialchemicals.gov.au/sites/default/files/Secondary%20alkane%20sulfonates%20%28SAS%29_Human%20health%20tier%20II%20assessment.pdf
5. **Clariant Hostapur SAS 60 product information** identifies the named product as C14-17 secondary alkyl sulfonate sodium salt and a 60% paste. The older product bulletin provides an INCI name and indicative properties but does not bind a CAS to the catalog's product code or lot.  
   https://www.clariant.com/en/Solutions/Products/2025/06/12/13/50/HOSTAPUR-SAS-60  
   https://atamankimya.com/Assets/Documents/Hostapur_SAS_60_acar_kimya_20151209_171100.pdf

### Assessment
The sources do **not** justify silently changing the catalog CAS from 68037-49-0 to 97489-15-1. KCIA supports the existing pair, while FDA GSRS and the Australian assessment document a distinct C14-17 secondary-alkane sulfonate identity/CAS association. The FDA record is specifically a named SAS-30 mixture and cannot be automatically transferred to an SAS-60 record. This is a genuine unresolved source-level identifier conflict requiring exact manufacturer/product-code documentation.

Disposition:
- Keep CAS 68037-49-0 in the catalog unchanged for now.
- Flag all four SAS-60 variants as CAS_INCI_ALTERNATE_IDENTIFIER_CONFLICT_REQUIRES_SOURCE_RESOLUTION.
- Do not promote to identity SSOT or grade approval.
- Keep activeDefault = 60 and HLB 13.0 as catalog assertions, not measured assay or validated product constants.
- Anionic functional routing may remain as a broad chemistry classification, but it does not resolve CAS, supplier identity, or formula applicability.

## 3. MICG-085 — SLES: generic CAS supported, commercial grade scope unresolved

### Evidence
1. **KCIA Sodium Laureth Sulfate dictionary entry** lists several generic CAS associations, including 68585-34-2, 68891-38-3 and 9004-82-4.  
   https://kcia.or.kr/cid/search/ingd_view.php?no=1051
2. **KCIA Sodium C10-16 Alketh-2 Sulfate entry** specifically lists CAS 68585-34-2.  
   https://kcia.or.kr/cid/search/ingd_view.php?no=17588
3. **Kensing Sensapol ES-2 K/MB technical information** is for a named 2EO Sodium Laureth Sulfate product and lists both 68585-34-2 and 68891-38-3 in its CAS section. Its measured specification is specific to that product, not the catalog SLES-70/28 lots.  
   https://www.rossorg.com/wp-content/uploads/2021/05/Technical-Information_Sensapol-ES-2-K-MB_03-21.pdf
4. **Supreme Petro Chemicals distributor TDS** describes SLES 70%, 2 mole EO and lists CAS 9004-82-4 / 68585-34-2 while naming Galaxy Surfactants and Ultramarine & Pigments as manufacturers. This is distributor-published information and does not establish the user's catalog supplier or batch.  
   https://www.supremepetrochemicals.com/documents/tds/spc-sles-liquid-paste-tds.pdf

### Assessment
CAS 68585-34-2 is a supported generic/family association for Sodium Laureth Sulfate and is specifically listed by KCIA for Sodium C10-16 Alketh-2 Sulfate. The evidence does not justify replacing it with 68891-38-3 or 9004-82-4 as a universal correction. SLES is an ethoxylated alkyl sulfate family; commercial identity depends on alkyl-chain distribution, EO distribution, active matter, carrier/salt content, and supplier product specification.

Disposition:
- Retain catalog CAS 68585-34-2 as a supported generic association, with scope limitation.
- Do not claim it uniquely identifies every SLES commercial grade.
- Keep SLES-70 and SLES-28 as distinct concentration/form variants.
- Do not infer exact EO distribution from the generic INCI label alone.
- activeDefault values 70 and 28 are catalog defaults, not lot assays.
- Supplier-grade and lot approval remain unestablished.

## 4. Cross-group disposition

| Candidate group | Records | Identity finding | Auto-correction | Grade/lot approval |
|---|---:|---|---:|---:|
| MICG-073 SAS-60 | 4 | Alternate CAS assignments unresolved | 0 | 0 |
| MICG-085 SLES | 8 | Generic CAS association supported; grade scope limited | 0 | 0 |
| **Total** | **12** | **2 groups reviewed** | **0** | **0** |

## 5. Required evidence to close remaining gates

For SAS-60: exact manufacturer legal name, product code, current TDS/SDS, CAS/INCI statement for that product, active matter method/basis, composition/chain distribution where disclosed, and lot-specific CoA tied to the delivered batch.

For SLES-70 and SLES-28 separately: exact manufacturer/product code, alkyl-chain and EO distribution, current TDS/SDS, active matter and salt/unsulfated matter specifications, analytical methods, and lot-specific CoA. A supplier TDS for SLES-70 must not be copied onto SLES-28 unless the supplier explicitly confirms the same grade family/specification.

## 6. Reproducibility and fail-closed controls

The accompanying CSV preserves source scope and separate identity/grade dispositions. Regression tests assert:
- two candidate groups and 12 catalog variants;
- SAS alternate CAS conflict remains unresolved and no auto-correction is made;
- SLES generic CAS is retained without treating it as unique grade identity;
- SAS routing remains anionic but includes the unresolved CAS warning;
- no supplier grade or lot assay is promoted.

**Phase 4B remains OPEN. Phase 5 remains LOCKED.** This source audit does not qualify any commercial material or approve formula applicability.
