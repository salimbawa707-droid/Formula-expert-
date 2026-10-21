# Task 4 — ENG-002 ideal Clint CMC benchmark

Audit date: 2026-10-22  
Actual starting `main` SHA: `486ec6f8c0c520758710b9f8fa46712d4b3d2ac9`  
Source: `evidence_vault/open_reference_benchmarks/cmc_mixed/p2surf_binary_mixture_cmc.csv`  
Upstream P2SURF commit recorded in the existing manifest: `8aa90b9a9d1b2c51df5ce5ed1e863f81eff3f0e8`

## Scope and reproducibility

This is a component-level benchmark of the ideal Clint relation, not validation of a finished detergent formula or of the complete application. The equation is
`CMC_mix = 1 / (x1/CMC1 + x2/CMC2)`.

The implementation in `src/utils/calculators.ts` uses this harmonic mixing equation in `idealMixedCmcFromMoleFractions` and normalizes the provided fractions. The app's higher-level `calculateMixedCMC` derives mole fractions from its own ingredient catalog and CMC defaults. P2SURF rows use SMILES, not the app's ingredient identifiers, so this audit tests the equation helper using the source's measured same-system pure endpoints. It does not test end-to-end ingredient catalog mapping or app default CMC values. The TypeScript regression suite replays every committed eligible ledger row through the actual app helper.

The existing P2SURF CSV hash was checked against the pre-existing manifest by the new reproducible script; no dataset was downloaded or altered. The manifest hash is `f269e73d3cdf35e064ee253295d1cf990322cc845d62a4f8bd2414ca21dd0b24` using its LF-normalized SHA-256 basis. The original CSV has five columns: `smile_A`, `mol_fraction_A`, `smile_B`, `mol_fraction_B`, and `logCMC`. It has no original row IDs, study IDs, or detailed experimental protocol fields. Ledger identifiers are deterministic row-position identifiers, with both data-record number and physical CSV row retained.

All source fractions were checked against one within an absolute-sum tolerance of 0.00101, then each source fraction was divided by the reported sum. Four source rows have rounded fractions whose sum differs from one and are normalized; the raw values and calculation are retained in the ledger. The source `logCMC` values are `log10(CMC/uM)`; each measured value and endpoint is converted to linear micromolar as `10 ** logCMC` before applying Clint. Predictions are retained in µM and converted back to log10 only for log-space errors.

System identity is the exact unordered pair of source SMILES, sorted lexicographically. No chemical canonicalization is performed. Repeated endpoint or composition records would block that system because the CSV does not identify replicates. No duplicate source rows or duplicate composition points were found in the current file.

## Row and group accounting

The prior open-reference runner reports 979 rows, 65 binary systems, 62 systems with both pure endpoints, and 347 intermediate points. This audit reproduces those totals and accounts for the remaining rows explicitly:

| Rows / groups | Count | Treatment |
|---|---:|---|
| Source data rows inspected | 979 | All rows represented in the ledger |
| Same-SMILES rows | 480 | Excluded: not a binary surfactant mixture |
| Distinct binary SMILES-pair systems | 65 | Grouping unit |
| Binary systems missing a pure endpoint | 3 | Excluded; 28 source rows total |
| Eligible endpoint rows | 124 | Inputs to the equation; never scored |
| Eligible intermediate mixture observations | 347 | Scored within 62 complete systems |
| Duplicate source rows / duplicate composition groups | 0 / 0 | No duplicate exclusion required |
| Invalid numeric rows / systems | 0 / 0 | No invalid values found |

The three excluded systems are recorded as P2S-030, P2S-031, and P2S-032 in the per-system file; each lacks component 2's pure endpoint. Within the complete systems, pure endpoints are inputs to the deterministic equation, and only interior mixture rows are prediction–observation pairs.

## Results

Error sign is prediction minus observation. Linear metrics are in µM. Log metrics compare `log10(predicted µM)` to the original `log10(measured µM)`; they are unitless log10 ratios.

| Evaluation | n | MAE (µM) | RMSE (µM) | Mean signed error (µM) | MAE (log10) | Mean signed error (log10) |
|---|---:|---:|---:|---:|---:|---:|
| Pooled observations | 347 | 6323.868 | 15343.979 | +5975.077 | 0.570216 | +0.547799 |
| Macro mean of 62 system metrics | 62 systems | 6264.607 | 6714.954 | +5867.211 | 0.543417 | +0.511562 |

Positive signed errors indicate Clint predictions higher than the measured values. The per-system CSV provides each eligible system's point count and metrics, as well as the excluded groups with empty metrics. The machine-readable result includes pooled results by pair class.

No second baseline was calculated: the ideal Clint relation is the specified deterministic reference equation, and no separate baseline was specified before comparison. No confidence intervals are claimed. The 347 mixture points are grouped by surfactant pair, not treated as 347 independent experiments; the source CSV has no experiment, batch, or study identifiers.

## Interpretation and limitations

This is interpolation within a binary pair using that same pair's pure-component endpoint observations. It is not generalization to unseen surfactant systems and is not an independent external holdout. The P2SURF mixture benchmark was previously reported in the repository and used in earlier development/regression work, so it is not a pristine untouched test set.

The published dataset is a literature compilation with heterogeneous conditions. The CSV does not identify original study, method, temperature, ionic strength, or replicate grouping per row. Exact SMILES pair identity is traceable within this snapshot, but not enough to certify experimental independence or formulation-grade material equivalence. The comparison therefore supports only the ideal equation's component-level behavior against this curated reference.

Existing Task 3 and Task 2 evidence is retained. The prior pair-class log-error report was not overwritten. Differences in handling of the four rounded fraction sums are explicit here: this benchmark validates and normalizes both recorded fractions, while the older runner reconstructed the second fraction as one minus the first. The new raw values and normalization provenance are available row-by-row.

## Evidence artifacts and execution

- Independent benchmark implementation: `evidence_vault/scripts/benchmark_clint_cmc.py`
- Regression tests: `evidence_vault/scripts/test_benchmark_clint_cmc.py`
- Pair ledger (all 979 source rows): `cmc_mixed/ideal_clint_pair_ledger.csv`
- Per-system metrics (all 65 binary systems): `cmc_mixed/ideal_clint_per_system_metrics.csv`
- Machine-readable summary: `cmc_mixed/ideal_clint_benchmark_result.json`
- Actual app-helper replay: `src/utils/__tests__/openReferenceBenchmark.regression.test.ts`
- Run `python evidence_vault/scripts/benchmark_clint_cmc.py --check` to verify source hash and committed outputs; use `--write` only when intentionally regenerating artifacts.

This does not promote ENG-002 to `LAB_VALIDATED` or `EMPIRICALLY_CALIBRATED`. It does not validate detergent formula predictions, the high-level ingredient default mapping, or other engines. **Phase 4B remains OPEN; Phase 5 remains LOCKED.**
