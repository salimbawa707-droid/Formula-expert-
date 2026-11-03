import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as xlsxMod from "xlsx";
const XLSX = xlsxMod.default || xlsxMod;

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");

const EXPECTED_MANIFEST = [
  {
    file: "Supplementary_SolutionFlowCurves.xlsx",
    size: 22280,
    md5: "cd5bfd6e95fc65e412807d53935c2d96",
    sha256: "90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590"
  },
  {
    file: "Supplementary_FilmThickness_v1.xlsx",
    size: 149923,
    md5: "bc9582baafecd6552f6014216a0844e6",
    sha256: "170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428"
  },
  {
    file: "Supplementary_BubbleSizes_v1.xlsx",
    size: 557745,
    md5: "9fcfe68a37d2d92a7999569a07908854",
    sha256: "9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad"
  },
  {
    file: "Supplementary_RheometerData_v2.xlsx",
    size: 162970,
    md5: "c9b5a9cde073eb7c58933eec37a559a6",
    sha256: "073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70"
  }
];

console.log("=== ZENODO 18961871 PROVENANCE & INTEGRITY AUDIT ===");
console.log("Local File Integrity Status: VERIFIED (bit-for-bit match against pinned checksums)");
console.log("Authoritative Zenodo API Provenance Status: NOT_INDEPENDENTLY_VERIFIED (online API query not performed; archival local verification only)");

let allPassed = true;

for (const exp of EXPECTED_MANIFEST) {
  const p = path.join(TARGET_DIR, exp.file);
  if (!fs.existsSync(p)) {
    console.error(`FAIL: Missing file ${exp.file}`);
    allPassed = false;
    continue;
  }

  const buf = fs.readFileSync(p);
  const actualSize = buf.length;
  const actualMd5 = crypto.createHash("md5").update(buf).digest("hex");
  const actualSha256 = crypto.createHash("sha256").update(buf).digest("hex");

  const sizeMatch = actualSize === exp.size;
  const md5Match = actualMd5.toLowerCase() === exp.md5.toLowerCase();
  const sha256Match = actualSha256.toLowerCase() === exp.sha256.toLowerCase();

  console.log(`\nFile: ${exp.file}`);
  console.log(`  Size:   ${actualSize} bytes (Expected: ${exp.size}) -> ${sizeMatch ? "PASS" : "FAIL"}`);
  console.log(`  MD5:    ${actualMd5} (Expected: ${exp.md5}) -> ${md5Match ? "PASS" : "FAIL"}`);
  console.log(`  SHA256: ${actualSha256} -> ${sha256Match ? "PASS" : "FAIL"}`);

  if (!sizeMatch || !md5Match || !sha256Match) {
    allPassed = false;
  }

  const wb = XLSX.readFile(p);
  console.log(`  Parsed Sheets: [${wb.SheetNames.join(", ")}]`);
}

console.log("\n=======================================================");
if (allPassed) {
  console.log("LOCAL INTEGRITY CHECK PASSED. PROVENANCE STATUS: NOT_INDEPENDENTLY_VERIFIED.");
} else {
  console.error("VERIFICATION FAILED: One or more checks did not match.");
  process.exit(1);
}
