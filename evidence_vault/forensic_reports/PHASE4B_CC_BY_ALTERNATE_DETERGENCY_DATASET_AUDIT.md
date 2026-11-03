# Phase 4B — CC BY Alternate Measured Detergency Evidence Audit

**Audit date:** 2026-10-23  
**Scope:** Follow the 2006 Tekstil PDF access failure with a separate, commercially reusable open-access source. This report records source-reported measurements and experimental conditions; it does not promote the source to formula-engine validation.

## 1. Decision summary

- **2006 Tekstil paper:** remains **BLOCKED_FOR_NUMERIC_INGESTION**. The publisher page exposes metadata and an abstract, but direct page access timed out and the ResearchGate PDF link returned 404. No numeric table values from that paper were ingested.
- **Alternate source located:** Hu et al. (2023), *Effective Detergency Determination for Single Polymeric Fibers Using Confocal Microscopy*, *Polymers* 15(15), 3314, DOI [10.3390/polym15153314](https://doi.org/10.3390/polym15153314). The publisher states CC BY 4.0, and the full text is available from the publisher/PMC. This licence permits commercial reuse with attribution and licence notices; preserve the article citation and source context.
- **Eligibility boundary:** candidate for **descriptive/screening evidence only**. It measures oil removal in a controlled single-fibre flow setup and separate cotton-fabric laundering tests; it is not a standardized multi-stain consumer-wash benchmark and does not validate the app's overall Cleaning Score, CPI, formula ranking, or prediction accuracy.
- **No engine eligibility granted.** No LAB_VALIDATED status and no 95–98% accuracy claim.

## 2. Source and licence provenance

- Full citation: Hu, Q.; Wu, J.; Qin, Z.; Wei, X.; Jiang, C.; Wu, M.; Yu, D.; Wang, J. “Effective Detergency Determination for Single Polymeric Fibers Using Confocal Microscopy.” *Polymers* 2023, 15(15), 3314.
- DOI: https://doi.org/10.3390/polym15153314
- Publisher full text: https://www.mdpi.com/2073-4360/15/15/3314
- PMC full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC10422291/
- Licence reported by publisher: Creative Commons Attribution (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/
- Data are transcribed from the article's full-text prose and reported experimental methods/results. The values below are **source-reported aggregate or approximate results**, not reconstructed raw replicates. No original image pixels were digitized and no individual replicate rows were invented.

## 3. Experimental conditions — preserve as separate protocols

### 3.1 Single-fibre confocal microscopy (CLSM)

- Oil soil: soybean oil marked with Nile Red; fibres include cotton, viscose, and polyester.
- Protein soil: pure milk marked with FITC (the paper describes a separate protein-staining procedure).
- Detergent solutions: commercial Tide Free liquid laundry detergent; LAS at 15%; AEO-9 at 15%; LAS/AEO-9 blend at 15% total surfactant, 1:1 by weight; water control.
- Detergent concentration: 1% for the reported washing procedure. Authors state this was raised above the usual daily-laundry concentration because the experimental oil loading was heavier than normal textiles.
- Water hardness: 250 ppm, Ca2+/Mg2+ ratio 2:1.
- Temperature: 25 °C.
- Flow: 36 mL/min.
- Observation: fluorescence images recorded every 30 s; reported detergent comparison includes 150 s washing.
- Measurement: relative fluorescence intensity (RFI); detergency (%) calculated as (I_B - I_A) / I_B × 100, where I_B and I_A are relative fluorescence intensity before and after washing.
- Applicability caveat: a single isolated fibre lacks the fabric-level mechanical/friction and inter-fibre trapping effects present in household laundry.

### 3.2 Cotton-fabric laundering comparison

- Fabric swatches: pre-washed cotton, 2 × 4 inches; swatches prepared by soaking for 5 min in a solution of 10 mL soybean oil in 90 mL dichloromethane, then blotting, drying, and conditioning.
- Mean initial oil content reported: **15.17 ± 2.68%**. The article does not define this as raw per-replicate data in the text; preserve it as the reported mean ± spread, without guessing whether the spread is SD or another statistic unless the article explicitly defines it.
- Washing apparatus: LABTEC HB12P washing tester.
- Liquor ratio: fabric to water 1:30.
- Wash time: 20 min, followed by two rinses with deionized water, 2 min each.
- Temperature: 25 °C.
- Water hardness: 250 ppm, Ca2+/Mg2+ ratio 2:1.
- Replication: each experiment repeated at least three times; averaged values assessed.
- Detergency measurements: brightness (L), reflectance (R), weight-based oil removal, and CLSM/RFI. These methods have different physical meanings and must not be merged into a single measurement column.

## 4. Explicit source-reported numerical observations

| Source location / context | Reported value | Unit / interpretation | Provenance and limitations |
|---|---:|---|---|
| Section 3.1, single cotton fibre, LAS | 39.7 | % detergency at 150 s | Source-reported value from RFI method; aggregate result, no raw replicate values provided in the text. |
| Section 3.1, single cotton fibre, AEO-9 | 41.0 | % detergency at 150 s | Source-reported value from RFI method; aggregate result. |
| Section 3.1, single cotton fibre, water | 25 | % oil removal at 150 s | Source-reported approximate result; water control in single-fibre setup. |
| Section 3.1, single cotton fibre, LAS/AEO-9 (1:1 wt%) | ~44 | % detergency at 150 s | Explicitly approximate in source; do not store as exact precision. |
| Section 3.1, single cotton fibre, Tide Free | RFI decreased to 48 | % of initial RFI remaining after 150 s | This is an RFI statement, not a directly reported “52% detergency” row; do not convert unless a derived field is explicitly labelled as calculated. |
| Section 3.2.1, soiled cotton fabric | 15.17 ± 2.68 | % initial oil content | Source-reported mean ± spread; the statistic represented by ± is not assumed here. |
| Section 3.2, single cotton fibre with Tide Free | ~52 | % oil removal | Approximate aggregate trend from the source text; distinct from fabric-level gravity method. |
| Section 3.2, single viscose fibre with Tide Free | ~52 | % oil removal | Approximate aggregate trend from the source text. |
| Section 3.2, single polyester fibre with Tide Free | ~75 | % oil removal | Approximate aggregate trend from the source text. |

## 5. Data-quality and use restrictions

1. Store the single-fibre CLSM series and cotton-fabric laundering observations as different protocols/datasets; do not pool them.
2. Values described as “about”, “approximately”, or “~” must retain approximate status and must not be converted into false precision.
3. Do not infer missing error bars, sample sizes beyond “at least three” for the fabric experiments, or individual replicate values.
4. Do not use these data as direct calibration targets for powder detergents: the reported comparative formulations are water, individual surfactants, a surfactant blend, and one commercial liquid detergent.
5. Do not map oil removal on isolated fibres directly onto multi-stain household cleaning performance without an independently validated transfer model.
6. Attribution must cite the full article and DOI and preserve the CC BY 4.0 notice. Confirm the exact licence statement again before redistribution of copied figures or images; this report transcribes text values only.
7. This evidence does not establish model accuracy. It cannot upgrade any scientific model maturity status by itself.

## 6. Phase gate

- 2006 Tekstil: **BLOCKED_FOR_NUMERIC_INGESTION** until a readable PDF is obtained and tables can be verified.
- Hu et al. 2023 CC BY source: **SOURCE_REVIEWED; NUMERIC_SUMMARIES_TRANSCRIBED; SCREENING_ONLY**.
- Canonical application dataset ingestion: **NOT PERFORMED** in this commit. This report is an evidence-vault audit artifact only.
- Applicable engine IDs: **none**.
- Phase 4B: **OPEN**.
- Phase 5: **LOCKED**.
