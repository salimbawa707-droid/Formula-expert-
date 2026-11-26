# ENG-005 FoamKineticsEngine — First Implementation Increment

**Date:** 2026-11-25  
**Review type:** AI engineering review; `human_review=false`  
**Base dependency:** PR #98, source-provenance AI review  
**Status:** CODE IMPLEMENTED for measured-series analysis only; formulation prediction remains NOT READY.

## Why the scope is deliberately narrow

The audited repository had no ENG-005 implementation. The available RepOD MKCDUM dataset has only concentration-level summaries, no raw replicate rows, unresolved variable/unit conflicts, and no matched commercial detergent formula. It cannot support a formula-level kinetic predictor.

A more appropriate primary research lead is:

- Izawa, James & Yethiraj (2026), *The decay of saline surfactant foams: a study at macroscopic and bubble scales*, Royal Society Open Science 13(2), 251765.
- Article DOI: https://doi.org/10.1098/rsos.251765
- Supplementary collection DOI: https://doi.org/10.6084/m9.figshare.c.8304092
- Article license: CC BY 4.0.
- Article reports four replicates per salinity, time-dependent macroscopic foam/liquid levels, and bubble cross-sectional area.
- Experimental system: 0.0047 ± 0.0002 mol/L Triton X-100 in synthetic brines at 0, 7, 21, 35 and 107.133 g/kg.

The paper distinguishes an early drainage regime (0–2,000 s), an intermediate collapse/coalescence regime (2,000–12,000 s), and a late logarithmic-height regime beginning around 12,000 s for this particular experiment. It reports linear mean bubble-area growth over an early interval up to approximately 5,000 s. These intervals are source-specific and are never imposed as universal defaults by the code.

## Implemented API

File: `src/utils/foamKineticsEngine.ts`

Entry point: `analyzeFoamDecayReplicate(replicate, options)`

Capabilities:
1. Validates replicate ID, finite non-negative values, distinct time points, and consistent height reference.
2. Calculates foam height as measured foam-top height minus measured liquid level when both are supplied.
3. Calculates observed half-height time by linear interpolation only when the measured series crosses half its initial height; it does not extrapolate a missing crossing.
4. Optionally fits measured foam height against log10(time) in a caller-selected late-time interval.
5. Optionally fits measured mean bubble area against time in a caller-selected interval.
6. Returns fit coefficients, R² where defined, point counts, and explicit warnings.

## Explicitly not implemented

- No formula/ingredient-to-foam prediction.
- No Ross–Miles prediction.
- No laundry drum / high-speed agitation foam model.
- No liquid drainage-rate solver.
- No conversion of a fitted descriptive curve into a universal kinetic law.
- No claim of validation against commercial detergent recipes.

The 2026 study uses Triton X-100 and synthetic brines. It supports descriptive analysis of measured foam ageing in that specific system; it does not validate detergent products or formulations.

## Data acquisition status

The article and supplementary collection have been identified, but supplementary files have NOT yet been acquired, hashed, parsed, or reconciled to the published figures. The new EVD-013 record is therefore `IDENTIFIED`, `PENDING_RETRIEVAL`, and `UNINSPECTED`. The article's CC BY 4.0 license is recorded, but file-level supplementary license and redistribution terms remain `REVIEW_PENDING`.

## Tests

New self-running regression suite: `src/utils/__tests__/foamKineticsEngine.test.ts`, registered in `src/utils/test-calculations.ts`.

Coverage includes:
- foam-top minus liquid-meniscus calculation;
- observed half-height interpolation;
- exact synthetic logarithmic-fit recovery;
- exact synthetic bubble-area linear-fit recovery;
- duplicate timestamp rejection;
- negative measurement rejection;
- liquid-level/foam-top consistency.

These are software contract tests with synthetic fixtures, not experimental validation.

## Gate disposition

- ENG-005 implementation status: `IMPLEMENTED` (measured-series analysis utility only).
- Scientific maturity: `CODE_IMPLEMENTED`.
- Evidence coverage: 0%.
- Numerical validation readiness: `NOT_READY`.
- Independent verification: `UNVERIFIED`.
- ENG-003 remains separately blocked for lack of matched formulation-prediction pairs.
- Phase 4B remains OPEN; Phase 5 remains LOCKED.

## Next required work

1. Acquire and hash the Figshare supplementary files.
2. Parse replicate-resolved time series and record exact source columns/units.
3. Reproduce published means/standard deviations and figure curves from the four replicate series.
4. Add source-backed regression fixtures only after numeric transcription has been independently checked.
5. Keep a separate future workstream for detergent-specific formula-to-foam prediction, which requires matched formulations and controlled foam tests.


## 2026-11-26 follow-up — scientific interpretation and edge-case hardening

The primary article explicitly states that its foam decay is clearly non-exponential and that a conventional half-life is not very meaningful for the long-time logarithmic regime. The output previously named `halfHeightTimeSeconds` is therefore renamed to `observedHalfHeightCrossingTimeSeconds`. It is a descriptive threshold-crossing time found by interpolation between actual measured points; it is not a kinetic half-life, and the API now returns an explicit warning against that interpretation.

Additional software-contract corrections:
- Reject mixed height-reference series where liquid-meniscus height is supplied for only some time points. Mixing corrected foam heights with uncorrected top heights would bias the series.
- Return R-squared as `null` when the response has zero variance; R-squared is undefined in that case, even if the fitted constant equals every observation.
- Warn when a requested bubble-area fit omits eligible time points with missing bubble-area measurements.
- Add regression coverage for these cases and for the explicit non-half-life interpretation.

Source basis: Izawa, James & Yethiraj (2026), *The decay of saline surfactant foams: a study at macroscopic and bubble scales*, Royal Society Open Science 13, 251765, DOI 10.1098/rsos.251765. The article describes late-time logarithmic foam-height decay and states that conventional half-life is not meaningful for that non-exponential decay. The study uses Triton X-100 in synthetic brines, so it remains an adjacent physical-foam study, not a detergent-formula validation dataset.

Evidence boundary unchanged: code regression tests use synthetic fixtures only; supplementary time-series have not yet been acquired/reconciled in this repository; no empirical validation or detergent formulation predictor is claimed.