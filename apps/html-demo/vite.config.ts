import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

const workspacePackages = [
  '@openenvx/core',
  '@openenvx/headless',
  '@openenvx/html',
  '@openenvx/schema',
  '@xmazu/openenvxee-workbench',
  '@xmazu/openenvxee-html-studio',
];

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
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
