import { runBuildDts } from '@openenvx/typescript-config/build-dts';

await runBuildDts({
  packageRoot: import.meta.dirname,
  tsconfig: 'tsconfig.publish.json',
  cssModules: true,
  inlinePackages: ['@openenvx/variables'],
  entries: [['src/publish.ts', 'dist/index.d.ts']],
});
