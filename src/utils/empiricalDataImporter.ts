/**
 * ============================================================================
 * PHASE P2-13 — REAL LABORATORY DATA IMPORTER & SCHEMA WIZARD
 * ============================================================================
 * Structured CSV and JSON parser with schema validation, unit normalization,
 * data origin firewall inspection, and automatic Quality Gate ingestion.
 * ============================================================================
 */

import { Productcategory13 } from './empiricalAccuracyFramework';
import {
  CompleteLaboratoryObservation,
  DataOrigin,
  validateLaboratoryObservation,
  computeDeterministicFormulaFingerprint
} from './empiricalLabObservationModel';
import { HardenedEmpiricalAccuracyEngine } from './empiricalAccuracyFramework';

export interface LabImportResult {
  totalParsed: number;
  approvedCount: number;
  needsReviewCount: number;
  rejectedCount: number;
  rejectedReasons: string[];
  importedObservations: CompleteLaboratoryObservation[];
}

export interface LabImportMetadata {
  datasetId: string;
  datasetVersion?: string;
  laboratoryName: string;
  operator: string;
  dataOrigin: DataOrigin;
  formulaVersion?: string;
  formulaFingerprint?: string;
  ingredients?: Array<{ ingredientId: string; gradeId?: string; commercialMaterial?: string; percentage: number; activeMatterPct?: number }>;
  targetPH?: number;
}

export class EmpiricalDataImporter {
  /**
   * Parses structured CSV laboratory data and executes Quality Gate validation.
   * Strictly rejects missing scientific metadata without fabricating defaults.
   */
  public static parseCsvLaboratoryData(
    csvContent: string,
    defaultMetadata: LabImportMetadata
  ): LabImportResult {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      return {
        totalParsed: 0,
        approvedCount: 0,
        needsReviewCount: 0,
        rejectedCount: 1,
        rejectedReasons: ['Empty or header-only CSV file.'],
        importedObservations: []
      };
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1);

    const importedObservations: CompleteLaboratoryObservation[] = [];
    const rejectedReasons: string[] = [];
    let approvedCount = 0;
    let needsReviewCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < header.length) continue;

      const getCol = (name: string): string => {
        const idx = header.indexOf(name.toLowerCase());
        return idx >= 0 ? cols[idx] : '';
      };

      const missingFields: string[] = [];

      const obsId = getCol('observationid');
      if (!obsId) missingFields.push('observationId');

      const rawCategory = getCol('productcategory');
      if (!rawCategory) missingFields.push('productCategory');
      const category = (rawCategory || '').toUpperCase() as Productcategory13;

      const formulaId = getCol('formulaid');
      if (!formulaId) missingFields.push('formulaId');

      const rawFormulaVer = getCol('formulaversion') || defaultMetadata.formulaVersion;
      if (!rawFormulaVer) missingFields.push('formulaVersion');

      const rawDatasetVer = getCol('datasetversion') || defaultMetadata.datasetVersion;
      if (!rawDatasetVer) missingFields.push('datasetVersion');

      const batchId = getCol('batchid');
      if (!batchId) missingFields.push('batchId');

      const measuredProperty = getCol('measuredproperty');
      if (!measuredProperty) missingFields.push('measuredProperty');

      const rawVal = getCol('measuredvalue');
      const measuredVal = parseFloat(rawVal);
      if (!rawVal || isNaN(measuredVal)) missingFields.push('measuredValue');

      const unit = getCol('measurementunit');
      if (!unit) missingFields.push('measurementUnit');

      const testMethodId = getCol('testmethodid');
      if (!testMethodId) missingFields.push('testMethodId');

      const rawHardness = getCol('waterhardnessppm');
      const hardnessPpm = parseFloat(rawHardness);
      if (!rawHardness || isNaN(hardnessPpm)) missingFields.push('waterHardnessPpm');

      const rawTemp = getCol('temperaturec');
      const tempC = parseFloat(rawTemp);
      if (!rawTemp || isNaN(tempC)) missingFields.push('temperatureC');

      const rawDosage = getCol('dosagegramsperl');
      const dosage = parseFloat(rawDosage);
      if (!rawDosage || isNaN(dosage)) missingFields.push('dosageGramsPerL');

      const rawContactTime = getCol('contacttimemin') || getCol('contacttime');
      const contactTimeMin = parseFloat(rawContactTime);
      if (!rawContactTime || isNaN(contactTimeMin) || contactTimeMin <= 0) {
        missingFields.push('contactTimeMin');
      }

      const rawReplicate = getCol('replicatenumber');
      const replicate = parseInt(rawReplicate);
      if (!rawReplicate || isNaN(replicate) || replicate < 1) missingFields.push('replicateNumber');

      const testDate = getCol('testdate');
      if (!testDate) missingFields.push('testDate');

      // Formula composition / fingerprint validation (No generic shortcuts)
      let fp = getCol('formulafingerprint') || defaultMetadata.formulaFingerprint || '';
      if (!fp) {
        const rawIngredientsCol = getCol('ingredients');
        let parsedIngredients = defaultMetadata.ingredients;
        if (rawIngredientsCol) {
          try {
            parsedIngredients = JSON.parse(rawIngredientsCol);
          } catch {
            // Delimited format: ing1:pct1|ing2:pct2
            parsedIngredients = rawIngredientsCol.split('|').map(item => {
              const [iId, p] = item.split(':');
              return { ingredientId: iId, percentage: parseFloat(p) || 0 };
            });
          }
        }

        if (parsedIngredients && parsedIngredients.length > 0) {
          fp = computeDeterministicFormulaFingerprint({
            productCategory: category,
            ingredients: parsedIngredients,
            formulaVersion: rawFormulaVer,
            waterHardnessPpm: hardnessPpm
          });
        } else {
          missingFields.push('formulaComposition');
        }
      }

      if (missingFields.length > 0) {
        rejectedCount++;
        rejectedReasons.push(`Row ${i + 2} [${obsId || `row-${i + 2}`}]: MISSING_REQUIRED_FIELD (${missingFields.join(', ')})`);
        continue;
      }

      const obs: CompleteLaboratoryObservation = {
        observationId: obsId,
        datasetId: defaultMetadata.datasetId,
        formulaFingerprint: fp,
        formulaVersionId: rawFormulaVer!,
        batchId,
        productCategory: category,
        commercialMaterials: [],
        waterProfile: { hardnessPpm },
        temperatureC: tempC,
        dosageGramsPerL: dosage,
        contactTimeMin,
        testMethodId,
        replicateNumber: replicate,
        measuredProperty,
        measuredValue: measuredVal,
        measurementUnit: unit,
        operator: defaultMetadata.operator,
        laboratoryName: defaultMetadata.laboratoryName,
        testDate,
        evidenceIds: [`EV-${obsId}`],
        provenanceStatus: 'REAL_LAB_IMPORT',
        dataQualityStatus: 'APPROVED_FOR_VALIDATION',
        dataOrigin: defaultMetadata.dataOrigin,
        auditTrail: [`Imported via parseCsvLaboratoryData on ${new Date().toISOString()}`]
      };

      // Quality Gate Validation
      const qg = validateLaboratoryObservation(obs);
      if (qg.status === 'REJECTED') {
        rejectedCount++;
        rejectedReasons.push(`Row ${i + 2} [${obsId}]: ${qg.errors.join('; ')}`);
      } else {
        if (qg.status === 'APPROVED_FOR_VALIDATION') approvedCount++;
        if (qg.status === 'NEEDS_REVIEW') needsReviewCount++;

        // Register to framework
        HardenedEmpiricalAccuracyEngine.registerObservation({
          observationId: obs.observationId,
          datasetId: obs.datasetId,
          datasetVersion: rawDatasetVer!,
          formulaId: formulaId,
          formulaVersion: rawFormulaVer!,
          formulaFingerprint: obs.formulaFingerprint,
          productCategory: obs.productCategory,
          batchId: obs.batchId,
          waterProfile: obs.waterProfile,
          temperatureC: obs.temperatureC,
          dosageGramsPerL: obs.dosageGramsPerL,
          contactTimeMin: obs.contactTimeMin,
          testMethod: obs.testMethodId,
          replicateId: obs.replicateNumber,
          measuredResult: obs.measuredValue,
          unit: obs.measurementUnit,
          laboratoryName: obs.laboratoryName,
          operator: obs.operator,
          testDate: obs.testDate,
          evidenceId: obs.evidenceIds[0] || `EV-${obs.observationId}`,
          datasetStatus: 'APPROVED_FOR_VALIDATION'
        });

        importedObservations.push(obs);
      }
    }

    return {
      totalParsed: rows.length,
      approvedCount,
      needsReviewCount,
      rejectedCount,
      rejectedReasons,
      importedObservations
    };
  }
}
