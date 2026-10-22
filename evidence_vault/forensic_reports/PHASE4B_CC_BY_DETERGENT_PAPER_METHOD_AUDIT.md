# Phase 4B — CC BY Detergent Paper Method and Data-Readiness Audit

**Audit date:** 2026-10-23  
**Source:** Ghosh, Nandi, Barik, Bhukta, Malik & Hazra (2022), “Cleansing Action of Some Daily Useable Detergents,” *Journal of Science and Technology*, 7(8), 9–19. DOI: 10.46243/jst.2022.v7.i08.pp09-19.  
**Article:** https://www.jst.org.in/index.php/pub/article/view/816  
**PDF:** https://www.jst.org.in/index.php/pub/article/download/816/744/1445  
**Licence shown on article page:** Creative Commons Attribution 4.0 International (CC BY 4.0). Preserve attribution and licence notices.

## Decision

**Status: SOURCE_REVIEWED; NOT NUMERICALLY INGESTED; NOT ENGINE-ELIGIBLE.**

The paper contains detergent-specific experimental methods and plotted outcomes, so it is a useful lead. It does not provide a clearly downloadable machine-readable raw-results table in the inspected article. Figures are plots, not exact source observations. Do not silently transcribe graph positions as exact measurements, and do not use this source as proof of app accuracy or as a laboratory certificate for the user's own formulations.

## Experimental scope stated by the paper

- Products: four market detergents, coded S1 (Surf Excel), S2 (Sunlight), S3 (Safed), and S4 (Sayni).
- Water media: distilled water (DW), tap water (TW), and ground water (GW).
- Reported solution concentrations: surface tension and pH at 0.1% w/v; CMC studied across 0.01–0.1%; foam stability at 0.1%; hard-water/precipitate tests at 2%; emulsion tests at 1%.
- pH: instrument calibrated with pH 4.0 and 9.2 buffers; measured at 25 °C.
- Foam: 10 mL solution shaken 10 times; time for disappearance of 2 mm foam width recorded.
- Hard-water test: 15 mL of filtered 2% solution; 10 drops of 5% MgCl2, FeCl3, or CaCl2 solution added separately; precipitate filtered, dried and weighed.
- Emulsion test: 5 mL of 1% solution plus 0.5 mL mustard oil or petrol, shaken for one minute; time until solution became clear recorded.
- The paper's main conclusion ranks the tested commercial products S1 > S2 > S3 > S4 and reports better results in distilled water than tap/ground water. This is the authors' interpretation for their study, not a universal detergent ranking.

## Material limitations and internal consistency flags

1. **No raw data table or replicate counts identified.** The paper does not clearly report replicate count, variance, standard deviations, uncertainty intervals, or raw per-observation values for the plotted tests. These must remain unknown, not inferred as zero or one.
2. **CMC narrative conflicts with its own cleansing ranking.** The paper states the CMC/surface-tension order as S4 > S3 > S2 > S1 while separately claiming cleansing order S1 > S2 > S3 > S4. The plotted graph and text require independent interpretation; do not turn the prose ranking into labels without checking source figure semantics.
3. **Foam-collapse interpretation is not a direct cleaning measurement.** The method measures time for 2 mm foam disappearance. The discussion links shorter collapse time to better cleansing, while many consumer-facing interpretations treat longer-lived foam as desirable. Neither foam height nor collapse time alone is a validated direct measure of soil removal. Preserve this as a separate response variable.
4. **Hard-water test is an operational precipitation test, not a standardised water-hardness challenge as fully specified.** The article reports drop counts and reagent concentrations but not drop volume, final ion concentration, water hardness in mg/L as CaCO3, or a standardised reference protocol. Preserve the source's exact protocol and flag these missing details.
5. **Emulsion method's endpoint is “time until clear.”** This is an operational endpoint, not necessarily conventional emulsion stability. Do not relabel it as stability half-life or a general cleaning score.
6. **Water provenance/composition is under-specified in the inspected methods.** Tap and ground water mineral composition/hardness values are not given in the extracted methods. Do not map these to a known hardness class.
7. **Graph-derived values would be estimates.** If a later digitization task is approved, every point must carry figure/page, axis calibration, digitization method, estimated uncertainty, and GRAPH_DIGITIZED_ESTIMATE provenance. Keep it separate from SOURCE_REPORTED_NUMERIC and raw measured observations.
8. **Product identity and formulation are not characterised.** Brand names alone do not establish ingredient composition, batch, market/date, or equivalence to the user's formula. This prevents ingredient-level causal claims.

## Safe next use

- Retain the paper as a **source-backed qualitative/method reference** for detergent solution testing.
- Do not import approximate figure readings into the validation dataset until a separate graph-digitization audit records axis calibration and uncertainty.
- If digitized data are eventually used, limit them to exploratory contextual comparison and do not use them as an independent validation set unless sample/replicate provenance, comparability, and leakage controls are independently resolved.
- Keep response families separate: pH, surface tension, CMC, foam-collapse time, precipitate mass by reagent, and clear-point time for mustard oil/petrol.
- Do not derive a composite “cleaning accuracy” score from these outcomes without a scientifically justified, pre-specified model and matched direct cleaning outcomes.

## Evidence references

- Article landing page and stated CC BY 4.0 licence: https://www.jst.org.in/index.php/pub/article/view/816
- Full article PDF: https://www.jst.org.in/index.php/pub/article/download/816/744/1445
- DOI: https://doi.org/10.46243/jst.2022.v7.i08.pp09-19
- JMP detergent-cleaning candidate remains separately blocked for commercial ingestion pending explicit reuse-rights review: https://www.jmp.com/en/academic/case-study-library/detergent-cleaning-effectiveness

## Phase gates

- Phase 4B: **OPEN**.
- Phase 5: **LOCKED**.
- LAB_VALIDATED promotion: **NOT JUSTIFIED**.
- 95–98% accuracy claim: **NOT ESTABLISHED**.
