import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'rolldown';

const packageRoot = import.meta.dirname;
const sourcemap = process.env.STUDIO_SOURCEMAP === '1';

const STUDIO_SUBPATHS = [
  '@openenvx/studio',
  '@openenvx/studio/core',
  '@openenvx/studio/schema',
  '@openenvx/studio/preview',
  '@openenvx/studio/react',
];

const coreEntryExternals = [
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
    input: { 'core/index': 'src/core/index.ts' },
    platform: 'browser',
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    external: bundleExternal(coreEntryExternals),
    output,
  },
  {
    input: { 'core/schema/index': 'src/core/schema/index.ts' },
    platform: 'browser',
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    external: bundleExternal(coreEntryExternals),
    output,
    plugins: [
      {
        name: 'copy-scene-schema',
        writeBundle: async () => {
          const schemaDir = path.join(packageRoot, 'dist/core/schema');
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
    input: { 'core/preview/index': 'src/core/preview/index.ts' },
    platform: 'browser',
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    external: bundleExternal(coreEntryExternals),
    output,
  },
  {
    input: {
      'core/react/workbench-context': 'src/core/react/workbench-context.tsx',
    },
    platform: 'browser',
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    external: bundleExternal(coreEntryExternals),
    output,
  },
]);
