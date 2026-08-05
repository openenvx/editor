import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

export default createLibraryConfig({
  entry: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/cli/**',
    '!src/openenvx.d.ts',
  ],
  external: [
    'preact',
    'preact/hooks',
    'preact/jsx-runtime',
    'preact/compat',
    '@xmazu/openenvxee-protocol',
    '@openenvx/elements',
    'vite',
    'esbuild',
  ],
});
