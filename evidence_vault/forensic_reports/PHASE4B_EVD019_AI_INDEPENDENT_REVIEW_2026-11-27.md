# EVD-019 — AI independent scientific review (second-pass audit)

**Review date:** 2026-11-27  
**Reviewer type:** AI-assisted independent second-pass review; not a human reviewer  
**Source:** Malihi, Khaani, Changizi & Adeeb (2011), *Tenside Surfactants Detergents* 48(5), 395–399, DOI 10.3139/113.110145  
**Publisher metadata:** https://www.degruyterbrill.com/journal/key/tsd/48/5/html  
**Author-uploaded full-text page:** https://www.researchgate.net/publication/275987303_Evaluation_of_Physico-Chemical_Interactions_between_Linear_Alkylbenzene_Sulfonate_LAS_and_Alcohol_Ethoxylates  
**Independent bibliographic cross-check:** https://www.scienceopen.com/document?vid=a3d795ed-3a30-448b-bbae-a737e97f3445  
**Rights:** REVIEW_PENDING; Carl Hanser copyright. No commercial reuse license verified. Source PDF is not archived in this repository.  
**Gate:** EVD-019 Tables 1–2 transcription cross-checked by a second AI pass; pure-LAS Gibbs-factor interpretation independently adjudicated; author response not received; human review NOT performed; Phase 4B remains OPEN; Phase 5 remains LOCKED.

## 1. Review scope and evidence actually inspected

This review independently checked the bibliographic identity and publisher metadata, read the accessible author-uploaded full-text extraction, compared the extracted table values with the repository transcription, checked table arithmetic, reviewed the source methods and application conditions, and inspected the current ENG-002 calculator/provenance implementation.

The ResearchGate full-text page exposes the article text and table extraction. Its direct PDF download endpoint was not independently retrievable in this pass. Therefore this report does **not** claim a fresh pixel-by-pixel inspection of the PDF page image. The earlier repository transcription report records that its author performed an image-to-text visual comparison. This second pass independently cross-checks the accessible extracted text and arithmetic; it is not a human second transcription.

Bibliographic identity is consistent across the publisher record and author-uploaded page: title, authors, journal, volume 48, issue 5, pages 395–399, and DOI 10.3139/113.110145.

## 2. Source methods and applicability domain

### 2.1 Surface-chemistry measurements

- LAS was sodium LAS prepared from LAB; reported average LAB molecular weight was 244 g/mol, with the source's stated phenyl-C10 to C14 distribution.
- The nonionic alcohol ethoxylate was a natural-source C12/C14 blend (60% C12 / 40% C14), average molecular weight 487 g/mol, tested at 7 EO and 2 EO.
- LAS/AE-7EO and LAS/AE-2EO mixtures were prepared at different nonionic mole fractions.
- Surface tension was measured at 23.58 °C in distilled/deionized water using a Krüss K10-ST Du Noüy ring tensiometer. Solutions were equilibrated and allowed to age one hour before measurement.
- The methods describe the composition series as mole-fraction variation. The table headings show percent composition but do not explicitly print a mass-percent basis. Do not relabel these values as w/w%.

### 2.2 Calcium-sensitivity test

The calcium-sensitivity solutions were diluted to a 0.15% use level, contained 0.01 M sodium sulfate, were adjusted to pH 9 with dilute NaOH, and were titrated with 0.05 M CaCl2·2H2O until turbidity indicated precipitation. The paper reports that the stated 12% LAS / 3% AE-7EO composition required more than 370 ppm Ca2+ to form insoluble Ca(LAS)2 under those test conditions.

This is a test-specific precipitation/turbidity threshold, not a universal water-hardness tolerance, not a CaCO3-equivalent specification, and not a guaranteed threshold for a complete commercial detergent.

### 2.3 Detergency test chassis

The paper reports Terg-O-Tometer tests at 45 °C, 2 g/L detergent, and 100 or 350 ppm Ca2+ water-hardness conditions. Test soils/fabrics included EMPA-104 polyester/cotton 65/35 with carbon black/olive oil, EMPA-101 cotton with carbon black/olive oil, and EMPA-116 cotton with blood/milk/carbon black.

The stated powder chassis contained 11% total surfactant, 41% STPP, 35% sodium sulfate, 6% soluble silicate, and 6% sodium carbonate. The fixed builder/salt chassis matters: the results cannot be transferred directly to a phosphate-free formula, a different builder system, a liquid detergent, or a different wash temperature without new evidence. The listed percentages total 99%; the missing 1% is not inferred here.

## 3. Table 1 and Table 2 transcription cross-check

The repository transcription contains seven Table 1 rows and five numeric Table 2 rows plus the source's qualitative “insoluble in water” pure-AE-2EO entry. The values in the transcription agree with the accessible author-uploaded full-text table extraction:

- Table 1 LAS/AE-7EO CMC sequence: 750, 71, 21, 17, 15, 10, 16 mg/L.
- Table 2 LAS/AE-2EO CMC sequence: 750, 100, 26, 13, 3.6 mg/L; pure AE-2EO is reported “insoluble in water.”
- Table 1 minimum surface tension values: 35, 32, 32, 32, 32, 30, 29 mN/m.
- Table 2 minimum surface tension values: 35, 27, 27, 27, 27; no numeric value is supplied for pure AE-2EO.
- The Table 1 62.5% LAS / 36.5% AE-7EO row is printed with a 99.0% sum. It is preserved as printed; it must not be silently normalized to 37.5%.

The article's discussion says that a low nonionic addition substantially lowers mixed-system CMC. For AE-7EO, the 87.5/12.5 row changes CMC from 750 to 71 mg/L (about a 10.6-fold reduction). The 75/25 row is 21 mg/L. For AE-2EO, CMC also decreases across the reported mixed rows, but the article says the corresponding calcium-solubility benefit was not observed, attributing this to poor AE-2EO water solubility. Therefore “AE-2EO provides no benefit” is too broad: its mixed CMC values decrease, while the reported calcium-tolerance benefit is absent under the tested conditions.

The article reports Xᴹ₁ = 0.33 for LAS and βᶦ = −5.57 for the 75% LAS / 25% AE-7EO system. These remain **source-reported model outputs**. The paper does not provide the raw surface-tension concentration series or a sufficiently complete calculation ledger for this review to independently refit those values. Do not label them independently reproduced.

## 4. Independent arithmetic checks and methodological concern

### 4.1 Γ-to-area arithmetic

For each of the 11 unique composition cases (12 displayed numeric entries because pure LAS is duplicated across Tables 1 and 2), the molecular area was recalculated using:

A (Å²) = 10^16 / (Γ × N_A)

with N_A = 6.02214076 × 10^23 mol−1. All 11 reported A values agree with the reported Γ values to the displayed integer rounding. This confirms internal Γ-to-A arithmetic consistency; it does not prove that the Γ values themselves were calculated with the correct Gibbs factor.

### 4.2 Gibbs adsorption factor: unresolved source-level inconsistency

The article's methods state:

- n = 1 for dilute nonionic surfactants, or 1:1 ionic surfactants in the presence of an excess common non-surfactant ion;
- n = 2 for 1:1 ionic surfactants in the absence of other solutes.

The surface-tension methods state that these measurements were made in distilled/deionized water, without describing an added excess common ion. Yet the pure-LAS Table 1 and Table 2 row reports slope −15.9, Γ = 2.82 × 10−10 mol/cm², and A = 59 Å². At 23.58 °C, the reported Γ is approximately what the printed Gibbs equation gives with n = 1. Applying n = 2 to the same slope gives approximately half that Γ (about 1.40 × 10−10 mol/cm²) and approximately twice the molecular area (about 118 Å²).

This is a **major methodological clarification required**, not a corrected experimental value. The paper does not explain why n = 1 was used for pure ionic LAS in deionized water, or which effective n was used for mixed ionic/nonionic rows. The table's Γ-to-A arithmetic is internally consistent, but the Γ derivation appears inconsistent with the stated n rule for pure LAS. The authors' calculation convention or a source erratum is needed before Γ and A are used quantitatively in an engine or external benchmark.

The table column dγ/dlog10(C) has no separate unit printed in the header; the methods equation defines γ in dyn/cm, so the slope is dimensionally dyn/cm per log10 concentration interval (numerically equivalent to mN/m per decade). Preserve the source label and document this interpretation.

## 5. Scientific interpretation and limits

1. **AE-7EO:** source-backed, bounded evidence that low additions to this LAS system lower mixed CMC and improve LAS calcium tolerance under the reported conditions. The 12% LAS / 3% AE-7EO detergency result is specific to the paper's test chassis and conditions.
2. **AE-2EO:** mixed CMC values decrease in Table 2, but the authors did not observe the same calcium-solubility benefit and attribute this to poor water solubility. Do not collapse these distinct endpoints into a blanket “no benefit.”
3. **Mixed-micelle interaction:** Xᴹ₁ = 0.33 and βᶦ = −5.57 are reported by the authors. Without raw surface-tension concentration points and an explicit calculation input ledger, independent refitting is not possible.
4. **Detergency:** results are for specified EMPA fabric/soil systems, 45 °C, 2 g/L detergent, 100/350 ppm Ca2+, and a high-STPP fixed chassis. They do not validate phosphate-free detergents, Mumbai tap water performance, arbitrary LAS grades, or all C12–C14 AEO-7 suppliers.
5. **No foam/viscosity claim:** the source does not provide foam-height/time, foam half-life, rheology flow curves, enzyme compatibility, preservation, storage stability, or machine-specific wash-cycle data.
6. **No raw replicate dataset:** sample/replicate counts and uncertainty estimates sufficient for statistical re-analysis are not available from the inspected source text. Figures are not a substitute for raw experimental observations.

## 6. Current Formula Expert code applicability

The current app-facing calculateMixedCMC path in src/utils/calculators.ts is explicitly an **Ideal Mixed Pseudophase (Clint Model)**. It requires exact supported pure-component references and explicit active-matter inputs. The current resolveEng002PureComponent implementation in src/utils/eng002InputProvenance.ts supports the curated SLS/SDS and C12 DDAO references; it does not provide source-backed LAS and C12–C14 AE-7EO component references for this EVD-019 system.

Consequently:

- EVD-019 is a useful literature/mechanistic reference for a future LAS/AE mixed-micelle model and for bounded ingredient evidence notes.
- It does not directly exercise or validate the current app-facing Clint calculator for LAS/AE-7EO.
- It does not validate a Rubingh implementation in the current app-facing calculation path.
- It does not create a matched formulation prediction/observation pair or calibrate any engine.
- The existing ENG-002 association must be read as a related evidence mapping only, not as proof of implementation support or validation.

No code-model change, parameter fit, or CMC optimization change is authorized by this review. Existing CMC diagnostic-only and fail-closed gates must remain in force.

## 6.1 Cross-repository review — all identified detergent/formula repositories

The GitHub account repository inventory was enumerated. CMC-related implementation paths were found in Formula-expert-, detergent-rnd-expert-v2, detergent-rnd-lab and Detergent-r-d-expert-. The following additional relevant repositories were checked:

### Current Formula Expert

The current app-facing CMC path in src/utils/calculators.ts is a provenance-gated ideal Clint calculation. Its exact supported pure-component references do not include the EVD-019 sodium-LAS / C12–C14 AE-7EO pair. EVD-019 is therefore related literature evidence only, not validation of the current engine.

### Legacy React CMC tab — three duplicate repositories

The CMC defaults and calculation block in src/components/RCCalculators.tsx were compared across:
- salimbawa707-droid/detergent-rnd-expert-v2
- salimbawa707-droid/detergent-rnd-lab
- salimbawa707-droid/Detergent-r-d-expert-

The extracted standalone CMC options and Clint calculation blocks are byte-for-byte identical across all three repositories. They hard-code generic CMC values without source conditions, treat an unspecified “Proportion / Ratio” as mole fraction, use a fixed 320 g/mol conversion for mixed ppm, and present unsupported synergy/cleaning claims. See the legacy CMC audit in detergent-rnd-expert-v2.

### Legacy static HTML CMC path in detergent-rnd-expert-v2

The root index.html is the Vite-served UI: server.ts creates Vite middleware with appType “spa”, package.json builds through Vite, and index.html contains the CMC tab and inline JavaScript. The page has no React root element and no module script loading src/main.tsx; the inline static CMC path is the active page implementation.

That static CMC tab:
- accepts formulation percentages and normalizes them directly as mole fractions;
- uses unreferenced, unitless values such as SLES 0.08, LABSA 0.05, AEO-9 0.02 and CAPB 0.04, displaying them as CMC percent;
- calculates an ideal Clint-style harmonic expression with dimensionally invalid inputs;
- derives “surface tension reduction” and “cleaning efficiency” from arbitrary unvalidated equations.

Separate formula analytics and a “CMC ENGINE (Real)” path calculate arithmetic weighted averages of the same unitless CMC fields and display them as CMC percent. These are not physical CMC predictions. A report-only follow-up PR records these defects: https://github.com/salimbawa707-droid/detergent-rnd-expert-v2/pull/3.

### Other account repositories

- salimbawa707-droid/My-formula-: no critical-micelle calculation was found in src/components/CalculatorsView.tsx; the CMC occurrence in src/domain/ingredientsMaster.ts refers to carboxymethyl cellulose thickener, not critical micelle concentration.
- salimbawa707-droid/App-max-: identifies as Mission Forge, not a detergent formulation application; excluded from EVD-019 CMC scope.

**Cross-repository disposition:** EVD-019 does not validate any of these app-facing calculators. The legacy static/React paths have additional dimensional and provenance defects and should be quarantined until corrected; the current Formula Expert path remains fail-closed for unsupported LAS/AE-7 inputs.

## 7. Findings and required actions

| Finding | Severity | Disposition |
|---|---|---|
| F-EVD019-01: Table 1/2 values cross-check against accessible source extraction; source image not independently retrieved in this second pass | MEDIUM | Retain transcription; record this pass as AI text/arithmetic cross-check, not a second human/image audit |
| F-EVD019-02: Pure-LAS Γ appears to use n=1 while methods prescribe n=2 absent excess common ion | HIGH | Keep Γ/A as source-reported; request author clarification or preserve explicit methodological warning; do not silently correct |
| F-EVD019-03: AE-2EO mixed CMC decreases, while calcium-solubility benefit is not observed | MEDIUM | Correct broad “AE-2EO no benefit” wording to endpoint-specific wording |
| F-EVD019-04: Detergency evidence uses a fixed 41% STPP powder chassis | HIGH for transfer to phosphate-free products | Explicitly block direct phosphate-free formula extrapolation |
| F-EVD019-05: Current app CMC path lacks exact LAS/AE-7EO input references and uses ideal Clint | HIGH for engine-validation claims | Keep EVD-019 as related literature evidence only; no ENG-002 validation claim |
| F-EVD019-06: Raw replicate series, uncertainty, and full Rubingh refit inputs unavailable | HIGH | No statistical refit, model calibration, or training-data admission |
| F-EVD019-07: Carl Hanser reuse rights pending; original PDF not archived/hash-pinned | BLOCKING for commercial reuse | Keep license REVIEW_PENDING and download NOT_DOWNLOADED; do not redistribute or ingest protected tables commercially |

## 8. Final AI review decision

**AI second-pass review: CONDITIONAL PASS for source identity, extracted Table 1/2 transcription cross-check, and Γ-to-A arithmetic consistency; REQUIRES CLARIFICATION for Gibbs adsorption n-factor and quantitative Γ/A interpretation.**

This is not independent human approval. It does not clear copyright, source archival, raw-data access, engine validation, Phase 4B closure, or Phase 5. Keep **Phase 4B OPEN** and **Phase 5 LOCKED**.

## References

- Publisher issue/article metadata: https://www.degruyterbrill.com/journal/key/tsd/48/5/html
- Author-uploaded full text and extracted table text: https://www.researchgate.net/publication/275987303_Evaluation_of_Physico-Chemical_Interactions_between_Linear_Alkylbenzene_Sulfonate_LAS_and_Alcohol_Ethoxylates
- Independent bibliographic record: https://www.scienceopen.com/document?vid=a3d795ed-3a30-448b-baae-a737e97f3445
- DOI: https://doi.org/10.3139/113.110145


## 4.3 Independent external adjudication — superseding the author-clarification blocker

A separate thermodynamic literature check and unit-consistent recalculation now resolve the narrow pure-LAS issue without pretending an author response exists.

- Brusseau (2020), *Water Research* 190, 116778, DOI 10.1016/j.watres.2020.116778, states the simplified Gibbs coefficient x=1 for nonionic surfactants or ionic surfactants with excess electrolyte, and x=2 for ionic surfactants without excess electrolyte (including deionized water). Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC7856177/ (Theory, lines 92–96).
- Hua & Rosen (1982), *Journal of Colloid and Interface Science* 87(2), 469–477, DOI 10.1016/0021-9797(82)90344-7, derive the coefficient for ionic/nonionic binary mixtures and report that it is condition-dependent, near 1 in some conditions, increasing toward 1–2 with closer ionic packing, and potentially below 1 in some anionic/nonionic mixtures with large molecular areas. DOI landing/PDF: https://doi.org/10.1016/0021-9797(82)90344-7 and https://www.sciencedirect.com/science/article/pii/0021979782903447/pdf.

For the source's pure-LAS row, T=296.73 K, slope=−15.9 mN·m⁻¹ per log10 decade, R=8.314462618 J·mol⁻¹·K⁻¹, and N_A=6.02214076×10²³ mol⁻¹. Applying Γ=−[1/(nRT ln 10)]·dγ/dlog10(C) gives:

- n=1: Γ=2.7989×10⁻¹⁰ mol·cm⁻² and A=59.33 Å², reproducing the paper's printed Γ=2.82×10⁻¹⁰ and A=59 Å² within rounding.
- n=2: Γ=1.3994×10⁻¹⁰ mol·cm⁻² and A=118.66 Å².

Back-calculation of n_eff from the displayed rounded slope/Γ values across the 11 unique composition cases (12 displayed entries; pure LAS duplicated) yields approximately 0.992–1.003 when each table's stated temperature is used (23.58 °C for Table 1; 23.5 °C for Table 2). This strongly indicates the tabulated Γ values were calculated using n≈1 throughout. The pure nonionic row is consistent with that factor. For mixed LAS/AE rows, n may be composition-dependent; no blanket n=2 correction is justified and no raw concentration series is available to reconstruct the effective coefficient. The pure-LAS row, however, is a 1:1 ionic surfactant measured in distilled/deionized water with no excess common ion described, so the independent literature supports n=2 for its theoretical re-evaluation.

**Final adjudication:** retain the published 59 Å² and Γ as printed observations/transcription; separately record the calculated n=2 theoretical value of approximately 118.7 Å² (Γ≈1.3994×10⁻¹⁰ mol·cm⁻²). Mark the pure-LAS printed Γ/A as method-inconsistent with the paper's stated no-excess-electrolyte rule. Keep mixed Γ/A source-reported and tagged effective-n-not-reconstructed. The author was not contacted successfully and no response is claimed; author clarification is now optional for author-intent provenance, not a blocker to the theoretical pure-LAS interpretation.

This adjudication does not change raw data, does not independently refit the mixed CMC model, does not authorize commercial reuse, does not satisfy independent human review, and does not validate ENG-002 or any formula engine.
