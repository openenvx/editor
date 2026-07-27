import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: [/@openenvx\//],
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
