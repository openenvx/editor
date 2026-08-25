import { readFileSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'tsup';

const packageRoot = import.meta.dirname;
const pkg = JSON.parse(
  readFileSync(path.join(packageRoot, 'package.json'), 'utf-8')
) as {
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};

const withSourcemap = process.env.STUDIO_SOURCEMAP === '1';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    runtime: 'src/runtime.ts',
  },
  format: ['esm'],
  dts: false,
  bundle: true,
  splitting: false,
  minify: true,
  sourcemap: withSourcemap,
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  noExternal: [/^@openenvx\//, /^@xmazu\/openenvxee-/],
  external: [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
    'react/jsx-runtime',
  ],
  esbuildOptions(options) {
    if (withSourcemap) {
      options.sourcesContent = true;
    }
  },
});
