import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function parseCsv(text: string): string[][] {
  return text.trim().split(/\r?\n/).map(line => {
    const fields: string[] = [];
    let value = '', quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { value += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === ',' && !quoted) { fields.push(value); value = ''; }
      else value += ch;
    }
    fields.push(value);
    return fields;
  });
}
const raw = parseCsv(readFileSync('evidence_vault/open_reference_benchmarks/cmc_mixed/p2surf_binary_mixture_cmc.csv', 'utf8'));
const audit = parseCsv(readFileSync('evidence_vault/datasets/p2surf_pair_grouping_audit.csv', 'utf8'));
const rawHeader = raw[0], auditHeader = audit[0];
const ri = Object.fromEntries(rawHeader.map((v, i) => [v, i]));
const ai = Object.fromEntries(auditHeader.map((v, i) => [v, i]));
const rows = raw.slice(1), mapped = audit.slice(1);
assert.equal(rows.length, 979, 'P2SURF source row count must remain unchanged');
assert.equal(mapped.length, rows.length, 'every source row must have one lineage-preserving grouping row');
assert.equal(new Set(mapped.map(row => row[ai.source_line])).size, 979, 'source line numbers must be unique');
assert.equal(mapped[0][ai.source_line], '2');
assert.equal(mapped[mapped.length - 1]?.[ai.source_line], '980');
const pairIds = new Set(mapped.map(row => row[ai.pair_group_id]));
assert.equal(pairIds.size, 522, 'unordered SMILES pair count must be reproducible');
const compositionKeys = mapped.map(row => [row[ai.pair_group_id], row[ai.canonical_fraction_a], row[ai.canonical_fraction_b]].join('|'));
assert.equal(new Set(compositionKeys).size, 959, 'canonical pair/composition groups must be reproducible');
const occurrenceCounts = new Map<string, number>();
for (const key of compositionKeys) occurrenceCounts.set(key, (occurrenceCounts.get(key) || 0) + 1);
assert.equal([...occurrenceCounts.values()].filter(count => count > 1).length, 20, 'repeated composition groups must remain visible');
assert.equal([...occurrenceCounts.values()].reduce((sum, count) => sum + count - 1, 0), 20, 'no repeated source rows may be silently deduplicated');
assert(mapped.every(row => Math.abs(Number(row[ai.source_fraction_sum]) - 1) <= 0.0010001), 'all source fraction sums must remain within source rounding tolerance');
assert(mapped.every(row => row[ai.fraction_sum_status] === 'ROUNDED_SUM_WITHIN_0.001'));
assert.equal(mapped.filter(row => row[ai.pair_composition_duplicate_flag] === 'REPEATED_PAIR_COMPOSITION').length, 40);
console.log('P2SURF PAIR GROUPING AUDIT PASS');
console.log(JSON.stringify({ sourceRows: rows.length, unorderedPairs: pairIds.size, uniquePairCompositionGroups: new Set(compositionKeys).size, repeatedGroups: 20, repeatedExtraRows: 20 }, null, 2));
