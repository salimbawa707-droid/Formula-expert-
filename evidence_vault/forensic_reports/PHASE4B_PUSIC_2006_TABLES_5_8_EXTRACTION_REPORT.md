# Pušić et al. (2006) — First Numeric Table Extraction

**Status:** SOURCE_ACCESS_CONFIRMED; manual transcription findings documented; dataset CSV NOT YET COMMITTED. Any transcription must remain SOURCE_EXTRACTED_PENDING_SECOND_REVIEW until an independent second pass is complete. The attempted large CSV write was blocked, so this report must not be interpreted as saying the numeric table is already ingested into the repository.

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
6. **Second review is pending.** Every value needs a separate verification pass against the original PDF, ideally by a second reviewer or reproducible digitization. Until then the rows remain source-extracted, not lab-validated.

## Next review checklist

- Recheck all 144 values against printed Table 5–8 cells and the PDF page image.
- Confirm fabric descriptions and table-to-condition mapping.
- Check decimal transcription and source spelling/translation.
- Specifically inspect the 57.46 and 69.19 blood-stain entries and retain source values unless an erratum or author confirmation establishes otherwise.
- Register the CSV as SOURCE_EXTRACTED_PENDING_SECOND_REVIEW; do not include it in held-out model validation partitions or claim empirical accuracy.
- Only after independent verification, consider promotion to SOURCE_BACKED evidence with protocol-specific applicability metadata; it still does not by itself justify LAB_VALIDATED.

## Output

- PHASE4B_PUSIC_2006_TABLES_5_8_EXTRACTION_REPORT.md — committed source-access and transcription-scope report.
- The 144-value tidy CSV is **not currently present in the GitHub branch**; do not treat the values as ingested. The prior attempt to write the large CSV was blocked. The CSV must be added through an approved, supported write path and then independently reviewed.

No phase gate is changed by this extraction. Phase 4B remains open until its full acceptance criteria and historical reconciliation are satisfied; Phase 5 remains locked.
