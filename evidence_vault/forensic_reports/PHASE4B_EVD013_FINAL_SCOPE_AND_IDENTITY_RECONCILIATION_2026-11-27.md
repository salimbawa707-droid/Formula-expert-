# EVD-013 — final scientific scope and source-identity reconciliation

**Audit date:** 2026-11-27  
**Source article:** Izawa, T., James, L. A. & Yethiraj, A. (2026), *The decay of saline surfactant foams: a study at macroscopic and bubble scales*, Royal Society Open Science 13:251765. DOI: 10.1098/rsos.251765.  
**Review type:** AI-assisted scientific and documentary review; not independent human approval.

## 1. Final disposition

**Scientific applicability: CLOSED — REFERENCE ONLY.**  
**Source identity / item membership: OPEN — OFFICIAL ITEM METADATA NOT RETRIEVED.**  
**Archival / checksum: OPEN — ORIGINAL SUPPLEMENTARY BYTES NOT ARCHIVED.**  
**Commercial reuse rights: NOT RE-CLEARED IN THIS PASS.**  
**Finished-formula validation: NOT APPROVED.**

This is the final defensible scientific disposition from the article itself. It is not a claim that every source-governance or archival gate has been completed.

## 2. Primary-source facts

The publisher article identifies its supplementary material using the Figshare **collection DOI**:

- Article: https://doi.org/10.1098/rsos.251765
- Article PDF inspected: https://softmaterials.ca/wp-content/pdf/Izawa%20et%20al%202026.pdf
- Supplementary collection DOI: https://doi.org/10.6084/m9.figshare.c.8304092

The paper studies Triton X-100, a nonionic surfactant, at 0.0047 ± 0.0002 mol/L (reported as 0.3 wt.%) in five-salt synthetic brines. The salinity range extends from fresh-water conditions to 107.133 g/kg. Macroscopic foam measurements report four trials per salinity. The paper distinguishes initial drainage, an intermediate collapse-dominated regime, and late-time logarithmic foam-height decay. Bubble cross-sectional area is a separate observable and its supported linear fitting window is limited.

This system is not household Ca/Mg water hardness, not a laundry/dishwashing formulation, and not a matched finished-product performance test.

## 3. Source-identity conflict corrected

The repository's earlier EVD-013 notes contain inconsistent statements about numeric Figshare item ID 31314542: one says the number is incorrect because it is also a PubMed PMID; another correctly cautions that a numeric namespace collision alone does not prove the Figshare identifier is wrong.

**Correction:** the PubMed-number coincidence is not evidence that the Figshare item DOI is invalid. Conversely, an earlier secondary record stating item DOI 10.6084/m9.figshare.31314542 v3, one 8.11 MB PDF and CC BY 4.0 is not sufficient to re-confirm the item.

The following official Figshare API resources were attempted during this pass:

- https://api.figshare.com/v2/articles/31314542
- https://api.figshare.com/v2/collections/8304092
- https://api.figshare.com/v2/collections/8304092/articles

The web retrieval layer returned access/internal errors for those API endpoints. A direct network request from the execution container also failed at DNS resolution. These are retrieval-environment failures, **not** evidence that the item or collection does not exist.

Accordingly, this pass cannot establish:
- whether item 31314542 is a member of collection 8304092;
- the item’s authoritative version, title, authors or publication metadata;
- the exact file list, file sizes, download URLs or file checksums;
- the item-level license and any file-specific rights conditions.

Do not label the item DOI wrong, and do not label its item-level CC BY 4.0 status re-verified. Keep the previously recorded CC BY 4.0 claim as **REVALIDATION_PENDING**.

## 4. Mathematical and scientific interpretation

### 4.1 Late-time foam-height decay

The article describes the late-time regime with a logarithmic relationship of the form:

`F(t) = F(1) - J_mean log10(t)`

where the slope is expressed as foam-height change per logarithmic time decade. The paper's zero-height extrapolation is:

`log10(t_final) = F(1) / J_mean`

The ratio must be dimensionless, and the time reference/unit used inside the logarithm must be explicit (the paper's calculation uses seconds). The logarithmic fit belongs to the late-time regime; fitting one exponential across the initial, intermediate and late regimes would misrepresent the reported physics.

The authors caution that the late-time decay is non-exponential. A universal first-order foam half-life must not be inferred from this relation.

### 4.2 Bubble-scale coarsening

The paper separately describes approximately linear bubble-area growth over its supported observation window. The reported coefficient is source- and condition-specific. It is not a universal coarsening constant and must not be transferred as a detergent formulation coefficient.

### 4.3 Transfer restrictions

The source does not test LAS, SLES, AOS, AES, APG, betaines, amine oxides, builders, enzymes, fragrance, soil load, household wash cycles, detergency, rinsability or fabric compatibility. Salinity in g/kg must not be substituted for Ca/Mg hardness in mg/L as CaCO3. Foam persistence is not equivalent to cleaning performance.

## 5. Permitted and prohibited use in Formula Expert

**Permitted:**
- qualitative explanation that drainage, coalescence and coarsening are distinct foam mechanisms;
- qualitative recognition that a logarithmic late-time foam-height regime can occur;
- a protocol-design reference for separately measuring foam height and bubble-size evolution;
- a reference-only example for testing time-unit and regime-boundary handling after exact source data are obtained.

**Prohibited on current evidence:**
- treating plotted/digitized curves as raw experimental replicate data;
- claiming machine-readable raw replicate time series are archived;
- using this paper to calibrate laundry/dishwash formula predictions;
- assigning universal numeric half-life or cleaning-performance labels;
- promoting ENG-005 or any other engine to LAB_VALIDATED;
- commercial ingestion or redistribution based solely on the earlier unverified item-license entry.

If figures are later digitized under applicable rights, every value must be labeled DIGITIZED_FROM_FIGURE and retain axis calibration, extraction method and digitization uncertainty. Such values remain secondary derived observations, not original raw data.

## 6. Archival and rights gate

No original Figshare supplementary bytes were obtained in this pass. Therefore:
- no PDF is newly committed to the evidence vault;
- no SHA-256 is claimed or generated;
- no source-byte integrity comparison is claimed;
- no new license clearance is asserted.

The next archival gate is to retrieve the collection's official item listing and item metadata through a working Figshare API/landing-page session, verify collection membership and version-specific license/file metadata, download the exact file only if reuse/archival terms permit, then compute SHA-256 locally and compare it with any publisher-provided checksum where available.

## 7. Final gate table

| Gate | Final status |
|---|---|
| Article identity and DOI | VERIFIED |
| Supplementary collection DOI cited by article | VERIFIED |
| Item DOI 31314542 membership in collection 8304092 | UNVERIFIED |
| Earlier item-level CC BY 4.0 claim | REVALIDATION_PENDING |
| Exact supplementary file list and version | UNVERIFIED |
| Original source bytes archived in repository | NO |
| Repository SHA-256 pinned | NO |
| Raw machine-readable replicate series established | NO |
| Scientific applicability classification | CLOSED — REFERENCE ONLY |
| Finished-formula engine validation | NOT APPROVED |
| Phase 4B | OPEN |
| Phase 5 | LOCKED |

**Conclusion:** EVD-013's scientific scope is now closed honestly as a reference-only source. Its Figshare item identity, item-level rights and archival remain open because authoritative item metadata and original bytes could not be retrieved. The earlier PubMed-number coincidence is explicitly not treated as proof of an invalid Figshare DOI. No validation claim is made.
