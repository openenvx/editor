import {
  createVerifyPack,
  fail,
} from '@openenvx/typescript-config/verify-pack';

const packageRoot = import.meta.dirname;
const LEAKED_TYPE =
  /CanvasRect|LAYER_WRITE_MODES|WorkbenchShell|createCanvasDemoScene|TemplatePolicy|PluginLayer|Konva/;
const INTERNAL_PATH = /package\/dist\/(workbench|theme)\//;

await createVerifyPack({
  packageRoot,
  packageLabel: 'canvas',
  forbidTarballPatterns: [INTERNAL_PATH],
  requiredTarballPaths: [
    'package/dist/studio.js',
    'package/dist/runtime.js',
    'package/dist/studio.css',
    'package/dist/fonts.css',
    'package/dist/studio.d.ts',
    'package/dist/runtime.d.ts',
  ],
  distChecks: [
    {
      file: 'studio.js',
      assert: (content) =>
        content.startsWith('"use client"') && content.includes('studio.css'),
      message:
        'dist/studio.js must start with "use client" and import studio.css',
    },
    {
      file: 'studio.js',
      maxLines: 500,
      message: 'dist/studio.js does not look minified',
    },
    {
      file: 'runtime.js',
      maxLines: 200,
      message: 'dist/runtime.js does not look minified',
    },
    {
      file: 'studio.js',
      assert: (content) => !content.includes('.module.css'),
      message: 'dist/studio.js still imports CSS modules',
    },
    {
      file: 'studio.css',
      assert: (content) =>
        content.includes('.root') || content.includes('openenvx'),
      message: 'dist/studio.css missing compiled styles',
    },
    {
      file: 'fonts.css',
      assert: (content) => content.trim().length > 0,
      message: 'dist/fonts.css is empty',
    },
    {
      file: 'studio.d.ts',
      maxLines: 80,
      message: 'public .d.ts is too large',
    },
    {
      file: 'runtime.d.ts',
      maxLines: 40,
      message: 'public .d.ts is too large',
    },
    {
      file: 'studio.d.ts',
      mustNotMatch: LEAKED_TYPE,
      message: 'public .d.ts leaks internal types',
    },
    {
      file: 'runtime.d.ts',
      mustNotMatch: LEAKED_TYPE,
      message: 'public .d.ts leaks internal types',
    },
  ],
  afterPack({ pkg }) {
    const exports = pkg.exports as Record<string, unknown> | undefined;
    if (!exports?.['./studio']) {
      fail('missing ./studio export');
    }
    const peers = pkg.peerDependencies as Record<string, string> | undefined;
    if (!peers?.['@openenvx/studio/core']) {
      fail('missing @openenvx/studio/core peer');
    }
    if (!peers?.['@openenvx/studio']) {
      fail('missing @openenvx/studio peer');
    }
  },
}).run();
