# Phase 4B — Pušić (2006) AI Evidence Ledger Audit

**Status:** Recorded comparison ledger passes structural/value-consistency checks; publisher-source transcription is not independently re-performed by CI.  
**Governance:** Phase 4B OPEN; Phase 5 LOCKED.

## Scope

Source: Pušić et al. (2006), “Primary Washing Effect of Powder and Liquid Detergents,” *Tekstil* 55(1), 11–18. Publisher landing page: https://tekstil.hist.hr/index.php/tekstil/article/view/3174. PDF: https://tekstil.hist.hr/index.php/tekstil/article/download/3174/3174/3174. The ledger covers printed page 13, Tables 5–8.

## What is checked by automation

- The source dataset and comparison ledger each contain 144 records.
- Table mapping, source IDs, conditions, stain/control labels, dosage conventions, finite numeric values, uniqueness, and unit-unspecified status are checked.
- The comparison ledger records 144 rows with matching `source_csv_value` and `ai_visual_value` and no recorded mismatches.
- Regression tests ensure malformed records and mismatches fail validation.
- These checks validate the recorded ledger's internal consistency and schema. They do **not** independently inspect the publisher PDF image, run OCR against the PDF, or prove that the stored `ai_visual_value` was independently transcribed from the image.

## Scientific interpretation

The reported 144/144 matches are a recorded AI-assisted comparison claim, not an independently reproducible source-image verification result. The publisher's table uses the label R460 nm; its table header does not specify a measurement unit. Retain `UNIT_UNSPECIFIED_IN_SOURCE_TABLE`. These are summarized source readings, not raw replicate-level measurements.

Do not infer stain removal, cleaning score, CPI, normalized performance, or missing values from these readings during ingestion. Do not label this evidence `LAB_VALIDATED`. `AI_PREDICTED` values must never replace source-extracted values.

## Gate interpretation

Passing this validator means only that the Pušić evidence ledger satisfies its programmed structural and consistency checks. It does not close Phase 4B, confirm independent verification, reconcile the repository-wide accounting/provenance ledgers, or unlock Phase 5. The validator therefore always reports Phase 5 as `LOCKED`.

**Master status: Phase 4B OPEN; Phase 5 LOCKED.**
