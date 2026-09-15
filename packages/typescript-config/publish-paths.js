/**
 * Standard workspace path mappings for publish / DTS builds.
 *
 * @param {object} [options]
 * @param {Record<string, string[]>} [options.extra]
 * @returns {Record<string, string[]>}
 */
export function createPublishPaths(options = {}) {
  const packagesRoot = new URL('..', import.meta.url).pathname;

  return {
    '@openenvx/core': [`${packagesRoot}/core/src/index.ts`],
    '@openenvx/core/react': [
      `${packagesRoot}/core/src/react/workbench-context.tsx`,
    ],
    '@openenvx/core/schema': [`${packagesRoot}/core/src/schema/index.ts`],
    '@openenvx/core/preview': [`${packagesRoot}/core/src/preview/index.ts`],
    '@openenvx/editor-sandbox/host': [
      `${packagesRoot}/editor-sandbox/src/host/index.ts`,
    ],
    '@openenvx/editor-sandbox/protocol': [
      `${packagesRoot}/editor-sandbox/src/protocol/index.ts`,
    ],
    '@openenvx/editor-sandbox/canvas-widget': [
      `${packagesRoot}/editor-sandbox/src/canvas-widget/index.ts`,
    ],
    '@openenvx/studio': [`${packagesRoot}/studio/src/index.ts`],
    '@openenvx/variables': [`${packagesRoot}/variables/src/index.ts`],
    '@openenvx/workbench': [`${packagesRoot}/workbench/src/index.ts`],
    ...options.extra,
  };
}
