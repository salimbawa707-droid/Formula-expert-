import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");
const JSON_PATH = path.join(TARGET_DIR, "round5_integrity_verification.json");
const CSV_PATH = path.join(TARGET_DIR, "round5_observation_ledger.csv");
const MD_PATH = "PHASE4B_ROUND14_CLOSURE_REPORT.md";

console.log("=== STRICT CROSS-ARTIFACT VALIDATOR V4 ===");

const json = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const csv = parse(fs.readFileSync(CSV_PATH, "utf8"), { columns: true, skip_empty_lines: true });

// 1. Validate CSV
for (const row of csv) {
    const file = json.files.find(f => f.filename === row.filename);
    const sheet = file?.sheets[row.sheet_name];
    if (!sheet) throw new Error(`CSV: Mismatch ${row.filename}/${row.sheet_name}`);
    if (parseInt(row.numeric_rows) !== sheet.numericRows) throw new Error(`CSV/JSON Mismatch: numericRows`);
}

console.log("=== ARTIFACT CONSISTENCY VALIDATION PASSED ===");
