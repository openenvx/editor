import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

const authorConfig = createLibraryConfig({
  dts: true,
  tsconfig: 'tsconfig.json',
  entry: [
    'src/**/*.{ts,tsx}',
    '!src/host/**',
    '!src/canvas-widget/**',
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

const hostConfig = createLibraryConfig({
  dts: true,
  tsconfig: 'tsconfig.host.json',
  entry: ['src/host/**/*.{ts,tsx}', '!src/host/**/*.test.{ts,tsx}'],
  external: [
    '@openenvx/core',
    'quickjs-emscripten',
    'react',
    'react-dom',
    'react/jsx-runtime',
    'clsx',
  ],
});

const canvasWidgetConfig = createLibraryConfig({
  dts: true,
  tsconfig: 'tsconfig.canvas-widget.json',
  entry: ['src/canvas-widget/index.ts'],
  external: [
    '@openenvx/core',
    '@openenvx/core/schema',
    '@openenvx/canvas/fit-text-layer-to-content',
    '@openenvx/editor-sandbox/protocol',
  ],
});

export default [authorConfig, hostConfig, canvasWidgetConfig];
