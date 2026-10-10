import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Database,
  ArrowRight,
  TrendingUp,
  Cpu,
  Sliders,
  Check,
  Workflow,
  History,
} from 'lucide-react';
import { FORMULAS } from '../data/formulas';
import { ProductCategoryId } from '../domain/productTaxonomy';
import { StandardUnit } from '../utils/specificationEngine/types';
import {
  comparePredictionVsMeasurementBatch,
} from '../utils/closedLoopRAndD/predictionVsMeasurementEngine';
import {
  evaluateMeasurementsBatch,
} from '../utils/closedLoopRAndD/measurementEvaluationEngine';
import {
  determineFeedbackDecision,
} from '../utils/closedLoopRAndD/feedbackDecisionEngine';
import {
  generateReformulationCandidate,
} from '../utils/closedLoopRAndD/reformulationFeedbackEngine';
import {
  applyFeedbackToFormulation,
} from '../utils/closedLoopRAndD/optimizationFeedbackBridge';
import {
  ClosedLoopAuditService,
} from '../utils/closedLoopRAndD/closedLoopAuditService';
import {
  PredictedMeasurement,
  ObservedMeasurement,
  ReformulationCandidate,
  ClosedLoopIterationRecord,
} from '../utils/closedLoopRAndD/types';

export const ClosedLoopDashboard: React.FC = () => {
  // 1. Formula & State Selection
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(FORMULAS[0].id);
  const [iterationCycle, setIterationCycle] = useState<number>(1);
  const [operatorName, setOperatorName] = useState<string>('Dr. Lead R&D Chemist');

  const currentFormula = useMemo(() => {
    return FORMULAS.find(f => f.id === selectedFormulaId) || FORMULAS[0];
  }, [selectedFormulaId]);

  // Simulated Bench Observed Lab Measurements (e.g. drawn from LIMS or external Opentrons run)
  const [observedPH, setObservedPH] = useState<number>(7.85); // Intentionally lower than target 8.5 to trigger feedback
  const [observedViscosity, setObservedViscosity] = useState<number>(280); // Target 350
  const [observedActiveMatter, setObservedActiveMatter] = useState<number>(14.2); // Target 15.0

  // 2. Compute Predicted Measurements from Scientific Engines
  const predictedMeasurements: PredictedMeasurement[] = useMemo(() => {
    return [
      {
        parameterKey: 'ph',
        parameterName: 'Formulation pH',
        value: 8.50,
        unit: 'pH units' as StandardUnit,
        engineName: 'PHEngineV2',
        engineVersion: '2.1.0',
        calculationTimestamp: new Date().toISOString(),
        acceptableToleranceRange: { min: 7.5, max: 9.5 },
      },
      {
        parameterKey: 'viscosity',
        parameterName: 'Brookfield Viscosity',
        value: 350,
        unit: 'cP' as StandardUnit,
        engineName: 'ViscosityEngine',
        engineVersion: '1.4.0',
        calculationTimestamp: new Date().toISOString(),
        acceptableToleranceRange: { min: 300, max: 800 },
      },
      {
        parameterKey: 'active_matter',
        parameterName: 'Total Active Matter',
        value: 15.0,
        unit: '%' as StandardUnit,
        engineName: 'ActiveMatterEngine',
        engineVersion: '2.0.0',
        calculationTimestamp: new Date().toISOString(),
        acceptableToleranceRange: { min: 14.0, max: 18.0 },
      },
    ];
  }, []);

  // 3. Formulate Observed Measurements
  const observedMeasurements: ObservedMeasurement[] = useMemo(() => {
    return [
      {
        measurementId: `MEAS-PH-${iterationCycle}`,
        evidenceRecordId: `EVID-PH-${iterationCycle}`,
        parameterKey: 'ph',
        parameterName: 'Formulation pH',
        value: observedPH,
        unit: 'pH units' as StandardUnit,
        method: 'ISO 4316 Potentiometric glass electrode (SIMULATED)',
        instrumentId: 'SIMULATED',
        instrumentCalibrationValid: false,
        measurementTimestamp: new Date().toISOString(),
        analyst: operatorName,
        replicateCount: 3,
        uncertainty: 0.05,
        evidenceLevel: 'CALCULATED',
        verificationStatus: 'UNVERIFIED',
      },
      {
        measurementId: `MEAS-VISC-${iterationCycle}`,
        evidenceRecordId: `EVID-VISC-${iterationCycle}`,
        parameterKey: 'viscosity',
        parameterName: 'Brookfield Viscosity',
        value: observedViscosity,
        unit: 'cP' as StandardUnit,
        method: 'ASTM D2196 Brookfield LV Spindle 2 (SIMULATED)',
        instrumentId: 'SIMULATED',
        instrumentCalibrationValid: false,
        measurementTimestamp: new Date().toISOString(),
        analyst: operatorName,
        replicateCount: 3,
        uncertainty: 15,
        evidenceLevel: 'CALCULATED',
        verificationStatus: 'UNVERIFIED',
      },
      {
        measurementId: `MEAS-ACT-${iterationCycle}`,
        evidenceRecordId: `EVID-ACT-${iterationCycle}`,
        parameterKey: 'active_matter',
        parameterName: 'Total Active Matter',
        value: observedActiveMatter,
        unit: '%' as StandardUnit,
        method: 'ISO 2271 Two-phase Epton Titration (SIMULATED)',
        instrumentId: 'SIMULATED',
        instrumentCalibrationValid: false,
        measurementTimestamp: new Date().toISOString(),
        analyst: operatorName,
        replicateCount: 3,
        uncertainty: 0.1,
        evidenceLevel: 'CALCULATED',
        verificationStatus: 'UNVERIFIED',
      },
    ];
  }, [observedPH, observedViscosity, observedActiveMatter, iterationCycle, operatorName]);

  // 4. Run Closed-Loop Analysis Pipeline
  const comparisons = useMemo(() => {
    const pairs = predictedMeasurements.map(p => ({
      predicted: p,
      observed: observedMeasurements.find(o => o.parameterKey === p.parameterKey)!,
    })).filter(pair => Boolean(pair.observed));

    return comparePredictionVsMeasurementBatch(pairs);
  }, [predictedMeasurements, observedMeasurements]);

  const evaluationSummary = useMemo(() => {
    const specsMap: Record<string, { min?: number; max?: number; target?: number }> = {
      ph: { min: 8.0, max: 9.5, target: 8.5 },
      viscosity: { min: 300, max: 800, target: 350 },
      active_matter: { min: 14.0, max: 18.0, target: 15.0 },
    };

    return evaluateMeasurementsBatch({
      category: currentFormula.category as ProductCategoryId,
      physicalForm: 'LIQUID',
      observedMeasurements,
      predictedMeasurements,
      specifications: specsMap,
    });
  }, [currentFormula, observedMeasurements, predictedMeasurements]);

  const feedbackDecision = useMemo(() => {
    return determineFeedbackDecision({
      evaluations: evaluationSummary.evaluations,
      comparisons,
      replicateCount: 3,
    });
  }, [evaluationSummary, comparisons]);

  const reformulationCandidate: ReformulationCandidate = useMemo(() => {
    return generateReformulationCandidate({
      parentFormulaId: currentFormula.id,
      parentFormulaVersionId: `V${iterationCycle}.0.0`,
      iterationCycle,
      category: currentFormula.category as ProductCategoryId,
      physicalForm: 'LIQUID',
      ingredients: currentFormula.ingredients as any,
      evaluations: evaluationSummary.evaluations,
      comparisons,
      createdBy: operatorName,
    });
  }, [currentFormula, iterationCycle, evaluationSummary, comparisons, operatorName]);

  // Reformulation Output from IntelliForm Bridge
  const reformulatedOutput = useMemo(() => {
    if (reformulationCandidate.recommendedAdjustments.length === 0) return null;
    return applyFeedbackToFormulation({
      candidate: reformulationCandidate,
      baseIngredients: currentFormula.ingredients as any,
    });
  }, [reformulationCandidate, currentFormula]);

  // Human Review Modal State
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('Evaluated prediction delta and confirmed alkali + salt curve adjustments.');
  const [iterationHistory, setIterationHistory] = useState<ClosedLoopIterationRecord[]>([]);

  // Approve & Emit New Formula Version
  const handleApproveIteration = () => {
    const outputVersion = `V${iterationCycle + 1}.0.0`;
    const rec: ClosedLoopIterationRecord = {
      iterationCycle,
      formulaId: currentFormula.id,
      inputFormulaVersionId: `V${iterationCycle}.0.0`,
      experimentId: `EXP-CYCLE-${iterationCycle}`,
      batchId: `BATCH-CYCLE-${iterationCycle}`,
      sampleId: `SMP-CYCLE-${iterationCycle}`,
      evidenceRecordIds: observedMeasurements.map(o => o.evidenceRecordId),
      comparisons,
      specEvaluations: evaluationSummary.evaluations,
      actionCategory: feedbackDecision.actionCategory,
      reformulationCandidateId: reformulationCandidate.candidateId,
      outputFormulaVersionId: outputVersion,
      sha256AuditHash: ClosedLoopAuditService.recordEvent(
        'HUMAN_REVIEW_APPROVED',
        currentFormula.id,
        `V${iterationCycle}.0.0`,
        operatorName,
        `Approved reformulation feedback for ${outputVersion}. Reason: ${reviewNotes}`
      ).eventHash,
      createdAt: new Date().toISOString(),
      createdBy: operatorName,
    };

    setIterationHistory([rec, ...iterationHistory]);
    setIterationCycle(c => c + 1);
    setShowReviewModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8 font-sans">
      {/* DEMO / TRAINING MODE FIREWALL ISOLATION BANNER */}
      <div className="bg-amber-950/40 border border-amber-500/50 p-4 rounded-xl flex items-center justify-between gap-4 text-amber-200">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 uppercase tracking-wider block">DEMO / TRAINING MODE — SIMULATED — NOT LAB DATA</span>
            All simulated laboratory measurements in this studio are for computational training and algorithmic feedback exploration only. Simulated data is strictly firewalled and will never enter the empirical validation dataset, calibration pipeline, or production evidence records.
          </div>
        </div>
        <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-[10px] font-mono font-bold text-amber-300 shrink-0">
          FIREWALL: ISOLATED
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Workflow className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Closed-Loop Scientific R&D & Reformulation Studio
              </h1>
              <p className="text-sm text-slate-400">
                [DEMO / TRAINING MODE] Simulated Result Ingestion • Prediction vs. Simulation Analysis • IntelliForm Reformulation Feedback
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 text-xs font-mono text-teal-300 flex items-center gap-2">
            <History className="w-4 h-4" />
            Active Iteration: Cycle #{iterationCycle} (Version V{iterationCycle}.0.0)
          </div>
        </div>
      </div>

      {/* R&D Closed-Loop Stepper Timeline */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Workflow className="w-4 h-4 text-teal-400" />
          R&D Closed-Loop Feedback Flow (SIMULATED — NOT LAB DATA)
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-teal-500/40 space-y-1">
            <div className="text-[10px] font-mono text-teal-400 font-bold">1. FORMULA V{iterationCycle}.0</div>
            <div className="font-semibold text-slate-200 truncate">{currentFormula.name}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-blue-400 font-bold">2. EXPERIMENT</div>
            <div className="font-semibold text-slate-200 truncate">Opentrons OT-2 Run</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-cyan-400 font-bold">3. SIMULATED INGESTION</div>
            <div className="font-semibold text-slate-200 truncate">3 Simulated Replicates</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-purple-400 font-bold">4. EVALUATION</div>
            <div className="font-semibold text-slate-200 truncate">{evaluationSummary.evaluations.length} Parameters Checked</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-amber-400 font-bold">5. FEEDBACK</div>
            <div className="font-semibold text-slate-200 truncate">{feedbackDecision.actionCategory}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-1">
            <div className="text-[10px] font-mono text-emerald-400 font-bold">6. REFORMULATION</div>
            <div className="font-semibold text-slate-200 truncate">V{iterationCycle + 1}.0 Candidate</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Ingestion Controls & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Simulated Result Ingestion Bench Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Formula Selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Target Formula & Category
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Active Formulation</label>
              <select
                value={selectedFormulaId}
                onChange={e => setSelectedFormulaId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {FORMULAS.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Lead R&D Chemist</label>
              <input
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Simulated Result Ingestion Simulator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Adjust Simulated Closed-Loop Observations
            </h2>
            <p className="text-xs text-slate-400">
              Adjust simulated values to observe dynamic feedback and reformulation candidate generation (NOT LAB VALIDATED).
            </p>

            {/* pH Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Simulated pH (NOT LAB VALIDATED)</span>
                <span className={`font-mono font-bold ${observedPH < 8.0 || observedPH > 9.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {observedPH.toFixed(2)} pH
                </span>
              </div>
              <input
                type="range"
                min={6.5}
                max={10.5}
                step={0.05}
                value={observedPH}
                onChange={e => setObservedPH(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>6.50 (Acidic Delta)</span>
                <span>8.50 (Target)</span>
                <span>10.50 (Caustic Delta)</span>
              </div>
            </div>

            {/* Viscosity Slider */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Simulated Viscosity (NOT LAB VALIDATED)</span>
                <span className={`font-mono font-bold ${observedViscosity < 300 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {observedViscosity} cP
                </span>
              </div>
              <input
                type="range"
                min={150}
                max={700}
                step={10}
                value={observedViscosity}
                onChange={e => setObservedViscosity(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>150 cP (Low)</span>
                <span>350 cP (Target)</span>
                <span>700 cP (High)</span>
              </div>
            </div>

            {/* Active Matter Slider */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Simulated Active Matter (NOT LAB VALIDATED)</span>
                <span className="font-mono font-bold text-emerald-400">
                  {observedActiveMatter.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={10.0}
                max={20.0}
                step={0.1}
                value={observedActiveMatter}
                onChange={e => setObservedActiveMatter(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action State Gate Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Feedback Action Gate
            </h2>

            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                feedbackDecision.actionCategory === 'REFORMULATION_CANDIDATE'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  : feedbackDecision.actionCategory === 'NO_CHANGE_REQUIRED'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-blue-950/30 border-blue-500/40 text-blue-300'
              }`}
            >
              {feedbackDecision.actionCategory === 'REFORMULATION_CANDIDATE' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-semibold font-mono">
                  ACTION: {feedbackDecision.actionCategory}
                </div>
                <div className="text-slate-300">{feedbackDecision.rationale}</div>
                <div className="text-slate-400 pt-1 font-medium">{feedbackDecision.recommendedNextStep}</div>
              </div>
            </div>

            {feedbackDecision.actionCategory === 'REFORMULATION_CANDIDATE' && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Authorize Reformulation Version V{iterationCycle + 1}.0
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Prediction vs Measurement & Reformulation Feedback (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Prediction vs Measurement Comparison Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                  Calculated Prediction vs. Simulated Closed-Loop Observation
                </h2>
                <p className="text-xs text-slate-400">
                  Side-by-side scientific comparison preserving predictions and simulated demo observations separately (NOT LAB VALIDATED)
                </p>
              </div>

              <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 text-teal-300 rounded-md border border-slate-700">
                {comparisons.length} Parameters Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Parameter</th>
                    <th className="p-3">Predicted (Engine)</th>
                    <th className="p-3">Simulated Observation (NOT LAB VALIDATED)</th>
                    <th className="p-3">Delta / % Diff</th>
                    <th className="p-3">Spec Bounds</th>
                    <th className="p-3">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {comparisons.map((c, i) => {
                    const evalMatch = evaluationSummary.evaluations.find(e => e.parameterKey === c.parameterKey);
                    const isOut = evalMatch?.state === 'OUTSIDE_SPECIFICATION';
                    const isPredDev = evalMatch?.state === 'PREDICTION_DEVIATION';

                    return (
                      <tr key={i} className="hover:bg-slate-950/60 transition">
                        <td className="p-3 font-semibold text-slate-200">
                          {c.parameterName}
                          <div className="text-[10px] text-slate-500 font-normal">{c.observed.method}</div>
                        </td>
                        <td className="p-3 text-slate-300">
                          {c.predicted.value} {c.unit}
                          <div className="text-[10px] text-blue-400">{c.predicted.engineName}</div>
                        </td>
                        <td className="p-3 text-slate-200 font-bold">
                          {c.observed.value} {c.unit}
                          <div className="text-[10px] text-emerald-400">{c.observed.evidenceLevel}</div>
                        </td>
                        <td className={`p-3 font-bold ${isOut ? 'text-rose-400' : isPredDev ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {c.signedDeviation > 0 ? '+' : ''}{c.signedDeviation} ({c.relativeDifferencePercent}%)
                        </td>
                        <td className="p-3 text-slate-400">
                          [{evalMatch?.lowerLimit ?? '-'} .. {evalMatch?.upperLimit ?? '-'}]
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              isOut
                                ? 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                                : isPredDev
                                ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
                                : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                            }`}
                          >
                            {evalMatch?.state}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scientific Feedback Diagnosis & Reformulation Candidate */}
          {reformulationCandidate.diagnoses.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  Scientific Feedback Diagnosis
                </h2>
                <p className="text-xs text-slate-400">
                  Simulated facts, hypotheses, and action proposals derived from closed-loop simulation (NOT LAB VALIDATED)
                </p>
              </div>

              <div className="space-y-3">
                {reformulationCandidate.diagnoses.map((d, i) => (
                  <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-300 uppercase tracking-wide font-mono">
                        [{d.parameterKey}] {d.confidence}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                        Level: {d.evidenceLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-slate-500 font-semibold">Observed Fact:</span> {d.observedFact}
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Possible Cause:</span> {d.possibleCause}
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-500 font-semibold">Hypothesis:</span> {d.hypothesis}
                      </div>
                      <div className="md:col-span-2 p-2 bg-slate-900 rounded border border-teal-500/30 text-teal-300 font-medium">
                        <span className="font-bold text-teal-400">Action Proposal:</span> {d.actionProposal}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* IntelliForm Reformulation Candidate Preview */}
              {reformulatedOutput && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    IntelliForm Reformulation Candidate Output (V{iterationCycle + 1}.0)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Estimated pH</span>
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {reformulatedOutput.optimizationSummary.estimatedPH?.toFixed(2)} pH
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Estimated Active Matter</span>
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {reformulatedOutput.optimizationSummary.activeMatterPct?.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Total Formula Weight</span>
                      <div className="text-sm font-bold text-slate-200 font-mono">
                        {reformulatedOutput.totalPercentage}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400">Recommended Ingredient Adjustments:</span>
                    <div className="space-y-1.5 font-mono text-xs">
                      {reformulationCandidate.recommendedAdjustments.map((adj, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-slate-200">{adj.ingredientName}</span>
                            <div className="text-[10px] text-slate-400 font-sans">{adj.rationale}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400">{adj.oldTargetPercent}%</span>
                            <ArrowRight className="w-3 h-3 inline mx-1.5 text-emerald-400" />
                            <span className="font-bold text-emerald-300">{adj.proposedTargetPercent}%</span>
                            <span className="text-[10px] text-emerald-400 ml-1">
                              ({adj.deltaPercent > 0 ? '+' : ''}{adj.deltaPercent}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Iteration History Table */}
          {iterationHistory.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-400" />
                Historical Iteration Audit Chain
              </h2>

              <div className="space-y-2 font-mono text-xs">
                {iterationHistory.map((h, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>
                        Cycle #{h.iterationCycle}: {h.inputFormulaVersionId} → {h.outputFormulaVersionId}
                      </span>
                      <span className="text-emerald-400">{h.actionCategory}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Audit SHA-256: {h.sha256AuditHash} • Approved By: {h.createdBy} at {new Date(h.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Human Review Approval Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Authorize New Formula Version V{iterationCycle + 1}.0
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-200 text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Confirm sign-off on closed-loop feedback diagnosis. This will record a cryptographic SHA-256 audit entry and emit Formula Version V{iterationCycle + 1}.0 while preserving V{iterationCycle}.0 strictly immutable.
              </p>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Chemist Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveIteration}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Check className="w-4 h-4" />
                Emit Version V{iterationCycle + 1}.0
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClosedLoopDashboard;
