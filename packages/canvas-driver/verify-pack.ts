import { bareImportPattern } from '@openenvx/typescript-config/publish-externals';
import {
  createVerifyPack,
  fail,
} from '@openenvx/typescript-config/verify-pack';

const packageRoot = import.meta.dirname;
const LEAKED_TYPE =
  /CanvasRect|LAYER_WRITE_MODES|WorkbenchShell|createCanvasDemoScene|TemplatePolicy|PluginLayer|Konva/;
const CANVAS_BARE_IMPORTS = bareImportPattern([
  'zod',
  'konva',
  'react-konva',
  '@dnd-kit/core',
  '@tiptap/react',
  'lucide-react',
]);
const INTERNAL_PATH = /package\/dist\/(workbench|runtime|sandbox-host)\./;

await createVerifyPack({
  packageRoot,
  packageLabel: 'canvas',
  forbidTarballPatterns: [INTERNAL_PATH],
  requiredTarballPaths: [
    'package/dist/index.js',
    'package/dist/index.d.ts',
    'package/dist/theme.css',
    'package/dist/fonts.css',
  ],
  distChecks: [
    {
      file: 'index.js',
      assert: (content) =>
        content.startsWith('"use client"') &&
        content.includes('theme.css') &&
        content.includes('fonts.css'),
      message:
        'dist/index.js must start with "use client" and import theme.css + fonts.css',
    },
    {
      file: 'index.js',
      mustNotMatch: CANVAS_BARE_IMPORTS,
      message: 'dist/index.js must bundle driver dependencies',
    },
    {
      file: 'index.js',
      assert: (content) => !content.includes('.module.css'),
      message: 'dist/index.js still imports CSS modules',
    },
    {
      file: 'theme.css',
      assert: (content) =>
        content.includes('.root') || content.includes('openenvx'),
      message: 'dist/theme.css missing compiled styles',
    },
    {
      file: 'fonts.css',
      assert: (content) => content.trim().length > 0,
      message: 'dist/fonts.css is empty',
    },
    {
      file: 'index.d.ts',
      maxLines: 90,
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
        'defaultCanvasWorkbench',
        'createCanvasScene',
        'exportCanvasDocument',
        'downloadBytes',
      ],
    },
  ],
  afterPack({ pkg }) {
    const exports = (pkg.publishConfig?.exports ?? pkg.exports) as
      | Record<string, unknown>
      | undefined;
    const keys = Object.keys(exports ?? {});
    if (keys.length !== 3 || !exports?.['.'] || !exports?.['./theme.css']) {
      fail(
        `expected ., ./theme.css, ./fonts.css exports; got ${keys.join(', ')}`
      );
    }
    if (
      exports?.['./workbench'] ||
      exports?.['./runtime'] ||
      exports?.['./studio']
    ) {
      fail('must not publish ./workbench, ./runtime, or ./studio');
    }
    const peers = pkg.peerDependencies as Record<string, string> | undefined;
    if (!peers?.['@openenvx/studio']) {
      fail('missing @openenvx/studio peer');
    }
    if (peers?.['@openenvx/studio/core']) {
      fail('must not peer @openenvx/studio/core (use @openenvx/studio)');
    }
  },
}).run();
