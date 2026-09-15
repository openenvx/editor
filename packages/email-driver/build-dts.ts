import { runBuildDts } from '@openenvx/typescript-config/build-dts';

await runBuildDts({
  packageRoot: import.meta.dirname,
  tsconfig: 'tsconfig.publish.json',
  cssModules: true,
  inlinePackages: ['@openenvx/variables', '@openenvx/html-driver'],
  entries: [
    ['src/studio/index.ts', 'dist/studio.d.ts'],
    ['src/publish-runtime.ts', 'dist/runtime.d.ts'],
  ],
});
