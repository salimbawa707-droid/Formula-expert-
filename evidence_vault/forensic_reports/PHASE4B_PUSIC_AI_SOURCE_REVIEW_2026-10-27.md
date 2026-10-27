# Pušić et al. (2006) AI-Only Blind Source Review — 2026-10-27

## Result

A fresh AI visual second transcription read directly from the publisher PDF page image, without viewing the production CSV values during transcription, matched **144 of 144** keyed readings in Tables 5–8. There were **zero numeric mismatches**. This records an AI-only source review; it is not a human review, independent human approval, lab replication, model validation, or a claim that R460 is a soil-removal percentage.

## Source and reproducibility

- Publisher article: Pušić et al., *Primary Washing Effect of Powder and Liquid Detergents*, Tekstil 55(1), 11–18 (2006), publisher page: https://www.tekstil.hist.hr/index.php/tekstil/article/view/3174
- Publisher PDF: `evidence_vault/sources/55_01_011_018hr1t.pdf`
- PDF SHA-256: `ea2e068f6f58335f096376fb2f448eee819874b9be7e96591f14f23152173439`
- Source page inspected: printed page 13 (Tables 5–8), rendered publisher PDF pages 3–4 at high resolution.
- AI model: Codex GPT-6.
- Method: read decimal-comma readings from the source images into a separate 144-row transcript; normalize decimal commas to decimal points; compare on table, condition, and stain/control keys to the production CSV using `compare_pusic_ai_source_review.py`.
- Transcript: `evidence_vault/review_workbooks/pusic_2006_ai_source_only_second_pass_2026-10-27.csv`.
- Human review: `false`; no human identity or approval is asserted.
- A prior AI visual comparison already reported 144/144; this pass is recorded separately with its own source-only transcription and checksum reference.

| Table | Conditions | Readings | AI/source extraction matches |
|---|---|---:|---:|
| 5 | Cotton, powder; before and 30/40/45 g/kg | 36 | 36 |
| 6 | Polyester/cotton 50:50, powder; before and 30/40/45 g/kg | 36 | 36 |
| 7 | Cotton, liquid; before and 17.5/25/35 mL/kg | 36 | 36 |
| 8 | Polyester/cotton 50:50, liquid; before and 17.5/25/35 mL/kg | 36 | 36 |
| **Total** |  | **144** | **144** |

## Scientific limits

The paper reports R460 nm readings with no unit in these tables. The observations cover particular stains, fabric types, detergent forms, and dose levels. The production CSV preserves the printed values and labels; this review does not convert reflectance to stain-removal percentage, infer recipe composition, create formula/prediction pairs, or mark any engine `LAB_VALIDATED`.

The user expressly requested an AI pass. The repository protocol now supports this clearly labelled AI-only review route while retaining the distinct human-review route. No human approval is claimed. This source transcription review alone does not close Phase 4B; other source, accounting, ledger, dataset, and blocker gates still need to pass. Phase 4B remains OPEN and Phase 5 remains LOCKED.
