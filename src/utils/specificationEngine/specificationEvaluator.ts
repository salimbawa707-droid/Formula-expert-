import {
  SpecificationParameter,
  SpecificationEvaluationItem,
  SpecificationReport,
  ExpertSpecificationVerdict,
  TargetGapItem,
  FormulationRecommendation,
  LabMeasurementRecord,
  OverallVerdictStatus,
  SpecificationStatus,
  ResultSource
} from './types';
import { isValidNumber, formatParameterValue } from './unitConversions';
import { aggregateLabReplicates, getAuthoritativeLabValue } from './labDataManager';
import { PowderFormulationReport } from '../powderEngine/types';
import { FormulaCostReport } from '../costingEngine';
import { isPowderCategory } from '../formulationEngineRouter';
import { normalizeProductCategory } from '../../domain/productTaxonomy';

export const POWDER_ONLY_PARAMETER_KEYS = new Set<string>([
  'bulkDensity',
  'looseBulkDensity',
  'tappedDensity',
  'tappedBulkDensity',
  'dissolutionTime',
  'dissolutionTimeSec',
  'undissolvedResidue',
  'carrIndex',
  'carrCompressibility',
  'hausnerRatio',
  'angleRepose',
  'angleReposeDeg',
  'moisture',
  'moisturePct',
  'dryMatter',
  'dryMatterPct',
  'finesPct',
  'dustiness',
  'powderPH',
  'powderAlkalinity'
]);

export const LIQUID_ONLY_PARAMETER_KEYS = new Set<string>([
  'liquidNVR',
  'liquidNvr',
  'nvr',
  'viscosity'
]);

/**
 * Validates if a specification parameter is scientifically applicable for the given product category and physical form.
 */
export function isParameterApplicableForCategory(paramKey: string, category?: string): boolean {
  const normCategory = normalizeProductCategory(category);
  if (paramKey === 'ph' && normCategory === 'LAUNDRY_POWDER') {
    return false;
  }
  if (paramKey === 'powderPH' && normCategory !== 'LAUNDRY_POWDER') {
    return false;
  }
  const isPowder = isPowderCategory(category);
  if (!isPowder && POWDER_ONLY_PARAMETER_KEYS.has(paramKey)) {
    return false;
  }
  if (isPowder && LIQUID_ONLY_PARAMETER_KEYS.has(paramKey)) {
    return false;
  }
  return true;
}

export interface EvaluationInput {
  formulaId?: string;
  formulaName: string;
  formulaVersion: string;
  productCategory: string;
  parameters: SpecificationParameter[];
  labMeasurements: LabMeasurementRecord[];
  powderReport?: PowderFormulationReport | null;
  costReport?: FormulaCostReport | null;
  liquidResults?: {
    pH?: number;
    activeSurfactants?: number;
    totalPercentage?: number;
    viscosity?: string | number;
    density?: number;
    liquidNVR?: number;
    liquidNVRComplete?: boolean;
    nvrCoveragePct?: number;
    costPerKg?: number;
  } | null;
}

/**
 * Extracts the raw numerical value and result source for a given parameter key
 * prioritizing measured laboratory data over calculations and predictions.
 */
export function extractParameterValue(
  paramKey: string,
  input: EvaluationInput
): { value: number | undefined; provenance: ResultSource; isMeasured: boolean; testBasis?: string } {
  // 1. Check Authoritative Laboratory Measurements for this formula version
  const labMatch = getAuthoritativeLabValue(paramKey, input.labMeasurements);
  if (labMatch && isValidNumber(labMatch.value)) {
    return {
      value: labMatch.value,
      provenance: 'MEASURED',
      isMeasured: true,
      testBasis: labMatch.testBasis
    };
  }

  // 2. Powder Engine Report Outputs
  if (input.powderReport && isPowderCategory(input.productCategory)) {
    const pr = input.powderReport as any;
    switch (paramKey) {
      case 'massBalance':
        const massTotal = pr.massBalance?.formulaTotalPct ?? pr.massBalance?.assignedPercentage ?? pr.massBalance?.totalPercentage;
        return { value: massTotal, provenance: pr.massBalance?.source || 'CALCULATED', isMeasured: false };
      case 'activeMatter':
        const activeTotal = pr.activeMatter?.totalSurfactantActivePct ?? pr.activeMatter?.totalActiveMatterPct;
        return { value: activeTotal, provenance: pr.activeMatter?.source || 'CALCULATED', isMeasured: false };
      case 'ph':
      case 'powderPH':
        if (pr.powderPH?.measuredPH !== undefined) {
          return { value: pr.powderPH.measuredPH, provenance: 'MEASURED', isMeasured: true, testBasis: pr.powderPH.testBasis?.method };
        }
        if (pr.phHardWater?.measuredPH !== undefined) {
          return { value: pr.phHardWater.measuredPH, provenance: 'MEASURED', isMeasured: true, testBasis: pr.phHardWater.aqueousTestBasis?.method };
        }
        const calcPH = pr.powderPH?.calculatedAqueousPH ?? pr.phHardWater?.calculatedAqueousPH;
        return { value: calcPH, provenance: pr.powderPH?.source || pr.phHardWater?.source || 'CALCULATED', isMeasured: false, testBasis: pr.powderPH?.testBasis?.method || '1.0% w/v in demineralized water' };
      case 'moisture':
      case 'moisturePct':
        const moist = pr.moistureAndDryMatter?.moisturePct ?? pr.massBalance?.moisturePct;
        const moistSource = pr.moistureAndDryMatter?.source || pr.massBalance?.moistureSource || 'ESTIMATED';
        return { value: moist, provenance: moistSource, isMeasured: moistSource === 'MEASURED' };
      case 'dryMatter':
      case 'dryMatterPct':
        const dry = pr.moistureAndDryMatter?.dryMatterPct ?? pr.massBalance?.dryMatterPct;
        const drySource = pr.moistureAndDryMatter?.source || pr.massBalance?.dryMatterSource || 'ESTIMATED';
        return { value: dry, provenance: drySource, isMeasured: drySource === 'MEASURED' };
      case 'bulkDensity':
        if (pr.density?.bulkDensityGPerMl !== undefined) {
          return { value: pr.density.bulkDensityGPerMl, provenance: pr.density.source, isMeasured: pr.density.densityType === 'MEASURED' };
        }
        if (pr.density?.measuredBulkDensityGPerMl !== undefined) {
          return { value: pr.density.measuredBulkDensityGPerMl, provenance: 'MEASURED', isMeasured: true };
        }
        return { value: pr.density?.predictedBulkDensityGPerMl, provenance: pr.density?.source || 'PREDICTED', isMeasured: false };
      case 'tappedDensity':
        if (pr.density?.tappedDensityGPerMl !== undefined) {
          return { value: pr.density.tappedDensityGPerMl, provenance: pr.density.source, isMeasured: pr.density.densityType === 'MEASURED' };
        }
        if (pr.density?.measuredTappedDensityGPerMl !== undefined) {
          return { value: pr.density.measuredTappedDensityGPerMl, provenance: 'MEASURED', isMeasured: true };
        }
        return { value: pr.density?.predictedTappedDensityGPerMl, provenance: pr.density?.source || 'PREDICTED', isMeasured: false };
      case 'carrIndex':
        const carr = pr.flowability?.carrIndexPct;
        return { value: carr, provenance: pr.flowability?.source || 'CALCULATED', isMeasured: pr.flowability?.source === 'MEASURED' };
      case 'hausnerRatio':
        const hausner = pr.flowability?.hausnerRatio;
        return { value: hausner, provenance: pr.flowability?.source || 'CALCULATED', isMeasured: pr.flowability?.source === 'MEASURED' };
      case 'angleRepose':
      case 'angleReposeDeg':
        const angle = pr.angleOfRepose?.measuredAngleDegrees ?? pr.flowability?.angleReposeDeg;
        return { value: angle, provenance: pr.angleOfRepose?.source || 'SCREENING', isMeasured: pr.angleOfRepose?.source === 'MEASURED' };
      case 'dissolutionTime':
      case 'dissolutionTimeSec':
        if (pr.dissolutionDispersibility?.testConditions?.measuredDissolutionTimeSec !== undefined) {
          return { value: pr.dissolutionDispersibility.testConditions.measuredDissolutionTimeSec, provenance: 'MEASURED', isMeasured: true };
        }
        if (pr.dissolution?.measuredDissolutionTimeSec !== undefined) {
          return { value: pr.dissolution.measuredDissolutionTimeSec, provenance: 'MEASURED', isMeasured: true };
        }
        return { value: undefined, provenance: 'INSUFFICIENT_DATA', isMeasured: false };
      case 'undissolvedResidue':
        if (pr.dissolutionDispersibility?.testConditions?.measuredUndissolvedResiduePct !== undefined) {
          return { value: pr.dissolutionDispersibility.testConditions.measuredUndissolvedResiduePct, provenance: 'MEASURED', isMeasured: true };
        }
        if (pr.dissolution?.measuredUndissolvedResiduePct !== undefined) {
          return { value: pr.dissolution.measuredUndissolvedResiduePct, provenance: 'MEASURED', isMeasured: true };
        }
        return { value: undefined, provenance: 'INSUFFICIENT_DATA', isMeasured: false };
      case 'finesPct':
      case 'dustiness':
        const fines = pr.particleSize?.finesFractionUnder150UmPct ?? pr.psd?.percentFinesBelow150Um;
        if (fines !== undefined) {
          return { value: fines, provenance: pr.particleSize?.source || 'SCREENING', isMeasured: pr.particleSize?.source === 'MEASURED' };
        }
        return { value: undefined, provenance: 'INSUFFICIENT_DATA', isMeasured: false };
      case 'alkalinityNa2O':
        const alkMeas = pr.alkalinity?.measuredAlkalinityPctNa2O ?? pr.builderChelation?.measuredAlkalinityPctNa2O;
        if (alkMeas !== undefined) {
          return { value: alkMeas, provenance: 'MEASURED', isMeasured: true };
        }
        const alkEst = pr.alkalinity?.estimatedNa2OEquivalentPct ?? pr.builderChelation?.estimatedNa2OEquivalentPct;
        return { value: alkEst, provenance: pr.alkalinity?.source || 'CALCULATED', isMeasured: false };
      case 'costPerKg':
        return { value: pr.costing?.costPerKg, provenance: pr.costing?.isPricingComplete !== false ? 'CALCULATED' : 'ESTIMATED', isMeasured: false };
      case 'totalBatchCost':
        return { value: pr.costing?.totalBatchCost, provenance: pr.costing?.isPricingComplete !== false ? 'CALCULATED' : 'ESTIMATED', isMeasured: false };
      case 'costPerWash':
      case 'costPerWashDose':
        return { value: pr.costing?.costPerWashDose, provenance: pr.costing?.isPricingComplete !== false ? 'CALCULATED' : 'ESTIMATED', isMeasured: false };
      case 'foamHeightInitial':
        const foamVal = pr.foam?.measuredRossMilesInitialMm;
        if (foamVal !== undefined) {
          return { value: foamVal, provenance: 'MEASURED', isMeasured: true };
        }
        return { value: undefined, provenance: pr.foam?.source || 'SCREENING', isMeasured: false };
      case 'cleaningScore':
        const cleanMeas = pr.cleaningPerformance?.measuredSoilRemovalPct ?? pr.cleaning?.measuredOverallScore;
        if (cleanMeas !== undefined) {
          return { value: cleanMeas, provenance: 'MEASURED', isMeasured: true };
        }
        const cleanScore = pr.cleaningPerformance?.screeningDetergencyScore ?? pr.cleaning?.predictedOverallDetergencyScore;
        return { value: cleanScore, provenance: pr.cleaningPerformance?.source || 'SCREENING', isMeasured: false };
    }
  }

  // 3. Liquid Engine Outputs (if liquid)
  if (input.liquidResults) {
    switch (paramKey) {
      case 'massBalance':
        return { value: input.liquidResults.totalPercentage, provenance: 'CALCULATED', isMeasured: false };
      case 'activeMatter':
        return { value: input.liquidResults.activeSurfactants, provenance: 'CALCULATED', isMeasured: false };
      case 'ph':
        return { value: input.liquidResults.pH, provenance: 'CALCULATED', isMeasured: false };
      case 'density':
        if (input.liquidResults.density !== undefined && input.liquidResults.density > 0 && isValidNumber(input.liquidResults.density)) {
          return { value: input.liquidResults.density, provenance: 'CALCULATED', isMeasured: false };
        }
        break;
      case 'viscosity':
        // Brookfield finished-product viscosity requires physical laboratory testing
        break;
      case 'liquidNVR':
      case 'liquidNvr':
      case 'nvr':
        if (input.liquidResults.liquidNVRComplete === false) {
          return { value: undefined, provenance: 'INSUFFICIENT_DATA', isMeasured: false };
        }
        if (input.liquidResults.liquidNVR !== undefined && input.liquidResults.liquidNVR > 0 && isValidNumber(input.liquidResults.liquidNVR)) {
          return { value: input.liquidResults.liquidNVR, provenance: 'CALCULATED', isMeasured: false };
        }
        break;
      case 'costPerKg':
        if (input.costReport) {
          return { value: input.costReport.costPerKg, provenance: input.costReport.isComplete ? 'CALCULATED' : 'ESTIMATED', isMeasured: false };
        }
        return { value: input.liquidResults.costPerKg, provenance: 'CALCULATED', isMeasured: false };
    }
  }

  // 4. Standalone Costing Report
  if (input.costReport) {
    if (paramKey === 'costPerKg') {
      return { value: input.costReport.costPerKg, provenance: input.costReport.isComplete ? 'CALCULATED' : 'ESTIMATED', isMeasured: false };
    }
    if (paramKey === 'totalBatchCost') {
      return { value: input.costReport.totalBatchCost, provenance: input.costReport.isComplete ? 'CALCULATED' : 'ESTIMATED', isMeasured: false };
    }
  }

  return { value: undefined, provenance: 'INSUFFICIENT_DATA', isMeasured: false };
}

/**
 * Evaluates all parameters against the provided specifications.
 */
export function evaluateSpecifications(input: EvaluationInput): SpecificationReport {
  const activeParams = input.parameters.filter(p => p.isActive && isParameterApplicableForCategory(p.parameterKey, input.productCategory));
  const evaluationItems: SpecificationEvaluationItem[] = [];
  const gapItems: TargetGapItem[] = [];
  const recommendations: FormulationRecommendation[] = [];

  for (const param of activeParams) {
    const { value, provenance, isMeasured, testBasis } = extractParameterValue(param.parameterKey, input);
    
    let status: SpecificationStatus = 'TARGET_NOT_DEFINED';
    let statusMessage = '';
    let targetMet = false;
    let gap: number | undefined = undefined;
    let gapDisplay = 'N/A';
    let gapDirection: TargetGapItem['direction'] = 'NO_TARGET';

    const hasMin = param.min !== undefined && isValidNumber(param.min);
    const hasMax = param.max !== undefined && isValidNumber(param.max);
    const hasTarget = param.target !== undefined && isValidNumber(param.target);

    if (value === undefined || !isValidNumber(value)) {
      if (param.requiresLabMeasurement) {
        status = 'NOT_TESTED';
        statusMessage = `Requires physical laboratory test (${param.testBasis || 'Standard Test'}).`;
      } else {
        status = 'INSUFFICIENT_DATA';
        statusMessage = 'Insufficient scientific data available for evaluation.';
      }
      gapDisplay = 'INSUFFICIENT_DATA';
    } else {
      // Calculate mathematical gap to target if target exists
      if (hasTarget) {
        gap = value - param.target!;
        const sign = gap > 0 ? '+' : '';
        gapDisplay = `${sign}${gap.toFixed(2)} ${param.unit === 'none' ? '' : param.unit}`.trim();
        if (Math.abs(gap) < 0.001) {
          gapDirection = 'ON_TARGET';
        } else if (gap < 0) {
          gapDirection = 'BELOW_TARGET';
        } else {
          gapDirection = 'ABOVE_TARGET';
        }
      }

      // Check min / max bounds
      if (hasMin && value < param.min!) {
        status = 'OUT_OF_SPEC';
        statusMessage = `Below minimum threshold (Value: ${value.toFixed(2)}, Min: ${param.min}).`;
        gapDirection = 'OUT_OF_BOUNDS';
      } else if (hasMax && value > param.max!) {
        status = 'OUT_OF_SPEC';
        if (param.parameterKey === 'costPerKg') {
          statusMessage = `Raw-material cost ₹${value.toFixed(2)}/kg exceeds maximum specification ₹${param.max}/kg.`;
        } else {
          statusMessage = `Exceeds maximum threshold (Value: ${value.toFixed(2)}, Max: ${param.max}).`;
        }
        gapDirection = 'OUT_OF_BOUNDS';
      } else if (hasMin || hasMax) {
        // Value is within bounds
        if (hasTarget) {
          if (Math.abs(value - param.target!) < 0.01) {
            status = 'PASS';
            targetMet = true;
            statusMessage = `Satisfies specification range and meets exact target (${param.target}).`;
          } else {
            status = 'PASS';
            targetMet = false;
            statusMessage = `Within specification range; target value ${param.target}${param.unit !== 'none' ? ' ' + param.unit : ''} not reached.`;
          }
        } else {
          status = 'PASS';
          targetMet = true;
          statusMessage = `Within specification range (${param.min ?? '-'} to ${param.max ?? '-'}).`;
        }
      } else if (hasTarget) {
        // Only target defined (no min/max)
        if (Math.abs(value - param.target!) < 0.01) {
          status = 'PASS';
          targetMet = true;
          statusMessage = `Meets target value (${param.target}).`;
        } else {
          status = 'TARGET_NOT_MET';
          targetMet = false;
          statusMessage = `Target not reached (Value: ${value.toFixed(2)}, Target: ${param.target}).`;
        }
      } else {
        status = 'TARGET_NOT_DEFINED';
        statusMessage = 'No target or specification limits defined for this parameter.';
      }
    }

    const valueDisplay = formatParameterValue(value, param.unit);
    const targetDisplay = formatParameterValue(param.target, param.unit);

    const evalItem: SpecificationEvaluationItem = {
      parameterKey: param.parameterKey,
      parameterName: param.parameterName,
      criticality: param.criticality,
      target: param.target,
      min: param.min,
      max: param.max,
      unit: param.unit,
      currentValue: value,
      currentValueDisplay: valueDisplay,
      provenance,
      status,
      statusMessage,
      targetMet,
      gap,
      gapDisplay,
      testBasis: testBasis || param.testBasis,
      source: param.source,
      isMeasured,
      requiresLabMeasurement: !!param.requiresLabMeasurement
    };

    evaluationItems.push(evalItem);

    if (hasTarget || hasMin || hasMax) {
      gapItems.push({
        parameterKey: param.parameterKey,
        parameterName: param.parameterName,
        currentValue: value,
        currentValueDisplay: valueDisplay,
        targetValue: param.target,
        targetValueDisplay: targetDisplay,
        min: param.min,
        max: param.max,
        gap,
        gapDisplay,
        unit: param.unit,
        status,
        provenance,
        direction: gapDirection
      });
    }

    // Generate evidence-based recommendations
    if (status === 'OUT_OF_SPEC' || status === 'TARGET_NOT_MET') {
      if (param.parameterKey === 'activeMatter') {
        recommendations.push({
          id: `rec-active-${Date.now()}-${param.parameterKey}`,
          parameterKey: param.parameterKey,
          title: 'Active Surfactant Adjustment Required',
          observation: `Total active matter (${valueDisplay}) is outside the defined specification (${targetDisplay}).`,
          impactExplanation: 'Active surfactant loading directly influences detergency, emulsification capacity, and foaming profile.',
          potentialAction: 'Review concentration and active purity of primary/secondary surfactants in the recipe.',
          confidence: 'CALCULATED',
          severity: param.criticality === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          tradeoffNotice: 'Increasing surfactant active matter increases raw material batch cost.'
        });
      } else if (param.parameterKey === 'ph' || param.parameterKey === 'powderPH') {
        recommendations.push({
          id: `rec-ph-${Date.now()}`,
          parameterKey: param.parameterKey,
          title: 'Aqueous pH Out of Range',
          observation: `Solution pH (${valueDisplay}) is outside specification bounds (${param.min ?? '-'} to ${param.max ?? '-'}).`,
          impactExplanation: 'Alkaline reserve is necessary for saponification and grease breakdown, but extreme pH can damage fabrics or cause skin irritation.',
          potentialAction: 'Adjust alkaline builders (Sodium Carbonate/Silicate) or buffering acids (Citric Acid) to bring 1.0% w/v pH into spec.',
          confidence: 'CALCULATED',
          severity: param.criticality === 'CRITICAL' ? 'CRITICAL' : 'WARNING'
        });
      } else if (param.parameterKey === 'moisture') {
        recommendations.push({
          id: `rec-moist-${Date.now()}`,
          parameterKey: param.parameterKey,
          title: 'Moisture Exceeds Specification',
          observation: `Powder moisture content (${valueDisplay}) exceeds maximum limit (${param.max}%).`,
          impactExplanation: 'Excess moisture promotes particle agglomeration, caking, and rapid degradation of hydrolytic enzymes and oxygen bleaches.',
          potentialAction: 'Evaluate raw material moisture specifications, spray drying parameters, or incorporate anhydrous carrier salts.',
          confidence: 'RULE_BASED',
          severity: 'CRITICAL',
          tradeoffNotice: 'Adding desiccants or anhydrous salts adjusts mass balance.'
        });
      } else if (param.parameterKey === 'costPerKg') {
        recommendations.push({
          id: `rec-cost-${Date.now()}`,
          parameterKey: param.parameterKey,
          title: 'Finished Cost Exceeds Commercial Target',
          observation: `Finished formula cost (${valueDisplay}) is higher than target limit (${targetDisplay}).`,
          impactExplanation: 'Cost ceiling violation affects manufacturing viability and commercial margin targets.',
          potentialAction: 'Audit high-cost functional additives, optimize surfactant actives, or review carrier salt proportions.',
          confidence: 'CALCULATED',
          severity: 'WARNING'
        });
      } else {
        recommendations.push({
          id: `rec-gen-${Date.now()}-${param.parameterKey}`,
          parameterKey: param.parameterKey,
          title: `${param.parameterName} Specification Deviation`,
          observation: `${param.parameterName} (${valueDisplay}) is ${statusMessage.toLowerCase()}`,
          impactExplanation: 'Formula properties deviate from the target specification dossier.',
          potentialAction: 'Review formula composition and formulation parameters.',
          confidence: 'RULE_BASED',
          severity: param.criticality === 'CRITICAL' ? 'CRITICAL' : 'WARNING'
        });
      }
    }
  }

  // Categorize evaluated items by criticality
  const criticalItems = evaluationItems.filter(i => i.criticality === 'CRITICAL');
  const majorItems = evaluationItems.filter(i => i.criticality === 'MAJOR');
  const informationalItems = evaluationItems.filter(i => i.criticality === 'INFORMATIONAL');

  const criticalOutCount = criticalItems.filter(i => i.status === 'OUT_OF_SPEC').length;
  const criticalMissingCount = criticalItems.filter(i => i.status === 'INSUFFICIENT_DATA' || i.status === 'NOT_TESTED').length;
  const criticalPassCount = criticalItems.filter(i => i.status === 'PASS').length;

  const majorOutCount = majorItems.filter(i => i.status === 'OUT_OF_SPEC').length;
  const majorPassCount = majorItems.filter(i => i.status === 'PASS').length;

  const outOfSpecParameters = evaluationItems.filter(i => i.status === 'OUT_OF_SPEC');
  const missingLabTestParameters = evaluationItems.filter(i => i.status === 'NOT_TESTED');

  // Determine overall verdict
  let verdictStatus: OverallVerdictStatus = 'SPECIFICATION_NOT_DEFINED';
  let headline = 'No Specifications Configured';
  let summary = 'Define product specifications or select a standard template to evaluate the formula.';

  if (activeParams.length > 0) {
    if (criticalOutCount > 0) {
      verdictStatus = 'NEEDS_REVISION';
      headline = 'Formulation Needs Revision';
      summary = `${criticalOutCount} critical parameter${criticalOutCount > 1 ? 's' : ''} out of specification. Correct formulation deviations.`;
    } else if (criticalMissingCount > 0) {
      verdictStatus = 'INSUFFICIENT_DATA';
      headline = 'Insufficient Laboratory / Verification Data';
      summary = `${criticalMissingCount} critical parameter${criticalMissingCount > 1 ? 's require' : ' requires'} physical laboratory testing or verification data.`;
    } else if (criticalPassCount > 0 && majorOutCount === 0) {
      verdictStatus = 'PASS';
      headline = 'Formulation Satisfies Specification';
      summary = `All ${criticalPassCount} critical specification parameters fully pass requirements.`;
    } else if (criticalPassCount > 0 && majorOutCount > 0) {
      verdictStatus = 'NEEDS_REVISION';
      headline = 'Major Specification Deviations';
      summary = `Critical specifications pass, but ${majorOutCount} major parameter${majorOutCount > 1 ? 's are' : ' is'} out of specification.`;
    } else {
      verdictStatus = 'PASS';
      headline = 'Specifications Evaluated';
      summary = 'All active specification requirements have been reviewed.';
    }
  }

  const verdict: ExpertSpecificationVerdict = {
    status: verdictStatus,
    headline,
    summary,
    criticalCount: criticalItems.length,
    criticalPassCount,
    criticalOutCount,
    criticalMissingCount,
    majorCount: majorItems.length,
    majorPassCount,
    majorOutCount,
    informationalCount: informationalItems.length,
    totalEvaluated: evaluationItems.length,
    outOfSpecParameters,
    missingLabTestParameters,
    evaluationTimestamp: new Date().toISOString()
  };

  // Replicate summaries
  const replicateSummaries = activeParams
    .map(p => aggregateLabReplicates(p.parameterKey, input.labMeasurements, p.unit))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return {
    formulaId: input.formulaId,
    formulaName: input.formulaName,
    formulaVersion: input.formulaVersion,
    productCategory: input.productCategory,
    evaluatedAt: new Date().toISOString(),
    verdict,
    items: evaluationItems,
    criticalItems,
    majorItems,
    informationalItems,
    gapAnalysis: gapItems,
    recommendations,
    labMeasurementsCount: input.labMeasurements.length,
    replicateSummaries
  };
}
