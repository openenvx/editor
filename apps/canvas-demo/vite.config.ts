import path from 'node:path';

import { bundleWidgetSources } from '@openenvx/widget-sdk/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

export default defineConfig({
  plugins: [react(), bundleWidgetSources()],
  server: {
    fs: { allow: [monorepoRoot] },
    port: 5180,
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:8788',
      },
    },
  },
});
