import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const packageDir = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@openenvx/editor-sandbox/host': path.resolve(
        packageDir,
        '../editor-sandbox/src/host/index.ts'
      ),
      '@openenvx/editor-sandbox/protocol': path.resolve(
        packageDir,
        '../editor-sandbox/src/protocol/index.ts'
      ),
    },
  },
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: [/@openenvx\//, 'zod'],
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.*',
        '**/*.d.ts',
        'src/index.ts',
        'src/css-modules.d.ts',
        'src/test/**',
      ],
      thresholds: {
        lines: 85,
        // ponytail: v8 counts optional-chain / JSX branches in pane+renderer+drag
        // that need pointer-DnD or TipTap selection to hit; raise toward 85 once
        // those paths have a stable harness.
        branches: 80,
        functions: 85,
        statements: 85,
      },
    },
  },
});
