import React, { useState, useEffect } from "react";
import {
  Search, FileText, Download, Shield, Printer, ExternalLink, Plus, ChevronDown, CheckCircle2,
  Bookmark, Briefcase, Calendar, Image, Bell, Layers, Tag, Trash2, HelpCircle, AlertTriangle, AlertCircle, RefreshCw
} from "lucide-react";

interface Props {
  lang: "en" | "hi" | "mr" | "gu" | "ta" | "te" | "kn" | "ml" | "ar" | "fr" | "es" | "de";
  translations: any;
}

interface DocumentItem {
  title: string;
  type: string;
  source: string;
  link: string;
  description: string;
  hazards: string[];
}

// Keep the default documents as requested
const DEFAULT_DOCS: DocumentItem[] = [
  {
    title: "Material Safety Data Sheet (MSDS) - LABSA 90%",
    type: "SDS / MSDS",
    source: "PubChem Ref 954721",
    link: "https://pubchem.ncbi.nlm.nih.gov/compound/Dodecylbenzenesulfonic-acid",
    description: "Comprehensive hazard profiles, first aid, chemical storage guidelines, and transport limitations for Linear Alkylbenzene Sulfonic Acid.",
    hazards: ["Corrosive ⚠️", "Harmful if swallowed 💀", "Aquatic Toxicity 🐟"]
  },
  {
    title: "Technical Data Sheet (TDS) - SLES 70%",
    type: "TDS / Bulletin",
    source: "Galaxy Surfactants Ltd",
    link: "https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-laureth-sulfate",
    description: "Specification sheets, active content determination, cloud point, dilution guidelines, and viscosity performance parameters.",
    hazards: ["Skin Irritant ⚠️", "Eye Damaging 👁️"]
  },
  {
    title: "IS 4955:2020 - Household Liquid Detergents Standard",
    type: "Regulatory Standard",
    source: "Bureau of Indian Standards (BIS)",
    link: "https://www.bis.gov.in",
    description: "National standards defining active matter minimum bounds, phosphorus limits, biodegradability requirements, and foam stability for Indian market detergents.",
    hazards: ["Compliance Standard 📜"]
  },
  {
    title: "OECD 301D - Ready Biodegradability Closed Bottle Test",
    type: "Eco Regulation",
    source: "OECD Guidelines for Testing",
    link: "https://www.oecd.org",
    description: "Standard testing guidelines for evaluating biochemical oxygen demand (BOD) over 28 days to certify ready biodegradability of consumer surfactants.",
    hazards: ["Bio-sustainability Rule 🌱"]
  },
  {
    title: "Raw Material Certificate of Analysis (COA) - SLES 70% Batch #SL-9942",
    type: "Certificate of Analysis (COA)",
    source: "QA Lab - Galaxy Surfactants Ltd",
    link: "https://pubchem.ncbi.nlm.nih.gov",
    description: "Analytical chemistry pass results verifying SLES active matter is 70.2%, 1,4-dioxane < 10 ppm, pH of 10% solution is 8.1, and color is APHA 10 max.",
    hazards: ["QA Verified ✅", "Active Content: 70.2% 🔬", "Lot #SL-9942 📜"]
  }
];

// Reference regulatory database (BIS, ISO, ASTM, etc.)
const REGULATORY_DB = [
  { standard: "IS 4955:2020", body: "BIS", desc: "Household Liquid Detergents standard. Defines active matter, active ingredients titration, and phosphate restrictions.", scope: "Household Cleaning, India" },
  { standard: "IS 13933:1995", body: "BIS", desc: "Synthetic Detergents for Washing Woollen and Silk Fabrics specifications.", scope: "Textile Washing, India" },
  { standard: "ISO 21703:2019", body: "ISO", desc: "Surface active agents - Bio-based surfactants - Requirements and test methods.", scope: "Global Sustainability" },
  { standard: "ASTM D1172-15", body: "ASTM", desc: "Standard Guide for pH of Aqueous Solutions of Soaps and Detergents.", scope: "Laboratory, Global" },
  { standard: "OECD 301B", body: "OECD", desc: "CO2 Evolution biodegradability test. Standard validation for green certification claims.", scope: "Global Environmental" },
  { standard: "EC 1907/2006 (REACH)", body: "ECHA", desc: "Registration, Evaluation, Authorisation and Restriction of Chemicals. Critical for European market surfactants.", scope: "Europe, Safety Compliance" },
  { standard: "IFRA 50th Amendment", body: "IFRA", desc: "Restricts detergent fragrance ingredients list to avoid severe dermal allergens.", scope: "Dermal Care, Global" },
  { standard: "GHS Revision 9", body: "United Nations", desc: "Globally Harmonized System of Classification and Labelling of Chemicals. Directs hazard warning text.", scope: "Global Safety" }
];

// Warnings list starter
const DEFAULT_WARNINGS = [
  "Keep away from children / बच्चों की पहुँच से दूर रखें / बालकांपासून दूर ठेवा",
  "Avoid contact with eyes. In case of contact, rinse immediately.",
  "Do not ingest. If swallowed, consult a physician.",
  "Store in a cool, dry place away from direct sunlight.",
  "Read label carefully before use."
];

// Main Component
export default function DocsLibrary({ lang, translations }: Props) {
  const [subTab, setSubTab] = useState<
    "sds" | "generator" | "registration" | "regulatory" | "label" | "packaging" | "claims" | "export" | "images" | "reminders"
  >("sds");

  // --- PERSISTENT STORAGE ENGAGEMENT ---
  const [docs, setDocs] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem("lab_docs_registry");
    return saved ? JSON.parse(saved) : DEFAULT_DOCS;
  });

  useEffect(() => {
    localStorage.setItem("lab_docs_registry", JSON.stringify(docs));
  }, [docs]);

  // Product Registrations State
  const [registrations, setRegistrations] = useState<any[]>(() => {
    const saved = localStorage.getItem("lab_product_registrations");
    return saved ? JSON.parse(saved) : [
      { id: "reg-1", productName: "EcoClean Liquid Detergent", brandName: "EcoShield", category: "Fabric Wash", code: "LD-09", status: "Approved", country: "India", market: "Domestic", regNumber: "BIS-REG-947211", approvalDate: "2025-01-10", expiryDate: "2027-01-09", authority: "Bureau of Indian Standards", remarks: "Phosphate-free compliant." },
      { id: "reg-2", productName: "Ultra Foamer Hand Soap", brandName: "SoftPure", category: "Personal Care", code: "HS-41", status: "Pending", country: "United Arab Emirates", market: "Export", regNumber: "PENDING-GCC-12", approvalDate: "-", expiryDate: "-", authority: "GCC Standardization Organization", remarks: "Awaiting sample toxicity verification." }
    ];
  });
  useEffect(() => {
    localStorage.setItem("lab_product_registrations", JSON.stringify(registrations));
  }, [registrations]);

  // Packaging DB State
  const [packagingList, setPackagingList] = useState<any[]>(() => {
    const saved = localStorage.getItem("lab_packaging_db");
    return saved ? JSON.parse(saved) : [
      { id: "pack-1", type: "Bottle", material: "HDPE", capacity: "1 Litre", weight: "45g", dimensions: "240mm x 90mm", closureType: "Push-Pull Cap", neckFinish: "28/410", recyclability: "100% Recyclable (Grade 2)", supplier: "Apex Polymers Ltd", code: "HDPE-1L-APEX", verified: true },
      { id: "pack-2", type: "Pouch", material: "PET/PE Laminate", capacity: "500ml", weight: "8g", dimensions: "150mm x 200mm", closureType: "Spout Closure", neckFinish: "14mm Spout", recyclability: "Multi-layer Complex (Hard to Recycle)", supplier: "Flexible Pack Co.", code: "PCH-500-FLEX", verified: false }
    ];
  });
  useEffect(() => {
    localStorage.setItem("lab_packaging_db", JSON.stringify(packagingList));
  }, [packagingList]);

  // Packaging Compatibility Logs
  const [compatibilityLogs, setCompatibilityLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem("lab_packaging_compatibility");
    return saved ? JSON.parse(saved) : [
      { id: "comp-1", packId: "pack-1", packName: "HDPE 1-Litre Bottle", deformation: "No deformation observed", leakage: "Zero cap leakage", fragranceMigration: "No fragrance loss after 90 days", colourStaining: "No staining detected", cracking: "No environmental stress cracking", uvEffect: "Slight fading on unpigmented cap", notes: "Tested with pH 8.5 formulation at 45C stability chamber for 12 weeks.", observedDate: "2026-03-12" }
    ];
  });
  useEffect(() => {
    localStorage.setItem("lab_packaging_compatibility", JSON.stringify(compatibilityLogs));
  }, [compatibilityLogs]);

  // Claims Database
  const [claims, setClaims] = useState<any[]>(() => {
    const saved = localStorage.getItem("lab_claims_management");
    return saved ? JSON.parse(saved) : [
      { id: "cl-1", claim: "Biodegradable (>60% in 28 days)", evidenceDocTitle: "OECD 301D - Ready Biodegradability Closed Bottle Test" },
      { id: "cl-2", claim: "Phosphate Free", evidenceDocTitle: "IS 4955:2020 - Household Liquid Detergents Standard" },
      { id: "cl-3", claim: "Ultra Skin Mildness", evidenceDocTitle: "None" }
    ];
  });
  useEffect(() => {
    localStorage.setItem("lab_claims_management", JSON.stringify(claims));
  }, [claims]);

  // Warning & Safety Library
  const [warnings, setWarnings] = useState<string[]>(() => {
    const saved = localStorage.getItem("lab_warning_library");
    return saved ? JSON.parse(saved) : DEFAULT_WARNINGS;
  });
  useEffect(() => {
    localStorage.setItem("lab_warning_library", JSON.stringify(warnings));
  }, [warnings]);

  // Product Images State
  const [productImages, setProductImages] = useState<any[]>(() => {
    const saved = localStorage.getItem("lab_product_images");
    return saved ? JSON.parse(saved) : [
      { id: "img-1", productName: "EcoClean Liquid Detergent", category: "Product", fileName: "bottle_front_final.png", date: "2026-05-10", colour: "#0f766e" },
      { id: "img-2", productName: "EcoClean Liquid Detergent", category: "Label", fileName: "back_panel_compliance_v2.png", date: "2026-05-14", colour: "#0891b2" }
    ];
  });
  useEffect(() => {
    localStorage.setItem("lab_product_images", JSON.stringify(productImages));
  }, [productImages]);

  // Reminders State
  const [reminders, setReminders] = useState<any[]>(() => {
    const saved = localStorage.getItem("lab_reminders");
    return saved ? JSON.parse(saved) : [
      { id: "rem-1", title: "Renew BIS Registration (BIS-REG-947211)", expiryDate: "2027-01-09", category: "Registration Renewal", notified: false },
      { id: "rem-2", title: "Audit Prep - ISO 14001 Chemical Handling Review", expiryDate: "2026-09-15", category: "Audit Preparation", notified: false }
    ];
  });
  useEffect(() => {
    localStorage.setItem("lab_reminders", JSON.stringify(reminders));
  }, [reminders]);

  // General Filter / Search SDS States (original component scope)
  const [searchQuery, setSearchQuery] = useState("");
  const [docCategory, setDocCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);

  // Original additions form states
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Certificate of Analysis (COA)");
  const [newSource, setNewSource] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newHazardsStr, setNewHazardsStr] = useState("");

  // Filtered list of documents (Tab 1)
  const filteredDocs = docs.filter((d) => {
    const matchesCat = docCategory === "All" || d.type === docCategory;
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handlePrintDocument = (docTitle: string, docDetails?: DocumentItem) => {
    const foundDoc = docDetails || docs.find((d) => d.title === docTitle);

    const title = foundDoc ? foundDoc.title : docTitle;
    const type = foundDoc ? foundDoc.type : "Regulatory Compliance Record";
    const source = foundDoc ? foundDoc.source : "R&D Internal Laboratory";
    const description = foundDoc
      ? foundDoc.description
      : `Official Laboratory Document / Preset for ${docTitle}.\nAll safety parameters and technical specifications verified in compliance with laboratory standards.`;
    const hazards = foundDoc ? foundDoc.hazards : ["Verified Standard ✅", "R&D Compliance"];

    const printContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      @page { size: A4 portrait; margin: 15mm; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        margin: 0;
        padding: 24px;
        background: #ffffff;
        line-height: 1.5;
      }
      .header-bar {
        border-bottom: 2px solid #0f766e;
        padding-bottom: 12px;
        margin-bottom: 20px;
      }
      .org-title {
        font-size: 10px;
        font-weight: 700;
        color: #0f766e;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .doc-title {
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
        margin: 4px 0 0 0;
      }
      .doc-meta {
        font-size: 11px;
        color: #64748b;
        margin-top: 6px;
      }
      .badge {
        display: inline-block;
        background-color: #f0fdf4;
        color: #166534;
        border: 1px solid #bbf7d0;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 12px;
      }
      .source-tag {
        font-size: 11px;
        color: #475569;
        margin-bottom: 16px;
      }
      .content-box {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-word;
        color: #1e293b;
      }
      .hazards-container {
        margin-top: 16px;
      }
      .hazard-tag {
        display: inline-block;
        background-color: #f1f5f9;
        color: #334155;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        margin-right: 6px;
        margin-bottom: 6px;
      }
      .footer {
        margin-top: 40px;
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
        font-size: 10px;
        color: #94a3b8;
        display: flex;
        justify-content: space-between;
      }
      @media print {
        body { padding: 0; }
      }
    </style>
  </head>
  <body>
    <div class="header-bar">
      <div class="org-title">SAFETY & AUDITING REGULATORY COMPLIANCE</div>
      <h1 class="doc-title">${title}</h1>
      <div class="doc-meta">
        <strong>Printed Date:</strong> ${new Date().toLocaleDateString()} &nbsp;|&nbsp; 
        <strong>Ref ID:</strong> DOC-${Math.floor(100000 + Math.random() * 900000)}
      </div>
    </div>

    <div>
      <span class="badge">${type}</span>
      <div class="source-tag"><strong>Issuing Source / Authority:</strong> ${source}</div>
    </div>

    <div class="content-box">${description}</div>

    ${
      hazards && hazards.length > 0
        ? `<div class="hazards-container">
            <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px;">Safety & Hazard Tags:</div>
            ${hazards.map((h) => `<span class="hazard-tag">${h}</span>`).join("")}
          </div>`
        : ""
    }

    <div class="footer">
      <span>Official Quality Control & Regulatory Archival Record</span>
      <span>R&D Formulator Laboratory Suite</span>
    </div>

    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 250);
      };
    </script>
  </body>
</html>`;

    try {
      const printWindow = window.open("", "_blank", "width=800,height=900");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
      } else {
        window.print();
      }
    } catch (e) {
      window.print();
    }
  };

  const handleAddManualDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tagsArray = newHazardsStr
      ? newHazardsStr.split(",").map((h) => h.trim()).filter(Boolean)
      : ["Manual Log ✅"];

    const newDoc: DocumentItem = {
      title: newTitle,
      type: newType,
      source: newSource || "R&D Internal Laboratory",
      link: newLink || "#",
      description: newDescription || "No detailed analysis entered.",
      hazards: tagsArray
    };

    setDocs([newDoc, ...docs]);
    setNewTitle("");
    setNewSource("");
    setNewLink("");
    setNewDescription("");
    setNewHazardsStr("");
    setShowAddForm(false);
    alert(`Success: "${newDoc.title}" registered.`);
  };

  // --- DOCUMENT TEMPLATE GENERATOR ---
  const [selectedTemplate, setSelectedTemplate] = useState("Product Specification");
  const [genForm, setGenForm] = useState<any>({
    productName: "EcoClean Ultra Liquid",
    batchId: "B-2026-94",
    effectiveDate: new Date().toISOString().split("T")[0],
    activeMatter: "15.5%",
    pHValue: "7.2",
    viscosity: "450 cPs",
    biodegradability: "82% (OECD 301D)",
    packagingSupplier: "Apex Polymers Ltd",
    tester: "Dr. Salim Bawa",
    generalNotes: "Sample conforms to IS 4955 household standards."
  });

  const handleGenerateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const docTitle = `${selectedTemplate} - ${genForm.productName} (#${genForm.batchId || "SPEC"})`;
    const compiledDesc = `TECHNICAL SPECIFICATION FILE:
Product Name: ${genForm.productName}
Batch Reference: ${genForm.batchId}
Effective / Testing Date: ${genForm.effectiveDate}

PHYSICO-CHEMICAL PARAMETERS:
- pH Value: ${genForm.pHValue}
- Total Active Matter %: ${genForm.activeMatter}
- Viscosity (Brookfield): ${genForm.viscosity}
- Biodegradability Index: ${genForm.biodegradability}
- Packaging Code: ${genForm.packagingSupplier}

COMPLIANCE & PROCESS NOTES:
${genForm.generalNotes}

Assayed & Authorized By: ${genForm.tester}
Lab Safety Clearance: PASSED`;

    const newDoc: DocumentItem = {
      title: docTitle,
      type: selectedTemplate === "Certificate of Analysis (COA)" ? "Certificate of Analysis (COA)" : "Regulatory Standard",
      source: "Generator Module (Internal)",
      link: "#",
      description: compiledDesc,
      hazards: ["System Generated 🖨️", `Tester: ${genForm.tester}`, "Verified ✅"]
    };

    setDocs([newDoc, ...docs]);
    alert(`Document successfully compiled and saved into the primary SDS/Documents Registry!\n\nDocument: "${docTitle}"`);
    setSubTab("sds");
  };

  // --- REGULATORY REFERENCE DATABASE SEARCH ---
  const [regSearch, setRegSearch] = useState("");
  const filteredRegs = REGULATORY_DB.filter(r => 
    r.standard.toLowerCase().includes(regSearch.toLowerCase()) || 
    r.desc.toLowerCase().includes(regSearch.toLowerCase()) ||
    r.body.toLowerCase().includes(regSearch.toLowerCase())
  );

  // --- PRODUCT REGISTRATION MANAGER ---
  const [newReg, setNewReg] = useState({
    productName: "", brandName: "", category: "Fabric Wash", code: "",
    country: "India", market: "Domestic", regNumber: "",
    approvalDate: "", expiryDate: "", authority: "", remarks: ""
  });

  const handleAddRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReg.productName || !newReg.regNumber) {
      alert("Please enter Product Name and actual Registration Number from actual documentation.");
      return;
    }
    const item = {
      id: "reg-" + Date.now(),
      ...newReg,
      status: newReg.expiryDate ? (new Date(newReg.expiryDate) < new Date() ? "Expired" : "Approved") : "Pending"
    };
    setRegistrations([...registrations, item]);
    
    // Add local renewal reminder if expiry date provided
    if (newReg.expiryDate) {
      const remDate = new Date(newReg.expiryDate);
      remDate.setMonth(remDate.getMonth() - 2); // 2 months before
      const reminderItem = {
        id: "rem-" + Date.now(),
        title: `Renewal reminder for ${item.productName} (Reg: ${item.regNumber})`,
        expiryDate: item.expiryDate,
        category: "Registration Renewal",
        notified: false
      };
      setReminders([reminderItem, ...reminders]);
    }

    setNewReg({
      productName: "", brandName: "", category: "Fabric Wash", code: "",
      country: "India", market: "Domestic", regNumber: "",
      approvalDate: "", expiryDate: "", authority: "", remarks: ""
    });
    alert("Product registration record added successfully.");
  };

  // --- LABEL DESIGN BUILDER ---
  const [labelDesign, setLabelDesign] = useState({
    layoutType: "Bottle Label",
    size: "100mm x 150mm",
    brand: "EcoShield Pro",
    productName: "High Foaming Detergent Liquid",
    netQty: "1000 ml",
    directions: "Pour 40ml in 10L water. Stir to produce foam. Soak clothes for 30 minutes, wash and rinse.",
    storage: "Store in cool dry place.",
    warning: "Keep away from children / बच्चों की पहुँच से दूर रखें",
    manufacturer: "Bawa Chemical Industries, Plot 49, MIDC",
    customerCare: "care@bawachemicals.com | +91 22 2345 6789",
    batchNum: "B-2026-V1",
    mfgDate: "2026-07-01",
    expDate: "2028-06-30",
    enteredEan: "8901234567890",
    useBarcodeType: "Code128", // Code128, QR, or Ean
    recyclingSymbol: "PETE (1)",
    website: "www.bawachemicals.com",
    labelLang: lang
  });

  // Simple determinisic pseudo barcode generator
  const getBarcodeSVG = (text: string) => {
    const bars: boolean[] = [];
    let seed = 0;
    for (let i = 0; i < text.length; i++) seed += text.charCodeAt(i);
    for (let i = 0; i < 46; i++) {
      const isBlack = ((seed + i) * 17) % 3 === 0 || ((seed + i) * 31) % 5 === 0;
      bars.push(isBlack);
    }
    return (
      <div className="flex flex-col items-center p-1.5 bg-white border border-gray-150 rounded shrink-0">
        <svg width="150" height="42" viewBox="0 0 100 50" preserveAspectRatio="none">
          <g>
            {bars.map((isBlack, idx) => (
              <rect key={idx} x={`${(idx / bars.length) * 100}%`} y="0" width={`${100 / bars.length}%`} height="100%" fill={isBlack ? "#000000" : "#ffffff"} />
            ))}
          </g>
        </svg>
        <span className="text-[9px] font-mono mt-1 tracking-wider text-gray-800 font-bold">{text}</span>
      </div>
    );
  };

  // Detergent QR Code grid generator
  const getQRCodeSVG = (text: string) => {
    const size = 14;
    const grid: boolean[] = [];
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const isMarker = (x < 3 && y < 3) || (x >= size - 3 && y < 3) || (x < 3 && y >= size - 3);
        if (isMarker) {
          grid.push(x === 0 || x === 2 || y === 0 || y === 2);
        } else {
          grid.push(Math.abs(Math.sin(hash + x * 7 + y * 13)) > 0.42);
        }
      }
    }
    return (
      <div className="flex flex-col items-center p-1.5 bg-white border border-gray-150 rounded shrink-0">
        <svg width="60" height="60" viewBox={`0 0 ${size} ${size}`}>
          {grid.map((isBlack, idx) => {
            const x = idx % size;
            const y = Math.floor(idx / size);
            return isBlack ? <rect key={idx} x={x} y={y} width="1" height="1" fill="#000000" /> : null;
          })}
        </svg>
        <span className="text-[8px] font-mono mt-0.5 text-gray-400">BATCH-QR</span>
      </div>
    );
  };

  // --- PACKAGING SPECS & OBSERVATIONS ---
  const [newPack, setNewPack] = useState({
    type: "Bottle", material: "HDPE", capacity: "", weight: "", dimensions: "",
    closureType: "", neckFinish: "", supplier: "", code: "", recyclability: "Grade 2 HDPE",
    verified: false
  });

  const handleAddPackaging = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPack.capacity || !newPack.supplier) {
      alert("Supplier and Capacity must be entered.");
      return;
    }
    const item = {
      id: "pack-" + Date.now(),
      ...newPack
    };
    setPackagingList([...packagingList, item]);
    setNewPack({
      type: "Bottle", material: "HDPE", capacity: "", weight: "", dimensions: "",
      closureType: "", neckFinish: "", supplier: "", code: "", recyclability: "Grade 2 HDPE",
      verified: false
    });
    alert("Packaging spec record logged.");
  };

  // Compatibility observation record
  const [newObs, setNewObs] = useState({
    packId: "", deformation: "No deformation observed", leakage: "No leakage observed",
    fragranceMigration: "No significant odor loss", colourStaining: "No staining detected",
    cracking: "No stress cracks observed", uvEffect: "No color change", notes: ""
  });

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObs.packId) {
      alert("Please select a target packaging specification.");
      return;
    }
    const targetPack = packagingList.find(p => p.id === newObs.packId);
    const item = {
      id: "comp-" + Date.now(),
      packId: newObs.packId,
      packName: targetPack ? `${targetPack.type} - ${targetPack.material} (${targetPack.capacity})` : "Unspecified",
      ...newObs,
      observedDate: new Date().toISOString().split("T")[0]
    };
    setCompatibilityLogs([item, ...compatibilityLogs]);
    setNewObs({
      packId: "", deformation: "No deformation observed", leakage: "No leakage observed",
      fragranceMigration: "No significant odor loss", colourStaining: "No staining detected",
      cracking: "No stress cracks observed", uvEffect: "No color change", notes: ""
    });
    alert("Compatibility physical observation registered.");
  };

  // --- CLAIMS & WARNINGS ---
  const [newClaim, setNewClaim] = useState({ claim: "", evidenceDocTitle: "None" });
  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaim.claim) return;
    setClaims([...claims, { id: "cl-" + Date.now(), ...newClaim }]);
    setNewClaim({ claim: "", evidenceDocTitle: "None" });
  };

  const [newWarning, setNewWarning] = useState("");
  const handleAddWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarning.trim()) return;
    setWarnings([...warnings, newWarning.trim()]);
    setNewWarning("");
  };

  // --- EXPORT & HS CODE REFERENCE ---
  const [exportChecklist, setExportChecklist] = useState<any[]>([
    { task: "Verify recipient country heavy metal limit standard", done: true },
    { task: "Generate MSDS/SDS in recipient country local languages", done: false },
    { task: "Obtain Customs Broker HS Classification verification receipt", done: true },
    { task: "Register batch formulation with Pollution Control Board", done: false }
  ]);

  const [invoice, setInvoice] = useState({
    exporter: "Bawa Chemical Industries, Mumbai",
    importer: "Gulf Clean Wholesale LLC, Dubai",
    hsCode: "3402.20.10", // Laundry Liquid
    productDesc: "EcoClean Ultra Premium Fabric Liquid Wash",
    netWeight: "14,500 Kg",
    grossWeight: "15,200 Kg",
    containerNum: "MSKU-948211-0",
    origin: "India",
    shippingMarks: "GULF-CLEAN / DXB / 1-1450"
  });

  // --- PRODUCT IMAGE LIBRARY ---
  const handleUploadImageMock = (category: any) => {
    const randomColours = ["#0f766e", "#0d9488", "#0891b2", "#10b981", "#16a34a", "#475569"];
    const pickCol = randomColours[Math.floor(Math.random() * randomColours.length)];
    const item = {
      id: "img-" + Date.now(),
      productName: "EcoClean Liquid Detergent",
      category,
      fileName: `uploaded_${category.toLowerCase()}_${Math.floor(Math.random() * 900) + 100}.jpg`,
      date: new Date().toISOString().split("T")[0],
      colour: pickCol
    };
    setProductImages([item, ...productImages]);
    alert(`File Mock Upload: Registered image file "${item.fileName}" for Category: ${category}`);
  };

  // --- REMINDERS REMOVAL ---
  const handleTriggerNotificationMock = (reminderTitle: string) => {
    alert(`LOCAL ON-DEVICE NOTIFICATION SIMULATION:\n-------------------------------------\n🔔 ALARM: ${reminderTitle}\nAction Due: Immediate attention required.\nApp status: Offline laboratory local timer fired!`);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#f8fafc]" id="regulatory-suite-root">
      
      {/* LEFT SUB-NAVBAR DRAWER */}
      <div className="w-full md:w-56 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between text-xs font-semibold text-slate-600">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-[9px] uppercase font-bold tracking-wider text-[#0f766e]">Regulatory Compliance</span>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1">🛡️ Safety & Auditing</h2>
        </div>
        
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible p-2 gap-1 flex-1 shrink-0 scrollbar-none">
          {[
            { id: "sds", label: "SDS & Documents", icon: Shield },
            { id: "generator", label: "Document Templates", icon: FileText },
            { id: "registration", label: "Registrations", icon: CheckCircle2 },
            { id: "regulatory", label: "Standards DB", icon: Search },
            { id: "label", label: "Label Designer", icon: Tag },
            { id: "packaging", label: "Packaging Specs", icon: Layers },
            { id: "claims", label: "Claims & Warnings", icon: Bookmark },
            { id: "export", label: "Export & HS Code", icon: Briefcase },
            { id: "images", label: "Image Library", icon: Image },
            { id: "reminders", label: "Notifications Hub", icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left whitespace-nowrap transition-all cursor-pointer ${
                  active ? "bg-teal-50 text-teal-800 font-bold border-l-4 border-teal-600" : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                <Icon size={14} className={active ? "text-teal-700" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT WORK AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* TAB 1: SAFETY SDS REGISTER (Preserving Original Feature) */}
        {subTab === "sds" && (
          <div className="flex-1 flex flex-col h-full animate-fade-in">
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f766e] flex items-center gap-1.5">📚 SDS & Documents Registry</h3>
                <p className="text-xs text-gray-500">Official MSDS files, COAs, Process verification reports, and calibrated laboratory logbooks.</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-[#0f766e] hover:bg-[#0d645c] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer animate-pulse"
              >
                <Plus size={14} />
                {showAddForm ? "Hide Form" : "Log / Add Document"}
              </button>
            </div>

            {/* Original additions form */}
            {showAddForm && (
              <div className="bg-teal-50/50 p-4 border-b border-teal-100 animate-slide-down shrink-0">
                <form onSubmit={handleAddManualDocument} className="max-w-2xl mx-auto space-y-3 bg-white p-4 rounded-xl border border-teal-100 shadow-sm text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#0f766e] tracking-wider block border-b pb-1">📥 Log New Regulatory Document</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Document Title</label>
                      <input
                        type="text" required placeholder="e.g. SDS - Pine Oil Concentrated" value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-slate-50 border rounded p-1.5 focus:border-[#0f766e] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Document Type</label>
                      <select
                        value={newType} onChange={(e) => setNewType(e.target.value)}
                        className="w-full bg-slate-50 border rounded p-1.5 text-xs font-semibold"
                      >
                        <option value="SDS / MSDS">SDS / MSDS Sheet</option>
                        <option value="TDS / Bulletin">Technical Bulletin</option>
                        <option value="Regulatory Standard">Regulatory Standard</option>
                        <option value="Eco Regulation">Eco Regulation</option>
                        <option value="Certificate of Analysis (COA)">Certificate of Analysis (COA)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Issuing Source</label>
                      <input
                        type="text" placeholder="e.g. QA Labs / Bureau of Indian Standards" value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                        className="w-full bg-slate-50 border rounded p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-0.5">Reference Link / Database Ref</label>
                      <input
                        type="text" placeholder="e.g. https://pubchem.ncbi.nlm.nih.gov" value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        className="w-full bg-slate-50 border rounded p-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-600 mb-0.5">Hazard & Quality Tags (comma-separated)</label>
                    <input
                      type="text" placeholder="e.g. Skin Irritant ⚠️, Approved ✅, Grade-A 🔬" value={newHazardsStr}
                      onChange={(e) => setNewHazardsStr(e.target.value)}
                      className="w-full bg-slate-50 border rounded p-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-600 mb-0.5">Description & Key Title Assays</label>
                    <textarea
                      rows={2} placeholder="titrations, flash points, exact active contents..." value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-slate-50 border rounded p-1.5 text-xs"
                    />
                  </div>

                  <button type="submit" className="w-full bg-[#0f766e] text-white py-1.5 rounded font-bold cursor-pointer">Commit Document to Lab Registry</button>
                </form>
              </div>
            )}

            {/* Search filters */}
            <div className="bg-slate-100 p-3 flex flex-col md:flex-row gap-3 border-b shrink-0 text-xs">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
                <input
                  type="text" placeholder="Search safety files, standards, calibration logs..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border focus:outline-none"
                />
              </div>
              <select
                value={docCategory} onChange={(e) => setDocCategory(e.target.value)}
                className="bg-white border rounded-lg px-3 py-2"
              >
                <option value="All">All Categories</option>
                <option value="SDS / MSDS">SDS / MSDS Sheets</option>
                <option value="TDS / Bulletin">Technical Bulletins</option>
                <option value="Regulatory Standard">Regulatory Standards</option>
                <option value="Eco Regulation">Eco Regulations</option>
                <option value="Certificate of Analysis (COA)">Certificate of Analysis (COA)</option>
              </select>
            </div>

            {/* Docs List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {filteredDocs.map((doc, idx) => (
                <div key={idx} className="bg-white rounded-xl border p-4 space-y-3 shadow-sm hover:border-teal-200 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] bg-teal-50 text-teal-800 font-bold border border-teal-100 px-2 py-0.5 rounded uppercase">{doc.type}</span>
                      <span className="text-[10px] text-gray-400 ml-2">{doc.source}</span>
                      <h4 className="text-sm font-bold text-gray-800 mt-1">{doc.title}</h4>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handlePrintDocument(doc.title, doc)} className="p-1.5 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer text-slate-600" title="Print document A4">
                        <Printer size={13} />
                      </button>
                      {doc.link && doc.link !== "#" && (
                        <a href={doc.link} target="_blank" rel="noreferrer" className="p-1.5 bg-teal-50 text-teal-700 rounded hover:bg-teal-100">
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 bg-slate-50 p-2.5 rounded border border-gray-100 whitespace-pre-line font-mono">{doc.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {doc.hazards.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENT TEMPLATE GENERATOR */}
        {subTab === "generator" && (
          <div className="p-4 space-y-4 animate-fade-in text-xs">
            <div className="bg-white p-4 rounded-xl border border-teal-100 space-y-1">
              <h3 className="text-sm font-bold text-[#0f766e]">✍️ Technical Document Generator</h3>
              <p className="text-slate-500">Fill in technical details derived from QC logs to instantly publish editable PDF-ready standards documents directly into your SDS registry.</p>
            </div>

            <form onSubmit={handleGenerateTemplate} className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Target Template</label>
                  <select
                    value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded p-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  >
                    {[
                      "Product Specification", "Technical Data Sheet (TDS)", "Certificate of Analysis (COA)",
                      "Batch Release Certificate", "Inspection Report", "Manufacturing Record",
                      "Packaging Specification", "Raw Material Specification", "Finished Product Specification",
                      "Cleaning Instruction Sheet"
                    ].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Product Name</label>
                  <input
                    type="text" required value={genForm.productName}
                    onChange={(e) => setGenForm({ ...genForm, productName: e.target.value })}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Batch / Reference ID</label>
                  <input
                    type="text" required value={genForm.batchId}
                    onChange={(e) => setGenForm({ ...genForm, batchId: e.target.value })}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Date</label>
                  <input
                    type="date" value={genForm.effectiveDate}
                    onChange={(e) => setGenForm({ ...genForm, effectiveDate: e.target.value })}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Active Matter %</label>
                  <input
                    type="text" value={genForm.activeMatter}
                    onChange={(e) => setGenForm({ ...genForm, activeMatter: e.target.value })}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">pH Assay Value</label>
                  <input
                    type="text" value={genForm.pHValue}
                    onChange={(e) => setGenForm({ ...genForm, pHValue: e.target.value })}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Viscosity (Brookfield)</label>
                  <input
                    type="text" value={genForm.viscosity}
                    onChange={(e) => setGenForm({ ...genForm, viscosity: e.target.value })}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Biodegradability Claim Status</label>
                  <input
                    type="text" value={genForm.biodegradability}
                    onChange={(e) => setGenForm({ ...genForm, biodegradability: e.target.value })}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Authorized Assay Scientist</label>
                  <input
                    type="text" value={genForm.tester}
                    onChange={(e) => setGenForm({ ...genForm, tester: e.target.value })}
                    className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Manufacturing & QC Titration Summary Remarks</label>
                <textarea
                  rows={3} value={genForm.generalNotes}
                  onChange={(e) => setGenForm({ ...genForm, generalNotes: e.target.value })}
                  className="w-full bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-gray-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg flex items-start gap-2 text-[11px] text-teal-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>Note: Generation requires actual measured data inputs from real laboratory logs. The system does not invent physical chemistry values.</span>
              </div>

              <button type="submit" className="w-full bg-[#0f766e] text-white py-2 rounded font-bold cursor-pointer text-xs flex items-center justify-center gap-1">
                <CheckCircle2 size={14} /> Generate & Save into SDS Documents Module
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: PRODUCT REGISTRATION MANAGER */}
        {subTab === "registration" && (
          <div className="p-4 space-y-4 animate-fade-in text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">📋 Official Product Registrations</h3>
                <p className="text-slate-500">Track registrations, license statuses, and country approvals. The app organizes entered registrations and sets local reminders.</p>
              </div>
              <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-lg p-2 flex items-start gap-1.5 text-[10px] max-w-sm">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>Regulatory Safety: Actual registration numbers must be entered. The platform never predicts approval or generates licenses.</span>
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {registrations.map((r) => (
                <div key={r.id} className="bg-white border rounded-xl p-4 space-y-3 relative overflow-hidden shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-slate-100 text-slate-800 border px-2 py-0.5 rounded font-mono font-bold uppercase">{r.category}</span>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{r.productName}</h4>
                      <p className="text-[10px] text-gray-400">Brand: {r.brandName} | Code: {r.code}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-orange-50 text-orange-700 border border-orange-100"
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] border-t pt-2 border-slate-100 font-mono">
                    <div>
                      <span className="text-[9px] text-gray-400 block font-sans">REGISTRATION NO</span>
                      <span className="font-bold text-slate-700">{r.regNumber}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block font-sans">MARKET / COUNTRY</span>
                      <span className="font-bold text-slate-700">{r.market} ({r.country})</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block font-sans">APPROVAL DATE</span>
                      <span className="font-bold text-slate-700">{r.approvalDate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block font-sans">EXPIRY DATE</span>
                      <span className="font-bold text-teal-700">{r.expiryDate}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-600">
                    <span className="font-bold block text-slate-700">Authority: {r.authority}</span>
                    {r.remarks}
                  </div>
                </div>
              ))}
            </div>

            {/* Add registration form */}
            <form onSubmit={handleAddRegistration} className="bg-white border rounded-xl p-4 space-y-3">
              <span className="font-bold text-[#0f766e] block border-b pb-1.5">📝 Log Official Product Registration Certificate</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-0.5">Product Name</label>
                  <input type="text" required placeholder="e.g. EcoClean Liquid Wash" value={newReg.productName} onChange={(e) => setNewReg({ ...newReg, productName: e.target.value })} className="w-full bg-slate-50 border rounded p-1.5" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-0.5">Brand Name</label>
                  <input type="text" placeholder="e.g. EcoShield" value={newReg.brandName} onChange={(e) => setNewReg({ ...newReg, brandName: e.target.value })} className="w-full bg-slate-50 border rounded p-1.5" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-0.5">Internal Code</label>
                  <input type="text" placeholder="e.g. LD-12" value={newReg.code} onChange={(e) => setNewReg({ ...newReg, code: e.target.value })} className="w-full bg-slate-50 border rounded p-1.5 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-0.5">Target Country</label>
                  <input type="text" value={newReg.country} onChange={(e) => setNewReg({ ...newReg, country: e.target.value })} className="w-full bg-slate-50 border rounded p-1.5" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-0.5">Registration Number</label>
                  <input type="text" required placeholder="e.g. IND-BIS-9942" value={newReg.regNumber} onChange={(e) => setNewReg({ ...newReg, regNumber: e.target.value })} className="w-full bg-slate-50 border rounded p-1.5 font-mono" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-0.5">Approval Date</label>
                  <input type="date" value={newReg.approvalDate} onChange={(e) => setNewReg({ ...newReg, approvalDate: e.target.value })} className="w-full bg-slate-50 border rounded p-1.5" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-0.5">Expiry Date</label>
                  <input type="date" value={newReg.expiryDate} onChange={(e) => setNewReg({ ...newReg, expiryDate: e.target.value })} className="w-full bg-slate-50 border rounded p-1.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-0.5">Licensing Authority</label>
                  <input type="text" placeholder="e.g. Bureau of Indian Standards" value={newReg.authority} onChange={(e) => setNewReg({ ...newReg, authority: e.target.value })} className="w-full bg-slate-50 border rounded p-1.5" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-0.5">Compliance Remarks</label>
                  <input type="text" placeholder="e.g. Heavy metals and active matter standards fully verified" value={newReg.remarks} onChange={(e) => setNewReg({ ...newReg, remarks: e.target.value })} className="w-full bg-slate-50 border rounded p-1.5" />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#0f766e] text-white py-1.5 rounded font-bold cursor-pointer">Register Document & Schedule Local Expiry Reminder</button>
            </form>
          </div>
        )}

        {/* TAB 4: REGULATORY DATABASE SEARCH */}
        {subTab === "regulatory" && (
          <div className="p-4 space-y-4 animate-fade-in text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">🔎 Searchable Standards Reference Database</h3>
              <p className="text-slate-500">Search global detergent standards. The database lists static official standards only. If not found, look up certified resources directly.</p>
              
              <div className="mt-3 relative">
                <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
                <input
                  type="text" placeholder="Type standard ID or body (e.g., BIS, ISO, OECD, IFRA)..." value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredRegs.map((r, idx) => (
                <div key={idx} className="bg-white rounded-xl border p-4 shadow-sm hover:border-teal-100 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm font-bold text-[#0f766e]">{r.standard}</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">{r.body}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2">{r.desc}</p>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">Applicable Scope: {r.scope}</span>
                </div>
              ))}

              {filteredRegs.length === 0 && (
                <div className="bg-red-50 text-red-800 border border-red-100 p-6 rounded-xl text-center space-y-2">
                  <AlertTriangle size={32} className="mx-auto text-red-500" />
                  <h4 className="font-bold text-sm">Reference Not Available — Consult Regulatory Professional</h4>
                  <p className="text-[11px] text-red-700 max-w-md mx-auto">This standard is not pre-verified in this workstation's local database. To maintain regulatory integrity, do not invent legal advice or citations. Contact your corporate compliance broker.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: LABEL DESIGN CENTER */}
        {subTab === "label" && (
          <div className="p-4 space-y-4 animate-fade-in text-xs">
            <div className="bg-white p-4 rounded-xl border border-teal-100 flex flex-col md:flex-row justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">🏷️ Dynamic Label Builder</h3>
                <p className="text-slate-500">Design commercial & industrial shipping labels. Pick template size, set barcode tags, write GHS warning texts, and print directly.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 text-[11px]">Print Preset Size:</span>
                <select
                  value={labelDesign.size} onChange={(e) => setLabelDesign({ ...labelDesign, size: e.target.value })}
                  className="bg-slate-50 border rounded px-2.5 py-1 text-slate-700 font-bold"
                >
                  <option value="100mm x 150mm">Standard Bottle Size</option>
                  <option value="80mm x 120mm">Medium Bottle Label</option>
                  <option value="A4 Portrait">Industrial Drum A4</option>
                  <option value="A5 Landscape">Bulk IBC Specification</option>
                  <option value="Thermal Label 50mm">Thermal Barcode Tag</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Form Controls */}
              <div className="lg:col-span-5 bg-white border rounded-xl p-4 space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block border-b pb-1.5">Design Elements Panel</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-500 text-[10px]">Brand Name</label>
                    <input type="text" value={labelDesign.brand} onChange={(e) => setLabelDesign({ ...labelDesign, brand: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 text-[10px]">Product Title</label>
                    <input type="text" value={labelDesign.productName} onChange={(e) => setLabelDesign({ ...labelDesign, productName: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-500 text-[10px]">Net Quantity</label>
                    <input type="text" value={labelDesign.netQty} onChange={(e) => setLabelDesign({ ...labelDesign, netQty: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 text-[10px]">Recycle Code Symbol</label>
                    <input type="text" value={labelDesign.recyclingSymbol} onChange={(e) => setLabelDesign({ ...labelDesign, recyclingSymbol: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="font-bold text-slate-500 text-[10px] font-sans">Batch Number</label>
                    <input type="text" value={labelDesign.batchNum} onChange={(e) => setLabelDesign({ ...labelDesign, batchNum: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 text-[10px] font-sans">MFG Date</label>
                    <input type="text" value={labelDesign.mfgDate} onChange={(e) => setLabelDesign({ ...labelDesign, mfgDate: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-500 text-[10px]">Warning statement (from GHS Library)</label>
                  <select
                    value={labelDesign.warning} onChange={(e) => setLabelDesign({ ...labelDesign, warning: e.target.value })}
                    className="w-full bg-slate-50 border rounded p-1 text-[11px]"
                  >
                    {warnings.map((w, idx) => <option key={idx} value={w}>{w}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-500 text-[10px]">Directions for Dilution & Use</label>
                  <textarea rows={2} value={labelDesign.directions} onChange={(e) => setLabelDesign({ ...labelDesign, directions: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-500 text-[10px]">Manufacturer Details</label>
                    <input type="text" value={labelDesign.manufacturer} onChange={(e) => setLabelDesign({ ...labelDesign, manufacturer: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 text-[10px]">Customer Care Helpline</label>
                    <input type="text" value={labelDesign.customerCare} onChange={(e) => setLabelDesign({ ...labelDesign, customerCare: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div className="border-t pt-2 space-y-2">
                  <span className="font-bold text-slate-600 block text-[10px]">Barcode / QR Code Selection</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold">Type to Render</label>
                      <select
                        value={labelDesign.useBarcodeType} onChange={(e) => setLabelDesign({ ...labelDesign, useBarcodeType: e.target.value })}
                        className="w-full bg-slate-50 border rounded p-1 font-bold text-slate-700"
                      >
                        <option value="Code128">Code128 (Internal Inventory)</option>
                        <option value="QR">QR Code (Batch Verification)</option>
                        <option value="EAN">EAN / UPC (Commercial)</option>
                      </select>
                    </div>
                    {labelDesign.useBarcodeType === "EAN" ? (
                      <div>
                        <label className="block text-[9px] text-gray-500 font-bold">Enter Registered GS1 EAN</label>
                        <input
                          type="text" placeholder="8901234567890" value={labelDesign.enteredEan}
                          onChange={(e) => setLabelDesign({ ...labelDesign, enteredEan: e.target.value })}
                          className="w-full bg-slate-50 border rounded p-1 font-mono font-bold"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[9px] text-gray-500 font-bold">Inventory Barcode Value</label>
                        <input
                          type="text" disabled value={labelDesign.batchNum}
                          className="w-full bg-gray-150 border rounded p-1 font-mono text-gray-500"
                        />
                      </div>
                    )}
                  </div>

                  {labelDesign.useBarcodeType === "EAN" && (
                    <div className="p-2 bg-amber-50 text-amber-900 rounded border border-amber-100 text-[10px] space-y-1">
                      <span className="font-bold block">GS1 Barcode Warning:</span>
                      <p>EAN/UPC numbers must be obtained through GS1 registration — enter your registered number, or use Code128/QR for internal use only.</p>
                    </div>
                  )}
                </div>

                <button
                  type="button" onClick={() => handlePrintDocument(`Label Design: ${labelDesign.brand} ${labelDesign.productName}`)}
                  className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-1.5 rounded flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer size={13} /> Print Label Design (Thermal/A4)
                </button>
              </div>

              {/* LIVE PREVIEW CANVAS */}
              <div className="lg:col-span-7 bg-slate-200 border rounded-xl p-4 flex flex-col items-center justify-center min-h-[400px]">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-2">Live Graphic Render ({labelDesign.size})</span>
                
                {/* Print Layout */}
                <div className="w-full max-w-md bg-white border-2 border-slate-900 p-6 rounded shadow-lg text-slate-800 font-sans space-y-4" style={{ minHeight: "350px" }}>
                  
                  {/* Front/Back Branding Panel */}
                  <div className="text-center space-y-1 border-b pb-3 border-dashed">
                    <span className="text-[9px] bg-slate-100 px-2.5 py-0.5 rounded font-mono uppercase tracking-widest font-bold">BATCH CERTIFIED COMPLIANT</span>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1 uppercase">{labelDesign.brand}</h1>
                    <h2 className="text-xs font-bold text-teal-800 italic">{labelDesign.productName}</h2>
                    <span className="text-xs font-bold font-mono text-slate-700 block">Net Volume: {labelDesign.netQty}</span>
                  </div>

                  {/* Body Directions */}
                  <div className="space-y-1 text-[11px] leading-relaxed">
                    <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wider">Directions for Use</span>
                    <p className="text-gray-700 bg-slate-50 p-2 rounded border border-slate-100">{labelDesign.directions}</p>
                  </div>

                  {/* Hazard Warning Text */}
                  <div className="bg-orange-50 border border-orange-200/50 p-2 rounded text-[10px] space-y-0.5 text-orange-950 font-medium">
                    <span className="font-bold text-[9px] uppercase tracking-wider block text-orange-800 flex items-center gap-1">
                      ⚠️ GHS Safety warning (SOP):
                    </span>
                    <p>{labelDesign.warning}</p>
                  </div>

                  {/* Manufacturing Logs */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] border-t pt-3 border-dashed">
                    <div className="space-y-1 leading-snug">
                      <p><span className="text-[9px] text-gray-400 block">MANUFACTURED BY</span><strong className="text-gray-800">{labelDesign.manufacturer}</strong></p>
                      <p><span className="text-[9px] text-gray-400 block">CUSTOMER SUPPORT</span><strong className="text-slate-600">{labelDesign.customerCare}</strong></p>
                    </div>

                    <div className="flex flex-col items-end space-y-1 font-mono text-right">
                      <p>Batch No: <strong className="font-sans font-bold text-slate-900">{labelDesign.batchNum}</strong></p>
                      <p>MFG Date: <strong>{labelDesign.mfgDate}</strong></p>
                      <p>Exp Date: <strong>{labelDesign.expDate}</strong></p>
                      <p>Recycle: <span className="bg-slate-100 px-1 rounded font-sans text-[9px] font-bold text-slate-600">{labelDesign.recyclingSymbol}</span></p>
                    </div>
                  </div>

                  {/* Codes */}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                    <div className="text-[9px] text-slate-400">
                      <p>Lab verification status: <strong>VERIFIED</strong></p>
                      <p className="font-mono">{labelDesign.website}</p>
                    </div>
                    {labelDesign.useBarcodeType === "QR" ? (
                      getQRCodeSVG(labelDesign.batchNum)
                    ) : (
                      getBarcodeSVG(labelDesign.useBarcodeType === "EAN" ? labelDesign.enteredEan : labelDesign.batchNum)
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: PACKAGING DB & OBSERVATIONS */}
        {subTab === "packaging" && (
          <div className="p-4 space-y-4 animate-fade-in text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">📦 Packaging Specifications & Long-Term Compatibility</h3>
              <p className="text-slate-500">Record bottle/drum spec dimensions, and log long-term laboratory physical observations of leakage or stress cracking. Do not predict unobserved outcomes.</p>
            </div>

            {/* Packaging Database List */}
            <div className="space-y-3">
              <span className="font-bold text-slate-700 block">Registered Container Specs</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {packagingList.map((p) => (
                  <div key={p.id} className="bg-white border rounded-xl p-4 space-y-2 relative shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold border font-mono uppercase text-[9px]">{p.type}</span>
                        <h4 className="text-sm font-bold text-slate-800 mt-1">{p.material} Container - {p.capacity}</h4>
                      </div>
                      {p.verified ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">Verified Spec ✅</span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded">Evidence Not Available ⚠️</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono border-t pt-2 border-slate-100">
                      <div>
                        <span className="text-[9px] text-gray-400 block font-sans">NECK FINISH</span>
                        <strong>{p.neckFinish}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block font-sans">WEIGHT</span>
                        <strong>{p.weight}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block font-sans">DIMENSIONS</span>
                        <strong>{p.dimensions}</strong>
                      </div>
                    </div>

                    <div className="text-[11px] bg-slate-50 p-2 rounded">
                      <p><strong>Supplier:</strong> {p.supplier} | <strong>Recycle code:</strong> {p.recyclability}</p>
                      <p className="font-mono text-[9px] text-gray-400">Spec Code: {p.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Log form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              <form onSubmit={handleAddPackaging} className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
                <span className="font-bold text-[#0f766e] block border-b pb-1">➕ Create New Packaging Specification</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Packaging Type</label>
                    <select
                      value={newPack.type} onChange={(e) => setNewPack({ ...newPack, type: e.target.value })}
                      className="w-full bg-slate-50 border rounded p-1"
                    >
                      {["Bottle", "Pouch", "Jar", "Bucket", "Can", "Drum", "IBC", "Bag", "Carton"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Material Component</label>
                    <input type="text" placeholder="e.g. HDPE, PET, PP" value={newPack.material} onChange={(e) => setNewPack({ ...newPack, material: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5 font-sans">Capacity</label>
                    <input type="text" placeholder="e.g. 5 Litres" value={newPack.capacity} onChange={(e) => setNewPack({ ...newPack, capacity: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5 font-sans">Weight (g)</label>
                    <input type="text" placeholder="e.g. 120g" value={newPack.weight} onChange={(e) => setNewPack({ ...newPack, weight: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5 font-sans">Neck Finish</label>
                    <input type="text" placeholder="e.g. 38/400" value={newPack.neckFinish} onChange={(e) => setNewPack({ ...newPack, neckFinish: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5 font-sans">Dimensions</label>
                    <input type="text" placeholder="e.g. 300mm x 150mm" value={newPack.dimensions} onChange={(e) => setNewPack({ ...newPack, dimensions: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5 font-sans">Internal Spec Code</label>
                    <input type="text" placeholder="e.g. HDPE-5L-R" value={newPack.code} onChange={(e) => setNewPack({ ...newPack, code: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Supplier Name</label>
                    <input type="text" placeholder="Supreme Poly" value={newPack.supplier} onChange={(e) => setNewPack({ ...newPack, supplier: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox" id="vcheck" checked={newPack.verified}
                      onChange={(e) => setNewPack({ ...newPack, verified: e.target.checked })}
                      className="rounded border"
                    />
                    <label htmlFor="vcheck" className="font-bold text-emerald-800">Verify Specs Certificate?</label>
                  </div>
                </div>

                <button type="submit" className="w-full bg-teal-800 text-white font-bold py-1.5 rounded cursor-pointer">Log Container Spec</button>
              </form>

              {/* Physical Observation Logging */}
              <form onSubmit={handleAddObservation} className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
                <span className="font-bold text-[#0f766e] block border-b pb-1">🔬 Log long-term Formulation Compatibility Observations</span>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Target Spec Container</label>
                  <select
                    value={newObs.packId} onChange={(e) => setNewObs({ ...newObs, packId: e.target.value })}
                    className="w-full bg-slate-50 border rounded p-1"
                  >
                    <option value="">-- Select Target Spec --</option>
                    {packagingList.map(p => <option key={p.id} value={p.id}>{p.material} ({p.capacity}) [{p.supplier}]</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Container Deformation (Panelling)</label>
                    <input type="text" value={newObs.deformation} onChange={(e) => setNewObs({ ...newObs, deformation: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Cap / Vent Leakage</label>
                    <input type="text" value={newObs.leakage} onChange={(e) => setNewObs({ ...newObs, leakage: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Fragrance/Perfume Migration</label>
                    <input type="text" value={newObs.fragranceMigration} onChange={(e) => setNewObs({ ...newObs, fragranceMigration: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Chemical Colour Staining</label>
                    <input type="text" value={newObs.colourStaining} onChange={(e) => setNewObs({ ...newObs, colourStaining: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Stress Cracking / Embrittlement</label>
                    <input type="text" value={newObs.cracking} onChange={(e) => setNewObs({ ...newObs, cracking: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">UV Sun Effect Observations</label>
                    <input type="text" value={newObs.uvEffect} onChange={(e) => setNewObs({ ...newObs, uvEffect: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Observed Test Stability Notes</label>
                  <input type="text" placeholder="temperature, chamber duration, titration limits..." value={newObs.notes} onChange={(e) => setNewObs({ ...newObs, notes: e.target.value })} className="w-full bg-slate-50 border rounded p-1" />
                </div>

                <button type="submit" className="w-full bg-teal-800 text-white font-bold py-1.5 rounded cursor-pointer">Commit Laboratory Observations</button>
              </form>

            </div>

            {/* Observations Log Table */}
            <div className="bg-white border rounded-xl p-4 space-y-2 shadow-sm">
              <span className="font-bold text-slate-700 block">Historic Stability Chamber Logs</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-slate-400 text-[10px] uppercase font-bold">
                      <th className="pb-1.5 font-sans">Pack Source</th>
                      <th className="pb-1.5 font-sans">Deformation</th>
                      <th className="pb-1.5 font-sans">Leakage</th>
                      <th className="pb-1.5 font-sans">Fragrance Loss</th>
                      <th className="pb-1.5 font-sans">Cracking</th>
                      <th className="pb-1.5 font-sans font-mono">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700 font-mono text-[11px]">
                    {compatibilityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2 text-slate-800 font-bold">{log.packName}</td>
                        <td className="py-2 text-orange-700">{log.deformation}</td>
                        <td className="py-2 text-orange-700">{log.leakage}</td>
                        <td className="py-2 text-slate-600">{log.fragranceMigration || log.fragranceLoss}</td>
                        <td className="py-2 text-red-700">{log.cracking}</td>
                        <td className="py-2 text-slate-400 font-sans">{log.observedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 7: CLAIMS & GHS WARNING TEXT LIBRARY */}
        {subTab === "claims" && (
          <div className="p-4 space-y-4 animate-fade-in text-xs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Claims Tracker */}
              <div className="bg-white border rounded-xl p-4 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">⚖️ Verified Claims Management</h3>
                  <p className="text-slate-500">Formulation claims (Biodegradable, Phosphate Free, Low Foam, etc.) require a linked lab COA, patent, or standard already saved in the SDS module.</p>
                </div>

                <div className="space-y-2">
                  {claims.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800 text-[11px] block">{c.claim}</span>
                        {c.evidenceDocTitle !== "None" ? (
                          <span className="text-[10px] text-teal-700 flex items-center gap-0.5 mt-0.5 font-mono">
                            <CheckCircle2 size={11} /> Evidence: {c.evidenceDocTitle}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.2 rounded font-bold inline-block mt-0.5">Evidence Pending ⚠️</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddClaim} className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-3">
                  <span className="font-bold block text-slate-600 text-[10px]">Verify New Product Claim</span>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] text-gray-500 font-bold block mb-0.5">Claim Text</label>
                      <input
                        type="text" required placeholder="e.g. 100% Phosphate Free Formulation" value={newClaim.claim}
                        onChange={(e) => setNewClaim({ ...newClaim, claim: e.target.value })}
                        className="w-full bg-white border rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 font-bold block mb-0.5">Select Document Evidence from SDS Module</label>
                      <select
                        value={newClaim.evidenceDocTitle} onChange={(e) => setNewClaim({ ...newClaim, evidenceDocTitle: e.target.value })}
                        className="w-full bg-white border rounded p-1.5"
                      >
                        <option value="None">None (Mark Evidence Pending)</option>
                        {docs.map((d, i) => <option key={i} value={d.title}>{d.title}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-teal-800 text-white font-bold py-1.5 rounded cursor-pointer">Verify & Save Claim</button>
                </form>
              </div>

              {/* Warnings Text Library */}
              <div className="bg-white border rounded-xl p-4 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">⚠️ Warnings & GHS Safety Text Library</h3>
                  <p className="text-slate-500">Manage standard precautionary statements for container labels. Edit or add regulatory sentences required by your local Pollution/Standards boards.</p>
                </div>

                <div className="space-y-1.5">
                  {warnings.map((w, idx) => (
                    <div key={idx} className="p-2 bg-amber-50 text-amber-950 rounded-lg border border-amber-100 flex justify-between items-center text-[11px] font-mono leading-relaxed">
                      <span>{w}</span>
                      <button onClick={() => setWarnings(warnings.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 cursor-pointer p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddWarning} className="flex gap-2">
                  <input
                    type="text" required placeholder="Add custom GHS statement..." value={newWarning}
                    onChange={(e) => setNewWarning(e.target.value)}
                    className="flex-1 bg-slate-50 border rounded p-1.5 text-xs font-semibold"
                  />
                  <button type="submit" className="bg-[#0f766e] text-white px-4 py-1.5 rounded font-bold cursor-pointer text-xs">Add</button>
                </form>

                <div className="p-2 bg-slate-100 text-slate-500 rounded border text-[10px] italic">
                  * Verify warning statements meet your country's mandatory legal packaging requirements.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 8: EXPORT & HS CODE REFERENCE */}
        {subTab === "export" && (
          <div className="p-4 space-y-4 animate-fade-in text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-slate-800">🚢 Export Documentation Hub & HS Codes</h3>
              <p className="text-slate-500 font-sans">Prepare export checklists, invoices, container shipping details, and Certificate of Origin drafts. Standardized HS Codes are read-only to avoid rejection.</p>
              
              <div className="p-3 bg-red-50 text-red-900 rounded-lg border border-red-100 text-[11px] leading-relaxed">
                <AlertTriangle size={15} className="inline mr-1 text-red-500" />
                <strong>HS Code Classification Warning:</strong> HS Code classification must be verified with your customs broker or freight forwarder before commercial shipping. Inaccurate codes trigger customs impounds.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Export Checklist */}
              <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
                <span className="font-bold text-slate-700 block">Required Global Export Checklist</span>
                <div className="space-y-2">
                  {exportChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded border">
                      <input
                        type="checkbox" checked={item.done}
                        onChange={(e) => {
                          const updated = [...exportChecklist];
                          updated[idx].done = e.target.checked;
                          setExportChecklist(updated);
                        }}
                        className="rounded"
                      />
                      <span className={`text-[11px] font-sans ${item.done ? "line-through text-gray-400" : "text-gray-700 font-semibold"}`}>{item.task}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercial Invoice / Certificate of Origin Generator */}
              <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm font-mono">
                <span className="font-bold font-sans text-slate-700 block">Certificate of Origin Draft</span>
                
                <div className="space-y-2 text-[11px] bg-slate-50 p-3 rounded border">
                  <p><strong>Exporter:</strong> {invoice.exporter}</p>
                  <p><strong>Importer:</strong> {invoice.importer}</p>
                  <p><strong>Country of Origin:</strong> {invoice.origin}</p>
                  <p><strong>Container / Seal Reference:</strong> {invoice.containerNum}</p>
                  <p><strong>Commodity description:</strong> {invoice.productDesc}</p>
                  <p><strong>Net Weight / Gross Weight:</strong> {invoice.netWeight} / {invoice.grossWeight}</p>
                  <p className="text-teal-800 font-bold"><strong>Verified HS Code:</strong> {invoice.hsCode}</p>
                  <p><strong>Shipping Marks:</strong> {invoice.shippingMarks}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-sans text-[10px] text-gray-500 font-bold block mb-0.5">Select Detergent HS Code (Static Table)</label>
                    <select
                      value={invoice.hsCode} onChange={(e) => setInvoice({ ...invoice, hsCode: e.target.value })}
                      className="w-full bg-slate-50 border rounded p-1 font-mono font-bold"
                    >
                      <option value="3402.20.10">3402.20.10 (Liquid Detergents)</option>
                      <option value="3402.20.20">3402.20.20 (Dishwash Liquids)</option>
                      <option value="3402.90.11">3402.90.11 (Industrial Soap)</option>
                      <option value="3401.20.00">3401.20.00 (Flakes/Granules)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-sans text-[10px] text-gray-500 font-bold block mb-0.5">Seal / Container Number</label>
                    <input
                      type="text" value={invoice.containerNum} onChange={(e) => setInvoice({ ...invoice, containerNum: e.target.value })}
                      className="w-full bg-slate-50 border rounded p-1 font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handlePrintDocument("Certificate of Origin - Batch Exporters Reference")}
                  className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-1 rounded font-sans text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer size={13} /> Print Origin & Customs Invoice
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 9: PRODUCT IMAGE LIBRARY */}
        {subTab === "images" && (
          <div className="p-4 space-y-4 animate-fade-in text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800">🖼️ Verified Product & Lab Photos</h3>
                <p className="text-slate-500">Store certified photos of raw materials, lab titrated solutions, production containers, or shipping labels. User uploads only.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleUploadImageMock("Product")} className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-1 px-3 rounded flex items-center gap-1 cursor-pointer">
                  <Plus size={13} /> Add Product Photo
                </button>
                <button onClick={() => handleUploadImageMock("Lab")} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1 px-3 rounded flex items-center gap-1 cursor-pointer">
                  <Plus size={13} /> Add Lab Setup
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {productImages.map((img) => (
                <div key={img.id} className="bg-white rounded-xl border overflow-hidden shadow-sm hover:border-teal-200 transition-all flex flex-col justify-between">
                  {/* Color box representing image preview */}
                  <div className="h-28 w-full flex items-center justify-center text-white" style={{ backgroundColor: img.colour }}>
                    <Image size={32} />
                  </div>
                  <div className="p-3 space-y-1 bg-white">
                    <span className="text-[9px] font-mono bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded uppercase">{img.category}</span>
                    <h5 className="font-bold text-slate-800 text-xs truncate" title={img.fileName}>{img.fileName}</h5>
                    <p className="text-[10px] text-slate-400 font-mono">{img.date}</p>
                    <button
                      onClick={() => setProductImages(productImages.filter(p => p.id !== img.id))}
                      className="text-red-500 hover:text-red-700 font-bold text-[10px] block mt-1 cursor-pointer"
                    >
                      Delete File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 10: REMINDERS HUB */}
        {subTab === "reminders" && (
          <div className="p-4 space-y-4 animate-fade-in text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">🔔 Reminders Hub & Calibration Alarms</h3>
              <p className="text-slate-500">Configure renewal alerts for BIS licenses, certificate expiries, or ISO safety audits. The scheduler runs offline-first using local hardware timers.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Reminders List */}
              <div className="lg:col-span-7 bg-white border rounded-xl p-4 space-y-3 shadow-sm">
                <span className="font-bold text-slate-700 block">Pending Renewal Actions</span>
                <div className="space-y-2">
                  {reminders.map((rem) => (
                    <div key={rem.id} className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 flex items-center justify-between gap-3 font-mono">
                      <div className="space-y-1 font-sans">
                        <span className="text-[9px] bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-bold font-mono uppercase">{rem.category}</span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">{rem.title}</h4>
                        <p className="text-[10px] text-amber-800 font-mono">Action Limit Expiry Date: {rem.expiryDate}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleTriggerNotificationMock(rem.title)} className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-1 px-2.5 rounded font-sans text-[10px] cursor-pointer">
                          Trigger Alarm
                        </button>
                        <button onClick={() => setReminders(reminders.filter(r => r.id !== rem.id))} className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Spool Center */}
              <div className="lg:col-span-5 bg-white border rounded-xl p-4 space-y-3 shadow-sm">
                <span className="font-bold text-slate-700 block">🖨️ Laboratory Print Center presets</span>
                <p className="text-[11px] text-gray-500">Submit compliance logs, labels, COAs, and raw batch specs directly to industrial hardware print sizes:</p>
                
                <div className="space-y-2">
                  <button onClick={() => handlePrintDocument("Active Container Bottle Label (100x150mm)")} className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border flex justify-between items-center cursor-pointer">
                    <span className="font-semibold text-slate-700">Thermal Label (100mm x 150mm)</span>
                    <Printer size={13} className="text-teal-700" />
                  </button>
                  <button onClick={() => handlePrintDocument("Certificate of Analysis (COA) Spec Sheet (A4)")} className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border flex justify-between items-center cursor-pointer">
                    <span className="font-semibold text-slate-700">A4 Specification Sheet</span>
                    <Printer size={13} className="text-teal-700" />
                  </button>
                  <button onClick={() => handlePrintDocument("Batch Release Inspection Report (A5)")} className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border flex justify-between items-center cursor-pointer">
                    <span className="font-semibold text-slate-700">A5 Inspection Summary Card</span>
                    <Printer size={13} className="text-teal-700" />
                  </button>
                  <button onClick={() => handlePrintDocument("Manufacturing SOP Release Code (Letter)")} className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border flex justify-between items-center cursor-pointer">
                    <span className="font-semibold text-slate-700">US Letter Size Release Form</span>
                    <Printer size={13} className="text-teal-700" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
