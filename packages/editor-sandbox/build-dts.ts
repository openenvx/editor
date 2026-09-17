import path from 'node:path';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';

const packageRoot = import.meta.dirname;

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

async function buildDts(
  tsconfigFile: string,
  entry: string,
  outfile: string,
  cssModules = false
) {
  const tsconfig = path.join(packageRoot, tsconfigFile);
  const plugins = cssModules ? [cssModuleStub] : [];
  plugins.push(dts({ tsconfig, respectExternal: true }));

  const bundle = await rollup({
    input: path.join(packageRoot, entry),
    plugins,
    external(id) {
      if (cssModules && (id.startsWith('\0css:') || id.endsWith('.css'))) {
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

await buildDts('tsconfig.json', 'src/index.ts', 'dist/index.d.ts');
await buildDts(
  'tsconfig.json',
  'src/protocol/index.ts',
  'dist/protocol/index.d.ts'
);
await buildDts('tsconfig.json', 'src/canvas.ts', 'dist/canvas.d.ts');
await buildDts('tsconfig.json', 'src/html.ts', 'dist/html.d.ts');
await buildDts('tsconfig.json', 'src/panel.ts', 'dist/panel.d.ts');
await buildDts('tsconfig.json', 'src/jsx-runtime.ts', 'dist/jsx-runtime.d.ts');
await buildDts(
  'tsconfig.json',
  'src/jsx-dev-runtime.ts',
  'dist/jsx-dev-runtime.d.ts'
);
await buildDts(
  'tsconfig.json',
  'src/openenvx-ambient.ts',
  'dist/openenvx.d.ts'
);
await buildDts(
  'tsconfig.host.json',
  'src/host/index.ts',
  'dist/host/index.d.ts',
  true
);
await buildDts(
  'tsconfig.canvas-widget.json',
  'src/canvas-widget/index.ts',
  'dist/canvas-widget/index.d.ts'
);
