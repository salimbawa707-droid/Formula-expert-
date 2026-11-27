# Phase 4B AI Scientific Validation and Laboratory-Proximity Policy

Status: proposed implementation policy for Phase 4B; not a claim that laboratory validation has occurred.

## Product intent

The application provides AI-based scientific validation intended to reduce the gap between a formula-screening result and a competent laboratory assessment. It may estimate laboratory-proximity only where the relevant model has been calibrated and independently benchmarked against suitable measured observations. It must never represent a prediction, literature specification, or simulation as a measured laboratory result.

## Evidence routes

Each ingredient-grade record must use one explicit evidence route:

1. `SUPPLIER_LOT_COA`: original supplier/manufacturer COA tied to the exact grade and lot, with methods, dates, units, and measured values.
2. `INTERNATIONAL_REFERENCE_SPECIFICATION`: an applicable authoritative standard or monograph, with issuing body, standard identifier, edition/year, exact scope, clauses/table references, test methods, units, limits, and source/provenance record. This route defines reference acceptance criteria; it does not verify the user's supplier, grade, or lot.
3. `SECONDARY_LITERATURE_REFERENCE`: peer-reviewed or authoritative technical literature with exact material identity, conditions, and limitations.
4. `AI_ESTIMATED_OR_ASSUMED`: model defaults, inferred values, or user inputs without source verification.

Do not synthesize a COA. Never label routes 2–4 as a supplier COA or measured lot assay. If an applicable standard cannot be verified, keep the field `UNVERIFIED`; do not invent numerical limits.

## Validation dimensions

For every ingredient/formula result, record separate statuses and evidence for:
- chemical identity and grade resolution;
- composition, active matter, purity/solids and moisture basis;
- acid/base and ionic speciation at stated pH, temperature, and concentration;
- mass balance, unit conversions, charge balance, and uncertainty propagation;
- surfactant functionality, CMC/HLB limitations, electrolyte and hardness effects;
- pairwise and multi-component compatibility, including concentration and matrix;
- physical properties and stability risks under stated storage/process conditions;
- performance predictions (cleaning, foam, viscosity, rinsing, residue) with defined endpoints;
- safety/regulatory screens, which remain separate from performance suitability.

A result must distinguish input evidence, derived values, model predictions, and unavailable measurements.

## Quantitative score policy

Do not assign a blanket 90% or 95% score based on expert judgement. Publish a numeric score only after a versioned rubric is implemented and tested. The score must be a weighted, traceable composite of:
- identity/evidence completeness;
- model-domain applicability;
- numerical verification and uncertainty;
- benchmark agreement against matched measured data;
- formula-matrix relevance and coverage.

Each component must show its own score, weight, missing-data penalty, and evidence references. Missing critical evidence must not be hidden by averaging. Apply hard caps:
- no exact identity/grade: no overall score above 60;
- no relevant matched benchmark data for the claimed endpoint: no laboratory-proximity score above 70;
- only reference standards/literature and no matched lot/formula measurements: label as reference-based AI screening; no claim of 90–95% laboratory proximity;
- out-of-domain inputs, unresolved units, or failed mass/charge balance: block the score and return `INSUFFICIENT_EVIDENCE` or `CALCULATION_FAILED`.

A 90–95% laboratory-proximity claim is permitted only for a clearly named endpoint and validated domain after prospective or held-out benchmarking. Report sample count, dataset split, error metric (for example MAE/RMSE or classification sensitivity/specificity), confidence interval, calibration method, model version, and date. The percentage must not be described as probability of correctness unless probabilistic calibration has been demonstrated.

## User-facing wording

Preferred:
- "AI scientific validation"
- "AI reference-standard assessment"
- "Model-predicted result"
- "Estimated agreement with laboratory measurements: X%, benchmarked for [endpoint/domain] on n matched samples"
- "Laboratory confirmation required for final release"

Prohibited unless actually supported:
- "Lab validated", "laboratory tested", "COA verified", "supplier certified", or "95% accurate" as a universal statement.

Show a clear notice: "This is an AI-based scientific assessment, not a laboratory test or supplier lot certificate. Confirm critical properties using the actual raw-material lot and finished formula before production or sale."

## Phase 4B acceptance gates

- Every catalog identity has a resolved, unresolved, or explicitly ambiguous identity disposition.
- Every grade has one evidence route and traceable source records; missing evidence remains visible.
- International standards are mapped only where exact scope and applicability are demonstrated.
- Applicability decisions are endpoint-specific and do not inherit from identity alone.
- Numerical engines pass dimensional, mass-balance, charge-balance, boundary, and regression tests.
- AI validation scores are benchmark-derived, endpoint-specific, uncertainty-aware, and fail closed.
- Formula-level predictions are not represented as laboratory observations.
- Exact-head CI and AI second-pass review pass; all residual limitations are documented.

This policy does not itself close Phase 4B. Closure depends on implementation, evidence coverage, benchmark adequacy, and passing gates.
