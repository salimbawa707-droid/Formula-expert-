# R&D Lab Capability Migration — Forensic Plan

Status: Phase 0 baseline captured; implementation not yet approved.
Target: `salimbawa707-droid/Formula-expert-`
Source: `salimbawa707-droid/detergent-rnd-lab`
Working branch: `migration/rnd-capability-integration`
Baseline target commit: `704f5e77fa2c9595b466af446b3f60e1de852373`
Baseline source commit: `4ace00fd69bc567995fb6f3bfe0b6d26dbded592`

## Non-negotiable migration rules

1. Formula Expert remains the single product, persistence, domain-model, and scientific-engine authority.
2. No source module is copied wholesale merely because it exists or has a large UI.
3. Never overwrite an existing file as part of migration. Add new files first; any later edit to an existing file requires a reviewed, minimal diff against its exact current blob SHA.
4. Never delete or archive the source repository during this work.
5. No scientific result may silently substitute an assumed pH, water hardness, wash volume, dose, batch size, supplier assay, purity, density, pKa, CMC, or chelation capacity.
6. Unknown or unsupported inputs must produce an explicit blocked / insufficient-evidence state, not a plausible numeric result.
7. Calculated, estimated, measured, and independently validated results must remain distinct.
8. Every migrated datum must carry source, supplier/form/assay where applicable, units, conditions, uncertainty or confidence, and verification status.
9. Existing PHEngineV2 and Formula Expert domain taxonomy remain authoritative. No second pH or neutralization authority.
10. Do not merge to `main` until CI, regression, security, migration and reviewer gates pass.

## Baseline facts and immediate blockers

- Target main is at `704f5e77fa2c9595b466af446b3f60e1de852373` (2026-11-09).
- Source main is at `4ace00fd69bc567995fb6f3bfe0b6d26dbded592` (2026-08-03).
- Target package scripts expose `build`, `test:phase6`, `test:all`; full test execution must be confirmed in CI, not inferred from a prior pass.
- Latest target workflow run `42587862040`: dependency/build and P1 Phase 6 lab-evidence regression passed; full registered TypeScript regression failed; Android debug APK job skipped. This is a hard merge blocker.
- The target's latest AIFormulator path contains dangerous fallback behavior requiring a separate correctness fix before feature integration: fallback pH 8.0; water hardness 150 ppm; wash volume 10 L; wash dose 20 g; batch size 100 kg; active matter fallback from ingredient-name defaults; silent formula percentage rebalancing. These defaults can turn missing or invalid evidence into apparently valid performance scores.
- The target already has Lab Notebook, Inventory/Production, R&D calculators, documentation/compliance, chemical library, evidence vault, persistence and scientific engines. Migration must first map existing target equivalents to avoid duplication.
- Source repository contains 23 zero-byte files and no established CI workflow. Its calculators and localStorage records are not validated production services.

## Feature migration decision matrix

| Source capability | Decision | Target integration rule |
|---|---|---|
| LabNotebook experiment folders, formula snapshots, stability/performance tests, failures, SOPs | Candidate P0 | Reuse target DB, formula version/fingerprint and evidence-vault contracts. Preserve immutable experiment snapshots and provenance. No parallel localStorage database. |
| InventoryProduction batch records and raw-material consumption | Candidate P0 | Reuse target inventory, production and batch-log services. Reconcile stock by immutable ledger events; do not import aesthetic defaults or fabricate cost/stock. |
| RCCalculators workflows (LABSA neutralization, HLB, active matter, dilution, mixed CMC, chelator scenarios) | Candidate P1 | UI/workflow only after mapping each calculation to one authoritative target engine. Recalculate with target engine and compare benchmark vectors. |
| DocsLibrary SDS, packaging compatibility, claims, warnings, registrations, reminders | Candidate P1 | Reuse target document/compliance and provenance systems. Claims remain unapproved until supporting evidence and applicable jurisdiction are recorded. |
| chemicals.ts and surfactant catalogue | Candidate P1 | Record-by-record reconciliation. Require canonical identity, CAS/INCI where applicable, commercial form, active assay, density/purity, units, source, conditions and review status. Quarantine ambiguous or unsupported records. |
| SmartFormulaAnalyzerPro UI/workflow | Selective | Reuse only validated interaction patterns; all displayed outputs must come from target engines and retain status/provenance. |
| AIFormulator UI/workflow | Selective | Reuse interaction ideas only; no copying of calculation logic or assumptions. |
| Source pHEngine.js / calculators.ts numerical logic | Reject as authority | Do not add duplicate pH/neutralization/calculation engines. Audit test cases and constants individually; migrate only independently verified evidence. |
| Source localStorage persistence | Reject | No separate persistence store; migrate data models through target DB/service contracts only. |

## Required work phases

### Phase 0 — Baseline and architecture map
- Capture exact source/target commit SHAs, file manifests, package/test scripts, target equivalents and latest CI.
- Produce a source-to-target mapping with ADD / ADAPT / REJECT / ALREADY EXISTS dispositions.
- Establish immutable baseline regression results and identify all current failures.
- No destructive changes.

### Phase 1 — Scientific correctness and fail-closed remediation
- Remove the fallback pH, hardness, wash-volume, dose and batch-size assumptions in AIFormulator.
- Do not substitute active matter from ingredient names when an assay is absent; surface missing-assay status.
- Do not normalize an invalid formula silently. Show mass-balance error and require explicit user correction or an explicitly selected water-balance operation with a traceable before/after record.
- Ensure cleaning performance requires a valid pH and, for categories that depend on it, explicit hardness and wash scenario.
- Audit the hard-coded chelation conversion constants and ensure the denominator and wash-dose basis are explicit, dimensionally consistent and sourced.
- Ensure fallback compatibility / cleaning states cannot present a fabricated score such as 100 or “High”.
- Add regression tests for missing, null, zero, negative, NaN, out-of-range and conflicting inputs.
- Audit UI admin visibility separately from server-side authorization; client-side gating is never a security boundary.

### Phase 2 — Lab Notebook integration
- Compare target Lab Notebook implementation and target DB schema with source LabNotebook.
- Add only missing experiment/stability/SOP workflows, with immutable formula snapshot and evidence linkage.
- Build UI using existing target design system; do not add a duplicate app shell or duplicate persistence.
- Test create/read/update permissions, versioning, audit trail and export/import round trips.

### Phase 3 — Inventory and production integration
- Map raw-material inventory, supplier lots/COA, stock movements, production batch, QC release and wastage.
- Use ledger-based stock changes and idempotent transaction IDs.
- Distinguish theoretical consumption from actual weighed consumption; record variance.
- Test concurrent updates, negative-stock prevention, batch traceability and rollback.

### Phase 4 — R&D calculator workflows
- Inventory all target calculator engines before porting source UI.
- For each calculator, document equation, symbols, dimensions, assumptions, supported chemistry, input bounds, source and uncertainty.
- Validate with independently calculated benchmark cases and dimensional-analysis tests.
- Reject any calculator whose source constants or commercial-grade assumptions cannot be verified.

### Phase 5 — Chemical/surfactant catalogue reconciliation
- Deduplicate by canonical chemical identity, not display name alone.
- Verify CAS/INCI, salt/hydrate, molecular weight, commercial grade, active matter, pKa/pKb, density, CMC and temperature/ionic conditions.
- Store source/provenance and evidence grade. Unknowns remain quarantined and unavailable to production calculations.
- Do not infer supplier COA from generic literature values.

### Phase 6 — Documentation, compliance and UX
- Add missing SDS, label, packaging, claim-substantiation, warnings and registration workflows only where target lacks them.
- Make claims jurisdiction-aware and evidence-gated. Never auto-approve “biodegradable”, “phosphate-free”, “microplastic-free” or safety claims from ingredient names alone.
- Improve UI/UX only after workflows and data contracts are stable. Accessibility, mobile layout, empty/error states and localization are required.

### Phase 7 — Validation and release
- Build, typecheck, full registered tests, scientific golden-vector tests, property/dimensional tests, security/authorization tests, DB migration tests and production build.
- Run all checks against the exact PR head SHA.
- Review generated diff for accidental overwrites, duplicate engines, hidden assumptions, secrets, test bypasses and generated artifacts.
- Merge only after all required checks are green and release notes / rollback plan are prepared.

## Scientific validation standards

- A mathematical solver passing unit tests proves software behavior, not model validity for concentrated detergent matrices.
- Davies / Debye-Hückel activity corrections have a limited ionic-strength domain; concentrated, high-electrolyte detergent systems require a justified activity model or an explicitly labelled screening approximation.
- pH prediction must state temperature, dilution, ionic-strength treatment, chemical speciation coverage, input assay and convergence diagnostics.
- Active surfactant matter is calculated from commercial ingredient mass fraction multiplied by verified supplier active assay; generic ingredient-name defaults are not acceptable for a release-grade result.
- Chelation capacity must state CaCO3-equivalent basis, ligand form, pH, stoichiometry, competition assumptions, kinetic limitations and wash dilution.
- HLB/CMC values must retain temperature, solvent, salt and method conditions; values from incompatible conditions cannot be combined as universal constants.
- No formula may be called production-ready or scientifically validated solely because a model score is high.

## Phase completion record

Each phase must append:
- files added/changed and reason;
- source-to-target mapping and rejected duplicates;
- exact commit SHA;
- commands and CI run URLs;
- test counts, failures and unresolved warnings;
- scientific assumptions and evidence references;
- rollback procedure;
- explicit status: PASS / BLOCKED / PARTIAL.

Current status: PHASE 0 BASELINE CAPTURED; PHASE 1 NOT STARTED. No application feature has been migrated or merged.
