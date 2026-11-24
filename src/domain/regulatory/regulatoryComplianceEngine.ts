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
    const isKnownJurisdiction = versionInfo.jurisdictions.includes(
      jurisdictionId as (typeof versionInfo.jurisdictions)[number]
    );
    const datasetChecksum = RegulatoryChecksumEngine.computeCanonicalDatasetChecksum(CANONICAL_REGULATORY_RULES);

    // 1. Resolve Product Scope & Taxonomy
    const productScope = RegulatoryProductScopeEngine.resolveProductScope(input.productCategory);

    // 2. Normalize and Evaluate Chemical Ingredients
    const rawIngredients = Array.isArray(input.ingredients) ? input.ingredients : [];
    const evaluatedIngredients: EvaluatedChemicalIngredient[] = rawIngredients.map(
      ing => RegulatoryIngredientEngine.processIngredient(ing)
    );

    const calculatedPH = input.calculatedPH;

    // Missing assay/measurement inputs must remain visible and block certification.
    const compositionTotalPct = evaluatedIngredients.reduce((sum, ing) => sum + ing.asSuppliedPct, 0);
    const compositionPercentagesValid = evaluatedIngredients.every(ing =>
      Number.isFinite(ing.asSuppliedPct) && ing.asSuppliedPct >= 0 && ing.asSuppliedPct <= 100
    );
    const compositionMissingData = !compositionPercentagesValid || Math.abs(compositionTotalPct - 100) > 0.01
      ? [`Formula composition totals ${Number.isFinite(compositionTotalPct) ? compositionTotalPct.toFixed(3) : 'an invalid value'}%; provide valid ingredient percentages totaling 100.000% ±0.010% before regulatory concentration calculations.`]
      : [];
    const ingredientMissingData = [
      ...evaluatedIngredients.flatMap(ing => ing.missingDataPoints.map(detail => `${ing.rawName}: ${detail}`)),
      ...compositionMissingData
    ];

    // 3. Mixture GHS Hazard Classification
    const ghsClassification = MixtureGHSValidationEngine.evaluateGHSClassification(
      evaluatedIngredients,
      calculatedPH
    );
    const ghsMissingData = ghsClassification.missingDataPoints;

    // 4. Statutory Rule Evaluation against Registry
    const applicableRules = isKnownJurisdiction
      ? RegulatoryRuleRegistryEngine.getRulesForJurisdiction(jurisdictionId)
      : [];
    const passedRules: RuleEvaluationResult[] = [];
    const failedRules: RuleEvaluationResult[] = [];
    const reviewRequiredRules: RuleEvaluationResult[] = [];
    const warnings: string[] = [];
    const missingEvidence: string[] = [];

    let verifiedPrimaryCount = 0;
    let unverifiedCount = 0;
    let outdatedCount = 0;
    let evaluatedApplicableRuleCount = 0;

    // Custom Banned Chemicals & Unknowns
    const bannedDetected: string[] = [];
    const restrictedDetected: string[] = [];
    const unknownDetected: string[] = [];

    const CHEMICAL_SCREENING_KEYWORDS = [
      { keyword: 'nonylphenol', name: 'Nonylphenol Ethoxylates (NPE)' },
      { keyword: 'npe-9', name: 'Nonylphenol Ethoxylate (NPE-9)' },
      { keyword: 'formalin', name: 'Formalin / Formaldehyde Solution' },
      { keyword: 'formaldehyde', name: 'Formaldehyde' },
      { keyword: 'borax', name: 'Sodium Tetraborate (Borax)' },
      { keyword: 'boric acid', name: 'Boric Acid' },
      { keyword: 'triclosan', name: 'Triclosan' },
      { keyword: 'dichromate', name: 'Dichromate compounds' }
    ];

    for (const ing of evaluatedIngredients) {
      if (ing.isUnknownIdentity) {
        unknownDetected.push(ing.rawName);
      }

      // Name-only keyword matches are screening flags, not universal legal bans.
      // Statutory failures must come from an exact jurisdiction-scoped rule.
      const screeningHit = CHEMICAL_SCREENING_KEYWORDS.find(item => ing.normalizedName.includes(item.keyword));
      if (screeningHit) {
        reviewRequiredRules.push({
          ruleId: 'RULE_NAME_BASED_CHEMICAL_SCREENING',
          regulationIdentifier: 'CHEMICAL_SCREENING_ONLY',
          regulationName: 'Name-based chemical concern screening (not a legal determination)',
          jurisdiction: jurisdictionId,
          requirementType: 'HUMAN_REVIEW_REQUIRED',
          mandatoryOrVoluntary: 'MANDATORY',
          severity: 'HIGH',
          status: 'REVIEW_REQUIRED',
          affectedIngredients: [ing.rawName],
          message: `Ingredient name matches screening term '${screeningHit.name}'. This keyword hit does not establish a banned or restricted legal status.`,
          remediation: 'Verify exact CAS/EC identity, concentration, product use and current jurisdiction-specific official legislation before making a legal determination.',
          evidenceId: 'EVID_CHEMICAL_SCREENING_ONLY',
          verificationStatus: 'NOT_VERIFIED'
        });
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

      // Rules outside the selected product category are not applicable and must
      // not dilute source coverage or force review for an unrelated product.
      if (result.status === 'NOT_APPLICABLE') continue;
      evaluatedApplicableRuleCount++;

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

    // 5. Evaluate New York 1,4-Dioxane limit only in New York jurisdiction.
    // Missing raw-material assays are UNKNOWN, never silently treated as zero.
    const formulaDioxanePpm = RegulatoryIngredientEngine.calculateFormulaDioxanePpm(evaluatedIngredients);
    if (jurisdictionId === 'US_STATE_NY') {
      const maxDioxanePpm = 1.0;
      if (formulaDioxanePpm === null) {
        const message = '1,4-dioxane concentration cannot be calculated: one or more ethoxylated raw materials lack an explicit supplier assay.';
        missingEvidence.push(message);
        reviewRequiredRules.push({
          ruleId: 'RULE_US_NY_STATE_14_DIOXANE_ASSAY_MISSING',
          regulationIdentifier: 'NY ECL § 37-0117',
          regulationName: 'New York 1,4-Dioxane Concentration Limit',
          jurisdiction: 'US_STATE_NY',
          requirementType: 'TESTING_REQUIRED',
          mandatoryOrVoluntary: 'MANDATORY',
          severity: 'HIGH',
          status: 'UNKNOWN_DATA',
          affectedIngredients: evaluatedIngredients.filter(i => i.missingDataPoints.some(d => d.includes('1,4-dioxane'))).map(i => i.rawName),
          message,
          remediation: 'Obtain lot-specific 1,4-dioxane COA or accredited test result for every ethoxylated raw material.',
          evidenceId: 'EVID_US_NY_ECL_37_0117',
          verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
        });
      } else if (formulaDioxanePpm > maxDioxanePpm) {
        failedRules.push({
          ruleId: 'RULE_US_NY_STATE_14_DIOXANE',
          regulationIdentifier: 'NY ECL § 37-0117',
          regulationName: 'New York 1,4-Dioxane Concentration Limit',
          jurisdiction: jurisdictionId,
          requirementType: 'CONCENTRATION_LIMIT',
          mandatoryOrVoluntary: 'MANDATORY',
          severity: 'CRITICAL',
          status: 'FAIL',
          affectedIngredients: evaluatedIngredients.filter(i => (i.impuritiesPpm.dioxane_1_4 ?? 0) > 0).map(i => i.rawName),
          measuredValue: `${formulaDioxanePpm.toFixed(2)} ppm`,
          thresholdValue: `${maxDioxanePpm.toFixed(1)} ppm`,
          message: `Calculated formula 1,4-Dioxane impurity level is ${formulaDioxanePpm.toFixed(2)} ppm, exceeding statutory NY state maximum limit of ${maxDioxanePpm.toFixed(1)} ppm.`,
          remediation: 'Use stripped low-dioxane SLES (< 5 ppm raw material) or substitute with APG / Non-ethoxylated surfactants.',
          evidenceId: 'EVID_US_NY_ECL_37_0117',
          verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
        });
      } else {
        passedRules.push({
          ruleId: 'RULE_US_NY_STATE_14_DIOXANE',
          regulationIdentifier: 'NY ECL § 37-0117',
          regulationName: 'New York 1,4-Dioxane Concentration Limit',
          jurisdiction: jurisdictionId,
          requirementType: 'CONCENTRATION_LIMIT',
          mandatoryOrVoluntary: 'MANDATORY',
          severity: 'CRITICAL',
          status: 'PASS',
          affectedIngredients: evaluatedIngredients.filter(i => (i.impuritiesPpm.dioxane_1_4 ?? 0) > 0).map(i => i.rawName),
          measuredValue: `${formulaDioxanePpm.toFixed(3)} ppm`,
          thresholdValue: `${maxDioxanePpm.toFixed(1)} ppm`,
          message: `Calculated formula 1,4-dioxane impurity level is within the New York maximum limit of ${maxDioxanePpm.toFixed(1)} ppm.`,
          evidenceId: 'EVID_US_NY_ECL_37_0117',
          verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
        });
      }
    }

    // Missing ingredient and GHS inputs are explicit review blockers.
    const allMissingInputDetails = [...ingredientMissingData, ...ghsMissingData];
    if (allMissingInputDetails.length > 0) {
      missingEvidence.push(...allMissingInputDetails);
      reviewRequiredRules.push({
        ruleId: 'REG_FORMULATION_INPUTS_INCOMPLETE',
        regulationIdentifier: 'FORMULATION_INPUT_DATA',
        regulationName: 'Regulatory Ingredient and GHS Input Completeness',
        jurisdiction: jurisdictionId,
        requirementType: 'HUMAN_REVIEW_REQUIRED',
        mandatoryOrVoluntary: 'MANDATORY',
        severity: 'HIGH',
        status: 'UNKNOWN_DATA',
        affectedIngredients: evaluatedIngredients.filter(i => i.missingDataPoints.length > 0).map(i => i.rawName),
        message: allMissingInputDetails.join(' '),
        remediation: 'Supply verified chemical identity, supplier active-matter assays, and measured formulation pH before regulatory certification.',
        evidenceId: 'EVID_FORMULATION_INPUT_COMPLETENESS',
        verificationStatus: 'NOT_VERIFIED'
      });
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

    if (!isKnownJurisdiction) {
      overallStatus = 'REGULATORY_SCOPE_UNKNOWN';
      warnings.push(`Jurisdiction '${jurisdictionId}' is not present in the regulatory rule registry. Global rules are not silently substituted for an unknown jurisdiction.`);
    } else if (!productScope.isKnown) {
      overallStatus = 'REGULATORY_SCOPE_UNKNOWN';
      warnings.push(productScope.reason);
    } else if (evaluatedIngredients.length === 0) {
      overallStatus = 'INSUFFICIENT_DATA';
    } else if (claimReport.overallStatus === 'FAIL') {
      overallStatus = 'NON_COMPLIANT';
      warnings.push('One or more intended marketing claims are contradicted by the supplied formula composition.');
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
    } else if (evaluatedApplicableRuleCount === 0) {
      overallStatus = 'INSUFFICIENT_DATA';
      warnings.push(`No applicable regulatory rules were found for jurisdiction '${jurisdictionId}' and product category '${input.productCategory}'. Absence of a detected rule is not evidence of compliance.`);
    } else if (unverifiedCount > 0 || outdatedCount > 0 || verifiedPrimaryCount === 0) {
      overallStatus = 'REVIEW_REQUIRED';
      warnings.push('One or more applicable regulatory rules lack current verified primary-source support; compliance cannot be certified.');
    } else if (
      reviewRequiredRules.length > 0 ||
      claimReport.overallStatus === 'REVIEW_REQUIRED' ||
      labelReport.overallLabelStatus !== 'PASS' ||
      sdsReport.overallSDSStatus !== 'PASS' ||
      packagingReport.overallPackagingStatus !== 'PASS'
    ) {
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
        primarySourceCoveragePct: evaluatedApplicableRuleCount > 0 ? Number(((verifiedPrimaryCount / evaluatedApplicableRuleCount) * 100).toFixed(1)) : null as any,
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
    _calculatedPH: number | undefined,
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

    // New York dioxane is calculated from lot-specific impurity assays in the
    // evaluate() coordinator. Never treat the SLES ingredient percentage as dioxane.
    if (rule.ruleId === 'RULE_US_NY_STATE_14_DIOXANE') {
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
        message: 'Evaluated by the dedicated finished-formula impurity assay pathway.',
        evidenceId: rule.evidenceId,
        verificationStatus: rule.verificationStatus
      };
    }

    // 4. Check concentration thresholds only when the declared unit and basis
    // can be calculated from supplied formula data. Never compare unlike units.
    if (rule.concentrationThresholds && (rule.ingredientScope || rule.chemicalIdentifiers)) {
      const threshold = rule.concentrationThresholds;
      const formulaTotalPct = ingredients.reduce((sum, ing) => sum + ing.asSuppliedPct, 0);
      const validMassBalance = ingredients.length > 0 &&
        ingredients.every(ing => Number.isFinite(ing.asSuppliedPct) && ing.asSuppliedPct >= 0 && ing.asSuppliedPct <= 100) &&
        Math.abs(formulaTotalPct - 100) <= 0.01;
      const supportedUnitBasis =
        threshold.unit === 'WEIGHT_PCT' &&
        ['ACTIVE_MATTER', 'AS_SUPPLIED', 'FORMULA_TOTAL', 'FINISHED_PRODUCT'].includes(threshold.basis);

      if (!validMassBalance || !supportedUnitBasis) {
        return {
          ruleId: rule.ruleId,
          regulationIdentifier: rule.regulationIdentifier,
          regulationName: rule.regulationName,
          jurisdiction: rule.jurisdiction,
          requirementType: rule.requirementType,
          mandatoryOrVoluntary: rule.mandatoryOrVoluntary,
          severity: rule.severity,
          status: 'UNKNOWN_DATA',
          affectedIngredients: [],
          message: !validMassBalance
            ? 'A valid 100% formula mass balance is required before concentration thresholds can be evaluated.'
            : `Threshold unit/basis (${threshold.unit} / ${threshold.basis}) requires inputs or a conversion model not available in this evaluation.`,
          remediation: 'Provide a complete mass-balanced formula and the required density, impurity, dose or other basis-specific measurements; do not infer a result from weight percentage.',
          evidenceId: rule.evidenceId,
          verificationStatus: rule.verificationStatus
        };
      }

      const identifier = rule.chemicalIdentifiers;
      const affectedIngs: string[] = [];
      let matchingValue = 0;
      const multiplier = 1;

      for (const ing of ingredients) {
        const matchesNameScope = (rule.ingredientScope || []).some(scope =>
          ing.normalizedName.includes(scope.toLowerCase())
        );
        const matchesIdentifier =
          (!!ing.casNumber && !!identifier?.casNumbers?.includes(ing.casNumber)) ||
          (!!ing.ecNumber && !!identifier?.ecNumbers?.includes(ing.ecNumber)) ||
          (!!ing.inciName && !!identifier?.inciNames?.some(name => name.toLowerCase() === ing.inciName?.toLowerCase()));
        if (matchesNameScope || matchesIdentifier) {
          affectedIngs.push(ing.rawName);
          if (threshold.basis === 'ACTIVE_MATTER') {
            if (ing.activeMatterPct === undefined) {
              return {
                ruleId: rule.ruleId,
                regulationIdentifier: rule.regulationIdentifier,
                regulationName: rule.regulationName,
                jurisdiction: rule.jurisdiction,
                requirementType: rule.requirementType,
                mandatoryOrVoluntary: rule.mandatoryOrVoluntary,
                severity: rule.severity,
                status: 'UNKNOWN_DATA',
                affectedIngredients: affectedIngs,
                message: `Active-matter assay is missing for '${ing.rawName}'; cannot evaluate this concentration threshold.`,
                remediation: 'Provide lot-specific supplier COA or validated assay.',
                evidenceId: rule.evidenceId,
                verificationStatus: rule.verificationStatus
              };
            }
            matchingValue += ing.activeMatterPct * multiplier;
          } else {
            matchingValue += ing.asSuppliedPct * multiplier;
          }
        }
      }

      if (affectedIngs.length > 0) {
        const isPhosphateRule = rule.ruleId.toUpperCase().includes('PHOSPHATE');
        const isVocRule = rule.ruleId.toUpperCase().includes('VOC');
        const maxLimit = isPhosphateRule
          ? (input.maxPhosphatePctOverride ?? threshold.maxPercentage)
          : isVocRule
            ? (input.maxVocPctOverride ?? threshold.maxPercentage)
            : threshold.maxPercentage;
        const maxExceeded = maxLimit !== undefined &&
          (threshold.inclusive ? matchingValue > maxLimit : matchingValue >= maxLimit);
        const minViolated = threshold.minPercentage !== undefined &&
          (threshold.inclusive ? matchingValue < threshold.minPercentage : matchingValue <= threshold.minPercentage);

        if (maxExceeded || minViolated) {
          const limitText = maxExceeded
            ? `maximum ${maxLimit} ${threshold.unit}`
            : `minimum ${threshold.minPercentage} ${threshold.unit}`;
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
            measuredValue: `${matchingValue.toFixed(3)} ${threshold.unit}`,
            thresholdValue: limitText,
            message: `Measured concentration ${matchingValue.toFixed(3)} ${threshold.unit} violates the ${limitText} threshold under ${rule.regulationName}.`,
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
