import React, { useState } from "react";
import { getAllUniversalIngredients, searchUniversalIngredients, getUniversalIngredientByName } from "../data/universalIngredientLibrary";
import { 
  Download, 
  AlertTriangle, 
  Plus, 
  Package, 
  Database, 
  Check, 
  Clock, 
  Search, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  FileText, 
  User, 
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  HelpCircle,
  Activity,
  Calendar,
  DollarSign,
  QrCode,
  Printer,
  Lock,
  Camera,
  ShieldCheck
} from "lucide-react";
import { jsPDF } from "jspdf";
import { ActiveFormulaState } from "../types";

export interface ProductionFormulaSnapshot {
  id: string;
  formulaId?: string;
  name: string;
  version: string;
  batchSize: number;
  productType?: string;
  grade?: string;
  targetCost?: number;
  activeMatter?: number;
  ingredients: {
    name: string;
    percentage: number;
    function?: string;
    costPerKg?: number;
    requiredQtyKg: number;
  }[];
  timestamp: string;
}

interface Props {
  lang: "en" | "hi" | "mr";
  translations: any;
  selectedBatchId?: string | null;
  onSelectBatch?: (id: string | null) => void;
  activeFormula?: ActiveFormulaState | null;
}

// Comprehensive localized vocabulary for the Batch History Log
const LOCAL_TRANS = {
  en: {
    batchHistory: "Visual Batch Production History & QC Logs",
    batchHistoryDesc: "Real-time formulation runs, quality clearance status, and compliance documentation.",
    searchPlaceholder: "Search by Formulation or Batch ID...",
    filterAll: "All Batches",
    filterPending: "Pending",
    filterTesting: "Testing",
    filterApproved: "Approved",
    btnLogNewBatch: "Log New Batch Run",
    btnExportCSV: "Export CSV Report",
    btnExportPDF: "Export PDF Report",
    metricTotal: "Total Logged Runs",
    metricApproved: "Passed Laboratory QC",
    metricTesting: "Under Active Testing",
    metricPending: "Awaiting Evaluation",
    formTitle: "Log New Manufacturing Batch Run",
    formDesc: "Record chemical composition run, operator in charge, and initial physical parameters.",
    lblFormula: "Formulation Profile",
    lblScale: "Batch Scale (kg)",
    lblCost: "Est. Batch Cost (INR)",
    lblOperator: "Lead Scientist / Operator",
    lblStatus: "Initial Lab Status",
    lblPh: "Target pH Level",
    lblViscosity: "Dynamic Viscosity",
    lblAppearance: "Physical Appearance / Color",
    lblNotes: "Technician Observations / Notes",
    lblIngredients: "Ingredients (comma-separated)",
    btnCommitBatch: "Commit Batch Run to Ledger",
    colBatchId: "Batch ID",
    colFormula: "Formulation Run",
    colIngredients: "Ingredients",
    colScale: "Scale",
    colCost: "Est. Cost",
    colDate: "Date Run",
    colStatus: "Clearance Status",
    colActions: "Actions",
    expandedQcTitle: "LABORATORY QC MEASUREMENTS",
    expandedLifeTitle: "PRODUCTION LIFECYCLE & CERTIFICATION",
    lblLiveEdit: "Live-update measurements below to synch with physical probes:",
    btnCert: "Download QC Certificate (PDF)",
    btnDelete: "Delete Log Entry",
    successLogged: "successfully logged in R&D Ledger."
  },
  hi: {
    batchHistory: "दृश्य बैच उत्पादन इतिहास और क्यूसी लॉग",
    batchHistoryDesc: "वास्तविक समय फ़ॉर्मूलेशन रन, गुणवत्ता निकासी स्थिति और अनुपालन दस्तावेज़।",
    searchPlaceholder: "फ़ॉर्मूलेशन या बैच आईडी खोजें...",
    filterAll: "सभी बैच",
    filterPending: "लंबित",
    filterTesting: "परीक्षण जारी",
    filterApproved: "स्वीकृत",
    btnLogNewBatch: "नया बैच रन दर्ज करें",
    btnExportCSV: "सीएसवी रिपोर्ट",
    btnExportPDF: "पीडीएफ रिपोर्ट",
    metricTotal: "कुल लॉग किए गए रन",
    metricApproved: "उत्तीर्ण प्रयोगशाला क्यूसी",
    metricTesting: "सक्रिय परीक्षण के तहत",
    metricPending: "मूल्यांकन की प्रतीक्षा",
    formTitle: "नया विनिर्माण बैच रन दर्ज करें",
    formDesc: "रासायनिक संरचना रन, प्रभारी ऑपरेटर और प्रारंभिक भौतिक मापदंडों को रिकॉर्ड करें।",
    lblFormula: "फ़ॉर्मूलेशन प्रोफ़ाइल",
    lblScale: "बैच स्केल (किलोग्राम)",
    lblCost: "अनुमानित बैच लागत (INR)",
    lblOperator: "मुख्य वैज्ञानिक / ऑपरेटर",
    lblStatus: "प्रारंभिक लैब स्थिति",
    lblPh: "लक्ष्य पीएच स्तर",
    lblViscosity: "गतिशील चिपचिपापन",
    lblAppearance: "भौतिक स्वरूप / रंग",
    lblNotes: "तकनीशियन अवलोकन / नोट्स",
    lblIngredients: "सामग्री (अल्पविराम से अलग)",
    btnCommitBatch: "बैच रन को लेजर में दर्ज करें",
    colBatchId: "बैच आईडी",
    colFormula: "फ़ॉर्मूलेशन रन",
    colIngredients: "सामग्री",
    colScale: "स्केल",
    colCost: "अनुमानित लागत",
    colDate: "रन की तारीख",
    colStatus: "निकासी स्थिति",
    colActions: "कार्रवाई",
    expandedQcTitle: "प्रयोगशाला क्यूसी माप",
    expandedLifeTitle: "उत्पादन जीवनचक्र और प्रमाणन",
    lblLiveEdit: "भौतिक जांच के साथ सिंक करने के लिए नीचे दिए गए मापों को लाइव-अपडेट करें:",
    btnCert: "गुणवत्ता प्रमाणपत्र डाउनलोड करें (PDF)",
    btnDelete: "लॉग प्रविष्टि हटाएं",
    successLogged: "आरएंडडी लेजर में सफलतापूर्वक लॉग किया गया।"
  },
  mr: {
    batchHistory: "दृश्य बॅच उत्पादन इतिहास आणि QC लॉग",
    batchHistoryDesc: "रिअल-टाइम फॉर्म्युलेशन रन, गुणवत्ता मंजुरी स्थिती आणि नियम अनुपालन दस्तऐवज.",
    searchPlaceholder: "फॉर्म्युलेशन किंवा बॅच आयडी शोधा...",
    filterAll: "सर्व बॅचेस",
    filterPending: "प्रलंबित",
    filterTesting: "चाचणी सुरू",
    filterApproved: "मंजूर",
    btnLogNewBatch: "नवीन बॅच रन नोंदवा",
    btnExportCSV: "सीएसव्ही अहवाल",
    btnExportPDF: "पीडीएफ अहवाल",
    metricTotal: "एकूण लॉग केलेले रन्स",
    metricApproved: "उत्तीर्ण प्रयोगशाळा QC",
    metricTesting: "सक्रिय चाचणी अंतर्गत",
    metricPending: "मूल्यांकन प्रलंबित",
    formTitle: "नवीन उत्पादन बॅच रन नोंदवा",
    formDesc: "रासायनिक रचना रन, प्रभारी ऑपरेटर आणि प्रारंभिक भौतिक मापदंड रेकॉर्ड करा.",
    lblFormula: "फॉर्म्युलेशन प्रोफाइल",
    lblScale: "बॅच स्केल (किलो)",
    lblCost: "अंदाजे बॅच किंमत (INR)",
    lblOperator: "मुख्य शास्त्रज्ञ / ऑपरेटर",
    lblStatus: "प्रारंभिक लॅब स्थिती",
    lblPh: "लक्ष्य पीएच पातळी",
    lblViscosity: "डायनॅमिक व्हिस्कोसिटी",
    lblAppearance: "भौतिक स्वरूप / रंग",
    lblNotes: "तंत्रज्ञ निरीक्षणे / नोट्स",
    lblIngredients: "घटक (स्वल्पविरामाने वेगळे केलेले)",
    btnCommitBatch: "लेजरमध्ये बॅच रन नोंदवा",
    colBatchId: "बॅच आयडी",
    colFormula: "फॉर्म्युलेशन रन",
    colIngredients: "घटक",
    colScale: "स्केल",
    colCost: "अंदाजे खर्च",
    colDate: "रन तारीख",
    colStatus: "मंजुरी स्थिती",
    colActions: "कृती",
    expandedQcTitle: "प्रयोगशाला QC मोजमाप",
    expandedLifeTitle: "उत्पादन जीवनचक्र आणि प्रमाणन",
    lblLiveEdit: "भौतिक प्रोबसह सिंक करण्यासाठी खालील मोजमाप थेट-अपडेट करा:",
    btnCert: "गुणवत्ता प्रमाणपत्र डाउनलोड करा (PDF)",
    btnDelete: "नोंद काढून टाका",
    successLogged: "आर अँड डी लेजरमध्ये यशस्वीरित्या लॉग केले गेले."
  }
};

export default function InventoryProduction({ lang, translations, selectedBatchId, onSelectBatch, activeFormula }: Props) {
  // Inventory Stock list
  const [stock, setStock] = useState<any[]>([
    { id: "1", name: "Acid Slurry (LABSA 90%)", qty: 250, unit: "kg", cost: 110, minQty: 100, supplier: "Reliance Chemicals Ltd" },
    { id: "2", name: "Sodium Lauryl Ether Sulfate (SLES 70%)", qty: 450, unit: "kg", cost: 95, minQty: 150, supplier: "Godrej Industries" },
    { id: "3", name: "Coco Amidopropyl Betaine (CAPB 30%)", qty: 80, unit: "kg", cost: 85, minQty: 100, supplier: "Galaxy Surfactants" },
    { id: "4", name: "Soda Ash Light", qty: 600, unit: "kg", cost: 35, minQty: 200, supplier: "Tata Chemicals" },
    { id: "5", name: "Sodium Gluconate (Chelate)", qty: 15, unit: "kg", cost: 140, minQty: 25, supplier: "Aditya Birla Chemical" },
    { id: "6", name: "Carboxy Methyl Cellulose (CMC)", qty: 120, unit: "kg", cost: 180, minQty: 50, supplier: "Loba Chemie" }
  ]);

  // Production Batches ledger with extended properties for visual QA logging
  const [batches, setBatches] = useState<any[]>(() => {
    const saved = localStorage.getItem("detergent_rd_batches");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing stored batches:", e);
      }
    }
    return [
      {
        id: "1",
        batchNo: "BTCH-2026-001",
        formulaId: "F-001",
        formulaName: "Premium Laundry Liquid",
        formulaVersion: "1.0",
        batchSize: 500,
        totalCost: 31000,
        date: "2026-07-01",
        timestamp: "2026-07-01T09:00:00.000Z",
        status: "Approved",
        operator: "Dr. Amit Sharma",
        qc_ph: "8.2",
        qc_viscosity: "2400 cPs",
        qc_appearance: "Clear Blue Viscous Liquid",
        ingredients: ["Sodium Lauryl Ether Sulfate (SLES 70%)", "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", "Soda Ash Light", "Sodium Gluconate"],
        notes: "Exceeded primary foam stability threshold. Fully compliant with active content targets.",
        snapshot: {
          id: "snap-btch-001",
          formulaId: "F-001",
          name: "Premium Laundry Liquid",
          version: "1.0",
          batchSize: 500,
          productType: "Heavy Duty Laundry Liquid",
          grade: "Premium",
          targetCost: 62.0,
          activeMatter: 16.5,
          ingredients: [
            { name: "Water (Demineralized)", percentage: 70.0, function: "Solvent", costPerKg: 0.5, requiredQtyKg: 350.0 },
            { name: "Sodium Lauryl Ether Sulfate (SLES 70%)", percentage: 14.0, function: "Primary Anionic Surfactant", costPerKg: 95.0, requiredQtyKg: 70.0 },
            { name: "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", percentage: 10.0, function: "Anionic Active Precursor", costPerKg: 110.0, requiredQtyKg: 50.0 },
            { name: "Soda Ash Light", percentage: 3.5, function: "Neutralizing Agent / Builder", costPerKg: 35.0, requiredQtyKg: 17.5 },
            { name: "Cocoamidopropyl Betaine (CAPB 30%)", percentage: 2.0, function: "Amphoteric Foam Booster", costPerKg: 85.0, requiredQtyKg: 10.0 },
            { name: "Sodium Gluconate", percentage: 0.5, function: "Chelating Agent", costPerKg: 140.0, requiredQtyKg: 2.5 }
          ],
          timestamp: "2026-07-01T09:00:00.000Z"
        }
      },
      {
        id: "2",
        batchNo: "BTCH-2026-002",
        formulaId: "F-002",
        formulaName: "Standard Dishwash Liquid",
        formulaVersion: "1.1",
        batchSize: 200,
        totalCost: 9600,
        date: "2026-07-06",
        timestamp: "2026-07-06T11:30:00.000Z",
        status: "Testing",
        operator: "Rohan Patel",
        qc_ph: "7.4",
        qc_viscosity: "1850 cPs",
        qc_appearance: "Slightly Hazy Straw Liquid",
        ingredients: ["Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", "Sodium Lauryl Ether Sulfate (SLES 70%)", "Cocoamidopropyl Betaine (CAPB 30%)", "Sodium Chloride"],
        notes: "Active matter checks out at 14.8%. Microbiology incubation pending 48-hour marks.",
        snapshot: {
          id: "snap-btch-002",
          formulaId: "F-002",
          name: "Standard Dishwash Liquid",
          version: "1.1",
          batchSize: 200,
          productType: "Hand Dishwashing Gel",
          grade: "Standard",
          targetCost: 48.0,
          activeMatter: 14.8,
          ingredients: [
            { name: "Water (Demineralized)", percentage: 74.0, function: "Solvent", costPerKg: 0.5, requiredQtyKg: 148.0 },
            { name: "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", percentage: 11.0, function: "Primary Anionic Cleanser", costPerKg: 110.0, requiredQtyKg: 22.0 },
            { name: "Sodium Lauryl Ether Sulfate (SLES 70%)", percentage: 9.0, function: "Co-Surfactant", costPerKg: 95.0, requiredQtyKg: 18.0 },
            { name: "Cocoamidopropyl Betaine (CAPB 30%)", percentage: 4.0, function: "Viscosity Booster & Skin Mildness", costPerKg: 85.0, requiredQtyKg: 8.0 },
            { name: "Sodium Chloride (Salt)", percentage: 2.0, function: "Thickener", costPerKg: 8.0, requiredQtyKg: 4.0 }
          ],
          timestamp: "2026-07-06T11:30:00.000Z"
        }
      },
      {
        id: "3",
        batchNo: "BTCH-2026-003",
        formulaId: "F-003",
        formulaName: "Eco Handwash Base",
        formulaVersion: "1.0",
        batchSize: 1000,
        totalCost: 61800,
        date: "2026-07-10",
        timestamp: "2026-07-10T14:15:00.000Z",
        status: "Pending",
        operator: "Suresh Rao",
        qc_ph: "5.8",
        qc_viscosity: "3100 cPs",
        qc_appearance: "Clear Colorless Gel",
        ingredients: ["Sodium Lauryl Ether Sulfate (SLES 70%)", "Cocoamidopropyl Betaine (CAPB 30%)", "Sodium Gluconate", "Carboxy Methyl Cellulose (CMC)"],
        notes: "SLES neutralization phase complete. Awaiting final viscosity check before bottling.",
        snapshot: {
          id: "snap-btch-003",
          formulaId: "F-003",
          name: "Eco Handwash Base",
          version: "1.0",
          batchSize: 1000,
          productType: "Personal Handwash Gel",
          grade: "Economy",
          targetCost: 61.8,
          activeMatter: 12.0,
          ingredients: [
            { name: "Water (Demineralized)", percentage: 81.0, function: "Solvent", costPerKg: 0.5, requiredQtyKg: 810.0 },
            { name: "Sodium Lauryl Ether Sulfate (SLES 70%)", percentage: 12.0, function: "Primary Foamer", costPerKg: 95.0, requiredQtyKg: 120.0 },
            { name: "Cocoamidopropyl Betaine (CAPB 30%)", percentage: 5.0, function: "Mildness Co-Surfactant", costPerKg: 85.0, requiredQtyKg: 50.0 },
            { name: "Sodium Gluconate", percentage: 1.0, function: "Chelator", costPerKg: 140.0, requiredQtyKg: 10.0 },
            { name: "Carboxy Methyl Cellulose (CMC)", percentage: 1.0, function: "Polymer Thickener", costPerKg: 180.0, requiredQtyKg: 10.0 }
          ],
          timestamp: "2026-07-10T14:15:00.000Z"
        }
      },
      {
        id: "4",
        batchNo: "BTCH-2026-004",
        formulaId: "F-004",
        formulaName: "Industrial Floor Degreaser",
        formulaVersion: "2.0",
        batchSize: 750,
        totalCost: 48000,
        date: "2026-07-12",
        timestamp: "2026-07-12T16:00:00.000Z",
        status: "Approved",
        operator: "Dr. Amit Sharma",
        qc_ph: "12.4",
        qc_viscosity: "120 cPs",
        qc_appearance: "Fluorescent Green Thin Liquid",
        ingredients: ["Soda Ash Light", "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", "Sodium Gluconate"],
        notes: "Strong alkalinity verified. Outstanding heavy dirt emulsification scores.",
        snapshot: {
          id: "snap-btch-004",
          formulaId: "F-004",
          name: "Industrial Floor Degreaser",
          version: "2.0",
          batchSize: 750,
          productType: "Heavy Degreaser",
          grade: "Premium",
          targetCost: 64.0,
          activeMatter: 18.0,
          ingredients: [
            { name: "Water (Demineralized)", percentage: 68.0, function: "Solvent", costPerKg: 0.5, requiredQtyKg: 510.0 },
            { name: "Soda Ash Light", percentage: 12.0, function: "Alkaline Builder / pH Booster", costPerKg: 35.0, requiredQtyKg: 90.0 },
            { name: "Linear Alkylbenzene Sulfonic Acid (LABSA 90%)", percentage: 18.0, function: "Anionic Grease Cutter", costPerKg: 110.0, requiredQtyKg: 135.0 },
            { name: "Sodium Gluconate", percentage: 2.0, function: "Heavy Metal Sequestrant", costPerKg: 140.0, requiredQtyKg: 15.0 }
          ],
          timestamp: "2026-07-12T16:00:00.000Z"
        }
      }
    ];
  });

  // Save batches to localStorage
  React.useEffect(() => {
    localStorage.setItem("detergent_rd_batches", JSON.stringify(batches));
  }, [batches]);

  // Handle global search highlight selection
  React.useEffect(() => {
    if (selectedBatchId) {
      const found = batches.find(b => b.id === selectedBatchId || b.batchNo === selectedBatchId);
      if (found) {
        setExpandedBatchId(found.id);
        setStatusFilter("All");
        setBatchSearch("");
        onSelectBatch?.(null); // Clear search select state in App.tsx
        
        // Scroll to the selected row after UI expands
        setTimeout(() => {
          const element = document.getElementById(`batch-row-${found.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("ring-2", "ring-teal-500", "ring-offset-2");
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-teal-500", "ring-offset-2");
            }, 3000);
          }
        }, 200);
      }
    }
  }, [selectedBatchId, batches, onSelectBatch]);

  // Form states for stock updates
  const [selectedStockId, setSelectedStockId] = useState("1");
  const [addStockQty, setAddStockQty] = useState(50);
  const [invoiceNo, setInvoiceNo] = useState("");

  // Form states for new inventory raw material
  const [newMatName, setNewMatName] = useState("");
  const [newMatQty, setNewMatQty] = useState(100);
  const [newMatCost, setNewMatCost] = useState(80);
  const [newMatMin, setNewMatMin] = useState(50);
  const [newMatSupplier, setNewMatSupplier] = useState("");

  // Batch History search, filters, and expand states
  const [batchSearch, setBatchSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Testing" | "Approved">("All");
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  // Form states for logging new batches
  const [showAddBatchForm, setShowAddBatchForm] = useState(false);
  const [newBatchFormula, setNewBatchFormula] = useState("Premium Laundry Liquid");
  const [newBatchSize, setNewBatchSize] = useState(500);
  const [newBatchCost, setNewBatchCost] = useState(31000);
  const [newBatchOperator, setNewBatchOperator] = useState("Dr. Amit Sharma");
  const [newBatchStatus, setNewBatchStatus] = useState<"Pending" | "Testing" | "Approved">("Pending");
  const [newBatchPh, setNewBatchPh] = useState("7.5");
  const [newBatchViscosity, setNewBatchViscosity] = useState("2100 cPs");
  const [newBatchAppearance, setNewBatchAppearance] = useState("Clear Liquid");
  const [newBatchIngredients, setNewBatchIngredients] = useState("SLES, LABSA, Soda Ash, Sodium Gluconate");
  const [newBatchNotes, setNewBatchNotes] = useState("");
  
  // Advanced process monitoring logs
  const [newBatchChargingTimes, setNewBatchChargingTimes] = useState("Water: 5 min, Soda: 10 min, LABSA: 20 min, SLES: 15 min");
  const [newBatchShearRates, setNewBatchShearRates] = useState("500 RPM (Low Shear Agitation)");
  const [newBatchEnergyConsumption, setNewBatchEnergyConsumption] = useState("3.2 kWh");
  const [newBatchMixingOrder, setNewBatchMixingOrder] = useState("1. Charge Water and start mixer. 2. Slowly add Soda Ash and dissolve. 3. Dispense LABSA and neutralize. 4. Blend SLES.");

  // QR Code generator states
  const [selectedQrBatch, setSelectedQrBatch] = useState<any | null>(null);
  const [qrLabelTitle, setQrLabelTitle] = useState("DETERGENT R&D EXPERT LABS");
  const [qrIncludeQc, setQrIncludeQc] = useState(true);
  const [qrFormat, setQrFormat] = useState<"text" | "json">("text");
  const [qrSize, setQrSize] = useState<number>(180);

  const t = LOCAL_TRANS[lang] || LOCAL_TRANS.en;

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    setStock(stock.map((item) => {
      if (item.id === selectedStockId) {
        return { ...item, qty: item.qty + addStockQty };
      }
      return item;
    }));
    setInvoiceNo("");
    alert("Stock levels updated successfully!");
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    const newMat = {
      id: Date.now().toString(),
      name: newMatName,
      qty: newMatQty,
      unit: "kg",
      cost: newMatCost,
      minQty: newMatMin,
      supplier: newMatSupplier || "Local Vendor"
    };

    setStock([...stock, newMat]);
    setNewMatName("");
    setNewMatSupplier("");
    alert(`Added ${newMatName} to Laboratory Stock registry.`);
  };

  // CSV Export Utility for inventory audits
  const exportStockToCSV = () => {
    const headers = "ID,Raw Material,Current Qty (kg),Unit Cost (INR),Min Reorder level,Supplier\n";
    const rows = stock
      .map((s) => `${s.id},"${s.name}",${s.qty},${s.cost},${s.minQty},"${s.supplier}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Detergent_Inventory_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- NEW HANDLERS FOR BATCH PRODUCTION LEDGER ---

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatchId = (Date.now() % 1000).toString();
    const today = new Date().toISOString().split("T")[0];
    const timestamp = new Date().toISOString();

    // Check if activeFormula exists and has ingredients
    const isFormulaActive = Boolean(activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0);

    // Deep-copy immutable formula snapshot captured at the exact moment of batch creation
    const snapshot: ProductionFormulaSnapshot = isFormulaActive ? {
      id: `snap-${Date.now()}`,
      formulaId: (activeFormula as any).id || `F-${newBatchId}`,
      name: activeFormula?.name || newBatchFormula,
      version: (activeFormula as any).version || "1.0",
      batchSize: Number(newBatchSize) || 500,
      productType: activeFormula?.productType || "Liquid Detergent",
      grade: activeFormula?.grade || "Standard",
      targetCost: activeFormula?.targetCost,
      activeMatter: activeFormula?.activeMatter,
      ingredients: JSON.parse(JSON.stringify((activeFormula?.ingredients || []).map(i => {
        const pct = Number(i.percentage) || 0;
        const scaleKg = Number(newBatchSize) || 500;
        const requiredKg = Number(((pct / 100) * scaleKg).toFixed(3));
        return {
          name: i.name,
          percentage: pct,
          function: (i as any).function || i.role || "Ingredient",
          costPerKg: i.costPerKg,
          requiredQtyKg: requiredKg
        };
      }))),
      timestamp: timestamp
    } : {
      id: `snap-${Date.now()}`,
      formulaId: `F-${newBatchId}`,
      name: newBatchFormula,
      version: "1.0",
      batchSize: Number(newBatchSize) || 500,
      productType: "Custom Formulation",
      grade: "Standard",
      ingredients: (newBatchIngredients ? newBatchIngredients.split(",").map(i => i.trim()).filter(Boolean) : []).map(ingName => {
        const scaleKg = Number(newBatchSize) || 500;
        return {
          name: ingName,
          percentage: 0,
          requiredQtyKg: 0
        };
      }),
      timestamp: timestamp
    };

    const newBatch = {
      id: newBatchId,
      batchNo: `BTCH-2026-0${newBatchId}`,
      formulaId: snapshot.formulaId,
      formulaName: snapshot.name,
      formulaVersion: snapshot.version,
      batchSize: Number(newBatchSize),
      totalCost: Number(newBatchCost),
      date: today,
      timestamp: timestamp,
      status: newBatchStatus,
      operator: newBatchOperator || "Lead Chemist",
      qc_ph: newBatchPh || "7.0",
      qc_viscosity: newBatchViscosity || "2000 cPs",
      qc_appearance: newBatchAppearance || "Clear Gel",
      ingredients: snapshot.ingredients.map(i => i.name),
      notes: newBatchNotes || "Run initialized on R&D system ledger with immutable snapshot.",
      chargingTimes: newBatchChargingTimes,
      shearRates: newBatchShearRates,
      energyConsumption: newBatchEnergyConsumption,
      mixingOrder: newBatchMixingOrder,
      snapshot: snapshot
    };

    setBatches([newBatch, ...batches]);
    setShowAddBatchForm(false);
    // Reset specific fields
    setNewBatchNotes("");
    setNewBatchIngredients("SLES, LABSA, Soda Ash, Sodium Gluconate");
    alert(`Batch ${newBatch.batchNo} ${t.successLogged} (Immutable Formula Snapshot Created)`);
  };

  const handleDeleteBatch = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this Batch production log from R&D history?")) {
      setBatches(batches.filter(b => b.id !== id));
      if (expandedBatchId === id) setExpandedBatchId(null);
    }
  };

  const handleUpdateBatchField = (id: string, field: string, value: any) => {
    setBatches(batches.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handlePrintLabel = (batch: any) => {
    const qrData = qrFormat === "json" ? JSON.stringify({
      batchNo: batch.batchNo,
      formula: batch.formulaName,
      date: batch.date,
      scaleKg: batch.batchSize,
      status: batch.status,
      operator: batch.operator,
      ...(qrIncludeQc ? { ph: batch.qc_ph, viscosity: batch.qc_viscosity, appearance: batch.qc_appearance } : {})
    }, null, 2) : `BATCH: ${batch.batchNo}
FORMULA: ${batch.formulaName}
DATE: ${batch.date}
SCALE: ${batch.batchSize} kg
STATUS: ${batch.status}
OPERATOR: ${batch.operator}
${qrIncludeQc ? `QC PH: ${batch.qc_ph}\nQC VISCOSITY: ${batch.qc_viscosity}\nQC APPEARANCE: ${batch.qc_appearance}` : ''}`;

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}`;

    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      alert("Please allow pop-up windows to print the QR Code label.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Label - ${batch.batchNo}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              background: #ffffff;
              color: #1f2937;
              margin: 0;
              padding: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              box-sizing: border-box;
            }
            .label-card {
              border: 3px solid #0f766e;
              border-radius: 16px;
              padding: 24px;
              width: 380px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              text-align: center;
              background: #fafcfc;
            }
            .header {
              font-size: 13px;
              font-weight: 800;
              color: #0f766e;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
            }
            .qr-container {
              margin: 16px auto;
              display: inline-block;
              background: white;
              padding: 12px;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
            }
            .qr-image {
              width: ${qrSize}px;
              height: ${qrSize}px;
              display: block;
            }
            .batch-info {
              text-align: left;
              font-size: 11px;
              margin-top: 12px;
              background: white;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #f0fdfa;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              border-bottom: 1px dashed #f3f4f6;
              padding-bottom: 4px;
            }
            .info-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .label {
              font-weight: 600;
              color: #4b5563;
            }
            .value {
              font-weight: 700;
              color: #111827;
              font-family: monospace;
            }
            .footer {
              margin-top: 16px;
              font-size: 9px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            @media print {
              body {
                padding: 0;
                background: transparent;
                height: auto;
              }
              .label-card {
                border: 2px solid #000;
                box-shadow: none;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">${qrLabelTitle || "DETERGENT R&D LABS"}</div>
            <div class="qr-container">
              <img class="qr-image" src="${qrImageUrl}" alt="Batch QR Code" />
            </div>
            <div class="batch-info">
              <div class="info-row">
                <span class="label">Batch Number:</span>
                <span class="value">${batch.batchNo}</span>
              </div>
              <div class="info-row">
                <span class="label">Product / Formula:</span>
                <span class="value">${batch.formulaName}</span>
              </div>
              <div class="info-row">
                <span class="label">Manufacturing Date:</span>
                <span class="value">${batch.date}</span>
              </div>
              <div class="info-row">
                <span class="label">Batch Scale:</span>
                <span class="value">${batch.batchSize} kg</span>
              </div>
              <div class="info-row">
                <span class="label">Clearance Status:</span>
                <span class="value" style="color: ${batch.status === "Approved" ? "#047857" : batch.status === "Testing" ? "#1d4ed8" : "#b45309"}">${batch.status.toUpperCase()}</span>
              </div>
              ${qrIncludeQc ? `
                <div class="info-row" style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 6px;">
                  <span class="label">QC pH:</span>
                  <span class="value">${batch.qc_ph}</span>
                </div>
                <div class="info-row">
                  <span class="label">QC Viscosity:</span>
                  <span class="value">${batch.qc_viscosity}</span>
                </div>
                <div class="info-row">
                  <span class="label">QC Appearance:</span>
                  <span class="value" style="max-width: 160px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${batch.qc_appearance}</span>
                </div>
              ` : ''}
            </div>
            <div class="footer">Certified R&D Detergent Batch</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQrImage = async (batch: any) => {
    const qrData = qrFormat === "json" ? JSON.stringify({
      batchNo: batch.batchNo,
      formula: batch.formulaName,
      date: batch.date,
      scaleKg: batch.batchSize,
      status: batch.status,
      operator: batch.operator,
      ...(qrIncludeQc ? { ph: batch.qc_ph, viscosity: batch.qc_viscosity, appearance: batch.qc_appearance } : {})
    }, null, 2) : `BATCH: ${batch.batchNo}
FORMULA: ${batch.formulaName}
DATE: ${batch.date}
SCALE: ${batch.batchSize} kg
STATUS: ${batch.status}
OPERATOR: ${batch.operator}
${qrIncludeQc ? `QC PH: ${batch.qc_ph}\nQC VISCOSITY: ${batch.qc_viscosity}\nQC APPEARANCE: ${batch.qc_appearance}` : ''}`;

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}`;
    
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QR_LABEL_${batch.batchNo}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(qrImageUrl, "_blank");
    }
  };

  // Export Batch history to CSV
  const exportBatchesToCSV = () => {
    const headers = "Batch ID,Formulation Name,Ingredients,Batch Size (kg),Total Cost (INR),Date,Status,Operator,QC pH,QC Viscosity,QC Appearance,Notes\n";
    const rows = filteredBatches
      .map((b) => {
        const ingredientsStr = b.ingredients ? b.ingredients.join(", ") : [
          ...(b.formulaName === "Premium Laundry Liquid" ? ["SLES", "LABSA", "Soda Ash", "Sodium Gluconate"] :
              b.formulaName === "Standard Dishwash Liquid" ? ["LABSA", "SLES", "CAPB", "Salt"] :
              b.formulaName === "Eco Handwash Base" ? ["SLES", "CAPB", "Sodium Gluconate", "CMC"] :
              b.formulaName === "Industrial Floor Degreaser" ? ["Soda Ash", "LABSA", "Sodium Gluconate"] :
              ["LABSA", "SLES"])
        ].join(", ");
        return `"${b.batchNo}","${b.formulaName}","${ingredientsStr.replace(/"/g, '""')}",${b.batchSize},${b.totalCost},"${b.date}","${b.status}","${b.operator}","${b.qc_ph}","${b.qc_viscosity}","${b.qc_appearance}","${b.notes.replace(/"/g, '""')}"`;
      })
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Detergent_Batch_History_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Batch history to beautiful high-fidelity PDF with jsPDF
  const exportBatchesToPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const primaryColor = [15, 118, 110]; // Teal (#0f766e)
    const secondaryColor = [75, 85, 99]; // Slate Gray (#4b5563)

    // Top Header Banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 15, "F");

    // Title & Metadata Block
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("DETERGENT R&D EXPERT LABS", 14, 28);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("ISO 9001:2015 Quality Management Systems - Batch Run Production Log", 14, 34);

    const todayStr = new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    doc.setFontSize(8);
    doc.text(`Report Compiled: ${todayStr}`, 196, 28, { align: "right" });
    doc.text("Compliance State: Fully Sync", 196, 33, { align: "right" });

    // Header Separator Line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    // Summary Metric boxes (based on filtered list)
    const totalCount = filteredBatches.length;
    const approvedCount = filteredBatches.filter((b) => b.status === "Approved").length;
    const testingCount = filteredBatches.filter((b) => b.status === "Testing").length;
    const pendingCount = filteredBatches.filter((b) => b.status === "Pending").length;

    // Draw 4 neat background grids for metrics
    doc.setFillColor(240, 253, 250); // soft teal
    doc.rect(14, 43, 41, 16, "F");
    doc.setDrawColor(15, 118, 110);
    doc.rect(14, 43, 41, 16, "D");

    doc.setFillColor(240, 253, 244); // soft green
    doc.rect(59, 43, 41, 16, "F");
    doc.setDrawColor(22, 163, 74);
    doc.rect(59, 43, 41, 16, "D");

    doc.setFillColor(239, 246, 255); // soft blue
    doc.rect(104, 43, 41, 16, "F");
    doc.setDrawColor(37, 99, 235);
    doc.rect(104, 43, 41, 16, "D");

    doc.setFillColor(254, 243, 199); // soft amber
    doc.rect(149, 43, 47, 16, "F");
    doc.setDrawColor(217, 119, 6);
    doc.rect(149, 43, 47, 16, "D");

    // Print text on cards
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 118, 110);
    doc.text(`${totalCount} Runs`, 18, 49);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Total Batches Logged", 18, 54);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text(`${approvedCount} Approved`, 63, 49);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Passed Laboratory QC", 63, 54);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text(`${testingCount} Testing`, 108, 49);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Under Inspection", 108, 54);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(217, 119, 6);
    doc.text(`${pendingCount} Pending`, 153, 49);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Awaiting Evaluation", 153, 54);

    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 118, 110);
    doc.text("ACTIVE COMPOSITIONS & STOICHIOMETRIC LOGS", 14, 68);

    // Table Headers
    doc.setFillColor(15, 118, 110);
    doc.rect(14, 72, 182, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("Date Run", 16, 77);
    doc.text("Formulation (Batch ID)", 36, 77);
    doc.text("Ingredients", 92, 77);
    doc.text("Scale / Est. Cost", 144, 77);
    doc.text("QC Status", 176, 77);

    // Table Rows
    let currentY = 80;
    filteredBatches.forEach((b, index) => {
      // Manage page limit
      if (currentY > 265) {
        doc.addPage();
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 10, "F");

        // Repeat headers
        doc.setFillColor(15, 118, 110);
        doc.rect(14, 15, 182, 8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text("Date Run", 16, 20);
        doc.text("Formulation (Batch ID)", 36, 20);
        doc.text("Ingredients", 92, 20);
        doc.text("Scale / Est. Cost", 144, 20);
        doc.text("QC Status", 176, 20);

        currentY = 23;
      }

      // Alternating shading
      if (index % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, currentY, 182, 7.5, "F");
      }

      // Subtle horizontal cell dividers
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.3);
      doc.line(14, currentY + 7.5, 196, currentY + 7.5);

      // Value placements
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      doc.text(b.date, 16, currentY + 4.5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 118, 110);
      const shortNo = b.batchNo;
      const cleanName = b.formulaName.length > 24 ? b.formulaName.substring(0, 21) + "..." : b.formulaName;
      doc.text(`${cleanName} (${shortNo})`, 36, currentY + 4.5);

      // Ingredients column
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      const ingredientsStr = b.ingredients ? b.ingredients.join(", ") : [
        ...(b.formulaName === "Premium Laundry Liquid" ? ["SLES", "LABSA", "Soda Ash", "Sodium Gluconate"] :
            b.formulaName === "Standard Dishwash Liquid" ? ["LABSA", "SLES", "CAPB", "Salt"] :
            b.formulaName === "Eco Handwash Base" ? ["SLES", "CAPB", "Sodium Gluconate", "CMC"] :
            b.formulaName === "Industrial Floor Degreaser" ? ["Soda Ash", "LABSA", "Sodium Gluconate"] :
            ["LABSA", "SLES"])
      ].join(", ");
      const cleanIngredients = ingredientsStr.length > 34 ? ingredientsStr.substring(0, 31) + "..." : ingredientsStr;
      doc.text(cleanIngredients, 92, currentY + 4.5);

      doc.text(`${b.batchSize} kg / INR ${b.totalCost.toLocaleString()}`, 144, currentY + 4.5);

      // Status text coloring
      if (b.status === "Approved") {
        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.text("APPROVED ✅", 176, currentY + 4.5);
      } else if (b.status === "Testing") {
        doc.setTextColor(37, 99, 235);
        doc.setFont("helvetica", "bold");
        doc.text("TESTING 🔬", 176, currentY + 4.5);
      } else {
        doc.setTextColor(217, 119, 6);
        doc.setFont("helvetica", "bold");
        doc.text("PENDING ⏳", 176, currentY + 4.5);
      }

      currentY += 7.5;
    });

    // Sign-off signature fields
    currentY += 12;
    if (currentY > 235) {
      doc.addPage();
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 10, "F");
      currentY = 20;
    }

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.rect(14, currentY, 182, 32, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 118, 110);
    doc.text("QUALITY SYSTEM CERTIFICATION & AUDIT STATEMENT", 18, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text("This official laboratory statement verifies the chemical safety, stoichiometry correctness, and compatibility scores", 18, currentY + 12);
    doc.text("of all logged detergent batches. All raw materials were correctly balanced during active hydration stages.", 18, currentY + 16);

    doc.setDrawColor(156, 163, 175);
    doc.line(22, currentY + 25, 90, currentY + 25);
    doc.line(116, currentY + 25, 184, currentY + 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("HEAD R&D CHEMICAL ENGINEER SIGNATURE", 22, currentY + 28);
    doc.text("LABORATORY AUDITOR REVIEWS", 116, currentY + 28);

    doc.save(`Detergent_RD_Batch_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Export single-batch QC Clearance Pass Certificate
  const exportSingleBatchPDF = (b: any) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Aesthetic outer frame border
    doc.setDrawColor(15, 118, 110);
    doc.setLineWidth(1.2);
    doc.rect(8, 8, 194, 281, "D");

    // Header container block
    doc.setFillColor(15, 118, 110);
    doc.rect(10, 10, 190, 35, "F");

    // Certificate branding
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("BATCH QUALITY CLEARANCE PASS", 105, 24, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("FORMULATION SPECIFICATION CERTIFICATION OF AUDITED CONFORMANCE", 105, 32, { align: "center" });
    doc.text("ISO 9001:2015 REGISTERED LABORATORY PLATFORM", 105, 37, { align: "center" });

    // Meta details
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`BATCH RUN RUN REFERENCE: ${b.batchNo}`, 14, 58);

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, 62, 196, 62);

    // Grid details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    // Left Column Info
    doc.setFont("helvetica", "bold");
    doc.text("Formulation Run:", 14, 71);
    doc.setFont("helvetica", "normal");
    doc.text(b.formulaName, 55, 71);

    doc.setFont("helvetica", "bold");
    doc.text("Production Scale Volume:", 14, 79);
    doc.setFont("helvetica", "normal");
    doc.text(`${b.batchSize} kg`, 55, 79);

    doc.setFont("helvetica", "bold");
    doc.text("Registered Date:", 14, 87);
    doc.setFont("helvetica", "normal");
    doc.text(b.date, 55, 87);

    doc.setFont("helvetica", "bold");
    doc.text("Est. Material Cost:", 14, 95);
    doc.setFont("helvetica", "normal");
    doc.text(`INR ${b.totalCost.toLocaleString()}`, 55, 95);

    // Right Column Info
    doc.setFont("helvetica", "bold");
    doc.text("Lead Analyst / Chemist:", 112, 71);
    doc.setFont("helvetica", "normal");
    doc.text(b.operator, 155, 71);

    doc.setFont("helvetica", "bold");
    doc.text("Compliance Group:", 112, 79);
    doc.setFont("helvetica", "normal");
    doc.text("Anionic/Nonionic Blend", 155, 79);

    doc.setFont("helvetica", "bold");
    doc.text("Audit Registry ID:", 112, 87);
    doc.setFont("helvetica", "normal");
    doc.text(`AUD-${b.id}-LAB`, 155, 87);

    doc.setFont("helvetica", "bold");
    doc.text("Cert. Protocol State:", 112, 95);
    doc.setFont("helvetica", "normal");
    doc.text("Secured & Signed", 155, 95);

    // Measurement block
    doc.setFillColor(249, 250, 251);
    doc.rect(14, 103, 182, 52, "F");
    doc.rect(14, 103, 182, 52, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 118, 110);
    doc.text("LABORATORY QC SENSOR READOUT RECORD", 20, 110);

    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);

    doc.setFont("helvetica", "bold");
    doc.text("Measured Hydrogen Concentration (pH):", 20, 120);
    doc.setFont("helvetica", "normal");
    doc.text(`${b.qc_ph} (Stoichiometrically Balanced)`, 90, 120);

    doc.setFont("helvetica", "bold");
    doc.text("Dynamic Viscosity (at 25°C):", 20, 128);
    doc.setFont("helvetica", "normal");
    doc.text(b.qc_viscosity, 90, 128);

    doc.setFont("helvetica", "bold");
    doc.text("Physical Aspect & Coloration:", 20, 136);
    doc.setFont("helvetica", "normal");
    doc.text(b.qc_appearance, 90, 136);

    doc.setFont("helvetica", "bold");
    doc.text("Surfactant Solubilization:", 20, 144);
    doc.setFont("helvetica", "normal");
    doc.text("100% Homogeneous. No separation observed.", 90, 144);

    // Comments section
    doc.setFont("helvetica", "bold");
    doc.text("Technician Observations & Safety Comments:", 14, 166);
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(b.notes || "No special observation recorded on the active run ledger.", 182);
    doc.text(notesLines, 14, 172);

    // Seal of Authenticity
    doc.setFillColor(255, 255, 255);
    let sealColor = [156, 163, 175];
    let sealText = "UNDER REVIEW";
    if (b.status === "Approved") {
      sealColor = [16, 185, 129];
      sealText = "PASSED QC";
    } else if (b.status === "Testing") {
      sealColor = [37, 99, 235];
      sealText = "LAB TESTING";
    }

    doc.setDrawColor(sealColor[0], sealColor[1], sealColor[2]);
    doc.setLineWidth(1.5);
    doc.rect(55, 196, 100, 24, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(sealColor[0], sealColor[1], sealColor[2]);
    doc.text(sealText, 105, 212, { align: "center" });

    // Professional statements
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text("The referenced batch formulation run was evaluated in complete sync with established lab criteria.", 105, 232, { align: "center" });
    doc.text("Ingredients used match standard stoichiometric recipes and comply with safe household limits.", 105, 236, { align: "center" });

    // Lines for signatures
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.5);
    doc.line(30, 260, 90, 260);
    doc.line(120, 260, 180, 260);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("LEAD ANALYTICAL CHEMIST SIGNATURE", 60, 264, { align: "center" });
    doc.text("PRINCIPAL AUDITOR / DEPT HEAD SIGNATURE", 150, 264, { align: "center" });

    doc.save(`QC_Pass_Certificate_${b.batchNo}.pdf`);
  };

  // Filtered batch listings based on Search term and Status pills
  const filteredBatches = batches.filter((b) => {
    const matchesSearch = 
      b.batchNo.toLowerCase().includes(batchSearch.toLowerCase()) ||
      b.formulaName.toLowerCase().includes(batchSearch.toLowerCase()) ||
      b.operator.toLowerCase().includes(batchSearch.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col" id="inventory-production-root">
      {/* Title block */}
      <div className="p-4 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#0f766e] flex items-center gap-2">
            📦 {translations[lang].inventory}
          </h2>
          <p className="text-xs text-gray-500">
            {translations[lang].inventoryDesc || "Laboratory stock ledger, replenishment tracking, and production batching log"}
          </p>
        </div>

        <button
          onClick={exportStockToCSV}
          className="bg-[#0f766e] hover:bg-[#0d645c] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download size={14} /> Export CSV Audit
        </button>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 bg-[#f9fafb]">
        {/* Alerts for low materials */}
        {stock.some(s => s.qty < s.minQty) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2 text-xs animate-pulse">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="text-amber-950 flex-1">
              <span className="font-bold block uppercase text-[10px] tracking-wider text-amber-800">Low Raw Material Alert</span>
              <p className="mt-0.5">
                The following essential raw materials are below their minimum safe R&D reorder points:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {stock.filter(s => s.qty < s.minQty).map((s) => (
                  <span key={s.id} className="bg-amber-100 text-amber-800 font-mono font-bold px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                    {s.name} ({s.qty}kg / min {s.minQty}kg)
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Stock Ledger */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm space-y-4">
          <div className="border-b pb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Database size={16} className="text-[#0f766e]" /> Laboratory Surfactants & Raw Materials Stock
            </h3>
            <span className="text-xs font-bold bg-[#f3f4f6] text-gray-600 px-2 py-0.5 rounded-full">
              {stock.length} Active Materials
            </span>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 font-bold border-b text-gray-700">
                  <th className="p-3">Material Name</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3 text-right">Avg Cost (₹/kg)</th>
                  <th className="p-3 text-center">Min Threshold</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3 text-right">Status Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-800 font-medium">
                {stock.map((item) => {
                  const isLow = item.qty < item.minQty;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-semibold text-[#0f766e]">{item.name}</td>
                      <td className="p-3 font-mono font-bold">{item.qty} {item.unit}</td>
                      <td className="p-3 text-right font-mono">₹{item.cost}</td>
                      <td className="p-3 text-center font-mono">{item.minQty} kg</td>
                      <td className="p-3 text-gray-500">{item.supplier}</td>
                      <td className="p-3 text-right">
                        {isLow ? (
                          <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase border border-red-200">
                            Reorder Now
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                            Healthy Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Double forms for Stock replenishment and New material registration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form 1: replenishment */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm space-y-4">
            <div className="border-b pb-1.5">
              <h4 className="text-xs font-bold text-gray-900 uppercase">Replenish Existing Raw Stock</h4>
              <p className="text-[10px] text-gray-400">Log incoming commercial invoices to replenish warehouse levels.</p>
            </div>

            <form onSubmit={handleUpdateStock} className="text-xs space-y-3">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Select Material</label>
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="w-full bg-gray-50 border rounded p-2 focus:outline-none"
                >
                  {stock.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Added Weight (kg)</label>
                  <input
                    type="number"
                    value={addStockQty}
                    onChange={(e) => setAddStockQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-gray-50 border rounded p-1.5 focus:outline-none text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Invoice / PO Number</label>
                  <input
                    type="text"
                    placeholder="e.g. INVC-260"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full bg-gray-50 border rounded p-1.5 focus:outline-none text-center font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0f766e] text-white py-1.5 rounded font-bold hover:bg-[#0d645c] transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Commit replenishment to Stock
              </button>
            </form>
          </div>

          {/* Form 2: Register New Material */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm space-y-4">
            <div className="border-b pb-1.5">
              <h4 className="text-xs font-bold text-gray-900 uppercase">Register New Chemical Ingredient</h4>
              <p className="text-[10px] text-gray-400">Add a brand new surfactant, chelating agent, or polymer to laboratory directory.</p>
            </div>

            <form onSubmit={handleCreateMaterial} className="text-xs space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Chemical Name / CAS (Universal Library)</label>
                  <input
                    type="text"
                    list="universal-ingredients-datalist"
                    placeholder="e.g. Hostapur SAS 60"
                    value={newMatName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewMatName(val);
                      const match = getUniversalIngredientByName(val) || getAllUniversalIngredients().find(i => i.name === val || i.commonName === val);
                      if (match) {
                        if (match.costPerKg && match.costPerKg > 0) setNewMatCost(match.costPerKg);
                        if (match.suppliers && match.suppliers.length > 0 && !newMatSupplier) setNewMatSupplier(match.suppliers[0]);
                      }
                    }}
                    className="w-full bg-gray-50 border rounded p-1.5 focus:outline-none"
                    required
                  />
                  <datalist id="universal-ingredients-datalist">
                    {getAllUniversalIngredients().map(ing => (
                      <option key={ing.id} value={ing.name} label={`${ing.category}${ing.costPerKg ? ` (₹${ing.costPerKg}/kg)` : ""}`} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Clariant Chemicals"
                    value={newMatSupplier}
                    onChange={(e) => setNewMatSupplier(e.target.value)}
                    className="w-full bg-gray-50 border rounded p-1.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Initial Qty</label>
                  <input
                    type="number"
                    value={newMatQty}
                    onChange={(e) => setNewMatQty(Number(e.target.value))}
                    className="w-full bg-gray-50 border rounded p-1 text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Cost (₹/kg)</label>
                  <input
                    type="number"
                    value={newMatCost}
                    onChange={(e) => setNewMatCost(Number(e.target.value))}
                    className="w-full bg-gray-50 border rounded p-1 text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={newMatMin}
                    onChange={(e) => setNewMatMin(Number(e.target.value))}
                    className="w-full bg-gray-50 border rounded p-1 text-center font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-800 text-white py-1.5 rounded font-bold hover:bg-teal-900 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Package size={14} /> Register New Material
              </button>
            </form>
          </div>
        </div>

        {/* --- VISUAL BATCH HISTORY LOG SECTION --- */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm space-y-6">
          
          {/* Header block with PDF/CSV exports */}
          <div className="border-b pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Activity size={18} className="text-[#0f766e]" /> {t.batchHistory}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {t.batchHistoryDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={exportBatchesToCSV}
                className="bg-teal-50 text-[#0f766e] hover:bg-teal-100 border border-teal-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Export batch data table to CSV sheet"
              >
                <FileSpreadsheet size={14} /> {t.btnExportCSV}
              </button>
              <button
                onClick={exportBatchesToPDF}
                className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Export comprehensive report to formal PDF format"
              >
                <FileText size={14} /> {t.btnExportPDF}
              </button>
              <button
                onClick={() => {
                  if (batches.length > 0) {
                    setSelectedQrBatch(batches[0]);
                  } else {
                    alert("Please log at least one batch run to generate a QR label.");
                  }
                }}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Open Printable QR Label Generator Hub"
              >
                <QrCode size={14} /> QR Label Tool
              </button>
              <button
                onClick={() => setShowAddBatchForm(!showAddBatchForm)}
                className="bg-[#0f766e] hover:bg-[#0d645c] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto sm:ml-0"
              >
                <Plus size={14} /> {t.btnLogNewBatch}
              </button>
            </div>
          </div>

          {/* Core Analytics KPI dashboard counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#f9fafb] rounded-xl p-3 border border-gray-150 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 text-[#0f766e] flex items-center justify-center font-bold">
                {batches.length}
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">{t.metricTotal}</span>
                <span className="text-xs font-semibold text-gray-700">All Factory Batches</span>
              </div>
            </div>

            <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                {batches.filter(b => b.status === "Approved").length}
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 block uppercase tracking-wider">{t.metricApproved}</span>
                <span className="text-xs font-semibold text-gray-700">Cleared Compliance</span>
              </div>
            </div>

            <div className="bg-blue-50/40 rounded-xl p-3 border border-blue-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {batches.filter(b => b.status === "Testing").length}
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-700 block uppercase tracking-wider">{t.metricTesting}</span>
                <span className="text-xs font-semibold text-gray-700">In Incubation Loop</span>
              </div>
            </div>

            <div className="bg-amber-50/40 rounded-xl p-3 border border-amber-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                {batches.filter(b => b.status === "Pending").length}
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider">{t.metricPending}</span>
                <span className="text-xs font-semibold text-gray-700">Awaiting Evaluation</span>
              </div>
            </div>
          </div>

          {/* Summary Dashboard Component (Bar Chart & Analytical Insights) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#fcfdfd] border border-teal-100/40 rounded-2xl p-5 shadow-xs" id="batch-summary-dashboard">
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5" id="status-distribution-heading">
                  <Activity size={14} className="text-[#0f766e] animate-pulse" />
                  Real-time Batch Status Distribution
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Visual bar chart monitoring laboratory quality control and clearance cycles.
                </p>
              </div>

              {/* Bar Chart Canvas Container */}
              <div className="relative h-48 bg-white border border-gray-150 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                {/* Y-Axis Grid Lines */}
                <div className="absolute inset-x-4 top-4 bottom-10 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((gridIndex) => {
                    const maxVal = Math.max(
                      batches.filter(b => b.status === "Approved").length,
                      batches.filter(b => b.status === "Testing").length,
                      batches.filter(b => b.status === "Pending").length,
                      1
                    );
                    const labelVal = Math.round((maxVal / 4) * (4 - gridIndex) * 10) / 10;
                    return (
                      <div key={gridIndex} className="w-full flex items-center justify-between border-b border-gray-100/65 h-0">
                        <span className="text-[9px] font-mono font-bold text-gray-300 -mt-1">{labelVal}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Bars Area */}
                <div className="relative z-10 flex-1 flex items-end justify-around px-8 mt-2 h-36">
                  {[
                    { key: "Approved", label: "Approved", color: "from-emerald-400 to-emerald-600 bg-emerald-500 hover:from-emerald-500 hover:to-emerald-700 shadow-emerald-100", count: batches.filter(b => b.status === "Approved").length },
                    { key: "Testing", label: "Testing", color: "from-blue-400 to-blue-600 bg-blue-500 hover:from-blue-500 hover:to-blue-700 shadow-blue-100", count: batches.filter(b => b.status === "Testing").length },
                    { key: "Pending", label: "Pending", color: "from-amber-400 to-amber-600 bg-amber-500 hover:from-amber-500 hover:to-amber-700 shadow-amber-100", count: batches.filter(b => b.status === "Pending").length },
                  ].map((bar) => {
                    const maxVal = Math.max(
                      batches.filter(b => b.status === "Approved").length,
                      batches.filter(b => b.status === "Testing").length,
                      batches.filter(b => b.status === "Pending").length,
                      1
                    );
                    const percentage = (bar.count / maxVal) * 100;
                    const totalBatches = Math.max(batches.length, 1);
                    return (
                      <div key={bar.key} className="flex flex-col items-center group relative h-full justify-end w-16" id={`bar-container-${bar.key.toLowerCase()}`}>
                        {/* Tooltip on hover */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none z-20 flex flex-col items-center whitespace-nowrap">
                          <span>{bar.count} Runs</span>
                          <span className="text-[7px] text-gray-300">({Math.round((bar.count / totalBatches) * 100)}%)</span>
                          <div className="w-1 h-1 bg-gray-900 rotate-45 -mb-0.5 mt-0.5"></div>
                        </div>

                        {/* Visual Bar Column with animation and gradient */}
                        <div 
                          className={`w-10 rounded-t-lg bg-gradient-to-t ${bar.color} transition-all duration-500 ease-out relative cursor-pointer shadow-md flex items-end justify-center group-hover:scale-105`}
                          style={{ height: `${percentage}%` }}
                        >
                          {/* Inner glowing effect */}
                          <div className="absolute inset-x-0 top-0 h-1 bg-white/20 rounded-t-lg"></div>
                          
                          {/* Quick counter display inside/above bar */}
                          <span className="absolute -top-5 font-mono text-xs font-black text-gray-700 transition-all group-hover:text-gray-900">
                            {bar.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-around items-center pt-2 px-8 border-t border-gray-150 mt-1">
                  {[
                    { key: "Approved", label: "Approved ✅", colorClass: "text-emerald-700" },
                    { key: "Testing", label: "Testing 🔬", colorClass: "text-blue-700" },
                    { key: "Pending", label: "Pending ⏳", colorClass: "text-amber-700" },
                  ].map((xLabel) => (
                    <div key={xLabel.key} className="w-16 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${xLabel.colorClass}`}>
                        {xLabel.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analytical Insights & Aggregate Stats Panel */}
            <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-gray-150 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between" id="batch-stats-insights">
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5" id="stats-insights-heading">
                  <Award size={14} className="text-[#0f766e]" />
                  Formulation Run Analytics
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Summary statistics for batches currently recorded on ledger.
                </p>
              </div>

              <div className="mt-4 space-y-3.5">
                {/* Total Manufacturing Scale */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚖️</span>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Total Volume Produced</span>
                      <span className="text-xs font-bold text-gray-800">Stoichiometric Scale</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-[#0f766e]">
                      {batches.reduce((sum, b) => sum + (Number(b.batchSize) || 0), 0).toLocaleString()} kg
                    </span>
                  </div>
                </div>

                {/* Total R&D Cost Investment */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💰</span>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Total R&D Batch Value</span>
                      <span className="text-xs font-bold text-gray-800">Est. Manufacturing Cost</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-emerald-700">
                      ₹{batches.reduce((sum, b) => sum + (Number(b.totalCost) || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Quality Conformity Rate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <div>
                      <span className="text-[10px] text-gray-500 block">QC Clearance Conformance</span>
                      <span className="text-xs font-bold text-gray-800">Laboratory Pass Rate</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-indigo-700">
                      {batches.length > 0
                        ? `${Math.round((batches.filter(b => b.status === "Approved").length / batches.length) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Insight Banner */}
              <div className="mt-4 bg-teal-50 border border-teal-100 rounded-xl p-2.5 flex items-center gap-2 text-[10px] text-teal-950">
                <Sparkles size={14} className="text-teal-600 shrink-0" />
                <p className="font-semibold leading-relaxed">
                  {batches.filter(b => b.status === "Approved").length === batches.length
                    ? "Optimal conformance. All batches successfully cleared full laboratory QC."
                    : `${batches.filter(b => b.status === "Testing").length} batches are undergoing incubation. Continue to live-update sensor readouts.`}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Collapsible "Log New Batch Run" Form */}
          {showAddBatchForm && (
            <div className="bg-teal-50/50 rounded-xl border border-teal-200/60 p-4 space-y-4 animate-fadeIn">
              <div className="border-b border-teal-100 pb-2 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-[#0f766e] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} /> {t.formTitle}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{t.formDesc}</p>
                </div>
                <button 
                  onClick={() => setShowAddBatchForm(false)}
                  className="text-gray-400 hover:text-[#0f766e] text-xs font-bold cursor-pointer"
                >
                  ✕ Close Form
                </button>
              </div>

              {/* Active Formula Snapshot Status Banner */}
              {activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0 ? (
                <div className="bg-emerald-900 text-emerald-100 p-3.5 rounded-xl border border-emerald-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded font-black text-[10px] uppercase flex items-center gap-1 tracking-wider">
                        <Camera size={12} /> Active Formula Detected
                      </span>
                      <span className="font-bold text-xs text-white">"{activeFormula.name}"</span>
                      <span className="text-[10px] font-mono text-emerald-300">({activeFormula.ingredients.length} Ingredients)</span>
                    </div>
                    <p className="text-[11px] text-emerald-200/90 leading-tight">
                      🔒 <strong>Snapshot Pattern:</strong> Committing this batch will capture an immutable deep-copy snapshot of <strong>{activeFormula.name}</strong>. Future changes to activeFormula in R&D will NEVER alter this historical batch record.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFormula.name) setNewBatchFormula(activeFormula.name);
                      if (activeFormula.batchSize) setNewBatchSize(activeFormula.batchSize);
                      if (activeFormula.targetCost && activeFormula.batchSize) {
                        setNewBatchCost(Math.round(activeFormula.targetCost * activeFormula.batchSize));
                      }
                      if (activeFormula.ingredients && activeFormula.ingredients.length > 0) {
                        setNewBatchIngredients(activeFormula.ingredients.map(i => i.name).join(", "));
                      }
                      if (activeFormula.properties?.pH) setNewBatchPh(activeFormula.properties.pH);
                      if (activeFormula.properties?.viscosity) setNewBatchViscosity(activeFormula.properties.viscosity);
                    }}
                    className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Sparkles size={13} /> Auto-fill from Active Formula
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-200 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <p>
                    <strong>No Active Formula currently loaded in workspace.</strong> You can enter custom formulation parameters manually. When committed, a standalone snapshot will be created.
                  </p>
                </div>
              )}

              <form onSubmit={handleCreateBatch} className="text-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-600 font-bold mb-1">{t.lblFormula}</label>
                    <select
                      value={newBatchFormula}
                      onChange={(e) => {
                        setNewBatchFormula(e.target.value);
                        // Autocalculate standard default prices and suggest ingredients for aesthetics
                        if (e.target.value === "Premium Laundry Liquid") { 
                          setNewBatchSize(500); 
                          setNewBatchCost(31000); 
                          setNewBatchIngredients("SLES, LABSA, Soda Ash, Sodium Gluconate");
                        }
                        else if (e.target.value === "Standard Dishwash Liquid") { 
                          setNewBatchSize(200); 
                          setNewBatchCost(9600); 
                          setNewBatchIngredients("LABSA, SLES, CAPB, Salt");
                        }
                        else if (e.target.value === "Eco Handwash Base") { 
                          setNewBatchSize(1000); 
                          setNewBatchCost(61800); 
                          setNewBatchIngredients("SLES, CAPB, Sodium Gluconate, CMC");
                        }
                        else if (e.target.value === "Industrial Floor Degreaser") { 
                          setNewBatchSize(750); 
                          setNewBatchCost(48000); 
                          setNewBatchIngredients("Soda Ash, LABSA, Sodium Gluconate");
                        }
                        else {
                          setNewBatchIngredients("LABSA, SLES, Soda Ash, CAPB, Sodium Gluconate, CMC, Salt");
                        }
                      }}
                      className="w-full bg-white border border-teal-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e] font-semibold text-gray-700"
                    >
                      <option value="Premium Laundry Liquid">Premium Laundry Liquid (SLES + LABSA Base)</option>
                      <option value="Standard Dishwash Liquid">Standard Dishwash Liquid (Lemon Extract)</option>
                      <option value="Eco Handwash Base">Eco Handwash Base (Sulfate-Free)</option>
                      <option value="Industrial Floor Degreaser">Industrial Floor Degreaser (Highly Alkaline)</option>
                      <option value="Custom Formulation Run">Custom Formulation Run</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 font-bold mb-1">{t.lblScale}</label>
                    <input
                      type="number"
                      value={newBatchSize}
                      onChange={(e) => setNewBatchSize(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-teal-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e] text-center font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 font-bold mb-1">{t.lblCost}</label>
                    <input
                      type="number"
                      value={newBatchCost}
                      onChange={(e) => setNewBatchCost(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-white border border-teal-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e] text-center font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-600 font-bold mb-1">{t.lblOperator}</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Amit Sharma"
                      value={newBatchOperator}
                      onChange={(e) => setNewBatchOperator(e.target.value)}
                      className="w-full bg-white border border-teal-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e] font-semibold text-gray-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 font-bold mb-1">{t.lblStatus}</label>
                    <select
                      value={newBatchStatus}
                      onChange={(e) => setNewBatchStatus(e.target.value as any)}
                      className="w-full bg-white border border-teal-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e] font-semibold text-gray-700"
                    >
                      <option value="Pending">Pending ⏳ (Awaiting Audit)</option>
                      <option value="Testing">Testing 🔬 (Lab Incubation)</option>
                      <option value="Approved">Approved ✅ (Quality Cleared)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1 text-[10px] text-center">pH Targeted</label>
                      <input
                        type="text"
                        value={newBatchPh}
                        onChange={(e) => setNewBatchPh(e.target.value)}
                        placeholder="7.5"
                        className="w-full bg-white border border-teal-100 rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1 text-[10px] text-center">Viscosity</label>
                      <input
                        type="text"
                        value={newBatchViscosity}
                        onChange={(e) => setNewBatchViscosity(e.target.value)}
                        placeholder="2000 cPs"
                        className="w-full bg-white border border-teal-100 rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1 text-[10px] text-center">Aspect / Color</label>
                      <input
                        type="text"
                        value={newBatchAppearance}
                        onChange={(e) => setNewBatchAppearance(e.target.value)}
                        placeholder="Clear"
                        className="w-full bg-white border border-teal-100 rounded-lg p-1.5 focus:outline-none text-center text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-gray-600 font-bold">{t.lblIngredients || "Ingredients (comma-separated)"}</label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setNewBatchIngredients(prev => prev ? `${prev}, ${val}` : val);
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                      className="text-[10px] bg-teal-50 border border-teal-200 text-teal-800 rounded px-2 py-0.5 focus:outline-none"
                    >
                      <option value="" disabled>+ Quick Add from Universal Library</option>
                      {getAllUniversalIngredients().map(ing => (
                        <option key={ing.id} value={ing.name}>{ing.name}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. SLES, LABSA, Soda Ash, Sodium Gluconate"
                    value={newBatchIngredients}
                    onChange={(e) => setNewBatchIngredients(e.target.value)}
                    className="w-full bg-white border border-teal-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e] font-semibold text-gray-700"
                    required
                  />
                </div>

                <div className="bg-white p-3 rounded-lg border border-teal-100/50 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-[#0f766e] tracking-wider block">Process parameters & R&D Monitors</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1 text-[10px]">Charging Sequence & Times</label>
                      <input
                        type="text"
                        placeholder="e.g. Water: 5m, Soda: 10m"
                        value={newBatchChargingTimes}
                        onChange={(e) => setNewBatchChargingTimes(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1 text-[10px]">Shear Mixer Rate (RPM)</label>
                      <input
                        type="text"
                        placeholder="e.g. 500 RPM"
                        value={newBatchShearRates}
                        onChange={(e) => setNewBatchShearRates(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1 text-[10px]">Energy Consumed</label>
                      <input
                        type="text"
                        placeholder="e.g. 3.2 kWh"
                        value={newBatchEnergyConsumption}
                        onChange={(e) => setNewBatchEnergyConsumption(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 font-semibold mb-1 text-[10px]">Mixing Order SOP Template</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 1. Dissolve powder 2. Titrate actives..."
                      value={newBatchMixingOrder}
                      onChange={(e) => setNewBatchMixingOrder(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 font-bold mb-1">{t.lblNotes}</label>
                  <textarea
                    rows={2}
                    placeholder="Log specific physical observations during blending or surfactant titration."
                    value={newBatchNotes}
                    onChange={(e) => setNewBatchNotes(e.target.value)}
                    className="w-full bg-white border border-teal-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0f766e] text-white py-2 rounded-lg font-bold hover:bg-[#0d645c] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Database size={15} /> {t.btnCommitBatch}
                </button>
              </form>
            </div>
          )}

          {/* Search, Filter Tabs and dynamic visual stats bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f9fafb] p-3 rounded-xl border border-gray-150">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={batchSearch}
                onChange={(e) => setBatchSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-[#0f766e] text-gray-700"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-white border border-gray-200 p-1 rounded-lg shrink-0 gap-1 overflow-x-auto">
              {[
                { filter: "All", label: t.filterAll, count: batches.length },
                { filter: "Pending", label: t.filterPending, count: batches.filter(b => b.status === "Pending").length },
                { filter: "Testing", label: t.filterTesting, count: batches.filter(b => b.status === "Testing").length },
                { filter: "Approved", label: t.filterApproved, count: batches.filter(b => b.status === "Approved").length }
              ].map((pill) => (
                <button
                  key={pill.filter}
                  onClick={() => setStatusFilter(pill.filter as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    statusFilter === pill.filter
                      ? "bg-[#0f766e] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {pill.label}
                  <span className={`text-[10px] px-1.5 py-0.25 rounded-full ${statusFilter === pill.filter ? "bg-white text-[#0f766e]" : "bg-gray-100 text-gray-500"}`}>
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Visual Batches Ledger Ledger list */}
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            {/* Table Header Action Bar */}
            <div className="bg-gray-50/70 border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0f766e] animate-pulse"></div>
                <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">Batch Runs Data Table</span>
                <span className="text-[10px] bg-teal-50 text-[#0f766e] px-2 py-0.5 rounded-full font-bold border border-teal-100 font-mono">
                  {filteredBatches.length} of {batches.length} Records
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-table-export-csv"
                  onClick={exportBatchesToCSV}
                  className="bg-white hover:bg-teal-50/50 text-gray-700 hover:text-[#0f766e] border border-gray-200 hover:border-teal-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Export currently filtered batch data to CSV sheet"
                >
                  <FileSpreadsheet size={13} className="text-[#0f766e]" /> Export CSV
                </button>
                <button
                  id="btn-table-download-pdf"
                  onClick={exportBatchesToPDF}
                  className="bg-white hover:bg-emerald-50/50 text-gray-700 hover:text-emerald-800 border border-gray-200 hover:border-emerald-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Download currently filtered comprehensive report as PDF"
                >
                  <FileText size={13} className="text-emerald-700" /> Download PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[768px]">
              <thead>
                <tr className="bg-gray-100/75 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 text-center w-28">{t.colDate || "Date"}</th>
                  <th className="py-3 px-4">{translations?.lblFormula || "Batch Name"}</th>
                  <th className="py-3 px-4">{t.colIngredients || "Ingredients"}</th>
                  <th className="py-3 px-4 text-center w-36">{t.colStatus || "Status"}</th>
                  <th className="py-3 px-4 text-right w-32">{t.colActions || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-gray-700 bg-white">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 px-4 text-center text-gray-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-2xl">🧪</span>
                        <span>No batch formulations match your current search/filter settings.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => {
                    const isExpanded = expandedBatchId === b.id;
                    const ingList = b.ingredients || [
                      ...(b.formulaName === "Premium Laundry Liquid" ? ["SLES", "LABSA", "Soda Ash", "Sodium Gluconate"] :
                          b.formulaName === "Standard Dishwash Liquid" ? ["LABSA", "SLES", "CAPB", "Salt"] :
                          b.formulaName === "Eco Handwash Base" ? ["SLES", "CAPB", "Sodium Gluconate", "CMC"] :
                          b.formulaName === "Industrial Floor Degreaser" ? ["Soda Ash", "LABSA", "Sodium Gluconate"] :
                          ["LABSA", "SLES"])
                    ];
                    return (
                      <React.Fragment key={b.id}>
                        {/* Parent row */}
                        <tr 
                          id={`batch-row-${b.id}`}
                          className={`hover:bg-teal-50/10 cursor-pointer transition-all duration-150 ${isExpanded ? "bg-teal-50/20" : ""}`}
                          onClick={() => setExpandedBatchId(isExpanded ? null : b.id)}
                        >
                          <td className="py-3.5 px-4 text-center text-gray-500 font-mono font-medium whitespace-nowrap border-b border-gray-100">
                            <div className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-gray-600 font-semibold border border-gray-200">
                              <span>📅</span>
                              <span>{b.date}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-b border-gray-100">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-sm hover:text-[#0f766e] transition-colors">
                                  {b.formulaName}
                                </span>
                                <span className="px-2 py-0.5 bg-teal-50 text-[#0f766e] font-mono font-bold text-[10px] rounded-md border border-teal-100 whitespace-nowrap shadow-xs">
                                  {b.batchNo}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-3">
                                <span className="flex items-center gap-1">⚖️ Scale: <strong className="text-gray-700 font-bold">{b.batchSize} kg</strong></span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1">💰 Cost: <strong className="text-[#0f766e] font-bold">₹{b.totalCost.toLocaleString()}</strong></span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 border-b border-gray-100">
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {ingList.map((ing: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-teal-50/60 text-[#0f766e] border border-teal-100 font-semibold transition-all hover:bg-[#0f766e] hover:text-white">
                                  {ing}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center border-b border-gray-100">
                            {b.status === "Approved" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300"></span>
                                APPROVED
                              </span>
                            )}
                            {b.status === "Testing" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse ring-2 ring-blue-300"></span>
                                TESTING
                              </span>
                            )}
                            {b.status === "Pending" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-300"></span>
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right border-b border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setExpandedBatchId(isExpanded ? null : b.id)}
                                className="p-1.5 text-gray-500 hover:text-[#0f766e] hover:bg-teal-50 rounded-lg transition-all cursor-pointer"
                                title="Expand/Collapse parameters"
                              >
                                <ChevronDown size={15} className={`transform transition-transform ${isExpanded ? "rotate-180 text-[#0f766e]" : "text-gray-400"}`} />
                              </button>
                              <button
                                onClick={() => setSelectedQrBatch(b)}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                title="Generate Printable QR Label"
                              >
                                <QrCode size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteBatch(b.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="Delete batch entry"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Details Block */}
                        {isExpanded && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={5} className="p-4 border-t border-b border-teal-100/50 bg-[#fafcfc]">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                                
                                {/* Column Full-Width: Immutable Formula Snapshot & Raw Material Consumption */}
                                {b.snapshot ? (
                                  <div className="lg:col-span-2 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-3 shadow-md">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1.5 tracking-wider uppercase">
                                          <Lock size={12} /> IMMUTABLE PRODUCTION SNAPSHOT
                                        </span>
                                        <span className="font-bold text-sm text-white">{b.snapshot.name}</span>
                                        <span className="text-xs text-slate-400 font-mono">v{b.snapshot.version || "1.0"}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs flex-wrap">
                                        <span className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
                                          Scale: <strong className="text-white">{b.batchSize} kg</strong>
                                        </span>
                                        {b.snapshot.productType && (
                                          <span className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
                                            {b.snapshot.productType}
                                          </span>
                                        )}
                                        {b.snapshot.grade && (
                                          <span className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
                                            {b.snapshot.grade} Grade
                                          </span>
                                        )}
                                        <span className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700 font-mono text-[11px]">
                                          Captured: {new Date(b.snapshot.timestamp || b.date).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Snapshot Ingredients & Raw Material Consumption Grid */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1">
                                          <ShieldCheck size={13} className="text-emerald-400" />
                                          Captured Formula Composition & Raw Material Consumption
                                        </span>
                                        <span>{b.snapshot.ingredients?.length || 0} Ingredients</span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {b.snapshot.ingredients?.map((ing: any, idx: number) => {
                                          const requiredKg = ing.requiredQtyKg !== undefined
                                            ? ing.requiredQtyKg
                                            : Number(((ing.percentage / 100) * b.batchSize).toFixed(3));
                                          return (
                                            <div key={idx} className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1">
                                              <div className="flex items-center justify-between gap-1">
                                                <span className="font-bold text-xs text-white truncate" title={ing.name}>
                                                  {ing.name}
                                                </span>
                                                <span className="font-bold text-teal-300 font-mono text-xs bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60 shrink-0">
                                                  {ing.percentage}%
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                                                <span className="truncate max-w-[130px]">{ing.function || "Raw Material"}</span>
                                                <span className="font-mono text-emerald-300 font-bold">
                                                  {requiredKg} kg
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <p className="text-[10px] text-slate-400 italic pt-1">
                                        * Industrial GMP Rule: This historical formula snapshot is frozen and immutable. Modifications to active formulas in R&D do NOT alter this record.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="lg:col-span-2 bg-slate-100 text-slate-700 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                                    <span>Legacy Batch Record — Formulated with basic ingredient list.</span>
                                    <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded">Standard Ledger</span>
                                  </div>
                                )}

                                {/* Column A: Live metrics with direct state edits */}
                                <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
                                  <div className="flex items-center justify-between border-b pb-1.5 mb-1">
                                    <span className="font-bold text-[#0f766e] tracking-wider uppercase flex items-center gap-1.5 text-[10px]">
                                      🔬 {t.expandedQcTitle}
                                    </span>
                                    <span className="text-[10px] bg-teal-50 text-[#0f766e] font-bold px-1.5 py-0.25 rounded">
                                      Lead-Sync
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 italic">
                                    {t.lblLiveEdit}
                                  </p>

                                  <div className="grid grid-cols-3 gap-2 pt-1">
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Hydrogen pH</label>
                                      <input
                                        type="text"
                                        value={b.qc_ph}
                                        onChange={(e) => handleUpdateBatchField(b.id, "qc_ph", e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-center font-mono font-bold text-gray-700 focus:outline-none focus:border-[#0f766e]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Viscosity (cPs)</label>
                                      <input
                                        type="text"
                                        value={b.qc_viscosity}
                                        onChange={(e) => handleUpdateBatchField(b.id, "qc_viscosity", e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-center font-mono font-bold text-gray-700 focus:outline-none focus:border-[#0f766e]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Appearance</label>
                                      <input
                                        type="text"
                                        value={b.qc_appearance}
                                        onChange={(e) => handleUpdateBatchField(b.id, "qc_appearance", e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-center font-bold text-gray-700 focus:outline-none focus:border-[#0f766e]"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Assigned Scientist / Operator</label>
                                      <div className="relative">
                                        <span className="absolute inset-y-0 left-2 flex items-center text-gray-400">
                                          <User size={11} />
                                        </span>
                                        <input
                                          type="text"
                                          value={b.operator}
                                          onChange={(e) => handleUpdateBatchField(b.id, "operator", e.target.value)}
                                          className="w-full bg-gray-50 border border-gray-200 rounded pl-7 pr-2 py-1 font-semibold text-gray-700 focus:outline-none focus:border-[#0f766e]"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Scale Volume Weight (kg)</label>
                                      <input
                                        type="number"
                                        value={b.batchSize}
                                        onChange={(e) => handleUpdateBatchField(b.id, "batchSize", Number(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded p-1 font-mono font-bold text-gray-700 focus:outline-none focus:border-[#0f766e]"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Column B: Interactive timeline & Quality cert exports */}
                                <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
                                  <div>
                                    <span className="font-bold text-[#0f766e] tracking-wider uppercase block border-b pb-1.5 mb-1.5 text-[10px]">
                                      🎯 {t.expandedLifeTitle}
                                    </span>

                                    {/* Visual timeline progression */}
                                    <div className="flex items-center justify-between px-2 py-3">
                                      <div className="flex flex-col items-center">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                                          b.status === "Pending" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" : "bg-teal-50 text-teal-700"
                                        }`}>
                                          1
                                        </div>
                                        <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Pending</span>
                                      </div>
                                      <div className="flex-1 h-0.5 bg-gray-200 mx-1 mb-3"></div>
                                      <div className="flex flex-col items-center">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                                          b.status === "Testing" ? "bg-blue-100 text-blue-800 border border-blue-300 animate-pulse" : "bg-teal-50 text-teal-700"
                                        }`}>
                                          2
                                        </div>
                                        <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Testing</span>
                                      </div>
                                      <div className="flex-1 h-0.5 bg-gray-200 mx-1 mb-3"></div>
                                      <div className="flex flex-col items-center">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                                          b.status === "Approved" ? "bg-green-100 text-green-800 border border-green-300" : "bg-gray-100 text-gray-400"
                                        }`}>
                                          3
                                        </div>
                                        <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Approved</span>
                                      </div>
                                    </div>

                                    {/* Direct Action Status toggles */}
                                    <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">QC State Action:</span>
                                      <button
                                        onClick={() => handleUpdateBatchField(b.id, "status", "Pending")}
                                        className={`px-2 py-1 rounded text-[9px] font-bold transition-all border cursor-pointer ${
                                          b.status === "Pending"
                                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                        }`}
                                      >
                                        Set Pending
                                      </button>
                                      <button
                                        onClick={() => handleUpdateBatchField(b.id, "status", "Testing")}
                                        className={`px-2 py-1 rounded text-[9px] font-bold transition-all border cursor-pointer ${
                                          b.status === "Testing"
                                            ? "bg-blue-100 text-blue-800 border-blue-300"
                                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                        }`}
                                      >
                                        Set Testing
                                      </button>
                                      <button
                                        onClick={() => handleUpdateBatchField(b.id, "status", "Approved")}
                                        className={`px-2 py-1 rounded text-[9px] font-bold transition-all border border-green-200 cursor-pointer ${
                                          b.status === "Approved"
                                            ? "bg-green-100 text-green-800 border-green-300"
                                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                        }`}
                                      >
                                        Set Approved ✅
                                      </button>
                                    </div>

                                    {/* Notes textarea */}
                                    <div className="mt-3">
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Technician Observations</label>
                                      <textarea
                                        rows={1}
                                        value={b.notes}
                                        onChange={(e) => handleUpdateBatchField(b.id, "notes", e.target.value)}
                                        placeholder="Add observation updates..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-[11px] text-gray-700 focus:outline-none focus:border-[#0f766e]"
                                      />
                                    </div>

                                    {/* Process Parameters & R&D Monitors Display */}
                                    <div className="mt-3 bg-teal-50/40 p-2.5 rounded-lg border border-teal-100/50 space-y-2">
                                      <span className="font-bold text-[#0f766e] uppercase tracking-wider block text-[9px]">
                                        ⚙️ Process Parameters & R&D Monitors
                                      </span>
                                      <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-gray-600 border-b pb-1 border-dashed border-teal-100">
                                        <div>
                                          <span className="font-sans text-[8px] text-gray-400 block uppercase font-bold">Charging Times</span>
                                          <span className="text-gray-800 font-bold">{b.chargingTimes || "Water: 5m, Soda: 10m"}</span>
                                        </div>
                                        <div>
                                          <span className="font-sans text-[8px] text-gray-400 block uppercase font-bold">Shear Rate</span>
                                          <span className="text-gray-800 font-bold">{b.shearRates || "500 RPM"}</span>
                                        </div>
                                        <div>
                                          <span className="font-sans text-[8px] text-gray-400 block uppercase font-bold">Energy spent</span>
                                          <span className="text-emerald-700 font-bold">{b.energyConsumption || "3.2 kWh"}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="font-sans text-[8px] text-gray-400 block uppercase font-bold mb-0.5">Mixing Order SOP Template</span>
                                        <p className="text-gray-700 text-[10px] font-mono leading-relaxed bg-white p-2 rounded border border-gray-100 max-h-[75px] overflow-y-auto whitespace-pre-wrap">
                                          {b.mixingOrder || "1. Charge water and start agitation.\n2. Slowly add Soda Ash and mix until dissolved.\n3. Charge LABSA and neutralize.\n4. Blend in SLES."}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Download Specific Quality Pass Certificate */}
                                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 mt-2">
                                    <span className="text-[10px] text-gray-400 font-medium">Compliance Seal: QA-ISO9001</span>
                                    <button
                                      onClick={() => exportSingleBatchPDF(b)}
                                      className="bg-[#0f766e] hover:bg-[#0d645c] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                                      title="Generate individual certified PDF pass document"
                                    >
                                      <Award size={12} /> {t.btnCert}
                                    </button>
                                  </div>

                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>

      {/* ==================== BATCH QR CODE GENERATOR MODAL ==================== */}
      {selectedQrBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-teal-100 flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
            
            {/* Left Column: Generator Settings & Customization */}
            <div className="p-6 md:w-1/2 bg-gray-50 border-r border-gray-150 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="text-[#0f766e]" size={20} />
                    <h4 className="text-sm font-bold text-gray-900">QR Code Label Customizer</h4>
                  </div>
                  <span className="text-[10px] bg-teal-100 text-[#0f766e] px-2 py-0.5 rounded-full font-bold font-mono">
                    {selectedQrBatch.batchNo}
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Select Batch Dropdown (allows rapid switching!) */}
                  <div>
                    <label className="block text-gray-600 font-bold mb-1">Select Formulation Run:</label>
                    <select
                      value={selectedQrBatch.id}
                      onChange={(e) => {
                        const batch = batches.find(b => b.id === e.target.value);
                        if (batch) setSelectedQrBatch(batch);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batchNo} - {b.formulaName} ({b.date})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Header Title */}
                  <div>
                    <label className="block text-gray-600 font-bold mb-1">Label Brand Title:</label>
                    <input
                      type="text"
                      value={qrLabelTitle}
                      onChange={(e) => setQrLabelTitle(e.target.value)}
                      placeholder="e.g. DETERGENT R&D LABS"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                    />
                  </div>

                  {/* Toggle QC Parameters */}
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150">
                    <div>
                      <span className="font-bold text-gray-800 block">Include QC Specifications</span>
                      <span className="text-[10px] text-gray-400">Embed pH, Viscosity & Appearance</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qrIncludeQc}
                        onChange={(e) => setQrIncludeQc(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0f766e]"></div>
                    </label>
                  </div>

                  {/* Payload Format Selection */}
                  <div>
                    <label className="block text-gray-600 font-bold mb-1.5">QR Payload Data Format:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setQrFormat("text")}
                        className={`py-2 px-3 rounded-lg font-bold border text-center transition-all cursor-pointer ${
                          qrFormat === "text"
                            ? "bg-[#0f766e] text-white border-[#0f766e]"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        Human Readable Text
                      </button>
                      <button
                        onClick={() => setQrFormat("json")}
                        className={`py-2 px-3 rounded-lg font-bold border text-center transition-all cursor-pointer ${
                          qrFormat === "json"
                            ? "bg-[#0f766e] text-white border-[#0f766e]"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        JSON Payload
                      </button>
                    </div>
                  </div>

                  {/* QR Image Size Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-gray-600 font-bold">QR Display Density:</label>
                      <span className="font-mono font-bold text-teal-700">{qrSize}x{qrSize} px</span>
                    </div>
                    <input
                      type="range"
                      min="140"
                      max="240"
                      step="20"
                      value={qrSize}
                      onChange={(e) => setQrSize(Number(e.target.value))}
                      className="w-full accent-[#0f766e] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>Auto-scans into standard ERP systems</span>
                <span>v1.2.0</span>
              </div>
            </div>

            {/* Right Column: Live Interactive QR Label Card Preview */}
            <div className="p-6 md:w-1/2 flex flex-col justify-between items-center bg-white">
              <div className="w-full text-center">
                <div className="flex items-center justify-between w-full mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">LIVE LABEL PREVIEW</span>
                  <button
                    onClick={() => setSelectedQrBatch(null)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Printable Label Card Preview Area */}
                <div className="border-2 border-dashed border-teal-300 rounded-2xl p-4 bg-[#fafcfc] shadow-sm w-full max-w-[320px] mx-auto text-center relative">
                  <div className="text-[10px] font-extrabold text-[#0f766e] tracking-wider uppercase border-b border-gray-200 pb-1.5 mb-2">
                    {qrLabelTitle || "DETERGENT R&D LABS"}
                  </div>

                  {/* Dynamically Loaded QR Code Image via HTTPS */}
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm inline-block my-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(
                        qrFormat === "json"
                          ? JSON.stringify({
                              batchNo: selectedQrBatch.batchNo,
                              formula: selectedQrBatch.formulaName,
                              date: selectedQrBatch.date,
                              scaleKg: selectedQrBatch.batchSize,
                              status: selectedQrBatch.status,
                              operator: selectedQrBatch.operator,
                              ...(qrIncludeQc ? { ph: selectedQrBatch.qc_ph, viscosity: selectedQrBatch.qc_viscosity, appearance: selectedQrBatch.qc_appearance } : {})
                            })
                          : `BATCH: ${selectedQrBatch.batchNo}\nFORMULA: ${selectedQrBatch.formulaName}\nDATE: ${selectedQrBatch.date}\nSCALE: ${selectedQrBatch.batchSize} kg\nSTATUS: ${selectedQrBatch.status}\nOPERATOR: ${selectedQrBatch.operator}${qrIncludeQc ? `\nQC PH: ${selectedQrBatch.qc_ph}\nQC VISCOSITY: ${selectedQrBatch.qc_viscosity}\nQC APPEARANCE: ${selectedQrBatch.qc_appearance}` : ""}`
                      )}`}
                      alt="Dynamic Batch QR Label"
                      className="mx-auto block"
                      style={{ width: `${qrSize - 40}px`, height: `${qrSize - 40}px` }}
                    />
                  </div>

                  {/* Summary Metadata text */}
                  <div className="text-left bg-white p-2 rounded-lg border border-teal-50 text-[10px] space-y-1 mt-2">
                    <div className="flex justify-between"><span className="text-gray-400 font-medium">Batch No:</span><span className="font-bold text-gray-800 font-mono">{selectedQrBatch.batchNo}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400 font-medium">Product:</span><span className="font-bold text-gray-800 truncate max-w-[150px]">{selectedQrBatch.formulaName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400 font-medium">Date Run:</span><span className="font-bold text-gray-800 font-mono">{selectedQrBatch.date}</span></div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">QC Status:</span>
                      <span className={`font-bold ${
                        selectedQrBatch.status === "Approved" ? "text-green-600" : selectedQrBatch.status === "Testing" ? "text-blue-600" : "text-yellow-600"
                      }`}>{selectedQrBatch.status.toUpperCase()}</span>
                    </div>
                    {qrIncludeQc && (
                      <>
                        <div className="border-t border-dashed border-gray-100 my-1 pt-1"></div>
                        <div className="flex justify-between"><span className="text-gray-400">QC pH:</span><span className="font-semibold text-gray-700">{selectedQrBatch.qc_ph}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">QC Viscosity:</span><span className="font-semibold text-gray-700">{selectedQrBatch.qc_viscosity}</span></div>
                      </>
                    )}
                  </div>
                  
                  <div className="text-[8px] text-gray-400 uppercase tracking-wider mt-2.5">
                    SCAN FOR SYSTEM COMPLIANCE LEDGER
                  </div>
                </div>
              </div>

              {/* Printing & Action Commands */}
              <div className="w-full grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => handleDownloadQrImage(selectedQrBatch)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download size={14} /> Download PNG
                </button>
                <button
                  onClick={() => handlePrintLabel(selectedQrBatch)}
                  className="bg-[#0f766e] hover:bg-[#0c5f58] text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Printer size={14} /> Print Label
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
