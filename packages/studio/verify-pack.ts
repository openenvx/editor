import { bareImportPattern } from '@openenvx/typescript-config/publish-externals';
import {
  assertDistExport,
  createVerifyPack,
  fail,
  readDist,
} from '@openenvx/typescript-config/verify-pack';
import { $ } from 'bun';

const packageRoot = import.meta.dirname;
const INTERNAL_PATH = /package\/dist\/(workbench|theme)\//;
const LEAKED_CORE_TREE =
  /package\/dist\/core\/(layers|properties|builders|scene|workbench)\//;
const STUDIO_BARE_IMPORTS = bareImportPattern([
  'zod',
  'uqr',
  '@dnd-kit/core',
  '@dnd-kit/sortable',
  '@dnd-kit/utilities',
]);

const REQUIRED_CORE_EXPORTS = [
  'Plugin',
  'EditorRuntime',
  'WorkbenchController',
  'WorkbenchPlugin',
  'Command',
];

await createVerifyPack({
  packageRoot,
  packageLabel: 'studio',
  forbidSourcemaps: true,
  forbidTarballPatterns: [INTERNAL_PATH, LEAKED_CORE_TREE],
  requiredTarballPaths: [
    'package/dist/index.js',
    'package/dist/index.css',
    'package/dist/index.d.ts',
    'package/dist/core/index.js',
    'package/dist/core/index.d.ts',
    'package/dist/core/schema/index.js',
    'package/dist/core/schema/index.d.ts',
    'package/dist/core/preview/index.js',
    'package/dist/core/react/workbench-context.js',
    'package/scene.schema.json',
  ],
  distChecks: [
    {
      file: 'index.js',
      assert: (content) =>
        content.startsWith('"use client"') && content.includes('index.css'),
      message:
        'dist/index.js must start with "use client" and import index.css',
    },
    {
      file: 'index.js',
      mustNotMatch: STUDIO_BARE_IMPORTS,
      message: 'dist/index.js must not leave bare third-party imports',
    },
    {
      file: 'core/index.js',
      mustNotMatch: STUDIO_BARE_IMPORTS,
      message: 'dist/core/index.js must not leave bare third-party imports',
    },
    {
      file: 'core/schema/index.js',
      mustNotMatch: bareImportPattern(['zod']),
      message: 'dist/core/schema/index.js must bundle zod',
    },
    {
      file: 'core/preview/index.js',
      mustNotMatch: bareImportPattern(['zod', 'uqr']),
      message: 'dist/core/preview/index.js must bundle preview deps',
    },
    {
      file: 'index.js',
      assert: (content) => !content.includes('.module.css'),
      message:
        'dist/index.js still imports CSS modules - they must be compiled',
    },
    {
      file: 'index.css',
      assert: (content) =>
        content.includes('.root') ||
        content.includes('_root') ||
        content.includes('--wb-') ||
        content.includes('openenvx'),
      message: 'dist/index.css missing compiled workbench tokens',
    },
    {
      file: 'index.css',
      assert: (content) => !content.includes(':global('),
      message: 'dist/index.css still contains :global()',
    },
    {
      file: 'index.d.ts',
      includes: ['WorkbenchShell', 'WorkbenchShellProps'],
    },
  ],
  async beforePack() {
    const coreDts = await readDist(`${packageRoot}/dist`, 'core/index.d.ts');
    const schemaDts = await readDist(
      `${packageRoot}/dist`,
      'core/schema/index.d.ts'
    );
    for (const name of REQUIRED_CORE_EXPORTS) {
      if (!coreDts.includes(name)) {
        fail(`dist/core/index.d.ts missing required export: ${name}`);
      }
    }
    if (!schemaDts.includes('Scene')) {
      fail('dist/core/schema/index.d.ts missing Scene');
    }
  },
  async afterPack({ pkg }) {
    assertDistExport(pkg as Parameters<typeof assertDistExport>[0]);
    const exports = pkg.exports as Record<string, unknown> | undefined;
    if (!exports?.['./theme.css']) {
      fail('missing ./theme.css export');
    }
    if (!exports?.['./core']) {
      fail('missing ./core export');
    }
    if (!(pkg.files as string[] | undefined)?.includes('dist')) {
      fail('files must include dist');
    }
    const peers = pkg.peerDependencies as Record<string, string> | undefined;
    if (peers?.['@openenvx/studio/core']) {
      fail('must not peer @openenvx/studio/core');
    }
    const deps = (pkg.dependencies as Record<string, string> | undefined) ?? {};
    const bad = Object.entries(deps).filter(
      ([key, value]) =>
        key.startsWith('@openenvx/') ||
        value.startsWith('workspace:') ||
        value.startsWith('catalog:')
    );
    if (bad.length > 0) {
      fail(`bad runtime deps: ${JSON.stringify(Object.fromEntries(bad))}`);
    }

    await $`bun run ./verify-next-consumer.ts`.cwd(packageRoot);
  },
}).run();
