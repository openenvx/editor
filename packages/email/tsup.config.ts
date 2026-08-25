import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'esbuild';
import { defineConfig } from 'tsup';

const packageRoot = import.meta.dirname;
const packagesRoot = path.resolve(packageRoot, '..');
const pkg = JSON.parse(
  readFileSync(path.join(packageRoot, 'package.json'), 'utf-8')
) as {
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};

const cssPackageRoots: { root: string; prefix: string }[] = [
  { root: path.join(packageRoot, 'src'), prefix: '' },
  { root: path.join(packagesRoot, 'workbench/src'), prefix: 'workbench/' },
  { root: path.join(packagesRoot, 'html/src'), prefix: 'html/' },
  {
    root: path.join(packagesRoot, 'driver-email/src'),
    prefix: 'driver-email/',
  },
];

/** Keep CSS external so consumers (Vite) resolve modules and class maps correctly. */
function externalCssRelativeToDist(): Plugin {
  return {
    name: 'external-css-relative-to-dist',
    setup(build) {
      build.onResolve({ filter: /\.css$/ }, (args) => {
        const importerDir = args.importer
          ? path.dirname(args.importer)
          : path.join(packageRoot, 'src');
        const absolute = path.resolve(importerDir, args.path);

        for (const { root, prefix } of cssPackageRoots) {
          const fromRoot = path.relative(root, absolute).replaceAll('\\', '/');
          if (!fromRoot.startsWith('..') && !path.isAbsolute(fromRoot)) {
            return { path: `./${prefix}${fromRoot}`, external: true };
          }
        }

        return { path: args.path, external: true };
      });
    },
  };
}

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
  esbuildPlugins: [externalCssRelativeToDist()],
  esbuildOptions(options) {
    if (withSourcemap) {
      options.sourcesContent = true;
    }
  },
});
