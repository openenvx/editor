import { defineConfig } from 'rolldown';

const sourcemap = process.env.STUDIO_SOURCEMAP === '1';

const STUDIO_SUBPATHS = [
  '@openenvx/studio',
  '@openenvx/studio/shell',
  '@openenvx/studio/react',
  '@openenvx/studio/chrome',
  '@openenvx/editor',
  '@openenvx/editor/schema',
  '@openenvx/editor/preview',
];

const headlessEntryExternals = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react-dom/client',
  ...STUDIO_SUBPATHS,
];

function bundleExternal(externalIds: string[]) {
  return (id: string) =>
    externalIds.some((e) => id === e || id.startsWith(`${e}/`));
}

const output = {
  dir: 'dist',
  format: 'esm' as const,
  minify: true,
  sourcemap,
  entryFileNames: '[name].js',
};

export default defineConfig([
  {
    input: { index: 'src/index.ts' },
    platform: 'browser',
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    external: bundleExternal(headlessEntryExternals),
    output,
  },
  {
    input: {
      'react/workbench-context': 'src/react/workbench-context.tsx',
    },
    platform: 'browser',
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    external: bundleExternal(headlessEntryExternals),
    output,
  },
]);
