# Post-merge source verification — EVD-013 and EVD-014

**Audit date:** 2026-11-27  
**Repository:** `salimbawa707-droid/Formula-expert-`  
**Audited base:** `a02430504c0b98cb64d105716ef2824d153a319b`  
**Review type:** AI-assisted documentary verification; not independent human review.

## 1. Purpose and limits

This addendum records a post-merge check of two source records whose archival or identity status remained open. It does not claim that source bytes were archived, that SHA-256 values were computed, or that any source was admitted to model training or commercial ingestion.

## 2. EVD-013 — Izawa, James & Yethiraj (2026)

### Verified primary-source facts

The publisher article identifies the supplementary material by **collection DOI** `10.6084/m9.figshare.c.8304092`. The article itself is *The decay of saline surfactant foams: a study at macroscopic and bubble scales*, Royal Society Open Science 13, 251765, DOI `10.1098/rsos.251765`.

Primary-source URLs:
- Article PDF: https://softmaterials.ca/wp-content/pdf/Izawa%20et%20al%202026.pdf
- Publisher article DOI: https://doi.org/10.1098/rsos.251765
- Supplementary collection DOI: https://doi.org/10.6084/m9.figshare.c.8304092

The paper describes 0.0047 ± 0.0002 mol/L Triton X-100 (0.3 wt.%) in five-salt synthetic brines, with total salinities from 0 to 107.133 g/kg. The paper reports four trials per salinity for macroscopic measurements, long-time logarithmic foam-height reduction, and bubble-scale observations. This is an oilfield/brine physical-chemistry study, not a household-water hardness or finished laundry/dishwashing detergent benchmark.

### Item DOI disposition

The earlier register associated item DOI `10.6084/m9.figshare.31314542` with this dataset. The publisher article directly confirms the **collection DOI**, but the evidence inspected for this addendum does not independently establish that item ID 31314542 is a member of that collection, nor does it expose authoritative item-level file metadata or license details.

Therefore:
- Keep the collection DOI as the verified supplementary-source locator.
- Treat item DOI `10.6084/m9.figshare.31314542` as **UNVERIFIED_PENDING_ITEM_METADATA** until its official Figshare API record and collection membership are inspected.
- Do not assert that the item is CC BY 4.0, that it contains one 8.11 MB PDF, or that it is archived based only on the earlier secondary record.
- No original supplementary file bytes or SHA-256 were obtained in this verification pass.

## 3. EVD-014 — Asano et al. (2025)

### Verified primary-source facts

J-STAGE lists the article as *Study of Foam in Dishwashing Detergents: Effect of Nonionic Surfactant Addition on Foam Formation*, Journal of Oleo Science 74(4), 377–384 (2025), DOI `10.5650/jos.ess24197`, released 1 April 2025. The J-STAGE page labels the journal article open access and exposes the publisher PDF endpoint.

Primary-source URLs:
- Publisher article: https://www.jstage.jst.go.jp/article/jos/74/4/74_ess24197/_article/-char/en
- Publisher PDF: https://www.jstage.jst.go.jp/article/jos/74/4/74_ess24197/_pdf/-char/en

The publisher PDF bears the Japan Oil Chemists' Society copyright notice. The separate prior claim of an author-uploaded CC BY 4.0 license was not independently verified against an exact version-specific license statement in this pass. Consequently, this addendum does **not** clear redistribution or commercial reuse of the PDF.

The paper's measured indicator is maximum dynamic-surface-tension decrease rate, used to discuss foam formation in AES/DDAO aqueous systems with C12MEA(2) or C12AE(20). It is not a measured foam-height decay curve, foam half-life, or validation of a laundry detergent formula or the app's foam-kinetics predictor.

### Archive disposition

The publisher PDF URL was verified, but the binary download did not complete in this execution environment. No PDF was committed, no source bytes were archived, and no SHA-256 was computed. Status remains **SOURCE_LOCATED_NOT_ARCHIVED**.

## 4. Post-merge CI context

The merge commit has two parents: the then-current main parent `fcb05aa561feb7000fd448ca285de8d73c9a1ae3` and PR head `82931f107a49824cf87ea969d35fd9790a560aac`. The merge commit's tree is `6865b4bdc46464bc01ac4a2bd9656e5523e54c1f`.

The post-merge Release Quality Gates workflow completed successfully for main, but its Android job was skipped by workflow conditions. The earlier successful PR Android instrumentation run was built from the same PR-head tree, which is the second parent of the merge commit. This is source-tree-equivalence evidence, not a fresh post-merge Android execution.

## 5. Gate decision

| Item | Result |
|---|---|
| EVD-013 collection DOI confirmed from publisher article | YES |
| EVD-013 item DOI 31314542 and collection membership | NOT VERIFIED |
| EVD-013 item-level license and file metadata | NOT VERIFIED |
| EVD-013 source bytes archived and SHA-256 pinned | NO |
| EVD-014 J-STAGE article and PDF URL identified | YES |
| EVD-014 exact version-specific reuse license cleared | NO |
| EVD-014 publisher PDF archived and SHA-256 pinned | NO |
| Fresh Android instrumentation on merge commit | NO — workflow job skipped |
| Phase 4B | OPEN |
| Phase 5 | LOCKED |

**Conclusion:** This pass narrows the source identity and rights questions without overstating completion. EVD-013's collection DOI is verified; its item-level identifier remains unresolved. EVD-014's publisher PDF is located but not archived and its exact reuse permission remains unconfirmed. Neither record is promoted to engine-validation evidence.
