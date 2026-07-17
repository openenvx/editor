import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

/** Workspace packages that export TypeScript source — keep out of prebundle for HMR. */
const workspacePackages = [
  '@openenvx/core',
  '@openenvx/canvas',
  '@openenvx/driver-image',
  '@openenvx/headless',
  '@openenvx/preview',
  '@openenvx/schema',
  '@openenvx/agent',
  '@xmazu/openenvxee-canvas-pro',
  '@xmazu/openenvxee-workbench',
  '@xmazu/openenvxee-studio',
];

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    dedupe: workspacePackages,
  },
  optimizeDeps: {
    exclude: workspacePackages,
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
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
