import { globSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'rolldown';

import { createCssModuleRolldownPlugin } from './css-modules-plugin.ts';

const packageRoot = import.meta.dirname;
const { plugin: cssModulesPlugin } = createCssModuleRolldownPlugin({
  packageRoot,
  withSourcemap: false,
});

function transpileEntries(
  patterns: string[],
  exclude: string[],
  stripPrefix: string
): Record<string, string> {
  const files = globSync(patterns, { cwd: packageRoot, exclude });
  const input: Record<string, string> = {};
  for (const file of files) {
    const key = file.replace(/\.tsx?$/, '').replace(stripPrefix, '');
    input[key] = file;
  }
  return input;
}

const nodeModulesExternal = (id: string) =>
  !id.startsWith('.') && !id.startsWith('/') && !path.isAbsolute(id);

const libraryOutput = (dir: string, preserveModulesRoot: string) => ({
  dir,
  format: 'esm' as const,
  preserveModules: true,
  preserveModulesRoot,
  entryFileNames: '[name].js',
});

export default defineConfig([
  {
    input: transpileEntries(
      ['src/**/*.{ts,tsx}'],
      [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
        'src/host/**',
        'src/canvas-widget/**',
        'src/cli/**',
        'src/openenvx-ambient.ts',
        'src/vite/**',
      ],
      /^src\//
    ),
    external: nodeModulesExternal,
    tsconfig: 'tsconfig.json',
    plugins: [cssModulesPlugin],
    output: libraryOutput('dist', 'src'),
  },
  {
    input: transpileEntries(
      ['src/host/**/*.{ts,tsx}'],
      ['**/*.test.ts', '**/*.test.tsx'],
      /^src\/host\//
    ),
    external: nodeModulesExternal,
    tsconfig: 'tsconfig.host.json',
    plugins: [cssModulesPlugin],
    output: libraryOutput('dist/host', 'src/host'),
  },
  {
    input: transpileEntries(
      ['src/canvas-widget/**/*.{ts,tsx}'],
      ['**/*.test.ts', '**/*.test.tsx'],
      /^src\/canvas-widget\//
    ),
    external: nodeModulesExternal,
    tsconfig: 'tsconfig.canvas-widget.json',
    plugins: [cssModulesPlugin],
    output: libraryOutput('dist/canvas-widget', 'src/canvas-widget'),
  },
]);
