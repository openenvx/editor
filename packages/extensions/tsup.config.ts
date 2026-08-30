import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

export default createLibraryConfig({
  dts: true,
  entry: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/cli/**',
    '!src/openenvx.d.ts',
    '!src/vite/**',
  ],
  external: [
    'preact',
    'preact/hooks',
    'preact/jsx-runtime',
    'preact/compat',
    'preact/jsx-dev-runtime',
    'vite',
    'esbuild',
  ],
});
