# Phase 4B Structural Schema — V2.1 Forensic Review and V2.2 Correction Plan

**Repository:** https://github.com/salimbawa707-droid/Formula-expert-  
**Audited ref:** `main`  
**Verified HEAD at review time:** `bfaa9463abc595db0d8a1388447a57855a5262b0`  
**Review branch:** `phase4b-schema-design-review-v2-2`  
**Decision:** V2.1 is **NOT APPROVED FOR IMPLEMENTATION**. Correct the design and validate it against existing types and gate logic first.  
**Scope:** Documentation and read-only architecture review only. No runtime schema, database, scientific engine, phase status, or evidence data was changed.

## 1. Repository facts verified directly

The GitHub API returned `main` at commit `bfaa9463abc595db0d8a1388447a57855a5262b0`. Its merge message explicitly preserves the unresolved source-count discrepancy, the 2006 paper's blocked numeric ingestion, the prohibition on promoting an engine to `LAB_VALIDATED` without evidence, and Phase 5 locked.

Files inspected:
- `package.json`
- `metadata.json`
- `test_reports/execution-manifest.json`
- `src/domain/vault/types.ts`
- `src/domain/vault/initialData.ts`
- `src/utils/vault/evidenceVaultIntegrityValidator.ts`
- `scripts/verify_evidence_integrity.js`
- `docs/REAL_LAB_DATA_ROADMAP.md`
- `evidence_vault/forensic_reports/PHASE4B_FINAL_CLOSURE_AND_PHASE5_READINESS.md`

Repository path verification:
- `src/domain/vault/types.ts` exists and is the current canonical TypeScript type definition for the evidence vault.
- `src/domain/vault/initialData.ts` exists and contains phase states and active blockers.
- `test_reports/execution-manifest.json` exists.
- `metadata.json` exists, but is app metadata (name, description, permissions, capabilities), not a scientific roadmap or evidence schema registry.
- `docs/REAL_LAB_DATA_ROADMAP.md` exists.
- The proposed V2.1 schema is not established as the runtime schema merely because it appears in a design report. No matching schema file was verified in the repository tree.

**Test-count correction:** the checked-in execution manifest records **129 discovered, 129 registered, 129 executed modules**, with 4,099 assertions passed and 0 failed in that recorded run. The V2.1 report's statement that 128 modules reside in the harness is stale or inconsistent with the checked-in manifest. The manifest timestamp is 2026-10-21 and is historical evidence, not proof that tests were rerun during this review. No tests were run for this documentation review.

## 2. Existing type model that V2.2 must preserve

In `src/domain/vault/types.ts`, existing canonical types include:

- `ScientificMaturityStatus`: `UNVERIFIED`, `CONCEPTUAL`, `HEURISTIC`, `CODE_IMPLEMENTED`, `READY_FOR_VALIDATION`, `VALIDATED_WITH_LIMITATIONS`, `LAB_VALIDATED`, `BLOCKED`.
- `EvidenceType`: `EXPERIMENTAL`, `REFERENCE_DATABASE`, `THEORY`, `MANUFACTURER_SPECIFICATION`, `SIMULATION`, `SOFTWARE_TEST`.
- `InspectionStatus`: `UNINSPECTED`, `IN_PROGRESS`, `NUMERICALLY_INSPECTED`, `FAILED`.
- `EvidenceRecord` already captures source URL, repository URL, license text, optional file/hash details, evidence type, measured variables, units, conditions, nullable sample count, supported engine IDs, supported claims, applicability mismatches, limitations, and follow-up actions.
- `DatasetRecord.actualRowCount` and `actualColumnCount` are explicitly nullable when uninspected.
- `DatasetColumn.missingCount` is currently a non-null number. A future nullability change here requires a compatibility audit of every consumer; do not change it in a design-only step.
- `PhaseStatus` and the phase/blocker records already govern phase state.

V2.1 must not introduce a parallel scientific-maturity enum that conflicts with these canonical types. If a dataset-level evidence classification is required, define an explicit mapping to existing types and document any genuinely new state before proposing code changes.

## 3. V2.1 findings

### P0 — Schema and existing architecture are not yet connected
The report itself says runtime validation hooks must be aligned. No implementation hook, migration, consumer inventory, or compatibility test evidence is supplied. Do not implement a new schema as an isolated JSON document and assume Dexie, TypeScript, or phase-gate logic now enforces it.

### P0 — Historical values must be evidence records, not permanent schema constants
Keep the 27,982 Round-5 headline as an unresolved historical claim. Keep the reported Round-20 component counts with their distinct units and provenance. The arithmetic sum 29,474 is heterogeneous and must not be presented as a universal record count. The unsupported 951 adjustment remains rejected. Do not use fixed enums to restrict a reusable schema to historical counts.

### P0 — Null/zero rules need per-field semantics
Allow `null` only when a value is unknown, unavailable, or not inspected and that meaning is documented for the field. Zero is valid only when it is a known measured/computed zero. Counts should have non-negative constraints when non-null. Do not silently coerce missing values or missing-count metrics to zero. A missing-count itself may be unknown if inspection is incomplete.

### P0 — Licensing status must not overstate permission
A hash match verifies byte identity against a reference, not license ownership, permission, or scientific validity. Keep source/article licensing distinct from dataset/file licensing. A verified license decision should include the license identifier, the evidence URL or local citation, review timestamp, and any applicable restrictions/attribution obligations. Unknown or review-pending terms must fail closed for reuse in commercial validation.

### P1 — Scientific maturity and data origin are conflated
The V2.1 values `MODEL_PREDICTED_ESTIMATE` and `SOURCE_BACKED_LITERATURE` combine multiple distinct concepts. Preserve separate fields for:
- what the value is (`MEASURED`, `DERIVED`, `IMPUTED`, `ESTIMATED`, `MODEL_PREDICTED`, or `UNKNOWN`, subject to mapping to current types);
- what source supports it (publication/dataset/method);
- what review state applies (unverified, inspected, source-reviewed, validation-ready, lab-validated, blocked).
Do not mark a literature-reported value as an app model's laboratory validation.

### P1 — Davies extension needs typed scientific metadata
`valid_domain_boundary: boolean` is ambiguous. Use a documented applicability status plus the actual evaluated conditions, model/version, assumptions, species charges, ionic strength and temperature units, and provenance. Do not encode a universal Davies ionic-strength cutoff without a model-specific documented basis. A result outside the documented domain must be flagged, not silently treated as valid.

### P1 — Krafft extension needs nullable identity and source conditions
Do not require a fabricated SMILES for mixtures or incompletely identified commercial surfactants. Use a stable internal identity key and nullable structure identifiers with an explicit reason when unavailable. Preserve reported name, composition if known, concentration, solvent/electrolyte conditions, method, temperature value/unit, uncertainty if reported, source citation, and value origin/status. Do not infer a universal Krafft threshold or cleaning-performance effect.

### P1 — JSON Schema correctness and enforcement tests are incomplete
The draft does not establish a tested validator integration, migration path, or compatibility matrix. Add explicit non-negative constraints, checksum format constraints, array/object rules, required-field rationale, and unknown-property behavior appropriate to the versioning strategy. Do not make optional extensions mandatory. Schema validation must not itself promote evidence maturity or unlock a phase.

## 4. V2.2 design requirements

1. Reuse existing TypeScript domain types wherever possible; do not create a competing status taxonomy.
2. Store historical reconciliation as a versioned audit/evidence record with source path, claim date/version, reported values, counting units, verification status, and limitations.
3. Store current dataset inventory metrics by dataset and metric name/unit; do not sum unlike units.
4. Keep raw, derived, imputed, estimated, and predicted values distinguishable.
5. Preserve source-row/sheet/column lineage for any normalized numeric observation.
6. Treat licensing clearance, byte integrity, numerical inspection, scientific applicability, and laboratory validation as independent gates.
7. Keep Davies and Krafft data optional and outside baseline count metrics.
8. Include a migration and consumer impact inventory before proposing implementation.
9. Tests must cover known zero vs unknown null, negative-count rejection, mixed-unit aggregation rejection, hash mismatch, license unknown/restricted, invalid or absent source lineage, model out-of-domain results, optional extension omission, and prevention of phase promotion from schema/checksum alone.
10. Do not change `src/domain/vault/types.ts`, `initialData.ts`, phase status, or runtime data until a separate implementation plan maps each change to real consumers and regression tests.

## 5. Gate status and next action

- Phase 4B: **OPEN / BLOCKED for closure** according to the repository's evidence records.
- Phase 5: **LOCKED**.
- Phase 6: **NOT ELIGIBLE** until official predecessor gates are satisfied.
- Historical count discrepancy: **UNRESOLVED**.
- Round-20 component values: preserve as reported pending independent source-level reproduction.
- 2006 detergent paper: remains blocked for numeric ingestion unless full-text numeric evidence becomes available and is audited.

**Next action:** prepare a consumer-by-consumer compatibility inventory for `src/domain/vault/types.ts`, Dexie/store usage, validation utilities, UI renderers, and phase-gate functions. Only after that inventory is verified should a runtime schema implementation branch be proposed. No phase unlock or scientific promotion is authorized by this design document.
