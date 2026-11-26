# EVD-014–022 disposition closure addendum

**Date:** 2026-11-27  
**Scope:** close the AI-executable source identity, scientific interpretation, applicability, and evidence-use disposition work for EVD-014 through EVD-022.  
**This is not a claim of rights clearance, source-byte archival, independent human approval, or engine validation.**

## 1. Closure decision

The internal AI-executable review of all nine records is **CLOSED WITH RESTRICTIONS**. Every record has a source identity, a bounded scientific interpretation, a non-transfer/applicability boundary, a rights disposition, and an explicit decision about whether it can support commercial ingestion or engine validation.

No record in this batch is approved as a quantitative finished-formula validation label. This is deliberate: the inspected sources do not provide the complete matched prediction/observation, formulation identity, protocol, conditions, replicate/uncertainty, and rights package needed for that use.

“Closed with restrictions” means no additional scientific inference should be manufactured from the current source material. It does not mean blocked permissions, missing source bytes, or required human approvals have magically passed.

## 2. Final record disposition

| EVD | Final evidence classification | Permitted use now | Explicitly prohibited / not established |
|---|---|---|---|
| 014 | Mechanistic dishwashing foam literature; article-level CC BY 4.0 identified | Attributed literature discussion within license | No foam half-life, foam-decay coefficient, laundry transfer, or ENG-005 validation |
| 015 | Manual dishwashing APG formulation study; design-of-experiments evidence | Qualitative/formulation-specific reference | No external model validation; no treating 30 design runs as independent holdout; no cSt-to-cP conversion without density and matched conditions |
| 016 | Manual dishwashing SLES/AOS formulation-specific study | Bounded reference for the tested systems and method | Foam height is not foam decay/half-life; no laundry transfer; no commercial numeric ingestion pending rights |
| 017 | Official EU REACH regulatory reference | Explain Entry 46 vs 46a accurately as EU regulatory context | Not Indian law; Entry 46a is not a detergent-mixture threshold; no India compliance claim |
| 018 | Patent/publication and EPO procedural-history reference | Technical prior-art/context review; cite EPO decision for the specific European appeal | No family-wide legal conclusion, freedom-to-operate opinion, or engine-performance validation |
| 019 | LAS/AE interaction literature with independently adjudicated pure-LAS Gibbs-factor issue | Preserve source values; separately record n=2 theoretical pure-LAS re-evaluation; retain mixed rows as method-qualified | No raw-data refit, no author-confirmed correction, no human second review, no commercial table/figure reuse, no ENG-002 validation |
| 020 | Specific mixed-soil detergency thesis evidence | Qualitative/method-specific scientific context | No generic washing-powder benchmark, no water-hardness inference from 2 wt.% NaCl, no commercial reuse absent item-specific permission |
| 021 | Manufacturer product-range specification | Product identity/specification lead; seek current supplier TDS/SDS/CoA | No measured target-formula foam suppression, dosage response, foam half-life, or engine validation |
| 022 | Manufacturer product description for PEG-40 hydrogenated castor oil | Ancillary solubiliser/emulsifier candidate for compatibility screening | Not a primary laundry surfactant; not proven Home Care performance; no finished-wash validation |

## 3. Scientific adjudication — EVD-019

For pure 1:1 sodium LAS in distilled/deionized water with no excess common electrolyte described, the simplified Gibbs coefficient is n=2. Using the paper's pure-LAS slope and stated temperature gives approximately:

- Table 1 (23.58 °C): Γ = 1.3994×10⁻¹⁰ mol·cm⁻²; molecular area = 118.66 Å².
- Table 2 duplicate row (23.5 °C): Γ = 1.3998×10⁻¹⁰ mol·cm⁻²; molecular area = 118.62 Å².

The paper's printed Γ/A values are retained exactly as source-reported and are numerically consistent with n≈1. They are flagged as inconsistent with the stated no-excess-electrolyte pure-LAS condition. The recalculated n=2 values are theoretical re-evaluations, not measurements and not an author correction.

For ionic/nonionic mixed systems, effective n depends on composition/interfacial packing. Do not force n=2 onto mixed rows. No raw concentration series is available to reconstruct the effective coefficient or refit the mixed model. The detergent chassis contains 41 wt.% STPP and cannot support phosphate-free product claims.

Independent basis:
- Brusseau (2020), Water Research 190, 116778, DOI 10.1016/j.watres.2020.116778: n=1 for nonionic or ionic-with-excess-electrolyte; n=2 for ionic without excess electrolyte.
- Hua & Rosen (1982), Journal of Colloid and Interface Science 87(2), 469–477, DOI 10.1016/0021-9797(82)90344-7: composition-dependent Gibbs coefficient for ionic/nonionic mixtures.

## 4. Batch-wide gate ledger

| Gate | State | Reason / boundary |
|---|---|---|
| Source identity and bibliographic reconciliation | CLOSED | 9/9 records identified and reconciled |
| Scientific applicability and non-transfer limits | CLOSED | Explicit per-record boundaries above and in the detailed source disposition |
| EVD-019 pure-LAS theoretical n-factor | CLOSED | Independent literature and dimensional recalculation complete |
| Mixed-system raw-data reconstruction/refit | NOT AVAILABLE — DO NOT CLAIM | Source concentration series/complete calculation ledger absent |
| Exact source-byte archive and repository SHA-256 | OPEN EXTERNAL/REPOSITORY TASK | Prior source audit reports 0/9 archived; no hashes may be fabricated |
| Rights clearance for commercial redistribution/ingestion | OPEN EXTERNAL TASK | Permission cannot be inferred from public access; item-level status differs |
| Independent human second review | OPEN HUMAN TASK | AI review cannot satisfy the required independent human sign-off |
| Engine validation | NOT ESTABLISHED | No eligible matched finished-formula prediction/observation pairs created by this batch |

## 5. External dependencies — no AI-side substitute

The following are not tasks an AI reviewer can truthfully complete by writing a report:

1. A human reviewer must independently inspect the source transcriptions and record an attributable approval.
2. Rights holders/repositories must clarify any reuse rights not already granted by an explicit license. No permission is inferred from ResearchGate, CORE, public product pages, patent publication, or public access.
3. Source custodians must provide any missing original raw concentration/replicate data or author calculation ledger if a quantitative refit is desired.
4. Suppliers must provide current grade-specific technical documentation for EVD-021 and EVD-022 if formulation qualification is intended.
5. Patent counsel must assess jurisdiction-specific family status/FTO if a legal decision is intended.

These dependencies remain visibly open. Do not convert them to PASS, CLOSED, or “complete” without the corresponding external evidence.

## 6. Final operational instruction

- Treat EVD-014–022 as **RECONCILED / DISPOSITION CLOSED WITH RESTRICTIONS** for source triage and scientific interpretation.
- Keep all prohibited commercial ingestion, redistribution, and engine-validation paths fail-closed.
- Preserve all original source-reported values and all correction provenance.
- Do not use these nine records to unlock Phase 5.
- Phase 4B remains OPEN because its broader evidence governance, human-review, archival/provenance, engine-inventory and empirical validation gates are not satisfied by closing this nine-record batch.

**Final decision:** no further AI-only scientific interpretation should be added to EVD-014–022 without new primary evidence. The remaining work is external evidence acquisition, legal/rights confirmation, source archiving, or independent human approval—not speculative chemistry.
