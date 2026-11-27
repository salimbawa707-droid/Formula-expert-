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
| `perfume-compound` | Fragrance mixture framework | IFRA Category 10A applies to laundry detergents, hand dishwashing detergents and hard-surface cleaners; no universal composition/active/dose | IFRA-RIFM Guidance for the Use of IFRA Standards |

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

- Public commercial reference profiles implemented in this tranche: 24.
- Supplier grade verified by these references: 0.
- Lot CoA verified by these references: 0.
- Formula applicability approvals created by these references: 0.
- Phase 4B remains OPEN; Phase 5 remains LOCKED.
