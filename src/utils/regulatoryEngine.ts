/**
 * ============================================================================
 * AUTHORITATIVE REGULATORY & ENVIRONMENTAL COMPLIANCE ENGINE (BRIDGE TO SSOT)
 * ============================================================================
 * Bridges legacy utility calls to the domain SSOT in src/domain/regulatory/.
 * ============================================================================
 */

import { FormulationIngredient } from '../types';
import { ProductCategoryId } from '../domain/productTaxonomy';
import {
  RegulatoryComplianceEngine as DomainComplianceEngine,
  RegulatoryJurisdictionId,
  RegulatoryEvaluationInput
} from '../domain/regulatory';

export type RegulatoryRegion = 'EU' | 'US_EPA' | 'INDIA_BIS' | 'GLOBAL';

export interface RegulatoryContext {
  targetRegion?: RegulatoryRegion;
  jurisdiction?: string;
  bannedIngredients?: string[];
  maxPhosphatePct?: number;
  maxVocPct?: number;
  requireBioBased?: boolean;
}

export interface RegulatoryFinding {
  code: string;
  title: string;
  severity: 'FATAL' | 'MAJOR' | 'MINOR';
  message: string;
  regulationReference: string;
  remediation: string;
}

export interface RegulatoryEvaluationReport {
  compliant: boolean;
  status: 'COMPLIANT' | 'RESTRICTED' | 'NON_COMPLIANT' | 'INSUFFICIENT_DATA';
  region: RegulatoryRegion;
  findings: RegulatoryFinding[];
  restrictedIngredients: string[];
  bannedIngredientsDetected: string[];
  phosphateCompliance: {
    compliant: boolean;
    totalPhosphatePct: number;
    maxAllowedPct: number;
    status: 'PASS' | 'EXCEEDED' | 'BANNED';
  };
  vocCompliance: {
    compliant: boolean;
    totalVocPct: number;
    maxAllowedPct: number;
  };
  preservativeCompliance: {
    compliant: boolean;
    activePreservatives: Array<{ name: string; percentage: number; maxAllowed: number; status: 'PASS' | 'EXCEEDED' }>;
    warnings: string[];
  };
  ghsClassification: {
    signalWord: 'DANGER' | 'WARNING' | 'NONE';
    hazardStatements: string[];
    precautionaryStatements: string[];
    hazardPictograms: string[];
  };
  engineVersion: string;
}

export function evaluateRegulatoryCompliance(
  ingredients: FormulationIngredient[],
  category: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY',
  context?: RegulatoryContext,
  calculatedPH?: number
): RegulatoryEvaluationReport {
  // Map Region to Jurisdiction ID
  let jurisdictionId: RegulatoryJurisdictionId = 'GLOBAL_UN_GHS';
  if (context?.jurisdiction) {
    jurisdictionId = context.jurisdiction as RegulatoryJurisdictionId;
  } else if (context?.targetRegion === 'EU') {
    jurisdictionId = 'EU';
  } else if (context?.targetRegion === 'INDIA_BIS') {
    jurisdictionId = 'INDIA';
  } else if (context?.targetRegion === 'US_EPA') {
    jurisdictionId = 'US_FEDERAL';
  }

  const safePH = calculatedPH ?? 7.0;

  // Map to Domain SSOT Input
  const domainInput: RegulatoryEvaluationInput = {
    ingredients: (ingredients || []).map(i => ({
      name: i.name,
      percentage: Number(i.percentage ?? 0),
      role: i.role,
      casNumber: (i as any).casNumber,
      activePercentage: (i as any).activePercentage
    })),
    productCategory: category,
    jurisdiction: jurisdictionId,
    calculatedPH: safePH,
    customBannedIngredients: context?.bannedIngredients,
    maxPhosphatePctOverride: context?.maxPhosphatePct,
    maxVocPctOverride: context?.maxVocPct
  };

  const domainDecision = DomainComplianceEngine.evaluate(domainInput);

  // Map Domain Findings
  const findings: RegulatoryFinding[] = [];

  for (const failed of domainDecision.failedRules) {
    const isBanned = failed.ruleId.includes('NPE') || failed.ruleId.includes('BANNED') || failed.requirementType === 'PROHIBITED';
    findings.push({
      code: isBanned ? 'REG_BANNED_SUBSTANCE' : failed.ruleId,
      title: failed.regulationName,
      severity: failed.severity === 'CRITICAL' ? 'FATAL' : 'MAJOR',
      message: failed.message,
      regulationReference: failed.regulationIdentifier,
      remediation: failed.remediation || 'Remediate formulation composition.'
    });
  }

  let mappedStatus: RegulatoryEvaluationReport['status'] = 'COMPLIANT';
  if (domainDecision.overallStatus === 'NON_COMPLIANT') {
    mappedStatus = 'NON_COMPLIANT';
  } else if (domainDecision.overallStatus === 'PARTIALLY_COMPLIANT' || domainDecision.overallStatus === 'REVIEW_REQUIRED') {
    mappedStatus = 'RESTRICTED';
  } else if (
    domainDecision.overallStatus === 'INSUFFICIENT_DATA' ||
    domainDecision.overallStatus === 'INSUFFICIENT_EVIDENCE' ||
    domainDecision.overallStatus === 'NOT_VERIFIED' ||
    domainDecision.overallStatus === 'REGULATORY_SCOPE_UNKNOWN'
  ) {
    mappedStatus = 'INSUFFICIENT_DATA';
  }

  return {
    compliant: domainDecision.overallStatus === 'COMPLIANT',
    status: mappedStatus,
    region: context?.targetRegion || 'GLOBAL',
    findings,
    restrictedIngredients: domainDecision.ingredientStatus.restrictedIngredientsDetected,
    bannedIngredientsDetected: domainDecision.ingredientStatus.bannedIngredientsDetected,
    phosphateCompliance: {
      compliant: domainDecision.failedRules.every(r => !r.ruleId.includes('PHOSPHATE')),
      totalPhosphatePct: 0,
      maxAllowedPct: context?.maxPhosphatePct ?? 0.5,
      status: domainDecision.failedRules.some(r => r.ruleId.includes('PHOSPHATE')) ? 'EXCEEDED' : 'PASS'
    },
    vocCompliance: {
      compliant: domainDecision.failedRules.every(r => !r.ruleId.includes('VOC')),
      totalVocPct: 0,
      maxAllowedPct: context?.maxVocPct ?? 8.0
    },
    preservativeCompliance: {
      compliant: true,
      activePreservatives: [],
      warnings: []
    },
    ghsClassification: {
      signalWord: safePH <= 2.0 || safePH >= 11.5 ? 'DANGER' : (safePH <= 4.0 || safePH >= 10.0 ? 'WARNING' : 'NONE'),
      hazardStatements: [],
      precautionaryStatements: [],
      hazardPictograms: []
    },
    engineVersion: DomainComplianceEngine.ENGINE_VERSION
  };
}
