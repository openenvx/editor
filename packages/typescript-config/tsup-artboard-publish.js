import { readFileSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import * as esbuild from 'esbuild';
import { defineConfig } from 'tsup';

import { createCssModuleCompiler } from './css-modules-esbuild.js';
import { artboardPublishExternals } from './publish-externals.js';

/**
 * @param {object} options
 * @param {string} options.packageRoot
 * @param {string} options.indexEntry
 * @param {RegExp} options.inlineOpenenvx
 * @param {string} [options.packageLabel]
 * @param {boolean} [options.sandboxWorker]
 * @param {() => Promise<void>} [options.afterCss]
 * @param {boolean} [options.importFontsCss]
 */
export function createArtboardPublishConfig(options) {
  const packageRoot = options.packageRoot;
  const packagesRoot = path.resolve(packageRoot, '..');
  const distRoot = path.join(packageRoot, 'dist');
  const pkg = JSON.parse(
    readFileSync(path.join(packageRoot, 'package.json'), 'utf-8')
  );
  const withSourcemap = process.env.STUDIO_SOURCEMAP === '1';
  const { compileCssModules, compiledCss } = createCssModuleCompiler({
    packageRoot,
    withSourcemap,
  });

  async function buildSandboxWorker() {
    const outFile = path.join(distRoot, 'sandbox-worker.js');
    await mkdir(distRoot, { recursive: true });
    await esbuild.build({
      entryPoints: [
        path.join(packagesRoot, 'editor-sandbox/src/host/quickjs.worker.ts'),
      ],
      outfile: outFile,
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
      sourcemap: withSourcemap,
      external: ['quickjs-emscripten'],
    });
  }

  return defineConfig({
    entry: {
      index: options.indexEntry,
    },
    format: ['esm'],
    dts: false,
    bundle: true,
    splitting: false,
    minify: true,
    sourcemap: withSourcemap,
    clean: false,
    outDir: 'dist',
    tsconfig: 'tsconfig.publish.json',
    noExternal: [
      options.inlineOpenenvx,
      ...Object.keys(pkg.dependencies ?? {}),
    ],
    external: artboardPublishExternals(pkg),
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
        throw new Error(
          `${options.packageLabel ?? 'artboard'} publish build produced no CSS`
        );
      }
      await writeFile(path.join(distRoot, 'theme.css'), css);
      if (options.sandboxWorker) {
        await buildSandboxWorker();
      }
      if (options.afterCss) {
        await options.afterCss();
      }

      const indexJsPath = path.join(distRoot, 'index.js');
      const indexJs = await readFile(indexJsPath, 'utf-8');
      if (!indexJs.startsWith('"use client"')) {
        const cssImports = ['import "./theme.css";'];
        if (options.importFontsCss) {
          cssImports.push('import "./fonts.css";');
        }
        await writeFile(
          indexJsPath,
          `"use client";\n${cssImports.join('\n')}\n${indexJs}`
        );
      }
    },
  });
}

export async function copyCanvasFonts(distRoot, packagesRoot) {
  await copyFile(
    path.join(packagesRoot, 'canvas-driver/src/fonts/fonts.css'),
    path.join(distRoot, 'fonts.css')
  );
}
