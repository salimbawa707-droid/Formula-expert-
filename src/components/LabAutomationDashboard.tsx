import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Layers,
  FileCode,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  Database,
} from 'lucide-react';
import { FORMULAS } from '../data/formulas';
import {
  createExperimentDesignFromFormula,
} from '../utils/labAutomation/opentronsAdapter';
import {
  generateExperimentProtocol,
} from '../utils/labAutomation/experimentProtocolGenerator';
import { validateExperimentProtocol } from '../utils/labAutomation/experimentProtocolValidator';
import {
  exportProtocolBundle,
} from '../utils/labAutomation/protocolExportService';
import { generateProtocolPreview } from '../utils/labAutomation/protocolPreviewService';
import {
  registerProtocolExportExecution,
  importExternalExecutionToLims,
} from '../utils/labAutomation/protocolLimsBridge';
import {
  ProtocolDefinition,
  RobotPlatform,
  ExperimentDesign,
  ProtocolExportBundle,
  ProtocolExecutionRecord,
} from '../utils/labAutomation/types';

export const LabAutomationDashboard: React.FC = () => {
  // 1. Formula & Experiment Design State
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(FORMULAS[0].id);
  const [targetScaleUl, setTargetScaleUl] = useState<number>(200);
  const [replicates, setReplicates] = useState<number>(3);
  const [robotPlatform, setRobotPlatform] = useState<RobotPlatform>('OT-2');
  const [temperatureCelsius, setTemperatureCelsius] = useState<number>(22);
  const [mixingRequired, setMixingRequired] = useState<boolean>(true);
  const [mixCycles, setMixCycles] = useState<number>(5);

  // 2. Active Protocol & State
  const currentFormula = useMemo(() => {
    return FORMULAS.find(f => f.id === selectedFormulaId) || FORMULAS[0];
  }, [selectedFormulaId]);

  const [_experimentDesign, setExperimentDesign] = useState<ExperimentDesign>(() => {
    return createExperimentDesignFromFormula({
      formulaId: FORMULAS[0].id,
      formulaName: FORMULAS[0].name,
      productCategory: FORMULAS[0].category as any,
      physicalForm: 'LIQUID',
      ingredients: FORMULAS[0].ingredients as any,
      targetScaleUl: 200,
      replicates: 3,
      temperatureCelsius: 22,
      mixingRequired: true,
    });
  });

  const [protocol, setProtocol] = useState<ProtocolDefinition>(() => {
    const exp = createExperimentDesignFromFormula({
      formulaId: FORMULAS[0].id,
      formulaName: FORMULAS[0].name,
      productCategory: FORMULAS[0].category as any,
      physicalForm: 'LIQUID',
      ingredients: FORMULAS[0].ingredients as any,
      targetScaleUl: 200,
      replicates: 3,
      temperatureCelsius: 22,
      mixingRequired: true,
    });
    return generateExperimentProtocol(exp, { platform: 'OT-2' });
  });

  // Human Review Gate & Export State
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [operatorName, setOperatorName] = useState<string>('Lead Automation Chemist');
  const [reviewNotes, setReviewNotes] = useState<string>('Deck layout, tip clearance, and volume tolerances verified.');
  const [checklist, setChecklist] = useState({
    deckLayoutVerified: true,
    volumesWithinTolerance: true,
    noHazardousMixingConflicts: true,
    physicalFormCompatible: true,
    externalSafetyMeasuresInPlace: true,
  });

  const [exportBundle, setExportBundle] = useState<ProtocolExportBundle | null>(null);
  const [activeExportTab, setActiveExportTab] = useState<'python' | 'json' | 'sop' | 'manifest'>('python');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // Execution Record & LIMS Bridge State
  const [executionRecord, setExecutionRecord] = useState<ProtocolExecutionRecord | null>(null);
  const [showExecutionImportModal, setShowExecutionImportModal] = useState<boolean>(false);
  const [externalRunId, setExternalRunId] = useState<string>(`OT2-RUN-${Date.now().toString(36).toUpperCase()}`);
  const [externalRobotName, setExternalRobotName] = useState<string>('OT2-DEV-RND-01');
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Regenerate Protocol on parameter change
  const handleRegenerateProtocol = () => {
    const exp = createExperimentDesignFromFormula({
      formulaId: currentFormula.id,
      formulaName: currentFormula.name,
      productCategory: currentFormula.category as any,
      physicalForm: (currentFormula as any).physicalForm || 'LIQUID',
      ingredients: currentFormula.ingredients as any,
      targetScaleUl,
      replicates,
      temperatureCelsius,
      mixingRequired,
    });
    exp.processParameters.mixCycles = mixCycles;

    const newProtocol = generateExperimentProtocol(exp, { platform: robotPlatform });
    const validated = validateExperimentProtocol(newProtocol, exp);
    newProtocol.validationResult = validated;

    setExperimentDesign(exp);
    setProtocol(newProtocol);
    setExportBundle(null);
    setExecutionRecord(null);
    setImportSuccessMessage(null);
  };

  // Preview Data
  const previewData = useMemo(() => {
    return generateProtocolPreview(protocol);
  }, [protocol]);

  // Handle Human Review Approval
  const handleApproveReview = () => {
    const updatedProtocol: ProtocolDefinition = {
      ...protocol,
      approvedForExport: true,
      humanReview: {
        reviewedBy: operatorName,
        reviewedAt: new Date().toISOString(),
        decision: 'APPROVED_FOR_EXPORT',
        reviewNotes,
        checklistConfirmed: checklist,
      },
    };

    const bundle = exportProtocolBundle(updatedProtocol, operatorName);
    const execRec = registerProtocolExportExecution(updatedProtocol, operatorName);

    setProtocol(updatedProtocol);
    setExportBundle(bundle);
    setExecutionRecord(execRec);
    setShowReviewModal(false);
  };

  // Handle Copy to Clipboard
  const handleCopyCode = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  // Handle Download File
  const handleDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle LIMS Import
  const handleImportToLims = () => {
    if (!executionRecord) return;
    const limsResult = importExternalExecutionToLims(executionRecord, {
      externalRunId,
      externalRobotName,
      completedAt: new Date().toISOString(),
      operator: operatorName,
      replicateCount: replicates,
      notes: 'Simulated automated liquid handling execution log.',
      isSimulated: true,
    });

    setExecutionRecord(limsResult.executionRecord);
    setShowExecutionImportModal(false);
    setImportSuccessMessage(
      `Successfully generated ${limsResult.samples.length} Simulated LIMS Samples and ${limsResult.evidenceRecords.length} UNVERIFIED (Simulated) Evidence Records linked to Run ${externalRunId}!`
    );
  };

  // Active well state for interactive plate preview
  const [selectedWell, setSelectedWell] = useState<string>('A1');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
                Opentrons Lab Automation & Protocol Studio
              </h1>
              <p className="text-sm text-slate-400">
                Automated Experiment Protocol Generation, Scientific Constraint Validation & LIMS Integration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Hardware Safety Guard: Active
          </div>
          <button
            onClick={handleRegenerateProtocol}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            Rebuild Protocol
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls & Right Protocol Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Experiment Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Formula Selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              1. Formulation Source
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target Formulation</label>
              <select
                value={selectedFormulaId}
                onChange={e => setSelectedFormulaId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {FORMULAS.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-medium text-slate-200">{currentFormula.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Ingredients Count:</span>
                <span className="font-medium text-slate-200">{currentFormula.ingredients.length} items</span>
              </div>
              <div className="flex justify-between">
                <span>Formula Hash:</span>
                <span className="font-mono text-slate-400">{protocol.protocolHash.slice(0, 10)}...</span>
              </div>
            </div>
          </div>

          {/* Liquid Handling & Robotics Parameters */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              2. Robotics & Scale Parameters
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Platform</label>
                <select
                  value={robotPlatform}
                  onChange={e => setRobotPlatform(e.target.value as RobotPlatform)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="OT-2">Opentrons OT-2</option>
                  <option value="FLEX">Opentrons Flex</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Replicates</label>
                <select
                  value={replicates}
                  onChange={e => setReplicates(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1 Replicate</option>
                  <option value={2}>2 Replicates</option>
                  <option value={3}>3 Replicates (Triplicate)</option>
                  <option value={4}>4 Replicates (Quadruplicate)</option>
                  <option value={8}>8 Replicates (Row Screening)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-400">Target Well Volume (µL)</label>
                <span className="text-xs font-mono font-bold text-blue-400">{targetScaleUl} µL</span>
              </div>
              <input
                type="range"
                min={50}
                max={320}
                step={10}
                value={targetScaleUl}
                onChange={e => setTargetScaleUl(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>50 µL (Micro-scale)</span>
                <span>200 µL (Standard 96)</span>
                <span>320 µL (Max Working)</span>
              </div>
            </div>

            {/* Mixing options */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Automated Mixing</span>
                <input
                  type="checkbox"
                  checked={mixingRequired}
                  onChange={e => setMixingRequired(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 accent-blue-500 w-4 h-4"
                />
              </div>

              {mixingRequired && (
                <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-blue-500/40">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Mix Cycles</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={mixCycles}
                      onChange={e => setMixCycles(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Conditioning Temp</label>
                    <input
                      type="number"
                      value={temperatureCelsius}
                      onChange={e => setTemperatureCelsius(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation & Gate Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              3. Human Review & Gate
            </h2>

            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                protocol.validationResult.isValid
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              }`}
            >
              {protocol.validationResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-semibold">
                  Status: {protocol.validationResult.status}
                </div>
                <div className="text-slate-400">{protocol.validationResult.summary}</div>
              </div>
            </div>

            {/* Scientific Warnings */}
            {protocol.validationResult.issues.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">Scientific & Physical Notes:</span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {protocol.validationResult.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300 flex items-start gap-2"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-amber-300">[{issue.code}]</span> {issue.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Human Review Button */}
            {!protocol.approvedForExport ? (
              <button
                onClick={() => setShowReviewModal(true)}
                disabled={!protocol.validationResult.canApproveForExport}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Open Human Review Gate
              </button>
            ) : (
              <div className="p-3 bg-emerald-900/20 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Approved for External Export
                </div>
                <div className="text-slate-400">
                  Approved by <span className="text-slate-200">{protocol.humanReview?.reviewedBy}</span> at{' '}
                  <span className="text-slate-200">
                    {new Date(protocol.humanReview?.reviewedAt || '').toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Deck, Plate Viewer & Script Exporter (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Deck Layout & Well Plate Viewer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Deck Architecture & 96-Well Matrix
                </h2>
                <p className="text-xs text-slate-400">
                  Platform: {protocol.robotPlatform} • Estimated Run: ~{previewData.estimatedDurationMin} mins • Tips Required: {previewData.totalTipsUsed}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 font-mono text-slate-300">
                  {protocol.liquidTransfers.length} Transfers
                </span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 font-mono text-slate-300">
                  {protocol.commands.length} Commands
                </span>
              </div>
            </div>

            {/* Deck Slots Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deck Layout Map</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(protocol.deckLayout).map(([slot, item]) => (
                  <div
                    key={slot}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-blue-500/50 transition flex flex-col justify-between min-h-[90px]"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-blue-950 text-blue-400 rounded border border-blue-800">
                        Slot {slot}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">{item.purpose.replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 truncate">{item.nickname}</div>
                      <div className="text-[10px] text-slate-500 truncate">{item.labwareDef.displayName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 96-Well Plate Interactive Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Destination Plate Matrix (Slot {robotPlatform === 'OT-2' ? '3' : 'B2'})
                </h3>
                <span className="text-xs text-blue-400">Click well to inspect aliquot breakdown</span>
              </div>

              {previewData.plates[robotPlatform === 'OT-2' ? '3' : 'B2'] && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                      <div className="grid grid-cols-13 gap-1 text-center">
                        <div className="text-[10px] text-slate-600 font-mono"></div>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(c => (
                          <div key={c} className="text-[10px] font-mono text-slate-500">
                            {c}
                          </div>
                        ))}

                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(row => (
                          <React.Fragment key={row}>
                            <div className="text-[10px] font-mono text-slate-500 flex items-center justify-center">
                              {row}
                            </div>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(col => {
                              const wellKey = `${row}${col}`;
                              const cell = previewData.plates[robotPlatform === 'OT-2' ? '3' : 'B2'].cells[wellKey];
                              const isSelected = selectedWell === wellKey;
                              const hasLiquid = (cell?.totalVolumeUl || 0) > 0;

                              return (
                                <button
                                  key={wellKey}
                                  onClick={() => setSelectedWell(wellKey)}
                                  className={`h-7 rounded-md border flex items-center justify-center text-[10px] font-mono transition relative ${
                                    isSelected
                                      ? 'border-blue-400 ring-2 ring-blue-500/40'
                                      : hasLiquid
                                      ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400'
                                      : 'border-slate-800/80 bg-slate-900/30 text-slate-600 hover:border-slate-700'
                                  }`}
                                  title={`${wellKey}: ${cell?.totalVolumeUl || 0} µL`}
                                >
                                  {hasLiquid ? Math.round(cell.totalVolumeUl) : ''}
                                </button>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Selected Well Inspector */}
                  {selectedWell && (
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                      <div>
                        <span className="font-mono font-bold text-blue-400 mr-2">Well {selectedWell}</span>
                        <span className="text-slate-400">
                          Total Volume:{' '}
                          <span className="font-semibold text-slate-200">
                            {previewData.plates[robotPlatform === 'OT-2' ? '3' : 'B2']?.cells[selectedWell]?.totalVolumeUl || 0} µL
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previewData.plates[robotPlatform === 'OT-2' ? '3' : 'B2']?.cells[selectedWell]?.ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[11px] font-medium border"
                            style={{
                              backgroundColor: `${ing.color || '#3b82f6'}20`,
                              borderColor: `${ing.color || '#3b82f6'}60`,
                              color: ing.color || '#93c5fd',
                            }}
                          >
                            {ing.name}: {ing.volumeUl} µL
                          </span>
                        ))}
                        {(!previewData.plates[robotPlatform === 'OT-2' ? '3' : 'B2']?.cells[selectedWell]?.ingredients.length) && (
                          <span className="text-slate-500 text-[11px]">Empty Well (No dispense scheduled)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Export Bundle & Code Tabs */}
          {exportBundle && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-400" />
                    Exported Protocol Artifacts
                  </h2>
                  <p className="text-xs text-slate-400">
                    Protocol SHA-256: <span className="font-mono text-emerald-400">{exportBundle.protocolHash}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowExecutionImportModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Database className="w-3.5 h-3.5" />
                    SIMULATED OPENTRONS RUN (Not Lab Tested)
                  </button>
                </div>
              </div>

              {importSuccessMessage && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  {importSuccessMessage}
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setActiveExportTab('python')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                    activeExportTab === 'python'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  Opentrons Python Script (.py)
                </button>
                <button
                  onClick={() => setActiveExportTab('json')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                    activeExportTab === 'json'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  JSON Spec Schema v6
                </button>
                <button
                  onClick={() => setActiveExportTab('sop')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                    activeExportTab === 'sop'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  SOP Markdown (.md)
                </button>
                <button
                  onClick={() => setActiveExportTab('manifest')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                    activeExportTab === 'manifest'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Security Manifest
                </button>
              </div>

              {/* Code Container */}
              <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-x-auto max-h-96">
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const text =
                        activeExportTab === 'python'
                          ? exportBundle.pythonProtocolScript
                          : activeExportTab === 'json'
                          ? exportBundle.jsonProtocolSpec
                          : activeExportTab === 'sop'
                          ? exportBundle.sopMarkdown
                          : exportBundle.manifestJson;
                      handleCopyCode(text, activeExportTab);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
                    title="Copy code"
                  >
                    {copiedTab === activeExportTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      if (activeExportTab === 'python') {
                        handleDownload(`${protocol.protocolId}.py`, exportBundle.pythonProtocolScript, 'text/x-python');
                      } else if (activeExportTab === 'json') {
                        handleDownload(`${protocol.protocolId}.json`, exportBundle.jsonProtocolSpec, 'application/json');
                      } else if (activeExportTab === 'sop') {
                        handleDownload(`${protocol.protocolId}_SOP.md`, exportBundle.sopMarkdown, 'text/markdown');
                      } else {
                        handleDownload(`${protocol.protocolId}_manifest.json`, exportBundle.manifestJson, 'application/json');
                      }
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                <pre className="text-slate-300 whitespace-pre leading-relaxed">
                  {activeExportTab === 'python' && exportBundle.pythonProtocolScript}
                  {activeExportTab === 'json' && exportBundle.jsonProtocolSpec}
                  {activeExportTab === 'sop' && exportBundle.sopMarkdown}
                  {activeExportTab === 'manifest' && exportBundle.manifestJson}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Human Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Human Review & Approval Gate</h3>
                  <p className="text-xs text-slate-400">Formal sign-off required prior to generating executable robot exports</p>
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reviewing Chemist / Operator</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Review Notes & Precautions</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              {/* Checklist */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-semibold text-slate-300">Mandatory Verification Checklist:</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.deckLayoutVerified}
                      onChange={e => setChecklist({ ...checklist, deckLayoutVerified: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 accent-emerald-500"
                    />
                    <span>Deck slot positions match physical labware and reservoir capacities</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.volumesWithinTolerance}
                      onChange={e => setChecklist({ ...checklist, volumesWithinTolerance: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 accent-emerald-500"
                    />
                    <span>All transfer volumes fall within certified pipette minimum and maximum working ranges</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.noHazardousMixingConflicts}
                      onChange={e => setChecklist({ ...checklist, noHazardousMixingConflicts: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 accent-emerald-500"
                    />
                    <span>Chemical ingredients verified safe for co-dispensing without exothermic hazards</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.physicalFormCompatible}
                      onChange={e => setChecklist({ ...checklist, physicalFormCompatible: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 accent-emerald-500"
                    />
                    <span>Viscosities of stock surfactants are compatible with positive-displacement / blow-out settings</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReview}
                disabled={!Object.values(checklist).every(Boolean) || !operatorName.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Sign & Authorize Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External Execution Record Simulation Modal */}
      {showExecutionImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                SIMULATED OPENTRONS RUN (NOT A REAL EXECUTION)
              </h3>
              <button
                onClick={() => setShowExecutionImportModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400 font-medium bg-slate-950 p-3 rounded-lg border border-slate-800 text-indigo-300">
                SIMULATED OPENTRONS RUN • NOT A REAL EXECUTION • NOT LAB TESTED. This allows simulation of an external run for development and demo purposes, generating simulated, unverified LIMS entries completely separate from authoritative lab evidence.
              </p>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Simulated Run ID</label>
                <input
                  type="text"
                  value={externalRunId}
                  onChange={e => setExternalRunId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Simulated Robot Instrument Name</label>
                <input
                  type="text"
                  value={externalRobotName}
                  onChange={e => setExternalRobotName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowExecutionImportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleImportToLims}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Simulated Ingest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LabAutomationDashboard;
