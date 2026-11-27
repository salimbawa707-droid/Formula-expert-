# Phase 4B AI-Only Review Governance Addendum

**Date:** 2026-11-27  
**Repository:** `salimbawa707-droid/Formula-expert-`  
**Owner decision:** AI dual-pass review replaces human review for repository code audits, scientific-contract reviews, and source-transcription review. No human reviewer, approval, or sign-off is claimed.

## 1. Governance decision

The project review route is **AI-only dual-pass review**. A scoped work item is considered AI-reviewed only when:
1. Pass 1 reviews the scientific contract: identity, equations, dimensions, units, assumptions, category applicability, evidence provenance and limits.
2. Pass 2 separately reviews implementation/data flow, fail-closed behavior, regression coverage and reproducible verification.
3. Findings, corrections, scope, source commit and CI evidence are recorded in the repository.
4. The review explicitly states what it does not establish.

Human blind review may remain as an optional independent comparison route where the source protocol supports it, but it is not a project completion requirement. No fabricated human identity or approval is allowed.

## 2. Completed AI review records

### PR #123 — 13-category routing and six-candidate data-flow audit
- Merged commit: `dbffaebc3175f6689436eff589701119a7b45e63`.
- Review record: `evidence_vault/forensic_reports/PHASE4B_PR123_AI_DUAL_PASS_REVIEW_2026-11-27.md`.
- Two passes covered 13 canonical product categories, 15 scientific engines, 195 category/engine pairs, scientific equations/units, unknown-category fail-closed behavior, and six residual candidate runtime/data-flow dispositions.
- Exact-head Current Release Quality Gates passed 7/7 on source head `e5f40b6` and documentation follow-up `056075a`.

### PR #125 — Powder Engine integrity
- Merged commit: `e0e3c84d925d60000ff5c895ee653dfb73844e2f`.
- Two-pass AI review is recorded in PR review comment `6089178145`.
- Exact-head Current Release Quality Gates run #1260 passed 7/7.
- Full TypeScript regression passed 141/141 modules and 5,666/5,666 assertions.
- Android debug APK build, KVM availability, and WebView persistence/download instrumentation passed.
- This review corrected invalid mass-balance status, unknown surfactant charge inference, invalid active assays and costs, chelator capacity basis double-discounting, invalid measurement ranges, density edge cases, and pH/cleaning overclaims.

### Pušić et al. (2006) Tables 5–8 source transcription
- AI source-only second pass and correction history are recorded in `PUSIC_2006_AI_SOURCE_ONLY_SECOND_PASS_2026-11-25.md` and `PUSIC_2006_AI_VISUAL_REAUDIT_CORRECTION_2026-11-26.md`.
- The current AI comparison validator checks 144 source IDs/keys and exact numeric agreement against the corrected publisher-page visual ledger: 144/144.
- Current AI route status: `AI_SOURCE_REVIEWED`.
- Human blind-review template remains blank; the human route is `NOT_PERFORMED`, not falsely completed.
- The production CSV's `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW` field describes the optional human-review path only. It does not negate the separately recorded AI source-review result.

## 3. Required app terminology

The roadmap's `independentVerificationStatus` field is retained for schema compatibility. Its meaning for project-phase audit governance is now explicitly:

- `CONFIRMED`: documented AI dual-pass review is complete for the full phase scope. This is not human approval and not laboratory validation.
- `UNESTABLISHED`: the complete phase scope has not yet passed AI dual-pass review.
- `REJECTED`: the AI review identified unresolved blocking defects or requires rework.

The UI should display **AI Dual-Pass Review Status**, not “Independent Reviewer Status”. Phase 5 remains locked until Phase 4B is closed, its AI dual-pass review is confirmed, and provenance, accounting, ledger, dataset-inspection and audit gates all pass.

## 4. What AI review does not replace

AI review can audit source code, equations, unit consistency, data transcription against accessible source images, static data flow, test coverage and repository evidence. It cannot manufacture:
- finished-formula laboratory measurements;
- replicate-level raw data not present in the source;
- missing sample identity, instrument calibration or chain-of-custody records;
- external product specifications or supplier SDS documents;
- commercial reuse rights that are not supported by source/license evidence.

No engine is promoted to `LAB_VALIDATED` solely because an AI review passes.

## 5. Phase 4B remains open for evidence work, not human sign-off

The phase-wide review status remains `UNESTABLISHED` until the entire Phase 4B scope is covered. Current substantive open work includes:
- reconcile the historical 59/64/97 engine-count claims without equating unlike counting units;
- resolve source evidence provenance, rights and archive/hash gaps;
- complete ingredient/category applicability and unsupported-identity mapping;
- inspect and qualify datasets for their actual experimental unit, composition basis, conditions, replicate structure and formula-level applicability;
- resolve the rejected/unreconstructed 27,982 aggregate physical-observation claim;
- acquire eligible matched formula/prediction/measurement pairs before any engine accuracy or calibration claim;
- preserve the distinction between source-transcription agreement, component-level evidence, model screening and finished-product laboratory validation.

These are real evidence and applicability tasks. A human reviewer is not required to clear them; the required evidence itself must still exist and be auditable.

## 6. Final disposition

**AI REVIEW GOVERNANCE: ACCEPTED.** The owner-authorized AI-only dual-pass route is documented and used for PR #123, PR #125 and the Pušić source-transcription review.

**Phase 4B: OPEN.** The full phase evidence and reconciliation scope is not yet complete.

**Phase 5: LOCKED.** Numerical validation/calibration cannot begin until all Phase 4B evidence, provenance, accounting, ledger and dataset gates are satisfied. AI review does not create experimental validation.

No human review or approval is claimed.
