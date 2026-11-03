import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as xlsxMod from "xlsx";
import { classifyRow, RowType } from "../src/utils/classification.ts";

const XLSX = xlsxMod.default || xlsxMod;

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");
const REPORT_FILE = "PHASE4B_ROUND14_CLOSURE_REPORT.md";

const FILES = [
  { name: "Supplementary_SolutionFlowCurves.xlsx", expectedBytes: 22280, expectedMd5: "cd5bfd6e95fc65e412807d53935c2d96", expectedSha256: "90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590" },
  { name: "Supplementary_FilmThickness_v1.xlsx", expectedBytes: 149923, expectedMd5: "bc9582baafecd6552f6014216a0844e6", expectedSha256: "170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428" },
  { name: "Supplementary_BubbleSizes_v1.xlsx", expectedBytes: 557745, expectedMd5: "9fcfe68a37d2d92a7999569a07908854", expectedSha256: "9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad" },
  { name: "Supplementary_RheometerData_v2.xlsx", expectedBytes: 162970, expectedMd5: "c9b5a9cde073eb7c58933eec37a559a6", expectedSha256: "073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70" }
];

const integrityVerification = {
  timestamp: new Date().toISOString(),
  totals: { usedRangeRows: 0, headerRows: 0, metadataRows: 0, blankRows: 0, numericRows: 0, numericCells: 0, physicalObservationsStatus: "UNRESOLVED" },
  files: []
};

for (const spec of FILES) {
  const filePath = path.join(TARGET_DIR, spec.name);
  if (!fs.existsSync(filePath)) throw new Error(`CRITICAL: File missing: ${spec.name}`);
  const buf = fs.readFileSync(filePath);
  const md5 = crypto.createHash("md5").update(buf).digest("hex");
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  if (buf.length !== spec.expectedBytes || md5 !== spec.expectedMd5 || sha256 !== spec.expectedSha256) 
    throw new Error(`CRITICAL: Integrity check failed: ${spec.name}`);

  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetMap = {};
  for (const sname of wb.SheetNames) {
    const sheet = wb.Sheets[sname];
    if (!sheet["!ref"]) continue;
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const usedRangeRows = range.e.r - range.s.r + 1;
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    let hr = 0, mr = 0, br = 0, nr = 0, nc = 0;
    for (let r = 0; r < usedRangeRows; r++) {
      const type = classifyRow(data[r] || [], r, usedRangeRows);
      if (type === RowType.BLANK) br++;
      else if (type === RowType.HEADER) hr++;
      else if (type === RowType.METADATA) mr++;
      else if (type === RowType.NUMERIC_DATA) {
          nr++;
          nc += (data[r] || []).filter(c => typeof c === "number" && !isNaN(c)).length;
      }
    }
    sheetMap[sname] = { usedRangeRows, headerRows: hr, metadataRows: mr, blankRows: br, numericRows: nr, numericCells: nc, physicalObservationStatus: "UNRESOLVED" };
    integrityVerification.totals.usedRangeRows += usedRangeRows;
    integrityVerification.totals.headerRows += hr;
    integrityVerification.totals.metadataRows += mr;
    integrityVerification.totals.blankRows += br;
    integrityVerification.totals.numericRows += nr;
    integrityVerification.totals.numericCells += nc;
  }
  integrityVerification.files.push({ filename: spec.name, sheets: sheetMap });
}

fs.writeFileSync(path.join(TARGET_DIR, "round5_integrity_verification.json"), JSON.stringify(integrityVerification, null, 2));

// Generate Markdown and CSV...
console.log(`=== ROUND-14 RECONCILIATION COMPLETE ===`);
