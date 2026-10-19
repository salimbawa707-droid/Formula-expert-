/**
 * ============================================================================
 * PHASE P2-13 — REAL LABORATORY OBSERVATION MODEL & METHOD REGISTRY
 * ============================================================================
 * Production-grade laboratory observation schema, data origin firewall,
 * measurement method registry, data quality gate, and deterministic formula
 * fingerprinting for the Detergent Formula Expert empirical validation system.
 * ============================================================================
 */

import { Productcategory13 } from './empiricalAccuracyFramework';

export type DataOrigin =
  | "REAL_LAB_MEASUREMENT"
  | "REAL_FIELD_MEASUREMENT"
  | "REFERENCE_STANDARD"
  | "LITERATURE_VALUE"
  | "SOURCE_BACKED_VALUE"
  | "SYNTHETIC_TEST_DATA"
  | "SIMULATED_DATA"
  | "UNKNOWN_ORIGIN";

export type DataQualityStatus =
  | "REJECTED"
  | "NEEDS_REVIEW"
  | "APPROVED_FOR_CALIBRATION"
  | "APPROVED_FOR_VALIDATION";

export type StandardOrganization =
  | "ASTM"
  | "AATCC"
  | "ISO"
  | "BIS"
  | "DIN"
  | "USER_DEFINED_METHOD";

export interface IngredientLotSnapshot {
  ingredientId: string;
  gradeId: string;
  lotId?: string;
  percentage: number;
  activeMatterPct?: number;
  supplier?: string;
}

export interface DetailedWaterProfile {
  hardnessPpm: number;
  calciumPpm?: number;
  magnesiumPpm?: number;
  alkalinityPpm?: number;
  chloridePpm?: number;
  sulfatePpm?: number;
  conductivityUsCm?: number;
  ph?: number;
}

export interface MeasurementMethod {
  methodId: string;
  methodName: string;
  standardOrganization: StandardOrganization;
  standardNumber: string;
  propertyMeasured: string;
  applicableCategories: Productcategory13[];
  sampleRequirements: string;
  units: string[];
  calculationMethod: string;
  acceptanceCriteria: string;
  instrumentRequirements: string;
  environmentalConditions: string;
  replicateRequirements: number;
  sourceProvenance: string;
  effectiveDate: string;
  supersededDate?: string;
}

export interface CompleteLaboratoryObservation {
  observationId: string;
  datasetId: string;
  formulaFingerprint: string;
  formulaVersionId: string;
  batchId: string;
  productCategory: Productcategory13;
  commercialMaterials: IngredientLotSnapshot[];
  waterProfile: DetailedWaterProfile;
  pH?: number;
  temperatureC: number;
  dosageGramsPerL: number;
  liquorRatio?: string;
  contactTimeMin: number;
  machineType?: string;
  machineModel?: string;
  machineProgram?: string;
  loadSizeKg?: number;
  soilType?: string;
  stainType?: string;
  fabricMaterial?: string;
  testMethodId: string;
  standardRef?: string;
  referenceFormulaId?: string;
  replicateNumber: number;
  measuredProperty: string;
  measuredValue: number;
  measurementUnit: string;
  rawMeasuredValue?: number;
  rawMeasurementUnit?: string;
  normalizedMeasuredValue?: number;
  normalizedMeasurementUnit?: string;
  replicateValues?: number[];
  sampleId?: string;
  formulaId?: string;
  datasetVersion?: string;
  quarantineReason?: string;
  reviewDecision?: {
    status: 'ACCEPTED' | 'QUARANTINED' | 'REJECTED';
    reviewer?: string;
    reviewDate?: string;
    notes?: string;
  };
  instrumentName?: string;
  instrumentId?: string;
  operator: string;
  laboratoryName: string;
  laboratoryLocation?: string;
  testDate: string;
  rawEvidenceRef?: string;
  uncertaintyValue?: number;
  evidenceIds: string[];
  notes?: string;
  provenanceStatus: string;
  dataQualityStatus: DataQualityStatus;
  dataOrigin: DataOrigin;
  auditTrail: string[];
}

export class MeasurementMethodRegistry {
  private static methods: Map<string, MeasurementMethod> = new Map();

  static {
    // Pre-populate industry standard laboratory test methods
    this.registerMethod({
      methodId: 'ASTM-D3050',
      methodName: 'Standard Guide for Measuring Soil Removal from Artificially Soiled Fabrics (not suitable for detergent ranking)',
      standardOrganization: 'ASTM',
      standardNumber: 'ASTM D3050-26',
      propertyMeasured: 'Cleaning Score / CPI',
      applicableCategories: ['LAUNDRY_LIQUID', 'LAUNDRY_POWDER'],
      sampleRequirements: 'Standardized artificially soiled swatches (pigment, sebum, protein, oil)',
      units: ['% Soil Removal', 'ΔE Reflectance', 'Score Index'],
      calculationMethod: 'Kubelka-Munk reflectance spectral evaluation K/S = (1-R)^2 / 2R',
      acceptanceCriteria: 'Screening only; soil selection and comparison protocol must be agreed and documented. Not suitable for detergent ranking.',
      instrumentRequirements: 'Spectrophotometer / Colorimeter D65 illuminate',
      environmentalConditions: '21°C ± 2°C, 50% RH',
      replicateRequirements: 3,
      sourceProvenance: 'ASTM D3050-26, DOI 10.1520/D3050-26; ASTM states this guide is not suitable for detergent ranking.',
      effectiveDate: '2026-04-16'
    });

    this.registerMethod({
      methodId: 'ASTM-D1172',
      methodName: 'Standard Guide for pH of Aqueous Solutions of Soaps and Detergents',
      standardOrganization: 'ASTM',
      standardNumber: 'ASTM D1172-15(2024)',
      propertyMeasured: 'pH Prediction',
      applicableCategories: [
        'LAUNDRY_LIQUID', 'LAUNDRY_POWDER', 'DISHWASH_MANUAL', 'DISHWASH_AUTOMATIC',
        'FLOOR_CLEANER', 'MULTIPURPOSE_CLEANER', 'TOILET_CLEANER', 'BATHROOM_CLEANER',
        'GLASS_CLEANER', 'FABRIC_SOFTENER', 'HAND_WASH', 'KITCHEN_DEGREASER', 'CAR_SHAMPOO'
      ],
      sampleRequirements: 'Prepare an aqueous solution according to the applicable D1172 procedure; record concentration and temperature.',
      units: ['pH units'],
      calculationMethod: 'Direct potentiometric Glass electrode reading',
      acceptanceCriteria: 'Replicate tolerance ± 0.05 pH units',
      instrumentRequirements: 'Calibrated pH Meter (NIST 4.01, 7.00, 10.01 buffers)',
      environmentalConditions: '25°C ± 0.5°C',
      replicateRequirements: 2,
      sourceProvenance: 'ASTM D1172-15(2024), active edition.',
      effectiveDate: '2024-01-12'
    });

    this.registerMethod({
      methodId: 'ASTM-D1298',
      methodName: 'Standard Test Method for Density, Relative Density, or API Gravity of Crude Petroleum and Liquid Petroleum Products by Hydrometer Method',
      standardOrganization: 'ASTM',
      standardNumber: 'ASTM D1298-24',
      propertyMeasured: 'Petroleum Density',
      applicableCategories: [],
      sampleRequirements: 'Crude petroleum and liquid petroleum products only; not registered for detergent products.',
      units: ['g/cm³', 'kg/m³', 'Specific Gravity'],
      calculationMethod: 'Hydrometer method for crude petroleum and liquid petroleum products only.',
      acceptanceCriteria: 'Not registered for detergent products; do not use for detergent validation.',
      instrumentRequirements: 'Hydrometer per the petroleum-product method scope.',
      environmentalConditions: '20°C ± 0.1°C',
      replicateRequirements: 2,
      sourceProvenance: 'ASTM D1298-24 scope is crude petroleum and liquid petroleum products; not applicable to detergent formulas.',
      effectiveDate: '2024-01-01'
    });

    this.registerMethod({
      methodId: 'ASTM-D2196',
      methodName: 'Standard Test Methods for Rheological Properties of Non-Newtonian Materials by Rotational Viscometer',
      standardOrganization: 'ASTM',
      standardNumber: 'ASTM D2196-20(2026)',
      propertyMeasured: 'Viscosity',
      applicableCategories: [
        'LAUNDRY_LIQUID', 'DISHWASH_MANUAL', 'DISHWASH_AUTOMATIC', 'FLOOR_CLEANER',
        'MULTIPURPOSE_CLEANER', 'TOILET_CLEANER', 'BATHROOM_CLEANER', 'GLASS_CLEANER',
        'FABRIC_SOFTENER', 'HAND_WASH', 'KITCHEN_DEGREASER', 'CAR_SHAMPOO'
      ],
      sampleRequirements: 'Report applicable method, geometry/spindle, speed or shear rate, sample preparation and test temperature; follow the selected D2196 procedure.',
      units: ['cP', 'mPa·s', 'Pa·s'],
      calculationMethod: 'Apparent viscosity measured by rotational viscometer under the selected ASTM D2196 procedure.',
      acceptanceCriteria: 'Replicates and uncertainty must be documented; ASTM D2196 does not supply a universal product pass threshold.',
      instrumentRequirements: 'Calibrated rotational viscometer with geometry and operating conditions recorded.',
      environmentalConditions: 'Record sample and instrument temperature for every measurement.',
      replicateRequirements: 3,
      sourceProvenance: 'ASTM D2196-20(2026), active edition.',
      effectiveDate: '2026-03-18'
    });

    this.registerMethod({
      methodId: 'ASTM-D1173',
      methodName: 'Standard Test Method for Foaming Properties of Surface-Active Agents (Ross-Miles)',
      standardOrganization: 'ASTM',
      standardNumber: 'ASTM D1173-07',
      propertyMeasured: 'Foam Profile',
      applicableCategories: ['LAUNDRY_LIQUID', 'LAUNDRY_POWDER', 'DISHWASH_MANUAL', 'HAND_WASH', 'CAR_SHAMPOO'],
      sampleRequirements: '200 mL surfactant solution 0.1% active in 50 ppm or 150 ppm hard water',
      units: ['mm Foam Height'],
      calculationMethod: 'Initial foam height at t=0 min and residual foam height at t=5 min',
      acceptanceCriteria: 'Replicate tolerance ± 5 mm',
      instrumentRequirements: 'Standard Ross-Miles Foam Pipette and Receiver Column',
      environmentalConditions: '25°C or 40°C ± 0.5°C',
      replicateRequirements: 3,
      sourceProvenance: 'ASTM International Vol 15.04',
      effectiveDate: '2007-01-01'
    });
  }

  public static registerMethod(method: MeasurementMethod): void {
    this.methods.set(method.methodId, method);
  }

  public static getMethod(methodId: string): MeasurementMethod | undefined {
    return this.methods.get(methodId);
  }

  public static getAllMethods(): MeasurementMethod[] {
    return Array.from(this.methods.values());
  }
}

export interface FormulaFingerprintInput {
  productCategory: string;
  physicalForm?: string;
  ingredients: Array<{
    ingredientId: string;
    gradeId?: string;
    commercialMaterial?: string;
    percentage: number;
    activeMatterPct?: number;
    role?: string;
  }>;
  formulaVersion?: string;
  targetPH?: number;
  waterHardnessPpm?: number;
  processSpecification?: string;
}

/**
 * Deterministically computes an immutable formula fingerprint.
 * Normalizes category, physical form, version, pH, water profile, process spec,
 * and sorts ingredients deterministically so input ordering does not alter fingerprint.
 */
export function computeDeterministicFormulaFingerprint(input: FormulaFingerprintInput): string {
  const category = (input.productCategory || 'UNKNOWN').trim().toUpperCase();
  const form = (input.physicalForm || 'UNSPECIFIED').trim().toUpperCase();
  const version = input.formulaVersion ? input.formulaVersion.trim() : 'VER:UNSPECIFIED';

  const sortedIngs = [...(input.ingredients || [])].sort((a, b) => {
    const idA = (a.ingredientId || '').trim().toLowerCase();
    const idB = (b.ingredientId || '').trim().toLowerCase();
    const idComp = idA.localeCompare(idB);
    if (idComp !== 0) return idComp;
    const gradeA = (a.gradeId || a.commercialMaterial || 'STD').trim().toUpperCase();
    const gradeB = (b.gradeId || b.commercialMaterial || 'STD').trim().toUpperCase();
    const gradeComp = gradeA.localeCompare(gradeB);
    if (gradeComp !== 0) return gradeComp;
    return (a.percentage || 0) - (b.percentage || 0);
  });

  const ingSignature = sortedIngs
    .map(i => {
      const id = (i.ingredientId || '').trim().toLowerCase();
      const grade = (i.gradeId || i.commercialMaterial || 'STD').trim().toUpperCase();
      const pct = Number(i.percentage || 0).toFixed(4);
      const active = Number(i.activeMatterPct !== undefined ? i.activeMatterPct : 100).toFixed(2);
      return `${id}@${grade}:${pct}%:${active}%`;
    })
    .join('|');

  const phStr = typeof input.targetPH === 'number' ? `pH:${input.targetPH.toFixed(2)}` : 'pH:UNSPECIFIED';
  const hardnessStr = typeof input.waterHardnessPpm === 'number' ? `H:${input.waterHardnessPpm.toFixed(1)}ppm` : 'H:UNSPECIFIED';
  const procStr = input.processSpecification ? `PROC:${input.processSpecification.trim().toUpperCase()}` : 'PROC:STD';

  const rawString = `CAT[${category}]|FORM[${form}]|VER[${version}]|INGS[${ingSignature}]|${phStr}|${hardnessStr}|${procStr}`;

  // FNV-1a 32-bit deterministic hash
  let hash = 0x811c9dc5;
  for (let i = 0; i < rawString.length; i++) {
    hash ^= rawString.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash = hash >>> 0;

  const hexHash = hash.toString(16).padStart(8, '0').toUpperCase();
  return `FP-${category.substring(0, 4)}-${hexHash}`;
}

/**
 * Data Quality Gate for validating incoming laboratory observations.
 */
export function validateLaboratoryObservation(obs: Partial<CompleteLaboratoryObservation>): {
  status: DataQualityStatus;
  errors: string[];
  warnings: string[];
  auditLog: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const auditLog: string[] = [`Audit initiated at ${new Date().toISOString()}`];

  // 1. Data Origin Firewall Inspection
  if (!obs.dataOrigin) {
    errors.push('CRITICAL: Missing dataOrigin classification.');
  } else if (
    obs.dataOrigin === 'SYNTHETIC_TEST_DATA' ||
    obs.dataOrigin === 'SIMULATED_DATA' ||
    obs.dataOrigin === 'UNKNOWN_ORIGIN'
  ) {
    errors.push(`FIREWALL REJECTION: Observations with origin ${obs.dataOrigin} are strictly forbidden from empirical calibration/validation datasets.`);
  }
  if (obs.dataOrigin && obs.dataOrigin !== 'REAL_LAB_MEASUREMENT') {
    warnings.push(`Origin ${obs.dataOrigin} is reference/field provenance, not an approved real-laboratory validation measurement.`);
  }

  // 2. Mandatory Identification Fields
  if (!obs.observationId) errors.push('Missing observationId.');
  if (!obs.datasetId) errors.push('Missing datasetId.');
  if (!obs.formulaFingerprint) errors.push('Missing formulaFingerprint.');
  if (!obs.batchId) errors.push('Missing batchId.');
  if (!obs.productCategory) errors.push('Missing productCategory.');
  if (!obs.laboratoryName) errors.push('Missing laboratoryName.');
  if (!obs.operator) errors.push('Missing operator identity.');
  if (!obs.testDate) errors.push('Missing testDate.');
  if (obs.dataOrigin === 'REAL_LAB_MEASUREMENT' && !obs.rawEvidenceRef) {
    errors.push('Real-lab measurement requires a raw evidence reference (for example, a controlled record ID or source file reference).');
  }
  if (obs.measuredProperty?.toLowerCase() === 'viscosity' && obs.testMethodId === 'ASTM-D2196' && (!obs.instrumentName || !obs.standardRef)) {
    errors.push('ASTM D2196 viscosity records require instrument details and the selected procedure/geometry reference.');
  }

  // 3. Measurement Method & Range Validation
  if (!obs.testMethodId) {
    errors.push('Missing testMethodId.');
  } else {
    const method = MeasurementMethodRegistry.getMethod(obs.testMethodId);
    if (!method) {
      warnings.push(`Unregistered test method ID: ${obs.testMethodId}. Classifying as unverified method.`);
    } else {
      const propertyAliases: Record<string, string[]> = {
        'pH Prediction': ['pH Prediction', 'pH'],
        'Cleaning Score / CPI': ['Cleaning Score / CPI', 'Cleaning Score', 'CPI']
      };
      const acceptedNames = propertyAliases[method.propertyMeasured] || [method.propertyMeasured];
      if (obs.measuredProperty && !acceptedNames.some(name => name.toLowerCase() === obs.measuredProperty!.toLowerCase())) {
        errors.push(`Method/property mismatch: ${method.methodId} measures '${method.propertyMeasured}', not '${obs.measuredProperty}'.`);
      }
      if (obs.productCategory && !method.applicableCategories.includes(obs.productCategory)) {
        errors.push(`Method/category mismatch: ${method.methodId} is not registered for '${obs.productCategory}'.`);
      }
    }
  }

  if (typeof obs.measuredValue !== 'number' || isNaN(obs.measuredValue) || !isFinite(obs.measuredValue)) {
    errors.push('Invalid, non-numeric, or non-finite measuredValue.');
  } else {
    if (obs.measuredProperty === 'pH Prediction' && (obs.measuredValue < 0 || obs.measuredValue > 14)) {
      errors.push(`Impossible physical value: pH ${obs.measuredValue} is outside 0-14 scale.`);
    }
    if (obs.measuredProperty === 'Density' && (obs.measuredValue < 0.5 || obs.measuredValue > 3.0)) {
      errors.push(`Impossible density value: ${obs.measuredValue} g/cm³.`);
    }
    if ((obs.measuredProperty === 'Active Matter' || obs.measuredProperty === 'Active Surfactant Matter') && (obs.measuredValue < 0 || obs.measuredValue > 100)) {
      errors.push(`Impossible active matter percentage: ${obs.measuredValue}%. Must be 0–100%.`);
    }
    if ((obs.measuredProperty === 'Cleaning Score / CPI' || obs.measuredProperty === 'Cleaning Score') && (obs.measuredValue < 0 || obs.measuredValue > 100)) {
      errors.push(`Impossible cleaning score: ${obs.measuredValue}. Must be 0–100.`);
    }
    if (obs.measuredProperty === 'Viscosity' && obs.measuredValue < 0) {
      errors.push(`Impossible negative viscosity: ${obs.measuredValue} cP.`);
    }
  }

  // 4. Environmental & Process Parameters Integrity
  if (typeof obs.replicateNumber !== 'number' || obs.replicateNumber < 1) {
    errors.push('Replicate number must be a positive integer starting at 1.');
  }
  if (!obs.waterProfile || typeof obs.waterProfile.hardnessPpm !== 'number') {
    errors.push('Water profile with explicit hardnessPpm is mandatory.');
  }
  if (typeof obs.contactTimeMin !== 'number' || isNaN(obs.contactTimeMin) || obs.contactTimeMin <= 0) {
    errors.push('Explicit contactTimeMin (positive number) is mandatory for empirical laboratory observation.');
  }
  if (typeof obs.temperatureC !== 'number' || isNaN(obs.temperatureC)) {
    errors.push('Explicit temperatureC is mandatory.');
  }
  if (typeof obs.dosageGramsPerL !== 'number' || isNaN(obs.dosageGramsPerL) || obs.dosageGramsPerL < 0) {
    errors.push('Explicit dosageGramsPerL is mandatory.');
  }
  if (!obs.formulaVersionId) {
    errors.push('Explicit formulaVersionId is mandatory.');
  }

  // Determine final quality status
  let status: DataQualityStatus = 'APPROVED_FOR_VALIDATION';
  if (errors.length > 0) {
    status = 'REJECTED';
    auditLog.push(`Quality Gate REJECTED observation due to ${errors.length} critical errors.`);
  } else if (warnings.length > 0) {
    status = 'NEEDS_REVIEW';
    auditLog.push(`Quality Gate flagged observation for REVIEW due to ${warnings.length} warnings.`);
  } else {
    auditLog.push('Quality Gate PASSED successfully. Approved for empirical calibration/validation.');
  }

  return { status, errors, warnings, auditLog };
}
