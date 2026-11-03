# Engine Count Reconciliation — 64 / 59 / 97

**Audit date:** 2026-10-25  
**Repository:** https://github.com/salimbawa707-droid/Formula-expert-  
**Audited main commit:** `891466265b3a8a6e01a6aab2c64da310116b302b`  
**Scope:** Read-only Git tree inventory and correction of misleading vault/UI claims. No scientific engine algorithm was changed.

## Decision

The three historical numbers do **not** currently share a proven definition. Do not choose one as “the true number of engines” or change the vault status to verified. The evidence supports a scoped, reproducible inventory with separately named counts:

| Count | Reproduced value | Exact definition | Disposition |
|---|---:|---|---|
| Legacy list entries | 59 | Unique non-empty paths in root `engines_reconciled.list` | All 59 paths exist in the audited tree; the list is **not comprehensive** |
| Engine-named source files | 62 | Source code files under `src/` whose basename contains “engine”, excluding UI components and test files | Reproducible filename-based count; not a count of independent scientific capabilities |
| Engine-named files including UI | 65 | Same basename rule, including three UI components | Report separately; UI components are not engine implementations |
| Broad source candidates | 94 | Non-test TypeScript/JavaScript files under `src/` whose paths match engine, calculator, optimizer/optimization, formulation, workflow, predictor, or router | Discovery candidate count only; includes adapters, helpers, UI, registries, and submodules |
| Vault top-level engine registry | 6 | Runtime `VaultState.engines` records `ENG-001` through `ENG-006` | Product-level registry records; not a file count |
| Historical Audit Report A claim | 64 | Referenced in UI/seed text, but the original report and its counting rules were not located in the audited tree | **UNVERIFIED** |
| Historical Initial Architecture Spec claim | 97 | Referenced in UI/seed text, but the original specification and its module-level list were not located in the audited tree | **UNVERIFIED** |

The 59-path manifest is a valid list of 59 existing files, but it is not proof that the repository has only 59 engine files. The repository contains no `src/core/` directory. The reconciliation modal previously showed 24 sample paths under `src/core/`; those paths were not present in the source tree and have been removed from the UI.

## What is fixed in this change

1. Added `evidence_vault/scripts/verify_engine_inventory.mjs`, a repeatable check for the 59-path legacy manifest, unique entries, path existence, the separately defined filename counts, and the broad discovery-candidate count.
2. Corrected the vault modal: it no longer presents fictional `src/core/` examples or labels 59 as the verified total number of engines.
3. Corrected the Engines and Roadmap UI text so the count definitions and unresolved historical claims are explicit.
4. Updated the seeded discrepancy notes with the actual source-tree findings and a link to this report.

## What is not claimed

- This audit does not prove what the authors originally meant by 64 or 97. Their original source artifacts/counting rules are still needed to reconstruct those claims.
- The broad 94-file candidate set is not a canonical engine count; candidates need semantic classification before it can become one.
- The six top-level registry records do not mean the app contains only six computational modules.
- No engine has been promoted to `LAB_VALIDATED`; Phase 4B remains OPEN and Phase 5 remains LOCKED.
- This is a source inventory reconciliation, not scientific validation or proof of every module's runtime use.

## Reproduction

From the repository root, run:

```bash
node evidence_vault/scripts/verify_engine_inventory.mjs
```

The script exits non-zero if the legacy list is duplicated, contains missing paths, or the audited count definitions drift. When source files change, update the expected counts only after reviewing the resulting inventory diff.
