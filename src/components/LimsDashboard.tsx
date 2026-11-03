import React, { useEffect, useState } from 'react';
import {
  TestTube,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ShieldCheck,
  Activity,
  Layers,
  Barcode,
  History,
  Edit3,
  Award,
  Plus
} from 'lucide-react';
import {
  FormulaVersion,
  BatchRecord,
  LabSample,
  LabTest,
  LabMeasurement,
  EvidenceRecord,
  LimsAuditRecord,
  MeasurementCorrection,
  StandardUnit
} from '../domain/lims/types';
import { getRegisteredInstruments, InstrumentRecord, registerUserInstrument, UserInstrumentRegistration } from '../domain/lims/instrument';
import { FORMULAS } from '../data/formulas';
import { db } from '../db/database';
import {
  createFormulaVersionSnapshot,
  createBatchRecord,
  drawLabSample,
  generateApplicableTestsForSample,
  recordLabMeasurement
} from '../utils/lims/limsEngine';
import { CANONICAL_TEST_METHODS } from '../domain/lims/testMethods';
import { normalizeProductCategory } from '../domain/productTaxonomy';
import { getValidationPlanForCategory } from '../domain/lims/validationPlan';
import { transitionSampleStatus } from '../utils/lims/limsSampleLifecycleEngine';
import { createAuditRecord, verifyAuditTrailChain } from '../utils/lims/limsAuditTrailEngine';
import { buildEvidenceRecordFromMeasurement, createMeasurementCorrection } from '../utils/lims/limsEvidencePromotionEngine';
import { SpectralAnalysisDashboard } from './SpectralAnalysisDashboard';

export const LimsDashboard: React.FC = () => {
  // Master active sub-section
  const [activeSection, setActiveSection] = useState<'samples' | 'tests' | 'results' | 'instruments' | 'audit' | 'release' | 'spectroscopy'>('samples');

  // Formula selection is only a recipe-library reference; no physical sample is implied.
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(FORMULAS[0].id);
  const selectedFormula = FORMULAS.find(formula => formula.id === selectedFormulaId) || FORMULAS[0];
  const normalizedSelectedCategory = selectedFormula ? normalizeProductCategory(selectedFormula.category) : 'UNKNOWN_PRODUCT_CATEGORY';
  const validationPlan = normalizedSelectedCategory === 'UNKNOWN_PRODUCT_CATEGORY' ? [] : getValidationPlanForCategory(normalizedSelectedCategory);
  const [instruments, setInstruments] = useState<InstrumentRecord[]>(() => getRegisteredInstruments());
  const [formulaVersions, setFormulaVersions] = useState<FormulaVersion[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [samples, setSamples] = useState<LabSample[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [measurements, setMeasurements] = useState<LabMeasurement[]>([]);
  const [corrections, setCorrections] = useState<MeasurementCorrection[]>([]);
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>([]);
  const [auditChain, setAuditChain] = useState<LimsAuditRecord[]>([]);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let active = true;
    db.userSettings.get('lims_session_v1')
      .then(record => {
        if (!active || !record || !record.value || typeof record.value !== 'object') return;
        const saved = record.value as Partial<{
          formulaVersions: FormulaVersion[]; batches: BatchRecord[]; samples: LabSample[];
          tests: LabTest[]; measurements: LabMeasurement[]; corrections: MeasurementCorrection[];
          evidenceRecords: EvidenceRecord[]; auditChain: LimsAuditRecord[];
        }>;
        if (Array.isArray(saved.formulaVersions)) setFormulaVersions(saved.formulaVersions);
        if (Array.isArray(saved.batches)) setBatches(saved.batches);
        if (Array.isArray(saved.samples)) setSamples(saved.samples);
        if (Array.isArray(saved.tests)) setTests(saved.tests);
        if (Array.isArray(saved.measurements)) setMeasurements(saved.measurements);
        if (Array.isArray(saved.corrections)) setCorrections(saved.corrections);
        if (Array.isArray(saved.evidenceRecords)) setEvidenceRecords(saved.evidenceRecords);
        if (Array.isArray(saved.auditChain)) setAuditChain(saved.auditChain);
      })
      .catch(error => console.error('Failed to load local LIMS session:', error))
      .finally(() => { if (active) setSessionReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    db.userSettings.put({
      key: 'lims_session_v1',
      value: { formulaVersions, batches, samples, tests, measurements, corrections, evidenceRecords, auditChain },
      updatedAt: new Date().toISOString(),
    }).catch(error => console.error('Failed to persist local LIMS session:', error));
  }, [sessionReady, formulaVersions, batches, samples, tests, measurements, corrections, evidenceRecords, auditChain]);

  // UI Input states
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [measValue, setMeasValue] = useState<string>('');
  const [measUnit, setMeasUnit] = useState<StandardUnit>('pH units');
  const [measInstrumentId, setMeasInstrumentId] = useState<string>(() => getRegisteredInstruments().find(i => i.classification === 'USER_REGISTERED')?.instrumentId || '');
  const [measAnalyst, setMeasAnalyst] = useState<string>('');
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [measNotes, setMeasNotes] = useState<string>('');
  const [measTemperature, setMeasTemperature] = useState<string>('');
  const [measSampleConcentration, setMeasSampleConcentration] = useState<string>('');
  const [measSampleConcentrationUnit, setMeasSampleConcentrationUnit] = useState<'%' | 'g/L'>('%');
  const [measDilutionWaterHardness, setMeasDilutionWaterHardness] = useState<string>('');
  const [measDilutionWaterDescription, setMeasDilutionWaterDescription] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [batchOperator, setBatchOperator] = useState<string>('');
  const [targetBatchKg, setTargetBatchKg] = useState<string>('');
  const [actualBatchKg, setActualBatchKg] = useState<string>('');
  const [limsMessage, setLimsMessage] = useState<string>('');
  const [instrumentDraft, setInstrumentDraft] = useState<UserInstrumentRegistration>({
    instrumentId: '', name: '', manufacturer: '', model: '', serialNumber: '', instrumentType: '',
    calibrationCertificateReference: '', lastCalibrationDate: '', nextCalibrationDate: '',
    location: '', custodian: '', registeredBy: '',
  });

  const updateInstrumentDraft = (field: keyof UserInstrumentRegistration, value: string) => {
    setInstrumentDraft(current => ({ ...current, [field]: value }));
  };

  const handleRegisterInstrument = (event: React.FormEvent) => {
    event.preventDefault();
    const registration = { ...instrumentDraft, registeredBy: instrumentDraft.registeredBy.trim() };
    const result = registerUserInstrument(registration);
    if (!result.success || !result.instrument) {
      setLimsMessage(result.error || 'Instrument registration failed.');
      return;
    }
    const refreshed = getRegisteredInstruments();
    setInstruments(refreshed);
    setMeasInstrumentId(result.instrument.instrumentId);
    setLimsMessage(`Instrument registered. Calibration date status: ${result.instrument.calibrationStatus}. Certificate contents and scope still require human verification.`);
    setInstrumentDraft({
      instrumentId: '', name: '', manufacturer: '', model: '', serialNumber: '', instrumentType: '',
      calibrationCertificateReference: '', lastCalibrationDate: '', nextCalibrationDate: '',
      location: '', custodian: '', registeredBy: '',
    });
  };

  // Correction Modal / Form State
  const [correctingMeas, setCorrectingMeas] = useState<LabMeasurement | null>(null);
  const [correctionNewVal, setCorrectionNewVal] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // Handle Recording New Measurement
  const handleRecordMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const test = tests.find(t => t.testId === selectedTestId);
    if (!test) {
      setLimsMessage('Select a registered sample test before entering results.');
      return;
    }

    const valNum = parseFloat(measValue);
    const temperatureC = parseFloat(measTemperature);
    if (!Number.isFinite(valNum) || !Number.isFinite(temperatureC) || !measAnalyst.trim()) {
      setLimsMessage('Enter a finite measurement, actual test temperature, and analyst identity.');
      return;
    }
    const concentration = measSampleConcentration === '' ? undefined : Number(measSampleConcentration);
    const dilutionWaterHardnessPpm = measDilutionWaterHardness === '' ? undefined : Number(measDilutionWaterHardness);
    if (test.parameterKey === 'ph' && (
      concentration === undefined || !Number.isFinite(concentration) || concentration <= 0 ||
      dilutionWaterHardnessPpm === undefined || !Number.isFinite(dilutionWaterHardnessPpm) || dilutionWaterHardnessPpm < 0 ||
      !measDilutionWaterDescription.trim()
    )) {
      setLimsMessage('For pH, record sample concentration, dilution-water hardness, and the water source/type.');
      return;
    }

    try {
      const measurement = recordLabMeasurement(
        test,
        valNum,
        measUnit,
        CANONICAL_TEST_METHODS.find(method => method.methodId === test.testMethodId)?.procedureReference || test.parameterName,
        measInstrumentId,
        measAnalyst.trim(),
        measurements.filter(m => m.testId === test.testId).length + 1,
        instruments,
        temperatureC,
        measNotes,
        {
          sampleConcentration: concentration,
          sampleConcentrationUnit: concentration === undefined ? undefined : measSampleConcentrationUnit,
          dilutionWaterHardnessPpm,
          dilutionWaterDescription: measDilutionWaterDescription.trim() || undefined,
        }
      );

      const instrument = instruments.find(i => i.instrumentId === measInstrumentId);
      const prevEvidence = evidenceRecords.length > 0 ? evidenceRecords[evidenceRecords.length - 1].hash : undefined;
      const evidence = buildEvidenceRecordFromMeasurement(measurement, instrument, measAnalyst, prevEvidence);

    // Update Test Status to COMPLETED
    const updatedTests = tests.map(t =>
      t.testId === test.testId ? { ...t, status: 'COMPLETED' as const, completedAt: new Date().toISOString() } : t
    );

    // Append Audit Record
    const lastAudit = auditChain.length > 0 ? auditChain[auditChain.length - 1] : undefined;
    const audit = createAuditRecord(
      measAnalyst,
      'RECORD_LAB_MEASUREMENT',
      'MEASUREMENT',
      measurement.measurementId,
      null,
      measurement,
      `Recorded ${test.parameterName} = ${valNum} ${measUnit} using instrument ${measInstrumentId}`,
      lastAudit
    );

      setMeasurements([measurement, ...measurements]);
      setEvidenceRecords([evidence, ...evidenceRecords]);
      setTests(updatedTests);
      setAuditChain([...auditChain, audit]);
      setFormulaVersions(formulaVersions.map(version => version.formulaId === measurement.formulaId && version.formulaVersion === measurement.formulaVersion
        ? { ...version, labValidationStatus: 'LAB_TEST_IN_PROGRESS', validationStatusReason: 'Physical measurements are being collected; senior review and approved acceptance criteria are still required.' }
        : version));
      setLimsMessage('Measurement recorded with instrument and temperature provenance.');

      setMeasValue('');
      setMeasTemperature('');
      setMeasSampleConcentration('');
      setMeasDilutionWaterHardness('');
      setMeasDilutionWaterDescription('');
      setMeasNotes('');
    } catch (error) {
      setLimsMessage(error instanceof Error ? error.message : 'Measurement could not be recorded.');
    }
  };

  // Handle Controlled Sample Status Transition
  const handleSampleTransition = (sample: LabSample, targetStatus: any) => {
    const res = transitionSampleStatus(sample, targetStatus, measAnalyst, `User transitioned sample to ${targetStatus}`);
    if (!res.success) {
      alert(`TRANSITION REJECTED: ${res.errorMessage}`);
      return;
    }

    const updated = samples.map(s => s.sampleId === sample.sampleId ? res.entity! : s);
    setSamples(updated);

    const lastAudit = auditChain.length > 0 ? auditChain[auditChain.length - 1] : undefined;
    const audit = createAuditRecord(
      measAnalyst,
      'TRANSITION_SAMPLE_STATUS',
      'SAMPLE',
      sample.sampleId,
      { status: res.previousStatus },
      { status: res.newStatus },
      `Sample state changed from ${res.previousStatus} to ${res.newStatus}`,
      lastAudit
    );
    setAuditChain([...auditChain, audit]);
  };

  // Handle Measurement Correction
  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingMeas) return;

    const valNum = parseFloat(correctionNewVal);
    if (isNaN(valNum)) return;

    const { correction, updatedOriginalMeasurement } = createMeasurementCorrection(
      correctingMeas,
      valNum,
      correctingMeas.unit,
      correctionReason || 'Data transcription error correction',
      measAnalyst,
      'QC_SUPERVISOR_APPROVAL'
    );

    setCorrections([correction, ...corrections]);
    setMeasurements(measurements.map(m => m.measurementId === correctingMeas.measurementId ? updatedOriginalMeasurement : m));

    const lastAudit = auditChain.length > 0 ? auditChain[auditChain.length - 1] : undefined;
    const audit = createAuditRecord(
      measAnalyst,
      'APPLY_MEASUREMENT_CORRECTION',
      'CORRECTION',
      correction.correctionId,
      { oldValue: correctingMeas.value },
      { newValue: valNum, reason: correctionReason },
      `Measurement correction approved for ${correctingMeas.parameterName}`,
      lastAudit
    );
    setAuditChain([...auditChain, audit]);

    setCorrectingMeas(null);
    setCorrectionNewVal('');
    setCorrectionReason('');
  };

  // Check audit chain validity
  const auditVerification = verifyAuditTrailChain(auditChain);
  const activeTest = tests.find(test => test.testId === selectedTestId);
  const isPHTest = activeTest?.parameterKey === 'ph';

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> Clean-Room LIMS & Scientific Evidence Chain
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
              <TestTube className="w-6 h-6 text-cyan-400" />
              Laboratory Information Management System (LIMS)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Enforce sample custody, calibrate instrument verification, append immutable audit trails, and validate release criteria.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">Audit Hash Chain:</span>
            {auditChain.length === 0 ? (
              <span className="text-amber-400 font-bold">No laboratory audit events yet</span>
            ) : auditVerification.isValid ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Cryptographically Intact ({auditChain.length} blocks)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> Chain Broken at #{auditVerification.brokenIndex}
              </span>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-800/80 pt-4">
          {[
            { id: 'samples', label: '1. Sample Management', icon: Barcode },
            { id: 'tests', label: '2. Analytical Tests', icon: Activity },
            { id: 'results', label: '3. Results & Evidence', icon: FileCheck2 },
            { id: 'instruments', label: '4. Instruments & Calibration', icon: Layers },
            { id: 'audit', label: '5. Hash-Chain Audit Trail', icon: History },
            { id: 'release', label: '6. Release Gate Evidence Matrix', icon: Award },
            { id: 'spectroscopy', label: '7. OpenSpecy FTIR / Raman', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  active
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {limsMessage && (
        <div role="status" className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-3 text-xs text-cyan-100">
          {limsMessage}
        </div>
      )}

      {/* SECTION 1: SAMPLE MANAGEMENT */}
      {activeSection === 'samples' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Samples List */}
            <div className="lg:col-span-2 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-cyan-400" />
                  Active Laboratory Samples ({samples.length})
                </h3>
                <span className="text-xs text-slate-400">Strict Physical Custody</span>
              </div>

              <div className="space-y-3">
                {samples.length === 0 && (
                  <p className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 text-xs text-slate-300">
                    No physical laboratory samples are registered yet. This workspace starts empty and does not contain simulated batches or test results.
                  </p>
                )}
                {samples.map(s => (
                  <div
                    key={s.sampleId}
                    onClick={() => setSelectedSampleId(s.sampleId)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      selectedSampleId === s.sampleId
                        ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md'
                        : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-300 font-bold text-sm">{s.sampleId}</span>
                          <span className="text-slate-500 font-mono text-xs">({s.barcode})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            s.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            s.status === 'IN_TESTING' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Batch: <span className="text-slate-200 font-medium">{s.batchId}</span> • Formula: <span className="text-slate-200">{s.formulaId} (v{s.formulaVersion})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Validation status: <span className="font-mono text-amber-300">{formulaVersions.find(v => v.formulaId === s.formulaId && v.formulaVersion === s.formulaVersion)?.labValidationStatus || 'INSUFFICIENT_EVIDENCE'}</span>
                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-400">
                        <div>Custodian: <span className="text-slate-300">{s.custodian}</span></div>
                        <div className="text-[11px] text-slate-500">{s.storageLocation}</div>
                      </div>
                    </div>

                    {/* Transition Controls */}
                    <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-400">Advance Status:</span>
                      {s.status === 'CREATED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSampleTransition(s, 'RECEIVED'); }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold"
                        >
                          → Receive at QC
                        </button>
                      )}
                      {s.status === 'RECEIVED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSampleTransition(s, 'QUEUED'); }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold"
                        >
                          → Queue for Testing
                        </button>
                      )}
                      {s.status === 'QUEUED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSampleTransition(s, 'IN_TESTING'); }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold"
                        >
                          → Start Testing
                        </button>
                      )}
                      {s.status === 'IN_TESTING' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSampleTransition(s, 'TEST_COMPLETE'); }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold"
                        >
                          → Complete Testing
                        </button>
                      )}
                      {s.status === 'TEST_COMPLETE' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSampleTransition(s, 'PENDING_REVIEW'); }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold"
                        >
                          → Submit for Review
                        </button>
                      )}
                      {s.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSampleTransition(s, 'APPROVED'); }}
                            className="px-2 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-bold border border-emerald-600/40"
                          >
                            ✓ Approve Sample
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSampleTransition(s, 'REJECTED'); }}
                            className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-xs font-bold border border-rose-600/40"
                          >
                            ✗ Reject Sample
                          </button>
                        </>
                      )}
                      {s.status === 'REJECTED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSampleTransition(s, 'PENDING_REVIEW'); }}
                          className="px-2 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-300 text-xs font-semibold border border-amber-600/40"
                        >
                          Reopen Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Draw New Sample Drawer */}
            <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Draw New Sample
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Target Formula</label>
                  <select
                    value={selectedFormulaId}
                    onChange={(e) => setSelectedFormulaId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {FORMULAS.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={e => setBatchNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Batch Operator / Sampler</label>
                  <input
                    type="text"
                    required
                    value={batchOperator}
                    onChange={e => setBatchOperator(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Target Batch (kg)</label>
                    <input type="number" min="0.001" step="any" required value={targetBatchKg} onChange={e => setTargetBatchKg(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Actual Batch (kg)</label>
                    <input type="number" min="0.001" step="any" required value={actualBatchKg} onChange={e => setActualBatchKg(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const f = FORMULAS.find(x => x.id === selectedFormulaId);
                    const targetKg = Number(targetBatchKg);
                    const actualKg = Number(actualBatchKg);
                    if (!f || !batchNumber.trim() || !batchOperator.trim() || !Number.isFinite(targetKg) || targetKg <= 0 || !Number.isFinite(actualKg) || actualKg <= 0) {
                      setLimsMessage('Select a formula and enter a batch number, operator, and positive target/actual batch masses.');
                      return;
                    }

                    const composition = f.ingredients.map(i => {
                      const percentage = i.percent ?? i.percentageInFormula ?? (i as any).percentage;
                      return {
                        id: i.id,
                        name: i.name,
                        percentage: percentage === undefined || percentage === null ? undefined : Number(percentage),
                        activeMatterPct: i.activeMatterPct ?? i.activePercent ?? (i as any).activeDefault,
                        costPerKg: i.costPerKg,
                        category: i.category,
                        function: i.function,
                      };
                    });
                    if (composition.some(i => i.percentage === undefined || !Number.isFinite(i.percentage))) {
                      setLimsMessage('Formula composition has missing or invalid ingredient percentages. Resolve them before registering a physical batch.');
                      return;
                    }
                    const missingActiveMatter = composition.filter(i => i.activeMatterPct === undefined || !Number.isFinite(Number(i.activeMatterPct))).map(i => i.name);

                    const v = createFormulaVersionSnapshot(
                      f.id,
                      String((f as any).version ?? '1.0.0'),
                      f.name,
                      f.category,
                      composition as any,
                      batchOperator.trim(),
                      missingActiveMatter.length ? `Missing active matter data: ${missingActiveMatter.join(', ')}` : undefined,
                    );
                    v.labValidationStatus = 'LAB_VALIDATION_REQUIRED';
                    v.validationStatusReason = 'A physical batch was registered. Complete the generated product-specific lab tests and obtain authorized review.';

                    const b = createBatchRecord(v, batchNumber.trim(), targetKg, actualKg, batchOperator.trim());
                    const s = drawLabSample(b, v, 'FINISHED_PRODUCT', batchOperator.trim());
                    const newTs = generateApplicableTestsForSample(s, f.category);

                    setFormulaVersions([...formulaVersions, v]);
                    setBatches([...batches, b]);
                    setSamples([s, ...samples]);
                    setTests([...newTs, ...tests]);
                    setSelectedSampleId(s.sampleId);

                    const audit = createAuditRecord(batchOperator.trim(), 'DRAW_NEW_SAMPLE', 'SAMPLE', s.sampleId, null, s, `Sample drawn for ${f.name}`);
                    setAuditChain([...auditChain, audit]);
                    setLimsMessage(missingActiveMatter.length
                      ? `Batch and sample registered. Active-matter specifications remain unknown for: ${missingActiveMatter.join(', ')}.`
                      : 'Batch and sample registered from the selected formula version.');
                    setBatchNumber('');
                    setTargetBatchKg('');
                    setActualBatchKg('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-4"
                >
                  <Barcode className="w-4 h-4" />
                  Register Batch & Draw Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ANALYTICAL TESTS */}
      {activeSection === 'tests' && (
        <div className="space-y-5">
        <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-base font-bold text-white">Validation Plan Checklist</h3>
          <p className="text-xs text-amber-300">Planning guide only. Items need authorized method/specification review; no pass limits are implied.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {validationPlan.map(item => <div key={item.id} className="rounded-lg border border-slate-700 p-3">
              <div className="flex justify-between gap-2"><span className="text-sm text-white">{item.area.replaceAll('_', ' ')}</span><span className="text-[10px] text-amber-300">{item.status.replaceAll('_', ' ')}</span></div>
              <p className="text-xs text-slate-300 mt-1">{item.purpose}</p><p className="text-[11px] text-slate-500 mt-1">{item.reviewNote}</p>
            </div>)}
          </div>
        </div>
        <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Analytical Test Schedule & Method Routing ({tests.length})
            </h3>
            <span className="text-xs text-slate-400">Physical Form Constraints Enforced</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Test ID</th>
                  <th className="p-3">Sample ID</th>
                  <th className="p-3">Parameter Name</th>
                  <th className="p-3">Test Method Reference</th>
                  <th className="p-3">Required Unit</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tests.map(t => (
                  <tr key={t.testId} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono text-cyan-300">{t.testId}</td>
                    <td className="p-3 font-mono text-slate-300">{t.sampleId}</td>
                    <td className="p-3 font-medium text-white">{t.parameterName}</td>
                    <td className="p-3 text-slate-400">
                      {CANONICAL_TEST_METHODS.find(method => method.methodId === t.testMethodId)?.procedureReference || t.testMethodId}
                      <div className="mt-1 text-[10px] font-mono text-amber-300">
                        Acceptance: {CANONICAL_TEST_METHODS.find(method => method.methodId === t.testMethodId)?.acceptanceCriteriaStatus || 'NEEDS_EXPERT_REVIEW'}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-amber-300">{t.standardUnit}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                        t.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {t.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => {
                            setSelectedTestId(t.testId);
                            setMeasUnit(t.standardUnit);
                            setActiveSection('results');
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/30"
                        >
                          Record Measurement →
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-medium">✓ Logged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* SECTION 3: RESULTS & EVIDENCE */}
      {activeSection === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Measurement Entry Panel */}
          <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-cyan-400" />
              Enter Analytical Measurement
            </h3>

            <form onSubmit={handleRecordMeasurement} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Test</label>
                <select
                  value={selectedTestId}
                  onChange={(e) => {
                    setSelectedTestId(e.target.value);
                    const t = tests.find(x => x.testId === e.target.value);
                    if (t) setMeasUnit(t.standardUnit);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {tests.map(t => (
                    <option key={t.testId} value={t.testId}>
                      {t.parameterName} ({t.sampleId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Numerical Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={measValue}
                    onChange={(e) => setMeasValue(e.target.value)}
                    placeholder="e.g. 8.45"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Standard Unit *</label>
                  <input
                    type="text"
                    value={measUnit}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-amber-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Calibrated Instrument *</label>
                <select
                  value={measInstrumentId}
                  onChange={(e) => setMeasInstrumentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  required
                >
                  <option value="">Select a registered physical instrument</option>
                  {instruments.filter(inst => inst.classification === 'USER_REGISTERED').map(inst => (
                    <option key={inst.instrumentId} value={inst.instrumentId}>
                      {inst.name} [{inst.calibrationStatus}]
                    </option>
                  ))}
                </select>
                {!instruments.some(inst => inst.classification === 'USER_REGISTERED') && (
                  <p className="mt-1 text-amber-300">Register your actual instrument in Instruments &amp; Calibration before entering a measurement.</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Actual Test Temperature (°C) *</label>
                <input type="number" step="any" required value={measTemperature} onChange={e => setMeasTemperature(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
              </div>

              {isPHTest && (
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-700 p-3">
                  <label className="text-slate-400">Sample Concentration *
                    <input type="number" min="0.000001" step="any" required value={measSampleConcentration} onChange={e => setMeasSampleConcentration(e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
                  </label>
                  <label className="text-slate-400">Concentration Unit *
                    <select value={measSampleConcentrationUnit} onChange={e => setMeasSampleConcentrationUnit(e.target.value as '%' | 'g/L')} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"><option value="%">% (as prepared)</option><option value="g/L">g/L</option></select>
                  </label>
                  <label className="text-slate-400">Dilution Water Hardness (ppm as CaCO₃) *
                    <input type="number" min="0" step="any" required value={measDilutionWaterHardness} onChange={e => setMeasDilutionWaterHardness(e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
                  </label>
                  <label className="text-slate-400">Dilution Water Source / Type *
                    <input required value={measDilutionWaterDescription} onChange={e => setMeasDilutionWaterDescription(e.target.value)} placeholder="Record actual water source/type" className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
                  </label>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Analyst Identity *</label>
                <input
                  type="text"
                  required
                  value={measAnalyst}
                  onChange={(e) => setMeasAnalyst(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observation Notes</label>
                <textarea
                  rows={2}
                  value={measNotes}
                  onChange={(e) => setMeasNotes(e.target.value)}
                  placeholder="Optional analyst observations / condition notes"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-4"
              >
                <FileCheck2 className="w-4 h-4" />
                Commit Verified Measurement
              </button>
            </form>
          </div>

          {/* Results Table & Evidence Ledger */}
          <div className="lg:col-span-2 bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
                Empirical Measurement Ledger ({measurements.length})
              </h3>
              <span className="text-xs text-slate-400">Append-Only Immutability</span>
            </div>

            {measurements.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                Zero empirical measurements recorded yet. Select an analytical test on the left to log results.
              </div>
            ) : (
              <div className="space-y-3">
                {measurements.map(m => (
                  <div key={m.measurementId} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-700/60 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">{m.parameterName}</span>
                          <span className="text-cyan-400 font-mono font-bold text-base">{m.value} {m.unit}</span>
                          {m.isCorrected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Corrected
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ID: <span className="font-mono text-slate-300">{m.measurementId}</span> • Analyst: <span className="text-slate-200">{m.analyst}</span>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.instrumentCalibrationStatusAtMeasurement === 'VALID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          Instrument: {m.instrumentCalibrationStatusAtMeasurement}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{m.measuredAt.replace('T', ' ').substring(0, 19)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                      <div>Method: <span className="text-slate-300">{m.method}</span></div>
                      <button
                        onClick={() => {
                          setCorrectingMeas(m);
                          setCorrectionNewVal(m.value.toString());
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium flex items-center gap-1 text-[11px]"
                      >
                        <Edit3 className="w-3 h-3" /> Propose Correction
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: INSTRUMENTS & CALIBRATION */}
      {activeSection === 'instruments' && (
        <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Analytical Instrument Calibration Registry ({instruments.length})
            </h3>
            <span className="text-xs text-slate-400">Calibration Validates Evidence Level</span>
          </div>

          <form onSubmit={handleRegisterInstrument} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-white">Register your laboratory instrument</h4>
              <p className="mt-1 text-xs text-amber-200">Only user-registered instruments can record measurements. Enter actual serial/calibration references; the app does not independently authenticate certificates or laboratory accreditation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {([
                ['instrumentId', 'Instrument ID'], ['name', 'Instrument Name'], ['manufacturer', 'Manufacturer'],
                ['model', 'Model'], ['serialNumber', 'Serial Number'], ['calibrationCertificateReference', 'Calibration Certificate Reference'],
                ['location', 'Location'], ['custodian', 'Custodian'], ['registeredBy', 'Registered By'],
              ] as Array<[keyof UserInstrumentRegistration, string]>).map(([field, label]) => (
                <label key={field} className="text-slate-400">
                  {label} *
                  <input required value={instrumentDraft[field]} onChange={e => updateInstrumentDraft(field, e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
                </label>
              ))}
              <label className="text-slate-400">Instrument Type *
                <select required value={instrumentDraft.instrumentType} onChange={e => updateInstrumentDraft('instrumentType', e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
                  <option value="">Select type</option>
                  {['pH_METER','AUTOMATED_TITRATOR','TERGOTOMETER','SPECTROMETER_FTIR','VISCOMETER','DENSITOMETER','MOISTURE_ANALYZER','BULK_DENSITY_TESTER'].map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="text-slate-400">Last Calibration Date *
                <input type="date" required value={instrumentDraft.lastCalibrationDate} onChange={e => updateInstrumentDraft('lastCalibrationDate', e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
              </label>
              <label className="text-slate-400">Next Calibration Due *
                <input type="date" required value={instrumentDraft.nextCalibrationDate} onChange={e => updateInstrumentDraft('nextCalibrationDate', e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
              </label>
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold">Register Instrument</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instruments.map(inst => (
              <div key={inst.instrumentId} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-300 font-bold text-xs">{inst.instrumentId}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inst.calibrationStatus === 'VALID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    inst.calibrationStatus === 'DUE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {inst.calibrationStatus}
                  </span>
                </div>

                <div className="text-sm font-bold text-white">{inst.name}</div>
                <div className="text-xs text-slate-400">
                  {inst.manufacturer} • Model: <span className="text-slate-200">{inst.model}</span> (S/N: {inst.serialNumber})
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>Next Calibration: <span className="text-slate-200 font-mono">{inst.nextCalibrationDate || 'N/A'}</span></div>
                  <div>Certificate Ref: <span className="text-slate-300 font-mono">{inst.calibrationCertificateReference || 'N/A'}</span></div>
                  <div>Location: <span className="text-slate-300">{inst.location}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: AUDIT TRAIL */}
      {activeSection === 'audit' && (
        <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              Cryptographic Audit Chain Ledger ({auditChain.length} Blocks)
            </h3>
            <span className={`text-xs font-mono ${auditChain.length === 0 ? 'text-amber-400' : auditVerification.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
              {auditChain.length === 0 ? 'No audit events yet' : auditVerification.isValid ? 'Chain Integrity: Intact' : `Chain Broken at #${auditVerification.brokenIndex}`}
            </span>
          </div>

          {auditChain.length === 0 ? <p className="text-sm text-slate-400">No lab audit events have been recorded in this local session.</p> : <div className="space-y-3">
            {auditChain.map((entry, idx) => (
              <div key={entry.auditId} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 font-mono text-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400">
                  <span className="text-cyan-300 font-bold">#{idx + 1} {entry.auditId}</span>
                  <span className="text-slate-500">{entry.timestamp}</span>
                </div>

                <div className="text-white font-sans font-medium text-sm flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono">{entry.action}</span>
                  <span>{entry.reason}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                  <div className="text-slate-400 truncate">Prev Hash: <span className="text-slate-500">{entry.previousHash}</span></div>
                  <div className="text-slate-400 truncate">Block Hash: <span className="text-emerald-400">{entry.newHash}</span></div>
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}

      {/* SECTION 6: RELEASE EVIDENCE HIERARCHY */}
      {activeSection === 'release' && (
        <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Scientific Evidence Level Hierarchy & Release Gates
          </h3>
          <p className="text-xs text-slate-400">
            Detergent Formula Expert enforces strict non-promotion discipline. Theoretical calculations and raw spectral matches never automatically promote to certified or lab-validated release status.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              { level: 'CALCULATED', color: 'slate', desc: 'Theoretical stoichiometry / mathematical solver prediction. Never release-authoritative on its own.' },
              { level: 'LAB_TESTED', color: 'cyan', desc: 'Single benchtop empirical measurement on uncertified / uncalibrated bench.' },
              { level: 'LAB_VALIDATED', color: 'amber', desc: 'Replicate measurements on verified calibrated instrument reviewed by senior analyst.' },
              { level: 'CERTIFIED', color: 'emerald', desc: 'Formal third-party accredited standard certificate (ISO / ASTM / GLP compliant).' }
            ].map(tier => (
              <div key={tier.level} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                  tier.level === 'CERTIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  tier.level === 'LAB_VALIDATED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  tier.level === 'LAB_TESTED' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {tier.level}
                </span>
                <p className="text-xs text-slate-400 pt-1">{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 7: OPENSPECY SPECTRAL ANALYSIS */}
      {activeSection === 'spectroscopy' && (
        <SpectralAnalysisDashboard />
      )}

      {/* CORRECTION MODAL */}
      {correctingMeas && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              Propose Measurement Correction
            </h3>
            <p className="text-xs text-slate-400">
              In accordance with scientific audit compliance, original measurements are immutable. A correction record will be appended to the hash chain.
            </p>

            <form onSubmit={handleSubmitCorrection} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Parameter</label>
                <div className="text-white font-medium p-2 bg-slate-900 rounded-lg">
                  {correctingMeas.parameterName} (Original: {correctingMeas.value} {correctingMeas.unit})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Corrected Value *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={correctionNewVal}
                  onChange={(e) => setCorrectionNewVal(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason for Revision *</label>
                <textarea
                  rows={3}
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Document the exact technical reason for correction"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectingMeas(null)}
                  className="w-1/2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Approve Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
