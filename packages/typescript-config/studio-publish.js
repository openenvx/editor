import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'tsup';

import { createCssModuleCompiler } from './css-modules-esbuild.js';
import { studioShellExternals } from './publish-externals.js';

/**
 * @param {object} options
 * @param {string} options.packageRoot
 */
export function createStudioPublishConfig(options) {
  const packageRoot = options.packageRoot;
  const distRoot = path.join(packageRoot, 'dist');
  const pkg = JSON.parse(
    readFileSync(path.join(packageRoot, 'package.json'), 'utf-8')
  );
  const withSourcemap = process.env.STUDIO_SOURCEMAP === '1';
  const { compileCssModules, compiledCss } = createCssModuleCompiler({
    packageRoot,
    withSourcemap,
  });

  return defineConfig({
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: false,
    bundle: true,
    splitting: false,
    minify: true,
    sourcemap: withSourcemap,
    clean: false,
    outDir: 'dist',
    tsconfig: 'tsconfig.build.json',
    noExternal: Object.keys(pkg.dependencies ?? {}),
    external: studioShellExternals(pkg),
    esbuildPlugins: [compileCssModules()],
    esbuildOptions(esbuildOptions) {
      esbuildOptions.legalComments = 'none';
      esbuildOptions.platform = 'browser';
      if (withSourcemap) {
        esbuildOptions.sourcesContent = true;
      }
    },
    async onSuccess() {
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
  });
}
