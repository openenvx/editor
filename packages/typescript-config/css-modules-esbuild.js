import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { bundle } = require('lightningcss');

/**
 * @param {object} options
 * @param {string} options.packageRoot
 * @param {boolean} [options.withSourcemap]
 */
export function createCssModuleCompiler(options) {
  const packageRoot = options.packageRoot;
  const withSourcemap =
    options.withSourcemap ?? process.env.STUDIO_SOURCEMAP === '1';
  const cssByFile = new Map();

  function compiledCss() {
    return [...cssByFile.values()]
      .toSorted((a, b) => Number(b.global) - Number(a.global))
      .map((entry) => entry.css)
      .join('');
  }

  function compileCssModules() {
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
          const cssPath = args.pluginData.cssPath;
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
          const mapping = {};
          for (const [local, exported] of Object.entries(
            result.exports ?? {}
          )) {
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

  return { compileCssModules, compiledCss, cssByFile };
}
