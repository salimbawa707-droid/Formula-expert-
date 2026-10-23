# Phase 4B — Pušić (2006) Tables 5–8 Verification Contract

**Status:** OPEN — 144-row source-extracted CSV is now present at `evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv`; a same-reviewer second visual QA pass is documented separately, but independent second review is still pending.

## Scope

Transcribe printed page 13, Tables 5–8 of Pušić et al. (2006), “Primary Washing Effect of Powder and Liquid Detergents,” *Tekstil* 55(1), 11–18. Publisher source: https://www.tekstil.hist.hr/index.php/tekstil/article/view/3174 . Publisher states CC BY 4.0; preserve attribution and source URL with redistributed records.

Expected scope is 4 tables × 4 conditions (baseline plus 3 dosages) × 9 reported columns (8 stain classes plus Standard) = 144 numeric readings. This arithmetic is a completeness expectation, not evidence that any reading has been captured correctly.

## Required record schema

Each value must have: `source_id`, `paper_citation`, `publisher_url`, `pdf_url`, `printed_page`, `table_number`, `table_cell`, `fabric`, `detergent_form`, `condition_label`, `dosage_value`, `dosage_unit`, `stain_or_control`, `measurement_name`, `measurement_value`, `measurement_unit_status`, `transcription_status`, `reviewer_1`, `reviewer_2`, `review_match`, `anomaly_flag`, `notes`.

## Non-negotiable interpretation rules

- Record the source label R460 nm. The table does not establish a unit in its header; use `UNIT_UNSPECIFIED_IN_SOURCE_TABLE`, not percent.
- Keep the “Standard” fabric control distinct from the eight stain classes.
- Baseline “Before” rows have no dosage; do not encode absent dosage as numeric zero.
- Preserve source-reported readings as printed. Do not calculate stain removal, cleaning score, CPI, normalized performance, or imputed values from R460 in this ingestion.
- These are summarized source readings, not raw replicate-level observations. They do not establish universal product performance or LAB_VALIDATED status.
- Missing/unknown fields remain null/blank, never silently converted to zero.
- Do not train, calibrate, or score a model from these records until independent transcription review passes and applicability limits are explicitly encoded.

## Mandatory second-pass review

A second pass must independently compare all 144 values against the PDF page image, without copying the first transcription. Compare table mapping, fabric, detergent form, dosage, all nine column labels, decimal positions and values. Store both reviewers' outcomes and resolve every mismatch before promotion.

Specifically recheck the source-printed values 57.46 (Table 5, blood-stained cotton, powder at 45 g/kg) and 69.19 (Table 6, blood-stained polyester/cotton 50:50, powder at 45 g/kg). Preserve as printed unless an erratum or author confirmation establishes otherwise; expected trends are not grounds for correction.

## Acceptance gate

1. CSV contains exactly 144 data records and required fields.
2. Four table IDs are present with 36 readings per table.
3. No duplicate `table_number + condition_label + stain_or_control` keys.
4. All values parse as finite numeric readings; no synthetic values.
5. Baseline dosage is null; non-baseline dosage and units match the table.
6. Measurement unit status remains unspecified as printed.
7. Independent second review covers all 144 records; zero unresolved mismatches.
8. Anomaly review is documented, with original values preserved.
9. Source attribution, source file checksum (once PDF bytes are acquired), and extraction method are recorded.
10. Scientific status is at most SOURCE_BACKED after review; never LAB_VALIDATED on the strength of this paper alone.

Until all gates pass, status remains `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`, Phase 4B stays OPEN, and Phase 5 stays LOCKED.
