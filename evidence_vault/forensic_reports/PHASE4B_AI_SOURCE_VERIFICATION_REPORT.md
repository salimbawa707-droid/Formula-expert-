# Phase 4B AI-assisted source verification report

**Status:** AI visual comparison recorded; gate policy update proposed in this branch. Not yet merged.

## Evidence summary
- Source: Pušić et al. (2006), *Primary Washing Effect of Powder and Liquid Detergents*, printed page 13, Tables 5–8.
- Expected records: 144 (4 tables × 4 conditions × 9 columns).
- Comparison ledger rows: 144.
- Recorded matches: 144.
- Recorded mismatches: 0.
- Table counts: 36 each for Tables 5, 6, 7, 8.
- Explicitly rechecked anomaly-prone values: Table 5 blood at 45 g/kg = 57.46; Table 6 blood at 45 g/kg = 69.19.

## Interpretation
This is an AI-assisted visual transcription comparison against the publisher's printed table image. It checks the values transcribed from the source, not detergent efficacy or experimental reproducibility. These summarized R460 nm readings are not raw replicate-level measurements and must not be labeled LAB_VALIDATED. The source table does not specify a measurement unit; retain UNIT_UNSPECIFIED_IN_SOURCE_TABLE.

## Audit limitations
The ledger records the existing source CSV value and the AI visual transcription side by side. It is evidence of this comparison pass, not proof of universal OCR accuracy. The source PDF and printed page image should remain archived with checksums; future revisions must rerun the comparison script and preserve mismatch records rather than force values to match.

## Proposed status taxonomy
- AI_VERIFIED_SOURCE_BACKED: source reading matched to the published table image with traceable evidence.
- AI_PREDICTED: model-generated estimate for an unknown/missing value; never substitute for a source-extracted measurement.
- UNRESOLVED: illegible or conflicting evidence.
- LAB_VALIDATED: reserved for actual laboratory measurements and validation evidence; this paper transcription alone cannot grant it.

## Phase gate
Phase 4B should close only after schema, mapping, dosage, uniqueness, finite-value and ledger coverage checks pass. Phase 5 may then open under the revised AI-verification policy, with this report and ledger retained. Do not claim independent human review.
