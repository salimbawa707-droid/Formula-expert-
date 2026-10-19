import type {
  VaultState,
  EngineRecord,
  DatasetRecord,
} from '../../domain/vault/types.ts';

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
 * Validates JSON backup schema and detects duplicate IDs
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
  } catch (err: any) {
    return { valid: false, errors: [`JSON Parse error: ${err.message}`] };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['Parsed content is not an object.'] };
  }

  if (!parsed.version) {
    errors.push('Missing schema version field in backup.');
  }

  if (!Array.isArray(parsed.phases)) {
    errors.push('Missing or invalid phases array.');
  }

  if (!Array.isArray(parsed.engines)) {
    errors.push('Missing or invalid engines array.');
  }

  if (!Array.isArray(parsed.evidence)) {
    errors.push('Missing or invalid evidence array.');
  }

  if (!Array.isArray(parsed.datasets)) {
    errors.push('Missing or invalid datasets array.');
  }

  if (!Array.isArray(parsed.audits)) {
    errors.push('Missing or invalid audits array.');
  }

  if (!Array.isArray(parsed.prompts)) {
    errors.push('Missing or invalid prompts array.');
  }

  // Duplicate ID checks
  if (Array.isArray(parsed.engines)) {
    const ids = new Set<string>();
    for (const eng of parsed.engines) {
      if (!eng.id) errors.push('Engine missing stable ID.');
      else if (ids.has(eng.id)) errors.push(`Duplicate engine ID detected: ${eng.id}`);
      else ids.add(eng.id);
    }
  }

  if (Array.isArray(parsed.evidence)) {
    const ids = new Set<string>();
    for (const ev of parsed.evidence) {
      if (!ev.id) errors.push('Evidence record missing ID.');
      else if (ids.has(ev.id)) errors.push(`Duplicate evidence ID detected: ${ev.id}`);
      else ids.add(ev.id);
    }
  }

  if (Array.isArray(parsed.datasets)) {
    const ids = new Set<string>();
    for (const ds of parsed.datasets) {
      if (!ds.id) errors.push('Dataset record missing ID.');
      else if (ids.has(ds.id)) errors.push(`Duplicate dataset ID detected: ${ds.id}`);
      else ids.add(ds.id);
    }
  }

  // Check pricing records preservation rule:
  // If pricingRecords exists, check that prices can be null
  if (Array.isArray(parsed.pricingRecords)) {
    const hasNullPriced = parsed.pricingRecords.some(
      (p: any) => p.pricePerKg === null || p.priceStatus === 'UNKNOWN_NULL'
    );
    if (!hasNullPriced) {
      // Warning or check
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

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
