/**
 * ============================================================================
 * AUTHORITATIVE SCIENTIFIC DECISION ENGINE (Phase 8)
 * ============================================================================
 * 
 * Single Authoritative Decision Intelligence & Formulation Guidance Layer.
 * Consumes authoritative outputs from FormulaScientificOrchestrator,
 * ScientificExecutionTrace, and CanonicalIntermediateState without recalculating properties.
 * Provides root-cause analysis, evidence-aware recommendations (Categories A, B, C),
 * priority tagging (P0-P3, INFO), What-If scenario simulations, and scenario comparisons.
 * ============================================================================
 */

import { FormulaScientificOrchestrator } from './orchestrator/formulaScientificOrchestrator';
import { CanonicalFormulaEvaluationResult, CanonicalFormulaInput, CanonicalIngredientInput } from './orchestrator/types';

export type DecisionPriority = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_OPTIMIZATION' | 'INFORMATION_REQUIRED';
export type RecommendationCategory = 'CATEGORY_A_DETERMINISTIC' | 'CATEGORY_B_SCREENING' | 'CATEGORY_C_EXPERIMENTAL';
export type DecisionEvidenceProvenance = 'MEASURED' | 'SOURCE_BACKED' | 'PREDICTED' | 'ESTIMATED' | 'HEURISTIC' | 'UNKNOWN' | 'NOT_APPLICABLE';

export interface DecisionProblemItem {
  id: string;
  property: string;
  problem: string;
  severity: DecisionPriority;
  whyItMatters: string;
  rootCause: string;
  evidence: DecisionEvidenceProvenance;
  recommendedAction: string;
  dagNodeId?: string;
}

export interface DecisionRecommendationItem {
  id: string;
  category: RecommendationCategory;
  priority: DecisionPriority;
  recommendedChange: string;
  reason: string;
  expectedImpact: string;
  modelMaturity: string;
  uncertainty: string;
  limitations: string[];
  fingerprintRef: string;
  engineRef?: string;
}

export interface ChangeImpactStep {
  stage: string;
  description: string;
  supportedByDAG: boolean;
}

export interface ChangeImpactAnalysisResult {
  changeDescription: string;
  directEffect: string;
  downstreamEffects: string[];
  finalImpact: string;
  dependencyChain: ChangeImpactStep[];
}

export interface ScenarioComparisonResult {
  scenarioId: string;
  scenarioName: string;
  formulaFingerprint: string;
  pH: number | null;
  activeMatterPct: number | null;
  viscosityCp: number | null;
  cpiScore: number | null;
  compatibilityStatus: string;
  qualityGateStatus: string;
  costPerKg: number | null;
}

export interface ScientificDecisionReport {
  formulaId: string;
  formulaName: string;
  formulaFingerprint: string;
  formulaStatus: 'NO_BLOCKING_RULE_FINDINGS' | 'SCREENING_CONCERNS' | 'CRITICAL_ISSUES' | 'INFORMATION_REQUIRED';
  problems: DecisionProblemItem[];
  recommendations: DecisionRecommendationItem[];
  propertyDecisions: Record<string, {
    status: string;
    value: any;
    provenance: DecisionEvidenceProvenance;
    notes: string;
  }>;
  evaluatedAt: string;
}

export class ScientificDecisionEngine {
  /**
   * Evaluates a formula and generates comprehensive authoritative decision intelligence,
   * root-cause analysis, and evidence-aware recommendations.
   */
  public static evaluateDecisionIntelligence(evalResult: CanonicalFormulaEvaluationResult): ScientificDecisionReport {
    const problems: DecisionProblemItem[] = [];
    const recommendations: DecisionRecommendationItem[] = [];
    const propertyDecisions: Record<string, any> = {};

    const fingerprint = evalResult.formulaIdentity?.fingerprint || 'UNKNOWN_FINGERPRINT';
    const category = evalResult.formulaIdentity?.canonicalCategory || 'UNKNOWN_PRODUCT_CATEGORY';

    // 1. pH Decision Analysis
    const rawPH = evalResult.pHResult?.ph;
    const phVal = typeof rawPH === 'number' && Number.isFinite(rawPH) ? rawPH : null;
    const declaredPHProvenance = evalResult.pHResult?.provenance;
    const phProvenance: DecisionEvidenceProvenance = phVal === null
      ? 'UNKNOWN'
      : evalResult.pHResult?.isMeasured === true && declaredPHProvenance === 'MEASURED'
        ? 'MEASURED'
        : declaredPHProvenance === 'ESTIMATED'
          ? 'ESTIMATED'
          : 'PREDICTED';

    propertyDecisions['pH'] = {
      status: phVal !== null ? 'EVALUATED' : 'INSUFFICIENT_DATA',
      value: phVal,
      provenance: phProvenance,
      notes: phProvenance === 'MEASURED'
        ? 'Explicitly marked measured by the authoritative pH result; this decision layer does not independently verify the underlying laboratory record.'
        : 'Solver output is a model result, not a laboratory measurement. Physical prediction remains empirically unvalidated unless matched, verified measurement evidence is linked.'
    };

    if (phVal === null) {
      problems.push({
        id: 'prob-ph-unknown',
        property: 'pH',
        problem: 'pH cannot be deterministically resolved due to missing species pKa or acid/base data.',
        severity: 'P1_HIGH',
        whyItMatters: 'Unresolved pH risks severe skin irritation, surfactant precipitation, and chemical instability.',
        rootCause: 'Missing acid/base dissociation parameters (pKa) for one or more formulation ingredients.',
        evidence: 'UNKNOWN',
        recommendedAction: 'Specify known pKa values or replace uncharacterized acidic/basic components with standard catalog ingredients.'
      });
    }

    // 2. Active Matter Decision Analysis
    const rawActivePct = evalResult.activeMatterResult?.totalSurfactantActivePct;
    const activePct = typeof rawActivePct === 'number' && Number.isFinite(rawActivePct) ? rawActivePct : null;
    propertyDecisions['activeMatter'] = {
      status: activePct !== null ? 'EVALUATED' : 'INSUFFICIENT_DATA',
      value: activePct,
      // ActiveMatterResultOutput contains a calculated total but no supplier COA
      // or verified-lab provenance field. Never promote it to SOURCE_BACKED/MEASURED here.
      provenance: activePct === null ? 'UNKNOWN' : 'PREDICTED',
      notes: 'Calculated from the formula ingredient assays supplied to the engine. This is not a lot-specific supplier COA or laboratory active-matter assay.'
    };

    const categoryMinimum = evalResult.activeMatterResult?.categoryMinPct;
    if (
      activePct !== null &&
      evalResult.activeMatterResult?.meetsCategoryMin === false &&
      typeof categoryMinimum === 'number' &&
      Number.isFinite(categoryMinimum) &&
      categoryMinimum > 0
    ) {
      recommendations.push({
        id: 'rec-active-boost',
        category: 'CATEGORY_B_SCREENING',
        priority: 'P2_MEDIUM',
        recommendedChange: 'Review the surfactant active-matter level against the configured category screening minimum.',
        reason: `Calculated surfactant active matter (${activePct.toFixed(2)}%) is below the configured category screening minimum (${categoryMinimum.toFixed(2)}%).`,
        expectedImpact: 'A reformulation may satisfy the configured screening target; detergency improvement is not guaranteed.',
        modelMaturity: 'CATEGORY_SCREENING_RULE',
        uncertainty: 'The configured minimum is a screening target, not a universal detergent performance standard.',
        limitations: ['Requires supplier assay confirmation and formula-specific laboratory detergency validation.'],
        fingerprintRef: fingerprint,
        engineRef: 'ActiveMatterEngine'
      });
    }

    // 3. Water Hardness / Chelation Decision
    const chelation = evalResult.chelationResult;
    if (chelation && (chelation as any).hasUnknownChelators) {
      problems.push({
        id: 'prob-unknown-chelator',
        property: 'Chelation',
        problem: 'Formulation contains uncharacterized declared chelators with unresolved capacity.',
        severity: 'P1_HIGH',
        whyItMatters: 'Unknown chelators cannot be assigned zero capacity without evidence, leading to inaccurate hard-water protection screening.',
        rootCause: 'Ingredient declared as chelator/builder has no matching entry in AUTHORITATIVE_CHELATOR_DATABASE.',
        evidence: 'ESTIMATED',
        recommendedAction: 'Assign a known chelating agent (e.g., GLDA 47% or Sodium Citrate) or provide verified stoichiometric binding capacity.'
      });
    }

    // 4. Viscosity Decision Analysis
    const visc = evalResult.viscosityResult;
    const physicalForm = evalResult.formulaIdentity?.physicalForm;
    const isSolidOrPowder = physicalForm === 'POWDER' || physicalForm === 'SOLID';
    const rawViscosity = visc?.predictedViscosityCp;
    const viscosityValue = typeof rawViscosity === 'number' && Number.isFinite(rawViscosity) ? rawViscosity : null;
    propertyDecisions['viscosity'] = {
      status: isSolidOrPowder ? 'NOT_APPLICABLE' : (viscosityValue !== null ? 'EVALUATED' : 'INSUFFICIENT_DATA'),
      value: isSolidOrPowder ? null : viscosityValue,
      provenance: isSolidOrPowder ? 'NOT_APPLICABLE' : (viscosityValue === null ? 'UNKNOWN' : 'PREDICTED'),
      notes: isSolidOrPowder ? 'Viscosity is not applicable to powder/solid matrices.' : 'Predicted apparent viscosity under model reference conditions; not experimentally validated for this exact formula, temperature, shear rate, geometry, or sample history.'
    };

    // 5. Compatibility Decision Analysis
    const comp = evalResult.compatibilityResult;
    const compatibilityValue = typeof comp?.compatible === 'boolean' ? comp.compatible : null;
    propertyDecisions['compatibility'] = {
      status: compatibilityValue === null ? 'INSUFFICIENT_DATA' : 'EVALUATED',
      value: compatibilityValue,
      provenance: compatibilityValue === null ? 'UNKNOWN' : 'PREDICTED',
      notes: comp?.compatibilityStatusSemantic || 'UNKNOWN'
    };

    if (compatibilityValue === false) {
      problems.push({
        id: 'prob-compatibility-clash',
        property: 'Compatibility',
        problem: 'Severe chemical incompatibility detected between formulation ingredients.',
        severity: 'P0_CRITICAL',
        whyItMatters: 'Anionic/cationic precipitation or active component degradation will cause phase separation and loss of efficacy.',
        rootCause: 'Presence of oppositely charged active species without sufficient nonionic solubilizing spacer.',
        evidence: 'PREDICTED',
        recommendedAction: 'Remove conflicting component or add compatible nonionic surfactant/hydrotrope buffer.'
      });
    }

    // 6. Quality Gate Status
    const qg = evalResult.qualityGateResult;
    propertyDecisions['qualityGate'] = {
      status: evalResult.scientificValidity ?? 'UNKNOWN',
      value: qg?.overallStatus ?? 'UNKNOWN',
      provenance: 'AUTHORITATIVE',
      notes: 'Consumes authoritative QualityGate engine evaluation.'
    };

    // Determine Overall Formula Status
    // This is a rule-finding summary only. It must never claim the formula is
    // scientifically validated or physically correct.
    let formulaStatus: ScientificDecisionReport['formulaStatus'] = 'NO_BLOCKING_RULE_FINDINGS';
    if (problems.some(p => p.severity === 'P0_CRITICAL')) {
      formulaStatus = 'CRITICAL_ISSUES';
    } else if (problems.length > 0 || evalResult.scientificValidity === 'INVALID') {
      formulaStatus = 'SCREENING_CONCERNS';
    } else if (phVal === null || activePct === null) {
      formulaStatus = 'INFORMATION_REQUIRED';
    }

    return {
      formulaId: evalResult.formulaIdentity.id,
      formulaName: evalResult.formulaIdentity.name,
      formulaFingerprint: fingerprint,
      formulaStatus,
      problems,
      recommendations,
      propertyDecisions,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Executes controlled What-If scenario simulation using existing FormulaScientificOrchestrator.
   * Original formula remains immutable. Returns evaluation result and scenario ID.
   */
  public static simulateWhatIfScenario(
    baseInput: CanonicalFormulaInput,
    scenarioName: string,
    mutator: (ingredients: CanonicalIngredientInput[]) => CanonicalIngredientInput[]
  ): { scenarioId: string; scenarioName: string; evaluationResult: CanonicalFormulaEvaluationResult } {
    const mutatedIngredients = mutator(JSON.parse(JSON.stringify(baseInput.ingredients || [])));
    const scenarioInput: CanonicalFormulaInput = {
      ...baseInput,
      formulaId: `${baseInput.formulaId || 'formula'}-scenario-${Date.now()}`,
      formulaName: scenarioName,
      ingredients: mutatedIngredients
    };

    const evaluationResult = FormulaScientificOrchestrator.evaluate(scenarioInput);
    return {
      scenarioId: evaluationResult.formulaIdentity.fingerprint,
      scenarioName,
      evaluationResult
    };
  }

  /**
   * Performs Change Impact Analysis along supported DAG dependency chains.
   */
  public static analyzeChangeImpact(changeType: string): ChangeImpactAnalysisResult {
    switch (changeType.toLowerCase()) {
      case 'increase_chelator':
        return {
          changeDescription: 'Increase chelator (GLDA / Citrate) percentage in formulation',
          directEffect: 'Higher stoichiometric Ca2+/Mg2+ binding capacity (mg CaCO3)',
          downstreamEffects: [
            'Hard-water protection ratio improves in hard/very hard water profiles',
            'Anionic surfactant micellar detergency is protected from calcium soap precipitation',
            'Cleaning screening score for particulate and hard-water soils may increase'
          ],
          finalImpact: 'Improved cleaning robustness across hard water conditions with minor raw material cost increase.',
          dependencyChain: [
            { stage: 'Chelation Engine', description: 'Calculates binding capacity from mass balance & stoichiometric ratio', supportedByDAG: true },
            { stage: 'Water Hardness Tolerance', description: 'Compares sequestration capacity against water hardness load', supportedByDAG: true },
            { stage: 'Cleaning Performance Engine', description: 'Applies hard-water penalty adjustment to detergency score', supportedByDAG: true }
          ]
        };
      case 'increase_active':
        return {
          changeDescription: 'Increase active surfactant percentage',
          directEffect: 'Higher total active matter and micellar density',
          downstreamEffects: [
            'Degreasing and surface-active wetting capacity increase',
            'Viscosity salt-response curve shifts (potential requirement for electrolyte titration)',
            'Raw material cost per kg increases'
          ],
          finalImpact: 'Enhanced detergency and foam stability with increased formulation cost.',
          dependencyChain: [
            { stage: 'Active Matter Engine', description: 'Calculates total active matter and ionic surfactant classes', supportedByDAG: true },
            { stage: 'Viscosity Engine', description: 'Models micellar rod growth and electrolyte salt curve sensitivity', supportedByDAG: true },
            { stage: 'Costing Engine', description: 'Updates formulation cost per kg based on raw material pricing', supportedByDAG: true }
          ]
        };
      default:
        return {
          changeDescription: changeType,
          directEffect: 'Direct modification of raw material composition',
          downstreamEffects: ['Downstream property propagation via SSOT orchestrator DAG'],
          finalImpact: 'Updated formulation scientific evaluation report and quality gate status.',
          dependencyChain: [
            { stage: 'Formula Scientific Orchestrator', description: 'Evaluates complete formula through single DAG execution pass', supportedByDAG: true }
          ]
        };
    }
  }
}
