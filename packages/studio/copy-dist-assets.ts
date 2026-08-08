import { mkdir, cp } from 'node:fs/promises';
import path from 'node:path';

import { $ } from 'bun';

const studioRoot = import.meta.dirname;
const packagesRoot = path.resolve(studioRoot, '..');
const distRoot = path.join(studioRoot, 'dist');

async function rsyncCss(fromSrc: string, toDist: string) {
  await mkdir(toDist, { recursive: true });
  await $`rsync -a --include='*/' --include='*.css' --exclude='*' ${fromSrc}/ ${toDist}/`;
}

await rsyncCss(
  path.join(packagesRoot, 'workbench/src'),
  path.join(distRoot, 'workbench')
);
await rsyncCss(
  path.join(packagesRoot, 'canvas/src'),
  path.join(distRoot, 'canvas')
);
await rsyncCss(
  path.join(packagesRoot, 'agent/src'),
  path.join(distRoot, 'agent')
);

const themeDest = path.join(distRoot, 'theme');
await mkdir(themeDest, { recursive: true });
await cp(
  path.join(packagesRoot, 'workbench/src/theme/tokens.css'),
  path.join(themeDest, 'tokens.css')
);

const fontsDest = path.join(distRoot, 'fonts');
await mkdir(fontsDest, { recursive: true });
await cp(
  path.join(packagesRoot, 'canvas/src/fonts/fonts.css'),
  path.join(fontsDest, 'fonts.css')
);
await cp(
  path.join(packagesRoot, 'canvas/src/fonts/fonts.css'),
  path.join(distRoot, 'fonts.css')
);
