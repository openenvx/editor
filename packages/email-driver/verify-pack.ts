import { createVerifyPack } from '@openenvx/typescript-config/verify-pack';

const packageRoot = import.meta.dirname;
const LEAKED_TYPE =
  /CanvasRect|LAYER_WRITE_MODES|WorkbenchShell|createEmailDemoScene|TemplatePolicy|PluginLayer/;
const INTERNAL_PATH = /package\/dist\/(workbench|html|theme)\//;

await createVerifyPack({
  packageRoot,
  packageLabel: 'email',
  forbidTarballPatterns: [INTERNAL_PATH],
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
      file: 'studio.css',
      assert: (content) =>
        content.includes('ProseMirror') && content.includes('cm-editor'),
      message: 'dist/studio.css missing compiled editor styles',
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
}).run();
