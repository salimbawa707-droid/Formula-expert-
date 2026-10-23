# Pušić et al. (2006) — independent blind transcription protocol

## Purpose and boundary
This worksheet supports an independent transcription check of the 144 printed R460 readings in Tables 5–8 (printed page 13) of Pušić et al. (2006), *Primary Washing Effect of Powder and Liquid Detergents*, Tekstil 55(1), 11–18.

This is a transcription-quality gate only. Agreement does not establish experimental reproducibility, make R460 a percent soil-removal metric, provide replicate-level measurements, validate a detergent formula, or confer `LAB_VALIDATED` status.

## Independence requirement
The reviewer must be a real person other than the original transcriber. The reviewer must record their own identity consistently in `independent_reviewer`. The automated comparator rejects an identity matching the source extractor, including case-only differences. Do not use the original transcribed values as the reviewer's answer key.

## Review procedure
1. Open the publisher's original paper/PDF independently: https://tekstil.hist.hr/index.php/tekstil/article/download/3174/3174/3174
2. Use `pusic_2006_independent_blind_review_template.csv`. It intentionally omits the original numeric readings. Keep the row IDs unchanged.
3. For each of the 144 rows, independently read the printed table cell and enter the value exactly as printed in `independent_transcribed_value`. Do not calculate, normalize, infer, or silently correct values.
4. Enter the same reviewer identity in every `independent_reviewer` cell. If a cell is illegible or ambiguous, leave the value blank and explain it in `discrepancy_notes`; do not guess.
5. Preserve the printed decimal precision. For the two pre-flagged blood readings—Table 5 at 45 g/kg (57.46) and Table 6 at 45 g/kg (69.19)—re-check the source image carefully and document any ambiguity; do not change the source CSV yourself.
6. Return the completed worksheet to the project owner for comparison. The owner runs:
   `python evidence_vault/scripts/compare_pusic_independent_review.py evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv evidence_vault/review_workbooks/pusic_2006_independent_blind_review_template.csv`
   Replace the second path with the completed review copy's path.
7. Resolve every mismatch against the printed source with a documented correction log. Do not overwrite disputed source values merely to make the comparison pass. Preserve original and corrected values with rationale and provenance.

## Acceptance criteria
- Exactly 144 unique source IDs, with no missing or extra rows.
- One consistent independent reviewer identity, distinct from the original extractor.
- All 144 values transcribed; no blanks or non-finite values.
- All mismatches investigated and resolved with evidence.
- Reviewer identity and date recorded in a review log; final comparator output archived.
- Any ambiguous printed cell remains explicitly unresolved and blocks acceptance until resolved.

## Current status
The production CSV is `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`. The review template is intentionally blank. No independent reviewer has yet certified the 144 values. Phase 4B remains OPEN and Phase 5 remains LOCKED until this and the other Phase 4B acceptance gates pass.
