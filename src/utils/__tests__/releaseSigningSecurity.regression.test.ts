import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runReleaseSigningSecurityTestSuite() {
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

  const scriptsDir = path.join(process.cwd(), 'scripts');
  const releaseScriptPath = path.join(scriptsDir, 'build_release_apk.py');
  const releaseScriptContent = fs.existsSync(releaseScriptPath) ? fs.readFileSync(releaseScriptPath, 'utf8') : '';

  // A. Release scripts require external signing variables
  const requiresExternalSigningVars = (
    releaseScriptContent.includes('KEYSTORE_PATH') &&
    releaseScriptContent.includes('KEYSTORE_STORE_PASS') &&
    releaseScriptContent.includes('KEYSTORE_KEY_PASS')
  );
  assert(
    'A. External Signing Variables',
    'Release build pipeline requires KEYSTORE_PATH, KEYSTORE_STORE_PASS, and KEYSTORE_KEY_PASS from environment',
    requiresExternalSigningVars,
    requiresExternalSigningVars,
    true
  );

  // B. No release script generates a private key
  const scriptFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.py') || f.endsWith('.sh') || f.endsWith('.cjs') || f.endsWith('.ts'));
  const allScriptContents = scriptFiles.map(f => ({ name: f, content: fs.readFileSync(path.join(scriptsDir, f), 'utf8') }));
  
  const keyGenViolations = allScriptContents.filter(s => {
    return (
      s.content.includes('generateKeyPairSync') ||
      s.content.includes('generateKeyPair') ||
      s.content.includes('openssl genrsa') ||
      s.content.includes('openssl genpkey')
    );
  }).map(s => s.name);

  assert(
    'B. No Private Key Generation',
    'Zero build or release scripts generate private keys',
    keyGenViolations.length === 0,
    keyGenViolations,
    []
  );

  // C. No release script generates a keystore
  const keystoreGenViolations = allScriptContents.filter(s => {
    return (
      s.content.includes('keytool -genkey') ||
      s.content.includes('keytool -genkeypair')
    );
  }).map(s => s.name);

  assert(
    'C. No Keystore Generation',
    'Zero build or release scripts auto-generate release keystores',
    keystoreGenViolations.length === 0,
    keystoreGenViolations,
    []
  );

  // D. No release script uses hardcoded signing passwords
  const hardcodedPasswordViolations = allScriptContents.filter(s => {
    return (
      s.content.includes('pass:detergent2026') ||
      s.content.includes('detergent2026') ||
      s.content.includes('pass:password123') ||
      s.content.includes('pass:android')
    );
  }).map(s => s.name);

  assert(
    'D. No Hardcoded Passwords',
    'Zero scripts contain hardcoded release signing credentials or default passwords',
    hardcodedPasswordViolations.length === 0,
    hardcodedPasswordViolations,
    []
  );

  // E. Custom sign_apk.cjs is not part of the authoritative release path
  const usesCustomSigner = releaseScriptContent.includes('sign_apk.cjs') || releaseScriptContent.includes('sign_apk');
  const signApkExists = fs.existsSync(path.join(scriptsDir, 'sign_apk.cjs'));

  assert(
    'E. Authoritative Standard Signing Only',
    'Authoritative release pipeline relies exclusively on standard Gradle / apksigner, not custom sign_apk.cjs',
    !usesCustomSigner && !signApkExists,
    { usesCustomSigner, signApkExists },
    { usesCustomSigner: false, signApkExists: false }
  );

  // F. Failed build/signing cannot result in success (Fail Closed)
  let missingCredentialsExitsNonZero = false;
  try {
    execSync(`python3 "${releaseScriptPath}"`, {
      env: {
        PATH: process.env.PATH || '',
        // Exclude signing credentials to verify failure exit
      },
      stdio: 'pipe'
    });
  } catch (e: any) {
    if (e.status !== 0) {
      missingCredentialsExitsNonZero = true;
    }
  }

  assert(
    'F. Fail-Closed Release Execution',
    'Release build execution fails with non-zero exit code when required tooling/credentials are unavailable',
    missingCredentialsExitsNonZero,
    missingCredentialsExitsNonZero,
    true
  );

  // G. Distributable release APK path is release-artifacts/detergent-formula-expert-release.apk
  const specifiesCorrectArtifactPath = (
    releaseScriptContent.includes('release-artifacts') &&
    releaseScriptContent.includes('detergent-formula-expert-release.apk')
  );

  assert(
    'G. Distributable Artifact Path',
    'Release APK output target is strictly release-artifacts/detergent-formula-expert-release.apk',
    specifiesCorrectArtifactPath,
    specifiesCorrectArtifactPath,
    true
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nRelease Signing Security Suite: ${passed}/${results.length} PASSED (${failed} FAILED)`);

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}
