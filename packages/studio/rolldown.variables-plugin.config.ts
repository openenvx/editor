import { defineConfig } from 'rolldown';
import { esmExternalRequirePlugin } from 'rolldown/plugins';

import { createCssModuleRolldownPlugin } from './css-modules-plugin';
import {
  isHostReactRuntimePackageExternal,
  reactEsmExternals,
} from './rolldown-react-esm-externals';
import { studioInternalToPublishedPlugin } from './studio-internal-imports';

const packageRoot = import.meta.dirname;
const sourcemap = process.env.STUDIO_SOURCEMAP === '1';

const variablesExternals = [
  '@openenvx/studio',
  '@openenvx/studio/schema',
  '@openenvx/studio/react',
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react-dom/client',
];

function bundleExternal(externalIds: string[]) {
  return (id: string) => {
    if (isHostReactRuntimePackageExternal(id)) {
      return true;
    }
    return externalIds.some((e) => id === e || id.startsWith(`${e}/`));
  };
}

const { plugin } = createCssModuleRolldownPlugin({
  packageRoot,
  withSourcemap: sourcemap,
});

export default defineConfig([
  {
    input: { 'plugins/variables/index': 'src/plugins/variables/index.ts' },
    platform: 'browser',
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    external: bundleExternal(variablesExternals),
    plugins: [
      studioInternalToPublishedPlugin(),
      esmExternalRequirePlugin({ external: reactEsmExternals }),
      plugin,
    ],
    output: {
      dir: 'dist',
      format: 'esm',
      minify: true,
      sourcemap,
      entryFileNames: '[name].js',
    },
  },
  {
    input: {
      'plugins/variables/tiptap/index': 'src/plugins/variables/tiptap/index.ts',
    },
    platform: 'browser',
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    external: bundleExternal(variablesExternals),
    plugins: [
      studioInternalToPublishedPlugin(),
      esmExternalRequirePlugin({ external: reactEsmExternals }),
    ],
    output: {
      dir: 'dist',
      format: 'esm',
      minify: true,
      sourcemap,
      entryFileNames: '[name].js',
    },
  },
]);
