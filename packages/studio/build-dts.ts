import path from 'node:path';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';

const studioRoot = import.meta.dirname;

const bundle = await rollup({
  input: path.join(studioRoot, 'src/index.ts'),
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
    if (id.startsWith('@openenvx/') || id.startsWith('@xmazu/openenvxee-')) {
      return false;
    }
    if (id.startsWith('.') || path.isAbsolute(id)) {
      return false;
    }
    return true;
  },
});

await bundle.write({
  file: path.join(studioRoot, 'dist/index.d.ts'),
  format: 'es',
});

await bundle.close();
