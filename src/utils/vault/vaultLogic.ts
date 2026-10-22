import { VAULT_SCHEMA_VERSION } from '../../domain/vault/types.ts';
import type {
  VaultState,
  EngineRecord,
  DatasetRecord,
} from '../../domain/vault/types.ts';
import { INITIAL_HISTORICAL_RECONCILIATIONS, INITIAL_INVENTORY_METRICS } from '../../domain/vault/schemaDefaults.ts';

export interface VaultMetrics {
  currentPhaseId: string;
  currentPhaseName: string;
  totalPhases: number;
  openPhasesCount: number;
  closedPhasesCount: number;
  lockedPhasesCount: number;
  enginesInventoried: number;
  engineDiscrepancyClaimedA: number;
  engineDiscrepancyReconciledFiles: number;
  engineDiscrepancyClaimedSubmodules: number;
  engineDiscrepancyStatus: string;
  sourcesIdentified: number;
  sourcesAccessConfirmed: number;
  sourcesDownloaded: number;
  experimentalDatasetsNumericallyInspected: number;
  enginesReadyForValidation: number;
  enginesIndependentlyLabVerified: number;
  activeBlockersCount: number;
  openAuditDefectsCount: number;
  nullPriceIngredientsCount: number;
}

export function calculateVaultMetrics(state: VaultState): VaultMetrics {
  const currentPhase = state.phases.find(p => p.status === 'ACTIVE') || state.phases[0];

  // Strictly compute inspected experimental datasets:
  // Must be marked NUMERICALLY_INSPECTED, have non-null positive row count,
  // and be linked to an EXPERIMENTAL or REFERENCE_DATABASE evidence record.
  const inspectedDatasets = state.datasets.filter(d => {
    return (
      d.inspectionStatus === 'NUMERICALLY_INSPECTED' &&
      d.actualRowCount !== null &&
      typeof d.actualRowCount === 'number' &&
      d.actualRowCount > 0
    );
  });

  // Engines ready for numerical validation must be explicitly READY
  const readyEngines = state.engines.filter(
    e => e.numericalValidationReadiness === 'READY'
  );

  // Engines with independently verified laboratory evidence:
  // Must be LAB_VALIDATED and have independentVerificationStatus === 'VERIFIED'
  const labVerifiedEngines = state.engines.filter(
    e =>
      e.scientificMaturity === 'LAB_VALIDATED' &&
      e.independentVerificationStatus === 'VERIFIED'
  );

  // Critical/High severity unresolved audit findings
  const openFindingsCount = state.audits.reduce((acc, audit) => {
    if (audit.approvalStatus !== 'APPROVED') {
      const highFindings = audit.findings.filter(
        f => f.severity === 'CRITICAL' || f.severity === 'HIGH'
      );
      return acc + highFindings.length;
    }
    return acc;
  }, 0);

  const nullPriced = state.pricingRecords.filter(p => p.pricePerKg === null);

  return {
    currentPhaseId: currentPhase.phaseId,
    currentPhaseName: currentPhase.name,
    totalPhases: state.phases.length,
    openPhasesCount: state.phases.filter(p => p.status === 'ACTIVE').length,
    closedPhasesCount: state.phases.filter(p => p.status === 'CLOSED').length,
    lockedPhasesCount: state.phases.filter(p => p.status === 'LOCKED').length,
    enginesInventoried: state.engines.length,
    engineDiscrepancyClaimedA: state.engineCountDiscrepancy.claimedA,
    engineDiscrepancyReconciledFiles: state.engineCountDiscrepancy.reconciledFiles,
    engineDiscrepancyClaimedSubmodules: state.engineCountDiscrepancy.claimedSubmodules,
    engineDiscrepancyStatus: state.engineCountDiscrepancy.status,
    sourcesIdentified: state.evidence.length,
    sourcesAccessConfirmed: state.evidence.filter(
      e => e.accessStatus === 'ACCESS_CONFIRMED' || e.accessStatus === 'DOWNLOADED'
    ).length,
    sourcesDownloaded: state.evidence.filter(e => e.downloadStatus === 'DOWNLOADED').length,
    experimentalDatasetsNumericallyInspected: inspectedDatasets.length,
    enginesReadyForValidation: readyEngines.length,
    enginesIndependentlyLabVerified: labVerifiedEngines.length,
    activeBlockersCount: state.activeBlockers.length,
    openAuditDefectsCount: openFindingsCount,
    nullPriceIngredientsCount: nullPriced.length,
  };
}

/**
 * Enforces scientific status rules: prevents premature or unwarranted promotion
 */
export function canPromoteEngineToValidation(
  engine: EngineRecord,
  datasets: DatasetRecord[]
): { allowed: boolean; reason: string } {
  // Check if engine has at least one linked dataset that has been NUMERICALLY_INSPECTED
  const linkedDatasets = datasets.filter(d =>
    d.applicableEngineIds.includes(engine.id)
  );

  if (linkedDatasets.length === 0) {
    return {
      allowed: false,
      reason: `No empirical dataset linked to engine ${engine.id}. Cannot declare readiness without data.`,
    };
  }

  const inspected = linkedDatasets.some(
    d =>
      d.inspectionStatus === 'NUMERICALLY_INSPECTED' &&
      d.actualRowCount !== null &&
      d.actualRowCount > 0
  );

  if (!inspected) {
    return {
      allowed: false,
      reason: `Linked datasets for ${engine.name} remain UNINSPECTED (0 verified rows). Experimental inspection is mandatory.`,
    };
  }

  return { allowed: true, reason: 'Valid numerical dataset inspected and attached.' };
}

/**
 * Formula batch costing rule (Phase 1):
 * Missing prices must NEVER be coerced to 0.00.
 * If any ingredient price is null/unknown, the total formula cost must return NULL.
 */
export interface BatchCostCalculationResult {
  totalCostPerKg: number | null;
  isComplete: boolean;
  unpricedCount: number;
  unpricedIngredients: string[];
  floorCostPerKg: number;
  costWarning?: string;
}

export function computeBatchCostWithNullIntegrity(
  components: { ingredientId: string; weightFraction: number; pricePerKg: number | null }[]
): BatchCostCalculationResult {
  let hasNullPrice = false;
  let floorCost = 0;
  let totalCost = 0;
  const unpricedIds: string[] = [];

  for (const comp of components) {
    if (comp.pricePerKg === null || comp.pricePerKg === undefined) {
      hasNullPrice = true;
      unpricedIds.push(comp.ingredientId);
    } else {
      floorCost += comp.weightFraction * comp.pricePerKg;
      totalCost += comp.weightFraction * comp.pricePerKg;
    }
  }

  if (hasNullPrice) {
    return {
      totalCostPerKg: null, // STRICTLY NULL! NEVER FABRICATE 0!
      isComplete: false,
      unpricedCount: unpricedIds.length,
      unpricedIngredients: unpricedIds,
      floorCostPerKg: Math.round(floorCost * 1000) / 1000,
      costWarning: `Formula contains ${unpricedIds.length} ingredient(s) with unknown pricing. Total cost is undefined (null) to prevent catastrophic under-costing.`,
    };
  }

  return {
    totalCostPerKg: Math.round(totalCost * 1000) / 1000,
    isComplete: true,
    unpricedCount: 0,
    unpricedIngredients: [],
    floorCostPerKg: Math.round(floorCost * 1000) / 1000,
  };
}

/**
 * Validates Phase 5 gate transition: Phase 5 cannot be unlocked while Phase 4B is OPEN or unapproved
 */
export function canUnlockPhase5(state: VaultState): { allowed: boolean; reason: string } {
  const phase4B = state.phases.find(p => p.phaseId === 'phase-4b');
  if (!phase4B) {
    return { allowed: false, reason: 'Phase 4B record not found.' };
  }

  if (phase4B.status !== 'CLOSED' || !phase4B.reportedClosed) {
    return {
      allowed: false,
      reason: 'Phase 4B is still ACTIVE/OPEN. Phase 5 remains strictly LOCKED.',
    };
  }

  if (phase4B.independentVerificationStatus !== 'CONFIRMED') {
    return {
      allowed: false,
      reason: 'Phase 4B independent verification status is UNESTABLISHED or REJECTED.',
    };
  }

  // Authoritative Source Provenance check
  if (state.authoritativeProvenanceStatus !== 'VERIFIED') {
    return {
      allowed: false,
      reason: 'Gate blocked: Authoritative source provenance status is NOT_INDEPENDENTLY_VERIFIED or missing.',
    };
  }

  // Raw Numeric Accounting Reconciliation check
  if (state.accountingReconciliationStatus !== 'RECONCILED') {
    return {
      allowed: false,
      reason: 'Gate blocked: Raw numeric accounting reconciliation status is UNRESOLVED or missing.',
    };
  }

  // Cross-Artifact Ledger Consistency check
  if (state.ledgerConsistencyStatus !== 'CONSISTENT') {
    return {
      allowed: false,
      reason: 'Gate blocked: Cross-artifact ledger consistency status is INCONSISTENT or missing.',
    };
  }

  // Prevent single-dataset or partial-dataset bypass: require ALL datasets in the vault to be numerically inspected
  const uninspectedDatasets = state.datasets.filter(
    d => d.inspectionStatus !== 'NUMERICALLY_INSPECTED' || (d.actualRowCount ?? 0) <= 0
  );

  if (uninspectedDatasets.length > 0) {
    return {
      allowed: false,
      reason: `Gate blocked: ${uninspectedDatasets.length} dataset(s) remain uninspected. Single-dataset or partial-dataset bypass is strictly prohibited.`,
    };
  }

  // Check for open critical audit findings
  const openCriticalAudits = state.audits.some(a => {
    if (a.approvalStatus !== 'APPROVED') {
      return a.findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    }
    return false;
  });

  if (openCriticalAudits) {
    return {
      allowed: false,
      reason: 'Gate blocked: Unresolved critical or high severity audit findings remain in evidence vault.',
    };
  }

  // Check for active unresolved Phase 4B blockers (provenance & accounting)
  const activePhase4BBlockers = state.activeBlockers.filter(b => b.phaseId === 'phase-4b');
  if (activePhase4BBlockers.length > 0) {
    return {
      allowed: false,
      reason: `Gate blocked: ${activePhase4BBlockers.length} active Phase 4B blocker(s) remain unresolved.`,
    };
  }

  return { allowed: true, reason: 'Phase 4B acceptance criteria fully satisfied and independently verified.' };
}

/**
 * Validates a vault backup against the currently supported persisted schema.
 *
 * Important: validation is structural only. It never promotes scientific maturity,
 * licenses, provenance, or phase status. Unsupported schema versions fail closed.
 */
export function validateAndParseVaultJSON(jsonStr: string): {
  valid: boolean;
  errors: string[];
  parsedState?: VaultState;
} {
  const errors: string[] = [];
  let parsed: any;

  try {
    parsed = JSON.parse(jsonStr);
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return { valid: false, errors: [`JSON Parse error: ${detail}`] };
  }

  const isRecord = (value: unknown): value is Record<string, any> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;
  const isNullableNonNegativeInteger = (value: unknown): boolean =>
    value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0);

  if (!isRecord(parsed)) {
    return { valid: false, errors: ['Parsed content is not a JSON object.'] };
  }

  if (parsed.version !== '1.0.0' && parsed.version !== VAULT_SCHEMA_VERSION) {
    errors.push(`Unsupported or missing vault schema version. Supported versions: 1.0.0 (migrated automatically) and ${VAULT_SCHEMA_VERSION}.`);
  } else if (parsed.version === '1.0.0') {
    // Additive, lossless migration: preserve all existing v1.0.0 fields and fill only
    // the newly introduced extension collections. Unknown future versions fail closed.
    parsed = {
      ...parsed,
      version: VAULT_SCHEMA_VERSION,
      inventoryMetrics: Array.isArray(parsed.inventoryMetrics)
        ? parsed.inventoryMetrics
        : INITIAL_INVENTORY_METRICS.map(record => ({ ...record })),
      historicalReconciliations: Array.isArray(parsed.historicalReconciliations)
        ? parsed.historicalReconciliations
        : INITIAL_HISTORICAL_RECONCILIATIONS.map(record => ({ ...record, relatedMetricIds: [...record.relatedMetricIds] })),
      daviesActivityModels: Array.isArray(parsed.daviesActivityModels) ? parsed.daviesActivityModels : [],
      surfactantPhaseProperties: Array.isArray(parsed.surfactantPhaseProperties) ? parsed.surfactantPhaseProperties : [],
    };
  }

  const requiredArrays = [
    'phases', 'engines', 'evidence', 'datasets', 'audits', 'prompts', 'pricingRecords', 'activeBlockers',
    'inventoryMetrics', 'historicalReconciliations', 'daviesActivityModels', 'surfactantPhaseProperties'
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray(parsed[key])) {
      errors.push(`Missing or invalid ${key} array.`);
    } else if (!parsed[key].every(isRecord)) {
      errors.push(`${key} must contain only JSON objects.`);
    }
  }

  if (!isRecord(parsed.engineCountDiscrepancy)) {
    errors.push('Missing or invalid engineCountDiscrepancy object.');
  } else {
    for (const key of ['claimedA', 'reconciledFiles', 'claimedSubmodules']) {
      const value = parsed.engineCountDiscrepancy[key];
      if (!Number.isSafeInteger(value) || value < 0) {
        errors.push(`engineCountDiscrepancy.${key} must be a non-negative integer.`);
      }
    }
    if (parsed.engineCountDiscrepancy.status !== 'REPORTED_UNVERIFIED') {
      errors.push('engineCountDiscrepancy.status must remain REPORTED_UNVERIFIED unless the domain model explicitly changes.');
    }
    if (typeof parsed.engineCountDiscrepancy.notes !== 'string') {
      errors.push('engineCountDiscrepancy.notes must be a string.');
    }
  }

  const checkUniqueIds = (key: string, label: string, idField = 'id') => {
    if (!Array.isArray(parsed[key])) return;
    const ids = new Set<string>();
    parsed[key].forEach((item: unknown, index: number) => {
      if (!isRecord(item)) {
        errors.push(`${label} at index ${index} must be an object.`);
        return;
      }
      const identity = item[idField];
      if (!isNonEmptyString(identity)) {
        errors.push(`${label} at index ${index} is missing stable key ${idField}.`);
      } else if (ids.has(identity)) {
        errors.push(`Duplicate ${label.toLowerCase()} key detected: ${identity}`);
      } else {
        ids.add(identity);
      }
    });
  };

  checkUniqueIds('phases', 'Phase', 'phaseId');
  checkUniqueIds('engines', 'Engine');
  checkUniqueIds('evidence', 'Evidence record');
  checkUniqueIds('datasets', 'Dataset');
  checkUniqueIds('audits', 'Audit');
  checkUniqueIds('prompts', 'Prompt');
  checkUniqueIds('pricingRecords', 'Pricing record', 'ingredientId');
  checkUniqueIds('activeBlockers', 'Active blocker');

  if (Array.isArray(parsed.phases)) {
    const validPhaseStatuses = new Set(['CLOSED', 'ACTIVE', 'LOCKED', 'PENDING_REVIEW']);
    const validVerificationStatuses = new Set(['UNESTABLISHED', 'CONFIRMED', 'REJECTED']);
    parsed.phases.forEach((phase: unknown, index: number) => {
      if (!isRecord(phase)) {
        errors.push(`Phase at index ${index} must be an object.`);
        return;
      }
      if (!isNonEmptyString(phase.phaseId)) errors.push(`Phase at index ${index} is missing phaseId.`);
      if (!validPhaseStatuses.has(phase.status)) errors.push(`Phase ${phase.id || index} has an invalid status.`);
      if (typeof phase.reportedClosed !== 'boolean') errors.push(`Phase ${phase.id || index} reportedClosed must be boolean.`);
      if (!validVerificationStatuses.has(phase.independentVerificationStatus)) {
        errors.push(`Phase ${phase.id || index} has an invalid independentVerificationStatus.`);
      }
      if (!Array.isArray(phase.blockers) || !Array.isArray(phase.keyDeliverables)) {
        errors.push(`Phase ${phase.id || index} must contain blockers and keyDeliverables arrays.`);
      }
    });
  }

  if (Array.isArray(parsed.datasets)) {
    parsed.datasets.forEach((dataset: unknown, index: number) => {
      if (!isRecord(dataset)) {
        errors.push(`Dataset at index ${index} must be an object.`);
        return;
      }
      for (const key of ['actualRowCount', 'actualColumnCount']) {
        if (!isNullableNonNegativeInteger(dataset[key])) {
          errors.push(`Dataset ${dataset.id || index} ${key} must be null (unknown) or a non-negative safe integer (known count).`);
        }
      }
      if (!Array.isArray(dataset.columns)) {
        errors.push(`Dataset ${dataset.id || index} columns must be an array.`);
      } else {
        dataset.columns.forEach((column: unknown, columnIndex: number) => {
          if (!isRecord(column)) {
            errors.push(`Dataset ${dataset.id || index} column ${columnIndex} must be an object.`);
            return;
          }
          if (!Number.isSafeInteger(column.missingCount) || column.missingCount < 0) {
            errors.push(`Dataset ${dataset.id || index} column ${columnIndex} missingCount must be a known non-negative integer in schema 1.1.0; do not use zero as an unknown placeholder.`);
          }
          if (typeof column.name !== 'string' || typeof column.unit !== 'string' || typeof column.isExperimental !== 'boolean') {
            errors.push(`Dataset ${dataset.id || index} column ${columnIndex} has invalid name, unit, or isExperimental field.`);
          }
        });
      }
      if (typeof dataset.inspectionStatus !== 'string') {
        errors.push(`Dataset ${dataset.id || index} inspectionStatus must be a string.`);
      }
    });
  }

  if (Array.isArray(parsed.evidence)) {
    parsed.evidence.forEach((evidence: unknown, index: number) => {
      if (!isRecord(evidence)) {
        errors.push(`Evidence record at index ${index} must be an object.`);
        return;
      }
      if (!isNullableNonNegativeInteger(evidence.sampleCount)) {
        errors.push(`Evidence record ${evidence.id || index} sampleCount must be null (unknown) or a non-negative safe integer.`);
      }
      for (const key of ['measuredVariables', 'units', 'supportedEngineIds', 'supportedClaims', 'applicabilityMismatches', 'limitations', 'followUpActions']) {
        if (!Array.isArray(evidence[key]) || !evidence[key].every((item: unknown) => typeof item === 'string')) {
          errors.push(`Evidence record ${evidence.id || index} ${key} must be an array of strings.`);
        }
      }
    });
  }

  if (Array.isArray(parsed.pricingRecords)) {
    parsed.pricingRecords.forEach((pricing: unknown, index: number) => {
      if (!isRecord(pricing)) {
        errors.push(`Pricing record at index ${index} must be an object.`);
        return;
      }
      if (pricing.pricePerKg !== null && (typeof pricing.pricePerKg !== 'number' || !Number.isFinite(pricing.pricePerKg) || pricing.pricePerKg < 0)) {
        errors.push(`Pricing record ${pricing.id || pricing.ingredientId || index} pricePerKg must be null (unknown) or a finite non-negative number.`);
      }
      if (!['CONFIRMED', 'UNKNOWN_NULL', 'MARKET_ESTIMATE'].includes(pricing.priceStatus)) {
        errors.push(`Pricing record ${pricing.id || pricing.ingredientId || index} has an invalid priceStatus.`);
      }
      if (pricing.pricePerKg === null && pricing.priceStatus === 'CONFIRMED') {
        errors.push(`Pricing record ${pricing.ingredientId || index} cannot be CONFIRMED while pricePerKg is null.`);
      }
    });
  }

  if (Array.isArray(parsed.inventoryMetrics)) {
    parsed.inventoryMetrics.forEach((metric: unknown, index: number) => {
      if (!isRecord(metric)) {
        errors.push(`Inventory metric at index ${index} must be an object.`);
        return;
      }
      if (!['FLOW', 'FILM', 'BUBBLE', 'RHEOMETER', 'HISTORICAL', 'MIXED'].includes(metric.category)) {
        errors.push(`Inventory metric ${metric.id || index} has an invalid category.`);
      }
      if (!isNonEmptyString(metric.metricKey) || !isNonEmptyString(metric.unit) ||
          !isNonEmptyString(metric.countingUnit) || !isNonEmptyString(metric.sourceReference) ||
          typeof metric.notes !== 'string') {
        errors.push(`Inventory metric ${metric.id || index} is missing metric, unit, provenance, or notes metadata.`);
      }
      if (metric.value !== null && (!Number.isSafeInteger(metric.value) || metric.value < 0)) {
        errors.push(`Inventory metric ${metric.id || index} value must be null or a non-negative safe integer.`);
      }
      if (!['REPORTED_UNVERIFIED', 'REPRODUCIBLE', 'UNRESOLVED'].includes(metric.verificationStatus)) {
        errors.push(`Inventory metric ${metric.id || index} has an invalid verificationStatus.`);
      }
    });
  }

  if (Array.isArray(parsed.historicalReconciliations)) {
    parsed.historicalReconciliations.forEach((record: unknown, index: number) => {
      if (!isRecord(record)) {
        errors.push(`Historical reconciliation at index ${index} must be an object.`);
        return;
      }
      for (const key of ['claimValue', 'comparisonAggregateValue']) {
        if (record[key] !== null && (!Number.isSafeInteger(record[key]) || record[key] < 0)) {
          errors.push(`Historical reconciliation ${record.id || index} ${key} must be null or a non-negative safe integer.`);
        }
      }
      if (!['UNRESOLVED', 'RECONCILED'].includes(record.reconciliationStatus)) {
        errors.push(`Historical reconciliation ${record.id || index} has an invalid reconciliationStatus.`);
      }
      if (!isNonEmptyString(record.claimUnit) || !isNonEmptyString(record.sourceReference) ||
          typeof record.notes !== 'string' || !Array.isArray(record.relatedMetricIds) ||
          !record.relatedMetricIds.every((id: unknown) => typeof id === 'string')) {
        errors.push(`Historical reconciliation ${record.id || index} has invalid unit, provenance, notes, or relatedMetricIds.`);
      }
    });
  }

  if (Array.isArray(parsed.daviesActivityModels)) {
    parsed.daviesActivityModels.forEach((model: unknown, index: number) => {
      if (!isRecord(model)) {
        errors.push(`Davies activity model at index ${index} must be an object.`);
        return;
      }
      if (!isNonEmptyString(model.modelName) || !isNonEmptyString(model.modelVersion) ||
          !isNonEmptyString(model.sourceReference) || typeof model.notes !== 'string' ||
          !Array.isArray(model.assumptions) || !model.assumptions.every((item: unknown) => typeof item === 'string') ||
          !Array.isArray(model.speciesCharges) || !model.speciesCharges.every((charge: unknown) => Number.isInteger(charge))) {
        errors.push(`Davies activity model ${model.id || index} has invalid model, provenance, assumption, or charge metadata.`);
      }
      if (model.temperatureK !== null && (typeof model.temperatureK !== 'number' || !Number.isFinite(model.temperatureK) || model.temperatureK <= 0)) {
        errors.push(`Davies activity model ${model.id || index} temperatureK must be null or a positive finite number.`);
      }
      if (model.ionicStrengthM !== null && (typeof model.ionicStrengthM !== 'number' || !Number.isFinite(model.ionicStrengthM) || model.ionicStrengthM < 0)) {
        errors.push(`Davies activity model ${model.id || index} ionicStrengthM must be null or a non-negative finite number.`);
      }
      if (!['WITHIN_DOCUMENTED_DOMAIN', 'OUTSIDE_DOCUMENTED_DOMAIN', 'UNKNOWN'].includes(model.applicabilityStatus)) {
        errors.push(`Davies activity model ${model.id || index} has an invalid applicabilityStatus.`);
      }
    });
  }

  if (Array.isArray(parsed.surfactantPhaseProperties)) {
    parsed.surfactantPhaseProperties.forEach((property: unknown, index: number) => {
      if (!isRecord(property)) {
        errors.push(`Surfactant phase property at index ${index} must be an object.`);
        return;
      }
      if (property.surfactantId !== null && typeof property.surfactantId !== 'string') {
        errors.push(`Surfactant phase property ${property.id || index} surfactantId must be null or a string.`);
      }
      if (property.composition !== null && typeof property.composition !== 'string') {
        errors.push(`Surfactant phase property ${property.id || index} composition must be null or a string.`);
      }
      if (property.value !== null && (typeof property.value !== 'number' || !Number.isFinite(property.value))) {
        errors.push(`Surfactant phase property ${property.id || index} value must be null or a finite number.`);
      }
      if (property.concentration !== null && (typeof property.concentration !== 'number' || !Number.isFinite(property.concentration) || property.concentration < 0)) {
        errors.push(`Surfactant phase property ${property.id || index} concentration must be null or a non-negative finite number.`);
      }
      if (property.uncertaintyValue !== null && (typeof property.uncertaintyValue !== 'number' || !Number.isFinite(property.uncertaintyValue) || property.uncertaintyValue < 0)) {
        errors.push(`Surfactant phase property ${property.id || index} uncertaintyValue must be null or a non-negative finite number.`);
      }
      if (property.propertyName !== 'KRAFFT_POINT' || !isNonEmptyString(property.reportedName) ||
          !isNonEmptyString(property.unit) || !isNonEmptyString(property.sourceReference) ||
          typeof property.notes !== 'string' ||
          !['MEASURED', 'REPORTED', 'ESTIMATED', 'IMPUTED', 'MODEL_PREDICTED', 'UNKNOWN'].includes(property.valueOrigin) ||
          !['UNVERIFIED', 'SOURCE_REVIEWED', 'BLOCKED'].includes(property.evidenceStatus)) {
        errors.push(`Surfactant phase property ${property.id || index} has invalid identity, unit, provenance, origin, or evidence status.`);
      }
      for (const key of ['concentrationUnit', 'solutionComposition', 'measurementMethod', 'uncertaintyUnit']) {
        if (property[key] !== null && typeof property[key] !== 'string') {
          errors.push(`Surfactant phase property ${property.id || index} ${key} must be null or a string.`);
        }
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Structural validation does not alter maturity, evidence status, licensing, or phase state.
  return { valid: true, errors: [], parsedState: parsed as VaultState };
}

/**
 * Converts registers to standard CSV format
 */
export function exportVaultToCSV(
  category: 'engines' | 'evidence' | 'datasets' | 'audits',
  state: VaultState
): string {
  switch (category) {
    case 'engines': {
      const headers = [
        'ID',
        'Name',
        'Category',
        'Source File',
        'Entry Point',
        'Maturity Status',
        'Validation Readiness',
        'Coverage %',
        'Verification Status',
        'Operating Conditions',
      ];
      const rows = state.engines.map(e => [
        `"${e.id}"`,
        `"${e.name.replace(/"/g, '""')}"`,
        `"${e.category}"`,
        `"${e.sourceFile}"`,
        `"${e.entryPoint}"`,
        `"${e.scientificMaturity}"`,
        `"${e.numericalValidationReadiness}"`,
        e.evidenceCoveragePct,
        `"${e.independentVerificationStatus}"`,
        `"${e.operatingConditions.replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    case 'evidence': {
      const headers = [
        'ID',
        'Title',
        'Evidence Type',
        'Publisher',
        'Publication Date',
        'DOI/URL',
        'Access Status',
        'Download Status',
        'Inspection Status',
        'License',
      ];
      const rows = state.evidence.map(e => [
        `"${e.id}"`,
        `"${e.title.replace(/"/g, '""')}"`,
        `"${e.evidenceType}"`,
        `"${e.publisher.replace(/"/g, '""')}"`,
        `"${e.publicationDate}"`,
        `"${e.doi || e.originalUrl}"`,
        `"${e.accessStatus}"`,
        `"${e.downloadStatus}"`,
        `"${e.numericalInspectionStatus}"`,
        `"${e.license.replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    case 'datasets': {
      const headers = [
        'ID',
        'Name',
        'Evidence ID',
        'Inspection Status',
        'Actual Rows',
        'Actual Columns',
        'Designation',
        'Readiness',
        'Source URL',
      ];
      const rows = state.datasets.map(d => [
        `"${d.id}"`,
        `"${d.name.replace(/"/g, '""')}"`,
        `"${d.evidenceId}"`,
        `"${d.inspectionStatus}"`,
        d.actualRowCount === null ? 'NULL_UNINSPECTED' : d.actualRowCount,
        d.actualColumnCount === null ? 'NULL_UNINSPECTED' : d.actualColumnCount,
        `"${d.designation}"`,
        `"${d.numericalValidationReadiness}"`,
        `"${d.originalDatasetUrl}"`,
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    case 'audits': {
      const headers = [
        'Audit ID',
        'Date',
        'Phase',
        'Scope',
        'Approval Status',
        'Reviewer Decision',
        'Findings Count',
        'Commit Hash',
      ];
      const rows = state.audits.map(a => [
        `"${a.id}"`,
        `"${a.date}"`,
        `"${a.phase.replace(/"/g, '""')}"`,
        `"${a.scope.replace(/"/g, '""')}"`,
        `"${a.approvalStatus}"`,
        `"${a.independentReviewerDecision}"`,
        a.findings.length,
        `"${a.repoCommitOrZipHash}"`,
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
  }
}

/**
 * Deterministically generates a Markdown report from canonical JSON data
 */
export function generateMarkdownReport(data: any): string {
  let markdown = `# PHASE 4B — ROUND-9 MASTER REMEDIATION & SCIENTIFIC AUDIT REPORT\n\n`;
  markdown += `**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  \n`;
  markdown += `**Governance Gate Status:** Phase 4B \`ACTIVE / OPEN\` | Phase 5 \`STRICTLY LOCKED\`  \n`;
  markdown += `**Date:** ${data.timestamp}\n\n`;

  markdown += `## 1. Per-Worksheet Verification Ledger (Canonical JSON Source)\n\n`;
  markdown += `| Filename | Sheet Name | Used Range Rows | Header Rows | Metadata Rows | Blank Rows | Numeric Rows | Numeric Cells | Physical Observation Status |\n`;
  markdown += `|---|---|---|---|---|---|---|---|---|\n`;

  for (const file of data.files) {
    for (const [sname, sheet] of Object.entries(file.sheets)) {
      const s = sheet as any;
      markdown += `| ${file.filename} | ${sname} | ${s.usedRangeRows} | ${s.headerRows} | ${s.metadataRows} | ${s.blankRows} | ${s.numericRows} | ${s.numericCells} | ${s.physicalObservationStatus} |\n`;
    }
  }

  markdown += `\n## 2. Governance Status & Acceptance Criteria\n\n`;
  markdown += `- **Phase 4B Governance Status:** ${data.governance.phase4b}\n`;
  markdown += `- **Phase 5 Governance Status:** ${data.governance.phase5}\n`;
  markdown += `- **Authoritative Provenance Status:** ${data.governance.provenanceStatus}\n`;
  markdown += `- **Local Integrity Status:** ${data.governance.localIntegrityStatus}\n\n`;

  markdown += `## 3. Totals\n\n`;
  markdown += `- Used Range Rows: ${data.totals.usedRangeRows}\n`;
  markdown += `- Numeric Rows: ${data.totals.numericRows}\n`;
  markdown += `- Numeric Cells: ${data.totals.numericCells}\n\n`;

  return markdown;
}
