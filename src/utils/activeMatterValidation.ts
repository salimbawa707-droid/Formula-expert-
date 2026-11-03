/**
 * ============================================================================
 * AUTHORITATIVE ACTIVE MATTER VALIDATION GUARD (ZIP 68 REMEDIATION)
 * ============================================================================
 * Provides strict provenance classification, evidence verification, and
 * structured validation for active matter inputs.
 * ============================================================================
 */

import { lookupScientificEvidenceRecord } from '../data/scientificEvidenceRegistry';

export type ScientificProvenance =
  | 'MEASURED'
  | 'SUPPLIER_REPORTED'
  | 'DERIVED'
  | 'USER_OVERRIDE'
  | 'MODEL_PREDICTED'
  | 'ESTIMATED'
  | 'UNKNOWN'
  | 'UNAVAILABLE';

export interface ActiveMatterInput {
  value: number | null;
  provenance: ScientificProvenance;
  ingredientId: string;
  commercialGradeId?: string | null;
  evidenceId?: string | null;
  basis: 'COMMERCIAL_PRODUCT' | 'ACTIVE_MATERIAL' | null;
}

export interface ActiveMatterValidation {
  value: number | null;
  status: 'VALID' | 'INSUFFICIENT_DATA' | 'INVALID';
  provenance: ScientificProvenance;
  verified: boolean;
  blockingReasons: string[];
}

export interface ActiveMatterResult {
  value: number | null;
  status: 'VALID' | 'INSUFFICIENT_DATA' | 'INVALID';
  verified: boolean;
  provenance: ScientificProvenance | null;
  missingIngredientIds: string[];
  blockingReasons: string[];
}

/**
 * Validates an active matter input with strict scientific provenance checking.
 */
export function validateActiveMatter(
  input: ActiveMatterInput
): ActiveMatterValidation {
  const reasons: string[] = [];

  if (
    typeof input.value !== 'number' ||
    !Number.isFinite(input.value) ||
    input.value < 0 ||
    input.value > 100
  ) {
    return {
      value: null,
      status: 'INSUFFICIENT_DATA',
      provenance: input.provenance,
      verified: false,
      blockingReasons: ['ACTIVE_MATTER_VALUE_UNAVAILABLE_OR_INVALID']
    };
  }

  if (!input.ingredientId || !input.ingredientId.trim()) {
    reasons.push('INGREDIENT_ID_REQUIRED');
  }

  if (
    input.provenance === 'UNKNOWN' ||
    input.provenance === 'UNAVAILABLE' ||
    input.provenance === 'ESTIMATED' ||
    input.provenance === 'MODEL_PREDICTED'
  ) {
    reasons.push('PROVENANCE_NOT_ELIGIBLE_FOR_VERIFIED_CALCULATION');
  }

  if (input.provenance === 'SUPPLIER_REPORTED') {
    if (!input.evidenceId || !input.evidenceId.trim()) {
      reasons.push('SUPPLIER_EVIDENCE_REQUIRED');
    } else {
      const record = lookupScientificEvidenceRecord(input.evidenceId);
      if (!record) {
        reasons.push(`SUPPLIER_EVIDENCE_NOT_FOUND_IN_REGISTRY: ${input.evidenceId}`);
      }
    }
  }

  if (input.provenance === 'MEASURED') {
    if (!input.evidenceId || !input.evidenceId.trim()) {
      reasons.push('MEASUREMENT_EVIDENCE_REQUIRED');
    } else {
      const record = lookupScientificEvidenceRecord(input.evidenceId);
      if (!record) {
        reasons.push(`MEASUREMENT_EVIDENCE_NOT_FOUND_IN_REGISTRY: ${input.evidenceId}`);
      }
    }
  }

  if (input.provenance === 'USER_OVERRIDE') {
    // User override can be used for exploratory calculations, but must remain unverified
    return {
      value: input.value,
      status: 'INSUFFICIENT_DATA',
      provenance: input.provenance,
      verified: false,
      blockingReasons: ['USER_OVERRIDE_NOT_ELIGIBLE_FOR_VERIFIED_CALCULATION']
    };
  }

  if (reasons.length > 0) {
    return {
      value: input.value,
      status: 'INSUFFICIENT_DATA',
      provenance: input.provenance,
      verified: false,
      blockingReasons: reasons
    };
  }

  return {
    value: input.value,
    status: 'VALID',
    provenance: input.provenance,
    verified: true,
    blockingReasons: []
  };
}

export class ActiveMatterResultObject implements ActiveMatterResult {
  value: number | null;
  status: 'VALID' | 'INSUFFICIENT_DATA' | 'INVALID';
  verified: boolean;
  provenance: ScientificProvenance | null;
  missingIngredientIds: string[];
  blockingReasons: string[];

  constructor(init: {
    value: number | null;
    status: 'VALID' | 'INSUFFICIENT_DATA' | 'INVALID';
    verified: boolean;
    provenance: ScientificProvenance | null;
    missingIngredientIds: string[];
    blockingReasons: string[];
  }) {
    this.value = init.value;
    this.status = init.status;
    this.verified = init.verified;
    this.provenance = init.provenance;
    this.missingIngredientIds = init.missingIngredientIds;
    this.blockingReasons = init.blockingReasons;
  }

  valueOf(): number {
    return this.value ?? 0;
  }

  toString(): string {
    return this.value !== null ? `${this.value}` : 'INSUFFICIENT_DATA';
  }
}
