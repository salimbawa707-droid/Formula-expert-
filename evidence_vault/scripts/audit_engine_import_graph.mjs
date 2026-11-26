import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const manifestPath = path.join(root, 'engines_reconciled.list');
const csvPath = path.join(root, 'evidence_vault/datasets/engine-audit-final-2026-11-03.csv');
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs'];
const isSource = (file) => /\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/i.test(file);
const isTest = (file) => /(^|\/)__tests__(\/|$)|\.(test|spec)\.[^.]+$/i.test(file) || file.startsWith('scripts/');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() ? [path.relative(root, full).split(path.sep).join('/')] : [];
  });
}

function resolveLocalImport(importer, specifier, knownFiles) {
  if (!specifier.startsWith('.')) return null;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(importer), specifier));
  const candidates = [];
  const baseExtension = path.posix.extname(base);
  if (extensions.includes(baseExtension)) {
    candidates.push(base);
    if (['.js', '.mjs', '.cjs'].includes(baseExtension)) {
      const stem = base.slice(0, -baseExtension.length);
      candidates.push(stem + '.ts', stem + '.tsx');
    }
  } else {
    if (knownFiles.has(base)) candidates.push(base);
    for (const ext of extensions) candidates.push(base + ext);
    for (const ext of extensions) candidates.push(path.posix.join(base, 'index' + ext));
  }
  return candidates.find((candidate) => knownFiles.has(candidate)) || null;
}

function extractImports(source) {
  const values = new Set();
  const patterns = [
    /(?:^|\n)\s*import\s+(?:type\s+)?(?:[\w$*\s{},]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /(?:^|\n)\s*export\s+(?:type\s+)?[\w$*\s{},]+?\s+from\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) values.add(match[1]);
  }
  return [...values];
}

function countExports(source) {
  const declarations = [...source.matchAll(/\bexport\s+(?:declare\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g)]
    .map((match) => match[1]);
  const namedBlocks = [...source.matchAll(/\bexport\s*\{([^}]+)\}/g)];
  for (const block of namedBlocks) {
    for (const entry of block[1].split(',')) {
      const name = entry.trim().split(/\s+as\s+/).at(-1);
      if (name && name !== 'type') declarations.push(name);
    }
  }
  return [...new Set(declarations)].length;
}

if (!fs.existsSync(manifestPath)) {
  console.error('PHASE 1 IMPORT GRAPH FAIL: engines_reconciled.list is missing');
  process.exit(1);
}
const manifest = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const uniqueManifest = [...new Set(manifest)];
const duplicates = manifest.filter((item, index) => manifest.indexOf(item) !== index);
const files = [...walk(sourceRoot), ...walk(path.join(root, 'scripts'))].filter(isSource);
if (fs.existsSync(path.join(root, 'server.ts'))) files.push('server.ts');
const knownFiles = new Set(files);
const sources = new Map();
for (const file of files) sources.set(file, fs.readFileSync(path.join(root, file), 'utf8'));

const graph = new Map();
const unresolvedRelativeImports = [];
for (const [file, source] of sources) {
  const edges = [];
  for (const specifier of extractImports(source)) {
    if (!specifier.startsWith('.')) continue;
    if (/\.(css|scss|sass|less|svg|png|jpe?g|webp|json|wasm)$/i.test(specifier)) continue;
    const resolved = resolveLocalImport(file, specifier, knownFiles);
    if (resolved) edges.push(resolved);
    else unresolvedRelativeImports.push({ importer: file, specifier });
  }
  graph.set(file, [...new Set(edges)]);
}

const reverse = new Map(files.map((file) => [file, []]));
for (const [importer, targets] of graph) {
  for (const target of targets) reverse.get(target)?.push(importer);
}

const roots = ['src/main.tsx', 'server.ts'].filter((file) => knownFiles.has(file));
const reachable = new Set();
const queue = [...roots];
while (queue.length) {
  const current = queue.shift();
  if (reachable.has(current)) continue;
  reachable.add(current);
  for (const next of graph.get(current) || []) if (!reachable.has(next)) queue.push(next);
}

const csvLines = fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/) : [];
const csvPaths = csvLines.slice(1).map((line) => line.match(/^"([^"]+)"/)?.[1]).filter(Boolean);
const csvDuplicates = csvPaths.filter((item, index) => csvPaths.indexOf(item) !== index);
const csvOnly = csvPaths.filter((item) => !uniqueManifest.includes(item));
const manifestOnly = uniqueManifest.filter((item) => !csvPaths.includes(item));
const missingManifest = uniqueManifest.filter((item) => !knownFiles.has(item));

const modules = uniqueManifest.map((file) => {
  const importers = reverse.get(file) || [];
  const productionImporters = importers.filter((importer) => !isTest(importer));
  const testImporters = importers.filter(isTest);
  const status = reachable.has(file)
    ? 'PRODUCTION_REACHABLE'
    : productionImporters.length
      ? 'PRODUCTION_IMPORTED_BUT_NOT_ROOT_REACHABLE'
      : testImporters.length
        ? 'TEST_ONLY'
        : 'ORPHAN_NO_STATIC_IMPORTERS';
  return {
    path: file,
    status,
    exportCount: sources.has(file) ? countExports(sources.get(file)) : 0,
    directProductionImporters: productionImporters,
    directTestImporters: testImporters,
    productionReachable: reachable.has(file),
  };
});

const summary = {
  sourceFilesScanned: files.length,
  productionRoots: roots,
  productionReachableFiles: reachable.size,
  manifestModules: modules.length,
  productionReachableModules: modules.filter((item) => item.status === 'PRODUCTION_REACHABLE').length,
  importedButNotRootReachableModules: modules.filter((item) => item.status === 'PRODUCTION_IMPORTED_BUT_NOT_ROOT_REACHABLE').length,
  testOnlyModules: modules.filter((item) => item.status === 'TEST_ONLY').length,
  orphanModules: modules.filter((item) => item.status === 'ORPHAN_NO_STATIC_IMPORTERS').length,
  modulesWithoutDirectProductionOrTestImporters: modules.filter((item) => item.directProductionImporters.length === 0 && item.directTestImporters.length === 0).length,
  unresolvedRelativeImports: unresolvedRelativeImports.length,
  manifestEntries: manifest.length,
  manifestUniqueEntries: uniqueManifest.length,
  csvRows: csvPaths.length,
  manifestDuplicates: duplicates,
  csvDuplicates,
  csvOnly,
  manifestOnly,
  missingManifest,
};
console.log(JSON.stringify({ summary, modules, unresolvedRelativeImports: unresolvedRelativeImports.slice(0, 100) }, null, 2));

const failures = [];
if (manifest.length !== 55 || uniqueManifest.length !== 55) failures.push('Expected exactly 55 unique manifest paths');
if (csvPaths.length !== 55) failures.push('Expected exactly 55 CSV data rows');
if (duplicates.length || csvDuplicates.length) failures.push('Duplicate manifest/CSV paths detected');
if (csvOnly.length || manifestOnly.length) failures.push('Manifest and CSV path sets differ');
if (missingManifest.length) failures.push('Manifest contains missing source files');
if (!roots.includes('src/main.tsx')) failures.push('src/main.tsx production entrypoint not found');
if (failures.length) {
  for (const failure of failures) console.error('PHASE 1 IMPORT GRAPH FAIL: ' + failure);
  process.exit(1);
}
