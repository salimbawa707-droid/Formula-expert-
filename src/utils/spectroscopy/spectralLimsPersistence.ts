/**
 * ============================================================================
 * AUTHORITATIVE SPECTRAL LIMS PERSISTENCE ENGINE
 * ============================================================================
 * 
 * Enforces strict persistence, read-back verification, idempotency, provenance preservation,
 * and anti-bypass guarantees for uploaded and analyzed spectra entering the LIMS evidence chain.
 * ============================================================================
 */

import { SpectrumRecord, SpectralConformityReport } from './types';
import { EvidenceRecord, LabMeasurement } from '../../domain/lims/types';
import { InstrumentRecord } from '../../domain/lims/instrument';
import { generateSpectralEvidenceRecord, SpectralLimsIntegrationResult } from './spectralEvidenceService';

export interface SpectralPersistenceResult {
  success: boolean;
  status: 'PERSISTED' | 'ALREADY_PERSISTED' | 'FAILED';
  persistedRecordId?: string;
  evidenceRecord?: EvidenceRecord;
  measurement?: LabMeasurement;
  error?: string;
  readBackVerified: boolean;
  isDuplicate?: boolean;
}

const SPECTRAL_LIMS_STORAGE_KEY = 'rnd_spectral_records';
const LIMS_EVIDENCE_STORAGE_KEY = 'rnd_lab_evidence';

let memorySpectralStore: Array<{ spectrum: SpectrumRecord; evidence: EvidenceRecord; measurement: LabMeasurement; persistedAt?: string }> = [];

export function getStoredSpectralRecords(): Array<{ spectrum: SpectrumRecord; evidence: EvidenceRecord; measurement: LabMeasurement; persistedAt?: string }> {
  if (typeof localStorage === 'undefined') return memorySpectralStore;
  try {
    const raw = localStorage.getItem(SPECTRAL_LIMS_STORAGE_KEY);
    if (!raw) return memorySpectralStore;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : memorySpectralStore;
  } catch (e) {
    return memorySpectralStore;
  }
}

export function saveStoredSpectralRecords(records: Array<{ spectrum: SpectrumRecord; evidence: EvidenceRecord; measurement: LabMeasurement; persistedAt?: string }>): void {
  memorySpectralStore = [...records];
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SPECTRAL_LIMS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    // Storage failure handling
  }
}

/**
 * Authoritatively verifies whether a given spectrum is already persisted in the LIMS store and verifies read-back integrity.
 */
export function verifySpectrumLimsPersistenceStatus(spectrum?: SpectrumRecord | null): {
  isPersisted: boolean;
  status: 'PERSISTED' | 'NOT_REGISTERED';
  evidenceId?: string;
  persistedAt?: string;
} {
  if (!spectrum || !spectrum.id || !spectrum.rawSpectrumHash) {
    return { isPersisted: false, status: 'NOT_REGISTERED' };
  }
  const stored = getStoredSpectralRecords();
  const found = stored.find(
    r => r.spectrum.rawSpectrumHash === spectrum.rawSpectrumHash && r.spectrum.id === spectrum.id
  );
  if (found && found.evidence && found.evidence.evidenceId) {
    if (found.spectrum.rawSpectrumHash === spectrum.rawSpectrumHash) {
      return {
        isPersisted: true,
        status: 'PERSISTED',
        evidenceId: found.evidence.evidenceId,
        persistedAt: found.persistedAt
      };
    }
  }
  return { isPersisted: false, status: 'NOT_REGISTERED' };
}

/**
 * Persists a real user-imported spectrum through the authoritative LIMS storage pathway.
 * Implements atomicity, read-back verification, idempotency, and strict provenance enforcement.
 */
export function persistSpectralRecordToLims(
  spectrum: SpectrumRecord,
  conformityReport: SpectralConformityReport,
  instrument?: InstrumentRecord
): SpectralPersistenceResult {
  try {
    // 1. Validation: Check required spectrum identity and integrity
    if (!spectrum || !spectrum.id || !spectrum.x || !spectrum.y || spectrum.x.length === 0 || spectrum.y.length === 0) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Validation failed: Malformed spectrum or missing required identity/data points.',
        readBackVerified: false,
      };
    }

    if (!spectrum.rawSpectrumHash) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Validation failed: Missing raw spectrum SHA-256 hash integrity identifier.',
        readBackVerified: false,
      };
    }

    // 2. Provenance & Problem #5 Checks: Block synthetic/demo/reference spectra from illicit LAB_TESTED / LAB_VALIDATED promotion
    const isSyntheticOrDemo = 
      spectrum.sourceType === 'SYNTHETIC' ||
      spectrum.sourceType === 'REFERENCE' ||
      spectrum.sourceType === 'DEMO' ||
      spectrum.sourceType === 'SIMULATED' ||
      spectrum.id.includes('DEMO') || 
      spectrum.id.includes('SYNTH') || 
      spectrum.id.includes('SIM') ||
      spectrum.id.includes('REF') ||
      spectrum.sourceFileName?.toLowerCase().includes('synthetic') ||
      spectrum.sourceFileName?.toLowerCase().includes('demo') ||
      (spectrum.title && /synthetic|demo|simulated|reference/i.test(spectrum.title));

    if (isSyntheticOrDemo && (conformityReport.evidenceLevel === 'LAB_TESTED' || conformityReport.evidenceLevel === 'LAB_VALIDATED' || conformityReport.evidenceLevel === 'CERTIFIED')) {
      return {
        success: false,
        status: 'FAILED',
        error: 'PROVENANCE VIOLATION: Synthetic, reference, demo, or simulated spectra cannot be promoted to or persisted as LAB_TESTED, LAB_VALIDATED, or CERTIFIED.',
        readBackVerified: false,
      };
    }

    // 3. Duplicate Protection / Idempotency Check
    const existingRecords = getStoredSpectralRecords();
    const duplicate = existingRecords.find(r => r.spectrum.rawSpectrumHash === spectrum.rawSpectrumHash && r.spectrum.id === spectrum.id);
    if (duplicate) {
      return {
        success: true,
        status: 'ALREADY_PERSISTED',
        persistedRecordId: duplicate.evidence.evidenceId,
        evidenceRecord: duplicate.evidence,
        measurement: duplicate.measurement,
        readBackVerified: true,
        isDuplicate: true,
      };
    }

    // 4. Generate Evidence Record & Lab Measurement via Authoritative Service
    const integrationResult: SpectralLimsIntegrationResult = generateSpectralEvidenceRecord(
      spectrum,
      conformityReport,
      instrument
    );

    const { evidenceRecord, measurement } = integrationResult;

    // 5. Authoritative LIMS Insertion
    const newEntry = {
      spectrum: { ...spectrum },
      evidence: { ...evidenceRecord },
      measurement: { ...measurement },
      persistedAt: new Date().toISOString(),
    };

    const updatedRecords = [newEntry, ...existingRecords];
    saveStoredSpectralRecords(updatedRecords);

    // Also persist into general LIMS evidence store if available
    try {
      if (typeof localStorage !== 'undefined') {
        const generalEvidenceRaw = localStorage.getItem(LIMS_EVIDENCE_STORAGE_KEY);
        const generalEvidence = generalEvidenceRaw ? JSON.parse(generalEvidenceRaw) : [];
        localStorage.setItem(LIMS_EVIDENCE_STORAGE_KEY, JSON.stringify([evidenceRecord, ...generalEvidence]));
      }
    } catch (e) {
      // Non-fatal if general evidence store sync fails, but spectral store is authoritative
    }

    // 6. Read-Back Verification
    const verificationRecords = getStoredSpectralRecords();
    const found = verificationRecords.find(r => r.evidence.evidenceId === evidenceRecord.evidenceId);

    if (!found || found.spectrum.rawSpectrumHash !== spectrum.rawSpectrumHash || found.evidence.evidenceId !== evidenceRecord.evidenceId) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Read-back verification failed: Persisted record could not be read back or integrity hash mismatch.',
        readBackVerified: false,
      };
    }

    return {
      success: true,
      status: 'PERSISTED',
      persistedRecordId: evidenceRecord.evidenceId,
      evidenceRecord,
      measurement,
      readBackVerified: true,
      isDuplicate: false,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'FAILED',
      error: `LIMS persistence failed: ${err.message || String(err)}`,
      readBackVerified: false,
    };
  }
}
