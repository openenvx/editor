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
