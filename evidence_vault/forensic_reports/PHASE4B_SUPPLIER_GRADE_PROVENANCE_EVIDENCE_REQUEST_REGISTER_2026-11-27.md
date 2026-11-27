# Phase 4B — Supplier-grade & provenance evidence-request register (2026-11-27)

## Purpose and status

This register converts the reviewed identity-source findings into actionable supplier/catalog-owner evidence requests. It is a tracking instrument, not evidence that any supplier has been contacted or has supplied documents.

- Register request events: **84**.
- Unique MICG candidate groups represented: **83**.
- Source inventory: `evidence_vault/datasets/master_ingredient_identity_candidate_groups_2026-11-27.csv`.
- Source audit: `evidence_vault/forensic_reports/PHASE4B_SURFACTANT_IDENTITY_SOURCE_REVIEW_2026-11-27.md`.
- Current request status for every row: `NOT_REQUESTED`.
- Current evidence verification for every row: `NOT_VERIFIED`.
- No supplier contact, document receipt, lot authentication, assay verification, regulatory clearance or applicability approval is claimed.

## Count reconciliation — important correction

The prior audit aggregate stated 84 candidate groups. Re-expanding every MICG identifier/range present in the source audit yields **83 unique MICG groups**, not 84. The register therefore contains 83 unique-group records plus one separately identified second request event for MICG-005 (calcium chloride grade/hydrate reconciliation), for **84 request events**. This preserves the earlier 84-event workload without falsely claiming 84 distinct MICG IDs. The aggregate candidate-group count should be corrected to 83 unique groups unless another source inventory row is produced.

Unreviewed candidate IDs in the 119-group inventory are intentionally not silently added to this register. This file covers only the source-audit scope represented in the report.

## How to use

1. Send each request to the actual manufacturer or authorized supplier for the exact product code and grade. A distributor's generic webpage is not sufficient.
2. Attach the catalog ingredient IDs in the CSV so the supplier maps each commercial variant separately.
3. Record received file names, document revision/date, supplier contact and lot number in the tracking columns.
4. Verify the CoA lot against the physical stock label and purchase document. A generic sample CoA does not verify a delivered lot.
5. Keep identity, commercial grade, batch assay, safety classification, regulatory status and formula applicability as separate decisions.

## Required evidence quality

- **TDS:** exact product/grade, composition or declared active/solids basis, physical form, pH/viscosity/density where relevant, recommended handling/storage and test methods.
- **SDS:** exact product code, manufacturer, revision date, composition/hazard disclosures and jurisdiction.
- **CoA:** lot-specific, dated, signed/traceable, numeric results, specification limits, units and methods.
- **Traceability:** manufacturer, manufacturing site/country, authorized supplier, product code, lot/batch, manufacturing/retest/expiry dates, and document-to-lot linkage.
- **Mixtures/UVCBs:** composition range or adequate confidential disclosure, carrier/emulsifier/preservative system, relevant chain-length/EO or molecular-weight distribution and active matter.
- **Enzymes:** activity units and assay method; mass percentage alone is not an activity assay.
- **Preservatives:** active fraction and carrier are required; finished-formula preservative challenge testing remains separate and mandatory where applicable.
- **Fragrance:** product-specific IFRA conformity for the intended use plus allergen/restricted-material declaration; this does not replace finished-product safety assessment.

## Status vocabulary

- `NOT_REQUESTED`: request not yet sent.
- `REQUESTED`: sent to identified supplier/catalog owner; date and recipient recorded.
- `PARTIALLY_RECEIVED`: one or more requested documents received, required set incomplete.
- `RECEIVED_UNVERIFIED`: documents received but not authenticated/reconciled.
- `VERIFIED_GRADE_AND_LOT`: exact product/grade and lot-specific evidence passed review.
- `REJECTED_OR_MISMATCHED`: document/product/lot mismatch, invalid or contradictory data.
- `NOT_APPLICABLE`: only with documented rationale; never use to hide missing evidence.

A row may reach `VERIFIED_GRADE_AND_LOT` only when all applicable acceptance criteria pass. This status still does **not** mean formula applicability is approved.

## High-priority holds

P0 requests include proprietary/no-CAS mixtures, identity/CAS/nomenclature conflicts, active-matter discrepancies, preservative/biocide actives, enzyme activity and emulsion/UVCB grade definition. These should block automatic scientific promotion and formula calculations that depend on unverified assay.

## Current gate

All register entries begin as `NOT_REQUESTED` / `NOT_VERIFIED`. The 397-row identity crosswalk backlog and 5,590 `NOT_APPROVED` applicability rows remain separate controls. Phase 4B remains OPEN; Phase 5 remains LOCKED.
