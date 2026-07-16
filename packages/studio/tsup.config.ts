import path from 'node:path';

import type { Plugin } from 'esbuild';
import { defineConfig } from 'tsup';

const studioRoot = import.meta.dirname;
const studioSrc = path.join(studioRoot, 'src');

/**
 * Keep CSS (and CSS module) imports external, rewriting paths so they resolve
 * against the rsynced `dist/` tree next to the single bundled entry.
 */
function externalCssRelativeToDist(): Plugin {
  return {
    name: 'external-css-relative-to-dist',
    setup(build) {
      build.onResolve({ filter: /\.css$/ }, (args) => {
        const importerDir = args.importer
          ? path.dirname(args.importer)
          : studioSrc;
        const absolute = path.resolve(importerDir, args.path);
        const fromSrc = path
          .relative(studioSrc, absolute)
          .replaceAll('\\', '/');
        if (fromSrc.startsWith('..')) {
          return { path: args.path, external: true };
        }
        return { path: `./${fromSrc}`, external: true };
      });
    },
  };
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  noExternal: [/^@openenvx\//],
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'zod',
    'clsx',
    'cmdk',
    'i18next',
    'react-i18next',
    'react-colorful',
    'lucide-react',
    /^@radix-ui\//,
    /^@dnd-kit\//,
  ],
  esbuildPlugins: [externalCssRelativeToDist()],
});
