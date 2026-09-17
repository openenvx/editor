import path from 'node:path';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';

const packageRoot = import.meta.dirname;
const tsconfig = path.join(packageRoot, 'tsconfig.build.json');

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

async function buildDts(entry: string, outfile: string) {
  const bundle = await rollup({
    input: path.join(packageRoot, entry),
    plugins: [cssModuleStub, dts({ tsconfig, respectExternal: true })],
    external(id) {
      if (id.startsWith('\0css:') || id.endsWith('.css')) {
        return true;
      }
      if (id.startsWith('@openenvx/')) {
        return true;
      }
      return !(id.startsWith('.') || path.isAbsolute(id));
    },
  });
  await bundle.write({ file: path.join(packageRoot, outfile), format: 'es' });
  await bundle.close();
}

const entries: [string, string][] = [
  ['src/index.ts', 'dist/index.d.ts'],
  ['src/core/index.ts', 'dist/core/index.d.ts'],
  ['src/core/schema/index.ts', 'dist/core/schema/index.d.ts'],
  ['src/core/preview/index.ts', 'dist/core/preview/index.d.ts'],
  [
    'src/core/react/workbench-context.tsx',
    'dist/core/react/workbench-context.d.ts',
  ],
];

for (const [entry, outfile] of entries) {
  await buildDts(entry, outfile);
}
