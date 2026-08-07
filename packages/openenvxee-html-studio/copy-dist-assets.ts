import { existsSync } from 'node:fs';
import { mkdir, readdir, cp } from 'node:fs/promises';
import path from 'node:path';

import { $ } from 'bun';

const studioRoot = import.meta.dirname;
const packagesRoot = path.resolve(studioRoot, '..');
const distRoot = path.join(studioRoot, 'dist');

/**
 * Copy CSS only into packages the JS build already emitted.
 * Paths stay `dist/<pkg>/src/...` so preserveModules imports resolve.
 */
const entries = await readdir(distRoot, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isDirectory() || entry.name === 'theme') {
    continue;
  }
  const srcDir = path.join(packagesRoot, entry.name, 'src');
  const destDir = path.join(distRoot, entry.name, 'src');
  if (!existsSync(srcDir)) {
    continue;
  }
  await mkdir(destDir, { recursive: true });
  await $`rsync -a --include='*/' --include='*.css' --exclude='*' ${srcDir}/ ${destDir}/`;
}

// Stable theme.css export path (same as canvas studio).
const themeDest = path.join(distRoot, 'theme');
await mkdir(themeDest, { recursive: true });
await cp(
  path.join(packagesRoot, 'workbench/src/theme/tokens.css'),
  path.join(themeDest, 'tokens.css')
);
