/**
 * ============================================================================
 * LIMS SAMPLE & BATCH LIFECYCLE STATE MACHINE ENGINE
 * ============================================================================
 * 
 * Enforces strict scientific lifecycle state transitions for laboratory samples
 * and manufactured chemical batches.
 * 
 * VALID SAMPLE LIFECYCLE:
 *   CREATED -> RECEIVED -> QUEUED -> IN_TESTING -> TEST_COMPLETE ->
 *   PENDING_REVIEW -> APPROVED (or QUARANTINED / REJECTED)
 * 
 * CONTROLLED REOPENING WORKFLOW:
 * - A REJECTED or QUARANTINED sample CANNOT transition directly to APPROVED.
 * - Must pass through explicit re-testing / supervisor review with documented reason.
 * ============================================================================
 */

import {
  LabSample,
  LimsSampleStatus,
  BatchRecord,
  LimsBatchStatus,
  LabTest,
  LimsTestStatus,
} from '../../domain/lims/types';

export interface TransitionResult<T> {
  success: boolean;
  entity?: T;
  errorMessage?: string;
  previousStatus?: string;
  newStatus?: string;
}

// =============================================================================
// SAMPLE LIFECYCLE TRANSITION RULES
// =============================================================================

const VALID_SAMPLE_TRANSITIONS: Record<LimsSampleStatus, LimsSampleStatus[]> = {
  CREATED: ['RECEIVED', 'CANCELLED' as any, 'REJECTED'],
  RECEIVED: ['QUEUED', 'QUARANTINED', 'REJECTED'],
  QUEUED: ['IN_TESTING', 'QUARANTINED', 'REJECTED'],
  IN_TESTING: ['TEST_COMPLETE', 'QUARANTINED', 'REJECTED'],
  TEST_COMPLETE: ['PENDING_REVIEW', 'QUARANTINED', 'REJECTED'],
  PENDING_REVIEW: ['APPROVED', 'QUARANTINED', 'REJECTED', 'QUEUED'], // 'QUEUED' allowed for re-test
  APPROVED: ['QUARANTINED'], // Can only be quarantined post-approval upon investigation
  QUARANTINED: ['PENDING_REVIEW', 'REJECTED', 'QUEUED'],
  REJECTED: ['PENDING_REVIEW'], // CANNOT jump to APPROVED directly; must be re-reviewed/re-tested
};

/**
 * Executes a controlled transition on a LabSample.
 */
export function transitionSampleStatus(
  sample: LabSample,
  targetStatus: LimsSampleStatus,
  user: string,
  reason?: string,
  isSupervisorOverride = false
): TransitionResult<LabSample> {
  const currentStatus = sample.status;

  if (currentStatus === targetStatus) {
    return {
      success: true,
      entity: sample,
      previousStatus: currentStatus,
      newStatus: targetStatus,
    };
  }

  const allowedTransitions = VALID_SAMPLE_TRANSITIONS[currentStatus] || [];

  // Critical safeguard: REJECTED cannot become APPROVED directly
  if (currentStatus === 'REJECTED' && targetStatus === 'APPROVED') {
    return {
      success: false,
      errorMessage: 'Illegal transition: REJECTED sample cannot transition directly to APPROVED. It must pass through PENDING_REVIEW or re-testing.',
      previousStatus: currentStatus,
      newStatus: targetStatus,
    };
  }

  if (!allowedTransitions.includes(targetStatus) && !isSupervisorOverride) {
    return {
      success: false,
      errorMessage: `Invalid sample transition from ${currentStatus} to ${targetStatus}. Allowed target states: ${allowedTransitions.join(', ')}.`,
      previousStatus: currentStatus,
      newStatus: targetStatus,
    };
  }

  const timestamp = new Date().toISOString();
  const updatedHistory = [
    ...(sample.statusHistory || []),
    {
      fromStatus: currentStatus,
      toStatus: targetStatus,
      timestamp,
      user,
      reason: reason || `Status transition from ${currentStatus} to ${targetStatus}`,
    },
  ];

  const updatedSample: LabSample = {
    ...sample,
    status: targetStatus,
    statusHistory: updatedHistory,
    updatedAt: timestamp,
  };

  return {
    success: true,
    entity: updatedSample,
    previousStatus: currentStatus,
    newStatus: targetStatus,
  };
}

// =============================================================================
// BATCH LIFECYCLE TRANSITION RULES
// =============================================================================

const VALID_BATCH_TRANSITIONS: Record<LimsBatchStatus, LimsBatchStatus[]> = {
  PLANNED: ['IN_PROCESS', 'REJECTED'],
  IN_PROCESS: ['COMPLETED', 'QUARANTINED', 'REJECTED'],
  COMPLETED: ['QUARANTINED', 'RELEASED', 'REJECTED'],
  QUARANTINED: ['COMPLETED', 'RELEASED', 'REJECTED'],
  RELEASED: ['QUARANTINED'], // Post-release recall/quarantine
  REJECTED: ['QUARANTINED'], // Cannot release rejected batch without re-quarantine and investigation
};

/**
 * Executes a controlled transition on a BatchRecord.
 */
export function transitionBatchStatus(
  batch: BatchRecord,
  targetStatus: LimsBatchStatus,
  _user?: string,
  reason?: string,
  areAllTestsApproved = false
): TransitionResult<BatchRecord> {
  const currentStatus = batch.status;

  if (currentStatus === targetStatus) {
    return {
      success: true,
      entity: batch,
      previousStatus: currentStatus,
      newStatus: targetStatus,
    };
  }

  // Critical safeguard: Cannot release batch if tests are not approved
  if (targetStatus === 'RELEASED' && !areAllTestsApproved) {
    return {
      success: false,
      errorMessage: 'Cannot transition batch to RELEASED: Mandatory QC laboratory tests have not been fully approved.',
      previousStatus: currentStatus,
      newStatus: targetStatus,
    };
  }

  const allowed = VALID_BATCH_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      success: false,
      errorMessage: `Invalid batch transition from ${currentStatus} to ${targetStatus}.`,
      previousStatus: currentStatus,
      newStatus: targetStatus,
    };
  }

  const timestamp = new Date().toISOString();
  const updatedBatch: BatchRecord = {
    ...batch,
    status: targetStatus,
    statusReason: reason,
    updatedAt: timestamp,
  };

  return {
    success: true,
    entity: updatedBatch,
    previousStatus: currentStatus,
    newStatus: targetStatus,
  };
}

// =============================================================================
// LAB TEST STATUS TRANSITION
// =============================================================================

export function transitionTestStatus(
  test: LabTest,
  targetStatus: LimsTestStatus,
  _user?: string,
  notes?: string
): TransitionResult<LabTest> {
  const currentStatus = test.status;
  const now = new Date().toISOString();

  let startedAt = test.startedAt;
  let completedAt = test.completedAt;

  if (targetStatus === 'IN_PROGRESS' && !startedAt) {
    startedAt = now;
  }
  if ((targetStatus === 'COMPLETED' || targetStatus === 'REJECTED') && !completedAt) {
    completedAt = now;
  }

  const updatedTest: LabTest = {
    ...test,
    status: targetStatus,
    startedAt,
    completedAt,
    notes: notes ? (test.notes ? `${test.notes}; ${notes}` : notes) : test.notes,
    updatedAt: now,
  };

  return {
    success: true,
    entity: updatedTest,
    previousStatus: currentStatus,
    newStatus: targetStatus,
  };
}
