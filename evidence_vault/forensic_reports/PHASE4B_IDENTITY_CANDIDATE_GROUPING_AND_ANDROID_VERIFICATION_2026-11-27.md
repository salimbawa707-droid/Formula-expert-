# Phase 4B — Identity Candidate Grouping and Exact-Head Verification Addendum

**Date:** 2026-11-27  
**Branch:** `audit/phase4b-master-ingredient-applicability-provenance-2026-11-27`  
**Review type:** AI-only repository/data audit. Not human approval, legal advice, supplier CoA verification, or laboratory validation.

## 1. Android and software verification

Run #1311, ID `46021447208`, commit `6464cf4a884a4297cf23ec0b35c263aba041a97a`: **7/7 jobs PASS**. It produced the debug APK and the Android WebView instrumentation report.

Run #1314, ID `46023412308`, commit `665fa85e5f80649028327ae16361d825ad6f55d3`: **7/7 jobs PASS**. This run includes the regulatory identity resolver changes and all three new fail-closed regression assertions.
- TypeScript typecheck: PASS
- Production build and server smoke: PASS
- Full TypeScript regression: PASS
- Evidence syntax/regression/fail-closed guardrails: PASS
- Phase 6 lab evidence regression: PASS
- Capacitor Android debug APK: PASS
- KVM enablement step: PASS
- Android WebView document persistence/download instrumentation: PASS, 1 test, 0 failures, 0 skipped; 21.392 seconds
- Runtime log inspection: no Android fatal exception or ANR marker in the uploaded errors log.

Run #1314 artifacts:
- Debug APK artifact ID: `15211925994`
- Instrumentation report artifact ID: `15211356172`

The APK is a debug build, not a scientific or commercial release certification. Android instrumentation covers the named WebView document persistence/download test only; it is not a complete device/OS compatibility campaign.

## 2. New 430-record identity grouping audit

The canonical `UNIVERSAL_INGREDIENTS` source was regrouped by the exact pair `CAS number + INCI name`, without merging different INCI distributions merely because they share a CAS.

| Metric | Result |
|---|---:|
| Master ingredient records | 430 |
| Unique exact CAS+INCI groups (including no-CAS groups) | 119 |
| Groups matched to the seven-entry identity SSOT | 7 |
| Groups not matched to identity SSOT | 112 |
| Catalog records covered by the seven matched groups | 33 |
| Catalog records not covered by exact SSOT crosswalk | 397 |
| Groups without CAS | 4 |
| Records without CAS | 7 |
| Supplier-grade dossiers/assays attached | 0/430 |

The 397 figure is a **record-level** gap, not 397 distinct chemical identities. The current source contains 112 unmapped CAS+INCI/no-CAS candidate groups. This grouping is a queue for source-backed identity work, not a declaration that all 112 identities are already verified.

Created:
`evidence_vault/datasets/master_ingredient_identity_candidate_groups_2026-11-27.csv`

Each row preserves the candidate pair, catalog record IDs, catalog classes, whether it exactly matches the existing SSOT, and the reason/source-verification disposition. Every row is explicitly catalog-only and externally unverified.

## 3. CAS collision / distribution warning

Two CAS numbers appear against multiple distinct INCI distribution names in the catalog:
- `68439-50-9`: C12-15 Pareth-3, Pareth-7, Pareth-9 and Pareth-12 (16 catalog records).
- `9016-45-9`: Nonoxynol-6, Nonoxynol-9 and Nonoxynol-10 (12 catalog records).

These are not to be collapsed to one interchangeable surfactant grade. The EO distribution is chemically/materially relevant. CAS-only matching would lose the distribution distinction; exact CAS+INCI grouping preserves it. The catalog labels still require authoritative source verification and supplier grade documentation.

The four no-CAS groups are:
- Proprietary Enzyme & Thickener Blend (Aristo 9)
- Colorant
- Parfum
- Colorant (CI Blend)

No composition or identity has been invented for these records.

## 4. Regulatory identity remediation

The resolver fix and tests are documented in:
`PHASE4B_REGULATORY_IDENTITY_JURISDICTION_SCOPE_AUDIT_2026-11-27.md`

Exact jurisdiction matching, explicit product-category scope, and UNKNOWN disposition for unsupported generic regulatory claims are now in the code. Run #1314 passed on the exact commit containing those code changes.

## 5. Remaining Phase 4B blockers

1. The 112 identity candidate groups still need source-by-source authoritative identity evidence; 0/430 supplier-grade TDS/SDS/CoA/lot assays are attached.
2. 427/430 records still lack structured catalog provenance; 429/430 lack provenance URLs.
3. All eight datasets remain DEFICIENT for finished-formula/model validation readiness.
4. BLK-002 remains active: no eligible matched finished-formula prediction/measurement pairs for the blocked target engines.
5. EVD-016/019/020 PDF-byte/page-image and source-specific rights tasks remain open as recorded in the direct-PDF inspection addendum.
6. Historical engine inventory claims (59/64/97 and 27,982 observations) remain unreproduced from source artifacts.
7. Phase 4B formal closure remains NOT MET; Phase 5 remains LOCKED.

The exact-candidate grouping improves the work queue and prevents CAS-only conflation. It does not close identity, rights, supplier-grade, dataset-validation, or formula-prediction blockers.
