import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as xlsxMod from "xlsx";
const XLSX = xlsxMod.default || xlsxMod;

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");

const FILES = [
  { name: "Supplementary_SolutionFlowCurves.xlsx", expectedBytes: 22280, expectedMd5: "cd5bfd6e95fc65e412807d53935c2d96" },
  { name: "Supplementary_FilmThickness_v1.xlsx", expectedBytes: 149923, expectedMd5: "bc9582baafecd6552f6014216a0844e6" },
  { name: "Supplementary_BubbleSizes_v1.xlsx", expectedBytes: 557745, expectedMd5: "9fcfe68a37d2d92a7999569a07908854" },
  { name: "Supplementary_RheometerData_v2.xlsx", expectedBytes: 162970, expectedMd5: "c9b5a9cde073eb7c58933eec37a559a6" }
];

console.log("=== ROUND-7 CANONICAL LEDGER RECONCILIATION & STRICT ACCOUNTING ===");

const fileSummaries = [];
let grandTotalUsedRangeRows = 0;
let grandTotalHeaderRows = 0;
let grandTotalMetadataRows = 0;
let grandTotalBlankRows = 0;
let grandTotalNumericRows = 0;
let grandTotalNumericCells = 0;

for (const spec of FILES) {
  const filePath = path.join(TARGET_DIR, spec.name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`CRITICAL: Required source file missing: ${spec.name}`);
  }
  const buf = fs.readFileSync(filePath);
  const localBytes = buf.length;
  const computedMd5 = crypto.createHash("md5").update(buf).digest("hex");
  const sizeMatch = localBytes === spec.expectedBytes;
  const md5Match = computedMd5 === spec.expectedMd5;

  if (!sizeMatch || !md5Match) {
    throw new Error(`CRITICAL: Integrity check failed for ${spec.name}`);
  }

  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetMap = {};

  let fileUsedRangeRows = 0;
  let fileHeaderRows = 0;
  let fileMetadataRows = 0;
  let fileBlankRows = 0;
  let fileNumericRows = 0;
  let fileNumericCells = 0;

  for (const sname of wb.SheetNames) {
    const sheet = wb.Sheets[sname];
    if (!sheet["!ref"]) {
      throw new Error(`Sheet ${sname} in ${spec.name} missing !ref range`);
    }
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const usedRangeRows = range.e.r - range.s.r + 1;

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    let headerRows = 0;
    let metadataRows = 0;
    let blankRows = 0;
    let numericRows = 0;
    let numericCells = 0;

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0 || row.every(c => c === null || c === "" || c === undefined)) {
        blankRows++;
        continue;
      }
      const numCellsInRow = row.filter(c => typeof c === "number" && !isNaN(c)).length;
      numericCells += numCellsInRow;

      if (numCellsInRow === 0) {
        const firstCellStr = String(row[0] || "").toLowerCase();
        if (r === 0 || firstCellStr.includes("sample") || firstCellStr.includes("test") || firstCellStr.includes("shear") || firstCellStr.includes("radius") || firstCellStr.includes("time") || firstCellStr.includes("contents")) {
          headerRows++;
        } else {
          metadataRows++;
        }
      } else {
        numericRows++;
      }
    }

    const trailingBlanks = usedRangeRows - data.length;
    if (trailingBlanks > 0) {
      blankRows += trailingBlanks;
    }

    const accountedRows = headerRows + metadataRows + blankRows + numericRows;
    if (accountedRows !== usedRangeRows) {
      throw new Error(`FATAL ACCOUNTING DISCREPANCY in ${spec.name} -> ${sname}: usedRangeRows (${usedRangeRows}) !== accountedRows (${accountedRows}) [Header:${headerRows}, Meta:${metadataRows}, Blank:${blankRows}, Numeric:${numericRows}]`);
    }

    let independentNumericCells = 0;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[cellAddress];
        if (cell && typeof cell.v === "number" && !isNaN(cell.v)) {
          independentNumericCells++;
        }
      }
    }

    if (numericCells !== independentNumericCells) {
      throw new Error(`FATAL INDEPENDENT CELL COUNT MISMATCH in ${spec.name} -> ${sname}: row numericCells (${numericCells}) !== independent cell traversal numericCells (${independentNumericCells})`);
    }

    fileUsedRangeRows += usedRangeRows;
    fileHeaderRows += headerRows;
    fileMetadataRows += metadataRows;
    fileBlankRows += blankRows;
    fileNumericRows += numericRows;
    fileNumericCells += numericCells;

    sheetMap[sname] = {
      usedRange: sheet["!ref"],
      usedRangeRows,
      headerRows,
      metadataRows,
      blankRows,
      numericRows,
      numericCells,
      independentCheckNumericCells: independentNumericCells,
      physicalObservationStatus: "UNRESOLVED"
    };
  }

  grandTotalUsedRangeRows += fileUsedRangeRows;
  grandTotalHeaderRows += fileHeaderRows;
  grandTotalMetadataRows += fileMetadataRows;
  grandTotalBlankRows += fileBlankRows;
  grandTotalNumericRows += fileNumericRows;
  grandTotalNumericCells += fileNumericCells;

  fileSummaries.push({
    filename: spec.name,
    localBytes,
    sizeMatch,
    computedMd5,
    md5Match,
    localFileIntegrity: "VERIFIED",
    authoritativeProvenance: "NOT_INDEPENDENTLY_VERIFIED",
    sheets: sheetMap
  });
}

const verificationPayload = {
  timestamp: new Date().toISOString(),
  record: "18961871",
  doi: "10.5281/zenodo.18961871",
  governance: {
    phase4b: "ACTIVE",
    phase5: "LOCKED",
    provenanceStatus: "NOT_INDEPENDENTLY_VERIFIED",
    localIntegrityStatus: "VERIFIED"
  },
  totals: {
    usedRangeRows: grandTotalUsedRangeRows,
    headerRows: grandTotalHeaderRows,
    metadataRows: grandTotalMetadataRows,
    blankRows: grandTotalBlankRows,
    numericRows: grandTotalNumericRows,
    numericCells: grandTotalNumericCells,
    physicalObservationsStatus: "UNRESOLVED",
    unverifiedHistoricalClaims: {
      publishedAuthorSummaryTotal: 27982,
      note: "Unverified historical author-summary aggregate; not independently derived from row parsing."
    }
  },
  files: fileSummaries
};

const jsonPath = path.join(TARGET_DIR, "round5_integrity_verification.json");
fs.writeFileSync(jsonPath, JSON.stringify(verificationPayload, null, 2));

let csvLedger = "filename,sheet_name,used_range_rows,header_rows,metadata_rows,blank_rows,numeric_rows,numeric_cells,physical_observation_status\n";
const canonicalJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
for (const fileObj of canonicalJson.files) {
  for (const [sheetName, sheetData] of Object.entries(fileObj.sheets)) {
    const sd = sheetData;
    csvLedger += `"${fileObj.filename}","${sheetName}",${sd.usedRangeRows},${sd.headerRows},${sd.metadataRows},${sd.blankRows},${sd.numericRows},${sd.numericCells},"${sd.physicalObservationStatus}"\n`;
  }
}
fs.writeFileSync(path.join(TARGET_DIR, "round5_observation_ledger.csv"), csvLedger);

console.log("=== ROUND-7 CANONICAL LEDGER GENERATED SUCCESSFULLY ===");
console.log(`Used Range Rows: ${grandTotalUsedRangeRows}`);
console.log(`Numeric Rows: ${grandTotalNumericRows}`);
console.log(`Numeric Cells: ${grandTotalNumericCells}`);
console.log("======================================================");
