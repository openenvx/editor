import path from 'node:path';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';

/**
 * @param {object} options
 * @param {string} [options.packageRoot]
 * @param {string} [options.tsconfig]
 * @param {boolean} [options.cssModules]
 * @param {string[]} [options.inlinePackages]
 * @param {[string, string][]} options.entries
 */
export async function runBuildDts(options) {
  const packageRoot = options.packageRoot ?? process.cwd();
  const tsconfig = path.join(packageRoot, options.tsconfig ?? 'tsconfig.json');
  const inlinePackages = new Set(options.inlinePackages ?? []);

  const cssModuleStub = {
    name: 'css-module-stub',
    resolveId(source) {
      if (source.endsWith('.css')) {
        return `\0css:${source}`;
      }
      return null;
    },
    load(id) {
      if (id.startsWith('\0css:')) {
        return 'declare const classes: Record<string, string>;\nexport default classes;\n';
      }
      return null;
    },
  };

  async function buildDts(entry, outfile) {
    const plugins = options.cssModules ? [cssModuleStub] : [];
    plugins.push(
      dts({
        tsconfig,
        respectExternal: true,
      })
    );

    const bundle = await rollup({
      input: path.join(packageRoot, entry),
      plugins,
      external(id) {
        if (
          options.cssModules &&
          (id.startsWith('\0css:') || id.endsWith('.css'))
        ) {
          return true;
        }
        if (id.startsWith('@openenvx/')) {
          for (const pkg of inlinePackages) {
            if (id === pkg || id.startsWith(`${pkg}/`)) {
              return false;
            }
          }
          return true;
        }
        if (id.startsWith('.') || path.isAbsolute(id)) {
          return false;
        }
        return true;
      },
    });

    await bundle.write({
      file: path.join(packageRoot, outfile),
      format: 'es',
    });

    await bundle.close();
  }

  for (const [entry, outfile] of options.entries) {
    await buildDts(entry, outfile);
  }
}
