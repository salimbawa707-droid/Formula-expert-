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

For all 11 unique composition cases (12 displayed numeric row entries because pure LAS is duplicated across Tables 1 and 2), recalculation using A = 10^16 / (Γ × N_A), N_A = 6.02214076 × 10^23 mol−1, reproduces the reported integer Å² values within rounding.

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


## 3B. Independent Gibbs-factor adjudication (2026-11-27; external literature + dimensional recalculation)

**Disposition: the pure-LAS discrepancy is resolved as a source-method inconsistency for interpretation; the author's actual calculation workflow remains unconfirmed.** No author response is claimed or fabricated.

### Governing conditions and independent sources

The surface-tension method for a 1:1 ionic surfactant has two distinct limiting cases: (a) n = 1 when an excess common, non-surface-active electrolyte/counterion is present; (b) n = 2 for an ionic surfactant without excess electrolyte, including the deionized-water case. Brusseau (2020; *Water Research* 190, 116778; DOI 10.1016/j.watres.2020.116778) explicitly states this distinction and gives Γ = -(1/xRT)·∂γ/∂ln C, with x=2 for ionic surfactant without excess electrolyte. This is independent literature, not a statement from Malihi et al. [https://pmc.ncbi.nlm.nih.gov/articles/PMC7856177/]

For ionic/nonionic mixtures, a universal n=2 correction is not justified. Hua & Rosen (1982; *Journal of Colloid and Interface Science* 87(2), 469–477; DOI 10.1016/0021-9797(82)90344-7) derived a composition-dependent coefficient for ionic/nonionic mixtures; their abstract reports values near 1 under some packing conditions, rising toward 1–2 with closer ionic packing and potentially below 1 for some anionic/nonionic mixtures at large molecular areas. Therefore mixed rows must remain source-reported and method-qualified unless raw concentration series and the authors' exact path are available. [https://doi.org/10.1016/0021-9797(82)90344-7]

### Recalculation of the duplicated pure-LAS row

Inputs transcribed from both Table 1 and Table 2: T = 23.58 °C = 296.73 K; dγ/dlog10(C) = −15.9 mN·m⁻¹ per decade = −0.0159 N·m⁻¹ per decade; R = 8.314462618 J·mol⁻¹·K⁻¹; ln(10) = 2.302585093; N_A = 6.02214076×10²³ mol⁻¹.

Using Γ = −[1/(nRT)]·dγ/dln(C) = −[1/(nRT ln(10))]·dγ/dlog10(C):

| Quantity | Source-reported / implied n=1 arithmetic | Independent n=2 case (no excess electrolyte) |
|---|---:|---:|
| n | 1 | 2 |
| Γ (mol·cm⁻²) | 2.7989×10⁻¹⁰ (source prints 2.82×10⁻¹⁰) | 1.3994×10⁻¹⁰ |
| A = 1/(Γ·N_A) (Å²) | 59.33 (source prints 59) | 118.66 |

The source's Γ/A pair is internally consistent with its slope to rounding, but it is the n=1 result. Under the paper's stated measurement matrix (distilled/deionized water, no excess common ion described), the independently supported ionic-surfactant case is n=2. Accordingly, **118.7 Å² is a calculated theoretical re-evaluation under the stated n=2 assumption, not an observed or author-corrected value**. Preserve the published 59 Å² in the transcription and retain both values with their provenance.

### Back-calculated coefficient diagnostic across the tables

Using the displayed rounded slope and Γ values, n_eff = |slope|×10⁻³ / [ln(10)·R·T·(Γ×10⁴)] was back-calculated for the 11 numeric rows. Values cluster at approximately 0.993–1.003 (rounding-level spread). This demonstrates that the printed Γ values were arithmetically generated using n≈1 throughout. Interpretation differs by row: pure nonionic AE rows are consistent with n=1; mixed ionic/nonionic rows may have a composition-dependent effective coefficient and cannot be globally corrected from these rounded tables; pure LAS in deionized water conflicts with the stated n=2 condition. This is a strong numerical diagnosis of the table calculation convention, not proof of the authors' intent.

### Final EVD-019 handling

1. Close the narrow **pure-LAS n-factor interpretation blocker** as independently adjudicated: use n=2 for any theoretical re-evaluation of the pure-LAS distilled/deionized-water row, while retaining the paper's printed Γ/A as source-reported values with a method warning.
2. Keep all mixed LAS/AE Γ/A values as reported, tagged **effective-n method not independently reconstructed**. Do not force n=2 onto mixtures and do not treat n≈1 back-calculation as proof that the mixed-mixture coefficient is thermodynamically correct.
3. No raw surface-tension concentration series or complete calculation ledger is available, so no mixed-system refit, Rubingh fit, parameter calibration, or engine validation is authorized.
4. Author clarification was not received. It is no longer required to establish the standard theoretical result for the pure-LAS deionized-water case, but would still be useful to document the authors' actual calculation convention.
5. Independent human transcription/review and commercial reuse clearance remain separate open gates. EVD-019 is not fully closed for Phase 4B and does not authorize commercial ingestion.

**Reproducibility status:** dimensional recalculation independently reproduced in this audit; no raw-data refit performed; no experimental observation changed.
