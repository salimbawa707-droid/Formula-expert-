import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as xlsxMod from "xlsx";
const XLSX = xlsxMod.default || xlsxMod;

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");

const WORKBOOK_SPECS = [
  {
    filename: "Supplementary_SolutionFlowCurves.xlsx",
    expectedMd5: "cd5bfd6e95fc65e412807d53935c2d96",
    expectedSize: 22280,
    targetEngine: "ENG-003",
    description: "Rotational steady-shear flow curves of detergent solutions and DI water controls"
  },
  {
    filename: "Supplementary_FilmThickness_v1.xlsx",
    expectedMd5: "bc9582baafecd6552f6014216a0844e6",
    expectedSize: 149923,
    targetEngine: "ENG-005",
    description: "Inter-bubble fluid film thickness (lamella width) measurements for Foams A-D"
  },
  {
    filename: "Supplementary_BubbleSizes_v1.xlsx",
    expectedMd5: "9fcfe68a37d2d92a7999569a07908854",
    expectedSize: 557745,
    targetEngine: "ENG-005",
    description: "Bubble area and radius distributions at 20 min and 30 min aging times"
  },
  {
    filename: "Supplementary_RheometerData_v2.xlsx",
    expectedMd5: "c9b5a9cde073eb7c58933eec37a559a6",
    expectedSize: 162970,
    targetEngine: "ENG-003 & ENG-005",
    description: "Oscillatory amplitude and frequency sweeps, steady yield, and continuous shear at 1/s and 5/s"
  }
];

function getFileHashes(filePath) {
  const buf = fs.readFileSync(filePath);
  return {
    byteSize: buf.length,
    md5: crypto.createHash("md5").update(buf).digest("hex"),
    sha256: crypto.createHash("sha256").update(buf).digest("hex")
  };
}

function inspectSolutionFlowCurves(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets["SolutionFlowCurves"];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const headers = rows[0];
  const units = rows[1];
  
  let currentSample = null;
  const samples = {};
  let totalDataPoints = 0;
  let missingCells = 0;

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    if (row[0]) currentSample = row[0];
    if (!samples[currentSample]) {
      samples[currentSample] = [];
    }
    const pt = {
      point: row[1],
      time_s: row[2],
      shearRate_s1: row[3],
      shearStress_Pa: row[4],
      viscosity_Pas: row[5],
      torque_Nm: row[6],
      temp_C: row[7]
    };
    for (let c = 1; c <= 7; c++) {
      if (row[c] === null || row[c] === undefined || row[c] === "") missingCells++;
    }
    samples[currentSample].push(pt);
    totalDataPoints++;
  }

  const sampleSummaries = {};
  for (const [sName, pts] of Object.entries(samples)) {
    const sRates = pts.map(p => p.shearRate_s1).filter(v => typeof v === "number");
    const sStress = pts.map(p => p.shearStress_Pa).filter(v => typeof v === "number");
    const sVisc = pts.map(p => p.viscosity_Pas).filter(v => typeof v === "number");
    const sTemp = pts.map(p => p.temp_C).filter(v => typeof v === "number");
    sampleSummaries[sName] = {
      nPoints: pts.length,
      shearRateRange_s1: [Math.min(...sRates), Math.max(...sRates)],
      shearStressRange_Pa: [Math.min(...sStress), Math.max(...sStress)],
      viscosityRange_mPas: [Math.min(...sVisc) * 1000, Math.max(...sVisc) * 1000],
      tempRange_C: [Math.min(...sTemp), Math.max(...sTemp)]
    };
  }

  return {
    sheetName: "SolutionFlowCurves",
    cellRange: sheet["!ref"],
    totalRows: rows.length,
    dataRowCount: totalDataPoints,
    missingCells,
    headers,
    units,
    sampleCount: Object.keys(samples).length,
    waterControlReplicates: ["Water_1", "Water_2", "Water_3"],
    detergentReplicates: Object.keys(samples).filter(k => !k.startsWith("Water")),
    sampleSummaries
  };
}

function inspectFilmThickness(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets["Data"];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Calibration scale from sheet
  // Row 9: 1095 px = 1 mm = 1000 um -> 0.913242 um/px
  const scale_px_per_mm = 1095;
  const um_per_px = 1000 / scale_px_per_mm;

  const dataCols = {
    A: { count: 0, raw_px: [], um: [] },
    B: { count: 0, raw_px: [], um: [] },
    C: { count: 0, raw_px: [], um: [] },
    D: { count: 0, raw_px: [], um: [] }
  };

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    if (typeof row[2] === "number") {
      dataCols.A.count++;
      dataCols.A.raw_px.push(row[2]);
      dataCols.A.um.push(row[2] * um_per_px);
    }
    if (typeof row[5] === "number") {
      dataCols.B.count++;
      dataCols.B.raw_px.push(row[5]);
      dataCols.B.um.push(row[5] * um_per_px);
    }
    if (typeof row[8] === "number") {
      dataCols.C.count++;
      dataCols.C.raw_px.push(row[8]);
      dataCols.C.um.push(row[8] * um_per_px);
    }
    if (typeof row[11] === "number") {
      dataCols.D.count++;
      dataCols.D.raw_px.push(row[11]);
      dataCols.D.um.push(row[11] * um_per_px);
    }
  }

  const foamStats = {};
  let totalObservations = 0;
  for (const [f, obj] of Object.entries(dataCols)) {
    obj.um.sort((a,b) => a-b);
    const n = obj.um.length;
    totalObservations += n;
    const min = obj.um[0];
    const max = obj.um[n - 1];
    const mean = obj.um.reduce((s,x) => s+x, 0) / n;
    const median = obj.um[Math.floor(n / 2)];
    const sd = Math.sqrt(obj.um.reduce((s,x) => s + Math.pow(x - mean, 2), 0) / (n - 1));
    const q25 = obj.um[Math.floor(n * 0.25)];
    const q75 = obj.um[Math.floor(n * 0.75)];
    const iqr = q75 - q25;
    foamStats[`Foam_${f}`] = {
      measurementCount: n,
      min_um: min,
      max_um: max,
      mean_um: mean,
      median_um: median,
      sd_um: sd,
      iqr_um: iqr
    };
  }

  return {
    sheetName: "Data",
    cellRange: sheet["!ref"],
    totalRows: rows.length,
    scale: { scale_px_per_mm, um_per_px },
    totalMeasurements: totalObservations,
    foamStats
  };
}

function inspectBubbleSizes(filePath) {
  const wb = XLSX.readFile(filePath);
  const result = {};

  for (const sheetName of ["20min", "30min"]) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const foamRadii = { A: [], B: [], C: [], D: [] };

    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      if (typeof row[4] === "number") foamRadii.A.push(row[4]);
      if (typeof row[5] === "number") foamRadii.B.push(row[5]);
      if (typeof row[6] === "number") foamRadii.C.push(row[6]);
      if (typeof row[7] === "number") foamRadii.D.push(row[7]);
    }

    const sheetStats = {};
    let sheetTotal = 0;

    for (const [foam, radii] of Object.entries(foamRadii)) {
      radii.sort((a,b) => a-b);
      const n = radii.length;
      sheetTotal += n;
      const min_radius_um = radii[0] * 1000;
      const max_radius_um = radii[n - 1] * 1000;
      const mean_radius_um = (radii.reduce((s,x) => s+x, 0) / n) * 1000;
      const median_radius_um = radii[Math.floor(n / 2)] * 1000;
      const d10_diameter_um = radii[Math.floor(n * 0.1)] * 2000;
      const d50_diameter_um = radii[Math.floor(n * 0.5)] * 2000;
      const d90_diameter_um = radii[Math.floor(n * 0.9)] * 2000;
      const sumR3 = radii.reduce((s, r) => s + Math.pow(r, 3), 0);
      const sumR2 = radii.reduce((s, r) => s + Math.pow(r, 2), 0);
      const d32_sauter_diameter_um = 2 * (sumR3 / sumR2) * 1000;

      sheetStats[`Foam_${foam}`] = {
        bubbleCount: n,
        min_radius_um,
        max_radius_um,
        mean_radius_um,
        median_radius_um,
        d10_diameter_um,
        d50_diameter_um,
        d90_diameter_um,
        d32_sauter_diameter_um
      };
    }

    result[sheetName] = {
      cellRange: sheet["!ref"],
      totalRows: rows.length,
      totalBubbles: sheetTotal,
      foamStats: sheetStats
    };
  }

  result.grandTotalBubbles = result["20min"].totalBubbles + result["30min"].totalBubbles;
  return result;
}

function inspectRheometerData(filePath) {
  const wb = XLSX.readFile(filePath);
  const result = {
    sheetNames: wb.SheetNames,
    sheets: {}
  };

  // AmpSwps_all
  const ampSheet = wb.Sheets["AmpSwps_all"];
  const ampRows = XLSX.utils.sheet_to_json(ampSheet, { header: 1 });
  let currentTest = null;
  const ampTests = {};
  for (let r = 2; r < ampRows.length; r++) {
    const row = ampRows[r];
    if (row[0]) currentTest = row[0];
    if (!ampTests[currentTest]) ampTests[currentTest] = [];
    ampTests[currentTest].push({
      strain: row[4],
      stress_Pa: row[6],
      phaseShift_deg: row[7],
      gPrime_Pa: row[8],
      gDoublePrime_Pa: row[9]
    });
  }

  const ampSummaries = {};
  for (const [t, pts] of Object.entries(ampTests)) {
    const g0 = (pts[0].gPrime_Pa + pts[1].gPrime_Pa + pts[2].gPrime_Pa) / 3;
    let yieldStress_Pa = null;
    let yieldStrain = null;
    for (const p of pts) {
      if (p.gPrime_Pa < p.gDoublePrime_Pa && !yieldStress_Pa) {
        yieldStress_Pa = p.stress_Pa;
        yieldStrain = p.strain;
      }
    }
    ampSummaries[t] = {
      nPoints: pts.length,
      plateauG0_Pa: g0,
      yieldStress_Pa,
      yieldStrain
    };
  }

  result.sheets["AmpSwps_all"] = {
    cellRange: ampSheet["!ref"],
    totalRows: ampRows.length,
    testCount: Object.keys(ampTests).length,
    ampSummaries
  };

  // SteadyShear_5
  const ss5Sheet = wb.Sheets["SteadyShear_5"];
  const ss5Rows = XLSX.utils.sheet_to_json(ss5Sheet, { header: 1 });
  result.sheets["SteadyShear_5"] = {
    cellRange: ss5Sheet["!ref"],
    totalRows: ss5Rows.length,
    shearRate_s1: 5.0,
    pointCount: ss5Rows.length - 2
  };

  // SteadyShear_1
  const ss1Sheet = wb.Sheets["SteadyShear_1"];
  const ss1Rows = XLSX.utils.sheet_to_json(ss1Sheet, { header: 1 });
  result.sheets["SteadyShear_1"] = {
    cellRange: ss1Sheet["!ref"],
    totalRows: ss1Rows.length,
    shearRate_s1: 1.0,
    pointCount: ss1Rows.length - 2
  };

  // FoamA_SteadyYield
  const yieldSheet = wb.Sheets["FoamA_SteadyYield"];
  const yieldRows = XLSX.utils.sheet_to_json(yieldSheet, { header: 1 });
  result.sheets["FoamA_SteadyYield"] = {
    cellRange: yieldSheet["!ref"],
    totalRows: yieldRows.length,
    pointCount: yieldRows.length - 2
  };

  return result;
}

async function runInspection() {
  console.log("Starting full numerical inspection of Zenodo 18961871 dataset...");

  const inspectionReport = {
    inspectionTimestamp: new Date().toISOString(),
    zenodoRecord: {
      recordId: "18961871",
      doi: "10.5281/zenodo.18961871",
      title: "Rheometer methods for characterising and comparing foams: an example using household detergents [dataset]",
      authors: ["Ceri Allgood", "Thomas Jones"],
      institution: "Lancaster University",
      license: "CC-BY-4.0",
      primaryCitation: "Rheologica Acta (2026), DOI: 10.1007/s00397-026-XXXX"
    },
    workbooks: {}
  };

  for (const spec of WORKBOOK_SPECS) {
    const filePath = path.join(TARGET_DIR, spec.filename);
    console.log(`Inspecting ${spec.filename}...`);
    const hashes = getFileHashes(filePath);
    
    let details = {};
    if (spec.filename === "Supplementary_SolutionFlowCurves.xlsx") {
      details = inspectSolutionFlowCurves(filePath);
    } else if (spec.filename === "Supplementary_FilmThickness_v1.xlsx") {
      details = inspectFilmThickness(filePath);
    } else if (spec.filename === "Supplementary_BubbleSizes_v1.xlsx") {
      details = inspectBubbleSizes(filePath);
    } else if (spec.filename === "Supplementary_RheometerData_v2.xlsx") {
      details = inspectRheometerData(filePath);
    }

    inspectionReport.workbooks[spec.filename] = {
      spec,
      hashes,
      details
    };
  }

  const outPath = path.join(TARGET_DIR, "zenodo_18961871_inspection_stats.json");
  fs.writeFileSync(outPath, JSON.stringify(inspectionReport, null, 2), "utf8");
  console.log(`Inspection complete. Written to ${outPath}`);
}

runInspection().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
