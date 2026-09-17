import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'rolldown';

import { createCssModuleRolldownPlugin } from './css-modules-plugin.ts';

const packageRoot = import.meta.dirname;
const distRoot = path.join(packageRoot, 'dist');
const sourcemap = process.env.STUDIO_SOURCEMAP === '1';

const shellExternals = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react-dom/client',
  '@openenvx/studio',
  '@openenvx/studio/core',
  '@openenvx/studio/schema',
  '@openenvx/studio/preview',
  '@openenvx/studio/react',
  '@openenvx/editor-sandbox',
  '@openenvx/editor-sandbox/host',
  '@openenvx/editor-sandbox/protocol',
];

function bundleExternal(externalIds: string[]) {
  return (id: string) =>
    externalIds.some((e) => id === e || id.startsWith(`${e}/`));
}

const { plugin, compiledCss } = createCssModuleRolldownPlugin({
  packageRoot,
  withSourcemap: sourcemap,
});

export default defineConfig({
  input: { index: 'src/index.ts' },
  platform: 'browser',
  treeshake: true,
  tsconfig: 'tsconfig.build.json',
  external: bundleExternal(shellExternals),
  plugins: [
    plugin,
    {
      name: 'studio-shell-post',
      writeBundle: async () => {
        const css = compiledCss();
        if (css.trim().length === 0) {
          throw new Error('studio publish build produced no CSS');
        }
        await writeFile(path.join(distRoot, 'index.css'), css);

        const indexJsPath = path.join(distRoot, 'index.js');
        const indexJs = await readFile(indexJsPath, 'utf-8');
        if (!indexJs.startsWith('"use client"')) {
          await writeFile(
            indexJsPath,
            `"use client";\nimport "./index.css";\n${indexJs}`
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
