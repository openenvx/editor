import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import {
  hostReactRuntimeViteAliases,
  openenvxPublishedExportConditions,
} from '../host-react-runtime-vite-aliases';

const appDir = import.meta.dirname;
const monorepoRoot = path.resolve(appDir, '../..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: [...openenvxPublishedExportConditions],
    alias: hostReactRuntimeViteAliases(appDir),
  },
  optimizeDeps: {
    exclude: ['@openenvx/canvas-driver', '@openenvx/studio'],
  },
  server: {
    fs: { allow: [monorepoRoot] },
    port: 5184,
    strictPort: true,
  },
});
