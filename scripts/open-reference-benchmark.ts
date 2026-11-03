/**
 * Runs the open-reference empirical benchmark and writes test_reports/open-reference-benchmark.json.
 * Usage: npx tsx scripts/open-reference-benchmark.ts
 */
import fs from 'fs';
import path from 'path';
import { runOpenReferenceBenchmark } from '../src/utils/openReferenceBenchmark';

const report = runOpenReferenceBenchmark();
const out = path.join(process.cwd(), 'test_reports', 'open-reference-benchmark.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');

console.log('pH standards (25 C):', report.ph.summary25C);
console.log('pH standards (10/25/40 C):', report.ph.summaryAllTemperatures);
for (const r of report.pureCmc.results) console.log('CMC', r.appKey, r.appCmcMilliMolar, 'mM vs', r.referenceMilliMolar, 'mM', r.verdict);
for (const c of report.mixedCmc.byClass) console.log('Mix', c.pairClass, `n=${c.points}/${c.systems}`, 'MAE', c.idealMAELog, 'bias', c.medianLogBias, 'LOSO-corrected MAE', c.biasCorrectedLosoMAELog);
console.log('Wrote', path.relative(process.cwd(), out));
