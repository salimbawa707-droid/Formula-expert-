import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = dirname(fileURLToPath(import.meta.url));
const sources = [
  { id: 'SRC-REPOD-CMC-120708', file: 'C12_DNNH3MeSO3_dicephalic_quadruple.txt', md5: 'c46781d8ce8ebfba16ba991509627481' },
  { id: 'SRC-REPOD-CMC-120706', file: 'C12_DNNH3MeSO3_dicephalic.txt', md5: '82613d9ecc8c68b5e41f32b1cdde2ef1' },
  { id: 'SRC-REPOD-CMC-120707', file: 'C12_GNQNNH3MeSO3_gemini_quadruple.txt', md5: '0381371333d3e336202747e5f8291dce' },
];

const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
const outputRows = [[
  'source_id', 'source_file', 'source_line_number', 'source_index',
  'concentration_value', 'concentration_unit', 'volume_value', 'volume_unit',
  'reported_signal_name', 'reported_signal_value', 'reported_signal_unit',
  'temperature_c', 'cell_constant', 'replicate_id', 'uncertainty',
].map(csvCell).join(',')];

for (const source of sources) {
  const bytes = await readFile(join(dataDir, source.file));
  const md5 = createHash('md5').update(bytes).digest('hex');
  if (md5 !== source.md5) throw new Error(`${source.file}: MD5 mismatch (${md5})`);

  let sourceRows = 0;
  const lines = bytes.toString('utf8').split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (!/^\d+\t/.test(lines[lineIndex])) continue;
    const fields = lines[lineIndex].split('\t').filter((value) => value !== '');
    const [sourceIndex, concentration, volume, signal] = fields;
    if (fields.length !== 4 || ![sourceIndex, concentration, volume, signal].every((value) => Number.isFinite(Number(value)))) {
      throw new Error(`${source.file}:${lineIndex + 1}: malformed numeric row`);
    }
    outputRows.push([
      source.id, source.file, lineIndex + 1, sourceIndex,
      concentration, 'mM', volume, 'mL',
      'conductivity (as labeled by source)', signal, 'mS (as labeled by source)',
      '', '', '', '',
    ].map(csvCell).join(','));
    sourceRows += 1;
  }
  if (!sourceRows) throw new Error(`${source.file}: no source rows parsed`);
  console.log(`${source.file}: MD5 verified; ${sourceRows} measurement rows`);
}

await writeFile(join(dataDir, 'repod_cmc_measurements.csv'), `${outputRows.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outputRows.length - 1} normalized rows with source-line references.`);
