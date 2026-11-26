# EVD-014–022 final source disposition and applicability audit

**Audit date:** 2026-11-27  
**Repository:** `salimbawa707-droid/Formula-expert-`  
**Base:** `main` at merge commit `fad3e4c987d95872beea85b46c322772ac9f6e16`  
**Scope:** final source identity, primary-source re-check, scientific scope, rights status, archival status, and engine-ingestion decision for EVD-014 through EVD-022.  
**Review type:** AI-assisted source review; not independent human approval.  
**Phase decision:** Phase 4B remains OPEN; Phase 5 remains LOCKED.

## 1. Executive decision

All nine EVD records (014–022) are present in the canonical evidence registry and source register. This audit re-opened the publisher/official records and checked the accessible source material against the existing registry and prior reconciliation report.

**The nine records are source-identified and their scientific applicability is bounded; they are not all “finished” for ingestion or archival.** The lawful disposition is:

- **EVD-014:** article-level CC BY 4.0 is stated on the author-uploaded full-text record; J-STAGE publisher page and 8-page publisher PDF are accessible. The article can be used with attribution within the license, but the original PDF is still not committed or SHA-256 pinned in this repository.
- **EVD-015, 016, 019, 020:** source identity/full-text availability is established to the extent described below, but commercial reuse permission is not established. Do not copy protected full-text tables/figures or archive redistributed copies without permission.
- **EVD-017:** official EU legal text is verified. Keep the two NPE restrictions distinct: Entry 46 is the 0.1 wt.% restriction for listed uses including domestic cleaning; Entry 46a is the separate 0.01 wt.% threshold for specified washable textile articles. It is EU law, not Indian law. A repository rights-reuse disposition and pinned official text are still outstanding.
- **EVD-018:** EPO Board of Appeal decision T 2019/23 confirms that the appeal against revocation of EP 3 622 047 was rejected as inadmissible on 12 June 2024 because no grounds of appeal were filed. This is not a complete family-wide legal-status opinion; national family members and claim scope require jurisdiction-specific review.
- **EVD-021:** BASF's published product-range table supports the PE 6400 specification values recorded below. It is a manufacturer portfolio/specification reference, not a measured detergent foam test or formula validation.
- **EVD-022:** Croda's own page classifies Croduret 40 under Skin care and describes PEG-40 hydrogenated castor oil as an emulsifier/solubiliser; the detergent superfatting sentence is ancillary. It is not evidence that the material is a primary laundry/dishwashing surfactant.

**Archival remains 0/9 in the repository.** No missing source hash has been invented. Only EVD-014 has a clearly identified open license in the reviewed batch; the other eight remain rights-pending or not separately rights-cleared. This audit does not grant rights or create a source archive.

## 2. Record-by-record final disposition

### EVD-014 — Asano et al. (2025), dishwashing foam mechanism

**Identity:** Asano, Nomura, Kaneko, Oya and Aramaki, “Study of Foam in Dishwashing Detergents: Effect of Nonionic Surfactant Addition on Foam Formation,” *Journal of Oleo Science* 74(4), 377–384 (2025), DOI 10.5650/jos.ess24197. Publisher page: https://www.jstage.jst.go.jp/article/jos/74/4/74_ess24197/_article/-char/en

**Source inspection:** J-STAGE publisher page and publisher PDF (8 pages) were accessible and inspected. The paper's model is an AES/DDAO dishwashing system. It studies C12MEA(2) and C12AE(20), dynamic surface-tension adsorption rate, DDAO protonation/deprotonation, and micellar mobility. At pH above approximately 6, C12MEA(2) promotes DDAO deprotonation and increases the maximum dynamic-surface-tension decrease rate; C12AE(20) increases micellar mobility but does not show the same pH-dependent foam-formation response. The study itself cautions that only two nonionic structures were compared.

**License:** author-uploaded full-text record identifies CC BY 4.0. Use with attribution and retain license notice. The publisher PDF footer carries Japan Oil Chemists' Society copyright; the license notice must accompany any reuse and should be rechecked at the exact file/version before redistribution.

**Decision:** mechanistic literature reference only. The reported dynamic surface-tension rate is not foam height, foam decay, or half-life. It does not validate ENG-005 or a finished detergent formula. Do not convert it into a foam-life coefficient.

**Repository state:** PDF accessible online; not committed or SHA-256 pinned in this repository. Archive exact publisher bytes and hash in a separate controlled step, retaining attribution/license metadata.

### EVD-015 — Bozetine et al. (2008), APG dishwashing formulation

**Identity:** “Optimization of an Alkylpolyglucoside-Based Dishwashing Detergent Formulation,” *Journal of Surfactants and Detergents* 11(4), 299–305, DOI 10.1007/s11743-008-1089-z. Publisher record: https://aocs.onlinelibrary.wiley.com/doi/10.1007/s11743-008-1089-z

**Source inspection:** publisher bibliographic record and accessible CORE-hosted full-text copy were re-opened. Formulation ingredients include commercial LAS, SLES, C12–C14 APG, a betaine-structure amphoteric, and NaCl for viscosity control. The central-composite design contains 30 runs and four center points. The ISO 4198 plate test used 0.8 mL/L detergent, water at 280 ppm hardness, and approximately 25 °C; plate endpoint includes visible foam depletion. Kinematic viscosity was measured at 25 °C using Ubbelohde viscometers and reported in cSt. The plate-count response model has a weak in-design fit (R² = 0.47); the viscosity response model reports R² = 0.92. Neither fit is external validation. The authors explicitly state that plate-count performance is application-specific and that a general equation across product families is unlikely.

**Rights:** REVIEW_PENDING. Access through CORE or a repository is not a commercial reuse license.

**Decision:** manual dishwashing formulation evidence only. Keep cSt (kinematic viscosity) separate from cP (dynamic viscosity); conversion requires density and matched temperature/method. No foam-decay series and no laundry transfer.

**Repository state:** not archived or hash-pinned. No protected table/figure copied into the commercial app.

### EVD-016 — Blagojević et al. (2016), SLES/AOS dishwashing systems

**Identity:** “Performance and Efficiency of Anionic Dishwashing Liquids with Amphoteric and Nonionic Surfactants,” *Journal of Surfactants and Detergents* 19(2), 363–372, DOI 10.1007/s11743-015-1784-5. Publisher record: https://aocs.onlinelibrary.wiley.com/doi/10.1007/s11743-015-1784-5

**Source inspection:** publisher metadata and author-uploaded ResearchGate full text were reviewed in the earlier source audit. The source reports manual dishwashing SLES/AOS systems with amphoteric/nonionic co-surfactants and a free-flow foam-height test. The reported five plate-count runs per formulation are observations under that study's method; they are not foam half-life observations.

**Rights:** REVIEW_PENDING; AOCS copyright notice is present and no commercial reuse license has been verified.

**Decision:** bounded formulation-specific evidence only. Do not treat foam height as foam decay/half-life; do not transfer results to laundry or use as ENG-005 validation.

**Repository state:** not archived/hash-pinned. Do not redistribute the author-uploaded full text or tables without permission.

### EVD-017 — ECHA / REACH Annex XVII NPE restrictions

**Identity:** ECHA Annex XVII official reference and Commission Regulation (EU) 2016/26. ECHA reference: https://euon.echa.europa.eu/documents/10162/e5842a1e-e9f9-6096-2829-72f71c00eaab ; EUR-Lex: https://eur-lex.europa.eu/eli/reg/2016/26/oj/eng

**Source inspection and correction:** official ECHA material distinguishes:
- **Entry 46:** nonylphenol/NPE may not be placed on the market or used in substances/mixtures at concentrations equal to or above 0.1 wt.% for listed uses, including domestic cleaning and specified industrial/institutional cleaning uses.
- **Entry 46a:** the 2016/26 amendment adds a separate 0.01 wt.% restriction for NPE in specified textile articles expected to be washed during normal life, applicable after 3 February 2021, with stated exceptions.

These are different legal objects and thresholds. Entry 46a must not be described as a detergent-mixture threshold.

**Rights:** registry status remains UNKNOWN pending a recorded source-reuse disposition. Official text is cited, but no exact source file is pinned in the repository.

**Decision:** EU regulatory reference only. It is not Indian law and cannot be used as proof of Indian product compliance. A separate India/BIS/CPCB legal review is required for Indian market claims.

### EVD-018 — Unilever liquid laundry detergent patent family

**Identity:** EP3622047A1 / EP3622047B1 and WO2018206202A1, “Liquid laundry detergent composition.” Google Patents publication page: https://patents.google.com/patent/EP3622047B1/en

**Source inspection and legal-status update:** EPO Board of Appeal decision T 2019/23, dated 12 June 2024, concerns application 18715708.6 / publication 3 622 047. It records that the Opposition Division had revoked the European patent on 23 October 2023; the proprietors' appeal was rejected as inadmissible because no statement of grounds was filed within the deadline. Official decision: https://www.epo.org/boards-of-appeal/decisions/pdf/t232019eu1.pdf

This confirms the procedural status of the European patent, not the status of every national family member. Google Patents' “Revoked” label is not a legal opinion.

**Scientific boundary:** the patent's reported ΔR460 is an incremental effect of adding AEC relative to a corresponding control. It is not isolated proof of a nonionic surfactant effect. Blend ratios and AEC additions are confounded; the source does not validate the app's CMC, foam, viscosity or finished-formula prediction engines.

**Rights:** REVIEW_PENDING for patent/data reuse and jurisdiction-specific legal analysis.

**Repository state:** patent and EPO decision URLs are recorded here; original PDFs are not committed or hash-pinned.

### EVD-019 — Malihi et al. (2011), LAS / alcohol ethoxylate interactions

**Identity:** “Evaluation of Physico-Chemical Interactions between Linear Alkylbenzene Sulfonate (LAS) and Alcohol Ethoxylates,” *Tenside Surfactants Detergents* 48(5), 395–399, DOI 10.3139/113.110145. Author-uploaded record: https://www.researchgate.net/publication/275987303_Evaluation_of_Physico-Chemical_Interactions_between_Linear_Alkylbenzene_Sulfonate_LAS_and_Alcohol_Ethoxylates

**Source inspection:** bibliography and accessible author-uploaded full-text extraction were checked. Tables 1–2 have been transcribed in the existing exact-transcription report; the second AI pass checked 7 Table 1 rows and 5 numeric Table 2 rows plus the qualitative pure-AE-2EO insolubility result. The Γ-to-area arithmetic reproduces the reported integer Å² values within rounding.

**Scientific issue — independently adjudicated, with limits:** the pure-LAS row (distilled/deionized water; no excess common ion described) prints Γ/A values that reproduce n≈1, while independent Gibbs literature supports n=2 for a 1:1 ionic surfactant without excess electrolyte. Recalculation from the printed slope gives Γ≈1.3994×10⁻¹⁰ mol·cm⁻² and A≈118.66 Å² at n=2, versus the source-reported Γ=2.82×10⁻¹⁰ and A=59 Å² (n≈1). Keep the paper's values unchanged as published; record the n=2 result separately as a theoretical re-evaluation, not an observation or author correction. Back-calculated n_eff for the mixed LAS/AE rows is about 1.0, but ionic/nonionic mixture coefficients can be composition-dependent; without raw concentration series do not impose n=2 on mixtures or claim a validated mixed-system refit. External basis: Brusseau (2020), DOI 10.1016/j.watres.2020.116778, https://pmc.ncbi.nlm.nih.gov/articles/PMC7856177/; Hua & Rosen (1982), DOI 10.1016/0021-9797(82)90344-7. No author response was received; the pure-LAS theoretical interpretation no longer depends on one. Independent human review remains pending. The detergent test chassis contains 41 wt.% STPP, so it is not evidence for a phosphate-free formulation.

**Rights:** REVIEW_PENDING; Carl Hanser copyright, no open commercial reuse license verified.

**Decision:** literature reference only. No raw replicate surface-tension dataset, no author clarification, no independent human second review, and no engine-validation pair.

**Repository state:** not archived/hash-pinned. No commercial copying of the protected paper tables/figures.

### EVD-020 — Teerasathittham (2018), mixed-soil detergency thesis

**Identity:** “Detergency of mixed oily and particulate soils by single and mixed surfactant systems,” Chulalongkorn University, DOI 10.14457/CU.the.2018.161. Official NRCT DOI record: https://doi.nrct.go.th/ListDoi/listDetail?Resolve_DOI=10.14457%2FCU.the.2018.161

**Source inspection:** official thesis record identifies author, institution, year and title. The prior numerical inspection recorded 53 Appendix A surface-tension/concentration points and retained a 74.4%/74.5% discrepancy rather than silently reconciling it. The source tests mixed oily/particulate soils on polyester/cotton fabric with palm oil and kaolinite, and studies MES/LAS/SDS with AE7/AE9. The reported 2 wt.% NaCl is salinity, not water hardness.

**Rights:** REVIEW_PENDING / COMMERCIAL REUSE BLOCKED. Chulalongkorn's current repository policy says rights are item-specific and that CUIR collection materials commonly carry CC BY-NC 4.0 or educational-use-only restrictions; the university's public notice also says full-text use is educational and not commercial. The exact item-level rights statement for this thesis was not exposed in the NRCT DOI record inspected here. Therefore do not treat free public download as commercial permission; obtain the thesis-specific rights statement or written authorization.

**Decision:** source-specific thesis evidence only; not a generic washing powder performance benchmark. No engine validation or calibration until rights, methods, units, replicate lineage and matched predictions are audited.

**Repository state:** not archived/hash-pinned.

### EVD-021 — BASF Pluronic PE 6400 product specification

**Identity:** BASF Product Finder PRD 30044133 and BASF European product-range PDF. PDF URL: https://www.basf.com/dam/jcr%3A18d3e3b1-4779-3ac6-b00b-5048651fdcb3/basf/www/kr/documents/ko/product/Product%20range_Europe.pdf

**Source inspection:** BASF product-range table places Pluronic PE 6400 in the “Low-foaming Nonionic Surfactants” section and lists EO-PO-EO block polymer, 40% EO, cloud point approximately 60/A, viscosity approximately 2,900 mPa·s, and liquid form. Values are manufacturer-reported and grade/context-specific.

**Rights:** REVIEW_PENDING; manufacturer-document reuse not separately assessed. Obtain current grade-specific TDS, SDS and lot CoA from BASF/supplier before use.

**Decision:** manufacturer portfolio/specification reference only. “Low-foaming” category placement is not a measured foam-suppression curve, dosage-response, foam half-life or proof for the user's formula. Do not use the approximate cloud-point notation as a universal temperature without BASF method/context.

**Repository state:** PDF not archived/hash-pinned.

### EVD-022 — Croda Croduret 40

**Identity:** Croda Beauty Croduret 40 product page: https://www.crodabeauty.com/en-gb/products/product/198-croduret_1_40

**Source inspection:** Croda identifies INCI PEG-40 Hydrogenated Castor Oil; lists solubiliser/emulsifier functions, solid form at 25°C, and category Skin care. The page mentions superfatting benefits in detergent systems but does not supply laundry/dishwashing wash-performance data.

**Rights:** REVIEW_PENDING for reuse of manufacturer content; the product page is publicly viewable, but no permission for copying proprietary technical dossier content is assumed.

**Decision:** ancillary solubiliser/emulsifier or superfatting candidate only, subject to a supplier dossier and compatibility testing. Do not classify as a Home Care category product or a primary detergent surfactant on this evidence.

**Repository state:** page metadata reviewed; product dossier access is gated; no local source file/hash.

## 3. Consolidated status

| Measure | Final result |
|---|---:|
| EVD-014–022 records present in registry | 9/9 |
| Source-register rows present | 9/9 |
| Source identities rechecked against primary/official metadata | 9/9 |
| Quantitative/specification review status recorded | EVD-014–021; EVD-022 qualitative only |
| Exact source files archived and SHA-256 pinned in repository | 0/9 |
| Clearly identified commercial reuse permission in this batch | 1/9 (EVD-014, CC BY 4.0, attribution required) |
| Rights pending or not separately cleared | 8/9 (EVD-015–022, with EVD-017 official-law reuse disposition still unrecorded) |
| Independent human review for this batch | Not performed |
| Formula-engine validation pairs created by this batch | 0 |

The 9/9 registry and source-register result is an identity/metadata completeness result only. It is not a source archive completion rate, rights-clearance rate, or scientific validation rate.

## 4. Mandatory next actions

1. Archive EVD-014 publisher PDF as exact original bytes, preserve its CC BY 4.0 attribution/license statement, calculate SHA-256, and add it to the source manifest. Do not substitute a screenshot or extracted text for the PDF.
2. Record the applicable official-source reuse policy for EVD-017, pin the exact ECHA/EUR-Lex files, and retain the Entry 46 versus 46a jurisdiction/threshold distinction.
3. Obtain written reuse permission or a rights-cleared copy for EVD-015, EVD-016, EVD-019 and EVD-020 before any source-file redistribution, commercial table/figure reproduction or ingestion.
4. Obtain jurisdiction-specific patent-family status advice for EVD-018; the EPO appeal decision is now pinned by citation, but does not resolve national rights.
5. Obtain current grade-specific BASF TDS/SDS/CoA for EVD-021 and Croda technical dossier / written Home Care suitability confirmation for EVD-022.
6. Obtain retain the EVD-019 independent Gibbs adjudication and obtain author comment only if author-intent provenance is desired; complete the independent human transcription review required by evidence governance.
7. For any future engine use, require source-matched observables, exact material grade, protocol, units, temperature, pH, water matrix, replicates/uncertainty, and prediction-before-observation lineage. None of EVD-014–022 currently creates a finished-formula validation pair.

## 5. Formal gate

**EVD-014–022 source identity and metadata review: COMPLETE WITH EXPLICIT LIMITATIONS.**  
**Source archival: NOT COMPLETE (0/9).**  
**Commercial rights: NOT COMPLETE (1/9 clearly permitted; 8/9 not cleared or pending).**  
**Independent human review: NOT COMPLETE.**  
**Engine validation: NOT ESTABLISHED.**  
**Phase 4B: OPEN. Phase 5: LOCKED.**

Do not describe EVD-014–022 as fully archived, rights-cleared, human-reviewed, or engine-validated. The correct final disposition is that the records are reconciled, their use restrictions and scientific boundaries are explicit, and the remaining blockers are assigned without fabricating source bytes, licenses, author responses, or human approvals.

## 6. Primary-source references rechecked

- EVD-014 J-STAGE publisher article and PDF: https://www.jstage.jst.go.jp/article/jos/74/4/74_ess24197/_article/-char/en
- EVD-015 Wiley publisher article: https://aocs.onlinelibrary.wiley.com/doi/10.1007/s11743-008-1089-z
- EVD-016 Wiley publisher article: https://aocs.onlinelibrary.wiley.com/doi/10.1007/s11743-015-1784-5
- EVD-017 ECHA Annex XVII: https://euon.echa.europa.eu/documents/10162/e5842a1e-e9f9-6096-2829-72f71c00eaab
- EVD-017 Commission Regulation (EU) 2016/26: https://eur-lex.europa.eu/eli/reg/2016/26/oj/eng
- EVD-018 EPO Board of Appeal T 2019/23: https://www.epo.org/boards-of-appeal/decisions/pdf/t232019eu1.pdf
- EVD-019 ResearchGate author-uploaded full-text record: https://www.researchgate.net/publication/275987303_Evaluation_of_Physico-Chemical_Interactions_between_Linear_Alkylbenzene_Sulfonate_LAS_and_Alcohol_Ethoxylates
- EVD-020 official NRCT thesis record: https://doi.nrct.go.th/ListDoi/listDetail?Resolve_DOI=10.14457%2FCU.the.2018.161
- EVD-021 BASF European product-range PDF: https://www.basf.com/dam/jcr%3A18d3e3b1-4779-3ac6-b00b-5048651fdcb3/basf/www/kr/documents/ko/product/Product%20range_Europe.pdf
- EVD-022 Croda Croduret 40 product page: https://www.crodabeauty.com/en-gb/products/product/198-croduret_1_40


### EVD-019 independent Gibbs adjudication addendum (2026-11-27)

The pure-LAS n-factor interpretation is now independently resolved for scientific use: apply n=2 to a theoretical re-evaluation of the pure sodium-LAS/deionized-water row, because no excess common ion is described. The source's printed Γ/A values are retained unchanged and flagged as n≈1-derived. The recalculated n=2 values are Γ≈1.3994×10⁻¹⁰ mol·cm⁻² and A≈118.66 Å². The 10 mixed LAS/AE rows imply n_eff≈0.993–1.003 from rounded printed values; literature shows that effective n in ionic/nonionic mixtures is composition-dependent, so the mixed rows remain source-reported and quantitatively method-qualified. This is a theoretical method adjudication, not an author response, human review, rights clearance, raw-data refit, or engine validation. See the updated EVD-019 AI review and exact transcription reports for the derivation and row-level detail.
