import fs from 'fs';
import path from 'path';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runAndroidNetworkSecurityTestSuite() {
  const results: TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any) {
    results.push({
      group,
      name,
      passed: condition,
      actual,
      expected,
      message: condition ? 'PASSED' : `FAILED (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`
    });
  }

  const rootDir = process.cwd();

  // 1. Check android/app/src/main/AndroidManifest.xml
  const manifestPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const hasCleartext = manifestContent.includes('usesCleartextTraffic="true"');
    assert(
      'A. Release AndroidManifest',
      'Release AndroidManifest does not contain usesCleartextTraffic="true"',
      !hasCleartext,
      hasCleartext ? 'FOUND' : 'NOT_FOUND',
      'NOT_FOUND'
    );
  } else {
    assert(
      'A. Release AndroidManifest',
      'Release AndroidManifest file exists',
      false,
      'FILE_MISSING',
      'EXISTS'
    );
  }

  // 2. Check build scripts for injection of usesCleartextTraffic="true"
  const buildScripts = [
    'scripts/build_release_apk.py',
    'scripts/build-apk.sh',
    'scripts/build-debug-apk.sh',
    'scripts/build_standard_apk.sh'
  ];

  buildScripts.forEach(relScriptPath => {
    const scriptPath = path.join(rootDir, relScriptPath);
    if (fs.existsSync(scriptPath)) {
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      const hasCleartext = scriptContent.includes('usesCleartextTraffic="true"');
      assert(
        'B. Build Scripts',
        `${relScriptPath} does not inject usesCleartextTraffic="true"`,
        !hasCleartext,
        hasCleartext ? 'FOUND' : 'NOT_FOUND',
        'NOT_FOUND'
      );
    }
  });

  // 3. Check capacitor.config.json for HTTPS scheme
  const capConfigPath = path.join(rootDir, 'capacitor.config.json');
  if (fs.existsSync(capConfigPath)) {
    const capConfig = JSON.parse(fs.readFileSync(capConfigPath, 'utf8'));
    const androidScheme = capConfig?.server?.androidScheme;
    assert(
      'C. Capacitor Configuration',
      'Capacitor server.androidScheme is strictly https',
      androidScheme === 'https',
      androidScheme,
      'https'
    );
  } else {
    assert(
      'C. Capacitor Configuration',
      'capacitor.config.json exists',
      false,
      'FILE_MISSING',
      'EXISTS'
    );
  }

  // 4. Check for any network-security-config permitting unrestricted cleartext
  const resDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'xml');
  let hasInsecureXml = false;
  if (fs.existsSync(resDir)) {
    const xmlFiles = fs.readdirSync(resDir).filter(f => f.endsWith('.xml'));
    for (const xf of xmlFiles) {
      const content = fs.readFileSync(path.join(resDir, xf), 'utf8');
      if (content.includes('cleartextTrafficPermitted="true"')) {
        hasInsecureXml = true;
      }
    }
  }
  assert(
    'D. Network Security Config',
    'No network security XML permits unrestricted cleartext traffic',
    !hasInsecureXml,
    hasInsecureXml ? 'INSECURE_CONFIG_FOUND' : 'SECURE',
    'SECURE'
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nAndroid Network Security Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  return {
    passed: passedCount,
    failed: failedCount,
    total: results.length,
    results
  };
}
