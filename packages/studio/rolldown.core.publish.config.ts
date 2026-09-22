import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'rolldown';

const packageRoot = import.meta.dirname;
const sourcemap = process.env.STUDIO_SOURCEMAP === '1';

const STUDIO_SUBPATHS = [
  '@openenvx/studio',
  '@openenvx/studio/shell',
  '@openenvx/studio/schema',
  '@openenvx/studio/preview',
  '@openenvx/studio/react',
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
    input: { 'schema/index': 'src/schema/index.ts' },
    platform: 'browser',
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    external: bundleExternal(headlessEntryExternals),
    output,
    plugins: [
      {
        name: 'copy-scene-schema',
        writeBundle: async () => {
          const schemaDir = path.join(packageRoot, 'dist/schema');
          await mkdir(schemaDir, { recursive: true });
          await copyFile(
            path.join(packageRoot, 'scene.schema.json'),
            path.join(schemaDir, 'scene.schema.json')
          );
        },
      },
    ],
  },
  {
    input: { 'preview/index': 'src/preview/index.ts' },
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
