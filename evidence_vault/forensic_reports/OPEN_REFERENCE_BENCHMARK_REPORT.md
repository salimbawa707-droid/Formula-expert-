# Open-Reference Empirical Benchmark Report

Date: 2026-10-21

## Summary

The app's pH, pure-CMC and mixed-CMC engines were compared with openly licensed published measurements (IUPAC 2002 pH standards, PSDI/NIST NSRDS-36 CMC records, Sandia P2SURF binary-mixture CMC data). The benchmark found and fixed three engine defects, and it is now regression-locked in `openReferenceBenchmark.regression.test.ts` (47 assertions).

**Governance.** This is component-level reference benchmarking. It is not matched finished-formula lab data: `REAL_LAB_DATA_COUNT` stays 0 and no formula or category becomes `LAB_VALIDATED`. Finished-product validation still needs real matched lab batches as described in `COMMERCIAL_EMPIRICAL_VALIDATION_READINESS.md`.

## Defects found and fixed

1. **Davies activity model in the pH engine** (`src/domain/ph/equilibriumSystem.ts`). Ionic strength counted about 55 mol/kg of solvent water, so activity coefficients hit the clip limit, and the polyprotic pKa correction coefficient was wrong. Before the fix, Davies gave pH 8.4 for the IUPAC 1:1 phosphate standard (reference 6.865) and 11.44 for carbonate (reference 10.012). Ionic strength is now computed self-consistently from charged solutes only, with pKa'(step n) = pKa + (2n−1)·log γ₁ (acids) and pKa' = pKa − log γ₁ (amine). The ideal path is unchanged.
2. **Mixed CMC used mass fractions in Clint's rule** (`src/utils/calculators.ts`). Clint's ideal mixed-micelle equation is defined on surfactant mole fractions. Active mass % is now converted with each entry's molecular weight (`idealMixedCmcFromMoleFractions`). The P1.3 regression expectation for LABSA + LAE-9 changed from 0.096 mM (mass basis) to 0.131 mM (mole basis). Synergy flags now also cover anionic+cationic and cationic+nonionic.
3. **Lauramine oxide CMC default** was an unsourced 0.20 mM, about 10x below both NIST records for pure C12 dimethylamine oxide (2.1 mM at 27 °C, evaluation 3, Herrmann 1962, DOI 10.1021/j100808a025; 2.0 mM at 25 °C, listing). It now uses the sourced value with full evidence lineage. Cocamidopropylamine oxide is not mapped to this reference.

## 1. pH engine vs IUPAC 2002 standards

| Standard | T (°C) | IUPAC pH | Ideal | Davies | Davies error |
|---|---|---|---|---|---|
| IUPAC-PS-KH2CIT-10C | 10 | 3.82 | 3.95 | 3.77 | -0.050 |
| IUPAC-PS-KH2CIT-25C | 25 | 3.776 | 3.95 | 3.77 | -0.006 |
| IUPAC-PS-KH2CIT-40C | 40 | 3.754 | 3.95 | 3.77 | +0.016 |
| IUPAC-PS-PHOS-1-1-10C | 10 | 6.923 | 7.2 | 6.89 | -0.033 |
| IUPAC-PS-PHOS-1-1-25C | 25 | 6.865 | 7.2 | 6.88 | +0.015 |
| IUPAC-PS-PHOS-1-1-40C | 40 | 6.838 | 7.2 | 6.87 | +0.032 |
| IUPAC-PS-PHOS-7.4-10C | 10 | 7.472 | 7.74 | 7.43 | -0.042 |
| IUPAC-PS-PHOS-7.4-25C | 25 | 7.413 | 7.74 | 7.42 | +0.007 |
| IUPAC-PS-PHOS-7.4-40C | 40 | 7.38 | 7.74 | 7.42 | +0.040 |
| IUPAC-PS-CARB-10C | 10 | 10.179 | 10.33 | 10.01 | -0.169 |
| IUPAC-PS-CARB-25C | 25 | 10.012 | 10.32 | 10.01 | -0.002 |
| IUPAC-PS-CARB-40C | 40 | 9.889 | 10.31 | 9.99 | +0.101 |
| IUPAC-SS-TETROX-25C | 25 | 1.68 | 1.66 | 1.67 | -0.010 |
| IUPAC-SS-ACET-0.1-25C | 25 | 4.65 | 4.76 | 4.65 | +0.000 |

At 25 °C (n=6): Davies MAE 0.007 pH (max 0.015); ideal MAE 0.212 pH. Across 10/25/40 °C (n=14): Davies MAE 0.037, max 0.169.

Known gaps: the engine does not model the temperature dependence of pKa, so predictions stay almost constant at 10 and 40 °C while the references move (largest error: carbonate at 10 °C, −0.169). Phthalate, borate, tartrate, tris and calcium hydroxide are not in the species registry, so 6 of the 20 standards cannot be evaluated. Borate is a real detergent builder and is the most relevant gap.

**Recommendation:** use `activityModel: 'davies'` for buffered or electrolyte-rich formulas; the ideal model reads 0.1–0.4 pH high on buffers.

## 2. Pure-surfactant CMC defaults vs PSDI/NIST

| App key | App CMC (mM) | NIST reference (mM) | Tier | Relationship | Verdict |
|---|---|---|---|---|---|
| SLS | 8.2 | 8.23 | NIST_SELECTED (9 rows) | EXACT_ACTIVE | WITHIN_2X |
| Amine Oxide | 2.1 | 2.1 | NIST_SELECTED (1 rows) | HOMOLOG_PROXY | WITHIN_2X |
| LABSA | 1.2 | 1.6 | NIST_LISTING_ONLY (1 rows) | HOMOLOG_PROXY | WITHIN_2X |
| CAPB | 0.09 | 2.05 | NIST_LISTING_ONLY (8 rows) | WEAK_PROXY | NOT_COMPARABLE_WEAK_PROXY |
| BKC | 4.5 | 7.8 | NIST_SELECTED (1 rows) | HOMOLOG_PROXY | WITHIN_2X |

The screen band is 2x (|log ratio| ≤ 0.301), because commercial materials are homolog blends. CAPB has no open CAPB-specific reference in this slice; the C12 N-betaine comparison (~2 mM vs app 0.09 mM) is not structurally valid and is reported as not comparable. CAPB, SLES, AOS, LAE and esterquat defaults remain unverified by open data.

## 3. Ideal mixed-CMC rule vs P2SURF binary mixtures

979 rows, 62 systems with both pure endpoints, 347 intermediate points. Errors are in log10 units (0.3 ≈ 2x).

| Pair class | Points / systems | Ideal MAE | Median bias (ideal − measured) | Fold over-estimate | Bias-corrected leave-one-system-out MAE |
|---|---|---|---|---|---|
| anionic-anionic | 41 / 7 | 0.07 | 0.01 | 1.03x | 0.07 |
| anionic-cationic | 113 / 16 | 1.133 | 1.17 | 14.66x | 0.554 |
| anionic-nonionic | 89 / 16 | 0.321 | 0.28 | 1.92x | 0.21 |
| anionic-zwitterionic | 11 / 3 | 0.891 | 0.97 | 9.32x | 0.152 |
| cationic-cationic | 31 / 5 | 0.068 | 0.05 | 1.12x | 0.042 |
| cationic-nonionic | 35 / 8 | 0.646 | 0.13 | 1.35x | 0.648 |
| cationic-zwitterionic | 15 / 5 | 0.246 | 0.08 | 1.21x | 0.254 |
| nonionic-nonionic | 12 / 2 | 0.014 | 0 | 1.01x | 0.029 |

Findings: the ideal rule is accurate for same-charge pairs (MAE ≤ 0.07 log). It strongly overestimates CMC for anionic+cationic (~15x), anionic+zwitterionic (~9x) and anionic+nonionic (~1.9x) pairs, which are the common detergent combinations. Cationic+nonionic is scattered (MAE 0.65 with a small median bias), so a single class correction does not help there. The per-class medians are stored in `OPEN_BENCHMARK_IDEAL_MIXING_BIAS` and shown as an informational note in mixed-CMC results; the primary prediction is not adjusted. A regular-solution β model per pair is the recommended next step.

## Reproducibility

- Datasets and SHA-256: `evidence_vault/open_reference_benchmarks/data-manifest.json`
- Runner: `npx tsx scripts/open-reference-benchmark.ts` → `test_reports/open-reference-benchmark.json`
- Regression suite: `src/utils/__tests__/openReferenceBenchmark.regression.test.ts` (registered in `src/utils/test-calculations.ts`)
- Full suite after the changes: 128/128 modules, 4075 assertions passed (Node 24.12.0).

## Still required for LAB_VALIDATED

Matched finished-formula lab batches across at least 10 formula fingerprints with an independent holdout (3 fingerprints, 10 batches, 30 observations), measured by registered methods (ASTM D1172 pH, ASTM D2196 viscosity, etc.). Open component data cannot substitute for this.
