/**
 * Bump @openenvx/html-studio, @openenvx/email-studio, and @openenvx/canvas-studio
 * to the same version, verify tarballs, and publish to npmjs.
 *
 * Usage (owner only — do not run from agents):
 *   bun run release:studios              # patch bump + verify + publish
 *   bun run release:studios -- minor
 *   bun run release:studios -- 0.2.0
 *   bun run version:studios -- patch     # bump only, no publish
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { $ } from 'bun';

const repoRoot = path.resolve(import.meta.dirname, '..');

const STUDIO_PACKAGES = new Set([
  '@openenvx/html-studio',
  '@openenvx/email-studio',
  '@openenvx/canvas-studio',
]);

interface ReleaseEntry {
  name: string;
  dir: string;
}

function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseArgs(argv: string[]): { bump: string; bumpOnly: boolean } {
  let bumpOnly = false;
  const positional: string[] = [];

  for (const arg of argv) {
    if (arg === '--bump-only') {
      bumpOnly = true;
    } else if (arg === '--') {
      continue;
    } else {
      positional.push(arg);
    }
  }

  const bump = positional[0] ?? 'patch';
  return { bump, bumpOnly };
}

function bumpSemver(version: string, bump: string): string {
  if (/^\d+\.\d+\.\d+$/.test(bump)) {
    return bump;
  }

  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    fail(`Invalid current version: ${version}`);
  }

  const [major, minor, patch] = parts;
  switch (bump) {
    case 'patch': {
      return `${major}.${minor}.${patch + 1}`;
    }
    case 'minor': {
      return `${major}.${minor + 1}.0`;
    }
    case 'major': {
      return `${major + 1}.0.0`;
    }
    default: {
      fail(
        `Use patch, minor, major, or an explicit version (e.g. 0.2.0). Got: ${bump}`
      );
    }
  }
}

async function loadStudios(): Promise<ReleaseEntry[]> {
  const configPath = path.join(repoRoot, 'release.config.json');
  const config = JSON.parse(await readFile(configPath, 'utf-8')) as {
    publish?: ReleaseEntry[];
  };
  const studios = (config.publish ?? []).filter((entry) =>
    STUDIO_PACKAGES.has(entry.name)
  );

  if (studios.length !== STUDIO_PACKAGES.size) {
    fail(
      `release.config.json must list all studio packages: ${[...STUDIO_PACKAGES].join(', ')}`
    );
  }

  return studios;
}

async function bumpStudios(
  studios: ReleaseEntry[],
  newVersion: string
): Promise<void> {
  const versions = await Promise.all(
    studios.map(async (studio) => {
      const pkgPath = path.join(repoRoot, studio.dir, 'package.json');
      const pkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as {
        version: string;
      };
      return { studio, pkgPath, version: pkg.version };
    })
  );

  const baseline = versions[0]?.version;
  if (!baseline) {
    fail('No studio packages found');
  }

  for (const { studio, version } of versions) {
    if (version !== baseline) {
      fail(
        `Version mismatch before bump: ${studio.name} is ${version}, expected ${baseline}`
      );
    }
  }

  for (const { studio, pkgPath } of versions) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as Record<
      string,
      unknown
    >;
    pkg.version = newVersion;
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log(`bumped ${studio.name} → ${newVersion}`);
  }
}

async function verifyStudios(): Promise<void> {
  await $`bun run verify-pack:html-studio`.cwd(repoRoot);
  await $`bun run verify-pack:email-studio`.cwd(repoRoot);
  await $`bun run verify-pack:canvas-studio`.cwd(repoRoot);
}

async function publishStudios(studios: ReleaseEntry[]): Promise<void> {
  const publishScript = path.join(repoRoot, 'scripts/publish-npm-public.ts');
  for (const studio of studios) {
    await $`bun ${publishScript} ${studio.dir}`.cwd(repoRoot);
    console.log(`published ${studio.name}`);
  }
}

const { bump, bumpOnly } = parseArgs(process.argv.slice(2));
const studios = await loadStudios();
const currentVersion = JSON.parse(
  await readFile(path.join(repoRoot, studios[0].dir, 'package.json'), 'utf-8')
) as { version: string };
const newVersion = bumpSemver(currentVersion.version, bump);

console.log(
  `Studio release: ${currentVersion.version} → ${newVersion}${bumpOnly ? ' (bump only)' : ''}`
);

await bumpStudios(studios, newVersion);

if (bumpOnly) {
  console.log(
    '\nVersion bump complete. Publish with: bun run publish-studio-packages'
  );
  process.exit(0);
}

console.log('\nBuilding and verifying tarballs...');
await verifyStudios();

console.log('\nPublishing to npm...');
await publishStudios(studios);

console.log(`\nDone. Released @openenvx/* studio packages at ${newVersion}`);
