# Phase 4B Evidence Ledger — AI Closure Audit (2026-11-27)

**Audited head:** 864816cfb66b890a41cc99f5fb956f1f4a3d73b3  
**Scope:** evidence-vault records, dataset register, source-register CSV, source-by-source review status and Phase 4B closure dependencies.  
**Review type:** AI repository/source audit; not human approval, legal advice, supplier CoA verification, or laboratory validation.

## 1. Inventory reconciliation

| Ledger object | Count | Reconciliation |
|---|---:|---|
| Evidence records in vault | 25 | EVD-001, EVD-002, EVD-004–EVD-026; EVD-003 absent/quarantined |
| Dataset records | 8 | DS-001, DS-002, DS-004–DS-009 |
| Source-register CSV data rows | 28 | 28 data rows plus header |
| Explicit EVD-named rows in source-register CSV | 10 | EVD-013 through EVD-022 |
| EVD-023–026 | 4 | Mapped to existing source-register source rows in prior reconciliation; not additional EVD-named CSV rows |
| EVD-016–022 reviews | 7 | Source-by-source AI scope/rights review recorded |

The source-register CSV is not a one-row-per-EVD register. It contains source-level rows for datasets, curated slices, public reference sources and evidence records. Its row count must not be equated with the evidence-record count.

## 2. EVD-016–022 disposition

| ID | Rights | Scientific/data scope | Archive/hash | Commercial ingestion |
|---|---|---|---|---|
| EVD-016 | Pending | Abstract/registry-level review; full-text numeric reinspection open | Missing | Block |
| EVD-017 | Unknown | EU Entry 46/46a interpretation reviewed; not Indian law | Missing | Legal reference only |
| EVD-018 | Pending | Patent example and ΔR460 scope reviewed; legal/FTO not determined | Missing | Block pending legal review |
| EVD-019 | Pending | AI cross-check and methodological discrepancy recorded; page-image reinspection open | Missing | Block |
| EVD-020 | Pending | Official DOI abstract checked against prior AI transcription; full PDF reinspection open | Missing | Block |
| EVD-021 | Pending | BASF product-range descriptors reviewed; no current lot dossier | Missing | No performance-data ingestion |
| EVD-022 | Pending | Croda product page reviewed; quantitative detergent performance absent | Missing | No performance-data ingestion |

## 3. Dataset inventory readiness

All eight DatasetRecords remain DEFICIENT for finished-formula/model validation readiness. They may support bounded component/property/method references only where source, rights and condition gates permit.

- DS-001 SurfPro: CC BY-NC-SA restriction; not eligible for commercial app ingestion absent separate permission.
- DS-002 Zenodo 18961871 workbooks: descriptive experimental evidence; no matched finished-formula predictions.
- DS-004 PhDat: auxiliary phase-behavior evidence; not formula validation.
- DS-005 RepOD MKCDUM: concentration-unit conflict and Vmax volume-versus-height ambiguity remain.
- DS-006 RepOD CMC: conductivity reported in mS without cell constant and critical measurement metadata; no validated conductivity/CMC breakpoint inference.
- DS-007 PSDI/NIST: heterogeneous source units, unresolved reference codes and compound identity conflict; archive quarantined pending row-level reconciliation.
- DS-008 P2SURF: 979 literature-compilation rows are not 979 independent experiments; pair/composition grouping exists but source-study/temperature/method leakage controls remain incomplete.
- DS-009 IUPAC pH standards: selected reference-buffer standards, not finished detergent formula pH validation.

No dataset currently supplies eligible matched formula input → engine prediction → measured finished-formula output pairs. BLK-002 remains active.

## 4. Rights and archival closure

The ledger distinguishes source availability from reuse permission, but source-specific rights and byte archival remain incomplete. Public webpage access, DOI registration, patent publication, institutional repository access or manufacturer product pages do not by themselves establish commercial reuse permission.

Known open items:
- EVD-013: archival/hash pin incomplete.
- EVD-014: article-level CC BY 4.0 verified; exact publisher bytes and hash not archived.
- EVD-015: commercial reuse permission not established; source quarantined.
- EVD-016–022: rights decisions as detailed in companion review; source bytes not archived/hash-pinned.
- EVD-004: citation identity remains quarantined.
- EVD-014–022 archival/rights work remains incomplete despite AI scope reviews.

No SHA-256 is fabricated. A source may be marked archived only after exact bytes are stored and the hash is computed from those bytes.

## 5. Phase 4B closure gate assessment

| Gate | Result | Reason |
|---|---|---|
| Evidence inventory count | PASS (count only) | 25 records enumerated |
| Dataset inventory count | PASS (count only) | 8 records enumerated |
| Source-register row count | PASS (count only) | 28 data rows; not one row per EVD |
| EVD-016–022 AI review coverage | PASS WITH LIMITATIONS | Seven records reviewed; full-text/page-image checks remain open for some |
| Rights status completeness | FAIL | Multiple rights-pending/unknown sources |
| Exact source byte archive/hash coverage | FAIL | EVD-016–022 and other records remain unarchived/unpinned |
| Master catalog identity/applicability/provenance closure | FAIL | 397 identity SSOT gaps, 427 provenance metadata gaps, 0/430 supplier-grade dossiers; applicability screen is preliminary NOT_APPROVED triage |
| Dataset scientific eligibility for finished-formula validation | FAIL | All eight datasets DEFICIENT; BLK-002 active |
| Historical engine inventory reconciliation | FAIL / UNRESOLVED | Historical 59/64/97 and 27,982 claims not fully reproduced from original artifacts |
| Phase 4B formal closure | NOT MET | Multiple mandatory gates remain unmet |
| Phase 5 numerical validation/calibration unlock | LOCKED | Do not bypass Phase 4B or convert unknown evidence into approval |

## 6. Safe path to closure

1. Keep rights source-specific. Obtain explicit commercial permissions where needed; preserve restrictions where permission is denied or unknown.
2. Archive exact source bytes only when access and rights permit; compute SHA-256 from actual archived bytes.
3. Reconcile each evidence record to a source-register row or a documented reason for no separate row. Do not assume equal row counts.
4. Complete direct source-page/image reinspection for EVD-016, EVD-019 and EVD-020 where numeric table transcription is intended.
5. For EVD-017, retain an EU-only jurisdiction rule; obtain current Indian legal assessment before asserting India compliance.
6. For EVD-018, use EPO Register and national registers for any patent legal/FTO question.
7. For EVD-021/022, obtain current manufacturer TDS/SDS/CoA/product dossier and supplier-lot assay before approving exact grade/category use.
8. Keep commercial formula release separate from bounded Phase 5 R&D development. Unknown grade data remain quarantined.
9. Acquire matched finished-formula prediction/measurement data before claiming model validation.

## Final audit decision

**Phase 4B remains OPEN. Phase 5 remains LOCKED.** The audited gate still has unmet criteria: rights, source archives/hashes, 430-record master catalog disposition, dataset eligibility and historical inventory evidence. Seven AI reviews improve documented coverage but do not create missing permissions, supplier assays, raw measurements or matched formula-validation pairs.

**Status: AI REVIEW COVERAGE IMPROVED — EVIDENCE CLOSURE NOT YET ACHIEVED.** No human approval or laboratory validation is claimed.
