# Phase 4B AI Dataset Audit — Shampoo Formulations (2026-10-27)

## Decision

**Dataset inspection: structurally inspected with limitations. Phase 4B remains OPEN; Phase 5 remains LOCKED.** This source is useful for shampoo rheology research, but it does not establish detergent cleaning performance or validate the application’s ENG-003 output. No prediction accuracy, ingredient equivalence, or cleaning score is claimed.

## Source and provenance

- Article: Chitre et al., “Accelerating Formulation Design via Machine Learning: Generating a High-throughput Shampoo Formulations Dataset,” *Scientific Data* 11, 728 (2024), [DOI 10.1038/s41597-024-03573-w](https://doi.org/10.1038/s41597-024-03573-w).
- Official data collection cited by the paper: [Figshare collection DOI 10.6084/m9.figshare.c.7132624.v1](https://doi.org/10.6084/m9.figshare.c.7132624.v1).
- Official file identified in the dataset metadata: `LiquidFormulationsDataset_2023.json`, Figshare file ID `45187180`, [official file record](https://springernature.figshare.com/articles/software/Liquid_Formulations_Dataset/25451878), download endpoint `https://ndownloader.figshare.com/files/45187180`.
- Inspection bytes were obtained from the public GitHub mirror `Staphlerr/formusense`, blob `739cf39a0c6fe3b512c159a9e95336802f75a773`. On 2026-10-27, the official Figshare API v2 article record (article 25451878, version 1) returned HTTP 200 and identified file 45187180, title, size (1,464,630 bytes), CC0 license, supplied MD5, and computed MD5 (`8898e7b460c71e334f6ece5daebc6a6e`). The inspected mirror file has the same size and MD5; its SHA-256 is `3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd`. Official metadata URL: `https://api.figshare.com/v2/articles/25451878`.
- **Provenance limit:** the official API metadata is directly verified, but the official binary download endpoint returned HTTP 403 in this environment. A matching size/MD5 against official file metadata supports source identity but does not mean the official bytes were downloaded. The raw dataset is not yet pinned in this repository. The mirror is not represented as the source publisher.

The article describes 812 cleaned formulations from 822 prepared, with 294 stable formulations receiving turbidity and rheology measurements. Formulations combine two surfactants, a polyelectrolyte, and a thickener in water. The paper reports a 25 °C shear sweep and at least three repeats; the JSON provides average curves and standard deviations rather than replicate-level raw traces. Dataset suitability is limited to its tested shampoo/rinse-off design space and short-term stability procedure.

## Reproducible structural inspection

The JSON parsed as 812 records with 25 top-level fields: 18 formulation-component values, stability, turbidity value/error, viscosity class, rheology type/data, and sample ID. All 812 IDs are unique. The stability field has 294 `true` and 518 `false` records. The 518 unstable records have no rheology profile and use `NA` for the three measured/derived output fields checked.

All 294 stable records contain three rheology arrays (`shear_rate`, `avg_viscosity`, `std_dev`) with 31 positions each, except four records with structural/alignment failures. The other 290 profiles pass checks for 31 finite values per array, positive strictly increasing shear rates, positive average viscosity, and nonnegative standard deviation.

| Check | Result |
|---|---:|
| JSON records | 812 |
| Unique sample IDs | 812 |
| Stable samples | 294 |
| Unstable samples | 518 |
| Stable profiles passing structural checks | 290 / 294 |
| Stable profiles excluded for array defects | IDs 151, 196, 216, 673 |
| Total top-level fields | 25 |
| Recorded formulation-component fields | 18 |

The recorded component-field sums range from 15.94 to 33.32. Water is the base and is not one of the 18 recorded ingredient fields. The sum is therefore not a complete-formula total. The numeric basis must not be silently converted to percent w/w or normalized to 100 without checking the official supplementary materials.

## App applicability

ENG-003 is currently described as a named-ingredient semi-empirical screen whose inputs are application ingredient records and % w/w. This dataset uses 18 commercial shampoo ingredient names and source-native numeric component values. A verified join from these names/grades and source units to the app ingredient catalog has not been established. Its target is shampoo rheology, while the registered ENG-003 product scope is detergent/cleaner products. The dataset has no soil-removal, wash-performance, hardness, or detergent-cleaning outcomes. Thus it cannot validate detergent cleaning predictions or be used to claim ENG-003 accuracy.

The model should not consume these values through guessed aliases, unverified unit conversions, or generated labels. It can be reconsidered for a separately scoped shampoo-rheology benchmark after official-source retrieval, composition-basis verification, ingredient mapping, and review of the four malformed profiles.

## Pasted-link triage

The supplied text’s Llama/GitHub/Hugging Face links identify language-model resources, not primary experimental formula/outcome data. They do not satisfy Phase 4B’s scientific evidence requirement by themselves. A language model cannot replace missing measurements with generated “true data”; no such synthetic values were added.

## Remaining Phase 4B work

1. Retry direct retrieval of official Figshare file 45187180 from a permitted environment; compare the downloaded bytes with the official metadata and pin the verified raw artifact before using this dataset for model comparisons.
2. Pin the verified source artifact in a reproducible repository location or CI artifact with a documented retrieval procedure.
3. Resolve or explicitly quarantine the four malformed stable rheology profiles.
4. Establish ingredient identity, grade, and composition units from official supplementary files before considering ENG-003 comparisons.
5. Keep the Pušić AI table pass labelled as AI review. It is not a human sign-off; any review-policy change must be recorded as AI verification and must not invent a human reviewer.
6. Complete the remaining Phase 4B provenance, accounting, ledger, and open-finding gates before changing the phase status.

No phase status or unlock decision is changed by this report.
