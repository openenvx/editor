import { createArtboardPublishConfig } from '@openenvx/typescript-config/tsup-artboard-publish';

const packageRoot = import.meta.dirname;

export default createArtboardPublishConfig({
  packageRoot,
  packageLabel: 'email',
  studioEntry: 'src/studio/index.ts',
  runtimeEntry: 'src/publish-runtime.ts',
  inlineOpenenvx: /^@openenvx\/(variables|html-driver)$/,
});
