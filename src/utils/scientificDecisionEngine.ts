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
  formulaStatus: 'SCIENTIFICALLY_CONSISTENT' | 'SCREENING_CONCERNS' | 'CRITICAL_ISSUES' | 'INFORMATION_REQUIRED';
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
    const phVal = evalResult.pHResult?.ph ?? null;
    const phProvenance: DecisionEvidenceProvenance = evalResult.pHResult?.measuredPH !== null ? 'MEASURED' : 'PREDICTED';
    
    propertyDecisions['pH'] = {
      status: phVal !== null ? 'EVALUATED' : 'INSUFFICIENT_DATA',
      value: phVal,
      provenance: phProvenance,
      notes: 'Numerical solver accurately solves implemented equations within solver tolerance. Physical prediction empirically unvalidated unless measured pH data exists.'
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
    const activePct = evalResult.activeMatterResult?.totalActiveMatterPct ?? null;
    propertyDecisions['activeMatter'] = {
      status: activePct !== null ? 'EVALUATED' : 'INSUFFICIENT_DATA',
      value: activePct,
      provenance: 'SOURCE_BACKED',
      notes: 'Source-backed assay active matter calculation. SOURCE_BACKED_ASSAY is not equivalent to LAB_MEASURED_VALIDATION.'
    };

    if (activePct !== null && activePct < 5.0 && category !== 'FABRIC_SOFTENER' && category !== 'GLASS_CLEANER') {
      recommendations.push({
        id: 'rec-active-boost',
        category: 'CATEGORY_B_SCREENING',
        priority: 'P2_MEDIUM',
        recommendedChange: 'Increase active surfactant percentage.',
        reason: 'Current active matter level is low for high-performance detergency screening.',
        expectedImpact: 'Predicted detergency screening score will increase.',
        modelMaturity: 'EMPIRICAL_SCREENING_MODEL',
        uncertainty: 'Moderate model dependence on soil type and micellar synergy.',
        limitations: ['Requires experimental detergency validation.'],
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
    const isSolidOrPowder = category === 'LAUNDRY_POWDER' || category === 'DISHWASH_AUTOMATIC';
    propertyDecisions['viscosity'] = {
      status: isSolidOrPowder ? 'NOT_APPLICABLE' : (visc ? 'EVALUATED' : 'INSUFFICIENT_DATA'),
      value: visc?.predictedViscosityCp ?? null,
      provenance: isSolidOrPowder ? 'NOT_APPLICABLE' : 'PREDICTED',
      notes: isSolidOrPowder ? 'Viscosity not applicable to solid/powder matrices.' : 'Predicted apparent viscosity under model reference conditions (20 RPM equivalent; NOT_EXPERIMENTALLY_VALIDATED).'
    };

    // 5. Compatibility Decision Analysis
    const comp = evalResult.compatibilityResult;
    propertyDecisions['compatibility'] = {
      status: comp ? 'EVALUATED' : 'INSUFFICIENT_DATA',
      value: comp?.compatible ?? null,
      provenance: 'PREDICTED',
      notes: comp?.compatibilityStatusSemantic || 'NO_KNOWN_CONFLICT'
    };

    if (comp && !comp.compatible) {
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
    let formulaStatus: ScientificDecisionReport['formulaStatus'] = 'SCIENTIFICALLY_CONSISTENT';
    if (problems.some(p => p.severity === 'P0_CRITICAL')) {
      formulaStatus = 'CRITICAL_ISSUES';
    } else if (problems.length > 0 || (evalResult.scientificValidity === 'INVALID')) {
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
