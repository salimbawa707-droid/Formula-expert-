# Phase 4B Identity Source Audit — Batch 4: SAS and SLES

Date: 2026-11-28  
Review route: AI dual-pass source and implementation review; no human approval or laboratory validation is claimed.  
Scope: MICG-073 (SAS-60; 4 catalog records) and MICG-085 (SLES-70/28; 8 catalog records).

## 1. Executive result

Two candidate groups and 12 catalog variants were source-screened. Neither group is promoted to supplier-grade or lot identity. One group has a family-scope ambiguity requiring an exact CAS/EC/supplier crosswalk; the other has supported family-level CAS/INCI evidence but unresolved chain/EO distribution and commercial-grade provenance.

| Group | Records | Finding | Disposition |
|---|---:|---|---|
| MICG-073 — SAS-60 | 4 | CAS 68037-49-0 is associated by ECHA with C10-18 alkane sodium salts. ECHA separately identifies C14-17-sec-alkane sodium salts as EC 307-055-2. Clariant confirms Hostapur SAS 60 as C14-17 secondary alkyl sulfonate sodium salt, 60% paste, but the public page does not expose its CAS. | Ambiguous CAS/EC scope; do not auto-correct or promote. |
| MICG-085 — SLES | 8 | ECHA supports CAS 68585-34-2 for C10-16 ethoxylated sodium alkyl sulfates with 1–2.5 EO and includes Sodium Laureth Sulfate naming. Separate named-supplier TDS examples show SLES 70 at 70±2% and SLES 28 at 28±1%. | Family identity supported; exact catalog EO/chain distribution, supplier grade and lot assays remain unverified. |

## 2. MICG-073 — Sodium C14-17 Sec-Alkyl Sulfonate

### Evidence

1. ECHA substance infocard, CAS 68037-49-0. The listed substance is “Sulfonic acids, C10-18-alkane, sodium salts” (EC 268-213-3). This is a broad C10–18 sodium alkane sulfonate family identity, not an exact supplier declaration for a C14–17 secondary grade. Source: https://echa.europa.eu/substance-information/-/substanceinfo/100.061.994
2. ECHA 2023 compliance-check document. It separately names “Sulfonic acids, C14-17-sec-alkane, sodium salts” with EC/List number 307-055-2. The publicly available document does not provide a CAS number for that specific EC identity in the inspected header. Source: https://chem.echa.europa.eu/api-activity-list/v1/dossierEvaluation/documents?name=039ae7a57d174591afe15e448d1ca744_final_reg_public_cch_d_2114641371-57-01_en.pdf
3. Clariant HOSTAPUR SAS 60 product page. Clariant identifies the named product as C14–17 secondary alkyl sulfonate, sodium salt and says it is supplied as a 60% paste. The page's product documentation is login/permission restricted and does not publicly display a CAS. This evidence is specific to Hostapur SAS 60, not the catalog's four SAS-60 variants. Source: https://www.clariant.com/en/Solutions/Products/2025/06/12/13/50/HOSTAPUR-SAS-60
4. Australian NICNAS/industrial chemicals assessment. The 2014 assessment distinguishes CAS 68037-49-0 (C10–18 alkane sodium salts) from other secondary alkane sulfonate identities/CAS entries. This supports preserving distinctions rather than assuming CAS-only interchangeability. Source: https://www.industrialchemicals.gov.au/sites/default/files/Secondary%20alkane%20sulfonates%20%28SAS%29_Human%20health%20tier%20II%20assessment.pdf

### Interpretation

The catalog pair (CAS 68037-49-0 + INCI “Sodium C14-17 Sec-Alkyl Sulfonate”) is not proven wrong, because the broad C10–18 family range overlaps C14–17. It is also not proven exact, because authoritative sources identify a separate C14–17-sec substance under EC 307-055-2 and do not provide the CAS crosswalk in the inspected public record. The correct disposition is ambiguity requiring exact supplier confirmation—not a guessed CAS replacement.

Clariant's 60% value is a product-specific supplied-form claim for Hostapur SAS 60. It must not be transferred to sas-60, sas-60-tech, sas-60-pure, or sas-60-sol as a verified supplier/lot assay.

## 3. MICG-085 — Sodium Laureth Sulfate (SLES)

### Evidence

1. ECHA substance infocard. CAS 68585-34-2 maps to “Alcohols, C10-16, ethoxylated, sulfates, sodium salts” (EC 500-223-8), with a 1–2.5 mole ethoxylation description and Sodium Laureth Sulfate among the names. This supports family-level CAS/INCI association but not one exact chain/EO distribution. Source: https://echa.europa.eu/substance-information/-/substanceinfo/100.105.713
2. Yeser SLES 70 TDS. The named Yeser product declares CAS 68585-34-2 and active matter 70±2%, with method and other specification fields. This is a published supplier-grade example for Yeser SLES 70 only. Source: https://yeserchem.com/wp-content/uploads/2023/02/TDS-Yeser%C2%AE-SLES-70.pdf
3. Allied SLES 28 TDS. Product code ACSCSLES28 declares CAS 68585-34-2 and active matter 28±1%. This is a published supplier-grade example for Allied's product only. Source: https://alliedinds.com/download/tds_file/HpaHo47EmPh2EQGmE4OuCCGxxtUMRK0aOaossTsu.pdf
4. Supreme Petro Chemicals SLES 70 TDS. The 10 June 2026 technical sheet lists CAS 9004-82-4 / 68585-34-2 for a 70% 2-mole grade and names Galaxy Surfactants and Ultramarine & Pigments as manufacturers. It is corroborative supplier reference material, not proof of the catalog's supplier. Source: https://www.supremepetrochemicals.com/documents/tds/spc-sles-liquid-paste-tds.pdf

### Interpretation

The family identity is supported. However, CAS 68585-34-2 describes a C10–16 ethoxylated sulfate family with a stated 1–2.5 EO range. It does not prove that every catalog variant has identical C12–14 feedstock, exactly 2 EO, or matching supplier grade. Keep 70% paste and 28% liquid as separate commercial concentration/form variants. The two named supplier TDS examples must not be promoted to the catalog's actual supplier TDS or lot CoA.

## 4. Fail-closed disposition

- No CAS field is changed.
- No exact supplier/lot identity is approved.
- No active matter is promoted from a public supplier reference into a catalog lot assay.
- No SAS/SLES grade is approved for a named finished formula.
- All 12 variants remain blocked by the existing supplier evidence gate.
- Required for SAS: supplier/manufacturer, exact product code, CAS and EC declaration, chain/position distribution, current TDS/SDS, matching lot CoA and assay method.
- Required for SLES: supplier/manufacturer, exact product code, alkyl chain distribution, EO distribution, active-matter method/basis, dioxane/impurity specifications where relevant, current TDS/SDS and matching lot CoA.

## 5. Reconciliation

- Candidate groups audited in this batch: 2
- Catalog variants screened: 12
- Automatic CAS corrections: 0
- Exact supplier-grade approvals: 0
- Lot assays verified: 0

After batches 1–4, 13 of the original 119 candidate groups have received focused source audits (6 + 4 + 1 + 2); 106 groups remain in the source-audit queue. The 397/430 record-level exact-identity-SSOT gap remains a separate metric and must not be conflated with 106 candidate groups.

Phase 4B remains OPEN. Phase 5 empirical validation/calibration remains LOCKED.
