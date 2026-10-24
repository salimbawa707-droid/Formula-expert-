# CMC / Surface-Tension Integration Gate

SurfPro and P2SURF are candidate model sources, not proof that this repository has a callable inference adapter.

1. Validate component identity/SMILES, finite temperature, positive finite mole fractions, and fractions summing to 1 within a documented tolerance.
2. Pin real model weights, preprocessing, version, source commit, and runtime.
3. Validate output units, finite positive CMC values, uncertainty, provenance, and applicability domain.
4. Return explicit UNAVAILABLE when no adapter is wired, inference fails, or inputs are out of domain. Never fabricate a numerical result.
5. Clint ideal mixing is permitted only with real positive finite component CMC values and a valid fraction; label it ESTIMATED.
6. Never label published-model output LAB_VALIDATED.
7. Benchmark against source-traceable held-out measured data with leakage prevention and applicability-domain reporting.

A TypeScript compile or synthetic test is not scientific validation. Keep Phase 4B/5 fail-closed until the relevant evidence gates pass.
