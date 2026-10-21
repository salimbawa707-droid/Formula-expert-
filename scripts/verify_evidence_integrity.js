#!/usr/bin/env node
/**
 * Deterministic Phase 4B integrity gate.
 * Verifies canonical evidence bytes against pinned size, MD5 and SHA-256.
 * This checks byte identity and ZIP magic bytes; it does not claim that the
 * workbook's scientific contents or experimental provenance are validated.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const DATASET_DIR = path.join(ROOT, 'evidence_vault/datasets/zenodo_18961871');
const QUARANTINE_DIR = path.join(ROOT, 'evidence_vault/corrupted_quarantine');

const WORKBOOKS = [
  {
    name: 'Supplementary_SolutionFlowCurves.xlsx',
    size: 22280,
    md5: 'cd5bfd6e95fc65e412807d53935c2d96',
    sha256: '90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590',
  },
  {
    name: 'Supplementary_FilmThickness_v1.xlsx',
    size: 149923,
    md5: 'bc9582baafecd6552f6014216a0844e6',
    sha256: '170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428',
  },
];

let failures = 0;
function check(condition, label, details = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}${details ? `: ${details}` : ''}`);
  if (!condition) failures += 1;
}

for (const workbook of WORKBOOKS) {
  const filePath = path.join(DATASET_DIR, workbook.name);
  if (!fs.existsSync(filePath)) {
    check(false, `${workbook.name} exists`);
    continue;
  }

  const bytes = fs.readFileSync(filePath);
  const md5 = crypto.createHash('md5').update(bytes).digest('hex');
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const isZipMagic = bytes.length >= 4 &&
    bytes[0] === 0x50 && bytes[1] === 0x4b &&
    bytes[2] === 0x03 && bytes[3] === 0x04;

  console.log(`\nWorkbook: ${workbook.name}`);
  check(bytes.length === workbook.size, 'exact byte size', `${bytes.length} / expected ${workbook.size}`);
  check(isZipMagic, 'ZIP local-file header signature', bytes.subarray(0, 4).toString('hex'));
  check(md5 === workbook.md5, 'MD5 matches pinned manifest', md5);
  check(sha256 === workbook.sha256, 'SHA-256 matches pinned manifest', sha256);
}

for (const name of WORKBOOKS.map(item => item.name)) {
  const quarantinePath = path.join(QUARANTINE_DIR, name);
  check(!fs.existsSync(quarantinePath), 'corrupt quarantine stub absent', name);
}

if (failures > 0) {
  console.error(`\nPhase 4B byte-integrity gate FAILED: ${failures} check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log('\nPhase 4B byte-integrity gate PASSED. Scientific-content validation remains a separate gate.');
}
