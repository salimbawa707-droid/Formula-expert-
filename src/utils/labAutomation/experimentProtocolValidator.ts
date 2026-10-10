/**
 * Experiment Protocol Validator
 * 
 * Provides end-to-end scientific and hardware validation of generated laboratory protocols.
 * Evaluates formula lineage, canonical ingredient resolution, labware geometry,
 * volumetric constraints, and flags missing process conditions as REQUIRES_HUMAN_INPUT.
 */

import {
  ProtocolDefinition,
  ProtocolValidationResult,
  ProtocolValidationIssue,
  ProtocolValidationStatus,
  ExperimentDesign,
} from './types';
import { validateDeckLayout } from './deckLayoutEngine';
import { validateLiquidHandlingPlan } from './liquidHandlingConstraintEngine';

export interface ProtocolValidationOptions {
  requireExplicitMixingParameters?: boolean;
  maxAllowableDurationMinutes?: number;
}

export function validateExperimentProtocol(
  protocol: ProtocolDefinition,
  experimentDesign?: ExperimentDesign,
  _options: ProtocolValidationOptions = {}
): ProtocolValidationResult {
  const issues: ProtocolValidationIssue[] = [];

  // 1. Lineage & Identity Validation
  if (!protocol.protocolId) {
    issues.push({
      severity: 'ERROR',
      code: 'MISSING_PROTOCOL_ID',
      message: 'Protocol is missing a valid unique identifier.',
    });
  }

  if (!protocol.experimentId) {
    issues.push({
      severity: 'ERROR',
      code: 'MISSING_EXPERIMENT_ID',
      message: 'Protocol is not linked to an ExperimentDesign entity.',
    });
  }

  if (!protocol.protocolHash || protocol.protocolHash.length < 32) {
    issues.push({
      severity: 'ERROR',
      code: 'INVALID_PROTOCOL_HASH',
      message: 'Protocol lacks a valid cryptographic SHA-256 integrity hash.',
    });
  }

  // 2. Deck Layout Validation
  const deckCheck = validateDeckLayout(protocol.deckLayout, protocol.robotPlatform);
  for (const err of deckCheck.errors) {
    issues.push({
      severity: 'ERROR',
      code: 'DECK_LAYOUT_ERROR',
      message: err,
    });
  }
  for (const warn of deckCheck.warnings) {
    issues.push({
      severity: 'WARNING',
      code: 'DECK_LAYOUT_WARNING',
      message: warn,
    });
  }

  // 3. Pipette Hardware Validation
  if (!protocol.pipettes.left && !protocol.pipettes.right) {
    issues.push({
      severity: 'ERROR',
      code: 'NO_PIPETTES_CONFIGURED',
      message: 'Protocol requires at least one configured pipette on either left or right mount.',
    });
  }

  // 4. Liquid Handling & Fluid Volumetric Validation
  const liquidCheck = validateLiquidHandlingPlan(
    protocol.liquidTransfers,
    protocol.mixOperations,
    protocol.deckLayout,
    protocol.pipettes
  );

  for (const lIssue of liquidCheck.issues) {
    issues.push({
      severity: lIssue.severity,
      code: lIssue.code,
      message: lIssue.message,
      scientificGuidance: lIssue.suggestedCorrection,
    });
  }

  // 5. Scientific Process Parameters & Human Input Requirements
  if (experimentDesign) {
    // Check canonical ingredient resolution
    for (const ing of experimentDesign.ingredients) {
      if (!ing.canonicalIngredientId || ing.canonicalIngredientId.trim() === '') {
        issues.push({
          severity: 'ERROR',
          code: 'UNRESOLVED_CANONICAL_INGREDIENT',
          message: `Ingredient '${ing.tradeName}' cannot be resolved to a canonical ingredient ID. Protocol generation blocked.`,
          scientificGuidance: 'Map ingredient to authoritative Universal Ingredient Library before export.',
        });
      }

      if (ing.targetFormulaPercent <= 0) {
        issues.push({
          severity: 'WARNING',
          code: 'ZERO_OR_NEGATIVE_CONCENTRATION',
          message: `Ingredient '${ing.tradeName}' has non-positive target concentration (${ing.targetFormulaPercent}%).`,
        });
      }
    }

    // Check process parameters
    const proc = experimentDesign.processParameters;
    if (proc.mixingRequired) {
      if (!proc.mixVolumeUl && !proc.mixCycles) {
        issues.push({
          severity: 'WARNING',
          code: 'MISSING_MIXING_SPECIFICATION',
          message: 'Mixing is required but mixing cycles and volume are unspecified; default heuristic values applied.',
          scientificGuidance: 'Explicitly specify mix volume and cycle count for reproducible formulation.',
        });
      }

      if (proc.temperatureCelsius === undefined) {
        issues.push({
          severity: 'WARNING',
          code: 'REQUIRES_HUMAN_INPUT_TEMPERATURE',
          message: 'Formulation process temperature is not specified (assumed ambient 20-25°C).',
          scientificGuidance: 'Ensure room temperature or heat-plate conditioning matches formulation requirements.',
        });
      }
    }

    if (proc.humanInputRequiredWarnings && proc.humanInputRequiredWarnings.length > 0) {
      for (const w of proc.humanInputRequiredWarnings) {
        issues.push({
          severity: 'WARNING',
          code: 'REQUIRES_HUMAN_INPUT',
          message: w,
        });
      }
    }
  }

  // 6. Overall Status Determination
  const errorCount = issues.filter(i => i.severity === 'ERROR').length;
  const warningCount = issues.filter(i => i.severity === 'WARNING').length;

  let status: ProtocolValidationStatus = 'VALID';
  if (errorCount > 0) {
    status = 'INVALID';
  } else if (issues.some(i => i.code.startsWith('REQUIRES_HUMAN_INPUT'))) {
    status = 'REQUIRES_HUMAN_INPUT';
  } else if (warningCount > 0) {
    status = 'VALID';
  }

  const isValid = errorCount === 0;
  const canApproveForExport = isValid;

  let summary = `Validation passed cleanly (${protocol.commands.length} commands, 0 errors).`;
  if (errorCount > 0) {
    summary = `Validation failed with ${errorCount} blocking errors. Export prohibited.`;
  } else if (status === 'REQUIRES_HUMAN_INPUT') {
    summary = `Validation requires human input / operator confirmation on ${warningCount} parameters before execution.`;
  } else if (warningCount > 0) {
    summary = `Validation passed with ${warningCount} non-blocking scientific warnings.`;
  }

  return {
    status,
    isValid,
    canApproveForExport,
    issues,
    validatedAt: new Date().toISOString(),
    validatorVersion: '1.0.0',
    summary,
  };
}
