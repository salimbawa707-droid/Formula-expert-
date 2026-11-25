# Pušić et al. (2006) — AI source-only second-pass review

- Review date: 2026-11-25 (UTC date)
- Model: GPT-6
- Route: user-authorized AI source-only review under protocol v1.2.0; **not human review**.
- Source: publisher PDF `evidence_vault/sources/55_01_011_018hr1t.pdf`; printed page 13, archived rendered image `evidence_vault/sources/page_03.png`.
- Publisher PDF SHA-256 (pinned by repository protocol): `ea2e068f6f58335f096376fb2f448eee819874b9be7e96591f14f23152173439`.
- Rendered page image Git blob SHA: `c6ef177238b2b6ae3d988ca97fe77cb2cedd7850`.
- Production dataset blob SHA reviewed after source-first transcription: `57d9c8b6dd1b8fcd8501e3ab6bdf4b5c970550b1`.

## Result

| Check | Result |
|---|---:|
| Source table cells transcribed | 144/144 |
| Unique table/condition/stain keys | 144/144 |
| Rows per table | 36 each (Tables 5–8) |
| Exact numeric matches to production CSV | 144/144 |
| Numeric mismatches | 0 |
| Missing/duplicate keys | 0 missing; 0 duplicate rows |
| Human review | false |

**Outcome: AI_SOURCE_REVIEWED — transcription agreement only.** This result confirms the visible printed R460 values match the production CSV for all 144 keyed cells. It does not validate the experimental method, detergent efficacy, formula predictions, or laboratory performance. R460 is retained as the source's reported reading; the source table does not specify a measurement unit, and the values must not be relabelled as percent soil removal.

## Mathematical / structural checks

- Four tables × four conditions × nine stain/control columns = 144 expected readings.
- Each table contains 36 readings; each condition within each table contains nine values.
- Baseline rows in Tables 7 and 8 repeat the corresponding fabric's pre-wash readings from Tables 5 and 6, respectively; the source image shows this explicitly and the extracted dataset preserves it.
- Dose units are distinct: Tables 5–6 use g/kg; Tables 7–8 use mL/kg. They must not be pooled as equivalent doses.
- All values are finite numeric readings; no arithmetic aggregation across unlike conditions is used as an experiment count.
- Range across all 144 values: 22.15 to 95.62. This is a descriptive range only.

## Table/condition descriptive statistics

| Table | Condition | n | Min | Max | Mean |
|---:|---|---:|---:|---:|---:|
| 5 | before | 9 | 22.15 | 93.73 | 51.1989 |
| 5 | dose_1 | 9 | 76.97 | 92.65 | 86.7200 |
| 5 | dose_2 | 9 | 76.14 | 92.70 | 87.3856 |
| 5 | dose_3 | 9 | 57.46 | 91.92 | 84.9367 |
| 6 | before | 9 | 36.64 | 94.33 | 56.2133 |
| 6 | dose_1 | 9 | 71.18 | 94.47 | 86.8422 |
| 6 | dose_2 | 9 | 75.19 | 95.23 | 91.5533 |
| 6 | dose_3 | 9 | 69.19 | 95.55 | 88.8089 |
| 7 | before | 9 | 22.15 | 93.73 | 51.1989 |
| 7 | dose_1 | 9 | 41.67 | 92.19 | 78.6178 |
| 7 | dose_2 | 9 | 57.42 | 92.51 | 83.7278 |
| 7 | dose_3 | 9 | 38.19 | 91.27 | 78.0433 |
| 8 | before | 9 | 36.64 | 94.33 | 56.2133 |
| 8 | dose_1 | 9 | 71.53 | 95.12 | 84.9967 |
| 8 | dose_2 | 9 | 65.12 | 95.51 | 86.4111 |
| 8 | dose_3 | 9 | 41.58 | 95.62 | 83.5556 |

## Reproducibility and boundary

The complete row-level source-first transcription and comparison are stored in `evidence_vault/review_workbooks/pusic_2006_ai_source_only_second_pass_2026-11-25.csv`. Every row records model, method, source PDF hash and `human_review=false`.

This review is not an independent human review and does not satisfy a human-only governance gate. It also does not reconstruct the historical 27,982 aggregate; the existing forensic disposition rejecting that aggregate as a verified physical-observation count remains unchanged. Phase 4B is not marked fully closed and Phase 5 remains locked unless all other master-gate requirements are separately met.

## Exceptions

- None. All 144 values matched exactly by numeric comparison.


## Follow-up correction notice — 2026-11-26

The reported 144/144 exact matches in this historical second-pass record are superseded for one cell. A follow-up visual re-read found Table 8, 25 mL/kg, Red wine is printed **83.35**, while this historical record and the then-current production CSV contained 81.35. The prior equality was a duplicated transcription, not proof of source accuracy. The current production CSV and comparison ledger are corrected. The 2026-11-26 re-audit ledger and correction report document the old and corrected values. This historical CSV/report are intentionally retained unchanged as audit history. AI-only; not blind review, human review, or lab validation.
