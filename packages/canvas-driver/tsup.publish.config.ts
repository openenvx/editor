import path from 'node:path';

import {
  copyCanvasFonts,
  createArtboardPublishConfig,
} from '@openenvx/typescript-config/tsup-artboard-publish';

const packageRoot = import.meta.dirname;
const packagesRoot = path.resolve(packageRoot, '..');

export default createArtboardPublishConfig({
  packageRoot,
  packageLabel: 'canvas',
  studioEntry: 'src/studio/index.ts',
  runtimeEntry: 'src/publish-runtime.ts',
  extraEntries: {
    'studio-sandbox-host': 'src/studio/create-canvas-sandbox-extension-host.ts',
  },
  inlineOpenenvx: /^@openenvx\/variables$/,
  afterCss: async () => {
    await copyCanvasFonts(path.join(packageRoot, 'dist'), packagesRoot);
  },
});
