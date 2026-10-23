# Pušić 2006 R460 — Source-PDF Second-Pass Audit

**Audit date:** 2026-10-23  
**Source:** Repository-attached original paper `55#01_011=018hr1t.pdf`, printed page 13 (PDF page 3), Tables 5–8  
**Target dataset:** `evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv`  
**Result:** `144/144 MATCHED IN AI-ASSISTED SOURCE SECOND PASS; HUMAN INDEPENDENT REVIEW STILL PENDING`

## Work performed

1. Read the attached source PDF at printed page 13 and inspected the page image containing Tables 5–8.
2. Performed a separate second-pass transcription of the 4 tables × 4 condition rows × 9 stain/control columns (144 table cells) into a temporary comparison matrix, rather than relying on the CSV's stored values.
3. Compared every second-pass numeric value and table/condition/stain key with the repository CSV.
4. Specifically rechecked the flagged blood readings: Table 5 at 45 g/kg = 57.46 and Table 6 at 45 g/kg = 69.19. Both match the printed page.
5. Kept the source CSV unchanged. No source value was silently corrected.

## Results

- Source table cells compared: **144**
- CSV rows checked: **144**
- Table/condition/stain keys: **all 144 matched**
- Numeric mismatches in this second pass: **0**
- Flagged Table 5 blood value 57.46: **matches printed table**
- Flagged Table 6 blood value 69.19: **matches printed table**

The temporary second-pass matrix used the table's nine printed columns in order: black coffee, red wine, cocoa, blood, pumpkin-seed oil, lipstick, pureed tomato, shoe cream, and standard fabric control. The four conditions were the printed before-wash row and the three detergent doses for each table. The original PDF image and extracted PDF text were cross-checked where legible.

## Important independence limitation

This is an additional source-based AI-assisted audit pass, **not a genuine independent human transcription**. The original extractor and this audit are still within the same assistant/operator workflow. It must not be entered into the production CSV as a distinct human reviewer, and it does not satisfy the repository's independent-review acceptance gate.

Therefore:
- Keep all production rows at `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`.
- Keep `reviewer_2` and `review_match` blank in the production dataset.
- Do not promote the data to `LAB_VALIDATED` or treat R460 as percent soil removal.
- Final human independent review remains blocked until a distinct person completes the blind template and the comparator plus discrepancy resolution passes.

## Reproducibility note

The 144-cell temporary matrix was checked programmatically against the production CSV; it is an audit result, not a replacement dataset or independent-review artifact. This report records the result without fabricating reviewer identity or changing the acceptance state.
