import { createArtboardPublishConfig } from '@openenvx/typescript-config/tsup-artboard-publish';

const packageRoot = import.meta.dirname;

export default createArtboardPublishConfig({
  packageRoot,
  packageLabel: 'html',
  indexEntry: 'src/publish.ts',
  inlineOpenenvx: /^@openenvx\/variables$/,
  sandboxWorker: true,
});
