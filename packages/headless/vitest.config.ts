import path from 'node:path';

import { defineConfig } from 'vitest/config';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@xmazu/openenvxee-plugin-protocol': path.resolve(
        root,
        '../plugin-protocol/src/index.ts'
      ),
    },
  },
  test: {
    environment: 'jsdom',
  },
});
