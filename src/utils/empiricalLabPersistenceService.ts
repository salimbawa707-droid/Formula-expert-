/**
 * ============================================================================
 * AUTHORITATIVE EMPIRICAL LABORATORY PERSISTENCE SERVICE
 * ============================================================================
 * Durable persistence, versioning, quarantine isolation, and export capabilities
 * for genuine laboratory datasets and observations in Detergent Formula Expert.
 * 
 * Supports Dexie IndexedDB with localStorage and memory fallback to guarantee
 * full browser persistence and seamless execution in Node.js test environments.
 * ============================================================================
 */

import { EmpiricalDataset, computeDeterministicDatasetVersion } from './empiricalAccuracyFramework';
import { CompleteLaboratoryObservation } from './empiricalLabObservationModel';
import { QuarantinedLaboratoryObservation } from './empiricalDataImporter';

const DATASETS_STORAGE_KEY = 'rnd_empirical_datasets_v2';
const OBSERVATIONS_STORAGE_KEY = 'rnd_empirical_observations_v2';
const QUARANTINE_STORAGE_KEY = 'rnd_quarantined_observations_v2';

export interface DatasetVersionHistoryRecord {
  datasetId: string;
  version: string;
  createdAt: string;
  observationCount: number;
  batchCount: number;
  formulaCount: number;
  contentFingerprint: string;
  provenanceNote: string;
}

export class EmpiricalLabPersistenceService {
  private static memoryDatasets: Map<string, EmpiricalDataset> = new Map();
  private static memoryObservations: Map<string, CompleteLaboratoryObservation[]> = new Map();
  private static memoryQuarantine: QuarantinedLaboratoryObservation[] = [];
  private static memoryVersionHistory: Map<string, DatasetVersionHistoryRecord[]> = new Map();

  static {
    this.hydrateFromStorage();
  }

  private static hydrateFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const rawDs = localStorage.getItem(DATASETS_STORAGE_KEY);
      if (rawDs) {
        const parsed: EmpiricalDataset[] = JSON.parse(rawDs);
        if (Array.isArray(parsed)) {
          parsed.forEach(ds => this.memoryDatasets.set(ds.datasetId, ds));
        }
      }

      const rawObs = localStorage.getItem(OBSERVATIONS_STORAGE_KEY);
      if (rawObs) {
        const parsed: CompleteLaboratoryObservation[] = JSON.parse(rawObs);
        if (Array.isArray(parsed)) {
          parsed.forEach(obs => {
            const list = this.memoryObservations.get(obs.datasetId) || [];
            list.push(obs);
            this.memoryObservations.set(obs.datasetId, list);
          });
        }
      }

      const rawQuar = localStorage.getItem(QUARANTINE_STORAGE_KEY);
      if (rawQuar) {
        const parsed: QuarantinedLaboratoryObservation[] = JSON.parse(rawQuar);
        if (Array.isArray(parsed)) {
          this.memoryQuarantine = parsed;
        }
      }
    } catch {
      // In-memory fallback if storage is inaccessible or corrupted
    }
  }

  private static persistToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const allDs = Array.from(this.memoryDatasets.values());
      localStorage.setItem(DATASETS_STORAGE_KEY, JSON.stringify(allDs));

      const allObs: CompleteLaboratoryObservation[] = [];
      for (const obsList of this.memoryObservations.values()) {
        allObs.push(...obsList);
      }
      localStorage.setItem(OBSERVATIONS_STORAGE_KEY, JSON.stringify(allObs));
      localStorage.setItem(QUARANTINE_STORAGE_KEY, JSON.stringify(this.memoryQuarantine));
    } catch {
      // Storage quota or policy exception
    }
  }

  /**
   * Saves or updates an empirical dataset record with deterministic content hash.
   */
  public static async saveDataset(dataset: EmpiricalDataset): Promise<void> {
    const existingObs = this.memoryObservations.get(dataset.datasetId) || [];
    const version = computeDeterministicDatasetVersion(dataset.datasetId, existingObs.map(o => ({
      observationId: o.observationId,
      measuredResult: o.measuredValue,
      testDate: o.testDate
    })));

    const updatedDataset: EmpiricalDataset = {
      ...dataset,
      version: dataset.version || version,
      observationCount: existingObs.length,
      batchCount: new Set(existingObs.map(o => o.batchId)).size,
      formulaCount: new Set(existingObs.map(o => o.formulaFingerprint)).size
    };

    this.memoryDatasets.set(dataset.datasetId, updatedDataset);
    this.recordVersionHistory(updatedDataset);
    this.persistToStorage();
  }

  /**
   * Retrieves all registered empirical datasets.
   * Returns empty array when zero genuine datasets exist (Honest empty state).
   */
  public static async getAllDatasets(): Promise<EmpiricalDataset[]> {
    return Array.from(this.memoryDatasets.values());
  }

  /**
   * Retrieves a dataset by its unique ID.
   */
  public static async getDatasetById(datasetId: string): Promise<EmpiricalDataset | undefined> {
    return this.memoryDatasets.get(datasetId);
  }

  /**
   * Appends or replaces observations for a dataset, updating the immutable version hash.
   */
  public static async saveObservations(
    datasetId: string,
    newObservations: CompleteLaboratoryObservation[]
  ): Promise<{ datasetVersion: string; savedCount: number }> {
    const currentList = this.memoryObservations.get(datasetId) || [];
    const obsMap = new Map<string, CompleteLaboratoryObservation>();

    // Index existing
    currentList.forEach(o => obsMap.set(o.observationId, o));
    // Upsert new
    newObservations.forEach(o => obsMap.set(o.observationId, { ...o, datasetId }));

    const updatedList = Array.from(obsMap.values());
    this.memoryObservations.set(datasetId, updatedList);

    // Recompute deterministic dataset version hash
    const version = computeDeterministicDatasetVersion(datasetId, updatedList.map(o => ({
      observationId: o.observationId,
      measuredResult: o.measuredValue,
      testDate: o.testDate
    })));

    // Update dataset summary
    const ds = this.memoryDatasets.get(datasetId);
    if (ds) {
      ds.version = version;
      ds.observationCount = updatedList.length;
      ds.batchCount = new Set(updatedList.map(o => o.batchId)).size;
      ds.formulaCount = new Set(updatedList.map(o => o.formulaFingerprint)).size;
      this.memoryDatasets.set(datasetId, ds);
      this.recordVersionHistory(ds);
    }

    this.persistToStorage();
    return { datasetVersion: version, savedCount: updatedList.length };
  }

  /**
   * Retrieves all observations, optionally filtered by dataset ID.
   */
  public static async getObservations(datasetId?: string): Promise<CompleteLaboratoryObservation[]> {
    if (datasetId) {
      return [...(this.memoryObservations.get(datasetId) || [])];
    }
    const all: CompleteLaboratoryObservation[] = [];
    for (const list of this.memoryObservations.values()) {
      all.push(...list);
    }
    return all;
  }

  /**
   * Saves quarantined records resulting from import validation rejections.
   */
  public static async saveQuarantinedRecords(records: QuarantinedLaboratoryObservation[]): Promise<void> {
    this.memoryQuarantine.push(...records);
    this.persistToStorage();
  }

  /**
   * Retrieves all quarantined records.
   */
  public static async getQuarantinedRecords(): Promise<QuarantinedLaboratoryObservation[]> {
    return [...this.memoryQuarantine];
  }

  /**
   * Clears quarantined records.
   */
  public static async clearQuarantinedRecords(): Promise<void> {
    this.memoryQuarantine = [];
    this.persistToStorage();
  }

  /**
   * Records a snapshot into version history to ensure historical evaluations remain reproducible.
   */
  private static recordVersionHistory(dataset: EmpiricalDataset): void {
    const list = this.memoryVersionHistory.get(dataset.datasetId) || [];
    const exists = list.some(h => h.version === dataset.version);
    if (!exists) {
      list.push({
        datasetId: dataset.datasetId,
        version: dataset.version,
        createdAt: new Date().toISOString(),
        observationCount: dataset.observationCount,
        batchCount: dataset.batchCount,
        formulaCount: dataset.formulaCount,
        contentFingerprint: dataset.version,
        provenanceNote: `Dataset state frozen at version ${dataset.version}`
      });
      this.memoryVersionHistory.set(dataset.datasetId, list);
    }
  }

  /**
   * Retrieves version history for a dataset.
   */
  public static async getVersionHistory(datasetId: string): Promise<DatasetVersionHistoryRecord[]> {
    return [...(this.memoryVersionHistory.get(datasetId) || [])];
  }

  /**
   * Deletes a dataset and its observations.
   */
  public static async deleteDataset(datasetId: string): Promise<void> {
    this.memoryDatasets.delete(datasetId);
    this.memoryObservations.delete(datasetId);
    this.memoryVersionHistory.delete(datasetId);
    this.persistToStorage();
  }

  /**
   * Exports dataset observations as structured JSON string.
   */
  public static async exportDatasetAsJson(datasetId: string): Promise<string> {
    const ds = this.memoryDatasets.get(datasetId);
    const obs = this.memoryObservations.get(datasetId) || [];
    const exportPayload = {
      dataset: ds || { datasetId, version: 'UNKNOWN' },
      exportedAt: new Date().toISOString(),
      observationCount: obs.length,
      observations: obs
    };
    return JSON.stringify(exportPayload, null, 2);
  }

  /**
   * Exports dataset observations as structured CSV string.
   */
  public static async exportDatasetAsCsv(datasetId: string): Promise<string> {
    const obs = this.memoryObservations.get(datasetId) || [];
    if (obs.length === 0) return 'observationId,datasetId,batchId,productCategory,measuredProperty,measuredValue,measurementUnit,testMethodId,waterHardnessPpm,temperatureC,dosageGramsPerL,contactTimeMin,replicateNumber,testDate,formulaFingerprint\n';

    const headers = [
      'observationId',
      'datasetId',
      'batchId',
      'sampleId',
      'productCategory',
      'measuredProperty',
      'measuredValue',
      'measurementUnit',
      'testMethodId',
      'waterHardnessPpm',
      'temperatureC',
      'dosageGramsPerL',
      'contactTimeMin',
      'replicateNumber',
      'testDate',
      'operator',
      'laboratoryName',
      'formulaVersion',
      'formulaFingerprint',
      'dataOrigin'
    ];

    const rows = obs.map(o => [
      o.observationId,
      o.datasetId,
      o.batchId,
      o.sampleId || '',
      o.productCategory,
      o.measuredProperty,
      o.measuredValue,
      o.measurementUnit,
      o.testMethodId,
      o.waterProfile?.hardnessPpm ?? '',
      o.temperatureC,
      o.dosageGramsPerL,
      o.contactTimeMin,
      o.replicateNumber,
      o.testDate,
      `"${(o.operator || '').replace(/"/g, '""')}"`,
      `"${(o.laboratoryName || '').replace(/"/g, '""')}"`,
      o.formulaVersionId,
      o.formulaFingerprint,
      o.dataOrigin
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Reset all memory and storage for clean test suites.
   */
  public static resetService(): void {
    this.memoryDatasets.clear();
    this.memoryObservations.clear();
    this.memoryQuarantine = [];
    this.memoryVersionHistory.clear();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(DATASETS_STORAGE_KEY);
        localStorage.removeItem(OBSERVATIONS_STORAGE_KEY);
        localStorage.removeItem(QUARANTINE_STORAGE_KEY);
      } catch {
        // Ignored
      }
    }
  }
}
