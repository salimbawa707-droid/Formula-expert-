import { FormulationIngredient } from '../../types';

export type ResultSource = 
  | 'MEASURED'
  | 'CALCULATED' 
  | 'PREDICTED' 
  | 'SCREENING'
  | 'ESTIMATED'
  | 'UNKNOWN' 
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_DATA';

export interface ScientificProperty<T> {
  value?: T;
  unit?: string;
  status: ResultSource;
  method?: string;
  source?: string;
  temperature?: number;
  testBasis?: string;
  notes?: string;
}

export type PowderFunctionalClass =
  | 'Anionic Surfactant'
  | 'Nonionic Surfactant'
  | 'Amphoteric Surfactant'
  | 'Cationic Surfactant'
  | 'Builder (Precipitation / Ion-Exchange)'
  | 'Chelating Agent / Soluble Sequestrant'
  | 'Alkalinity Contributor'
  | 'Filler / Bulking Agent'
  | 'Carrier'
  | 'Bleaching Agent'
  | 'Bleach Activator'
  | 'Optical Brightener'
  | 'Enzyme'
  | 'Anti-redeposition Polymer'
  | 'Soil Release Polymer'
  | 'Fragrance'
  | 'Colorant'
  | 'Processing Aid'
  | 'Anti-caking Agent'
  | 'Other';

export interface PowderMassBalanceReport {
  assignedPercentage: number;
  unassignedPercentage: number;
  formulaTotalPct: number;
  status: 'BALANCED' | 'INCOMPLETE' | 'EXCESS';
  missingPercentage: number;
  excessPercentage: number;
  statusMessage: string;
  source: ResultSource;
}

export interface ClassifiedIngredient {
  id?: string;
  name: string;
  inputPercentage: number;
  activeMatterPct?: number;
  functionalClass: PowderFunctionalClass;
  isSurfactant: boolean;
  isBuilder: boolean;
  isChelator: boolean;
  isAlkalinitySource: boolean;
  isFiller: boolean;
  costPerKg: number;
  hygroscopicity?: 'Low' | 'Moderate' | 'High' | 'Unknown';
  inherentMoistureFraction?: number;
}

export interface FunctionalGroupSummary {
  functionalClass: PowderFunctionalClass;
  totalPercentage: number;
  ingredientCount: number;
  ingredientNames: string[];
}

export interface PowderActiveMatterReport {
  totalSurfactantActivePct: number;
  anionicActivePct: number;
  nonionicActivePct: number;
  amphotericActivePct: number;
  cationicActivePct: number;
  hasInsufficientData: boolean;
  unresolvedIngredients: string[];
  breakdown: Array<{
    name: string;
    inputPct: number;
    gradePct: number;
    activeContributionPct: number;
    calculationBasis: string;
    functionalClass: string;
  }>;
  source: ResultSource;
}

export interface PowderMoistureContribution {
  name: string;
  percentageInFormula: number;
  ingredientMoisturePct: number;
  moistureContributionPct: number;
  status: ResultSource;
}

export interface PowderMoistureReport {
  totalFormulaMassKg: number;
  moistureMassKg: number;
  dryMatterMassKg: number;
  inherentMoisturePct: number; // for backward-compat
  moisturePct: number;
  dryMatterPct: number;
  moistureStatus: ResultSource;
  dryMatterStatus: ResultSource;
  testMethod: string;
  sampleMassG?: number;
  dryingTempC?: number;
  dryingTimeMin?: number;
  basisExplanation: string;
  ingredientMoistureContributions: PowderMoistureContribution[];
  source: ResultSource;
}

export interface PowderBuilderReport {
  totalBuilderPct: number;
  builderIngredients: Array<{
    name: string;
    percentage: number;
    type: string;
    mechanism: 'Precipitation' | 'Ion-Exchange' | 'Polymeric Co-Builder' | 'Other';
  }>;
  mechanism: string;
  notes: string;
  source: ResultSource;
}

export interface PowderChelationReport {
  totalChelatorPct: number;
  chelatorIngredients: Array<{
    name: string;
    percentage: number;
    type: string;
    capacityStatus: string;
    capacityMgPerGram?: number;
  }>;
  hasValidatedData: boolean;
  calciumCapacityMgPerGram?: number;
  calciumCapacityMgPerDose?: number;
  capacityStatus: string;
  source: ResultSource;
}

export interface PowderAlkalinityReport {
  totalAlkalineContributorsPct: number;
  alkalineIngredients: Array<{
    name: string;
    percentage: number;
    contributionNa2O?: number;
  }>;
  estimatedNa2OEquivalentPct?: number;
  measuredAlkalinityPctNa2O?: number;
  measuredAlkalinityMethod?: string;
  alkalineReserveStatus: string;
  source: ResultSource;
}

export interface PowderDensityReport {
  measuredBulkDensityGPerL?: number;
  measuredTappedDensityGPerL?: number;
  sampleMassG?: number;
  looseVolumeMl?: number;
  tappedVolumeMl?: number;
  bulkDensityGPerMl?: number; // g/mL or kg/L
  tappedDensityGPerMl?: number;
  bulkDensityKgPerM3?: number; // kg/m³
  tappedDensityKgPerM3?: number;
  bulkDensityGPerCm3?: number;
  tappedDensityGPerCm3?: number;
  densityType: 'MEASURED' | 'SCREENING_ESTIMATE' | 'NOT_MEASURED';
  displayRange: string;
  method?: string;
  source: ResultSource;
  notes: string;
}

export interface PowderCarrIndexReport {
  carrIndexPct?: number;
  status: ResultSource;
  calculationBasis: string;
  flowRating: 'Excellent' | 'Good' | 'Fair' | 'Passable' | 'Poor (Cohesive)' | 'Very Poor' | 'Not Measured' | 'Insufficient Data';
}

export interface PowderHausnerRatioReport {
  hausnerRatio?: number;
  status: ResultSource;
  calculationBasis: string;
}

export interface PowderFlowabilityReport {
  flowType: 'CALCULATED_INDICATOR' | 'MEASURED_FLOW_TEST' | 'SCREENING' | 'INSUFFICIENT_DATA';
  carrIndexPct?: number;
  hausnerRatio?: number;
  flowRating: 'Excellent' | 'Good' | 'Fair' | 'Passable' | 'Poor (Cohesive)' | 'Very Poor' | 'Not Measured';
  description: string;
  source: ResultSource;
}

export interface PowderAngleOfReposeReport {
  measuredAngleDegrees?: number;
  measuredHeightMm?: number;
  measuredRadiusMm?: number;
  method?: string;
  rating: 'Free Flowing (<30°)' | 'Standard Flow (30°-38°)' | 'Fair Flow (38°-45°)' | 'Cohesive (45°-55°)' | 'Very Cohesive (>55°)' | 'Not Measured';
  source: ResultSource;
}

export interface PowderParticleSizeReport {
  measuredD10Um?: number;
  measuredD50Um?: number;
  measuredD90Um?: number;
  finesFractionUnder150UmPct?: number;
  coarseFractionOver1000UmPct?: number;
  testMethod?: string;
  status: 'MEASURED' | 'NOT_MEASURED' | 'INSUFFICIENT_DATA';
  dustinessRisk: 'Low' | 'Moderate' | 'High' | 'Unknown';
  source: ResultSource;
}

export interface PowderCakingReport {
  cakingRisk: 'Low Risk' | 'Moderate Risk' | 'High Caking Risk' | 'Insufficient Data';
  screeningTitle: string;
  liquidLoadingPct: number;
  hygroscopicSaltPct: number;
  antiCakingAgentPresent: boolean;
  ambientHumidityPct?: number;
  storageTempC?: number;
  packagingRecommendation: string;
  hasSufficientData: boolean;
  source: ResultSource;
}

export interface PowderHygroscopicityReport {
  hygroscopicityRating: 'Low' | 'Moderate' | 'High' | 'Unknown';
  ingredientBreakdown: Array<{
    name: string;
    percentage: number;
    hygroscopicity: 'Low' | 'Moderate' | 'High' | 'Unknown';
  }>;
  source: ResultSource;
}

export interface PowderSlurryBasis {
  powderMassG: number;
  waterMassG: number;
  slurryPercent: number; // e.g. 1.0 for 1%
  isWeightByWeight: boolean; // false for w/v, true for w/w
  finalVolumeMl?: number;
  temperatureC: number;
  preparationAssumptions: string[];
  equilibrationTimeMin: number;
  measurementBasis: string;
}

export interface PowderPHReport {
  testBasis: {
    sampleConcentrationPct: number; // e.g. 1.0% w/v aqueous solution
    waterVolumeMl: number;
    sampleMassG: number;
    temperatureC: number;
    solutionHardnessPpm: number;
    waterQuality: string;
    equilibrationTimeMin: number;
    method: string;
  };
  slurryBasis?: PowderSlurryBasis;
  measuredPH?: number;
  calculatedAqueousPH: number;
  targetRange: {
    min?: number;
    max?: number;
    label: string;
    isSpecified: boolean;
  };
  isWithinTarget: boolean;
  statusMessage: string;
  isAlkalineIntended: boolean;
  source: ResultSource;
  nonAuthoritativeHeuristicPH?: number;
}

export interface PowderHardWaterReport {
  waterHardnessDemandPpm: number;
  washDoseG: number;
  washVolumeL: number;
  builderProtectionRating: 'Sufficient Protection' | 'Moderate / Borderline' | 'Insufficient Builder Loading' | 'Insufficient validated data';
  anionicSensitivityRisk: 'Protected by Builders' | 'Vulnerable to Ca2+ Precipitation' | 'Insufficient validated data';
  details: string;
  source: ResultSource;
}

export interface PowderDissolutionReport {
  testConditions?: {
    doseGPerL: number;
    waterVolumeMl: number;
    waterTempC: number;
    waterHardnessPpm: number;
    agitationMethod: string;
    agitationRpm?: number;
    measuredDissolutionTimeSec?: number;
    measuredUndissolvedResiduePct?: number;
    undissolvedMaterialNotes?: string;
  };
  dissolutionStatus: 'MEASURED' | 'NOT_MEASURED';
  dispersibilityStatus: 'MEASURED' | 'PREDICTED' | 'NOT_MEASURED';
  dispersibilityObservation?: 'fully dispersed' | 'partially dispersed' | 'floating' | 'sediment' | 'agglomeration' | 'residue' | 'not observed';
  dispersibilityNotes?: string;
  predictedColdWaterSolubility: 'Fast Dissolving (<60s)' | 'Moderate (60-180s)' | 'Slow / High Insoluble Solids' | 'Unassessed';
  hasInsolubleInorganics: boolean;
  insolubleInorganicNames: string[];
  source: ResultSource;
}

export interface PowderFoamReport {
  screeningFoamProfile: 'High Foam (Manual/Top Load)' | 'Controlled / Low Foam (Front Load Matic)' | 'Moderate Foam';
  measuredRossMilesInitialMm?: number;
  measuredRossMiles5MinMm?: number;
  source: ResultSource;
}

export interface PowderCleaningReport {
  screeningDetergencyScore: number; // 0 - 100
  measuredSoilRemovalPct?: number;
  particulateRemovalScore: number;
  oilyGreaseScore: number;
  enzymaticStainScore: number;
  bleachableStainScore: number;
  evaluationBasis: string;
  source: ResultSource;
}

export interface PowderStabilityReport {
  moistureAbsorptionSensitivity: 'Low' | 'Moderate' | 'High';
  fragranceStabilityRating: 'Stable in Alkaline Matrix' | 'Fragrance Bleed / Oxidation Risk';
  enzymeBleachCompatibility: 'Compatible' | 'Bleach Deactivates Enzymes' | 'Bleach Activated (High Enzyme Deactivation Risk)' | 'No Bleach / Enzyme Present';
  storageGuidelines: string;
  source: ResultSource;
}

export interface PowderSafetyReport {
  formalGHSStatus: 'INSUFFICIENT_DATA (Requires Supplier SDS Dossiers)' | 'AVAILABLE';
  formalGHSClassification: string;
  hasInsufficientFormalGHSData: boolean;
  screeningSignalWord: 'DANGER' | 'WARNING' | 'CAUTION' | 'NONE';
  screeningHazardAdvisories: string[];
  recommendedPPE: string[];
  handlingPrecautions: string[];
  regulatoryDisclaimer: string;
  ghsHazardClasses: string[];
  signalWord: 'DANGER' | 'WARNING' | 'NONE';
  hazardStatements: string[];
  precautionaryStatements: string[];
  hasInsufficientSafetyData: boolean;
  source: ResultSource;
}

export interface PowderCostingReport {
  costPerKg: number;
  totalBatchCost: number;
  batchSizeKg: number;
  costPerWashDose: number; // e.g. 50g dose
  hasZeroCostIngredients: boolean;
  ingredientCostContributions: Array<{
    name: string;
    percentage: number;
    costPerKg: number;
    costContribution: number;
    costPercentage: number;
  }>;
  source: ResultSource;
}

export interface PowderVerdictStrength {
  title: string;
  description: string;
}

export interface PowderVerdictIssue {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  actionableGuidance: string;
}

export interface PowderVerdictReport {
  overallStatus: 'BALANCED & COMPLIANT' | 'INCOMPLETE FORMULA' | 'EXCESS FORMULA' | 'NEEDS ADJUSTMENT' | 'OUT OF SPEC';
  summary: string;
  strengths: PowderVerdictStrength[];
  issues: PowderVerdictIssue[];
  chemistAdvisories: string[];
  source: ResultSource;
}

export interface PowderLabMeasurementInputs {
  // Density & Flow
  measuredBulkDensityGPerL?: number;
  measuredTappedDensityGPerL?: number;
  measuredSampleMassG?: number;
  measuredLooseVolumeMl?: number;
  measuredTappedVolumeMl?: number;
  measuredAngleOfReposeDegrees?: number;
  measuredAngleHeightMm?: number;
  measuredAngleRadiusMm?: number;

  // Moisture & Dry Matter
  measuredMoisturePct?: number;
  moistureTestMethod?: string;
  moistureSampleMassG?: number;
  moistureTempC?: number;
  moistureTimeMin?: number;

  // Particle Size Distribution
  measuredD10Um?: number;
  measuredD50Um?: number;
  measuredD90Um?: number;
  measuredFinesPct?: number;
  measuredCoarsePct?: number;
  psdTestMethod?: string;

  // Aqueous Solution pH & Alkalinity
  measured1PctAqueousPH?: number;
  customPHConcentrationPct?: number;
  customPHTargetMin?: number;
  customPHTargetMax?: number;
  customPHTargetLabel?: string;
  measuredReserveAlkalinityPctNa2O?: number;

  // Dissolution & Dispersibility
  measuredDissolutionTimeSec?: number;
  measuredUndissolvedResiduePct?: number;
  dispersibilityObservation?: 'fully dispersed' | 'partially dispersed' | 'floating' | 'sediment' | 'agglomeration' | 'residue' | 'not observed';
  dispersibilityNotes?: string;
  dissolutionWaterTempC?: number;
  dissolutionAgitationRpm?: number;

  // Performance & Foam
  measuredSoilRemovalPct?: number;
  measuredRossMilesInitialMm?: number;
  measuredRossMiles5MinMm?: number;
}

export interface PowderEngineInput {
  ingredients: FormulationIngredient[];
  productCategory?: string;
  batchSizeKg?: number;
  waterHardnessPpm?: number;
  washDoseG?: number;
  washLiquorVolumeL?: number;
  labMeasurements?: PowderLabMeasurementInputs;
}

export interface PowderFormulationReport {
  massBalance: PowderMassBalanceReport;
  classification: {
    ingredients: ClassifiedIngredient[];
    groupSummaries: FunctionalGroupSummary[];
  };
  activeMatter: PowderActiveMatterReport;
  moistureAndDryMatter: PowderMoistureReport;
  builderSystem: PowderBuilderReport;
  chelationSequestration: PowderChelationReport;
  alkalinity: PowderAlkalinityReport;
  density: PowderDensityReport;
  flowability: PowderFlowabilityReport;
  angleOfRepose: PowderAngleOfReposeReport;
  particleSize: PowderParticleSizeReport;
  cakingHygroscopicity: PowderCakingReport;
  hygroscopicity: PowderHygroscopicityReport;
  powderPH: PowderPHReport;
  hardWater: PowderHardWaterReport;
  dissolutionDispersibility: PowderDissolutionReport;
  foam: PowderFoamReport;
  cleaningPerformance: PowderCleaningReport;
  stability: PowderStabilityReport;
  safety: PowderSafetyReport;
  costing: PowderCostingReport;
  verdict: PowderVerdictReport;
}
