import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');
const studioRoot = path.resolve(monorepoRoot, 'packages/studio');

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
  '@xmazu/openenvxee-studio',
];

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    dedupe: workspacePackages,
    // Legacy short alias used in a few demo files
    alias: {
      '@openenvxee/studio/theme.css': path.resolve(
        studioRoot,
        'src/theme/tokens.css'
      ),
      '@openenvxee/studio': path.resolve(studioRoot, 'src/index.ts'),
    },
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
