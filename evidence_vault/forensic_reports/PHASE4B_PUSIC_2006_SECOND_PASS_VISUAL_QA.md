# Pušić 2006 Tables 5–8 — Second-Pass Visual QA

**QA outcome:** One additional visual comparison pass was performed against the uploaded PDF, printed page 13 (PDF page 3), at 200 dpi. The 144 CSV readings were compared table-by-table and row-by-row against the printed source image. No transcription discrepancies were identified in this pass.

## Scope checked

- Table 5: cotton / powder; before, 30, 40, 45 g/kg.
- Table 6: polyester/cotton 50:50 / powder; before, 30, 40, 45 g/kg.
- Table 7: cotton / liquid; before, 17.5, 25, 35 mL/kg.
- Table 8: polyester/cotton 50:50 / liquid; before, 17.5, 25, 35 mL/kg.
- All eight stain columns and the separate Standard fabric-control column.
- Decimal marks, dosage labels, table mapping and the two flagged blood values.

## Specific checks

- Table 5, blood, 45 g/kg: **57.46** — matches the printed source.
- Table 6, blood, 45 g/kg: **69.19** — matches the printed source.
- Table 8, 25 mL/kg row: all nine readings match the displayed table, including lipstick **93.66**.
- Table 8, 35 mL/kg row: all nine readings match the displayed table, including shoe cream **79.21** and Standard **95.62**.

## Structural checks

The committed CSV was read locally:
- 144 data rows total.
- 36 rows per table.
- 144 unique table/condition/stain keys.
- All measurement values parse as finite numbers.
- Measurement units remain unspecified, as the source table does not state a physical unit.

## Review limitation

This was an additional visual QA pass by the same assistant, **not an independent second reviewer**. It does not satisfy the independent-review gate. The CSV's `reviewer_2` and `review_match` fields therefore remain blank, and the strict validator is expected to fail its second-review requirement until a genuine independent review is recorded. No scientific or model-validation claims are made.

## Phase gate

Phase 4B remains **OPEN** pending independent review and the separate historical source reconciliation acceptance criteria. Phase 5 remains **LOCKED**.
