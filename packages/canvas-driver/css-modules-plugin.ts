import { createRequire } from 'node:module';
import path from 'node:path';

import type { Plugin } from 'rolldown';

const require = createRequire(import.meta.url);
const { bundle } = require('lightningcss') as typeof import('lightningcss');

const VIRTUAL_PREFIX = '\0openenvx-css:';

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
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) {
        return null;
      }
      const cssPath = Buffer.from(
        id.slice(VIRTUAL_PREFIX.length),
        'base64url'
      ).toString('utf-8');
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
