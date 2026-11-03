import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");
const JSON_PATH = path.join(TARGET_DIR, "round5_integrity_verification.json");
const CSV_PATH = path.join(TARGET_DIR, "round5_observation_ledger.csv");
const MD_PATH = "PHASE4B_ROUND13_CLOSURE_REPORT.md";

console.log("=== STRICT CROSS-ARTIFACT VALIDATOR V4 (FIXED) ===");

const json = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const csv = parse(fs.readFileSync(CSV_PATH, "utf8"), { columns: true, skip_empty_lines: true });
const md = fs.readFileSync(MD_PATH, "utf8");

// Parse Markdown Table
const mdLines = md.split('\n').filter(line => line.startsWith('|') && !line.includes('|---|'));
mdLines.shift(); // Remove header

for (const line of mdLines) {
    if (line.includes("**TOTAL**")) continue;
    const parts = line.split('|').map(p => p.trim()).filter(p => p !== "");
    const [filename, sname, urr, hr, mr, br, nr, nc, status] = parts;
    
    if (status === "**CORRUPTED**") continue;

    const file = json.files.find(f => f.filename === filename);
    const sheet = file?.sheets[sname];
    if (!sheet) throw new Error(`MD: Sheet mismatch for ${filename}/${sname}`);
    
    if (parseInt(urr) !== sheet.usedRangeRows) throw new Error(`MD Mismatch in ${filename}/${sname}: usedRangeRows`);
    if (parseInt(hr) !== sheet.headerRows) throw new Error(`MD Mismatch in ${filename}/${sname}: headerRows`);
    if (parseInt(mr) !== sheet.metadataRows) throw new Error(`MD Mismatch in ${filename}/${sname}: metadataRows`);
    if (parseInt(br) !== sheet.blankRows) throw new Error(`MD Mismatch in ${filename}/${sname}: blankRows`);
    if (parseInt(nr) !== sheet.numericRows) throw new Error(`MD Mismatch in ${filename}/${sname}: numericRows`);
    if (parseInt(nc) !== sheet.numericCells) throw new Error(`MD Mismatch in ${filename}/${sname}: numericCells`);
}

// Check CSV against JSON
for (const row of csv) {
    const file = json.files.find(f => f.filename === row.filename);
    if (!file) throw new Error(`CSV: Unknown filename ${row.filename}`);
    const sheet = file.sheets[row.sheet_name];
    if (!sheet) throw new Error(`CSV: Unknown sheet ${row.sheet_name} in ${row.filename}`);
    if (parseInt(row.used_range_rows) !== sheet.usedRangeRows) throw new Error(`CSV Mismatch in ${row.filename}/${row.sheet_name}: used_range_rows`);
}

console.log("=== ARTIFACT CONSISTENCY VALIDATION PASSED (JSON-CSV-MD) ===");
