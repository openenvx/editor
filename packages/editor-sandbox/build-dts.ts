import { runBuildDts } from '@openenvx/typescript-config/build-dts';

const packageRoot = import.meta.dirname;

await runBuildDts({
  packageRoot,
  tsconfig: 'tsconfig.json',
  entries: [
    ['src/index.ts', 'dist/index.d.ts'],
    ['src/protocol/index.ts', 'dist/protocol/index.d.ts'],
    ['src/canvas.ts', 'dist/canvas.d.ts'],
    ['src/html.ts', 'dist/html.d.ts'],
    ['src/panel.ts', 'dist/panel.d.ts'],
    ['src/jsx-runtime.ts', 'dist/jsx-runtime.d.ts'],
    ['src/jsx-dev-runtime.ts', 'dist/jsx-dev-runtime.d.ts'],
  ],
});

await runBuildDts({
  packageRoot,
  tsconfig: 'tsconfig.host.json',
  cssModules: true,
  entries: [['src/host/index.ts', 'dist/host/index.d.ts']],
});

await runBuildDts({
  packageRoot,
  tsconfig: 'tsconfig.canvas-widget.json',
  entries: [['src/canvas-widget/index.ts', 'dist/canvas-widget/index.d.ts']],
});
