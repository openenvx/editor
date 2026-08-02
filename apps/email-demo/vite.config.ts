import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: [monorepoRoot] },
    port: 5182,
  },
});
