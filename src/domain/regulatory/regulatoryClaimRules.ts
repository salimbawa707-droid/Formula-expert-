/**
 * ============================================================================
 * P2 — CLAIM COMPLIANCE ENGINE
 * ============================================================================
 * Evaluates commercial product claims against evidence requirements.
 * Prevents unsubstantiated, misleading, or deceptive marketing claims.
 * ============================================================================
 */

import { ClaimEvaluationResult, RegulatoryJurisdictionId } from './types';
import { EvaluatedChemicalIngredient } from './regulatoryIngredientRules';

export interface ClaimDefinition {
  claimKey: string;
  claimName: string;
  requiredEvidenceType: string;
  testProtocolRequired?: string;
  permittedWording: string[];
  prohibitedWording: string[];
}

export const CANONICAL_CLAIM_DEFINITIONS: Record<string, ClaimDefinition> = {
  BIODEGRADABLE: {
    claimKey: 'BIODEGRADABLE',
    claimName: 'Readily Biodegradable',
    requiredEvidenceType: 'OECD 301B / 301D Ready Biodegradability Test Report',
    testProtocolRequired: 'OECD 301B (> 60% ThCO2 degradation within 28 days)',
    permittedWording: ['Readily Biodegradable Formula', 'Formulated with Readily Biodegradable Surfactants'],
    prohibitedWording: ['100% Eco-Friendly', 'Zero Environmental Impact', 'Naturally Degrades Instantly']
  },
  PHOSPHATE_FREE: {
    claimKey: 'PHOSPHATE_FREE',
    claimName: 'Phosphate-Free / Zero Phosphorus',
    requiredEvidenceType: 'Formula Composition Audit showing 0.00% inorganic phosphate builders',
    permittedWording: ['Phosphate-Free', '0% Added Phosphates', 'Eco-Friendly Builder System'],
    prohibitedWording: ['100% Organic', 'Zero Chemical Content']
  },
  BLEACH_FREE: {
    claimKey: 'BLEACH_FREE',
    claimName: 'Bleach-Free / Chlorine-Free',
    requiredEvidenceType: 'Formula Composition Audit showing 0.00% chlorine/peroxide bleach',
    permittedWording: ['Bleach-Free Formula', 'No Chlorine Bleach'],
    prohibitedWording: ['Non-Chemical Cleaner']
  },
  MICROPLASTIC_FREE: {
    claimKey: 'MICROPLASTIC_FREE',
    claimName: 'Microplastic-Free',
    requiredEvidenceType: 'ECHA Synthetic Polymer Microplastics Exemption Audit',
    permittedWording: ['Microplastic-Free', 'Zero Synthetic Polymer Beads'],
    prohibitedWording: ['100% Plastic Neutral']
  },
  HYPOALLERGENIC: {
    claimKey: 'HYPOALLERGENIC',
    claimName: 'Hypoallergenic / Dermatologically Tested',
    requiredEvidenceType: 'HRIPT (Human Repeat Insult Patch Test) Clinical Trial Report',
    testProtocolRequired: 'Dermatological HRIPT Patch Test on >= 50 human subjects',
    permittedWording: ['Dermatologically Tested', 'Formulated to Minimize Risk of Allergy'],
    prohibitedWording: ['Guaranteed 100% Allergy-Proof', 'Will Never Cause Irritation']
  },
  ANTIBACTERIAL: {
    claimKey: 'ANTIBACTERIAL',
    claimName: 'Antibacterial / Kills 99.9% Germs',
    requiredEvidenceType: 'EN 1276 / ASTM E2315 Microbiological Efficacy Test Report',
    testProtocolRequired: 'EN 1276 (5-minute contact time, 5-log bacterial reduction)',
    permittedWording: ['Antibacterial Action', 'Kills 99.9% of Tested Bacteria'],
    prohibitedWording: ['Kills All Germs', 'Prevents All Diseases', 'COVID-19 Cure']
  }
};

export class ClaimComplianceEngine {
  public static evaluateClaims(
    intendedClaims: string[] | undefined,
    ingredients: EvaluatedChemicalIngredient[],
    jurisdiction: RegulatoryJurisdictionId = 'GLOBAL_UN_GHS'
  ): {
    overallStatus: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
    evaluations: ClaimEvaluationResult[];
  } {
    if (!intendedClaims || intendedClaims.length === 0) {
      return {
        overallStatus: 'PASS',
        evaluations: []
      };
    }

    const evaluations: ClaimEvaluationResult[] = [];
    let hasSubstantiationIssue = false;

    for (const rawClaim of intendedClaims) {
      const normalizedKey = rawClaim.toUpperCase().replace(/[\s-]/g, '_');
      const def = CANONICAL_CLAIM_DEFINITIONS[normalizedKey];

      if (!def) {
        evaluations.push({
          claimName: rawClaim,
          status: 'REVIEW_REQUIRED',
          requiredEvidenceType: 'Unrecognized custom claim definition',
          hasRequiredEvidence: false,
          permittedWording: [rawClaim],
          prohibitedWording: ['Unverified absolute claims'],
          reason: `Custom claim '${rawClaim}' is unrecognized in standard claim registry; human marketing compliance review required.`
        });
        hasSubstantiationIssue = true;
        continue;
      }

      // Check specific formula composition prerequisites
      if (def.claimKey === 'PHOSPHATE_FREE') {
        const hasPhosphate = ingredients.some(i => i.normalizedName.includes('stpp') || i.normalizedName.includes('phosphate'));
        if (hasPhosphate) {
          evaluations.push({
            claimName: def.claimName,
            status: 'PROHIBITED_CLAIM',
            requiredEvidenceType: def.requiredEvidenceType,
            hasRequiredEvidence: false,
            permittedWording: def.permittedWording,
            prohibitedWording: def.prohibitedWording,
            reason: 'Formula contains inorganic phosphate builder (STPP); claim "Phosphate-Free" is false and prohibited.'
          });
          hasSubstantiationIssue = true;
          continue;
        }
      }

      if (def.claimKey === 'BLEACH_FREE') {
        const hasBleach = ingredients.some(i => i.normalizedName.includes('hypochlorite') || i.normalizedName.includes('peroxide'));
        if (hasBleach) {
          evaluations.push({
            claimName: def.claimName,
            status: 'PROHIBITED_CLAIM',
            requiredEvidenceType: def.requiredEvidenceType,
            hasRequiredEvidence: false,
            permittedWording: def.permittedWording,
            prohibitedWording: def.prohibitedWording,
            reason: 'Formula contains active bleach component; claim "Bleach-Free" is false and prohibited.'
          });
          hasSubstantiationIssue = true;
          continue;
        }
      }

      // Claims requiring clinical/laboratory test reports flag CLAIM_NOT_SUBSTANTIATED unless lab report exists
      if (def.claimKey === 'HYPOALLERGENIC' || def.claimKey === 'ANTIBACTERIAL' || def.claimKey === 'BIODEGRADABLE') {
        evaluations.push({
          claimName: def.claimName,
          status: 'CLAIM_NOT_SUBSTANTIATED',
          requiredEvidenceType: def.requiredEvidenceType,
          hasRequiredEvidence: false,
          permittedWording: def.permittedWording,
          prohibitedWording: def.prohibitedWording,
          reason: `Claim '${def.claimName}' requires mandatory lab/clinical trial report (${def.requiredEvidenceType}). Evidence is currently missing; status set to CLAIM_NOT_SUBSTANTIATED.`
        });
        hasSubstantiationIssue = true;
        continue;
      }

      evaluations.push({
        claimName: def.claimName,
        status: 'SUBSTANTIATED',
        requiredEvidenceType: def.requiredEvidenceType,
        hasRequiredEvidence: true,
        permittedWording: def.permittedWording,
        prohibitedWording: def.prohibitedWording,
        reason: `Claim '${def.claimName}' complies with formula composition rules in ${jurisdiction}.`
      });
    }

    return {
      overallStatus: hasSubstantiationIssue ? 'REVIEW_REQUIRED' : 'PASS',
      evaluations
    };
  }
}
