import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");
const JSON_PATH = path.join(TARGET_DIR, "round5_integrity_verification.json");
const CSV_PATH = path.join(TARGET_DIR, "round5_observation_ledger.csv");
const MD_PATH = "PHASE4B_ROUND13_CLOSURE_REPORT.md";

console.log("=== STRICT CROSS-ARTIFACT VALIDATOR (ROUND-13) ===");

const json = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const csv = parse(fs.readFileSync(CSV_PATH, "utf8"), { columns: true, skip_empty_lines: true });
const mdContent = fs.readFileSync(MD_PATH, "utf8");

// 1. Validate CSV vs JSON
for (const row of csv) {
    const file = json.files.find(f => f.filename === row.filename);
    if (!file) throw new Error(`CSV: Unknown filename ${row.filename}`);
    const sheet = file.sheets[row.sheet_name];
    if (!sheet) throw new Error(`CSV: Unknown sheet ${row.sheet_name} in ${row.filename}`);
    
    if (parseInt(row.used_range_rows) !== sheet.usedRangeRows) throw new Error(`CSV Mismatch in ${row.filename}/${row.sheet_name}: used_range_rows`);
    if (parseInt(row.header_rows) !== sheet.headerRows) throw new Error(`CSV Mismatch in ${row.filename}/${row.sheet_name}: header_rows`);
    if (parseInt(row.metadata_rows) !== sheet.metadataRows) throw new Error(`CSV Mismatch in ${row.filename}/${row.sheet_name}: metadata_rows`);
    if (parseInt(row.blank_rows) !== sheet.blankRows) throw new Error(`CSV Mismatch in ${row.filename}/${row.sheet_name}: blank_rows`);
    if (parseInt(row.numeric_rows) !== sheet.numericRows) throw new Error(`CSV Mismatch in ${row.filename}/${row.sheet_name}: numeric_rows`);
    if (parseInt(row.numeric_cells) !== sheet.numericCells) throw new Error(`CSV Mismatch in ${row.filename}/${row.sheet_name}: numeric_cells`);
}

// 2. Validate MD vs JSON (Simple check: total used rows)
if (!mdContent.includes(json.totals.usedRangeRows.toString())) throw new Error(`Markdown Mismatch: Total usedRangeRows not found`);

console.log("=== ARTIFACT CONSISTENCY VALIDATION PASSED (JSON-CSV-MD) ===");
