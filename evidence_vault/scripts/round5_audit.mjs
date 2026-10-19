import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as xlsxMod from "xlsx";
const XLSX = xlsxMod.default || xlsxMod;

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");

const FILES = [
  {
    name: "Supplementary_SolutionFlowCurves.xlsx",
    expectedMd5: "cd5bfd6e95fc65e412807d53935c2d96"
  },
  {
    name: "Supplementary_FilmThickness_v1.xlsx",
    expectedMd5: "bc9582baafecd6552f6014216a0844e6"
  },
  {
    name: "Supplementary_BubbleSizes_v1.xlsx",
    expectedMd5: "9fcfe68a37d2d92a7999569a07908854"
  },
  {
    name: "Supplementary_RheometerData_v2.xlsx",
    expectedMd5: "c9b5a9cde073eb7c58933eec37a559a6"
  }
];

console.log("=== STARTING ROUND-5 DETAILED OBSERVATION LEDGER AUDIT (PURE COMPUTED COUNTS) ===");

const integrityVerification = {
  timestamp: new Date().toISOString(),
  record: "18961871",
  files: []
};

for (const spec of FILES) {
  const filePath = path.join(TARGET_DIR, spec.name);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing file: ${filePath}`);
    continue;
  }
  const buf = fs.readFileSync(filePath);
  const localBytes = buf.length;
  const md5 = crypto.createHash("md5").update(buf).digest("hex");
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  const md5Match = md5 === spec.expectedMd5;

  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetDetails = {};

  for (const sname of wb.SheetNames) {
    const sheet = wb.Sheets[sname];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const totalRows = data.length;
    
    let headerRows = 0;
    let metadataRows = 0;
    let blankRows = 0;
    let computedValidObservations = 0;

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0 || row.every(c => c === null || c === "" || c === undefined)) {
        blankRows++;
        continue;
      }
      const numCells = row.filter(c => typeof c === "number" && !isNaN(c)).length;
      if (numCells === 0) {
        if (r < 3) {
          headerRows++;
        } else {
          metadataRows++;
        }
      } else {
        computedValidObservations++;
      }
    }

    sheetDetails[sname] = {
      totalRows,
      headerRows,
      metadataRows,
      blankRows,
      computedValidObservations
    };
  }

  integrityVerification.files.push({
    filename: spec.name,
    localBytes,
    computedMd5: md5,
    computedSha256: sha256,
    md5Match,
    sheets: sheetDetails
  });
}

fs.writeFileSync(path.join(TARGET_DIR, "round5_integrity_verification.json"), JSON.stringify(integrityVerification, null, 2));

console.log("=== ROUND-5 AUDIT WRITTEN (NO HARDCODED COMPUTED COUNTS) ===");
