import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

/** Workspace packages that export TypeScript source — keep out of prebundle for HMR. */
const workspacePackages = [
  '@openenvx/core',
  '@openenvx/canvas',
  '@openenvx/headless',
  '@xmazu/openenvxee-preview',
  '@xmazu/openenvxee-schema',
  '@openenvx/agent',
  '@xmazu/openenvxee-canvas-pro',
  '@xmazu/openenvxee-workbench',
  '@xmazu/openenvxee-studio',
];

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    // Published exports are dist-only; alias to src in this monorepo for HMR.
    alias: {
      '@xmazu/openenvxee-studio/theme.css': path.resolve(
        monorepoRoot,
        'packages/studio/src/theme.css'
      ),
      '@xmazu/openenvxee-studio/fonts.css': path.resolve(
        monorepoRoot,
        'packages/studio/src/fonts.css'
      ),
      '@xmazu/openenvxee-studio': path.resolve(
        monorepoRoot,
        'packages/studio/src/index.ts'
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
    port: 5175,
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:8788',
      },
    },
  },
}));
