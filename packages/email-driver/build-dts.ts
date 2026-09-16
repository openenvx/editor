import { runBuildDts } from '@openenvx/typescript-config/build-dts';

await runBuildDts({
  packageRoot: import.meta.dirname,
  tsconfig: 'tsconfig.publish.json',
  cssModules: true,
  inlinePackages: ['@openenvx/variables', '@openenvx/html-driver'],
  entries: [['src/publish.ts', 'dist/index.d.ts']],
});
