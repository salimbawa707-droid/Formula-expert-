import { validateActiveMatterInput } from '../activeMatterInputGuard';
import { ActiveMatterEngine } from '../activeMatterEngine';

export function runActiveMatterInputGuardTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  details: string[];
} {
  let passed = 0;
  let failed = 0;
  const details: string[] = [];

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      passed++;
      details.push(`[PASS] ${name}`);
    } else {
      failed++;
      details.push(`[FAIL] ${name}: ${message || 'Assertion failed'}`);
    }
  }

  const sourceBacked = ActiveMatterEngine.resolveIngredientActive({
    name: 'Unlisted Test Surfactant',
    category: 'Anionic Surfactant',
    activeMatterPct: 72,
    activeMatterInputSource: 'SOURCE_BACKED',
    activeMatterEvidenceId: 'manufacturer-tds-72',
    activeMatterEvidenceUrl: 'https://manufacturer.example/tds',
    activeMatterEvidenceSourceType: 'MANUFACTURER_TDS',
    provenance: {
      sourceType: 'OFFICIAL_MANUFACTURER',
      source: 'Manufacturer',
      sourceUrl: 'https://manufacturer.example/tds',
      verificationStatus: 'VERIFIED'
    }
  });
  assert('Verified property-level manufacturer assay is authoritative', sourceBacked.dataSource === 'authoritative' && sourceBacked.activeMatterPct === 72);

  const forgedSourceBacked = ActiveMatterEngine.resolveIngredientActive({
    name: 'Unlisted Test Surfactant',
    category: 'Anionic Surfactant',
    activeMatterPct: 72,
    activeMatterInputSource: 'SOURCE_BACKED',
    activeMatterEvidenceId: 'missing-proof'
  });
  assert('SOURCE_BACKED flag without evidence metadata is rejected', forgedSourceBacked.dataSource === 'missing' && forgedSourceBacked.activeMatterPct === null);

  const catalogDefault = ActiveMatterEngine.resolveIngredientActive({
    name: 'LABSA 90% (Acid Slurry)',
    category: 'Anionic Surfactant',
    activeMatterPct: 90,
    activeMatterInputSource: 'CATALOG_DEFAULT'
  });
  assert('Catalog active matter remains a non-authoritative default', catalogDefault.dataSource === 'canonical_library_default');

  // Valid values
  assert('Validate 50% is VALID', validateActiveMatterInput(50).status === 'VALID' && validateActiveMatterInput(50).value === 50);
  assert('Validate 100% is VALID', validateActiveMatterInput(100).status === 'VALID');
  assert('Validate 0% is VALID', validateActiveMatterInput(0).status === 'VALID');
  assert('Validate 0.1% is VALID', validateActiveMatterInput(0.1).status === 'VALID');

  // Missing / null / undefined
  assert('Reject null active matter', validateActiveMatterInput(null).status === 'INSUFFICIENT_DATA');
  assert('Reject undefined active matter', validateActiveMatterInput(undefined).status === 'INSUFFICIENT_DATA');

  // Non-numeric
  assert('Reject string active matter', validateActiveMatterInput('50').status === 'INSUFFICIENT_DATA');
  assert('Reject object active matter', validateActiveMatterInput({}).status === 'INSUFFICIENT_DATA');

  // NaN and Infinity
  assert('Reject NaN active matter', validateActiveMatterInput(NaN).status === 'INSUFFICIENT_DATA');
  assert('Reject Infinity active matter', validateActiveMatterInput(Infinity).status === 'INSUFFICIENT_DATA');

  // Negative and > 100
  assert('Reject negative active matter', validateActiveMatterInput(-1).status === 'INSUFFICIENT_DATA');
  assert('Reject >100% active matter', validateActiveMatterInput(100.1).status === 'INSUFFICIENT_DATA');

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

const _res = runActiveMatterInputGuardTestSuite();
if (_res.failed > 0) {
  throw new Error(`activeMatterInputGuard.test failed: ${_res.details.filter(d => d.startsWith('[FAIL]')).join('; ')}`);
}
