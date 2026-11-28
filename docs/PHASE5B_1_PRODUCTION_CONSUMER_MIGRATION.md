# Phase 5B-1 — Production Bounded Consumer Migration

Date: 2026-11-28
Status: implementation submitted for exact-head CI; preliminary calculations only.

## Integrated consumers

- The adapter maps ActiveMatterEngine resolutions to explicit evidence classes. Catalog defaults and name-derived grades cannot become supplier assays.
- AIFormulator and SmartFormulaAnalyzerPro display active-matter range/point assumptions, unknown raw mass, complete versus incomplete pricing, and release-ineligible status.
- The legacy cost engine remains unchanged. AIFormulator labels its known-price subtotal as partial when any non-zero ingredient lacks a price and suppresses a false finished-formula cost/kg.
- Scientific quality gate blocks non-authoritative active-surfactant assay evidence from release-grade status.
- Multi-objective optimizer rejects candidates carrying the explicit non-release-grade active-matter blocker.
- Regression coverage verifies catalog defaults, strict source-backed mapping, unknown mass and incomplete pricing.

## Deliberate boundaries

- No numeric intervals are invented from grade names. Bounds are used only when explicit lower/upper fields exist; otherwise the UI labels a point assumption.
- The bounded report is always releaseEligible=false, even when arithmetic is complete.
- Supplier quotations and lot CoAs are not inferred from user-entered prices or generic labels.
- This PR does not migrate every call site in the Phase 5B-1 inventory (staged workflow, calculators, performance-fraction card, grade engine and all DAG projections remain follow-up work).
- Phase 4B remains OPEN; Phase 5 empirical validation/calibration remains LOCKED.
- AI review only; no human approval, supplier-lot validation or laboratory validation is claimed.
