import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

const workspacePackages = [
  '@openenvx/core',
  '@openenvx/headless',
  '@openenvx/html',
  '@xmazu/openenvxee-schema',
  '@xmazu/openenvxee-workbench',
  '@xmazu/openenvxee-html-studio',
];

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    // Published exports are dist-only; alias to src in this monorepo for HMR.
    alias: {
      '@xmazu/openenvxee-plugin-protocol/jsx-dev-runtime': path.resolve(
        monorepoRoot,
        'packages/plugin-protocol/src/jsx-dev-runtime.ts'
      ),
      '@xmazu/openenvxee-plugin-protocol/jsx-runtime': path.resolve(
        monorepoRoot,
        'packages/plugin-protocol/src/jsx-runtime.ts'
      ),
      '@xmazu/openenvxee-plugin-protocol': path.resolve(
        monorepoRoot,
        'packages/plugin-protocol/src/index.ts'
      ),
    },
    dedupe: workspacePackages,
  },
  optimizeDeps: {
    exclude: workspacePackages,
  },
  server: {
    fs: {
      allow: [monorepoRoot],
    },
    port: 5176,
  },
}));
