/**
 * ============================================================================
 * P2 — REGULATORY COMPLIANCE ENGINE DOMAIN TYPES & SSOT CONTRACTS
 * ============================================================================
 * Production-grade, evidence-backed regulatory decision system type definitions.
 * ============================================================================
 */

import { ProductCategoryId } from '../productTaxonomy';

export type RegulatoryJurisdictionId = 'INDIA' | 'EU' | 'US_FEDERAL' | 'US_CARB' | 'US_STATE_CA' | 'US_STATE_NY' | 'GLOBAL_UN_GHS';

export interface RegulatoryJurisdiction {
  id: RegulatoryJurisdictionId;
  name: string;
  countryOrRegion: string;
  governingAuthorities: string[];
  primaryLanguages: string[];
  effectiveDatePolicy: 'STRICT_PUBLICATION' | 'TRANSITION_PERIOD' | 'ENFORCEMENT_DATE';
  defaultCurrency?: string;
  status: 'ACTIVE' | 'DRAFT' | 'SUPERSEDED';
}

export type RequirementType =
  | 'PROHIBITED'
  | 'RESTRICTED'
  | 'CONCENTRATION_LIMIT'
  | 'DISCLOSURE_REQUIRED'
  | 'LABEL_REQUIRED'
  | 'SDS_REQUIRED'
  | 'PACKAGING_REQUIRED'
  | 'CLAIM_RESTRICTION'
  | 'INGREDIENT_DISCLOSURE'
  | 'ALLERGEN_DISCLOSURE'
  | 'UFI_REQUIRED'
  | 'REGISTRATION_REQUIRED'
  | 'NOTIFICATION_REQUIRED'
  | 'TESTING_REQUIRED'
  | 'DOCUMENTATION_REQUIRED'
  | 'VOLUNTARY_CERTIFICATION'
  | 'INFORMATION_ONLY'
  | 'HUMAN_REVIEW_REQUIRED';

export type RuleSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type EvidenceLevel = 1 | 2 | 3 | 4 | 5;

export type VerificationStatus =
  | 'VERIFIED_PRIMARY_SOURCE'
  | 'VERIFIED_SECONDARY_SOURCE'
  | 'UNVERIFIED'
  | 'OUTDATED'
  | 'CONFLICTING'
  | 'MISSING'
  | 'NOT_VERIFIED';

export type SourceType =
  | 'OFFICIAL_LEGISLATION'
  | 'PRIMARY_OFFICIAL_LEGISLATION'
  | 'PRIMARY_STANDARDS_BODY'
  | 'OFFICIAL_GOVERNMENT_PUBLICATION'
  | 'OFFICIAL_STANDARDS_ORG'
  | 'OFFICIAL_REGULATORY_GUIDANCE'
  | 'OFFICIAL_REGULATOR_DATABASE'
  | 'REGULATORY_GAZETTE'
  | 'ACCREDITED_TECHNICAL_SOURCE'
  | 'RECOGNIZED_OFFICIAL_SECONDARY'
  | 'SECONDARY_PROFESSIONAL_SOURCE'
  | 'THIRD_PARTY_SOURCE'
  | 'AI_GENERATED_SUMMARY'
  | 'UNVERIFIED_WEB_SOURCE';

export interface RegulatoryEvidence {
  evidenceId: string;
  source: string;
  authority: string;
  sourceType: SourceType;
  evidenceLevel: EvidenceLevel;
  sourceURL?: string;
  regulationIdentifier: string;
  version: string;
  publicationDate: string;
  effectiveDate: string;
  retrievalDate: string;
  evidenceConfidence: number; // 0.0 to 1.0
  verificationStatus: VerificationStatus;
  reviewerNotes?: string;
  verifiedBy?: string;
  evidenceHash?: string;
}

export interface RegulatoryRule {
  ruleId: string;
  jurisdiction: RegulatoryJurisdictionId;
  authority: string;
  regulationName: string;
  regulationIdentifier: string;
  standardOrRegulationNumber?: string;
  version: string;
  revisionNumber?: string;
  amendmentNumber?: string;
  amendmentYear?: number;
  status: 'CURRENT' | 'HISTORICAL' | 'FUTURE' | 'TRANSITIONAL' | 'SUPERSEDED' | 'WITHDRAWN' | 'NOT_VERIFIED' | 'NOT_APPLICABLE' | 'IN_FORCE_BUT_NOT_YET_GENERALLY_APPLICABLE';
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string; // YYYY-MM-DD
  entryIntoForceDate?: string; // YYYY-MM-DD
  applicationDate?: string; // YYYY-MM-DD
  repealDate?: string; // YYYY-MM-DD
  withdrawalDate?: string;
  supersededBy?: string;
  supersedes?: string;
  transitionalProvisions?: string;
  productCategories: (ProductCategoryId | 'ALL_CLEANERS' | 'CONSUMER_CLEANERS' | 'INDUSTRIAL_CLEANERS')[];
  ingredientScope?: string[]; // CAS, INCI, or canonical names
  chemicalIdentifiers?: {
    casNumbers?: string[];
    ecNumbers?: string[];
    inciNames?: string[];
    canonicalIds?: string[];
  };
  concentrationThresholds?: {
    maxPercentage?: number;
    minPercentage?: number;
    unit: 'WEIGHT_PCT' | 'VOLUME_PCT' | 'PPM' | 'MG_PER_DOSAGE' | 'G_PER_DOSAGE';
    basis: 'ACTIVE_MATTER' | 'AS_SUPPLIED' | 'FORMULA_TOTAL' | 'FINISHED_PRODUCT';
    inclusive: boolean;
  };
  condition?: string;
  requirementType: RequirementType;
  mandatoryOrVoluntary: 'MANDATORY' | 'VOLUNTARY_PROGRAM';
  severity: RuleSeverity;
  requirementText: string;
  remediationGuidance: string;
  sourceOrganization?: string;
  sourceURL?: string;
  evidenceId: string;
  evidenceLevel?: EvidenceLevel;
  evidenceType?: string;
  evidenceReference?: string;
  verifiedBy?: string;
  evidenceHash?: string;
  lastVerifiedAt: string;
  verificationStatus: VerificationStatus;
}

export interface RegulatoryDatasetChecksum {
  datasetVersion: string;
  canonicalizationVersion: string;
  sha256: string;
  generatedAt: string;
  totalRecords: number;
}

export interface RegulatoryKnowledgeVersion {
  versionId: string; // e.g. 2026.1-SSOT
  publishedAt: string;
  jurisdictions: RegulatoryJurisdictionId[];
  totalRules: number;
  verifiedRulesCount: number;
  checksum: string;
  datasetChecksum?: RegulatoryDatasetChecksum;
  status: 'ACTIVE_PRODUCTION' | 'ARCHIVED' | 'TESTING';
}

export interface FormulaIngredientInput {
  id?: string;
  name: string;
  casNumber?: string;
  ecNumber?: string;
  inciName?: string;
  percentage: number;
  activePercentage?: number;
  role?: string;
  commercialMaterialId?: string;
  grade?: string;
  manufacturer?: string;
  impuritiesPpm?: {
    dioxane_1_4?: number;
    freeEthyleneOxide?: number;
    heavyMetalsPpm?: number;
  };
  biodegradabilityClass?: 'READILY_BIODEGRADABLE' | 'INHERENTLY_BIODEGRADABLE' | 'NON_BIODEGRADABLE' | 'UNKNOWN';
}

export interface RegulatoryEvaluationInput {
  formulaId?: string;
  formulaTitle?: string;
  ingredients: FormulaIngredientInput[];
  productCategory?: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
  jurisdiction?: RegulatoryJurisdictionId;
  evaluationDate?: string; // YYYY-MM-DD
  marketPlacementDate?: string; // YYYY-MM-DD (Date batch was placed on the market per EU Art 36)
  placingOnMarketDate?: string; // YYYY-MM-DD (Alternative alias for EU Article 36)
  calculatedPH?: number;
  packageSizeGramsOrMl?: number;
  packageType?: 'BOTTLE' | 'CAN' | 'BOX' | 'SACHET' | 'BULK' | 'UNKNOWN';
  intendedClaims?: string[];
  customBannedIngredients?: string[];
  maxPhosphatePctOverride?: number;
  maxVocPctOverride?: number;
}

export interface RuleEvaluationResult {
  ruleId: string;
  regulationIdentifier: string;
  regulationName: string;
  jurisdiction: RegulatoryJurisdictionId;
  requirementType: RequirementType;
  mandatoryOrVoluntary: 'MANDATORY' | 'VOLUNTARY_PROGRAM';
  severity: RuleSeverity;
  status: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED' | 'NOT_APPLICABLE' | 'UNKNOWN_DATA';
  affectedIngredients: string[];
  measuredValue?: string;
  thresholdValue?: string;
  message: string;
  remediation?: string;
  evidenceId: string;
  verificationStatus: VerificationStatus;
}

export type ClaimStatus = 'SUBSTANTIATED' | 'CLAIM_NOT_SUBSTANTIATED' | 'PROHIBITED_CLAIM' | 'REVIEW_REQUIRED';

export interface ClaimEvaluationResult {
  claimName: string;
  status: ClaimStatus;
  requiredEvidenceType: string;
  hasRequiredEvidence: boolean;
  permittedWording: string[];
  prohibitedWording: string[];
  reason: string;
}

export interface LabelCheckItem {
  itemId: string;
  section: 'PRODUCT_IDENTITY' | 'GHS_HAZARDS' | 'INGREDIENT_DISCLOSURE' | 'NET_QUANTITY' | 'MANUFACTURER_LEGAL' | 'METROLOGY_MRP' | 'CONSUMER_SAFETY' | 'CLAIMS';
  title: string;
  status: 'PASS' | 'FAIL' | 'MISSING' | 'NOT_APPLICABLE' | 'REVIEW_REQUIRED';
  requirementText: string;
  message: string;
}

export interface LabelComplianceReport {
  overallLabelStatus: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  checkList: LabelCheckItem[];
  missingMandatoryFields: string[];
}

export interface SDSSectionCheck {
  sectionNumber: number; // 1 to 16
  sectionName: string;
  status: 'COMPLETE' | 'INCOMPLETE' | 'DATA_NOT_AVAILABLE' | 'REVIEW_REQUIRED';
  missingDataPoints: string[];
}

export interface SDSComplianceReport {
  overallSDSStatus: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  sections: SDSSectionCheck[];
  missingCriticalData: string[];
}

export interface PackagingComplianceReport {
  overallPackagingStatus: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  childResistantClosureRequired: boolean;
  childResistantClosureVerified: boolean;
  tactileWarningRequired: boolean;
  tactileWarningVerified: boolean;
  recyclabilityInfoAvailable: boolean;
  legalMetrologyUnitFormatted: boolean;
  findings: string[];
}

export type OverallRegulatoryStatus =
  | 'COMPLIANT'
  | 'NON_COMPLIANT'
  | 'PARTIALLY_COMPLIANT'
  | 'REVIEW_REQUIRED'
  | 'INSUFFICIENT_DATA'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_VERIFIED'
  | 'REGULATORY_SCOPE_UNKNOWN';

export interface RegulatoryDecision {
  overallStatus: OverallRegulatoryStatus;
  scopedIdentity: {
    productCategory: ProductCategoryId | 'UNKNOWN_PRODUCT_CATEGORY';
    jurisdiction: RegulatoryJurisdictionId;
    evaluationDate: string;
    regulatoryKnowledgeVersion: string;
  };
  datasetChecksum?: RegulatoryDatasetChecksum;
  passedRules: RuleEvaluationResult[];
  failedRules: RuleEvaluationResult[];
  warnings: string[];
  missingEvidence: string[];
  reviewRequired: RuleEvaluationResult[];
  claimsStatus: {
    overallStatus: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
    evaluations: ClaimEvaluationResult[];
  };
  labelStatus: LabelComplianceReport;
  sdsStatus: SDSComplianceReport;
  packagingStatus: PackagingComplianceReport;
  ingredientStatus: {
    totalIngredientsEvaluated: number;
    bannedIngredientsDetected: string[];
    restrictedIngredientsDetected: string[];
    unknownIngredientsDetected: string[];
  };
  documentationStatus: {
    primarySourceCoveragePct: number;
    unverifiedRulesCount: number;
  };
  evidenceCoverage: {
    verifiedPrimaryCount: number;
    unverifiedCount: number;
    outdatedCount: number;
  };
  decisionTimestamp: string;
  engineVersion: string;
}
