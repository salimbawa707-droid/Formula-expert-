/**
 * ============================================================================
 * P0 REMEDIATION #9 DEDICATED REGRESSION TEST SUITE —
 * REPAIR INCOMPLETE ANDROID CAPACITOR PROJECT INTEGRITY (30 TESTS)
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export interface TestSuiteSummary {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
}

export function runP0RemediationAndroidProjectIntegrityTestSuite(): TestSuiteSummary {
  const results: TestResult[] = [];

  const assert = (group: string, name: string, condition: boolean, actual?: any, expected?: any) => {
    results.push({
      group,
      name,
      passed: condition,
      actual: actual !== undefined ? actual : condition ? 'MATCH' : 'MISMATCH',
      expected: expected !== undefined ? expected : 'MATCH',
      message: condition ? 'PASSED' : `FAILED: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    });
  };

  const rootDir = process.cwd();
  const androidDir = path.join(rootDir, 'android');

  // 1. Android directory exists
  assert('1. Directory', '1. Android directory exists', fs.existsSync(androidDir));

  // 2. android/settings.gradle exists
  const settingsPath = path.join(androidDir, 'settings.gradle');
  assert('1. Directory', '2. android/settings.gradle exists', fs.existsSync(settingsPath));

  // 3. android/build.gradle exists
  const rootBuildGradlePath = path.join(androidDir, 'build.gradle');
  assert('1. Directory', '3. android/build.gradle exists', fs.existsSync(rootBuildGradlePath));

  // 4. android/app/build.gradle exists
  const appBuildGradlePath = path.join(androidDir, 'app', 'build.gradle');
  assert('1. Directory', '4. android/app/build.gradle exists', fs.existsSync(appBuildGradlePath));

  // 5. android/gradlew exists
  const gradlewPath = path.join(androidDir, 'gradlew');
  assert('2. Gradle Wrapper', '5. android/gradlew exists', fs.existsSync(gradlewPath));

  // 6. android/gradlew.bat exists
  const gradlewBatPath = path.join(androidDir, 'gradlew.bat');
  assert('2. Gradle Wrapper', '6. android/gradlew.bat exists', fs.existsSync(gradlewBatPath));

  // 7. Gradle wrapper properties exist
  const wrapperPropsPath = path.join(androidDir, 'gradle', 'wrapper', 'gradle-wrapper.properties');
  assert('2. Gradle Wrapper', '7. Gradle wrapper properties exist', fs.existsSync(wrapperPropsPath));

  // 8. Gradle wrapper JAR exists
  const wrapperJarPath = path.join(androidDir, 'gradle', 'wrapper', 'gradle-wrapper.jar');
  assert('2. Gradle Wrapper', '8. Gradle wrapper JAR exists', fs.existsSync(wrapperJarPath) && fs.statSync(wrapperJarPath).size > 1000);

  // 9. app module is included in settings.gradle
  const settingsContent = fs.existsSync(settingsPath) ? fs.readFileSync(settingsPath, 'utf8') : '';
  assert('3. Project Architecture', '9. app module is included', settingsContent.includes("include ':app'"));

  // 10. MainActivity exists
  const mainActivityPath = path.join(androidDir, 'app', 'src', 'main', 'java', 'com', 'detergentrnd', 'formulaexpert', 'MainActivity.java');
  assert('3. Project Architecture', '10. MainActivity exists', fs.existsSync(mainActivityPath));

  // 11. MainActivity uses BridgeActivity
  const mainActivityContent = fs.existsSync(mainActivityPath) ? fs.readFileSync(mainActivityPath, 'utf8') : '';
  assert('3. Project Architecture', '11. MainActivity uses BridgeActivity', mainActivityContent.includes('extends BridgeActivity') && mainActivityContent.includes('import com.getcapacitor.BridgeActivity;'));

  // 12. Capacitor Android dependency is declared
  const appGradleContent = fs.existsSync(appBuildGradlePath) ? fs.readFileSync(appBuildGradlePath, 'utf8') : '';
  assert('3. Project Architecture', '12. Capacitor Android dependency is declared', appGradleContent.includes("project(':capacitor-android')"));

  // 13. AndroidManifest exists
  const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
  assert('4. Manifest & Resources', '13. AndroidManifest exists', fs.existsSync(manifestPath));

  // 14. Manifest launcher icon references resolve to real resources
  const manifestContent = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '';
  const hasIconRef = manifestContent.includes('@mipmap/ic_launcher') && manifestContent.includes('@mipmap/ic_launcher_round');
  const iconHdpi = path.join(androidDir, 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher.png');
  const iconRoundHdpi = path.join(androidDir, 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher_round.png');
  assert('4. Manifest & Resources', '14. Manifest launcher icon references resolve to real resources', hasIconRef && fs.existsSync(iconHdpi) && fs.existsSync(iconRoundHdpi));

  // 15. applicationId is present
  assert('5. Configuration Parameters', '15. applicationId is present', appGradleContent.includes('applicationId "com.detergentrnd.formulaexpert"'));

  // 16. namespace is present
  assert('5. Configuration Parameters', '16. namespace is present', appGradleContent.includes('namespace "com.detergentrnd.formulaexpert"'));

  // 17. compileSdk is present
  const varsPath = path.join(androidDir, 'variables.gradle');
  const varsContent = fs.existsSync(varsPath) ? fs.readFileSync(varsPath, 'utf8') : '';
  assert('5. Configuration Parameters', '17. compileSdk is present', varsContent.includes('compileSdkVersion = 34') || appGradleContent.includes('compileSdk'));

  // 18. targetSdk is present
  assert('5. Configuration Parameters', '18. targetSdk is present', varsContent.includes('targetSdkVersion = 34') || appGradleContent.includes('targetSdk'));

  // 19. minSdk is present
  assert('5. Configuration Parameters', '19. minSdk is present', varsContent.includes('minSdkVersion = 22') || appGradleContent.includes('minSdk'));

  // 20. versionCode is present
  assert('5. Configuration Parameters', '20. versionCode is present', appGradleContent.includes('versionCode 10000'));

  // 21. versionName is present
  assert('5. Configuration Parameters', '21. versionName is present', appGradleContent.includes('versionName "1.0.0"'));

  // 22. capacitor.config exists
  const capConfigPath = path.join(rootDir, 'capacitor.config.json');
  assert('6. Capacitor Configuration', '22. capacitor.config exists', fs.existsSync(capConfigPath));

  // 23. webDir is valid
  const capConfigContent = fs.existsSync(capConfigPath) ? fs.readFileSync(capConfigPath, 'utf8') : '';
  let capObj: any = {};
  try { capObj = JSON.parse(capConfigContent); } catch {}
  assert('6. Capacitor Configuration', '23. webDir is valid', capObj.webDir === 'dist');

  // 24. No cleartext HTTP configuration is introduced
  const hasCleartext = manifestContent.includes('usesCleartextTraffic="true"');
  assert('7. Security Governance', '24. No cleartext HTTP configuration is introduced', !hasCleartext);

  // 25. No signing password exists in source
  const hasHardcodedStorePass = appGradleContent.includes('storePassword "') || appGradleContent.includes("storePassword '");
  assert('7. Security Governance', '25. No signing password exists in source', !hasHardcodedStorePass);

  // 26. No private key exists in source
  const keystoreInAndroid = fs.readdirSync(androidDir).filter(f => f.endsWith('.jks') || f.endsWith('.keystore'));
  assert('7. Security Governance', '26. No private key exists in source', keystoreInAndroid.length === 0);

  // 27. No fake APK generation exists
  const buildPyPath = path.join(rootDir, 'scripts', 'build_release_apk.py');
  const buildPyContent = fs.existsSync(buildPyPath) ? fs.readFileSync(buildPyPath, 'utf8') : '';
  const createsFakeApk = buildPyContent.includes('open(') && buildPyContent.includes('.apk') && buildPyContent.includes('wb');
  assert('8. Build Pipeline Integrity', '27. No fake APK generation exists', !createsFakeApk);

  // 28. Release build script invokes the real Gradle wrapper
  assert('8. Build Pipeline Integrity', '28. Release build script invokes the real Gradle wrapper', buildPyContent.includes('./gradlew') || buildPyContent.includes('gradle'));

  // 29. Release artifact path is correct
  assert('8. Build Pipeline Integrity', '29. Release artifact path is correct', buildPyContent.includes('release-artifacts/detergent-formula-expert-release.apk') || buildPyContent.includes('detergent-formula-expert-release.apk'));

  // 30. APK verification is fail-closed
  assert('8. Build Pipeline Integrity', '30. APK verification is fail-closed', buildPyContent.includes('check_environment') && buildPyContent.includes('RELEASE BUILD BLOCKED'));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}
