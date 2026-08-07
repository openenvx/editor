import path from 'node:path';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';

const studioRoot = import.meta.dirname;

async function buildDts(entry: string, outfile: string) {
  const bundle = await rollup({
    input: path.join(studioRoot, entry),
    plugins: [
      {
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
      },
      dts({
        tsconfig: path.join(studioRoot, 'tsconfig.build.json'),
        respectExternal: true,
      }),
    ],
    external(id) {
      if (id.startsWith('\0css:') || id.endsWith('.css')) {
        return true;
      }
      if (id.startsWith('@openenvx/')) {
        return false;
      }
      if (id.startsWith('.') || path.isAbsolute(id)) {
        return false;
      }
      return true;
    },
  });

  await bundle.write({
    file: path.join(studioRoot, outfile),
    format: 'es',
  });
  await bundle.close();
}

await buildDts('src/index.ts', 'dist/index.d.ts');
await buildDts('src/runtime.ts', 'dist/runtime.d.ts');
