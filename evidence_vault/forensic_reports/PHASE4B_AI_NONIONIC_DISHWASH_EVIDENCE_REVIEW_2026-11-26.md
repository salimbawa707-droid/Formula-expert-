# Phase 4B AI evidence review — nonionic surfactants in hand dishwashing systems

**Review date:** 2026-11-26  
**Route:** AI scientific/source review  
**Human review:** `false`  
**Phase 4B:** OPEN  
**Phase 5:** LOCKED

## Source identity and rights

Asano et al., “Study of Foam in Dishwashing Detergents: Effect of Nonionic Surfactant Addition on Foam Formation,” *Journal of Oleo Science* 74(4), 377–384 (2025), DOI: 10.5650/jos.ess24197.

- Article page: https://www.jstage.jst.go.jp/article/jos/74/4/74_ess24197/_article
- Publisher PDF: https://www.jstage.jst.go.jp/article/jos/74/4/74_ess24197/_pdf/-char/en
- J-STAGE states the article is licensed under **CC BY 4.0**. This is article-level license evidence; the source page reports no supplementary material.
- Vault record: `EVD-014`; linked to `ENG-002` as a limited mixed-CMC/mechanistic source.

## What was actually measured

The study examines polyoxyethylene alkyl ether sulfate (AES) and N,N-dimethyldodecylamine N-oxide (DDAO) with nonionic additives. It reports:

- maximum rate of decrease in dynamic surface tension, `(dγt/dt)max`, used by the authors as an indicator of foam formation;
- CMC;
- DDAO acid dissociation/protonation behavior versus pH;
- micellar molecular mobility by NMR `T2*`.

It does **not** report a replicate-resolved foam-height/time series or foam half-life dataset.

## Model composition and conditions

The paper's model dishwashing composition table reports AES 17 wt.%, DDAO 5 wt.%, ethanol 7 wt.%, SAS 5 wt.%, PEG 2 wt.%, citric acid 0.26 wt.%, nonionic surfactant 7 wt.%, hydrotrope 4 wt.%, and pH 6.75. Water balance is not enumerated in that table; do not invent the missing mass balance.

For Table 2, the model composition was diluted to 0.7 wt.% in soft water with Ca2+ = 0.53 mM and measured at 25°C. Separate controlled aqueous experiments used 9 mM total surfactant and AES:DDAO = 1:1 at 25°C across pH conditions. NMR mobility tests used 3 mM AES/DDAO, 0–3 mM activator, pH 7.5 and 30°C.

## Nonionic findings — scoped, not universalized

### C12MEA(2): polyoxyethylene n-dodecyl monoethanolamide, average 2 EO

- In the AES/DDAO mixture, the paper reports a stronger pH-dependent increase in `(dγt/dt)max` after adding C12MEA(2).
- The inflection in the pH response shifts from approximately pH 7 for AES/DDAO to approximately pH 6 for AES/DDAO/C12MEA(2).
- The authors interpret this in terms of DDAO deprotonation and interfacial adsorption.
- The article identifies C12MEA(2) as polyoxyethylene n-dodecyl monoethanolamide (commercial grade Amizet 2L); it is not interchangeable with generic cocamide MEA. This is evidence for a specific AES/DDAO/C12MEA(2) interaction, not a universal “MEA improves foam” rule.

### C12AE(20): polyoxyethylene n-dodecyl ether (C12 alcohol ethoxylate), average 20 EO

- The article identifies C12AE(20) as polyoxyethylene n-dodecyl ether (commercial grade EMALEX720). The paper reports increased micellar molecular mobility after adding C12AE(20), greater than with C12MEA(2).
- Unlike C12MEA(2), the AES/DDAO/C12AE(20) system did not show the same pH-dependent increase in `(dγt/dt)max` over the tested range.
- The authors discuss this as a different interaction pathway; increased micellar mobility is not equivalent to improved interfacial adsorption or foam stability.

### Other AE grades in the tables

The model-composition table reports `(dγt/dt)max` values for C12AE(5), (7), (10), (15), and (20): 491, 518, 498, 550, and 560 mN m−1 s−1 respectively. These values belong to that model-composition experiment at 25°C and must not be confused with the separate pure-nonionic Table 3 measurements.

Table 3 reports separate nonionic-only values:
- C12MEA(2): 2 at 0.1 mM / 25°C; 201 at 1.0 mM / 42°C.
- C12AE(20): 8 at 0.1 mM / 25°C; 198 at 1.0 mM / 42°C.
- C12AE(35): 34 at 0.1 mM / 25°C; 1240 at 1.0 mM / 42°C.

Do not rank these Table 3 values against Table 2: concentrations, temperatures, and system composition differ.

## Category-wise decision

| Product/system | Decision | Reason |
|---|---|---|
| Manual dishwashing liquid, AES/DDAO model system | CONDITIONAL / mechanism evidence | Exact model-system context and pH-dependent nonionic effects are reported. |
| Manual dishwashing liquid using C12 alcohol ethoxylates | CONDITIONAL | EO grade and micellar interaction matter; this paper is not a universal AE ranking. |
| Laundry liquid/powder using LAS/SAS without DDAO | NOT_ASSESSED by this source | Different surfactant chassis; no direct transfer claim. |
| Automatic dishwasher detergent | NOT_ASSESSED by this source | Not the tested product category or use conditions. |
| Foam half-life / foam decay predictor | NOT_VALIDATION_ELIGIBLE | Dynamic surface-tension rate is not foam-height/time or half-life. |

## Important source limitations

1. The authors state commercial AES, AE and MEA grades have broad EO distributions and use average EO values as representative.
2. Direct three-component comparison focuses on C12MEA(2) and C12AE(20); it is not an exhaustive nonionic screen.
3. The 0.7 wt.% model dilution uses soft water (Ca2+ 0.53 mM), not the hard-water conditions needed for broad detergent claims.
4. No raw time-series, replicate-level values, or supplementary dataset is supplied on the publisher page.
5. The model composition table does not enumerate water balance.
6. Dynamic surface-tension decrease rate is an indicator used by the authors for foam formation; it is not a direct foam volume, foam persistence, drainage, or half-life measurement.

## AI review disposition

- EVD-014 is a source-backed, category-specific mechanistic reference for mixed CMC and nonionic/AES/DDAO interaction.
- It may inform nonionic ingredient evidence notes and a bounded mixed-micelle reference.
- It does not make ENG-002 validated; the engine remains an ideal Clint calculation with no Rubingh interaction fit.
- It does not validate ENG-005; the foam engine remains a measured-series analysis utility, not a formula-to-foam predictor.
- No supplier-lot equivalence, ingredient grade equivalence, laundry category transfer, or laboratory validation is claimed.

**Gate decision:** This source strengthens the evidence base for the manual-dishwashing/nonionic review only. Phase 4B remains OPEN. Phase 5 remains LOCKED.


---

## Additional APG evidence review — Bozetine et al. (2008)

**Source:** Bozetine et al., “Optimization of an Alkylpolyglucoside-Based Dishwashing Detergent Formulation,” *Journal of Surfactants and Detergents* 11(4), 299–305 (2008), DOI 10.1007/s11743-008-1089-z. Full-text repository copy inspected: https://core.ac.uk/download/pdf/12039952.pdf. Publisher record: https://doi.org/10.1007/s11743-008-1089-z.

### Why this source matters for APG

The study used a commercial C12–C14 alkylpolyglucoside grade (Glucopon 600CS UP, reported active matter 50–53%) in a hand-dishwashing formulation with LAS (Maranil Paste A55, 54–56%), SLES (Texapon NSO, 26.5–27.5%), a betaine-structure zwitterionic surfactant (Dehyton K, 29–32%), and NaCl. This is useful family-level evidence for C12–C14 APG in a mixed anionic/zwitterionic dishwashing system. It is not proof that every APG 0810 or APG 1214 supplier grade is identical to Glucopon 600CS UP.

The paper reports a 30-run central-composite design with four center points. Actual commercial-ingredient design ranges were: LAS paste 4–16 wt.%, SLES 4–12 wt.%, APG 0–8 wt.%, Dehyton K 0–4 wt.%, and NaCl 0–1.2 wt.%. The study adjusted pH to 6.5–7.5 and prepared 100 g batches with distilled water to mass. The dishwashing test used 0.8 mL/L detergent in water reported at 280 ppm hardness (basis not specified) and approximately 25°C.

### What the study supports — and what it does not

- It supports a category-specific statement that C12–C14 APG was formulated with LAS/SLES/betaine and that APG/NaCl/betaine interactions affected the reported viscosity response within this experimental design.
- The published viscosity response is **kinematic viscosity in cSt at 25°C**, measured by Ubbelohde viscometers. The current ENG-003 output is **dynamic viscosity in cP** at an assumed shear reference. No density is supplied, so cSt cannot be directly compared with cP. This is a hard quantitative validation blocker.
- The article reports an in-design viscosity response-surface fit with R² = 0.92. This is not external prediction accuracy. The plate-count cleaning response fit has R² = 0.47; the authors explicitly discuss soil/application variability. Do not promote this equation as a general cleaning predictor.
- The article does not provide foam-height/time or half-life series, so it is not direct ENG-005 validation.
- The commercial grade active-matter values are ranges, not supplier-lot CoAs. Use midpoints only for explicitly labelled illustrative arithmetic, never as exact grade facts.

### Example active-matter arithmetic (illustrative only)

Using the midpoints of the paper's stated active-matter ranges, the compromise formula (10% Maranil A55, 9% Texapon NSO, 5% Glucopon 600CS UP, 2% Dehyton K) gives approximately 11.12% combined active matter. The limit formula (13%, 10%, 6%, 3%, respectively) gives approximately 13.86%, consistent with the paper's statement of about 14%. These are estimates from published grade ranges, not exact measured batch assays.

### Rights and ingestion decision

The PDF is accessible through a CORE repository copy, but an explicit open license/commercial reuse grant was not verified. Vault record EVD-015 therefore uses `licenseReviewStatus=REVIEW_PENDING`. Do not copy the 30-row numeric table into the commercial app or redistribute it until rights are confirmed. The article can be cited and used for a bounded scientific review, subject to applicable quotation limits.

**Classification:** APG C12–C14 in manual dishwashing = CONDITIONAL / category-specific literature evidence. Exact APG grade equivalence = NOT_ASSESSED. ENG-003 quantitative validation = BLOCKED by kinematic/dynamic viscosity mismatch and missing density. ENG-005 foam-decay validation = NOT_SUPPORTED. Phase 4B remains OPEN; Phase 5 remains LOCKED.


## Additional alcohol-ethoxylate evidence review — Blagojević et al. (2016)

**Source:** Blagojević et al., “Performance and Efficiency of Anionic Dishwashing Liquids with Amphoteric and Nonionic Surfactants,” *Journal of Surfactants and Detergents* 19(2), 363–372 (2016), DOI 10.1007/s11743-015-1784-5. DOI: https://doi.org/10.1007/s11743-015-1784-5. Author-uploaded full text: https://www.researchgate.net/publication/296026145_Performance_and_Efficiency_of_Anionic_Dishwashing_Liquids_with_Amphoteric_and_Nonionic_Surfactants.

### Tested surfactant systems

Six formulations were tested at 10 wt.% total surfactant concentration. The base was SLES/AOS 80:20. Five mixed systems used 75:15:7:3 ratios for SLES/AOS/secondary surfactant/amine oxide:

- CAB/AO;
- cocamide DEA/AO;
- C12–C15 7EO alcohol ethoxylate/AO;
- C10 7EO alcohol ethoxylate/AO;
- C9–C11 7EO alcohol ethoxylate/AO.

Commercial raw-material active-matter declarations were SLES 70%, AOS 90%, CAB 30%, cocamide DEA 85%, lauramine oxide 30%, and the three alcohol ethoxylates 100%. The paper describes w/w mixture ratios but the active-matter basis should be confirmed before reconstructing exact actives; do not assume the ratios are already active-basis.

### Reported results (source table values)

At 23°C, CMC and surface tension were:

| System | CMC (g/L) | Surface tension (mN/m) |
|---|---:|---:|
| SLES/AOS | 0.321 | 35.3 |
| SLES/AOS/CAB/AO | 0.293 | 29.2 |
| SLES/AOS/DEA/AO | 0.257 | 29.0 |
| SLES/AOS/C12–C15 7EO/AO | 0.108 | 23.2 |
| SLES/AOS/C10 7EO/AO | 0.105 | 23.0 |
| SLES/AOS/C9–C11 7EO/AO | 0.101 | 22.8 |

At 42°C, plate-count cleaning results (normal soil / low-fat soil) were 18/20 for SLES/AOS, 20/23 for CAB/AO, 21/26 for DEA/AO, 22/27 for C12–C15 7EO/AO, 23/28 for C10 7EO/AO, and 25/30 for C9–C11 7EO/AO. Five experiments per formulation were reported for the plate-count test, with mean values.

The foam test used a 0.4% formulation, 5 L free-flow test, and 1 m fall distance at 42°C. The article reports formulation 6 (C9–C11 7EO/AO) had foam height 13% above the binary SLES/AOS base, 8% above the CAB/AO system, and 5% above the DEA/AO system. This is a test-specific foam-height comparison, not a foam half-life measurement. The authors also identify lauramine oxide as a foam stabilizer in the tested mixtures.

### Scientific interpretation and category limits

- The tested C9–C11 7EO/AO system had the lowest CMC and surface tension and the highest plate count among the six tested manual-dishwashing mixtures. This is not a universal ranking of all alcohol ethoxylates; it is specific to the SLES/AOS/AO chassis, the stated concentration, water hardness, and temperature.
- The comparison shows that chain-length distribution and EO number matter. C9–C11 7EO cannot be treated as equivalent to C12–C15 7EO, C12AE(20), or APG C12–C14.
- The study supports a system-specific mixed-micelle/CMC reference for ENG-002. It does not provide a general formula-to-performance model.
- The foam response is foam height after a free-flow test, not time-resolved decay, drainage, or half-life; it is not direct ENG-005 validation.
- The hard-water plate-count conditions were 16 ± 1°dH at 17°C and 42°C. This source should not be transferred to soft-water-only or laundry categories without qualification.

### Rights decision

The ResearchGate page identifies the article as an author-uploaded full text and warns that content may be subject to copyright; the article carries an AOCS 2015 copyright notice. No CC BY or other commercial reuse license was verified. EVD-016 is therefore `REVIEW_PENDING`. Do not copy the numerical tables or digitized foam graph into the commercial app until rights are confirmed.

**Classification:** C9–C11 7EO / C10 7EO / C12–C15 7EO in manual dishwashing = CONDITIONAL, formulation-specific evidence. Universal nonionic bonus = NOT_SUPPORTED. ENG-002 = bounded CMC reference only, not validation. ENG-005 = not eligible for foam half-life validation. Phase 4B remains OPEN; Phase 5 remains LOCKED.


## NPE regulatory screen — EU jurisdiction only

**Official sources:** ECHA REACH Annex XVII Entry 46 (https://echa.europa.eu/documents/10162/e5842a1e-e9f9-6096-2829-72f71c00eaab) and Entry 46a (https://echa.europa.eu/documents/10162/7dcd73a4-e80d-47c5-ba0a-a5f4361bf4b1); Regulation (EU) 2016/26 (https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex:32016R0026).

- **Entry 46:** Nonylphenol and nonylphenol ethoxylates shall not be placed on the market or used as substances or in mixtures at concentrations **equal to or greater than 0.1 wt.%** for domestic cleaning and specified other uses. This is directly relevant to EU household-cleaning detergent formulations.
- **Entry 46a:** From 3 February 2021, NPE shall not be placed on the market in specified textile articles at **0.01 wt.% or above**. This is a textile-article limit, not a second concentration limit for the detergent mixture.
- ECHA lists several NPE group members, including CAS 9016-45-9, 26027-38-3, 68412-54-4, 37205-87-1, and 127087-87-0. The supplier's exact identity and UVCB/CAS mapping must be verified before classifying a commercial grade.

**India boundary:** The reviewed ECHA sources establish EU restrictions only. They do not prove that NPE is prohibited or permitted in Indian detergent products. The separate 2025 Indian contaminated-sites rules are not a detergent formulation ban and are not used as such here. Indian product and wastewater compliance needs a current local legal/BIS/CPCB review.

**Ingredient decision:** NPE-6/NPE-9/NPE-10 should be flagged `RESTRICTED_FOR_EU_DOMESTIC_CLEANING` at or above 0.1 wt.% in the relevant mixture. Do not generalize this restriction to all nonionic surfactants. Do not interpret a concentration below 0.1 wt.% as a safety endorsement or universal permission. For India-only formulations, use `REGULATORY_STATUS_NOT_VERIFIED` until local requirements are checked.

Vault record: EVD-017. This is a regulatory reference, not an experimental dataset and not an engine-validation pair.


## Consolidated nonionic evidence status matrix

| Nonionic class / grade | Evidence in this review | Category scope | Current scientific status | Important limit |
|---|---|---|---|---|
| C12MEA(2) / C12AE(20) | EVD-014 | AES/DDAO aqueous mixed-surfactant system | CONDITIONAL, source-backed mechanistic evidence | Specific grades and pH conditions; not a universal foam or cleaning bonus |
| C12–C14 APG | EVD-015 | Manual hand dishwashing with LAS/SLES/betaine | CONDITIONAL, formulation-level literature evidence | cSt cannot be compared with cP without density; reuse rights pending |
| C9–C11 7EO / C10 7EO / C12–C15 7EO alcohol ethoxylates | EVD-016 | Manual dishwashing with SLES/AOS/amine oxide | CONDITIONAL, mixed-CMC and cleaning evidence | Ratios' active-basis ambiguity; foam height is not half-life; reuse rights pending |
| C12–C14 AE-7 / AE-2 | EVD-019 | Laundry LAS / AE binary systems | AE-7 CONDITIONAL for bounded LAS calcium tolerance; AE-2 mixed CMC decreases but calcium-solubility benefit was not observed | Tables 1–2 AI text/arithmetic cross-check complete; Gibbs n-factor ambiguity, no raw replicates, STPP chassis, rights pending |
| AE7 / AE9 with LAS | EVD-020 | Laundry mixed oily + particulate soil, 65/35 polycotton | CONDITIONAL; 3:1 favors oil/detergency, 1:3 favors particulate removal | 2 wt.% NaCl is not water hardness; 74.4/74.5% discrepancy retained; thesis rights pending |
| NPE-6 / NPE-9 / NPE-10 | EVD-017 | EU domestic-cleaning regulatory screen | RESTRICTED_FOR_EU_DOMESTIC_CLEANING at or above 0.1 wt.% under Entry 46; India status NOT_VERIFIED | Do not generalize EU law to India or to all nonionics |
| PEG-40 Hydrogenated Castor Oil / Croduret 40 | EVD-022 | Croda Home Care product description | CONDITIONAL auxiliary emulsifier/solubiliser; primary laundry cleaning NOT_ASSESSED | No quantitative cleaning/foam data or grade-specific TDS/CoA inspected |
| Polysorbate 20 / Polysorbate 80 | No primary-source grade evidence in this batch | Not yet category-reviewed | NOT_ASSESSED | Solubilizer/emulsifier behavior must be separated from primary detergency and foam behavior |
| Pluronic PE 6400 | EVD-021 | BASF product identity and Pluronic family information | EO–PO–EO, 40% EO, liquid; family-level low-foam context only; PE6400-specific foam performance NOT_ASSESSED | No grade-specific foam half-life, dosage, TDS/CoA, or target-formula test |

### Nonionic review conclusion

“Nonionic surfactant” is not a single performance class. Alkyl polyglucosides, alcohol ethoxylates, fatty-acid alkanolamides, ethoxylated amines, castor-oil ethoxylates, polysorbates, and EO/PO block copolymers have different structures, HLB/cloud-point behavior, micellization, foam response, and category suitability. No universal nonionic bonus or category suitability should be applied. Each exact grade must be mapped to its chemistry, active matter, EO/PO distribution, supplier identity, product category, and evidence quality. The three literature studies in EVD-014 through EVD-016 support only their tested mixtures and conditions; they do not validate the unassessed grades above.


## Laundry-specific alcohol-ethoxylate formulation context — EVD-018

**Source:** Unilever, EP3622047A1 / EP3622047B1, “Liquid laundry detergent composition,” published 18 March 2020 / 16 December 2020. Public patent text: https://patents.google.com/patent/EP3622047B1/en. The European family is listed as revoked/ceased in the inspected patent record; this is not a statement about every jurisdiction.

The experimental liquid laundry base contained 11.6 wt.% total surfactants other than AEC, consisting of LAS, SLES 3EO, and C12–C15 alcohol ethoxylate 7EO. The patent compared four LAS:NI:SLES surfactant-blend ratios: 40:10:50, 38:25:38, 50:0:50, and 45:10:45. The base also contained 2.2% monopropylene glycol, 1.5% triethanolamine, 2.0% citric acid, 0.2% calcium chloride dihydrate, 0.2% sodium chloride, 0.3% Tinopal CBS-X, NaOH to pH 8.4, and water balance. The comparison added 0 or 4 wt.% oleyl alkyl ether carboxylate (AEC, 10 EO).

The wash test used 2.3 g/L detergent, 800 mL, 60 minutes, 200 rpm tergotometer, 26° French hard water, 293 K, eight EMPA 117 blood/milk/ink stain monitors on polycotton, and an added oily-soil strip. The patent reports the **incremental ΔR460 benefit of AEC** (AEC formulation minus control): 4.2 ± 0.5 for 40:10:50; 4.4 ± 0.3 for 38:25:38; 9.5 ± 0.7 for 50:0:50; and 8.3 ± 0.4 for 45:10:45. The confidence limits are based on the eight separate stain monitors.

### Interpretation

- This is laundry-category evidence for the presence and tested blend proportions of C12–C15 7EO in LAS/SLES liquid detergent systems.
- It is **not** a direct measurement of the nonionic surfactant's isolated cleaning contribution. The response is the incremental benefit of AEC, and the LAS/SLES/NI ratios vary simultaneously.
- The source does not report foam half-life, viscosity, CMC, or a direct nonionic-only performance endpoint. It therefore does not validate ENG-003 or ENG-005.
- The active-matter basis of the commercial LAS/SLES/NI materials is not established in the inspected passage; do not calculate active percentages from blend ratios without confirming this.
- Patent data reuse rights remain `REVIEW_PENDING`; do not ingest tables into the commercial app before legal review.

**Classification:** C12–C15 7EO in liquid laundry = CONDITIONAL formulation-context evidence; isolated nonionic efficacy = NOT_ESTABLISHED; engine validation = NONE. This is separate from the manual-dishwashing evidence in EVD-014 through EVD-016.


## Laundry-specific LAS / alcohol-ethoxylate interaction evidence — EVD-019

**Source:** Malihi, Khaani, Changizi and Adeeb, “Evaluation of Physico-Chemical Interactions between Linear Alkylbenzene Sulfonate (LAS) and Alcohol Ethoxylates,” *Tenside Surfactants Detergents* 48(5), 395–399 (2011), DOI 10.3139/113.110145. Publisher record: https://www.degruyterbrill.com/journal/key/tsd/48/5/html. Author-uploaded full text: https://www.researchgate.net/publication/275987303_Evaluation_of_Physico-Chemical_Interactions_between_Linear_Alkylbenzene_Sulfonate_LAS_and_Alcohol_Ethoxylates.

The study compared sodium LAS with a natural-source C12/C14 alcohol ethoxylate blend (60% C12 / 40% C14; average molecular weight 487 g/mol) at 7 EO and 2 EO. The surface-chemistry mixtures were prepared at varying nonionic mole fractions and measured at 23.58°C in distilled/deionized water using a Du Noüy ring tensiometer; solutions were aged one hour before measurement. The article reports that low additions of AE-7 lower mixed-system CMC and improve LAS calcium tolerance by promoting mixed micelles containing a high proportion of nonionic molecules.

Tables 1 and 2 have been transcribed in PHASE4B_EVD019_EXACT_TABLE_TRANSCRIPTION_2026-11-26.md. A second AI pass cross-checked the 7 Table 1 rows and 5 numeric Table 2 rows against the accessible author-uploaded full-text extraction and recalculated all 11 numeric Γ-to-area pairs. The 62.5% LAS / 36.5% AE-7EO row remains exactly as printed (99.0% sum). AE-2EO mixed CMC values decrease in Table 2, but the authors did not observe the same calcium-solubility benefit and attribute this to poor AE-2EO water solubility; “AE-2EO provides no benefit” is therefore too broad.

The article reports Xᴹ₁ = 0.33 for LAS and βᶦ = −5.57 for the 75% LAS / 25% AE-7EO system. These remain source-reported outputs, not independently refitted results; raw surface-tension concentration series and a complete calculation ledger are unavailable for independent refitting.

### Interpretation and data-quality boundary

- This is bounded laundry-category evidence for a specific LAS / C12–C14 AE-7EO or AE-2EO system; it does not establish equivalence across all AEO supplier grades.
- The methods describe mole-fraction variation. Table percent labels must not be silently reinterpreted as w/w%.
- The 12% LAS / 3% AE-7EO result is a test-specific calcium precipitation threshold (>370 ppm Ca²⁺) at the stated 0.15% use level, 0.01 M sodium sulfate and pH 9; it is not a universal water-hardness tolerance.
- Detergency tests used 2 g/L detergent at 45°C and 100/350 ppm Ca²⁺ with a fixed powder chassis containing 41% STPP. This evidence cannot be directly transferred to phosphate-free formulas or different builder systems.
- **Gibbs adsorption concern:** the paper states n=2 for a 1:1 ionic surfactant without excess common ion, but the pure-LAS Γ/A table values appear to use n=1. The discrepancy is documented for author clarification; Γ and A remain source-reported and must not be silently corrected.
- No foam-height/time, foam half-life, viscosity, enzyme compatibility, storage-stability or machine-specific wash result is provided.
- No raw replicate dataset or uncertainty data sufficient for statistical re-analysis is supplied.
- Current app-facing calculateMixedCMC is an ideal Clint calculation and current supported pure references do not include this LAS/AE-7EO pair. EVD-019 is a related literature reference only; it does not validate ENG-002 or create a matched formula prediction/observation pair.
- Copyright is Carl Hanser Verlag 2011; numerical reuse remains REVIEW_PENDING. The source PDF is not archived or hash-pinned.

**Classification:** C12–C14 AE-7 with LAS in laundry = CONDITIONAL, source-backed mechanistic evidence under the stated conditions; AE-2EO mixed CMC reduction is reported but calcium-solubility benefit was not observed; Γ/A interpretation requires author clarification; ENG-002 = related evidence only, not validated. See PHASE4B_EVD019_AI_INDEPENDENT_REVIEW_2026-11-27.md.

## Laundry AE7 / AE9 mixed-soil detergency thesis — EVD-020

**Source:** Thanawan Teerasathittham, *Detergency of Mixed Oily and Particulate Soils by Single and Mixed Surfactant Systems*, M.Sc. thesis, The Petroleum and Petrochemical College, Chulalongkorn University, 2018, DOI 10.14457/CU.the.2018.161. Official repository full text: https://doi.nrct.go.th/ListDoi/Download/572683?Resolve_DOI=10.14457%2FCU.the.2018.161.

### Materials and wash conditions

- Nonionics: AE7 and AE9, each declared 99% purity, sourced from Thai Ethoxylate Co.
- Anionics: technical-grade LAS, MES 99%, SDS 99%.
- Fabric: 65/35 polyester/cotton blend. Mixed soil: 0.5 wt.% kaolinite plus palm oil dyed with Oil Red O.
- Tergotometer wash: 1,000 mL, 20 minutes, 30°C; four soiled fabric pieces plus two unsoiled anti-redeposition pieces; 3-minute first rinse and 2-minute second rinse.
- Single-surfactant concentrations: 0.05–1 wt.%. Selected mixed systems: 0.3 wt.% total surfactant, 2 wt.% NaCl, 30°C.

### Reported numeric findings

Pure-surfactant CMC at 30°C: AE7 89 μM; AE9 92 μM; MES 1,900 μM; LAS 2,500 μM; SDS 8,000 μM. At 0.3 wt.% single-surfactant concentration, detergency was LAS 61.4%, AE7 58.4%, AE9 50.9%, SDS 58.2%, MES 36.4%, and commercial liquid detergent 50.9%. At the same concentration, AE7/AE9 total oil removal was 73.5%/73.9%, while particulate removal was 62.6%/66.8%, respectively; the preferred EO number depends on the soil endpoint.

For mixed AE7:LAS systems at 0.3 wt.% total surfactant, 2 wt.% NaCl, and 30°C, the 3:1 AE7:LAS ratio gave 74.4% detergency in the results text and 87.6% total oil removal. A later passage reports 74.5% detergency; this internal discrepancy is preserved rather than silently normalized. The 1:3 AE7:LAS ratio gave the highest particulate removal, 86.0%. This is an important endpoint trade-off: more AE7 favored the reported oily-soil/detergency result, while more LAS favored particulate removal.

The zeta-potential table reports -34.7 mV for AE7 and -37.6 mV for AE9, compared with -131.2 mV for LAS (summed kaolinite/fabric values). The thesis also reports a commercial liquid detergent comparator (Breeze) containing 7.91 wt.% sodium LAS, 1.85 wt.% alcohol ethoxylate, and 9.25 wt.% SLES (19.01 wt.% total surfactant), based on manufacturer information. The active-matter basis and full ingredient list are not established; this is not a complete recipe. The thesis attributes the weaker electrostatic contribution of the nonionic systems to their different interfacial behavior; it does not imply that nonionics are universally weaker cleaners.

### Scientific interpretation and limits

- This is direct laundry-category evidence for AE7/AE9 with LAS on a defined polyester/cotton mixed-soil test at 30°C.
- The 2 wt.% NaCl is a laboratory salinity condition, not water hardness in ppm CaCO3. Do not transfer it to Mumbai water hardness or builder dosage.
- A single “best” AE7:LAS ratio does not exist across all soils: 3:1 favored oil removal/detergency, while 1:3 favored particulate removal.
- The thesis reports an internal 74.4/74.5% discrepancy. Appendix A Tables A1–A5 contain 53 surface-tension-versus-concentration points; all 53 were visually inspected. The source labels the measurement column “IFT (mN/m),” while the method section specifies a Wilhelmy-plate surface-tension measurement. The source-reported CMC values are AE7 89 μM and AE9 92 μM. A quick two-segment fit against log concentration gives approximately 95.3 μM for AE7 and 91.9 μM for AE9, close to the reported values; this is a derived cross-check, not a blind independent replication. No replicate standard deviations are reported in Appendix A.
- The thesis is not a peer-reviewed journal paper and does not validate a current formula-prediction engine. EVD-020 is a bounded pure-CMC benchmark candidate for ENG-002 only; the ideal mixed-Clint calculation remains unvalidated.
- No commercial reuse license was verified. Numerical tables and figures remain rights-pending for the commercial app.

**Classification:** AE7/AE9 + LAS in laundry = CONDITIONAL, test-specific evidence; blend optimum is soil-endpoint dependent; no universal nonionic bonus; ENG-002 = pure-CMC benchmark candidate only; no ENG-003/ENG-005 validation.


### Appendix A numerical inspection update

The original PDF's Appendix A Tables A1–A5 were visually inspected at source pages 59–62. The tables contain **53 concentration/surface-tension points** across AE7 (9), AE9 (9), MES (12), LAS (9), and SDS (14). The PDF's table heading calls the measured column “IFT (mN/m),” but the method section identifies a Wilhelmy Plate tensiometer for surface-tension measurement; the transcription ledger must preserve both the original label and the method-derived interpretation. The main text reports CMC values at 30°C: AE7 89 μM, AE9 92 μM, MES 1,900 μM, LAS 2,500 μM, SDS 8,000 μM. A quick two-segment linear fit of surface tension against log10 concentration gives AE7 ≈95.3 μM and AE9 ≈91.9 μM, broadly consistent with the source-reported breakpoints. This is a preliminary calculation only: the segment selection is analyst-defined, there are no replicate standard deviations in Appendix A, and the second blind AI pass has not yet been performed. The 53-point table is not copied into the commercial app or repository CSV while reuse rights remain pending.


### Manufacturer specifications for auxiliary nonionics — EVD-021 and EVD-022

- **Pluronic PE 6400 (EVD-021):** BASF identifies product number 30044133 and CAS 9003-11-6. The European product-range PDF explicitly places PE 6400 in the “Low-foaming Nonionic Surfactants” section and lists 40% EO, cloud point approx. 60/A, viscosity approx. 2,900 mPa·s, and liquid form at 23°C. These numeric manufacturer specifications are now recorded as inspected. They are not independent measurements, a foam-suppression curve, foam half-life, or target-formula test. Grade-specific current TDS/SDS/CoA remains outstanding.
- **PEG-40 HCO / Croduret 40 (EVD-022):** the direct Croda Beauty product page identifies PEG-40 Hydrogenated Castor Oil, solubiliser/emulsifier functions, solid form at 25°C, and **Skin care** as its product category. The text mentions wetting-agent use in styling waxes and superfatting benefits in detergent systems, but does not list Home Care as a category or supply laundry/dishwashing performance data. Treat it only as an auxiliary emulsifier/solubiliser candidate pending grade-specific documentation and target-category tests.
- **Polysorbate 20/80:** detergent-specific primary-source performance evidence remains NOT_ASSESSED in this review. Do not transfer pharmaceutical solubiliser claims to laundry or dishwashing performance.

Both manufacturer references are non-experimental and validate no existing engine. Rights review remains pending for both. See `PHASE4B_EVD014_022_SOURCE_RECONCILIATION_2026-11-26.md` for the source-by-source provenance, archival status, and coverage calculation.
