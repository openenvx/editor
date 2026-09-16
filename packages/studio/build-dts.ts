import { runBuildDts } from '@openenvx/typescript-config/build-dts';

await runBuildDts({
  packageRoot: import.meta.dirname,
  tsconfig: 'tsconfig.build.json',
  cssModules: true,
  entries: [
    ['src/index.ts', 'dist/index.d.ts'],
    ['src/core/index.ts', 'dist/core/index.d.ts'],
    ['src/core/schema/index.ts', 'dist/core/schema/index.d.ts'],
    ['src/core/preview/index.ts', 'dist/core/preview/index.d.ts'],
    [
      'src/core/react/workbench-context.tsx',
      'dist/core/react/workbench-context.d.ts',
    ],
  ],
});
