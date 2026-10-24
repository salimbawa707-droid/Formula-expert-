# Formula Expert correction package (2026-10)

This is a safe correction and integration plan, not a claim that SurfPro/P2SURF inference is integrated.

## Corrections
- Never return placeholder CMC numbers as published-model predictions.
- Return explicit UNAVAILABLE until a real model adapter is wired and passes provenance, input-domain, and output validation.
- Clint ideal mixing requires positive finite CMC inputs and a valid mole fraction; it is an estimate, not a measured/model result.
- License checks use exact identifiers, not substring matching. Missing or uncertain licensing fails the gate.
- A license identifier alone does not prove that the dataset files are covered or that commercial reuse is allowed.
- Published/model outputs are not LAB_VALIDATED.
- Do not claim accuracy or overall maturity percentages without reproducible metrics and a defined denominator.

## Scope
This adds guarded reference code and metadata validation. It does not train models, download weights, establish commercial reuse rights, create lab data, or wire the predictor into formula optimization/UI. Phase 4B/5 remain fail-closed until existing evidence requirements pass.

## Verify
```bash
python -m unittest discover -s tests/corrections -v
python scripts/validation/check_dataset_licenses.py --help
npm run typecheck
npm test
npm run benchmark:open-reference
```
Do not report npm checks as passed unless executed in the repository environment.
