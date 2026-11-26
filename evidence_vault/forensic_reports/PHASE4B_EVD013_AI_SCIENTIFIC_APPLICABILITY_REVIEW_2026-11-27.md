# EVD-013 — AI scientific applicability review

**Review date:** 2026-11-27  
**Source:** Izawa, T., James, L. A. & Yethiraj, A. (2026), “The decay of saline surfactant foams: a study at macroscopic and bubble scales”, *Royal Society Open Science* 13:251765. DOI: 10.1098/rsos.251765.  
**Supplementary record:** the article points to Figshare collection DOI 10.6084/m9.figshare.c.8304092. The previously recorded numeric identifier 31314542 is incorrect: it resolves to PubMed PMID 31314542 for an unrelated 2019 physiology paper, not to this foam-study supplementary material. The collection's individual files and file-level rights still require exact identification.  
**Review type:** independent AI literature/mathematical review; not an author re-analysis of raw video or Igor Pro source data.

## 1. Executive decision

**Disposition: SCIENTIFIC REVIEW COMPLETE — REFERENCE ONLY / NOT A VALIDATION DATASET.**

The article provides a useful mechanistic and measurement-method reference for saline foams made with the nonionic surfactant Triton X-100. It does not validate detergent formulation predictions for BrilL Fresh or a general laundry/dishwashing product. Its salinity, surfactant chemistry, foam generation, vessel geometry, imaging, and observation window are specific to the paper.

Do not ingest graph-digitized values as raw experimental measurements. Do not derive a universal foam half-life from this paper. The authors explicitly describe non-exponential, logarithmic long-time foam-height decay and state that half-life is not a meaningful summary of that long-time regime.

## 2. Source-derived experimental conditions

- Surfactant: Triton X-100, nonionic.
- Surfactant concentration: 0.0047 ± 0.0002 mol L⁻¹, described as 0.3 wt% above the first CMC.
- Salt system: five salts mixed to mimic ocean brine.
- Salinity conditions span fresh water through 107 g kg⁻¹ reservoir-brine-like condition; reported values include 0, 7, 35 and 107 g kg⁻¹.
- Foam solution volume: 50 mL.
- Macroscopic foam drainage: four replicates per salinity.
- Bubble-scale measurements: bubble cross-sectional area tracked in a fixed region of interest; individual-trial data are shown in supplementary figures.
- Macroscopic measurements extend to approximately 90,000 s (25 h).
- Bubble area analysis uses a linear range through 5,000 s; bubble counts/statistics become poor at later times, especially beyond 20,000 s.

## 3. Mathematical model review

### 3.1 Long-time macroscopic foam height

The paper fits regime III with:

    F(t) = F(1) − J_mean log10(t)

where J_mean has units of mm per log10 time decade. This is a logarithmic relaxation, not a first-order exponential law.

The extrapolated zero-height time follows:

    log10(t_final) = F(1) / J_mean

and therefore:

    t_final = 10^[F(1)/J_mean]

Dimensional check: F(1) and J_mean are both expressed in mm (with J_mean per decade), so their ratio is a dimensionless number of decades. The resulting t_final inherits the time unit used to define the logarithm; implementation must normalize t to a stated reference unit (the paper's equation uses t in seconds). Never exponentiate a dimensional quantity or silently switch seconds/minutes.

The authors state the logarithmic regime begins around 12,000 s, after initial drainage (0–2,000 s) and a middle regime with sporadic collapse events (2,000–12,000 s). A single fit across all three regimes would be physically inappropriate.

### 3.2 Bubble-scale coarsening proxy

The paper fits:

    <A(t)> = <A0> + K_mean t

with K_mean in mm² s⁻¹. Reported approximate values are 1.15×10⁻³ mm² s⁻¹ for salinities 0–35 g kg⁻¹, and about half that at 107 g kg⁻¹. The highest-salinity reduction is described as approximately 40% in the discussion, while the approximate plotted comparison is around one-half; retain this as an approximate reported result, not an exact calibrated coefficient.

The article relates linear area growth to a von Neumann-type coarsening law, but it also notes that the bubble statistics are limited and that the magnitude of the high-salinity reduction cannot be justified fully from measured viscosity/surface-tension changes alone. Therefore K_mean is a source-specific descriptive observable, not a universal coarsening constant.

### 3.3 Half-life

The article specifically warns that foam height is non-exponential and that t₁/₂ falls in regime II rather than the long-time logarithmic regime III. Do not train or validate a single-exponential foam half-life engine against the paper's long-time data. If a product specification requires half-life, measure it directly under a predeclared protocol and report the operational definition (initial foam height/volume, threshold, sampling interval, replicate count).

## 4. Chemical and formulation transfer limits

1. Triton X-100 is nonionic. The article does not test LAS, SLES, AOS, AES, APG, betaines, amine oxides, enzyme-containing detergent, builders, soil load, or commercial fragrance.
2. The five-salt synthetic brine is not equivalent to Mumbai municipal water hardness. Salinity in g kg⁻¹ is not interchangeable with Ca²⁺/Mg²⁺ hardness in mg L⁻¹ as CaCO₃.
3. The highest salinity condition (107 g kg⁻¹) is far outside ordinary household wash-water conditions. It cannot be used as a household detergent performance target.
4. A foam persistence result does not establish detergency, grease removal, fabric compatibility, rinsability, residue, or consumer preference.
5. The experimental geometry and foam-generation protocol must be reproduced before comparing a new formulation.

## 5. What can safely inform Formula Expert

Permitted as qualitative design guidance:
- Foam stability is multi-mechanistic: drainage, coalescence and coarsening are distinct processes.
- Foam height and bubble-size evolution are different observables; bubble-scale data may detect changes earlier.
- A logarithmic late-time regime can occur; the engine must not assume exponential decay universally.
- Salinity/electrolyte composition can affect foam persistence in a surfactant-specific way.

Not permitted from this source:
- Universal numeric foam half-life coefficients.
- Numeric prediction labels for the current detergent formulations.
- Laundry/dishwash performance scores or surfactant ranking.
- Direct calibration of ENG-005 or any finished-formula performance engine.
- Transfer of the paper's salt response to hardness chelation or builder optimization.

## 6. Evidence quality and data limitations

The paper reports four macroscopic replicates and supplies supplementary analysis files/figures. The article's own supplementary-material link resolves to Figshare collection DOI 10.6084/m9.figshare.c.8304092. The prior source-register value 31314542 was a mistaken identifier (it is a PubMed PMID for an unrelated paper). The exact collection item/file list, downloadable bytes, and item-level rights have not yet been independently retrieved. No repository SHA-256 is recorded. The supplementary analysis material is not established here as a raw, machine-readable replicate time-series dataset. Therefore no exact replicate-level regression, confidence interval, residual analysis, or independent parameter refit is claimed.

The paper reports that the mean bubble area relation is approximately linear to 5,000 s and that later bubble counts become inadequate. This limits the supported fit window and should be encoded as a quality boundary if this source is ever represented in a structured dataset.

## 7. Reproducible checks for future use

If exact source data become available, require:
- preserve the original four replicate series separately;
- retain time in seconds and foam height in mm;
- predefine regime boundaries rather than selecting them to improve fit;
- fit regime III only and report slope, intercept, residuals, confidence interval and replicate-level variation;
- verify t_final calculation from the fitted intercept/slope and record time units;
- fit bubble area only over the source-supported time window and retain per-trial bubble counts;
- do not convert approximate plotted values into exact labels.

## 8. Final status

- Scientific identity and method interpretation: **AI REVIEWED**.
- Mathematical form and units: **CHECKED**.
- Applicability boundary: **CLOSED — REFERENCE ONLY**.
- Raw replicate refit / independent numeric labels: **NOT ESTABLISHED**.
- Correct supplementary collection/file identity, source bytes, item-level license and SHA-256 in repository: **NOT COMPLETE — identifier correction required**.
- Finished-formula engine validation: **NOT APPROVED**.

No further numeric inference is justified from the current inspected source. A later update requires the exact supplementary source bytes or a new, independently measured detergent experiment.
