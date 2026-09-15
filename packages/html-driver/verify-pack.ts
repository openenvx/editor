import { createVerifyPack } from '@openenvx/typescript-config/verify-pack';

const packageRoot = import.meta.dirname;
const INTERNAL_PATH = /package\/dist\/(workbench|theme)\//;

await createVerifyPack({
  packageRoot,
  packageLabel: 'html',
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
        content.includes('ProseMirror') && !content.includes(':global('),
      message: 'dist/studio.css missing compiled editor styles',
    },
    {
      file: 'sandbox-worker.js',
      assert: (content) => content.trim().length > 0,
      message: 'dist/sandbox-worker.js is empty',
    },
    {
      file: 'studio.d.ts',
      includes: [
        'HtmlEditor',
        'DEFAULT_HTML_STUDIO_PLUGINS',
        'createHtmlSandboxExtensionHost',
      ],
    },
    {
      file: 'runtime.d.ts',
      includes: [
        'renderBlockDocument',
        'BlockRegistry',
        'builtinBlocks',
        'createHtmlScene',
      ],
    },
  ],
}).run();
