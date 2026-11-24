# R&D Lab → Formula Expert: Source/Target Gap Audit

Baseline refs:
- Formula Expert main: `704f5e77fa2c9595b466af446b3f60e1de852373`
- R&D Lab main: `4ace00fd69bc567995fb6f3bfe0b6d26dbded592`
- Audit branch: `migration/rnd-capability-integration`

This audit compares actual source/target modules. It intentionally distinguishes capability overlap from validated scientific value.

## Findings

### 1. Lab Notebook — do not copy source component

Target `src/components/LabNotebook.tsx` already has a materially different and more advanced structure:
- LIMS dashboard integration;
- canonical product taxonomy;
- scientific learning engine;
- measurement comparability and prediction-error evaluation;
- governance registry and model-change impact analysis;
- evidence promotion guardrails.

Source `src/components/LabNotebook.tsx` is a lightweight project-folder journal with experiment snapshots and stability-study forms. It is not a better replacement. Its user-entered shelf-life estimate and stability fields are not proof of validated shelf-life prediction.

Decision: KEEP target implementation. Inspect source only for missing UX concepts (folder grouping, simple experiment journal, SOP navigation) and add them only if target lacks an equivalent. No wholesale source copy.

### 2. Inventory / Production — target engine is the better base, but persistence needs hardening

Target `src/components/InventoryProduction.tsx` delegates to `src/utils/inventoryEngine.ts` and `globalManufacturingEngine`. The target engine explicitly initializes ingredient identities with zero physical stock and unknown purchase cost. This is safer than inventing stock or supplier prices.

Source `src/components/InventoryProduction.tsx` is a large localStorage UI and depends on the older universal ingredient library. It is not a safe replacement.

Target gaps to resolve before production-grade use:
- current UI reads/writes browser localStorage; this is not a multi-user transactional inventory ledger;
- lot, supplier, COA and stock movements need immutable records and authorization;
- validate atomic deduction under concurrency at the persistence boundary, not only in client state;
- distinguish receipt, adjustment, consumption, wastage, return and reversal events;
- actual weighed quantities must be recorded separately from formula-theoretical quantities.

Decision: retain target domain engine and UI. Migrate no source inventory code. Treat persistent backend/ledger hardening as a target-native engineering task.

### 3. R&D Calculators — target already has the component; source is not a numerical upgrade

Both repositories contain `src/components/RCCalculators.tsx`. Target version imports:
- `HLBEngine`;
- `AUTHORITATIVE_CHELATOR_DATABASE`;
- `ActiveMatterEngine`;
- `IngredientIdentitySSOT`.

Source version uses `utils/calculators.ts`, a local MathTestSuite and static CMC/HLB/active-matter examples. It therefore duplicates or bypasses target authorities.

Target UI still includes static CMC examples and should be audited for condition/provenance labels. Any static benchmark must state source, temperature, medium, ionic strength, active basis and method; unsupported values must not be presented as universal material constants.

Decision: do not import source calculators. Candidate migration is limited to missing UI workflows or independently verified benchmark test cases. Every result must call one target engine.

### 4. Documentation & Compliance — source library contains untrusted demonstration data

Target `src/components/DocsLibrary.tsx` is currently a minimal static document-card shell. Source `src/components/DocsLibrary.tsx` has broader SDS, packaging, claims and registration workflows, but its default records include a specific SLES COA with numeric assay, dioxane, pH and lot number attributed to a supplier/lab. The source code itself does not establish that this COA is a genuine user-owned document. Treat it as demonstration data, not factual evidence.

Source also includes generic regulatory descriptions and example document links; those are not sufficient for legal compliance.

Decision: migrate the workflow concepts only after replacing all seeded factual-looking records with empty states or clearly labelled synthetic examples. Store uploaded original documents, source, jurisdiction, issue date, expiry/revision, reviewer and evidence linkage. Never auto-substantiate environmental or safety claims.

### 5. Chemical catalogue — quarantine until record-level verification

Source `src/data/chemicals.ts` contains useful breadth but combines chemical identity with single-value pKa, HLB, CMC, density, active matter, compatibility and biodegradability fields. Those properties depend on molecular distribution, commercial form, temperature, medium, ionic strength, pH and test method. A bare number without those conditions is not safe as a universal input.

Example: source LABSA rows assign pKa -2.8 and HLB 40. Target's legacy chemical identity database has a different LABSA pKa entry. This discrepancy must not be resolved by picking whichever value looks more plausible; LABSA is a commercial alkylbenzene sulfonic acid mixture and its apparent acidity/HLB treatment needs a defined model and evidence basis.

Decision: no bulk catalogue merge. Reconcile by canonical identity and commercial grade. Import a record only when the source, property definition, units, conditions, and verification status are explicit. Conflicting or unsupported properties remain quarantined.

### 6. SmartFormulaAnalyzerPro — reuse interaction ideas, not its computation layer

Source analyzer imports a broad set of legacy `calculators.ts` functions including estimated pH, default active matter, CPI, eco score, shelf life, viscosity and lab-health scoring. Reusing its outputs would reintroduce duplicate calculations and hidden defaults.

Decision: do not copy its computation layer. If UX is demonstrably better, recreate the relevant UI against Formula Expert's orchestrator and preserve status/provenance on every metric.

## Implementation priorities after this audit

1. P0: Remove AIFormulator fallback assumptions and silent percentage rebalancing. Add fail-closed regression tests.
2. P0: Audit client-side Admin Console visibility and confirm every privileged operation is server-authorized.
3. P1: Inventory target/source data schema and implement a provenance-gated chemical-record reconciliation report. Do not insert unverified catalogue values into the active library.
4. P1: Upgrade target DocsLibrary shell with evidence-backed document records and empty-state UX; source component is a reference, not a drop-in.
5. P1: Harden inventory persistence with server-side transactions and immutable movement ledger before production use.
6. P2: Add only missing Lab Notebook journal/SOP UX after mapping current LIMS functionality.
7. P2: Add calculator benchmark cases only after independent dimensional and scientific review.

## Explicit exclusions

- No source `pHEngine.js` migration.
- No source `calculators.ts` migration as an authority.
- No source localStorage persistence migration.
- No import of source default COA, lot, supplier, assay or regulatory assertions as verified facts.
- No wholesale replacement of target LabNotebook, InventoryProduction, RCCalculators or scientific engines.

## Audit conclusion

R&D Lab does not contain a better replacement for Formula Expert's core scientific stack. Its strongest incremental value is product workflow breadth (documentation/claims, experiment organization and some calculator UX). Formula Expert already has target-native versions of several major modules, and in Lab Notebook the target is stronger. The safest integration is selective UX and evidence workflow expansion, not codebase merging or bulk copying.
