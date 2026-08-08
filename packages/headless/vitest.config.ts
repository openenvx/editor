import path from 'node:path';

import { defineConfig } from 'vitest/config';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@xmazu/openenvxee-extensions/protocol': path.resolve(
        root,
        '../extensions/src/protocol/index.ts'
      ),
    },
    conditions: ['development', 'import', 'module', 'browser', 'default'],
  },
  test: {
    environment: 'jsdom',
  },
});
