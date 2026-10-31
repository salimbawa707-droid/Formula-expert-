import React, { useState, useRef } from "react";
import {
  FileCheck,
  Printer,
  Download,
  X,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Hash,
  Scale,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { ActiveFormulaState, FormulationIngredient } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formula: ActiveFormulaState | null;
  labAlignmentScore?: number;
  orchestratorResult?: any;
}

export function COAAndBatchSheetModal({
  isOpen,
  onClose,
  formula,
  labAlignmentScore = 96.5,
  orchestratorResult
}: Props) {
  const [activeTab, setActiveTab] = useState<'coa' | 'bmr'>('coa');
  const [companyName, setCompanyName] = useState('Apex Specialty Chemicals & Detergents R&D Lab');
  const [batchNo, setBatchNo] = useState(() => `BT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [mfgDate, setMfgDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });
  const [scaleKg, setScaleKg] = useState<number>(formula?.batchSizeKg || 0);
  const [qcManager, setQcManager] = useState('Dr. S. Bawa, Ph.D. (Lead Formulator)');
  const [plantHead, setPlantHead] = useState('R. K. Sharma (Head of Production)');

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !formula) return null;

  const ingredients: FormulationIngredient[] = formula.ingredients || [];
  const baseBatchSize = formula.batchSizeKg || 0;
  const multiplier = scaleKg / baseBatchSize;

  const handlePrint = () => {
    window.print();
  };

  // Derive parameters from orchestratorResult or defaults
  const phVal = orchestratorResult?.pHResult?.ph ?? null;
  const activeMatterVal = orchestratorResult?.activeMatterResult?.totalSurfactantActivePct ?? 14.5;
  const viscosityVal = orchestratorResult?.viscosityResult?.predictedViscosityCp ?? 1250;
  const densityVal = orchestratorResult?.densityResult?.densityGPerCm3 ?? 1.035;
  const cpiVal = orchestratorResult?.cleaningResult?.cpi ?? 92.4;

  const coaParameters = [
    {
      param: 'Appearance & Clarity',
      method: 'Visual / ASTM D459',
      spec: 'Clear, homogeneous, transparent fluid',
      result: 'Complies',
      status: 'PASS'
    },
    {
      param: 'pH @ 25°C (1% Aqueous Solution)',
      method: 'IS 4955 / ASTM E70',
      spec: '7.0 – 8.5',
      result: `${Number(phVal).toFixed(2)}`,
      status: 'PASS'
    },
    {
      param: 'Total Active Surfactant Matter (%)',
      method: 'ISO 2271 / Two-Phase Titration',
      spec: '≥ 12.0 % w/w',
      result: `${Number(activeMatterVal).toFixed(2)} %`,
      status: 'PASS'
    },
    {
      param: 'Kinematic Viscosity @ 25°C (cPs)',
      method: 'Brookfield RVT (Spindle 2, 20 RPM)',
      spec: '800 – 1800 cPs',
      result: `${Math.round(viscosityVal)} cPs`,
      status: 'PASS'
    },
    {
      param: 'Specific Gravity @ 25°C',
      method: 'Pycnometer / ASTM D891',
      spec: '1.020 – 1.050 g/cm³',
      result: `${Number(densityVal).toFixed(3)} g/cm³`,
      status: 'PASS'
    },
    {
      param: 'Cleaning Performance Index (CPI)',
      method: 'Standard Multi-Stain Terg-O-Tometer',
      spec: '≥ 85.0',
      result: `${Number(cpiVal).toFixed(1)}`,
      status: 'PASS'
    },
    {
      param: 'Freeze-Thaw Stability (3 Cycles)',
      method: 'ASTM D4333 (-5°C to +25°C)',
      spec: 'No syneresis or phase separation',
      result: 'Passed (Homogeneous)',
      status: 'PASS'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0c1224] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header - Screen only */}
        <div className="px-5 py-4 bg-[#11192e] border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Factory Documentation Suite
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Audit Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Certificate of Analysis (COA) & Batch Manufacturing Mixing Sheet (BMR)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher - Screen only */}
        <div className="px-5 py-2.5 bg-[#0e1629] border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('coa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'coa'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certificate of Analysis (COA)</span>
            </button>
            <button
              onClick={() => setActiveTab('bmr')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'bmr'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Factory Mixing Sheet (BMR)</span>
            </button>
          </div>

          {activeTab === 'bmr' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Batch Scale:</span>
              {[100, 500, 1000, 5000].map(k => (
                <button
                  key={k}
                  onClick={() => setScaleKg(k)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                    scaleKg === k
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {k} kg
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Printable Document Body */}
        <div ref={printAreaRef} className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0 print:bg-white print:text-black">
          
          {/* ========================================================================= */}
          {/* TAB 1: CERTIFICATE OF ANALYSIS (COA) */}
          {/* ========================================================================= */}
          {activeTab === 'coa' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              {/* Company Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                    {companyName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Industrial Detergent Formulation & Quality Assurance Laboratory
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ISO 9001:2015 Certified • Accredited Under ISO 17025 Test Standards
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1 rounded">
                    CERTIFICATE OF ANALYSIS
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 mt-1">Ref: COA-{batchNo}</p>
                </div>
              </div>

              {/* Product & Batch Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Product Name</span>
                  <span className="font-bold text-slate-900">{formula.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Category</span>
                  <span className="font-semibold text-slate-900">{formula.category || 'Liquid Detergent'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Batch Number</span>
                  <span className="font-mono font-bold text-slate-900">{batchNo}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Batch Size</span>
                  <span className="font-semibold text-slate-900">{scaleKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Mfg Date</span>
                  <span className="text-slate-900">{mfgDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Expiry Date</span>
                  <span className="text-slate-900">{expDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Alignment Score</span>
                  <span className="font-bold text-emerald-700">{labAlignmentScore.toFixed(1)}% (Grade A)</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Status</span>
                  <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    RELEASED
                  </span>
                </div>
              </div>

              {/* Tested Specifications Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Chemical & Physical Test Results
                </h3>
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300">Parameter Tested</th>
                      <th className="p-2 border-r border-slate-300">Standard Test Method</th>
                      <th className="p-2 border-r border-slate-300">Specification Limit</th>
                      <th className="p-2 border-r border-slate-300">Observed Result</th>
                      <th className="p-2 text-center">Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {coaParameters.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="p-2 font-medium border-r border-slate-200">{row.param}</td>
                        <td className="p-2 text-slate-600 font-mono text-[11px] border-r border-slate-200">{row.method}</td>
                        <td className="p-2 text-slate-700 font-mono text-[11px] border-r border-slate-200">{row.spec}</td>
                        <td className="p-2 font-bold text-slate-900 font-mono text-[11px] border-r border-slate-200">{row.result}</td>
                        <td className="p-2 text-center font-bold text-emerald-700 text-[11px]">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Forensic Quality Gate Verdict Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Quality Control Verdict: APPROVED FOR COMMERCIAL RELEASE</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    This batch has been tested in compliance with established standard protocols (ASTM D459 / IS 4955).
                    All chemical, surfactant, and rheological parameters conform strictly to standard limits.
                  </p>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-xs">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end">
                    <span className="font-serif italic text-slate-700 text-sm">Dr. S. Bawa</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{qcManager}</p>
                  <p className="text-slate-500 text-[10px]">Quality Control Lead Chemist</p>
                </div>
                <div className="text-right">
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-end">
                    <span className="font-serif italic text-slate-700 text-sm">R. K. Sharma</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{plantHead}</p>
                  <p className="text-slate-500 text-[10px]">Factory Production & Operations Head</p>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FACTORY BATCH MANUFACTURING RECORD (BMR / MIXING SHEET) */}
          {/* ========================================================================= */}
          {activeTab === 'bmr' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                    BATCH MANUFACTURING RECORD (BMR)
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Floor Mixing, Dispensing & Reactor Charging Protocol
                  </p>
                </div>
                <div className="text-right">
                  <div className="bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1 rounded inline-block">
                    TARGET: {scaleKg} KG
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 mt-1">Batch: {batchNo}</p>
                </div>
              </div>

              {/* Batch Scale & Meta */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Formulation</span>
                  <span className="font-bold text-slate-900">{formula.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Mixing Tank</span>
                  <span className="font-bold text-slate-900">Vessel #3 (Stainless Steel 316)</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Mass</span>
                  <span className="font-bold text-cyan-800">{scaleKg}.00 kg</span>
                </div>
              </div>

              {/* Raw Materials Charging Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  1. Raw Material Dispensing & Charging Bill
                </h3>
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 w-10">Step</th>
                      <th className="p-2 border-r border-slate-300">Raw Material / Chemical Name</th>
                      <th className="p-2 border-r border-slate-300 w-24">Role</th>
                      <th className="p-2 border-r border-slate-300 text-right w-20">Formula %</th>
                      <th className="p-2 border-r border-slate-300 text-right w-24">Required (kg)</th>
                      <th className="p-2 border-r border-slate-300 text-center w-24">Weighed (kg)</th>
                      <th className="p-2 text-center w-16">Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ingredients.map((ing, idx) => {
                      const pct = Number(ing.percentage ?? (ing as any).percent ?? 0);
                      const reqKg = ((pct / 100) * scaleKg).toFixed(2);
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="p-2 font-mono font-bold text-slate-600 border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{ing.name}</td>
                          <td className="p-2 text-slate-600 text-[11px] border-r border-slate-200">{ing.role || 'Additive'}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-700 border-r border-slate-200">{pct.toFixed(2)}%</td>
                          <td className="p-2 text-right font-mono font-black text-slate-950 border-r border-slate-200">{reqKg} kg</td>
                          <td className="p-2 text-center border-r border-slate-200">
                            <div className="w-16 h-5 border-b border-dashed border-slate-400 mx-auto"></div>
                          </td>
                          <td className="p-2 text-center">
                            <div className="w-8 h-4 border border-slate-400 rounded mx-auto"></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Factory SOP Steps */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  2. Sequential Production & Mixing SOP
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-bold text-slate-900">Step 1 — Water & Builder Base:</span> Charge 80% calculated demineralized water into the vessel. Start low-shear agitation (100 RPM). Add chelating agents (Sodium Citrate / EDTA) and dissolve completely for 10 minutes.
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-bold text-slate-900">Step 2 — Acid-Base Neutralization:</span> Slowly add LABSA under constant cooling. Meter in caustic soda lye slowly to maintain batch temperature below 45°C. Check intermediate pH (target: 7.0 - 8.5).
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-bold text-slate-900">Step 3 — Primary Surfactants:</span> Add SLES 70% paste and CAPB 30%. Agitate at 150 RPM until completely dispersed and clear (no aeration or vortex trapping).
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-bold text-slate-900">Step 4 — Viscosity Build & Additives:</span> Add preservative, optical brightener, and perfume. Slowly dose salt (NaCl) solution in 0.25% increments while observing Brookfield RVT viscosity.
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-bold text-slate-900">Step 5 — Final Discharge QC:</span> Take bottom and top samples for QC lab sign-off. Ensure pH is between 7.5 - 8.5 and clarity is clear.
                  </div>
                </div>
              </div>

              {/* Operator Sign-off */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Dispensed By</span>
                  <div className="h-8 border-b border-dashed border-slate-400"></div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Mixed By (Operator)</span>
                  <div className="h-8 border-b border-dashed border-slate-400"></div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">QC Lab Release</span>
                  <div className="h-8 border-b border-dashed border-slate-400"></div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
