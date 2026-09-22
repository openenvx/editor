import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'rolldown';
import { esmExternalRequirePlugin } from 'rolldown/plugins';

import { assertPublishBundle } from '../studio/assert-publish-bundle';
import {
  isHostReactRuntimePackageExternal,
  isReactEsmExternalId,
  reactEsmExternals,
} from '../studio/rolldown-react-esm-externals';
import { createCssModuleRolldownPlugin } from './css-modules-plugin';

const packageRoot = import.meta.dirname;
const distRoot = path.join(packageRoot, 'dist');
const pkg = JSON.parse(
  readFileSync(path.join(packageRoot, 'package.json'), 'utf-8')
) as { peerDependencies?: Record<string, string> };
const sourcemap = process.env.STUDIO_SOURCEMAP === '1';
const inlineOpenenvx =
  /^@openenvx\/(studio\/(plugins\/variables|internal)|html-driver)/;

const artboardExternals = [
  '@openenvx/core',
  '@openenvx/core/react',
  '@openenvx/core/schema',
  '@openenvx/core/preview',
  '@openenvx/studio',
  '@openenvx/studio/shell',
  '@openenvx/studio/schema',
  '@openenvx/studio/preview',
  '@openenvx/studio/react',
  '@openenvx/editor-sandbox',
  '@openenvx/editor-sandbox/host',
  '@openenvx/editor-sandbox/protocol',
  '@openenvx/editor-sandbox/canvas-widget',
  ...Object.keys(pkg.peerDependencies ?? {}).filter(
    (id) => !isReactEsmExternalId(id)
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
    if (isHostReactRuntimePackageExternal(id)) {
      return true;
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
    esmExternalRequirePlugin({ external: reactEsmExternals }),
    plugin,
    {
      name: 'email-publish-post',
      writeBundle: async () => {
        const css = compiledCss();
        if (css.trim().length === 0) {
          throw new Error('email publish build produced no CSS');
        }
        await writeFile(path.join(distRoot, 'theme.css'), css);

        const indexJsPath = path.join(distRoot, 'index.js');
        const indexJs = await readFile(indexJsPath, 'utf-8');
        if (!indexJs.startsWith('"use client"')) {
          await writeFile(
            indexJsPath,
            `"use client";\nimport "./theme.css";\n${indexJs}`
          );
        }
        await assertPublishBundle(distRoot);
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
