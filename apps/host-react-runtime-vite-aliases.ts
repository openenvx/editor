import path from 'node:path';

/**
 * Published OpenEnvx `dist/` ESM-imports host React runtimes. Workspace-linked
 * package `dist/` resolves bare imports from the package dir; npm consumers
 * hoist from the app. Point aliases at this app's `node_modules`.
 */
export function hostReactRuntimeViteAliases(appDir: string) {
  const nm = path.join(appDir, 'node_modules');
  const pkg = (name: string) => path.join(nm, name);

  return [
    {
      find: /^use-sync-external-store\/shim\/with-selector\.js$/,
      replacement: path.join(
        nm,
        'use-sync-external-store/shim/with-selector.js'
      ),
    },
    {
      find: /^use-sync-external-store\/shim\/index\.js$/,
      replacement: path.join(nm, 'use-sync-external-store/shim/index.js'),
    },
    {
      find: /^use-sync-external-store\/shim$/,
      replacement: path.join(nm, 'use-sync-external-store/shim/index.js'),
    },
    {
      find: /^use-sync-external-store$/,
      replacement: pkg('use-sync-external-store'),
    },
    { find: /^scheduler$/, replacement: pkg('scheduler') },
    {
      find: /^react-reconciler\/constants\.js$/,
      replacement: path.join(nm, 'react-reconciler/constants.js'),
    },
    { find: /^react-reconciler$/, replacement: pkg('react-reconciler') },
  ];
}

/** Match npm consumers: Rolldown `dist/`, not `exports.development` → `src/`. */
export const openenvxPublishedExportConditions = [
  'production',
  'import',
  'module',
  'browser',
  'default',
] as const;

/**
 * Vite dev must load Studio/Canvas from `dist/` so CSS-module class names match
 * `styles.css` / `shell.css`. Using `exports.development` → `src/` with dist CSS
 * leaves chrome unstyled (hashed classes do not match).
 */
export function openenvxPublishedPackageAliases(monorepoRoot: string) {
  const pkg = (rel: string) => path.join(monorepoRoot, rel);
  return [
    {
      find: '@openenvx/studio/shell',
      replacement: pkg('packages/studio/dist/shell.js'),
    },
    {
      // Published react bundle inlines a CJS `require('react')` shim (i18next path).
      find: '@openenvx/studio/react',
      replacement: pkg('packages/studio/src/react/workbench-context.tsx'),
    },
    {
      find: '@openenvx/studio/internal',
      replacement: pkg('packages/studio/src/workbench-barrel.ts'),
    },
    {
      find: '@openenvx/studio/styles.css',
      replacement: pkg('packages/studio/dist/styles.css'),
    },
    {
      find: '@openenvx/studio/theme.css',
      replacement: pkg('packages/studio/dist/theme.css'),
    },
    {
      find: '@openenvx/studio',
      replacement: pkg('packages/studio/dist/index.js'),
    },
    {
      find: '@openenvx/canvas-driver/fonts.css',
      replacement: pkg('packages/canvas-driver/dist/fonts.css'),
    },
    {
      find: '@openenvx/canvas-driver/theme.css',
      replacement: pkg('packages/canvas-driver/dist/theme.css'),
    },
    {
      find: '@openenvx/canvas-driver',
      replacement: pkg('packages/canvas-driver/dist/index.js'),
    },
  ];
}
