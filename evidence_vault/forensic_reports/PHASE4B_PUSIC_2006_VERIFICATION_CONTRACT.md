# Phase 4B — Pušić (2006) Tables 5–8 AI Verification Contract

**Status:** AI-assisted source verification merged to `main` via PR #14 (merge commit `7cb57d4c9a7f784fff4c3b4cf049d6eb91d140af`). The dedicated AI evidence validator and its regression tests passed in GitHub Actions run 153. The wider master Phase 4B gate remains OPEN because separate repository-wide provenance/accounting blockers remain unresolved.

## Scope
Transcribe printed page 13, Tables 5–8 of Pušić et al. (2006), “Primary Washing Effect of Powder and Liquid Detergents,” *Tekstil* 55(1), 11–18. Publisher source: https://tekstil.hist.hr/index.php/tekstil/article/view/3174 . Preserve attribution and source URL with redistributed records.

Expected scope: 4 tables × 4 conditions (baseline plus 3 dosages) × 9 reported columns (8 stain classes plus Standard) = 144 numeric readings. This arithmetic is a completeness expectation, not proof of correctness.

## Interpretation rules
- Record the source label R460 nm. The table does not establish a unit in its header; use `UNIT_UNSPECIFIED_IN_SOURCE_TABLE`, not percent.
- Keep Standard fabric control distinct from the eight stain classes.
- Baseline Before rows have no dosage; do not encode absent dosage as numeric zero.
- Preserve source-reported readings as printed. Do not derive stain removal, cleaning score, CPI, normalized performance or imputed values from R460 in this ingestion.
- These are summarized source readings, not raw replicate-level observations. They do not establish universal product performance or `LAB_VALIDATED` status.
- Missing/unknown fields remain null/blank, never silently converted to zero.

## AI verification evidence
Evidence ledger: `evidence_vault/review_workbooks/pusic_2006_ai_visual_comparison_144.csv`
Report: `evidence_vault/forensic_reports/PHASE4B_AI_SOURCE_VERIFICATION_REPORT.md`

The ledger records the existing source CSV value and the AI visual transcription side by side, aligned by source ID, table, condition and stain/control. The reported comparison is 144/144 matches, zero mismatches. This is AI-assisted source transcription verification, not independent human review and not laboratory validation.

## Status taxonomy
- `AI_VERIFIED_SOURCE_BACKED`: source reading visually matched to the published table image with traceable evidence.
- `AI_PREDICTED`: a model-generated estimate for an unknown/missing value. Never substitute it for a source-extracted measurement.
- `UNRESOLVED`: illegible or conflicting evidence.
- `LAB_VALIDATED`: reserved for actual laboratory measurements and validation evidence; this paper transcription alone cannot grant it.

## Acceptance gate
1. Exactly 144 data rows and required source fields.
2. Tables 5–8 each contain 36 readings.
3. No duplicate table + condition + stain/control keys.
4. All values are finite numeric readings; no synthetic values.
5. Baseline dosage is blank; non-baseline dosages/units match the source.
6. Measurement unit status remains unspecified as printed.
7. AI comparison ledger has exactly 144 unique source IDs matching the production CSV, no missing/extra IDs, zero mismatches, and an explicit method label.
8. Source attribution and source PDF/image checksums are retained in the evidence vault when available.
9. Do not claim independent human review or `LAB_VALIDATED`.

The Pušić-specific AI evidence sub-gate passed in CI. This does not by itself close the repository-wide Phase 4B gate: `canUnlockPhase5()` still requires authoritative provenance VERIFIED, raw numeric accounting RECONCILED, cross-artifact ledger CONSISTENT, all vault datasets numerically inspected, no open HIGH/CRITICAL findings, no active Phase 4B blockers, and the phase record CLOSED/reportedClosed. The existing historical 27,982 physical-observation aggregate remains not independently reconciled to row-level physical observations (see `PHASE4B_ROUND17_INDEPENDENT_RECONCILIATION.md`). Therefore the master Phase 4B remains OPEN and Phase 5 remains LOCKED.


## Follow-up AI visual re-audit — 2026-11-26

A further visual re-read of the archived publisher image (`page_03.png`, printed page 13; Git blob SHA `c6ef177238b2b6ae3d988ca97fe77cb2cedd7850`) identified one transcription error that the prior value-to-value comparator could not detect: Table 8, 25 mL/kg, Red wine is printed **83.35**, while the production CSV and prior AI comparison ledger both contained **81.35**. The prior 144/144 equality therefore reflected duplicated transcription, not source correctness. The production CSV and current comparison ledger are corrected to 83.35. A 144-row audit ledger preserves all pre-correction values and the observed source values at `evidence_vault/review_workbooks/pusic_2006_ai_visual_reaudit_2026-11-26.csv`; the detailed correction report is `evidence_vault/forensic_reports/PUSIC_2006_AI_VISUAL_REAUDIT_CORRECTION_2026-11-26.md`.

The re-audit is AI visual review, not blind review or human review (`human_review=false`). It supports transcription correction only; it does not establish detergent efficacy, formula prediction accuracy, or `LAB_VALIDATED`. The original 2026-11-25 second-pass CSV/report are retained as historical records and are not rewritten. Phase 4B remains OPEN; Phase 5 remains LOCKED.
