import path from 'node:path';

import type { NextConfig } from 'next';

const packageRoot = import.meta.dirname;
const monorepoRoot = path.resolve(packageRoot, '../..');

/** Match npm consumers: use Rolldown `dist/`, not `exports.development` → `src/`. */
const publishedExportConditions = [
  'import',
  'module',
  'browser',
  'production',
  'default',
];

const openenvxPublishedAliases = {
  '@openenvx/canvas-driver': path.join(
    monorepoRoot,
    'packages/canvas-driver/dist/index.js'
  ),
  '@openenvx/studio': path.join(monorepoRoot, 'packages/studio/dist/index.js'),
};

const nextConfig: NextConfig = {
  agentRules: false,
  // Published OpenEnvx bundles are prebuilt ESM; do not transpile unless a specific Next version requires it.
  turbopack: {
    root: monorepoRoot,
    resolveAlias: openenvxPublishedAliases,
  },
  outputFileTracingRoot: monorepoRoot,
  webpack: (config) => {
    // Workspace-linked `packages/*/dist` resolves bare imports from the package dir; hoist to this app.
    const appNodeModules = path.join(packageRoot, 'node_modules');
    config.resolve ??= {};
    config.resolve.conditionNames = publishedExportConditions;
    config.resolve.modules = [
      appNodeModules,
      ...(config.resolve.modules ?? ['node_modules']),
    ];
    return config;
  },
};

export default nextConfig;
