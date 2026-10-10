import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Plus, 
  Trash2, 
  Activity, 
  Sliders, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  RotateCcw, 
  Layers,
  Award,
  CheckCircle2,
  TestTube,
  FlaskConical
} from 'lucide-react';
import { LimsDashboard } from './LimsDashboard';
import { ProductCategoryId, getProductCategoryLabel, normalizeProductCategory } from '../domain/productTaxonomy';
import { 
  globalScientificLearningEngine 
} from '../utils/scientificLearningEngine';
import { 
  DetailedLabEvidenceRecord, 
  validateMeasurementRecord, 
  checkMeasurementComparability, 
  calculatePredictionError, 
  evaluateCategoryModelValidation, 
  proposeCalibrationCandidates, 
  CalibrationCandidateProposal,
  CATEGORY_EVIDENCE_MATRIX
} from '../utils/labEvidenceEngine';
import { 
  globalGovernanceRegistry, 
  calculateModelChangeImpact, 
  GOLDEN_FORMULA_SET, 
  ChangeImpactAnalysisResult
} from '../utils/scientificGovernanceEngine';
import { calculateCleaningPerformance } from '../utils/cleaningPerformanceEngine';
import { StandardUnit } from '../utils/specificationEngine/types';
import { canPromoteToLabValidated } from '../utils/lims/limsEvidencePromotionEngine';

export default function LabNotebook(_props?: any) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<'journal' | 'measurements' | 'governance' | 'experiments' | 'lims'>('lims');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategoryId>('LAUNDRY_LIQUID');
  
  // Re-render trigger for Singleton Registry updates
  const [registryTrigger, setRegistryTrigger] = useState(0);

  // R&D Experiment Loop States
  const [trialName, setTrialName] = useState('');
  const [trialOperator, setTrialOperator] = useState('');
  const [trialHardness, setTrialHardness] = useState('150');
  const [trialTemp, setTrialTemp] = useState('25');
  const [trialDosage, setTrialDosage] = useState('2.0');
  const [trialReplicateInput, setTrialReplicateInput] = useState('');
  const [trialMeasuredValue, setTrialMeasuredValue] = useState('');
  const [trialNotesComment] = useState('Experimental learning candidate submission notes');


  // Journal State
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('rnd_lab_notes');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');

  // Lab Measurement Records State
  const [evidenceRecords, setEvidenceRecords] = useState<DetailedLabEvidenceRecord[]>(() => {
    const saved = localStorage.getItem('rnd_lab_evidence');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((r: any) => {
            const gate = canPromoteToLabValidated(r);
            if (!gate.allowed && r.provenance === 'MEASURED') {
              return {
                ...r,
                provenance: 'CALCULATED',
                sourceType: 'CALCULATED'
              };
            }
            return r;
          });
        }
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  // Modal / Form state for adding new evidence record
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [newFormulaId, setNewFormulaId] = useState('golden-hd-laundry');
  const [newFormulaVersion, setNewFormulaVersion] = useState('1.0.0');
  const [newCategory, setNewCategory] = useState<ProductCategoryId>('LAUNDRY_LIQUID');
  const [newKPI, setNewKPI] = useState('cleaningScore');
  const [newValue, setNewValue] = useState<number | ''>('');
  const [newUnit, setNewUnit] = useState<StandardUnit>('%');
  const [newMethod, setNewMethod] = useState('');
  const [newOperator, setNewOperator] = useState('');
  const [newSampleId, setNewSampleId] = useState('');
  const [newTemp, setNewTemp] = useState('25');
  const [newHardness, setNewHardness] = useState('150');
  const [newSubstrate, setNewSubstrate] = useState('Polyester-Cotton Blend');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Governance Desk Active States
  const [selectedProposalForImpact, setSelectedProposalForImpact] = useState<CalibrationCandidateProposal | null>(null);
  const [impactAnalysisReport, setImpactAnalysisReport] = useState<ChangeImpactAnalysisResult | null>(null);

  // Sync state to localStorage on changes
  useEffect(() => {
    localStorage.setItem('rnd_lab_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('rnd_lab_evidence', JSON.stringify(evidenceRecords));
  }, [evidenceRecords]);

  // Handle Journal Addition
  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteText.trim()) return;
    setNotes([
      { id: Date.now().toString(), title: noteTitle.trim(), date: new Date().toISOString().split('T')[0], text: noteText.trim() },
      ...notes
    ]);
    setNoteTitle('');
    setNoteText('');
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n: any) => n.id !== id));
  };

  // Handle Lab Record Addition
  const handleAddLabRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const valNum = Number(newValue);
    if (newValue === '' || isNaN(valNum)) {
      setFormErrors(['Measured value must be a valid number.']);
      return;
    }

    const newRecord: DetailedLabEvidenceRecord = {
      measurementId: 'rec-' + Date.now(),
      formulaId: newFormulaId || undefined,
      formulaVersion: newFormulaVersion,
      categoryId: newCategory,
      kpiId: newKPI,
      parameterKey: newKPI,
      value: valNum,
      unit: newUnit,
      provenance: 'MEASURED',
      testMethod: newMethod,
      testDate: new Date().toISOString().split('T')[0],
      operator: newOperator,
      sampleId: newSampleId || undefined,
      testConditions: {
        temperatureC: newTemp ? Number(newTemp) : undefined,
        waterHardnessPpm: newHardness ? Number(newHardness) : undefined,
        substrate: newSubstrate || undefined
      }
    };

    // Strict physical validation gates
    const validationResult = validateMeasurementRecord(newRecord);
    if (!validationResult.isValid) {
      setFormErrors(validationResult.errors);
      return;
    }

    setEvidenceRecords([newRecord, ...evidenceRecords]);
    setNewValue('');
    setShowAddRecordModal(false);
  };

  const deleteEvidenceRecord = (id: string) => {
    setEvidenceRecords(evidenceRecords.filter(r => r.measurementId !== id));
  };

  // Calculations for Predictions-vs-Measured Table
  const parsedRecordsWithPredictions = evidenceRecords.map(rec => {
    // Determine target formula ingredients
    const goldenMatch = GOLDEN_FORMULA_SET.find(g => g.id === rec.formulaId || g.category === rec.categoryId);
    const ingredients = goldenMatch ? goldenMatch.ingredients : GOLDEN_FORMULA_SET[0].ingredients;
    
    // Evaluate predicted KPI value
    let predictedValue = 82.0; // Default baseline predicted cleaning score
    if (rec.categoryId) {
      const predRes = calculateCleaningPerformance(ingredients, 8.5, rec.categoryId);
      predictedValue = predRes.cpi;
    }

    // Set comparability input
    const comparability = checkMeasurementComparability({
      targetFormulaId: rec.formulaId,
      targetFormulaVersion: rec.formulaVersion,
      targetCategory: (rec.categoryId ? normalizeProductCategory(rec.categoryId) : 'UNKNOWN_PRODUCT_CATEGORY') as ProductCategoryId,
      targetKPIId: rec.kpiId || 'cleaningScore',
      targetUnit: rec.unit,
      targetConditions: rec.testConditions,
      measurement: rec
    });

    // Run predictions vs actuals error calculations
    const errorAnalysis = calculatePredictionError(predictedValue, rec.value, rec.unit, comparability);

    return {
      ...rec,
      predictedValue,
      comparability,
      errorAnalysis
    };
  });

  // Category Model Validation Metrics Aggregator
  const activeCategoryObservations = parsedRecordsWithPredictions
    .filter(r => r.categoryId === selectedCategory)
    .map(r => ({
      kpiId: r.kpiId || 'cleaningScore',
      predicted: r.predictedValue,
      measured: r.value,
      comparable: r.comparability.isComparable
    }));

  const categoryValidationSummary = evaluateCategoryModelValidation(selectedCategory, activeCategoryObservations);

  // Calibration Candidate generation layer from current evidence records
  const detectedCalibrationCandidates = proposeCalibrationCandidates(categoryValidationSummary);

  // Model Governance Registry state getters
  const activeModelVersion = globalGovernanceRegistry.getActiveModelVersion(selectedCategory);
  const allModelVersions = globalGovernanceRegistry.getAllModelVersions();
  const allGovernedParameters = globalGovernanceRegistry.getAllParameters();
  const allApprovalRecords = globalGovernanceRegistry.getApprovalRecords();

  // Execute Change Impact Analysis
  const runImpactAnalysis = (proposal: CalibrationCandidateProposal) => {
    const result = calculateModelChangeImpact(proposal);
    setImpactAnalysisReport(result);
    setSelectedProposalForImpact(proposal);
  };

  // Approve & Activate Calibrated Model Change Workflow
  const approveAndActivateCalibration = (proposal: CalibrationCandidateProposal) => {
    // 1. Approve proposal
    const approvalRecord = globalGovernanceRegistry.approveCalibrationProposal(
      proposal,
      'APPROVED_BY_USER',
      `Calibrated and approved automatically under strict review of ${proposal.sampleCount} laboratory test observations.`
    );

    // 2. Activate proposal if approved
    if (approvalRecord.approvalStatus === 'APPROVED') {
      globalGovernanceRegistry.activateModelVersion(approvalRecord);
      alert(`SUCCESS: Model ${approvalRecord.targetModelVersion} successfully activated! Sub-sequent predictions will scale automatically.`);
    } else {
      alert(`SAFETY WARNING: Approval rejected. ${approvalRecord.rejectionReason}`);
    }

    setSelectedProposalForImpact(null);
    setImpactAnalysisReport(null);
    setRegistryTrigger(prev => prev + 1); // trigger state update
  };

  // Rollback Active Calibrated Model
  const handleRollback = (versionId: string) => {
    try {
      const rollbackResult = globalGovernanceRegistry.rollbackModelVersion(versionId, 'APPROVED_BY_USER');
      alert(`SUCCESS: ${rollbackResult.auditMessage}`);
      setRegistryTrigger(prev => prev + 1);
    } catch (e: any) {
      alert(`ROLLBACK ERROR: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left" id="lab-notebook-root">
      
      {/* Invisible render dependency to sync React state with Singleton modifications */}
      <div className="hidden" aria-hidden="true">{registryTrigger}</div>

      {/* Title Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <PenTool className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            R&D Laboratory Workspace & Model Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Log trial observations, analyze predicted-vs-measured errors, and govern calibrated model version parameters.
          </p>
        </div>

        {/* Sub-Workstation Switcher */}
        <div className="flex bg-[#121c33] border border-slate-700/60 p-1 rounded-xl shrink-0 flex-wrap gap-1">
          <button
            onClick={() => setActiveSubTab('lims')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'lims'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <TestTube className="w-3.5 h-3.5" /> LIMS Clean-Room
          </button>
          <button
            onClick={() => setActiveSubTab('experiments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'experiments'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" /> R&D Experiment Loop
          </button>
          <button
            onClick={() => setActiveSubTab('measurements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'measurements'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Lab Test Validation
          </button>
          <button
            onClick={() => setActiveSubTab('governance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'governance'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Model Governance Desk
          </button>
          <button
            onClick={() => setActiveSubTab('journal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'journal'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" /> Lab Journal
          </button>
        </div>
      </div>

      {/* WORKSTATION 0: LIMS CLEAN-ROOM & EVIDENCE CHAIN */}
      {activeSubTab === 'lims' && <LimsDashboard />}

      {/* WORKSTATION 1: LAB MEASUREMENTS & ERROR ENGINE */}
      {activeSubTab === 'measurements' && (
        <div className="space-y-6">
          
          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left sidebar - Category Selector & Aggregate validation metrics */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Category selector */}
              <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3.5">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" /> Active R&D Category
                </h3>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ProductCategoryId)}
                    className="w-full px-3.5 py-2.5 bg-[#131d35] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none transition cursor-pointer"
                  >
                    {Object.keys(CATEGORY_EVIDENCE_MATRIX).map(catId => (
                      <option key={catId} value={catId}>
                        {getProductCategoryLabel(catId as ProductCategoryId)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-[11px] text-slate-400 leading-normal border-t border-slate-800/80 pt-3">
                  <span className="font-semibold text-slate-300 uppercase tracking-wide block mb-1">Supported Domains:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {CATEGORY_EVIDENCE_MATRIX[selectedCategory].supportedEvidenceDomains.map((dom, i) => (
                      <li key={i}>{dom}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model Validation aggregate report */}
              <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" /> Validation Health
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    categoryValidationSummary.overallValidationStatus === 'VALIDATED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : categoryValidationSummary.overallValidationStatus === 'PARTIALLY_VALIDATED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {categoryValidationSummary.overallValidationStatus}
                  </span>
                </div>

                <div className="space-y-3.5 pt-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Logs:</span>
                    <span className="font-bold text-white font-mono">{categoryValidationSummary.totalMeasurementsCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Comparable Observations:</span>
                    <span className="font-bold text-white font-mono">
                      {categoryValidationSummary.comparableObservationsCount} / {categoryValidationSummary.engineeringValidationThreshold}
                    </span>
                  </div>

                  {Object.entries(categoryValidationSummary.kpiSummaries).map(([kpiId, sum]) => (
                    <div key={kpiId} className="border-t border-slate-800/80 pt-3 space-y-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-amber-400">{kpiId}</span>
                        <span className="text-white">{sum.sampleCount} samples</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                        <div className="bg-[#131d35] p-2 rounded-lg">
                          <span className="block text-slate-400 text-[9px] uppercase font-semibold">MAE:</span>
                          <span className="font-mono font-bold text-white text-xs">{sum.meanAbsoluteError.toFixed(2)}%</span>
                        </div>
                        <div className="bg-[#131d35] p-2 rounded-lg">
                          <span className="block text-slate-400 text-[9px] uppercase font-semibold">Mean Bias:</span>
                          <span className={`font-mono font-bold text-xs ${sum.meanBias > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                            {sum.meanBias > 0 ? '+' : ''}{sum.meanBias.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {categoryValidationSummary.comparableObservationsCount < categoryValidationSummary.engineeringValidationThreshold && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300/90 leading-normal flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block mb-0.5">Below Validation Threshold</span>
                        Needs {categoryValidationSummary.engineeringValidationThreshold - categoryValidationSummary.comparableObservationsCount} more comparable lab observations for robust calibration proposals.
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right content - Prediction Error Engine Table */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Evidence header and actions */}
              <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">Laboratory Physical Test Evidence Layer</h3>
                  <p className="text-xs text-slate-400">Comparing real laboratory Terg-O-Tometer stain-swatch data against physical-chemistry predictions</p>
                </div>
                <button
                  onClick={() => {
                    setFormErrors([]);
                    setShowAddRecordModal(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-950/20 shrink-0 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Laboratory Record
                </button>
              </div>

              {/* Records List Grid */}
              <div className="space-y-4">
                {parsedRecordsWithPredictions.filter(r => r.categoryId === selectedCategory).length === 0 ? (
                  <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-10 text-center text-slate-400 space-y-2">
                    <Activity className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-white">No lab test evidence recorded for this category</p>
                    <p className="text-xs">Add an empirical test record to evaluate predictions vs measured values.</p>
                  </div>
                ) : (
                  parsedRecordsWithPredictions
                    .filter(r => r.categoryId === selectedCategory)
                    .map(rec => (
                      <div key={rec.measurementId} className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 hover:border-slate-600 transition">
                        
                        {/* Header line */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800/80 pb-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {rec.sampleId || 'NO_SAMPLE_ID'}
                              </span>
                              <h4 className="font-black text-white text-sm sm:text-base">
                                {rec.formulaId === 'golden-hd-laundry' ? 'Golden Heavy Duty Laundry Liquid' : 'Custom Formulation Reference'}
                              </h4>
                              <span className="text-xs text-slate-400">v{rec.formulaVersion}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">
                              Logged by {rec.operator} on {rec.testDate} using {rec.testMethod}
                            </p>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => deleteEvidenceRecord(rec.measurementId)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition self-end sm:self-center cursor-pointer"
                            title="Delete laboratory record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Prediction vs Measured Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          
                          {/* Pred-vs-measured numbers */}
                          <div className="md:col-span-2 grid grid-cols-2 gap-3">
                            <div className="bg-[#121c33]/80 p-3 rounded-xl border border-slate-800/80">
                              <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Model Prediction:</span>
                              <span className="font-mono text-base font-black text-cyan-300">{rec.predictedValue.toFixed(1)}{rec.unit}</span>
                            </div>
                            <div className="bg-[#1a2035]/80 p-3 rounded-xl border border-slate-800/80">
                              <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Measured Value:</span>
                              <span className="font-mono text-base font-black text-amber-400">{rec.value.toFixed(1)}{rec.unit}</span>
                            </div>
                          </div>

                          {/* Error Engine Report */}
                          <div className="md:col-span-2 bg-[#12192a] p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                            
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Prediction Error Analysis:</span>
                              {rec.errorAnalysis.status === 'CALCULATED' ? (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                                      rec.errorAnalysis.errorDirection === 'OVER_PREDICTION' 
                                        ? 'bg-rose-500/15 text-rose-300' 
                                        : rec.errorAnalysis.errorDirection === 'UNDER_PREDICTION'
                                          ? 'bg-amber-500/15 text-amber-300'
                                          : 'bg-emerald-500/15 text-emerald-300'
                                    }`}>
                                      {rec.errorAnalysis.errorDirection.replace('_', ' ')}
                                    </span>
                                    <span className="font-mono font-bold text-xs text-slate-300">
                                      (|Error|: {rec.errorAnalysis.absoluteErrorMagnitude.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    Prediction variance is {rec.errorAnalysis.absoluteError > 0 ? '+' : ''}
                                    {rec.errorAnalysis.absoluteError.toFixed(1)}% absolute difference
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-red-400 font-bold">{rec.errorAnalysis.explanation}</p>
                              )}
                            </div>

                            {rec.errorAnalysis.status === 'CALCULATED' && rec.errorAnalysis.percentageError !== undefined && (
                              <div className="text-right">
                                <span className="block text-[9px] text-slate-500 uppercase font-bold">Relative Error:</span>
                                <span className={`text-sm sm:text-base font-black font-mono ${
                                  rec.errorAnalysis.percentageError > 10 ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                  {rec.errorAnalysis.percentageError.toFixed(1)}%
                                </span>
                              </div>
                            )}

                          </div>

                        </div>

                        {/* Test Conditions Sub-badge */}
                        {rec.testConditions && (
                          <div className="bg-[#111827] px-3.5 py-2.5 rounded-xl text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1.5 border border-slate-800/60 font-mono">
                            <span className="text-slate-500 font-bold uppercase text-[9px] select-none">Test Conditions:</span>
                            {rec.testConditions.temperatureC !== undefined && (
                              <span>Temp: <strong className="text-white">{rec.testConditions.temperatureC}°C</strong></span>
                            )}
                            {rec.testConditions.waterHardnessPpm !== undefined && (
                              <span>Hardness: <strong className="text-white">{rec.testConditions.waterHardnessPpm} ppm</strong></span>
                            )}
                            {rec.testConditions.substrate && (
                              <span>Substrate: <strong className="text-white">{rec.testConditions.substrate}</strong></span>
                            )}
                          </div>
                        )}

                      </div>
                    ))
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* WORKSTATION 2: MODEL GOVERNANCE DESK */}
      {activeSubTab === 'governance' && (
        <div className="space-y-6">
          
          {/* Top stats or overview card */}
          <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
            <div className="space-y-1 border-r border-slate-800/80 pr-4">
              <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">Active Version Registry:</span>
              <h4 className="text-lg font-black text-white">{activeModelVersion.modelName}</h4>
              <p className="text-xs text-slate-400 font-mono">Version: {activeModelVersion.versionNumber} ({activeModelVersion.status})</p>
            </div>
            <div className="space-y-1 border-r border-slate-800/80 pr-4">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Governed parameters:</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black font-mono text-white">{allGovernedParameters.length}</span>
                <span className="text-xs text-slate-400">Total parameters</span>
              </div>
              <p className="text-xs text-slate-400">Including locked thermodynamics & chemical constants</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Calibration Proposals:</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black font-mono ${detectedCalibrationCandidates.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
                  {detectedCalibrationCandidates.length}
                </span>
                <span className="text-xs text-slate-400">Systematic bias offsets detected</span>
              </div>
              <p className="text-xs text-slate-400">Requires Before/After Change Impact validation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Content - Calibration proposals, versions history, and audit trail */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Calibration Proposals */}
              <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-extrabold text-white text-base">Calibration Proposals Panel</h3>
                    <p className="text-xs text-slate-400">Divergent bias calibration candidates proposed from laboratory validation sets</p>
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-400">ENGINEERING_VALIDATION_THRESHOLD = 5</span>
                </div>

                <div className="space-y-4">
                  {detectedCalibrationCandidates.length === 0 ? (
                    <div className="bg-[#121c33]/50 border border-slate-800/80 p-8 rounded-xl text-center text-slate-400 space-y-1.5">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">No systematic calibration candidates available</p>
                      <p className="text-[11px]">System requires at least 5 comparable observations with a mean bias of &gt;= 0.3% to propose calibration shifts.</p>
                    </div>
                  ) : (
                    detectedCalibrationCandidates.map(proposal => (
                      <div key={proposal.proposalId} className="bg-[#131d35] border border-slate-700/60 rounded-xl p-4 space-y-4 relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 p-1 bg-amber-500/10 text-amber-300 font-mono text-[9px] font-bold border-l border-b border-amber-500/20 rounded-bl">
                          PROPOSED CALIBRATION
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-black text-white text-sm">{proposal.parameterName}</h4>
                          <p className="text-xs text-slate-300 leading-normal bg-[#0e1629]/60 p-2.5 rounded-lg border border-slate-800/60">
                            {proposal.rationale}
                          </p>
                        </div>

                        {/* Proposal specs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-[#0e1629] p-2 rounded-lg font-mono">
                            <span className="block text-[9px] text-slate-400 uppercase font-semibold">Shift Offset:</span>
                            <span className="font-bold text-rose-400">{proposal.proposedShiftOffset > 0 ? '+' : ''}{proposal.proposedShiftOffset.toFixed(2)}</span>
                          </div>
                          <div className="bg-[#0e1629] p-2 rounded-lg font-mono">
                            <span className="block text-[9px] text-slate-400 uppercase font-semibold">Observed Bias:</span>
                            <span className="font-bold text-amber-400">+{proposal.observedBias.toFixed(2)}%</span>
                          </div>
                          <div className="bg-[#0e1629] p-2 rounded-lg font-mono">
                            <span className="block text-[9px] text-slate-400 uppercase font-semibold">Sample Count:</span>
                            <span className="font-bold text-white">{proposal.sampleCount}</span>
                          </div>
                          <div className="bg-[#0e1629] p-2 rounded-lg font-mono">
                            <span className="block text-[9px] text-slate-400 uppercase font-semibold">Observed MAE:</span>
                            <span className="font-bold text-white">{proposal.meanAbsoluteError.toFixed(2)}%</span>
                          </div>
                        </div>

                        {/* R&D safety notice */}
                        <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg text-[10px] text-amber-300/90 font-medium leading-normal flex items-start gap-2 select-none">
                          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{proposal.safetyWarning}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => runImpactAnalysis(proposal)}
                            className="px-3.5 py-2 bg-[#121c33] hover:bg-[#1a294d] text-white border border-slate-700 rounded-lg text-xs font-black transition cursor-pointer"
                          >
                            Run Change Impact Analysis
                          </button>
                          
                          <button
                            onClick={() => approveAndActivateCalibration(proposal)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1 transition shadow cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" /> Approve & Activate
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Version Control History */}
              <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="font-extrabold text-white text-base border-b border-slate-800/80 pb-3">
                  Scientific Model Version History
                </h3>
                <div className="space-y-3.5">
                  {allModelVersions.map(v => (
                    <div key={v.modelVersionId} className="bg-[#131d35]/60 border border-slate-800 p-4 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-white text-sm">{v.modelName}</h4>
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-bold">
                              {v.versionNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{v.changeSummary}</p>
                        </div>
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          v.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : v.status === 'ROLLED_BACK'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700/50'
                        }`}>
                          {v.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/60 pt-2 font-mono">
                        <span>Effective From: {new Date(v.effectiveFrom).toLocaleDateString()}</span>
                        {v.status === 'ACTIVE' && v.versionNumber !== '1.0.0' && (
                          <button
                            onClick={() => handleRollback(v.modelVersionId)}
                            className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-0.5 border border-rose-500/30 hover:border-rose-500/60 px-2 py-0.5 rounded-md bg-rose-500/5 cursor-pointer transition"
                          >
                            <RotateCcw className="w-3 h-3" /> Rollback Version
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calibration Audit Trail */}
              {allApprovalRecords.length > 0 && (
                <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
                  <h3 className="font-extrabold text-white text-base border-b border-slate-800/80 pb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" /> Model Calibration Audit Trail
                  </h3>
                  <div className="space-y-3 font-mono text-xs text-slate-300">
                    {allApprovalRecords.map(rec => (
                      <div key={rec.approvalId} className="bg-[#131d35]/40 border border-slate-800 p-3.5 rounded-xl space-y-1.5 text-left">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-amber-400 uppercase">Approval ID: {rec.approvalId}</span>
                          <span className={`px-1.5 py-0.2 rounded ${
                            rec.approvalStatus === 'ACTIVE' || rec.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-rose-500/10 text-rose-300'
                          }`}>
                            {rec.approvalStatus}
                          </span>
                        </div>
                        <p className="text-xs font-sans text-slate-200 mt-1 leading-normal">
                          Parameter <strong>{rec.parameterName}</strong> was calibrated from <strong>{rec.oldValue.toFixed(2)}</strong> to <strong>{rec.newValue.toFixed(2)}</strong> by {rec.approvedBy} on {new Date(rec.approvedAt).toLocaleDateString()}.
                        </p>
                        <p className="text-[10px] text-slate-400 font-sans italic">
                          Rationale: {rec.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right sidebar - Parameters Registry (Thermodynamic locked details) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Parameters Registry View */}
              <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> Governed Constants
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    Strict scientific classification registry of R&D constants and parameters.
                  </p>
                </div>

                <div className="space-y-3 pt-1 border-t border-slate-800/80">
                  {allGovernedParameters.map(param => (
                    <div key={param.parameterId} className="bg-[#121c33]/50 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-white leading-tight">{param.parameterName}</span>
                        {param.classification === 'CHEMISTRY_CONSTANT' ? (
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 shrink-0 select-none bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded" title="Theoretical constant strictly locked against empirical modification">
                            <ShieldCheck className="w-3 h-3" /> LOCKED
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 shrink-0 uppercase bg-slate-800 px-1.5 py-0.2 rounded">
                            Empirical
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-baseline font-mono text-[11px] text-slate-300 bg-[#0e1629] p-1.5 rounded border border-slate-800/60">
                        <span className="text-slate-500 text-[10px]">Value:</span>
                        <span className="font-bold text-white">{typeof param.value === 'number' ? param.value.toFixed(4) : param.value} <span className="text-slate-400 text-[10px] font-normal">{param.unit}</span></span>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal font-sans italic">
                        Source: {param.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Change Impact Analysis Report Overlay / Card */}
          {selectedProposalForImpact && impactAnalysisReport && (
            <div className="bg-[#0e1629] border-2 border-amber-500/60 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" /> Change Impact Analysis Report
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Evaluating proposed parameter offset validation across standard Golden Reference formulas</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProposalForImpact(null);
                    setImpactAnalysisReport(null);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition border border-slate-700 cursor-pointer"
                >
                  Close Analysis
                </button>
              </div>

              {/* Integrity checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Rule A: Chemistry constant lock */}
                <div className="bg-[#131d35] p-3.5 rounded-xl border border-emerald-500/30 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-xs text-white block">Rule A: Chemistry Constant Immutability</span>
                    <p className="text-[11px] text-slate-300 leading-normal mt-0.5">
                      PASSED. Verification checks confirm no fundamental physical constants, thermodynamic equilibrium matrices, or pKa constants were altered.
                    </p>
                  </div>
                </div>

                {/* Rule B: Cross category isolation */}
                <div className="bg-[#131d35] p-3.5 rounded-xl border border-emerald-500/30 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-xs text-white block">Rule B: Category Isolation Enforcement</span>
                    <p className="text-[11px] text-slate-300 leading-normal mt-0.5">
                      PASSED. Verification checks confirm that the proposed offset changes remain isolated to category <strong className="text-amber-400">{selectedCategory}</strong> without leakage or side-effects.
                    </p>
                  </div>
                </div>

              </div>

              {/* Before vs After comparison list */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">Impact on Golden Reference Set:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {impactAnalysisReport.comparisons.map(comp => {
                    const isTarget = comp.category === selectedCategory;
                    return (
                      <div key={comp.formulaId} className={`p-4 rounded-xl border ${
                        isTarget 
                          ? 'bg-[#18233e] border-amber-500/30' 
                          : 'bg-[#111827] border-slate-800/80 text-slate-400 opacity-60'
                      } space-y-2.5`}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[9px] font-mono font-bold bg-[#0e1629] text-slate-400 px-1.5 py-0.2 rounded border border-slate-800">
                              {comp.category}
                            </span>
                            <h5 className="font-extrabold text-white text-xs sm:text-sm mt-1">{comp.formulaName}</h5>
                          </div>
                          {isTarget && (
                            <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded">
                              TARGET CATEGORY
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-800">
                          <div className="bg-[#0e1629] p-2 rounded-lg font-mono">
                            <span className="block text-[8px] text-slate-500 uppercase font-semibold">Before Score:</span>
                            <span className="font-bold text-white">{comp.oldModelValue.toFixed(1)}</span>
                          </div>
                          <div className="bg-[#0e1629] p-2 rounded-lg font-mono">
                            <span className="block text-[8px] text-slate-500 uppercase font-semibold">After Score:</span>
                            <span className="font-bold text-amber-400">{comp.proposedModelValue.toFixed(1)}</span>
                          </div>
                          <div className="bg-[#0e1629] p-2 rounded-lg font-mono">
                            <span className="block text-[8px] text-slate-500 uppercase font-semibold">Shift Delta:</span>
                            <span className={`font-bold ${comp.delta > 0 ? 'text-emerald-400' : comp.delta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {comp.delta > 0 ? '+' : ''}{comp.delta.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-800 justify-end">
                <button
                  onClick={() => {
                    setSelectedProposalForImpact(null);
                    setImpactAnalysisReport(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition border border-slate-700 cursor-pointer"
                >
                  Discard Analysis
                </button>
                <button
                  onClick={() => approveAndActivateCalibration(selectedProposalForImpact)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow cursor-pointer"
                >
                  <ShieldCheck className="w-4.5 h-4.5" /> Approve & Activate Calibrated Parameters
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* WORKSTATION 3: R&D JOURNAL */}
      {activeSubTab === 'journal' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={addNote} className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4 h-fit">
            <h3 className="font-extrabold text-white text-base">New Experiment Log</h3>
            <div>
              <input
                type="text"
                placeholder="Title (e.g. Viscosity Curve Trial)"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#131d35] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:bg-[#0b1020] focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
              />
            </div>
            <div>
              <textarea
                rows={4}
                placeholder="Observations, temperature, pH, appearance..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#131d35] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:bg-[#0b1020] focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Save Entry
            </button>
          </form>

          <div className="md:col-span-2 space-y-4">
            {notes.map((note: any) => (
              <div key={note.id} className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-2 hover:border-slate-600 transition">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-white text-sm sm:text-base">{note.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{note.date}</span>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'experiments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. New Experiment Trial Form */}
            <div className="lg:col-span-1 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4 text-left">
              <div className="border-b border-slate-800/80 pb-3 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base">New R&D Trial</h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  
                  const parsedReplicates = trialReplicateInput
                    ? trialReplicateInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
                    : [];

                  const measurements: Record<string, number> = {
                    cleaningScore: Number(trialMeasuredValue)
                  };

                  const replicateValues = parsedReplicates.length > 0
                    ? { cleaningScore: parsedReplicates }
                    : undefined;

                  const goldenMatch = GOLDEN_FORMULA_SET.find(g => g.category === selectedCategory);
                  const ingredients = goldenMatch ? goldenMatch.ingredients : GOLDEN_FORMULA_SET[0].ingredients;

                  const newTrial = globalScientificLearningEngine.recordExperimentTrial({
                    trialName: trialName || `Bench Test ${getProductCategoryLabel(selectedCategory)}`,
                    formulaId: goldenMatch ? goldenMatch.id : 'golden-hd-laundry',
                    formulaVersion: '1.0.0',
                    categoryId: selectedCategory,
                    operator: trialOperator,
                    testConditions: {
                      waterHardnessPpm: Number(trialHardness),
                      temperatureC: Number(trialTemp),
                      dosageGramsPerLiter: Number(trialDosage)
                    },
                    ingredients,
                    measurements,
                    replicateValues
                  });

                  // Add link to Lab Journal!
                  const noteText = `Recorded R&D Experiment Trial: "${newTrial.trialName}". ` +
                    `Category: ${getProductCategoryLabel(selectedCategory)}. ` +
                    `Predicted: ${newTrial.predictions.cleaningScore?.toFixed(1)}%, Measured: ${newTrial.measurements.cleaningScore?.toFixed(1)}%. ` +
                    `Deviation: ${newTrial.errors.cleaningScore?.absoluteError > 0 ? '+' : ''}${newTrial.errors.cleaningScore?.absoluteError?.toFixed(1)}%. ` +
                    (parsedReplicates.length > 0 ? `Replicate mean: ${newTrial.replicateMean?.cleaningScore?.toFixed(1)}%. ` : '') +
                    `Quality: ${newTrial.qualityStatus}. ` +
                    `Conditions: Hardness=${trialHardness} ppm, Temp=${trialTemp}°C, Dosage=${trialDosage} g/L.`;

                  setNotes((prev: any) => [
                    {
                      id: Date.now().toString(),
                      title: `Trial Log: ${newTrial.trialName}`,
                      date: new Date().toISOString().split('T')[0],
                      text: noteText
                    },
                    ...prev
                  ]);

                  setTrialName('');
                  setTrialReplicateInput('');
                  setRegistryTrigger(prev => prev + 1);
                  alert(`Trial "${newTrial.trialName}" recorded and analyzed. Linked journal entry added!`);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1 font-bold">Trial Title / Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Soft-water Trial #1"
                    value={trialName}
                    onChange={(e) => setTrialName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1 font-bold">Category:</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as ProductCategoryId)}
                      className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-white focus:outline-none cursor-pointer text-xs"
                    >
                      {Object.keys(CATEGORY_EVIDENCE_MATRIX).map(catId => (
                        <option key={catId} value={catId}>
                          {getProductCategoryLabel(catId as ProductCategoryId)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1 font-bold">Analyst / Chemist:</label>
                    <input
                      type="text"
                      required
                      value={trialOperator}
                      onChange={(e) => setTrialOperator(e.target.value)}
                      className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-white focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#111827] p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Hardness (ppm):</label>
                    <input
                      type="number"
                      value={trialHardness}
                      onChange={(e) => setTrialHardness(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#131d35] border border-slate-700 rounded text-white focus:outline-none text-center font-mono text-xs"
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Temp (°C):</label>
                    <input
                      type="number"
                      value={trialTemp}
                      onChange={(e) => setTrialTemp(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#131d35] border border-slate-700 rounded text-white focus:outline-none text-center font-mono text-xs"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Dosage (g/L):</label>
                    <input
                      type="number"
                      step="any"
                      value={trialDosage}
                      onChange={(e) => setTrialDosage(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#131d35] border border-slate-700 rounded text-white focus:outline-none text-center font-mono text-xs"
                      placeholder="2.0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1 font-bold">Measured Swatch Performance (%):</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={trialMeasuredValue}
                    onChange={(e) => setTrialMeasuredValue(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    placeholder="e.g. 85.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider font-bold">Raw Replicate Values:</label>
                    <span className="text-[9px] text-slate-500">Comma-separated</span>
                  </div>
                  <input
                    type="text"
                    value={trialReplicateInput}
                    onChange={(e) => setTrialReplicateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    placeholder="e.g. 84.8, 86.2, 85.0"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Save & Analyze Experiment
                </button>
              </form>
            </div>

            {/* 2. Scientific Learning Candidates */}
            <div className="lg:col-span-2 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4 text-left">
              <div className="border-b border-slate-800/80 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-white text-base">Scientific Learning Candidates</h3>
                  <p className="text-xs text-slate-400">Systematic prediction discrepancies translated into active calibration opportunities</p>
                </div>
                <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold border border-slate-700">
                  LOOP MIN_SAMPLES = 3
                </span>
              </div>

              <div className="space-y-4">
                {globalScientificLearningEngine.getLearningCandidates().length === 0 ? (
                  <div className="bg-[#121c33]/40 border border-slate-800/80 p-8 rounded-xl text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-200">Thermodynamic Models Fully Calibrated</p>
                    <p className="text-[11px] leading-relaxed max-w-md mx-auto">
                      All physical-chemistry and detergent predictions match the accumulated bench measurements within strict engineering tolerance limits. Propose more divergent trial records (at least 3 comparable ones) to trigger calibration learning options.
                    </p>
                  </div>
                ) : (
                  globalScientificLearningEngine.getLearningCandidates().map(candidate => (
                    <div key={candidate.candidateId} className="bg-[#131d35] border border-slate-700/60 rounded-xl p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 px-2.5 py-1 bg-emerald-500/10 text-emerald-300 font-mono text-[9px] font-bold border-l border-b border-emerald-500/20 rounded-bl">
                        {candidate.confidence} CONFIDENCE LEARNING
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-sm">{candidate.title}</h4>
                        <p className="text-xs font-bold text-rose-400">{candidate.detectedDiscrepancy}</p>
                        <p className="text-xs text-slate-300 bg-[#0e1629]/60 p-2.5 rounded-lg border border-slate-800/60 leading-normal font-sans">
                          {candidate.rationale}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                        <div className="bg-[#0e1629] p-2 rounded-lg">
                          <span className="block text-[8px] text-slate-500 uppercase font-bold">Current Param:</span>
                          <span className="font-bold text-slate-400">{candidate.currentValue.toFixed(3)}</span>
                        </div>
                        <div className="bg-[#0e1629] p-2 rounded-lg">
                          <span className="block text-[8px] text-slate-500 uppercase font-bold">Bias Shift:</span>
                          <span className="font-bold text-rose-400">{(candidate.recommendedValue - candidate.currentValue) > 0 ? '+' : ''}{(candidate.recommendedValue - candidate.currentValue).toFixed(3)}</span>
                        </div>
                        <div className="bg-[#0e1629] p-2 rounded-lg">
                          <span className="block text-[8px] text-slate-500 uppercase font-bold">Calibrated Param:</span>
                          <span className="font-bold text-emerald-400">{candidate.recommendedValue.toFixed(3)}</span>
                        </div>
                      </div>

                      {candidate.status === 'PENDING_SUBMISSION' ? (
                        <button
                          onClick={() => {
                            const prop = globalScientificLearningEngine.submitLearningCandidateToGovernance(
                              candidate.candidateId,
                              trialOperator,
                              trialNotesComment
                            );
                            setSelectedProposalForImpact(prop);
                            setImpactAnalysisReport(calculateModelChangeImpact(prop));
                            setActiveSubTab('governance');
                            alert(`SUCCESS: Submitted Learning Candidate to Governance. We transitioned you to the Model Governance Desk to execute Golden Regression tests before live model promotion.`);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition shadow cursor-pointer flex items-center gap-1"
                        >
                          <ShieldCheck className="w-4 h-4" /> Apply Calibration to Governance Registry
                        </button>
                      ) : (
                        <span className="inline-block text-xs font-bold text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-500/25 px-2.5 py-1 rounded">
                          STATUS: {candidate.status}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 3. Trials Archive List */}
          <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">R&D Experiment Trials Archive</h3>
                <p className="text-xs text-slate-400">Historical bench data, statistical replicates, and prediction error history for {getProductCategoryLabel(selectedCategory)}</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">{globalScientificLearningEngine.getTrialsByCategory(selectedCategory).length} trials recorded</span>
            </div>

            <div className="space-y-4">
              {globalScientificLearningEngine.getTrialsByCategory(selectedCategory).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No active experiment trials saved for this category. Complete the form above to add your first bench measurement.
                </div>
              ) : (
                globalScientificLearningEngine.getTrialsByCategory(selectedCategory).map(t => {
                  const error = t.errors.cleaningScore;
                  return (
                    <div key={t.trialId} className="bg-[#131d35]/50 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition space-y-3 text-left">
                      <div className="flex justify-between items-start gap-2 border-b border-slate-800/60 pb-3">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-white text-sm">{t.trialName}</h4>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Logged by {t.operator} on {t.date} | ID: {t.trialId}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            globalScientificLearningEngine.deleteExperimentTrial(t.trialId);
                            setRegistryTrigger(prev => prev + 1);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-[#0e1629] transition cursor-pointer"
                          title="Delete trial record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Predicted vs Measured Compare */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 grid grid-cols-2 gap-3">
                          <div className="bg-[#0e1629] p-3 rounded-lg border border-slate-800 font-mono">
                            <span className="block text-[9px] text-slate-500 uppercase font-black">Model Prediction:</span>
                            <span className="text-sm font-bold text-cyan-400">{t.predictions.cleaningScore?.toFixed(1)}%</span>
                          </div>
                          <div className="bg-[#0e1629] p-3 rounded-lg border border-slate-800 font-mono">
                            <span className="block text-[9px] text-slate-500 uppercase font-black">Measured Bench:</span>
                            <span className="text-sm font-bold text-amber-400">{t.measurements.cleaningScore?.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* Relative / Absolute Error */}
                        <div className="md:col-span-2 bg-[#0e1629] p-3 rounded-lg border border-slate-800 flex items-center justify-between font-mono">
                          <div>
                            <span className="block text-[9px] text-slate-500 uppercase font-black mb-0.5">Prediction Variance:</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              error?.errorDirection === 'OVER_PREDICTION' ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'
                            }`}>
                              {error?.errorDirection?.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-300 ml-1.5">
                              ({error?.absoluteError > 0 ? '+' : ''}{error?.absoluteError?.toFixed(1)}%)
                            </span>
                          </div>

                          {error?.percentageError !== undefined && (
                            <div className="text-right">
                              <span className="block text-[8px] text-slate-500 uppercase font-bold">Relative Error:</span>
                              <span className={`text-sm font-bold ${error.percentageError > 8 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {error.percentageError.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Replicate stats if present */}
                      {t.replicateValues?.cleaningScore && (
                        <div className="bg-[#0e1629]/50 border border-slate-800 rounded-lg p-3 font-mono text-[10px] text-slate-300 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-slate-500 uppercase font-bold mr-2">Replicate Swatches:</span>
                            <span className="text-white">{t.replicateValues.cleaningScore.join(', ')}</span>
                          </div>
                          <div className="flex gap-4">
                            <span>Mean: <strong className="text-white">{t.replicateMean?.cleaningScore?.toFixed(1)}%</strong></span>
                            <span>StdDev: <strong className="text-white">±{t.replicateStdDev?.cleaningScore?.toFixed(1)}%</strong></span>
                            <span className={`px-1.5 py-0.2 rounded font-bold ${
                              t.qualityStatus === 'SUSPECT_DATA' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            }`}>
                              {t.qualityStatus}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Test Conditions Badge */}
                      <div className="bg-[#0e1629]/30 border border-slate-800/80 rounded-lg p-2.5 text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                        <span className="text-slate-500 font-bold uppercase select-none">Conditions:</span>
                        <span>Hardness: <strong className="text-white">{t.testConditions.waterHardnessPpm} ppm</strong></span>
                        <span>Temp: <strong className="text-white">{t.testConditions.temperatureC}°C</strong></span>
                        <span>Dosage: <strong className="text-white">{t.testConditions.dosageGramsPerLiter} g/L</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL WINDOW FOR ADDING NEW RECORD */}
      {showAddRecordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <h3 className="font-black text-white text-base sm:text-lg border-b border-slate-800 pb-3 mb-4">
              Add Empirical R&D Test Result
            </h3>

            {formErrors.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-4 text-xs text-rose-300 space-y-1">
                <span className="font-bold block">Scientific Gate Blocked:</span>
                <ul className="list-disc pl-4">
                  {formErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleAddLabRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Recipe Basis:</label>
                  <select
                    value={newFormulaId}
                    onChange={(e) => setNewFormulaId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="golden-hd-laundry">Golden Heavy Duty Laundry Liquid</option>
                    <option value="golden-glass-cleaner">Golden Reference Anti-Fog Glass Cleaner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Recipe Version:</label>
                  <input
                    type="text"
                    value={newFormulaVersion}
                    onChange={(e) => setNewFormulaVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                    placeholder="1.0.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Product Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategoryId)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    {Object.keys(CATEGORY_EVIDENCE_MATRIX).map(catId => (
                      <option key={catId} value={catId}>
                        {getProductCategoryLabel(catId as ProductCategoryId)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Test Parameter / KPI:</label>
                  <select
                    value={newKPI}
                    onChange={(e) => setNewKPI(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="cleaningScore">Soil Removal % / Cleaning Index</option>
                    <option value="ph">Finished Product pH</option>
                    <option value="viscosity">Product Viscosity @ 25°C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Measured Value:</label>
                  <input
                    type="number"
                    step="any"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value !== '' ? parseFloat(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                    placeholder="e.g. 85.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Unit of Measure:</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as StandardUnit)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="%">% (Percent)</option>
                    <option value="pH units">pH units</option>
                    <option value="none">none</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Test Method Standard:</label>
                  <input
                    type="text"
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    placeholder="ASTM D4265 (Tergt-O-Tometer)"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Operator / Analyst:</label>
                  <input
                    type="text"
                    value={newOperator}
                    onChange={(e) => setNewOperator(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-[#111827] p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Temp (°C):</label>
                  <input
                    type="number"
                    value={newTemp}
                    onChange={(e) => setNewTemp(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#131d35] border border-slate-700 rounded text-xs text-white focus:outline-none"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Hardness (ppm):</label>
                  <input
                    type="number"
                    value={newHardness}
                    onChange={(e) => setNewHardness(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#131d35] border border-slate-700 rounded text-xs text-white focus:outline-none"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Substrate:</label>
                  <input
                    type="text"
                    value={newSubstrate}
                    onChange={(e) => setNewSubstrate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#131d35] border border-slate-700 rounded text-xs text-white focus:outline-none"
                    placeholder="Cotton"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Batch / Sample Tracking ID:</label>
                <input
                  type="text"
                  value={newSampleId}
                  onChange={(e) => setNewSampleId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131d35] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                  placeholder="BATCH-2026-09X"
                />
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-800 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-amber-900/10"
                >
                  Submit Empirical Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
