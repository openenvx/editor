import {
  assertDistExport,
  createVerifyPack,
  fail,
} from '@openenvx/typescript-config/verify-pack';

const packageRoot = import.meta.dirname;
const INTERNAL_PATH = /package\/dist\/(workbench|theme)\//;

await createVerifyPack({
  packageRoot,
  packageLabel: 'studio',
  forbidSourcemaps: true,
  forbidTarballPatterns: [INTERNAL_PATH],
  requiredTarballPaths: [
    'package/dist/index.js',
    'package/dist/index.css',
    'package/dist/index.d.ts',
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
      maxLines: 500,
      message: 'dist/index.js does not look minified (too many lines)',
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
      includes: [
        'WorkbenchShell',
        'WorkbenchShellProps',
        'registerDefaultWorkbenchBundle',
        'SandboxExtensionHost',
        'mountSandboxExtensions',
      ],
    },
  ],
  afterPack({ pkg }) {
    assertDistExport(pkg as Parameters<typeof assertDistExport>[0]);
    const exports = pkg.exports as Record<string, unknown> | undefined;
    if (!exports?.['./theme.css']) {
      fail('missing ./theme.css export');
    }
    if (!(pkg.files as string[] | undefined)?.includes('dist')) {
      fail('files must include dist');
    }
    const peers = pkg.peerDependencies as Record<string, string> | undefined;
    if (!peers?.['@openenvx/core']) {
      fail('missing @openenvx/core peer dependency');
    }
    const deps = (pkg.dependencies as Record<string, string> | undefined) ?? {};
    const bad = Object.entries(deps).filter(
      ([key, value]) =>
        (key.startsWith('@openenvx/') && key !== '@openenvx/editor-sandbox') ||
        value.startsWith('workspace:') ||
        value.startsWith('catalog:')
    );
    if (bad.length > 0) {
      fail(`bad runtime deps: ${JSON.stringify(Object.fromEntries(bad))}`);
    }
  },
}).run();
