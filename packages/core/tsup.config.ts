import { copyFile } from 'node:fs/promises';
import path from 'node:path';

import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

export default createLibraryConfig({
  sourcemap: false,
  entry: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/schema/generate-json-schema.ts',
  ],
  external: ['react', 'react/jsx-runtime'],
  onSuccess: async () => {
    const packageRoot = import.meta.dirname;
    await copyFile(
      path.join(packageRoot, 'scene.schema.json'),
      path.join(packageRoot, 'dist/scene.schema.json')
    );
  },
});
