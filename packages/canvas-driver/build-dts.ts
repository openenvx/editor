import { runBuildDts } from '@openenvx/typescript-config/build-dts';

await runBuildDts({
  packageRoot: import.meta.dirname,
  tsconfig: 'tsconfig.publish.json',
  cssModules: true,
  inlinePackages: ['@openenvx/studio/plugins/variables'],
  entries: [['src/publish.ts', 'dist/index.d.ts']],
});
