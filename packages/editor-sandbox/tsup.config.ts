import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

const authorConfig = createLibraryConfig({
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
  tsconfig: 'tsconfig.host.json',
  entry: ['src/host/**/*.{ts,tsx}', '!src/host/**/*.test.{ts,tsx}'],
  // tsconfig.host.json roots at src/host; mirror package exports under dist/host/.
  outDir: 'dist/host',
  clean: false,
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
  tsconfig: 'tsconfig.canvas-widget.json',
  entry: [
    'src/canvas-widget/**/*.{ts,tsx}',
    '!src/canvas-widget/**/*.test.{ts,tsx}',
  ],
  outDir: 'dist/canvas-widget',
  clean: false,
  external: [
    '@openenvx/core',
    '@openenvx/core/schema',
    '@openenvx/canvas-driver/fit-text-layer-to-content',
    '@openenvx/editor-sandbox/protocol',
  ],
});

export default [authorConfig, hostConfig, canvasWidgetConfig];
