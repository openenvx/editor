import { runBuildDts } from '@openenvx/typescript-config/build-dts';

await runBuildDts({
  packageRoot: import.meta.dirname,
  tsconfig: 'tsconfig.json',
  entries: [
    ['src/index.ts', 'dist/index.d.ts'],
    ['src/schema/index.ts', 'dist/schema/index.d.ts'],
    ['src/preview/index.ts', 'dist/preview/index.d.ts'],
    ['src/react/workbench-context.tsx', 'dist/react/workbench-context.d.ts'],
  ],
});
