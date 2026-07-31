import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

// Single bundled entry so published ESM has no extensionless relative imports
// (Node cannot resolve `./types` without `.js` when bundle:false).
export default createLibraryConfig({
  bundle: true,
  entry: ['src/index.ts'],
});
