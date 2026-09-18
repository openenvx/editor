/**
 * Packs studio + canvas-driver like npm consumers, then runs Next and Vite production builds.
 * Strips `development` export conditions (same as the release publish step).
 */
import { spawn } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const packageRoot = import.meta.dirname;
const repoRoot = path.resolve(packageRoot, '../..');

function fail(message: string): never {
  console.error(`smoke-next-consumer: ${message}`);
  throw new Error(message);
}

function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} ${args.join(' ')} exited with code ${code ?? 1}`
          )
        );
      }
    });
  });
}

function stripDevelopment(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  if ('development' in value) {
    const { development: _development, ...rest } = value as Record<
      string,
      unknown
    >;
    return rest;
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = stripDevelopment(child);
  }
  return out;
}

function asPublishedPackageJson(pkg: Record<string, unknown>) {
  const next = { ...pkg };
  delete next.publishConfig;
  if (next.exports) {
    next.exports = stripDevelopment(next.exports);
  }
  return next;
}

async function packPackage(relPath: string) {
  const root = path.join(repoRoot, relPath);
  await runCommand('npm', ['pack', '--ignore-scripts'], root);
  const names = await readdir(root);
  const tgz = names
    .filter((name: string) => name.endsWith('.tgz'))
    .toSorted()
    .at(-1);
  if (!tgz) {
    fail(`pack failed for ${relPath}`);
  }
  const tgzPath = path.join(root, tgz);
  const dest = path.join(root, `.smoke-pack-${tgz}`);
  await copyFile(tgzPath, dest);
  await rm(tgzPath);
  return dest;
}

/** Stable hashed class from studio shell publish CSS (see dist/index.css). */
const STUDIO_SHELL_CSS_MARKER = 'e_FqDc5q_chrome';

function studioDistPath(workDir: string, file: string) {
  return path.join(
    workDir,
    'node_modules',
    '@openenvx',
    'studio',
    'dist',
    file
  );
}

async function assertStudioThemeTokens(workDir: string) {
  const theme = await readFile(studioDistPath(workDir, 'theme.css'), 'utf-8');
  if (!theme.includes('--wb-text-xs')) {
    fail('@openenvx/studio dist/theme.css is missing design tokens');
  }
}

async function assertStudioStylesBundle(workDir: string) {
  const styles = await readFile(studioDistPath(workDir, 'styles.css'), 'utf-8');
  if (!styles.includes('--wb-text-xs')) {
    fail('@openenvx/studio dist/styles.css is missing design tokens');
  }
  if (!styles.includes(STUDIO_SHELL_CSS_MARKER)) {
    fail(
      '@openenvx/studio dist/styles.css is missing compiled shell CSS modules'
    );
  }
}

async function assertNextBuildIncludesWorkbenchCss(workDir: string) {
  let hasTokens = false;
  let hasShellModules = false;

  async function walkCssFiles(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkCssFiles(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.css')) {
        continue;
      }
      const content = await readFile(fullPath, 'utf-8');
      if (content.includes('--wb-text-xs')) {
        hasTokens = true;
      }
      if (content.includes(STUDIO_SHELL_CSS_MARKER)) {
        hasShellModules = true;
      }
    }
  }

  await walkCssFiles(path.join(workDir, '.next'));
  if (!hasTokens) {
    fail('next build output has no studio design tokens in emitted CSS');
  }
  if (!hasShellModules) {
    fail(
      'next build output has no studio shell CSS modules — import @openenvx/studio/styles.css from the root layout'
    );
  }
}

async function assertNoRuntimeRequireStub(packageDir: string) {
  const distDir = path.join(packageDir, 'dist');
  const files = await readdir(distDir, { recursive: true });
  const jsFiles = files.filter(
    (name: string | Buffer): name is string =>
      typeof name === 'string' && name.endsWith('.js')
  );
  for (const rel of jsFiles) {
    const content = await readFile(path.join(distDir, rel), 'utf-8');
    if (content.includes(`doesn't expose the \`require\` function`)) {
      fail(`rolldown require stub in ${rel} (breaks Next/Turbopack)`);
    }
  }
}

async function assertNoBareImports(
  packageDir: string,
  dependencyNames: string[]
) {
  if (dependencyNames.length === 0) {
    return;
  }
  const distDir = path.join(packageDir, 'dist');
  const files = await readdir(distDir, { recursive: true });
  const jsFiles = files.filter(
    (name: string | Buffer): name is string =>
      typeof name === 'string' && name.endsWith('.js')
  );
  const pattern = new RegExp(
    dependencyNames
      .map(
        (id) =>
          `from\\s*["']${id.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/[^"']*)?["']`
      )
      .join('|')
  );
  for (const rel of jsFiles) {
    const filePath = path.join(distDir, rel);
    const content = await readFile(filePath, 'utf-8');
    const match = pattern.exec(content);
    if (match) {
      fail(`bare import of published dependency in ${rel}`);
    }
  }
}

async function patchInstalledPackages(workDir: string, names: string[]) {
  for (const name of names) {
    const pkgPath = path.join(workDir, 'node_modules', name, 'package.json');
    const raw = JSON.parse(await readFile(pkgPath, 'utf-8')) as Record<
      string,
      unknown
    >;
    await writeFile(
      pkgPath,
      `${JSON.stringify(asPublishedPackageJson(raw), null, 2)}\n`
    );
    const deps = Object.keys(
      (raw.dependencies as Record<string, string> | undefined) ?? {}
    );
    const packageDir = path.dirname(pkgPath);
    await assertNoBareImports(packageDir, deps);
    await assertNoRuntimeRequireStub(packageDir);
  }
}

const editorSmokeSource = `'use client';

import {
  createCanvasScene,
  defaultCanvasWorkbench,
} from '@openenvx/canvas-driver';
import { WorkbenchShell } from '@openenvx/studio';
import '@openenvx/canvas-driver/theme.css';
import '@openenvx/canvas-driver/fonts.css';
import '@openenvx/studio/theme.css';

export function EditorSmoke() {
  const initialScene = createCanvasScene();
  return (
    <WorkbenchShell
      createPropertyHostContext={
        defaultCanvasWorkbench.createPropertyHostContext
      }
      editorTitle="Smoke"
      editorUri="openenvx://smoke"
      initialScene={initialScene}
      layout={defaultCanvasWorkbench.layout}
      plugins={defaultCanvasWorkbench.plugins}
    />
  );
}
`;

await runCommand(
  'bun',
  ['run', 'build'],
  path.join(repoRoot, 'packages/canvas-driver')
);
await runCommand(
  'bun',
  ['run', 'build'],
  path.join(repoRoot, 'packages/studio')
);

const studioTgz = await packPackage('packages/studio');
const canvasTgz = await packPackage('packages/canvas-driver');

const workDir = await mkdtemp(path.join(tmpdir(), 'openenvx-consumer-smoke-'));

try {
  const baseDeps = {
    '@openenvx/canvas-driver': `file:${canvasTgz}`,
    '@openenvx/studio': `file:${studioTgz}`,
    react: '19.2.7',
    'react-dom': '19.2.7',
  };

  await writeFile(
    path.join(workDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'openenvx-consumer-smoke',
        private: true,
        type: 'module',
        scripts: {
          'build:next': 'next build',
          'build:vite': 'vite build',
        },
        dependencies: {
          ...baseDeps,
          next: '15.5.4',
        },
        devDependencies: {
          '@types/node': '22.10.5',
          '@types/react': '19.2.3',
          '@vitejs/plugin-react': '4.7.0',
          typescript: '5.9.2',
          vite: '6.3.5',
        },
      },
      null,
      2
    )}\n`
  );

  await writeFile(
    path.join(workDir, 'next.config.mjs'),
    `/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
`
  );

  await writeFile(
    path.join(workDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
        exclude: ['node_modules'],
      },
      null,
      2
    )}\n`
  );

  await mkdir(path.join(workDir, 'app'), { recursive: true });
  await writeFile(
    path.join(workDir, 'app/layout.tsx'),
    `import './openenvx-styles.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
  );
  await writeFile(
    path.join(workDir, 'app/page.tsx'),
    `import { EditorSmoke } from './editor-smoke';

export default function Page() {
  return <EditorSmoke />;
}
`
  );
  await writeFile(
    path.join(workDir, 'app/editor-smoke.tsx'),
    editorSmokeSource
  );
  await writeFile(
    path.join(workDir, 'app/openenvx-styles.css'),
    `@import '@openenvx/studio/styles.css';
@import '@openenvx/canvas-driver/theme.css';
@import '@openenvx/canvas-driver/fonts.css';
`
  );

  await writeFile(
    path.join(workDir, 'vite.config.ts'),
    `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
});
`
  );
  await writeFile(
    path.join(workDir, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>smoke</title></head>
  <body><div id="root"></div><script type="module" src="/main.tsx"></script></body>
</html>
`
  );
  await writeFile(
    path.join(workDir, 'main.tsx'),
    `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorSmoke } from './app/editor-smoke';

createRoot(document.querySelector('#root')!).render(
  <StrictMode><EditorSmoke /></StrictMode>
);
`
  );

  await runCommand('bun', ['install', '--linker=isolated'], workDir);
  await patchInstalledPackages(workDir, [
    '@openenvx/studio',
    '@openenvx/canvas-driver',
  ]);
  await assertStudioThemeTokens(workDir);
  await assertStudioStylesBundle(workDir);

  await runCommand('bun', ['run', 'build:next'], workDir);
  await assertNextBuildIncludesWorkbenchCss(workDir);
  const buildId = await readFile(
    path.join(workDir, '.next', 'BUILD_ID'),
    'utf-8'
  );
  if (!buildId.trim()) {
    fail('next build did not produce BUILD_ID');
  }

  await runCommand('bun', ['run', 'build:vite'], workDir);
  await readFile(path.join(workDir, 'dist', 'index.html'), 'utf-8');

  console.log(
    'consumer smoke ok (next build + vite build, no transpilePackages)'
  );
} finally {
  await rm(workDir, { recursive: true, force: true });
  await rm(studioTgz, { force: true });
  await rm(canvasTgz, { force: true });
}
