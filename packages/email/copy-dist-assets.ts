import { mkdir, cp } from 'node:fs/promises';
import path from 'node:path';

import { $ } from 'bun';

const emailRoot = import.meta.dirname;
const packagesRoot = path.resolve(emailRoot, '..');
const distRoot = path.join(emailRoot, 'dist');

async function rsyncCss(fromSrc: string, toDist: string) {
  await mkdir(toDist, { recursive: true });
  await $`rsync -a --include='*/' --include='*.css' --exclude='*' ${fromSrc}/ ${toDist}/`;
}

await rsyncCss(
  path.join(packagesRoot, 'workbench/src'),
  path.join(distRoot, 'workbench')
);
await rsyncCss(
  path.join(packagesRoot, 'html/src'),
  path.join(distRoot, 'html')
);
await rsyncCss(
  path.join(packagesRoot, 'driver-email/src'),
  path.join(distRoot, 'driver-email')
);

const themeDest = path.join(distRoot, 'theme');
await mkdir(themeDest, { recursive: true });
await cp(
  path.join(packagesRoot, 'workbench/src/theme/tokens.css'),
  path.join(themeDest, 'tokens.css')
);

// Published theme — bundle imports ./theme.css; export ./theme.css → dist/index.css.
const publishedTheme = `@import './theme/tokens.css';
`;

await Bun.write(path.join(distRoot, 'theme.css'), publishedTheme);
await Bun.write(path.join(distRoot, 'index.css'), publishedTheme);
