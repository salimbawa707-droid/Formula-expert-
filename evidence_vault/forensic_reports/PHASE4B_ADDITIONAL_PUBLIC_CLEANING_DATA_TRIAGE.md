# Phase 4B — Additional Public Cleaning-Evidence Triage

**Audit date:** 2026-10-23  
**Purpose:** Screen additional public sources for commercial-use compatibility and whether their measured outcome matches laundry detergent formulation validation.

## Candidate decisions

| Source | Licence / access evidence | What it actually measures | Decision for the commercial Detergent Formula Expert |
|---|---|---|---|
| **Primary Washing Effect of Powder and Liquid Detergents** (Pušić et al., *Tekstil*, 2006) | Publisher page states CC BY 4.0. https://tekstil.hist.hr/index.php/tekstil/article/view/3174 | Primary washing effect of powder/liquid detergents against multiple stains on cotton and polyester/cotton fabrics at 60 °C; remission/whiteness outcomes. Also reports wastewater parameters. | **High-priority paper to inspect next.** Licence is compatible with commercial reuse with attribution, but the accessible metadata page alone does not establish whether all raw replicate data are tabulated. Do not invent values or treat extracted summary means as individual observations. |
| **A universal method for determining the detergent effect of surfactants** (Bejczi et al., *MethodsX*, 2024; DOI 10.1016/j.mex.2024.102755) | Open-access article states CC BY-NC 4.0. https://doi.org/10.1016/j.mex.2024.102755 | Describes a method for comparing removal of an oil-based contaminant from a solid surface; the article explicitly states no data were used for the research. | **Not eligible for commercial reuse as an article-derived commercial dataset under the stated NC licence; also no dataset to ingest.** Method may inform future independently authored test-protocol design, but obtain legal review before adapting licensed text/figures. |
| **EPA SARS-CoV-2 Surface Cleaning Dataset** (DOI 10.23719/1527855) | Public data.gov record links a spreadsheet and an EPA ScienceHub licence: https://catalog.data.gov/dataset/sars-cov-2-surface-cleaning-dataset and https://pasteur.epa.gov/license/sciencehub-license.html | Infectious SARS-CoV-2 reduction on surfaces after wiping, with/without detergent pre-wetting; outcomes include log reduction under specified soil/simulated-saliva, surface and wet/dry conditions. | **Separate domain; not a laundry cleaning-performance target.** Do not train or validate laundry formulation scores from viral log-reduction outcomes. Public access does not by itself settle redistribution/commercial reuse; terms must be reviewed before any reuse. |
| **EPA Cleaning against MHV dataset** (DOI 10.23719/1523025) | Public data.gov record links an XLSX and EPA ScienceHub licence: https://catalog.data.gov/dataset/cleaning-against-mhv-dataset | Cleaning efficacy against a viral surrogate on porous/non-porous surfaces. | Same exclusion: viral removal is not fabric-soil removal or formulation performance; licence terms need review before reuse. |
| **Laundry detergent vibrational spectroscopy vs consumer experience** (Muetzel et al., 2025; DOI 10.1002/asia.202401457) | Publisher/repository record identifies CC BY-NC. https://doi.org/10.1002/asia.202401457 | Spectroscopic fingerprints of powder/liquid laundry detergents, with consumer/community wash-performance ratings. | **Not cleared for commercial data/model reuse under NC licence without separate permission.** It may be scientifically interesting, but spectroscopy/consumer ratings are not direct quantitative soil-removal measurements. |
| **Design and performance optimisation of detergent product containing binary mixture of anionic-nonionic surfactants** (Heliyon, 2020; DOI 10.1016/j.heliyon.2020.e03861) | Publisher lists CC BY-NC-ND 4.0. https://doi.org/10.1016/j.heliyon.2020.e03861 | Surfactant property prediction and hypothetical formulation design; reported work includes computationally predicted properties, not a public direct-cleaning benchmark dataset. | **Exclude from commercial ingestion/training** absent permission; ND restriction also makes adaptation problematic. Predicted values must not be relabeled as measured observations. |

## Key distinctions

1. **Publicly accessible is not the same as commercially reusable.** Respect the source-specific licence, terms, attribution requirements and any upstream restrictions.
2. **A method paper is not a dataset.** Bejczi et al. explicitly report that no data were used in the research; its method is not a source of raw validation observations.
3. **Endpoint mismatch matters.** Viral log reduction after surface wiping, spectroscopy, surface tension, foam persistence, and fabric-soil removal are distinct targets. They must not be pooled into one cleaning score without a validated, pre-specified mapping.
4. **Measured vs predicted stays explicit.** Modelled/predicted property values and consumer ratings cannot be relabeled as laboratory measurements of cleaning performance.
5. **Commercial candidate to prioritize:** inspect the CC BY 4.0 2006 *Tekstil* paper for exact table values, units, sample conditions, variance/replicate reporting, and whether data are source-reported or only graph-derived. Any transcription must cite page/table and preserve uncertainty and context.

## Phase gates

- Phase 4B: **OPEN**.
- Phase 5: **LOCKED**.
- No source promoted to engine eligibility by this triage.
- No LAB_VALIDATED or 95–98% accuracy claim is supported by this source-screening pass.
