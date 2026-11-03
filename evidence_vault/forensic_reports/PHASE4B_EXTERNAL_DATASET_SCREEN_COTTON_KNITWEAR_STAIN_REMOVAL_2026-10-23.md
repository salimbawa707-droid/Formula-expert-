# Phase 4B External Dataset Screen — Cotton Knitwear Stain-Removal Study

**Screen date:** 2026-10-23  
**Decision:** `SOURCE_BACKED_REFERENCE_ONLY_RAW_DATA_NOT_AVAILABLE`  
**Phase gate:** Phase 4B OPEN; Phase 5 LOCKED

## Source identity

- Šantak, V.; Pušić, T. (2025). “Cotton Knitwear as a Carrier of Specific Stains for Evaluation of Temperature-Specific Behavior of Detergents.” *Textiles* 5(4), 50.
- DOI: https://doi.org/10.3390/textiles5040050
- Publisher page: https://www.mdpi.com/2673-7248/5/4/50
- Article date: 15 October 2025.
- Publisher page identifies the work as open access; confirm the article's displayed CC BY licence and any third-party material notices before reusing individual figures or images.

## What the source supports

The study reports detergent washing tests on a cotton knitwear stain carrier with 15 stain types plus a blank position. The tests compare seven detergent products (six branded products plus a reference detergent) at 60 °C and 90 °C. The paper reports detergent composition measurements, reflectance-based performance at 460 nm, total washing performance (TWP), and specific washing performance (SWP).

Reported experimental conditions include powder detergent at 5 g/L, bath ratio 1:5, tap-water hardness 340 ppm, and four randomly selected measurement positions per stain. The article defines the stain reflectance change as ΔR460 = Rw - R0, where Rw is reflectance after washing and R0 is the before-wash reflectance. TWP is reported as the sum of post-wash reflectance values for positions 2–16 at each temperature.

## Critical access and evidence limitations

The article's Data Availability Statement says the original contributions are included in the article and further inquiries can be directed to the corresponding author. It does **not** identify a public raw-data repository. The paper's tables and reported summary statistics are source-backed published summaries, not a complete raw replicate-level dataset.

Therefore:
- Do not ingest summary table cells as independent raw measurements.
- Do not fabricate missing replicate-level values or infer them from means, standard deviations, charts, or plotted bars.
- Do not label this a fully open raw dataset until raw values, data dictionary, and reuse permissions are independently obtained.
- Do not use the paper's detergent brand labels or ingredient declarations as verified full formulations.
- The study's conditions (90 °C, 340 ppm hardness, 5 g/L) differ materially from many consumer-use scenarios; any use must preserve domain and applicability limits.
- Article-level performance summaries cannot independently validate the Formula Expert's predicted cleaning scores or CPI.

## Scientific utility assessment

| Intended use | Decision | Reason |
|---|---|---|
| Source-backed scientific context and protocol comparison | Eligible | Methods and published results are described in the article |
| Literature-derived reference values with table/page provenance | Potentially eligible after careful extraction and independent review | Published table summaries only; preserve original metric and aggregation level |
| Raw observation training/validation dataset | Not eligible yet | Public raw replicate-level values are not provided by the stated data-availability route |
| Formula-specific cleaning-score/CPI calibration | Not eligible | No validated mapping from the paper's summarized R460/TWP/SWP data to the app's score system |
| LAB_VALIDATED promotion | Not eligible | No independent held-out dataset validation of an app model has been performed |

## Next reproducible action

Request the underlying measurement table and measurement-level metadata from the corresponding author. If obtained, archive the original file unchanged, record its SHA-256, document the permission/licence in writing, map each column and unit, and create a separate source-specific validator plus independent transcription/review gate. Until then, retain this as literature evidence only and continue screening for genuinely downloadable, reuse-compatible raw cleaning-performance datasets.

## References

1. Šantak, V.; Pušić, T. (2025), publisher article: https://www.mdpi.com/2673-7248/5/4/50
2. DOI resolver: https://doi.org/10.3390/textiles5040050
3. Methods and reflectance definitions are taken from the cited article; this screen does not reproduce its full text or claim to have accessed the authors' underlying raw files.
