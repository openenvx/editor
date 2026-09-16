import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/core/**/*.{ts,tsx}',
    '!src/core/**/*.test.{ts,tsx}',
    '!src/core/**/*.d.ts',
    '!src/core/schema/generate-json-schema.ts',
  ],
  format: ['esm'],
  dts: false,
  bundle: false,
  sourcemap: false,
  clean: false,
  outDir: 'dist/core',
  tsconfig: 'tsconfig.json',
  external: ['react', 'react/jsx-runtime'],
  esbuildOptions(esbuildOptions) {
    esbuildOptions.packages = 'external';
    esbuildOptions.outbase = 'src/core';
  },
  async onSuccess() {
    const packageRoot = import.meta.dirname;
    const schemaDir = path.join(packageRoot, 'dist/core/schema');
    await mkdir(schemaDir, { recursive: true });
    await copyFile(
      path.join(packageRoot, 'scene.schema.json'),
      path.join(schemaDir, 'scene.schema.json')
    );
  },
});
