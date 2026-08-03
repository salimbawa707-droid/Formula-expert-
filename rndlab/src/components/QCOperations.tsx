import React, { useState } from "react";
import { QCProcedure, ActiveFormulaState } from "../types";
import { Play, ClipboardList, CheckCircle, XCircle, TrendingUp, HelpCircle, Sparkles, RefreshCw, Info } from "lucide-react";

interface Props {
  lang: "en" | "hi" | "mr";
  translations: any;
  activeFormula?: ActiveFormulaState | null;
}

export default function QCOperations({ lang, translations, activeFormula }: Props) {
  // Static verified QC procedures
  const PROCEDURES: QCProcedure[] = [
    {
      parameter: "Active Surfactant Matter (Titration)",
      apparatus: "Burette, separation flask, magnetic stirrer, 0.004M Hyamine 1622 standard solution, Mixed Indicator (Acid Blue 1 & Dimidium Bromide), Chloroform reagent.",
      procedure: [
        "Weigh precisely 1.5g to 2.0g of liquid detergent sample and dilute to 250ml in a volumetric flask with DM water.",
        "Pipette exactly 10ml of the diluted sample solution into a 100ml glass-stoppered cylinder.",
        "Add 15ml of standard chloroform, 25ml of mixed acid indicator solution, and mix well.",
        "Titrate slowly with standard 0.004M Hyamine 1622 solution. Stopper and shake the cylinder vigorously after each addition.",
        "Observe the chloroform layer color. The end-point is reached when the color transitions from pink-violet to grey-green or blue."
      ],
      acceptanceCriteria: "Must stay within ±0.5% of target formulation specification (e.g. 11.5% - 12.5%).",
      referenceStandard: "IS 4955 / ASTM D1681"
    },
    {
      parameter: "Foam Height & Stability (Ross-Miles Test)",
      apparatus: "Ross-Miles foam cylinder receiver, 200ml dropping pipette, thermostatic jacket heated to 40°C.",
      procedure: [
        "Prepare a 0.2% aqueous solution of the detergent in standard hard water (150 ppm Calcium Carbonate).",
        "Maintain the temperature of the receiver and the dropping pipette solution strictly at 40°C ± 0.5°C.",
        "Fill the receiver tube with 50ml of the surfactant solution.",
        "Allow exactly 200ml of the solution to drop from the pipette positioned 90cm above the receiver onto the liquid level, triggering foam generation.",
        "Read and record the foam height instantly, and again after exactly 5 minutes to measure suds stability."
      ],
      acceptanceCriteria: "Standard liquid detergent: Immediate suds >= 180mm, after 5 mins >= 140mm. Front load low suds: Immediate <= 80mm.",
      referenceStandard: "ASTM D1173"
    },
    {
      parameter: "pH Measurement (Electrode)",
      apparatus: "Digital pH meter with automatic temperature compensation (ATC), glass combination electrode, pH 4.01, 7.00, and 10.01 buffer calibration solutions.",
      procedure: [
        "Calibrate the digital pH meter using fresh pH 7.00 and pH 4.01 buffer solutions.",
        "Prepare a 1% aqueous solution of the liquid detergent or dry powder in carbon dioxide-free distilled water.",
        "Rinse the electrode thoroughly with demineralized water and blot dry with a lint-free tissue.",
        "Immerse the glass electrode into the 1% detergent solution under light stirring. Let temperature equilibrate.",
        "Wait for the display reading to stabilize (approx 30 seconds) and record the pH."
      ],
      acceptanceCriteria: "Laundry Liquid: 7.5 - 8.5 | Dishwash: 6.8 - 7.2 | Toilet Cleaner: 1.0 - 1.5 | Laundry Powder: 10.2 - 11.2.",
      referenceStandard: "ISO 4312 / IS 5785"
    },
    {
      parameter: "Dynamic Viscosity (Brookfield RVT)",
      apparatus: "Brookfield RVT viscometer, standard thermo-jacketed beaker, Spindle #2 or #3.",
      procedure: [
        "Condition the liquid detergent sample in a water bath until the temperature is strictly 25°C ± 0.2°C.",
        "Place 250ml of bubble-free liquid detergent into a 500ml tall-form beaker.",
        "Select the designated spindle (typically Spindle #3 for liquid detergents) and screw it clockwise onto the viscometer shaft.",
        "Lower the viscometer until the fluid level lines up exactly with the immersion notch on the spindle shaft.",
        "Set rotation speed to 20 RPM, start the motor, and let it run for 30 seconds before recording the cPs viscosity reading."
      ],
      acceptanceCriteria: "Must fall within ±15% of the standard formulation specification (e.g. 1800 cPs - 2250 cPs).",
      referenceStandard: "ASTM D2196"
    }
  ];

  const [activeProcedure, setActiveProcedure] = useState<QCProcedure>(PROCEDURES[0]);

  // QC Logging State with LocalStorage
  const [logs, setLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem("detergent_rd_qc_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { 
        id: "1", 
        batchName: "Premium Laundry Liquid", 
        batchNo: "B-2607-01", 
        pH: 8.1, 
        activeMatter: 18.1, 
        foamHeight: 185, 
        viscosity: 2050, 
        status: "Pass", 
        date: "2026-07-01",
        appearance: "Clear Blue Viscous Liquid",
        colour: "Sky Blue",
        odour: "Fresh Lavender",
        density: 1.04,
        specificGravity: 1.04,
        foamStability: 96,
        moisture: 0,
        solidContent: 24.5,
        particleSize: 0,
        bulkDensity: 0,
        flowability: "Highly Pourable",
        pourability: "Instant pour, no gel clumps",
        solubility: "100% Soluble in 15 seconds",
        residue: "Zero trace",
        cleaningResult: "Excellent soil suspension",
        hardWaterResult: "Maintained strong foam in 200ppm CaCO3",
        coldWaterResult: "Complete dissolution at 12°C",
        warmWaterResult: "Instant dissolution at 35°C",
        notes: "Meets premium active matter spec."
      },
      { 
        id: "2", 
        batchName: "Premium Laundry Liquid", 
        batchNo: "B-2607-02", 
        pH: 8.5, 
        activeMatter: 17.8, 
        foamHeight: 180, 
        viscosity: 1980, 
        status: "Pass", 
        date: "2026-07-04",
        appearance: "Clear Blue Viscous Liquid",
        colour: "Sky Blue",
        odour: "Fresh Lavender",
        density: 1.03,
        specificGravity: 1.03,
        foamStability: 94,
        moisture: 0,
        solidContent: 24.0,
        particleSize: 0,
        bulkDensity: 0,
        flowability: "Highly Pourable",
        pourability: "Instant pour, no gel clumps",
        solubility: "100% Soluble in 15 seconds",
        residue: "Zero trace",
        cleaningResult: "Excellent soil suspension",
        hardWaterResult: "Maintained strong foam in 200ppm CaCO3",
        coldWaterResult: "Complete dissolution at 12°C",
        warmWaterResult: "Instant dissolution at 35°C",
        notes: "Fully compliant batch." 
      },
      { 
        id: "3", 
        batchName: "Premium Laundry Liquid", 
        batchNo: "B-2607-03", 
        pH: 7.4, 
        activeMatter: 16.5, 
        foamHeight: 160, 
        viscosity: 1550, 
        status: "Fail", 
        date: "2026-07-08", 
        notes: "pH slightly low, SLES was undercharged",
        appearance: "Slightly Hazy Thin Liquid",
        colour: "Pale Blue",
        odour: "Lavender",
        density: 1.01,
        specificGravity: 1.01,
        foamStability: 80,
        moisture: 0,
        solidContent: 21.0,
        particleSize: 0,
        bulkDensity: 0,
        flowability: "Watery consistency",
        pourability: "Extremely thin, low viscosity",
        solubility: "100% Soluble",
        residue: "No sediment, but poor viscosity",
        cleaningResult: "Reduced performance on oily stains",
        hardWaterResult: "Foam collapsed quickly",
        coldWaterResult: "Soluble",
        warmWaterResult: "Soluble"
      },
      { 
        id: "4", 
        batchName: "Premium Laundry Liquid", 
        batchNo: "B-2607-04", 
        pH: 7.9, 
        activeMatter: 18.3, 
        foamHeight: 190, 
        viscosity: 2100, 
        status: "Pass", 
        date: "2026-07-11",
        appearance: "Clear Blue Viscous Liquid",
        colour: "Sky Blue",
        odour: "Fresh Lavender",
        density: 1.04,
        specificGravity: 1.04,
        foamStability: 97,
        moisture: 0,
        solidContent: 25.1,
        particleSize: 0,
        bulkDensity: 0,
        flowability: "Highly Pourable",
        pourability: "Instant pour",
        solubility: "100% Soluble",
        residue: "Zero trace",
        cleaningResult: "Outstanding oil and mud removal",
        hardWaterResult: "Stable suds",
        coldWaterResult: "Clear solution",
        warmWaterResult: "Clear solution",
        notes: "Optimal formula run."
      }
    ];
  });

  // Save logs to localStorage on changes
  React.useEffect(() => {
    localStorage.setItem("detergent_rd_qc_logs", JSON.stringify(logs));
  }, [logs]);

  // Form states for core fields
  const [formBatchName, setFormBatchName] = useState("Premium Laundry Liquid");
  const [formBatchNo, setFormBatchNo] = useState("");
  const [formPH, setFormPH] = useState(8.0);
  const [formActive, setFormActive] = useState(18.0);
  const [formFoam, setFormFoam] = useState(180);
  const [formViscosity, setFormViscosity] = useState(2000);
  const [formStatus, setFormStatus] = useState<"Pass" | "Fail">("Pass");
  const [formNotes, setFormNotes] = useState("");

  // Form states for new ADVANCED lab-verified parameters
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [formAppearance, setFormAppearance] = useState("Clear Viscous Liquid");
  const [formColour, setFormColour] = useState("Sky Blue");
  const [formOdour, setFormOdour] = useState("Fresh Lavender");
  const [formDensity, setFormDensity] = useState(1.03);
  const [formSpecificGravity, setFormSpecificGravity] = useState(1.03);
  const [formFoamStability, setFormFoamStability] = useState(95);
  const [formMoisture, setFormMoisture] = useState(0);
  const [formSolidContent, setFormSolidContent] = useState(24.0);
  const [formParticleSize, setFormParticleSize] = useState(0);
  const [formBulkDensity, setFormBulkDensity] = useState(0);
  const [formFlowability, setFormFlowability] = useState("Excellent");
  const [formPourability, setFormPourability] = useState("Excellent");
  const [formSolubility, setFormSolubility] = useState("Fully soluble");
  const [formResidue, setFormResidue] = useState("None");
  const [formCleaningResult, setFormCleaningResult] = useState("Excellent");
  const [formHardWaterResult, setFormHardWaterResult] = useState("Suds stable in hard water");
  const [formColdWaterResult, setFormColdWaterResult] = useState("Soluble with no haze");
  const [formWarmWaterResult, setFormWarmWaterResult] = useState("Soluble instantly");

  // Selection for viewing full log details
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const handleLoadActiveFormulaIntoForm = () => {
    if (!activeFormula) return;
    if (activeFormula.name) {
      setFormBatchName(activeFormula.name);
    }
    if (activeFormula.activeMatter && activeFormula.activeMatter > 0) {
      setFormActive(activeFormula.activeMatter);
    }
    if (activeFormula.properties?.pH) {
      const parsedPH = parseFloat(activeFormula.properties.pH);
      if (!isNaN(parsedPH)) setFormPH(parsedPH);
    }
    if (activeFormula.properties?.viscosity) {
      const parsedVisc = parseInt(activeFormula.properties.viscosity.replace(/[^0-9.]/g, ''), 10);
      if (!isNaN(parsedVisc) && parsedVisc > 0) setFormViscosity(parsedVisc);
    }
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBatchNo.trim()) return;

    const newLog = {
      id: Date.now().toString(),
      batchName: formBatchName,
      batchNo: formBatchNo,
      pH: formPH,
      activeMatter: formActive,
      foamHeight: formFoam,
      viscosity: formViscosity,
      status: formStatus,
      date: new Date().toISOString().split("T")[0],
      notes: formNotes,
      
      // Advanced recordable physical properties
      appearance: formAppearance,
      colour: formColour,
      odour: formOdour,
      density: Number(formDensity),
      specificGravity: Number(formSpecificGravity),
      foamStability: Number(formFoamStability),
      moisture: Number(formMoisture),
      solidContent: Number(formSolidContent),
      particleSize: Number(formParticleSize),
      bulkDensity: Number(formBulkDensity),
      flowability: formFlowability,
      pourability: formPourability,
      solubility: formSolubility,
      residue: formResidue,
      cleaningResult: formCleaningResult,
      hardWaterResult: formHardWaterResult,
      coldWaterResult: formColdWaterResult,
      warmWaterResult: formWarmWaterResult
    };

    setLogs([...logs, newLog]);
    setFormBatchNo("");
    setFormNotes("");
    alert(`QC Results for batch ${formBatchNo} logged successfully!`);
  };

  // Generate SVG Chart coordinates
  const renderSVGChart = () => {
    const chartLogs = logs.filter(l => l.batchName === "Premium Laundry Liquid");
    if (chartLogs.length < 2) return null;

    const width = 500;
    const height = 150;
    const padding = 30;

    // Active Matter values (typically 15-20)
    const minVal = 15;
    const maxVal = 20;

    const points = chartLogs.map((log, index) => {
      const x = padding + (index / (chartLogs.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((log.activeMatter - minVal) / (maxVal - minVal)) * (height - 2 * padding);
      return { x, y, val: log.activeMatter, label: log.batchNo };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
      <div className="bg-white border rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
            <TrendingUp size={14} className="text-[#0f766e]" /> Active Matter (%) QC Trend chart
          </span>
          <span className="text-[10px] text-gray-400">Spec Target: 18.2% (min 17.5%)</span>
        </div>
        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[400px]">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
              const y = padding + p * (height - 2 * padding);
              const val = maxVal - p * (maxVal - minVal);
              return (
                <g key={idx}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                  <text x={10} y={y + 4} className="text-[9px] fill-gray-400 font-mono font-bold">{val.toFixed(1)}%</text>
                </g>
              );
            })}

            {/* Target specs bounds */}
            <line
              x1={padding}
              y1={height - padding - ((18.2 - minVal) / (maxVal - minVal)) * (height - 2 * padding)}
              x2={width - padding}
              y2={height - padding - ((18.2 - minVal) / (maxVal - minVal)) * (height - 2 * padding)}
              stroke="#0f766e"
              strokeDasharray="4"
              strokeWidth="1.5"
            />

            {/* Plot Line */}
            <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" />

            {/* Points and labels */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="5" className="fill-blue-600 hover:r-6 cursor-pointer" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[9px] fill-blue-700 font-bold font-mono">
                  {p.val}%
                </text>
                <text x={p.x} y={height - 8} textAnchor="middle" className="text-[8px] fill-gray-400 font-semibold">
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" id="qc-root">
      {/* Header */}
      <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#0f766e] flex items-center gap-2">
            📊 {translations[lang].qcPanel}
          </h2>
          <p className="text-xs text-gray-500">
            {translations[lang].qcPanelDesc || "Laboratory quality checks, titration procedures, and active matter logging"}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f9fafb]">
        {/* Left Side: Procedures Guide */}
        <div className="w-full md:w-80 border-r border-[#e5e7eb] bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-[#e5e7eb] bg-gray-50">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <ClipboardList size={14} /> QC Lab Methods (SOP)
            </h3>
          </div>
          <div className="divide-y divide-gray-100 flex-1">
            {PROCEDURES.map((proc, idx) => (
              <div
                key={idx}
                onClick={() => setActiveProcedure(proc)}
                className={`p-3 text-left cursor-pointer transition-all ${
                  activeProcedure.parameter === proc.parameter
                    ? "bg-[#f0fdfa] border-l-4 border-[#0f766e]"
                    : "hover:bg-gray-50"
                }`}
              >
                <span className="text-xs font-bold text-gray-900 block">{proc.parameter}</span>
                <span className="text-[10px] text-[#0f766e] font-semibold font-mono mt-1 block">
                  SOP: {proc.referenceStandard}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Active Procedure details + Logger Form */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          {/* Active Procedure SOP Display */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm space-y-4">
            <div className="border-b pb-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-teal-800 uppercase bg-teal-50 px-2 py-0.5 rounded">
                  Method SOP Details
                </span>
                <h3 className="text-md font-bold text-gray-900 mt-1">{activeProcedure.parameter}</h3>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono font-bold text-gray-700">
                {activeProcedure.referenceStandard}
              </span>
            </div>

            <div className="text-xs space-y-2">
              <div>
                <span className="font-bold text-gray-500 block">Apparatus & Reagents:</span>
                <p className="text-gray-700 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {activeProcedure.apparatus}
                </p>
              </div>

              <div>
                <span className="font-bold text-gray-500 block mb-1">Testing Sequence:</span>
                <div className="space-y-2">
                  {activeProcedure.procedure.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-xs text-gray-700 bg-gray-50/40 p-2 rounded">
                      <span className="w-5 h-5 rounded-full bg-[#0f766e] text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3 border-dashed">
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-800 text-[11px] block">Standard Acceptance Criteria:</span>
                  <p className="text-gray-700 mt-1">{activeProcedure.acceptanceCriteria}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="font-bold text-gray-600 text-[11px] block">Reference Standard:</span>
                  <p className="text-gray-700 mt-1 font-mono font-bold">{activeProcedure.referenceStandard}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Formula Context Banner */}
          {activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0 ? (
            <div className="bg-slate-900 border border-teal-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">Active Workspace Formula Context</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {activeFormula.name || "Untitled Formula"}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                      {activeFormula.productType} ({activeFormula.grade})
                    </span>
                    {activeFormula.batchSize && activeFormula.batchSize > 0 && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Batch: {activeFormula.batchSize} kg
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLoadActiveFormulaIntoForm}
                className="flex items-center justify-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer border border-teal-400/30 shrink-0"
              >
                <RefreshCw size={14} />
                Link Active Formula To QC Form
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-slate-300 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                  <Info size={16} />
                </div>
                <div>
                  <span className="font-bold text-white uppercase text-[11px] tracking-wider block">NO FORMULA SELECTED</span>
                  <span className="text-slate-400 text-[11px]">Select or generate a formula in AI Formula Expert or Formula Library to link active batch QC.</span>
                </div>
              </div>
            </div>
          )}

          {/* Chart Section */}
          {renderSVGChart()}

          {/* Interactive Logger form */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
            {/* Log form */}
            <div className="xl:col-span-1 bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-gray-900 text-sm">Register Batch QC Log</h4>
                <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">Lab-Verified Inputs</span>
              </div>
              
              <form onSubmit={handleAddLog} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Formula Profile Name</label>
                  <select
                    value={formBatchName}
                    onChange={(e) => setFormBatchName(e.target.value)}
                    className="w-full bg-gray-50 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-100 font-medium text-gray-800"
                  >
                    {activeFormula && activeFormula.name && (
                      <option value={activeFormula.name}>★ {activeFormula.name} (Active Workspace Formula)</option>
                    )}
                    <option value="Premium Laundry Liquid">Premium Laundry Liquid</option>
                    <option value="Standard Dishwash Liquid">Standard Dishwash Liquid</option>
                    <option value="Classic Laundry Powder">Classic Laundry Powder</option>
                    <option value="Eco Handwash Base">Eco Handwash Base</option>
                    <option value="Industrial Floor Degreaser">Industrial Floor Degreaser</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    placeholder="e.g. B-2607-05"
                    value={formBatchNo}
                    onChange={(e) => setFormBatchNo(e.target.value)}
                    className="w-full bg-gray-50 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-100 font-mono uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Measured pH</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formPH}
                      onChange={(e) => setFormPH(Number(e.target.value))}
                      className="w-full bg-gray-50 border rounded-lg p-2 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Active Matter %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formActive}
                      onChange={(e) => setFormActive(Number(e.target.value))}
                      className="w-full bg-gray-50 border rounded-lg p-2 text-center font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Viscosity (cPs)</label>
                    <input
                      type="number"
                      value={formViscosity}
                      onChange={(e) => setFormViscosity(Number(e.target.value))}
                      className="w-full bg-gray-50 border rounded-lg p-2 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">QC Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-gray-50 border rounded-lg p-2 text-center font-bold text-teal-800"
                    >
                      <option value="Pass">✓ Pass</option>
                      <option value="Fail">✗ Fail</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Remarks / Failure Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. SLES neutralized fully, slight viscosity drop"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-gray-50 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                {/* Collapsible Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                    className="w-full py-1.5 px-3 border border-[#0f766e] text-[#0f766e] hover:bg-teal-50 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    {showAdvancedParams ? "Hide" : "Show"} Advanced QC Properties ({19 - 4} Fields)
                  </button>
                </div>

                {/* Advanced parameters section */}
                {showAdvancedParams && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100 animate-fade-in max-h-[300px] overflow-y-auto">
                    <h5 className="font-bold text-gray-700 border-b pb-1 text-[11px] uppercase tracking-wider">Appearance, Color & Sensory</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Appearance</label>
                        <input type="text" value={formAppearance} onChange={(e) => setFormAppearance(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Colour</label>
                        <input type="text" value={formColour} onChange={(e) => setFormColour(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-semibold">Odour</label>
                      <input type="text" value={formOdour} onChange={(e) => setFormOdour(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                    </div>

                    <h5 className="font-bold text-gray-700 border-b pb-1 pt-1 text-[11px] uppercase tracking-wider">Physical Metrics & Densities</h5>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Density (g/cm³)</label>
                        <input type="number" step="0.01" value={formDensity} onChange={(e) => setFormDensity(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Specific Gravity</label>
                        <input type="number" step="0.01" value={formSpecificGravity} onChange={(e) => setFormSpecificGravity(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Foam Stability (%)</label>
                        <input type="number" value={formFoamStability} onChange={(e) => setFormFoamStability(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Solid Content (%)</label>
                        <input type="number" step="0.1" value={formSolidContent} onChange={(e) => setFormSolidContent(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Moisture (%) (Powder)</label>
                        <input type="number" step="0.1" value={formMoisture} onChange={(e) => setFormMoisture(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Bulk Density (g/L)</label>
                        <input type="number" step="1" value={formBulkDensity} onChange={(e) => setFormBulkDensity(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Particle Size (µm)</label>
                        <input type="number" value={formParticleSize} onChange={(e) => setFormParticleSize(Number(e.target.value))} className="w-full bg-white border rounded p-1 text-[11px] font-mono" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Flowability</label>
                        <input type="text" value={formFlowability} onChange={(e) => setFormFlowability(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Pourability</label>
                        <input type="text" value={formPourability} onChange={(e) => setFormPourability(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Solubility</label>
                        <input type="text" value={formSolubility} onChange={(e) => setFormSolubility(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-semibold">Sieve Residue</label>
                      <input type="text" value={formResidue} onChange={(e) => setFormResidue(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                    </div>

                    <h5 className="font-bold text-gray-700 border-b pb-1 pt-1 text-[11px] uppercase tracking-wider">Performance Trials</h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Cleaning Result (Soil removal)</label>
                        <input type="text" value={formCleaningResult} onChange={(e) => setFormCleaningResult(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold">Hard Water Performance</label>
                        <input type="text" value={formHardWaterResult} onChange={(e) => setFormHardWaterResult(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-500 font-semibold">Cold Water Sol.</label>
                          <input type="text" value={formColdWaterResult} onChange={(e) => setFormColdWaterResult(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 font-semibold">Warm Water Sol.</label>
                          <input type="text" value={formWarmWaterResult} onChange={(e) => setFormWarmWaterResult(e.target.value)} className="w-full bg-white border rounded p-1 text-[11px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#0f766e] text-white py-2.5 rounded-lg font-bold hover:bg-[#0d645c] transition-all text-xs cursor-pointer shadow-xs"
                >
                  Log QC Results
                </button>
              </form>
            </div>

            {/* Logs list table + Details side panel */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm flex flex-col text-xs">
                <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                  <h4 className="font-bold text-gray-900">Logged Batches History</h4>
                  <span className="text-[10px] text-gray-400">Click row to view complete physical metrics</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b text-gray-500 font-bold">
                      <tr>
                        <th className="p-2">Batch ID</th>
                        <th className="p-2">Formula</th>
                        <th className="p-2 text-center">pH</th>
                        <th className="p-2 text-center">Active Matter</th>
                        <th className="p-2 text-center">Viscosity</th>
                        <th className="p-2 text-right">QC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700 font-medium font-mono">
                      {logs.map((log) => {
                        const isSelected = selectedLogId === log.id;
                        return (
                          <tr 
                            key={log.id} 
                            onClick={() => setSelectedLogId(log.id)}
                            className={`hover:bg-teal-50/20 cursor-pointer transition-colors ${isSelected ? "bg-teal-50/60 font-bold border-l-4 border-[#0f766e]" : ""}`}
                          >
                            <td className="p-2 font-bold text-gray-900">{log.batchNo}</td>
                            <td className="p-2 text-gray-500 font-sans">{log.batchName}</td>
                            <td className="p-2 text-center">{log.pH}</td>
                            <td className="p-2 text-center">{log.activeMatter}%</td>
                            <td className="p-2 text-center">{log.viscosity} cPs</td>
                            <td className="p-2 text-right">
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.status === "Pass" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                              }`}>
                                {log.status === "Pass" ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Log details expander card */}
              {selectedLogId && (
                (() => {
                  const log = logs.find(l => l.id === selectedLogId);
                  if (!log) return null;
                  return (
                    <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-sm space-y-4 animate-fade-in text-xs">
                      <div className="flex items-center justify-between border-b pb-2 border-teal-100">
                        <div>
                          <span className="text-[9px] font-bold text-teal-800 uppercase bg-teal-50 px-2.5 py-0.5 rounded border border-teal-100">
                            🔬 Comprehensive QC Record (Lab-Verified)
                          </span>
                          <h4 className="font-bold text-gray-900 mt-1 text-sm">{log.batchName} ({log.batchNo})</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-mono block">Tested Date: {log.date}</span>
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono mt-1 ${
                            log.status === "Pass" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            QC {log.status === "Pass" ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Column 1: Core Physical Constants */}
                        <div className="space-y-2.5 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                          <span className="font-bold text-gray-500 uppercase text-[9px] tracking-wider block">Physical Constants</span>
                          <div className="space-y-1.5 font-mono">
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span className="font-sans">Measured pH:</span>
                              <span className="font-bold text-gray-900">{log.pH} <span className="text-[9px] font-normal text-gray-400">(ISO 4312)</span></span>
                            </div>
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span className="font-sans">Active Matter:</span>
                              <span className="font-bold text-gray-900">{log.activeMatter}% <span className="text-[9px] font-normal text-gray-400">(IS 4955)</span></span>
                            </div>
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span className="font-sans">Viscosity:</span>
                              <span className="font-bold text-gray-900">{log.viscosity} cPs <span className="text-[9px] font-normal text-gray-400">(ASTM D2196)</span></span>
                            </div>
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span className="font-sans">Density:</span>
                              <span className="font-bold text-gray-900">{log.density || 1.03} g/cm³ <span className="text-[9px] font-normal text-gray-400">(ISO 758)</span></span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span className="font-sans">Spec. Gravity:</span>
                              <span className="font-bold text-gray-900">{log.specificGravity || 1.03} <span className="text-[9px] font-normal text-gray-400">(ASTM D891)</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Appearance & Rheology */}
                        <div className="space-y-2.5 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                          <span className="font-bold text-gray-500 uppercase text-[9px] tracking-wider block">Appearance & Foam metrics</span>
                          <div className="space-y-1.5">
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span>Appearance:</span>
                              <span className="font-bold text-gray-900 text-right">{log.appearance || "Clear Viscous Liquid"}</span>
                            </div>
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span>Colour:</span>
                              <span className="font-bold text-gray-900">{log.colour || "Blue"}</span>
                            </div>
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span>Odour:</span>
                              <span className="font-bold text-gray-900">{log.odour || "Lavender"}</span>
                            </div>
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span>Foam Height:</span>
                              <span className="font-bold text-gray-900 font-mono">{log.foamHeight || 180} mm <span className="text-[9px] text-gray-400 font-sans">(ASTM D1173)</span></span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Foam Stability:</span>
                              <span className="font-bold text-gray-900 font-mono">{log.foamStability || 95}% <span className="text-[9px] text-gray-400 font-sans">(ASTM D1173)</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Powder Specifics & Solution Properties */}
                        <div className="space-y-2.5 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                          <span className="font-bold text-gray-500 uppercase text-[9px] tracking-wider block">Solubility & Trial Results</span>
                          <div className="space-y-1.5">
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span>Solubility:</span>
                              <span className="font-bold text-gray-900 text-right">{log.solubility || "Fully soluble"}</span>
                            </div>
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span>Residue:</span>
                              <span className="font-bold text-gray-900 text-right">{log.residue || "None"}</span>
                            </div>
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span>Cleaning Trial:</span>
                              <span className="font-bold text-emerald-700 text-right">{log.cleaningResult || "Excellent"} <span className="text-[9px] text-gray-400 font-sans font-normal">(ASTM D3050)</span></span>
                            </div>
                            <div className="flex justify-between border-b pb-0.5 text-gray-600">
                              <span>Solid / Moisture:</span>
                              <span className="font-bold text-gray-900 font-mono">{log.solidContent || 24}% / {log.moisture || 0}%</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Bulk Density:</span>
                              <span className="font-bold text-gray-900 font-mono">{log.bulkDensity || 0} g/L <span className="text-[9px] text-gray-400 font-sans font-normal">(ISO 4324)</span></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Trials Water Temperatures */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                        <div className="bg-blue-50/30 p-2.5 rounded border border-blue-100 text-[11px]">
                          <span className="font-bold text-blue-800 block">Hard Water Result (ASTM D1173):</span>
                          <p className="text-gray-700 mt-0.5 italic">{log.hardWaterResult || "Suds stable in hard water"}</p>
                        </div>
                        <div className="bg-sky-50/30 p-2.5 rounded border border-sky-100 text-[11px]">
                          <span className="font-bold text-sky-800 block">Cold Water Result (12°C):</span>
                          <p className="text-gray-700 mt-0.5 italic">{log.coldWaterResult || "Soluble, no crystallization"}</p>
                        </div>
                        <div className="bg-amber-50/30 p-2.5 rounded border border-amber-100 text-[11px]">
                          <span className="font-bold text-amber-800 block">Warm Water Result (35°C):</span>
                          <p className="text-gray-700 mt-0.5 italic">{log.warmWaterResult || "Soluble instantly, transparent"}</p>
                        </div>
                      </div>

                      {log.notes && (
                        <div className="bg-gray-50 p-2.5 rounded border text-[11px] text-gray-700">
                          <span className="font-bold text-gray-800">Technician Observations:</span> {log.notes}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
