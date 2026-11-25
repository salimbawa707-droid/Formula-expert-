# ENG-005 Supplementary Source Retrieval — 2026-11-25

**Review type:** AI source-inspection report; `human_review=false`  
**Phase 4B:** OPEN  
**Phase 5:** LOCKED  
**ENG-005 scope:** measured-series analysis only; no formulation predictor.

## Sources verified

1. Primary article: Izawa, James & Yethiraj (2026), Royal Society Open Science 13(2), 251765, DOI https://doi.org/10.1098/rsos.251765.
2. Official supplementary collection DOI: https://doi.org/10.6084/m9.figshare.c.8304092.
3. Official laboratory publications page links the supplementary PDF mirror: https://softmaterials.ca/wp-content/pdf/Izawa2026_SM.pdf.
4. Primary article PDF mirror: https://softmaterials.ca/wp-content/pdf/Izawa%20et%20al%202026.pdf.

## Retrieval outcome

- The explanatory supplementary PDF mirror was accessible through the web document reader and its extracted text was inspected.
- The PDF is 9 pages and describes supplementary figures S1–S10.
- The underlying Figshare collection/API and DOI redirect were not accessible in this execution environment. A direct network request from the working container also failed with DNS resolution failure.
- The PDF bytes were not downloaded into the repository or working container. Therefore **no PDF SHA-256, byte size, or local-file claim is made**.
- The raw/processed Igor Pro data-analysis files and replicate-level time-series files remain **NOT_DOWNLOADED / UNINSPECTED**. No parser was run against those data files and no row count is claimed.

## What the accessible supplementary PDF establishes

- S1: comparison of transmission and total-internal-reflection bubble imaging.
- S2: early liquid-level behaviour over 0–500 s and estimated initial liquid fraction.
- S3: perspective correction and binarization workflow for bubble images.
- S4–S5: replicate-resolved mean bubble cross-sectional area and corresponding bubble counts for all five salinities; four trials per salinity.
- S6: initial and selected-time mean bubble-area comparison across salinity.
- S7: late-regime mean foam-height and bubble-area curves with fits.
- S8–S10: surface tension, viscosity, and density of the foaming solutions versus salinity.

The main article states five brine salinities (0, 7, 21, 35, and 107.133 g/kg), four replicate trials per salinity, and defines mean foam height as foam-top level minus liquid level. Its late logarithmic regime begins around 12,000 s for this experiment. These are study-specific details, not universal model defaults.

## Parser and fixture decision

No raw-data parser or source-backed regression fixture is added in this increment. The accessible PDF contains explanatory plots and figures, but the extracted text does not provide machine-readable replicate/time/value tables. Digitizing plots by eye would introduce uncertain values and is not an acceptable substitute for the original data files.

Once the underlying files are acquired, the ingestion must:
1. inventory every file and verify file-level license metadata;
2. compute SHA-256 from the exact downloaded bytes;
3. inspect file format and sheet/column structure before selecting parsers;
4. preserve replicate IDs, salinity, timestamps, height reference, units, and missingness;
5. reconcile replicate means/standard deviations and curves against the article and S4–S7;
6. add source-backed fixtures only after numeric transcription and independent checks.

## Separate ENG-003 lead

Zenodo 18961871 provides household washing-up-liquid solution flow curves, but the source paper says exact commercial formulations are proprietary/undisclosed. The flow curves therefore do not currently form eligible complete formula-to-measurement pairs for ENG-003. Do not train, calibrate, or claim predictive validation from these data without the missing formulation inputs.

## Gate disposition

- ENG-005 code implementation: IMPLEMENTED for measured-series analysis only.
- ENG-005 numerical validation readiness: NOT_READY.
- ENG-005 evidence coverage: 0% until source-backed numerical fixtures are created.
- ENG-003 eligible matched formula-prediction pairs: none established.
- Phase 4B: OPEN.
- Phase 5: LOCKED.

AI source inspection only; `human_review=false`. No laboratory validation, commercial detergent applicability, or predictive accuracy is claimed.
