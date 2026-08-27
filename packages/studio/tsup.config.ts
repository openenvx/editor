import path from 'node:path';

import type { Plugin } from 'esbuild';
import { defineConfig } from 'tsup';

const studioRoot = import.meta.dirname;
const packagesRoot = path.resolve(studioRoot, '..');

const cssPackageRoots: { root: string; prefix: string }[] = [
  { root: path.join(studioRoot, 'src'), prefix: '' },
  { root: path.join(packagesRoot, 'workbench/src'), prefix: 'workbench/' },
  { root: path.join(packagesRoot, 'canvas/src'), prefix: 'canvas/' },
  { root: path.join(packagesRoot, 'agent/src'), prefix: 'agent/' },
];

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
          : path.join(studioRoot, 'src');
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
    // Dedicated Worker entry — QuickJS runs off the editor UI thread (Figma-style).
    'sandbox-worker': path.join(
      packagesRoot,
      'workbench/src/sandbox/quickjs.worker.ts'
    ),
  },
  format: ['esm'],
  dts: false,
  bundle: true,
  splitting: false,
  sourcemap: withSourcemap,
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  noExternal: [/^@openenvx\//, /^@xmazu\/openenvxee-/],
  external: [
    'quickjs-emscripten',
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
    'konva',
    'react-konva',
    'ai',
    '@ai-sdk/react',
    /^@radix-ui\//,
    /^@dnd-kit\//,
    /^@tiptap\//,
  ],
  esbuildPlugins: [externalCssRelativeToDist()],
  esbuildOptions(options) {
    if (withSourcemap) {
      options.sourcesContent = true;
    }
  },
});
