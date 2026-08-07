/**
 * Publish @xmazu/openenvxee-html-studio as a debug prerelease with sourcemaps.
 * Version becomes `${base}-debug.${N}` and is tagged `debug` on the registry.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { $ } from 'bun';

const studioRoot = import.meta.dirname;
const packageJsonPath = path.join(studioRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
  name: string;
  version: string;
};

const baseVersion = packageJson.version.replace(/-debug\.\d+$/, '');
const packageName = packageJson.name;

async function nextDebugN(): Promise<number> {
  try {
    const result =
      await $`npm view ${packageName} versions --json --registry https://npm.pkg.github.com`
        .quiet()
        .nothrow();
    if (result.exitCode !== 0) {
      return 0;
    }
    const raw = result.stdout.toString().trim();
    if (!raw) {
      return 0;
    }
    const parsed: unknown = JSON.parse(raw);
    const versions = Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : typeof parsed === 'string'
        ? [parsed]
        : [];
    const prefix = `${baseVersion}-debug.`;
    let max = -1;
    for (const version of versions) {
      if (!version.startsWith(prefix)) {
        continue;
      }
      const n = Number(version.slice(prefix.length));
      if (Number.isInteger(n) && n > max) {
        max = n;
      }
    }
    return max + 1;
  } catch {
    return 0;
  }
}

const debugN = await nextDebugN();
const debugVersion = `${baseVersion}-debug.${debugN}`;
const original = readFileSync(packageJsonPath, 'utf-8');

try {
  packageJson.version = debugVersion;
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  await $`bun run build:debug`.cwd(studioRoot);
  await $`npm pack --ignore-scripts`.cwd(studioRoot);

  const tgz = await $`ls -t *.tgz | head -1`
    .cwd(studioRoot)
    .text()
    .then((s) => s.trim());
  if (!tgz) {
    throw new Error('No tarball produced by npm pack');
  }

  await $`npm publish ${tgz} --access restricted --tag debug`.cwd(studioRoot);
  await $`rm -f ${tgz}`.cwd(studioRoot);

  console.log(`Published ${packageName}@${debugVersion} (tag: debug)`);
} finally {
  writeFileSync(packageJsonPath, original);
}
