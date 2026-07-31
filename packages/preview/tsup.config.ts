import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

export default createLibraryConfig({
  bundle: true,
  entry: ['src/index.ts'],
});
