import path from 'node:path';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';

const packageRoot = import.meta.dirname;
const tsconfig = path.join(packageRoot, 'tsconfig.publish.json');
const inlinePackages = new Set([
  '@openenvx/studio/plugins/variables',
  '@openenvx/html-driver',
]);

const cssModuleStub = {
  name: 'css-module-stub',
  resolveId(source: string) {
    if (source.endsWith('.css')) {
      return `\0css:${source}`;
    }
    return null;
  },
  load(id: string) {
    if (id.startsWith('\0css:')) {
      return 'declare const classes: Record<string, string>;\nexport default classes;\n';
    }
    return null;
  },
};

const bundle = await rollup({
  input: path.join(packageRoot, 'src/publish.ts'),
  plugins: [cssModuleStub, dts({ tsconfig, respectExternal: true })],
  external(id) {
    if (id.startsWith('\0css:') || id.endsWith('.css')) {
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
    return !(id.startsWith('.') || path.isAbsolute(id));
  },
});

await bundle.write({
  file: path.join(packageRoot, 'dist/index.d.ts'),
  format: 'es',
});
await bundle.close();
