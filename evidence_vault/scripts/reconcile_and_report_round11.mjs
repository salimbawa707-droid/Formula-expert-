import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as xlsxMod from "xlsx";
const XLSX = xlsxMod.default || xlsxMod;

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");
const REPORT_FILE = "PHASE4B_ROUND11_CLOSURE_REPORT.md";

const FILES = [
  { name: "Supplementary_SolutionFlowCurves.xlsx", expectedBytes: 22280, expectedMd5: "cd5bfd6e95fc65e412807d53935c2d96", expectedSha256: "90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590" },
  { name: "Supplementary_FilmThickness_v1.xlsx", expectedBytes: 149923, expectedMd5: "bc9582baafecd6552f6014216a0844e6", expectedSha256: "170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428" },
  { name: "Supplementary_BubbleSizes_v1.xlsx", expectedBytes: 557745, expectedMd5: "9fcfe68a37d2d92a7999569a07908854", expectedSha256: "9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad" },
  { name: "Supplementary_RheometerData_v2.xlsx", expectedBytes: 162970, expectedMd5: "c9b5a9cde073eb7c58933eec37a559a6", expectedSha256: "073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70" }
];

console.log("=== ROUND-11 CONSOLIDATED RECONCILIATION & REPORT GENERATION ===");

const integrityVerification = {
  timestamp: new Date().toISOString(),
  record: "18961871",
  doi: "10.5281/zenodo.18961871",
  governance: { phase4b: "ACTIVE", phase5: "LOCKED", provenanceStatus: "NOT_INDEPENDENTLY_VERIFIED", localIntegrityStatus: "VERIFIED" },
  totals: { usedRangeRows: 0, headerRows: 0, metadataRows: 0, blankRows: 0, numericRows: 0, numericCells: 0, physicalObservationsStatus: "UNRESOLVED" },
  files: []
};

for (const spec of FILES) {
  const filePath = path.join(TARGET_DIR, spec.name);
  if (!fs.existsSync(filePath)) throw new Error(`CRITICAL: Required source file missing: ${spec.name}`);
  const buf = fs.readFileSync(filePath);
  const computedMd5 = crypto.createHash("md5").update(buf).digest("hex");
  const computedSha256 = crypto.createHash("sha256").update(buf).digest("hex");
  if (buf.length !== spec.expectedBytes || computedMd5 !== spec.expectedMd5 || computedSha256 !== spec.expectedSha256) 
    throw new Error(`CRITICAL: Integrity check failed for ${spec.name}`);

  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetMap = {};
  for (const sname of wb.SheetNames) {
    const sheet = wb.Sheets[sname];
    if (!sheet["!ref"]) throw new Error(`Sheet ${sname} in ${spec.name} missing !ref range`);
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const usedRangeRows = range.e.r - range.s.r + 1;
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    let headerRows = 0, metadataRows = 0, blankRows = 0, numericRows = 0, numericCells = 0;
    for (let r = 0; r < usedRangeRows; r++) {
      const row = data[r] || [];
      const isBlank = row.every(c => c === null || c === "" || c === undefined);
      if (isBlank) { blankRows++; continue; }
      
      const numCells = row.filter(c => typeof c === "number" && !isNaN(c)).length;
      numericCells += numCells;
      if (numCells > 0) { numericRows++; continue; }

      const firstCellStr = String(row[0] || "").toLowerCase();
      if (r === 0 || /sample|test|shear|radius|time|contents/.test(firstCellStr)) headerRows++;
      else metadataRows++;
    }

    if (headerRows + metadataRows + blankRows + numericRows !== usedRangeRows) throw new Error(`FATAL ACCOUNTING DISCREPANCY in ${spec.name} -> ${sname}`);

    sheetMap[sname] = { usedRangeRows, headerRows, metadataRows, blankRows, numericRows, numericCells, physicalObservationStatus: "UNRESOLVED" };
    integrityVerification.totals.usedRangeRows += usedRangeRows;
    integrityVerification.totals.headerRows += headerRows;
    integrityVerification.totals.metadataRows += metadataRows;
    integrityVerification.totals.blankRows += blankRows;
    integrityVerification.totals.numericRows += numericRows;
    integrityVerification.totals.numericCells += numericCells;
  }
  integrityVerification.files.push({ filename: spec.name, sheets: sheetMap });
}

// 1. Write Canonical JSON
fs.writeFileSync(path.join(TARGET_DIR, "round5_integrity_verification.json"), JSON.stringify(integrityVerification, null, 2));

// 2. Generate CSV
let csv = "filename,sheet_name,used_range_rows,header_rows,metadata_rows,blank_rows,numeric_rows,numeric_cells,physical_observation_status\n";
for (const file of integrityVerification.files) {
  for (const [sname, s] of Object.entries(file.sheets)) {
    csv += `"${file.filename}","${sname}",${s.usedRangeRows},${s.headerRows},${s.metadataRows},${s.blankRows},${s.numericRows},${s.numericCells},"${s.physicalObservationStatus}"\n`;
  }
}
fs.writeFileSync(path.join(TARGET_DIR, "round5_observation_ledger.csv"), csv);

// 3. Generate Markdown
let md = `# PHASE 4B — ROUND-11 MASTER REMEDIATION & SCIENTIFIC AUDIT REPORT\n\n`;
md += `**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  \n`;
md += `**Governance Gate Status:** Phase 4B \`ACTIVE / OPEN\` | Phase 5 \`STRICTLY LOCKED\`  \n`;
md += `**Date:** ${integrityVerification.timestamp}\n\n`;
md += `## 1. Per-Worksheet Verification Ledger\n\n`;
md += `| Filename | Sheet Name | Used Range Rows | Header Rows | Metadata Rows | Blank Rows | Numeric Rows | Numeric Cells | Physical Observation Status |\n`;
md += `|---|---|---|---|---|---|---|---|---|\n`;
for (const file of integrityVerification.files) {
  for (const [sname, s] of Object.entries(file.sheets)) {
    md += `| ${file.filename} | ${sname} | ${s.usedRangeRows} | ${s.headerRows} | ${s.metadataRows} | ${s.blankRows} | ${s.numericRows} | ${s.numericCells} | ${s.physicalObservationStatus} |\n`;
  }
}
fs.writeFileSync(REPORT_FILE, md);

console.log(`=== ROUND-11 CANONICAL ARTIFACTS GENERATED: ${REPORT_FILE} ===`);
