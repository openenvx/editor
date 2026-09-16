import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

export default createLibraryConfig({
  external: [
    '@openenvx/studio/core',
    '@openenvx/studio',
    'react',
    'react/jsx-runtime',
    'konva',
    'react-konva',
  ],
});
