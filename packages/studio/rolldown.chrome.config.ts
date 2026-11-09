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

const chromeExternals = [
  '@openenvx/studio',
  '@openenvx/studio/shell',
  '@openenvx/studio/schema',
  '@openenvx/studio/preview',
  '@openenvx/studio/react',
  '@openenvx/studio/chrome',
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
  input: { chrome: 'src/chrome/index.ts' },
  platform: 'browser',
  treeshake: true,
  tsconfig: 'tsconfig.build.json',
  external: (id) =>
    bundleExternal(chromeExternals)(id) ||
    isHostReactRuntimePackageExternal(id),
  plugins: [
    studioInternalToPublishedPlugin(),
    esmExternalRequirePlugin({ external: reactEsmExternals }),
    plugin,
    {
      name: 'studio-chrome-post',
      writeBundle: async () => {
        const css = compiledCss();
        if (css.trim().length === 0) {
          throw new Error('studio chrome build produced no CSS');
        }
        await writeFile(path.join(distRoot, 'chrome.css'), css);

        const chromeJsPath = path.join(distRoot, 'chrome.js');
        const chromeJs = await readFile(chromeJsPath, 'utf-8');
        if (!chromeJs.startsWith('"use client"')) {
          await writeFile(
            chromeJsPath,
            `"use client";\nimport "./chrome.css";\n${chromeJs}`
          );
        }
        const tokensPath = path.join(packageRoot, 'src/theme/tokens.css');
        await copyFile(tokensPath, path.join(distRoot, 'theme.css'));
        await assertPublishBundle(distRoot, { entry: 'chrome.js' });
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
