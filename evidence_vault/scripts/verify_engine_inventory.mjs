import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const legacyListPath = path.join(root, 'engines_reconciled.list');
const auditCsvPath = path.join(root, 'evidence_vault/datasets/engine-audit-final-2026-11-03.csv');
const srcRoot = path.join(root, 'src');
let failed = false;
const fail = (message) => { console.error(`ENGINE INVENTORY FAIL: ${message}`); failed = true; };
const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() ? [path.relative(root, full).split(path.sep).join('/')] : [];
  });
};
const isSource = (file) => /\.(ts|tsx|js|jsx)$/i.test(file);
const isTest = (file) => /(^|\/)__tests__(\/|$)|\.(test|spec)\.[^.]+$/i.test(file);

if (!fs.existsSync(legacyListPath)) { fail('engines_reconciled.list is missing'); process.exit(1); }
const legacyEntries = fs.readFileSync(legacyListPath, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const uniqueEntries = [...new Set(legacyEntries)];
const duplicateEntries = legacyEntries.filter((entry, index) => legacyEntries.indexOf(entry) !== index);
const missingEntries = uniqueEntries.filter((entry) => !fs.existsSync(path.join(root, entry)));
const auditCsvLines = fs.existsSync(auditCsvPath) ? fs.readFileSync(auditCsvPath, 'utf8').trim().split(/\r?\n/) : [];
const auditCsvPaths = auditCsvLines.slice(1).map((line) => line.match(/^\"([^\"]+)\"/)?.[1]).filter(Boolean);
const csvOnlyPaths = auditCsvPaths.filter((entry) => !uniqueEntries.includes(entry));
const listOnlyPaths = uniqueEntries.filter((entry) => !auditCsvPaths.includes(entry));
const sourceFiles = walk(srcRoot).filter(isSource).filter((file) => !isTest(file));
const engineNamedIncludingUi = sourceFiles.filter((file) => path.basename(file).toLowerCase().includes('engine'));
const engineNamedSourceOnly = engineNamedIncludingUi.filter((file) => !file.startsWith('src/components/'));
const broadCandidates = sourceFiles.filter((file) => /(engine|calculator|optimizer|optimization|formulation|workflow|predictor|router)/i.test(file));
const srcCoreExists = fs.existsSync(path.join(srcRoot, 'core'));
const result = {
  auditedDefinition: 'source-tree inventory; counts are intentionally non-interchangeable',
  legacyList: { entries: legacyEntries.length, uniqueEntries: uniqueEntries.length, duplicateEntries, missingEntries, expectedEntries: 55, auditCsvRows: auditCsvPaths.length, csvOnlyPaths, listOnlyPaths },
  sourceFilenameCounts: {
    engineNamedSourceFilesExcludingUi: engineNamedSourceOnly.length,
    engineNamedFilesIncludingUi: engineNamedIncludingUi.length,
    broadDiscoveryCandidates: broadCandidates.length,
    expected: { engineNamedSourceFilesExcludingUi: 60, engineNamedFilesIncludingUi: 63, broadDiscoveryCandidates: 92 },
  },
  nonexistentHistoricalPathRoot: { path: 'src/core/', exists: srcCoreExists },
};
console.log(JSON.stringify(result, null, 2));
if (legacyEntries.length !== 55) fail(`legacy list count changed: expected 55, got ${legacyEntries.length}`);
if (!fs.existsSync(auditCsvPath)) fail('engine audit CSV is missing');
if (auditCsvPaths.length !== 55) fail(`engine audit CSV row count changed: expected 55, got ${auditCsvPaths.length}`);
if (csvOnlyPaths.length || listOnlyPaths.length) fail(`engine audit CSV/list mismatch: csvOnly=${JSON.stringify(csvOnlyPaths)}, listOnly=${JSON.stringify(listOnlyPaths)}`);
if (uniqueEntries.length !== legacyEntries.length) fail(`legacy list has duplicate paths: ${JSON.stringify(duplicateEntries)}`);
if (missingEntries.length) fail(`legacy list paths missing from source tree: ${JSON.stringify(missingEntries)}`);
if (engineNamedSourceOnly.length !== 60) fail(`Engine-named source count drifted: expected 60, got ${engineNamedSourceOnly.length}`);
if (engineNamedIncludingUi.length !== 63) fail(`Engine-named count including UI drifted: expected 63, got ${engineNamedIncludingUi.length}`);
if (broadCandidates.length !== 92) fail(`Broad candidate count drifted: expected 92, got ${broadCandidates.length}`);
if (srcCoreExists) fail('src/core/ now exists; revisit the historical-path finding');
if (failed) process.exit(1);
