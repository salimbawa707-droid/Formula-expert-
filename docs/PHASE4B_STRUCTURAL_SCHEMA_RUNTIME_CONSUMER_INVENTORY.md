# Phase 4B Structural Schema — Runtime Consumer Compatibility Inventory

**Repository baseline:** `bfaa9463abc595db0d8a1388447a57855a5262b0`  
**Review branch:** `phase4b-schema-design-review-v2-2`  
**Purpose:** Identify actual consumers before changing the existing evidence-vault data model.  
**Execution note:** Static source review only. No tests executed in this inventory and no runtime behavior changed.

## 1. Verified consumer map

| Concern | Verified file | Current behavior / constraint | Change risk |
|---|---|---|---|
| Canonical domain model | `src/domain/vault/types.ts` | Defines `VaultState`, `EvidenceRecord`, `DatasetRecord`, `DatasetColumn`, `ScientificMaturityStatus`, inspection and phase status enums | High: changing types affects seed data, UI, exports and gate logic |
| Seeded state / blockers | `src/domain/vault/initialData.ts` | Provides canonical dataset/evidence/engine records, nullable row and sample counts, active Phase 4B blockers, Phase 5 locked state | High: must not replace unresolved states with invented values |
| Runtime state persistence | `src/components/ScientificRoadmapVault.tsx` | Stores the vault under `DETERGENT_FORMULA_EXPERT_VAULT_STATE_V1`; localStorage restore accepts parsed data when `version`, `phases`, and `engines` are truthy | High: weak shape validation can admit malformed or outdated state; any fix needs backward-compatible import/migration tests |
| JSON backup/import validation | `src/utils/vault/vaultLogic.ts` — `validateAndParseVaultJSON` | Checks JSON syntax, selected top-level arrays and duplicate IDs; returns parsed object cast as `VaultState` after those checks | High: this is not full structural validation and should not be replaced with an incompatible schema without migration tests |
| Phase 5 gate | `src/utils/vault/vaultLogic.ts` — `canUnlockPhase5` | Requires Phase 4B CLOSED and reportedClosed, independent verification CONFIRMED, provenance VERIFIED, accounting RECONCILED, ledger CONSISTENT, all datasets inspected with positive non-null row counts, no open high/critical findings, and no active Phase 4B blockers | Critical: new schema must never bypass or weaken these requirements |
| Dataset promotion | `src/utils/vault/vaultLogic.ts` — `canPromoteEngineToValidation` | Requires a linked, numerically inspected dataset with positive non-null row count | High: count units must not be confused with physical independent sample counts |
| Dashboard metrics | `src/utils/vault/vaultLogic.ts` — `calculateVaultMetrics` | Counts inspected datasets using inspection status plus positive non-null row count; counts lab-verified engines only when maturity is LAB_VALIDATED and independent verification is VERIFIED | High: preserve both independent evidence conditions |
| Roadmap UI | `src/components/vault/RoadmapView.tsx` | Renders phase states and displays `canUnlockPhase5` gate reason | Medium: UI labels must reflect actual gate output |
| Dataset UI | `src/components/vault/DatasetsView.tsx` | Renders nullable row/column counts; `null` is shown as uninspected for column counts | Medium: unknown vs zero display semantics must remain explicit |
| Dataset editing UI | `src/components/vault/VaultModals.tsx` | Dataset inspection modal edits row count, column count, hash, designation and related fields; engine modal exposes scientific maturity choices | High: field-level validation and null handling need explicit UI behavior |
| CSV export | `src/utils/vault/vaultLogic.ts` — `exportVaultToCSV` | Exports null row/column counts as `NULL_UNINSPECTED`; exports source license text and maturity status | Medium: any new metrics need clear unit labels and lossless null representation |
| Regression tests | `src/utils/__tests__/vaultLogic.regression.test.ts`, `src/utils/__tests__/evidenceVaultIntegrity.regression.test.ts` | Tests current Phase 4B/Phase 5 states, null preservation, promotion rules, integrity and import/export behavior | Critical: extend rather than replace these suites |

## 2. Compatibility findings

### A. Do not change `DatasetColumn.missingCount` to nullable without auditing every consumer
The current interface defines `missingCount: number`. The initial seed and historical examples use numeric values, including zero. A nullable change may be scientifically appropriate when column completeness has not been inspected, but every rendering, aggregation, export, validator and seed must be reviewed first. Do not treat a seeded zero as proof that source-level missingness was actually measured unless the corresponding inspection evidence supports it.

### B. The vault's existing schema version is not the V2.1 proposal version
The canonical TypeScript model uses `VAULT_SCHEMA_VERSION = '1.0.0'` and the initial state uses `version: '1.0.0'`. The proposed `2.1.0-v2.1` schema cannot be adopted by simply changing a version string. It requires a versioned migration plan for persisted localStorage and imported backups.

### C. Current localStorage restore does not run the backup validator
`ScientificRoadmapVault.tsx` parses saved JSON and accepts it if `parsed.version && parsed.phases && parsed.engines`. This is weaker than the checks in `validateAndParseVaultJSON`, which itself does not validate every field. Before a runtime schema migration, the restore and import paths should share a tested validator/migration boundary. Malformed or unknown-version state should fail safely without silently discarding the user's only saved copy.

### D. Phase gates are separate from schema validation
The gate is a domain function over the canonical vault state. Schema validity, file checksum success, license review, source inspection and scientific validation are separate statuses. None may automatically set `phase4B.status = CLOSED`, `independentVerificationStatus = CONFIRMED`, or unlock Phase 5/6.

### E. Do not treat a positive row count as a physical sample count
The gate's positive `actualRowCount` condition is a current repository policy. Reports explicitly distinguish workbook/parser rows from independent physical observations. Schema changes should introduce separate named metrics (e.g., worksheet rows, numeric-bearing rows, measurement cells, experimental groups, independent samples) rather than overloading `actualRowCount`. Any future gate-policy change requires separate review and regression coverage.

### F. License, byte integrity and scientific maturity remain separate
`EvidenceRecord.license`, `sha256Hash`, `numericalInspectionStatus`, `supportedEngineIds` and engine `scientificMaturity` represent different concerns. A schema should not collapse them into a single “verified” flag. A verified file hash cannot authorize commercial use or promote an engine to `LAB_VALIDATED`.

## 3. Recommended implementation order

1. Add focused regression tests for current restore/import validation and preserve current persisted state on validation failure.
2. Define a versioned schema/migration boundary using current canonical types and explicit legacy handling.
3. Add separate unit-labelled inventory metrics without rewriting historical evidence records.
4. Extend UI and CSV export to show each metric and unknown value explicitly.
5. Add optional Davies and Krafft records only after scientific field definitions and applicability metadata are specified.
6. Run typecheck, all project test commands, evidence integrity verification and relevant workflow gates.
7. Audit the resulting diff and CI results independently. Do not close Phase 4B or unlock Phase 5/6 as a side effect.

## 4. Required tests before any runtime schema merge

- Current version-1.0.0 export/import round trip remains valid.
- Legacy localStorage with missing optional fields is handled deterministically and without destructive reset.
- Malformed JSON, wrong top-level types, missing required arrays, duplicate IDs and unsupported versions fail closed with actionable errors.
- Known zero and unknown null remain distinct across UI, JSON, and CSV.
- Negative counts are rejected; non-null counts are integers.
- Unlike units cannot be aggregated into one “total records” value.
- Hash match alone cannot promote scientific maturity or license status.
- Unknown/restricted licensing cannot be marked commercially cleared.
- Missing source lineage blocks benchmark eligibility.
- Out-of-domain Davies results are explicitly flagged.
- Krafft records may omit unknown molecular structure without inventing a SMILES.
- Schema migration alone cannot change phase status or bypass `canUnlockPhase5`.

## 5. Audit limitations

This inventory was derived from the listed source files and GitHub code-search excerpts at the verified baseline. It is not a full local compile/test run and does not claim all consumers have been found by global text search. Before implementation, a full source checkout/build and exhaustive symbol search should confirm the impact map.
