import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const androidDir = fileURLToPath(new URL('../android/', import.meta.url));
const isWindows = process.platform === 'win32';
const wrapper = isWindows ? 'gradlew.bat' : './gradlew';
const result = spawnSync(wrapper, ['--no-daemon', 'assembleDebug'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWindows,
});

if (result.error) {
  console.error('Could not start the Android Gradle wrapper:', result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
