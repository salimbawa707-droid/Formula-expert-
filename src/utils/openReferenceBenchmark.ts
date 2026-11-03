/**
 * OPEN-REFERENCE EMPIRICAL BENCHMARK (Node-only; uses fs).
 *
 * Compares the app's real calculation engines with openly licensed, published measurement
 * data stored verbatim in evidence_vault/open_reference_benchmarks:
 *   1. pH engine (PHEngineV2, ideal and Davies activity models) vs IUPAC 2002 pH standards.
 *   2. Pure-surfactant CMC defaults (getIngredientCmcData) vs PSDI/NIST NSRDS-36 CMC records.
 *   3. Ideal Clint mixed-CMC rule (idealMixedCmcFromMoleFractions) vs P2SURF binary mixtures.
 *
 * Governance: these are component-level reference benchmarks. They are NOT matched
 * finished-formula lab batches and never set LAB_VALIDATED on a formula.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PHEngineV2 } from '../domain/ph/pHEngineV2';
import { getIngredientCmcData, idealMixedCmcFromMoleFractions } from './calculators';

export const OPEN_REFERENCE_ROOT = path.join(process.cwd(), 'evidence_vault', 'open_reference_benchmarks');
export const OPEN_REFERENCE_FILES = {
  phStandards: 'ph_standards/iupac_2002_ph_standards.csv',
  pureCmc: 'cmc_pure/psdi_nist_detergent_homolog_cmc.csv',
  mixedCmc: 'cmc_mixed/p2surf_binary_mixture_cmc.csv'
} as const;

export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v.length > 0)) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); if (row.some(v => v.length > 0)) rows.push(row); }
  const [header, ...body] = rows;
  return body.map(r => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ''])));
}

/**
 * SHA-256 over LF-normalised bytes (CRLF -> LF), so a checkout with Windows
 * core.autocrlf or an LF-normalising patch tool verifies identically.
 */
export function sha256File(relativePath: string): string {
  const raw = fs.readFileSync(path.join(OPEN_REFERENCE_ROOT, relativePath));
  const normalised = Buffer.from(raw.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
  return crypto.createHash('sha256').update(normalised).digest('hex');
}

function readCsv(relativePath: string): Record<string, string>[] {
  return parseCsv(fs.readFileSync(path.join(OPEN_REFERENCE_ROOT, relativePath), 'utf8'));
}

const median = (values: number[]): number => {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (values: number[]): number => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
const round = (v: number, d = 3): number => Number(v.toFixed(d));

// ---------------------------------------------------------------------------
// 1. pH standards
// ---------------------------------------------------------------------------
export interface PhStandardResult {
  standardId: string;
  temperatureC: number;
  referencePH: number;
  idealPH: number;
  daviesPH: number;
  idealError: number;
  daviesError: number;
}

export function runPhStandardsBenchmark() {
  const rows = readCsv(OPEN_REFERENCE_FILES.phStandards);
  const supported = rows.filter(r => r.engine_supported === 'yes');
  const results: PhStandardResult[] = supported.map(r => {
    const ingredients: Array<{ name: string; rawKg: number; activePercent?: number }> = r.engine_recipe.split(';').map(part => {
      const [name, mw, molPerKg] = part.split(':');
      return { name, rawKg: Number(molPerKg) * Number(mw) / 1000, activePercent: 100 };
    });
    ingredients.push({ name: 'Deionized Water', rawKg: 1.0 });
    const total = ingredients.reduce((s, i) => s + i.rawKg, 0);
    const temperatureC = Number(r.temperature_c);
    const ideal = PHEngineV2.calculatePH(ingredients as any, total, { activityModel: 'ideal', temperatureC });
    const davies = PHEngineV2.calculatePH(ingredients as any, total, { activityModel: 'davies', temperatureC });
    const referencePH = Number(r.reference_ph);
    return {
      standardId: r.standard_id,
      temperatureC,
      referencePH,
      idealPH: round(ideal.pH),
      daviesPH: round(davies.pH),
      idealError: round(ideal.pH - referencePH),
      daviesError: round(davies.pH - referencePH)
    };
  });
  const at25 = results.filter(r => r.temperatureC === 25);
  const summarize = (set: PhStandardResult[]) => ({
    n: set.length,
    idealMAE: round(mean(set.map(r => Math.abs(r.idealError)))),
    daviesMAE: round(mean(set.map(r => Math.abs(r.daviesError)))),
    daviesMaxAbsError: round(Math.max(...set.map(r => Math.abs(r.daviesError))))
  });
  return {
    totalStandards: rows.length,
    supportedStandards: supported.length,
    unsupported: rows.filter(r => r.engine_supported !== 'yes').map(r => ({ standardId: r.standard_id, reason: r.mapping_note })),
    results,
    summary25C: summarize(at25),
    summaryAllTemperatures: summarize(results)
  };
}

// ---------------------------------------------------------------------------
// 2. Pure CMC
// ---------------------------------------------------------------------------
export function runPureCmcBenchmark() {
  const rows = readCsv(OPEN_REFERENCE_FILES.pureCmc);
  const keys = Array.from(new Set(rows.map(r => r.app_cmc_key)));
  const results = keys.map(key => {
    const set = rows.filter(r => r.app_cmc_key === key);
    const selected = set.filter(r => r.evidence_tier === 'NIST_SELECTED');
    const basis = selected.length > 0 ? selected : set;
    const referenceMilliMolar = median(basis.map(r => Number(r.cmc_molar) * 1000));
    const probe = set[0].app_ingredient_probe_name;
    const app = getIngredientCmcData(probe);
    const appMilliMolar = app ? app.cmcMolar : NaN;
    const logRatio = round(Math.log10(appMilliMolar / referenceMilliMolar));
    const relationship = set[0].structural_relationship;
    const weakProxy = relationship.startsWith('WEAK_PROXY');
    return {
      appKey: key,
      probeName: probe,
      appMatchedKey: app?.matchedKey ?? null,
      appCmcMilliMolar: appMilliMolar,
      referenceMilliMolar: round(referenceMilliMolar, 4),
      referenceTier: selected.length > 0 ? 'NIST_SELECTED' : 'NIST_LISTING_ONLY',
      referenceRows: basis.length,
      structuralRelationship: relationship,
      logRatioAppOverReference: logRatio,
      verdict: weakProxy
        ? 'NOT_COMPARABLE_WEAK_PROXY'
        : Math.abs(logRatio) <= Math.log10(2) ? 'WITHIN_2X' : 'OUTSIDE_2X'
    };
  });
  return { results };
}

// ---------------------------------------------------------------------------
// 3. Mixed CMC
// ---------------------------------------------------------------------------
export type ChargeClass = 'anionic' | 'cationic' | 'nonionic' | 'zwitterionic';
export function chargeClassFromSmiles(smiles: string): ChargeClass {
  const main = smiles.split('.').reduce((a, b) => (b.length > a.length ? b : a), '');
  const pos = main.includes('+]');
  const neg = main.includes('-]');
  if (pos && neg) return 'zwitterionic';
  if (pos) return 'cationic';
  if (neg) return 'anionic';
  return 'nonionic';
}

export function runMixedCmcBenchmark() {
  const rows = readCsv(OPEN_REFERENCE_FILES.mixedCmc);
  const systems = new Map<string, { a: string; b: string; points: Array<{ xa: number; logCmc: number }> }>();
  for (const r of rows) {
    if (r.smile_A === r.smile_B) continue;
    const [a, b] = [r.smile_A, r.smile_B].sort();
    const xRaw = Number(r.mol_fraction_A);
    const xa = a === r.smile_A ? xRaw : 1 - xRaw;
    const key = `${a}||${b}`;
    if (!systems.has(key)) systems.set(key, { a, b, points: [] });
    systems.get(key)!.points.push({ xa, logCmc: Number(r.logCMC) });
  }
  type Point = { system: string; pairClass: string; xa: number; logBias: number };
  const points: Point[] = [];
  let systemsWithEndpoints = 0;
  for (const [key, sys] of systems) {
    const endA = sys.points.filter(p => p.xa === 1).map(p => p.logCmc);
    const endB = sys.points.filter(p => p.xa === 0).map(p => p.logCmc);
    if (endA.length === 0 || endB.length === 0) continue;
    systemsWithEndpoints++;
    const cmcA = Math.pow(10, mean(endA));
    const cmcB = Math.pow(10, mean(endB));
    const pairClass = [chargeClassFromSmiles(sys.a), chargeClassFromSmiles(sys.b)].sort().join('-');
    for (const p of sys.points) {
      if (p.xa <= 0 || p.xa >= 1) continue;
      const ideal = idealMixedCmcFromMoleFractions([{ moleFraction: p.xa, cmc: cmcA }, { moleFraction: 1 - p.xa, cmc: cmcB }]);
      points.push({ system: key, pairClass, xa: p.xa, logBias: Math.log10(ideal) - p.logCmc });
    }
  }
  const classes = Array.from(new Set(points.map(p => p.pairClass))).sort();
  const byClass = classes.map(pairClass => {
    const set = points.filter(p => p.pairClass === pairClass);
    const systemIds = Array.from(new Set(set.map(p => p.system)));
    // Leave-one-system-out: correct each held-out system with the median bias of the other systems.
    const losoErrors: number[] = [];
    for (const sid of systemIds) {
      const train = set.filter(p => p.system !== sid).map(p => p.logBias);
      if (train.length === 0) continue;
      const correction = median(train);
      for (const p of set.filter(q => q.system === sid)) losoErrors.push(Math.abs(p.logBias - correction));
    }
    return {
      pairClass,
      points: set.length,
      systems: systemIds.length,
      idealMAELog: round(mean(set.map(p => Math.abs(p.logBias)))),
      medianLogBias: round(median(set.map(p => p.logBias)), 2),
      medianFoldOverestimate: round(Math.pow(10, median(set.map(p => p.logBias))), 2),
      biasCorrectedLosoMAELog: losoErrors.length ? round(mean(losoErrors)) : null
    };
  });
  return {
    rows: rows.length,
    binarySystems: systems.size,
    systemsWithBothEndpoints: systemsWithEndpoints,
    evaluablePoints: points.length,
    unit: 'log10(CMC / uM)',
    byClass
  };
}

export function runOpenReferenceBenchmark() {
  return {
    generatedBy: 'src/utils/openReferenceBenchmark.ts',
    governance: 'Component-level reference benchmark against published open data. Not matched finished-formula lab batches; does not grant LAB_VALIDATED status.',
    datasetSha256: Object.fromEntries(Object.values(OPEN_REFERENCE_FILES).map(rel => [rel, sha256File(rel)])),
    ph: runPhStandardsBenchmark(),
    pureCmc: runPureCmcBenchmark(),
    mixedCmc: runMixedCmcBenchmark()
  };
}
