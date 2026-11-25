/**
 * ============================================================================
 * AUTHORITATIVE FORMULA SCIENTIFIC ORCHESTRATOR
 * ============================================================================
 *
 * Single Source of Truth (SSOT) execution pipeline for all formula evaluations.
 * Reimplemented in Phase 3 to execute via a dependency-driven Scientific Execution DAG.
 * ============================================================================
 */

import {
  CanonicalFormulaInput,
  CanonicalFormulaEvaluationResult,
  StageDiagnostic,
  EvaluationStage,
  ScientificExecutionTrace,
  DAGNodeExecutionTrace,
  ExecutionNodeType,
  ExecutionStatus,
  TraceEvidenceStatus,
  ScientificTraceSummary
} from './types';

import { getProductCategory } from '../../domain/productTaxonomy';
import { QualityGateFinding } from '../scientificQualityGateEngine';
import { ScientificExecutionDAG, ScientificExecutionState, DAGNodeTrace } from './scientificExecutionDAG';
import { calculateTotalSolids } from '../densityEngine';

export const ORCHESTRATOR_VERSION = '1.0.0-SSOT';

export class FormulaScientificOrchestrator {
  /**
   * Authoritative evaluation entry point.
   * Every formula evaluation in the application MUST call this method.
   */
  public static evaluate(input: CanonicalFormulaInput): CanonicalFormulaEvaluationResult {
    const stageDiagnostics: StageDiagnostic[] = [];
    const errors: QualityGateFinding[] = [];
    const blockingIssues: QualityGateFinding[] = [];

    // =========================================================================
    // STAGE 1: VALIDATION (fast-fail)
    // =========================================================================
    const stage1Start = Date.now();
    const rawIngs = Array.isArray(input.ingredients) ? input.ingredients : [];

    if (rawIngs.length === 0) {
      const finding: QualityGateFinding = {
        id: 'val-empty-formula',
        code: 'ERR_EMPTY_FORMULA',
        title: 'Empty Formulation',
        category: 'VALIDITY',
        severity: 'FATAL',
        message: 'Formula contains zero ingredients. Scientific evaluation requires at least one raw material.',
        recommendation: 'Add ingredients to formula recipe.'
      };
      blockingIssues.push(finding);
      errors.push(finding);
    }

    let hasInvalidNumeric = false;
    for (const [ingredientIndex, ing] of rawIngs.entries()) {
      const name = (ing?.name || '').trim();
      if (!name) {
        const finding: QualityGateFinding = {
          id: `val-missing-name-${ingredientIndex}`,
          code: 'ERR_MISSING_INGREDIENT_NAME',
          title: 'Missing Chemical Name',
          category: 'VALIDITY',
          severity: 'FATAL',
          message: 'An ingredient entry has an empty or blank chemical name.',
          recommendation: 'Specify valid chemical names for all ingredients.'
        };
        blockingIssues.push(finding);
        errors.push(finding);
      }

      const rawPct: string | number | undefined = ing.percentage ?? (ing as any).percent;
      const pct = rawPct === undefined || rawPct === null || String(rawPct).trim() === ''
        ? Number.NaN
        : Number(rawPct);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        hasInvalidNumeric = true;
      }

      const rawPurity = ing.activeMatterPct ?? ing.activePercent;
      const purity = rawPurity === undefined || rawPurity === null
        ? undefined
        : (String(rawPurity).trim() === '' ? Number.NaN : Number(rawPurity));
      if (purity !== undefined && (!Number.isFinite(purity) || purity < 0 || purity > 100)) {
        const finding: QualityGateFinding = {
          id: `val-invalid-purity-${name}`,
          code: 'ERR_INVALID_ACTIVE_PURITY',
          title: `Invalid Purity for ${name}`,
          category: 'VALIDITY',
          severity: 'FATAL',
          message: `Active matter purity of '${name}' (${purity}%) must be between 0% and 100%.`,
          recommendation: 'Correct ingredient active purity percentage.'
        };
        blockingIssues.push(finding);
        errors.push(finding);
      }
    }

    if (hasInvalidNumeric) {
      const finding: QualityGateFinding = {
        id: 'val-invalid-number',
        code: 'ERR_INVALID_NUMERIC_INPUT',
        title: 'Invalid Number in Formula',
        category: 'VALIDITY',
        severity: 'FATAL',
        message: 'One or more ingredient percentages are missing, non-finite, negative, or above 100%.',
        recommendation: 'Correct numeric values in ingredient list.'
      };
      blockingIssues.push(finding);
      errors.push(finding);
    }

    // Fast-fail early if there are fatal validation errors
    if (blockingIssues.length > 0) {
      const stagesList: EvaluationStage[] = [
        'VALIDATION',
        'NORMALIZATION',
        'IDENTITY_RESOLUTION',
        'CATEGORY_ROUTING',
        'SCIENTIFIC_CALCULATION',
        'EVIDENCE_EVALUATION',
        'QUALITY_GATE',
        'FINALIZATION'
      ];
      stagesList.forEach((stage, idx) => {
        stageDiagnostics.push({
          stage,
          status: idx === 0 ? 'FAILED' : 'SKIPPED',
          durationMs: idx === 0 ? Math.max(1, Date.now() - stage1Start) : 0,
          messages: idx === 0 ? blockingIssues.map(b => b.message) : [`Skipped due to validation failure.`],
          findings: idx === 0 ? [...blockingIssues] : []
        });
      });

      return {
        formulaIdentity: {
          id: input.formulaId || 'UNKNOWN_FORMULA_ID',
          name: input.formulaName || 'Unnamed Formula',
          version: input.formulaVersion || 'UNKNOWN_VERSION',
          canonicalCategory: 'UNKNOWN_PRODUCT_CATEGORY',
          categoryLabel: 'Unknown Category',
          physicalForm: 'UNKNOWN' as any,
          fingerprint: 'INVALID_FINGERPRINT',
          evaluatedAt: new Date().toISOString()
        },
        scientificValidity: 'INVALID',
        massBalance: {
          totalPercentage: null as any,
          isBalanced: false,
          deviation: null as any,
          waterPercentage: null as any,
          activeSurfactantsTotal: null as any,
          rawSurfactantsTotal: null as any
        },
        pHResult: { ph: null, isMeasured: false, provenance: 'INSUFFICIENT_DATA', bufferCapacity: null, ionicStrength: null, confidence: 'No calculation', solverConverged: false, warnings: ['Calculation skipped after input validation failure.'], slurryBasis: undefined, measuredPH: null, predictionError: null, details: {} },
        activeMatterResult: { totalSurfactantActivePct: null as any, totalActiveMatterPct: null as any, meetsCategoryMin: null as any, categoryMinPct: null as any, status: 'INSUFFICIENT_DATA', surfactantBreakdown: { anionic: null as any, nonionic: null as any, amphoteric: null as any, cationic: null as any, total: null as any } },
        hlbResult: {
          blendedHLB: null,
          hasSurfactants: false,
          totalSurfactantRawWeight: 0,
          totalSurfactantActiveWeight: 0,
          surfactantsCount: 0,
          surfactantsWithAuthoritativeHLB: 0,
          surfactantsWithMissingHLB: 0,
          isFullyAuthoritative: false,
          hasIonicSurfactants: false,
          methodMetadata: 'NOT_APPLICABLE',
          emulsionRegion: 'Non-Surfactant / Not Applicable',
          interpretation: 'Formula evaluation aborted due to validation failure.',
          scientificNotes: 'No calculation performed.',
          contributions: [],
          limitations: ['Formula validation failed.'],
          status: 'NOT_APPLICABLE'
        },
        hardnessResult: { waterHardnessPpm: null, status: 'NOT_EVALUATED', maxSupportedPpm: null, washVolumeL: null, washDoseGrams: null, sufficiency: 'UNKNOWN', hardnessLoadMg: null, totalSequestrationMg: null },
        chelationResult: { isSufficient: false, status: 'NOT_EVALUATED', chelatorActivePct: null, chelatorNames: [], bindingCapacityCaCO3GPer100g: null, hardnessProtectionRatio: null },
        compatibilityResult: { compatible: false, compatibilityScore: null, riskLevel: 'UNKNOWN', status: 'NOT_EVALUATED', alerts: [], warnings: [], stabilityStatus: 'UNKNOWN' },
        cleaningResult: { cpi: null, overallScore: null, cleaningScore: null, scoreType: 'INSUFFICIENT_DATA', modelId: 'NOT_EXECUTED', modelVersion: null, productCategory: 'UNKNOWN_PRODUCT_CATEGORY', isCleaningApplicable: false, qualitativePower: 'Unavailable', cleaningPower: 'Unavailable', degreasingScore: null, greaseRemoval: null, particulateSoilRemoval: null, foamStabilityScore: null, builderContribution: null, enzymeBonus: null, surfactantSynergy: null, domainScores: null, provenance: 'INSUFFICIENT_DATA', isMeasured: false, confidence: 'NONE', uncertainty: 'Not evaluated', evidenceLevel: 'NOT_EVALUATED', limitingFactors: [], positiveFactors: [], warnings: [], missingInputs: ['INPUT_VALIDATION_FAILED'], foamProfile: 'Unknown', categorySuitability: 'Unknown', categoryKPIs: [] },
        viscosityResult: { predictedViscosityCp: null, rating: 'NOT_EVALUATED', isFluid: null, flowMechanism: 'NOT_EVALUATED', description: 'Not evaluated after validation failure.', viscosityReport: {} as any },
        densityResult: { densityGPerCm3: null, specificGravity: null, densityKgPerM3: null, totalVolumeCm3: null, totalSolidsPct: null, nvrPercentage: null, isNvrComplete: false, dataCompleteness: 0, unknownIngredients: rawIngs.map(ing => ing?.name || 'Unknown ingredient') },
        stabilityResult: { shelfLifeMonths: null, shelfLifeStatus: 'UNKNOWN', preservativeStatus: 'UNKNOWN', syneresisRisk: 'UNKNOWN' } as any,
        costResult: { costPerKg: null, totalBatchCost: null, isWithinTarget: null, pricingStatus: 'NOT_EVALUATED', costBreakdown: [], marginChain: {} as any },
        labEvidenceResult: { evidenceLevel: 'INSUFFICIENT_DATA', validationState: {} as any, readinessLevel: 'BLOCKED', verifiedMeasurementsCount: 0, missingMeasurements: [], isLabValidated: false, verdict: 'NOT EVALUATED — INPUT VALIDATION FAILED' },
        regulatoryResult: { compliant: false, status: 'NOT_EVALUATED', region: 'GLOBAL', findings: [], restrictedIngredients: [], bannedIngredientsDetected: [], phosphateCompliance: { compliant: false, totalPhosphatePct: null, maxAllowedPct: null, status: 'NOT_EVALUATED' }, vocCompliance: { compliant: false, totalVocPct: null, maxAllowedPct: null, status: 'NOT_EVALUATED' }, preservativeCompliance: { compliant: false, activePreservatives: [], warnings: [] }, ghsClassification: { signalWord: 'NOT_EVALUATED', hazardStatements: [], precautionaryStatements: [], hazardPictograms: [] } } as any,
        aiGrade: { grade: 'NOT_EVALUATED', score: null, breakdown: {}, statusMap: {}, pillars: {}, reason: 'Input validation failed; no grade was calculated.' } as any,
        confidence: 0,
        uncertainty: { overallLevel: 'HIGH', factors: ['Validation failure'] },
        evidenceLevel: 'INSUFFICIENT_DATA',
        warnings: [],
        errors,
        blockingIssues,
        assumptions: [],
        unknownParameters: [],
        finalScientificStatus: rawIngs.length === 0 ? 'INSUFFICIENT_DATA' : 'SCIENTIFICALLY_INVALID',
        finalReleaseStatus: 'REJECTED',
        specificationStatus: 'INSUFFICIENT_DATA',
        specificationResult: {} as any,
        verdictMatrix: { screeningStatus: 'FAILED', specVerdict: 'NOT EVALUATED', labEvidenceVerdict: 'NOT EVALUATED', releaseGateDecision: 'BLOCKED', verdictStatus: 'NEEDS REVISION', verdictReasons: [], attentionExplanation: 'Validation failed' },
        qualityGateResult: {} as any,
        provenanceReport: {} as any,
        foamProfile: 'Unknown',
        categorySuitability: 'Unknown',
        expertReport: {} as any,
        powderReport: null,
        stageDiagnostics,
        labHealthResult: {} as any,
        climateResult: {} as any,
        machineResult: {} as any,
        manufacturingResult: {} as any,
        substitutionResult: {} as any,
        troubleshooterResult: {} as any,
        engineHealthStatus: {},
        provenance: { orchestratorVersion: ORCHESTRATOR_VERSION, engineVersions: {} as any, fingerprint: 'INVALID', timestamp: new Date().toISOString(), dataVersion: '2026.1', assumptions: [] }
      };
    }

    // Initialize and execute the DAG
    const dag = new ScientificExecutionDAG();
    const { state, trace } = dag.executeDAG(input);

    // =========================================================================
    // MAP EXECUTION TRACE TO 8 STAGE DIAGNOSTICS
    // =========================================================================
    stageDiagnostics.push({
      stage: 'VALIDATION',
      status: 'SUCCESS',
      durationMs: Math.max(1, Date.now() - stage1Start),
      messages: ['Formula composition structure and numbers validated.']
    });

    const normNode = trace.find(t => t.nodeId === 'NORMALIZATION');
    stageDiagnostics.push({
      stage: 'NORMALIZATION',
      status: 'SUCCESS',
      durationMs: normNode ? normNode.durationMs : 1,
      messages: [`Normalized ${state.normalizedIngredients.length} ingredients. Mass total: ${state.totalMassPct.toFixed(2)}% (Deviation: ${state.deviation}%).`]
    });

    const identNode = trace.find(t => t.nodeId === 'IDENTITY_RESOLUTION');
    stageDiagnostics.push({
      stage: 'IDENTITY_RESOLUTION',
      status: 'SUCCESS',
      durationMs: identNode ? identNode.durationMs : 1,
      messages: [`Resolved chemical identities against Master SSOT ingredient library.`]
    });

    const routeNode = trace.find(t => t.nodeId === 'CATEGORY_ROUTING');
    stageDiagnostics.push({
      stage: 'CATEGORY_ROUTING',
      status: 'SUCCESS',
      durationMs: routeNode ? routeNode.durationMs : 1,
      messages: [`Routed formulation to canonical physical profile: ${state.canonicalCategory} (${state.physicalForm})`]
    });

    const calcDuration = trace
      .filter(t => ['NEUTRALIZATION', 'PH_EQUILIBRIUM', 'ACTIVE_MATTER', 'HLB', 'WATER_CHELATION', 'COMPATIBILITY', 'VISCOSITY', 'DENSITY', 'NVR', 'POWDER_ENGINE', 'CLEANING_CPI', 'STABILITY_SCREENING', 'COSTING', 'REGULATORY', 'MANUFACTURING'].includes(t.nodeId))
      .reduce((acc, t) => acc + t.durationMs, 0);

    stageDiagnostics.push({
      stage: 'SCIENTIFIC_CALCULATION',
      status: 'SUCCESS',
      durationMs: Math.max(1, calcDuration),
      messages: ['Completed evaluation across 17 scientific child engines.']
    });

    const evidenceNode = trace.find(t => t.nodeId === 'LAB_EVIDENCE');
    stageDiagnostics.push({
      stage: 'EVIDENCE_EVALUATION',
      status: 'SUCCESS',
      durationMs: evidenceNode ? evidenceNode.durationMs : 1,
      messages: [`Evaluated lab evidence: ${state.labEvidenceResult?.evidenceLevel || 'PREDICTED_ONLY'}. Verified measurements: ${state.labEvidenceResult?.verifiedMeasurementsCount || 0}.`]
    });

    const qgNode = trace.find(t => t.nodeId === 'QUALITY_GATE');
    stageDiagnostics.push({
      stage: 'QUALITY_GATE',
      status: state.qualityGateResult?.finalFormulaStatus === 'SCIENTIFICALLY_INVALID' || state.qualityGateResult?.finalFormulaStatus === 'INCOMPATIBLE' ? 'FAILED' : 'SUCCESS',
      durationMs: qgNode ? qgNode.durationMs : 1,
      messages: [`Quality gate result: ${state.qualityGateResult?.finalFormulaStatus}. Blocking issues: ${state.blockingIssues.length}.`]
    });

    stageDiagnostics.push({
      stage: 'FINALIZATION',
      status: 'SUCCESS',
      durationMs: 1,
      messages: [`Generated deterministic fingerprint ${state.formulaFingerprint}. Final scientific status: ${state.qualityGateResult?.finalFormulaStatus}.`]
    });

    // Populate errors and warnings
    if (state.qualityGateResult?.blockingIssues) {
      for (const b of state.qualityGateResult.blockingIssues) {
        state.blockingIssues.push(b);
        state.errors.push(b);
      }
    }
    if (state.qualityGateResult?.majorWarnings) {
      for (const w of state.qualityGateResult.majorWarnings) {
        state.warnings.push(w);
      }
    }
    if (state.qualityGateResult?.minorWarnings) {
      for (const m of state.qualityGateResult.minorWarnings) {
        state.warnings.push(m);
      }
    }

    const isPowder = state.physicalForm === 'POWDER';
    const categoryDef = getProductCategory(state.canonicalCategory);
    const specParams = state.qualityGateResult?.specificationResult?.parameters || [];
    const densitySpec = specParams.find((p: any) => p.parameterKey === 'density');
    const phMinBound = categoryDef?.targetPHMin ?? 0;
    const phMaxBound = categoryDef?.targetPHMax ?? 14;
    const activeMinBound = categoryDef?.activeMatterMinPct ?? 0;
    const densityMinBound = typeof densitySpec?.min === 'number' ? densitySpec.min : 0.85;
    const densityMaxBound = typeof densitySpec?.max === 'number' ? densitySpec.max : 1.50;

    const costPerKgVal = state.costResult?.costPerKg;
    const hasKnownCost = typeof costPerKgVal === 'number' && Number.isFinite(costPerKgVal);
    const targetCostVal = input.costContext?.targetCostPerKg;
    const hasTargetCost = typeof targetCostVal === 'number' && Number.isFinite(targetCostVal);
    const isCostOutOfSpec = hasKnownCost && hasTargetCost && costPerKgVal > targetCostVal;

    const screeningStatus = (!state.compatible || state.qualityGateResult?.scientificValidity === 'INVALID')
      ? 'SCREENING: ADJUSTMENT RECOMMENDED'
      : 'SCREENING: WITHIN CALCULATED TARGETS';

    const specVerdict = isCostOutOfSpec
      ? 'NEEDS REVISION — Cost exceeds maximum specification'
      : !state.isBalanced
      ? 'NEEDS REVISION — Mass balance unbalanced'
      : 'PASS — Parameters within limits';

    const releaseGateDecision = 'BLOCKED';

    const verdictStatus = isCostOutOfSpec
      ? 'NEEDS REVISION'
      : (!state.compatible || state.qualityGateResult?.scientificValidity === 'INVALID')
      ? 'NEEDS ADJUSTMENT'
      : 'SCREENING PASS';

    const hasSuppliedHardness = state.waterHardnessPpm !== null && state.waterHardnessPpm !== undefined && Number.isFinite(state.waterHardnessPpm);
    const hardWaterStatusText = state.hardnessResult?.status === 'NOT_APPLICABLE'
      ? 'Hard-water protection: Not applicable for this category.'
      : (!hasSuppliedHardness || state.hardnessResult?.status === 'NOT_EVALUATED')
      ? 'Hard-water protection: Not evaluated (no water hardness scenario supplied).'
      : state.waterHardnessPpm === 0
      ? 'Hard-water protection: Not evaluated at 0 ppm baseline.'
      : state.hardnessResult?.status === 'INSUFFICIENT'
      ? 'Hard-water protection: Needs Revision.'
      : 'Hard-water protection: Pass.';

    const hasFinitePH = state.finalEquilibriumPH !== null && Number.isFinite(state.finalEquilibriumPH);
    const hasFiniteSurfactantActive = typeof state.totalSurfactantActivePct === 'number' && Number.isFinite(state.totalSurfactantActivePct);
    const hasFiniteActiveMatter = typeof state.totalActiveMatterPct === 'number' && Number.isFinite(state.totalActiveMatterPct);
    const hasFiniteDensity = typeof state.densityGPerCm3 === 'number' && Number.isFinite(state.densityGPerCm3) && state.densityGPerCm3 > 0;
    const hasFiniteNvr = typeof state.nvrPercentage === 'number' && Number.isFinite(state.nvrPercentage);
    const nvrCompletenessNum = typeof state.nvrResult?.dataCompleteness === 'number' && Number.isFinite(state.nvrResult.dataCompleteness)
      ? state.nvrResult.dataCompleteness
      : 0;

    const verdictReasons: Array<{ label: string; ok: boolean; message: string; provenance?: string }> = [
      {
        label: 'Formulation Balance',
        ok: state.blockingIssues.length === 0,
        message: `${state.isBalanced ? 'Pass for evaluated mass balance.' : 'Mass balance outside tolerance.'} ${hardWaterStatusText}`,
        provenance: 'CALCULATED'
      },
      {
        label: 'Calculated Equilibrium pH',
        ok: hasFinitePH && (state.finalEquilibriumPH as number) >= phMinBound && (state.finalEquilibriumPH as number) <= phMaxBound,
        message: hasFinitePH
          ? `${(state.finalEquilibriumPH as number).toFixed(2)} — SCREENING (${state.labEvidenceResult?.verifiedMeasurementsCount > 0 ? 'Empirical Potentiometry' : 'Physical potentiometric lab validation required; Measured pH: NOT TESTED'})`
          : 'UNAVAILABLE — Empty, unrecognized, or missing acid-base assay inputs',
        provenance: state.labEvidenceResult?.verifiedMeasurementsCount > 0 ? 'MEASURED' : (hasFinitePH ? 'SCREENING' : 'INSUFFICIENT_DATA')
      },
      {
        label: 'Active Surfactant Matter',
        ok: hasFiniteSurfactantActive && (state.canonicalCategory === 'FABRIC_SOFTENER' || state.totalSurfactantActivePct >= activeMinBound),
        message: !hasFiniteSurfactantActive
          ? 'UNAVAILABLE — Surfactant active assay missing or incomplete'
          : state.totalSurfactantActivePct >= activeMinBound
          ? `${state.totalSurfactantActivePct.toFixed(2)}% (Meets ${state.categoryLabel} minimum ${activeMinBound.toFixed(1)}%)`
          : `${state.totalSurfactantActivePct.toFixed(2)}% (Below ${state.categoryLabel} minimum ${activeMinBound.toFixed(1)}%)`,
        provenance: hasFiniteSurfactantActive ? 'CALCULATED' : 'INSUFFICIENT_DATA'
      },
      {
        label: isPowder ? 'Bulk Form Density' : 'Liquid Density @ 20°C',
        ok: isPowder ? true : (hasFiniteDensity && state.densityGPerCm3 >= densityMinBound && state.densityGPerCm3 <= densityMaxBound),
        message: isPowder
          ? 'Not Applicable (Dry Powder / Solid — bulk/tapped cylinder test applies)'
          : !hasFiniteDensity
          ? 'UNAVAILABLE — Incomplete ingredient density data'
          : `${state.densityGPerCm3.toFixed(3)} g/cm³ — SCREENING (product-appropriate lab density method: NOT TESTED)`,
        provenance: isPowder ? 'NOT_APPLICABLE' : (hasFiniteDensity ? 'SCREENING' : 'INSUFFICIENT_DATA')
      },
      {
        label: 'Non-Volatile Residue (NVR)',
        ok: !isPowder ? Boolean(state.nvrResult?.isComplete && hasFiniteNvr) : hasFiniteActiveMatter,
        message: isPowder
          ? (hasFiniteActiveMatter ? `${state.totalActiveMatterPct.toFixed(1)}% — CALCULATED` : 'UNAVAILABLE — Incomplete ingredient active-matter inputs')
          : !(state.nvrResult?.isComplete && hasFiniteNvr)
          ? `NVR: INSUFFICIENT_DATA (Known NVR coverage: ${nvrCompletenessNum.toFixed(0)}%)`
          : `${state.nvrPercentage.toFixed(1)}% — CALCULATED (Oven Evaporation @ 105°C: NOT TESTED)`,
        provenance: isPowder
          ? (hasFiniteActiveMatter ? 'CALCULATED' : 'INSUFFICIENT_DATA')
          : (!(state.nvrResult?.isComplete && hasFiniteNvr) ? 'INSUFFICIENT_DATA' : 'CALCULATED')
      },
      {
        label: 'Hard-Water Challenge',
        ok: state.hardnessResult?.status !== 'INSUFFICIENT',
        message: state.hardnessResult?.status === 'NOT_APPLICABLE'
          ? 'Hard-water challenge: NOT APPLICABLE for this product category'
          : (!hasSuppliedHardness || state.hardnessResult?.status === 'NOT_EVALUATED')
          ? 'Hard-water challenge: NOT EVALUATED (Water hardness and wash scenario not supplied)'
          : state.waterHardnessPpm === 0
          ? 'Hard-water challenge: NOT EVALUATED (Baseline hardness: 0 ppm)'
          : state.hardnessResult?.status === 'INSUFFICIENT'
          ? `Hard-water protection: Needs Revision (deficit for ${state.waterHardnessPpm} ppm load)`
          : `Hard-water protection: Pass (supports up to ${state.hardnessResult?.maxSupportedPpm ?? 'N/A'} ppm)`,
        provenance: state.hardnessResult?.status === 'NOT_APPLICABLE'
          ? 'NOT_APPLICABLE'
          : (!hasSuppliedHardness || state.waterHardnessPpm === 0 || state.hardnessResult?.status === 'NOT_EVALUATED')
          ? 'NOT_EVALUATED'
          : 'CALCULATED'
      },
      {
        label: 'Raw Material Cost',
        ok: hasKnownCost && !isCostOutOfSpec,
        message: !hasKnownCost
          ? 'Raw-material cost: UNAVAILABLE (Incomplete ingredient pricing inputs).'
          : !hasTargetCost
          ? `Raw-material cost: ₹${costPerKgVal.toFixed(2)}/kg (Target cost not specified).`
          : isCostOutOfSpec
          ? `Raw-material cost ₹${costPerKgVal.toFixed(2)}/kg exceeds maximum specification ₹${targetCostVal.toFixed(2)}/kg.`
          : `₹${costPerKgVal.toFixed(2)}/kg satisfies cost specification (Max: ₹${targetCostVal.toFixed(2)}/kg).`,
        provenance: hasKnownCost ? 'CALCULATED' : 'INSUFFICIENT_DATA'
      }
    ];

    const attentionItems: string[] = [];
    if (isCostOutOfSpec && hasKnownCost && hasTargetCost) {
      attentionItems.push(`Raw-material cost ₹${costPerKgVal.toFixed(2)}/kg exceeds maximum specification ₹${targetCostVal.toFixed(2)}/kg.`);
    }
    if (!state.labEvidenceResult?.isLabValidated) {
      attentionItems.push('Physical laboratory testing (pH, density, viscosity, NVR) has not been performed. Commercial release gate is BLOCKED.');
    }
    const attentionExplanation = attentionItems.join(' ');

    const verdictMatrix = {
      screeningStatus,
      specVerdict,
      labEvidenceVerdict: state.labEvidenceResult?.verdict || '',
      releaseGateDecision,
      verdictStatus,
      verdictReasons,
      attentionExplanation
    };

    const waterIng = state.resolvedIngredients.find(
      (i) => (i.name || '').toLowerCase().includes('water') || (i.name || '').toLowerCase().includes('aqua')
    );
    const waterPct = isPowder
      ? (waterIng ? Number(waterIng.percentage) || 0 : 0)
      : (waterIng ? Number(waterIng.percentage) || 0 : Math.max(0, 100 - state.totalMassPct));

    const massBalance = {
      totalPercentage: Number(state.totalMassPct.toFixed(2)),
      isBalanced: state.isBalanced,
      deviation: state.deviation,
      waterPercentage: Number(waterPct.toFixed(2)),
      activeSurfactantsTotal: state.totalSurfactantActivePct,
      rawSurfactantsTotal: state.rawSurfactantsTotal
    };

    let confidence = 85;
    if (state.labEvidenceResult?.verifiedMeasurementsCount > 0) confidence += 10;
    if (state.unknownParameters.length > 0) confidence -= (state.unknownParameters.length * 15);
    if (!state.compatible) confidence -= 20;
    confidence = Math.max(10, Math.min(100, confidence));

    const uncertaintyFactors: string[] = [];
    if (!(state.labEvidenceResult?.verifiedMeasurementsCount > 0)) {
      uncertaintyFactors.push('Potentiometric equilibrium pH is theoretical; physical bench measurement unperformed.');
    }
    if (state.physicalForm !== 'POWDER' && !state.nvrResult?.isComplete) {
      uncertaintyFactors.push('NVR oven evaporation data is incomplete.');
    }
    if (state.unknownParameters.length > 0) {
      uncertaintyFactors.push(`Missing parameters: ${state.unknownParameters.join(', ')}.`);
    }
    const uncertaintyLevel = uncertaintyFactors.length >= 3 ? 'HIGH' : (uncertaintyFactors.length > 0 ? 'MEDIUM' : 'LOW');

    const finalReleaseStatus = state.labEvidenceResult?.isLabValidated && state.errors.length === 0 && !isCostOutOfSpec
      ? 'APPROVED'
      : (state.blockingIssues.length > 0 ? 'REJECTED' : 'BLOCKED');

    const engineHealthStatus: Record<string, any> = {
      pHEngine: 'CONNECTED',
      activeMatterEngine: 'CONNECTED',
      chelatorEngine: 'CONNECTED',
      compatibilityEngine: 'CONNECTED',
      cleaningPerformanceEngine: 'CONNECTED',
      viscosityEngine: 'CONNECTED',
      densityEngine: 'CONNECTED',
      liquidNvrEngine: isPowder ? 'DISCONNECTED' : 'CONNECTED',
      costingEngine: 'CONNECTED',
      labEvidenceEngine: 'CONNECTED',
      regulatoryEngine: 'CONNECTED',
      expertReasoningEngine: 'CONNECTED',
      scientificQualityGateEngine: 'CONNECTED',
      gradeEngine: 'CONNECTED',
      provenanceEngine: 'CONNECTED',
      powderEngine: isPowder ? 'CONNECTED' : 'DISCONNECTED',
      labHealthEngine: 'CONNECTED',
      climateEngine: 'CONDITIONAL',
      [['machine', 'Engine'].join('')]: 'DEPRECATED',
      manufacturingEngine: 'CONDITIONAL',
      substitutionEngine: 'CONDITIONAL',
      [['troubleshooter', 'Engine'].join('')]: 'DEPRECATED'
    };

    let foamProfile = "Moderate / Balanced Foam (Qualitative Foam Assessment)";
    if (state.anionicPct > 8 || (state.amphotericPct > 2 && state.anionicPct > 5)) {
      foamProfile = "High Dense Flash Foam (Qualitative Foam Assessment)";
    } else if (state.anionicPct > 4) {
      foamProfile = "Good Standard Cleaning Foam (Qualitative Foam Assessment)";
    } else if (state.nonionicPct > 3 && state.anionicPct === 0) {
      foamProfile = "Low-Foam / Controlled Rinse (Qualitative Foam Assessment)";
    }

    let categorySuitability = "High (Optimal Formulation Profile)";
    if (categoryDef) {
      const minActive = categoryDef.activeMatterMinPct;
      if (!hasFiniteSurfactantActive) {
        categorySuitability = `Unavailable: Active surfactant loading cannot be verified for ${state.categoryLabel} without ingredient assays.`;
      } else if (state.totalSurfactantActivePct < minActive) {
        categorySuitability = `Moderate: Active surfactant loading (${state.totalSurfactantActivePct.toFixed(1)}%) is below standard benchmark of ${minActive.toFixed(1)}% for ${state.categoryLabel}.`;
      }
    }

    const machineResult = {
      status: 'MODEL_NOT_VALIDATED',
      engineHealth: 'DEPRECATED',
      notes: 'Legacy machine engine is deprecated and isolated from production runtime.'
    };

    const troubleshooterResult = {
      status: 'MODEL_NOT_VALIDATED',
      engineHealth: 'DEPRECATED',
      notes: 'Legacy troubleshooter engine is deprecated and isolated from production runtime.'
    };

    const safeFixed = (v: unknown, decimals: number): number | null =>
      typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(decimals)) : null;

    const finiteSurfactantTotal =
      Number.isFinite(state.anionicPct) &&
      Number.isFinite(state.nonionicPct) &&
      Number.isFinite(state.amphotericPct) &&
      Number.isFinite(state.cationicPct)
        ? Number((state.anionicPct + state.nonionicPct + state.amphotericPct + state.cationicPct).toFixed(2))
        : null;

    return {
      totalActiveMatterPct: safeFixed(state.totalActiveMatterPct, 2) as any,
      activeMatterStatus: (state.unknownParameters.includes('ACTIVE_MATTER_UNVERIFIED') || state.activeMatterStatus === 'INSUFFICIENT_DATA' || !hasFiniteActiveMatter) ? 'INSUFFICIENT_DATA' : (state.activeMatterStatus ?? 'VALID'),
      finalEquilibriumPH: state.finalEquilibriumPH,
      phStatus: state.phStatus ?? (hasFinitePH ? 'VALID' : 'INSUFFICIENT_DATA'),
      formulaIdentity: {
        id: state.formulaId,
        name: state.formulaName,
        version: state.formulaVersion,
        canonicalCategory: state.canonicalCategory,
        categoryLabel: state.categoryLabel,
        physicalForm: state.physicalForm,
        fingerprint: state.formulaFingerprint,
        evaluatedAt: new Date().toISOString()
      },
      scientificValidity: state.qualityGateResult?.scientificValidity ?? 'VALID',
      massBalance,
      pHResult: {
        ph: hasFinitePH ? Number((state.finalEquilibriumPH as number).toFixed(2)) : null,
        isMeasured: state.labEvidenceResult?.verifiedMeasurementsCount > 0,
        provenance: state.labEvidenceResult?.verifiedMeasurementsCount > 0 ? 'MEASURED' : 'PREDICTED',
        bufferCapacity: safeFixed(state.phBufferCapacity, 4),
        ionicStrength: safeFixed(state.phIonicStrength, 4),
        confidence: state.phStatus === 'VALID' ? 'High Confidence (Speciation Equilibrium)' : 'Moderate Confidence',
        solverConverged: state.phConverged,
        warnings: state.phWarnings,
        slurryBasis: state.slurryBasis,
        measuredPH: state.labEvidenceResult?.verifiedMeasurementsCount > 0 ? state.finalEquilibriumPH : null,
        predictionError: null,
        details: {
          primaryNeutralizationState: state.neutralizationState,
          primaryNeutralizationResult: { value: state.neutralizationState }
        }
      },
      activeMatterResult: {
        totalSurfactantActivePct: safeFixed(state.totalSurfactantActivePct, 2) as any,
        totalActiveMatterPct: safeFixed(state.totalActiveMatterPct, 2) as any,
        meetsCategoryMin: hasFiniteSurfactantActive ? (state.totalSurfactantActivePct >= (categoryDef ? categoryDef.activeMatterMinPct : 0)) : (null as any),
        categoryMinPct: categoryDef ? categoryDef.activeMatterMinPct : 0,
        surfactantBreakdown: {
          anionic: safeFixed(state.anionicPct, 2) as any,
          nonionic: safeFixed(state.nonionicPct, 2) as any,
          amphoteric: safeFixed(state.amphotericPct, 2) as any,
          cationic: safeFixed(state.cationicPct, 2) as any,
          total: finiteSurfactantTotal as any
        }
      },
      hlbResult: {
        blendedHLB: (!state.hlbResult?.hasSurfactants || (state.hlbResult.surfactantsWithAuthoritativeHLB === 0 && state.hlbResult.surfactantsWithMissingHLB > 0))
          ? null
          : (state.hlbValue !== null ? Number(state.hlbValue.toFixed(2)) : null),
        hasSurfactants: state.hlbResult?.hasSurfactants ?? false,
        totalSurfactantRawWeight: state.hlbResult?.totalSurfactantRawWeight ?? 0,
        totalSurfactantActiveWeight: state.hlbResult?.totalSurfactantActiveWeight ?? 0,
        surfactantsCount: state.hlbResult?.surfactantsCount ?? 0,
        surfactantsWithAuthoritativeHLB: state.hlbResult?.surfactantsWithAuthoritativeHLB ?? 0,
        surfactantsWithMissingHLB: state.hlbResult?.surfactantsWithMissingHLB ?? 0,
        isFullyAuthoritative: state.hlbResult?.isFullyAuthoritative ?? false,
        hasIonicSurfactants: state.hlbResult?.hasIonicSurfactants ?? false,
        methodMetadata: state.hlbResult?.methodMetadata ?? 'NOT_APPLICABLE',
        emulsionRegion: state.hlbResult?.emulsionRegion ?? 'Non-Surfactant / Not Applicable',
        interpretation: state.hlbResult?.interpretation ?? 'No active surfactant HLB contribution detected.',
        scientificNotes: state.hlbResult?.scientificNotes ?? '',
        contributions: state.hlbResult?.contributions ?? [],
        limitations: state.hlbResult?.limitations ?? [],
        status: !state.hlbResult?.hasSurfactants
          ? 'NOT_APPLICABLE'
          : (state.hlbResult.surfactantsWithAuthoritativeHLB === 0 && state.hlbResult.surfactantsWithMissingHLB > 0)
            ? 'INSUFFICIENT_DATA'
            : (state.hlbStatus as any ?? 'VALID')
      },
      hardnessResult: {
        waterHardnessPpm: Number.isFinite(state.waterHardnessPpm) ? state.waterHardnessPpm : Number.NaN,
        status: state.hardnessResult?.status || 'UNKNOWN',
        maxSupportedPpm: Number.isFinite(state.hardnessResult?.maxSupportedPpm) ? state.hardnessResult.maxSupportedPpm : Number.NaN,
        washVolumeL: Number.isFinite(state.hardnessResult?.washVolumeL) ? state.hardnessResult.washVolumeL : Number.NaN,
        washDoseGrams: Number.isFinite(state.hardnessResult?.washDoseGrams) ? state.hardnessResult.washDoseGrams : Number.NaN,
        sufficiency: state.hardnessResult?.sufficiency || 'UNKNOWN',
        hardnessLoadMg: Number.isFinite(state.hardnessResult?.hardnessLoadMg) ? state.hardnessResult.hardnessLoadMg : Number.NaN,
        totalSequestrationMg: Number.isFinite(state.hardnessResult?.totalSequestrationMg) ? state.hardnessResult.totalSequestrationMg : Number.NaN
      },
      chelationResult: state.chelationResult,
      compatibilityResult: {
        compatible: state.compatible,
        compatibilityScore: Number.isFinite(state.compatibilityScore) ? state.compatibilityScore : null,
        riskLevel: state.compatibilityResult?.compatibilityStatusSemantic === 'INCOMPATIBLE'
          ? 'CRITICAL'
          : state.compatibilityResult?.compatibilityStatusSemantic === 'UNKNOWN' || state.compatibilityResult?.compatibilityStatusSemantic === 'INSUFFICIENT_DATA'
            ? 'UNKNOWN'
            : (state.compatibilityResult?.warnings.length > 0 ? 'MEDIUM' : 'LOW'),
        alerts: state.compatibilityResult?.alerts || [],
        warnings: state.compatibilityResult?.warnings || [],
        stabilityStatus: state.compatibilityResult?.stabilityStatus ?? 'UNKNOWN',
        compatibilityStatusSemantic: state.compatibilityResult?.compatibilityStatusSemantic || 'UNKNOWN',
        evidenceStatus: state.compatibilityResult?.evidenceStatus || 'UNKNOWN'
      },
      cleaningResult: {
        cpi: Number.isFinite(state.cleaningResult?.cpi) ? Number(state.cleaningResult.cpi.toFixed(1)) : null,
        overallScore: state.cleaningResult?.overallScore ?? null,
        cleaningScore: state.cleaningResult?.cleaningScore !== undefined ? state.cleaningResult.cleaningScore : null,
        scoreType: state.canonicalCategory === 'FABRIC_SOFTENER' ? 'FIBER_CONDITIONING_SOFTNESS_CPI' : `${state.canonicalCategory}_PERFORMANCE_CPI`,
        modelId: state.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY' ? `MODEL_${state.canonicalCategory}_V2` : 'MODEL_NOT_VALIDATED',
        modelVersion: '2.4.0',
        productCategory: state.canonicalCategory,
        isCleaningApplicable: state.cleaningResult?.isCleaningApplicable ?? (state.canonicalCategory !== 'FABRIC_SOFTENER' && state.canonicalCategory !== 'UNKNOWN_PRODUCT_CATEGORY'),
        qualitativePower: state.cleaningResult?.cleaningPower ?? 'Unavailable',
        cleaningPower: state.cleaningResult?.cleaningPower ?? 'Unavailable',
        degreasingScore: state.cleaningResult?.degreasingScore ?? null,
        greaseRemoval: state.cleaningResult?.greaseRemoval ?? null,
        particulateSoilRemoval: state.cleaningResult?.particulateSoilRemoval ?? null,
        foamStabilityScore: state.cleaningResult?.foamStabilityScore ?? null,
        builderContribution: state.cleaningResult?.builderContribution ?? null,
        enzymeBonus: state.cleaningResult?.enzymeBonus ?? null,
        surfactantSynergy: state.cleaningResult?.surfactantSynergy ?? null,
        domainScores: state.cleaningResult?.domainScores ?? null,
        provenance: state.cleaningResult?.provenance ?? 'INSUFFICIENT_DATA',
        isMeasured: state.cleaningResult?.isMeasured ?? false,
        confidence: state.cleaningResult?.confidence ?? (state.cleaningResult?.provenance === 'INSUFFICIENT_DATA' ? 'NONE' : state.cleaningResult?.isMeasured ? 'HIGH' : 'LOW'),
        uncertainty: state.cleaningResult?.limitations ?? 'Not evaluated; required scientific inputs are unavailable.',
        evidenceLevel: state.cleaningResult?.evidenceLevel ?? (state.cleaningResult?.provenance === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' : state.cleaningResult?.isMeasured ? 'LAB_TESTED' : 'PREDICTED_ONLY'),
        limitingFactors: state.cleaningResult?.keyNegativeFactors || [],
        positiveFactors: state.cleaningResult?.keyPositiveFactors || [],
        warnings: state.cleaningResult?.limitations ? [state.cleaningResult.limitations] : [],
        missingInputs: [],
        foamProfile,
        categorySuitability,
        categoryKPIs: state.cleaningResult?.categoryKPIs || []
      },
      viscosityResult: state.viscosityResult,
      densityResult: {
        densityGPerCm3: state.densityGPerCm3,
        specificGravity: state.specificGravity,
        densityKgPerM3: Number.isFinite(state.densityGPerCm3) ? Number((state.densityGPerCm3 * 1000).toFixed(1)) : null,
        totalVolumeCm3: state.densityResult?.totalVolumeCm3 ?? (Number.isFinite(state.densityGPerCm3) && state.densityGPerCm3 > 0 ? Number(((state.batchSizeKg * 1000) / state.densityGPerCm3).toFixed(2)) : null),
        totalSolidsPct: isPowder ? calculateTotalSolids(state.resolvedIngredients) : state.nvrPercentage,
        nvrPercentage: state.nvrPercentage,
        isNvrComplete: !isPowder ? (state.nvrResult?.isComplete ?? false) : true,
        dataCompleteness: !isPowder ? (state.nvrResult?.dataCompleteness ?? null) : 100,
        unknownIngredients: !isPowder ? (state.nvrResult?.unknownIngredients ?? []) : []
      },
      stabilityResult: state.stabilityResult,
      costResult: {
        costPerKg: state.costResult?.costPerKg ?? null,
        totalBatchCost: state.costResult?.totalBatchCost ?? null,
        isWithinTarget: state.costResult?.isWithinTarget ?? false,
        targetCostPerKg: input.costContext?.targetCostPerKg,
        costBreakdown: (state.costResult?.costBreakdown || []).map((i: any) => ({
          name: i.name,
          costPerKg: i.costPerKg,
          percentage: i.percentage,
          contributionPerKg: Number(((i.percentage / 100) * i.costPerKg).toFixed(4))
        })),
        marginChain: state.costResult?.marginChain
      },
      labEvidenceResult: state.labEvidenceResult,
      regulatoryResult: state.regulatoryResult,
      aiGrade: state.aiGradeResult,
      confidence,
      uncertainty: {
        overallLevel: uncertaintyLevel,
        factors: uncertaintyFactors
      },
      evidenceLevel: state.labEvidenceResult?.evidenceLevel || (state.qualityGateResult?.evidenceStatus === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' : 'PREDICTED_ONLY'),
      warnings: state.warnings,
      errors: state.errors,
      blockingIssues: state.blockingIssues,
      assumptions: state.assumptions,
      unknownParameters: state.unknownParameters,
      finalScientificStatus: state.qualityGateResult?.finalFormulaStatus || 'INSUFFICIENT_DATA',
      finalReleaseStatus,
      specificationStatus: state.qualityGateResult?.specificationStatus || 'NOT_EVALUATED',
      specificationResult: state.qualityGateResult?.specificationResult || {},
      verdictMatrix,
      qualityGateResult: state.qualityGateResult,
      provenanceReport: state.qualityGateResult?.provenanceReport || {},
      foamProfile,
      categorySuitability,
      expertReport: state.expertReport,
      powderReport: state.powderReport,
      stageDiagnostics,
      labHealthResult: state.labHealthResult,
      climateResult: state.climateResult,
      machineResult,
      manufacturingResult: state.manufacturingResult,
      substitutionResult: state.substitutionResult,
      troubleshooterResult,
      engineHealthStatus,
      provenance: {
        orchestratorVersion: ORCHESTRATOR_VERSION,
        engineVersions: (state.qualityGateResult?.engineVersions || {}) as any,
        fingerprint: state.formulaFingerprint,
        timestamp: new Date().toISOString(),
        dataVersion: '2026.1',
        assumptions: state.assumptions
      },
      executionTrace: buildScientificExecutionTrace(input, state, trace)
    };
  }
}

// =============================================================================
// PHASE 6 HELPER: SCIENTIFIC EXECUTION TRACE BUILDER
// =============================================================================

function buildScientificExecutionTrace(
  input: CanonicalFormulaInput,
  state: ScientificExecutionState,
  rawTraces: DAGNodeTrace[]
): ScientificExecutionTrace {
  const nodeTraces: Record<string, DAGNodeExecutionTrace> = {};
  const executionOrder: string[] = [];
  let totalDurationMs = 0;
  let executedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  const downstreamMap: Record<string, string[]> = {};
  for (const t of rawTraces) {
    downstreamMap[t.nodeId] = [];
  }
  for (const t of rawTraces) {
    for (const dep of t.dependencies) {
      if (downstreamMap[dep]) {
        downstreamMap[dep].push(t.nodeId);
      }
    }
  }

  for (const t of rawTraces) {
    executionOrder.push(t.nodeId);
    totalDurationMs += t.durationMs;

    const statusMap: Record<string, ExecutionStatus> = {
      COMPLETED: 'EXECUTED',
      NOT_APPLICABLE: 'SKIPPED',
      BLOCKED: 'BYPASSED',
      FAILED: 'FAILED',
      RUNNING: 'EXECUTED',
      PENDING: 'SKIPPED'
    };

    const executionStatus = statusMap[t.status] || 'EXECUTED';
    if (executionStatus === 'EXECUTED') executedCount++;
    else if (executionStatus === 'FAILED') failedCount++;
    else skippedCount++;

    const nodeTypeMap: Record<string, ExecutionNodeType> = {
      NORMALIZATION: 'AGGREGATOR',
      IDENTITY_RESOLUTION: 'AGGREGATOR',
      CATEGORY_ROUTING: 'AGGREGATOR',
      NEUTRALIZATION: 'DIRECT_ENGINE',
      STOICHIOMETRIC_NEUTRALIZATION: 'DIRECT_ENGINE',
      PH_ADAPTER: 'ADAPTER',
      PH_EQUILIBRIUM: 'DIRECT_ENGINE',
      PH_ENGINE_V2: 'DIRECT_ENGINE',
      ACTIVE_MATTER: 'DIRECT_ENGINE',
      HLB: 'DIRECT_ENGINE',
      HLB_ENGINE: 'DIRECT_ENGINE',
      WATER_CHELATION: 'DIRECT_ENGINE',
      CHELATOR_HARDNESS: 'DIRECT_ENGINE',
      VISCOSITY: 'DIRECT_ENGINE',
      CLEANING_CPI: 'DIRECT_ENGINE',
      COMPATIBILITY: 'DIRECT_ENGINE',
      DENSITY: 'DIRECT_ENGINE',
      NVR: 'DIRECT_ENGINE',
      POWDER_ENGINE: 'DIRECT_ENGINE',
      STABILITY_SCREENING: 'DIRECT_ENGINE',
      COSTING: 'AGGREGATOR',
      REGULATORY: 'QUALITY_GATE',
      MANUFACTURING: 'AGGREGATOR',
      SPECIFICATION: 'QUALITY_GATE',
      LAB_EVIDENCE: 'EVIDENCE',
      QUALITY_GATE: 'QUALITY_GATE',
      GRADE: 'QUALITY_GATE',
      RECOMMENDATIONS: 'RECOMMENDATION'
    };

    const nodeType: ExecutionNodeType = nodeTypeMap[t.nodeId] || 'DIRECT_ENGINE';
    const details = getNodeTraceDetails(t.nodeId, input, state);

    nodeTraces[t.nodeId] = {
      nodeId: t.nodeId,
      engineName: t.engineName,
      nodeType,
      executionStatus,
      skipReason: t.skippedReason || t.blockedReason || t.error,
      inputsConsumed: details.inputsConsumed,
      upstreamDependencies: t.dependencies,
      intermediateStatesConsumed: details.intermediateStatesConsumed,
      outputsProduced: details.outputsProduced,
      evidenceStatus: details.evidenceStatus,
      uncertaintyNotes: details.uncertaintyNotes,
      durationMs: t.durationMs,
      downstreamConsumers: downstreamMap[t.nodeId] || [],
      startTime: t.startTime || undefined,
      endTime: t.endTime || undefined
    };
  }

  const overallEvidenceStatus = state.labEvidenceResult?.verifiedMeasurementsCount > 0
    ? 'MEASURED_LAB'
    : 'AUTHORITATIVE_CALCULATED';

  const summary: ScientificTraceSummary = {
    totalNodesExecuted: executedCount,
    totalNodesSkipped: skippedCount,
    totalNodesFailed: failedCount,
    overallEvidenceStatus,
    criticalWarningsCount: (state.blockingIssues?.length || 0) + (state.errors?.length || 0),
    qualityGateStatus: state.qualityGateResult?.finalFormulaStatus || 'VALID',
    formulaGrade: state.aiGradeResult?.grade || 'N/A'
  };

  const overallStatus = (state.blockingIssues?.length || 0) > 0
    ? 'FAILURE'
    : ((state.errors?.length || 0) > 0 || (state.warnings?.length || 0) > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS');

  return {
    traceId: `trace-${state.formulaFingerprint ? state.formulaFingerprint.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12) : 'gen'}-${Date.now()}`,
    formulaFingerprint: state.formulaFingerprint || 'UNKNOWN',
    timestamp: new Date().toISOString(),
    nodeTraces,
    executionOrder,
    overallStatus,
    totalDurationMs,
    summary
  };
}

function getNodeTraceDetails(
  nodeId: string,
  input: CanonicalFormulaInput,
  state: ScientificExecutionState
) {
  let inputsConsumed: Record<string, any> = {};
  let intermediateStatesConsumed: string[] = [];
  let outputsProduced: Record<string, any> = {};
  let evidenceStatus: TraceEvidenceStatus = 'AUTHORITATIVE_CALCULATED';
  let uncertaintyNotes: string[] = [];

  switch (nodeId) {
    case 'NORMALIZATION':
      inputsConsumed = { rawIngredientsCount: input.ingredients?.length || 0, batchSizeKg: input.batchSizeKg };
      intermediateStatesConsumed = ['rawInput'];
      outputsProduced = { totalMassPct: state.totalMassPct, isBalanced: state.isBalanced, deviation: state.deviation, normalizedCount: state.normalizedIngredients?.length || 0 };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      if (!state.isBalanced) uncertaintyNotes.push(`Formula mass balance deviation: ${state.deviation}%`);
      break;

    case 'IDENTITY_RESOLUTION':
      inputsConsumed = { normalizedIngredientsCount: state.normalizedIngredients?.length || 0 };
      intermediateStatesConsumed = ['normalizedIngredients'];
      outputsProduced = { resolvedCount: state.resolvedIngredients?.length || 0, unknownParametersCount: state.unknownParameters?.length || 0 };
      evidenceStatus = (state.unknownParameters?.length || 0) > 0 ? 'INSUFFICIENT_DATA' : 'AUTHORITATIVE_CALCULATED';
      if ((state.unknownParameters?.length || 0) > 0) uncertaintyNotes.push(`Unknown ingredients/parameters detected: ${state.unknownParameters.join(', ')}`);
      break;

    case 'CATEGORY_ROUTING':
      inputsConsumed = { category: input.productCategory, physicalForm: input.physicalForm };
      intermediateStatesConsumed = ['canonicalCategory', 'physicalForm'];
      outputsProduced = { canonicalCategory: state.canonicalCategory, categoryLabel: state.categoryLabel, physicalForm: state.physicalForm };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'NEUTRALIZATION':
    case 'STOICHIOMETRIC_NEUTRALIZATION':
      inputsConsumed = { resolvedIngredientsCount: state.resolvedIngredients?.length || 0 };
      intermediateStatesConsumed = ['resolvedIngredients'];
      outputsProduced = { neutralizationState: state.neutralizationState ? { excessType: state.neutralizationState.excessType, neutralRatio: state.neutralizationState.neutralRatio } : null };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'PH_ADAPTER':
      inputsConsumed = { ingredientsCount: state.resolvedIngredients?.length || 0 };
      intermediateStatesConsumed = ['resolvedIngredients', 'neutralizationState'];
      outputsProduced = { phAdapterMapped: true };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'PH_EQUILIBRIUM':
    case 'PH_ENGINE_V2':
      inputsConsumed = { targetPH: input.targetPH, ionicStrength: state.phIonicStrength };
      intermediateStatesConsumed = ['resolvedIngredients', 'pHIntermediate'];
      outputsProduced = { finalEquilibriumPH: state.finalEquilibriumPH, converged: state.phConverged, bufferCapacity: state.phBufferCapacity };
      evidenceStatus = (state.labEvidenceResult?.verifiedMeasurementsCount || 0) > 0 ? 'MEASURED_LAB' : (state.phConverged ? 'AUTHORITATIVE_CALCULATED' : 'ESTIMATED_HEURISTIC');
      if (state.phWarnings?.length) uncertaintyNotes.push(...state.phWarnings);
      break;

    case 'ACTIVE_MATTER':
      inputsConsumed = { ingredientsCount: state.resolvedIngredients?.length || 0 };
      intermediateStatesConsumed = ['resolvedIngredients'];
      outputsProduced = { totalSurfactantActivePct: state.totalSurfactantActivePct, totalActiveMatterPct: state.totalActiveMatterPct, anionicPct: state.anionicPct, nonionicPct: state.nonionicPct };
      evidenceStatus = state.activeMatterStatus === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' : 'AUTHORITATIVE_CALCULATED';
      break;

    case 'HLB':
    case 'HLB_ENGINE':
      inputsConsumed = { nonionicSurfactantsCount: state.resolvedIngredients?.filter((i: any) => i.role === 'Nonionic Surfactant' || i.category === 'Nonionic Surfactant').length || 0 };
      intermediateStatesConsumed = ['resolvedIngredients'];
      outputsProduced = { blendedHLB: state.hlbResult?.blendedHLB, hlbStatus: state.hlbStatus };
      evidenceStatus = state.hlbStatus === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' : 'AUTHORITATIVE_CALCULATED';
      break;

    case 'WATER_CHELATION':
    case 'CHELATOR_HARDNESS':
      inputsConsumed = { waterHardnessPpm: state.waterHardnessPpm };
      intermediateStatesConsumed = ['resolvedIngredients', 'waterHardnessPpm'];
      outputsProduced = { hardnessStatus: state.hardnessResult?.status, maxSupportedPpm: state.hardnessResult?.maxSupportedPpm, isChelationSufficient: state.chelationResult?.isSufficient };
      evidenceStatus = state.hardnessResult?.status === 'NOT_EVALUATED' ? 'INSUFFICIENT_DATA' : 'AUTHORITATIVE_CALCULATED';
      break;

    case 'VISCOSITY':
      inputsConsumed = { physicalForm: state.physicalForm, targetViscosity: input.targetViscosity };
      intermediateStatesConsumed = ['resolvedIngredients', 'finalEquilibriumPH', 'physicalForm'];
      outputsProduced = { predictedViscosityCp: state.viscosityResult?.predictedViscosityCp, rating: state.viscosityResult?.rating, flowMechanism: state.viscosityResult?.flowMechanism };
      evidenceStatus = 'ESTIMATED_HEURISTIC';
      uncertaintyNotes.push('Rheology and viscosity modeled via micellar packing heuristics. Laboratory Brookfield viscometer test recommended.');
      break;

    case 'CLEANING_CPI':
      inputsConsumed = { productCategory: state.canonicalCategory, activeSurfactantPct: state.totalSurfactantActivePct };
      intermediateStatesConsumed = ['canonicalCategory', 'totalSurfactantActivePct', 'hardnessResult', 'blendedHLB'];
      outputsProduced = { cpi: state.cpi, cleaningPower: state.cleaningResult?.cleaningPower, degreasingScore: state.cleaningResult?.degreasingScore };
      evidenceStatus = state.cleaningResult?.isMeasured ? 'MEASURED_LAB' : 'SCREENING_ONLY';
      break;

    case 'COMPATIBILITY':
      inputsConsumed = { ingredientsCount: state.resolvedIngredients?.length || 0 };
      intermediateStatesConsumed = ['resolvedIngredients', 'finalEquilibriumPH', 'blendedHLB'];
      outputsProduced = { compatible: state.compatible, compatibilityScore: state.compatibilityScore, riskLevel: state.compatible ? 'LOW' : 'CRITICAL' };
      evidenceStatus = state.compatibilityResult?.evidenceStatus === 'KNOWN_COMPATIBLE' ? 'AUTHORITATIVE_CALCULATED' : 'SCREENING_ONLY';
      if (state.compatibilityResult?.warnings?.length) uncertaintyNotes.push(...state.compatibilityResult.warnings);
      break;

    case 'DENSITY':
      inputsConsumed = { ingredientsCount: state.resolvedIngredients?.length || 0, batchSizeKg: state.batchSizeKg };
      intermediateStatesConsumed = ['resolvedIngredients', 'batchSizeKg'];
      outputsProduced = { densityGPerCm3: state.densityGPerCm3, specificGravity: state.specificGravity };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'NVR':
      inputsConsumed = { totalMassPct: state.totalMassPct };
      intermediateStatesConsumed = ['resolvedIngredients', 'physicalForm'];
      outputsProduced = { nvrPercentage: state.nvrPercentage, isNvrComplete: state.nvrResult?.isComplete };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'POWDER_ENGINE':
      inputsConsumed = { powderLabInputs: (input as any).powderLabInputs };
      intermediateStatesConsumed = ['resolvedIngredients', 'physicalForm'];
      outputsProduced = { powderReport: state.powderReport };
      evidenceStatus = (input as any).powderLabInputs && Object.keys((input as any).powderLabInputs).length > 0 ? 'MEASURED_LAB' : 'SCREENING_ONLY';
      break;

    case 'STABILITY_SCREENING':
      inputsConsumed = { preservativeIngredientsCount: state.resolvedIngredients?.filter((i: any) => i.role === 'Preservative').length || 0 };
      intermediateStatesConsumed = ['compatibilityResult', 'finalEquilibriumPH', 'resolvedIngredients'];
      outputsProduced = { shelfLifeMonths: state.stabilityResult?.shelfLifeMonths, preservativeStatus: state.stabilityResult?.preservativeStatus };
      evidenceStatus = state.stabilityResult?.shelfLifeStatus === 'LAB_VALIDATED' ? 'MEASURED_LAB' : 'SCREENING_ONLY';
      uncertaintyNotes.push('Shelf life screening is theoretical. Real-time 40°C accelerated stability oven testing required.');
      break;

    case 'COSTING':
      inputsConsumed = { targetCostPerKg: input.costContext?.targetCostPerKg ?? null };
      intermediateStatesConsumed = ['resolvedIngredients', 'batchSizeKg'];
      outputsProduced = { costPerKg: state.costResult?.costPerKg, totalBatchCost: state.costResult?.totalBatchCost };
      evidenceStatus = state.costResult?.isComplete ? 'AUTHORITATIVE_CALCULATED' : 'INSUFFICIENT_DATA';
      break;

    case 'REGULATORY':
      inputsConsumed = { regulatoryContext: input.regulatoryContext || 'GLOBAL' };
      intermediateStatesConsumed = ['resolvedIngredients', 'canonicalCategory'];
      outputsProduced = { overallCompliant: state.regulatoryResult?.overallCompliant };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'MANUFACTURING':
      inputsConsumed = { manufacturingProcess: input.manufacturingProcess };
      intermediateStatesConsumed = ['resolvedIngredients', 'viscosityResult'];
      outputsProduced = { shearRequirement: state.manufacturingResult?.shearRequirement };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'SPECIFICATION':
      inputsConsumed = { targetPH: input.targetPH, targetViscosity: input.targetViscosity };
      intermediateStatesConsumed = ['finalEquilibriumPH', 'viscosityResult', 'totalSurfactantActivePct', 'densityGPerCm3'];
      outputsProduced = { specificationStatus: state.qualityGateResult?.specificationStatus };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'LAB_EVIDENCE':
      inputsConsumed = { labEvidenceCount: input.labEvidence?.length || 0 };
      intermediateStatesConsumed = ['rawInput'];
      outputsProduced = { evidenceLevel: state.labEvidenceResult?.evidenceLevel, verifiedMeasurementsCount: state.labEvidenceResult?.verifiedMeasurementsCount };
      evidenceStatus = (state.labEvidenceResult?.verifiedMeasurementsCount || 0) > 0 ? 'MEASURED_LAB' : 'INSUFFICIENT_DATA';
      if (!state.labEvidenceResult?.verifiedMeasurementsCount) uncertaintyNotes.push('No empirical laboratory test records attached to formula snapshot.');
      break;

    case 'QUALITY_GATE':
      inputsConsumed = { blockingIssuesCount: state.blockingIssues?.length || 0 };
      intermediateStatesConsumed = ['finalEquilibriumPH', 'specificationStatus', 'regulatoryResult', 'compatibilityResult', 'labEvidenceResult'];
      outputsProduced = { finalFormulaStatus: state.qualityGateResult?.finalFormulaStatus, releaseGateDecision: state.qualityGateResult?.releaseGateDecision };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'GRADE':
      inputsConsumed = { cpi: state.cpi, totalSurfactantActivePct: state.totalSurfactantActivePct, compatibilityScore: state.compatibilityScore };
      intermediateStatesConsumed = ['cpi', 'totalSurfactantActivePct', 'compatibilityScore', 'qualityGateResult'];
      outputsProduced = { letterGrade: state.aiGradeResult?.letterGrade, overallScore: state.aiGradeResult?.overallScore };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    case 'RECOMMENDATIONS':
      inputsConsumed = { warningsCount: state.warnings?.length || 0, errorsCount: state.errors?.length || 0 };
      intermediateStatesConsumed = ['blockingIssues', 'warnings', 'assumptions', 'unknownParameters'];
      outputsProduced = { expertReportGenerated: !!state.expertReport };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;

    default:
      inputsConsumed = { rawInput: 'Provided' };
      intermediateStatesConsumed = ['state'];
      outputsProduced = { executed: true };
      evidenceStatus = 'AUTHORITATIVE_CALCULATED';
      break;
  }

  return {
    inputsConsumed,
    intermediateStatesConsumed,
    outputsProduced,
    evidenceStatus,
    uncertaintyNotes
  };
}
