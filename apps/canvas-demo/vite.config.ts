import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

const studioRoot = path.resolve(monorepoRoot, 'packages/studio');

const agentRoot = path.resolve(monorepoRoot, 'packages/agent');

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    dedupe: [
      '@openenvx/core',
      '@openenvx/canvas',
      '@openenvx/driver-image',
      '@openenvx/headless',
      '@openenvx/preview',
      '@openenvx/schema',
    ],
    alias: {
      '@openenvxee/studio/theme.css': path.resolve(
        studioRoot,
        'src/theme/tokens.css'
      ),
      '@openenvxee/studio': path.resolve(studioRoot, 'src/index.ts'),
      '@openenvx/agent': path.resolve(agentRoot, 'src/index.ts'),
    },
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
