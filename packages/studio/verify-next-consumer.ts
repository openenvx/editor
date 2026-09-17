import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { mergePublishPackageJson } from '@openenvx/typescript-config/publish-externals';
import { fail } from '@openenvx/typescript-config/verify-pack';
import { $ } from 'bun';

const packageRoot = import.meta.dirname;
const repoRoot = path.resolve(packageRoot, '../..');

async function packPackage(relPath: string) {
  const root = path.join(repoRoot, relPath);
  await $`bun pm pack --ignore-scripts`.cwd(root);
  const names = await Array.fromAsync(
    new Bun.Glob('*.tgz').scan({ cwd: root })
  );
  const tgz = names.toSorted().at(-1);
  if (!tgz) {
    fail(`pack failed for ${relPath}`);
  }
  const tgzPath = path.join(root, tgz);
  const dest = path.join(root, `.verify-pack-${tgz}`);
  await Bun.write(dest, Bun.file(tgzPath));
  await rm(tgzPath);
  return dest;
}

await $`bun run build`.cwd(path.join(repoRoot, 'packages/canvas-driver'));
await $`bun run build`.cwd(path.join(repoRoot, 'packages/studio'));

const studioTgz = await packPackage('packages/studio');
const canvasTgz = await packPackage('packages/canvas-driver');

const workDir = await mkdtemp(path.join(tmpdir(), 'openenvx-next-consumer-'));

try {
  const pkg = {
    name: 'openenvx-next-consumer-smoke',
    private: true,
    type: 'module',
    scripts: {
      build: 'next build',
    },
    dependencies: {
      '@openenvx/canvas-driver': `file:${canvasTgz}`,
      '@openenvx/studio': `file:${studioTgz}`,
      next: '15.5.4',
      react: '19.2.7',
      'react-dom': '19.2.7',
    },
    devDependencies: {
      '@types/node': '22.10.5',
      '@types/react': '19.2.3',
      typescript: '5.9.2',
    },
  };

  await writeFile(
    path.join(workDir, 'package.json'),
    `${JSON.stringify(pkg, null, 2)}\n`
  );

  await writeFile(
    path.join(workDir, 'next.config.mjs'),
    `/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@openenvx/studio', '@openenvx/canvas-driver'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
`
  );

  await writeFile(
    path.join(workDir, 'tsconfig.json'),
    JSON.stringify(
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
          paths: { '@/*': ['./*'] },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
        exclude: ['node_modules'],
      },
      null,
      2
    )
  );

  await mkdir(path.join(workDir, 'app'), { recursive: true });

  await writeFile(
    path.join(workDir, 'app/layout.tsx'),
    `export default function RootLayout({
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
    `'use client';

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
`
  );

  await $`bun install --linker=isolated`.cwd(workDir);

  for (const name of ['@openenvx/studio', '@openenvx/canvas-driver']) {
    const pkgPath = path.join(workDir, 'node_modules', name, 'package.json');
    const raw = JSON.parse(await readFile(pkgPath, 'utf-8')) as Record<
      string,
      unknown
    >;
    await writeFile(
      pkgPath,
      `${JSON.stringify(mergePublishPackageJson(raw), null, 2)}\n`
    );
  }

  await $`bun run build`.cwd(workDir);

  const nextDir = path.join(workDir, '.next');
  const buildId = await readFile(path.join(nextDir, 'BUILD_ID'), 'utf-8');
  if (!buildId.trim()) {
    fail('next build did not produce BUILD_ID');
  }

  console.log('next consumer smoke ok');
} finally {
  await rm(workDir, { recursive: true, force: true });
  await rm(studioTgz, { force: true });
  await rm(canvasTgz, { force: true });
}
