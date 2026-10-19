import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Upload,
  Download,
  XCircle,
  Info,
  Database,
  FlaskConical,
  Trash2,
  Activity
} from 'lucide-react';
import {
  EmpiricalValidationEvaluationEngine,
  CANONICAL_EMPIRICAL_TARGETS,
  EmpiricalPropertyEvaluationResult
} from '../../utils/empiricalValidationEvaluationEngine';
import {
  EmpiricalLabPersistenceService
} from '../../utils/empiricalLabPersistenceService';
import {
  EmpiricalDataImporter,
  LabImportResult,
  QuarantinedLaboratoryObservation
} from '../../utils/empiricalDataImporter';
import { EmpiricalDataset } from '../../utils/empiricalAccuracyFramework';
import { CompleteLaboratoryObservation, DataOrigin, computeDeterministicFormulaFingerprint } from '../../utils/empiricalLabObservationModel';
import { FormulaScientificOrchestrator } from '../../utils/orchestrator/formulaScientificOrchestrator';
import { normalizeProductCategory, ProductCategoryId } from '../../domain/productTaxonomy';
import { getCategoryEmpiricalCoverage } from '../../utils/empiricalValidationEvaluationEngine';

interface EmpiricalValidationHubProps {
  activeFormula?: any;
}

export const EmpiricalValidationHub: React.FC<EmpiricalValidationHubProps> = ({
  activeFormula
}) => {
  const [datasets, setDatasets] = useState<EmpiricalDataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [observations, setObservations] = useState<CompleteLaboratoryObservation[]>([]);
  const [quarantinedRecords, setQuarantinedRecords] = useState<QuarantinedLaboratoryObservation[]>([]);
  const [activeProperty, setActiveProperty] = useState<string>('pH Prediction');
  const [evaluationResult, setEvaluationResult] = useState<EmpiricalPropertyEvaluationResult | null>(null);

  // Import Modal & Form States
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importFormat, setImportFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [rawImportText, setRawImportText] = useState<string>('');
  const [importDatasetId, setImportDatasetId] = useState<string>('DS-LAB-2026');
  const [importDataOrigin, setImportDataOrigin] = useState<DataOrigin>('UNKNOWN_ORIGIN');
  const [importLabName, setImportLabName] = useState<string>('');
  const [importOperator, setImportOperator] = useState<string>('');
  const [importResult, setImportResult] = useState<LabImportResult | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'targets' | 'datasets' | 'evaluation' | 'quarantine'>('targets');

  // Load datasets on mount
  useEffect(() => {
    loadPersistenceData();
  }, []);

  const loadPersistenceData = async () => {
    const dsList = await EmpiricalLabPersistenceService.getAllDatasets();
    setDatasets(dsList);
    const quarList = await EmpiricalLabPersistenceService.getQuarantinedRecords();
    setQuarantinedRecords(quarList);

    if (dsList.length > 0) {
      const activeDs = selectedDatasetId && dsList.some(d => d.datasetId === selectedDatasetId)
        ? selectedDatasetId
        : dsList[0].datasetId;
      setSelectedDatasetId(activeDs);
      const obsList = await EmpiricalLabPersistenceService.getObservations(activeDs);
      setObservations(obsList);
    } else {
      setSelectedDatasetId('');
      setObservations([]);
    }
  };

  // Re-run evaluation when activeProperty or observations change
  useEffect(() => {
    runEvaluation();
  }, [activeProperty, observations, activeFormula]);

  const runEvaluation = () => {
    // Predictions come from the app's SSOT scientific orchestrator and are matched
    // only to the exact formula fingerprint; no target/specification value is used as a prediction.
    const predictionsMap = new Map<string, number>();
    let category: ProductCategoryId | undefined;
    if (activeFormula && Array.isArray(activeFormula.ingredients)) {
      const normalizedCategory = normalizeProductCategory(activeFormula.productCategory || activeFormula.category);
      if (normalizedCategory !== 'UNKNOWN_PRODUCT_CATEGORY') {
        try {
          const evaluated = FormulaScientificOrchestrator.evaluate({
            formulaId: activeFormula.formulaId || activeFormula.id,
            formulaName: activeFormula.formulaName || activeFormula.name,
            formulaVersion: activeFormula.formulaVersion || activeFormula.version,
            productCategory: normalizedCategory,
            ingredients: activeFormula.ingredients.map((ingredient: any) => ({
              ...ingredient,
              name: ingredient.name || ingredient.ingredientName || ingredient.id || 'Unknown ingredient',
              percentage: Number(ingredient.percentage ?? ingredient.percent ?? 0)
            })),
            targetPH: activeFormula.targetPH,
            waterHardnessPpm: activeFormula.waterHardnessPpm ?? activeFormula.hardness
          });
          const predictedValues: Record<string, number | null | undefined> = {
            'pH Prediction': evaluated.pHResult?.ph,
            'Density': evaluated.densityResult?.densityGPerCm3,
            'Active Matter': evaluated.activeMatterResult?.totalActiveMatterPct,
            'Viscosity': evaluated.viscosityResult?.predictedViscosityCp,
            'Cleaning Score / CPI': evaluated.cleaningResult?.cpi
          };
          const predicted = predictedValues[activeProperty];
          const formulaVersion = activeFormula.formulaVersion || activeFormula.version;
          const fingerprintIngredients = activeFormula.ingredients.map((ingredient: any) => ({
            ingredientId: ingredient.ingredientId || ingredient.canonicalIngredientId || ingredient.id || '',
            gradeId: ingredient.gradeId || ingredient.commercialGradeId,
            commercialMaterial: ingredient.commercialMaterial,
            percentage: Number(ingredient.percentage ?? ingredient.percent ?? 0),
            activeMatterPct: ingredient.activeMatterPct ?? ingredient.activePercent
          }));
          const canFingerprint = Boolean(formulaVersion) && fingerprintIngredients.length > 0 &&
            fingerprintIngredients.every((ingredient: any) => ingredient.ingredientId && Number.isFinite(ingredient.percentage));
          const fingerprint = activeFormula.empiricalFormulaFingerprint ||
            (canFingerprint ? computeDeterministicFormulaFingerprint({
              productCategory: normalizedCategory,
              ingredients: fingerprintIngredients,
              formulaVersion,
              waterHardnessPpm: activeFormula.waterHardnessPpm ?? activeFormula.hardness
            }) : activeFormula.formulaFingerprint);
          if (typeof predicted === 'number' && Number.isFinite(predicted) && typeof fingerprint === 'string' && fingerprint) {
            predictionsMap.set(fingerprint, predicted);
          }
          category = normalizedCategory;
        } catch (error) {
          console.error('Empirical validation prediction failed in scientific orchestrator.', error);
        }
      }
    }

    const res = EmpiricalValidationEvaluationEngine.evaluatePropertyAgainstLabData({
      property: activeProperty,
      predictionsMap,
      observations,
      category,
      datasetVersion: datasets.find(d => d.datasetId === selectedDatasetId)?.version || 'DS-EMPTY',
    });

    setEvaluationResult(res);
  };

  const handleDeleteDataset = async (datasetId: string) => {
    if (confirm(`Are you sure you want to delete dataset '${datasetId}' and all its observation records?`)) {
      await EmpiricalLabPersistenceService.deleteDataset(datasetId);
      await loadPersistenceData();
    }
  };

  const handleExportJson = async (datasetId: string) => {
    const jsonStr = await EmpiricalLabPersistenceService.exportDatasetAsJson(datasetId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetId}_observations.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async (datasetId: string) => {
    const csvStr = await EmpiricalLabPersistenceService.exportDatasetAsCsv(datasetId);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetId}_observations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunImport = async () => {
    if (!rawImportText.trim()) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const defaultMeta = {
        datasetId: importDatasetId.trim() || 'DS-LAB-IMPORT',
        laboratoryName: importLabName.trim(),
        operator: importOperator.trim(),
        dataOrigin: importDataOrigin,
        formulaVersion: '1.0.0'
      };

      const result = importFormat === 'CSV'
        ? EmpiricalDataImporter.parseCsvLaboratoryData(rawImportText, defaultMeta)
        : EmpiricalDataImporter.parseJsonLaboratoryData(rawImportText, defaultMeta);

      setImportResult(result);

      if (result.importedObservations.length > 0) {
        // Save dataset
        await EmpiricalLabPersistenceService.saveDataset({
          datasetId: defaultMeta.datasetId,
          version: '',
          categories: Array.from(new Set(result.importedObservations.map(o => o.productCategory))),
          property: activeProperty,
          sourceType: result.importedObservations[0]?.dataOrigin || 'UNKNOWN_ORIGIN',
          provenanceIds: [`PROV-${defaultMeta.datasetId}`],
          observationCount: result.importedObservations.length,
          formulaCount: new Set(result.importedObservations.map(o => o.formulaFingerprint)).size,
          batchCount: new Set(result.importedObservations.map(o => o.batchId)).size,
          status: result.importedObservations.every(o => o.dataOrigin === 'REAL_LAB_MEASUREMENT' && o.dataQualityStatus === 'APPROVED_FOR_VALIDATION')
            ? 'APPROVED_FOR_VALIDATION'
            : 'QUALITY_CHECK',
          createdAt: new Date().toISOString()
        });

        // Save observations
        await EmpiricalLabPersistenceService.saveObservations(defaultMeta.datasetId, result.importedObservations);
      }

      if (result.quarantinedRecords.length > 0) {
        await EmpiricalLabPersistenceService.saveQuarantinedRecords(result.quarantinedRecords);
      }

      await loadPersistenceData();
    } catch (e: any) {
      alert(`Import error: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const loadSampleCsvTemplate = () => {
    const sample = `observationId,datasetId,batchId,sampleId,productCategory,measuredProperty,measuredValue,measurementUnit,testMethodId,waterHardnessPpm,temperatureC,dosageGramsPerL,contactTimeMin,replicateNumber,testDate,formulaVersion,formulaFingerprint
OBS-PH-001,DS-LAB-2026,BATCH-101,SMP-101-1,LAUNDRY_LIQUID,pH Prediction,8.45,pH units,ASTM-D1172,150,25.0,2.0,15.0,1,2026-10-10,1.0.0,FP-LAUN-A1B2C3D4
OBS-PH-002,DS-LAB-2026,BATCH-101,SMP-101-2,LAUNDRY_LIQUID,pH Prediction,8.43,pH units,ASTM-D1172,150,25.0,2.0,15.0,2,2026-10-10,1.0.0,FP-LAUN-A1B2C3D4
OBS-PH-003,DS-LAB-2026,BATCH-102,SMP-102-1,LAUNDRY_LIQUID,pH Prediction,8.52,pH units,ASTM-D1172,150,25.0,2.0,15.0,1,2026-10-10,1.0.0,FP-LAUN-A1B2C3D4
OBS-PH-004,DS-LAB-2026,BATCH-103,SMP-103-1,LAUNDRY_LIQUID,pH Prediction,8.40,pH units,ASTM-D1172,150,25.0,2.0,15.0,1,2026-10-11,1.0.0,FP-LAUN-A1B2C3D4
OBS-PH-005,DS-LAB-2026,BATCH-104,SMP-104-1,LAUNDRY_LIQUID,pH Prediction,8.48,pH units,ASTM-D1172,150,25.0,2.0,15.0,1,2026-10-11,1.0.0,FP-LAUN-A1B2C3D4
OBS-PH-006,DS-LAB-2026,BATCH-105,SMP-105-1,LAUNDRY_LIQUID,pH Prediction,8.46,pH units,ASTM-D1172,150,25.0,2.0,15.0,1,2026-10-11,1.0.0,FP-LAUN-A1B2C3D4`;
    setRawImportText(sample);
  };

  const loadSampleJsonTemplate = () => {
    const sample = JSON.stringify([
      {
        observationId: "OBS-JSON-001",
        batchId: "BATCH-201",
        productCategory: "LAUNDRY_LIQUID",
        measuredProperty: "pH Prediction",
        measuredValue: 8.42,
        measurementUnit: "pH units",
        testMethodId: "ASTM-D1172",
        waterHardnessPpm: 150,
        temperatureC: 25.0,
        dosageGramsPerL: 2.0,
        contactTimeMin: 15.0,
        replicateNumber: 1,
        testDate: "2026-10-11",
        formulaVersion: "1.0.0",
        formulaFingerprint: "FP-LAUN-A1B2C3D4"
      },
      {
        observationId: "OBS-JSON-002",
        batchId: "BATCH-202",
        productCategory: "LAUNDRY_LIQUID",
        measuredProperty: "pH Prediction",
        measuredValue: 8.49,
        measurementUnit: "pH units",
        testMethodId: "ASTM-D1172",
        waterHardnessPpm: 150,
        temperatureC: 25.0,
        dosageGramsPerL: 2.0,
        contactTimeMin: 15.0,
        replicateNumber: 1,
        testDate: "2026-10-11",
        formulaVersion: "1.0.0",
        formulaFingerprint: "FP-LAUN-A1B2C3D4"
      }
    ], null, 2);
    setRawImportText(sample);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Scientific Maturity Distinction */}
      <div className="bg-[#0b1020] border border-cyan-500/40 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                EMPIRICAL LABORATORY VALIDATION & SCIENTIFIC INTEGRITY HUB
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative framework comparing genuine laboratory observations against physical predictions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/50 flex items-center gap-1.5 cursor-pointer transition active:scale-95 border border-cyan-400/40"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Lab Dataset (CSV/JSON)
            </button>
          </div>
        </div>

        {/* SCIENTIFIC HONESTY DISCLAIMER */}
        <div className="bg-[#0e1629] border border-amber-500/30 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-200">
              Scientific Maturity Rule: Software tests passing ≠ Empirical Laboratory Validation
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Algorithms and software test suites verify mathematical calculation logic. A model receives <span className="font-mono text-emerald-300 font-bold">LAB_VALIDATED</span> status only when genuine, reproducible experimental observations from verified test methods (ASTM, ISO, DIN) satisfy independent batch sample sufficiency and pass data-leakage audits.
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('targets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'targets'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white bg-[#0e1629] border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Validation Targets (13 categories)
          </button>

          <button
            onClick={() => setActiveTab('datasets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'datasets'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white bg-[#0e1629] border border-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Registered Datasets ({datasets.length})
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'evaluation'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white bg-[#0e1629] border border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Prediction vs. Actual
          </button>

          <button
            onClick={() => setActiveTab('quarantine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quarantine'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'text-slate-400 hover:text-white bg-[#0e1629] border border-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Quarantine Log ({quarantinedRecords.length})
          </button>
        </div>
      </div>

      {/* TAB 1: VALIDATION TARGETS OVERVIEW */}
      {activeTab === 'targets' && (
        <div className="space-y-4">
          <section className="bg-[#0b1020] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-extrabold text-white">13 Category Empirical Coverage</h3>
                <p className="text-[10px] text-slate-400 mt-1">Har category ke relevant lab targets yahan track hote hain; pending ka matlab validated nahi hai.</p>
              </div>
              <span className="text-[10px] font-mono text-cyan-300">{getCategoryEmpiricalCoverage(observations).filter(c => c.evidenceAvailableCount > 0).length}/13 categories with approved lab evidence</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {getCategoryEmpiricalCoverage(observations).map(coverage => (
                <div key={coverage.category} className="rounded-lg border border-slate-800 bg-[#070b18] p-3">
                  <div className="flex justify-between gap-2 text-[10px] font-bold text-white">
                    <span>{coverage.category.replaceAll('_', ' ')}</span>
                    <span className={coverage.evidenceAvailableCount === coverage.requiredTargetCount ? 'text-emerald-300' : 'text-amber-300'}>{coverage.evidenceAvailableCount}/{coverage.requiredTargetCount} targets</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {coverage.targetStatus.map(target => <span key={target.property} title={`${target.property}: ${target.approvedRealLabCount} approved real-lab rows`} className={`rounded px-1.5 py-0.5 text-[9px] ${target.status === 'EVIDENCE_AVAILABLE' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950/60 text-amber-300'}`}>{target.property}</span>)}
                  </div>
                  <div className="mt-2 text-[9px] text-slate-500">Observed rows: {coverage.observations} · Engine groups tracked: {coverage.engineGroups.length} · Scores require matched predictions.</div>
                </div>
              ))}
            </div>
          </section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Object.entries(CANONICAL_EMPIRICAL_TARGETS).map(([propName, target]) => {
              const matchingObs = observations.filter(o => o.measuredProperty.toLowerCase() === propName.toLowerCase() || (propName === 'Cleaning Score / CPI' && o.measuredProperty === 'Cleaning Score'));
              const batchCount = new Set(matchingObs.map(o => o.batchId)).size;
              const hasData = matchingObs.length > 0;
              const isLabValidated = hasData && batchCount >= target.minIndependentBatches && matchingObs.length >= target.minIndependentObservations;

              return (
                <div
                  key={target.targetId}
                  className="bg-[#0b1020] border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">{target.property}</span>
                    <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full border ${
                      isLabValidated
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                        : hasData
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    }`}>
                      {isLabValidated ? 'LAB_VALIDATED' : hasData ? 'EMPIRICALLY_CALIBRATED' : 'DATA_PENDING'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    {target.description}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Standard Protocol:</span>
                      <span className="text-cyan-300 font-bold">{target.testMethod}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Target Acceptance:</span>
                      <span className="text-slate-200">{target.primaryMetric} ≤ {target.acceptanceThreshold} {target.unit}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Dataset Requirement:</span>
                      <span className="text-slate-300">≥ {target.minIndependentBatches} batches (n ≥ {target.minIndependentObservations})</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Current Observations:</span>
                      <span className={hasData ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {hasData ? `${matchingObs.length} obs (${batchCount} batches)` : '0 records (Pending)'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveProperty(propName);
                        setActiveTab('evaluation');
                      }}
                      className="w-full py-1.5 text-[11px] font-bold rounded-lg bg-[#131d35] hover:bg-[#1a284a] text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition cursor-pointer"
                    >
                      Evaluate vs Predictions →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED DATASETS */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          {datasets.length === 0 ? (
            <div className="bg-[#0b1020] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <Database className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-sm font-bold text-slate-300">
                No Real Laboratory Datasets Registered Yet
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No real experimental datasets have been imported. Click below to upload standard CSV or JSON laboratory observation records.
              </p>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Laboratory Dataset
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {datasets.map(ds => (
                <div
                  key={ds.datasetId}
                  className={`bg-[#0b1020] border rounded-xl p-4 transition space-y-3 ${
                    selectedDatasetId === ds.datasetId
                      ? 'border-cyan-500/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{ds.datasetId}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                        Version: {ds.version}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportCsv(ds.datasetId)}
                        className="p-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center gap-1"
                        title="Export CSV"
                      >
                        <Download className="w-3.5 h-3.5" /> CSV
                      </button>
                      <button
                        onClick={() => handleExportJson(ds.datasetId)}
                        className="p-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg cursor-pointer transition flex items-center gap-1"
                        title="Export JSON"
                      >
                        <Download className="w-3.5 h-3.5" /> JSON
                      </button>
                      <button
                        onClick={() => handleDeleteDataset(ds.datasetId)}
                        className="p-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg cursor-pointer transition"
                        title="Delete Dataset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                    <div>
                      <span>Observations: </span>
                      <strong className="text-white">{ds.observationCount}</strong>
                    </div>
                    <div>
                      <span>Unique Batches: </span>
                      <strong className="text-white">{ds.batchCount}</strong>
                    </div>
                    <div>
                      <span>Unique Formulas: </span>
                      <strong className="text-white">{ds.formulaCount}</strong>
                    </div>
                    <div>
                      <span>Categories: </span>
                      <strong className="text-cyan-300">{ds.categories.join(', ') || 'ALL'}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PREDICTION VS. ACTUAL EVALUATION */}
      {activeTab === 'evaluation' && (
        <div className="space-y-4">
          <div className="bg-[#0b1020] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-400">Target Property:</label>
              <select
                value={activeProperty}
                onChange={e => setActiveProperty(e.target.value)}
                className="bg-[#131d35] border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 cursor-pointer font-bold focus:outline-none focus:border-cyan-500"
              >
                {Object.keys(CANONICAL_EMPIRICAL_TARGETS).map(prop => (
                  <option key={prop} value={prop}>{prop}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Selected Dataset:</span>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                {selectedDatasetId || 'None'}
              </span>
            </div>
          </div>

          {evaluationResult && (
            <div className="space-y-4">
              {/* Verdict Summary Card */}
              <div className={`border rounded-2xl p-5 shadow-xl space-y-4 ${
                evaluationResult.validationGateVerdict === 'LAB_VALIDATED'
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : evaluationResult.totalObservationCount === 0
                  ? 'bg-[#0b1020] border-amber-500/40 text-amber-200'
                  : 'bg-indigo-950/30 border-indigo-500/50 text-indigo-200'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-xs uppercase font-mono tracking-wider font-extrabold text-slate-400">
                        Maturity Gate Verdict
                      </div>
                      <div className="text-base font-black text-white">
                        {evaluationResult.validationGateVerdict}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                      evaluationResult.assignedScientificMaturity === 'LAB_VALIDATED'
                        ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      Maturity: {evaluationResult.assignedScientificMaturity}
                    </span>
                  </div>
                </div>

                {/* Metric Statistics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
                  <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">MAE ({evaluationResult.unit})</span>
                    <strong className="text-base text-white">{evaluationResult.acceptedRecordCount > 0 ? evaluationResult.mae : 'N/A'}</strong>
                  </div>
                  <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">RMSE ({evaluationResult.unit})</span>
                    <strong className="text-base text-white">{evaluationResult.acceptedRecordCount > 0 ? evaluationResult.rmse : 'N/A'}</strong>
                  </div>
                  <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">Mean Bias</span>
                    <strong className="text-base text-white">{evaluationResult.acceptedRecordCount > 0 ? evaluationResult.meanSignedBias : 'N/A'}</strong>
                  </div>
                  <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">Independent Batches</span>
                    <strong className="text-base text-cyan-300">{evaluationResult.independentBatchCount}</strong>
                  </div>
                  <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">Independent Holdout Records</span>
                    <strong className="text-base text-cyan-300">{evaluationResult.acceptedRecordCount}</strong>
                  </div>
                  <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">Within Tolerance · Goal 90–95%</span>
                    <strong className={`text-base ${(evaluationResult.withinAcceptanceRatePct ?? 0) >= 90 ? 'text-emerald-300' : 'text-amber-300'}`}>{evaluationResult.withinAcceptanceRatePct === undefined ? 'N/A' : `${evaluationResult.withinAcceptanceRatePct}%`}</strong>
                  </div>
                  <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">Leakage Audit</span>
                    <strong className={evaluationResult.leakageAudit.passed ? 'text-emerald-400' : 'text-rose-400'}>
                      {evaluationResult.leakageAudit.passed ? 'PASSED' : 'LEAKAGE'}
                    </strong>
                  </div>
                </div>

                {/* Gate Reasons Trail */}
                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 font-bold block">Validation Assessment Notes:</span>
                  {evaluationResult.gateReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                      <span className="text-cyan-400">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparisons Table */}
              {evaluationResult.comparisons.length > 0 && (
                <div className="bg-[#0b1020] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="px-4 py-3 bg-[#0e1629] border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">
                      Observation Level Prediction vs. Actual Trace ({evaluationResult.comparisons.length} records)
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#080d1a] text-slate-400 border-b border-slate-800 text-[10px]">
                        <tr>
                          <th className="p-2.5">Observation ID</th>
                          <th className="p-2.5">Batch</th>
                          <th className="p-2.5">Predicted</th>
                          <th className="p-2.5">Measured</th>
                          <th className="p-2.5">Error</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Protocol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {evaluationResult.comparisons.map(c => (
                          <tr key={c.observationId} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-white">{c.observationId}</td>
                            <td className="p-2.5 text-slate-400">{c.batchId}</td>
                            <td className="p-2.5 text-cyan-300">{c.predictedValue}</td>
                            <td className="p-2.5 text-emerald-300">{c.measuredValue} {c.rawUnit}</td>
                            <td className="p-2.5">{c.residual >= 0 ? `+${c.residual}` : c.residual}</td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                c.isWithinAcceptance ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              }`}>
                                {c.isWithinAcceptance ? 'WITHIN SPEC' : 'EXCEEDED'}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-400">{c.testMethod}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: QUARANTINE LOG */}
      {activeTab === 'quarantine' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              Quarantined / Rejected Laboratory Observations ({quarantinedRecords.length})
            </span>
            {quarantinedRecords.length > 0 && (
              <button
                onClick={async () => {
                  await EmpiricalLabPersistenceService.clearQuarantinedRecords();
                  await loadPersistenceData();
                }}
                className="text-xs text-rose-400 hover:text-white cursor-pointer"
              >
                Clear Quarantine Log
              </button>
            )}
          </div>

          {quarantinedRecords.length === 0 ? (
            <div className="bg-[#0b1020] border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
              Zero quarantined records. All imported laboratory observations have passed Data Origin Firewall and Quality Gate.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {quarantinedRecords.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 text-xs space-y-1 text-rose-200 font-mono"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <strong className="text-rose-400">Row #{q.rowNumber} [{q.observationId || 'UNNAMED'}]</strong>
                    <span className="text-slate-400 text-[10px]">{q.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-rose-300">
                    Reason: {q.quarantineReason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#0b1020] border border-cyan-500/50 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Import Laboratory Observations
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Data origin (honestly select):</label>
                  <select value={importDataOrigin} onChange={e => setImportDataOrigin(e.target.value as DataOrigin)} className="w-full bg-[#131d35] border border-slate-700 rounded-lg p-2 text-white text-xs">
                    <option value="UNKNOWN_ORIGIN">Unknown / not classified</option>
                    <option value="REAL_LAB_MEASUREMENT">Real laboratory measurement</option>
                    <option value="REAL_FIELD_MEASUREMENT">Real field measurement</option>
                    <option value="LITERATURE_VALUE">Literature value (reference only)</option>
                    <option value="REFERENCE_STANDARD">Reference standard (reference only)</option>
                    <option value="SOURCE_BACKED_VALUE">Open/source-backed value (reference only)</option>
                    <option value="SYNTHETIC_TEST_DATA">Synthetic test data (blocked)</option>
                    <option value="SIMULATED_DATA">Simulated data (blocked)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Lab / source organization:</label>
                  <input value={importLabName} onChange={e => setImportLabName(e.target.value)} className="w-full bg-[#131d35] border border-slate-700 rounded-lg p-2 text-white text-xs" placeholder="Asli source ka naam" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Operator / source author:</label>
                  <input value={importOperator} onChange={e => setImportOperator(e.target.value)} className="w-full bg-[#131d35] border border-slate-700 rounded-lg p-2 text-white text-xs" placeholder="Asli analyst ya author" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Dataset ID:</label>
                  <input
                    type="text"
                    value={importDatasetId}
                    onChange={e => setImportDatasetId(e.target.value)}
                    className="w-full bg-[#131d35] border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Format:</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImportFormat('CSV')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        importFormat === 'CSV'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                          : 'bg-[#131d35] text-slate-400 border-slate-700'
                      }`}
                    >
                      CSV Format
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportFormat('JSON')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        importFormat === 'JSON'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                          : 'bg-[#131d35] text-slate-400 border-slate-700'
                      }`}
                    >
                      JSON Format
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Payload Content:</span>
                <button
                  type="button"
                  onClick={importFormat === 'CSV' ? loadSampleCsvTemplate : loadSampleJsonTemplate}
                  className="text-cyan-400 hover:underline text-[11px] font-bold cursor-pointer"
                >
                  Load Sample Template
                </button>
              </div>

              <textarea
                value={rawImportText}
                onChange={e => setRawImportText(e.target.value)}
                rows={8}
                placeholder={importFormat === 'CSV' ? 'Paste CSV records...' : 'Paste JSON array...'}
                className="w-full bg-[#070b18] border border-slate-700 rounded-xl p-3 text-xs font-mono text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />

              {importResult && (
                <div className={`p-3 rounded-xl border text-xs font-mono ${
                  importResult.approvedCount > 0 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="font-bold">
                    Import Result: {importResult.approvedCount} approved, {importResult.rejectedCount} rejected / quarantined
                  </div>
                  {importResult.rejectedReasons.length > 0 && (
                    <div className="mt-1 space-y-0.5 text-[10px] text-rose-300">
                      {importResult.rejectedReasons.slice(0, 5).map((r, i) => (
                        <div key={i}>• {r}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleRunImport}
                disabled={isImporting || !rawImportText.trim()}
                className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isImporting ? 'Validating & Importing...' : 'Validate & Import Records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
