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


/** Second nonionic batch: lower- and higher-EO alcohol ethoxylate grades. */
export const NONIONIC_SURFACTANT_EVIDENCE_REVIEWS_BATCH_2: IngredientEvidenceReview[] = [
  {
    ingredientId: 'lae-3', productCategoryId: 'LAUNDRY_LIQUID', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Low-EO C12–15 fatty alcohol ethoxylate nonionic surfactant; oil-soluble emulsifier and oily-soil coupling aid rather than a presumed fully water-soluble primary detergent.',
    compatibilityMechanism: 'Three EO units give lower hydrophilicity than LAE-7/LAE-9. PETRONAS C12–C14 FAE-3 identifies the grade as nonionic and homecare/I&I cleaner emulsifier, but reports it insoluble in water and no aqueous cloud point. It therefore requires a compatible solvent/hydrotrope or blend architecture and clarity testing; do not assume it will dissolve as a neat aqueous surfactant.',
    concentrationFinding: 'Catalog activeDefault 100% is not a supplier assay. Adjacent PETRONAS C12–C14 FAE-3 data gives water max 0.1%; no use range or universal dose is established.',
    pHFinding: 'PETRONAS reports pH 6.0–7.5 in 1% IPA/water, not plain water. This cannot be treated as an aqueous pH stability range. Finished laundry-liquid target pH 7.5–9.5 is only screening context.',
    incompatibilityRisks: ['Water insolubility can cause haze, separation or poor incorporation in aqueous laundry liquid.', 'Low EO/higher oil affinity can change detergency and rinse behavior.', 'Solvent/hydrotrope addition changes VOC, flammability, preservation and regulatory profile.', 'Cationic incompatibility must be assessed for mixed systems.'],
    evidence: [{title:'PETRONAS Ethonas FAE-3 product data sheet',url:'https://www.petronas.com/pcg/sites/default/files/2023-07/Products_Documents_FAE-3_May23%20SCA.pdf',evidenceType:'SUPPLIER_TDS'}],
    limitations: ['C12–C14 is adjacent evidence to catalog C12–15; exact supplier grade TDS/CoA required.', 'No numeric permitted use range assigned.', 'Do not approve for a clear water-based laundry liquid until solubility, dilution path, clouding and storage tests pass.']
  },
  {
    ingredientId: 'lae-12', productCategoryId: 'LAUNDRY_LIQUID', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Higher-EO C12–15 fatty alcohol ethoxylate nonionic surfactant; hydrophilic detergent/emulsifier candidate with high water compatibility relative to low-EO homologues.',
    compatibilityMechanism: 'Higher average EO generally increases hydrophilicity. An Indian supplier lists C12–C15 EO-12 as a nonionic surfactant with 99.5% active content and a 63–66°C cloud point. These are supplier-reported properties for a named commercial product, not a verification of the catalog grade. Cloud point and phase behavior still depend on electrolyte, temperature and blend composition.',
    concentrationFinding: 'Catalog activeDefault 100% is unverified; one Indian supplier reports 99.5% active content for its C12–C15 EO-12 product. This is a supplier-specific specification, not a guaranteed catalog assay. No finished-product use range assigned.',
    pHFinding: 'Supplier reports pH 5.5–7.5 and cloud point 63–66°C; the pH test method is not stated on the product page, so it must not be treated as a validated stability window. Finished laundry-liquid target 7.5–9.5 is screening context only.',
    incompatibilityRisks: ['Electrolyte and temperature can move cloud point and cause haze/phase separation.', 'High nonionic loading can reduce foam and alter viscosity.', 'Confirm EO distribution, residual EO/1,4-dioxane and supplier quality limits.', 'Anionic/nonionic compatibility is generally plausible but final blend stability remains formula-specific.'],
    evidence: [{title:'Matangi Industries C12–C15 Alcohol Ethoxylate 12 product specification',url:'https://www.matangiindustries.com/products/c12-c15-alcohol-ethoxylate-12/',evidenceType:'SUPPLIER_TDS'}],
    limitations: ['Supplier page is not a lot-specific CoA; obtain current TDS/SDS/CoA for the exact material.', 'pH method is unspecified; do not infer raw-material pH tolerance.', 'No numeric use range assigned; validate cloud point, low/high-temperature stability, detergency and rinse.']
  }
];


/** Third nonionic batch: APG 1214 and nonylphenol ethoxylate stewardship gate. */
export const NONIONIC_SURFACTANT_EVIDENCE_REVIEWS_BATCH_3: IngredientEvidenceReview[] = [
  {
    ingredientId: 'apg-1214', productCategoryId: 'LAUNDRY_LIQUID', decision: 'APPLICABLE',
    chemicalRole: 'C12–14 alkyl polyglucoside (lauryl glucoside) nonionic surfactant; detergency, wetting and oily-soil emulsification, typically used with anionic surfactants.',
    compatibilityMechanism: 'Supplier literature identifies APG 1214 as a C12–14 fatty alcohol glucoside, nonionic, with high electrolyte/alkali tolerance and compatibility with anionic surfactants. A supplier formulation example includes 15 wt% commercial APG product alongside 38 wt% SLES in liquid laundry detergent; this is a specific example, not a universal dose. Product can be turbid/paste-like and its high pH can affect finished formula pH.',
    concentrationFinding: 'Catalog activeDefault must not be treated as verified assay. Supplier specifications commonly report 50–53% solids/active-like content, but solids are not automatically equivalent to surfactant active matter. No universal use range assigned.',
    pHFinding: 'Supplier TDS reports pH 11.5–12.5 in a 10% aqueous solution for a named APG 1214 grade. Finished laundry-liquid target pH 7.5–9.5 is screening context; APG addition can raise batch pH and requires final adjustment/verification.',
    incompatibilityRisks: ['High native pH can push finished product outside target if not neutralized/adjusted.', 'Long-chain C12–14 APG can be viscous, turbid or paste-like at low temperature; check pumping and cold stability.', 'Solids content is not necessarily identical to active matter.', 'Free fatty alcohol, ash and magnesium content can affect clarity and storage.', 'Preservative efficacy and microbial stability must be validated for the aqueous raw material and finished product.'],
    evidence: [
      {title:'NaturalAPG HG1214 supplier specification and liquid laundry formulation example',url:'https://pub-mediabox-storage.rxweb-prd.com/exhibitor/document/exh-fd1474c3-cc9f-47e4-bc57-c1cf8e13dd85/a734bba3-512f-42be-81c2-6c84b90dba3c.pdf',evidenceType:'SUPPLIER_TDS'},
      {title:'Yangzhou Chenhua APG CH-1214 technical data sheet',url:'https://pub-mediabox-storage.rxweb-prd.com/exhibitor/products/exh-8994a23b-a7f1-4ff5-8467-0c5c816abb63/product-documents/pro-31f878ca-1f73-488d-affc-233b9c896a4c/ea075191-d7e6-4514-a9cc-82de44a1f5a2.pdf',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['Exact catalog grade and supplier CoA must be matched before using 50–53% as a batch calculation.', 'The published 15% product addition is a single formulation example, not a recommended universal dose.', 'Validate low-temperature clarity, viscosity, detergency, foam, rinse and preservation in the actual blend.']
  },
  {
    ingredientId: 'apg-1214', productCategoryId: 'DISHWASH_MANUAL', decision: 'APPLICABLE',
    chemicalRole: 'C12–14 alkyl polyglucoside nonionic co-surfactant for wetting, grease emulsification and foam support in hand dishwashing.',
    compatibilityMechanism: 'Supplier data identifies APG 1214 as a nonionic surfactant with detergency, emulsifying and foaming properties, and compatibility with SLS/SLES and CAPB. It can contribute to foam and viscosity synergism, but final viscosity depends on the complete anionic/amphoteric/electrolyte system.',
    concentrationFinding: 'Supplier grades report at least 50% solids/active-like content. Do not assume solids equals active matter or transfer a laundry formula dosage into hand dishwash. No permitted use range assigned.',
    pHFinding: 'Named supplier grade pH 11.5–12.5 in 10% aqueous solution. Manual dishwash finished pH target 6.0–8.0 is screening context; pH correction and skin compatibility testing are mandatory.',
    incompatibilityRisks: ['Raw material alkalinity may raise finished pH beyond mildness target.', 'High viscosity and low-temperature paste formation can complicate processing.', 'Foam, salt curve and viscosity response are blend-specific.', 'Skin mildness cannot be inferred from APG origin alone; test the complete formula.'],
    evidence: [
      {title:'NaturalAPG HG1214 supplier specification',url:'https://pub-mediabox-storage.rxweb-prd.com/exhibitor/document/exh-fd1474c3-cc9f-47e4-bc57-c1cf8e13dd85/a734bba3-512f-42be-81c2-6c84b90dba3c.pdf',evidenceType:'SUPPLIER_TDS'},
      {title:'Wohingwater APG 1214 technical properties and compatibility',url:'https://www.wohingwater.com/En_Pr_d_gci_34_id_47.html',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['Supplier claims are not independent clinical mildness evidence.', 'No use range assigned; validate foam, grease removal, skin mildness, viscosity and rinse.', 'Exact grade active matter and impurity profile require current CoA.']
  },
  {
    ingredientId: 'apg-1214', productCategoryId: 'KITCHEN_DEGREASER', decision: 'APPLICABLE',
    chemicalRole: 'C12–14 alkyl polyglucoside nonionic wetting and emulsifying surfactant for aqueous hard-surface grease removal.',
    compatibilityMechanism: 'Supplier documentation specifically describes APG 1214 use in household/institutional hard-surface cleaning and reports alkaline/electrolyte resistance. It can assist wetting and emulsification of greasy soil in neutral-to-alkaline systems; performance in solvent-heavy degreasers requires separate phase compatibility testing.',
    concentrationFinding: 'Supplier specification commonly gives ≥50% solids, but no exact catalog-grade assay or validated kitchen-degreaser use range is available.',
    pHFinding: 'Named supplier grade pH 11.5–12.5 in 10% aqueous solution. Product category target pH and substrate compatibility must be checked against the actual degreaser subclass; raw-material pH is not the finished-product pH.',
    incompatibilityRisks: ['Can contribute substantial alkalinity and viscosity.', 'Long-chain APG may show turbidity or paste formation at low temperature.', 'Solvent/hydrotrope/electrolyte blends may alter clarity and phase stability.', 'Check aluminum, painted surfaces and other alkali-sensitive substrates before use.'],
    evidence: [
      {title:'Yangzhou Chenhua APG CH-1214 technical data sheet',url:'https://pub-mediabox-storage.rxweb-prd.com/exhibitor/products/exh-8994a23b-a7f1-4ff5-8467-0c5c816abb63/product-documents/pro-31f878ca-1f73-488d-affc-233b9c896a4c/ea075191-d7e6-4514-a9cc-82de44a1f5a2.pdf',evidenceType:'SUPPLIER_TDS'},
      {title:'Wohingwater APG 1214 hard-surface cleaning application',url:'https://www.wohingwater.com/En_Pr_d_gci_34_id_47.html',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['No grade-specific kitchen-degreaser dosage established.', 'Validate cleaning, rinse residue, substrate compatibility, foam and storage stability.', 'Do not assume all APG 1214 grades have identical carbon-chain distribution or solids.']
  },
  ...(['np-6', 'np-9', 'np-10'] as const).map((ingredientId) => ({
    ingredientId,
    productCategoryId: 'LAUNDRY_LIQUID' as const,
    decision: 'CONDITIONALLY_APPLICABLE' as const,
    chemicalRole: 'Nonylphenol ethoxylate (NPE) nonionic surfactant; ethoxylate hydrophilic-lipophilic balance varies with average EO number. Historical industrial wetting/emulsifying/degreasing role.',
    compatibilityMechanism: 'NPEs can provide nonionic wetting and emulsification, but the environmental and regulatory profile is a decisive product-design constraint. EU REACH Annex XVII restricts nonylphenol and NPEs at ≥0.1 wt% for domestic cleaning and several other uses; official Danish EPA guidance notes degradation to nonylphenol and endocrine-disruption concern. This is a market restriction/stewardship warning, not a claim that the same legal threshold applies in India.',
    concentrationFinding: 'No recommended laundry-liquid use level is assigned. Do not formulate around NP-6/9/10 until target-market legal review, wastewater/environmental assessment and customer acceptance are documented.',
    pHFinding: 'No exact supplier-grade pH specification has been established for the catalog records. Finished laundry-liquid target pH 7.5–9.5 is not a raw-material specification.',
    incompatibilityRisks: ['NPE degradation products include nonylphenol, a substance of environmental concern.', 'EU REACH restriction applies to domestic cleaning at ≥0.1 wt%; export/customer-market requirements may prohibit or severely limit use.', 'EO number alone does not establish exact cloud point, active matter, impurity profile or biodegradation behavior.', 'Do not market as eco-friendly/biodegradable without substantiation.', 'Supplier grade identity and NPE isomer distribution need confirmation.'],
    evidence: [
      {title:'EU REACH Annex XVII entry 46 restriction for nonylphenol and nonylphenol ethoxylates',url:'https://webgate.ec.europa.eu/reqs2/public/v2/requirement/auxi/eu/32006R1907_cherest_annex_17_nonylphenol_46.pdf',evidenceType:'TECHNICAL_GUIDANCE' as const},
      {title:'Danish Environmental Protection Agency fact sheet: nonylphenol and nonylphenol ethoxylates',url:'https://eng.mst.dk/chemicals/chemicals-in-products/chemical-legislation/fact-sheets-on-legislation/fact-sheet-nonylphenol-and-nonylphenol-ethoxylates',evidenceType:'TECHNICAL_GUIDANCE' as const}
    ],
    limitations: ['No catalog-specific TDS/CoA or supplier identity evidence has been reviewed.', 'EU legal threshold is not asserted as Indian law; obtain India-specific legal advice before commercialization.', 'This conditional status is a risk hold, not a positive recommendation to use NPEs.', 'Prefer evaluating an NPE-free alcohol ethoxylate/APG alternative for new consumer formulations.']
  }))
];


/**
 * Nonionic batch 4 — fragrance solubilizers and low-foam EO/PO surfactant.
 * These are adjunct/function-specific reviews, not primary laundry surfactant approvals.
 */
export const NONIONIC_SURFACTANT_EVIDENCE_REVIEWS_BATCH_4: IngredientEvidenceReview[] = [
  {
    ingredientId: 'peg-40-hco', productCategoryId: 'LAUNDRY_LIQUID', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'Ethoxylated hydrogenated castor oil nonionic solubilizer/emulsifier; fragrance and oil-phase carrier rather than a default primary laundry detergent surfactant.',
    compatibilityMechanism: 'Supplier specifications describe a water-soluble nonionic solubilizer/emulsifier with HLB around 13 and pH near neutral in dilute aqueous solution. It may help incorporate fragrance/oil components, but clarity, perfume retention, foam, rinse residue and interaction with the anionic surfactant blend must be established in the finished laundry liquid.',
    concentrationFinding: 'Catalog activeDefault/assay is not supplier verified. Supplier documents give differing suggested levels for cosmetic/fragrance solubilization (for example 0.5–5% or 1–10%); these are not validated laundry-detergent use limits and are not transferred to this matrix. No permitted use range assigned.',
    pHFinding: 'Supplier grade examples report pH 5–7 at 1% or pH 6–7 at 5–10% aqueous solution, depending on grade and method. These values are raw-material test conditions, not finished laundry-liquid pH limits.',
    incompatibilityRisks: ['Excess solubilizer may suppress foam or alter detergency and rinse feel.', 'Fragrance-to-solubilizer ratio is perfume-specific; haze or separation can occur.', 'Some grades are pastes that crystallize or turn hazy in storage and require controlled warming/homogenization.', 'Exact PEG-40 HCO identity, ethoxylation profile, residual EO/dioxane and lot specification require supplier confirmation.'],
    evidence: [
      {title:'AWL Agri business PEG-40 HCO technical data sheet',url:'https://5.imimg.com/data5/ANDROID/Doc/2025/8/535113151/SQ/RQ/QT/17794088/tds-peg-40-hco-pdf.pdf',evidenceType:'SUPPLIER_TDS'},
      {title:'PCC Exol Rokacet HR40 product brochure',url:'https://www.products.pcc.eu/wp-content/uploads/import/product/broszura/0d1a171f-0db0-4b35-a305-58ca1f4b1fb4/rokacet-hr40_broszura_en.pdf',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['No laundry-specific supplier formula or performance dose has been established.', 'Confirm exact grade/CoA and test perfume compatibility, cold stability, foam, detergency and rinse residue before use.']
  },
  {
    ingredientId: 'polysorbate-20', productCategoryId: 'LAUNDRY_LIQUID', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'High-HLB nonionic sorbitan laurate ethoxylate; fragrance/oil solubilizer and secondary wetting/emulsifying adjunct.',
    compatibilityMechanism: 'Supplier data gives HLB about 16.7 and describes solubilization of lipophilic materials; another supplier lists cleaning/detergent use as a nonionic wetting agent. This supports testing as a fragrance or oily-soil adjunct, not treating it as a primary laundry surfactant or assuming detergent performance from HLB alone.',
    concentrationFinding: 'Catalog activeDefault is not a verified assay. Supplier documentation provides physical specifications and cosmetic solubilizer uses but no validated laundry-liquid dose. No permitted use range assigned.',
    pHFinding: 'Viswaat supplier data reports pH 5–7 in a 5% aqueous solution for its Polysorbate 20 grade. This is not a universal grade limit or finished-product pH specification.',
    incompatibilityRisks: ['High-HLB solubilizer may change perfume partitioning, foam, rinse and surfactant phase behavior.', 'Oxidation/peroxide and fatty-acid profile can vary by grade and storage history.', 'Do not assume compatibility with concentrated electrolyte or alkaline builder loads without stability testing.'],
    evidence: [
      {title:'Viswaat Chemicals polysorbate technical specifications',url:'https://www.viswaat.com/polysorbates.php',evidenceType:'SUPPLIER_TDS'},
      {title:'Elemental Polysorbate 20 technical data sheet',url:'https://www.ellementalpro.com/download/M-1624_TDS_S.pdf',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['Supplier evidence is primarily solubilizer/personal-care data; detergent-specific laundry performance remains unproven.', 'Obtain exact grade CoA and test fragrance clarity, cold/heat stability, foam, cleaning and rinse residue.']
  },
  {
    ingredientId: 'polysorbate-80', productCategoryId: 'LAUNDRY_LIQUID', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'High-HLB oleate-based nonionic sorbitan ethoxylate; oil-phase emulsifier/solubilizer and potential oily-soil emulsification adjunct.',
    compatibilityMechanism: 'Supplier data identifies Polysorbate 80 as a nonionic emulsifier with HLB around 15 and pH 6–8 in 5% aqueous solution. Its oleate-rich hydrophobe differs materially from Polysorbate 20; the two grades are not interchangeable. Laundry-liquid use remains a formulation hypothesis requiring actual soil and perfume tests.',
    concentrationFinding: 'Catalog activeDefault is not a verified assay. Supplier table provides HLB and dilute-solution pH but no laundry-detergent use level. No permitted use range assigned.',
    pHFinding: 'Viswaat supplier data reports pH 6–8 in a 5% aqueous solution for its Polysorbate 80 grade. This is not a finished laundry-liquid pH target.',
    incompatibilityRisks: ['Oleate unsaturation increases sensitivity to oxidation; peroxide value and storage age matter.', 'May alter foam, perfume release, rinse residue and phase behavior.', 'Electrolytes, alkaline builders and fragrance composition can affect emulsion stability.'],
    evidence: [
      {title:'Viswaat Chemicals polysorbate technical specifications',url:'https://www.viswaat.com/polysorbates.php',evidenceType:'SUPPLIER_TDS'}
    ],
    limitations: ['No supplier-specific laundry formula or use-level evidence reviewed.', 'Verify fatty-acid profile, peroxide value, CoA and stability in the actual anionic/nonionic blend.']
  },
  {
    ingredientId: 'pluronic-pe-6400', productCategoryId: 'DISHWASH_AUTOMATIC', decision: 'CONDITIONALLY_APPLICABLE',
    chemicalRole: 'EO/PO block-copolymer nonionic low-foaming surfactant; detergency and wetting adjunct for mechanically agitated machine dishwashing.',
    compatibilityMechanism: 'Published product data for BASF Pluronic PE 6400 describes a 100% active low-foaming nonionic block copolymer, with a reported cloud point near 60°C and application in dishwashers and industrial bottle washing. Its low-foam profile is directionally relevant to automatic dishwashing, but the product taxonomy includes multiple subclasses and the evidence does not validate a complete automatic-dishwash formula.',
    concentrationFinding: 'Catalog activeDefault/100% claim is not a batch assay. Supplier-style product data gives typical properties but no universal automatic-dishwash use level. No permitted use range assigned.',
    pHFinding: 'Available product data reports pH about 7 for a 5% aqueous solution. This is a raw-material test condition; alkaline automatic-dishwash product pH and high-temperature stability must be evaluated independently.',
    incompatibilityRisks: ['Cloud point and detergency depend on temperature, electrolyte and builder composition.', 'Low foam must be confirmed under machine spray/soil conditions; foam control is system-level.', 'Compatibility with enzymes, bleach systems, chelants and packaging requires subclass-specific testing.', 'The available data is a distributor reproduction of BASF product properties, not an authenticated current BASF TDS/CoA.'],
    evidence: [
      {title:'Pluronic PE 6400 product data reproducing BASF typical properties and dishwasher applications',url:'https://www.longerchem.com/sdp/169999/4/pd-560972/9691583-2592909/Plurionic_PE6400.html',evidenceType:'TECHNICAL_GUIDANCE'}
    ],
    limitations: ['Obtain current BASF or authorized distributor TDS/SDS and lot CoA before approving procurement.', 'Validate low-foam behavior, cleaning, cloud point, rinse/sheening and enzyme/bleach compatibility in the exact automatic-dishwash subclass.']
  }
];

