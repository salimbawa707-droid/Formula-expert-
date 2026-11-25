import type { ProductCategoryId } from '../domain/productTaxonomy';
import type { ApplicabilityReviewDecision } from './ingredientApplicabilityReviewMatrix';

export interface IngredientEvidenceReview {
  ingredientId: string;
  productCategoryId: ProductCategoryId;
  decision: ApplicabilityReviewDecision;
  chemicalRole: string;
  compatibilityMechanism: string;
  concentrationFinding: string;
  pHFinding: string;
  incompatibilityRisks: string[];
  evidence: { title: string; url: string; evidenceType: 'SUPPLIER_TDS' | 'TECHNICAL_GUIDANCE' | 'FORMULATION_EXAMPLE' }[];
  limitations: string[];
}


/**
 * First evidence-reviewed batch: liquid laundry surfactant raw materials.
 * Scope is limited to catalog grades with identifiable LAS/SLES chemistry.
 * Literature formulation examples are not universal safe-use limits.
 */

const laundryLiquidSurfactantReviews: IngredientEvidenceReview[] = [
  {
    ingredientId: 'labsa-96',
    productCategoryId: 'LAUNDRY_LIQUID',
    decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Strong-acid anionic sulfonic acid precursor; after controlled neutralization, provides linear alkylbenzene sulfonate (LAS) primary detergency.',
    compatibilityMechanism: 'Neutralized LAS provides anionic detergency, wetting and soil emulsification in aqueous laundry liquids. The free acid itself is not the finished-product surfactant state; neutralization demand and final pH must be calculated from the lot assay and acid value.',
    concentrationFinding: 'Catalog activeDefault 96% is a commercial-grade default, not a verified lot assay. A published supplier formulation example lists 3–6.2% LABSA 96% in a liquid laundry detergent, but this is an example formula, not a validated minimum/maximum or universal recommendation. No approved use limit assigned.',
    pHFinding: 'The catalog target pH for LAUNDRY_LIQUID is 7.5–9.5. This is a finished-product target, not a raw LABSA stability range. Free LABSA must be neutralized; finished pH and residual free acidity must be verified.',
    incompatibilityRisks: ['Unneutralized acid can create corrosive/irritant product and destabilize the blend.', 'Rapid caustic addition is exothermic and can cause local overheating/viscosity spikes.', 'Anionic LAS is incompatible with cationic fabric-softener systems.', 'Electrolyte and nonionic balance can affect phase stability and viscosity.'],
    evidence: [
      { title: 'Hydum LABSA 96.5 technical data sheet', url: 'https://hydum.ru/wp-content/uploads/2022/12/labsa-97-tds-hydum-1.0.pdf', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Elchemy LABSA 96 liquid laundry formulation example', url: 'https://elchemy.com/product/labsa-96-433', evidenceType: 'FORMULATION_EXAMPLE' },
      { title: 'Nuroil LABSA/SLES handling and procurement guidance', url: 'https://www.nuroil.com/expert-knowledge/how-sles-and-labsa-work-in-detergents', evidenceType: 'TECHNICAL_GUIDANCE' }
    ],
    limitations: ['Supplier TDS and CoA for the actual lot are required.', 'Neutralization calculation must use actual acid value/assay; no fixed NaOH dose is approved.', 'Finished-formula stability, detergency, fabric compatibility and preservation remain untested.']
  },
  {
    ingredientId: 'labsa-90',
    productCategoryId: 'LAUNDRY_LIQUID',
    decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Strong-acid anionic sulfonic acid precursor; neutralization yields LAS anionic surfactant.',
    compatibilityMechanism: 'Same LAS mechanism as higher-active LABSA grade, but delivered active matter and neutralization demand differ. Formulation must normalize on actual assay rather than assume equivalence by weight.',
    concentrationFinding: 'Catalog activeDefault 90% is a nominal commercial-grade value, not a lot CoA. No supplier-grade-specific maximum/minimum use level verified for this exact catalog grade; do not copy the LABSA 96 example directly without active-matter and acid-value correction.',
    pHFinding: 'Finished category target is 7.5–9.5; this is not a raw-material pH limit. Neutralize based on actual acidity and verify finished pH.',
    incompatibilityRisks: ['Residual free acid/corrosive risk if neutralization is incomplete.', 'Exothermic neutralization and local high-pH zones if caustic is dosed too quickly.', 'Anionic/cationic incompatibility.', 'Electrolyte-induced phase and viscosity changes.'],
    evidence: [
      { title: 'Hydum LABSA 96.5 technical data sheet', url: 'https://hydum.ru/wp-content/uploads/2022/12/labsa-97-tds-hydum-1.0.pdf', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Nuroil LABSA/SLES handling and procurement guidance', url: 'https://www.nuroil.com/expert-knowledge/how-sles-and-labsa-work-in-detergents', evidenceType: 'TECHNICAL_GUIDANCE' }
    ],
    limitations: ['No exact 90% grade TDS/CoA attached to this catalog record.', 'Assay, acid value, free sulfuric acid and moisture must be verified per lot.', 'No numeric permitted-use range approved.']
  },
  {
    ingredientId: 'sles-70',
    productCategoryId: 'LAUNDRY_LIQUID',
    decision: 'APPLICABLE',
    chemicalRole: 'High-foaming anionic ether sulfate surfactant; primary/co-primary cleanser, wetting and foam contributor.',
    compatibilityMechanism: 'Supplier TDS identifies SLES as an anionic surfactant with cleaning, emulsifying, wetting and foaming performance and lists laundry detergent use. It can be blended with LAS and nonionic surfactants; exact viscosity/phase behavior depends on electrolyte, EO grade and formulation.',
    concentrationFinding: 'Catalog 70% is nominal active matter. A published liquid-laundry formulation example lists 9–10% SLES product addition; this is a single example, not a universal limit. Convert actual addition to active matter and qualify supplier grade. No approved concentration range assigned.',
    pHFinding: 'Supplier TDS specifies pH 6.5–10.0 for a 4% solution of one SLES 70 grade. This is a raw-material solution specification, not proof of unlimited finished-formula stability. Category target 7.5–9.5 overlaps this screening window.',
    incompatibilityRisks: ['Excessive foam may be unsuitable for front-load/low-foam targets unless blend and dose are controlled.', 'Cationic surfactants can form insoluble ion pairs/complexes.', 'Salt response can be non-linear; excess electrolyte can reduce viscosity or cause separation.', 'Supplier EO distribution, sulfate, unsulfated matter and 1,4-dioxane specifications vary by grade.'],
    evidence: [
      { title: 'Ittehad Chemicals SLES technical data sheet (2026)', url: 'https://ittehadchemicals.com/wp-content/uploads/2026/03/TDS-SLES.pdf', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Elchemy LABSA 96 liquid laundry formulation example', url: 'https://elchemy.com/product/labsa-96-433', evidenceType: 'FORMULATION_EXAMPLE' },
      { title: 'Nuroil LABSA/SLES handling and procurement guidance', url: 'https://www.nuroil.com/expert-knowledge/how-sles-and-labsa-work-in-detergents', evidenceType: 'TECHNICAL_GUIDANCE' }
    ],
    limitations: ['The cited SLES TDS is one supplier grade; obtain the user-selected supplier CoA/TDS.', 'The cited dosage is an example, not an approved formulation limit.', 'Finished product foam profile, viscosity curve, enzyme compatibility, preservation and stability require testing.']
  },
  {
    ingredientId: 'sles-28',
    productCategoryId: 'LAUNDRY_LIQUID',
    decision: 'APPLICABLE',
    chemicalRole: 'Dilute aqueous anionic ether sulfate surfactant; cleanser, wetting and foam contributor.',
    compatibilityMechanism: 'Same SLES surfactant chemistry as the 70% grade; the lower supplied active concentration changes water contribution, dosing mass and electrolyte balance, not the fundamental anionic role.',
    concentrationFinding: 'Catalog 28% is a nominal active-matter default. Supplier TDS lists a 27–29% SLES liquid grade. Formulate on measured active matter, not raw-material mass; no independent universal use-level limit is established.',
    pHFinding: 'The cited supplier TDS gives pH 6.5–10.0 for its 2% solution for a 70% grade and lists a 27–29% liquid grade separately; it does not establish a pH stability envelope for this exact catalog 28% grade. Category finished target 7.5–9.5 is a screening match only.',
    incompatibilityRisks: ['Excess foam may conflict with controlled-foam machine laundry.', 'Cationic incompatibility.', 'Electrolyte/viscosity response is formulation-specific.', 'Preservative and microbial control must account for aqueous commercial grade.'],
    evidence: [
      { title: 'Ittehad Chemicals SLES technical data sheet (2026)', url: 'https://ittehadchemicals.com/wp-content/uploads/2026/03/TDS-SLES.pdf', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Nuroil LABSA/SLES handling and procurement guidance', url: 'https://www.nuroil.com/expert-knowledge/how-sles-and-labsa-work-in-detergents', evidenceType: 'TECHNICAL_GUIDANCE' }
    ],
    limitations: ['Exact supplier TDS/CoA for catalog SLES 28% is required.', 'No universal maximum use level assigned.', 'Finished product performance and stability require testing.']
  }
];

export const LAUNDRY_LIQUID_SURFACTANT_EVIDENCE_REVIEWS = laundryLiquidSurfactantReviews;

export const AOS_LAUNDRY_EVIDENCE_REVIEWS: IngredientEvidenceReview[] = [
  {
    ingredientId: 'aos-38',
    productCategoryId: 'LAUNDRY_LIQUID',
    decision: 'APPLICABLE',
    chemicalRole: 'Aqueous sodium C14-16 alpha-olefin sulfonate anionic surfactant; primary or co-primary cleanser, wetting, emulsifying and foam contributor.',
    compatibilityMechanism: 'AOS sulfonate headgroup provides anionic detergency; supplier TDS describes laundry detergent use, water solubility, foam and emulsification. AOS is chemically distinct from sulfate ester surfactants and has reported hard-water tolerance, but blend compatibility and machine foam must be tested.',
    concentrationFinding: 'Catalog activeDefault 38% is consistent with supplier TDS active matter 37–39% for a named AOS 38 grade. This verifies a plausible grade specification, not the actual catalog supplier lot. No approved finished-product use range assigned; category active matter target 16% is a product screening target, not a raw-material dose.',
    pHFinding: 'Supplier specifications vary: one AOS 38 TDS reports pH 7–9 in 5% aqueous solution; another reports pH 8.5–11.5 under a different solution basis. Do not merge these into one universal raw-material pH limit. LAUNDRY_LIQUID target pH 7.5–9.5 is a finished-product screening range only.',
    incompatibilityRisks: ['Anionic AOS is incompatible with cationic fabric-softener actives through ion-pairing/precipitation risk.', 'High foam may be unsuitable for front-load or controlled-foam products without blend/dose qualification.', 'Electrolytes, hydrotropes and co-surfactants can shift viscosity and phase stability.', 'Supplier active matter, free alkali, sulfate, chloride and unsulfated matter vary by grade.'],
    evidence: [
      { title: 'Raw Chem AOS 38 technical data sheet (2025)', url: 'https://rprorwxholqklp5p.leadongcdn.com/TDS-22034-AOS38-RC-aidlpBpqKoqloSRnlomrmnrip.pdf?dp=GvUApKfKKUAU', evidenceType: 'SUPPLIER_TDS' },
      { title: 'ORID AOS 38 product specification', url: 'https://www.sodiumdodecylsulfate.com/pdf/Sodium%20C14-16%20olefin%20sulfonate%2038%28AOS38%29.pdf', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Indian AOS 38 commercial listing', url: 'https://ases.in/products/alpha-olefin-sulphonate-a-o-s-liquid', evidenceType: 'TECHNICAL_GUIDANCE' }
    ],
    limitations: ['Obtain the actual supplier TDS and lot CoA before setting raw-material assay or pH bounds.', 'No universal concentration maximum/minimum is established by the cited TDS.', 'Finished foam profile, detergency, viscosity, storage stability and fabric compatibility require testing.']
  },
  {
    ingredientId: 'aos-92',
    productCategoryId: 'LAUNDRY_POWDER',
    decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Concentrated solid sodium C14-16 olefin sulfonate anionic surfactant for dry detergent blends.',
    compatibilityMechanism: 'Powder AOS can supply anionic detergency and foam after dissolution in wash water. Powder suitability depends on particle form, active assay, moisture, carrier/salt content, dust behavior and dry-blend uniformity; liquid AOS 38 data cannot validate the 92% powder grade.',
    concentrationFinding: 'Catalog activeDefault 92% is not verified by a grade-specific CoA/TDS. A separate supplier document describes AOS powder at 90–94% active, but this is not confirmation of this catalog supplier or exact grade. No permitted use range assigned; the laundry-powder active matter target is not a raw-material dosage limit.',
    pHFinding: 'No verified pH specification for the exact catalog AOS 92 grade is available. AOS 38 solution pH data must not be transferred to the powder grade. Finished laundry-powder slurry pH target 9.5–11.5 is only screening context and does not establish dry raw-material stability.',
    incompatibilityRisks: ['Moisture and hygroscopic salt/carrier content can promote caking and poor flow.', 'Anionic AOS is incompatible with cationic softener actives in a combined aqueous phase.', 'High foam can conflict with low-foam machine requirements.', 'Dust exposure and local supplier SDS handling controls must be assessed.'],
    evidence: [
      { title: 'MOS Chemical AOS grades specification (AOS 92 active 90–94%)', url: 'https://www.mos-surfactant.com/products/categories/sodium-alpha-olefin-sulfonate-aos.html', evidenceType: 'SUPPLIER_TDS' },
      { title: 'Ultramarine AOS powder specification (95% grade; adjacent grade only)', url: 'https://5.imimg.com/data5/SELLER/Doc/2024/2/388913319/NZ/TT/NG/151282752/alpha-olefin-sulfonate-aos.pdf', evidenceType: 'SUPPLIER_TDS' }
    ],
    limitations: ['Exact supplier TDS/CoA for the catalog 92% grade is mandatory; 95% and 90–94% adjacent grades are not interchangeable evidence.', 'Confirm moisture, bulk density, particle size, free alkali, sulfate and chloride.', 'Dry-blend flow, caking, dissolution, foam and wash performance require pilot-batch testing.']
  }
];



export const ANIONIC_SURFACTANT_EVIDENCE_REVIEWS: IngredientEvidenceReview[] = [
  {
    ingredientId: 'sas-60', productCategoryId: 'LAUNDRY_LIQUID', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Aqueous secondary alkane sulfonate sodium salt; anionic detergent surfactant providing wetting and grease removal.',
    compatibilityMechanism: 'SAS 60 is a secondary alkane sulfonate blend in water. Its anionic headgroup supports detergency and wetting; supplier describes detergent-industry use. Catalog CAS 68037-49-0 conflicts with the cited WeylClean SAS 60 TDS CAS 97489-15-1, so chemical identity must be reconciled before unqualified approval.',
    concentrationFinding: 'Catalog activeDefault 60% matches the TDS approximate 60% active content, but does not verify the catalog supplier/lot. TDS reports sodium sulfate max 4.2% and paraffin max 0.7%. No finished-product use range is established.',
    pHFinding: 'WeylClean TDS reports pH 7.0–8.0 for a 5% as-supplied aqueous solution at 20°C. This is a raw-material test condition, not finished formula pH stability. Laundry-liquid finished target 7.5–9.5 is only screening context.',
    incompatibilityRisks: ['CAS/identity mismatch in the catalog must be resolved.', 'Anionic SAS can form insoluble complexes with cationic softener actives.', 'High surfactant/foam load may be unsuitable for low-foam front-load products without performance testing.', 'Electrolyte and residual paraffin/sulfate can affect clarity, viscosity and phase stability.'],
    evidence: [{title:'WeylClean SAS 60 supplier product data sheet',url:'https://www.kkchemindia.com/wp-content/uploads/AZELIS-WeylClean-SAS-60_TDS86-002.pdf',evidenceType:'SUPPLIER_TDS'}],
    limitations: ['Confirm catalog CAS and actual manufacturer grade against supplier CoA/TDS.', 'No permitted dose range inferred from the active assay.', 'Test detergency, foam, viscosity, clarity and storage stability in the intended formula.']
  },
  {
    ingredientId: 'sls-needles', productCategoryId: 'LAUNDRY_POWDER', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Solid sodium lauryl sulfate fatty alcohol sulfate anionic surfactant; rapid wetting and high-foam detergency contributor.',
    compatibilityMechanism: 'Needle form is a dry solid grade intended to dissolve/disperse in wash water. It can contribute anionic detergency in powder blends, but particle size, moisture, dusting, dissolution rate and carrier/salt content affect manufacturability and wash performance.',
    concentrationFinding: 'Catalog activeDefault 95% is close to supplier needle specifications with minimum active matter 94%; do not treat 95% as guaranteed assay. Example supplier limits include sodium sulfate max 1.5%, sodium chloride max 0.5%, unsulfated matter max 2.0%, moisture max 3.0%. No universal finished-product dosage is assigned.',
    pHFinding: 'Supplier needle TDS reports pH 8.5–10.5 in 1% aqueous solution; another grade specification gives pH 7.5–10.5 at 1%. This variability is grade/test dependent. Laundry-powder slurry target 9.5–11.5 is finished-product screening context only.',
    incompatibilityRisks: ['High/flash foam can conflict with front-load low-foam detergents.', 'Anionic SLS is incompatible with cationic fabric-softener actives in the same aqueous phase.', 'Powder moisture and electrolyte levels can affect caking and dissolution.', 'Fine dust/needle handling requires supplier SDS controls.'],
    evidence: [
      {title:'Novochem SLS Needles technical datasheet',url:'https://slsneedles.com/pdf/novochem_sls_needles.pdf',evidenceType:'SUPPLIER_TDS'},
      {title:'Sulfolon LMN 92C SLS Needle specification',url:'https://alphachem.com.au/wp-content/uploads/2023/04/TDS-Sodium-Lauryl-Sulphate-needles.pdf',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['Obtain the actual supplier CoA/TDS for the catalog 95% grade.', 'Verify assay, moisture, sulfate, chloride, unsulfated matter and particle-size distribution.', 'Run dry-blend flow/caking, dissolution, foam and fabric-cleaning trials.']
  },
  {
    ingredientId: 'sls-30', productCategoryId: 'LAUNDRY_LIQUID', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Aqueous sodium lauryl sulfate anionic surfactant solution; primary/co-surfactant for wetting, detergency and foam.',
    compatibilityMechanism: 'The 30% aqueous SLS solution supplies the same anionic fatty alcohol sulfate as the solid needle grade, but has a different water and electrolyte contribution. Supplier product data describes 30% active SLS solution; cited supplier application emphasis is industrial emulsion polymerization, not laundry formulation validation.',
    concentrationFinding: 'Catalog 30% default aligns with supplier PDS active 30.0 wt%. Supplier example reports unsulfated material <1.2%, sodium chloride <0.3%, viscosity <500 cP and density 8.7 lb/gal. These are supplier-specific values, not verified catalog lot specs. No use range assigned.',
    pHFinding: 'Pilot Chemical PDS reports pH 8.0 for a 10% solution. This is not a general pH stability envelope. Laundry-liquid target pH 7.5–9.5 is screening context only.',
    incompatibilityRisks: ['High foam may be unsuitable for machine laundry without blend qualification.', 'Anionic SLS is incompatible with cationic surfactants.', 'Electrolytes can shift viscosity/clarity; aqueous grade adds water to the formula.', 'Do not transfer the needle grade impurity/moisture limits to the liquid grade.'],
    evidence: [
      {title:'Pilot Chemical Calfoam SLS-30 product data sheet',url:'https://pilotchemical.com/document.php?fileID=pds%2FPDS+303S00.pdf',evidenceType:'SUPPLIER_TDS'},
      {title:'Pilot Ossa Calimulse SLS technical specification',url:'https://www.pilotossa.com/en-us/products/calimulse-sls',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['Confirm exact commercial grade and supplier CoA/TDS.', 'No permitted finished-product use range established.', 'Validate foam, detergency, viscosity, preservation and shelf stability in laundry liquid.']
  }
];


export const NONIONIC_SURFACTANT_EVIDENCE_REVIEWS: IngredientEvidenceReview[] = [
  {
    ingredientId: 'lae-7', productCategoryId: 'LAUNDRY_LIQUID', decision: 'APPLICABLE',
    chemicalRole: 'C12–15 fatty alcohol ethoxylate, nominally 7 EO; nonionic detergent surfactant for wetting, oily-soil emulsification and detergency.',
    compatibilityMechanism: 'Ethoxylate chain provides water compatibility while the fatty alcohol chain associates with oily soil. Nonionic surfactants can be blended with anionic LAS/SLES/AOS and are useful for oily soil removal; cloud point and EO distribution determine temperature/electrolyte response.',
    concentrationFinding: 'Catalog activeDefault 100% is only a catalog assumption; supplier TDS values for comparable C12–14 7EO grades do not verify this C12–15 product assay. No approved finished-product dose range assigned.',
    pHFinding: 'Comparable C12–14 7EO supplier TDS reports pH 6–9 in 1% aqueous solution and cloud point 53–56°C. This is adjacent-chain evidence, not a verified LAE-7 specification. Finished laundry-liquid pH 7.5–9.5 remains screening context.',
    incompatibilityRisks: ['Cloud point can fall with electrolyte loading and temperature changes, causing haze or phase separation.', 'Exact chain distribution and EO distribution affect detergency and cloud point.', 'Low-EO material may have limited water solubility at low temperature.', 'Verify residual EO/1,4-dioxane and supplier regulatory specifications.'],
    evidence: [
      {title:'Korkimya C12–C14 7EO technical data sheet',url:'https://korkimya.com/en/industries/surfactants/ethoxylated-fatty-alcohol-c12-c14-7eo/technical-data-sheet',evidenceType:'SUPPLIER_TDS'},
      {title:'PETRONAS Ethonas FAE-9 product data sheet (adjacent 9EO grade)',url:'https://www.petronas.com/pcg/sites/default/files/2023-08/Products_Documents/FAE-9_May23%20SCA.pdf',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['Exact C12–15 7EO supplier TDS/CoA is required; C12–14 7EO is adjacent evidence only.', 'No numeric use range approved.', 'Test cloud point, low-temperature clarity, oily-soil removal and compatibility with the anionic base.']
  },
  {
    ingredientId: 'lae-9', productCategoryId: 'LAUNDRY_LIQUID', decision: 'APPLICABLE',
    chemicalRole: 'C12–15 fatty alcohol ethoxylate, nominally 9 EO; water-compatible nonionic detergency and oily-soil emulsification surfactant.',
    compatibilityMechanism: 'Higher average EO generally increases hydrophilicity and aqueous compatibility relative to lower-EO homologues, while the alkyl chain anchors into oily soil. Supplier C12–14 9EO data identifies homecare/I&I cleaning and emulsification applications; it is an adjacent chain-length grade.',
    concentrationFinding: 'Catalog activeDefault 100% is not verified assay. PETRONAS FAE-9 describes C12–14 9EO and typical cloud point 77–82°C; those data do not verify the catalog C12–15 grade. No universal finished-product use level is inferred.',
    pHFinding: 'PETRONAS reports pH 6.0–7.5 in 1% IPA/water (10/16) for its C12–14 9EO product. This solvent-containing test is not directly comparable with aqueous pH measurements. Finished laundry-liquid pH 7.5–9.5 is screening context only.',
    incompatibilityRisks: ['Cloud point and phase behavior vary with electrolyte, solvent, temperature and surfactant blend.', 'Excess nonionic can reduce foam and alter viscosity.', 'Confirm EO distribution and trace ethylene oxide/1,4-dioxane controls with supplier.'],
    evidence: [{title:'PETRONAS Ethonas FAE-9 product data sheet',url:'https://www.petronas.com/pcg/sites/default/files/2023-08/Products_Documents/FAE-9_May23%20SCA.pdf',evidenceType:'SUPPLIER_TDS'}],
    limitations: ['Exact C12–15 9EO supplier grade is not independently confirmed.', 'No numeric use range approved.', 'Validate oily soil removal, rinse, foam, cloud point and storage stability.']
  },
  {
    ingredientId: 'apg-0810', productCategoryId: 'LAUNDRY_LIQUID', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'C8–10 alkyl polyglucoside nonionic surfactant mixture; wetting, detergency, emulsification and foam contribution.',
    compatibilityMechanism: 'APG is a distribution of alkyl-chain and glucoside oligomers rather than a single pure molecule. It can complement anionic surfactants and improve wetting; alkaline commercial grades may raise formula pH and add substantial solids/electrolyte burden.',
    concentrationFinding: 'Catalog activeDefault 50% is consistent with supplier APG 0810 solids of 50.0–52.0%, but this does not verify the catalog lot. Solids are not necessarily identical to surfactant active matter for every supplier test method. No use range assigned.',
    pHFinding: 'Supplier APG 0810 TDS reports pH data for its grade, but commercial APG grades vary: examples include pH 7–9 for one 20% in IPA/water test and 11.5–12.5 for other 10% aqueous grades. Do not transfer a supplier pH range across grades. Finished laundry-liquid target 7.5–9.5 is screening context.',
    incompatibilityRisks: ['Alkaline APG grade can shift finished pH outside the intended range.', 'Electrolytes and APG chain/oligomer distribution affect viscosity and clarity.', 'High foam may be undesirable for front-load laundry.', 'Preservation and microbial quality must be checked for aqueous commercial grade.'],
    evidence: [
      {title:'ZXCHEM APG 0810 technical data sheet (2026)',url:'https://www.zxchem.com/wp-content/uploads/2026/10/TDS-APG-0810-68515-73-1-2026-2.pdf',evidenceType:'SUPPLIER_TDS'},
      {title:'GreenAPG AG 0810 series technical specification',url:'https://pub-mediabox-storage.rxweb-prd.com/exhibitor/document/exh-39aa41d7-4084-4a91-939f-5490fa4b4acd/5b089507-1660-4399-af84-03846013b653.pdf',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['Confirm exact supplier grade, pH test method and solids/active-matter definition.', 'No universal dose or pH stability limit inferred.', 'Test blend clarity, foam, viscosity, pH drift and storage stability.']
  }
];
