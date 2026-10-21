# Open-reference empirical benchmarks

Openly licensed, published measurement data used to check the app's calculation engines against real measurements. Each file's SHA-256 is in [`data-manifest.json`](./data-manifest.json) and is checked by `src/utils/__tests__/openReferenceBenchmark.regression.test.ts`.

**Scope.** These are component-level reference benchmarks (buffer pH, pure-surfactant CMC, binary-mixture CMC). They are **not** matched finished-formula laboratory batches. They do not count toward `REAL_LAB_DATA_COUNT` and never grant `LAB_VALIDATED` status to a formula or category.

| Folder | Data | Source | License |
|---|---|---|---|
| `ph_standards/` | 20 IUPAC primary/secondary pH standard values (14 engine-supported) | Buck et al., *Pure Appl. Chem.* 74, 2169 (2002), DOI [10.1351/pac200274112169](https://doi.org/10.1351/pac200274112169) | Reproduction with attribution. © 2002 IUPAC |
| `cmc_pure/` | 63 pure-surfactant CMC rows for SDS, DDAO, SDBS, C12 betaine, C12 BDDAC (20–30 °C, no additives) | PSDI digitisation of NIST NSRDS-NBS 36 (Mukerjee & Mysels 1971) | CC BY 4.0 |
| `cmc_mixed/` | 979 binary-mixture CMC rows (62 systems with both pure endpoints in the benchmark report; reconcile this count in the runner before treating it as a test invariant) | Sandia P2SURF, commit `8aa90b9a`, [github.com/snlai4chembiogroup/P2SURF](https://github.com/snlai4chembiogroup/P2SURF); paper DOI 10.1186/s13321-025-01112-2 | MIT (`P2SURF_LICENSE.txt`) |

Excluded: SurfPro (CC BY-NC-SA, not usable in a commercial product).

## Run

```bash
npx tsx scripts/open-reference-benchmark.ts   # writes test_reports/open-reference-benchmark.json
npm test                                      # includes the regression suite
```

## Mapping notes

- pH recipes are given as `Name:MW:mol_per_kg_water` and dissolved in 1 kg water. KH₂PO₄ is represented by NaH₂PO₄ (spectator cation only). The acetate standard is on a molar basis and is approximated as molal.
- CMC rows record `evidence_tier` (`NIST_SELECTED` = evaluation 1/2/3/P; `NIST_LISTING_ONLY` = L) and the structural relationship to the app ingredient. Commercial materials (C10–13 LAS, C12–14 lauramine oxide, C12–16 BKC, CAPB) are homolog blends, so these are plausibility screens, not identity matches. CAPB vs C12 betaine is marked `WEAK_PROXY` and is not counted as a pass.
- P2SURF CMC units are log10(µM). Charge class is inferred from formal charges on the largest SMILES fragment.

Full results: [`../forensic_reports/OPEN_REFERENCE_BENCHMARK_REPORT.md`](../forensic_reports/OPEN_REFERENCE_BENCHMARK_REPORT.md).
