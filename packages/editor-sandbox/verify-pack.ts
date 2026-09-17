import { createVerifyPack } from '@openenvx/typescript-config/verify-pack';

const packageRoot = import.meta.dirname;

await createVerifyPack({
  packageRoot,
  packageLabel: 'editor-sandbox',
  forbidSourcemaps: true,
  requiredTarballPaths: [
    'package/dist/index.js',
    'package/dist/index.d.ts',
    'package/dist/protocol/index.js',
    'package/dist/host/index.js',
    'package/dist/canvas-widget/index.js',
    'package/src/vite/bundle-widget-sources-plugin.ts',
  ],
  distChecks: [
    {
      file: 'index.d.ts',
      includes: ['defineCanvasComponent'],
    },
    {
      file: 'protocol/index.d.ts',
      includes: ['RenderNode'],
    },
  ],
}).run();
