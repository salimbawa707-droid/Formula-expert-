# Phase 4B AI-only review protocol v1

**Owner authorization:** AI review replaces human review for the Phase 4B closure-review route.  
**Human review performed:** false.  
**Current state:** IN_PROGRESS / PARTIAL_SUBGATE.  
**Phase 5:** LOCKED.

## Purpose and boundary

This protocol provides an auditable AI-only alternative to the human independent-review sign-off. It does not weaken the scientific evidence requirements and does not turn software checks into laboratory validation.

Passing this protocol means the Phase 4B evidence inventory, source provenance, numeric accounting, cross-artifact mappings, and declared engine applicability have been reviewed under the defined AI process. It does **not** establish that a detergent formula works, that a prediction engine is accurate, or that any product is laboratory validated.

## Required review passes

### Pass A — source-first transcription and extraction

- Start from the authoritative source artifact (publisher PDF, official repository file, standards text, or official supplier document).
- Pin source identity before extracting values: DOI/record ID, exact file path, file SHA-256, and image/page hashes where applicable.
- Extract source values and metadata without using the existing derived CSV or prior AI comparison output as the source of truth.
- Record every source row/field, units, conditions, grade identity, source page/table, and unresolved ambiguity.
- Preserve original values and never silently normalize an ambiguous unit, grade, or measurement definition.

### Pass B — independent source re-check

- Run as a separate AI review execution/session.
- Use the same pinned source manifest but do not expose Pass A's extracted values, discrepancy list, or result ledger to Pass B.
- Re-read the source artifact and independently reconstruct the same scope.
- Record a separate result hash and reviewer-model identity.
- Compare Pass A and Pass B only after both are complete. Any disagreement becomes an explicit discrepancy record; it is not resolved by choosing the more convenient value.

The two passes may use the same model family if separate sessions and blinded inputs are used. That is process independence, not model diversity; the model identity and limitation must be disclosed. The 2026-11-26 Pušić visual re-audit in PR #106 was performed after the previous ledger had been seen, so it is **not** a blind Pass B for full Phase 4B closure.

## Closure acceptance criteria

All conditions below are mandatory:

1. `scope = PHASE_4B_COMPLETE`; a dataset-level or partial sub-gate cannot close Phase 4B.
2. `coveragePct = 100` across the approved Phase 4B review checklist.
3. Both required methods are present: `SOURCE_FIRST_TRANSCRIPTION` and `INDEPENDENT_SOURCE_RECHECK`.
4. Both passes use the same pinned source-manifest SHA-256 and produce distinct result SHA-256 hashes.
5. Both passes are blind to the other pass's output and report zero unresolved discrepancies.
6. All source hashes are pinned and all evidence references resolve to registered vault evidence, dataset, engine, or audit IDs; the source-manifest hash pins the underlying committed artifacts; each pass also stores the manifest path and its own result-artifact path.
7. The automated evidence, accounting, provenance, schema, regression, and fail-closed validators pass on the exact commit being considered for closure.
8. The consolidated discrepancy register has zero unresolved items. Corrected items retain their original value, corrected value, source location, reason, and history.
9. Dataset rights and license status are explicitly classified. `REVIEW_PENDING`, unknown rights, or non-commercial restrictions cannot be silently treated as commercial clearance.
10. The AI record explicitly keeps `humanReviewPerformed = false`.

## Hard-fail conditions

- Missing or non-authoritative source.
- Unpinned or mismatched source hashes.
- A single AI pass, duplicate pass method, or non-blind re-check.
- Less than 100% declared scope coverage.
- Any unresolved discrepancy or unexplained numeric mismatch.
- Missing dataset, unit, condition, formulation identity, or source-row lineage.
- Unresolved commercial reuse rights where the intended use requires reuse.
- Any failed automated validator or stale CI run whose SHA differs from the candidate closure commit.
- An AI review claim that is being used to imply lab validation or formula prediction accuracy.

## Phase 5 remains independently gated

Even after Phase 4B closes, Phase 5 may open only if the existing authoritative provenance, raw numeric accounting, cross-artifact consistency, complete dataset inspection, critical-audit, and active-blocker gates all pass. In particular, the lack of eligible matched formula-prediction pairs for ENG-003/ENG-005 remains a separate blocker. The AI review route does not invent missing measurements or prediction pairs.

## Data model and enforcement

The `ProjectPhase.aiReview` record stores:
- status, protocol version, and full-phase versus partial scope;
- coverage percentage and unresolved discrepancy count;
- source-hash pinning and latest automated validation status;
- registered vault evidence/dataset/engine/audit IDs (the runtime gate rejects unknown IDs);
- two review-pass records with method, model, timestamp, source-manifest path/hash, result-artifact path/hash, blind flag, and discrepancy count;
- `humanReviewPerformed: false`.

`validatePhase4BAIReview` enforces the semantic acceptance criteria. `validateAndParseVaultJSON` enforces structural validity. `canUnlockPhase5` accepts either the existing human-confirmed route or the complete AI-only route, but never allows an AI route to override a recorded human-review rejection. All other Phase 5 gates remain unchanged.

## Current status

The Phase 4B AI review record is intentionally `IN_PROGRESS`, scope `PARTIAL_SUBGATE`, coverage 0%, with no claimed completed blind pair. The Pušić 144-cell source correction and the nonionic literature review are useful sub-gates, but they do not satisfy full Phase 4B closure. Phase 5 remains LOCKED.


## Human-specific legacy fields

The Pušić production CSV's `reviewer_2`, `review_match`, and `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW` fields belong to the legacy human-only comparison path. The AI-only route must not populate those fields with an AI identity or imply human sign-off. AI review evidence is recorded in separate AI ledgers and the `ProjectPhase.aiReview` record. The human-specific validator may therefore continue to report the human route as pending while the AI-only route is evaluated independently.


## AI review execution phases and current progress

| AI review phase | Scope | Current status |
|---|---|---|
| Phase 1 — evidence inventory and source-first review | Identify all Phase 4B sources, pin source identities, extract/inspect numeric and chemical evidence, classify applicability and rights | **IN_PROGRESS**. Pušić 144-cell source re-audit and correction are merged; four registered dataset inventories report 4/4 numerical inspection; EVD-014 through EVD-022 add dishwashing and laundry nonionic studies, NPE jurisdictional restrictions, and BASF/Croda manufacturer specifications. EVD-020 Appendix A Tables A1–A5 have 53 surface-tension/concentration points visually inspected; raw table redistribution remains rights-pending. Overall Phase 4B coverage is not yet measured. |
| Phase 2 — blind independent AI re-check | Separate AI execution re-reads the pinned source manifest without access to Phase 1 outputs | **NOT_STARTED**. The current Pušić visual re-audit was not blind and cannot count as this pass. |
| Phase 3 — discrepancy and rights closure | Reconcile all pass disagreements, preserve correction history, resolve/hold commercial reuse rights | **PENDING**. EVD-015 and EVD-016 remain rights-pending; EVD-017 is jurisdiction-specific; further evidence and discrepancy inventory remains. |
| Phase 4 — automated closure and Phase 5 decision | Run exact-head CI, validate full evidence coverage and every gate, then close Phase 4B | **LOCKED/PENDING**. The AI gate record remains IN_PROGRESS / PARTIAL_SUBGATE / 0%; Phase 5 stays LOCKED. |

Phase 1 is the only active AI review phase. Do not mark it complete merely because the Pušić sub-gate or nonionic literature review is complete; the complete Phase 4B checklist must be enumerated and covered.


## Artifact integrity validation

A Phase 4B AI review cannot be marked PASSED on metadata alone. Each review pass must reference a source manifest and a distinct result artifact under `evidence_vault/ai_review/`. The dedicated artifact validator reads the committed files and recomputes SHA-256; the recorded hashes must match the actual bytes. Path traversal or references outside the AI review vault are rejected. While the phase record is IN_PROGRESS, the validator reports that the gate is not closed and does not require future artifacts to exist yet.


CI enforcement note: the artifact-integrity validator is part of the required evidence gate. A green result on an earlier commit is stale; the current pull-request head must pass the complete workflow before merge or Phase 5 consideration.
