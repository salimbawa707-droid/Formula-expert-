import { UNIVERSAL_INGREDIENTS, type UniversalIngredient } from './universalIngredientLibrary';
import { CANONICAL_PRODUCT_CATEGORY_IDS, type ProductCategoryId } from '../domain/productTaxonomy';

/**
 * Conservative AI desk-screen for catalog triage.
 * These are NOT final applicability approvals and must never be used as
 * formulation permission, safety clearance, or validated use limits.
 */
export type PreliminaryDisposition = 'CONDITIONAL_SCREEN' | 'IDENTITY_OR_EVIDENCE_UNKNOWN' | 'CHEMISTRY_CONFLICT_RISK';

export interface MasterIngredientApplicabilityScreenRow {
  ingredientId: string;
  ingredientName: string;
  catalogClass: string;
  productCategory: ProductCategoryId;
  preliminaryDisposition: PreliminaryDisposition;
  rationale: string;
  criticalUnknowns: string[];
  finalApplicability: 'NOT_APPROVED';
  evidenceState: 'CATALOG_METADATA_ONLY' | 'PROVENANCE_METADATA_PRESENT';
}

function screenOne(ingredient: UniversalIngredient, category: ProductCategoryId): Omit<MasterIngredientApplicabilityScreenRow, 'ingredientId' | 'ingredientName' | 'catalogClass' | 'productCategory' | 'evidenceState'> {
  const c = ingredient.category.toLowerCase();
  const name = ingredient.name.toLowerCase();
  const role = (ingredient.role || ingredient.function || '').toLowerCase();
  const proprietary = ingredient.identityType === 'PROPRIETARY_BLEND' || ingredient.casStatus === 'PROPRIETARY' || (!ingredient.casNumber && ingredient.identityType !== 'MULTI_COMPONENT_MIXTURE');
  const unknowns = [
    ...(proprietary ? ['Full composition / identity disclosure'] : []),
    ...(!ingredient.provenance?.sourceUrl ? ['Grade-specific supplier TDS/SDS/CoA or authoritative source URL'] : []),
    ...(ingredient.activeDefault == null ? ['As-supplied active matter / solids assay'] : ['Verification that catalog activeDefault matches the purchased grade']),
    ...(ingredient.phMin == null || ingredient.phMax == null ? ['Verified pH stability/use range'] : []),
    ...(['Anionic Surfactant','Nonionic Surfactant','Amphoteric Surfactant','Cationic Surfactant'].includes(ingredient.category) && ingredient.hlb == null ? ['Measured or source-supported surfactant property data where relevant'] : []),
    ['Category-specific use level, process, compatibility and finished-formula test']
  ];

  if (proprietary) {
    return { preliminaryDisposition: 'IDENTITY_OR_EVIDENCE_UNKNOWN', rationale: 'Proprietary or composition-incomplete material: no category compatibility can be concluded from trade name/function alone.', criticalUnknowns: unknowns, finalApplicability: 'NOT_APPROVED' };
  }

  if (c === 'anionic surfactant' && category === 'FABRIC_SOFTENER') {
    return { preliminaryDisposition: 'CHEMISTRY_CONFLICT_RISK', rationale: 'Anionic surfactant is not a cationic fabric-conditioning active; anionic/cationic pairing can cause ion-pairing, precipitation or loss of function. Do not use as the softening active.', criticalUnknowns: [...unknowns, 'Confirm full softener chassis and any cationic co-ingredients'], finalApplicability: 'NOT_APPROVED' };
  }
  if ((c === 'alkaline builder' || c === 'builder / chelator' || c === 'neutralizer / base') &&
      (category === 'TOILET_CLEANER' || category === 'BATHROOM_CLEANER')) {
    return { preliminaryDisposition: 'CHEMISTRY_CONFLICT_RISK', rationale: 'Alkaline builder/base function conflicts with an acidic descaling product subclass; subclass and neutralization stoichiometry must be specified before any use.', criticalUnknowns: [...unknowns, 'Acidic versus neutral bathroom/toilet subclass and neutralization demand'], finalApplicability: 'NOT_APPROVED' };
  }
  if (c === 'acid & descaler' &&
      (category === 'LAUNDRY_POWDER' || category === 'DISHWASH_AUTOMATIC' || category === 'KITCHEN_DEGREASER')) {
    return { preliminaryDisposition: 'CHEMISTRY_CONFLICT_RISK', rationale: 'Acid/descaler function conflicts with the normally alkaline builder-rich product environment; a separately defined acidic subclass would be required.', criticalUnknowns: [...unknowns, 'Exact acid identity, concentration, corrosion and substrate compatibility'], finalApplicability: 'NOT_APPROVED' };
  }

  if (c.includes('surfactant')) {
    if (category === 'DISHWASH_AUTOMATIC') {
      return { preliminaryDisposition: 'CONDITIONAL_SCREEN', rationale: 'Surfactant role may fit only when low-foam behavior, rinse performance and machine compatibility are established for this exact grade; generic surfactant class is insufficient.', criticalUnknowns: [...unknowns, 'Dynamic foam under machine spray, rinse residue and grade-specific dose'] , finalApplicability: 'NOT_APPROVED' };
    }
    if (category === 'FABRIC_SOFTENER' && c !== 'cationic surfactant') {
      return { preliminaryDisposition: 'CHEMISTRY_CONFLICT_RISK', rationale: 'Non-cationic surfactant class is not established as the cationic conditioning active; compatibility with the softener emulsion must be proven.', criticalUnknowns: [...unknowns, 'Cationic emulsifier/conditioner compatibility and deposition test'], finalApplicability: 'NOT_APPROVED' };
    }
    return { preliminaryDisposition: 'CONDITIONAL_SCREEN', rationale: 'Surfactant family has plausible functional relevance, but exact alkyl distribution, EO level, ionic class, active assay, pH window, use level and mixed-surfactant compatibility are grade/formula-specific.', criticalUnknowns: unknowns, finalApplicability: 'NOT_APPROVED' };
  }

  if (c === 'enzymes') {
    return { preliminaryDisposition: 'CONDITIONAL_SCREEN', rationale: 'Enzyme use depends on enzyme identity/activity units, pH-temperature profile, storage stability, protease cross-compatibility and oxidant exposure; product category alone cannot approve it.', criticalUnknowns: [...unknowns, 'Enzyme activity assay, stabilizer system, protease compatibility and shelf-life/challenge data'], finalApplicability: 'NOT_APPROVED' };
  }
  if (c === 'bleach & oxidizer') {
    return { preliminaryDisposition: 'CONDITIONAL_SCREEN', rationale: 'Oxidizer use requires exact active species, available-oxygen assay, pH/temperature, substrate safety and enzyme/fragrance compatibility.', criticalUnknowns: [...unknowns, 'Available oxygen assay, decomposition profile, packaging and textile/surface safety'], finalApplicability: 'NOT_APPROVED' };
  }
  if (c === 'preservative & biocide') {
    return { preliminaryDisposition: 'CONDITIONAL_SCREEN', rationale: 'Preservative efficacy is formulation-specific and cannot be inferred from presence or nominal percentage; pH, active concentration and challenge-test evidence are required.', criticalUnknowns: [...unknowns, 'Preservative efficacy/challenge test, local regulatory status and target-organism spectrum'], finalApplicability: 'NOT_APPROVED' };
  }
  if (c === 'acid & descaler') {
    return { preliminaryDisposition: category === 'TOILET_CLEANER' || category === 'BATHROOM_CLEANER' ? 'CONDITIONAL_SCREEN' : 'CHEMISTRY_CONFLICT_RISK', rationale: 'Acid/descaler function is relevant only to a defined acidic descaling subclass; exact acid, concentration, corrosion inhibition and substrate compatibility govern.', criticalUnknowns: [...unknowns, 'Mineral versus organic acid subclass, titratable acidity, corrosion and substrate tests'], finalApplicability: 'NOT_APPROVED' };
  }
  if (c === 'alkaline builder' || c === 'builder / chelator' || c === 'neutralizer / base') {
    return { preliminaryDisposition: 'CONDITIONAL_SCREEN', rationale: 'Builder/chelating/base function may support alkaline cleaning, but capacity basis, Ca/Mg selectivity, dose, pH and precipitation behavior must be verified for the exact grade.', criticalUnknowns: [...unknowns, 'Capacity basis and assay, Ca/Mg speciation, precipitation and use-dilution test'], finalApplicability: 'NOT_APPROVED' };
  }
  if (c === 'solvent & hydrotrope') {
    return { preliminaryDisposition: 'CONDITIONAL_SCREEN', rationale: 'Solvent/hydrotrope utility depends on solvent identity, flash point, VOC/regulatory limits, phase behavior, substrate compatibility and residue.', criticalUnknowns: [...unknowns, 'Solubility/phase diagram, flash point, VOC and substrate compatibility'], finalApplicability: 'NOT_APPROVED' };
  }
  if (c === 'polymer & thickener') {
    return { preliminaryDisposition: 'CONDITIONAL_SCREEN', rationale: 'Polymer/thickener performance is sensitive to molecular weight, substitution, electrolyte, surfactant, pH and shear history; category-level use is not established.', criticalUnknowns: [...unknowns, 'Polymer grade/specification, electrolyte curve, rheology and stability tests'], finalApplicability: 'NOT_APPROVED' };
  }
  if (c === 'optical brightener & dye') {
    return { preliminaryDisposition: category === 'LAUNDRY_LIQUID' || category === 'LAUNDRY_POWDER' ? 'CONDITIONAL_SCREEN' : 'IDENTITY_OR_EVIDENCE_UNKNOWN', rationale: 'Optical brightener/dye utility is primarily substrate- and wavelength-specific; textile affinity, shade, light stability and staining behavior require evidence.', criticalUnknowns: [...unknowns, 'Exact chromophore/C.I. identity, substrate affinity, shade and photostability'], finalApplicability: 'NOT_APPROVED' };
  }
  if (c === 'additive & performance') {
    return { preliminaryDisposition: 'IDENTITY_OR_EVIDENCE_UNKNOWN', rationale: 'Broad additive/performance bucket does not define a unique chemical mechanism or category scope; evaluate the disclosed composition and named function.', criticalUnknowns: [...unknowns, 'Disclosed composition, mechanism, compatibility and measured performance'], finalApplicability: 'NOT_APPROVED' };
  }
  return { preliminaryDisposition: 'IDENTITY_OR_EVIDENCE_UNKNOWN', rationale: 'Catalog class is too broad to infer chemical compatibility. Keep the category pair unresolved until exact identity and source evidence are reviewed.', criticalUnknowns: unknowns, finalApplicability: 'NOT_APPROVED' };
}

export const MASTER_INGREDIENT_APPLICABILITY_SCREEN: MasterIngredientApplicabilityScreenRow[] =
  UNIVERSAL_INGREDIENTS.flatMap((ingredient) =>
    CANONICAL_PRODUCT_CATEGORY_IDS.map((productCategory) => {
      const result = screenOne(ingredient, productCategory);
      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        catalogClass: ingredient.category,
        productCategory,
        ...result,
        evidenceState: ingredient.provenance?.sourceUrl ? 'PROVENANCE_METADATA_PRESENT' as const : 'CATALOG_METADATA_ONLY' as const,
      };
    })
  );

export function getMasterIngredientApplicabilityScreenSummary() {
  const rows = MASTER_INGREDIENT_APPLICABILITY_SCREEN;
  const count = (value: PreliminaryDisposition) => rows.filter(row => row.preliminaryDisposition === value).length;
  return {
    ingredientCount: UNIVERSAL_INGREDIENTS.length,
    categoryCount: CANONICAL_PRODUCT_CATEGORY_IDS.length,
    pairCount: rows.length,
    uniqueIngredientIds: new Set(UNIVERSAL_INGREDIENTS.map(item => item.id)).size,
    duplicateIngredientIds: UNIVERSAL_INGREDIENTS.length - new Set(UNIVERSAL_INGREDIENTS.map(item => item.id)).size,
    dispositions: {
      conditionalScreen: count('CONDITIONAL_SCREEN'),
      identityOrEvidenceUnknown: count('IDENTITY_OR_EVIDENCE_UNKNOWN'),
      chemistryConflictRisk: count('CHEMISTRY_CONFLICT_RISK'),
    },
    finalApprovals: rows.filter(row => row.finalApplicability !== 'NOT_APPROVED').length,
    provenanceMetadataRecords: UNIVERSAL_INGREDIENTS.filter(item => Boolean(item.provenance)).length,
    provenanceUrlRecords: UNIVERSAL_INGREDIENTS.filter(item => Boolean(item.provenance?.sourceUrl)).length,
    missingPHRangeRecords: UNIVERSAL_INGREDIENTS.filter(item => item.phMin == null || item.phMax == null).length,
  };
}
