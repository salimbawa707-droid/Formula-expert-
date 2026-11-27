# Phase 4B — Regulatory Identity Jurisdiction and Scope Audit

**Date:** 2026-11-27  
**Audited branch:** `audit/phase4b-master-ingredient-applicability-provenance-2026-11-27`  
**Review type:** AI source/code audit. Not legal advice, regulator confirmation, or human approval.

## Finding RG-4B-01 — GLOBAL-to-jurisdiction fail-open

The ingredient identity resolver previously selected a regulatory identity when either the requested jurisdiction matched exactly **or** the record was labelled `GLOBAL`. Consequently, a GLOBAL record could be returned as an approval for India, the EU, the US, or another jurisdiction. A global inventory/listing is not a jurisdiction-specific legal determination.

**Remediation:** `resolveRegulatoryStatus` now matches only the exact requested jurisdiction. Missing exact jurisdiction returns `UNKNOWN`.

## Finding RG-4B-02 — Product-category scope was ignored

The resolver accepted `_productCategory` but did not use it. A substance-level regulatory listing could therefore be reported as applicable to a detergent category without an explicit category scope.

**Remediation:** when a product category is requested, the resolver now requires a non-empty `productCategoryScope` containing that category. Missing or mismatched scope returns `UNKNOWN`.

## Finding RG-4B-03 — Generic dossier labels overstated as APPROVED

The seven identity SSOT regulatory records used generic source labels such as “ECHA REACH Dossier [CAS]”, “FDA GRAS & REACH Dossier”, or “US EPA TSCA Inventory & ECHA List”, while asserting `APPROVED` and `VERIFIED`. The repository records did not attach an exact official record URL/document, the applicable legal instrument, a product-category scope, or a verifiable effective date for those claims. In particular, inventory/registration/listing status must not be conflated with product approval or detergent-category compliance.

**Remediation:** all seven generic regulatory identity statuses and their regulatory-provenance verification flags were downgraded to `UNKNOWN`; unsupported generic effective dates were removed. The underlying chemical identity metadata is not thereby deleted or invalidated. Regulatory approval must be re-established only from the exact official legal source and scope.

## Regression protection

Added assertions to the existing Phase 2/14 regulatory regression suite for:
1. GLOBAL record cannot satisfy India jurisdiction.
2. GLOBAL substance-level record without product scope cannot satisfy a detergent category.
3. Generic unsubstantiated EU record cannot return APPROVED.

These changes are code-level fail-closed remediation. They do not establish compliance in any jurisdiction.

## Current gate status

- Android debug APK build and Android WebView instrumentation: PASS on Run #1311, commit `6464cf4a884a4297cf23ec0b35c263aba041a97a`.
- Full quality-gate workflow on that commit: 7/7 jobs PASS.
- Regulatory identity remediation in this report: committed in the branch, exact-head CI pending at report creation.
- Phase 4B: OPEN.
- Phase 5: LOCKED.

## Remaining scientific/provenance blockers

1. 397/430 master ingredient records lack exact CAS+INCI crosswalk to the current seven-entry identity SSOT.
2. 427/430 lack structured catalog provenance; 429/430 lack a provenance URL.
3. 0/430 have attached grade-specific supplier TDS/SDS/CoA/lot assay.
4. All eight dataset records remain DEFICIENT for finished-formula/model validation readiness.
5. BLK-002 remains active: no eligible matched finished-formula prediction/measurement pairs for the blocked target engines.
6. EVD-016/019/020 direct PDF page-image/source-byte/rights items remain incomplete as recorded in the direct PDF addendum.
7. Historical engine inventory counts 59/64/97 and 27,982 observation claim remain unreproduced.

No missing supplier assay, legal permission, or laboratory measurement is inferred or fabricated.
