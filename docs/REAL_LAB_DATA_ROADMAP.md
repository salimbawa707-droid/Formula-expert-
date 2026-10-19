# Real Experimental Data Roadmap

**Status:** Work started — source audit, open-data ingestion and evidence-map reconciliation  
**Baseline:** GitHub \`main\`, reviewed 2026-10-19  
**Scientific promotion:** Disabled while the existing Phase 5 governance gate is locked

## Goal

Use only datasets with an explicit, reuse-compatible open data license for external benchmarks. Keep those benchmarks distinct from observations generated in the user's own laboratory. A public paper, open-access article, or public GitHub repository is not sufficient by itself: verify the license attached to the dataset/files. A dataset is not automatically a direct validation set for every engine that consumes related chemistry.

## What the repository already contains

- \`engines_reconciled.list\` is the starting inventory for code modules. It includes pH/neutralization, surfactant, rheology, foam, chelation, active matter, powder, cleaning, compatibility, process/manufacturing, regulatory, spectral, costing, inventory, and governance engines.
- \`evidence_vault/datasets/surfpro/\` contains the SURFPRO raw data, an experimental slice, discrepancy exports, and audit statistics. The repository's own audit says this is useful for pure-surfactant properties, not binary-mixture CMC validation; data leakage was not fully assessed.
- \`evidence_vault/datasets/zenodo_18961871/\` contains four rheology/foam workbooks and reconciliations. Existing reports conflict about the exact integrity state of at least one workbook; the current repository blob size and source checksum must be reconciled before any parser output is promoted.
- \`P15_REAL_LAB_DATA_ANALYSIS_REPORT.md\` says the application had zero genuine internal laboratory observations at that audit. Published external measurements can support benchmarks, but cannot be relabelled as app-generated lab data.
- Existing evidence files use inconsistent engine IDs. For example, \`next_dataset_candidates.json\` and \`round5_engine_validation_mapping.csv\` assign different scientific domains to ENG-001/ENG-002. New mappings must use canonical source paths and output names; historic reports remain immutable and are superseded by a versioned map.

## Engine-family evidence plan

| Engine family | Evidence needed | Suitable public evidence / first route | Evidence limits |
|---|---|---|---|
| pH, acid/base, neutralization, buffer | Titration curves, composition, temperature, ionic strength, electrode/calibration details | Primary potentiometric datasets; NIST/WebBook or literature constants as model inputs | Constants alone do not validate a detergent formulation prediction. High-electrolyte conditions require matching evidence. |
| Surfactant identity, pure CMC, surface tension, HLB inputs | Pure-component measurements, structure/identity, temperature, salt and method | SURFPRO (Zenodo 15861809) and its cited literature; PubChem for identity/structure only | SURFPRO's pure-surfactant measurements do not validate mixed-micelle interaction predictions. |
| Mixed micellization / mixture CMC | Binary/ternary compositions, mole fractions, temperature and CMC method | Published mixture-CMC literature and the linked author repository; obtain only data actually released for reuse | The related paper states that some training data/models remain BASF property; public test files are not the full training dataset. |
| Liquid rheology / viscosity | Full stress-rate or viscosity-rate curves with geometry, temperature, sample composition, instrument and protocol | Zenodo 18961871 solution/rheometer files; RheoData only dataset-by-dataset after provenance/license review | Foam rheology and washing-up liquid data are not automatically detergent-liquid formulation validation. |
| Foam kinetics / foam structure | Time series, bubble distributions, film/drainage measurements, generation protocol, composition and water conditions | Zenodo 18961871 bubble-size and film-thickness data | Supports only outputs matching recorded observables and the tested product/conditions; it does not establish cleaning performance. |
| Chelation / hardness / precipitation | Ca/Mg titration or ISE curves, pH, ionic strength, ligand identity, temperature and water composition | Open primary research datasets; NIST SRD 46 is a reference lead, not an ingestible open file | Stability constants are parameter evidence; they do not directly validate free-ion predictions in commercial blends. SRD 46 is not assumed redistributable. |
| Active matter and analytical QC | Raw replicates, titration standardization, sample prep, method version, endpoint and uncertainty | Open method papers where raw data and reuse terms are explicit; otherwise new lab observations | A method description or validation certificate is not a sample-level measurement dataset. |
| Cleaning performance / detergency | Stain/fabric protocol, reference detergent, wash temperature, water hardness, cycle and residual-soil measurement | Standards and official protocols (JIS/AATCC/ASTM/EU methods) plus released raw study data | A protocol is not a dataset. Do not infer product claims from a paper's aggregate scores. |
| Powder, dissolution, density, compatibility, stability | Lot/formulation, humidity, temperature, age, method, replicate and endpoint | Published raw measurements with matched physical form; otherwise controlled in-house study | A liquid or foam dataset cannot be transferred to powders or another product category without evidence. |
| Spectral/identity engines | Raw spectra plus reference material, instrument, calibration, resolution and preprocessing | Public spectra repositories and primary spectra with reuse terms; PubChem for identifiers | Structure databases are not detergent performance datasets. Digitized spectra remain lower-confidence evidence. |
| Manufacturing/process and closed-loop engines | Batch sequence, scale, order of addition, shear, time-temperature history, actual measurements and deviations | Public process datasets if released; otherwise traceable in-house batch records | Formula outcome alone cannot establish scale-up behavior or causal process effects. |
| Regulatory, claims, labeling, SDS | Jurisdiction, official source, effective date, version and rule-to-output mapping | Official government/regulator texts and APIs | Legal sources are versioned rule evidence, not laboratory evidence. Never rely on a scraped summary as the legal source. |
| Costing, inventory, mass balance, unit conversion, workflow/governance | Deterministic invariants, reconciliation fixtures, time-stamped market quotes where relevant | Internal regression/property tests; user-supplied supplier quotes with region/currency/date | These are not empirically validated by detergent laboratory datasets. Market prices are not universal or durable. |

## Phases and gates

### Phase 0 — Freeze baseline and reconcile existing evidence

1. Capture the exact \`main\` commit and current data-file hashes.
2. Reconcile repository blob bytes, Zenodo file MD5/SHA-256, observation ledgers, and prior audit reports.
3. Create a canonical engine registry keyed by source path, public engine name, output variables, units, required conditions, and validation class.
4. Resolve the ENG-001/ENG-002 mapping conflict without rewriting historical audit records.

**Gate 0:** No artifact with conflicting size/hash/provenance can enter a benchmark.

### Phase 1 — Source discovery and reuse rights

1. Search the repository, cited papers, GitHub source repositories, Zenodo/Cambridge/OSF and official scientific databases.
2. Register the primary citation, DOI/API URL, authors, publication date, dataset-level license, files, hashes, and access date.
3. Separate data-license status from article-license status. If dataset terms are missing, do not redistribute, embed, benchmark, or use for calibration. Exclude non-open or unclear-terms datasets from validation.
4. Record why each candidate is direct, indirect, unsuitable, proprietary, or awaiting permission.

**Gate 1:** Explicit open data license (for example CC BY 4.0, CC0, or a compatible open data license), traceable primary source, and attribution record for every included dataset/file. Unclear, absent, non-commercial-only, or restricted terms mean exclusion from validation.

### Phase 2 — Deterministic ingestion

1. Keep each unmodified source artifact in the evidence vault.
2. Normalize through a versioned parser into a common record: source ID, file hash, source row/sheet, sample/material identity, measured variable, value, unit, uncertainty, method, instrument/geometry, temperature, composition, water conditions, and citation.
3. Preserve raw values; never silently convert units, fill missing fields, remove outliers, or infer formulation composition.
4. Produce a machine-readable reconciliation report for raw rows, excluded rows and exclusion reasons.

**Gate 2:** Reproducible parse, exact row lineage, unit/method completeness, and source checksum match.

### Phase 3 — Engine-specific benchmark design

1. Map individual observable fields to one engine output at a time.
2. Mark each match \`DIRECT\`, \`INDIRECT\`, or \`NOT_VALIDATABLE\`; document assumptions.
3. Split by paper/source, material, formulation family or batch—not random rows—where shared samples could leak into both calibration and test sets.
4. Run an untouched holdout before tuning. Report errors, uncertainty, coverage and out-of-domain cases.

**Gate 3:** No test leakage; benchmark conditions overlap the intended engine domain; limitations visible to users.

### Phase 4 — Controlled engine integration

1. Keep downloaded observations in the evidence layer; keep model parameters and app-local lab trials separate.
2. Allow a dataset to provide a benchmark or prior only for its supported outputs.
3. If calibration is justified, version parameters, retain the pre-calibration baseline, and test on a distinct external holdout.
4. Do not promote to \`LAB_VALIDATED\` from literature/benchmark data. Internal lab validation requires traceable samples, calibrated instruments, replicates and review.

**Gate 4:** Reproducible evaluation passes, provenance is surfaced, and an authorized reviewer approves the promotion.

### Phase 5 — App experience and ongoing maintenance

1. Show source, license, conditions, evidence level, uncertainty, validation scope and last-checked date beside evidence-backed outputs.
2. Provide explicit out-of-domain warnings and a way to open the supporting source.
3. Refresh source metadata/checksums on a scheduled review; pin old versions for reproducibility.
4. Maintain separate states for \`PUBLISHED_BENCHMARK\`, \`INTERNAL_LAB_TESTED\`, \`LAB_VALIDATED\`, \`CALCULATED\`, and \`SYNTHETIC_TEST_FIXTURE\`.

## Open-license policy and newly verified candidates (2026-10-19)\n\n- **Use only openly licensed data:** the dataset/file itself must carry explicit reuse rights. Public accessibility, an open GitHub code license, an open-access article, or a repository's general terms do not substitute for a data license. Preserve required attribution and source lineage.\n- **PSDI CMC Data Collection:** the PSDI record states Open Access and CC-BY-4.0 and describes the records as derived from NIST's *Critical Micelle Concentrations of Aqueous Surfactant Systems*, machine-converted and manually enhanced. Candidate for historical pure-surfactant CMC benchmarks only, subject to verifying row-level provenance and parser accuracy against the source publication.\n- **RepOD conductivity CMC dataset:** the dataset and its three listed text files explicitly state CC BY 4.0; it contains experimental conductivity data for a narrow set of multicharged cationic surfactants. Candidate for matched CMC/conductivity engine outputs only, not general detergent formulation validation. File MD5s are recorded in the source register.\n- **SURFPRO and Zenodo 18961871:** the currently inspected record pages did not expose a dataset license in the captured metadata. Keep quarantined and exclude them from validation until the dataset-level license is independently verified. Article licensing does not resolve this.\n\n## Initial source-audit findings (2026-10-19)

1. **SURFPRO:** Zenodo identifies a 1,624-surfactant curated property dataset and cites the SurfPro paper/repository. Local project audits correctly limit it to pure-component evidence and say mixture interaction validation is unsupported. Dataset-level reuse terms still need explicit confirmation before redistribution.
2. **Foam/rheology record 18961871:** Zenodo's primary record describes raw flow-curve/rheometer data, bubble sizes, and film thicknesses. The linked article is CC BY 4.0, but the dataset file license must be checked from dataset metadata itself; the article license is not treated as a substitute.
3. **Mixture CMC:** The paper reports literature binary/ternary data and new experiments; its GitHub repository exposes only specified test outputs, while the paper says training data/models remain BASF property. Use only released files with explicit rights.
4. **RheoData:** The repository describes per-dataset provenance/measurement metadata and MIT-licensed software. The software license does not automatically license every underlying dataset; inspect each dataset's source terms.
5. **Chelation:** NIST SRD 46 is a critically selected reference database but is not assumed to be openly redistributable. Use open primary measurements or appropriately licensed thermodynamic references; do not scrape/import the commercial database.
6. **Cleaning:** JIS/EU sources can define test methods; an open test protocol does not itself provide raw benchmark results.
7. **Current blocker:** Phase 5 is explicitly locked in the repository's forensic reports. Existing audit notes also conflict with the current GitHub tree's size for \`Supplementary_SolutionFlowCurves.xlsx\`; resolve file history and checksum before using it.

## Immediate work sequence

- Reconcile the source file and historical audit discrepancy.
- Publish the canonical engine-to-evidence map and source/license register.
- RepOD ingestion is now archived: its three CC BY 4.0 raw curves passed published MD5 checks and 202 rows were normalized with source-file and line references. Keep this set quarantined from CMC calibration until missing measurement conditions and cell constant are resolved. Next, process only explicitly licensed PSDI data and verify its original-row provenance. Keep SURFPRO and foam/rheology artifacts excluded until dataset-level licenses are confirmed.
- Do not modify engine constants or claim app validation until source rights, checksums, row lineage, and holdout design pass the gates above.
- After this map is reviewed, expand in priority order to pH/neutralization, chelation, detergency/cleaning, active-matter QC, powders, and compatibility/stability.

## External source references

- PSDI CMC Data Collection (CC-BY-4.0): https://resources.psdi.ac.uk/data/a7c82670-d2e2-46c6-920a-74294289aa34\n- RepOD experimental conductivity/CMC dataset (CC BY 4.0): https://repod.icm.edu.pl/dataset.xhtml?persistentId=doi:10.18150/IMF2OE\n- SURFPRO Zenodo record (license not confirmed): https://zenodo.org/records/15861809
- Foam/rheology dataset Zenodo record: https://zenodo.org/records/18961871
- SURFPRO code/data repository: https://github.com/BigChemistry-RobotLab/SurfPro
- RheoData repository: https://github.com/rheopy/rheodata
- Mixed-CMC paper: https://doi.org/10.1016/j.compchemeng.2025.109085
- Mixed-CMC released-code repository: https://github.com/brozosc/Predicting-the-Temperature-Dependent-CMC-of-Surfactant-Mixtures-with-Graph-Neural-Networks
- PubChem PUG REST policy/docs: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
- NIST SRD 46: https://www.nist.gov/srd/nist46


## Phase 2 ingestion update — RepOD CMC data (2026-10-19)

- Archived the three CC BY 4.0 raw text files unchanged under `evidence_vault/datasets/repod_cmc/`; all three downloaded MD5 values match the repository's published file checksums.
- Normalized 79 + 79 + 44 = 202 measurement rows into `repod_cmc_measurements.csv`. Every row retains its source ID, filename, original row index, and source line number. Raw C, V, and signal values/units are preserved; missing values remain blank.
- The source uses the label `conductivity [mS]`; mS is a conductance unit and the files provide no cell constant for conversion to specific conductivity. Temperature, solution matrix, instrument/electrode, replicate identifiers, and uncertainty are also absent.
- No CMC breakpoint was estimated and no engine constants changed. The canonical engine map has no standalone CMC prediction engine; these curves cannot validate HLB, detergency, or general formulation outputs. Keep them as sourced evidence pending method metadata and a clearly matched output.
- A deterministic offline normalizer verifies each raw MD5 and reports row counts before writing the derivative CSV.
