import { readFileSync } from 'node:fs';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

import type { Plugin } from 'esbuild';
import { defineConfig } from 'tsup';

const require = createRequire(import.meta.url);
const { bundle } = require('lightningcss') as typeof import('lightningcss');

const packageRoot = import.meta.dirname;
const packagesRoot = path.resolve(packageRoot, '..');
const distRoot = path.join(packageRoot, 'dist');
const pkg = JSON.parse(
  readFileSync(path.join(packageRoot, 'package.json'), 'utf-8')
) as {
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};

const withSourcemap = process.env.STUDIO_SOURCEMAP === '1';

const cssByFile = new Map<string, { global: boolean; css: string }>();

function compiledCss(): string {
  return [...cssByFile.values()]
    .toSorted((a, b) => Number(b.global) - Number(a.global))
    .map((entry) => entry.css)
    .join('');
}

function compileCssModules(): Plugin {
  return {
    name: 'compile-css-modules',
    setup(build) {
      build.onResolve({ filter: /\.css$/ }, (args) => {
        const importerDir =
          args.resolveDir ||
          (args.importer && path.dirname(args.importer)) ||
          path.join(packageRoot, 'src');
        const cssPath = path.resolve(importerDir, args.path);
        return {
          path: `${cssPath}.js`,
          namespace: 'css-modules',
          pluginData: { cssPath },
        };
      });
      build.onLoad({ filter: /.*/, namespace: 'css-modules' }, (args) => {
        const cssPath = (args.pluginData as { cssPath: string }).cssPath;
        const isModule = cssPath.endsWith('.module.css');
        const result = bundle({
          filename: cssPath,
          minify: !withSourcemap,
          cssModules: isModule ? { pattern: 'e_[hash]_[local]' } : undefined,
        });
        const css = result.code.toString();
        if (css.trim().length > 0) {
          cssByFile.set(cssPath, { global: !isModule, css });
        }
        if (!isModule) {
          return { contents: 'export {};', loader: 'js' };
        }
        const mapping: Record<string, string> = {};
        for (const [local, exported] of Object.entries(result.exports ?? {})) {
          mapping[local] = [
            exported.name,
            ...exported.composes.map((part) => part.name),
          ].join(' ');
        }
        return {
          contents: `export default ${JSON.stringify(mapping)};`,
          loader: 'js',
        };
      });
    },
  };
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    runtime: 'src/runtime.ts',
  },
  format: ['esm'],
  dts: false,
  bundle: true,
  splitting: false,
  minify: true,
  sourcemap: withSourcemap,
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  noExternal: [/^@openenvx\//, /^@xmazu\/openenvxee-/],
  external: [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
    'react/jsx-runtime',
    'react-dom/client',
  ],
  esbuildPlugins: [compileCssModules()],
  esbuildOptions(options) {
    options.legalComments = 'none';
    options.platform = 'browser';
    if (withSourcemap) {
      options.sourcesContent = true;
    }
  },
  async onSuccess() {
    const css = compiledCss();
    if (css.trim().length === 0) {
      throw new Error('canvas-studio publish build produced no CSS');
    }
    await writeFile(path.join(distRoot, 'index.css'), css);
    await copyFile(
      path.join(packagesRoot, 'canvas/src/fonts/fonts.css'),
      path.join(distRoot, 'fonts.css')
    );

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
