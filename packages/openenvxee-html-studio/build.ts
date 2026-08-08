/**
 * Publish build for `@xmazu/openenvxee-html-studio`.
 *
 * - `index` / `runtime`: Rollup `preserveModules` ESM tree (Vite tree-shakes file-by-file)
 * - `sandbox-worker`: single self-contained Worker bundle co-located with workbench sandbox
 */
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
import * as esbuild from 'esbuild';
import { rollup, type Plugin } from 'rollup';

const studioRoot = import.meta.dirname;
const packagesRoot = path.resolve(studioRoot, '..');
const distRoot = path.join(studioRoot, 'dist');
const withSourcemap = process.env.STUDIO_SOURCEMAP === '1';

const WORKSPACE_PKG = /^(?:@openenvx\/|@xmazu\/openenvxee-)/;

/**
 * Force workspace packages onto TypeScript `src/` — published packages
 * (`schema`, `preview`, `protocol`) export `dist/` only, which would pull
 * prebuilt bundles (and their side-effect imports) into our tree.
 */
const WORKSPACE_ENTRIES: Record<string, string> = {
  '@openenvx/core': 'core/src/index.ts',
  '@openenvx/headless': 'headless/src/index.ts',
  '@openenvx/headless/react': 'headless/src/react/workbench-context.tsx',
  '@openenvx/html': 'html/src/index.ts',
  '@openenvx/html/runtime': 'html/src/runtime.ts',
  '@openenvx/html-studio': 'html-studio/src/index.ts',
  '@openenvx/workbench': 'workbench/src/index.ts',
  '@xmazu/openenvxee-schema': 'schema/src/index.ts',
  '@xmazu/openenvxee-preview': 'preview/src/index.ts',
  '@xmazu/openenvxee-extensions/protocol': 'extensions/src/protocol/index.ts',
};

function isExternalId(id: string): boolean {
  if (id.endsWith('.css')) {
    return true;
  }
  if (id.startsWith('\0')) {
    return false;
  }
  if (id.startsWith('.') || path.isAbsolute(id)) {
    return false;
  }
  if (WORKSPACE_PKG.test(id)) {
    return false;
  }
  return true;
}

function workspaceSrcResolve(): Plugin {
  return {
    name: 'workspace-src-resolve',
    resolveId(source) {
      const rel = WORKSPACE_ENTRIES[source];
      if (!rel) {
        return null;
      }
      const absolute = path.join(packagesRoot, rel);
      if (!existsSync(absolute)) {
        throw new Error(`Workspace entry missing: ${source} → ${absolute}`);
      }
      return absolute;
    },
  };
}

/** Transform TS/TSX with esbuild; leave CSS and node_modules alone. */
function esbuildTransform(): Plugin {
  return {
    name: 'esbuild-transform',
    async transform(code, id) {
      if (id.includes('node_modules') || !/\.[cm]?tsx?$/.test(id)) {
        return null;
      }
      const result = await esbuild.transform(code, {
        loader: id.endsWith('x') ? 'tsx' : 'ts',
        jsx: 'automatic',
        format: 'esm',
        target: 'es2022',
        sourcemap: withSourcemap,
        sourcefile: id,
      });
      return {
        code: result.code,
        map: result.map || null,
      };
    },
  };
}

async function buildPreserveModules(): Promise<void> {
  const bundle = await rollup({
    input: [
      path.join(studioRoot, 'src/index.ts'),
      path.join(studioRoot, 'src/runtime.ts'),
    ],
    external: isExternalId,
    plugins: [
      workspaceSrcResolve(),
      nodeResolve({
        extensions: ['.tsx', '.ts', '.mjs', '.js', '.json'],
        browser: true,
        preferBuiltins: false,
      }),
      esbuildTransform(),
    ],
    // Match package.json "sideEffects": ["**/*.css"] so barrel re-exports
    // don't hoist unused third-party side-effect imports (e.g. bare `import 'uqr'`).
    treeshake: {
      moduleSideEffects: (id) => id.endsWith('.css'),
      propertyReadSideEffects: false,
    },
    onwarn(warning, warn) {
      // CSS modules are left as bare imports for the consumer bundler.
      if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
        return;
      }
      warn(warning);
    },
  });

  await bundle.write({
    dir: distRoot,
    format: 'es',
    preserveModules: true,
    preserveModulesRoot: packagesRoot,
    sourcemap: withSourcemap,
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js',
    hoistTransitiveImports: false,
  });
  await bundle.close();
}

async function buildSandboxWorker(): Promise<void> {
  const outFile = path.join(
    distRoot,
    'workbench/src/sandbox/sandbox-worker.js'
  );
  await mkdir(path.dirname(outFile), { recursive: true });
  await esbuild.build({
    entryPoints: [
      path.join(packagesRoot, 'workbench/src/sandbox/quickjs.worker.ts'),
    ],
    outfile: outFile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    sourcemap: withSourcemap,
    // Keep the WASM/loader package as a runtime import (host installs it).
    external: ['quickjs-emscripten'],
  });
}

function assertNoVendoredNodeModules(): void {
  const leaked = path.join(distRoot, 'node_modules');
  if (existsSync(leaked)) {
    throw new Error(
      `dist/node_modules appeared — a third-party dep was not marked external (${leaked})`
    );
  }
}

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
await buildPreserveModules();
await buildSandboxWorker();
assertNoVendoredNodeModules();
