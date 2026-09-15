import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { $ } from 'bun';

/**
 * @param {string} message
 * @returns {never}
 */
export function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

/**
 * @param {string} distRoot
 * @param {string} file
 * @returns {Promise<string>}
 */
export async function readDist(distRoot, file) {
  return readFile(path.join(distRoot, file), 'utf-8');
}

/**
 * @param {string} listing
 */
export function assertNoSourcemaps(listing) {
  if (listing.split('\n').some((line) => line.endsWith('.map'))) {
    fail('release tarball must not include sourcemaps');
  }
}

/**
 * @param {object} pkg
 * @param {string} [exportKey]
 */
export function assertDistExport(pkg, exportKey = '.') {
  const publishedExports = pkg.publishConfig?.exports ?? pkg.exports;
  const exp = publishedExports?.[exportKey];
  const def = typeof exp === 'string' ? exp : exp?.default;
  if (!def?.includes('dist/')) {
    fail(`published export must point at dist, got: ${JSON.stringify(exp)}`);
  }
  return def;
}

/**
 * @param {string} packageRoot
 * @returns {Promise<{ tgz: string, listing: string, pkgJson: string, pkg: object }>}
 */
export async function packTarball(packageRoot) {
  await $`bun pm pack --ignore-scripts`.cwd(packageRoot);
  const packed = await readdir(packageRoot);
  const tgz = packed
    .filter((name) => name.endsWith('.tgz'))
    .toSorted()
    .at(-1);
  if (!tgz) {
    fail('bun pm pack did not produce a tarball');
  }

  const tgzPath = path.join(packageRoot, tgz);
  const listing = await $`tar -tzf ${tgzPath}`.text();
  const pkgJson = await $`tar -xOf ${tgzPath} package/package.json`.text();
  await rm(tgzPath);

  const pkg = JSON.parse(pkgJson);
  return { tgz, listing, pkgJson, pkg };
}

/**
 * @typedef {object} DistCheck
 * @property {string} file
 * @property {(content: string) => boolean} [assert]
 * @property {string} [message]
 * @property {string[]} [includes]
 * @property {number} [maxLines]
 * @property {RegExp} [mustNotMatch]
 */

/**
 * @param {object} options
 * @param {string} [options.packageRoot]
 * @param {string} options.packageLabel
 * @param {DistCheck[]} [options.distChecks]
 * @param {() => void | Promise<void>} [options.beforePack]
 * @param {string[]} [options.requiredTarballPaths]
 * @param {RegExp[]} [options.forbidTarballPatterns]
 * @param {boolean} [options.forbidSourcemaps]
 * @param {(ctx: { listing: string, pkg: object, tgz: string }) => void | Promise<void>} [options.afterPack]
 */
export function createVerifyPack(options) {
  const packageRoot =
    options.packageRoot ??
    path.dirname(fileURLToPath(`${import.meta.url}/../..`));
  const distRoot = path.join(packageRoot, 'dist');

  return {
    async run() {
      if (options.beforePack) {
        await options.beforePack();
      }

      for (const check of options.distChecks ?? []) {
        const content = await readDist(distRoot, check.file);
        if (check.assert && !check.assert(content)) {
          fail(check.message ?? `dist/${check.file} failed assertion`);
        }
        for (const name of check.includes ?? []) {
          if (!content.includes(name)) {
            fail(`dist/${check.file} missing required export: ${name}`);
          }
        }
        if (check.maxLines !== undefined) {
          const lines = content.split('\n').length;
          if (lines > check.maxLines) {
            fail(
              check.message ??
                `dist/${check.file} is too large (${lines} lines)`
            );
          }
        }
        if (check.mustNotMatch?.test(content)) {
          fail(check.message ?? `dist/${check.file} matched forbidden pattern`);
        }
      }

      const { tgz, listing, pkg } = await packTarball(packageRoot);

      if (options.forbidSourcemaps) {
        assertNoSourcemaps(listing);
      }
      for (const pattern of options.forbidTarballPatterns ?? []) {
        if (pattern.test(listing)) {
          fail(`release tarball matched forbidden pattern: ${pattern}`);
        }
      }
      for (const required of options.requiredTarballPaths ?? []) {
        if (!listing.includes(required)) {
          fail(`missing ${required}`);
        }
      }

      if (options.afterPack) {
        await options.afterPack({ listing, pkg, tgz });
      }

      console.log(`${options.packageLabel} pack ok (${tgz})`);
    },
  };
}
