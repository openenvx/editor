import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@openenvx/email-driver', '@openenvx/studio'],
  },
  server: {
    fs: { allow: [monorepoRoot] },
    port: 5183,
  },
});
