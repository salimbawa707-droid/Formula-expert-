import { UNIVERSAL_INGREDIENTS } from './universalIngredientLibrary';
import { MASTER_INGREDIENT_IDENTITY_COVERAGE } from './masterIngredientIdentityCoverage';
import { resolveFunctionalRoutingForIngredient } from './ingredientFunctionalRouting';

export type SupplierDocumentGateState = 'NOT_PROVIDED' | 'RECEIVED_UNREVIEWED' | 'VERIFIED_FOR_EXACT_GRADE' | 'REJECTED_OR_MISMATCHED';
export type NamedFormulaApplicabilityState = 'NOT_TESTED' | 'SCREENING_ONLY' | 'VALIDATED_FOR_NAMED_FORMULA' | 'FAILED';

export interface MasterIngredientSupplierEvidenceGateRow {
  ingredientId: string;
  ingredientName: string;
  catalogClass: string;
  casNumber: string | null;
  inciName: string;
  identityCrosswalkStatus: string;
  functionalRoutingClass: string | null;
  functionalRole: string | null;
  chargeBehavior: string | null;
  identityRouteStatus: 'ROUTED' | 'UNMAPPED' | 'BLOCKED';
  supplierContactState: 'NOT_CONTACTED' | 'CONTACT_IDENTIFIED' | 'REQUEST_SENT';
  supplierName: string | null;
  manufacturerName: string | null;
  exactProductCode: string | null;
  supplierTdsState: SupplierDocumentGateState;
  supplierSdsState: SupplierDocumentGateState;
  lotCoAState: SupplierDocumentGateState;
  lotNumber: string | null;
  lotAssayPct: number | null;
  assayBasis: string | null;
  formulaApplicabilityState: NamedFormulaApplicabilityState;
  namedFormulaId: string | null;
  blockers: string[];
  releaseDecision: 'BLOCKED' | 'APPROVED_FOR_NAMED_FORMULA';
}

function requiredFamilyEvidence(name: string, category: string, role: string | null): string[] {
  const n = name.toLowerCase();
  const fields = [
    'Manufacturer legal name, manufacturing site, exact trade name/product code/grade',
    'Current grade-specific TDS and SDS with document number, revision and issue date',
    'Matching received-lot CoA with lot/batch number, dates, numeric results, methods, units and specification limits',
    'As-supplied active matter/solids/purity and moisture assay with stated basis and method',
    'Identity/composition disclosure including CAS/INCI where applicable and mixture/UVCB boundary',
    'Physical properties with test concentration, temperature, instrument and method where relevant',
    'Storage, shelf-life, handling, incompatibility and packaging requirements'
  ];
  if (/surfactant/i.test(category) || role === 'AMINE_OXIDE_SURFACTANT' || role === 'ZWITTERIONIC_BETAINE') {
    fields.push('Surfactant-specific composition: chain/fatty-acyl distribution, EO distribution or oligomer distribution as applicable');
    fields.push('Free oil/free amine, residual fatty alcohol, salt and chemistry-specific impurities with limits and methods');
    fields.push('pH-dependent charge/speciation, cloud point and electrolyte response where applicable');
  }
  if (/polymer|thickener/i.test(category) || role === 'POLYMERIC_DISPERSANT') {
    fields.push('Polymer solids/moisture, molecular-weight or viscosity grade, substitution/charge density and electrolyte response');
    fields.push('Rheology test concentration, hydration protocol, spindle/geometry, shear rate, temperature and pH');
  }
  if (/enzyme/i.test(category)) fields.push('Activity units, assay method, enzyme identity, stabilizer system and protease/oxidant compatibility');
  if (/bleach|oxidizer/i.test(category)) fields.push('Available-oxygen or active-species assay, decomposition profile and packaging compatibility');
  if (/preservative|biocide/i.test(category)) fields.push('Active fraction, carrier composition, impurity limits and jurisdiction-specific identity/registration data');
  if (/fragrance|perfume/i.test(n)) fields.push('IFRA conformity for intended product category, allergen declaration and restricted-material disclosure');
  return fields;
}

/**
 * Evidence gate for every canonical commercial-grade catalog row.
 * Initial states are deliberately empty: catalog defaults and public references
 * are never promoted to supplier TDS, matching-lot CoA or formula approval.
 */
export const MASTER_INGREDIENT_SUPPLIER_EVIDENCE_GATE: MasterIngredientSupplierEvidenceGateRow[] =
  UNIVERSAL_INGREDIENTS.map((ingredient) => {
    const identity = MASTER_INGREDIENT_IDENTITY_COVERAGE.find(row => row.ingredientId === ingredient.id);
    const route = resolveFunctionalRoutingForIngredient({ id: ingredient.id, name: ingredient.name });
    const routeStatus = route?.role === 'IDENTITY_UNRESOLVED' ? 'BLOCKED' as const
      : route ? 'ROUTED' as const : 'UNMAPPED' as const;
    const blockers = [
      ...(identity?.identityCoverageStatus !== 'EXACT_CAS_INCI_SSOT_MATCH'
        ? ['Exact CAS+INCI identity crosswalk is not established in the current identity SSOT']
        : []),
      ...(routeStatus === 'BLOCKED' ? ['Functional identity route is explicitly blocked by a catalog identity conflict'] : []),
      ...(!ingredient.manufacturer ? ['Actual manufacturer and manufacturing site not identified'] : []),
      ...(!ingredient.productName ? ['Exact supplier product code/grade not identified'] : []),
      ['Current grade-specific supplier TDS not received and reviewed'],
      ['Current grade-specific SDS not received and reviewed'],
      ['Matching received-lot CoA not received/authenticated'],
      ['Lot-specific active matter/solids/purity assay not verified'],
      ['No named-formula applicability testing record'],
      ['No documented formula-specific release decision']
    ].flat();
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      catalogClass: ingredient.category,
      casNumber: ingredient.casNumber,
      inciName: ingredient.inciName,
      identityCrosswalkStatus: identity?.identityCoverageStatus ?? 'NO_IDENTITY_COVERAGE_ROW',
      functionalRoutingClass: route?.routingClass ?? null,
      functionalRole: route?.role ?? null,
      chargeBehavior: route?.chargeBehavior ?? null,
      identityRouteStatus: routeStatus,
      supplierContactState: 'NOT_CONTACTED',
      supplierName: null,
      manufacturerName: ingredient.manufacturer ?? null,
      exactProductCode: ingredient.productName ?? null,
      supplierTdsState: 'NOT_PROVIDED',
      supplierSdsState: 'NOT_PROVIDED',
      lotCoAState: 'NOT_PROVIDED',
      lotNumber: null,
      lotAssayPct: null,
      assayBasis: null,
      formulaApplicabilityState: 'NOT_TESTED',
      namedFormulaId: null,
      blockers,
      releaseDecision: 'BLOCKED'
    };
  });

export function getMasterIngredientSupplierEvidenceGateSummary() {
  const rows = MASTER_INGREDIENT_SUPPLIER_EVIDENCE_GATE;
  return {
    ingredientCount: rows.length,
    uniqueIngredientIds: new Set(rows.map(row => row.ingredientId)).size,
    duplicateIngredientIds: rows.length - new Set(rows.map(row => row.ingredientId)).size,
    exactIdentityCrosswalkRows: rows.filter(row => row.identityCrosswalkStatus === 'EXACT_CAS_INCI_SSOT_MATCH').length,
    blockedIdentityRoutes: rows.filter(row => row.identityRouteStatus === 'BLOCKED').length,
    unmappedIdentityRoutes: rows.filter(row => row.identityRouteStatus === 'UNMAPPED').length,
    supplierTdsVerified: rows.filter(row => row.supplierTdsState === 'VERIFIED_FOR_EXACT_GRADE').length,
    supplierSdsVerified: rows.filter(row => row.supplierSdsState === 'VERIFIED_FOR_EXACT_GRADE').length,
    matchingLotCoAVerified: rows.filter(row => row.lotCoAState === 'VERIFIED_FOR_EXACT_GRADE').length,
    lotAssayVerified: rows.filter(row => row.lotAssayPct !== null).length,
    namedFormulaApplicabilityValidated: rows.filter(row => row.formulaApplicabilityState === 'VALIDATED_FOR_NAMED_FORMULA').length,
    supplierContacted: rows.filter(row => row.supplierContactState !== 'NOT_CONTACTED').length,
    releaseApproved: rows.filter(row => row.releaseDecision !== 'BLOCKED').length,
    totalBlockers: rows.reduce((sum, row) => sum + row.blockers.length, 0)
  };
}
