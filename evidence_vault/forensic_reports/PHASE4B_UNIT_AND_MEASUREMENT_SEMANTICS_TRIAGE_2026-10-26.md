# Phase 4B — Unit and Measurement-Semantics Triage

Audit date: 2026-10-26. Phase 4B remains OPEN; Phase 5 remains LOCKED.

## Correction to the historical 1,492 figure

The 1,492 figure is the arithmetic difference between 29,474 mixed-unit source records and the historical headline 27,982. It is not a count of 1,492 unit-mismatch or ingestion-blocker cases. The source sum mixes flow points, image-feature records, bubble area cells, and rheometer point rows, so it is not a valid common measurement total.

## Known issues requiring source-level resolution

| Source / field | Current safe handling | Evidence needed |
|---|---|---|
| RepOD PLL_RH concentration | Workbook says mol/L, values 0.1–600; paper captions say mg/dm3. Preserve raw values; do not convert. | Author/repository clarification of unit and basis. |
| RepOD Vmax | Workbook says maximum foam volume in mL; article describes maximum foam height. Keep unresolved. | Source-author clarification or precise methods definition. |
| Pusic et al. R460 | Table labels R460 nm but does not specify the physical measurement unit. Keep unit unspecified; do not convert to soil-removal percent. | Independent source review and a validated method for any derived endpoint. |
| PhDat temperature | Source field temperature_(degC), range -50 to 420 C. Preserve Celsius; define applicability before use. | Model applicability domain and held-out validation. |
| PhDat composition | Source field composition_(wt%), range 0–100 wt%. Preserve weight-percent basis; do not silently convert to mole fraction. | Explicit, source-supported conversion assumptions. |
| PhDat phase values | Values range 0–1.0001; maximum row-sum deviation from 1 is 0.0003. Preserve source values without normalization. | Review source phase-label definitions and extraction semantics. |

## PhDat integrity findings

- Official Figshare item 29071202, version 4; API metadata reports CC BY 4.0.
- PhDat.json is 112,738,787 bytes; MD5 cbad98c7b20313586fb4183a4e88e539; SHA-256 748a29d08341bd8e868247d609401301495e24b3c1d88ed3b0ec065e2cdb12f3.
- Parsed 143 records: 99 complete and 44 incomplete; 1,896,776 temperature/composition points and 15,785,160 phase-probability values.
- Numeric record ID 98 is absent. Arrays align in length; header order differs from Data key order for records 7 and 25.
- 137 unique nonempty SMILES across 143 records; four duplicate-SMILES groups cover 10 source records. Preserve records and provenance; do not deduplicate without evidence.
- Data are literature-curated/digitized phase-behavior evidence, not direct detergent cleaning-performance validation.

## Next actions

1. Keep RepOD unit conflicts blocked until source clarification.
2. Keep Pusic R460 pending independent second review; do not derive cleaning metrics.
3. Use PhDat only for phase-behavior research within a documented applicability domain.
4. Preserve measured, source-extracted/digitized, derived, estimated, and predicted values as distinct evidence classes.

No unit conversion or scientific promotion is authorized by this report.