import { runBuildDts } from '@openenvx/typescript-config/build-dts';

await runBuildDts({
  packageRoot: import.meta.dirname,
  tsconfig: 'tsconfig.build.json',
  cssModules: true,
  inlinePackages: ['@openenvx/workbench'],
  entries: [['src/index.ts', 'dist/index.d.ts']],
});
