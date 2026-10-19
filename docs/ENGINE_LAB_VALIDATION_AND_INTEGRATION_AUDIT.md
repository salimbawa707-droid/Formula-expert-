# Engine evidence and integration audit

**Audit date:** 2026-10-19  
**Repository baseline:** `main` at the time this audit was prepared  
**Inventory:** `engines_reconciled.list` (59 TypeScript modules)  
**Scope:** Static module imports and the repository's recorded external evidence. This is not a runtime execution trace or a laboratory certification.

## Findings

- **No: the app does not have lab-validated data for all engines.** The repo's P15 audit records zero genuine in-app lab observations. A literature dataset can be an external benchmark, but it cannot be presented as this app's own laboratory validation.
- The only openly licensed experimental datasets previously archived here are the narrow PSDI historical CMC collection and RepOD conductivity/CMC curves. Both remain quarantined from calibration. They do not directly validate the app's detergent cleaning, pH, rheology, chelation, compatibility, manufacturing, spectroscopy, powder, or other predictions.
- The PSDI CMC archive has 4,990 measurement rows and 719 compound records; its codebook/reference review is improved, but row-level identity and source reconciliation remain incomplete. RepOD has 202 preserved source rows; conditions and a cell constant are missing, so conductivity cannot be converted to specific conductivity or treated as general detergent performance evidence.
- A static import scan of these 59 engine files found **75 direct engine-to-engine import edges**. Twenty-eight modules import at least one other inventoried engine, and 26 have no direct incoming import from another inventoried engine. That does **not** prove those 26 are unused: UI routes, registries, dynamic imports and modules outside this inventory can call them.
- `analysisWorkflowEngine.ts` directly imports 14 inventoried engines and defines an ordered staged workflow. It is not an all-engine execution chain; specialized modules (for example spectroscopy, LIMS, regulatory and instrument automation) have separate flows. An all-to-all dependency would be inappropriate. Runtime connection and end-to-end behavior still require executing the repository's tests/build.
- The existing regression suite contains targeted tests for empirical validation and closed-loop workflows. The repository now has a read-only GitHub Actions verification workflow on main. This PR branch update will request the workflow to run its typecheck, regression suite, production build and HTTP smoke test; results must be read from the resulting run before calling runtime verification complete. A local checkout could not be performed because shell GitHub access is blocked in this environment.

## Data coverage decisions

| Engine family | Evidence needed | Current outcome |
|---|---|---|
| Formulation, pH/neutralization, active matter, HLB, chelation, viscosity/rheology, density/NVR, cleaning, compatibility, climate, optimization, substitutions, manufacturing, powder | Raw measurements that match the predicted output, formula/material identity, test method, conditions, units, uncertainty, replicates and explicit dataset license | No directly matched, license-verified validation dataset is currently mapped to each output. PSDI/RepOD are narrow, quarantined candidates only. |
| Spectroscopy | Reusable reference spectra with material identity and instrument/calibration/processing metadata | No license-verified reference-spectrum dataset is mapped to the app in this audit. |
| Regulatory | Official, versioned jurisdiction sources and rule-to-output fixtures | This is not laboratory validation; confirm applicable official source coverage separately. |
| Costing/inventory | Dated regional supplier quotes and stock records; deterministic mass and cost reconciliation fixtures | This is not laboratory validation; live market inputs are not universal. |
| LIMS, provenance, lab evidence, closed-loop and automation | Workflow contracts, instrument-export fixtures, audit lineage; real measurements for empirical promotion | Existing regression coverage is present, but there are zero real in-app observations in the recorded audit. |

The complete 59-module inventory, direct import degrees, evidence requirement and per-module evidence status are in [`engine-module-evidence-audit.csv`](../evidence_vault/datasets/engine-module-evidence-audit.csv).

## Correctness fixes made in this branch

1. Empirical evaluation returned MAE/RMSE/bias/variance as zero when there were no observations or no comparable predictions. These are now `null` (unavailable), and the leakage audit no longer reports an unevaluated dataset as passed.
2. Closed-loop batch evaluation previously set `overallPass=true` for an empty batch or when any evaluated measurement had no specification. It now reports `INSUFFICIENT_DATA` or `NOT_APPLICABLE` distinctly, and only reports `overallPass=true` for an actual applicable batch with no failures or missing specifications.
3. Added regression assertions for both empty/no-comparable empirical data and empty/no-specification closed-loop measurements.

## Remaining work before any lab-validation claim

- Acquire or identify explicitly reusable raw measurements for each measurable prediction output; verify license, source, method, conditions, uncertainty, formula identity and row lineage.
- Resolve the remaining PSDI identity/reference curation queue and the missing RepOD method/cell-constant metadata.
- Add independent, domain-matched holdouts and run full typecheck, regression suite and production build from a credentialed checkout.
- Keep each engine's status separate: deterministic calculation, software-tested, literature-benchmarked, internally lab-tested, and independently lab-validated are different claims.
