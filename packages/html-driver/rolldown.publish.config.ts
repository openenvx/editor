import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import * as esbuild from 'esbuild';
import { defineConfig } from 'rolldown';
import { esmExternalRequirePlugin } from 'rolldown/plugins';

import { createCssModuleRolldownPlugin } from './css-modules-plugin.ts';

const packageRoot = import.meta.dirname;
const packagesRoot = path.resolve(packageRoot, '..');
const distRoot = path.join(packageRoot, 'dist');
const pkg = JSON.parse(
  readFileSync(path.join(packageRoot, 'package.json'), 'utf-8')
) as { peerDependencies?: Record<string, string> };
const sourcemap = process.env.STUDIO_SOURCEMAP === '1';
const inlineOpenenvx = /^@openenvx\/studio\/(plugins\/variables|internal)/;

const esmExternalRequire = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react-dom/client',
];

const artboardExternals = [
  '@openenvx/core',
  '@openenvx/core/react',
  '@openenvx/core/schema',
  '@openenvx/core/preview',
  '@openenvx/studio',
  '@openenvx/studio/core',
  '@openenvx/studio/schema',
  '@openenvx/studio/preview',
  '@openenvx/studio/react',
  '@openenvx/editor-sandbox',
  '@openenvx/editor-sandbox/host',
  '@openenvx/editor-sandbox/protocol',
  '@openenvx/editor-sandbox/canvas-widget',
  ...Object.keys(pkg.peerDependencies ?? {}).filter(
    (id) => !esmExternalRequire.includes(id)
  ),
];

function bundleExternal(
  externalIds: string[],
  forceBundle?: (id: string) => boolean
) {
  return (id: string) => {
    if (forceBundle?.(id)) {
      return false;
    }
    return externalIds.some((e) => id === e || id.startsWith(`${e}/`));
  };
}

const { plugin, compiledCss } = createCssModuleRolldownPlugin({
  packageRoot,
  withSourcemap: sourcemap,
});

export default defineConfig({
  input: { index: 'src/publish.ts' },
  platform: 'browser',
  treeshake: true,
  tsconfig: 'tsconfig.publish.json',
  external: bundleExternal(artboardExternals, (id) => inlineOpenenvx.test(id)),
  plugins: [
    esmExternalRequirePlugin({ external: esmExternalRequire }),
    plugin,
    {
      name: 'html-publish-post',
      writeBundle: async () => {
        const css = compiledCss();
        if (css.trim().length === 0) {
          throw new Error('html publish build produced no CSS');
        }
        await writeFile(path.join(distRoot, 'theme.css'), css);

        await mkdir(distRoot, { recursive: true });
        await esbuild.build({
          entryPoints: [
            path.join(
              packagesRoot,
              'editor-sandbox/src/host/quickjs.worker.ts'
            ),
          ],
          outfile: path.join(distRoot, 'sandbox-worker.js'),
          bundle: true,
          format: 'esm',
          platform: 'browser',
          target: 'es2022',
          sourcemap,
          external: ['quickjs-emscripten'],
        });

        const indexJsPath = path.join(distRoot, 'index.js');
        const indexJs = await readFile(indexJsPath, 'utf-8');
        if (!indexJs.startsWith('"use client"')) {
          await writeFile(
            indexJsPath,
            `"use client";\nimport "./theme.css";\n${indexJs}`
          );
        }
      },
    },
  ],
  output: {
    dir: 'dist',
    format: 'esm',
    minify: true,
    sourcemap,
    entryFileNames: '[name].js',
  },
});
