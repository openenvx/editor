import {
  createVerifyPack,
  fail,
} from '@openenvx/typescript-config/verify-pack';

const packageRoot = import.meta.dirname;
const INTERNAL_PATH = /package\/dist\/(workbench|runtime)\./;

await createVerifyPack({
  packageRoot,
  packageLabel: 'html',
  forbidTarballPatterns: [INTERNAL_PATH],
  requiredTarballPaths: [
    'package/dist/index.js',
    'package/dist/index.d.ts',
    'package/dist/theme.css',
    'package/dist/sandbox-worker.js',
  ],
  distChecks: [
    {
      file: 'index.js',
      assert: (content) =>
        content.startsWith('"use client"') && content.includes('theme.css'),
      message:
        'dist/index.js must start with "use client" and import theme.css',
    },
    {
      file: 'index.js',
      maxLines: 600,
      message: 'dist/index.js does not look minified',
    },
    {
      file: 'theme.css',
      assert: (content) =>
        content.includes('ProseMirror') && !content.includes(':global('),
      message: 'dist/theme.css missing compiled editor styles',
    },
    {
      file: 'sandbox-worker.js',
      assert: (content) => content.trim().length > 0,
      message: 'dist/sandbox-worker.js is empty',
    },
    {
      file: 'index.d.ts',
      includes: ['defaultHtmlWorkbench', 'createHtmlScene'],
    },
  ],
  afterPack({ pkg }) {
    const exports = (pkg.publishConfig?.exports ?? pkg.exports) as
      | Record<string, unknown>
      | undefined;
    const keys = Object.keys(exports ?? {});
    if (keys.length !== 2 || !exports?.['.'] || !exports?.['./theme.css']) {
      fail(`expected . and ./theme.css exports; got ${keys.join(', ')}`);
    }
  },
}).run();
