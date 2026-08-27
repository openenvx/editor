import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';

import { $ } from 'bun';

const canvasStudioRoot = import.meta.dirname;
const distRoot = path.join(canvasStudioRoot, 'dist');

const LEAKED_TYPE =
  /CanvasRect|LAYER_WRITE_MODES|WorkbenchShell|createCanvasDemoScene|TemplatePolicy|PluginLayer|Konva/;
const INTERNAL_PATH = /package\/dist\/(workbench|canvas|theme)\//;

function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const indexJs = await readFile(path.join(distRoot, 'index.js'), 'utf-8');
const runtimeJs = await readFile(path.join(distRoot, 'runtime.js'), 'utf-8');
const indexCss = await readFile(path.join(distRoot, 'index.css'), 'utf-8');
const fontsCss = await readFile(path.join(distRoot, 'fonts.css'), 'utf-8');
const indexDts = await readFile(path.join(distRoot, 'index.d.ts'), 'utf-8');
const runtimeDts = await readFile(path.join(distRoot, 'runtime.d.ts'), 'utf-8');

if (!indexJs.startsWith('"use client"') || !indexJs.includes('index.css')) {
  fail('dist/index.js must start with "use client" and import index.css');
}
if (indexJs.split('\n').length > 500) {
  fail('dist/index.js does not look minified (too many lines)');
}
if (runtimeJs.split('\n').length > 200) {
  fail('dist/runtime.js does not look minified (too many lines)');
}
if (indexJs.includes('.module.css')) {
  fail('dist/index.js still imports CSS modules — they must be compiled');
}
if (!indexCss.includes('.root') && !indexCss.includes('openenvx')) {
  fail('dist/index.css missing compiled workbench tokens');
}
if (indexCss.includes(':global(')) {
  fail(
    'dist/index.css still contains :global() — CSS modules must be compiled'
  );
}
if (fontsCss.trim().length === 0) {
  fail('dist/fonts.css is empty');
}
if (indexDts.split('\n').length > 80 || runtimeDts.split('\n').length > 40) {
  fail('public .d.ts is too large — do not inline the internal schema');
}
if (LEAKED_TYPE.test(indexDts) || LEAKED_TYPE.test(runtimeDts)) {
  fail('public .d.ts leaks internal types');
}

await $`bun pm pack --ignore-scripts`.cwd(canvasStudioRoot);
const packed = await readdir(canvasStudioRoot);
const tgz = packed
  .filter((name) => name.endsWith('.tgz'))
  .toSorted()
  .at(-1);
if (!tgz) {
  fail('bun pm pack did not produce a tarball');
}

const tgzPath = path.join(canvasStudioRoot, tgz);
const listing = await $`tar -tzf ${tgzPath}`.text();
const pkgJson = await $`tar -xOf ${tgzPath} package/package.json`.text();
await rm(tgzPath);

if (listing.split('\n').some((line) => line.endsWith('.map'))) {
  fail('release tarball must not include sourcemaps');
}
if (INTERNAL_PATH.test(listing)) {
  fail('release tarball must not include workbench/canvas CSS trees');
}
for (const required of [
  'package/dist/index.js',
  'package/dist/runtime.js',
  'package/dist/index.css',
  'package/dist/fonts.css',
  'package/dist/index.d.ts',
  'package/dist/runtime.d.ts',
]) {
  if (!listing.includes(required)) {
    fail(`missing ${required}`);
  }
}

const pkg = JSON.parse(pkgJson) as {
  exports?: Record<string, { default?: string } | string>;
  files?: string[];
  dependencies?: Record<string, string>;
};

const exp = pkg.exports?.['.'];
const def = typeof exp === 'string' ? exp : exp?.default;
if (!def?.includes('dist/')) {
  fail(`published export must point at dist, got: ${JSON.stringify(exp)}`);
}
if (!pkg.exports?.['./theme.css']) {
  fail('missing ./theme.css export');
}
if (!pkg.exports?.['./fonts.css']) {
  fail('missing ./fonts.css export');
}
if (!pkg.exports?.['./runtime']) {
  fail('missing ./runtime export');
}
if (!pkg.files?.includes('dist')) {
  fail('files must include dist');
}
const deps = pkg.dependencies ?? {};
const bad = Object.entries(deps).filter(
  ([key, value]) =>
    (key.startsWith('@openenvx/') && key !== '@openenvx/canvas-studio') ||
    value.startsWith('workspace:') ||
    value.startsWith('catalog:')
);
if (bad.length > 0) {
  fail(`bad runtime deps: ${JSON.stringify(Object.fromEntries(bad))}`);
}

console.log(`canvas-studio pack ok (${tgz}), default export: ${def}`);
