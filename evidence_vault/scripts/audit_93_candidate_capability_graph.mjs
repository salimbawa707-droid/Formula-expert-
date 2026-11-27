#!/usr/bin/env node
/**
 * Deterministic static import/export graph for the Phase 4B broad candidate set.
 * Scans every src TS/TSX/JS/JSX file, including tests as callers, while candidate
 * discovery excludes __tests__. This is static source wiring, not runtime proof.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'evidence_vault', 'forensic_reports', 'generated');
const OUT_MD = path.join(OUT_DIR, 'PHASE4B_93_CANDIDATE_EXPORT_CALLSITE_GRAPH_2026-11-27.md');
const OUT_JSON = path.join(OUT_DIR, 'PHASE4B_93_CANDIDATE_EXPORT_CALLSITE_GRAPH_2026-11-27.json');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const CANDIDATE_PATH_RE = /(engine|calculator|optimizer|optimization|formulation|workflow|predictor|router)/i;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else if (EXTENSIONS.includes(path.extname(entry.name))) found.push(full);
  }
  return found;
}
function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}
function normalizeModulePath(file) {
  return file.replace(/\.(ts|tsx|js|jsx)$/i, '').replace(/\/index$/i, '');
}
function classify(file, source) {
  const p = file.toLowerCase();
  if (p.startsWith('src/components/')) return 'UI_PRESENTATION';
  if (p.includes('cmcpredictor')) return 'FAIL_CLOSED_CMC_MODEL_ADAPTER';
  if (p.includes('refinementengine')) return 'EVIDENCE_GATED_REFINEMENT_PROPOSALS_NOT_OPTIMIZER';
  if (p.endsWith('/calibrationengine.ts')) return 'CALIBRATION_PROPOSAL_WORKFLOW';
  if (p.includes('cleaningperformance')) return 'RULE_BASED_CLEANING_PERFORMANCE_SCORING';
  if (p.includes('labhealth')) return 'LAB_READINESS_AND_HEALTH_SCORING';
  if (p.endsWith('/calculators.ts')) return 'LEGACY_CALCULATION_FACADE';
  if (p.includes('ingredientintelligence')) return 'INGREDIENT_KNOWLEDGE_AND_RULE_REGISTRY';
  if (p.includes('dilution')) return 'ARITHMETIC_DILUTION_AND_UNIT_CONVERSION';
  if (p.includes('expertreasoning')) return 'RULE_BASED_EXPERT_REASONING';
  if (p.includes('gradeengine')) return 'RULE_BASED_FORMULA_SCORING';
  if (p.includes('inventoryengine')) return 'INVENTORY_OPERATIONAL_LOGIC';
  if (p.includes('liquidnvr')) return 'NONVOLATILE_RESIDUE_CALCULATION';
  if (p.includes('scientificlearning')) return 'EVIDENCE_GOVERNED_LEARNING_WORKFLOW';
  if (p.includes('substitutionengine')) return 'RULE_BASED_INGREDIENT_SUBSTITUTION';
  if (p.includes('templaterevalidation')) return 'FORMULA_TEMPLATE_REVALIDATION';
  if (p.includes('climateengine')) return 'ENVIRONMENTAL_PRESET_RULES';
  if (p.includes('foamkinetics')) return 'MEASURED_FOAM_SERIES_ANALYSIS_ONLY';
  if (p.includes('/__tests__/')) return 'TEST_ONLY';
  if (p.includes('/spectroscopy/')) return 'SPECTRAL_SIGNAL_PROCESSING_OR_EVIDENCE';
  if (p.includes('/labautomation/')) return 'LAB_AUTOMATION_CONSTRAINTS';
  if (p.includes('/closedlooprandd/')) return 'CLOSED_LOOP_R_AND_D_WORKFLOW';
  if (p.includes('/lims/')) return 'LIMS_EVIDENCE_LIFECYCLE';
  if (p.includes('/specificationengine/')) return 'SPECIFICATION_AND_RELEASE_GATES';
  if (p.includes('/regulatory')) return 'REGULATORY_RULES';
  if (p.includes('/optimization/')) return 'FORMULATION_OPTIMIZATION_OR_CONSTRAINTS';
  if (p.includes('/powderengine/')) return 'POWDER_DOMAIN_CALCULATION';
  if (p.includes('adapter')) return 'DATA_ADAPTER';
  if (p.includes('router')) return 'CATEGORY_OR_ENGINE_ROUTER';
  if (p.includes('workflow') || p.includes('orchestrator')) return 'WORKFLOW_ORCHESTRATION';
  if (p.includes('labEvidence'.toLowerCase()) || p.includes('empirical') || p.includes('provenance') || p.includes('scientificgovernance')) return 'LAB_EVIDENCE_CALIBRATION_OR_GOVERNANCE';
  if (p.includes('cost') || p.includes('inventory') || p.includes('manufacturing')) return 'COMMERCIAL_OR_OPERATIONAL_CALCULATION';
  if (/export\s+(interface|type)\s/.test(source) && !/export\s+(class|function|const)\s/.test(source)) return 'TYPE_OR_DATA_CONTRACT';
  if (p.includes('phengine') || p.includes('neutralization') || p.includes('chelator') || p.includes('hlb') || p.includes('activeMatter'.toLowerCase()) || p.includes('viscosity') || p.includes('density') || p.includes('foam')) return 'PHYSICAL_CHEMICAL_OR_PROPERTY_CALCULATION';
  if (p.includes('scientificquality') || p.includes('compatibility') || p.includes('grade') || p.includes('expertReasoning'.toLowerCase()) || p.includes('decision')) return 'RULE_BASED_SCREENING_OR_DECISION';
  return 'MIXED_OR_REQUIRES_MANUAL_SEMANTIC_REVIEW';
}
function exportedSymbols(source) {
  const names = new Set();
  const declaration = /\bexport\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:abstract\s+)?(?:class|function|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  for (const m of source.matchAll(declaration)) names.add(m[1]);
  const wildcardReexport = /\bexport\s+\*\s+from\s+['"]([^'"]+)['"]/g;
  for (const m of source.matchAll(wildcardReexport)) names.add('* from ' + m[1]);
  const named = /\bexport\s*\{([^}]+)\}/g;
  for (const m of source.matchAll(named)) {
    for (const part of m[1].split(',')) {
      const token = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      if (token && token !== 'default') names.add(token);
    }
  }
  if (/\bexport\s+default\b/.test(source)) names.add('default');
  return [...names].sort();
}
function isTestFile(file) {
  return file.split('/').includes('__tests__') || /\.(test|spec)\.(ts|tsx|js|jsx)$/i.test(file);
}
function importedNames(clause) {
  const names = [];
  const named = clause.match(/\{([^}]+)\}/);
  if (named) {
    for (const part of named[1].split(',')) {
      const item = part.trim().replace(/^type\s+/, '');
      if (!item) continue;
      const [original, alias] = item.split(/\s+as\s+/);
      names.push(alias ? alias.trim() + ' (from ' + original.trim() + ')' : original.trim());
    }
  }
  const defaultName = clause.trim().match(/^([A-Za-z_$][\w$]*)/);
  if (defaultName && defaultName[1] !== 'type') names.push(defaultName[1] + ' (default)');
  const namespace = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
  if (namespace) names.push('* as ' + namespace[1]);
  return [...new Set(names)];
}
function moduleStatements(source) {
  const lines = source.split(/\r?\n/);
  const statements = [];
  for (let i = 0; i < lines.length; i++) {
    const first = lines[i].trim();
    const isImport = /^import\s/.test(first) && !/^import\s*\(/.test(first);
    const isReExport = /^export\s+(?:\*|\{)/.test(first);
    if (!isImport && !isReExport) continue;
    let statement = first;
    if (isImport) {
      const sideEffect = statement.match(/^import\s*(['"])([^'"]+)\1/);
      if (sideEffect) {
        statements.push({ kind: 'import', clause: '', specifier: sideEffect[2] });
        continue;
      }
    }
    while (!/\bfrom\s*(['"])[^'"]+\1/.test(statement) && i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (/^(?:import|export)\s/.test(next)) break;
      statement += ' ' + next;
      i++;
    }
    const match = statement.match(/\bfrom\s*(['"])([^'"]+)\1/);
    if (match) {
      const clause = statement.slice(0, statement.indexOf('from')).replace(/^(?:import|export)\s+/, '').trim();
      statements.push({ kind: isReExport ? 'export' : 'import', clause, specifier: match[2] });
    }
  }
  return statements;
}

function resolveRelative(importer, specifier, candidateByStem) {
  if (!specifier.startsWith('.')) {
    if (specifier.startsWith('@/')) {
      const base = path.join(SRC, specifier.slice(2));
      const choices = [base, ...EXTENSIONS.map(ext => base + ext), path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
      for (const choice of choices) {
        const key = normalizeModulePath(rel(choice));
        if (candidateByStem.has(key)) return candidateByStem.get(key);
      }
    }
    return null;
  }
  const base = path.resolve(path.dirname(importer), specifier);
  const choices = [base, ...EXTENSIONS.map(ext => base + ext), path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  for (const choice of choices) {
    const key = normalizeModulePath(rel(choice));
    if (candidateByStem.has(key)) return candidateByStem.get(key);
  }
  return null;
}

const sourceFiles = walk(SRC).map(rel).sort();
const candidateFiles = sourceFiles.filter(file =>
  !file.includes('/__tests__/') && CANDIDATE_PATH_RE.test(file)
);
const sourceByPath = new Map();
for (const file of sourceFiles) sourceByPath.set(file, fs.readFileSync(path.join(ROOT, file), 'utf8'));
const candidateByStem = new Map(candidateFiles.map(file => [normalizeModulePath(file), file]));
const modules = new Map(candidateFiles.map(file => [file, {
  path: file,
  role: classify(file, sourceByPath.get(file)),
  exports: exportedSymbols(sourceByPath.get(file)),
  outgoingCandidateDependencies: [],
  incomingImporters: []
}]));
const edges = [];
const unresolvedCandidateLikeImports = [];

for (const importer of sourceFiles) {
  const source = sourceByPath.get(importer);
  for (const statement of moduleStatements(source)) {
    const target = resolveRelative(path.join(ROOT, importer), statement.specifier, candidateByStem);
    if (!target) {
      if (CANDIDATE_PATH_RE.test(statement.specifier) && !statement.specifier.split('/').some(segment => segment === '__tests__' || segment === 'tests')) unresolvedCandidateLikeImports.push({ importer, specifier: statement.specifier });
      continue;
    }
    const edge = {
      importer,
      target,
      edgeType: statement.kind === 'export' ? 'RE_EXPORT' : 'STATIC_IMPORT',
      importedNames: importedNames(statement.clause)
    };
    edges.push(edge);
    modules.get(target).incomingImporters.push(edge);
    if (modules.has(importer)) modules.get(importer).outgoingCandidateDependencies.push(target);
  }

  const dynamicRe = /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g;
  for (const match of source.matchAll(dynamicRe)) {
    const target = resolveRelative(path.join(ROOT, importer), match[2], candidateByStem);
    if (!target) continue;
    const edge = { importer, target, edgeType: 'DYNAMIC_IMPORT', importedNames: [] };
    edges.push(edge);
    modules.get(target).incomingImporters.push(edge);
    if (modules.has(importer)) modules.get(importer).outgoingCandidateDependencies.push(target);
  }
}

for (const module of modules.values()) {
  module.outgoingCandidateDependencies = [...new Set(module.outgoingCandidateDependencies)].sort();
  module.incomingImporters.sort((a, b) => a.importer.localeCompare(b.importer));
  module.directProductionImporters = [...new Set(module.incomingImporters
    .filter(edge => !isTestFile(edge.importer))
    .map(edge => edge.importer))].sort();
  module.directTestImporters = [...new Set(module.incomingImporters
    .filter(edge => isTestFile(edge.importer))
    .map(edge => edge.importer))].sort();
  module.hasDirectProductionImporter = module.directProductionImporters.length > 0;
}
const graph = {
  audit: 'Phase 4B broad candidate export and static call-site graph',
  generatedAt: new Date().toISOString(),
  method: 'Repository-local static import/re-export/dynamic-import scan over all src TS/TSX/JS/JSX files. Candidate discovery excludes __tests__ and matches engine|calculator|optimizer|optimization|formulation|workflow|predictor|router in the source path.',
  candidateCount: candidateFiles.length,
  sourceFileCount: sourceFiles.length,
  edgeCount: edges.length,
  unresolvedCandidateLikeImports,
  modules: [...modules.values()]
};
if (graph.candidateCount !== 93) {
  throw new Error('Candidate inventory drift: expected 93 candidates, found ' + graph.candidateCount);
}
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(graph, null, 2) + '\n');
const lines = [
  '# Phase 4B — 93-candidate export and call-site graph',
  '',
  '**Generated by:** `evidence_vault/scripts/audit_93_candidate_capability_graph.mjs`',
  '**Candidate definition:** non-test source files under `src/` with TS/TSX/JS/JSX extensions and path matching engine, calculator, optimizer, optimization, formulation, workflow, predictor or router.',
  '**Source scan:** all source files under `src/`, including tests as callers.',
  '',
  '| Metric | Result |',
  '|---|---:|',
  '| Broad production candidates | ' + graph.candidateCount + ' |',
  '| Source files scanned for callers | ' + graph.sourceFileCount + ' |',
  '| Static import/re-export/dynamic-import edges to candidates | ' + graph.edgeCount + ' |',
  '| Unresolved candidate-like relative imports | ' + graph.unresolvedCandidateLikeImports.length + ' |',
  '',
  '## Module-by-module map',
  ''
];
for (const module of graph.modules) {
  lines.push('### `' + module.path + '`');
  lines.push('- **Role classification:** ' + module.role);
  lines.push('- **Exported symbols:** ' + (module.exports.join(', ') || 'No named declaration export detected; inspect default/barrel exports.'));
  lines.push('- **Candidate dependencies:** ' + (module.outgoingCandidateDependencies.join(', ') || 'None detected.'));
  lines.push('- **Direct production importers:** ' + (module.directProductionImporters.join(', ') || 'None detected.'));
  lines.push('- **Direct test importers:** ' + (module.directTestImporters.join(', ') || 'None detected.'));
  lines.push('- **Has direct non-test source importer:** ' + (module.hasDirectProductionImporter ? 'YES' : 'NO / UNRESOLVED'));
  lines.push('- **Direct importers/call-site files:**');
  if (module.incomingImporters.length === 0) lines.push('  - None found by static import scan (may be dynamically wired, indirectly re-exported, or unused).');
  else for (const edge of module.incomingImporters) lines.push('  - `' + edge.importer + '` — ' + edge.edgeType + (edge.importedNames.length ? ': ' + edge.importedNames.join(', ') : ''));
  lines.push('');
}
lines.push('## Interpretation and limits');
lines.push('- A static import edge proves source-level dependency, not runtime execution or that every imported export is invoked.');
lines.push('- The role label is a deterministic path/content heuristic for triage, not scientific certification.');
lines.push('- The graph does not resolve computed dynamic imports, reflection, runtime plugin registration, or indirect calls through arbitrary callbacks.');
lines.push('- Exported types, adapters, UI panels, registries, evidence infrastructure and operational utilities are not independent scientific predictors.');
lines.push('- No module is promoted to LAB_VALIDATED by this graph. Mathematical validity, applicability domain and matched laboratory validation remain separate gates.');
lines.push('');
fs.writeFileSync(OUT_MD, lines.join('\n'));
console.log(JSON.stringify({
  candidateCount: graph.candidateCount,
  sourceFileCount: graph.sourceFileCount,
  edgeCount: graph.edgeCount,
  unresolvedCandidateLikeImports: graph.unresolvedCandidateLikeImports.length,
  unresolvedImports: graph.unresolvedCandidateLikeImports,
  directNonTestImportedCandidates: [...modules.values()].filter(module => module.hasDirectProductionImporter).length,
  noDirectNonTestImporterCandidates: [...modules.values()].filter(module => !module.hasDirectProductionImporter).map(module => module.path),
  zeroExportCandidates: [...modules.values()].filter(module => module.exports.length === 0).map(module => module.path),
  mixedSemanticPaths: [...modules.values()].filter(module => module.role === 'MIXED_OR_REQUIRES_MANUAL_SEMANTIC_REVIEW').map(module => module.path),
  roleCounts: Object.fromEntries([...modules.values()].reduce((counts, module) => counts.set(module.role, (counts.get(module.role) || 0) + 1), new Map())),
  markdown: rel(OUT_MD),
  json: rel(OUT_JSON)
}, null, 2));
