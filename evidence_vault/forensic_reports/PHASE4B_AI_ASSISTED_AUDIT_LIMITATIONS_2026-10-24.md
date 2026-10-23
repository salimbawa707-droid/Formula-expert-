# Phase 4B AI-Assisted Audit Limitations — 2026-10-24

## Status
**NOT VERIFIED FOR SCIENTIFIC APPROVAL. Phase 4B remains OPEN. Phase 5/6 remain LOCKED.**

## What was checked
- GitHub PR #12 currently exists and is open, not merged: https://github.com/salimbawa707-droid/Formula-expert-/pull/12
- PR head at time of this audit: `e7c68f9e702cd19490bc224f5bfd4a1b2185692c`
- The PR changes include the 144-row dataset, validator, comparator, blind-review template/protocol, and CI workflow.
- The CSV is marked `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`; `reviewer_2` and `review_match` are blank. The dataset explicitly identifies its first transcription as assistant transcription.
- The publisher-hosted paper PDF is available at https://tekstil.hist.hr/index.php/tekstil/article/download/3174/3174/3174. This audit did **not** independently compare every one of the 144 numeric cells against the rendered source table.

## Important correction
A previous assistant-generated comparison described the 144 readings as “144/144 MATCH.” That result is **not reproducibly established by this audit** and must not be treated as independent source verification or as acceptance evidence. Do not use it to mark rows reviewed, approve the dataset, or claim scientific validation.

## Required verification gate
1. A reviewer distinct from the original transcriber independently reads all 144 printed values from Tables 5–8 on printed page 13.
2. The reviewer completes the blind review worksheet, records reviewer identity and review date, and logs ambiguous cells.
3. Run the repository comparator against the completed worksheet:
   ```bash
   python evidence_vault/scripts/compare_pusic_independent_review.py evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv <completed_review.csv>
   ```
4. Archive the completed worksheet, comparator output, and discrepancy-resolution log.
5. Run and record the repository validator and tests in a reproducible environment.

## What this audit did not do
- It did not run the repository's Python tests or validator.
- It did not create a human reviewer identity or fill reviewer fields.
- It did not establish LAB_VALIDATED status, soil-removal percentages, or any model-accuracy claim.
- It did not merge PR #12 or modify the dataset values.

## Decision
Keep the evidence dataset pending second review. This report documents limitations; it is not a replacement for the required independent human review.
