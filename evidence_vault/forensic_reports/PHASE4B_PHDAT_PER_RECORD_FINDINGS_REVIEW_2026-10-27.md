# Phase 4B — PhDat Per-Record Findings Review

**Review date:** 2026-10-27  
**Dataset:** PhDat, Figshare item 29071202, version 4  
**Source SHA-256:** `748a29d08341bd8e868247d609401301495e24b3c1d88ed3b0ec065e2cdb12f3`  
**Audit workflow run:** [40368547323 — Phase 4B Integrity and Build Gates](https://github.com/salimbawa707-droid/Formula-expert-/actions/runs/40368547323)  
**Companion merged implementation:** [PR #53](https://github.com/salimbawa707-droid/Formula-expert-/pull/53)  
**Status:** Review snapshot only. Phase 4B remains OPEN; Phase 5 remains LOCKED.

## 1. Reproducibility and scope

The report below was reviewed from the PhDat audit artifact emitted by CI run 40368547323. The artifact included the official raw `PhDat.json`, source manifest, per-record label-provenance CSV, identity/applicability CSV, and per-record compatibility-readiness CSV/JSON/Markdown. The official source hash above must match before reusing these findings.

PhDat represents literature-curated/digitized aqueous surfactant phase behavior as a function of temperature and composition. It is auxiliary phase-behavior evidence only. It is **not** a direct detergent cleaning, soil-removal, hard-water chelation, foam lifetime, pH, Cleaning Score, or formula-accuracy benchmark.

## 2. Verified audit totals

| Check | Observed result |
|---|---:|
| Records | 143 |
| Source marks complete / incomplete | 99 / 44 |
| Exact duplicate-SMILES groups / affected records | 4 / 10 |
| Method missing or placeholder | 70 |
| Purity missing or placeholder | 94 |
| Records containing phase key `U` | 42 |
| Records with repeated source-label mappings | 5 |
| Records with repeated dataset-label mappings | 24 |
| Records with phase-key/label-token diagnostics | 79 |
| Malformed label pairs | 0 |
| Records with array-integrity failures | 0 |
| Confirmed ingredient-catalog identity joins | 0 |
| Formula-validation-eligible records | 0 |

Array integrity means the encoded arrays parsed, contained finite numeric values, and had aligned lengths. It does **not** certify digitization accuracy, correct scientific interpretation of labels, independent experiments, or suitability for detergent formula validation.

## 3. Per-record triage tiers

These tiers are for prioritizing manual review before exploratory aqueous phase-behavior work. They are not scientific approval.

- **Priority candidate for manual phase-label review — 25 records:** 14, 15, 16, 18, 22, 24, 27, 29, 37, 43, 44, 45, 46, 47, 48, 49, 50, 117, 118, 126, 127, 128, 141, 142, 143.
- **Exploratory candidate with explicit qualifiers — 74 records:** 6, 7, 17, 20, 21, 23, 25, 26, 28, 31, 32, 33, 34, 35, 36, 38, 39, 40, 41, 42, 52, 54, 55, 62, 64, 65, 67, 68, 72, 75, 76, 78, 89, 90, 91, 93, 94, 95, 96, 97, 99, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 119, 120, 121, 122, 123, 124, 129, 130, 131, 132, 133, 134, 136, 137, 138, 139, 140, 144.
- **Hold — incomplete or untraceable source record — 44 records:** 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 19, 30, 51, 53, 56, 57, 58, 59, 60, 61, 63, 66, 69, 70, 71, 73, 74, 77, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 92, 100, 101, 125, 135.

**Important:** Record 29 is in the manual-review priority tier but also belongs to duplicate-SMILES group 29/119. The tier must not be interpreted as clearance to pool that record with another record. All duplicate groups require source/figure-level review.

## 4. Exact duplicate-SMILES groups

Do not merge, remove, or pool any of these records solely because the SMILES strings match.

1. **Records 29 and 119.** Record 29: “Dodecyl-12-tetraethylene glycol pentaethylene glycol ether,” source *Colloid Polym Sci* 272, 400–408 (1994), figure F7a. Record 119: “1,3-bis(Tetraethylene glyocl methyl ether)-2-dodecyl glycerol,” Kratzat and Finkelmann, *Liquid Crystals* 13(5) (1993), p. 691–699, figure F2b. Both are marked complete and list 98% purity, but have different names and source/figure provenance. Confirm source identity and structural interpretation before pooling.
2. **Records 41 and 112.** Both are “Decyl Hexaethyl glycol ether” variants, with distinct source/figure references (1967, F1b; 1998, F3). Purity is missing in both. Preserve the source-specific records.
3. **Records 54, 62, 74 and 116.** Dodecyldimethylphosphine oxide variants with multiple figures/sources. Method and purity are missing in all four; record 74 is marked incomplete. Do not combine phase observations until source-specific figure, extraction and label meaning are reviewed.
4. **Records 101 and 106.** Both are Sodium Laurate with different source/figure provenance. Record 101 is incomplete; record 106 has repeated dataset-label mappings and phase-key/label diagnostics. Keep both separate.

## 5. Missing method and purity metadata

- **Method missing/placeholder (70 IDs):** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 30, 38, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 99, 100, 115, 116, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140.
- **Purity missing/placeholder (94 IDs):** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 30, 31, 32, 33, 34, 35, 36, 38, 39, 40, 41, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 93, 94, 95, 96, 97, 99, 100, 101, 103, 104, 105, 106, 107, 108, 112, 113, 114, 115, 116, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140.

The source and figure fields were present across all 143 records in this scan; that establishes field presence, not that every citation or figure has been independently verified against the original paper.

## 6. Phase-label review queue

- **Records with a `U` phase key (42 IDs):** 1, 2, 4, 8, 9, 10, 11, 12, 13, 19, 30, 51, 53, 56, 57, 58, 59, 60, 61, 63, 66, 69, 70, 71, 73, 74, 77, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 92, 99, 100, 125, 135. Treat `U` as unknown/unclear, never as a known phase.
- **Repeated source-label mappings (5 IDs):** 59, 63, 72, 78, 139.
- **Repeated dataset-label mappings (24 IDs):** 23, 56, 63, 68, 71, 74, 76, 85, 86, 87, 88, 99, 102, 106, 119, 120, 121, 122, 123, 129, 130, 131, 132, 144.
- **Phase-key/label-token diagnostics (79 IDs):** 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 17, 19, 20, 21, 25, 26, 28, 30, 38, 39, 41, 42, 51, 52, 53, 54, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 69, 70, 71, 73, 74, 75, 76, 77, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 90, 91, 92, 99, 100, 101, 102, 106, 107, 108, 109, 110, 111, 115, 116, 119, 124, 125, 133, 134, 135, 137.

A phase-key/token mismatch is a diagnostic, not automatically an error: source aliases, coexistence labels and dataset-specific phase keys require checking against the cited source figure and the dataset's mapping definition. The per-record CSV contains the exact keys/tokens for each flagged record.

## 7. Ingredient-catalog applicability

- The current canonical ingredient catalog schema has no SMILES field, so no structure-level join was possible.
- Exact normalized-name candidate count in the audit: 0.
- Confirmed chemical identity joins: 0.
- Automatic mappings and formula-validation eligibility: 0.

Do not infer that a PhDat surfactant is the same as a commercial detergent raw material based only on a similar name. CAS/structure, active grade, counterion, purity, chain-length distribution and source-specific identity must be established before a join can be defended.

## 8. Required next actions

1. Manually inspect original cited figures for the 25 priority IDs, preserving source-page/figure/cell traceability and review decisions.
2. Resolve duplicate-SMILES groups at source level, especially groups 29/119, 41/112, 54/62/74/116, and 101/106.
3. For the 70/94 missing-method/purity records, retrieve metadata only from cited source material; never fill unknowns from guesses or unrelated papers.
4. Review all 79 phase-key diagnostics and 42 `U` records against source definitions. Keep unknown labels unknown unless the source explicitly resolves them.
5. Keep all 44 incomplete records on hold until the missing evidence is resolved.
6. Retain the exact per-record CSV/JSON from the CI artifact for reproducibility; the artifact is associated with workflow run 40368547323. Do not mark the artifact itself as a source publication.
7. Keep PhDat classified as auxiliary phase-behavior evidence. Do not promote scientific maturity or unlock Phase 5 on the basis of this review.

## 9. Integrity and governance statement

No source values were changed, normalized, imputed, converted, deduplicated, or reallocated during this review. Exact duplicate-SMILES records remain separate. No records are approved for detergent formula validation; no `LAB_VALIDATED` status or engine eligibility is granted.

**Disposition:** PhDat per-record triage is complete as a reproducible first-pass audit. Source-figure human review and missing-metadata resolution remain open. Phase 4B OPEN; Phase 5 LOCKED.
