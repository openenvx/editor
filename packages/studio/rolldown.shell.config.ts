import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'rolldown';
import { esmExternalRequirePlugin } from 'rolldown/plugins';

import { assertPublishBundle } from './assert-publish-bundle';
import { createCssModuleRolldownPlugin } from './css-modules-plugin';
import {
  isHostReactRuntimePackageExternal,
  reactEsmExternals,
} from './rolldown-react-esm-externals';
import { studioInternalToPublishedPlugin } from './studio-internal-imports';

const packageRoot = import.meta.dirname;
const distRoot = path.join(packageRoot, 'dist');
const sourcemap = process.env.STUDIO_SOURCEMAP === '1';

const shellExternals = [
  '@openenvx/studio',
  '@openenvx/studio/shell',
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
  input: { shell: 'src/shell/index.ts' },
  platform: 'browser',
  treeshake: true,
  tsconfig: 'tsconfig.build.json',
  external: (id) =>
    bundleExternal(shellExternals)(id) || isHostReactRuntimePackageExternal(id),
  plugins: [
    studioInternalToPublishedPlugin(),
    esmExternalRequirePlugin({ external: reactEsmExternals }),
    plugin,
    {
      name: 'studio-shell-post',
      writeBundle: async () => {
        const css = compiledCss();
        if (css.trim().length === 0) {
          throw new Error('studio publish build produced no CSS');
        }
        const tokensPath = path.join(packageRoot, 'src/theme/tokens.css');
        const tokens = await readFile(tokensPath, 'utf-8');
        await writeFile(path.join(distRoot, 'shell.css'), css);
        await copyFile(tokensPath, path.join(distRoot, 'theme.css'));
        await writeFile(path.join(distRoot, 'styles.css'), `${tokens}\n${css}`);

        const shellJsPath = path.join(distRoot, 'shell.js');
        const shellJs = await readFile(shellJsPath, 'utf-8');
        if (!shellJs.startsWith('"use client"')) {
          await writeFile(
            shellJsPath,
            `"use client";\nimport "./shell.css";\n${shellJs}`
          );
        }
        await assertPublishBundle(distRoot, { entry: 'shell.js' });
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
