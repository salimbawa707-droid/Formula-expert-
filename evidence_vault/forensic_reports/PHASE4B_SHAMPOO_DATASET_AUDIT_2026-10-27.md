# Phase 4B AI Dataset Audit — Shampoo Formulations (2026-10-27)

## Decision

**Dataset inspection: structurally inspected with limitations. Phase 4B remains OPEN; Phase 5 remains LOCKED.** This source is useful for shampoo rheology research, but it does not establish detergent cleaning performance or validate the application’s ENG-003 output. No complete formula-to-app identity equivalence, prediction accuracy, or cleaning score is claimed.

## Source and provenance

- Article: Chitre et al., “Accelerating Formulation Design via Machine Learning: Generating a High-throughput Shampoo Formulations Dataset,” *Scientific Data* 11, 728 (2024), [DOI 10.1038/s41597-024-03573-w](https://doi.org/10.1038/s41597-024-03573-w).
- Official data collection cited by the paper: [Figshare collection DOI 10.6084/m9.figshare.c.7132624.v1](https://doi.org/10.6084/m9.figshare.c.7132624.v1).
- Official file identified in the dataset metadata: `LiquidFormulationsDataset_2023.json`, Figshare file ID `45187180`, [official file record](https://springernature.figshare.com/articles/software/Liquid_Formulations_Dataset/25451878), download endpoint `https://ndownloader.figshare.com/files/45187180`.
- Inspection bytes were obtained from the public GitHub mirror `Staphlerr/formusense`, blob `739cf39a0c6fe3b512c159a9e95336802f75a773`. On 2026-10-27, the official Figshare API v2 article record (article 25451878, version 1) returned HTTP 200 and identified file 45187180, title, size (1,464,630 bytes), CC0 license, supplied MD5, and computed MD5 (`8898e7b460c71e334f6ece5daebc6a6e`). The inspected mirror file has the same size and MD5; its SHA-256 is `3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd`. Official metadata URL: `https://api.figshare.com/v2/articles/25451878`.
- **Provenance limit:** official metadata is verified, but direct Figshare binary downloads for the JSON, CSV, and PPTX returned HTTP 403 in this environment. The JSON/PPTX mirrors match official size/MD5; the official binaries were not downloaded. The CSV is reconstructed from mirror text with original BOM and restored CRLF line endings; it matches the official 2,642-byte size and MD5 and is pinned in the repo. Do not describe mirror retrieval as direct publisher download.

## Official composition supplements and identity mapping

The collection API lists two formula-identity supplements in addition to the JSON:

- **Surfactant information:** Figshare article 25451926, file 45187306, CC0, 2,642 bytes, official MD5 `aac17fe16e7efe834ccbf685c98f154e`. Its 12 product rows identify INCI names and supplier active-matter, water, and other-content ranges. The repository copy is at `evidence_vault/datasets/figshare_25451878/BASF_Surfactants_Information.csv`; its reconstructed bytes match the official size/MD5. The mirror's LF version was 2,630 bytes, MD5 `a25c8a2a610bb72614fcf05caef024a6`, SHA-256 `420598851fbe3ee609ca630d845ae5bed5da624b80d53ecdd53e9c31078e66d3`. The reconstructed CRLF file SHA-256 is `27045f6d4fa7db19d8890c46e0926f1f07c4a39f5a4eb72cae4235191f6feea1`.
- **Ingredient structures:** Figshare article 25451929, file 45187309, CC0, 354,656 bytes, official MD5 `923a76c9fd744b78169b133a517768e0`. Its GitHub mirror file matches that size and MD5; computed SHA-256 is `332379efcb790cabae1b677a49c31389275206faf201534fb98507e6cda867e2`. The 26-slide deck identifies the full set of 18 formulation components. It is not claimed as a publisher binary download or checked-in raw asset.
- Crosswalk: `evidence_vault/datasets/figshare_25451878/ingredient_identity_crosswalk.csv` maps all 18 JSON component names to slide/INCI identity and, where available, the surfactant supplier's active-matter and water ranges. It checks exact INCI strings against `src/data/universalIngredientLibrary.ts`: four source components have exact app-catalog INCI candidates; 14 have no exact INCI match. Of the matched products, Dehyton MC's 25–35% active range does not match the app's 40% Sodium Cocoamphoacetate grade. The app's 40% sulfosuccinate candidate lies within the 31–41% source range, and CAPB 45% lies within the 44–46% source range; those ranges do not establish a lot-specific assay. Dehyton AB 30 matches the 30% Coco-Betaine entry. These are identity/grade checks, not model-validation pairs.

### Composition basis

The dataset authors' preparation protocol describes preparation “on a mass basis” and uses the DoE `mass_fraction` column divided by 100 to convert mass fractions to dispense volumes, with density corrections (protocol at [pinned author-repository commit](https://github.com/sustainable-processes/formulations-prep/blob/a715cec009bd651d9c3e836d6a506070cb9c5835/OpentronsProtocol_FormulationSamples.py#L25) and [conversion code](https://github.com/sustainable-processes/formulations-prep/blob/a715cec009bd651d9c3e836d6a506070cb9c5835/OpentronsProtocol_FormulationSamples.py#L195-L202)). This supports a % w/w basis for the source design inputs. Water is absent from the JSON; no water remainder or exact formulation total is inferred.

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

The recorded component-field sums range from 15.94 to 33.32. The author protocol confirms a mass-percent basis for source design inputs, but water is absent from the JSON, so these columns are incomplete and are not normalized. No water remainder is imputed.

## App applicability

ENG-003 is currently described as a named-ingredient semi-empirical screen whose inputs are application ingredient records and % w/w. The 18 source components are now mapped to source INCI descriptions and supplier grade ranges in the crosswalk. Four source INCI names have exact string candidates in the app library; 14 do not. Active-matter grade differences remain for some candidates, and no full source-to-app formula join is established. Its target is shampoo rheology, while the registered ENG-003 product scope is detergent/cleaner products. The dataset has no soil-removal, wash-performance, hardness, or detergent-cleaning outcomes. Thus it cannot validate detergent cleaning predictions or be used to claim ENG-003 accuracy.

The model should not consume these values through guessed aliases, unverified unit conversions, or generated labels. It can be reconsidered for a separately scoped shampoo-rheology benchmark after direct source-byte retrieval, exact ingredient and grade mapping for the app, and review of the four malformed profiles.

## Pasted-link triage

The supplied text’s Llama/GitHub/Hugging Face links identify language-model resources, not primary experimental formula/outcome data. They do not satisfy Phase 4B’s scientific evidence requirement by themselves. A language model cannot replace missing measurements with generated “true data”; no such synthetic values were added.

## Remaining Phase 4B work

1. Retry direct retrieval of the official JSON and PPTX binaries from a permitted environment; the CSV supplement is already pinned as a size/MD5-matched reconstruction.
2. Resolve or explicitly quarantine the four malformed stable rheology profiles.
3. Establish exact app-catalog identities and lot-specific grades for the 14 unmatched components and any ranged supplier concentrations before considering ENG-003 comparisons.
5. Keep the Pušić AI table pass labelled as AI review. It is not a human sign-off; any review-policy change must be recorded as AI verification and must not invent a human reviewer.
6. Complete the remaining Phase 4B provenance, accounting, ledger, and open-finding gates before changing the phase status.

No phase status or unlock decision is changed by this report.
