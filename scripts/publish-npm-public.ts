/**
 * Publish a workspace package to npmjs with public access.
 * Packs with bun, then publishes the tarball with `bun publish --access=public`
 * (works for first-time scoped packages; plain `bun publish` in-package 404s).
 *
 * Usage: bun scripts/publish-npm-public.ts packages/html-studio
 */
import { access, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { $ } from 'bun';

const packageDir = process.argv[2];
if (!packageDir) {
  console.error('Usage: bun scripts/publish-npm-public.ts <package-dir>');
  process.exit(1);
}

const packageRoot = path.resolve(import.meta.dirname, '..', packageDir);

await $`bun pm pack --ignore-scripts`.cwd(packageRoot);
const packed = await readdir(packageRoot);
const tgz = packed
  .filter((name) => name.endsWith('.tgz'))
  .toSorted()
  .at(-1);

if (!tgz) {
  console.error('ERROR: bun pm pack did not produce a tarball');
  process.exit(1);
}

const tgzPath = path.join(packageRoot, tgz);
try {
  await access(tgzPath);
} catch {
  console.error(`ERROR: tarball missing after pack: ${tgzPath}`);
  process.exit(1);
}

const publish = Bun.spawn(['bun', 'publish', '--access=public', tgzPath], {
  cwd: packageRoot,
  stdout: 'inherit',
  stderr: 'inherit',
});
const exitCode = await publish.exited;
if (exitCode !== 0) {
  process.exit(exitCode);
}

await rm(tgzPath);

console.log(`published ${tgz} to npmjs (public)`);
