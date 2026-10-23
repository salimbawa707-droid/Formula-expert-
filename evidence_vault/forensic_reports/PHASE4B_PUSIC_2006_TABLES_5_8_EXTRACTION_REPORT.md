# Pušić et al. (2006) — Numeric Table Extraction Report

**Status:** 144 readings transcribed from the user-uploaded source PDF, printed page 13, Tables 5–8. Repository CSV added. Independent second review is still pending; the dataset remains `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`. This does not close Phase 4B or unlock Phase 5.

## Source identity and reuse

- Citation: Pušić, T.; Šostar Turk, S.; Soljačić, I.; Tarbuk, A.; Fijan, R.; Arnuš, S. (2006). “Primary Washing Effect of Powder and Liquid Detergents.” *Tekstil* 55(1), 11–18.
- Publisher landing page: https://www.tekstil.hist.hr/index.php/tekstil/article/view/3174
- PDF URL: https://tekstil.hist.hr/index.php/tekstil/article/download/3174/3174/3174
- The publisher page states Creative Commons Attribution 4.0 International (CC BY 4.0). Preserve attribution and license details in downstream reuse.
- Source used in this extraction: PDF uploaded by the user in this conversation. The table image was visually inspected at printed page 13.

## Repository dataset

- CSV: `evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv`
- 144 rows: 4 tables × 4 conditions (before wash plus three dosage conditions) × 9 columns (eight stain classes plus the Standard fabric-control column).
- Table 5: cotton, powder detergent, 30/40/45 g/kg.
- Table 6: polyester/cotton 50:50, powder detergent, 30/40/45 g/kg.
- Table 7: cotton, liquid detergent, 17.5/25/35 mL/kg.
- Table 8: polyester/cotton 50:50, liquid detergent, 17.5/25/35 mL/kg.
- Columns preserve black coffee, red wine, cocoa, blood, pumpkin-seed oil, lipstick, pureed tomato, shoe cream and Standard fabric control.
- Measurement is the paper's source label `R460 nm`; the table header does not state a physical unit. The CSV uses `R460_nm` and explicitly marks the unit as unspecified. Values use decimal points as CSV numeric notation; no percentages or derived scores are created.
- Baseline values are stored as condition `before` with blank dosage. Standard is retained as a separate control, not a stain class.
- Structural checks performed on the local CSV: 144 rows, 36 rows per table, 144 unique table/condition/stain keys, all measurement values finite, no invented unit label.

## Review state and anomalies

1. **Independent second review is pending.** The CSV intentionally leaves `reviewer_2` and `review_match` blank. Do not mark the strict review gate as passed until another reviewer verifies each value against the source.
2. Two blood entries are flagged for focused recheck but are preserved exactly as printed: Table 5, cotton/powder, 45 g/kg = 57.46; Table 6, polyester/cotton/powder, 45 g/kg = 69.19. Do not silently “correct” these values.
3. The paper reports summarized readings, not raw replicate-level data or per-value uncertainty for these tables.
4. The paper describes a specific protocol: 60 °C wash temperature, 65 L drum volume, 0.88 kg ballast fabric, 0.12 kg stained cloth, liquor ratio 1:5, initial temperature 22 °C, 18.8 min wash and 7 min rinse; reported water hardness is 1.45 °dH.
5. R460 is an optical remission/reflectance measure. Do not reinterpret it as percent soil removal or use it to calibrate Cleaning Score/CPI without a validated mapping method and suitable protocol-specific validation.
6. This dataset is source-extracted evidence, not laboratory validation of any current formula and not a basis for an unsupported model-accuracy claim.

## Required next steps

- Complete a separate second-pass review of all 144 cells against printed page 13.
- Confirm table mapping, dosage labels, decimals and all nine columns per condition.
- Recheck the flagged blood readings; preserve printed values unless an erratum or author confirmation establishes otherwise.
- Fill reviewer metadata only after a genuine independent review and record any disagreements transparently.
- Do not include this dataset in held-out model validation until provenance, review and applicability checks are satisfied.

## Phase gate

No gate has been changed. Phase 4B remains **OPEN** pending independent verification and the separate historical reconciliation acceptance criteria. Phase 5 remains **LOCKED**.
