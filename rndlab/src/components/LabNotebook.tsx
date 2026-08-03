import React, { useState, useEffect } from "react";
import { getAllUniversalIngredients } from "../data/universalIngredientLibrary";
import { 
  Folder, FolderPlus, BookOpen, Plus, Sparkles, Thermometer, FlaskConical, Trophy, 
  AlertTriangle, CheckCircle2, ChevronRight, HelpCircle, Save, Calendar, Trash2,
  TrendingUp, TrendingDown, Clipboard, Layers, RefreshCw, Camera, Check
} from "lucide-react";
import { ActiveFormulaState } from "../types";

interface Props {
  lang: "en" | "hi" | "mr";
  translations: any;
  activeFormula?: ActiveFormulaState | null;
}

// Data Interfaces
export interface FormulaSnapshot {
  id?: string;
  name: string;
  version?: string;
  batchSize?: number;
  productType?: string;
  grade?: string;
  targetCost?: number;
  ingredients: {
    name: string;
    percentage: number;
    function?: string;
    costPerKg?: number;
  }[];
  timestamp: string;
}

export interface Experiment {
  id: string;
  title: string;
  date: string;
  objective: string;
  formulation: string;
  observations: string;
  creator: string;
  snapshot?: FormulaSnapshot | null;
}

interface ProjectFolder {
  id: string;
  name: string;
  description: string;
  experiments: Experiment[];
}

interface StabilityStudy {
  id: string;
  sampleName: string;
  startDate: string;
  tempCondition: string; // e.g. "45°C (Accelerated Oven)" or "Ambient (25°C)"
  humidityCondition: string; // e.g. "60% RH"
  durationWeeks: number;
  activeDecayPercent: string; // user-entered physical measurement
  phaseSeparationObserved: "None" | "Slight Syneresis" | "Severe Phase Separation";
  colorChange: string;
  estimatedShelfLife: string; // user-entered physical estimation
  status: "In Progress" | "Completed" | "Terminated";
}

interface PerformanceTest {
  id: string;
  formulaName: string;
  testDate: string;
  cleaningEfficiency: number; // 1-100
  foamVolumeScore: number; // 1-100
  soilSuspensionScore: number; // 1-100
  skinMildnessScore: number; // 1-100
  notes: string;
}

interface FailureLog {
  id: string;
  batchNo: string;
  defectType: "Phase Separation" | "Viscosity Collapse" | "pH Drift" | "Haze / Cloudiness" | "Precipitation";
  observations: string;
  chemistryAnalysis: string; // technician-entered rationale
  capaAction: string; // Corrective Action Preventive Action
  severity: "Minor" | "Major" | "Critical";
  status: "Under Investigation" | "CAPA Logged" | "Resolved";
  date: string;
}

interface SOPTemplate {
  id: string;
  title: string;
  productType: string;
  author: string;
  steps: string[];
}

// Default Data
const DEFAULT_FOLDERS: ProjectFolder[] = [
  {
    id: "proj-1",
    name: "Anionic Surfactant Synergy Trial",
    description: "Evaluating SLES/LABSA/Alpha Olefin Sulfonate (AOS) ratio curves to optimize foam density and lower active cost.",
    experiments: [
      {
        id: "exp-1-1",
        title: "SLES-AOS Binary Blend At 12% Actives",
        date: "2026-06-15",
        objective: "Determine if AOS can substitute 30% SLES without collapsing foam viscosity in standard laundry formula.",
        formulation: "Water: 80.5%, SLES 70%: 8.5%, AOS 40%: 7.5%, CAPB: 2.0%, NaCl: 1.5%",
        observations: "Viscosity registered at 2450 cPs. Initial foam volume is comparable, but bubbles appear slightly coarser. No phase separation after 48-hour oven trial.",
        creator: "Dr. Amit Sharma",
        snapshot: {
          id: "snap-exp-1-1",
          name: "SLES-AOS Laundry Blend Trial 1",
          version: "1.0",
          batchSize: 100,
          productType: "Liquid Detergent",
          grade: "Standard",
          targetCost: 45.0,
          ingredients: [
            { name: "Water (Demineralized)", percentage: 80.5, function: "Solvent", costPerKg: 0.5 },
            { name: "Sodium Lauryl Ether Sulfate (SLES 70%)", percentage: 8.5, function: "Primary Anionic Surfactant", costPerKg: 98.0 },
            { name: "Alpha Olefin Sulfonate (AOS 40%)", percentage: 7.5, function: "Co-Surfactant / Foamer", costPerKg: 85.0 },
            { name: "Cocoamidopropyl Betaine (CAPB 30%)", percentage: 2.0, function: "Amphoteric Viscosity Booster", costPerKg: 110.0 },
            { name: "Sodium Chloride (Salt)", percentage: 1.5, function: "Viscosity Thickener", costPerKg: 8.0 }
          ],
          timestamp: "2026-06-15T10:30:00.000Z"
        }
      },
      {
        id: "exp-1-2",
        title: "LABSA-SLES Neutralization Curve Optimization",
        date: "2026-07-02",
        objective: "Fine-tune Soda Ash neutralizing feed rate to avoid exothermic regional hotspots that degrade surfactant active matter.",
        formulation: "Water: 72%, Soda Ash: 1.8%, LABSA 90%: 9.0%, SLES 70%: 12.0%",
        observations: "Slow charging over 25 minutes keeps temperature below 42°C. Actives titration verified at 14.8% (extremely close to the predicted theoretical 15.0%).",
        creator: "Dr. Amit Sharma",
        snapshot: {
          id: "snap-exp-1-2",
          name: "LABSA Neutralization Standard Formula",
          version: "1.2",
          batchSize: 100,
          productType: "Heavy Duty Laundry Gel",
          grade: "Premium",
          targetCost: 62.5,
          ingredients: [
            { name: "Water (Demineralized)", percentage: 72.0, function: "Solvent", costPerKg: 0.5 },
            { name: "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", percentage: 9.0, function: "Anionic Active Precursor", costPerKg: 135.0 },
            { name: "Soda Ash (Sodium Carbonate)", percentage: 1.8, function: "Neutralizing Alkali / Builder", costPerKg: 28.0 },
            { name: "Sodium Lauryl Ether Sulfate (SLES 70%)", percentage: 12.0, function: "Co-Surfactant", costPerKg: 98.0 },
            { name: "Sodium Hydroxide (Caustic Lye 47%)", percentage: 5.2, function: "pH Regulator", costPerKg: 42.0 }
          ],
          timestamp: "2026-07-02T14:15:00.000Z"
        }
      }
    ]
  },
  {
    id: "proj-2",
    name: "Green Builder Substitutes",
    description: "Replacing traditional EDTA and phosphates with highly biodegradable chelating agents like Sodium Gluconate and GLDA.",
    experiments: [
      {
        id: "exp-2-1",
        title: "Sodium Gluconate Hard Water Chelation Curve",
        date: "2026-07-10",
        objective: "Assess calcium binding capacity at pH 8.5 to prevent calcium carbonate deposition on fabrics in hard water areas.",
        formulation: "Water: 92%, Sodium Gluconate: 1.5%, SLES: 6.0%",
        observations: "Excellent dispersion capacity. Titration shows calcium binding is active down to 12° dH. Formulation remains completely transparent.",
        creator: "Lead Chemist"
      }
    ]
  }
];

const DEFAULT_STABILITY: StabilityStudy[] = [
  {
    id: "stab-1",
    sampleName: "Concentrated Eco Laundry Liquid (Trial A)",
    startDate: "2026-05-10",
    tempCondition: "45°C (Accelerated Oven)",
    humidityCondition: "65% RH",
    durationWeeks: 8,
    activeDecayPercent: "1.2% Decay",
    phaseSeparationObserved: "None",
    colorChange: "Extremely minor darkening (APHA 15 to 20)",
    estimatedShelfLife: "24 Months (Stable)",
    status: "Completed"
  },
  {
    id: "stab-2",
    sampleName: "Premium Dishwash Liquid (Glucoside Blend)",
    startDate: "2026-06-20",
    tempCondition: "40°C Oven",
    humidityCondition: "Ambient RH",
    durationWeeks: 4,
    activeDecayPercent: "0.5% Decay",
    phaseSeparationObserved: "Slight Syneresis",
    colorChange: "None",
    estimatedShelfLife: "18 Months (Marginal)",
    status: "In Progress"
  }
];

const DEFAULT_TESTING: PerformanceTest[] = [
  {
    id: "test-1",
    formulaName: "Standard LAS-SLES Formula",
    testDate: "2026-06-18",
    cleaningEfficiency: 78,
    foamVolumeScore: 88,
    soilSuspensionScore: 72,
    skinMildnessScore: 65,
    notes: "Excellent foaming and grease cutting, but can feel drying to the skin after repeated exposure. Requires mild co-surfactant balancing."
  },
  {
    id: "test-2",
    formulaName: "Eco Lauryl Glucoside Blend",
    testDate: "2026-07-05",
    cleaningEfficiency: 74,
    foamVolumeScore: 68,
    soilSuspensionScore: 82,
    skinMildnessScore: 92,
    notes: "Outstanding dermatological profile (skin mildness 92). Foam volume is slightly lower than standard formula but bubble structures are highly stable."
  },
  {
    id: "test-3",
    formulaName: "Premium Concentrated Active 3x",
    testDate: "2026-07-12",
    cleaningEfficiency: 94,
    foamVolumeScore: 92,
    soilSuspensionScore: 91,
    skinMildnessScore: 70,
    notes: "Top-tier dirt removal (94% soil removal on standardized cotton test swatches) and superb soil suspension. High viscosity holds up well."
  }
];

const DEFAULT_FAILURES: FailureLog[] = [
  {
    id: "fail-1",
    batchNo: "BTCH-2026-004",
    defectType: "Phase Separation",
    observations: "Rapid separation of heavy matter into distinct layers observed 24 hours after cold blending. Upper layer has cloudy white haze.",
    chemistryAnalysis: "Hydrophilic-lipophilic balance (HLB) is unstable due to inadequate CAPB co-surfactant coupling. Excess salt (NaCl) drove micellar compression, triggering a salting-out effect.",
    capaAction: "1. Remelt batch under slow heat. 2. Supplement with 1.2% CAPB as coupling hydrotope to re-stabilize micelles. 3. Cap salt additions at 1.2% max in SOP-4.",
    severity: "Critical",
    status: "CAPA Logged",
    date: "2026-06-25"
  },
  {
    id: "fail-2",
    batchNo: "BTCH-2026-012",
    defectType: "pH Drift",
    observations: "Initial pH was 7.5; fell to 5.4 after 3 days of storage, causing severe thinning of product.",
    chemistryAnalysis: "No buffer chemistry was added. Natural hydrolysis of esters or sulfonic residues gradually released free hydrogen ions, compressing the viscosity curve.",
    capaAction: "Add 0.25% Citrate/Sodium Citrate buffer system to standard manufacturing template to clamp pH between 7.0 and 7.5.",
    severity: "Major",
    status: "Resolved",
    date: "2026-07-08"
  }
];

const DEFAULT_SOPS: SOPTemplate[] = [
  {
    id: "sop-1",
    title: "Standard Multi-Phase Shear Surfactant Blending",
    productType: "Heavy-Duty Laundry Liquid",
    author: "R&D Plant Engineering Team",
    steps: [
      "Charge primary soft water into reactor vessel. Initiate slow blade agitation (150-200 RPM).",
      "Charge alkaline builders (Soda Ash, Sodium Gluconate). Agitate for 10 minutes until completely dissolved.",
      "Dispense acid LABSA slowly into the vortex. Monitor exothermic rise — clamp temperature under 45°C.",
      "Check neutralisation pH. Feed small Soda Ash or Caustic Soda increments until pH stabilises in 7.0-8.0 range.",
      "Slowly charge SLES paste. Transition mixer to High Shear (500-600 RPM) to dissolve gel clumps smoothly.",
      "Add auxiliary CAPB, preservatives, and coloring agent. Mix for 15 minutes.",
      "Take final lab sample for Active Matter Titration and Viscosity Brookfield audits."
    ]
  }
];

export default function LabNotebook({ lang, translations, activeFormula }: Props) {
  // Navigation inside the R&D tab
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "notebook" | "stability" | "testing" | "failures" | "sops">("dashboard");

  // R&D Notebook folders state
  const [folders, setFolders] = useState<ProjectFolder[]>(() => {
    const saved = localStorage.getItem("lab_folders_registry");
    return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
  });

  const [stabilityStudies, setStabilityStudies] = useState<StabilityStudy[]>(() => {
    const saved = localStorage.getItem("lab_stability_registry");
    return saved ? JSON.parse(saved) : DEFAULT_STABILITY;
  });

  const [perfTests, setPerfTests] = useState<PerformanceTest[]>(() => {
    const saved = localStorage.getItem("lab_testing_registry");
    return saved ? JSON.parse(saved) : DEFAULT_TESTING;
  });

  const [failures, setFailures] = useState<FailureLog[]>(() => {
    const saved = localStorage.getItem("lab_failures_registry");
    return saved ? JSON.parse(saved) : DEFAULT_FAILURES;
  });

  const [sops, setSops] = useState<SOPTemplate[]>(() => {
    const saved = localStorage.getItem("lab_sops_registry");
    return saved ? JSON.parse(saved) : DEFAULT_SOPS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("lab_folders_registry", JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem("lab_stability_registry", JSON.stringify(stabilityStudies));
  }, [stabilityStudies]);

  useEffect(() => {
    localStorage.setItem("lab_testing_registry", JSON.stringify(perfTests));
  }, [perfTests]);

  useEffect(() => {
    localStorage.setItem("lab_failures_registry", JSON.stringify(failures));
  }, [failures]);

  useEffect(() => {
    localStorage.setItem("lab_sops_registry", JSON.stringify(sops));
  }, [sops]);

  // Active folder selection for Notebook
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>("proj-1");
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");

  const [showNewExpForm, setShowNewExpForm] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expObjective, setExpObjective] = useState("");
  const [expFormulation, setExpFormulation] = useState("");
  const [expObservations, setExpObservations] = useState("");

  // New Stability study form states
  const [showNewStabForm, setShowNewStabForm] = useState(false);
  const [stabSample, setStabSample] = useState("");
  const [stabTemp, setStabTemp] = useState("45°C (Accelerated Oven)");
  const [stabHumidity, setStabHumidity] = useState("60% RH");
  const [stabWeeks, setStabWeeks] = useState(4);
  const [stabDecay, setStabDecay] = useState("1.0% Decay");
  const [stabPhase, setStabPhase] = useState<"None" | "Slight Syneresis" | "Severe Phase Separation">("None");
  const [stabColor, setStabColor] = useState("None");
  const [stabShelf, setStabShelf] = useState("24 Months");

  // New Performance Test form states
  const [showNewTestForm, setShowNewTestForm] = useState(false);
  const [testFormula, setTestFormula] = useState("");
  const [testCleaning, setTestCleaning] = useState(80);
  const [testFoam, setTestFoam] = useState(80);
  const [testSoil, setTestSoil] = useState(80);
  const [testSkin, setTestSkin] = useState(80);
  const [testNotes, setTestNotes] = useState("");

  // New Failure/Defect Form states
  const [showNewFailForm, setShowNewFailForm] = useState(false);
  const [failBatch, setFailBatch] = useState("");
  const [failType, setFailType] = useState<"Phase Separation" | "Viscosity Collapse" | "pH Drift" | "Haze / Cloudiness" | "Precipitation">("Phase Separation");
  const [failObs, setFailObs] = useState("");
  const [failChem, setFailChem] = useState("");
  const [failCapa, setFailCapa] = useState("");
  const [failSeverity, setFailSeverity] = useState<"Minor" | "Major" | "Critical">("Major");

  // AI Troubleshooter inside failure log
  const [aiTroubleInput, setAiTroubleInput] = useState("");
  const [aiResponse, setAiResponse] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // New SOP Template states
  const [showNewSopForm, setShowNewSopForm] = useState(false);
  const [sopTitle, setSopTitle] = useState("");
  const [sopProdType, setSopProdType] = useState("");
  const [sopAuthor, setSopAuthor] = useState("");
  const [sopStepsRaw, setSopStepsRaw] = useState("");

  // HANDLERS
  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newF: ProjectFolder = {
      id: `proj-${Date.now()}`,
      name: newFolderName,
      description: newFolderDesc || "No description provided.",
      experiments: []
    };
    setFolders([...folders, newF]);
    setSelectedFolderId(newF.id);
    setNewFolderName("");
    setNewFolderDesc("");
    setShowNewFolderForm(false);
  };

  const handleAddExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !selectedFolderId) return;

    // Capture deep-copied immutable formula snapshot from activeFormula
    const capturedSnapshot: FormulaSnapshot | null = (activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) ? {
      id: (activeFormula as any).id || `snap-${Date.now()}`,
      name: activeFormula.name || "Active Formula",
      version: (activeFormula as any).version || "1.0",
      batchSize: activeFormula.batchSize || 100,
      productType: activeFormula.productType || "Liquid Detergent",
      grade: activeFormula.grade || "Standard",
      targetCost: activeFormula.targetCost,
      ingredients: JSON.parse(JSON.stringify(activeFormula.ingredients.map(i => ({
        name: i.name,
        percentage: Number(i.percentage) || 0,
        function: (i as any).function || i.role || "Ingredient",
        costPerKg: i.costPerKg
      })))),
      timestamp: new Date().toISOString()
    } : null;

    const newExp: Experiment = {
      id: `exp-${Date.now()}`,
      title: expTitle,
      date: new Date().toISOString().split("T")[0],
      objective: expObjective || "Standard R&D Trial",
      formulation: expFormulation || (capturedSnapshot ? capturedSnapshot.ingredients.map(i => `${i.name}: ${i.percentage}%`).join(", ") : "No formulation text provided"),
      observations: expObservations || "Experiment recorded in lab notebook.",
      creator: "Lead R&D Chemist",
      snapshot: capturedSnapshot
    };

    setFolders(folders.map(f => {
      if (f.id === selectedFolderId) {
        return { ...f, experiments: [newExp, ...f.experiments] };
      }
      return f;
    }));

    setExpTitle("");
    setExpObjective("");
    setExpFormulation("");
    setExpObservations("");
    setShowNewExpForm(false);
    alert("Experiment committed to notebook project folder with immutable formula snapshot!");
  };

  const handleAddStabilityStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stabSample.trim()) return;

    const newStudy: StabilityStudy = {
      id: `stab-${Date.now()}`,
      sampleName: stabSample,
      startDate: new Date().toISOString().split("T")[0],
      tempCondition: stabTemp,
      humidityCondition: stabHumidity,
      durationWeeks: Number(stabWeeks),
      activeDecayPercent: stabDecay,
      phaseSeparationObserved: stabPhase,
      colorChange: stabColor,
      estimatedShelfLife: stabShelf,
      status: "In Progress"
    };

    setStabilityStudies([newStudy, ...stabilityStudies]);
    setStabSample("");
    setShowNewStabForm(false);
    alert(`Stability study for "${newStudy.sampleName}" is now active.`);
  };

  const handleAddPerformanceTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testFormula.trim()) return;

    const newT: PerformanceTest = {
      id: `test-${Date.now()}`,
      formulaName: testFormula,
      testDate: new Date().toISOString().split("T")[0],
      cleaningEfficiency: Number(testCleaning),
      foamVolumeScore: Number(testFoam),
      soilSuspensionScore: Number(testSoil),
      skinMildnessScore: Number(testSkin),
      notes: testNotes
    };

    setPerfTests([newT, ...perfTests]);
    setTestFormula("");
    setTestNotes("");
    setShowNewTestForm(false);
    alert("Performance test trial scored and visualised.");
  };

  const handleAddFailureLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!failBatch.trim()) return;

    const newFail: FailureLog = {
      id: `fail-${Date.now()}`,
      batchNo: failBatch,
      defectType: failType,
      observations: failObs,
      chemistryAnalysis: failChem,
      capaAction: failCapa,
      severity: failSeverity,
      status: "Under Investigation",
      date: new Date().toISOString().split("T")[0]
    };

    setFailures([newFail, ...failures]);
    setFailBatch("");
    setFailObs("");
    setFailChem("");
    setFailCapa("");
    setShowNewFailForm(false);
    alert(`Defect logged for batch ${newFail.batchNo}. CAPA protocol active.`);
  };

  const handleAddSop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sopTitle.trim()) return;

    const stepsArray = sopStepsRaw
      ? sopStepsRaw.split("\n").map(s => s.trim()).filter(Boolean)
      : ["No instructions provided."];

    const newSop: SOPTemplate = {
      id: `sop-${Date.now()}`,
      title: sopTitle,
      productType: sopProdType || "Universal Liquid Blends",
      author: sopAuthor || "R&D Metrology Lab",
      steps: stepsArray
    };

    setSops([...sops, newSop]);
    setSopTitle("");
    setSopProdType("");
    setSopAuthor("");
    setSopStepsRaw("");
    setShowNewSopForm(false);
    alert(`Manufacturing SOP template "${newSop.title}" authorized.`);
  };

  // AI Troubleshooter API call
  const runAiTroubleshooter = async () => {
    if (!aiTroubleInput.trim()) return;
    setAiLoading(true);
    setAiResponse(null);

    try {
      const response = await fetch("/api/ai/troubleshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: aiTroubleInput,
          productContext: { logs: failures }
        })
      });
      const data = await response.json();
      if (data && data.success && data.troubleshoot) {
        setAiResponse(data.troubleshoot);
      } else {
        alert("Unexpected response format from server.");
      }
    } catch (e) {
      console.error(e);
      alert("Troubleshooter error. Verify your server is running.");
    } finally {
      setAiLoading(false);
    }
  };

  const deleteFolder = (id: string) => {
    if (confirm("Are you sure you want to delete this folder and all its experiments?")) {
      setFolders(folders.filter(f => f.id !== id));
      if (selectedFolderId === id) setSelectedFolderId(null);
    }
  };

  const activeFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans" id="lab-notebook-root">
      
      {/* Tab Header bar */}
      <div className="p-4 bg-white border-b border-gray-200 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-teal-800 flex items-center gap-2">
            🔬 Digital R&D Laboratory & Notebook
          </h2>
          <p className="text-xs text-gray-500">
            Durable repository for raw experiments, accelerated stability ovens, active performance scoreboards, CAPAs, and AI troubleshooting.
          </p>
        </div>

        {/* Sub-tab Pill Navigation */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {[
            { id: "dashboard", label: "Dashboard Hub" },
            { id: "notebook", label: "Lab Notebook" },
            { id: "stability", label: "Stability Studies" },
            { id: "testing", label: "Performance Scorecard" },
            { id: "failures", label: "CAPA / Failure Logs" },
            { id: "sops", label: "SOP Templates" }
          ].map((subTab) => (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id as any)}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                activeSubTab === subTab.id
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-950 hover:bg-slate-200/50"
              }`}
            >
              {subTab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        
        {/* TAB 1: DASHBOARD HUB */}
        {activeSubTab === "dashboard" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
                  <Folder size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Folders</span>
                  <p className="text-lg font-bold text-gray-800">{folders.length}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
                  <Thermometer size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Stability Ovens</span>
                  <p className="text-lg font-bold text-gray-800">
                    {stabilityStudies.filter(s => s.status === "In Progress").length} / {stabilityStudies.length}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Trophy size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Testing Batches</span>
                  <p className="text-lg font-bold text-gray-800">{perfTests.length}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Investigated Failures</span>
                  <p className="text-lg font-bold text-amber-800">
                    {failures.filter(f => f.status !== "Resolved").length} Active
                  </p>
                </div>
              </div>
            </div>

            {/* Quick overview grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Quick Experiments list */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={14} className="text-teal-600" /> Recent Laboratory Trials
                  </h3>
                  <button 
                    onClick={() => setActiveSubTab("notebook")} 
                    className="text-[10px] text-teal-700 font-bold hover:underline"
                  >
                    Go to Notebook →
                  </button>
                </div>

                <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
                  {folders.flatMap(f => f.experiments).slice(0, 4).map((exp) => (
                    <div key={exp.id} className="py-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">{exp.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{exp.date}</span>
                      </div>
                      <p className="text-gray-500 mt-0.5 line-clamp-1">{exp.objective}</p>
                      <span className="text-[9px] bg-slate-100 text-gray-500 px-1.5 py-0.25 rounded font-mono mt-1 inline-block">
                        {exp.creator}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accelerated Stability Studies list */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Thermometer size={14} className="text-blue-600" /> Oven Incubations (Stability)
                  </h3>
                  <button 
                    onClick={() => setActiveSubTab("stability")} 
                    className="text-[10px] text-blue-700 font-bold hover:underline"
                  >
                    View All →
                  </button>
                </div>

                <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
                  {stabilityStudies.map((s) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5 max-w-xs">
                        <p className="font-bold text-gray-800 truncate">{s.sampleName}</p>
                        <p className="text-[10px] text-gray-400">
                          {s.tempCondition} • {s.humidityCondition}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          s.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          s.status === "In Progress" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {s.status}
                        </span>
                        <p className="text-[9px] text-slate-500 font-mono mt-1 font-bold">{s.estimatedShelfLife} Est.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Performance charts overview */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy size={14} className="text-emerald-600" /> Active Performance Scorecard
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Physical laboratory sensory/cleaning evaluation benchmarks (Trial runs vs. controls).</p>
                </div>
                <button 
                  onClick={() => setActiveSubTab("testing")} 
                  className="text-[10px] text-emerald-700 font-bold hover:underline"
                >
                  Manage Trials →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {perfTests.map((t) => (
                  <div key={t.id} className="p-3.5 bg-slate-50 rounded-xl border border-gray-150 space-y-3 shadow-sm hover:bg-white transition-all">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="font-bold text-gray-800 text-xs truncate max-w-[150px]">{t.formulaName}</span>
                      <span className="text-[9px] text-gray-400 font-mono">{t.testDate}</span>
                    </div>
                    
                    <div className="space-y-2 text-[10px]">
                      {/* Cleaning Efficiency */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-gray-500 font-semibold">
                          <span>Cleaning % (Soil Removal)</span>
                          <span className="font-bold text-teal-800">{t.cleaningEfficiency}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#0f766e] h-1.5 rounded-full transition-all duration-500" style={{ width: `${t.cleaningEfficiency}%` }}></div>
                        </div>
                      </div>

                      {/* Foam Volume */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-gray-500 font-semibold">
                          <span>Foaming Density</span>
                          <span className="font-bold text-cyan-700">{t.foamVolumeScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#06b6d4] h-1.5 rounded-full transition-all duration-500" style={{ width: `${t.foamVolumeScore}%` }}></div>
                        </div>
                      </div>

                      {/* Skin Mildness */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-gray-500 font-semibold">
                          <span>Skin Mildness</span>
                          <span className="font-bold text-emerald-700">{t.skinMildnessScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#10b981] h-1.5 rounded-full transition-all duration-500" style={{ width: `${t.skinMildnessScore}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LAB NOTEBOOK */}
        {activeSubTab === "notebook" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            
            {/* Sidebar Folder list */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Project Folders</span>
                  <button 
                    onClick={() => setShowNewFolderForm(!showNewFolderForm)}
                    className="p-1 hover:bg-slate-100 rounded text-teal-700"
                    title="New Folder"
                  >
                    <FolderPlus size={16} />
                  </button>
                </div>

                {showNewFolderForm && (
                  <form onSubmit={handleAddFolder} className="bg-teal-50/50 p-2.5 rounded border border-teal-100 space-y-2 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Folder Name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                    />
                    <textarea
                      placeholder="Description"
                      rows={2}
                      value={newFolderDesc}
                      onChange={(e) => setNewFolderDesc(e.target.value)}
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button 
                        type="button" 
                        onClick={() => setShowNewFolderForm(false)}
                        className="px-2 py-1 bg-white text-gray-500 rounded border hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-2 py-1 bg-teal-700 text-white rounded hover:bg-teal-800 font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {folders.map((f) => (
                    <div 
                      key={f.id}
                      onClick={() => setSelectedFolderId(f.id)}
                      className={`group p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-all ${
                        selectedFolderId === f.id
                          ? "bg-teal-50 text-teal-900 font-bold border border-teal-200"
                          : "text-gray-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Folder size={14} className={selectedFolderId === f.id ? "text-teal-700" : "text-gray-400"} />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] bg-slate-200/60 text-slate-600 px-1.5 py-0.25 rounded font-mono font-bold">
                          {f.experiments.length}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }}
                          className="text-gray-300 hover:text-red-600 group-hover:opacity-100 opacity-0 transition-opacity p-0.5"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notebook Work Area */}
            <div className="lg:col-span-3 space-y-4">
              {activeFolder ? (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
                  <div className="flex justify-between items-start border-b pb-3 gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{activeFolder.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-1">{activeFolder.description}</p>
                    </div>
                    <button
                      onClick={() => setShowNewExpForm(!showNewExpForm)}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Add Trial / Experiment
                    </button>
                  </div>

                  {/* Add Trial Form */}
                  {showNewExpForm && (
                    <form onSubmit={handleAddExperiment} className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-teal-800 tracking-wider block">
                          📝 Record New Physical Formulation Experiment
                        </span>
                      </div>

                      {/* Active Formula Snapshot Capture Status Banner */}
                      {activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0 ? (
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                              <Sparkles size={14} className="text-emerald-600" />
                              Active Formula Ready for Snapshot: "{activeFormula.name}"
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (activeFormula) {
                                  if (!expTitle) setExpTitle(`Trial: ${activeFormula.name}`);
                                  setExpFormulation(activeFormula.ingredients.map(i => `${i.name}: ${i.percentage}%`).join(", "));
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded transition-all cursor-pointer shadow-sm"
                            >
                              Auto-fill Text from Active Formula
                            </button>
                          </div>
                          <div className="text-[10px] text-emerald-800 font-mono">
                            Type: <span className="font-bold">{activeFormula.productType || "Detergent"}</span> | Grade: <span className="font-bold">{activeFormula.grade || "Standard"}</span> | Ingredients: <span className="font-bold">{activeFormula.ingredients.length}</span>
                          </div>
                          <p className="text-[10px] text-emerald-700 font-sans">
                            📸 An immutable snapshot of this exact active formula will be permanently attached to this experiment log upon saving.
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[10px] text-slate-600 flex items-center justify-between">
                          <span>ℹ️ No Active Formula in workspace. Experiment will be saved as a manual text log without an attached snapshot.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block font-semibold text-gray-600 mb-0.5">Experiment Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Trial 4 - 3x Non-Ionic Viscosity Boost"
                            value={expTitle}
                            onChange={(e) => setExpTitle(e.target.value)}
                            className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-600 mb-0.5">Objective / Chemical Hypothesis</label>
                          <input
                            type="text"
                            placeholder="e.g. Substituting NaCl with Cocamide DEA as viscosity coupler"
                            value={expObjective}
                            onChange={(e) => setExpObjective(e.target.value)}
                            className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="block font-semibold text-gray-600">Trial Formulation & Active Ratios</label>
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  setExpFormulation(prev => prev ? `${prev}, ${val}` : val);
                                  e.target.value = "";
                                }
                              }}
                              defaultValue=""
                              className="text-[10px] bg-teal-50 border border-teal-200 text-teal-800 rounded px-2 py-0.5 focus:outline-none cursor-pointer"
                            >
                              <option value="" disabled>+ Insert Ingredient from Universal Library</option>
                              {getAllUniversalIngredients().map(ing => (
                                <option key={ing.id} value={ing.name}>{ing.name}</option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="e.g. SLES 70%: 12g, CDEA: 2.5g, CAPB: 3g, Soda Ash: 1g, Water: 81.5g"
                            value={expFormulation}
                            onChange={(e) => setExpFormulation(e.target.value)}
                            className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-600 mb-0.5">Lab-Verified Observations & Drift Analysis</label>
                          <textarea
                            rows={3}
                            placeholder="Detail physical phase, density, transparency, initial viscosity drift over 24h, pH stabilization range..."
                            value={expObservations}
                            onChange={(e) => setExpObservations(e.target.value)}
                            className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button 
                          type="button" 
                          onClick={() => setShowNewExpForm(false)}
                          className="px-3 py-1.5 bg-white text-gray-500 border rounded hover:bg-gray-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-3 py-1.5 bg-teal-700 text-white font-bold rounded hover:bg-teal-800 cursor-pointer"
                        >
                          Commit to Project Folder
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Experiments List */}
                  <div className="space-y-4">
                    {activeFolder.experiments.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-xs">
                        No experiments logged in this project yet. Click "Add Trial" above to record your first physical formulation log.
                      </div>
                    ) : (
                      activeFolder.experiments.map((exp) => (
                        <div key={exp.id} className="border border-slate-200 rounded-xl p-4 bg-[#fdfefe] space-y-3 shadow-xs">
                          <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                            <div>
                              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                <FlaskConical size={13} className="text-teal-600" /> {exp.title}
                              </h4>
                              <p className="text-[10px] text-gray-500 mt-0.5">Objective: {exp.objective}</p>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {exp.date}
                            </span>
                          </div>

                          {/* Immutable Formula Snapshot Section */}
                          {exp.snapshot ? (
                            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold text-[9px] flex items-center gap-1 tracking-wider uppercase">
                                    <Camera size={11} /> IMMUTABLE SNAPSHOT
                                  </span>
                                  <span className="font-bold text-xs text-white">{exp.snapshot.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">v{exp.snapshot.version || "1.0"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-300">
                                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{exp.snapshot.productType || "Detergent"}</span>
                                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{exp.snapshot.grade || "Standard"}</span>
                                  {exp.snapshot.targetCost !== undefined && (
                                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                                      ₹{exp.snapshot.targetCost}/kg
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Snapshot Ingredients Grid */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider px-0.5">
                                  <span>Captured Formula Composition ({exp.snapshot.ingredients.length} ingredients)</span>
                                  <span>Captured: {new Date(exp.snapshot.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                  {exp.snapshot.ingredients.map((ing, idx) => (
                                    <div key={idx} className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60 flex items-center justify-between text-[11px]">
                                      <span className="text-slate-200 truncate max-w-[170px]" title={ing.name}>
                                        {ing.name}
                                      </span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {ing.function && (
                                          <span className="text-[9px] text-slate-400 truncate max-w-[85px] hidden sm:inline">
                                            {ing.function}
                                          </span>
                                        )}
                                        <span className="font-bold text-teal-400 font-mono bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/50">
                                          {ing.percentage}%
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs">
                              <span className="text-[8px] font-bold text-[#0f766e] uppercase block">Tested Formulation (Text Log)</span>
                              <p className="font-mono text-gray-700 leading-relaxed whitespace-pre-wrap">{exp.formulation}</p>
                            </div>
                          )}

                          <div className="bg-teal-50/20 p-2.5 rounded-lg border border-teal-50/50 space-y-1 text-xs">
                            <span className="text-[8px] font-bold text-teal-800 uppercase block">Lab Observations & Compatibility</span>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{exp.observations}</p>
                          </div>
                          
                          <div className="text-[9px] text-gray-400 text-right font-semibold">
                            Logged by: {exp.creator}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border p-12 text-center text-gray-400 text-xs">
                  Select or create a Project Folder on the left to review your lab trials.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: STABILITY STUDIES */}
        {activeSubTab === "stability" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Thermometer size={14} className="text-blue-600" /> Accelerated Stability Studies Tracker
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Monitor surfactant concentration drift, active matter decay, phase separations, and estimated shelf life.</p>
                </div>
                <button
                  onClick={() => setShowNewStabForm(!showNewStabForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> New Study
                </button>
              </div>

              {showNewStabForm && (
                <form onSubmit={handleAddStabilityStudy} className="bg-[#f0f7ff] p-4 rounded-xl border border-blue-100 space-y-3 text-xs max-w-3xl">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block border-b pb-1">
                    🔬 Deploy Sample to Accelerated Aging Incubators
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Sample Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CAPB Synergised Dishwash Trial #4"
                        value={stabSample}
                        onChange={(e) => setStabSample(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Temperature Oven Condition</label>
                      <input
                        type="text"
                        placeholder="e.g. 45°C (Accelerated Oven)"
                        value={stabTemp}
                        onChange={(e) => setStabTemp(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Humidity Chamber RH</label>
                      <input
                        type="text"
                        placeholder="e.g. 60% RH"
                        value={stabHumidity}
                        onChange={(e) => setStabHumidity(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Incubation Period (Weeks)</label>
                      <input
                        type="number"
                        value={stabWeeks}
                        onChange={(e) => setStabWeeks(Number(e.target.value))}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Measured Active Matter Decay (%)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1.2% Decay"
                        value={stabDecay}
                        onChange={(e) => setStabDecay(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Phase Separation Observed</label>
                      <select
                        value={stabPhase}
                        onChange={(e) => setStabPhase(e.target.value as any)}
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                      >
                        <option value="None">None (Perfect Stability)</option>
                        <option value="Slight Syneresis">Slight Syneresis (Thinning)</option>
                        <option value="Severe Phase Separation">Severe Phase Separation (Biphase)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Color Change & Physical Drift Observations</label>
                      <input
                        type="text"
                        placeholder="e.g. Slight yellow tinting (APHA 10 to 18)"
                        value={stabColor}
                        onChange={(e) => setStabColor(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Estimated Shelf Life (Calculated)</label>
                      <input
                        type="text"
                        placeholder="e.g. 24 Months"
                        value={stabShelf}
                        onChange={(e) => setStabShelf(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => setShowNewStabForm(false)}
                      className="px-3 py-1.5 bg-white text-gray-500 border rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
                    >
                      Initialize Incubation
                    </button>
                  </div>
                </form>
              )}

              {/* Studies grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stabilityStudies.map((s) => (
                  <div key={s.id} className="border border-gray-150 p-4 rounded-xl bg-slate-50/50 hover:bg-white transition-all space-y-3.5 relative overflow-hidden">
                    {/* Status corner badge */}
                    <span className={`absolute right-3 top-3 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      s.status === "In Progress" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {s.status}
                    </span>

                    <div className="space-y-0.5">
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Sample Chamber Unit</span>
                      <h4 className="font-bold text-slate-800 text-xs">{s.sampleName}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-b pb-2 border-dashed border-gray-200">
                      <div>
                        <span className="font-sans text-[8px] text-gray-400 block uppercase font-bold">Chamber Temp</span>
                        <span className="text-gray-700 font-bold">{s.tempCondition}</span>
                      </div>
                      <div>
                        <span className="font-sans text-[8px] text-gray-400 block uppercase font-bold">Chamber RH</span>
                        <span className="text-gray-700 font-bold">{s.humidityCondition}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100">
                      <div>
                        <span className="text-[8px] text-gray-400 block uppercase font-bold">Incubation</span>
                        <span className="text-gray-800 font-bold font-mono">{s.durationWeeks} Weeks</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-400 block uppercase font-bold">Active Decay</span>
                        <span className="text-rose-600 font-bold font-mono">{s.activeDecayPercent}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-400 block uppercase font-bold">Phase Separation</span>
                        <span className={`font-bold ${s.phaseSeparationObserved === "None" ? "text-emerald-700" : "text-amber-700"}`}>
                          {s.phaseSeparationObserved}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">Estimated Shelf Life:</span>
                        <span className="font-bold text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {s.estimatedShelfLife}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">Started: {s.startDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PERFORMANCE TESTING SCORECARD */}
        {activeSubTab === "testing" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy size={14} className="text-emerald-600" /> Physical Product Evaluation Scorecard
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Author and log human-verified sensory and efficiency tests. Chart trial parameters versus your baseline controls.</p>
                </div>
                <button
                  onClick={() => setShowNewTestForm(!showNewTestForm)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> Record Testing Score
                </button>
              </div>

              {showNewTestForm && (
                <form onSubmit={handleAddPerformanceTest} className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 space-y-3 text-xs max-w-3xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block border-b pb-1">
                    📊 Log Standardised Panel Evaluation Scores
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Tested Formula Name / Trial ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. eco-dish-v4-high-glucoside"
                        value={testFormula}
                        onChange={(e) => setTestFormula(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Cleaning Efficiency (Soil Removal %)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={testCleaning}
                        onChange={(e) => setTestCleaning(Number(e.target.value))}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Foam Volume / Density (1-100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={testFoam}
                        onChange={(e) => setTestFoam(Number(e.target.value))}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Soil Suspension / Anti-Redeposition (1-100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={testSoil}
                        onChange={(e) => setTestSoil(Number(e.target.value))}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Skin Mildness / Dermatological (1-100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={testSkin}
                        onChange={(e) => setTestSkin(Number(e.target.value))}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-600 mb-0.5">Tester & Panelist Observations</label>
                    <textarea
                      rows={2}
                      placeholder="Add sensory observations like rinsability, clouding in cold water, skin feel after use..."
                      value={testNotes}
                      onChange={(e) => setTestNotes(e.target.value)}
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => setShowNewTestForm(false)}
                      className="px-3 py-1.5 bg-white text-gray-500 border rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700"
                    >
                      Save Evaluation
                    </button>
                  </div>
                </form>
              )}

              {/* Testing Score Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-150">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-gray-500 border-b">
                    <tr>
                      <th className="p-3">Tested Formulation</th>
                      <th className="p-3 text-center">Soil Removal %</th>
                      <th className="p-3 text-center">Foaming</th>
                      <th className="p-3 text-center">Anti-Redeposition</th>
                      <th className="p-3 text-center">Skin Mildness</th>
                      <th className="p-3">Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {perfTests.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-gray-800">{t.formulaName}</td>
                        <td className="p-3 text-center font-mono font-bold text-teal-800">{t.cleaningEfficiency}%</td>
                        <td className="p-3 text-center font-mono font-bold text-cyan-700">{t.foamVolumeScore}/100</td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-700">{t.soilSuspensionScore}/100</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-700">{t.skinMildnessScore}/100</td>
                        <td className="p-3 text-gray-500 max-w-xs truncate" title={t.notes}>{t.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FAILURE LOGS & CAPA */}
        {activeSubTab === "failures" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            
            {/* AI CHEMISTRY TROUBLESHOOTER OVERVIEW */}
            <div className="bg-gradient-to-r from-teal-800 to-[#0d645c] text-white p-5 rounded-2xl shadow-sm border space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
                <Sparkles size={180} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-teal-200 font-bold block">
                  AI Recommendation Engine
                </span>
                <h3 className="text-base font-bold flex items-center gap-2">
                  🔮 AI Surfactant & Viscosity Troubleshooter
                </h3>
                <p className="text-xs text-teal-50 max-w-2xl">
                  Describe batch issues, unexpected phase separations, or sudden viscosity crashes. The chemistry model will diagnose possible micelle salting-out effects or buffer failures.
                </p>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={aiTroubleInput}
                  onChange={(e) => setAiTroubleInput(e.target.value)}
                  placeholder="e.g. My LAS-SLES formulation collapsed into watery liquid after adding 2% salt, and a white haze is precipitating out..."
                  className="w-full text-xs text-gray-800 bg-white border border-teal-100 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium placeholder:text-gray-400"
                />
                
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] bg-teal-900/50 text-teal-200 border border-teal-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    🛡️ AI Recommendation — Verify With Physical Retest
                  </span>
                  
                  <button
                    onClick={runAiTroubleshooter}
                    disabled={aiLoading || !aiTroubleInput.trim()}
                    className="bg-white hover:bg-teal-50 text-teal-800 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading ? <RefreshCw className="animate-spin" size={13} /> : <Sparkles size={13} />}
                    {aiLoading ? "Analyzing Chemistry..." : "Analyze Batch Defect"}
                  </button>
                </div>
              </div>

              {/* AI Response Display */}
              {aiResponse && (
                <div className="bg-white text-slate-800 p-4.5 rounded-xl border border-teal-200 space-y-4 shadow-md animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold text-teal-800">Chemistry Defect Diagnostics</span>
                    <span className="text-[9px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-mono font-bold">
                      Issue: {aiResponse.issue || "Diagnosed"}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {aiResponse.causes?.map((c: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-slate-800">
                            {idx + 1}. {c.cause}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            c.confidence === "High" ? "bg-red-50 text-red-700 border border-red-100" :
                            c.confidence === "Medium" ? "bg-orange-50 text-orange-700 border border-orange-100" :
                            "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {c.confidence} Confidence
                          </span>
                        </div>

                        <div className="text-[11px] space-y-1">
                          <p className="text-gray-500">
                            <span className="font-bold text-gray-700">Chemistry Principle:</span> {c.chemistryPrinciple}
                          </p>
                          <p className="text-teal-800 font-medium bg-teal-50/50 p-1.5 rounded border border-teal-50">
                            <span className="font-bold text-teal-900">Database Correlation:</span> {c.relationToUserData}
                          </p>
                        </div>

                        <div className="pt-1.5 space-y-1">
                          <span className="font-bold text-[9px] text-gray-400 uppercase tracking-wider block">Recommended Actions</span>
                          <ul className="list-disc pl-4 space-y-1 text-gray-600 text-[11px]">
                            {c.correctiveActions?.map((act: string, aIdx: number) => (
                              <li key={aIdx}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}

                    {aiResponse.preventativeMeasures && aiResponse.preventativeMeasures.length > 0 && (
                      <div className="bg-emerald-50/20 p-3 rounded-lg border border-emerald-100/60 text-[11px]">
                        <span className="font-bold block text-emerald-900 text-xs mb-1">Preventative Standard Operating Procedures (SOPs):</span>
                        <ul className="list-disc pl-4 space-y-1 text-emerald-800 font-medium">
                          {aiResponse.preventativeMeasures.map((measure: string, mIdx: number) => (
                            <li key={mIdx}>{measure}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DEFECT & FAILURE LOG */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-500" /> Laboratory Defect & CAPA Log
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Record production failures, perform root cause chemistry audit, and document corrective actions.</p>
                </div>
                <button
                  onClick={() => setShowNewFailForm(!showNewFailForm)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> Log Batch Failure
                </button>
              </div>

              {showNewFailForm && (
                <form onSubmit={handleAddFailureLog} className="bg-amber-50/20 p-4 rounded-xl border border-amber-100 space-y-3 text-xs max-w-3xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block border-b pb-1">
                    ⚠️ Log Batch Defect & Initiate CAPA Investigation
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Failed Batch # No.</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BTCH-2026-004"
                        value={failBatch}
                        onChange={(e) => setFailBatch(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Defect Chemistry Class</label>
                      <select
                        value={failType}
                        onChange={(e) => setFailType(e.target.value as any)}
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                      >
                        <option value="Phase Separation">Phase Separation (Emulsion Collapse)</option>
                        <option value="Viscosity Collapse">Viscosity Collapse (Thinning)</option>
                        <option value="pH Drift">pH Drift (Ester/Sulfonic Acid Drift)</option>
                        <option value="Haze / Cloudiness">Haze / Cloudiness (Precipitation)</option>
                        <option value="Precipitation">Salt/Sulfate Precipitation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Severity</label>
                      <select
                        value={failSeverity}
                        onChange={(e) => setFailSeverity(e.target.value as any)}
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                      >
                        <option value="Minor">Minor (Remedial Blending Possible)</option>
                        <option value="Major">Major (Requires Active Restructuring)</option>
                        <option value="Critical">Critical (Dumped Run / Re-synthesise)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-600 mb-0.5">Defect Observations</label>
                    <textarea
                      rows={2}
                      placeholder="Describe what occurred (e.g. thinning after sodium sulfate additions...)"
                      value={failObs}
                      onChange={(e) => setFailObs(e.target.value)}
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Chemistry Root Cause Analysis (Technician-entered)</label>
                      <textarea
                        rows={2}
                        placeholder="Detail micellar charge interactions, incorrect active content or high salt compression..."
                        value={failChem}
                        onChange={(e) => setFailChem(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Corrective & Preventive Action (CAPA) Log</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Supplement with 1% cocamide DEA to stabilize micellar networks..."
                        value={failCapa}
                        onChange={(e) => setFailCapa(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => setShowNewFailForm(false)}
                      className="px-3 py-1.5 bg-white text-gray-500 border rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded hover:bg-amber-700"
                    >
                      Commit Failure Log
                    </button>
                  </div>
                </form>
              )}

              {/* Failures List */}
              <div className="space-y-4">
                {failures.map((f) => (
                  <div key={f.id} className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3 hover:border-amber-200 transition-all">
                    <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">R&D Root Cause Audit</span>
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <AlertTriangle size={13} className="text-amber-500" /> Batch: {f.batchNo} ({f.defectType})
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          f.severity === "Critical" ? "bg-red-100 text-red-800 border border-red-200" :
                          f.severity === "Major" ? "bg-orange-100 text-orange-800 border border-orange-200" :
                          "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        }`}>
                          {f.severity} Defect
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          f.status === "Resolved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {f.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                      <span className="font-bold block text-gray-700 text-[10px] mb-0.5 uppercase">Technician Observations:</span>
                      {f.observations}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-red-50/20 p-2.5 rounded-lg border border-red-50/50">
                        <span className="font-bold text-rose-800 text-[10px] uppercase block mb-1">Chemistry Cause Analysis</span>
                        <p className="text-gray-600 font-medium leading-relaxed font-mono text-[11px]">{f.chemistryAnalysis}</p>
                      </div>

                      <div className="bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-50/50">
                        <span className="font-bold text-emerald-800 text-[10px] uppercase block mb-1">CAPA Strategy (Corrective Action)</span>
                        <p className="text-gray-600 font-medium leading-relaxed font-mono text-[11px]">{f.capaAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MANUFACTURING SOP TEMPLATES */}
        {activeSubTab === "sops" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clipboard size={14} className="text-teal-600" /> Authorized Blending SOP Templates
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Author standard process recipes detailing multi-phase shear sequences, salt additions, and neutralization boundaries.</p>
                </div>
                <button
                  onClick={() => setShowNewSopForm(!showNewSopForm)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> New Process SOP
                </button>
              </div>

              {showNewSopForm && (
                <form onSubmit={handleAddSop} className="bg-teal-50/30 p-4 rounded-xl border border-teal-100 space-y-3 text-xs max-w-3xl">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block border-b pb-1">
                    📋 Author New Industrial Manufacturing SOP Template
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">SOP Title / Document ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SOP-15: Cold Blending Conc. Surfactant"
                        value={sopTitle}
                        onChange={(e) => setSopTitle(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Product Type Compatibility</label>
                      <input
                        type="text"
                        placeholder="e.g. Heavy-Duty Liquid Detergents"
                        value={sopProdType}
                        onChange={(e) => setSopProdType(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Authoring Engineer</label>
                      <input
                        type="text"
                        placeholder="e.g. R&D Plant Engineering Team"
                        value={sopAuthor}
                        onChange={(e) => setSopAuthor(e.target.value)}
                        className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-600 mb-0.5">Mixing Sequence & Operations (One instruction per line)</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="e.g.&#10;Charge 70% soft water into blending vessel.&#10;Incorporate active Soda Ash builders under slow agitation...&#10;Titrate actives pH to 7.2"
                      value={sopStepsRaw}
                      onChange={(e) => setSopStepsRaw(e.target.value)}
                      className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e] font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => setShowNewSopForm(false)}
                      className="px-3 py-1.5 bg-white text-gray-500 border rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-teal-700 text-white font-bold rounded hover:bg-teal-800"
                    >
                      Authorize SOP
                    </button>
                  </div>
                </form>
              )}

              {/* SOP Display Lists */}
              <div className="space-y-6">
                {sops.map((sop) => (
                  <div key={sop.id} className="border border-slate-100 rounded-xl p-5 bg-slate-50/40 space-y-4">
                    <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Clipboard size={14} className="text-teal-700" /> {sop.title}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Target Family: {sop.productType}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold bg-white border px-2 py-0.5 rounded shadow-sm">
                        Auth: {sop.author}
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-150 p-4 space-y-3 shadow-sm">
                      <span className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider block">
                        ⚙️ Verified Blending Flowchart Sequence
                      </span>
                      <ol className="space-y-2.5">
                        {sop.steps.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-xs items-start leading-relaxed text-gray-600">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-50 text-[#0f766e] border border-teal-100 font-bold flex items-center justify-center font-mono text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
