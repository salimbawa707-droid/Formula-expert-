import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  ShieldCheck,
  Award,
  Sliders,
  BarChart2,
} from 'lucide-react';
import {
  SpectrumRecord,
  SpectralTechnique,
  BaselineCorrectionMethod,
  SmoothingMethod,
  NormalizationMethod,
  MatchingMetric,
  SpectralConformityReport,
} from '../utils/spectroscopy/types';
import { parseJcampDx } from '../utils/spectroscopy/jcampReader';
import { parseCsvSpectrum } from '../utils/spectroscopy/csvSpectrumReader';
import { validateSpectrumRecord } from '../utils/spectroscopy/spectralFileValidator';
import { runSpectralPreprocessing } from '../utils/spectroscopy/spectralPreprocessingEngine';
import { detectSpectralPeaks } from '../utils/spectroscopy/spectralPeakDetectionEngine';
import {
  CANONICAL_SPECTRAL_REFERENCES,
  getSpectralReferenceById,
} from '../utils/spectroscopy/spectralReferenceService';
import { evaluateSpectralConformity } from '../utils/spectroscopy/spectralConformEngine';
import {
  persistSpectralRecordToLims,
  verifySpectrumLimsPersistenceStatus
} from '../utils/spectroscopy/spectralLimsPersistence';
import { CANONICAL_LAB_INSTRUMENTS } from '../domain/lims/instrument';
import { FORMULAS } from '../data/formulas';

export const SpectralAnalysisDashboard: React.FC = () => {
  // Active state
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>(CANONICAL_SPECTRAL_REFERENCES[0].referenceId);
  const [technique, setTechnique] = useState<SpectralTechnique>('FTIR');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>('INST-FTIR-001');

  // Preprocessing config
  const [baselineMethod, setBaselineMethod] = useState<BaselineCorrectionMethod>('POLYNOMIAL');
  const [polyOrder, setPolyOrder] = useState<number>(2);
  const [smoothingMethod, setSmoothingMethod] = useState<SmoothingMethod>('SAVITZKY_GOLAY');
  const [smoothingWindow, setSmoothingWindow] = useState<number>(7);
  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>('VECTOR');
  const metric: MatchingMetric = 'PEARSON_CORRELATION';

  // Active Spectrum State
  const initialRef = CANONICAL_SPECTRAL_REFERENCES[0];
  const initialSpectrum: SpectrumRecord = {
    id: 'SPEC-DEMO-LABSA-01',
    title: '[DEMO / SYNTHETIC] Reference LABSA 96% Profile — NOT LABORATORY EVIDENCE',
    technique: 'FTIR',
    axis: 'WAVENUMBER_CM1',
    x: initialRef.x,
    // Add slight realistic noise to the initial demo spectrum
    y: initialRef.y.map((v, i) => Math.max(0, v + (Math.sin(i * 0.15) * 0.015) + (i > 500 && i < 700 ? 0.03 : 0))),
    units: { x: '1/cm', y: 'Absorbance' },
    sourceFileName: 'demo_labsa_synthetic_envelope.jdx',
    fileFormat: 'JCAMP',
    sourceType: 'DEMO',
    instrumentId: 'INST-FTIR-001',
    sampleId: 'SMP-DEMO-LABSA-001',
    batchId: 'BATCH-DEMO-2026',
    formulaId: FORMULAS[0].id,
    formulaVersion: '1.0.0',
    acquisitionMetadata: {
      instrumentName: 'Thermo Nicolet iS20 ATR (Demo Mode)',
      resolutionCm1: 2.0,
      scanCount: 32,
    },
    rawSpectrumHash: '8a9f02c4b781e9d3a4f65c890123ef456789abcde0123456789abcdef0123456',
    isRaw: true,
    createdAt: new Date().toISOString(),
    createdBy: 'Demo System',
  };

  const [activeSpectrum, setActiveSpectrum] = useState<SpectrumRecord>(initialSpectrum);
  const [showRawOverlay, setShowRawOverlay] = useState<boolean>(true);
  const [showReferenceOverlay, setShowReferenceOverlay] = useState<boolean>(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [limsStatus, setLimsStatus] = useState<'NOT_REGISTERED' | 'SAVING' | 'PERSISTED' | 'ALREADY_PERSISTED' | 'FAILED'>('NOT_REGISTERED');
  const [limsError, setLimsError] = useState<string | null>(null);
  const [persistedEvidenceId, setPersistedEvidenceId] = useState<string | null>(null);

  // Authoritatively re-verify LIMS persistence status from LIMS store whenever activeSpectrum changes
  useEffect(() => {
    const statusCheck = verifySpectrumLimsPersistenceStatus(activeSpectrum);
    if (statusCheck.isPersisted) {
      setLimsStatus('PERSISTED');
      setPersistedEvidenceId(statusCheck.evidenceId || null);
      setLimsError(null);
    } else {
      setLimsStatus('NOT_REGISTERED');
      setPersistedEvidenceId(null);
      setLimsError(null);
    }
  }, [activeSpectrum]);

  // Validation
  const validationResult = useMemo(() => {
    return validateSpectrumRecord(activeSpectrum);
  }, [activeSpectrum]);

  // Preprocessing
  const preprocessedResult = useMemo(() => {
    return runSpectralPreprocessing(activeSpectrum, {
      baselineMethod,
      baselinePolyOrder: polyOrder,
      smoothingMethod,
      smoothingWindowSize: smoothingWindow,
      normalizationMethod,
    });
  }, [activeSpectrum, baselineMethod, polyOrder, smoothingMethod, smoothingWindow, normalizationMethod]);

  // Peak Detection
  const peakResult = useMemo(() => {
    const proc = preprocessedResult.spectrum;
    return detectSpectralPeaks(proc.x, proc.y, {
      technique: proc.technique,
      minProminence: 0.03,
    });
  }, [preprocessedResult]);

  // Reference & Conformity Evaluation
  const selectedRef = useMemo(() => {
    return getSpectralReferenceById(selectedReferenceId) || CANONICAL_SPECTRAL_REFERENCES[0];
  }, [selectedReferenceId]);

  const conformityReport: SpectralConformityReport = useMemo(() => {
    const instrument = CANONICAL_LAB_INSTRUMENTS.find(i => i.instrumentId === selectedInstrumentId);
    const isCalValid = instrument ? instrument.calibrationStatus === 'VALID' : true;

    return evaluateSpectralConformity(activeSpectrum, selectedRef, {
      metric,
      minCorrelationScore: 0.85,
      minDiagnosticPeakRatio: 0.75,
      analyst: activeSpectrum.createdBy,
      instrumentId: selectedInstrumentId,
      instrumentCalibrationValid: isCalValid,
    });
  }, [activeSpectrum, selectedRef, metric, selectedInstrumentId]);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setLimsStatus('NOT_REGISTERED');
    setPersistedEvidenceId(null);

    // Max 10MB file limit
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB maximum analytical limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const fileName = file.name.toLowerCase();
      let parseRes;

      if (fileName.endsWith('.jdx') || fileName.endsWith('.dx') || fileName.endsWith('.jcamp')) {
        parseRes = parseJcampDx(content, file.name);
      } else {
        parseRes = parseCsvSpectrum(content, file.name, technique);
      }

      if (parseRes.success && parseRes.spectrum) {
        setActiveSpectrum(parseRes.spectrum);
        if (parseRes.spectrum.technique !== 'UNKNOWN') {
          setTechnique(parseRes.spectrum.technique);
        }
      } else {
        setUploadError(parseRes.errors.join(' ') || 'Failed to parse spectral file.');
      }
    };
    reader.readAsText(file);
  };

  // Push to LIMS Evidence Action with Authoritative Persistence & Read-Back Verification
  const handlePushToLims = () => {
    setLimsStatus('SAVING');
    setLimsError(null);

    const instrument = CANONICAL_LAB_INSTRUMENTS.find(i => i.instrumentId === selectedInstrumentId);
    
    const result = persistSpectralRecordToLims(
      preprocessedResult.spectrum,
      conformityReport,
      instrument
    );

    if (result.success && result.readBackVerified) {
      if (result.isDuplicate) {
        setLimsStatus('ALREADY_PERSISTED');
      } else {
        setLimsStatus('PERSISTED');
      }
      setPersistedEvidenceId(result.persistedRecordId || null);
      setLimsError(null);
    } else {
      setLimsStatus('FAILED');
      setPersistedEvidenceId(null);
      setLimsError(result.error || 'LIMS persistence failed read-back verification.');
    }
  };

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 260;
  const padding = { top: 20, right: 25, bottom: 35, left: 55 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  // Chart Coordinate Mappings
  const proc = preprocessedResult.spectrum;
  const xMin = proc.x[0] || 400;
  const xMax = proc.x[proc.x.length - 1] || 4000;

  // Find max Y for scaling
  let maxY = 0.01;
  for (let i = 0; i < proc.y.length; i++) {
    if (proc.y[i] > maxY) maxY = proc.y[i];
  }
  if (showReferenceOverlay) {
    for (let i = 0; i < selectedRef.y.length; i++) {
      if (selectedRef.y[i] > maxY) maxY = selectedRef.y[i];
    }
  }

  // Generate SVG Path
  const getSvgPath = (xArr: number[], yArr: number[]) => {
    if (xArr.length === 0) return '';
    return xArr.reduce((acc, xVal, i) => {
      // Invert X axis for FTIR standard convention (4000 on left, 400 on right)
      const px = padding.left + ((xMax - xVal) / (xMax - xMin || 1)) * innerW;
      const py = padding.top + innerH - (yArr[i] / maxY) * innerH;
      return `${acc} ${i === 0 ? 'M' : 'L'} ${px.toFixed(1)},${py.toFixed(1)}`;
    }, '');
  };

  const processedPath = getSvgPath(proc.x, proc.y);
  const rawPath = getSvgPath(activeSpectrum.x, activeSpectrum.y);
  const refPath = getSvgPath(selectedRef.x, selectedRef.y);

  return (
    <div className="space-y-6 text-left">
      {/* Top Scientific Banner */}
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> OpenSpecy Analytical Vibrational Spectroscopy Subsystem
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-cyan-400" />
              Scientific Spectral Analysis & Conformity Verification
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deterministic FTIR/Raman preprocessing, baseline subtraction, Savitzky-Golay noise filtering, peak detection, and reference matching.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/20">
              <Upload className="w-4 h-4" />
              Upload Spectrum (.jdx / .csv / .txt)
              <input type="file" accept=".jdx,.dx,.jcamp,.csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {uploadError && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {uploadError}
          </div>
        )}
      </div>

      {/* Spectrum Provenance Isolation Banner */}
      {(() => {
        const isDemoSynthOrRef =
          activeSpectrum.sourceType === 'DEMO' ||
          activeSpectrum.sourceType === 'SYNTHETIC' ||
          activeSpectrum.sourceType === 'REFERENCE' ||
          activeSpectrum.sourceType === 'SIMULATED' ||
          activeSpectrum.id.includes('DEMO') ||
          activeSpectrum.id.includes('SYNTH') ||
          activeSpectrum.id.includes('REF') ||
          activeSpectrum.title.includes('DEMO') ||
          activeSpectrum.title.includes('SYNTHETIC') ||
          activeSpectrum.title.includes('REFERENCE');

        const isUserUploaded = activeSpectrum.sourceType === 'USER_UPLOADED';

        if (isDemoSynthOrRef) {
          return (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
              <span className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                DEMO / SYNTHETIC / REFERENCE — NOT LABORATORY EVIDENCE
              </span>
              <span className="text-[11px] text-amber-300/80 font-normal">
                Algorithm preview & reference standard mode. Cannot qualify as physical laboratory test data.
              </span>
            </div>
          );
        }

        if (isUserUploaded) {
          return (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3.5 text-cyan-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
              <span className="flex items-center gap-2 font-bold text-cyan-400">
                <Upload className="w-4 h-4 shrink-0" />
                USER UPLOADED — LAB STATUS NOT ESTABLISHED
              </span>
              <span className="text-[11px] text-cyan-300/80 font-normal">
                Imported file requires instrument calibration & verified chain of custody for physical lab validation.
              </span>
            </div>
          );
        }

        return null;
      })()}

      {/* Main Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Chart & Peaks (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Spectral Viewer Panel */}
          <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-cyan-400" />
                  {activeSpectrum.title}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {proc.technique} | Range: {xMin.toFixed(0)} - {xMax.toFixed(0)} cm⁻¹ | Points: {proc.x.length} | Source: {activeSpectrum.sourceFileName} | <span className={validationResult.isValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{validationResult.status}</span>
                </span>
              </div>

              {/* Chart Overlay Toggles */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowRawOverlay(!showRawOverlay)}
                  className={`px-2.5 py-1 rounded-lg border font-mono transition flex items-center gap-1.5 ${
                    showRawOverlay
                      ? 'bg-slate-800 text-slate-300 border-slate-600'
                      : 'bg-transparent text-slate-500 border-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Raw
                </button>
                <button
                  type="button"
                  onClick={() => setShowReferenceOverlay(!showReferenceOverlay)}
                  className={`px-2.5 py-1 rounded-lg border font-mono transition flex items-center gap-1.5 ${
                    showReferenceOverlay
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-transparent text-slate-500 border-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Reference ({selectedRef.materialName.split(' ')[0]})
                </button>
              </div>
            </div>

            {/* SVG Spectral Graph Canvas */}
            <div className="w-full overflow-x-auto bg-slate-950/90 rounded-xl p-3 border border-slate-800">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none">
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
                  const yPos = padding.top + innerH * (1 - ratio);
                  return (
                    <g key={ratio}>
                      <line x1={padding.left} y1={yPos} x2={chartWidth - padding.right} y2={yPos} stroke="#1e293b" strokeDasharray="3 3" />
                      <text x={padding.left - 8} y={yPos + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                        {(ratio * maxY).toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis ticks (wavenumber inverted: 4000 to 500) */}
                {[4000, 3500, 3000, 2500, 2000, 1500, 1000, 500].map(cm => {
                  if (cm < xMin || cm > xMax) return null;
                  const xPos = padding.left + ((xMax - cm) / (xMax - xMin || 1)) * innerW;
                  return (
                    <g key={cm}>
                      <line x1={xPos} y1={padding.top} x2={xPos} y2={chartHeight - padding.bottom} stroke="#1e293b" strokeDasharray="2 2" />
                      <text x={xPos} y={chartHeight - padding.bottom + 16} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        {cm}
                      </text>
                    </g>
                  );
                })}

                {/* Raw Spectrum Path (if enabled) */}
                {showRawOverlay && (
                  <path d={rawPath} fill="none" stroke="#64748b" strokeWidth="1" opacity="0.6" />
                )}

                {/* Reference Spectrum Path (if enabled) */}
                {showReferenceOverlay && (
                  <path d={refPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" />
                )}

                {/* Main Processed Spectrum Path */}
                <path d={processedPath} fill="none" stroke="#06b6d4" strokeWidth="2" />

                {/* Peak Markers */}
                {peakResult.peaks.slice(0, 12).map((p, idx) => {
                  const px = padding.left + ((xMax - p.position) / (xMax - xMin || 1)) * innerW;
                  const py = padding.top + innerH - (p.intensity / maxY) * innerH;
                  return (
                    <g key={idx}>
                      <circle cx={px} cy={py} r="3" fill="#38bdf8" stroke="#0e1629" strokeWidth="1.5" />
                      <text x={px} y={py - 6} fill="#38bdf8" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                        {p.position.toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {/* Axis Labels */}
                <text x={chartWidth / 2} y={chartHeight - 5} fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
                  Wavenumber (cm⁻¹) [FTIR Inverse Scale]
                </text>
                <text x={14} y={chartHeight / 2} fill="#94a3b8" fontSize="10" textAnchor="middle" transform={`rotate(-90 14 ${chartHeight / 2})`} fontFamily="sans-serif">
                  Absorbance
                </text>
              </svg>
            </div>

            {/* Quick Demo Preload Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-bold">Load Canonical Reference Sample:</span>
              {CANONICAL_SPECTRAL_REFERENCES.map(ref => (
                <button
                  key={ref.referenceId}
                  type="button"
                  onClick={() => {
                    setSelectedReferenceId(ref.referenceId);
                    setActiveSpectrum({
                      id: `SPEC-${ref.referenceId}`,
                      title: `[REFERENCE SPECTRUM] Canonical ${ref.materialName} Profile — NOT LABORATORY EVIDENCE`,
                      technique: ref.technique,
                      axis: ref.axis,
                      x: ref.x,
                      y: ref.y.map((v, i) => Math.max(0, v + (Math.sin(i * 0.1) * 0.012))),
                      units: { x: ref.xUnits, y: ref.yUnits },
                      sourceFileName: `${ref.referenceId.toLowerCase()}.jdx`,
                      fileFormat: 'JCAMP',
                      sourceType: 'REFERENCE',
                      instrumentId: selectedInstrumentId,
                      sampleId: `SMP-REF-${ref.referenceId}`,
                      rawSpectrumHash: ref.referenceId,
                      isRaw: true,
                      acquisitionMetadata: { resolutionCm1: 2.0 },
                      createdAt: new Date().toISOString(),
                      createdBy: 'Reference Standard Library',
                    });
                  }}
                  className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition ${
                    selectedReferenceId === ref.referenceId
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {ref.materialName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Detected Diagnostic Peaks Table */}
          <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Detected Vibrational Peaks ({peakResult.peakCount} Bands Identified)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Noise Floor: σ = {peakResult.noiseEstimate.toFixed(4)}
              </span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2 font-mono">Peak (cm⁻¹)</th>
                    <th className="p-2">Apex Intensity</th>
                    <th className="p-2">Prominence</th>
                    <th className="p-2">FWHM</th>
                    <th className="p-2">SNR</th>
                    <th className="p-2">Tentative Functional Group</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {peakResult.peaks.slice(0, 8).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-2 text-cyan-300 font-bold">{p.position.toFixed(1)}</td>
                      <td className="p-2 text-slate-300">{p.intensity.toFixed(4)}</td>
                      <td className="p-2 text-slate-300">{p.prominence.toFixed(4)}</td>
                      <td className="p-2 text-slate-400">{p.fwhmWidth ? `${p.fwhmWidth.toFixed(1)} cm⁻¹` : '-'}</td>
                      <td className="p-2 text-emerald-400">{p.snr ? `${p.snr}x` : '-'}</td>
                      <td className="p-2 text-slate-300 font-sans">{p.label || 'Unassigned / Fingerprint mode'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Preprocessing Controls & Conformity Result (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Preprocessing Pipeline Controls */}
          <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              OpenSpecy Preprocessing Pipeline
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Baseline Correction</label>
                <select
                  value={baselineMethod}
                  onChange={(e) => setBaselineMethod(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="POLYNOMIAL">Polynomial Subtraction (Degree {polyOrder})</option>
                  <option value="RUBBERBAND">Rubberband Convex Hull</option>
                  <option value="ASLS">Asymmetric Least Squares (AsLS)</option>
                  <option value="NONE">None (Raw Baseline)</option>
                </select>
              </div>

              {baselineMethod === 'POLYNOMIAL' && (
                <div>
                  <label className="block text-slate-400 mb-1">Polynomial Degree ({polyOrder})</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={polyOrder}
                    onChange={(e) => setPolyOrder(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Smoothing & Noise Reduction</label>
                <select
                  value={smoothingMethod}
                  onChange={(e) => setSmoothingMethod(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="SAVITZKY_GOLAY">Savitzky-Golay (Window: {smoothingWindow})</option>
                  <option value="MOVING_AVERAGE">Moving Average</option>
                  <option value="GAUSSIAN">Gaussian Kernel</option>
                  <option value="NONE">None (Raw Signal)</option>
                </select>
              </div>

              {smoothingMethod === 'SAVITZKY_GOLAY' && (
                <div>
                  <label className="block text-slate-400 mb-1">Savitzky-Golay Window ({smoothingWindow} pts)</label>
                  <input
                    type="range"
                    min="3"
                    max="21"
                    step="2"
                    value={smoothingWindow}
                    onChange={(e) => setSmoothingWindow(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Normalization</label>
                <select
                  value={normalizationMethod}
                  onChange={(e) => setNormalizationMethod(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="VECTOR">Vector (Euclidean L2 Norm)</option>
                  <option value="AREA">Integrated Area Normalization</option>
                  <option value="SNV">Standard Normal Variate (SNV)</option>
                  <option value="MIN_MAX">Min-Max (0.0 to 1.0)</option>
                  <option value="NONE">None</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Comparison Reference Standard</label>
                <select
                  value={selectedReferenceId}
                  onChange={(e) => setSelectedReferenceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {CANONICAL_SPECTRAL_REFERENCES.map(ref => (
                    <option key={ref.referenceId} value={ref.referenceId}>
                      {ref.materialName} ({ref.technique})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Spectrometer Instrument</label>
                <select
                  value={selectedInstrumentId}
                  onChange={(e) => setSelectedInstrumentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {CANONICAL_LAB_INSTRUMENTS.filter(i => i.instrumentType.includes('SPECTROMETER') || i.instrumentId.includes('FTIR')).map(i => (
                    <option key={i.instrumentId} value={i.instrumentId}>
                      {i.name} ({i.calibrationStatus})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Conformity & Quality Gate Decision Card */}
          <div className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                Analytical Conformity Report
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                conformityReport.conformStatus === 'PASS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                conformityReport.conformStatus === 'INCONCLUSIVE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {conformityReport.conformStatus}
              </span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg">
                <span className="text-slate-400">Pearson Similarity (r):</span>
                <span className="text-white font-mono font-bold text-sm">
                  {conformityReport.similarityScore.toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg">
                <span className="text-slate-400">Diagnostic Bands Matched:</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {conformityReport.keyPeakResults.filter(k => k.matched).length} / {conformityReport.keyPeakResults.length}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg">
                <span className="text-slate-400">Evidence Classification:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                  {conformityReport.evidenceLevel}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                {conformityReport.summary}
              </p>

              {conformityReport.blockingIssues.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Analytical Caveats:
                  </div>
                  {conformityReport.blockingIssues.map((issue, idx) => (
                    <div key={idx} className="pl-4">• {issue}</div>
                  ))}
                </div>
              )}

              {limsError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {limsError}
                </div>
              )}

              {/* Push to LIMS Action */}
              <button
                type="button"
                onClick={handlePushToLims}
                disabled={limsStatus === 'PERSISTED' || limsStatus === 'ALREADY_PERSISTED' || limsStatus === 'SAVING'}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  limsStatus === 'PERSISTED' || limsStatus === 'ALREADY_PERSISTED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : limsStatus === 'SAVING'
                    ? 'bg-slate-800 text-slate-400 cursor-wait'
                    : limsStatus === 'FAILED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                }`}
              >
                {limsStatus === 'PERSISTED' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Persisted in LIMS Evidence Chain {persistedEvidenceId ? `(${persistedEvidenceId})` : ''}
                  </>
                ) : limsStatus === 'ALREADY_PERSISTED' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Already Registered in LIMS {persistedEvidenceId ? `(${persistedEvidenceId})` : ''}
                  </>
                ) : limsStatus === 'SAVING' ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Saving to LIMS...
                  </>
                ) : limsStatus === 'FAILED' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Retry LIMS Registration
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Register in LIMS Evidence Chain
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
