# Pušić (2006) AI visual re-audit and correction — 2026-11-26

## Decision

A follow-up AI visual re-read of the archived publisher page image identified **one source transcription error** in the previously reported 144/144 exact-match ledger. The prior equality check compared two records that shared the same incorrect transcription.

- Source: Pušić et al. (2006), *Primary Washing Effect of Powder and Liquid Detergents*, *Tekstil* 55(1), 11–18.
- Source PDF SHA-256: `ea2e068f6f58335f096376fb2f448eee819874b9be7e96591f14f23152173439`.
- Printed page: 13; archived image: `evidence_vault/sources/page_03.png`.
- Image Git blob SHA: `c6ef177238b2b6ae3d988ca97fe77cb2cedd7850`.
- Review route: AI visual re-audit; not blind; `human_review=false`.

## Finding

| Key | Prior production value | Prior AI comparison value | Value read from source image | Disposition |
|---|---:|---:|---:|---|
| Table 8 / 25 mL/kg / Red wine | 81.35 | 81.35 | **83.35** | Corrected production CSV and current comparison ledger |

The source image visibly prints the Table 8 row for 25 mL/kg as:

`91.57, 83.35, 93.88, 65.12, 79.90, 93.66, 93.94, 82.77, 95.51`

The second value is Red wine. It is **83.35**, not 81.35. The Table 8 17.5 mL/kg Red wine value is 81.35; that separate row remains unchanged.

## Re-audit accounting

- Expected cells: 4 tables × 4 conditions × 9 stain/control columns = 144.
- AI visual values re-read and keyed: 144.
- Agreement with the pre-correction production CSV: 143.
- Source discrepancies found: 1.
- Corrected production rows: 1.
- Current production and comparison ledger after correction: 144/144 source-value agreement, subject to the CI validator.
- Missing/duplicate keys: none in the keyed review.
- Human review: false.
- Laboratory validation: not established.

The complete 144-row re-audit ledger preserves each pre-correction production value, the value visually read from the source, and the disposition. The original 2026-11-25 AI second-pass ledger/report are retained unchanged as historical artifacts.

## Numerical effect

For Table 8, 25 mL/kg, the nine-value mean changes from 86.4111 (using the incorrect 81.35) to **86.6333** (using the source value 83.35). This is a descriptive arithmetic summary only; it is not a cleaning score or efficacy metric.

## Scientific and governance limits

- R460 remains the source-reported spectral remission/reflectance reading; the table does not specify a measurement unit. Keep `UNIT_UNSPECIFIED_IN_SOURCE_TABLE`.
- Do not convert R460 into percent stain removal, Cleaning Score, CPI, or formula efficacy.
- These are summarized source readings, not raw replicate-level observations.
- This is an AI visual re-audit, not an independent human or blind review.
- No `LAB_VALIDATED`, formula-prediction accuracy, or product-performance claim is made.

**Gate:** Pušić transcription correction is ready for automated regression verification. This sub-gate does not close the repository-wide Phase 4B gate. **Phase 4B remains OPEN; Phase 5 remains LOCKED.**
