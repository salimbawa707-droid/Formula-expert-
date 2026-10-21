# Commercial Empirical Validation Readiness

Updated: 2026-10-21

## What the app can claim today

- The validation hub now exposes category scorecards for all 13 canonical product categories.
- The scientific orchestrator is the prediction source for the properties it returns. A lab row is compared only when its formula fingerprint exactly matches that formula's supplied empirical fingerprint.
- Metrics are computed on a deterministic formula-group holdout. Calibration fingerprints are excluded from reported validation metrics. The commercial gate now requires 10 eligible formula fingerprints overall and at least 3 distinct formula fingerprints in the holdout; two-formula datasets cannot earn `LAB_VALIDATED`.
- A 90% within-tolerance rate is a minimum validation target, not a measured result or guarantee. A `LAB_VALIDATED` result also requires at least 10 eligible formula fingerprints overall, 3 distinct formula fingerprints in the independent holdout, 10 independent holdout batches, and 30 comparable holdout observations.
- A target is active only when its configured method is registered for that property and requested category; category-limited protocols cannot be pooled into an unscoped cross-category score. A target without an eligible registered method and acceptance threshold can show exploratory comparisons but cannot receive `LAB_VALIDATED` status.
- Current registry coverage is incomplete: ASTM D1172 pH is registered for all 13 categories; ASTM D2196 viscosity is registered for 12 liquid categories; ASTM D3050 is a laundry-only screening method and cannot substantiate detergent ranking. Finished-liquid density now has an explicitly internal calibrated-pycnometer method for the 12 liquid categories; laundry-powder bulk density remains a separate unregistered target. ISO 2271 is now registered as an anionic-active-matter method for eligible detergent categories, but an observation is rejected unless a controlled formula/BOM reference confirms anionic-only surfactants and no cationics. Neither registration supplies missing empirical data or product release limits.
- No 90–95% accuracy claim is supported until matched, category-specific, independently held-out lab data meets the evidence gates. The currently catalogued 39 formulas do not constitute such a dataset.

## Data source and commercial-use gates

- SURFPRO is a pure-surfactant CMC/surface-tension reference, not finished-detergent formula validation. The source repository's `LICENSE.md` declares CC BY-NC-SA 4.0, while the corresponding Zenodo record's rights field is blank. It is therefore marked `DO_NOT_INGEST_IN_COMMERCIAL_PRODUCT` in `datasets/source-register.csv` absent separate written permission. See the [SURFPRO dataset](https://zenodo.org/records/15861809) and [repository license](https://github.com/BigChemistry-RobotLab/SurfPro/blob/main/LICENSE.md).
- PSDI's historical CMC collection declares CC BY 4.0, but the archived audit still reports unresolved references, malformed codes, and a compound identity conflict. Its README keeps it in raw archive only; it must not be treated as a cleared model benchmark until those records are reconciled.
- Zenodo 18961871 rheology/foam workbooks remain quarantined for rights, schema, conditions, and row-to-measurement lineage checks. Their specialized observables cannot validate complete detergent recipes by themselves.
- Published values and open data are reference evidence, not a substitute for controlled product-lab measurements. Import provenance now defaults to unknown, fabricated lab/operator names and evidence IDs are not generated, and real-lab imports require a raw evidence reference. Unregistered test methods are review-only.

## Open-reference component benchmarks (2026-10-21)

- The pH, pure-CMC and mixed-CMC engines are now benchmarked against openly licensed published measurements: IUPAC 2002 pH standards (© 2002 IUPAC), a filtered PSDI/NIST CMC homolog slice (CC BY 4.0) and Sandia P2SURF binary-mixture CMC data (MIT). See `open_reference_benchmarks/` and [`OPEN_REFERENCE_BENCHMARK_REPORT.md`](./OPEN_REFERENCE_BENCHMARK_REPORT.md).
- Result: the Davies pH model is within 0.015 pH of the six supported 25 °C standards after an activity-model fix. The ideal mixed-CMC rule is accurate for same-charge pairs but overestimates anionic+cationic, anionic+amphoteric and anionic+nonionic mixtures by about 15x, 9x and 1.9x.
- These are component-level reference checks. They do not change `REAL_LAB_DATA_COUNT = 0` and cannot earn `LAB_VALIDATED`.

## Standard method notes

ASTM D1172-15(2024) is an active guide for preparing aqueous soap/detergent solutions and determining their pH ([ASTM catalog](https://store.astm.org/d1172-15r24.html)). ASTM D3050-26 is a screening guide for artificially soiled fabrics and explicitly is not suitable for detergent ranking ([ASTM catalog](https://store.astm.org/d3050-26.html)). ASTM D1298 covers crude petroleum and liquid petroleum products, so it is not accepted for finished detergent density ([ASTM catalog](https://store.astm.org/d1298-24.html)). ASTM D2196-20(2026) is active for rotational rheology and requires the selected method/geometry conditions to be recorded ([ASTM catalog](https://store.astm.org/d2196-20r26.html)). ISO 2271:1989 determines anionic-active matter by direct two-phase titration, but its stated scope does not apply when cationic surfactants are present ([ISO catalog](https://www.iso.org/standard/7094.html)). Method registrations must respect property, category, unit, and chemistry scope; a standard name alone does not qualify a record.

## Remaining commercial release work

1. Curate permitted source datasets with row-level citations, license, measured conditions, methods, uncertainty, and stable identifiers.
2. Register category- and subclass-specific protocols/acceptance limits for remaining scorecard targets, including powder bulk density and product-specific limits; keep internal procedures distinct from ASTM/ISO standards.
3. Collect matched lab runs across multiple independent formula fingerprints and manufacturing batches; retain raw evidence and review decisions.
4. Run the held-out evaluations separately by category and property. Report observed coverage, uncertainty, within-tolerance percentage, MAE/RMSE, and out-of-domain limits.
5. Complete jurisdiction-specific regulatory, label, claims, packaging, manufacturing, and safety review before calling the product commercially released.
