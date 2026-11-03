import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const buildOutputs = [
  'dist',
  'dist-server',
  'android/app/src/main/assets/public',
];

for (const output of buildOutputs) {
  rmSync(resolve(projectRoot, output), { force: true, recursive: true });
}
