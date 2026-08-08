import path from 'node:path';

import react from '@vitejs/plugin-react';
import { bundleWidgetSources } from '@xmazu/openenvxee-extensions/vite';
import { defineConfig } from 'vite';

const monorepoRoot = path.resolve(import.meta.dirname, '../..');

export default defineConfig({
  plugins: [react(), bundleWidgetSources()],
  server: {
    fs: { allow: [monorepoRoot] },
    port: 5181,
  },
});
