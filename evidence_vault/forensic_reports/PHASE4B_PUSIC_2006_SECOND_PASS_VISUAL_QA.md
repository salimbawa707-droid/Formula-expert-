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


## Correction notice — 2026-11-26

The prior statement that all nine values in Table 8, 25 mL/kg matched the source was incorrect. The Red wine cell was transcribed as 81.35; the publisher image prints **83.35**. The production dataset and current AI comparison ledger have been corrected. The 144-row AI visual re-audit and full correction history are documented in `PUSIC_2006_AI_VISUAL_REAUDIT_CORRECTION_2026-11-26.md` and `pusic_2006_ai_visual_reaudit_2026-11-26.csv`. This notice supersedes the affected statement above; the rest of the historical QA record is preserved. No human review or lab validation is claimed.

## AI-only review route reconciliation — 2026-11-27

The project owner has explicitly selected AI dual-pass review in place of a human reviewer for repository audits and source-transcription checks. The Pušić (2006) AI source-only review route is complete and documented as `AI_SOURCE_REVIEWED`:

- 144/144 source IDs and table/condition/stain keys are compared.
- 144/144 numeric readings match the current publisher-page visual comparison ledger after the 2026-11-26 correction (Table 8, 25 mL/kg, red wine = 83.35).
- The pinned publisher PDF hash and review method are recorded in the AI source-only second-pass report and protocol.
- The human blind-review template remains blank; no human reviewer, identity, or approval is claimed.
- The separate strict human-review validator is expected to report the human route as not performed. That is not a failure of the AI route.
- The AI route establishes transcription agreement only. It does not establish replicate-level uncertainty, formula applicability, cleaning efficacy as a percentage, or `LAB_VALIDATED` status.

**Current disposition:** AI source review complete; optional human blind-review route not performed; Phase 4B remains OPEN for the remaining evidence, provenance, and historical reconciliation criteria; Phase 5 remains LOCKED.
