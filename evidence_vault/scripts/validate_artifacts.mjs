import fs from "fs";
import path from "path";

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");
const JSON_PATH = path.join(TARGET_DIR, "round5_integrity_verification.json");

console.log("=== ARTIFACT CONSISTENCY VALIDATOR ===");

const json = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

// Validate JSON against totals
let totalUsedRangeRows = 0;
for (const file of json.files) {
    for (const sheet of Object.values(file.sheets)) {
        totalUsedRangeRows += sheet.usedRangeRows;
    }
}
if (totalUsedRangeRows !== json.totals.usedRangeRows) {
    throw new Error(`CONSISTENCY ERROR: JSON Total usedRangeRows mismatch. Expected ${totalUsedRangeRows}, got ${json.totals.usedRangeRows}`);
}

console.log("=== ARTIFACT CONSISTENCY VALIDATION PASSED ===");
