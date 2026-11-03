import fs from "fs";
import path from "path";

const INPUT_JSON = "data/evidence/zenodo_18961871/round5_integrity_verification.json";
const OUTPUT_MD = "PHASE4B_ROUND9_CLOSURE_REPORT.md";

const data = JSON.parse(fs.readFileSync(INPUT_JSON, "utf8"));

let markdown = `# PHASE 4B — ROUND-9 MASTER REMEDIATION & SCIENTIFIC AUDIT REPORT\n\n`;
markdown += `**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  \n`;
markdown += `**Governance Gate Status:** Phase 4B \`ACTIVE / OPEN\` | Phase 5 \`STRICTLY LOCKED\`  \n`;
markdown += `**Date:** ${new Date().toISOString()}\n\n`;

markdown += `## 1. Per-Worksheet Verification Ledger (Canonical JSON Source)\n\n`;
markdown += `| Filename | Sheet Name | Used Range Rows | Header Rows | Metadata Rows | Blank Rows | Numeric Rows | Numeric Cells | Physical Observation Status |\n`;
markdown += `|---|---|---|---|---|---|---|---|---|\n`;

for (const file of data.files) {
  for (const [sname, sheet] of Object.entries(file.sheets)) {
    const s = sheet;
    markdown += `| ${file.filename} | ${sname} | ${s.usedRangeRows} | ${s.headerRows} | ${s.metadataRows} | ${s.blankRows} | ${s.numericRows} | ${s.numericCells} | ${s.physicalObservationStatus} |\n`;
  }
}

markdown += `\n## 2. Governance Status & Acceptance Criteria\n\n`;
markdown += `- **Phase 4B Governance Status:** ${data.governance.phase4b}\n`;
markdown += `- **Phase 5 Governance Status:** ${data.governance.phase5}\n`;
markdown += `- **Authoritative Provenance Status:** ${data.governance.provenanceStatus}\n`;
markdown += `- **Local Integrity Status:** ${data.governance.localIntegrityStatus}\n\n`;

markdown += `## 3. Totals\n\n`;
markdown += `- Used Range Rows: ${data.totals.usedRangeRows}\n`;
markdown += `- Numeric Rows: ${data.totals.numericRows}\n`;
markdown += `- Numeric Cells: ${data.totals.numericCells}\n\n`;

fs.writeFileSync(OUTPUT_MD, markdown);
console.log("=== ROUND-9 MARKDOWN REPORT GENERATED ===");
