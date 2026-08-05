import path from 'node:path';

import { defineConfig } from 'vitest/config';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@xmazu/openenvxee-protocol': path.resolve(
        root,
        '../protocol/src/index.ts'
      ),
    },
    conditions: ['development', 'import', 'module', 'browser', 'default'],
  },
  test: {
    environment: 'jsdom',
  },
});
