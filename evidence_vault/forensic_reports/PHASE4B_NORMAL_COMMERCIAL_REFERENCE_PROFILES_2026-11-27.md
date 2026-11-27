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
| `sodium-sulfate-uni*` | Sodium sulfate anhydrous | Published TOP/1st/2nd grade assay minima 99.6/99.0/98.0%; TOP moisture ≤0.05%, chloride ≤0.05%, insolubles ≤0.005% | STPP Group published specification |

The source links are embedded in the code dataset. Grade variants are not silently collapsed: the sodium sulfate source publishes multiple grades; the selected grade remains unknown. Metasilicate pentahydrate data is not reused for anhydrous metasilicate. AOS sources also show pH differences between neutral and alkaline grades; the selected grade must be preserved.

## Deliberately not inferred

- Supplier/manufacturer of the user's stock.
- Supplier product code, lot/batch, manufacturing date, expiry/retest date.
- Actual assay, active matter, water content or impurities of the user's lot.
- A universal specification shared by all suppliers.
- Formula applicability, regulatory authorization, finished-product efficacy or safety.
- Missing parameters such as pH test concentration, viscosity, density, particle-size distribution or impurity limits when the source does not publish them.

## Next implementation tranches

Continue the same source-first process across the remaining 83 unique MICG candidate groups and their catalog IDs. Prioritize:
1. Primary surfactants and nonionics (SLES 28/70, SLS, AOS powder, SAS, APGs, betaines, amine oxides, ethoxylates).
2. Builders, chelators and salts (carbonate, citrate, STPP, GLDA/MGDA, EDTA, gluconate, silicates, chloride, bicarbonate).
3. Enzymes (activity units and assay method, not mass percentage alone).
4. Polymers/thickeners (solids, viscosity method/grade, molecular or substitution parameters).
5. Preservatives/biocides, fragrance and proprietary blends (composition, active fraction, carrier, regulatory and intended-use restrictions).

A candidate receives a public reference profile only when an identifiable source publishes the relevant property and grade basis. Otherwise retain `PUBLIC_REFERENCE_NOT_FOUND` / unknown fields rather than fabricate a typical value. Public-source profiles are not evidence of the user's supplier or batch.

## Gate status

- Public commercial reference profiles implemented in this tranche: 6.
- Supplier grade verified by these references: 0.
- Lot CoA verified by these references: 0.
- Formula applicability approvals created by these references: 0.
- Phase 4B remains OPEN; Phase 5 remains LOCKED.
