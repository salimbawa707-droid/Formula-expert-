import { jsPDF } from "jspdf";
import { FormulationIngredient } from "../../types";

export interface PdfReportData {
  formulaName: string;
  productType: string;
  grade: string;
  targetCost: number;
  calculatedPH: number;
  activeMatterPct: number;
  hlbVal: number;
  viscosityVal: number;
  densityVal: number;
  ingredients: FormulationIngredient[];
  mixingInstructions?: string[];
}

export function generatePdfDiagnosticReport(data: PdfReportData) {
  const doc = new jsPDF();
  const now = new Date().toLocaleDateString();

  // Header Banner
  doc.setFillColor(14, 22, 41); // Dark navy
  doc.rect(0, 0, 210, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DETERGENT FORMULA EXPERT - R&D REPORT", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 195, 220);
  doc.text(`Formula Name: ${data.formulaName} | Category: ${data.productType} | Grade: ${data.grade}`, 14, 26);
  doc.text(`Generated Date: ${now}`, 140, 26);

  let y = 45;

  // Key Scientific Metrics Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("1. Scientific Physical & Chemical Diagnostics", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`• Calculated Equilibrium pH: ${data.calculatedPH.toFixed(2)}`, 18, y);
  doc.text(`• Total Active Matter: ${data.activeMatterPct.toFixed(1)}%`, 110, y);
  y += 6;

  doc.text(`• Blended Surfactant HLB: ${data.hlbVal.toFixed(1)}`, 18, y);
  doc.text(`• Predicted Viscosity: ${data.viscosityVal} cP`, 110, y);
  y += 6;

  doc.text(`• Mixture Density: ${data.densityVal.toFixed(3)} g/cm³`, 18, y);
  doc.text(`• Target Unit Cost: $${data.targetCost.toFixed(2)}/kg`, 110, y);
  y += 12;

  // Formulation Mass Balance Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2. Raw Material Mass Balance & Recipe", 14, y);
  y += 8;

  // Table Headers
  doc.setFillColor(240, 243, 250);
  doc.rect(14, y - 4, 182, 7, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Raw Material", 16, y);
  doc.text("Category", 85, y);
  doc.text("Formula %", 140, y);
  doc.text("Active %", 170, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  data.ingredients.forEach((ing) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const name = ing.name.length > 35 ? ing.name.substring(0, 32) + "..." : ing.name;
    const cat = (ing.category || ing.function || "Additive").substring(0, 22);
    const pct = Number(ing.percentage ?? ing.percent ?? 0).toFixed(2);
    const active = Number(ing.activePercent ?? 100).toFixed(0);

    doc.text(name, 16, y);
    doc.text(cat, 85, y);
    doc.text(`${pct}%`, 140, y);
    doc.text(`${active}%`, 170, y);
    y += 5.5;
  });

  y += 8;

  // Mixing Instructions
  if (data.mixingInstructions && data.mixingInstructions.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("3. Standard Manufacturing Sequence (SOP)", 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    data.mixingInstructions.forEach((step, idx) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${idx + 1}. ${step}`, 18, y);
      y += 6;
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Confidential - Detergent Formula Expert R&D System", 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 180, 287);
  }

  doc.save(`${data.formulaName.replace(/\s+/g, "_")}_Diagnostic_Report.pdf`);
}
