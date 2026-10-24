# Pušić et al. (2006) — First Numeric Table Extraction

**Status:** CSV COMMITTED; all 144 source-extracted readings are present at `evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv`. The source CSV and AI-assisted visual comparison ledger are cross-checked by `validate_pusic_ai_evidence.py`; this establishes only transcription-agreement evidence, not independent human review. Every row remains `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW` until a genuinely independent reviewer completes the blind review.

## Source identity and reuse

- Citation: Pušić, T.; Šostar Turk, S.; Soljačić, I.; Tarbuk, A.; Fijan, R.; Arnuš, S. (2006). “Primary Washing Effect of Powder and Liquid Detergents.” *Tekstil* 55(1), 11–18.
- Publisher landing page: https://www.tekstil.hist.hr/index.php/tekstil/article/view/3174
- PDF used for extraction: https://tekstil.hist.hr/index.php/tekstil/article/download/3174/3174/3174
- License stated by publisher: Creative Commons Attribution 4.0 International (CC BY 4.0). Preserve citation and attribution with all reuse.
- The publisher PDF was available and inspected visually; printed page 13 contains Tables 5–8.

## What was extracted

A tidy long-format CSV was transcribed from Tables 5–8 on printed page 13: **144 values** = 4 tables × 4 conditions (before washing plus three detergent dosages) × 9 columns (eight stain classes plus the “Standard” fabric-control column).

- Table 5: cotton fabric, powder detergent, 30/40/45 g/kg.
- Table 6: polyester/cotton 50:50 fabric, powder detergent, 30/40/45 g/kg.
- Table 7: cotton fabric, liquid detergent, 17.5/25/35 mL/kg.
- Table 8: polyester/cotton 50:50 fabric, liquid detergent, 17.5/25/35 mL/kg.
- Stains/labels: black coffee, red wine, cocoa, blood, pumpkin-seed oil, lipstick, pureed tomato, shoe cream; plus a “Standard” fabric control.
- Measurement is the source-reported spectral remission/reflectance at 460 nm (the paper labels it R460 nm). The tables do not explicitly specify a physical unit in the table header, so the dataset stores SOURCE_LABEL_R460_NM_UNIT_UNSPECIFIED and does not invent a percentage unit.
- “Before” values are baseline readings; dosage is blank for those rows. “Standard” is preserved as its own control category.
- Values are transcribed as printed with decimal points used as CSV numeric notation. No stain-removal percentages, normalized scores, or derived values have been computed.

## Important caveats and anomalies

1. **Not raw replicate-level data.** The paper reports summarized readings, not row-level replicate measurements or per-value uncertainty for these tables. The CSV sets replicate_data_available=NO.
2. **No automatic formula/Cleaning Score calibration.** The data are source-extracted measurements under this specific washing setup, not universal detergent-performance labels. Test conditions described in the paper include 60 °C wash temperature, 65 L drum volume, 0.88 kg ballast fabric, 0.12 kg stain cloth, liquor ratio 1:5, initial temperature 22 °C, 18.8 min wash and 7 min rinse; the reported water hardness is 1.45 °dH.
3. **Do not treat R460 as percentage soil removal.** Reflectance/remission is an optical measurement, and a formula to derive removal would require a validated method and suitable baseline/control handling.
4. **Potential source anomaly preserved:** Table 5, blood-stained cotton, powder at 45 g/kg is printed as 57.46; Table 6 blood-stained polyester/cotton at 45 g/kg is 69.19. These values are not “corrected”; they must be checked against the page image in the second review.
5. **Control-column interpretation:** the “Standard” column is retained separately as a fabric-control reading and must not be treated as another stain class.
6. **Independent second review is still pending.** The AI-assisted comparison ledger covers all 144 source IDs and reports matches, but it was not completed by an independent human reviewer and cannot fill `reviewer_2` or `review_match` in the production CSV. Until a genuinely independent review is recorded, rows remain source-extracted and must not be treated as independently reviewed or lab-validated.

## Next review checklist

- A second reviewer must independently transcribe all 144 values from the source PDF without using the production values as the answer key, then run `compare_pusic_independent_review.py` against the production CSV.
- Confirm fabric descriptions and table-to-condition mapping during the blind pass.
- Specifically inspect the 57.46 and 69.19 blood-stain entries and retain source values unless an erratum or author confirmation establishes otherwise.
- Keep the AI visual comparison ledger separate from the independent blind-review workbook.
- Do not include this dataset in held-out model validation partitions or claim empirical accuracy before applicability and validation design are approved.
- After independent verification, consider promotion to SOURCE_BACKED evidence with protocol-specific applicability metadata; this still does not by itself justify LAB_VALIDATED.

## Output

- PHASE4B_PUSIC_2006_TABLES_5_8_EXTRACTION_REPORT.md — committed source-access and transcription-scope report.
- `evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv` — committed 144-row tidy CSV; current row status remains `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`.
- `evidence_vault/review_workbooks/pusic_2006_ai_visual_comparison_144.csv` — 144-row AI-assisted source comparison ledger; not an independent human review.
- `evidence_vault/review_workbooks/pusic_2006_independent_blind_review_template.csv` — blank template for a real blind second transcription.
- `evidence_vault/review_workbooks/pusic_2006_reconciliation_audit.csv` — per-reading audit ledger; current disposition remains `BLOCKED_PENDING_HUMAN_INDEPENDENT_OBSERVATION`.

No phase gate is changed by this extraction. Phase 4B remains open until its full acceptance criteria and historical reconciliation are satisfied; Phase 5 remains locked.
