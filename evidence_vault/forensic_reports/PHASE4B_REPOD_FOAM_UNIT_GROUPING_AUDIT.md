# Phase 4B — RepOD Foam Dataset: Worksheet, Units, and Grouping Audit

**Audit date:** 2026-10-22  
**Dataset:** Kosior, *Foamability and foam stability — polyelectrolyte/surfactant mixture*, RepOD DOI 10.18150/MKCDUM  
**Status:** Both worksheets downloaded, hash-verified, parsed, and numerically inspected. This is descriptive auxiliary evidence only; it is not eligible for detergent-formula validation.

## File integrity and parsing

- Official source file: `DFA_data.ods`; 18,531 bytes.
- Published MD5: `9bee2b49dd1a55822203e10641694c46` — matched.
- Computed SHA-256: `3665c4386fbf75537744823246a2857fd34eceb297057d6a372c29490d56cfaf`.
- ODS ZIP CRC passed; both worksheets parsed without dropping internal blank cells.
- `PGA_LAE`: 12 expanded worksheet rows (2 header rows + 10 concentration levels), 23 columns.
- `PLL_RH`: 15 expanded worksheet rows (2 header rows + 13 concentration levels), 23 columns.
- These are table/level counts, **not** independent experimental sample counts.

## Worksheet structure and observed units

Each worksheet has paired blocks for the polyelectrolyte concentration 0 vs 100 mg/L. The table contains surfactant concentration, Vmax, standard deviation, foam half-lifetime and standard deviation, Bickerman foaminess (Sigma), and foam production.

| Field | PGA_LAE | PLL_RH | Audit interpretation |
|---|---|---|---|
| Surfactant concentration | Header says mol/L; 1e-6 to 1e-3 | Header says mol/L; values 0.1 to 600 | The article's figure captions report RH concentrations in mg/dm³; the workbook header c RH [mol/L] conflicts. Preserve raw header and numeric values; record mg/dm³ as the publication-supported interpretation pending author confirmation. |
| Vmax | `Vmax [mL]` | `Vmax [mL]` | Workbook group heading says “Maximum foam volume”; article discusses maximum foam height. This dimensional/terminology conflict remains unresolved. |
| Foam half-lifetime | `t [sec]` | `t [sec]` | Seconds as explicitly labeled. |
| Bickerman foaminess | `Σ [sec]` | `Σ [sec]` | Seconds as explicitly labeled; blank standard-deviation positions are not zero values. |
| Foam production | `f [sec2/mm]` | `f [sec2/mm]` | Keep the source unit label; do not derive or convert without method review. |
| Standard deviation | Present for Vmax and half-lifetime | Present for Vmax and half-lifetime | Not supplied in the table for Sigma or foam production. |

The paper reports DFA100 testing with 50 cm³ solution, air flow 0.5 dm³/min for 20 s, room temperature 21 ± 3 °C, and pH generally 5.6–6.0 unless otherwise noted. It states each measurement was repeated at least three times. However, the workbook contains aggregated values and selected standard deviations, not raw replicate rows or an explicit per-row replicate count. Therefore the exact independent sample count remains **unknown/null**.

## Missingness and grouping

- In both sheets, the Sigma and foam-production standard-deviation positions are blank for every concentration level; these blanks must remain missing, not be imputed to zero.
- PGA_LAE has 10 surfactant concentration levels; PLL_RH has 13.
- Each level is reported for the two polyelectrolyte conditions (0 and 100 mg/L). Treat concentration × polyelectrolyte condition as a condition group, not as an individual replicate.
- The article mentions an additional pH 10 condition for RH in its discussion; a definitive row-to-pH mapping is not present in the inspected workbook headers and remains unresolved.
- No exact independent-observation count, replicate-level dataset, or matched detergent-formula prediction pairs are established.

## App metadata decision

- EVD-012 is now `NUMERICALLY_INSPECTED`; app-schema `downloadStatus` is `DOWNLOADED` (worksheet parsing is independently evidenced by the acquisition manifest and passing CI).
- DS-005 records the actual file hashes and 23-column worksheet schema; `actualColumnCount = 23`.
- `actualRowCount` and `sampleCount` remain null because worksheet rows are not independent experiments and raw replicate lineage is absent.
- Numerical validation readiness is `DEFICIENT`; applicable engine list remains empty.
- `NOT_LAB_VALIDATED` remains unchanged. Phase 4B remains open and Phase 5 remains locked.

## References

- Official RepOD dataset page and file-level CC BY 4.0 license: https://repod.icm.edu.pl/dataset.xhtml?persistentId=doi%3A10.18150%2FMKCDUM
- Kosior et al. (2024), *Minerals* 14(11), 1110, DOI: https://doi.org/10.3390/min14111110
- Methods report the DFA100 procedure and at-least-three repeats; article conditions and variable semantics are not used to overwrite conflicting raw workbook labels.

## Follow-up status — CI and author clarification

- CI commit verified: `331a802c5b7076daf3eb019d679def696fb93309`.
- Phase 4B workflow run: https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/39833740971 — successful; evidence integrity, Round-6 reconciliation, RepOD acquisition/parsing, TypeScript typecheck, project tests, and production build passed.
- Engine verification run: https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/39833740911 — successful; typecheck, regression suite, production build, and HTTP smoke test passed.
- Dataset author clarification on the RH concentration unit and Vmax meaning is still **PENDING**. No author response or contact is claimed in this audit. An email draft exists, but it has not been sent.
- Independent replicate/sample count remains `null`; no row count or “at least three repeats” statement is promoted to an exact independent sample count.
- Closure decision: **Phase 4B OPEN; Phase 5 LOCKED** until source clarification and all other formal closure criteria are satisfied.
