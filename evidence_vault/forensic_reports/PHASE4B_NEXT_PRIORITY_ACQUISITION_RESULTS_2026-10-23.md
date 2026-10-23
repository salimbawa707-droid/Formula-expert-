# Phase 4B Next-Priority Acquisition Results — 2026-10-23

## Status

This report records two concrete source-acquisition advances. It does not close Phase 4B, promote any engine to LAB_VALIDATED, or unlock Phase 5.

## 1. RepOD DFA dataset: acquired and checksum-verified

Canonical source:
- Dataset: Dominik Kosior (2024), “Foamability and foam stability – polyelectrolyte/surfactant mixture”
- DOI: https://doi.org/10.18150/MKCDUM
- Dataset landing page: https://repod.icm.edu.pl/dataset.xhtml?persistentId=doi%3A10.18150%2FMKCDUM
- File: DFA_data.ods
- File download endpoint: https://repod.icm.edu.pl/api/access/datafile/48206
- License shown by RepOD dataset and file pages: CC BY 4.0
- Published MD5: 9bee2b49dd1a55822203e10641694c46
- Acquired file size: 18,531 bytes
- Observed MD5: 9bee2b49dd1a55822203e10641694c46 (match)
- Observed SHA-256: 3665c4386fbf75537744823246a2857fd34eceb297057d6a372c29490d56cfaf

The Phase 4B Integrity and Build Gates run 39929931057 completed successfully for branch head b33d9a458368772951c035a2e31ec293bb75258a and produced the workflow artifact `phase4b-repod-foam-audit` (artifact ID 12491670159). The artifact contains the acquired ODS and normalized CSV outputs.

### Actual workbook layout

| Sheet | Expanded rows including two header rows | Measurement rows after headers | Columns | Numeric cells | Text cells | Blank cells |
|---|---:|---:|---:|---:|---:|---:|
| PGA_LAE | 12 | 10 | 23 | 200 | 28 | 47 |
| PLL_RH | 15 | 13 | 23 | 260 | 28 | 56 |

Expanded worksheet rows are **not** asserted to be independent experimental observations.

### Scientific/data-quality findings

- The dataset measures foamability and foam stability for PGA/LAE and PLL/rhamnolipid systems, not complete commercial laundry detergent formulas and not stain-removal performance.
- The source workbook labels the RH concentration as `c RH [mol/L]`, while published article figure captions report RH concentrations in mg/dm³. Preserve the raw header and values unchanged; do not convert them silently.
- The workbook's three blank columns are unlabelled in the source header. They must remain structurally blank; they are not confirmed standard-deviation fields without independent source confirmation.
- The paper reports measurements repeated at least three times, but the workbook does not provide raw replicate rows or per-row replicate counts. Those counts remain unknown/null.
- The source publication's variable label for maximum foam volume/height is inconsistent between the workbook and article narrative; preserve source labels and flag the unresolved definition.
- The source article discusses a preliminary pH 10 RH experiment, but exact workbook-row mapping remains unresolved.
- Status remains `NOT_LAB_VALIDATED`, numerical readiness `DEFICIENT`, engine eligibility empty. This dataset is mechanistic/description-only evidence and is not suitable to calibrate Cleaning Score/CPI or claim detergent formula accuracy.

## 2. Pušić et al. (2006): original PDF found; table extraction initiated

Citation: Pušić, T.; Šostar Turk, S.; Soljačić, I.; Tarbuk, A.; Fijan, R.; Arnuš. (2006). “Primary Washing Effect of Powder and Liquid Detergents.” *Tekstil* 55(1), 11–18.

- Publisher landing page: https://www.tekstil.hist.hr/index.php/tekstil/article/view/3174
- Publisher PDF: https://tekstil.hist.hr/index.php/tekstil/article/download/3174/3174/3174
- Publisher states CC BY 4.0.
- The eight-page PDF is accessible; printed page 13 contains Tables 5–8 with R460 readings for eight stain types plus a fabric standard.
- Tables 5–6 cover powder detergent at 30, 40 and 45 g/kg on cotton and polyester/cotton 50:50 fabric. Tables 7–8 cover liquid detergent at 17.5, 25 and 35 mL/kg on those fabrics.
- The washing setup described in the paper includes 60 °C, 65 L drum volume, 0.88 kg ballast fabric, 0.12 kg stained cloth, liquor ratio 1:5, initial temperature 22 °C, 18.8-minute wash and 7-minute rinse; reported water hardness is 1.45 °dH.
- R460 is an optical remission/reflectance measurement. It must not be relabelled as percentage soil removal, and no Cleaning Score should be derived without a separately validated conversion method.
- The tables are summarized values, not raw replicate-level observations with uncertainty.

### Potential transcription anomalies to independently recheck

- Table 5: blood-stained cotton, powder detergent at 45 g/kg is printed as 57.46.
- Table 6: blood-stained polyester/cotton at 45 g/kg is printed as 69.19.
- The values are retained as printed in this audit note; they must not be silently “corrected” based on expected trends.

### Extraction status

The numeric table transcription is at the manual review stage only. Every value requires an independent second pass against the original page image before the data can be accepted as source-backed evidence. Until that is done, status is `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`; not `LAB_VALIDATED`.

## Next actions

1. Complete and independently verify the 144-value tidy transcription from Tables 5–8, retaining table/cell provenance, units, condition, control rows, and anomaly flags.
2. Preserve the original PDF as a source reference and record a checksum for the exact PDF bytes if those bytes are acquired into the repository or CI artifact.
3. Keep R460 distinct from stain-removal percentages and from Cleaning Score/CPI targets.
4. Re-run the Phase 4B acceptance checklist and historical aggregate reconciliation independently. These source advances alone do not satisfy the phase gate.

## Gate decision

Phase 4B remains OPEN. Phase 5 remains LOCKED. No scientific model is promoted, no accuracy percentage is claimed, and no phase is unlocked by this report.
