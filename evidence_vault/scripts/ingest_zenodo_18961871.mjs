import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as XLSX from "xlsx";

const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const FILES_TO_DOWNLOAD = [
  {
    filename: "Supplementary_SolutionFlowCurves.xlsx",
    url: "https://zenodo.org/api/records/18961871/files/Supplementary_SolutionFlowCurves.xlsx/content",
    expectedMd5: "cd5bfd6e95fc65e412807d53935c2d96",
    expectedSize: 22280,
    targetEngine: "ENG-003 (RheologyViscosityEngine)"
  },
  {
    filename: "Supplementary_FilmThickness_v1.xlsx",
    url: "https://zenodo.org/api/records/18961871/files/Supplementary_FilmThickness_v1.xlsx/content",
    expectedMd5: "bc9582baafecd6552f6014216a0844e6",
    expectedSize: 149923,
    targetEngine: "ENG-005 (FoamKineticsEngine)"
  },
  {
    filename: "Supplementary_BubbleSizes_v1.xlsx",
    url: "https://zenodo.org/api/records/18961871/files/Supplementary_BubbleSizes_v1.xlsx/content",
    expectedMd5: "9fcfe68a37d2d92a7999569a07908854",
    expectedSize: 557745,
    targetEngine: "ENG-005 (FoamKineticsEngine)"
  },
  {
    filename: "Supplementary_RheometerData_v2.xlsx",
    url: "https://zenodo.org/api/records/18961871/files/Supplementary_RheometerData_v2.xlsx/content",
    expectedMd5: "c9b5a9cde073eb7c58933eec37a559a6",
    expectedSize: 162970,
    targetEngine: "ENG-003 & ENG-005"
  }
];

function computeHashes(filePath) {
  const buf = fs.readFileSync(filePath);
  const md5 = crypto.createHash("md5").update(buf).digest("hex");
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  return { size: buf.length, md5, sha256 };
}

async function downloadFile(url, destPath) {
  console.log(`Downloading ${url} -> ${destPath}...`);
  const res = await fetch(url, {
    headers: { "User-Agent": "AI-Studio-Audit/1.0" }
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} ${res.statusText} fetching ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
  console.log(`Saved ${destPath} (${buffer.length} bytes).`);
}

async function run() {
  console.log("=== STAGE 1: Download & Verify Primary File: Supplementary_SolutionFlowCurves.xlsx ===");
  const primarySpec = FILES_TO_DOWNLOAD[0];
  const primaryDest = path.join(TARGET_DIR, primarySpec.filename);

  await downloadFile(primarySpec.url, primaryDest);
  const primaryHashes = computeHashes(primaryDest);
  console.log(`Primary File Checks:
  Byte size: ${primaryHashes.size} (Expected: ${primarySpec.expectedSize})
  MD5:       ${primaryHashes.md5}
  Expected:  ${primarySpec.expectedMd5}
  SHA-256:   ${primaryHashes.sha256}`);

  if (primaryHashes.md5.toLowerCase() !== primarySpec.expectedMd5.toLowerCase()) {
    console.error("CRITICAL ERROR: MD5 mismatch on primary file! Halting execution.");
    process.exit(1);
  }
  console.log("Primary file MD5 matched published Zenodo checksum exactly.");

  console.log("\n=== STAGE 2: Download Remaining Foam Workbooks ===");
  for (let i = 1; i < FILES_TO_DOWNLOAD.length; i++) {
    const spec = FILES_TO_DOWNLOAD[i];
    const dest = path.join(TARGET_DIR, spec.filename);
    await downloadFile(spec.url, dest);
    const hashes = computeHashes(dest);
    console.log(`File: ${spec.filename}
    Byte size: ${hashes.size} (Expected: ${spec.expectedSize})
    MD5:       ${hashes.md5} (Expected: ${spec.expectedMd5})
    SHA-256:   ${hashes.sha256}`);
    if (hashes.md5.toLowerCase() !== spec.expectedMd5.toLowerCase()) {
      console.error(`CRITICAL ERROR: MD5 mismatch on ${spec.filename}! Halting.`);
      process.exit(1);
    }
  }

  console.log("\nAll 4 workbooks downloaded and verified against published Zenodo checksums.");
}

run().catch(err => {
  console.error("Execution failed:", err);
  process.exit(1);
});
