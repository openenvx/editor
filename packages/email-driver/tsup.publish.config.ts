import { createArtboardPublishConfig } from '@openenvx/typescript-config/tsup-artboard-publish';

const packageRoot = import.meta.dirname;

export default createArtboardPublishConfig({
  packageRoot,
  packageLabel: 'email',
  indexEntry: 'src/publish.ts',
  inlineOpenenvx: /^@openenvx\/(studio\/plugins\/variables|html-driver)$/,
});
