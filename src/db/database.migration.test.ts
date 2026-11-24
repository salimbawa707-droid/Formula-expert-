import Dexie from 'dexie';
import { DetergentDatabase } from './database';

const DATABASE_NAME = 'DetergentFormulaExpertDB';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function legacySchema(version: 1 | 2) {
  const stores: Record<string, string> = {
    formulas: 'id, name, category, productType, isFavorite, updatedAt',
    inventory: 'id, name, category, stockKg, updatedAt',
    productionRuns: 'id, batchNumber, formulaId, date, status, createdAt',
    labNotes: 'id, title, date, formulaId, createdAt',
    formulaVersions: 'id, formulaId, versionNumber, timestamp',
    specRecords: 'category, updatedAt',
    userSettings: 'key, updatedAt'
  };
  if (version >= 2) {
    stores.researchedIngredients = 'id, queryName, canonicalName, grade, status, updatedAt';
  }
  return stores;
}

async function seedLegacyDatabase(version: 1 | 2) {
  await Dexie.delete(DATABASE_NAME);
  const legacy = new Dexie(DATABASE_NAME);
  legacy.version(version).stores(legacySchema(version));
  await legacy.open();

  await legacy.table('formulas').add({
    id: `legacy-v${version}-formula`, name: 'Legacy formula', category: 'POWDER',
    targetPH: 10.2, batchSizeKg: 50, ingredients: [], createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  });
  await legacy.table('inventory').add({
    id: `legacy-v${version}-inventory`, name: 'LABSA 90%', category: 'Surfactant',
    stockKg: 12, minStockKg: 2, costPerKg: 75, updatedAt: '2026-01-01T00:00:00.000Z'
  });
  await legacy.table('productionRuns').add({
    id: `legacy-v${version}-run`, batchNumber: 'B-001', formulaName: 'Legacy formula',
    batchSizeKg: 50, date: '2026-01-01', status: 'COMPLETED', createdAt: '2026-01-01T00:00:00.000Z'
  });
  await legacy.table('labNotes').add({
    id: `legacy-v${version}-note`, title: 'Legacy note', text: 'Keep this note',
    date: '2026-01-01', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
  });
  await legacy.table('formulaVersions').add({
    id: `legacy-v${version}-revision`, formulaId: 'f1', formulaName: 'Legacy formula',
    versionNumber: 1, timestamp: '2026-01-01T00:00:00.000Z', ingredients: [], targetPH: 10
  });
  await legacy.table('specRecords').add({ category: 'POWDER', parameters: {}, labRecords: [], updatedAt: '2026-01-01T00:00:00.000Z' });
  await legacy.table('userSettings').add({ key: 'language', value: 'hi', updatedAt: '2026-01-01T00:00:00.000Z' });
  if (version >= 2) {
    await legacy.table('researchedIngredients').add({
      id: 'legacy-v2-research', queryName: 'Sodium citrate dihydrate', canonicalName: 'Sodium citrate dihydrate',
      parameters: { molecularWeight: 294.1 }, provenance: { source: 'legacy-test' },
      sourceIds: ['source-1'], sourceUrls: [], status: 'NEEDS_VERIFICATION',
      requiresUserApproval: true, researchedAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
    });
  }
  legacy.close();
}

async function verifyUpgrade(version: 1 | 2) {
  await seedLegacyDatabase(version);
  const upgraded = new DetergentDatabase();
  await upgraded.open();

  assert((await upgraded.formulas.get(`legacy-v${version}-formula`))?.name === 'Legacy formula', `v${version}: formula preserved`);
  assert((await upgraded.inventory.get(`legacy-v${version}-inventory`))?.stockKg === 12, `v${version}: inventory preserved`);
  assert((await upgraded.productionRuns.get(`legacy-v${version}-run`))?.batchNumber === 'B-001', `v${version}: production run preserved`);
  assert((await upgraded.labNotes.get(`legacy-v${version}-note`))?.text === 'Keep this note', `v${version}: lab note preserved`);
  assert((await upgraded.formulaVersions.get(`legacy-v${version}-revision`))?.versionNumber === 1, `v${version}: formula revision preserved`);
  assert((await upgraded.specRecords.get('POWDER'))?.category === 'POWDER', `v${version}: spec record preserved`);
  assert((await upgraded.userSettings.get('language'))?.value === 'hi', `v${version}: user setting preserved`);
  assert(await upgraded.documents.count() === 0, `v${version}: new documents store created empty`);

  if (version === 2) {
    assert((await upgraded.researchedIngredients.get('legacy-v2-research'))?.requiresUserApproval === true, 'v2: researched ingredient preserved');
  }

  const blob = new Blob(['PDF test payload'], { type: 'application/pdf' });
  await upgraded.documents.add({
    id: `doc-from-v${version}`, title: 'Migration attachment check', documentType: 'SDS',
    reviewStatus: 'UNREVIEWED', fileName: 'test.pdf', mimeType: 'application/pdf',
    fileSizeBytes: blob.size, attachment: blob,
    createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z'
  });
  upgraded.close();

  const reopened = new DetergentDatabase();
  await reopened.open();
  const savedDocument = await reopened.documents.get(`doc-from-v${version}`);
  assert(savedDocument?.attachment instanceof Blob, `v${version}: attachment Blob survives close/reopen`);
  assert(await savedDocument!.attachment!.text() === 'PDF test payload', `v${version}: attachment bytes survive close/reopen`);
  assert((await reopened.formulas.get(`legacy-v${version}-formula`))?.name === 'Legacy formula', `v${version}: legacy formula survives reopen`);
  reopened.close();
  await Dexie.delete(DATABASE_NAME);
  console.log(`PASS: IndexedDB v${version} -> v3 upgrade, legacy records, document Blob CRUD and reopen persistence`);
}

async function main() {
  assert(typeof globalThis.indexedDB !== 'undefined', 'Node runtime must provide native IndexedDB');
  assert(typeof globalThis.IDBKeyRange !== 'undefined', 'Node runtime must provide IDBKeyRange');
  await verifyUpgrade(1);
  await verifyUpgrade(2);
  console.log('PASS: all Dexie migration regression checks');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
