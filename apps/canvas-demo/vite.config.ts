import path from 'node:path';

import react from '@vitejs/plugin-react';
import { openenvxWidgets } from '@xmazu/openenvxee-elements/vite';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

export default defineConfig({
  plugins: [react(), openenvxWidgets()],
  server: {
    fs: { allow: [monorepoRoot] },
    port: 5175,
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:8788',
      },
    },
  },
});
