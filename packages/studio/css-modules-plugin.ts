import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

import type { Plugin } from 'rolldown';

const require = createRequire(import.meta.url);
const { bundleAsync } =
  require('lightningcss') as typeof import('lightningcss');
const { compile } =
  require('@tailwindcss/node') as typeof import('@tailwindcss/node');

const VIRTUAL_PREFIX = '\0openenvx-css:';
const TAILWIND_DIRECTIVE = /@reference|@apply|--spacing\(|--alpha\(/;
// Baseline with `@property` + `color-mix()`; nesting from Tailwind is flattened.
// lightningcss packs versions as (major << 16) | (minor << 8) | patch.
const CSS_TARGETS = {
  chrome: 7_274_496,
  firefox: 8_388_608,
  safari: 1_049_600,
};

/** Resolves `@reference` / `@apply` against `src/theme/tailwind.css`; emits plain CSS. */
async function compileTailwind(cssPath: string, css: string): Promise<string> {
  if (!TAILWIND_DIRECTIVE.test(css)) {
    return css;
  }
  const compiler = await compile(css, {
    base: path.dirname(cssPath),
    from: cssPath,
    onDependency: () => {},
    // No `*` fallback layer leaking into the host page; `@property` rules stay.
    polyfills: 0,
  });
  return compiler.build([]);
}

export function createCssModuleRolldownPlugin(options: {
  packageRoot: string;
  withSourcemap?: boolean;
}) {
  const packageRoot = options.packageRoot;
  const withSourcemap =
    options.withSourcemap ?? process.env.STUDIO_SOURCEMAP === '1';
  const cssByFile = new Map<string, { global: boolean; css: string }>();

  function compiledCss() {
    return [...cssByFile.values()]
      .toSorted((a, b) => Number(b.global) - Number(a.global))
      .map((entry) => entry.css)
      .join('');
  }

  const plugin: Plugin = {
    name: 'openenvx-compile-css-modules',
    resolveId(source, importer) {
      if (!source.endsWith('.css')) {
        return null;
      }
      const importerDir =
        (importer && path.dirname(importer)) || path.join(packageRoot, 'src');
      const cssPath = path.resolve(importerDir, source);
      return `${VIRTUAL_PREFIX}${Buffer.from(cssPath).toString('base64url')}`;
    },
    async load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) {
        return null;
      }
      const cssPath = Buffer.from(
        id.slice(VIRTUAL_PREFIX.length),
        'base64url'
      ).toString('utf-8');
      const isModule = cssPath.endsWith('.module.css');
      const result = await bundleAsync({
        filename: cssPath,
        minify: !withSourcemap,
        targets: CSS_TARGETS,
        cssModules: isModule ? { pattern: 'e_[hash]_[local]' } : undefined,
        resolver: {
          read: async (filePath) =>
            compileTailwind(filePath, await readFile(filePath, 'utf-8')),
        },
      });
      const css = result.code.toString();
      if (css.trim().length > 0) {
        cssByFile.set(cssPath, { global: !isModule, css });
      }
      if (!isModule) {
        return { code: 'export {};', moduleType: 'js' };
      }
      const mapping: Record<string, string> = {};
      for (const [local, exported] of Object.entries(result.exports ?? {})) {
        mapping[local] = [
          exported.name,
          ...exported.composes.map((part) => part.name),
        ].join(' ');
      }
      return {
        code: `export default ${JSON.stringify(mapping)};`,
        moduleType: 'js',
      };
    },
  };

  return { plugin, compiledCss };
}
