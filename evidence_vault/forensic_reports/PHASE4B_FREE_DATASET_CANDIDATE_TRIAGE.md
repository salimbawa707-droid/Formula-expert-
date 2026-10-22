# Phase 4B — Free Experimental Dataset Candidate Triage

**Purpose:** Identify public scientific sources that may support the Detergent Formula Expert evidence vault. This is a source-screening register, not a claim that any source validates the app.

**Governance:** Phase 4B remains OPEN. Phase 5 remains LOCKED. No source in this triage is promoted to `LAB_VALIDATED` or made engine-eligible solely by being publicly accessible.

## Candidate register

| Candidate | Experimental content observed in source | Format/access | Licence and commercial-use decision | Proposed use / restriction |
|---|---|---|---|---|
| JMP Academic Case Study JMP039 — Detergent Cleaning Effectiveness | 36 experimental runs: 3 temperatures × 2 wash times × 3 agitation levels, replicated twice; response is relative fabric-brightness change between new and current detergent | Two downloadable `.jmp` data tables and a PDF are linked from the publisher page | No explicit dataset reuse licence was established from the page during this triage. **Do not redistribute or ingest into a commercial training/validation corpus until terms are confirmed.** | Highest-priority direct cleaning-performance candidate. Inspect the two data files and their schema after reuse rights are resolved. |
| Ghosh, Nandi & Barik (2022), “Cleansing Action of Some Daily Useable Detergents” | Lab methods and plotted results for pH, surface tension, CMC, foam-collapse time, scum/precipitate under salt addition, and emulsion stability; compares four market detergents across distilled/tap/ground water | Open article/PDF; results are largely presented in graphs/text rather than a downloadable raw-data table | Article states **CC BY 4.0**. Attribute authors, title, journal, DOI and licence; mark any derived/digitized values as digitized, not raw source data. | Good detergent-specific contextual source. Before numeric ingestion, audit the figures and methods; digitized graph points need uncertainty and must not be represented as exact original measurements. Not sufficient by itself for engine validation. |
| Chitre et al. (2024), high-throughput shampoo formulations dataset | 812 liquid formulations; 294 stable samples; composition, phase stability, turbidity, high-fidelity rheology and flow curves | Public JSON dataset linked from the article’s Figshare record | Article states **CC BY 4.0**; preserve attribution and licence notices for dataset use and any adaptation. Verify the dataset file’s own record/metadata before redistribution. | Useful adjacent-domain data for liquid-formulation stability/rheology pipeline testing. **Not detergent powder cleaning evidence**, and not a substitute for detergent-specific validation. |
| DST-SurfDB, Zenodo DOI 10.5281/zenodo.21118257 | 979 dynamic surface-tension series for 233 surfactants, compiled from peer-reviewed literature; JSON contains measured surface tension against surface age and concentration plus metadata/fitted parameters | Public JSON download on Zenodo | The record page did not expose a populated licence value in the inspected metadata. **Commercial reuse is on hold until the dataset licence and upstream source conditions are verified.** | Potential surfactant-property reference only. Not a direct cleaning/foam-height/finished-detergent validation dataset. Keep fitted parameters distinguished from measured series. |
| SURFPRO surfactant-property database, Zenodo DOI 10.5281/zenodo.15861809 | 1,624 surfactants; includes curated experimental pCMC and surface-tension properties from literature | CSV/XLSX files | Existing vault review records **CC BY-NC-SA 4.0**; non-commercial restriction means it is **not cleared for commercial reuse** without separate permission. | Keep excluded from commercial app data/model training unless permission or a clearly compatible licence is documented. |

## Evidence handling rules

1. Store the source URL/DOI, access date, exact file name, byte size, SHA-256, licence evidence, citation, original units, method, experimental conditions and any transformation history.
2. Preserve original data separately from normalized data. Never overwrite source labels or silently convert unknown/missing values to zero.
3. Use separate status labels for measured source values, graph-digitized values, fitted/derived values, model predictions, estimates and imputations.
4. Do not combine different response variables (for example, surface tension, foam persistence, rheology and fabric cleaning) into a single “cleaning accuracy” target without a scientifically justified mapping.
5. A public dataset or CC BY article is not a laboratory certificate for the user's own formulation. External validation must use matched product type, concentration, water hardness, temperature, soil/fabric, agitation, test method and outcome definition.
6. No dataset in this register currently proves 95–98% app accuracy or justifies `LAB_VALIDATED` status.

## Source links

- JMP039: https://www.jmp.com/en/academic/case-study-library/detergent-cleaning-effectiveness
- Ghosh et al. (2022), DOI 10.46243/jst.2022.v7.i08.pp09-19: https://www.jst.org.in/index.php/pub/article/view/816
- Chitre et al. (2024), DOI 10.1038/s41597-024-03573-w: https://www.nature.com/articles/s41597-024-03573-w
- DST-SurfDB, DOI 10.5281/zenodo.21118257: https://zenodo.org/records/21118257
- SURFPRO, DOI 10.5281/zenodo.15861809: https://zenodo.org/records/15861809

## Next action

Prioritize rights review and raw-file/schema inspection for JMP039 because it contains a directly relevant fabric-cleaning response. In parallel, extract the CC BY 4.0 detergent paper’s measurement methods and figure-level values into a separate, explicitly graph-digitized dataset with uncertainty. Do not make either source eligible for scientific model validation until provenance, conditions, licensing, units, duplicate handling and independent evaluation suitability are checked.
