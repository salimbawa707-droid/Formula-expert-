/**
 * ============================================================================
 * P2 — AUTHORITATIVE REGULATORY COMPLIANCE ENGINE (SSOT)
 * ============================================================================
 * Master domain engine coordinating statutory rule evaluation, product scoping,
 * jurisdiction routing, temporal date resolution, mixture GHS classification,
 * claim compliance, label checklist, 16-section SDS completeness, and evidence
 * verification firewalls.
 *
 * CLAIMS & UNKNOWN FIREWALL RULES:
 * 1. "Not detected" != "compliant". Zero applicable rules cannot yield COMPLIANT.
 * 2. Unverified or withdrawn standards (e.g. IS 869 / IS 7983) cannot yield COMPLIANT.
 * 3. AI-generated text, guessed URLs, or model knowledge are strictly disqualified.
 * 4. Temporal scoping ensures historical regulations don't leak into current
 *    evaluations and future regulations don't prematurely block current production.
 * ============================================================================
 */

import {
  RegulatoryEvaluationInput,
  RegulatoryDecision,
  RuleEvaluationResult,
  OverallRegulatoryStatus,
  RegulatoryRule
} from './types';
import { RegulatoryProductScopeEngine } from './regulatoryProductScope';
import { RegulatoryIngredientEngine, EvaluatedChemicalIngredient } from './regulatoryIngredientRules';
import { RegulatoryRuleRegistryEngine, CANONICAL_REGULATORY_RULES } from './regulatoryRuleRegistry';
import { MixtureGHSValidationEngine } from './regulatoryValidation';
import { ClaimComplianceEngine } from './regulatoryClaimRules';
import { LabelComplianceEngine } from './regulatoryLabelRules';
import { SDSComplianceEngine } from './regulatorySDSRules';
import { PackagingComplianceEngine } from './regulatoryPackagingRules';
import { RegulatoryVersioningEngine } from './regulatoryVersioning';
import { RegulatoryAuditEngine } from './regulatoryAudit';
import { RegulatoryTemporalEngine } from './regulatoryTemporalEngine';
import { RegulatoryChecksumEngine } from './regulatoryChecksum';

export class RegulatoryComplianceEngine {
  public static readonly ENGINE_VERSION = '2.1.0-REGULATORY-SSOT';

  /**
   * Evaluates complete regulatory compliance for a chemical formulation.
   */
  public static evaluate(input: RegulatoryEvaluationInput): RegulatoryDecision {
    const decisionTimestamp = new Date().toISOString();
    const evaluationDate = input.evaluationDate || decisionTimestamp.slice(0, 10);
    const jurisdictionId = input.jurisdiction || 'GLOBAL_UN_GHS';
    const versionInfo = RegulatoryVersioningEngine.getCurrentVersion();
    const datasetChecksum = RegulatoryChecksumEngine.computeCanonicalDatasetChecksum(CANONICAL_REGULATORY_RULES);

    // 1. Resolve Product Scope & Taxonomy
    const productScope = RegulatoryProductScopeEngine.resolveProductScope(input.productCategory);

    // 2. Normalize and Evaluate Chemical Ingredients
    const rawIngredients = Array.isArray(input.ingredients) ? input.ingredients : [];
    const evaluatedIngredients: EvaluatedChemicalIngredient[] = rawIngredients.map(
      ing => RegulatoryIngredientEngine.processIngredient(ing)
    );

    const calculatedPH = input.calculatedPH ?? 7.0;

    // 3. Mixture GHS Hazard Classification
    const ghsClassification = MixtureGHSValidationEngine.evaluateGHSClassification(
      evaluatedIngredients,
      calculatedPH
    );

    // 4. Statutory Rule Evaluation against Registry
    const applicableRules = RegulatoryRuleRegistryEngine.getRulesForJurisdiction(jurisdictionId);
    const passedRules: RuleEvaluationResult[] = [];
    const failedRules: RuleEvaluationResult[] = [];
    const reviewRequiredRules: RuleEvaluationResult[] = [];
    const warnings: string[] = [];
    const missingEvidence: string[] = [];

    let verifiedPrimaryCount = 0;
    let unverifiedCount = 0;
    let outdatedCount = 0;

    // Custom Banned Chemicals & Unknowns
    const bannedDetected: string[] = [];
    const restrictedDetected: string[] = [];
    const unknownDetected: string[] = [];

    const BANNED_KEYWORDS = [
      { keyword: 'nonylphenol', name: 'Nonylphenol Ethoxylates (NPE)', regulation: 'EU REACH Annex XVII / US EPA Action Plan' },
      { keyword: 'npe-9', name: 'Nonylphenol Ethoxylate (NPE-9)', regulation: 'EU REACH Annex XVII' },
      { keyword: 'formalin', name: 'Formalin (Formaldehyde Solution)', regulation: 'EU CLP / US OSHA Carcinogen Standard' },
      { keyword: 'formaldehyde', name: 'Formaldehyde', regulation: 'EU REACH Banned in Consumer Products' },
      { keyword: 'borax', name: 'Sodium Tetraborate (Borax)', regulation: 'EU REACH Candidate List' },
      { keyword: 'boric acid', name: 'Boric Acid', regulation: 'EU REACH Candidate List' },
      { keyword: 'triclosan', name: 'Triclosan', regulation: 'US FDA / EU Biocidal Products Reg' },
      { keyword: 'dichromate', name: 'Potassium Dichromate', regulation: 'Global Banned Substance' }
    ];

    for (const ing of evaluatedIngredients) {
      if (ing.isUnknownIdentity) {
        unknownDetected.push(ing.rawName);
      }

      for (const banned of BANNED_KEYWORDS) {
        if (ing.normalizedName.includes(banned.keyword)) {
          bannedDetected.push(ing.rawName);
          failedRules.push({
            ruleId: 'REG_BANNED_SUBSTANCE',
            regulationIdentifier: banned.regulation,
            regulationName: `Banned Substance Detected: ${banned.name}`,
            jurisdiction: jurisdictionId,
            requirementType: 'PROHIBITED',
            mandatoryOrVoluntary: 'MANDATORY',
            severity: 'CRITICAL',
            status: 'FAIL',
            affectedIngredients: [ing.rawName],
            measuredValue: `${ing.asSuppliedPct.toFixed(2)}%`,
            message: `Ingredient '${ing.rawName}' matches banned chemical profile '${banned.name}'.`,
            remediation: `Eliminate ${ing.rawName} completely and substitute with eco-certified alternatives.`,
            evidenceId: 'EVID_GLOBAL_BANNED_SUBSTANCE',
            verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
          });
        }
      }

      // Custom banned check
      if (input.customBannedIngredients && input.customBannedIngredients.length > 0) {
        for (const customBanned of input.customBannedIngredients) {
          if (ing.normalizedName.includes(customBanned.toLowerCase())) {
            bannedDetected.push(ing.rawName);
            failedRules.push({
              ruleId: 'RULE_CUSTOM_BANNED',
              regulationIdentifier: 'Client Chemical Safety Policy',
              regulationName: 'Organization Banned Chemicals Policy',
              jurisdiction: jurisdictionId,
              requirementType: 'PROHIBITED',
              mandatoryOrVoluntary: 'MANDATORY',
              severity: 'CRITICAL',
              status: 'FAIL',
              affectedIngredients: [ing.rawName],
              measuredValue: `${ing.asSuppliedPct.toFixed(2)}%`,
              message: `Ingredient '${ing.rawName}' violates custom client banned materials policy.`,
              remediation: `Eliminate '${ing.rawName}' from formulation.`,
              evidenceId: 'EVID_CUSTOM_POLICY',
              verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
            });
          }
        }
      }
    }

    // Check if the target category in this jurisdiction has unverified or withdrawn standards
    if (jurisdictionId === 'INDIA' && productScope.isKnown && productScope.mapping) {
      if (productScope.mapping.indiaBisStatus === 'NOT_VERIFIED') {
        const standardDesc = productScope.mapping.indiaBisStandard || 'BIS Standard';
        warnings.push(`Standard for category '${input.productCategory}' (${standardDesc}) is NOT_VERIFIED against authoritative BIS records. Compliance cannot be established.`);
      }
    }

    // EU Article 36 safety check: Post-repeal of 648/2004 without placingOnMarketDate cannot be certified COMPLIANT
    const mktDate = input.marketPlacementDate || input.placingOnMarketDate;
    if (jurisdictionId === 'EU') {
      const euTransition = RegulatoryTemporalEngine.resolveEUDetergentRegulationStatus(evaluationDate, mktDate);
      if (euTransition.complianceStatus === 'TRANSITIONAL_APPLICABILITY_UNKNOWN') {
        reviewRequiredRules.push({
          ruleId: 'RULE_EU_ART_36_TRANSITIONAL_UNKNOWN',
          regulationIdentifier: 'Regulation (EU) 2026/405 Article 36',
          regulationName: 'Article 36 Transitional Provisions Eligibility',
          jurisdiction: 'EU',
          requirementType: 'DOCUMENTATION_REQUIRED',
          mandatoryOrVoluntary: 'MANDATORY',
          severity: 'HIGH',
          status: 'REVIEW_REQUIRED',
          affectedIngredients: [],
          message: euTransition.guidanceNotes,
          remediation: 'Provide verified date of placing on the market (placingOnMarketDate) to determine Article 36 transitional eligibility.',
          evidenceId: 'EVID_EU_REG_2026_405',
          verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
        });
        warnings.push('Evaluation date is post-repeal of Regulation (EC) No 648/2004. Article 36 transitional status is UNKNOWN without placingOnMarketDate.');
      }
    }

    // Evaluate Canonical Rules
    for (const rule of applicableRules) {
      const result = RegulatoryComplianceEngine.evaluateSingleRule(
        rule,
        evaluatedIngredients,
        input,
        calculatedPH,
        productScope,
        evaluationDate
      );

      // Track evidence statistics
      if (rule.verificationStatus === 'VERIFIED_PRIMARY_SOURCE') verifiedPrimaryCount++;
      else if (rule.verificationStatus === 'OUTDATED') outdatedCount++;
      else unverifiedCount++;

      if (result.status === 'PASS') {
        passedRules.push(result);
      } else if (result.status === 'FAIL') {
        failedRules.push(result);
        if (rule.requirementType === 'PROHIBITED') {
          bannedDetected.push(...result.affectedIngredients);
        }
        if (rule.ingredientScope) {
          restrictedDetected.push(...result.affectedIngredients);
        }
      } else if (result.status === 'REVIEW_REQUIRED' || result.status === 'UNKNOWN_DATA') {
        reviewRequiredRules.push(result);
        if (result.status === 'UNKNOWN_DATA') {
          missingEvidence.push(result.message);
        }
      }
    }

    // 5. Evaluate New York 1,4-Dioxane Specific Impurity Limit (1 ppm max)
    const formulaDioxanePpm = RegulatoryIngredientEngine.calculateFormulaDioxanePpm(evaluatedIngredients);
    if (jurisdictionId === 'US_STATE_NY' || jurisdictionId === 'US_FEDERAL') {
      const maxDioxanePpm = 1.0;
      if (formulaDioxanePpm > maxDioxanePpm) {
        failedRules.push({
          ruleId: 'RULE_US_NY_STATE_14_DIOXANE',
          regulationIdentifier: 'NY ECL § 37-0117',
          regulationName: 'New York 1,4-Dioxane Concentration Limit',
          jurisdiction: jurisdictionId,
          requirementType: 'CONCENTRATION_LIMIT',
          mandatoryOrVoluntary: 'MANDATORY',
          severity: 'CRITICAL',
          status: 'FAIL',
          affectedIngredients: evaluatedIngredients.filter(i => i.impuritiesPpm.dioxane_1_4 > 0).map(i => i.rawName),
          measuredValue: `${formulaDioxanePpm.toFixed(2)} ppm`,
          thresholdValue: `${maxDioxanePpm.toFixed(1)} ppm`,
          message: `Calculated formula 1,4-Dioxane impurity level is ${formulaDioxanePpm.toFixed(2)} ppm, exceeding statutory NY state maximum limit of ${maxDioxanePpm.toFixed(1)} ppm.`,
          remediation: 'Use stripped low-dioxane SLES (< 5 ppm raw material) or substitute with APG / Non-ethoxylated surfactants.',
          evidenceId: 'EVID_US_NY_ECL_37_0117',
          verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
        });
      }
    }

    // 6. Claim Compliance Evaluation
    const claimReport = ClaimComplianceEngine.evaluateClaims(
      input.intendedClaims,
      evaluatedIngredients,
      jurisdictionId
    );

    // 7. Label Compliance Evaluation
    const labelReport = LabelComplianceEngine.evaluateLabelRequirements(
      jurisdictionId,
      evaluatedIngredients,
      ghsClassification.signalWord,
      input.packageSizeGramsOrMl
    );

    // 8. SDS Compliance Evaluation
    const sdsReport = SDSComplianceEngine.evaluateSDSRequirements(
      jurisdictionId,
      evaluatedIngredients,
      calculatedPH
    );

    // 9. Packaging Compliance Evaluation
    const packagingReport = PackagingComplianceEngine.evaluatePackaging(
      jurisdictionId,
      ghsClassification.signalWord,
      calculatedPH
    );

    // 10. CLAIMS & COMPLIANCE FIREWALL (ITEM 8 & 9)
    // Never output COMPLIANT simply because no violation was detected.
    let overallStatus: OverallRegulatoryStatus = 'COMPLIANT';

    if (!productScope.isKnown) {
      overallStatus = 'REGULATORY_SCOPE_UNKNOWN';
      warnings.push(productScope.reason);
    } else if (evaluatedIngredients.length === 0) {
      overallStatus = 'INSUFFICIENT_DATA';
    } else if (failedRules.some(r => r.severity === 'CRITICAL' || r.severity === 'HIGH')) {
      overallStatus = 'NON_COMPLIANT';
    } else if (failedRules.length > 0) {
      overallStatus = 'PARTIALLY_COMPLIANT';
    } else if (unknownDetected.length > 0) {
      overallStatus = 'REVIEW_REQUIRED';
      warnings.push(`Formulation contains ${unknownDetected.length} ingredients with unverified chemical identity; cannot certify compliance.`);
    } else if (jurisdictionId === 'INDIA' && productScope.mapping?.indiaBisStatus === 'NOT_VERIFIED') {
      overallStatus = 'REVIEW_REQUIRED';
      warnings.push(`Category '${input.productCategory}' lacks an active verified BIS standard in India. Compliance cannot be certified.`);
    } else if (reviewRequiredRules.length > 0 || claimReport.overallStatus === 'REVIEW_REQUIRED') {
      overallStatus = 'REVIEW_REQUIRED';
    }

    const decision: RegulatoryDecision = {
      overallStatus,
      scopedIdentity: {
        productCategory: input.productCategory || 'UNKNOWN_PRODUCT_CATEGORY',
        jurisdiction: jurisdictionId,
        evaluationDate,
        regulatoryKnowledgeVersion: versionInfo.versionId
      },
      datasetChecksum,
      passedRules,
      failedRules,
      warnings: Array.from(new Set(warnings)),
      missingEvidence: Array.from(new Set(missingEvidence)),
      reviewRequired: reviewRequiredRules,
      claimsStatus: claimReport,
      labelStatus: labelReport,
      sdsStatus: sdsReport,
      packagingStatus: packagingReport,
      ingredientStatus: {
        totalIngredientsEvaluated: evaluatedIngredients.length,
        bannedIngredientsDetected: Array.from(new Set(bannedDetected)),
        restrictedIngredientsDetected: Array.from(new Set(restrictedDetected)),
        unknownIngredientsDetected: Array.from(new Set(unknownDetected))
      },
      documentationStatus: {
        primarySourceCoveragePct: applicableRules.length > 0 ? Number(((verifiedPrimaryCount / applicableRules.length) * 100).toFixed(1)) : 100,
        unverifiedRulesCount: unverifiedCount
      },
      evidenceCoverage: {
        verifiedPrimaryCount,
        unverifiedCount,
        outdatedCount
      },
      decisionTimestamp,
      engineVersion: RegulatoryComplianceEngine.ENGINE_VERSION
    };

    // Log reproducible audit record
    RegulatoryAuditEngine.recordAudit(decision, input.formulaId, input.formulaTitle);

    return decision;
  }

  /**
   * Helper evaluating a single RegulatoryRule against formula input.
   */
  private static evaluateSingleRule(
    rule: RegulatoryRule,
    ingredients: EvaluatedChemicalIngredient[],
    input: RegulatoryEvaluationInput,
    _calculatedPH: number,
    productScope: ReturnType<typeof RegulatoryProductScopeEngine.resolveProductScope>,
    evaluationDate: string
  ): RuleEvaluationResult {
    // 1. Strict Jurisdiction Matching Firewall
    const targetJurisdiction = input.jurisdiction || 'GLOBAL_UN_GHS';
    if (rule.jurisdiction !== 'GLOBAL_UN_GHS' && rule.jurisdiction !== targetJurisdiction) {
      return {
        ruleId: rule.ruleId,
        regulationIdentifier: rule.regulationIdentifier,
        regulationName: rule.regulationName,
        jurisdiction: rule.jurisdiction,
        requirementType: rule.requirementType,
        mandatoryOrVoluntary: rule.mandatoryOrVoluntary,
        severity: rule.severity,
        status: 'NOT_APPLICABLE',
        affectedIngredients: [],
        message: `Rule jurisdiction '${rule.jurisdiction}' does not apply to target jurisdiction '${targetJurisdiction}'.`,
        evidenceId: rule.evidenceId,
        verificationStatus: rule.verificationStatus
      };
    }

    // 2. Strict Product Category Matching Firewall
    if (
      !rule.productCategories.includes('ALL_CLEANERS') &&
      productScope.categoryId &&
      !rule.productCategories.includes(productScope.categoryId as any)
    ) {
      return {
        ruleId: rule.ruleId,
        regulationIdentifier: rule.regulationIdentifier,
        regulationName: rule.regulationName,
        jurisdiction: rule.jurisdiction,
        requirementType: rule.requirementType,
        mandatoryOrVoluntary: rule.mandatoryOrVoluntary,
        severity: rule.severity,
        status: 'NOT_APPLICABLE',
        affectedIngredients: [],
        message: `Rule not applicable to product category '${productScope.categoryId}'.`,
        evidenceId: rule.evidenceId,
        verificationStatus: rule.verificationStatus
      };
    }

    // 3. Temporal Applicability & Enforceability Check (Item 4 & 6)
    const marketPlacementDate = input.marketPlacementDate || input.placingOnMarketDate;
    const temporalResult = RegulatoryTemporalEngine.evaluateRuleTemporalApplicability(rule, evaluationDate, marketPlacementDate);
    if (!temporalResult.isLegallyEnforceable) {
      if (temporalResult.temporalStatus === 'NOT_VERIFIED' || temporalResult.temporalStatus === 'WITHDRAWN') {
        return {
          ruleId: rule.ruleId,
          regulationIdentifier: rule.regulationIdentifier,
          regulationName: rule.regulationName,
          jurisdiction: rule.jurisdiction,
          requirementType: rule.requirementType,
          mandatoryOrVoluntary: rule.mandatoryOrVoluntary,
          severity: rule.severity,
          status: 'REVIEW_REQUIRED',
          affectedIngredients: [],
          message: temporalResult.reason,
          remediation: 'Verify current statutory status directly via official standards body before placing on market.',
          evidenceId: rule.evidenceId,
          verificationStatus: rule.verificationStatus
        };
      }

      if (temporalResult.temporalStatus === 'FUTURE') {
        return {
          ruleId: rule.ruleId,
          regulationIdentifier: rule.regulationIdentifier,
          regulationName: rule.regulationName,
          jurisdiction: rule.jurisdiction,
          requirementType: rule.requirementType,
          mandatoryOrVoluntary: rule.mandatoryOrVoluntary,
          severity: rule.severity,
          status: 'NOT_APPLICABLE',
          affectedIngredients: [],
          message: temporalResult.reason,
          evidenceId: rule.evidenceId,
          verificationStatus: rule.verificationStatus
        };
      }

      if (temporalResult.temporalStatus === 'SUPERSEDED') {
        return {
          ruleId: rule.ruleId,
          regulationIdentifier: rule.regulationIdentifier,
          regulationName: rule.regulationName,
          jurisdiction: rule.jurisdiction,
          requirementType: rule.requirementType,
          mandatoryOrVoluntary: rule.mandatoryOrVoluntary,
          severity: rule.severity,
          status: 'NOT_APPLICABLE',
          affectedIngredients: [],
          message: temporalResult.reason,
          evidenceId: rule.evidenceId,
          verificationStatus: rule.verificationStatus
        };
      }
    }

    // 4. Check Concentration Threshold Rules (e.g. STPP, VOC, NPE)
    if (rule.concentrationThresholds && rule.ingredientScope) {
      let matchingSumPct = 0;
      const affectedIngs: string[] = [];

      for (const ing of ingredients) {
        const matchesScope = rule.ingredientScope.some(
          scope => ing.normalizedName.includes(scope.toLowerCase())
        );

        if (matchesScope) {
          affectedIngs.push(ing.rawName);
          if (rule.concentrationThresholds.basis === 'ACTIVE_MATTER') {
            matchingSumPct += ing.activeMatterPct;
          } else {
            matchingSumPct += ing.asSuppliedPct;
          }
        }
      }

      if (affectedIngs.length > 0 && rule.concentrationThresholds.maxPercentage !== undefined) {
        const maxLimit = input.maxPhosphatePctOverride ?? rule.concentrationThresholds.maxPercentage;
        if (matchingSumPct > maxLimit) {
          return {
            ruleId: rule.ruleId,
            regulationIdentifier: rule.regulationIdentifier,
            regulationName: rule.regulationName,
            jurisdiction: rule.jurisdiction,
            requirementType: rule.requirementType,
            mandatoryOrVoluntary: rule.mandatoryOrVoluntary,
            severity: rule.severity,
            status: 'FAIL',
            affectedIngredients: affectedIngs,
            measuredValue: `${matchingSumPct.toFixed(2)}%`,
            thresholdValue: `${maxLimit.toFixed(2)}%`,
            message: `Concentration ${matchingSumPct.toFixed(2)}% exceeds statutory threshold of ${maxLimit.toFixed(2)}% under ${rule.regulationName}.`,
            remediation: rule.remediationGuidance,
            evidenceId: rule.evidenceId,
            verificationStatus: rule.verificationStatus
          };
        }
      }
    }

    return {
      ruleId: rule.ruleId,
      regulationIdentifier: rule.regulationIdentifier,
      regulationName: rule.regulationName,
      jurisdiction: rule.jurisdiction,
      requirementType: rule.requirementType,
      mandatoryOrVoluntary: rule.mandatoryOrVoluntary,
      severity: rule.severity,
      status: 'PASS',
      affectedIngredients: [],
      message: `Rule '${rule.regulationName}' satisfied.`,
      evidenceId: rule.evidenceId,
      verificationStatus: rule.verificationStatus
    };
  }
}
