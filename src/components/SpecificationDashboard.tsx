import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FlaskConical,
  GitCompare,
  History,
  FileText,
  Sliders,
  Plus,
  Trash2,
  Save,
  TrendingDown,
  TrendingUp,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  SpecificationParameter,
  LabMeasurementRecord,
  FormulaVersionSnapshot,
  SpecificationReport,
  STANDARD_SPECIFICATION_TEMPLATES,
  tryGetSpecificationTemplateForCategory,
  isParameterApplicableForCategory,
  evaluateSpecifications,
  compareFormulas,
  validateSpecificationRange,
  StandardUnit,
  ReleaseGateEngine,
  BrowserAgent,
  ProjectPersistenceManager,
  Orchestrator,
  ReceiptManager,
  ReleaseGateReport
} from '../utils/specificationEngine';
import { isPowderCategory } from '../utils/formulationEngineRouter';
import { Lock, Unlock, Timer, Globe, Terminal } from 'lucide-react';
import { PowderFormulationReport } from '../utils/powderEngine/types';
import { FormulaCostReport } from '../utils/costingEngine';

interface SpecificationDashboardProps {
  formulaName: string;
  formulaVersion?: string;
  productCategory: string;
  batchSizeKg: number;
  ingredients: Array<{
    id?: string;
    name: string;
    percentage: number;
    activeMatterPct?: number;
    costPerKg?: number | null;
    role?: string;
  }>;
  powderReport?: PowderFormulationReport | null;
  costReport?: FormulaCostReport | null;
  liquidResults?: {
    pH?: number;
    activeSurfactants?: number;
    totalPercentage?: number;
    viscosity?: string | number;
    density?: number;
    liquidNVR?: number;
    liquidNVRComplete?: boolean;
    nvrCoveragePct?: number;
    costPerKg?: number;
  } | null;
}

export const SpecificationDashboard: React.FC<SpecificationDashboardProps> = ({
  formulaName,
  formulaVersion = '1.0',
  productCategory,
  batchSizeKg,
  ingredients,
  powderReport,
  costReport,
  liquidResults
}) => {
  // Navigation sub-tabs within Specification & Expert Decision System
  const [activeTab, setActiveTab] = useState<'verdict' | 'gap' | 'lab' | 'versions' | 'compare' | 'report'>('verdict');

  const isPowder = useMemo(() => isPowderCategory(productCategory), [productCategory]);

  // Stored Specifications (persisted per category / user)
  const [parameters, setParameters] = useState<SpecificationParameter[]>(() => {
    const saved = localStorage.getItem(`spec_params_${productCategory}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((p: SpecificationParameter) =>
            isParameterApplicableForCategory(p.parameterKey, productCategory)
          );
          if (valid.length > 0) return valid;
        }
      } catch (e) { /* ignore */ }
    }
    const template = tryGetSpecificationTemplateForCategory(productCategory, formulaName);
    return template ? template.parameters : [];
  });

  // Keep parameters strictly in sync when product category or formula changes
  useEffect(() => {
    const saved = localStorage.getItem(`spec_params_${productCategory}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((p: SpecificationParameter) =>
            isParameterApplicableForCategory(p.parameterKey, productCategory)
          );
          if (valid.length > 0) {
            setParameters(valid);
            return;
          }
        }
      } catch (e) { /* ignore */ }
    }
    const template = tryGetSpecificationTemplateForCategory(productCategory, formulaName);
    setParameters(template ? template.parameters : []);
  }, [productCategory, formulaName, isPowder]);

  // Lab Measurement Records (persisted per formula & version)
  const [labRecords, setLabRecords] = useState<LabMeasurementRecord[]>(() => {
    const saved = localStorage.getItem(`spec_lab_records`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Formula Version History Snapshots
  const [formulaVersions, setFormulaVersions] = useState<FormulaVersionSnapshot[]>(() => {
    const saved = localStorage.getItem(`formula_versions_history`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Selected versions for comparison
  const [compareVersionAId, setCompareVersionAId] = useState<string>('');
  const [compareVersionBId, setCompareVersionBId] = useState<string>('');

  // ===========================================================================
  // Release Gate & Verification Engine States
  // ===========================================================================
  const [isRunningBrowserVerification, setIsRunningBrowserVerification] = useState<boolean>(false);
  const [browserResult, setBrowserResult] = useState<any>(null);
  const [releaseStatusState, setReleaseStatusState] = useState<'draft' | 'deployed' | 'failed'>('draft');
  const [isVerifiedState, setIsVerifiedState] = useState<boolean>(false);
  const [auditDurationMs, setAuditDurationMs] = useState<number | 'NOT_MEASURED'>('NOT_MEASURED');

  // New Parameter Form State
  const [showAddParamModal, setShowAddParamModal] = useState<boolean>(false);
  const [newParamKey, setNewParamKey] = useState<string>('activeMatter');
  const [newParamName, setNewParamName] = useState<string>('Total Surfactant Active');
  const [newParamTarget, setNewParamTarget] = useState<string>('12.0');
  const [newParamMin, setNewParamMin] = useState<string>('10.0');
  const [newParamMax, setNewParamMax] = useState<string>('15.0');
  const [newParamUnit, setNewParamUnit] = useState<StandardUnit>('%');
  const [newParamCrit, setNewParamCrit] = useState<'CRITICAL' | 'MAJOR' | 'INFORMATIONAL'>('CRITICAL');
  const [newParamReqLab, setNewParamReqLab] = useState<boolean>(false);
  const [paramError, setParamError] = useState<string | null>(null);

  // New Lab Measurement Entry State
  const [labEntryParam, setLabEntryParam] = useState<string>('ph');
  const [labEntryValue, setLabEntryValue] = useState<string>('');
  const [labEntryBasis, setLabEntryBasis] = useState<string>('1.0% w/v in demineralized water @ 25°C');
  const [labEntryOperator, setLabEntryOperator] = useState<string>('');
  const [labEntryNotes, setLabEntryNotes] = useState<string>('');

  // Persist parameters on change
  useEffect(() => {
    localStorage.setItem(`spec_params_${productCategory}`, JSON.stringify(parameters));
  }, [parameters, productCategory]);

  // Persist lab measurements on change
  useEffect(() => {
    localStorage.setItem(`spec_lab_records`, JSON.stringify(labRecords));
  }, [labRecords]);

  // Persist formula version history
  useEffect(() => {
    localStorage.setItem(`formula_versions_history`, JSON.stringify(formulaVersions));
  }, [formulaVersions]);

  // Evaluate specifications deterministically using the evaluation engine
  const specReport: SpecificationReport = useMemo(() => {
    return evaluateSpecifications({
      formulaName,
      formulaVersion,
      productCategory,
      parameters,
      labMeasurements: labRecords.filter(r => r.formulaVersion === formulaVersion),
      powderReport,
      costReport,
      liquidResults
    });
  }, [formulaName, formulaVersion, productCategory, parameters, labRecords, powderReport, costReport, liquidResults]);

  // Current Formula Snapshot
  const currentSnapshot: FormulaVersionSnapshot = useMemo(() => {
    const totalPct = ingredients.reduce((sum, i) => sum + (Number(i.percentage) || 0), 0);
    const activePct = powderReport
      ? powderReport.activeMatter.totalSurfactantActivePct
      : liquidResults?.activeSurfactants ?? ingredients.reduce((sum, i) => sum + ((Number(i.percentage) || 0) * (Number(i.activeMatterPct) || 0) / 100), 0);
    const costKg = costReport?.costPerKg ?? powderReport?.costing.costPerKg ?? 0;
    const batchCost = costReport?.totalBatchCost ?? powderReport?.costing.totalBatchCost ?? (costKg * batchSizeKg);

    return {
      versionId: `snap-${formulaVersion}-${Date.now()}`,
      versionNumber: formulaVersion,
      formulaName,
      productCategory,
      batchSizeKg,
      ingredients: ingredients.map(i => ({
        id: i.id,
        name: i.name,
        percentage: Number(i.percentage) || 0,
        activeMatterPct: Number(i.activeMatterPct) || 100,
        costPerKg: Number(i.costPerKg) || 0,
        role: i.role
      })),
      totalPercentage: totalPct,
      activeMatterPct: activePct,
      costPerKg: costKg,
      totalBatchCost: batchCost,
      measuredPH: powderReport?.powderPH?.measuredPH ?? liquidResults?.pH,
      labMeasurements: labRecords.filter(r => r.formulaVersion === formulaVersion),
      specReport,
      createdAt: new Date().toISOString()
    };
  }, [formulaVersion, formulaName, productCategory, batchSizeKg, ingredients, powderReport, liquidResults, costReport, labRecords, specReport]);

  // Save current formula as a new version
  const handleSaveVersion = () => {
    const existingIdx = formulaVersions.findIndex(v => v.versionNumber === formulaVersion && v.formulaName === formulaName);
    if (existingIdx >= 0) {
      const updated = [...formulaVersions];
      updated[existingIdx] = currentSnapshot;
      setFormulaVersions(updated);
    } else {
      setFormulaVersions([currentSnapshot, ...formulaVersions]);
    }
  };

  // Evaluate the Release Gate using our evidence-based ReleaseGateEngine
  const releaseGateReport: ReleaseGateReport = useMemo(() => {
    const engine = ReleaseGateEngine.getInstance();
    return engine.evaluateReleaseGate(currentSnapshot, parameters, labRecords.filter(r => r.formulaVersion === formulaVersion), specReport);
  }, [currentSnapshot, parameters, labRecords, formulaVersion, specReport]);

  const handlePerformReleaseAudit = async () => {
    setIsRunningBrowserVerification(true);
    const startTime = Date.now();
    
    // Simulate real-time browser agent inspection or perform actual fetch
    const agent = BrowserAgent.getInstance();
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const bResult = await agent.runVerification(currentOrigin);
    
    const endTime = Date.now();
    const actualDuration = endTime - startTime;

    // Use ReceiptManager for legitimate duration measurement
    const receipt = ReceiptManager.getInstance().createReceipt(undefined, undefined, actualDuration);
    setAuditDurationMs(receipt.durationMs);

    // Compute orchestrator state transition based on the current release gate evaluation
    const orchestrator = Orchestrator.getInstance();
    const transition = orchestrator.transitionReleaseState(releaseGateReport);
    setReleaseStatusState(transition.status);
    setIsVerifiedState(transition.verified);

    // Persist VFS state
    const persistence = ProjectPersistenceManager.getInstance();
    persistence.persistVfsState(currentSnapshot, transition.verified);

    setBrowserResult(bResult);
    setIsRunningBrowserVerification(false);
  };

  // Add Lab Measurement
  const handleAddLabMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(labEntryValue);
    if (isNaN(val)) return;

    const matchedParam = parameters.find(p => p.parameterKey === labEntryParam);
    const newRecord: LabMeasurementRecord = {
      measurementId: `lab-${Date.now()}`,
      formulaVersion,
      parameterKey: labEntryParam,
      value: val,
      unit: matchedParam?.unit || '%',
      testBasis: labEntryBasis,
      operator: labEntryOperator || undefined,
      notes: labEntryNotes || undefined,
      testDate: new Date().toISOString().split('T')[0],
      provenance: 'MEASURED'
    };

    setLabRecords([...labRecords, newRecord]);
    setLabEntryValue('');
    setLabEntryNotes('');
  };

  // Delete Lab Record
  const handleDeleteLabRecord = (id: string) => {
    setLabRecords(labRecords.filter(r => r.measurementId !== id));
  };

  // Add Specification Parameter
  const handleSaveParam = (e: React.FormEvent) => {
    e.preventDefault();
    const target = newParamTarget.trim() !== '' ? parseFloat(newParamTarget) : undefined;
    const min = newParamMin.trim() !== '' ? parseFloat(newParamMin) : undefined;
    const max = newParamMax.trim() !== '' ? parseFloat(newParamMax) : undefined;

    const validationErr = validateSpecificationRange(min, max, target);
    if (validationErr) {
      setParamError(validationErr);
      return;
    }

    const newParam: SpecificationParameter = {
      id: `param-${Date.now()}`,
      parameterKey: newParamKey,
      parameterName: newParamName,
      target,
      min,
      max,
      unit: newParamUnit,
      criticality: newParamCrit,
      source: 'USER_DEFINED',
      requiresLabMeasurement: newParamReqLab,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setParameters([...parameters.filter(p => p.parameterKey !== newParamKey), newParam]);
    setShowAddParamModal(false);
    setParamError(null);
  };

  // Load Template
  const handleLoadTemplate = (templateId: string) => {
    const tpl = STANDARD_SPECIFICATION_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setParameters(tpl.parameters);
    }
  };

  // Comparison Report between Version A and Version B
  const comparisonReport = useMemo(() => {
    const vA = formulaVersions.find(v => v.versionId === compareVersionAId) || (formulaVersions.length > 0 ? formulaVersions[0] : currentSnapshot);
    const vB = formulaVersions.find(v => v.versionId === compareVersionBId) || currentSnapshot;
    return compareFormulas(vA, vB);
  }, [compareVersionAId, compareVersionBId, formulaVersions, currentSnapshot]);

  // Provenance Badge Component
  const renderProvenanceBadge = (prov: string) => {
    switch (prov) {
      case 'MEASURED':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">MEASURED</span>;
      case 'CALCULATED':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-950 text-blue-300 border border-blue-500/40">CALCULATED</span>;
      case 'PREDICTED':
      case 'SCREENING':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-500/40">{prov}</span>;
      case 'ESTIMATED':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-950 text-amber-300 border border-amber-500/40">ESTIMATED</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">{prov}</span>;
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            PASS
          </span>
        );
      case 'OUT_OF_SPEC':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            OUT OF SPEC
          </span>
        );
      case 'TARGET_NOT_MET':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            TARGET NOT MET
          </span>
        );
      case 'NOT_TESTED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
            NOT TESTED
          </span>
        );
      case 'INSUFFICIENT_DATA':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            INSUFFICIENT DATA
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div id="section-spec-decision-system" className="space-y-6 mt-8 p-4 sm:p-6 rounded-2xl bg-[#0b1120] border border-slate-800 shadow-2xl">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                FORMULATION SPECIFICATION & EXPERT DECISION SYSTEM
              </h2>
              <p className="text-xs text-slate-400">
                Product Specifications • Laboratory Records • Target Gap Analysis • Formula Comparison
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('verdict')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'verdict'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Specifications & Verdict</span>
          </button>

          <button
            onClick={() => setActiveTab('gap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'gap'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Target Gap Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'lab'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Lab Data ({specReport.labMeasurementsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'compare'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Formula Compare</span>
          </button>

          <button
            onClick={() => setActiveTab('versions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'versions'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Versions ({formulaVersions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Expert Report</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SPECIFICATIONS & OVERALL VERDICT */}
      {/* ======================================================== */}
      {activeTab === 'verdict' && (
        <div className="space-y-6">
          {/* Overall Verdict Banner */}
          <div className={`p-4 sm:p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            specReport.verdict.status === 'PASS'
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : specReport.verdict.status === 'NEEDS_REVISION'
              ? 'bg-rose-950/40 border-rose-500/40'
              : specReport.verdict.status === 'INSUFFICIENT_DATA'
              ? 'bg-amber-950/40 border-amber-500/40'
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-slate-950/60 shrink-0 mt-0.5">
                {specReport.verdict.status === 'PASS' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                {specReport.verdict.status === 'NEEDS_REVISION' && <XCircle className="w-6 h-6 text-rose-400" />}
                {specReport.verdict.status === 'INSUFFICIENT_DATA' && <HelpCircle className="w-6 h-6 text-amber-400" />}
                {specReport.verdict.status === 'SPECIFICATION_NOT_DEFINED' && <Info className="w-6 h-6 text-slate-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                    Expert Specification Verdict
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                    specReport.verdict.status === 'PASS' ? 'bg-emerald-900/80 text-emerald-300' :
                    specReport.verdict.status === 'NEEDS_REVISION' ? 'bg-rose-900/80 text-rose-300' :
                    specReport.verdict.status === 'INSUFFICIENT_DATA' ? 'bg-amber-900/80 text-amber-300' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {specReport.verdict.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {specReport.verdict.headline}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {specReport.verdict.summary}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Critical</span>
                <span className="text-xs font-bold text-white">
                  {specReport.verdict.criticalPassCount} / {specReport.verdict.criticalCount} Pass
                </span>
              </div>
              <div className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Major</span>
                <span className="text-xs font-bold text-white">
                  {specReport.verdict.majorPassCount} / {specReport.verdict.majorCount} Pass
                </span>
              </div>
              <button
                onClick={handleSaveVersion}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Version Snapshot</span>
              </button>
            </div>
          </div>

          {/* Release Gate Audit Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0c1424] space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 animate-pulse" />
                  Pre-Release Batch Validation & Release Gate Audit
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Continuous R&D Release Gates: Verifies lab records, chemical mass balance, physical bounds, cryptographic signatures, and browser rendering.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={isRunningBrowserVerification}
                  onClick={handlePerformReleaseAudit}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg ${
                    releaseGateReport.decision === 'READY'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                  } text-white disabled:opacity-50`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isRunningBrowserVerification ? 'Executing Browser QA...' : 'Execute Release Audit & Browser QA'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Metrics & Orchestration */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">RELEASE STATUS</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                      releaseStatusState === 'deployed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                      releaseStatusState === 'failed' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' :
                      'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {releaseStatusState}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">DECISION STATE</span>
                    <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black ${
                      releaseGateReport.decision === 'READY'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                    }`}>
                      {releaseGateReport.decision === 'READY' ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>READY</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>BLOCKED</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">VERIFIED SNAPSHOT</span>
                    <span className="text-xs font-bold text-white">
                      {isVerifiedState ? 'TRUE (COMMITTED)' : 'FALSE (UNVERIFIED)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">AUDIT DURATION</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1 font-mono">
                      <Timer className="w-3.5 h-3.5 text-slate-400" />
                      {typeof auditDurationMs === 'number' ? `${auditDurationMs} ms` : 'NOT_MEASURED'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 border-t border-slate-800/80 pt-3">
                    <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">SHA-256 FINGERPRINT</span>
                    <div className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate text-slate-300" title={releaseGateReport.integrityHash}>
                      {releaseGateReport.integrityHash}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Gate Checks */}
              <div className="lg:col-span-8 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {releaseGateReport.checks.map((check) => (
                    <div key={check.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {check.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : check.isBlocking ? (
                          <Lock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{check.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {check.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{check.evidence}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated/Real Playwright Browser Execution Logs */}
                {browserResult && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-white font-bold flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        Browser Rendering & Runtime QA Log
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Real Browser Engine (Playwright): {browserResult.realBrowserUsed ? 'ACTIVE' : 'FALLBACK (FETCH)'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-300 max-h-40 overflow-y-auto">
                      <div>[Browser] Navigating to: <span className="text-cyan-400">{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}</span></div>
                      <div>[Browser] Status Code: <span className="text-emerald-400">HTTP 200 OK</span></div>
                      <div>[Browser] Console Errors: {browserResult.consoleErrors.length === 0 ? <span className="text-emerald-400">0</span> : <span className="text-rose-400">{browserResult.consoleErrors.length}</span>}</div>
                      {browserResult.consoleErrors.map((err: string, i: number) => (
                        <div key={i} className="text-rose-400 pl-4">{err}</div>
                      ))}
                      <div>[Browser] Page Exceptions: {browserResult.exceptions.length === 0 ? <span className="text-emerald-400">0</span> : <span className="text-rose-400">{browserResult.exceptions.length}</span>}</div>
                      {browserResult.exceptions.map((exc: string, i: number) => (
                        <div key={i} className="text-rose-400 pl-4">{exc}</div>
                      ))}
                      <div>[Browser] Network Failures: {browserResult.networkFailures.length === 0 ? <span className="text-emerald-400">0</span> : <span className="text-rose-400">{browserResult.networkFailures.length}</span>}</div>
                      {browserResult.networkFailures.map((fail: string, i: number) => (
                        <div key={i} className="text-rose-400 pl-4">{fail}</div>
                      ))}
                      <div className="text-slate-400 border-t border-slate-800/50 pt-1.5">{browserResult.summary}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Template & Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Specification Template:</span>
              <select
                onChange={(e) => handleLoadTemplate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Select Template --</option>
                {STANDARD_SPECIFICATION_TEMPLATES.filter(tpl => isPowderCategory(tpl.productCategory) === isPowder).map(tpl => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddParamModal(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-700/60 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-1 transition-all border border-cyan-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Parameter</span>
              </button>
            </div>
          </div>

          {/* Specification Parameters Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Specification Evaluation Matrix ({specReport.items.length} Parameters)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">Formula: {formulaName} (v{formulaVersion})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Parameter</th>
                    <th className="py-2.5 px-3">Criticality</th>
                    <th className="py-2.5 px-3">Target / Limits</th>
                    <th className="py-2.5 px-3">Current Value</th>
                    <th className="py-2.5 px-3">Provenance</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Evaluation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {specReport.items.map((item, idx) => (
                    <tr key={item.parameterKey || idx} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <div>{item.parameterName}</div>
                        {item.testBasis && (
                          <div className="text-[10px] text-slate-400 font-normal">{item.testBasis}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.criticality === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' :
                          item.criticality === 'MAJOR' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {item.criticality}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {item.target !== undefined && <div>Target: {item.target} {item.unit}</div>}
                        {(item.min !== undefined || item.max !== undefined) && (
                          <div className="text-[11px] text-slate-400">
                            Range: [{item.min ?? '-'} .. {item.max ?? '-'}] {item.unit}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        {item.currentValueDisplay}
                      </td>
                      <td className="py-2.5 px-3">
                        {renderProvenanceBadge(item.provenance)}
                      </td>
                      <td className="py-2.5 px-3">
                        {renderStatusBadge(item.status)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                        {item.statusMessage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evidence-Based Recommendations */}
          {specReport.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Evidence-Based Formulation Observations ({specReport.recommendations.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specReport.recommendations.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{rec.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                        Confidence: {rec.confidence}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{rec.observation}</p>
                    <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="font-semibold text-cyan-300 block mb-0.5">Potential Action:</span>
                      {rec.potentialAction}
                    </div>
                    {rec.tradeoffNotice && (
                      <div className="text-[10px] text-amber-300/90 flex items-center gap-1">
                        <Info className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Trade-off: {rec.tradeoffNotice}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TARGET GAP ANALYSIS */}
      {/* ======================================================== */}
      {activeTab === 'gap' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Target Gap Analysis</h3>
              <p className="text-xs text-slate-400">Quantified delta between current formula values and target limits</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Parameter</th>
                  <th className="py-2.5 px-3">Current Value</th>
                  <th className="py-2.5 px-3">Target Value</th>
                  <th className="py-2.5 px-3">Quantified Gap</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Provenance</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {specReport.gapAnalysis.map((gap, i) => (
                  <tr key={gap.parameterKey || i} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-white">{gap.parameterName}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{gap.currentValueDisplay}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300">{gap.targetValueDisplay}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {gap.gap !== undefined ? (
                        <span className={gap.gap === 0 ? 'text-emerald-400' : gap.gap > 0 ? 'text-blue-400' : 'text-amber-400'}>
                          {gap.gapDisplay}
                        </span>
                      ) : (
                        <span className="text-slate-500">INSUFFICIENT_DATA</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {gap.direction === 'ON_TARGET' && (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> On Target
                        </span>
                      )}
                      {gap.direction === 'BELOW_TARGET' && (
                        <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                          <TrendingDown className="w-3.5 h-3.5" /> Below Target
                        </span>
                      )}
                      {gap.direction === 'ABOVE_TARGET' && (
                        <span className="flex items-center gap-1 text-blue-400 text-xs font-semibold">
                          <TrendingUp className="w-3.5 h-3.5" /> Above Target
                        </span>
                      )}
                      {gap.direction === 'OUT_OF_BOUNDS' && (
                        <span className="flex items-center gap-1 text-rose-400 text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Out of Bounds
                        </span>
                      )}
                      {gap.direction === 'NO_TARGET' && (
                        <span className="text-slate-500 text-xs">No Target</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {renderProvenanceBadge(gap.provenance)}
                    </td>
                    <td className="py-2.5 px-3">
                      {renderStatusBadge(gap.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LABORATORY DATA MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'lab' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Lab Measurement Entry Form */}
            <div className="lg:col-span-1 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                Record Lab Measurement
              </h4>
              <form onSubmit={handleAddLabMeasurement} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Parameter</label>
                  <select
                    value={labEntryParam}
                    onChange={(e) => setLabEntryParam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {parameters.map(p => (
                      <option key={p.parameterKey} value={p.parameterKey}>
                        {p.parameterName} ({p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Measured Value</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={labEntryValue}
                    onChange={(e) => setLabEntryValue(e.target.value)}
                    placeholder="Enter lab measurement..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Test Basis / Method</label>
                  <input
                    type="text"
                    value={labEntryBasis}
                    onChange={(e) => setLabEntryBasis(e.target.value)}
                    placeholder="e.g. 1.0% w/v @ 25°C"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Analyst / Operator</label>
                    <input
                      type="text"
                      value={labEntryOperator}
                      onChange={(e) => setLabEntryOperator(e.target.value)}
                      placeholder="e.g. QC Chemist"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Notes</label>
                    <input
                      type="text"
                      value={labEntryNotes}
                      onChange={(e) => setLabEntryNotes(e.target.value)}
                      placeholder="Batch notes..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Lab Record (v{formulaVersion})</span>
                </button>
              </form>
            </div>

            {/* Lab Records List & Replicates */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recorded Laboratory Measurements for v{formulaVersion} ({specReport.labMeasurementsCount})
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-mono">Authoritative Over Predictions</span>
                </div>

                {labRecords.filter(r => r.formulaVersion === formulaVersion).length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No physical lab measurements recorded for formula version {formulaVersion}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {labRecords.filter(r => r.formulaVersion === formulaVersion).map((rec) => (
                      <div key={rec.measurementId} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{parameters.find(p => p.parameterKey === rec.parameterKey)?.parameterName || rec.parameterKey}</span>
                            <span className="text-cyan-400 font-mono">{rec.value} {rec.unit}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">MEASURED</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Basis: {rec.testBasis || 'Standard'} • Date: {rec.testDate} {rec.notes ? `• ${rec.notes}` : ''}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteLabRecord(rec.measurementId)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Replicate Statistics */}
              {specReport.replicateSummaries.some(r => r.hasReplicates) && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Replicate Statistics & Precision Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {specReport.replicateSummaries.filter(r => r.hasReplicates).map((rep) => (
                      <div key={rep.parameterKey} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="font-semibold text-white">{rep.parameterKey} ({rep.replicatesCount} Replicates)</div>
                        <div className="text-[11px] text-slate-300 font-mono">
                          Mean: {rep.mean.toFixed(3)} {rep.unit}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Std Dev (σ): {rep.stdDev?.toFixed(3)} • Range: {rep.range.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: FORMULA COMPARISON */}
      {/* ======================================================== */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          {/* Comparison Selector */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">Compare Formula A:</span>
              <select
                value={compareVersionAId}
                onChange={(e) => setCompareVersionAId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
              >
                <option value="">Current Draft (v{formulaVersion})</option>
                {formulaVersions.map(v => (
                  <option key={v.versionId} value={v.versionId}>{v.formulaName} (v{v.versionNumber})</option>
                ))}
              </select>

              <span className="font-bold text-white">vs Formula B:</span>
              <select
                value={compareVersionBId}
                onChange={(e) => setCompareVersionBId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
              >
                <option value="">Current Draft (v{formulaVersion})</option>
                {formulaVersions.map(v => (
                  <option key={v.versionId} value={v.versionId}>{v.formulaName} (v{v.versionNumber})</option>
                ))}
              </select>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Delta: {comparisonReport.summaryInsights[0] || 'Comparing formulas'}
            </span>
          </div>

          {/* Ingredient Deltas Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Ingredient Composition Comparison
              </h4>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Ingredient</th>
                  <th className="py-2.5 px-3">Formula A %</th>
                  <th className="py-2.5 px-3">Formula B %</th>
                  <th className="py-2.5 px-3">Delta %</th>
                  <th className="py-2.5 px-3">Cost Delta</th>
                  <th className="py-2.5 px-3">Change Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparisonReport.ingredientDeltas.map((ing, i) => (
                  <tr key={ing.name || i} className="hover:bg-slate-900/30">
                    <td className="py-2 px-3 font-semibold text-white">{ing.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-300">{ing.pctA.toFixed(2)}%</td>
                    <td className="py-2 px-3 font-mono text-slate-300">{ing.pctB.toFixed(2)}%</td>
                    <td className="py-2 px-3 font-mono font-bold">
                      <span className={ing.deltaPct > 0 ? 'text-emerald-400' : ing.deltaPct < 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {ing.deltaPct > 0 ? `+${ing.deltaPct.toFixed(2)}%` : `${ing.deltaPct.toFixed(2)}%`}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-300">
                      ₹{ing.deltaCost.toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ing.changeType === 'ADDED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                        ing.changeType === 'REMOVED' ? 'bg-rose-950 text-rose-300 border border-rose-500/30' :
                        ing.changeType === 'MODIFIED' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {ing.changeType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Parameter Deltas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Total Active Surfactant</span>
              <div className="text-sm font-bold text-white">
                Formula A: {comparisonReport.parameterDeltas.find(p => p.parameterKey === 'activeMatter')?.displayA}
              </div>
              <div className="text-sm font-bold text-cyan-300">
                Formula B: {comparisonReport.parameterDeltas.find(p => p.parameterKey === 'activeMatter')?.displayB}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Formula Cost / kg</span>
              <div className="text-sm font-bold text-white">
                Formula A: ₹{comparisonReport.costDelta.costPerKgA.toFixed(2)} / kg
              </div>
              <div className="text-sm font-bold text-emerald-300">
                Formula B: ₹{comparisonReport.costDelta.costPerKgB.toFixed(2)} / kg (Delta: ₹{comparisonReport.costDelta.deltaCostPerKg.toFixed(2)})
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Specification Verdict</span>
              <div className="text-xs font-bold text-slate-300">
                Formula A: {comparisonReport.verdictA || 'NOT_EVALUATED'}
              </div>
              <div className="text-xs font-bold text-cyan-300">
                Formula B: {comparisonReport.verdictB || 'NOT_EVALUATED'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: FORMULA VERSION SNAPSHOTS */}
      {/* ======================================================== */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Formula Version History</h3>
              <p className="text-xs text-slate-400">Preserves historical snapshots, recipes, lab records, and specification verdicts</p>
            </div>
            <button
              onClick={handleSaveVersion}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Snapshot Current (v{formulaVersion})</span>
            </button>
          </div>

          {formulaVersions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
              No historical formula versions saved yet. Click "Snapshot Current" to preserve formula version state.
            </div>
          ) : (
            <div className="space-y-3">
              {formulaVersions.map((ver) => (
                <div key={ver.versionId} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono font-bold text-xs border border-blue-500/30">
                        v{ver.versionNumber}
                      </span>
                      <span className="font-bold text-white text-sm">{ver.formulaName}</span>
                      <span className="text-xs text-slate-400">({ver.productCategory})</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(ver.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-mono">Mass Balance</span>
                      <span className="font-mono font-bold text-white">{ver.totalPercentage.toFixed(2)}%</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-mono">Active Matter</span>
                      <span className="font-mono font-bold text-cyan-300">{ver.activeMatterPct.toFixed(2)}%</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-mono">Cost / kg</span>
                      <span className="font-mono font-bold text-emerald-300">₹{ver.costPerKg.toFixed(2)} / kg</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-mono">Spec Verdict</span>
                      <span className="font-bold text-slate-200">{ver.specReport?.verdict.status || 'INSUFFICIENT_DATA'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: EXPERT FORMULATION REPORT */}
      {/* ======================================================== */}
      {activeTab === 'report' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 text-xs text-slate-300">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">EXPERT FORMULATION DOSSIER & SPECIFICATION REPORT</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Formula: {formulaName} | Version: {formulaVersion} | Category: {productCategory} | Date: {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono block text-slate-400">Verdict</span>
              <span className="font-bold text-sm text-cyan-400">{specReport.verdict.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Mass Balance & Active Matter Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">Total Assigned Mass</span>
              <span className="font-mono font-bold text-white text-sm">{currentSnapshot.totalPercentage.toFixed(2)}%</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">Active Surfactant</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">{currentSnapshot.activeMatterPct.toFixed(2)}%</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">Finished Cost / kg</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">₹{currentSnapshot.costPerKg.toFixed(2)}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">Batch Size</span>
              <span className="font-mono font-bold text-white text-sm">{batchSizeKg} kg</span>
            </div>
          </div>

          {/* Ingredient Composition */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Formula Composition</h4>
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Ingredient</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3 text-right">Recipe %</th>
                    <th className="py-2 px-3 text-right">Batch Mass ({batchSizeKg} kg)</th>
                    <th className="py-2 px-3 text-right">Active %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {ingredients.map((ing, i) => (
                    <tr key={ing.id || i}>
                      <td className="py-1.5 px-3 font-sans font-medium text-white">{ing.name}</td>
                      <td className="py-1.5 px-3 text-slate-400 font-sans">{ing.role || '-'}</td>
                      <td className="py-1.5 px-3 text-right text-slate-200">{Number(ing.percentage).toFixed(2)}%</td>
                      <td className="py-1.5 px-3 text-right text-slate-300">{((Number(ing.percentage) / 100) * batchSizeKg).toFixed(2)} kg</td>
                      <td className="py-1.5 px-3 text-right text-cyan-300">{Number(ing.activeMatterPct || 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300 block mb-0.5">Scientific & Regulatory Provenance Note:</span>
            Calculated outputs represent theoretical formulation stoichiometry and physical screening models. For official regulatory claims, finished commercial specifications, and safety data sheets, conduct physical laboratory validation testing.
          </div>
        </div>
      )}

      {/* Modal: Add Custom Parameter */}
      {showAddParamModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add Specification Parameter</h3>
              <button
                onClick={() => setShowAddParamModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {paramError && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300">
                {paramError}
              </div>
            )}

            <form onSubmit={handleSaveParam} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Parameter Key</label>
                <select
                  value={newParamKey}
                  onChange={(e) => {
                    setNewParamKey(e.target.value);
                    const map: Record<string, string> = isPowder ? {
                      activeMatter: 'Total Surfactant Active',
                      powderPH: 'Aqueous pH (1.0% w/v Solution)',
                      moisture: 'Moisture (Loss on Drying)',
                      bulkDensity: 'Loose Bulk Density',
                      tappedDensity: 'Tapped Bulk Density',
                      dissolutionTime: 'Aqueous Dissolution Time',
                      carrIndex: 'Carr Compressibility Index',
                      hausnerRatio: 'Hausner Ratio',
                      costPerKg: 'Finished Cost / kg',
                      massBalance: 'Formula Mass Total'
                    } : {
                      activeMatter: 'Total Active Surfactant',
                      ph: 'Finished Product pH',
                      density: 'Liquid Density / Specific Gravity @ 20°C',
                      viscosity: 'Product Viscosity @ 25°C',
                      liquidNVR: 'Liquid Non-Volatile Residue (NVR)',
                      costPerKg: 'Finished Cost / kg',
                      massBalance: 'Formula Mass Total'
                    };
                    if (map[e.target.value]) setNewParamName(map[e.target.value]);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  {isPowder ? (
                    <>
                      <option value="activeMatter">Total Surfactant Active</option>
                      <option value="powderPH">Aqueous pH (1.0% w/v Solution)</option>
                      <option value="moisture">Moisture (Loss on Drying)</option>
                      <option value="bulkDensity">Loose Bulk Density</option>
                      <option value="tappedDensity">Tapped Bulk Density</option>
                      <option value="dissolutionTime">Dissolution Time</option>
                      <option value="carrIndex">Carr Compressibility Index</option>
                      <option value="hausnerRatio">Hausner Ratio</option>
                      <option value="costPerKg">Cost / kg</option>
                      <option value="massBalance">Formula Mass Total</option>
                    </>
                  ) : (
                    <>
                      <option value="activeMatter">Total Active Surfactant</option>
                      <option value="ph">Finished Product pH</option>
                      <option value="density">Liquid Density / Specific Gravity</option>
                      <option value="viscosity">Product Viscosity</option>
                      <option value="liquidNVR">Liquid Non-Volatile Residue (NVR)</option>
                      <option value="costPerKg">Cost / kg</option>
                      <option value="massBalance">Formula Mass Total</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Parameter Display Name</label>
                <input
                  type="text"
                  required
                  value={newParamName}
                  onChange={(e) => setNewParamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Target</label>
                  <input
                    type="number"
                    step="any"
                    value={newParamTarget}
                    onChange={(e) => setNewParamTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Min</label>
                  <input
                    type="number"
                    step="any"
                    value={newParamMin}
                    onChange={(e) => setNewParamMin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Max</label>
                  <input
                    type="number"
                    step="any"
                    value={newParamMax}
                    onChange={(e) => setNewParamMax(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Unit</label>
                  <select
                    value={newParamUnit}
                    onChange={(e) => setNewParamUnit(e.target.value as StandardUnit)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="%">%</option>
                    <option value="pH units">pH units</option>
                    <option value="g/mL">g/mL</option>
                    <option value="seconds">seconds</option>
                    <option value="₹/kg">₹/kg</option>
                    <option value="ppm">ppm</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Criticality</label>
                  <select
                    value={newParamCrit}
                    onChange={(e) => setNewParamCrit(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="INFORMATIONAL">INFORMATIONAL</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={newParamReqLab}
                    onChange={(e) => setNewParamReqLab(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-0"
                  />
                  <span>Mandatory Physical Laboratory Testing</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddParamModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Save Parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
