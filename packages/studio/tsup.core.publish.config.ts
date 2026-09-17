import { readFileSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { studioCoreEntryExternals } from '@openenvx/typescript-config/publish-externals';
import { defineConfig } from 'tsup';

const packageRoot = import.meta.dirname;
const pkg = JSON.parse(
  readFileSync(path.join(packageRoot, 'package.json'), 'utf-8')
);

export default defineConfig({
  entry: {
    'core/index': 'src/core/index.ts',
    'core/schema/index': 'src/core/schema/index.ts',
    'core/preview/index': 'src/core/preview/index.ts',
    'core/react/workbench-context': 'src/core/react/workbench-context.tsx',
  },
  format: ['esm'],
  dts: false,
  bundle: true,
  splitting: false,
  minify: true,
  sourcemap: process.env.STUDIO_SOURCEMAP === '1',
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  noExternal: Object.keys(pkg.dependencies ?? {}),
  external: studioCoreEntryExternals(),
  esbuildOptions(esbuildOptions) {
    esbuildOptions.legalComments = 'none';
    esbuildOptions.platform = 'browser';
    if (process.env.STUDIO_SOURCEMAP === '1') {
      esbuildOptions.sourcesContent = true;
    }
  },
  async onSuccess() {
    const schemaDir = path.join(packageRoot, 'dist/core/schema');
    await mkdir(schemaDir, { recursive: true });
    await copyFile(
      path.join(packageRoot, 'scene.schema.json'),
      path.join(schemaDir, 'scene.schema.json')
    );
  },
});
