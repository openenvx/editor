import { defineConfig } from 'tsup';

/** @param {import('tsup').Options} [options] */
export function createLibraryConfig(options = {}) {
  const { esbuildOptions: userEsbuildOptions, ...rest } = options;

  return defineConfig({
    entry: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/*.d.ts'],
    format: ['esm'],
    // Private workspace libs resolve types from `src/`; DTS here OOMs in CI.
    // Published packages (e.g. extensions) pass `dts: true`.
    dts: false,
    bundle: false,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    tsconfig: 'tsconfig.json',
    esbuildOptions(esbuildOptions) {
      esbuildOptions.packages = 'external';
      esbuildOptions.loader = {
        ...esbuildOptions.loader,
        '.css': 'copy',
      };
      userEsbuildOptions?.(esbuildOptions);
    },
    ...rest,
  });
}
