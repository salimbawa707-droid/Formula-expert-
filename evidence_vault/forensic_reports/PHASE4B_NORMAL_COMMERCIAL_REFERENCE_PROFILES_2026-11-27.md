# Phase 4B — Normal commercial-grade public reference profiles (2026-11-27)

## Purpose

Use public technical data sheets and published commercial specifications as a practical baseline when a user's exact supplier TDS is unavailable. This is a separate evidence class from supplier-grade and lot-specific verification.

## Mandatory evidence separation

- `NORMAL_COMMERCIAL_REFERENCE`: a published representative commercial specification, tied to an exact grade label and source.
- `SUPPLIER_GRADE_UNVERIFIED`: the user's actual supplier/product code is not confirmed.
- `LOT_COA_UNVERIFIED`: no lot-specific CoA tied to the user's received batch.
- `FORMULA_APPLICABILITY_NOT_APPROVED`: a reference specification does not establish chemical compatibility, regulatory suitability, or safe/performant use in a specific formula.

No public reference profile in this tranche is a supplier or lot verification. Do not promote these records to `VERIFIED_GRADE_AND_LOT`.

## Implemented dataset

Code: `src/data/normalCommercialIngredientReference.ts`

The dataset is intentionally separate from the existing formula calculation defaults. It records source URL, source name, grade label, evidence class, numeric reference values, basis/conditions where available, and an explicit limitation note. Lookup is by catalog ingredient ID.

| Catalog group | Reference profile | Publicly recorded data | Source |
|---|---|---|---|
| `labsa-96` | LABSA 96 | Active ≥96%; free oil ≤1.5%; sulfuric acid ≤1.5%; color ≤35 Klett at 50 g/L | RAW CHEM TDS, v2.0, 2025-06-02 |
| `labsa-90` | LABSA 90 | Nominal commercial active grade 90%; no impurity limits inferred | CATABSA product page |
| `aos-38` | AOS 38 liquid | Active 37–39%; unsulfonated ≤2%; sodium sulfate ≤1.5%; free alkali ≤0.35%; pH 8.5–11.5 at stated 1% active-matter solution | Ningbo MOS Chemical published grade table |
| `soda-ash-uni*`, `soda-ash-light*` | Light soda ash | Total alkalinity ≥99% as Na2CO3; volatile matter ≤0.8%; sulfate ≤0.03%; chloride ≤0.8%; Fe2O3 ≤0.0029%; insolubles ≤0.03%; bulk density 550–720 kg/m3 | Tata Chemicals Light Soda Ash TDS |
| `sodium-metasilicate-pentahydrate*` | Sodium metasilicate pentahydrate | Na2O 28–30%; SiO2 28–30%; dry matter 56–60%; pH 12–13 (test concentration not stated in retrieved TDS); insolubles ≤0.05% | Ankit Silicate, product P-28 TDS |
| `sodium-sulfate-uni*` | Sodium sulfate anhydrous | Published TOP/1st/2nd grade assay minima 99.6/99.0/98.0%; TOP moisture ≤0.05%, chloride ≤0.05%, insolubles ≤0.005% | STPP Group published specification |\n| `sles-28*` | SLES 28 liquid | Active 28±1%; pH 7–9 at 5% solution; unsulfated matter ≤1.5%; NaCl ≤0.5% | Allied Group SLES 28 TDS |\n| `sles-70*` | SLES 70 paste | Active 68–72%; free oil ≤2.5%; NaCl ≤0.5%; Na2SO4 ≤1.5%; pH 7.5–9 at 5% solution; dioxane ≤50 ppm | Sahar Express published SLES N70 specification |\n| `naoh-flakes-99*` | Caustic soda flakes | NaOH ≥99% on dry basis; Na2CO3 ≤0.4%; NaCl ≤200 ppm; Ni ≤5 ppm | BCI Caustic Soda Flakes TDS |\n| `sodium-chloride-uni*` | Industrial / vacuum salt | Published industrial assay 97–99%; vacuum salt 99.5–99.9%; moisture and insolubles vary by grade | WS Chemicals published grade specifications |\n| `stpp-94*` | STPP 94 | Assay ≥94%; P2O5 ≥57%; insolubles ≤0.10%; pH 9.2–10.0 at 10 g/L | STPP Group published specification |

The source links are embedded in the code dataset. Grade variants are not silently collapsed: the sodium sulfate source publishes multiple grades; the selected grade remains unknown. Metasilicate pentahydrate data is not reused for anhydrous metasilicate. AOS sources also show pH differences between neutral and alkaline grades; the selected grade must be preserved.

| `lae-7` | C12-15 alcohol ethoxylate 7EO | Active 100%; cloud point 50°C (1% aqueous); HLB 12.2; density 0.96 g/mL | Stepan BIO-SOFT N25-7 |
| `lae-9` | Alcohol ethoxylate product benchmark | Cloud point 64°C (10% actives); HLB 12.5; pH 6.2 (1% aqueous) | Dow ECOSURF EH-9 TDS |
| `glda-47` | GLDA-Na4 47% solution | Assay ≥47.4%; density approx. 1.40 g/cm³; pH 11.0–11.8 at 1% w/v; NTA ≤0.10%; theoretical calcium binding 55 mg Ca/g | Nouryon Dissolvine GL-47-S |
| `mgda-40` | MGDA-Na3 liquid | Concentration 39–41%; density 1.29–1.33 g/cm³; pH approx. 11 at 1%; chelation 160 mg CaCO3/g by BASF method | BASF Trilon M Liquid T |
| `sodium-citrate-uni` | Trisodium citrate dihydrate | Assay 99.0–100.5%; water 10–13%; pH 7.5–9 at 5% solution | Pangs TDS; USP/FCC/E331 column-specific limits |
| `edta-4na-39-liquid` | Tetrasodium EDTA liquid benchmark | Approx. 40%; pH approx. 11.5 at 1%; density approx. 1.28 g/cm³ | BASF Home Care range card |
| `protease-liquid` | Liquid laundry protease product example | Product-specific activity 150,000 KIPU-A/g; liquid; intended for liquid laundry | Novonesis Progress Go 100 L product information |
| `amylase-liquid`, `lipase-liquid`, `cellulase-liquid`, `mannanase-liquid` | Enzyme activity reference rule | No universal transferable activity number; require supplier's named assay unit, method, substrate and activity/g or mL | Novonesis liquid detergent formulation whitepaper and enzyme documentation |
| `carbomer-940` | Carbomer 940 NF benchmark | Acid assay 56–68%; viscosity 40,000–60,000 cP at specified 0.5% neutralized test; loss on drying ≤2% | Lubrizol Carbopol 940 NF specification |
| `bit-20` | BIT aqueous-glycolic preservative product | Manufacturer confirms BIT solution for cleaners/detergents; exact assay specification not fully published in retrieved page | LANXESS PREVENTOL BIT 20 N |
| `phenoxyethanol-99` | Phenoxyethanol preservative grade | Purity ≥99% by GC; moisture ≤0.2%; specific gravity 1.105–1.110 at 20°C; pH 5.5–7.0 at 1% | Elchemy supplier TDS |
| `kathon-cg` | CMIT/MIT 1.5% commercial benchmark | Total active 1.5%; published application guidance pH <8.5 and typical use range 0.025–0.1% product; ratio/carrier not inferred | LANXESS home-care portfolio application table |
| `perfume-compound` | Fragrance mixture framework | IFRA Category 10A applies to laundry detergents, hand dishwashing detergents and hard-surface cleaners; no universal composition/active/dose | IFRA-RIFM Guidance for the Use of IFRA Standards |\n| `sodium-gluconate` | Sodium gluconate powder | Assay ≥98%; loss on drying ≤0.5%; pH 6.2–7.8; chloride/sulfate ≤0.02% | Published commercial chelating-grade specification |\n| `sodium-benzoate` | Sodium benzoate preservative grade | Assay ≥99% dry basis; loss on drying ≤1.5%; arsenic ≤3 mg/kg; lead ≤2 mg/kg | Eastman Probenz SG TDS |\n| `potassium-sorbate` | Potassium sorbate E202 | Assay 99–101% acidimetric (dried basis); loss on drying ≤1%; heavy metals ≤0.001% as Pb | KEMICAS ACS/Ph. Eur. TDS |

## Deliberately not inferred

- Supplier/manufacturer of the user's stock.
- Supplier product code, lot/batch, manufacturing date, expiry/retest date.
- Actual assay, active matter, water content or impurities of the user's lot.
- A universal specification shared by all suppliers.
- Formula applicability, regulatory authorization, finished-product efficacy or safety.
- Missing parameters such as pH test concentration, viscosity, density, particle-size distribution or impurity limits when the source does not publish them.

## Next implementation tranches

Continue the same source-first process across the remaining unique MICG candidate groups and their catalog IDs. Profiles are added only where an exact catalog ID and a defensible grade/source mapping exist; unresolved catalog items stay explicitly without a numerical default. Prioritize:
1. Primary surfactants and nonionics (SLES 28/70, SLS, AOS powder, SAS, APGs, betaines, amine oxides, ethoxylates).
2. Builders, chelators and salts (carbonate, citrate, STPP, GLDA/MGDA, EDTA, gluconate, silicates, chloride, bicarbonate).
3. Enzymes (activity units and assay method, not mass percentage alone).
4. Polymers/thickeners (solids, viscosity method/grade, molecular or substitution parameters).
5. Preservatives/biocides, fragrance and proprietary blends (composition, active fraction, carrier, regulatory and intended-use restrictions).

A candidate receives a public reference profile only when an identifiable source publishes the relevant property and grade basis. Otherwise retain `PUBLIC_REFERENCE_NOT_FOUND` / unknown fields rather than fabricate a typical value. Public-source profiles are not evidence of the user's supplier or batch.

## Gate status

- Public commercial reference profiles implemented in this tranche: 27.
- Supplier grade verified by these references: 0.
- Lot CoA verified by these references: 0.
- Formula applicability approvals created by these references: 0.
- Phase 4B remains OPEN; Phase 5 remains LOCKED.


## Incremental mapping update — 2026-11-27 (APG / amine oxide / nonionics / polymers / enzymes)

Added eight additional reference profiles to `src/data/normalCommercialIngredientReference.ts` and expanded enzyme variant coverage.

### New mappings
- **APG 0810:** supplier-published ≥50% active example; chain distribution and test basis remain grade-specific.
- **APG 1214:** BASF Glucopon 600 UP benchmark (50% active; lauryl/myristyl glucoside blend). Not proof of pure lauryl glucoside equivalence.
- **Lauramine oxide:** Stepan AMMONYX LO (30% amine oxide; CAS 1643-20-5); catalog identity matches. Amine oxide is amphoteric, not nonionic.
- **LAE-3:** adjacent low-EO benchmark, BASF Lutensol AO 3 (C13–C15 oxo alcohol + 3EO); not exact C12–15 grade.
- **LAE-12:** adjacent high-EO benchmark, BASF Lutensol A 12 N (C12–C14 + 12EO); not exact C12–15 grade.
- **PVP K30:** BASF Luviskol K30 powder benchmark (K-value 27–33; solids 95–100%; approx. Mw 45,000 ± 5,000 g/mol by BASF GPC method). Cosmetic product reference, not detergent performance proof.
- **PEG 4000:** industry reference framework only; no exact supplier TDS/CoA verified in this tranche.
- **ASE polymer 33:** industry reference framework only; exact Acrysol 33 TDS, neutralization curve and CoA still required. Do not substitute dispersant copolymer data.

### Enzyme mapping expansion
The enzyme family mapping now covers base, technical, high-purity and custom-solution catalog IDs for protease, amylase, lipase, cellulase and mannanase. Named commercial examples are listed without converting product names into universal enzyme activity values:
- Protease: Progress Go 100 L / Progress Uno 100 L.
- Amylase: Amplify Prime 100 L / Stainzyme Plus Evity 48 T.
- Lipase: Lipex Evity 200 L / Lipex Evity 100 T.
- Cellulase: Celluclean 5000 L (cleaning cellulase) and Carezyme Premium 4500 L (care cellulase); these are functionally distinct.
- Mannanase: Mannaway 200 L / Mannaway Evity 4.0 T.

Novonesis' published liquid-detergent examples report formulation inclusion levels (not enzyme activity assays): protease 0.20–0.28%, amylase 0.03%, lipase 0.14–0.16%, mannanase 0.05%, and cellulase 0.06–0.08% w/w in the cited formulations. These are literature examples only, not universal dosing instructions and not transferable between products.

### Verification boundary
All profiles remain `NORMAL_COMMERCIAL_REFERENCE`; `supplierGradeStatus=UNVERIFIED` and `lotCoAStatus=UNVERIFIED`. No supplier/lot verification or formula applicability approval is implied. Catalog active defaults remain untouched. Enzyme potency still requires the exact product assay unit, method, substrate, activity per g/mL and storage stability data. Standard/industry references are not supplier verification.


## Catalog identity coverage and regression controls — 2026-11-27

A catalog-wide pass over `UNIVERSAL_INGREDIENTS` identified **97 records** in the two requested categories (Nonionic Surfactant and Polymer & Thickener). The reference dataset now resolves all 97 IDs to exactly one reference profile. This includes base records and the catalog's technical, high-purity and custom-solution IDs where present. This is a mapping/coverage result, not proof that every suffix corresponds to a real, separately supplied grade.

### Additional identity and evidence decisions
- **NP-6 / NP-9 / NP-10:** grouped under a family identity/regulatory hold. Generic CAS 9016-45-9 does not distinguish average EO number or homolog distribution. No commercial assay or formula recommendation is inferred; jurisdictional review is mandatory.
- **Cocamide DEA / MEA:** class identity only; catalog nominal 85%/90% values are not supplier evidence. Require exact chain distribution, residual free amine and nitrosamine controls.
- **PEG-40 HCO / Polysorbate 20 / 80:** compendial/industry identity frameworks only; catalog HLB values are not treated as supplier-confirmed physical constants.
- **Xanthan 200 mesh:** CAG 200-mesh food-grade specification example; not silently treated as detergent-grade equivalence.
- **CMC:** detergent-grade supplier family ranges are recorded as grade-dependent; do not treat the family envelope as one exact SKU.
- **HPMC 100k:** KIMA K100M supplier specification (80,000–120,000 cP) is an adjacent nominal-grade benchmark; its method and pharmaceutical-grade scope remain explicit.
- **PVNO 40:** identity/application framework only; catalog 40% is not a verified solids assay.
- **PEG-120 Methyl Glucose Dioleate:** Yeser DOE120 supplier-published TDS reference; no universal detergent viscosity or active matter inferred.
- **Anti-fog Acrylates Copolymer:** generic CAS/INCI does not identify a unique anti-fog grade; performance and composition remain on hold.
- **Tallow amine record:** flagged as an identity conflict. Display name says amine oxide while INCI says PEG-2 Tallow Amine; do not treat as a polymer or amine oxide until corrected.
- **Polyquaternium-37 emulsion:** CAS/INCI identity is mapped; catalog 30% emulsion solids and anionic compatibility remain unverified.
- **Pluronic PE 6400:** broad EO/PO CAS is insufficient to confirm the catalog Poloxamer 184 crosswalk; exact manufacturer grade bulletin required.
- **Carbomer 940 variants:** separate framework profile added so the NF benchmark is not automatically copied to technical/pure/solution catalog suffixes.

### Regression test added
Added `scripts/test-nonionic-polymer-commercial-reference-coverage.ts` and wired it as the first test in `npm/bun run test:all`. The test asserts:
1. all 97 nonionic/polymer catalog IDs resolve to one profile;
2. there are no duplicate profile mappings;
3. every profile keeps supplier-grade and lot-CoA status `UNVERIFIED`;
4. every entry has a source URL and applicability boundary;
5. NP entries remain on regulatory hold and tallow/PVNO/Pluronic identity caveats remain explicit.

**Execution status:** the test has been added to the repository and included in `test:all`, but it has not yet been executed in a live CI run. Do not report it as passed until the CI log confirms it.


## Standardized supplier / lot / formulation evidence protocol — 2026-11-27

### Why this is not fabricated evidence

No actual supplier TDS, received-lot CoA, or laboratory formulation trial was present in the repository evidence reviewed for this work. A public manufacturer page or representative TDS cannot be relabelled as the user's supplier document; a generic specification cannot be relabelled as a batch CoA; and literature compatibility cannot be relabelled as validation in a specific formula. The system therefore standardizes the evidence dossier and incoming/bench-test protocol while keeping all three gates explicitly open.

### Implemented

- Added `src/data/commercialEvidenceProtocol.ts`.
- Added `scripts/test-commercial-evidence-protocol.ts` and wired it as the first command in `bun run test:all`.
- A protocol is generated for every nonionic surfactant and polymer/thickener catalog ID (coverage is derived from the canonical catalog, not a manually asserted count).
- Every protocol defaults fail-closed: `supplierTdsState=NOT_PROVIDED`, `lotCoAState=NOT_PROVIDED`, `applicabilityState=NOT_TESTED`, and `dossierState=REFERENCE_ONLY_BLOCKED`.
- Supplier TDS checklist standardizes manufacturer/site, exact trade name/code/grade, document revision, identity/composition, assay basis, methods, conditions, storage and SDS traceability.
- Lot CoA checklist requires a unique lot, manufacture/retest dates, actual lot results (not copied specification limits), method IDs, assay/moisture, relevant impurity checks and authorized release traceability.
- Chemistry-specific incoming checks distinguish alcohol ethoxylates (chain/EO distribution and cloud point), APGs, amides (free amine/nitrosamine controls), amine oxides, PEG/polysorbate materials, and polymer grades (solids, hydration and fully specified rheology conditions; CMC substitution; HPMC substitution; carbomer/ASE neutralization and electrolyte sensitivity).
- Formula applicability requires exact-formula compatibility, controlled process and water conditions, predefined acceptance criteria, controls and at least three independently prepared replicates, stability/rheology checks and a defined cleaning/performance endpoint.
- No universal numeric pass limits are invented. Acceptance limits must be selected before testing for the intended product and method. This prevents false precision and post-hoc pass criteria.

### Release decision

A catalog item remains reference-only and blocked until (1) exact supplier grade is matched to a current TDS, (2) the received lot is matched to its own CoA and incoming checks, and (3) the ingredient is tested and approved in the named formula/version. Even a TDS/CoA pair does not prove formulation applicability. Failed identity, missing method/basis, out-of-spec lot, incompatible matrix, or missing replicates keep the item blocked.

### Regression status

The new evidence-protocol regression test has been added to `test:all`. It must pass on a fresh CI run for the latest commit before being reported as executed. Previous CI success on the earlier commit does not certify this new code.
