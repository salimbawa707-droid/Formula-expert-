# EVD-019 — exact numerical table transcription

**Source:** Farrokh B. Malihi, A. Khaani, N. Changizi and B. Adeeb, “Evaluation of Physico-Chemical Interactions between Linear Alkylbenzene Sulfonate (LAS) and Alcohol Ethoxylates,” *Tenside Surfactants Detergents* 48(5), 395–399 (2011), DOI: 10.3139/113.110145.  
**Full-text source inspected:** author-uploaded ResearchGate PDF, five pages.  
**Tables visually checked:** PDF page 4 (printed page 4), screenshot comparison against extracted text.  
**Rights:** REVIEW_PENDING; Carl Hanser copyright. The PDF is not copied into the repository and its tables must not be redistributed commercially without permission.  
**Independent human review:** NOT PERFORMED. This is an AI transcription; a second human must independently verify it before formal closure.

## 1. Table 1 — LAS / AE-7EO surface-active properties

**Source temperature:** 23.58 °C. **CMC:** mg/L. **Gmin:** mN/m. **dG/dLog C:** source-reported slope; the methods equation implies dyn/cm per log10 concentration interval (numerically mN/m per decade). **Γ:** mol/cm². **A:** Å².

| LAS (%) | AE-7EO (%) | CMC (mg/L) | Gmin (mN/m) | dG/dLog C | Γ (mol/cm²) | A (Å²) |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 0 | 750 | 35 | −15.9 | 2.82 × 10⁻¹⁰ | 59 |
| 87.5 | 12.5 | 71 | 32 | −15.1 | 2.67 × 10⁻¹⁰ | 62 |
| 75 | 25 | 21 | 32 | −15.0 | 2.65 × 10⁻¹⁰ | 63 |
| 62.5 | 36.5 | 17 | 32 | −11.5 | 2.03 × 10⁻¹⁰ | 82 |
| 50 | 50 | 15 | 32 | −8.30 | 1.46 × 10⁻¹⁰ | 114 |
| 25 | 75 | 10 | 30 | −6.95 | 1.22 × 10⁻¹⁰ | 136 |
| 0 | 100 | 16 | 29 | −14.5 | 2.56 × 10⁻¹⁰ | 65 |

**Source anomaly preserved:** the fourth composition row is printed as 62.5% LAS + 36.5% AE-7EO (sum = 99.0%). It is not silently normalized to 37.5%.

## 2. Table 2 — LAS / AE-2EO surface-active properties

**Source temperature:** 23.5 °C. Units and column definitions are the same as Table 1.

| LAS (%) | AE-2EO (%) | CMC (mg/L) | Gmin (mN/m) | dG/dLog C | Γ (mol/cm²) | A (Å²) |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 0 | 750 | 35 | −15.9 | 2.82 × 10⁻¹⁰ | 59 |
| 87.5 | 12.5 | 100 | 27 | −13.4 | 2.37 × 10⁻¹⁰ | 70 |
| 75 | 25 | 26 | 27 | −12.9 | 2.29 × 10⁻¹⁰ | 73 |
| 50 | 50 | 13 | 27 | −10.6 | 1.88 × 10⁻¹⁰ | 88 |
| 25 | 75 | 3.6 | 27 | −12.3 | 2.18 × 10⁻¹⁰ | 76 |
| 0 | 100 | INSOLUBLE IN WATER | — | — | — | — |

## 3. Transcription checks and limitations

1. The table values above were checked against the visible table image on PDF page 4, not merely copied from OCR.
2. Table composition basis is not explicitly printed in the table heading. The methods section says mixtures were prepared at different mole fractions of nonionic surfactant. Preserve the authors’ percent labels; do not reinterpret them as weight percent.
3. The 62.5/36.5 AE-7EO row is transcribed exactly as printed despite the 1.0% total deficit.
4. The pure AE-2EO row is reported as “insoluble in water”; no numeric CMC or other surface parameters are supplied.
5. The >370 ppm Ca²⁺ statement in Section 3.2 is a test-specific threshold for the stated 12% LAS / 3% AE-7EO formulation at 0.15% total surfactant use level. It is not a universal hardness tolerance.
6. The paper’s detergent tests used 2 g/L detergent, 45 °C, and 100 / 350 ppm Ca²⁺ water-hardness conditions, with a fixed powder chassis reported as 11% total surfactant, 41% STPP, 35% sodium sulfate, 6% soluble silicate and 6% sodium carbonate (listed total 99%; the remaining 1% is not inferred). This is not a phosphate-free chassis. Do not treat the surface-tension tables as finished-formula performance predictions or transfer detergency results directly to phosphate-free formulas.
7. The article reports βᶦ = −5.57 for the 75% LAS / 25% AE-7EO system and Xᴹ₁ = 0.33 for LAS in the mixed micelle. These are source-reported model results, not independently refitted values.

## 3A. Second-pass AI arithmetic and method audit (2026-11-27)

A second AI review compared the transcribed table values with the accessible author-uploaded full-text table extraction. All 7 Table 1 rows and 5 numeric Table 2 rows agree with the extracted text; the pure AE-2EO entry remains qualitative (“insoluble in water”). This is an AI text/arithmetic cross-check, not a second human review or a fresh pixel-by-pixel PDF inspection. The direct PDF download endpoint was not independently retrievable in this pass.

For all 11 rows with numeric Γ and A, recalculation using A = 10^16 / (Γ × N_A), N_A = 6.02214076 × 10^23 mol−1, reproduces the reported integer Å² values within rounding.

**Methodological issue requiring author clarification:** the methods state n = 1 for dilute nonionic surfactants or 1:1 ionic surfactants with excess common non-surfactant ion, and n = 2 for 1:1 ionic surfactants without other solutes. Surface-tension measurements are described in distilled/deionized water without an added excess common ion. However, the pure-LAS row reports Γ = 2.82 × 10⁻¹⁰ mol/cm² and A = 59 Å², which numerically correspond approximately to n = 1. Applying n = 2 to the same slope gives approximately half Γ and double A (~118 Å²). The source does not explain the selected n for pure LAS or the mixed ionic/nonionic rows. Keep the published values unchanged, flag Γ/A as methodologically unresolved, and do not silently substitute recalculated values as observations.

AE-2EO mixed CMC values decrease across the numeric blend rows, although the authors report no corresponding calcium-solubility benefit under their conditions. Avoid a blanket statement that AE-2EO has “no benefit.” The fixed detergency powder chassis includes 41% STPP, so the results do not directly validate phosphate-free formulas.

See PHASE4B_EVD019_AI_INDEPENDENT_REVIEW_2026-11-27.md. This second AI review is not independent human approval; rights remain REVIEW_PENDING, the source PDF remains NOT_ARCHIVED, and engine validation remains NOT_ESTABLISHED.

## 4. Gate disposition

- Numerical table transcription: **AI visual check recorded in the first transcription pass; second AI text/arithmetic cross-check complete for Tables 1 and 2**.
- Registry numerical-inspection status: **NUMERICALLY_INSPECTED**.
- Independent second-human transcription: **PENDING**.
- Source-file archival and SHA-256: **NOT DONE**; source redistribution rights remain pending.
- Commercial data ingestion: **BLOCKED** until rights are cleared.
- Engine validation: **NOT ESTABLISHED**. No matched formula prediction/observation pair is created by this transcription.

**Sources:** https://www.researchgate.net/publication/275987303_Evaluation_of_Physico-Chemical_Interactions_between_Linear_Alkylbenzene_Sulfonate_LAS_and_Alcohol_Ethoxylates and DOI https://doi.org/10.3139/113.110145.
