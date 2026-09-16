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
  indexEntry: 'src/publish.ts',
  inlineOpenenvx: /^@openenvx\/variables$/,
  importFontsCss: true,
  afterCss: async () => {
    await copyCanvasFonts(path.join(packageRoot, 'dist'), packagesRoot);
  },
});
