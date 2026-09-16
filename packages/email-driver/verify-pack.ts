import {
  createVerifyPack,
  fail,
} from '@openenvx/typescript-config/verify-pack';

const packageRoot = import.meta.dirname;
const LEAKED_TYPE =
  /CanvasRect|LAYER_WRITE_MODES|WorkbenchShell|createEmailDemoScene|TemplatePolicy|PluginLayer/;
const INTERNAL_PATH = /package\/dist\/(workbench|runtime)\./;

await createVerifyPack({
  packageRoot,
  packageLabel: 'email',
  forbidTarballPatterns: [INTERNAL_PATH],
  requiredTarballPaths: [
    'package/dist/index.js',
    'package/dist/index.d.ts',
    'package/dist/theme.css',
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
        content.includes('ProseMirror') && content.includes('cm-editor'),
      message: 'dist/theme.css missing compiled editor styles',
    },
    {
      file: 'index.d.ts',
      maxLines: 80,
      message: 'public .d.ts is too large',
    },
    {
      file: 'index.d.ts',
      mustNotMatch: LEAKED_TYPE,
      message: 'public .d.ts leaks internal types',
    },
    {
      file: 'index.d.ts',
      includes: [
        'defaultEmailWorkbench',
        'createEmailScene',
        'renderEmailHtml',
      ],
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
    if (exports?.['./workbench'] || exports?.['./studio']) {
      fail('must not publish ./workbench or ./studio');
    }
  },
}).run();
